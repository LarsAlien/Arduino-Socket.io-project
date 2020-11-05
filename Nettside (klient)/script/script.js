//Start with defining all the key elements on the webpage.
//What we are doing here is putting the HTML element/tag into an actual variable/object in the "functions-language" JavaScript
var keyW = document.getElementById("w"); //Here the variable kalled "keyW" is equal to the element in the HTML file with ID "w"
var keyA = document.getElementById("a");
var keyS = document.getElementById("s");
var keyD = document.getElementById("d");

document.onkeypress = function(event) { //This checks constantly if, while on the webpage, the user presses down a button
    keyDown(event); //If a user does press down a button the "event" variable fetches which button it is and passes it to the function "keyDown" as an argument
};

document.onkeyup = function(event) { //This checks constantly if, while on the webpage, the user lets go of a button (it goes up and not down)
    keyUp(event); //If a user does let go of the button the "event" variable fetches which button it is and passes it to the function "keyUp" as an argument
};

var btnPressed = false; //Variable to track if the user is currently pressing down a button

function keyDown(event) { //This function performs certain actions when a user presses down certain buttons

    var key = event.key; //Gets the key on the keyboard to check if something should be done

    if(!btnPressed) { //If any other button is not allready pressed, continue

        //w-tast
        if (key == "w" || key == "W") { //Check if the key "w" is pressed, here we have to check of the small and capital letter because they are not the same
            keyW.style.color = "white"; //Use JavaScript to alter the style (in this case text color)
            keyW.style.backgroundColor = "#00509e"; //Use JavaScript to alter the style (in this case background color)
            btnPressed = true; //Set button pressed to true so that no other button can be pressed
            
            changeLEDState(1);
        }

        //a-tast
        if (key == "a" || key == "A") { //Same logic as earlier
            keyA.style.color = "white";
            keyA.style.backgroundColor = "#00509e";
            btnPressed = true;
        }

        //s-tast
        if (key == "s" || key == "S") {
            keyS.style.color = "white";
            keyS.style.backgroundColor = "#00509e";
            btnPressed = true;
        }

        //d-tast
        if (key == "d" || key == "D") {
            keyD.style.color = "white";
            keyD.style.backgroundColor = "#00509e";
            btnPressed = true;
        }

        //Mellomrom
        if (key == " ") {
            console.log("Mellomrom er trykket"); //Console.log can be used for debugging, much like serial.print in Arduino
            btnPressed = true;

        }
    }

}

function keyUp(event) { //Same logic as earlier, just that in this case we check if the button is let go (go upwards)

    var key = event.key;

    //W-tast
    if(key == "w" || key == "W") {
        keyW.style.color = "#00509e";
        keyW.style.backgroundColor = "white";
    }

    //A-tast
    if(key == "a" || key == "A") {
        keyA.style.color = "#00509e";
        keyA.style.backgroundColor = "white";
    }

    //S-Tast
    if(key == "s" || key == "S") {
        keyS.style.color = "#00509e";
        keyS.style.backgroundColor = "white";
    }

    //D-tast
    if(key == "d" || key == "D") { //All of these specific key functions only alter the webpage element
        keyD.style.color = "#00509e";
        keyD.style.backgroundColor = "white";
    }

    btnPressed = false;
    console.log("Knapp er sluppet, stopper LED");
    changeLEDState(0);
}
