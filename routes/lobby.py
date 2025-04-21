from flask import Blueprint, request, jsonify, session, redirect ,url_for
import supabase
import os
import random
from dotenv import load_dotenv

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Create a Blueprint for authentication
lobby_bp = Blueprint('lobby', __name__)

# Initialize Supabase client
supabase_client = supabase.create_client(url, key)

def getAcceptableValues(defaults, section, option):
    option_configs = defaults['configurations'].get(section, {}).get(option)
    values = []

    if option_configs:
        min_val = option_configs.get('min')
        max_val = option_configs.get('max')
        step = option_configs.get('step', 1)

        if min_val is not None and max_val is not None:
            values.extend(range(min_val, max_val + 1, step))
        elif 'options' in option_configs:
            values.extend(option_configs['options'])
        elif 'default' in option_configs:
            return []
        else:
            print("Houston... we have a problem")
            print(f"For this game, there seems to be a new config or something wrong with the current configurations")
            print(f"Min: {min_val}, Max: {max_val}, Options: {option_configs.get('options')}, Added Options: {option_configs.get('addedOptions')}")

        # Add any additional options
        if 'addedOptions' in option_configs:
            values.extend(option_configs['addedOptions'])

    return values

def validateGame(defaults, newGame):
    errors = []
    for section in newGame['configurations']:
        for option in newGame['configurations'][section]:
            # Grab the value and give it the proper type, if it doesn't already
            value = newGame['configurations'][section][option]['value']

            validValues = getAcceptableValues(defaults, section, option)
            if (len(validValues) != 0 and value not in validValues):
                errors.append(option)
            else:
                newGame['configurations'][section][option]['value'] = value

    return errors

def formatGame(defaults, newGame):
	final_game = newGame.copy()
	for section in defaults['configurations']:
		sectionConfigs = defaults['configurations'][section]
		if (section not in newGame['configurations']):
			final_game['configurations'][section] = sectionConfigs
		else:
			for option in sectionConfigs:
				optionConfigs = sectionConfigs[option]
				if (option not in newGame['configurations'][section] and option.lower() != "password"):
					if(type(optionConfigs) == type({})):
						default = optionConfigs['default']
						final_game['configurations'][section][option] = {"value" : default, "order" : optionConfigs.get("order", 99)}
					else:
						final_game['configurations'][section][option] = optionConfigs
				elif (option.lower() != "password"):
					for key, value in optionConfigs.items():
						key = key if key != 'default' else 'value'
						if (key not in newGame['configurations'][section][option] and key in ('value', 'order')):
							final_game['configurations'][section][option][key] = value
	return final_game

