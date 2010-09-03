/* Author: 

*/
var globals = {
    canv : undefined,
    context : undefined,
};
//var canv, context;

var curPlayer= {
    x : 50,
    y : 50,
    w : 15,
};
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

    /*
     * Should be made private?
     */
    __initSocket : 
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
     */
    initialize : 
        function(){
            MultiClient.__initSocket();
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
                });


            /*
             * Start registering input
             */

            $(document).keydown(function(e){
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


$(document).ready(function() {   
    globals.canv    = $('#canv')[0];
    globals.context = globals.canv.getContext('2d');

    setInterval(function(){
        globals.context.clearRect(0,0,500,500);
        globals.context.fillStyle = "5555ff";
        for (var oID in MultiClient.objects){
            var obj = MultiClient.objects[oID];
            globals.context.fillRect(obj.x, obj.y, 10, 10);
        }
       
    }, 50);

    MultiClient.initialize();
});




