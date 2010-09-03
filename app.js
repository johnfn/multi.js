//setup Dependencies
require(__dirname + "/../lib/setup").ext( __dirname + "/../lib").ext( __dirname + "/../lib/express/support");
var connect = require('connect')
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
    , Multi = require('./lib/multi').Multi
    , port = 8081;

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.use(connect.bodyDecoder());
    server.use(connect.staticProvider(__dirname + '/static'));
    server.use(server.router);
});

server.listen(port);

/*
 * Sample logic for a game
 *
 * TODO the best way to handle this is through listeners.
 */
var GameLogic = {
    /*
     * We make a promise to always call newPlayer when a new player joins the game.
     *
     *
     */
    players : [],
    newPlayer :
        function(ID){
            var p = {
                x  : 25,
                y  : 25,
            }; 

            GameLogic.players[ID] = p;

            Multi.addObject(p);
        },
    /*
     * json passed in is a representation of what keys have been pressed.
     */
    nextStep : 
        function(json){
            console.log("In nextStep");
            console.log(json);
            if (JSON.stringify(json) == '{}' || JSON.stringify(json) == '[]') return;
            for (ID in json){
                GameLogic.players[ID].x++;
            }
        },
    initHandlers :
        function(){
            Multi.addEvent("init", GameLogic.newPlayer);
            Multi.addEvent("step", GameLogic.nextStep);
        }
};

GameLogic.initHandlers();


//Setup Socket.IO
var io = io.listen(server);
io.on('connection', function(client){
	console.log('Client Connected');
	client.on('message', Multi.receive);
	client.on('disconnect', function(){
		console.log('Client Disconnected.');
	});
});

Multi.client=io;
setInterval(Multi.timeStep, 50);


console.log('Listening on http://0.0.0.0:' + port );