@lobby_bp.route('/get_playable_games', methods=['GET'])
def get_playable_games():
    try:
        response = supabase_client.table('PlayableGames').select('game, configurations').execute()
        if response.data:
            session['playableGames'] = response.data
            return jsonify(response.data), 200
        else:
            return jsonify({"error": "No games found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@lobby_bp.route('/get_active_games', methods=['GET'])
def get_acitve_games():
    try:
        response = supabase_client.table('ActiveGames').select('id, game, status, host, configurations, players, password').in_('status', ['Joinable', 'Active', 'Paused']).execute()
        games = response.data

        for item in games:
            item['password'] = bool(item['password'])

        if games:
            return jsonify(games), 200
        else:
            return jsonify({"error": "No games found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@lobby_bp.route('/check_password', methods=['POST'])
def check_password():
    try:
        passwordObject = request.get_json()
        password = passwordObject['password']
        id = passwordObject['id']

        # Make the call to supabase
        response = supabase_client.table('ActiveGames').select('password').eq("id", id).single().execute()

        if response.data:
            return jsonify({"success": True, "data" : response.data['password'] == password}), 201
        else:
            return jsonify({"success": False, "data" : 'Failed to Connect to Supabase'}), 400
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@lobby_bp.route('/create_game', methods=['POST'])
def create_game():
    try:
        game = request.get_json()
        defaults = [x for x in session['playableGames'] if x['game'] == game['game']][0]

        errors = validateGame(defaults, game)
        if (len(errors) == 0):
            finalGame = formatGame(defaults, game)
            response = supabase_client.table("ActiveGames").insert([finalGame]).execute()

            if response.data:
                return jsonify({"success": True, "data" : response.data}), 201
            else:
                return jsonify({"success": False, "data" : errors}), 400
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@lobby_bp.route('/delete_game', methods=['POST'])
def delete_game():
    try:
        id = request.get_json()
        response = supabase_client.table("ActiveGames").delete().eq("id", id).eq("host", session['user']).execute()

        # Supabase returns the deleted rows in response.data
        if response.data and len(response.data) > 0:
            return jsonify({"success": True, "message": "Game deleted"}), 200
        else:
            return jsonify({"success": False, "message": "No matching game found or unauthorized"}), 404
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@lobby_bp.route('/join_game', methods=['POST'])
def join_game():
    game_id = request.get_json()
    user = session.get("user")

    if not user:
        return jsonify({"error": "Not logged in"}), 403

    new_player = {
        "Name": user,
        "Type": "Human",
        "IsReady" : False
    }

    try:
        supabase_client.rpc("add_player_to_game", {
            "game_id": game_id,
            "new_player": new_player,
            "player_name": user
        }).execute()

        return jsonify({"success": True}), 200

    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500

@lobby_bp.route('/add_computer', methods=['POST'])
def add_computer():
    game_id = request.get_json()['id']

    # Verify the user is logged in
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 403
    
    try:
        response = supabase_client.table('ActiveGames').select('players').eq('id', game_id).execute()
        playerNames = response.data[0]['players']
        playerNames = [x['Name'] for x in playerNames]
    
        # Get a computer name
        botNames = ["AlphaBot", "BotimusPrime", "DataStorm", "RoboRex", "CircuitSurge", "QuantumBot", "Botzilla", "RAMbo", "BitBandit", "ByteSize", "AutoMate"]
        botNames = [x for x in botNames if x not in playerNames]
        computerName = random.choice(botNames)

        new_player = {
            "Name": computerName,
            "Type": "Computer",
            "Difficulty": "Normal",
            "IsReady" : True
        }

        response = supabase_client.rpc("add_player_to_game", {
            "game_id": game_id,
            "new_player": new_player,
            "player_name": computerName
        }).execute()

        return jsonify({"success": True}), 200

    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500

@lobby_bp.route('/update_computer_settings', methods=['POST'])
def update_computer_settings():
    data = request.get_json()
    game_id = data['id']              # bigint
    name = data['Name']      # e.g., "Chimera"
    new_settings = data['computer_settings']  # dict, e.g., {"Difficulty": "Hard"}

    try:
        response = supabase_client.rpc(
            'update_computer_settings',
            {
                'game_id': game_id,
                'player_name': name,
                'new_settings': new_settings
            }
        ).execute()

        return jsonify({"message": "Computer settings updated successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@lobby_bp.route('/remove_player', methods=['POST'])
def remove_player():
    data = request.get_json()
    game_id = data['id']
    player = data['player']
    user = session.get("user")
    print(game_id, player, user)

    if not user:
        return jsonify({"error": "Not logged in"}), 403

    try:
        response = supabase_client.rpc("remove_player_from_game", {
            "game_id": game_id,
            "player_name": player,
            "requesting_user" : user
        }).execute()

        return jsonify({"success": True, "message": "Player removed"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@lobby_bp.route('/update_config', methods=['POST'])
def update_config():
    data = request.get_json()
    game_id = data.get("id")
    config_patch = data.get("config_patch")

    if not game_id or not config_patch:
        return jsonify({"success": False, "error": "Missing id or config_patch"}), 400
    
    try:
        response = supabase_client.rpc("update_nested_jsonb_config", {
            "game_id": game_id,
            "config_patch": config_patch
        }).execute()

        if response.data is not None:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"success": False, "error": "Update failed"}), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@lobby_bp.route('/update_player_ready_status', methods=['POST'])
def update_player_ready_status():
    data = request.get_json()
    game_id = data.get("id")
    player = data.get("player")
    status = data.get("status")

    if (not game_id or not player or 'status' not in data):
        return jsonify({"success": False, "error": "Missing id, player name, or status"}), 400
    
    if player != session['user']:
         return jsonify({"Unable to alter someone else's status"}), 403
    
    try:
        response = supabase_client.rpc("update_player_ready_status", {
            "game_id": game_id,
            "player_name": player,
            "is_ready": status
        }).execute()

        print(response)

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@lobby_bp.route('/reorder_players', methods=['POST'])
def reorder_players():
    data = request.get_json()
    game_id = data.get("id")
    players = data.get("players")
    user = data.get("user")

    if (not game_id or not players or not user):
        return jsonify({"success": False, "error": "Missing id, user, or player ordering"}), 400
    
    if user != session['user']:
         return jsonify({"Unable to alter someone else's status"}), 403
    
    try:
        response = supabase_client.rpc("reorder_players_by_name", {
        "game_id": game_id,
        "ordered_names": players
    }).execute()

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500