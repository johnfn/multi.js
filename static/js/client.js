/* Author: 

*/
var globals = {
    canv : undefined,
    context : undefined,
};

$(document).ready(function() {   
    globals.canv    = $('#canv')[0];
    globals.context = globals.canv.getContext('2d');


    MultiClient.initialize(function(objects){
        globals.context.clearRect(0,0,500,500);
        globals.context.fillStyle = "5555ff";
        for (var oID in objects){
            var obj = objects[oID];
            globals.context.fillRect(obj.x, obj.y, 10, 10);
        }
    });
});




