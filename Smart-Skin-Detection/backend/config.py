import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-healthcare-key-13579')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/smart_skin_db')
    
    # Enable fallback JSON DB if MongoDB connection fails
    USE_FALLBACK_DB = os.environ.get('USE_FALLBACK_DB', 'True').lower() == 'true'
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    PREPROCESSED_FOLDER = os.path.join(BASE_DIR, 'static', 'preprocessed')
    HEATMAP_FOLDER = os.path.join(BASE_DIR, 'static', 'heatmaps')
    REPORTS_FOLDER = os.path.join(BASE_DIR, 'static', 'reports')
    MODELS_FOLDER = os.path.join(BASE_DIR, 'models_store')
    
    MODEL_PATH = os.path.join(MODELS_FOLDER, 'skin_disease_classifier.keras')

# Ensure directories exist
for folder in [Config.UPLOAD_FOLDER, Config.PREPROCESSED_FOLDER, Config.HEATMAP_FOLDER, Config.REPORTS_FOLDER, Config.MODELS_FOLDER]:
    os.makedirs(folder, exist_ok=True)
