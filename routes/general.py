from flask import Blueprint, jsonify, session
import supabase
from routes.decorators import login_required
from dotenv import load_dotenv
import os

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Create a Blueprint for authentication
general_bp = Blueprint('general', __name__)

# Initialize Supabase client
supabase_client = supabase.create_client(url, key)

@general_bp.route('/user', methods=['GET'])
@login_required
def get_user():
    user = session

    if 'id' not in user:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = user['id']

    # Fetch user profile
    profile_response = supabase_client.table("Profiles").select("username").eq("id", user_id).execute()
    profile = profile_response.data[0] if profile_response.data else {}

    return jsonify({"profile": profile})