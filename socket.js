var socket = io.connect('ws://192.168.2.139:2520', {secure: false}); 

socket.on('connect',function() { 
    console.log('Klient har koblet til serveren'); 
});


socket.on('clientConnected',function(id, ip) {
    console.log('Klient ID: ' + id);
    console.log("Klient IP: " + ip);
});

//Tar imot data sendt fra ESP
socket.on('data', function(data) { 
    console.log('Data er mottatt: ' + data);
    pushMelding("SERVER", data);
});

//Henter og returnerer tidsstempel
function hentTidsstempel() {
    var d = new Date();
    //Formaterer dato til hh:mm:ss
    var dates = d.getHours() + ":" + ('0'+d.getMinutes()).slice(-2)+ ":" + ('0'+d.getSeconds()).slice(-2);
    return dates;
}

var holdStatus = 0;
var laasStatus = 0;

//Sender forespørsel om å åpne/lukke døren
function endreStatusDoor() {
    var status = document.getElementById("statusCheck"); //Henter checkboksen
    var statusP = document.getElementById("statusP");//Henter <p>elementet under knappen
    holdStatus = status.checked;//Setter boolean til samme status som checkboksen
    console.log('Dørhold har endret til status: ' + holdStatus);
    socket.emit('endreStatusDoor', holdStatus); //Sender forespørsel til server
    
    //Sjekker hvilken dør-status som skal sendes til server
    if(status.checked) {
        pushMelding("KLIENT", "Sendte forespørsel om å holde dør til server");
        statusP.innerHTML = "Status: Åpen";
    } else {
        pushMelding("KLIENT", "Sendte forespørsel om å ikke holde opp dør til server");
        statusP.innerHTML = "Status: Lukket";
    }
};

//Sender forespørsel om å låse døren
function endreLaasDoor() {
    var laas = document.getElementById("laasCheck"); //Henter checkboksen
    var laasP = document.getElementById("laasP"); //Henter <p>elementet under knappen
    laasStatus = laas.checked; //Setter boolean til samme status som checkboksen
    console.log('Dørlås har endret til status: ' + laasStatus);
    socket.emit('endreLaasDoor', laasStatus); //Sender forespørsel til server

    //Sjekker hvilken lås-status som skal sendes til server
    if(laas.checked) {
        pushMelding("KLIENT", "Sendte forespørsel om å låse dør til server");
        laasP.innerHTML = "Status: Låst";
    } else {
        pushMelding("KLIENT", "Sendte forespørsel om å låse opp dør til server");
        laasP.innerHTML = "Status: Åpen";
    }
};

//Kjører alle startup-funksjoner for siden (Starter kommunikasjon med ESP og fyller konsollen med meldinger)
function sideOnLoad() {
    pushMelding("KLIENT", "Konsollen er tilkoblet!");
    fyllKonsoll();
    foresporDataFraESP(1000);
}

//Pusher melding til sidens konsoll-array
function pushMelding(avsender, melding) {
    meldingArr1.push([hentTidsstempel(), ("["+avsender +"] "+ melding)]);
    fyllKonsoll();
};

//Oppdaterer konsollen med meldinger fra konsoll-array
function fyllKonsoll(){
    el = document.getElementById("botContainer");
    el.innerHTML = "";
    for(i = 0; i < meldingArr1.length; i++) {
        el.innerHTML += "<p class=\"melding\">" + meldingArr1[i][0] + " -> " + meldingArr1[i][1] + "</p><br>";
    };
    oppdaterScroll();
};

//Sørger for at fokuset er på siste linje i konsollen
function oppdaterScroll() {
    var el = document.getElementById("botContainer");
    el.scrollTop = el.scrollHeight;
};

//Starter henting av meldinger fra ESP
function foresporDataFraESP(intervall) {
    socket.emit('foresporDataFraESP', intervall); 
    console.log("foresporDataFraESP ble kalt med intervall: " + intervall);
} 

function stopDataFromBoard() { 
    socket.emit('stoppDataFraESP'); 
    console.log("stoppDataFraESP var kalt");
}
