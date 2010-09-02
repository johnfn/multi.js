//setup Dependencies
require(__dirname + "/../lib/setup").ext( __dirname + "/../lib").ext( __dirname + "/../lib/express/support");
var connect = require('connect')
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
    , Multi = require('./lib/multi')
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
     */
    player : {},
    newPlayer :
        function(){
            GameLogic.player = {
                x  : 25,
                y  : 25,
            }; 

            Multi.addObject(GameLogic.player);
        },
    nextStep : 
        function(json){
            console.log("In nextStep");
            console.log(json);
            if (JSON.stringify(json) == '{}') return;

            GameLogic.player.x++;
        },
    initHandlers :
        function(){
            Multi.addEvent("init", GameLogic.newPlayer);
            Multi.addEvent("step", GameLogic.nextStep);
        }
};

GameLogic.initHandlers();



Multi.initialize(GameLogic);

//Setup Socket.IO
var io = io.listen(server);
io.on('connection', function(client){
	console.log('Client Connected');
    Multi.client=client;
	client.on('message', Multi.receive);
	client.on('disconnect', function(){
		console.log('Client Disconnected.');
	});
});

setInterval(Multi.timeStep, 50);


console.log('Listening on http://0.0.0.0:' + port );
