import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from database import db_manager

# Import route blueprints
from routes.auth import auth_bp
from routes.predict import predict_bp
from routes.doctors import doctors_bp
from routes.chatbot import chatbot_bp
from routes.analytics import analytics_bp
from routes.reports import reports_bp
from routes.admin import admin_bp

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for frontend interactions
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(predict_bp, url_prefix='/api/predict')
app.register_blueprint(doctors_bp, url_prefix='/api/doctors')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Serving static resource directories
@app.route('/static/uploads/<filename>')
def serve_uploads(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)

@app.route('/static/preprocessed/<filename>')
def serve_preprocessed(filename):
    return send_from_directory(Config.PREPROCESSED_FOLDER, filename)

@app.route('/static/heatmaps/<filename>')
def serve_heatmaps(filename):
    return send_from_directory(Config.HEATMAP_FOLDER, filename)

@app.route('/static/reports/<filename>')
def serve_reports(filename):
    return send_from_directory(Config.REPORTS_FOLDER, filename)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'Online',
        'database_fallback': db_manager.fallback,
        'message': 'Smart Skin Disease Detection API is active.'
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'message': 'Endpoint not found.'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'message': 'Internal server error.'}), 500

if __name__ == '__main__':
    # Determine port
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
