#include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly

#include <WiFi.h>//Imports the needed WiFi libraries
#include <WiFiMulti.h> //We need a second one for the ESP32 (these are included when you have the ESP32 libraries)
#include <Servo_ESP32.h> //Servo
#include <dummy.h>  //For at koden skal klare å laste opp, må dette ESP32 biblioteket være med.
#include <MFRC522.h> //RFID
#include <MFRC522Extended.h> //RFID
#include <SPI.h>// RFID komunikasjon
#include <WiFiClient.h> //ESP32
#include <BlynkSimpleEsp32.h> //ESP32
#include "time.h" //Bibliotek for bruk til å få tid inn på BLYNK.
#include "string.h"


#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets

#define SS_PIN 21  
#define RST_PIN 15
#define blaa_LED 22
#define gul_LED 16
#define SERVO_PIN 33


MFRC522 rfid(SS_PIN, RST_PIN);
Servo_ESP32 servo;  

int My_RFID_Tag[5] = {59, 21, 175, 21, 0};

//Variabel som holder state for Mitt_Kort
bool Mitt_Kort = false;  

//Overstyrer lås, kan ikke åpnes eller lukkes med RFID
bool hold_door = false; 
//Låser døra, RFID kan ikke åpne døra
bool lock_door = false; 


SimpleTimer timer; //mulig denne kom fra blynkbiblotek 

WiFiMulti WiFiMulti; //Starter en instans med Wifimulti-biblioteket
SocketIoClient webSocket; //Starter en instans med SocketIoClient

void event(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload);
}

/*
 Lager to funksjoner der den første kan låse opp og låse igjen døren fra websiden
 og den andre vil holde døren kosntant låst, og RFID brikker vil ikke fungere
 */
void endreStatusDoor(const char * doorStatusData, size_t length)
  {
    Serial.printf("Dør status: %s\n", doorStatusData); //Data blir formatert med "printf"-kommandoen
    Serial.println(doorStatusData);

    String dataString(doorStatusData); //First we convert the const char array(*) to a string in Arduino (this makes thing easier)
    int doorStatus = dataString.toInt();
    
    //Hvis knappen på BLYNK er trykket ned vil låsen åpne seg før den trykkes på nytt.
    if (doorStatus == 1) { 
      servo.write(180);
      hold_door = true;       
    }
    if(doorStatus == 0) {
      hold_door = false;

    }
  }

//Setter state for "lock_door" til "!lock_door"
//Skal hindre bruk av RFID ved toggle
//Denne holder døren konstant låst
void endreLaasDoor(const char * laasDoorStatusData, size_t length)
{
  Serial.printf("Dør låst status: %s\n", laasDoorStatusData); //First we print the data formated with the "printf" command
  Serial.println(laasDoorStatusData);

    String dataString(laasDoorStatusData); //First we convert the const char array(*) to a string in Arduino (this makes thing easier)
    int doorLaasStatus = dataString.toInt();
  if (doorLaasStatus == 1) {
    
    lock_door = true;     
  }
  if(doorLaasStatus == 0) {
    
    lock_door = false;
  }
}

char nyesteMelding[15];
bool nyMelding = 0;

void sendMelding(const char* melding) {
    //webSocket.emit("mottaMelding", melding);
    strncpy(nyesteMelding,melding,15);
    Serial.println(melding);
    nyMelding = 1;
}

void dataForesporsel(const char * DataRequestData, size_t length) {//This is the function that is called everytime the server asks for data from the ESP32
  Serial.printf("Datarequest Data: %s\n", DataRequestData);
  Serial.println(DataRequestData);

  //Data conversion
  String dataString(DataRequestData);
  int RequestState = dataString.toInt();

  Serial.print("This is the Datarequest Data in INT: ");
  Serial.println(RequestState);

  if(RequestState == 0) { //If the datarequest gives the variable 0, do this (default)
    
    //char str[10]; //Decalre a char array (needs to be char array to send to server)
    //itoa(analogRead(27), str, 10); //Use a special formatting function to get the char array as we want to, here we put the analogRead value from port 27 into the str variable
    //str = nyesteMelding;
    Serial.println(nyesteMelding);
    if(nyMelding == 1) {
      webSocket.emit("meldingFraESP", nyesteMelding); //her er data sendt til server, som blir sendt til websiden
    }
    //Str indicates the data that is sendt every timeintervall, you can change this to "250" and se 250 be graphed on the webpage
    nyMelding = 0;
  }
}

