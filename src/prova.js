import { default as config } from "./../config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

var mypos = {}

client.onYou( ( {id, name, x, y, score} ) => {
    mypos.id = id
    mypos.name = name
    mypos.x = Math.round(x)
    mypos.y = Math.round(y)
    mypos.score = score
    // console.log("mypos:", mypos.x, mypos.y)
})

var buchideldiavolo=[];
client.onTile((x,y,delivery)=>{
    if(delivery == true){
        buchideldiavolo.push([x,y])
    }
})

var objectives = [];

client.onParcelsSensing((parcels)=>{
    for(const parcel of parcels){
        //console.log("This is the parcel", [parcel.x, parcel.y])
        if (parcel.carriedBy == null && !isParcelAlreadyInObjectives(parcel.x, parcel.y)){
            if (isParcelAlreadyInObjectives(parcel.x, parcel.y)) {
                //console.log("Pacchetto che già esisteva in objectives")
            }
            //console.log("added parcel ", [parcel.x, parcel.y])
            objectives.push([parcel.x, parcel.y]);
        }
        else {
            //console.log("Non ho aggiunto il pacchetto")
        }
    }
    /*
    for (let i = 0; i < objectives.length; i++) {
        obj = objectives[i];
        let obj_x = obj[0];
        let obj_y = obj[1];
        let updated = false;
        for (var parcel in parcels) {
            if (parcel.x == obj_x && parcel.y == obj_y) {
                updated = true;
            }
        }
        if (!updated) {
            objectives = objectives.splice(i, 1);
        }
    }
    */
})


function isParcelAlreadyInObjectives(x, y) {
    for (let i = 0; i < objectives.length; i++) {
        var obj = objectives[i];
        let obj_x = obj[0];
        let obj_y = obj[1]; 
        //console.log("Current obj: ", obj_x, obj_y);
        //console.log("Parcel's coordinates: ", x, y);
        //console.log("Current obj's coordinates: ", obj_x, obj_y );
        if(obj_x === x && obj_y === y) {
            return true;
        }
    }
    return false;
}


async function gototile(x,y){
    console.log("Going to tile",x,y)

    while(mypos.x != x){
        client.timer(500);
        if(mypos.x < x){
            console.log("going right")
            while(!await client.move("right"));
            client.timer(500);

            // console.log("Moved");
        }
        else{
            console.log("going left")
            while(!await client.move("left"));
            client.timer(500);

            // console.log("Moved");
        }
    }

    while(mypos.y != y){
        client.timer(500);

        if(mypos.y != y){
            if(mypos.y < y){
                console.log("going up")
                while(!(await client.move("up"))){
                    client.timer(500);
                }
                console.log("Moved");
            }
            else{
                console.log("going down")
                while(!(await client.move("down"))){
                    client.timer(500);
                }
                console.log("Moved");
            }
        }
    }


}


function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}


function findclosestbuco(){
    var closest;
    var bestdistance = 10000000;
    for (var el of buchideldiavolo){
        // console.log("el:",el)
        var d = distance({x:mypos.x, y:mypos.y}, {x:el[0], y:el[1]});
        if(d<bestdistance){
            console.log("find new best")
            bestdistance=d;
            closest = el;
        }
    }
    return closest;
}


async function goputdown(){
    var buco = findclosestbuco();
    console.log("Going to buco:",buco);
    await gototile(buco[0], buco[1]);
    await client.putdown();
}

var directions = new Map([
    [0,"up"],
    [1,"down"],
    [2,"right"],
    [3,"left"]
]);

async function moove(dir,num){
    console.log("Mooving")
    let i=0;
    while(i<num){ 
        await client.move(dir)
        i+=1;
        // console.log("Mooved ",dir," ",i);
        await client.timer(500)
    }
}


while(1){
    console.log("Sono nel ciclo");

    while(objectives.length != 0){
        console.log("Objectives PRIMA del pop; lunghezza = ", objectives.length, objectives);
        await client.timer(2000);
        console.log("I have an objective!");
        var obj = objectives.shift();
        console.log("Objectives DOPO il pop; lunghezza = ", objectives.length, objectives);
        console.log("Objective:",obj);
        await gototile(obj[0], obj[1]);
        await client.pickup();
        await goputdown();
        console.log("Objectives alla FINE DEL CICLO ", objectives.length, objectives);
    }

    console.log("Trying to move");
    let d = Math.floor(Math.random()*4);
    await moove(directions.get(d), (Math.floor(Math.random()*5))+1);

}
