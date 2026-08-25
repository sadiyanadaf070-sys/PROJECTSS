from flask import Blueprint, request, jsonify
from database import get_collection
from utils.security import hash_password, check_password, generate_token, decode_token
from functools import wraps
import datetime
import random

auth_bp = Blueprint('auth', __name__)
users_col = get_collection('users')

# Verification code dictionary to store temporary codes
otp_store = {} # {email: {"code": code, "expiry": time}}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Authentication token is missing!'}), 401
        
        data = decode_token(token)
        if 'error' in data:
            return jsonify({'message': data['error']}), 401
            
        current_user = users_col.find_one({'_id': data['sub']})
        if not current_user:
            return jsonify({'message': 'User profile not found!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    name = data.get('name', '').strip()
    password = data.get('password', '')
    
    if not email or not name or not password:
        return jsonify({'message': 'Please provide all required fields (email, name, password).'}), 400
        
    existing_user = users_col.find_one({'email': email})
    if existing_user:
        return jsonify({'message': 'User with this email already exists.'}), 409
        
    hashed = hash_password(password)
    new_user = {
        'name': name,
        'email': email,
        'password': hashed,
        'role': 'user', # 'user' or 'admin'
        'is_verified': False,
        'created_at': datetime.datetime.now().isoformat()
    }
    
    # Automatically make first user an admin for testing convenience
    if not users_col.find():
        new_user['role'] = 'admin'
        new_user['is_verified'] = True
        
    inserted = users_col.insert_one(new_user)
    
    # Generate OTP for email verification
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {
        'code': otp,
        'expiry': datetime.datetime.now() + datetime.timedelta(minutes=10)
    }
    
    token = generate_token(inserted['_id'], new_user['role'])
    
    return jsonify({
        'message': 'Signup successful. OTP verification sent to email.',
        'token': token,
        'otp_demo': otp, # Sent in response for demonstration ease
        'user': {
            'id': inserted['_id'],
            'name': name,
            'email': email,
            'role': new_user['role'],
            'is_verified': new_user['is_verified']
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    remember_me = data.get('rememberMe', False)
    
    if not email or not password:
        return jsonify({'message': 'Please enter email and password.'}), 400
        
    user = users_col.find_one({'email': email})
    if not user or not check_password(user['password'], password):
        return jsonify({'message': 'Incorrect email or password.'}), 401
        
    days = 30 if remember_me else 7
    token = generate_token(user['_id'], user.get('role', 'user'), expires_in_days=days)
    
    return jsonify({
        'message': 'Login successful.',
        'token': token,
        'user': {
            'id': user['_id'],
            'name': user['name'],
            'email': user['email'],
            'role': user.get('role', 'user'),
            'is_verified': user.get('is_verified', False)
        }
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'message': 'Email is required.'}), 400
        
    user = users_col.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User with this email does not exist.'}), 404
        
    # Generate OTP
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {
        'code': otp,
        'expiry': datetime.datetime.now() + datetime.timedelta(minutes=10)
    }
    
    return jsonify({
        'message': 'Password reset verification code sent to your email.',
        'otp_demo': otp # Return for demo
    }), 200

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()
    purpose = data.get('purpose', 'verify_email') # 'verify_email' or 'reset_password'
    
    if not email or not otp:
        return jsonify({'message': 'Email and OTP are required.'}), 400
        
    record = otp_store.get(email)
    if not record:
        return jsonify({'message': 'No code generated for this email. Request again.'}), 400
        
    if record['expiry'] < datetime.datetime.now():
        del otp_store[email]
        return jsonify({'message': 'OTP code has expired.'}), 400
        
    if record['code'] != otp:
        return jsonify({'message': 'Incorrect OTP code.'}), 400
        
    # Valid OTP
    del otp_store[email]
    
    if purpose == 'verify_email':
        users_col.update_one({'email': email}, {'$set': {'is_verified': True}})
        return jsonify({'message': 'Email verified successfully.'}), 200
    else:
        # Reset password flow, return verification token
        reset_token = generate_token(email, role='reset_flow', expires_in_days=1)
        return jsonify({
            'message': 'OTP verified. Proceed to change password.',
            'reset_token': reset_token
        }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    reset_token = data.get('token', '')
    new_password = data.get('password', '')
    
    if not reset_token or not new_password:
        return jsonify({'message': 'Token and password are required.'}), 400
        
    payload = decode_token(reset_token)
    if 'error' in payload or payload.get('role') != 'reset_flow':
        return jsonify({'message': 'Invalid or expired password reset token.'}), 401
        
    email = payload['sub']
    hashed = hash_password(new_password)
    
    updated = users_col.update_one({'email': email}, {'$set': {'password': hashed}})
    if updated:
        return jsonify({'message': 'Password reset successful. Please login with your new password.'}), 200
    return jsonify({'message': 'Error resetting password. User not found.'}), 404

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'user': {
            'id': current_user['_id'],
            'name': current_user['name'],
            'email': current_user['email'],
            'role': current_user.get('role', 'user'),
            'is_verified': current_user.get('is_verified', False),
            'created_at': current_user.get('created_at')
        }
    }), 200
