// import { client } from "./beliefcose.js";
import { DeliverooApi,timer } from "@unitn-asa/deliveroo-js-client";
// import { client } from "./agent.js";
import { client } from "./beliefcose.js"
// export const client = new DeliverooApi(
//     'http://localhost:8080',
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyZWUxOTdiZjY4IiwibmFtZSI6ImRhdmlkZSIsImlhdCI6MTY4ODEzMjUzMH0.Ep3bfFpB6ZGgwX6zfVknN8UACXTbVC6D-GHRnDJNTM4'
// )

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}


/**
 * @type {Map<x,Map<y,{x,y,delivery}>}
 */
// const map = new Map()

// client.onTile( ( x, y, delivery ) => {
//     if ( ! map.has(x) )
//         map.set(x, new Map)    
//     map.get(x).set(y, {x, y, delivery})
// } );



// const {x: init_x, y: init_y} = await new Promise( res => client.onYou( res ) );
// const target_x = parseInt( process.argv[2] ), target_y = parseInt( process.argv[3] );
// console.log('go from', init_x, init_y, 'to', target_x, target_y);
var target_x;
var target_y;
// var init_x=0;
// var init_y=6;


// await new Promise( res => setTimeout( res, 500 ) );

var map = new Map();

function search (cost, x, y, previous_tile, action_from_previous) {
    // console.log(previous_tile)
    if( ! map.has(x) || ! map.get(x).has(y) )
        return false;
    
    const tile = map.get(x).get(y)
    if( tile.cost_to_here <= cost)
        return false;
    else {
        tile.cost_to_here = cost;
        tile.previous_tile = previous_tile;
        if( action_from_previous )
            tile.action_from_previous = action_from_previous;
    }
    
    if ( target_x == x && target_y == y ) {
        console.log('found with cost', cost)
        function backward ( tile ) {
            console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
            if ( tile.previous_tile ) backward( tile.previous_tile );
        }
        backward( tile )
        return true;
    }

    let options = new Array(
        [cost+1, x+1, y, tile, 'right'],
        [cost+1, x-1, y, tile, 'left'],
        [cost+1, x, y+1, tile, 'up'],
        [cost+1, x, y-1, tile, 'down']
    );
    options = options.sort( (a, b) => {
        console.log(distance({x: target_x, y: target_y}, {x: a[1], y: a[2]}) - distance({x: target_x, y: target_y}, {x: b[1], y: b[2]}))
        return distance({x: target_x, y: target_y}, {x: a[1], y: a[2]}) - distance({x: target_x, y: target_y}, {x: b[1], y: b[2]})
    } )

    search( ...options[0] )
    search( ...options[1] )
    search( ...options[2] )
    search( ...options[3] )
    
}


export function execute_depth(x1,y1,x2,y2, mapp){
    // console.log("mapp:",typeof(mapp))
    // console.log(mapp)
    console.log('go from', x1, y1, 'to', x2, y2);
    target_x=x2;
    target_y=y2;

    var res = search(0, x1, y1);
    if(res==undefined) return 1000;
    console.log("res:",res)
    map = mapp;
    const dest = mapp.get(target_x).get(target_y);
    var tile = dest;
    var cost=0;
    while ( tile.previous_tile ) {
        console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
        tile = tile.previous_tile;
        cost++;
    }
    return cost
    // return mapp;
    
}
