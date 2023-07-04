import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}



/**
 * @type {Map<x,Map<y,{x,y,delivery}>}
 */
const map = new Map()

client.onTile( ( x, y, delivery ) => {
    if ( ! map.has(x) )
        map.set(x, new Map)   
    map.get(x).set(y, {x, y, delivery})
} );



const me = {};

await new Promise( res => {
    client.onYou( ( {id, name, x, y, score} ) => {
        me.id = id
        me.name = name
        me.x = x
        me.y = y
        me.score = score
        // console.log( 'me:', me.x, me.y );
        res()
    } )
} );



const target_x = process.argv[2];
const target_y = process.argv[3];
console.log("target x: " + target_x);
console.log("target y: " + target_y);
console.log('go from', me.x, me.y, 'to', target_x, target_y);

while ( me.x != target_x || me.y != target_y ) {

    let status_x = undefined;
    let status_y = undefined;
    var direction;

    if ( target_x > me.x ) {
        console.log("Sono nell'if")
        direction = "right";
        status_x = await client.move('right');
        console.log("I have to move right");
    }
        
    else if ( target_x < me.x ) {
        direction = "left";
        status_x = await client.move('left');
        console.log("I have to move left");
    }

    if (status_x) {
        console.log("Mi sono mosso verso " + direction);
        me.x = status_x.x;
        me.y = status_x.y;
    }

    if ( target_y > me.y ) {
        direction = "up";
        status_y = await client.move('up');
        console.log("I have to move up");
    }
        
    else if ( target_y < me.y ) {
        direction = "down";
        status_y = await client.move('down')
        console.log("I have to move downs");
    }

    if (status_y) {
        console.log("Mi sono mosso verso " + direction);
        me.x = status_y.x;
        me.y = status_y.y;
    }
    
    if ( ! status_x && ! status_y) {
        console.log('stucked')
        break;
    } else if ( me.x == target_x && me.y == target_y ) {
        console.log('target reached')
    }
    
}