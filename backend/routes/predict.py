from flask import Blueprint, request, jsonify, current_app
from database import get_collection
from routes.auth import token_required
from preprocessing import apply_preprocessing_pipeline
from classifier import classifier
from config import Config
import os
import uuid
import datetime

predict_bp = Blueprint('predict', __name__)
predictions_col = get_collection('predictions')
progress_col = get_collection('progress')

@predict_bp.route('/upload', methods=['POST'])
@token_required
def upload_single_image(current_user):
    if 'image' not in request.files:
        return jsonify({'message': 'No image file uploaded.'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'message': 'Empty filename uploaded.'}), 400

    patient_name = request.form.get('patientName', current_user['name'])
    age = request.form.get('age', 'N/A')
    gender = request.form.get('gender', 'N/A')

    # Save original image
    unique_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or '.jpg'
    filename = f"{unique_id}_original{ext}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        # 1. Run Preprocessing Pipeline
        preprocessed_steps = apply_preprocessing_pipeline(filepath, unique_id)
        
        # Target processed image is the 8th step (Normalized color) or 10th (Segmented)
        # We will use the normalized image at index 7 ('8_color_normalization') for the model
        normalized_filename = f"{unique_id}_8_color_normalization.jpg"
        normalized_path = os.path.join(Config.PREPROCESSED_FOLDER, normalized_filename)
        
        if not os.path.exists(normalized_path):
            normalized_path = filepath # Fallback if error

        # 2. Run CNN classification model & Grad-CAM
        model_output = classifier.predict(normalized_path)
        
        # Save prediction record
        pred_record = {
            'user_id': current_user['_id'],
            'patient_name': patient_name,
            'age': age,
            'gender': gender,
            'date': datetime.datetime.now().isoformat(),
            'original_url': f"/static/uploads/{filename}",
            'preprocessed_steps': preprocessed_steps,
            'prediction': model_output['prediction'],
            'confidence': model_output['confidence'],
            'severity': model_output['severity'],
            'metrics': model_output['metrics'],
            'all_predictions': model_output['all_predictions'],
            'heatmap_url': model_output['heatmap_url'],
            'dataset_matches': model_output['dataset_matches']
        }
        
        inserted = predictions_col.insert_one(pred_record)
        pred_record['id'] = inserted['_id']
        # Remove mongo _id object from JSON output
        if '_id' in pred_record: del pred_record['_id']

        return jsonify({
            'message': 'Analysis complete.',
            'data': pred_record
        }), 200

    except Exception as e:
        print(f"[Error] Prediction Pipeline error: {e}")
        return jsonify({'message': f'Analysis failed: {str(e)}'}), 500

@predict_bp.route('/compare-multiple', methods=['POST'])
@token_required
def compare_multiple_images(current_user):
    uploaded_files = request.files.getlist('images')
    if not uploaded_files or len(uploaded_files) == 0:
        return jsonify({'message': 'No images uploaded.'}), 400
        
    if len(uploaded_files) > 10:
        return jsonify({'message': 'Maximum limit is 10 images.'}), 400

    results = []
    for idx, file in enumerate(uploaded_files):
        if file.filename == '': continue
        
        # Save temporary
        unique_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] or '.jpg'
        filename = f"{unique_id}_compare_{idx}{ext}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(filepath)

        try:
            # Predict
            model_output = classifier.predict(filepath)
            results.append({
                'index': idx,
                'filename': file.filename,
                'original_url': f"/static/uploads/{filename}",
                'prediction': model_output['prediction'],
                'confidence': model_output['confidence'],
                'severity': model_output['severity'],
                'heatmap_url': model_output['heatmap_url'],
                'dataset_matches': model_output['dataset_matches'][:2] # limit top matches for tables
            })
        except Exception as e:
            print(f"[Error] Multi-prediction image {idx} failed: {e}")
            results.append({
                'index': idx,
                'filename': file.filename,
                'error': f'Failed analysis: {str(e)}'
            })

    return jsonify({
        'message': f'Compared {len(results)} images successfully.',
        'comparisons': results
    }), 200

@predict_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    scans = predictions_col.find({'user_id': current_user['_id']})
    # Clean output IDs
    cleaned_scans = []
    for s in scans:
        s['id'] = s['_id']
        if '_id' in s: del s['_id']
        cleaned_scans.append(s)
        
    # Sort from newest to oldest
    cleaned_scans = sorted(cleaned_scans, key=lambda x: x['date'], reverse=True)
    return jsonify({'scans': cleaned_scans}), 200

@predict_bp.route('/details/<pred_id>', methods=['GET'])
@token_required
def get_prediction_detail(current_user, pred_id):
    scan = predictions_col.find_one({'_id': pred_id, 'user_id': current_user['_id']})
    if not scan:
        return jsonify({'message': 'Scan report not found.'}), 404
        
    scan['id'] = scan['_id']
    if '_id' in scan: del scan['_id']
    return jsonify({'scan': scan}), 200

@predict_bp.route('/progress', methods=['POST'])
@token_required
def add_progress_entry(current_user):
    data = request.form
    body_part = data.get('bodyPart', 'General Lesion').strip()
    notes = data.get('notes', '').strip()
    
    if 'image' not in request.files:
        return jsonify({'message': 'Lesion image is required for tracking.'}), 400
        
    file = request.files['image']
    unique_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or '.jpg'
    filename = f"{unique_id}_progress_{ext}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        # Infer disease and severity
        model_output = classifier.predict(filepath)
        
        # Improvement Index calculation
        # Let's mock a decreasing severity score based on historical data if any exists.
        # Higher confidence in health indicators or lower severity represents improvement.
        prev_entries = progress_col.find({'user_id': current_user['_id'], 'body_part': body_part})
        entry_number = len(prev_entries) + 1
        
        # Improvement index scale from 0 to 100, where 100 is fully healed.
        # Mild severity yields higher baseline index.
        sev = model_output['severity']
        base_index = 80 if sev == "Mild" else (50 if sev == "Moderate" else 20)
        
        # Simulate improvement over weekly intervals
        improvement_index = min(100, base_index + (entry_number * 5))

        progress_entry = {
            'user_id': current_user['_id'],
            'body_part': body_part,
            'week': entry_number,
            'date': datetime.datetime.now().isoformat(),
            'image_url': f"/static/uploads/{filename}",
            'disease': model_output['prediction'],
            'confidence': model_output['confidence'],
            'severity': sev,
            'improvement_index': improvement_index,
            'notes': notes
        }
        
        inserted = progress_col.insert_one(progress_entry)
        progress_entry['id'] = inserted['_id']
        if '_id' in progress_entry: del progress_entry['_id']
        
        return jsonify({
            'message': 'Progress entry recorded.',
            'entry': progress_entry
        }), 201
    except Exception as e:
        return jsonify({'message': f'Tracking registration failed: {str(e)}'}), 500

@predict_bp.route('/progress/track', methods=['GET'])
@token_required
def get_progress_trends(current_user):
    entries = progress_col.find({'user_id': current_user['_id']})
    
    # Group by body part
    grouped = {}
    for entry in entries:
        bp = entry.get('body_part', 'General Lesion')
        entry['id'] = entry['_id']
        if '_id' in entry: del entry['_id']
        if bp not in grouped:
            grouped[bp] = []
        grouped[bp].append(entry)
        
    # Sort weeks inside group
    for bp in grouped:
        grouped[bp] = sorted(grouped[bp], key=lambda x: x['week'])
        
    return jsonify({'trends': grouped}), 200
