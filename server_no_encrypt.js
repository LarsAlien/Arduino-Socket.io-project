var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();

var serverPort = 2520;

var server = http.createServer(app);
var io = require('socket.io').listen(server); //Starter WebSocket protokollen

//HTTP Server
server.listen(serverPort, function () { 
    console.log('Hører på *:' + serverPort);
});

io.on('connection', function (socket) {
    console.log('en bruker koblet til');

    var clientID = socket.id;
    var client = io.sockets.connected[clientID];
    console.log("Bruker ID: " + clientID);

    //Henter IP-adressen til maskinen som koblet seg til
    var clientIPRAW = client.request.connection.remoteAddress;

    var IPArr = clientIPRAW.split(":", 4); //Reformaterer IP-adresse
    console.log("Bruker IP: " + IPArr[3]);

    io.emit("clientConnected", clientID, IPArr[3]);

    client.on('disconnect', function () { 
        console.log("bruker " + clientID + " koblet fra, stopper timere hvis finnes");

        for (var i = 0; i < timers.length; i++) { 
            clearTimeout(timers[i]); 
        }

    });

    /*
    Lager to funksjoner der den første kan låse opp og låse igjen døren fra websiden
    og den andre vil holde døren kosntant låst, og RFID brikker vil ikke fungere
    */

    //Skal hindre bruk av RFID ved toggle
    //Denne holder døren konstant låst
    socket.on('endreLaasDoor', function (status) {
        console.log('Dørlås har status: ' + status);
        io.emit('endreLaasDoor', status);
    });

    //Denne holder døren i den posisjonen den er i (Åpen eller lukket)
    socket.on('endreStatusDoor', function (status) {
        console.log('Dør hold har status: ' + status);
        io.emit('endreStatusDoor', status);
    });

    var timers = []; //Lagrer alle timere
    //Loop for å hente data fra ESP på et satt intervall
    socket.on('foresporDataFraESP', function (intervall) {

        console.log('bruker ' + clientID + ' forespurte data med intervall (ms): ' + intervall);

        if (interval > 99) { 
            timers.push( 
                setInterval(function () { 
                    io.emit('dataForesporsel', 0); 
                }, intervall)
            );
        } else {
            console.log("for kort tidsintervall");
        }


    });

    //Stopper henting av data
    socket.on('stoppDataFraESP', function () { 
        console.log('Bruker ' + clientID + ' stoppet henting av data');

        for (var i = 0; i < timers.length; i++) {
            clearTimeout(timers[i]); //Stopper timerne
        }

    });

    //Tar imot data fra ESP og kaster videre til alle klienter
    socket.on('meldingFraESP', function (data) { 
        io.emit('data', data); 
        console.log('Bruker ' + clientID + ' fikk data: ' + data);

    });
});