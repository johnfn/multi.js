var MultiClient = {
    debug    : true,
    ID       : -1,
    initFunc : undefined,
    socket   : undefined,
    objects : {},
    receive : 
        function(json) { 
            if (MultiClient.debug){
                console.log("JSON received: " + json);
            }
            json = JSON.parse(json);

            //Update every object that we have a diff on.
            for (var oID in json){
                if (! (oID in MultiClient.objects)){
                    MultiClient.objects[oID] = {};
                }
                for (var key in json[oID]){
                    MultiClient.objects[oID][key] = json[oID][key];
                }
            }
        },

    initSocket : 
        function(){
           io.setPath('/client/')
           MultiClient.socket = new io.Socket(null, { 
               port       : 8081,
               transports : ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
           });
           MultiClient.socket.connect();
        },

    /*
     * Ask the server for a unique ID, and to create a new user.
     *
     * Pass in a function that should be run every x ms.
     */
    initialize : 
        function(func){
            MultiClient.initSocket();
            MultiClient.socket.send(JSON.stringify( {type:"initialize"} ));
            
            //A special 1 time function to obtain a unique ID from the server.
            MultiClient.socket.addEvent('message', 
                MultiClient.initFunc = function(json){
                    console.log(json);
                    var receivedObj = JSON.parse(json);

                    
                    if (!receivedObj.isInitializeResponse) return false; //discard any updates

                    //Add all created objects to Client.objects
                    for (var oID in receivedObj["state"]){
                        MultiClient.objects[oID] = receivedObj["state"][oID];
                    }
                    
                    MultiClient.ID = receivedObj.ID;
                    
                    //destroy this function; set the default one instead
                    MultiClient.socket.removeEvent('message', MultiClient.initFunc);
                    MultiClient.socket.addEvent('message', MultiClient.receive);

                    //A neat way to use closures in order to setInterval and pass in args too.
                    //
                    //The number of possible job interview questions in these 3 lines is STAGGERING.
                    setInterval(function (){
                        func(MultiClient.objects); 
                    }, 50);
                });


            /*
             * Start registering input
             */

            $(document).keydown(function(e){
                if (MultiClient.ID == -1) return; //Hasn't obtained ID from server yet.
                MultiClient.socket.send(JSON.stringify(
                        {
                            ID   : MultiClient.ID,
                            keys : e.which,
                            type : "update",
                        }
                )); 
            });

        },


};
