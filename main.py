from flask import Flask, render_template, redirect, url_for, session
# from flask_socketio import SocketIO, emit
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
# socketio = SocketIO(app)

# Initialize the database
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Register blueprints
app.register_blueprint(hearts_bp, url_prefix='/hearts') # Get the Hearts route
app.register_blueprint(auth_bp, url_prefix='/auth') # Get the authorization route
app.register_blueprint(general_bp, url_prefix='/general') # Get the general functions route
app.register_blueprint(lobby_bp, url_prefix='/lobby') # Get the general functions route

# Watch for connections and disconnections
"""connected_clients = {}
@socketio.on('connect')
def handle_connect():
    ip = request.remote_addr  # Get IP address of the client
    connected_clients[request.sid] = ip
    print(f"Client {ip} connected.")
    emit('update_players', list(connected_clients.values()), broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    ip = connected_clients.pop(request.sid, None)
    print(f"Client {ip} disconnected.")
    emit('update_players', list(connected_clients.values()), broadcast=True)"""

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

@app.route('/')
@app.route('/home/')
def home():
	return redirect(url_for('login'))

@app.route('/hearts/')
def playHearts():
	return render_template('hearts.html')

if __name__ == ('__main__'):
	# socketio.run(app, host = '127.0.0.1', port = '8080', debug = True)
	# socketio.run(app, host = '0.0.0.0', port = '8080', debug = True)
	# app.run(host = '127.0.0.1', port = '8080', debug = True)
	app.run(host = '0.0.0.0', port = '8080', debug = True)