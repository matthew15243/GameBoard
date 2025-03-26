from flask import Flask, render_template, redirect, url_for, request
from flask_socketio import SocketIO, emit
from routes.hearts import hearts_bp

app = Flask(__name__)
socketio = SocketIO(app)

# Register blueprints
app.register_blueprint(hearts_bp, url_prefix='/hearts')

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
@app.route('/hearts/')
def playHearts():
	return render_template('hearts.html')

if __name__ == ('__main__'):
	# socketio.run(app, host = '127.0.0.1', port = '8080', debug = True)
	socketio.run(app, host = '0.0.0.0', port = '8080', debug = True)
	# app.run(host = '127.0.0.1', port = '8080', debug = True)
	# app.run(host = '0.0.0.0', port = '8080', debug = True)