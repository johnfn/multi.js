var _fps = 20; // default FPS is 20.
var _fpsInterval = 1000 / _fps;
var _uid = 0;

exports.Multi = {
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
            this.events[type] = callback;
        },
    /*
     * Instantly have the logic part register the update, but don't output it to users yet.
     */

    fireEvent :
        function(type, args){
            if (this.events[type]){
                this.events[type].apply(undefined, args);
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
            obj.ID = this.generateUniqueID();
            this.curState[obj.ID] = obj;
        },
    /*
     * Called whenever a client sends some input. Json - representation of that input.
     */
    update : 
        function(json) { 
            var obj = JSON.parse(json);
            
            //sample obj : { ID : 5507, mousedown : true, 65 : true }
            
            this.updatesWaiting[obj.ID] = obj;
            delete this.updatesWaiting[obj.ID]["ID"];
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
                    ID                   : this.generateUniqueID(), 
                    isInitializeResponse : true
                };
                this.client.send(JSON.stringify(response));

                this.fireEvent("init");
                
                //also send the full current state of the game
            }
            
            if (obj.type == "update"){
                this.update(json);
            }
            
        },

    /*
     * Gets a diff in the objects in curState.
     */
    getDiff :
        function(){
            var diff = {};
            console.log("oldstate : " + JSON.stringify(this.oldState));
            for (ID in this.curState){
                var thisObj = this.curState[ID];

                if (! (ID in this.oldState)){
                    //This object was newly created, add it.
                    diff[ID] = thisObj;
                } else {
                    for (key in thisObj){
                        if (this.oldState[ID][key] == thisObj[key]) 
                            continue;
                        //this object has been updated; add it to the diff
                        if (!diff[ID]) diff[ID] = {};
                        diff[ID][key] = thisObj[key];
                    }
                }
            }
            
            //Copy over entire gamestate to oldstate
            for (var s in this.curState) {
                this.oldState[s] = this.curState[s];
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
            if (this.debug){ 
                //if (this.updatesWaiting != {})
                //    console.log(this.updatesWaiting);
            }
            this.fireEvent("step", [ this.updatesWaiting ]);
            //this.Logic.nextStep(this.updatesWaiting);
            console.log(this.getDiff());
            this.updatesWaiting = {};
        },
    
    initialize : 
        function(Logic){
            this.Logic = Logic;
        },

}