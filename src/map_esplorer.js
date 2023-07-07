import { DeliverooApi,timer } from "@unitn-asa/deliveroo-js-client";
import { onlineSolver, PddlExecutor, PddlProblem, Beliefset } from "@unitn-asa/pddl-client";
import { client, BeliefCose } from "./1agent/beliefcose.js";

var belief = new BeliefCose();

// const me = {};
// var old_me = [];
// client.onYou(({ id, name, x, y, score }) => {
//     //old_me.x = me.x; old_me.y = me.y;
//     old_me[0] = me.x;
//     old_me[1] = me.y;
//     me.id = id
//     me.name = name
//     if (x > old_me[0]) {
//         me.x = Math.ceil(x);
//     }
//     else {
//         me.x = Math.floor(x);
//     }
//     if (y > old_me[1]) {
//         me.y = Math.ceil(y);
//     }
//     else {
//         me.y = Math.floor(y);
//     }

// });
// console.log(me);

var saved_tiles = new Array();
console.log(saved_tiles.length);
var map_width = 0;
var map_height = 0;

client.onMap ((width, height, tiles) => {
    map_width = width;
    map_height = height;
    for (let {x, y} of tiles) {
        let new_tile = [x, y];
        saved_tiles.push(new_tile);
    }
    console.log(saved_tiles[0]);
});

console.log(saved_tiles.length);
console.log('width', map_width, 'height', map_height);
for (let i = 0; i < saved_tiles.length; i++) {
    console.log(saved_tiles.length);
    console.log(saved_tiles[i]);
}


export function explore_map(mex,mey) {
    // console.log("st:",saved_tiles);
    let curr_x = mex;
    let curr_y = mey;
    let chosen_x = 0;
    let chosen_y = 0;
    let max_x = map_width - curr_x;
    let max_y = map_height - curr_y;
    let min = map_width / 3;
    /* if (curr_x == undefined  curr_y == undefined  max_x == undefined  max_y == undefined) {
        return;
    } */
    let random_component_x = Math.round(Math.random() * (max_x - min)) + min;
    let random_component_y = Math.round(Math.random() * (max_y - min)) + min;
    if (curr_x < map_width / 2 && curr_y < map_height / 2) { // quadrante in basso a sx
        console.log("Quadrante in basso a sx");
        for (let tile of saved_tiles) {
            let x = tile[0];
            let y = tile[1];
            if (x >= random_component_x + curr_x && y >= random_component_y + curr_y) {
                chosen_x = x;
                chosen_y = y;
                break;
            }
        }
    }
    else if (curr_x >= map_width / 2 && curr_y < map_height / 2) { // quadrante in basso a dx
        console.log("Quadrante in basso a dx");
        for (let tile of saved_tiles) {
            let x = tile[0];
            let y = tile[1];
            if (x <= random_component_x - curr_x && y >= random_component_y + curr_y) {
                chosen_x = x;
                chosen_y = y;
                break;
            }
        }
    } 
    else if (curr_x < map_width / 2 && curr_y >= map_height / 2) { // quadrante in alto a sx
        console.log("Quadrante in alto a sx");
        for (let tile of saved_tiles) {
            let x = tile[0];
            let y = tile[1];
            if (x >= random_component_x + curr_x && y <= random_component_y - curr_y) {
                chosen_x = x;
                chosen_y = y;
                break;
            }
        }
    } 
    else {   
        console.log("Quadrante in alto a dx");                     // quadrante in alto a dx
        for (let tile of saved_tiles) {
            let x = tile[0];
            let y = tile[1];
            if (x <= random_component_x - curr_x && y <= random_component_y - curr_y) {
                chosen_x = x;
                chosen_y = y;
                break;
            }
        }
    }
    if (chosen_x == 0 && chosen_y == 0) {
        let i = Math.round(Math.random() * saved_tiles.length);
        chosen_x = saved_tiles[i][0];
        chosen_y = saved_tiles[i][1];
    }
    if (chosen_x == undefined || chosen_y == undefined) {
        chosen_x = 0;
        chosen_y = 0;
    }
    
    console.log("Parto da", curr_x, curr_y, "e voglio andare in ", chosen_x, chosen_y);
    return [chosen_x, chosen_y]
    
    // var plan = await belief.generate_plan(curr_x, curr_y, chosen_x, chosen_y);

    // for (let dir of plan) {
    //     await client.move(dir);
    // }

}
// while(1) {
//     if (await client.move('right')) {console.log("step a destra")}
//     else if (await client.move('left')) {console.log("step a sinistra")}
//     else if (await client.move('up')) {console.log("step verso l'alto")}
//     else if (await client.move('down')) {console.log("step verso il basso")}
//     await explore_map(saved_tiles);
//     client.timer(500);
// }