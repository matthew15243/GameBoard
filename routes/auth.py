from flask import Blueprint, request, jsonify, session, redirect ,url_for
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
    existing_user = supabase_client.table("Profiles").select("id").eq("username", username).execute()
    if existing_user.data:
        return jsonify({"error": "Username already taken"}), 400

    try:
        # Create user in Supabase auth
        response = supabase_client.auth.sign_up({"email": email, "password": password, 'display_name' : username})
        user_id = response.user.id  # Get user ID
        print(f"response' : {response}")
        print(f"user_id : {user_id}")
        print(f"Username: {username}")

        # Store username in profiles table
        supabase_client.table("Profiles").insert({
            "id": user_id,
            "username": username,
            "friends" : None
        }).execute()
        print('Success')

        return jsonify({"message": "User created successfully! Please Validate your email to log in."}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    try:
        response = supabase_client.auth.sign_in_with_password({"email": email, "password": password})
        user_id = response.user.id

        # Fetch username from Profiles
        profile_response = supabase_client.table("Profiles").select("username").eq("id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}

        # Add both the id and the user to the session
        session['id'] = user_id  # Store session
        session['user'] = profile['username']
        session['email'] = email
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
    session.pop('id', None)  # Remove id from session
    session.pop('user', None)  # Remove user from session
    session.pop('email', None)  # Remove user from session
    return jsonify({"message": "Logged out successfully"})

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    try:
        supabase_client.auth.reset_password_for_email(email)
        return jsonify({"message": "Password reset email sent!"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get("password")
    access_token = data.get("access_token")

    if not new_password or not access_token or not email:
        return jsonify({"message": "Invalid request"}), 400

    try:
        # Authenticate the user with the access token from the password reset email
        # supabase_client.auth.set_session(access_token)
        supabase_client.auth.verify_otp({
            "email": email,
            "token": access_token,
            "type": "email"
        })

        # Now update the password
        supabase_client.auth.update_user({"password": new_password})

        return jsonify({"message": "Password updated successfully!"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500