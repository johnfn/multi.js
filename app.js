//setup Dependencies
require(__dirname + "/../lib/setup").ext( __dirname + "/../lib").ext( __dirname + "/../lib/express/support");
var connect = require('connect')
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
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
     * Should be stored in Multi, not here.
     */
    oldState      : {},
    publicObjects : {},
    addPlayer :
        function(ID){
            if (ID in GameLogic.publicObjects){
                console.log("MASSIVE ERROR: non-unique ID");
            }
            GameLogic.publicObjects[ID] = {
                x  : 25,
                y  : 25,
                ID : ID,
            }; 
        
        },
    nextStep : 
        function(json){
            if (JSON.stringify(json) == '{}') return;
            for (ID in json){
                GameLogic.publicObjects[ID].x++;
            }
        },
};

function generateUniqueID(){
    return generateUniqueID.last++;
}
generateUniqueID.last=1;

//(function(self) {
    var _fps = 20; // default FPS is 20.
    
    var Multi = {
        objects : [],
        updatesWaiting : [],
        Logic : undefined,
        client : undefined,

        FRAME_INTERVAL : 1000 / _fps,
        set FRAME_RATE(fps) {
            Multi.FRAME_INTERVAL = Math.floor(1000 / fps);
            _fps = fps;
        },
        get FRAME_RATE() {
            return _fps;
        },

        events : {}, //Maps event names to callbacks

        /*
         * Currently only maps 1 callback to each event
         */
        addEvent : 
            function(type, callback){
                if (type != "keydown" && type != "mousedown") return; //Add more later
                events[type] = callback;
            },
        /*
         * Instantly have the logic part register the update, but don't output it to users yet.
         */

        update : 
            function(json) { 
                var obj = JSON.parse(json);
                
                //sample obj : { ID : 5507, mousedown : true, 65 : true }
                
                Multi.updatesWaiting[obj.ID] = obj;
                delete Multi.updatesWaiting[obj.ID]["ID"];
            },
            
        receive : 
            function(json){
                var obj = JSON.parse(json);
                
                if (obj.type == "initialize"){
                    //instantly respond to any initialization requests
                    var response = {
                        ID                   : generateUniqueID(), 
                        isInitializeResponse : true
                    };
                    Multi.client.send(JSON.stringify(response));

                    Multi.Logic.addPlayer(response.ID);
                    
                    //also send the full current state of the game
                }
                
                if (obj.type == "update"){
                    Multi.update(json);
                }
                
            },

        /*
         * Gets a diff in the objects in Logic.publicObjects to send over to the server
         */
        getDiff :
            function(){
                var diff = {};
                console.log("oldstate : " + JSON.stringify(Multi.Logic.oldState));
                for (ID in Multi.Logic.publicObjects){
                    var thisObj = Multi.Logic.publicObjects[ID];

                    if (! (ID in Multi.Logic.oldState)){
                        //This object was newly created, add it.
                        diff[ID] = thisObj;
                    } else {
                        for (key in thisObj){
                            if (Multi.Logic.oldState[ID][key] == thisObj[key]) 
                                continue;
                            //this object has been updated; add it to the diff
                            if (!diff[ID]) diff[ID] = {};
                            diff[ID][key] = thisObj[key];
                        }
                    }
                }
                
                //Copy over entire gamestate to oldstate via JQuery clone
                //
                //TODO; this isn't a very efficient way of copying an object.
                Multi.Logic.oldState = JSON.parse(JSON.stringify(Multi.Logic.publicObjects));

                return diff;
            },

        timeStep : 
            function() {
                if (Multi.debug){ 
                    //if (Multi.updatesWaiting != {})
                    //    console.log(Multi.updatesWaiting);
                }
                Multi.Logic.nextStep(Multi.updatesWaiting);
                console.log(Multi.getDiff());
                Multi.updatesWaiting = {};
            },
        
        initialize : 
            function(Logic){
                Multi.Logic = Logic;
            },

    }
    //self.Multi = Multi;
//})(this);


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
