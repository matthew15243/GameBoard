from flask import Blueprint, request, jsonify, session, redirect ,url_for,render_template
import supabase
import os
from dotenv import load_dotenv

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Create a Blueprint for authentication
profile_bp = Blueprint('profile', __name__,template_folder='../templates')

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
    
@profile_bp.route('/friends')
def friends():
    return render_template('friends.html')

@profile_bp.route('/statistics')
def stats():
    return render_template('statistics.html')

@profile_bp.route('/settings')
def settings():
    return render_template('settings.html')

