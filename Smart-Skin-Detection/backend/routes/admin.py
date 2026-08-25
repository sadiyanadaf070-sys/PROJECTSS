from flask import Blueprint, request, jsonify
from database import get_collection
from routes.auth import token_required
import datetime
import threading
import time

admin_bp = Blueprint('admin', __name__)

users_col = get_collection('users')
predictions_col = get_collection('predictions')
doctors_col = get_collection('doctors')
retrain_logs_col = get_collection('retrain_logs')

def is_admin(user):
    return user.get('role') == 'admin'

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
def admin_dashboard(current_user):
    if not is_admin(current_user):
        return jsonify({'message': 'Access forbidden. Admin role required.'}), 403
        
    user_count = len(list(users_col.find()))
    prediction_count = len(list(predictions_col.find()))
    doctor_count = len(list(doctors_col.find()))
    
    # Retrieve retrain logs
    logs = list(retrain_logs_col.find())
    for log in logs:
        log['id'] = log['_id']
        if '_id' in log: del log['_id']
        
    logs = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)
    
    # Simple user summary list
    users = list(users_col.find())
    cleaned_users = []
    for u in users:
        cleaned_users.append({
            'id': u['_id'],
            'name': u['name'],
            'email': u['email'],
            'role': u.get('role', 'user'),
            'is_verified': u.get('is_verified', False),
            'created_at': u.get('created_at')
        })

    return jsonify({
        'stats': {
            'total_users': user_count,
            'total_scans': prediction_count,
            'total_doctors': doctor_count
        },
        'retrain_logs': logs,
        'users': cleaned_users
    }), 200

def run_mock_retraining(trigger_by):
    # Log start
    log_id = str(len(list(retrain_logs_col.find())) + 1)
    retrain_entry = {
        '_id': log_id,
        'trigger_by': trigger_by,
        'timestamp': datetime.datetime.now().isoformat(),
        'status': 'In Progress',
        'progress': '0%',
        'accuracy': 'N/A',
        'details': 'Loaded MobileNetV2 base weights. Commencing training on HAM10000 + ISIC datasets (14 classes)...'
    }
    retrain_logs_col.insert_one(retrain_entry)
    
    # Simulate step-by-step training epochs
    time.sleep(3)
    retrain_logs_col.update_one({'_id': log_id}, {'$set': {'progress': '40%', 'details': 'Epoch 1/5 - Loss: 1.24 - Acc: 0.72'}})
    
    time.sleep(3)
    retrain_logs_col.update_one({'_id': log_id}, {'$set': {'progress': '70%', 'details': 'Epoch 3/5 - Loss: 0.65 - Acc: 0.88'}})
    
    time.sleep(3)
    retrain_logs_col.update_one({'_id': log_id}, {'$set': {
        'progress': '100%', 
        'status': 'Completed',
        'accuracy': 0.942,
        'details': 'Epoch 5/5 completed. Fine-tuned accuracy: 94.2%. New model binary saved successfully.'
    }})

@admin_bp.route('/retrain', methods=['POST'])
@token_required
def trigger_cnn_retraining(current_user):
    if not is_admin(current_user):
        return jsonify({'message': 'Access forbidden. Admin role required.'}), 403
        
    # Start thread
    thread = threading.Thread(target=run_mock_retraining, args=(current_user['email'],))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'message': 'CNN retraining initiated in the background.',
        'status': 'In Progress'
    }), 202

@admin_bp.route('/users/role', methods=['PUT'])
@token_required
def update_user_role(current_user):
    if not is_admin(current_user):
        return jsonify({'message': 'Access forbidden. Admin role required.'}), 403
        
    data = request.get_json() or {}
    target_user_id = data.get('userId')
    new_role = data.get('role') # 'user' or 'admin'
    
    if not target_user_id or new_role not in ['user', 'admin']:
        return jsonify({'message': 'Invalid user ID or role parameter.'}), 400
        
    updated = users_col.update_one({'_id': target_user_id}, {'$set': {'role': new_role}})
    if updated:
        return jsonify({'message': f'User role updated to {new_role}.'}), 200
        
    return jsonify({'message': 'User not found.'}), 404
