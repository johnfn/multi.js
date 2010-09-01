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


function generateUniqueID(){
    return generateUniqueID.last++;
}
generateUniqueID.last=0;

//(function(self) {
    var _fps = 20; // default FPS is 20.
    
    var Multi = {
        objects : [],
        updatesWaiting : [],
        client : undefined,
        FRAME_INTERVAL : 1000 / _fps,
        set FRAME_RATE(fps) {
            Multi.FRAME_INTERVAL = Math.floor(1000 / fps);
            _fps = fps;
        },
        get FRAME_RATE() {
            return _fps;
        },
        update : 
            function(json) { 
                var obj = JSON.parse(json);
                
                //sample obj : { ID : 5507, mousedown : true, 65 : true }
                
                updatesWaiting[obj.ID] = obj;
                delete updatesWaiting[obj.ID]["ID"];
            },
            
        receive : 
            function(json){
                console.log(json);

                var obj = JSON.parse(json);
                
                if (obj.type == "initialize"){
                    //instantly respond to any initialization requests
                    var response = {
                        ID                   : generateUniqueID(), 
                        isInitializeResponse : true
                    };
                    Multi.client.send(JSON.stringify(response));
                    
                    //also send the full current state of the game
                }
                
                if (obj.type == "update"){
                    Multi.update(json);
                }
                
            }

    }
    //self.Multi = Multi;
//})(this);


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



console.log('Listening on http://0.0.0.0:' + port );
