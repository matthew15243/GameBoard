from flask import Blueprint, request, jsonify, session, redirect ,url_for
import supabase
import os
from dotenv import load_dotenv

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Create a Blueprint for authentication
profile_bp = Blueprint('profile', __name__)

# Initialize Supabase client
supabase_client = supabase.create_client(url, key)

@profile_bp.route('/get_profile_sidebar', methods=['GET'])
def get_profile_sidebar():
    try:
        response = supabase_client.table('ProfileOptions').select('option_name,sort_order,url').execute()
        if response.data:
            return jsonify(response.data), 200
        else:
            print(response)
            return jsonify({"error": "No profile page options found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500