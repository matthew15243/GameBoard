from flask import Flask, render_template, redirect, url_for, session, jsonify, request
from flask_socketio import SocketIO, emit
from routes.hearts import hearts_bp
from routes.auth import auth_bp
from routes.general import general_bp
from routes.lobby import lobby_bp
from supabase import Client, create_client
import os
from dotenv import load_dotenv
from routes.decorators import login_required_with_redirect

# Intialize the .env file
load_dotenv('./games.env')

#Test comment for github calibration

# Initialize the app
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_KEY")
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the database
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Register blueprints
app.register_blueprint(hearts_bp, url_prefix='/hearts') # Get the Hearts route
app.register_blueprint(auth_bp, url_prefix='/auth') # Get the authorization route
app.register_blueprint(general_bp, url_prefix='/general') # Get the general functions route
app.register_blueprint(lobby_bp, url_prefix='/lobby') # Get the general functions route

# Connected Clients
connected_users = {}  # socket_id -> user_email

@socketio.on('connect')
def handle_connect():
    user = session.get('user')
    if user:
        # connected_users[request.sid] = user['email']
        connected_users[request.sid] = user

@socketio.on('disconnect')
def handle_disconnect():
    connected_users.pop(request.sid, None)

# # Web Hooks
# @app.route('/supabase-webhook', methods=['POST'])
# def supabase_webhook():
# 	token = request.headers.get("Authorization")
# 	if (token != f"Bearer {os.getenv("FLASK_KEY")}"):
# 		print('fail')
# 		return jsonify({"error": "Unauthorized"}), 403
	
# 	data = request.json  # Get webhook data
# 	table = data.get('table')  # Supabase includes the table name

# 	# print(f"Received update from {table}: {data}")

# 	if table == "ActiveGames":
# 		socketio.emit('game_update', data)  # Emit event for ActiveGames
#     # elif table == "Players":
#         # socketio.emit('player_update', data)  # Emit event for Players table
#     # elif table == "ChatMessages":
#         # socketio.emit('chat_update', data)  # Emit event for chat messages
# 	else:
# 		print("Unhandled table update")

# 	return jsonify({"message": "Webhook received"}), 200

@app.route('/supabase-webhook', methods=['POST'])
def supabase_webhook():
    token = request.headers.get("Authorization")
    if token != f"Bearer {os.getenv('FLASK_KEY')}":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    table = data.get('table')
    record = data.get('record') or {}  # Supabase sends the new row data as 'record'

    if table == "ActiveGames":
        game_status = record.get("status")
        players = record.get("players", [])

        # Preprocess player names for quick lookup
        player_names = {p.get("Name") for p in players if "Name" in p}

        # Go through connected sockets and emit selectively
        for sid, user in connected_users.items():
            # If status is Joinable OR user is in the players list, emit update
            if game_status == "Joinable" or user in player_names:
                socketio.emit('game_update', data, to=sid)
    else:
        print("Unhandled table update")

    return jsonify({"message": "Webhook received"}), 200

@app.route("/reset-password/", methods=["GET"])
def reset_password_page():
    return render_template("reset.html")

@app.route('/login/')
def login():
	if ('id' in session):
		return redirect(url_for('lobby'))
	return render_template('login.html')

@app.route('/lobby/')
@login_required_with_redirect
def lobby():
	return render_template('lobby.html')

@app.route('/headertest/')
@login_required_with_redirect
def headertest():
	return render_template('headertest.html')

@app.route('/')
@app.route('/home/')
def home():
	return redirect(url_for('login'))

@app.route('/Hearts/<int:game_id>')
@login_required_with_redirect
def playHearts(game_id):
	return render_template('Hearts.html', game_id = game_id)

if __name__ == '__main__':
	# socketio.run(app, host = '127.0.0.1', port = '8080', debug = True)
	socketio.run(app, host = '0.0.0.0', port = '8080', debug = True)
	# app.run(host = '127.0.0.1', port = '8080', debug = True)
	# app.run(host = '0.0.0.0', port = '8080', debug = True)