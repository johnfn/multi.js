var io = require('socket.io-node');
var _fps = 20; // default FPS is 20.
var _fpsInterval = 1000 / _fps;
var _uid = 0;

/*
 * Checks if a JS object is empty
 */
function isEmpty(o){
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}

var Multi = exports.Multi = {
    updatesWaiting : [],
    client : undefined,
    oldState : {},
    curState : {},

    set FRAME_RATE(fps) {
        _fpsInterval = Math.floor(1000 / fps);
        _fps = fps;
    },
    get FRAME_RATE() {
        return _fps;
    },
    // read-only
    get FRAME_INTERVAL() {
        return _fpsInterval;
    },

    generateUniqueID : 
        function(){
            return ++_uid;
        },

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

    /*
     * Triggered whenever another function should trigger an event.
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
    broadcast : 
        function (stuff){
            var index = Multi.client.clientsIndex;
            for (c in index) {
                var client = index[c];
                if (client) {
                    //client.broadcast(message);
                    client.send(stuff);
                }
            }


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
                var thisID = Multi.generateUniqueID();
                
                Multi.fireEvent("newuser", [thisID]); //Allow Logic to create any users before response

                //instantly respond to any initialization requests
                var response = {
                    ID                   : thisID, 
                    state                : Multi.curState,
                    isInitializeResponse : true
                };
                Multi.broadcast(JSON.stringify(response));
                //Multi.client.send(JSON.stringify(response));

                
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
            for (ID in Multi.curState){
                var thisObj = Multi.curState[ID];

                if ( !(ID in Multi.oldState)){
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
            
            //Copy over entire gamestate to oldstate
            //
            Multi.oldState = JSON.parse(JSON.stringify(Multi.curState));
            return diff;
        },

    /*
     * Alerts the Logic object that another x ms has passed via events.
     * Then we figure out what was changed and send it to the clients.
     */
    timeStep : 
        function() {
            if (Multi.debug){ 
                //if (Multi.updatesWaiting != {})
                //    console.log(Multi.updatesWaiting);
            }

            if (JSON.stringify(Multi.updatesWaiting) == '{}' || JSON.stringify(Multi.updatesWaiting) == '[]') return;
            Multi.fireEvent("input", [ Multi.updatesWaiting ]);
            //Multi.Logic.nextStep(Multi.updatesWaiting);
            var diff = Multi.getDiff();

            if (!isEmpty(diff)){ //getDiff returns false on empty object
                Multi.broadcast(JSON.stringify(diff));
                //Multi.client.send(JSON.stringify(diff));
                console.log("broadcasting " + JSON.stringify(diff));
            }

            Multi.updatesWaiting = {};
        },

    init : 
        function(server) {

            //Setup Socket.IO
            var sock = io.listen(server);
            sock.on('connection', function(client){
                console.log('Client Connected');
                client.on('message', Multi.receive);
                client.on('disconnect', function(){
                    console.log('Client Disconnected.');
                });
            });


            Multi.client=sock;
            setInterval(Multi.timeStep, 50);
        },

}
