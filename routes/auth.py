from flask import Blueprint, request, jsonify, session
import supabase
import os
from dotenv import load_dotenv

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Create a Blueprint for authentication
auth_bp = Blueprint('auth', __name__)

# Initialize Supabase client
supabase_client = supabase.create_client(url, key)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json  
    email = data.get("email")
    password = data.get("password")
    username = data.get("username")

    # Ensure username is unique before proceeding
    existing_user = supabase_client.table("profiles").select("id").eq("username", username).execute()
    if existing_user.data:
        return jsonify({"error": "Username already taken"}), 400

    try:
        # Create user in Supabase auth
        response = supabase_client.auth.sign_up({"email": email, "password": password, 'display_name' : username})
        user_id = response.user.id  # Get user ID

        # Store username in profiles table
        supabase_client.table("profiles").insert({
            "id": user_id,
            "username": username
        }).execute()

        return jsonify({"message": "User created successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    try:
        response = supabase_client.auth.sign_in_with_password({"email": email, "password": password})
        user_id = response.user.id

        # Fetch username from profiles
        profile_response = supabase_client.table("profiles").select("username").eq("id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}

        session['user'] = user_id  # Store session
        return jsonify({
            "message": "Login successful",
            "user": response.user.id, # There is lots of info in response.user if I want more in the future
            "profile": profile
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/logout', methods=['POST'])
def logout():
    supabase_client.auth.sign_out()
    session.pop('user', None)  # Remove user from session
    return jsonify({"message": "Logged out successfully"})

# @login_required
@auth_bp.route('/user', methods=['GET'])
def get_user():
    user = supabase_client.auth.get_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = user.user.id

    # Fetch user profile
    profile_response = supabase_client.table("profiles").select("username").eq("id", user_id).execute()
    profile = profile_response.data[0] if profile_response.data else {}

    return jsonify({"user": user, "profile": profile})