// setup dependencies
require.paths.unshift(__dirname + "/lib", __dirname + "/lib/express/support");
var connect = require('connect')
    , express = require('express')
    , sys = require('sys')
    //, 
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
     */
    players : [],
    newUser :
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
     *
     * IDs of the player who pressed it are paired with which keys are pressed.
     */
    inputEvent : 
        function(json){
            for (ID in json){
                GameLogic.players[ID].x++;
            }
        },
};

Multi.addEvent("newuser", GameLogic.newUser);
Multi.addEvent("input", GameLogic.inputEvent);

Multi.init(server);


console.log('Listening on http://0.0.0.0:' + port );
