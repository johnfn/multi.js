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
//(function(self) {
    var _fps = 20; // default FPS is 20.
    
    var Multi = {
        objects : [],
        updatesWaiting : [],
        Logic : undefined,
        client : undefined,
        oldState      : {},
        curState : {},

        FRAME_INTERVAL : 1000 / _fps,
        set FRAME_RATE(fps) {
            Multi.FRAME_INTERVAL = Math.floor(1000 / fps);
            _fps = fps;
        },
        get FRAME_RATE() {
            return _fps;
        },

        generateUniqueID : 
            function(){
                if (!Multi.generateUniqueID.last) Multi.generateUniqueID.last = 0;
                return ++Multi.generateUniqueID.last;
            },
        //generateUniqueID.last=1;

        events : {}, //Maps event names to callbacks
        /*
         * Currently only maps 1 callback to each event
         */
        addEvent : 
            function(type, callback){
                //if (type != "keydown" && type != "mousedown") return; //Add more later
                Multi.events[type] = callback;
            },
        /*
         * Instantly have the logic part register the update, but don't output it to users yet.
         */

        fireEvent :
            function(type, args){
                if (Multi.events[type]){
                    Multi.events[type].apply(undefined, args);
                }
            },

        /*
         * Alright, this is tricky. We store a reference to the object (since that is how 
         * JS operates anyways). Whenever our user updates the object, we become aware of 
         * this since we check our reference against the oldState.
         */
        addObject : 
            function(obj){
                //TODO to mitigate this error, we should use something like ___ID
                if (obj.ID){
                    console.log("The passed in object has an ID value, which is bad news.");
                }
                obj.ID = Multi.generateUniqueID();
                Multi.curState[obj.ID] = obj;
            },
        /*
         * Called whenever a client sends some input. Json - representation of that input.
         */
        update : 
            function(json) { 
                var obj = JSON.parse(json);
                
                //sample obj : { ID : 5507, mousedown : true, 65 : true }
                
                Multi.updatesWaiting[obj.ID] = obj;
                delete Multi.updatesWaiting[obj.ID]["ID"];
            },
        /*
         * Called when the client sends anything to the server.
         */
        receive : 
            function(json){
                var obj = JSON.parse(json);
                
                if (obj.type == "initialize"){
                    //instantly respond to any initialization requests
                    var response = {
                        ID                   : Multi.generateUniqueID(), 
                        isInitializeResponse : true
                    };
                    Multi.client.send(JSON.stringify(response));

                    Multi.fireEvent("init");
                    
                    //also send the full current state of the game
                }
                
                if (obj.type == "update"){
                    Multi.update(json);
                }
                
            },

        /*
         * Gets a diff in the objects in curState.
         */
        getDiff :
            function(){
                var diff = {};
                console.log("oldstate : " + JSON.stringify(Multi.oldState));
                for (ID in Multi.curState){
                    var thisObj = Multi.curState[ID];

                    if (! (ID in Multi.oldState)){
                        //This object was newly created, add it.
                        diff[ID] = thisObj;
                    } else {
                        for (key in thisObj){
                            if (Multi.oldState[ID][key] == thisObj[key]) 
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
                Multi.oldState = JSON.parse(JSON.stringify(Multi.curState));

                return diff;
            },

        /*
         * Alerts the Logic object that another x ms has passed, and it should update
         * all of it's objects. Then we figure out what was changed and send it to the
         * clients.
         */
        timeStep : 
            function() {
                if (Multi.debug){ 
                    //if (Multi.updatesWaiting != {})
                    //    console.log(Multi.updatesWaiting);
                }
                Multi.fireEvent("step", [Multi.updatesWaiting]);
                //Multi.Logic.nextStep(Multi.updatesWaiting);
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
