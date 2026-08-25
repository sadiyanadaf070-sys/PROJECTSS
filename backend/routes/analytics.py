from flask import Blueprint, jsonify
from database import get_collection
from routes.auth import token_required
from classifier import DISEASES
import datetime

analytics_bp = Blueprint('analytics', __name__)
predictions_col = get_collection('predictions')

@analytics_bp.route('/stats', methods=['GET'])
@token_required
def get_user_statistics(current_user):
    scans = list(predictions_col.find({'user_id': current_user['_id']}))
    
    total_scans = len(scans)
    if total_scans == 0:
        return jsonify({
            'total_scans': 0,
            'avg_confidence': 0,
            'disease_distribution': [],
            'monthly_activity': [],
            'severity_counts': {'Mild': 0, 'Moderate': 0, 'Severe': 0}
        }), 200
        
    # Calculate average confidence
    total_conf = sum([s.get('confidence', 0) for s in scans])
    avg_confidence = round(total_conf / total_scans, 2)
    
    # Calculate disease distribution
    disease_counts = {}
    severity_counts = {'Mild': 0, 'Moderate': 0, 'Severe': 0}
    for s in scans:
        disease = s.get('prediction', 'Unknown')
        disease_counts[disease] = disease_counts.get(disease, 0) + 1
        
        sev = s.get('severity', 'Mild')
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        
    disease_distribution = []
    for d, count in disease_counts.items():
        disease_distribution.append({
            'disease': d,
            'count': count,
            'percentage': round((count / total_scans) * 100, 1)
        })
        
    # Calculate monthly activity (last 6 months)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_activity = []
    
    # Simple aggregation of counts per month
    month_counts = {}
    for s in scans:
        try:
            date_obj = datetime.datetime.fromisoformat(s.get('date'))
            month_label = f"{months[date_obj.month - 1]} {date_obj.year}"
            month_counts[month_label] = month_counts.get(month_label, 0) + 1
        except Exception:
            continue
            
    # Sort or pad
    for label, count in month_counts.items():
        monthly_activity.append({'month': label, 'scans': count})
        
    if not monthly_activity:
        monthly_activity = [{'month': 'Current Month', 'scans': total_scans}]

    return jsonify({
        'total_scans': total_scans,
        'avg_confidence': avg_confidence,
        'disease_distribution': sorted(disease_distribution, key=lambda x: x['count'], reverse=True),
        'monthly_activity': monthly_activity,
        'severity_counts': severity_counts
    }), 200
