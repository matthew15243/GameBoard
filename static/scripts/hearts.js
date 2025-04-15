createHeader()

document.addEventListener("DOMContentLoaded", function () {
    var socket = io();  // Connect to Flask-SocketIO server

    socket.on('update_players', function(players) {
        console.log("Active Players:", players);
        document.getElementById("players").innerHTML = "Active Players: " + (players.length > 0 ? players.join(", ") : "None");
    });
});

function deal() {
    console.log('Attempting to deal')
    fetch('/hearts/deal')
        .then(response => response.json())
        .then(data => console.log(data.cards))  // "Cards have been dealt"
        .catch(error => console.error("Error:", error));
}