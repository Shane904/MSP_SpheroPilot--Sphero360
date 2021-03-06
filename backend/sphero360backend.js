"use strict";

/* eslint no-use-before-define: 0 */

//Requires
var sphero = require("sphero");
var net = require("net");

//Set the port you want to connect to!
var orb = sphero("COM6");

//Try to connect to Sphero.
orb.connect(listen);

var speed = 0;
var direction = 0;
var color = 0;
var stopRoll = false;

var writeSocket;

//Runs once connected to Sphero.
function listen() {
	
	
	//Turn on the blue taillight so we know what the back of the Sphero is.
	orb.setBackLed(127);

	//Create server to connect to.
	var server = net.createServer(function(socket) {
		writeSocket = socket;
		//Activates when data is received
		socket.on('data', function (data) {
			
			//Make it a string.
			data = data + "";
			
			handleCommand(data);
		});
	});

	//Start server
	server.listen(9000, '127.0.0.1');

	//Make it so that the orb lets us know if it runs into something
	orb.detectCollisions();

	//When the orb runs into something...
	orb.on("collision", function(data) {
		console.log("collision detected");

		//Turn it to a dark collor
		orb.color("#000000");

		//Try to tell the front end to rumble.
		try
		{
			writeSocket.write('{"rumble":1.0}\0');
		}
		catch(ex)
		{
			console.log(ex);
		}
		
		//Return the color of the orb to the original color after some time
		setTimeout(function() {
			orb.color(color);
		}, 200);
	});
}

//Handles when input from frontend is received
function handleCommand(c)
{	
	//Sometimes more than one message comes through at a time, so split it up...
	var commands = c.split("}");
	
	//Run for each command. length - 1 because the last will be empty.
	for(var i = 0; i < commands.length - 1; i++)
	{
		//Since we removed the } with split
		commands[i] += "}";
		
		//Parse the JSON we got.
		var commandObject = JSON.parse(commands[i]);
		
		if(commandObject.hasOwnProperty('speed'))
		{
			speed = commandObject.speed;
		}
		if(commandObject.hasOwnProperty('direction'))
		{
			direction = commandObject.direction;
		}
		
		if(commandObject.hasOwnProperty('color'))
		{
			color = commandObject.color;
			console.log("Color: " + color);
			orb.color(commandObject.color);
		}
		
		stopRoll = false;
		if(commandObject.hasOwnProperty('stopOrb'))
		{
			if(commandObject.stopOrb)
			{
				orb.roll(0, direction, 0);
				stopRoll = true;
			}
		}
		
		
		if(!stopRoll)
		{
			//Output to log
			console.log("RECEIVED FROM FRONTEND: Speed: " + speed + "; Direction: " + direction);
		}
	}
	
	
	
	
	if(!stopRoll)
	{
		//Output to log
		console.log("SENDING TO SPHERO: Speed: " + speed + "; Direction: " + direction);
		
		//Let's roll!
		orb.roll(speed, direction);
	}
}