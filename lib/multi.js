var _fps = 20; // default FPS is 20.
var _fpsInterval = 1000 / _fps;
var _uid = 0;

Multi = exports.Multi = {
    objects : [],
    updatesWaiting : [],
    Logic : undefined,
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
            
            //Copy over entire gamestate to oldstate
            for (var s in Multi.curState) {
                Multi.oldState[s] = Multi.curState[s];
            }

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
            Multi.fireEvent("step", [ Multi.updatesWaiting ]);
            //Multi.Logic.nextStep(Multi.updatesWaiting);
            console.log(Multi.getDiff());
            Multi.updatesWaiting = {};
        },
    
    initialize : 
        function(Logic){
            Multi.Logic = Logic;
        },

}
