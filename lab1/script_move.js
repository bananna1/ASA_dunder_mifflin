/*
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)

async function myFn () {

    let up = await client.move('up');
    let right = await client.move('right');
    
}

// myFn ()

client.socket.on( 'tile', (x, y, delivery) => {
    console.log(x, y, delivery)
} )

/**
 * 28/03/2023
 * 
 * Implement an agent that:
 * - moves along a predefined path
 * - pick the parcel
 * - deliver it
 * 
 * What if other agents are moving?
 * - Dealing with failing actions, by insisting on path.
 */

/*
async function createPath() {
    let i = 0;
    while(i < 20) {
        if(await client.move('right')) {
            i++;
            await client.putdown();
            await client.pickup();
            console.log("I have moved right: " + i);
        }
        else if(await client.move('up')) {
            i++;
            await client.putdown();
            await client.pickup();
            console.log("I have moved up: " + i);
        }
        else if (await client.move('left')) {
            i++;
            await client.putdown();
            await client.pickup();
            console.log("I have moved left: " + i);
        }
        else if(await client.move('down')) {
            i++;
            await client.putdown();
            await client.pickup();
            console.log("I have moved down: " + i);
        }
        else {
            console.log("I'm stucked");
            i++;
        }
        await client.timer(1000);
    }
}

createPath();
*/

// import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { default as config } from "./../config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

// const client = new DeliverooApi(
//     'http://localhost:8080',
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
// )

async function myFn () {

    console.log("Starting");
    await moove("right",9);
    await moove("up",2);
    await moove("left",1);
    await moove("up",2);
    await moove("left",7);
    await moove("up",2);
    await moove("right",2);
    await moove("up",1);
    await moove("right",2);
    await moove("down",5);
    await moove("left",4);
    await moove("down",2);
    await moove("left",1);

    
}
console.log("PartenzA");
while(1){
    await myFn()
}

client.socket.on( 'tile', (x, y, delivery) => {
    console.log(x, y, delivery)
} )

async function moove(dir,num){
    let i=0;
    while(i<num){ 
        if(await client.move( dir )){
            console.log("Moveed ",dir," ",i);
            i+=1;
            await client.putdown();
            await client.pickup();
            // await client.timer(100)
        }
        // await client.timer(100)
    }
}