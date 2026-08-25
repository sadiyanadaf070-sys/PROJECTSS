import os
import json
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import Config

class JSONDatabase:
    """Fallback file-based JSON database for demo environments where MongoDB is not installed."""
    def __init__(self, filename="local_database.json"):
        self.filepath = os.path.join(Config.BASE_DIR, filename)
        if not os.path.exists(self.filepath):
            self.data = {
                "users": [],
                "predictions": [],
                "doctors": self._load_default_doctors(),
                "progress": [],
                "reports": [],
                "retrain_logs": []
            }
            self._save()
        else:
            try:
                with open(self.filepath, 'r') as f:
                    self.data = json.load(f)
            except Exception:
                self.data = {
                    "users": [],
                    "predictions": [],
                    "doctors": self._load_default_doctors(),
                    "progress": [],
                    "reports": [],
                    "retrain_logs": []
                }
                self._save()

    def _save(self):
        with open(self.filepath, 'w') as f:
            json.dump(self.data, f, indent=4)

    def _load_default_doctors(self):
        return [
            {
                "id": "doc1",
                "name": "Dr. Aarav Mehta",
                "specialty": "Clinical Dermatology",
                "clinic": "Mehta Skin & Laser Centre",
                "rating": 4.8,
                "distance": "1.2 km",
                "lat": 12.9716,
                "lng": 77.5946,
                "phone": "+91 98765 43210",
                "address": "Indiranagar, Bengaluru, Karnataka"
            },
            {
                "id": "doc2",
                "name": "Dr. Priya Sharma",
                "specialty": "Pediatric Dermatology",
                "clinic": "SkinCare & Aesthetic Clinic",
                "rating": 4.9,
                "distance": "2.5 km",
                "lat": 12.9616,
                "lng": 77.6446,
                "phone": "+91 87654 32109",
                "address": "Koramangala, Bengaluru, Karnataka"
            },
            {
                "id": "doc3",
                "name": "Dr. Vikram Hegde",
                "specialty": "Dermatosurgery",
                "clinic": "Hegde Skin Hospital",
                "rating": 4.7,
                "distance": "3.8 km",
                "lat": 12.9916,
                "lng": 77.5746,
                "phone": "+91 76543 21098",
                "address": "Malleshwaram, Bengaluru, Karnataka"
            },
            {
                "id": "doc4",
                "name": "Dr. Ananya Rao",
                "specialty": "Trichology & Laser Medicine",
                "clinic": "Rao Dermacare Hub",
                "rating": 4.6,
                "distance": "4.1 km",
                "lat": 12.9516,
                "lng": 77.5846,
                "phone": "+91 65432 10987",
                "address": "Jayanagar, Bengaluru, Karnataka"
            }
        ]

    def get_collection(self, collection_name):
        return JSONCollection(self, collection_name)

class JSONCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name
        if name not in self.db.data:
            self.db.data[name] = []
            self.db._save()

    def find_one(self, query):
        for item in self.db.data[self.name]:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item
        return None

    def find(self, query=None):
        if not query:
            return self.db.data[self.name]
        results = []
        for item in self.db.data[self.name]:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(item)
        return results

    def insert_one(self, document):
        # Automatically generate string IDs
        if "_id" not in document:
            document["_id"] = str(len(self.db.data[self.name]) + 1)
        self.db.data[self.name].append(document)
        self.db._save()
        return document

    def update_one(self, query, update_dict):
        item = self.find_one(query)
        if item:
            operations = update_dict.get("$set", {})
            for k, v in operations.items():
                item[k] = v
            self.db._save()
            return True
        return False

    def delete_one(self, query):
        item = self.find_one(query)
        if item:
            self.db.data[self.name].remove(item)
            self.db._save()
            return True
        return False

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.fallback = False

        if Config.USE_FALLBACK_DB:
            print("[DB] Using JSON Fallback Database by configuration.")
            self.db = JSONDatabase()
            self.fallback = True
        else:
            try:
                # 2-second timeout to check connection
                self.client = pymongo.MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2000)
                self.client.server_info()  # Forces a call
                self.db = self.client.get_database()
                print("[DB] Connected successfully to MongoDB at", Config.MONGO_URI)
            except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
                print(f"[DB] MongoDB connection failed: {e}. Falling back to Local JSON DB.")
                self.db = JSONDatabase()
                self.fallback = True

    def get_collection(self, collection_name):
        if self.fallback:
            return self.db.get_collection(collection_name)
        return self.db[collection_name]

# Global Database Instance
db_manager = DatabaseManager()
def get_collection(name):
    return db_manager.get_collection(name)
