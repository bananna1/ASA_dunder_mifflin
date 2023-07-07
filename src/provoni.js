import { DeliverooApi,timer } from "@unitn-asa/deliveroo-js-client";
import { onlineSolver, PddlExecutor, PddlProblem, Beliefset } from "@unitn-asa/pddl-client";
import { execute_depth } from "./depth_search.js";
import {client} from "./beliefcose.js"
import fs from 'fs';

console.log(client.emit("ciao"))
// export const client = new DeliverooApi(
//     'http://localhost:8080',
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyZWUxOTdiZjY4IiwibmFtZSI6ImRhdmlkZSIsImlhdCI6MTY4ODEzMjUzMH0.Ep3bfFpB6ZGgwX6zfVknN8UACXTbVC6D-GHRnDJNTM4'
// )


function h(e) {
    let x = e.x;
    let y = e.y;
    return distance( {x: goal.x, y: goal.y}, {x, y} )
}

const me = {};
client.onYou(({ id, name, x, y, score }) => {
    // old_me.x = me.x; old_me.y = me.y;
    me.id = id
    me.name = name
    me.x=x;
    me.y=y;
    me.score = score
    console.log(me.x,me.y)
    const cost = execute_depth(me.x,me.y,6,0)
    console.log(cost,"sdmka")
})
client.timer(2000)


