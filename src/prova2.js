import { default as config } from "./../config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

var mypos = {};

client.onYou(({id, agentName, x, y, score}) => {
    mypos.id = id;
    mypos.agentName = agentName;
    mypos.x = Math.round(x);
    mypos.y = Math.round(y);
    mypos.score = score;
})

var buchi = [];
client.onTile((x, y, delivery) => {
    if (delivery == true) {
        buchi.push([x, y]);
    }
    //console.log("Buchi", buchi);
})

var objectives = [];
client.onParcelsSensing((parcels) => {
    for (const parcel of parcels) {
        if (parcel.carriedBy == null) {
            objectives.push([parcel.x, parcel.y])
        }
    }
    //console.log("Objectives: ", objectives);
})

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1 - x2));
    const dy = Math.abs( Math.round(y1 - y2));
    return dx + dy;
}

function decideClosestBuco() {
    let curr_closest = [];
    let i = 0;
    for (var buco of buchi) {
        //console.log("Sto decidendo il buco più vicino. Current buco: ", buco)
        let dist = distance({x:mypos.x, y:mypos.y}, {x:buco[0], y:buco[1]})
        if (i == 0) {
            //console.log("sto assegnando per la prima volta curr_closest")
            curr_closest = [buco, dist]
        }
        else if (dist < curr_closest[1]) {
            curr_closest = [buco, dist]
        }
        i += 1;
    }
    console.log("buco più vicino: ", curr_closest)
    return curr_closest[0];
}


async function moove(dir, dist) {
    console.log("Mooooooving")
    for (let i = 0; i < dist; i++) {
        await client.move(dir);
        console.log("Mooooooved")
        await client.timer(500)
    }
}

var directions = new Map([
    [0, "up"],
    [1, "down"],
    [2, "right"],
    [3, "left"]
])

async function goToTile(x, y) {
    while(mypos.x != x) {
        if (mypos.x < x) {
            await client.move("right");
            console.log("Moved right");
        }
        else {
            await client.move("left");
            console.log("Moved left");
        }
    }

    while(mypos.y != y) {
        if (mypos.y < y) {
            await client.move("up");
            console.log("Moved up");
        }
        else {
            await client.move("down");
            console.log("Moved down");
        }
    }
}

async function goPutDown() {
    let buco = decideClosestBuco();
    console.log("Going to buco: ", buco)
    await goToTile(buco[0], buco[1])
    await client.putdown();
}

while(1){
    console.log("Sono nel ciclo");

    while(objectives.length != 0){
        //console.log(objectives)
        await client.timer(2000)
        console.log("I have an objective!")
        var obj = objectives.pop();
        console.log("Objective:",obj)
        await goToTile(obj[0], obj[1]);
        if (await client.pickup()) {
            console.log("picked up parcel")
        }
        await goPutDown();
    }

    console.log("Trying to move")
    let d = Math.floor(Math.random()*4)
    await moove(directions.get(d), (Math.floor(Math.random()*5))+1);

}

