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

def getAcceptableValues(defaults, section, option):
    # Normalize section name to match JS behavior
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
        response = supabase_client.table('ActiveGames').select('id, game, status, host, configurations, players, max_players, player_is_ready_statuses, password').in_('status', ['Joinable', 'Active', 'Paused']).execute()
        games = response.data

        for item in games:
            item['password'] = bool(item['password'])

        if games:
            return jsonify(games), 200
        else:
            return jsonify({"error": "No games found"}), 404
    except Exception as e:
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

