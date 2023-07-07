// import { DeliverooApi,timer } from "@unitn-asa/deliveroo-js-client";
// import { onlineSolver, PddlExecutor, PddlProblem, Beliefset } from "@unitn-asa/pddl-client";
import { client, BeliefCose } from "./beliefcose2.js";


var saved_tiles = new Array();
console.log(saved_tiles.length);
var map_width = 0;
var map_height = 0;

client.onMap((width, height, tiles) => {
    map_width = width;
    map_height = height;
    for (let { x, y } of tiles) {
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


export function explore_map(mex, mey, friend_x, friend_y) {
    // console.log("st:",saved_tiles);
    let curr_x = mex;
    let curr_y = mey;
    let chosen_x = 0;
    let chosen_y = 0;
    let max_x = map_width - curr_x;
    let max_y = map_height - curr_y;
    let min = map_width / 3;
    var friend_quadrant = find_quadrant(friend_x,friend_y);
    var starting_quadrant = find_quadrant(curr_x,curr_y);
    var quadrants = new Set([0,1,2,3])
    quadrants.delete(starting_quadrant);
    quadrants.delete(friend_quadrant);

    var quadrant_array = Array.from(quadrants);
    console.log(quadrant_array);
    let choice =quadrant_array[ Math.floor(Math.random()*quadrant_array.length)]
    console.log(choice);
    /* if (friend_x == undefined  friend_y == undefined  max_x == undefined  max_y == undefined) {
        return;
    } */
    
    console.log("randoming...");
    let random_component_x = Math.round(Math.random() * (max_x - min)) + min;
    let random_component_y = Math.round(Math.random() * (max_y - min)) + min;
    console.log(random_component_x, random_component_y)
    switch (choice){
        case 0:{ //quadrante down-sx
            for (let tile of saved_tiles) {
                let x = tile[0];
                let y = tile[1];
                if (x <= random_component_x - curr_x && y <= random_component_y - curr_y) {
                    chosen_x = x;
                    chosen_y = y;
                    break;
                }
            }
            break;
        }
        case 1:{ //quadrante down-dx
            for (let tile of saved_tiles) {
                let x = tile[0];
                let y = tile[1];
                if (x >= random_component_x + curr_x && y <= random_component_y - curr_y) {
                    chosen_x = x;
                    chosen_y = y;
                    break;
                }
            }
            break;
        }
        case 2:{ //quadrante up-sx
            for (let tile of saved_tiles) {
                let x = tile[0];
                let y = tile[1];
                if (x <= random_component_x - curr_x && y >= random_component_y + curr_y) {
                    chosen_x = x;
                    chosen_y = y;
                    break;
                }
            }
            break;
        }
        case 3:{ //quadrante up-dx
            for (let tile of saved_tiles) {
                let x = tile[0];
                let y = tile[1];
                if (x >= random_component_x + curr_x && y >= random_component_y + curr_y) {
                    chosen_x = x;
                    chosen_y = y;
                    break;
                }
            }
            break;
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

    var end_quadrant = find_quadrant(chosen_x,chosen_x);
    console.log("Parto da", curr_x, curr_y, "e voglio andare in ", chosen_x, chosen_y);
    console.log("quadrante start:",starting_quadrant, "quadrante_friend:",friend_quadrant, "end quadrant:",end_quadrant)
    console.log("returning:", [chosen_x, chosen_y])
    return [chosen_x, chosen_y]

    // do {
    //     if (curr_x < map_width / 2 && curr_y < map_height / 2) { // quadrante in basso a sx
    //         // my_quadrant = 0;
    //         console.log("Quadrante in basso a sx");
            
    //     }
    //     else if (curr_x >= map_width / 2 && curr_y < map_height / 2) { // quadrante in basso a dx
    //         // my_quadrant = 1;
    //         console.log("Quadrante in basso a dx");
            
    //     }
    //     else if (curr_x < map_width / 2 && curr_y >= map_height / 2) { // quadrante in alto a sx
    //         // my_quadrant = 2;
    //         console.log("Quadrante in alto a sx");

    //     }
    //     else {
    //         console.log("Quadrante in alto a dx");                     // quadrante in alto a dx
    //         // my_quadrant = 3;

    //     }
        
    //     var my_quadrant = find_quadrant(chosen_x,chosen_y);

    // } while (friend_quadrant == my_quadrant);



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


function find_quadrant(x,y){
    if(x == -1) return -1;
    else if (x < map_width / 2 && y < map_height / 2) return 0;
    else if (x >= map_width / 2 && y < map_height / 2) return 1;
    else if (x < map_width / 2 && y >= map_height / 2) return 2;
    return 3;
}