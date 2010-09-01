/* Author: 

*/
var canv, context, socket;

var curPlayer= {
    x : 50,
    y : 50,
    w : 15,
};
var Client = {
    ID : -1,
    receive : function(json) { 
        console.log(json);
        /* go through every object that we know about and update it */
    }
};

function initialize(){
    //Ask the server for a unique ID and to create a new user
    socket.send(JSON.stringify( {type:"initialize"} ));
    
    //A special 1 time function
    socket.addEvent('message', 
        function(json){
            var receivedObj = JSON.parse(json);
            
            if (!receivedObj.isInitializeObject) return false; //discard any updates
            
            Client.ID = receivedObj.ID;
            
            //destroy this function; set the default one instead
            socket.removeEvent('message', this);
            socket.addEvent('message', Client.receive);
        });
}

$(document).ready(function() {   
    canv    = $('#canv')[0];
    context = canv.getContext('2d');


   io.setPath('/client/');
   socket = new io.Socket(null, { 
     port: 8081
     ,transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
   });
   socket.connect();

    
   socket.on('message', function(data){
       console.log(data);
   });

   $(document).keydown(function(e){
        socket.send(e.which); 
   });
      

   setInterval(function(){
        context.fillStyle = "5555ff";
        context.fillRect(curPlayer.x, curPlayer.y, curPlayer.w, curPlayer.w);
       
   }, 50);

   initialize();
});




