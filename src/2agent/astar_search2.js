// import { DeliverooApi,timer } from "@unitn-asa/deliveroo-js-client";
// import { onlineSolver, PddlExecutor, PddlProblem, Beliefset } from "@unitn-asa/pddl-client";
import {client} from "./beliefcose2.js"
// import fs from 'fs';


var mapp;
var w;
var h;
client.onMap((width,height,tiles)=>{
    w=width-1;
    h=height-1;
    mapp = Array(width).fill(0).map(()=>Array(height).fill(0))


    for (var i=0;i<width;i++){
        for(var j=0;j<height;j++){
            mapp[i][j] = 0;
            for (var el of tiles){
                if(el.x == i && el.y == j) mapp[i][j] = 1
            }
        }
    }


})

var xstart;
var ystart;
var xend;
var yend;




class Problem {
    // define where the robot is initially
    startState() {
        return { x: xstart, y: ystart };
    }

    // define whether the state is a goal (the blue key)
    isGoal({ x, y }) {
        return x==xend && y==yend;
    }

    // define where the robot can go next, from a given state
    successors({ x, y }) {
        // console.log("Finding successors")
        const adjacentCells = getAdjacentEmptyCells(x, y);

        // augment the adjacent cell data with a direction
        // { state: { x: 0, y: 1 }, direction: "left" }
        return adjacentCells.map(
            ([ [ nextX, nextY ], direction ]) =>
                ({ state: { x: nextX, y: nextY }, direction }));
    }
}

function getAdjacentEmptyCells(x,y){
    // console.log("in here")
    // console.log(x,y)
    var cells = new Array();
    // if(x>0) console.log("q:",mapp[x-1][y])
    // if(x<w) console.log("w:",mapp[x+1][y])
    // if(y>0) console.log("e:",mapp[x][y-1])
    // if(y<h) console.log("r:",mapp[x][y+1])
    if(x>0){
        if(mapp[x-1][y] == 1) cells.push([[x-1,y],"left"]);
    }
    if(x<w){
        if(mapp[x+1][y] == 1) cells.push([[x+1,y],"right"]);
    }
    if(y>0){
        if(mapp[x][y-1] == 1) cells.push([[x,y-1],"down"]);
    }
    if(x<h){
        if(mapp[x][y+1] == 1) cells.push([[x,y+1],"up"]);
    }
    // console.log("c:",cells)
    return cells;
}


function id(x,y) {
    // convert a state to a unique identifier
    return x + 1000 * y;
}



function graphSearch (problem, fringe) {
    const closed = new Set();

    fringe.push({ state: problem.startState(), path: [], cost: 0 });
    // console.log("fringe:",fringe)
    while (fringe.length) {
        // console.log(fringe.length)
        // console.log("aa")
        let node = fringe.pop();
        // console.log("node:",node)
        let { state, path, cost } = node;

        if (problem.isGoal(state)) {
            return path;
        }
        // console.log("id:",id(state.x, state.y))
        if (!closed.has(id(state.x, state.y))) {
            // console.log("not in")
            closed.add(id(state.x, state.y));

            problem.successors(state).forEach(
                (successor) => {
                    // console.log("successor:",successor)
                    fringe.push({
                    state: successor.state,
                    path: path.concat([ successor ]),
                    cost: cost + 1
                })}
            );
        }
    }

    return [];
}

function is_in(map,x,y){
    for (var [key,values] of map){
        if(values[0]==x && values[1]==y) return true;
    }
    return false;
}


export function execute_astar(x1,y1,x2,y2){
    xstart = x1;
    ystart = y1;
    xend = x2;
    yend = y2;

    if(xstart == xend && ystart == yend) return 0;
    var queue = [];
    queue.pop = queue.shift;
    var path = graphSearch(new Problem(), queue);
    // console.log("path:",path.length)
    if(path.length == 0) return 10000;
    return path.length;
}

// // breadth-first search
// var queue = [];
// queue.pop = queue.shift;
// var path = graphSearch(new Problem(), queue);

// // depth-first search
// var stack = [];
// var path = graphSearch(new Problem(), stack);