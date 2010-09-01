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
    debug   : true,
    ID      : -1,
    socket  : undefined,
    receive : 
        function(json) { 
            if (MultiClient.debug){
                //console.log("JSON received: " + json);
            }
            /* go through every object that we know about and update it */
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
                function(json){
                    var receivedObj = JSON.parse(json);

                    
                    if (!receivedObj.isInitializeResponse) return false; //discard any updates
                    
                    MultiClient.ID = receivedObj.ID;
                    
                    //destroy this function; set the default one instead
                    MultiClient.socket.removeEvent('message', this);
                    MultiClient.socket.addEvent('message', this.receive);
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
        globals.context.fillStyle = "5555ff";
        globals.context.fillRect(curPlayer.x, curPlayer.y, curPlayer.w, curPlayer.w);
       
    }, 50);

    MultiClient.initialize();
});




