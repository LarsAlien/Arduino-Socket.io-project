var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express(); 

var serverPort = 2520; 

var server = http.createServer(app); 
var io = require('socket.io').listen(server); //Starter WebSocket protokollen

//HTTP Server
server.listen(serverPort, function(){ //Here we tell the server to start listening (open) on the port we earlier defined
    console.log('listening on *:' + serverPort);
});

io.on('connection', function(socket){ //This is the server part of the "what happens when we first connect" function. Everytime a user connects a instance of this is set up for the user privatley
    console.log('a user connected'); //The server print this message

    //Client ID needs to be fetched
    var clientID = socket.id; //This is the actual clientID in alphanumeric characters (a string variable)
    var client = io.sockets.connected[clientID]; //This is the client object, each client has its own object (again like in Arduino declaring a object)
    //client.emit("clientConnected", clientID); THIS SHOULDNT BE HERE I THINK
    console.log("User ID: " + clientID);

    //Client IP
    var clientIPRAW = client.request.connection.remoteAddress; //Fetch the IP-address of the client that just connected

    var IPArr = clientIPRAW.split(":",4); //Split it, which is to say reformat the fetched data
    console.log("User IP: " + IPArr[3]); //Print out the formated IP-address

    io.emit("clientConnected", clientID, IPArr[3]); //Now we can use our custom defined "on connection" function to tell the client its ID and IP-address

    //Disconnect protocol
    client.on('disconnect', function(){ //This function is called for a client when the client is disconnected. The server can then do something even tough the client is disconnected
        console.log("user " + clientID + " disconnected, stopping timers if any");

        for (var i = 0; i < timers.length; i++) {//clear timer if user disconnects
            clearTimeout(timers[i]); //Cleartimer is the same as stopping the timer, in this case we clear all possible timers previously set
        }

    });

    //Change states (general user defined functions)
    socket.on('changeLEDState', function(state) { //This server function constantly checks if a client (webpage) calls its
        //If the webpage calles it it will us the "io.emit" (to send to alle clients) and not "client.emit" to only send to one client
        //In this way, when we send it to call clients, the ESP32 will get the message. It is an easy solution which can be made better

        io.emit('LEDStateChange', state); //This is the actual socket.io emit function
        console.log('user ' + clientID + ' changed the LED state to: ' + state);

    });
    /*
    Lager to funksjoner der den første kan låse opp og låse igjen døren fra websiden
    og den andre vil holde døren kosntant låst, og RFID brikker vil ikke fungere
    */

    //Skal hindre bruk av RFID ved toggle
    //Denne holder døren konstant låst
    socket.on('endreLaasDoor', function(status) {
        console.log('Dørlås har status: ' + status);
        io.emit('endreLaasDoor', status);
    });

    //Denne holder døren i den posisjonen den er i (Åpen eller lukket)
    socket.on('endreStatusDoor', function(status) {
        console.log('Dør hold har status: ' + status);
        io.emit('endreStatusDoor', status);
    });

    var timers = []; //Stores all our timers
    //Read data from board section

    socket.on('requestDataFromBoard', function(interval) {
        
        console.log('user ' + clientID + ' requested data with interval (ms): ' + interval);

        if(interval > 99) { //if the timeinterval is not more than 100ms it does not allow it to start
            timers.push( //If an actual argument is given (a time period) it starts the timer and periodically calls the function
                setInterval(function(){ //If an actual argument is given (a time period) it starts the timer and periodically calls the function
                    io.emit('dataRequest', 0); //Send "dataRequest" command/function to all ESP32's
                }, interval)
            );
        } else {
            console.log("o short timeintervall");
        }


    });

    socket.on('stopDataFromBoard', function() { //This function stops all the timers set by a user so that data will no longer be sent to the webpage
        console.log('user ' + clientID + ' cleared data request interval');

        for (var i = 0; i < timers.length; i++) {//For loop to clear all set timers
            clearTimeout(timers[i]); //Cleartimer is the same as stopping the timer, in this case we clear all possible timers previously set
        }

    });

    var forrigeMelding = "";
    socket.on('meldingFraESP', function(data) { //This is function that actually receives the data. The earlier one only starts the function.
        
        io.emit('data', data); //Everytime a "dataFromBoard" tag (with data) is sent to the server, "data" tag with the actual data is sent to all clients
        //This means the webbrowser will receive the data, and can then graph it or similar.
        console.log('user ' + clientID + ' gained the data: ' + data);

    });

    socket.on('mottaMelding', function(melding) {
        io.emit('melding', melding);

        console.log('Mottatt melding fra ESP: '+ melding);
    });
});