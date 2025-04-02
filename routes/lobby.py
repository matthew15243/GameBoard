from flask import Blueprint, request, jsonify, session, redirect ,url_for
import supabase
import os
from dotenv import load_dotenv

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Create a Blueprint for authentication
lobby_bp = Blueprint('lobby', __name__)

# Initialize Supabase client
supabase_client = supabase.create_client(url, key)

@lobby_bp.route('/get_games', methods=['GET'])
def get_games():
    try:
        response = supabase_client.table('PlayableGames').select('game, configurations').execute()
        if response.data:
            return jsonify(response.data), 200
        else:
            return jsonify({"error": "No games found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500