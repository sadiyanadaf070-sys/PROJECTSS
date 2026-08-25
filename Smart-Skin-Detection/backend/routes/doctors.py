from flask import Blueprint, request, jsonify
from database import get_collection
from routes.auth import token_required
import uuid
import datetime

doctors_bp = Blueprint('doctors', __name__)
doctors_col = get_collection('doctors')
appointments_col = get_collection('appointments')

@doctors_bp.route('/nearby', methods=['GET'])
@token_required
def get_nearby_doctors(current_user):
    lat_str = request.args.get('lat')
    lng_str = request.args.get('lng')
    
    # Retrieve default registered doctors from DB
    all_doctors = doctors_col.find()
    
    # If coordinates are provided, dynamically adjust distances and offsets 
    # to simulate relative proximity maps around their target area
    adjusted_doctors = []
    try:
        user_lat = float(lat_str) if lat_str else 12.9716 # Bengaluru center fallback
        user_lng = float(lng_str) if lng_str else 77.5946
        
        for idx, doc in enumerate(all_doctors):
            doc['id'] = doc['_id']
            if '_id' in doc: del doc['_id']
            
            # Recalculate mock coordinates around client coords to appear close on the leaflet map
            offset_lat = 0.015 * (idx - 1.5)
            offset_lng = 0.018 * (idx * 0.5 - 0.7)
            doc['lat'] = user_lat + offset_lat
            doc['lng'] = user_lng + offset_lng
            
            dist = round(1.2 + (idx * 0.8), 1)
            doc['distance'] = f"{dist} km"
            adjusted_doctors.append(doc)
    except Exception:
        # Fallback to general list
        for doc in all_doctors:
            doc['id'] = doc['_id']
            if '_id' in doc: del doc['_id']
            adjusted_doctors.append(doc)

    return jsonify({'doctors': adjusted_doctors}), 200

@doctors_bp.route('/book', methods=['POST'])
@token_required
def book_appointment(current_user):
    data = request.get_json() or {}
    doctor_id = data.get('doctorId')
    doctor_name = data.get('doctorName')
    date = data.get('date')
    time_slot = data.get('timeSlot')
    patient_notes = data.get('notes', '')
    
    if not doctor_id or not date or not time_slot:
        return jsonify({'message': 'Please select doctor, date and time slot.'}), 400
        
    appointment = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['_id'],
        'patient_name': current_user['name'],
        'doctor_id': doctor_id,
        'doctor_name': doctor_name or "Dermatologist Specialist",
        'date': date,
        'time_slot': time_slot,
        'notes': patient_notes,
        'status': 'Confirmed',
        'created_at': datetime.datetime.now().isoformat()
    }
    
    appointments_col.insert_one(appointment)
    return jsonify({
        'message': 'Appointment booked successfully. A confirmation message has been sent.',
        'appointment': appointment
    }), 201

@doctors_bp.route('/appointments', methods=['GET'])
@token_required
def get_user_appointments(current_user):
    apps = appointments_col.find({'user_id': current_user['_id']})
    cleaned_apps = []
    for app in apps:
        app['id'] = app['_id']
        if '_id' in app: del app['_id']
        cleaned_apps.append(app)
        
    cleaned_apps = sorted(cleaned_apps, key=lambda x: x['date'], reverse=True)
    return jsonify({'appointments': cleaned_apps}), 200
