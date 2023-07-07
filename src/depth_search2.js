import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import {client} from "./beliefcose.js"
// const client = new DeliverooApi(
//     'http://localhost:8080',
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
// )

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}



/**
 * @type {Map<x,Map<y,{x,y,delivery}>}
 */
var map = new Map()

client.onTile( ( x, y, delivery ) => {
    if ( ! map.has(x) )
        map.set(x, new Map)    
    map.get(x).set(y, {x, y, delivery})
} );

var init_x;
var init_y;
var target_x;
var target_y;

// const {x: init_x, y: init_y} = await new Promise( res => client.onYou( res ) );
// const target_x = parseInt( process.argv[2] ), target_y = parseInt( process.argv[3] );



// await new Promise( res => setTimeout( res, 500 ) );



function search (cost, x, y, previous_tile, action_from_previous) {
    // if(typeof map == "string") console.log("map - ",map)
    if( ! map.has(x) || ! map.get(x).has(y) ){
        // console.log("returning 1");
        return [false,1];
    }
    
    const tile = map.get(x).get(y)
    if( tile.cost_to_here <= cost){
        // console.log("returning 2");
        return [false, 2];
    }
    else {
        tile.cost_to_here = cost;
        tile.previous_tile = previous_tile;
        if( action_from_previous )
            tile.action_from_previous = action_from_previous;
    }
    
    if ( target_x == x && target_y == y ) {
        console.log('found with cost', cost)
        // function backward ( tile ) {
        //     console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
        //     if ( tile.previous_tile ) backward( tile.previous_tile );
        // }
        // backward( tile )
        // console.log("returning 3")
        return true;
    }

    console.log("tileeeeeeeeeeeeeeeeeeeeeeeee:",tile)
    let options = new Array(
        [cost+1, x+1, y, tile, 'right'],
        [cost+1, x-1, y, tile, 'left'],
        [cost+1, x, y+1, tile, 'up'],
        [cost+1, x, y-1, tile, 'down']
    );
    options = options.sort( (a, b) => {
        return distance({x: target_x, y: target_y}, {x: a[1], y: a[2]}) - distance({x: target_x, y: target_y}, {x: b[1], y: b[2]})
    } )

    search( ...options[0] )
    search( ...options[1] )
    search( ...options[2] )
    search( ...options[3] )
    
}



export function execute_depth(x1,y1,x2,y2,mapp){
    // console.log("typeof mapp - ",typeof mapp)
    // if(typeof mapp == "string") console.log("mapp-",mapp)
    init_x = x1;
    init_y = y1;
    target_x = x2;
    target_y = y2;

    console.log('go from', init_x, init_y, 'to', target_x, target_y);
    // console.log(map)
    // map=mapp;

    console.log(search(0, init_x, init_y));

    const dest = map.get(target_x).get(target_y);
    // console.log(dest,"------------------------------------------------")

    var tile = dest;
    var cost=0;
    while ( tile.previous_tile ) {
        console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
        tile = tile.previous_tile;
        cost++;
    }
    console.log("cost:",cost)
    return cost;

}