void setup() {
    Serial.begin(115200); //Start the serial monitor

    Serial.setDebugOutput(true); //Set debug to true (during ESP32 booting)

    Serial.println();

    pinMode(blaa_LED, OUTPUT);
    pinMode(gul_LED, OUTPUT);

    servo.attach(SERVO_PIN);

    for(uint8_t t = 4; t > 0; t--) { //More debugging
        Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
        Serial.flush();
        delay(1000);
    }
    
    SPI.begin();   
    // Initialiser MFRC522 kort             
    rfid.PCD_Init();        
    //Setter intervallet for timeren som kaller på "oppdag RFID"
    timer.setInterval(1000L, iot_rfid);

    WiFiMulti.addAP("Inteno-867F", "XE4ZS5SST7K4SV"); //Add a WiFi hotspot (addAP = add AccessPoint) (put your own network name and password in here)

    while(WiFiMulti.run() != WL_CONNECTED) { //Here we wait for a successfull WiFi connection untill we do anything else
      Serial.println("Ikke koblet til wifi...");
        delay(100);
    }

    Serial.println("WiFi tilkoblet."); //When we have connected to a WiFi hotspot

    //Here we declare all the different events the ESP32 should react to if the server tells it to.
    //a socket.emit("identifier", data) with any of the identifieres as defined below will make the socket call the functions in the arguments below
    webSocket.on("clientConnected", event); //For example, the socket.io server on node.js calls client.emit("clientConnected", ID, IP) Then this ESP32 will react with calling the event function
    webSocket.on("endreLaasDoor", endreLaasDoor);
    webSocket.on("endreStatusDoor", endreStatusDoor);

    //Send data til server/webpage
    webSocket.on("dataForesporsel", dataForesporsel); //Listens for the command to send data

    webSocket.begin("192.168.2.139", 2520); //This starts the connection to the server with the ip-address/domainname and a port (unencrypted)
}


void loop() {
  webSocket.loop(); //Keeps the WebSocket connection running 
  //DO NOT USE DELAY HERE, IT WILL INTERFER WITH WEBSOCKET OPERATIONS
  //TO MAKE TIMED EVENTS HERE USE THE millis() FUNCTION OR PUT TIMERS ON THE SERVER IN JAVASCRIPT

  timer.run();
}

void iot_rfid(){
     
    //Først antas at oppdaget kort(Eller tag) er Mitt_Kort, 
    //Senere sjekker vi om det er Mitt_Kort eller ikke 
    Mitt_Kort = true; 
    /*lcd.clear();
    lcd.print("Presenter");
    lcd.setCursor(0,1);
    lcd.print("ID kort");*/

    // IF  statementen sjekker om døren er overstyrt av app og om det er tilatt med bruk av RFID brikke.
    if(lock_door == false && hold_door == false){ 
      servo.write(0); //setter servor til låst             
   
    if(  rfid.PICC_IsNewCardPresent())
    {
        /*hvis RFID tag er oppdaget, sjekk for unik ID,
        Og print til "Serial Window". Dette kan brukes for å legge til nye RFID kort.
        Her vil også koden hente ut tiden fra NTP server slik at dette senere kan
        printes til terminalvindu på BLYNK. Hvis den ikke klarer å hente tiden, 
        vil det komme en feilmelding i serial monitor.
        */
        if( rfid.PICC_ReadCardSerial() )
        {   
    
        //Unik ID er et 5 siffer nummer.
            for( int i = 0; i < 5; i++ )
            {
                Serial.print(rfid.uid.uidByte[i]);
                Serial.print(" ");              
                //lcd.print(rfid.uid.uidByte[i]);
                //lcd.print(" ");                            
            }  
            delay(500);
            
        //Sammenligner RFID tag unik ID med din My_RFID_Tag's unike ID
            for(int i = 0; i < 5; i++)
            {   
                //Hvis en av Unik ID sifferene ikke matcher
                //sett Mitt_kort til false og gå ut av loop
                //Ikke noe vits å sjekke alle sifferene
                if( My_RFID_Tag[i] !=  rfid.uid.uidByte[i] )
                {
                  Mitt_Kort = false;
                  break;                
                }           
            }
            Serial.println(); 
            delay(100); 

            //Hvis RFID Tag er Mitt_Kort, åpne lås
            //Hvis ikke, ikke lukk opp lås
            if(Mitt_Kort)
            {
              //Sender informasjon til BLYNK app om hvem som har åpnet døren, dato og klokkeslett.
              //Blynk.virtualWrite(V2,"\nFredrik ",asctime(&timeinfo)); ----------------------------------------------------
              sendMelding("\"Fredrik\"");
                            
              
              //Skru på grønn LED som en indikasjon på at tilgang er gitt
              //til å gå inn i rom
              digitalWrite(gul_LED,HIGH);
              delay(100);            

              //Nå, åpne døra med servo Motoren og la den holde seg åpen i 10 sekunder før den lukker seg.
              
              servo.write(180);            
              delay(10000);        
              servo.write(0);                   
              digitalWrite(gul_LED,LOW); //skrur av det grønne lyset som indikasjon på at dør er låst
              delay(2000);                       
            }
            
            /*Hvis RFID Tag ikke er Mitt_Kort
            Ikke åpne døra og Skru på rød LED. 
            Samtidig sendes det en melding til BLYNK app om at noen har forsøkt tilgang.
            Den røde LED vil blinke syv ganger
            */
            
            else
            {            
              //Blynk.virtualWrite(V2,"\nUkjent kort, ingen tilgang  ",asctime(&timeinfo)); //Sender info og tid til BLYNK--------------------------------------
              sendMelding("\"Ukjentkort\"");

              for(int i = 0; i < 7; i++)
              {
                digitalWrite(blaa_LED,HIGH);
                delay(500);              
                digitalWrite(blaa_LED,LOW);
                delay(500);              
              }
              delay(1000);            
            }                 
        }      
    }
  //Setter RFID leseren i pause, helt til den ikke oppdager en RFID Tag igjen
    rfid.PICC_HaltA();
    }
}  