from flask import Flask, render_template, redirect, url_for, request
from flask_socketio import SocketIO, emit
from routes.hearts import hearts_bp
from routes.auth import auth_bp
from supabase import Client, create_client
import os
from dotenv import load_dotenv

app = Flask(__name__)
socketio = SocketIO(app)

# This should be moved to a .env file

load_dotenv('./games.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)

# Run the query after initializing the client
# response = supabase.table("Users").select("*").execute()

# Register blueprints
app.register_blueprint(hearts_bp, url_prefix='/hearts')
app.register_blueprint(auth_bp, url_prefix='/auth')

connected_clients = {}

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
    emit('update_players', list(connected_clients.values()), broadcast=True)

# Example on redirecting
@app.route('/play/')
def play():
	return redirect(url_for("playHearts"))

# Example with parameters
@app.route('/echo/<name>')
def echo(name):
	return f"Hello {name}"

@app.route('/')
def home():
	# return render_template('home.html')
	return render_template('login.html')

@app.route('/hearts/')
def playHearts():
	return render_template('hearts.html')

if __name__ == ('__main__'):
	# socketio.run(app, host = '127.0.0.1', port = '8080', debug = True)
	socketio.run(app, host = '0.0.0.0', port = '8080', debug = True)
	# app.run(host = '127.0.0.1', port = '8080', debug = True)
	# app.run(host = '0.0.0.0', port = '8080', debug = True)