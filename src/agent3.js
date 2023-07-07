// import { DeliverooApi,timer } from "@unitn-asa/deliveroo-js-client";
// import { onlineSolver, PddlExecutor, PddlProblem, Beliefset } from "@unitn-asa/pddl-client";
// const client = new DeliverooApi(
//     'http://localhost:8080',
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyZWUxOTdiZjY4IiwibmFtZSI6ImRhdmlkZSIsImlhdCI6MTY4ODEzMjUzMH0.Ep3bfFpB6ZGgwX6zfVknN8UACXTbVC6D-GHRnDJNTM4'
// )
// console.log(client)
import { client, BeliefCose } from "./beliefcose2.js"
// import {execute_depth} from "./depth_search2.js"
import { execute_astar } from "./astar_search2.js"
import { explore_map } from "./map_explorer2.js"



// await client.move("right")
var belief = new BeliefCose()

function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2))
    const dy = Math.abs(Math.round(y1) - Math.round(y2))
    return dx + dy;
}

var reachable_tiles;
var mapp;
var w;
var h;

client.onMap((width, height, tiles) => {
    w = width - 1;
    h = height - 1;
    mapp = Array(width).fill(0).map(() => Array(height).fill(0))
    console.log("facendo...")
    // console.log(tiles)
    reachable_tiles = Array(width).fill().map(() => Array(height).fill())
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            // console.log(x,"-",y)
            reachable_tiles[x][y] = true;
            mapp[x][y] = 0;
            for (var el of tiles) {
                if (el.x == x && el.y == y) mapp[x][y] = 1
            }
        }
    }
    // console.log(reachable_tiles)
})

/**
 * Beliefset revision function
 */
var old_me = []
const me = {};
var me_instances = []
var i = 0;
var time_estimation_movement = 1;
client.onYou(({ id, name, x, y, score }) => {
    // old_me.x = me.x; old_me.y = me.y;
    //  console.log("sssssssssssssssssssssss")
    me.id = id
    me.name = name

    //  if(x > old_me[0]) me.x = Math.ceil(x)
    //  else me.x = Math.floor(x);

    //  if(y > old_me[1]) me.y = Math.ceil(y)
    //  else me.y = Math.floor(y);
    me.x = Math.round(x)
    me.y = Math.round(y)

    me.score = score
    if (old_me.length == 3) {
        var old_x = old_me[0];
        var old_y = old_me[1]
        var el_time = Date.now() - old_me[2];
        //  console.log("x:",x,"y:",y,"ox:",old_x,"oy:",old_y)
        var distance = Math.sqrt(Math.pow((old_y - y), 2) + Math.pow((old_x - x), 2));
        //  console.log("distance:",distance, "i:",i)
        if (distance != 0) time_estimation_movement = (time_estimation_movement * i + (el_time / distance)) / (i + 1);
        old_me = [x, y, Date.now()]
    }
    else old_me = [x, y, Date.now()];
    // console.log(old_me)
    i++;
    //  console.log("movement estimation:",time_estimation_movement);
})

const parcels = new Map();
var carried_parcels = new Set();
var decaying = false;



var time_estimation_decaying = 0;
var total_time = 0;
var first_sensing = new Map();
var delta_reward = 0;
client.onParcelsSensing(async (perceived_parcels) => {
    // console.log("Decaying:",decaying)
    for (const p of perceived_parcels) {
        if (!parcels.has(p.id) && !p.carriedBy) {
            first_sensing.set(p.id, [Date.now(), p.reward]);
        }
        parcels.set(p.id, p);
        if (first_sensing.get(p.id)) {

            let [first_time, first_reward] = first_sensing.get(p.id);
            delta_reward = first_reward - p.reward
            if (delta_reward != 0) {
                decaying = true;
                var elapsed_time = Date.now() - first_time;
                var estim = elapsed_time / delta_reward;
                // console.log("estim:",estim, "delta reward:",delta_reward, "time:",elapsed_time);
                time_estimation_decaying = (time_estimation_decaying * total_time + estim * elapsed_time) / (total_time + elapsed_time);
                total_time += elapsed_time;
                // console.log("decaying estimation:",time_estimation_decaying)
            }
        }



    }
    // console.log("decaying estimation:",time_estimation_decaying);
})

var bad_agents = new Map();
var bad_agents_in_beliefset = new Map();
client.onAgentsSensing(agents => {
    // console.log(agents)
    bad_agents.clear();
    for (var el of agents) {
        bad_agents.set(el.id, [Math.round(el.x), Math.round(el.y), el.name]);
    }

    if (myAgent.intention_queue[0]) {
        // myAgent.intention_queue[0].stop();
        let int = myAgent.intention_queue[0].predicate[0];
        // console.log("int:",int)
        if (int == "go_pick_up" || int == "go_to" || int == "go_to_random") {
            // console.log(myAgent.intention_queue[0].predicate)
            let x = myAgent.intention_queue[0].predicate[1];
            let y = myAgent.intention_queue[0].predicate[2];
            // console.log("updating belief set 0 with",x,y);
            update_beliefset(x, y);
        }
        else if (int == "go_put_down") {
            var hole = closest_hole(me);
            // console.log("h0h1:",hole[0],hole[1])
            // console.log("updating belief set 1 with",hole[0],hole[1]);
            update_beliefset(hole[0], hole[1])
        }
    }
    // console.log("xy in as:",x,y);
})

var holes = []

client.onTile((x, y, delivery) => {
    // console.log(x,y)
    if (delivery == true) {
        holes.push([x, y]);
    }

})


client.onConfig((param) => {
    // console.log(param);
})
client.onParcelsSensing(sensingLoop)


/**
 * Options generation and filtering function
 */

client.onYou(sensingLoop)


var proximity_priority;
//---------------------------------------------------------------------------------------------------------------------------------------------------
function sensingLoop() {
    // console.log("dsjaisjao")
    // TODO revisit beliefset revision so to trigger option generation only in the case a new parcel is observed
    var tile_per_decaying = time_estimation_decaying / (time_estimation_movement / 0.75);
    // console.log("tpd:",tile_per_decaying)
    /**
     * Options generation
     */
    // console.log(parcels)
    const options = []
    for (const parcel of parcels.values()) {
        // console.log(parcel)
        if (!parcel.carriedBy) {
            var occupied = false;
            for (let [k, v] of bad_agents) {
                if (v[0] == Math.round(parcel.x) && v[1] == Math.round(parcel.y)) {
                    occupied = true;
                    break;
                }
            }
            if (!occupied) options.push(['go_pick_up', Math.round(parcel.x), Math.round(parcel.y), parcel.id]);
        }
        // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )
    }

    // console.log(options)
    console.log("carried_parcels:", carried_parcels.size)
    if (carried_parcels.size != 0) options.push(["go_put_down"])

    if (options.length == 0) {
        if (myAgent.intention_queue.length == 0 || (myAgent.intention_queue[0].predicate[0] != "go_to_random")) {
            let [xx, yy] = explore_map(me.x, me.y)
            myAgent.push(["go_to_random", xx, yy]);
            return;
        }
    }
    /**
     * Options filtering
     */
    let best_option;
    let best_utility = -100;
    let lost_reward = 100;
    let net_reward = -100;
    let nearest = Number.MAX_VALUE;
    let best_total_gain = -1000;
    let best_d = Number.MAX_VALUE;
    for (const option of options) {
        if (option[0] == 'go_pick_up' && !parcels.get(option[3]).carriedBy) {
            let [go_pick_up, x, y, id, is_best] = option;
            x = Math.round(x);
            y = Math.round(y);
            // console.log("X:",x,"Y:",y);

            var occupied = false;
            for (var [key, ag] of bad_agents) {
                if (ag[0] == x && ag[1] == y) {
                    occupied = true;
                    break;
                }
            }
            if (occupied) continue;
            // console.log("me.x, me.y;",me.x,me.y)
            // console.log(me.x,me.y, " => ", x,y);
            // let current_d = distance( {x,y}, me);
            // console.log(typeof mapp)
            // let current_d = execute_depth(me.x,me.y,x,y, mapp);
            let current_d = execute_astar(me.x, me.y, x, y);
            // console.log("current d1:",me.x,me.y," => ", x,y,":", current_d);
            // console.log(current_d)
            // let current_plan = await belief.generate_plan(me.x,me.y, x,y);
            // var current_plan = belief.generate_plan(me.x,me.y, x,y)
            // let current_d = current_plan.length;
            if (decaying == true) {
                let current_reward = parcels.get(id).reward;
                var hole = closest_hole({ x, y });
                // var extra_d = distance({x,y}, {x:hole[0],y:hole[1]})
                // var extra_d = execute_depth(x,y,hole[0],hole[1], mapp);
                var extra_d = execute_astar(x, y, hole[0], hole[1]);
                // console.log("current d2:",x,y," => ", hole[0],hole[1],":",extra_d)
                // var extra_plan = belief.generate_plan(x,y, hole[0], hole[1])
                // var extra_d = extra_plan.length;
                var gain = 0;
                carried_parcels.forEach(id => {
                    if (parcels.get(id)) {
                        gain += parcels.get(id).reward;
                    }
                    else parcels.delete(id)
                })
                // console.log(gain,current_reward,)

                var current_total_gain = (gain + current_reward) - (carried_parcels.size + 1) * (current_d + extra_d) / tile_per_decaying;
                if (parcels.get(id).reward * tile_per_decaying >= 15) proximity_priority = 100 * Math.pow(Math.E, -0.5 * (current_d - 1))
                else proximity_priority = 0;
                current_total_gain += proximity_priority;
                // console.log("ctg:",current_total_gain, "btg:",best_total_gain)
                // var current_total_gain = gain + current_reward - carried_parcels.size*(current_d+extra_d)/tile_per_decaying;
                if (current_total_gain > best_total_gain && reachable_tiles[x][y] == true) {
                    // console.log("FOUND BEST")
                    best_total_gain = current_total_gain
                    best_option = option;
                }
            }
            else {
                // while(!reachable_tiles)
                // console.log("rt:",reachable_tiles)
                console.log(x, y)
                if (current_d < nearest && reachable_tiles[x][y] == true) {
                    nearest = current_d;
                    best_option = option;
                }
            }

        }
        else if (option[0] == "go_put_down") {
            var hole = closest_hole(me);
            // let current_d = distance(me,{x:hole[0],y:hole[1]});
            // console.log(typeof mapp)
            // let current_d = execute_depth(me.x,me.y,hole[0], hole[1],mapp);
            let current_d = execute_astar(me.x, me.y, hole[0], hole[1])
            // console.log("current d3:",me.x,me.y," => ",hole[0],hole[1],":",current_d)
            if (decaying == true) {
                var gain = 0;
                carried_parcels.forEach(id => {
                    if (parcels.get(id)) {
                        gain += parcels.get(id).reward;
                    }
                    else parcels.delete(id)
                })
                var current_total_gain = (gain - carried_parcels.size * current_d / tile_per_decaying);
                proximity_priority = 100 * Math.pow(Math.E, -0.5 * (current_d - 1))
                current_total_gain += proximity_priority;

                // console.log("ctg:",current_total_gain, "btg:",best_total_gain)
                if (current_total_gain > best_total_gain && reachable_tiles[hole[0]][hole[1]] == true) {
                    best_option = option;
                }
            }
            else {
                if (current_d < nearest - 3) best_option = option;
            }
        }
    }

    /**
     * Best option is selected
     */
    if (best_option) {
        // console.log("BEst option",best_option)
        console.log(best_option)
        // console.log("best_option after:",best_option.splice(0,best_option.length-1))
        // myAgent.push(best_option.splice(0,best_option.length-1))
        myAgent.shift(best_option);
        // myAgent.shift(best_option)
        // for (var p of parcels){
        //     console.log("porca troia",p.x,p.y)
        //     if(distance(me,{x:p.x, y:p.y} && p.id != best_option[3])<=1) myAgent.shift(["go_pick_up", Math.round(p.x), Math.round(p.y), p.id, false])
        // }

    }
}



/**
 * Intention revision loop
 */
class IntentionRevision {

    #intention_queue = new Array();
    get intention_queue() {
        return this.#intention_queue;
    }

    async loop() {
        while (true) {
            if (this.intention_queue.length != 0) {
                console.log("------------------printing qeue---------------")

                this.intention_queue.forEach(el => {
                    console.log(el.predicate)
                })
                console.log("------------------finished qeue---------------")
            }
            // Consumes intention_queue if not empty
            if (this.intention_queue.length > 0) {
                console.log('intentionRevision.loop', this.intention_queue.map(i => i.predicate));

                // Current intention
                const intention = this.intention_queue[0];



                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                // let id = intention.predicate[2]
                // let p = parcels.get(id)
                // if (p && p.carriedBy) {
                //     console.log('Skipping intention because no more valid', intention.predicate)
                //     continue;
                // }
                if (!is_still_valid(intention)) {
                    console.log('Skipping intention because no more valid', intention.predicate)
                    this.intention_queue.shift();
                    continue;
                }
                // Start achieving intention
                await intention.achieve()
                    // Catch eventual error and continue
                    .catch(error => {
                        console.log('Failed intention', ...intention.predicate, 'with error:', error)
                    });

                // Remove from the queue
                this.intention_queue.shift();
            }
            // Postpone next iteration at setImmediate
            await new Promise(res => setImmediate(res));
        }
    }

    // async push ( predicate ) { }

    log(...args) {
        console.log(...args)
    }

}

class IntentionRevisionQueue extends IntentionRevision {

    async push(predicate) {

        // Check if already queued
        if (this.intention_queue.find((i) => i.predicate.join(' ') == predicate.join(' ')))
            return; // intention is already queued

        console.log('IntentionRevisionReplace.push', predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);
    }

    async shift(predicate) {
        // console.log("predicate:",predicate)
        if (this.intention_queue.find((i) => i.predicate.join(' ') == predicate.join(' ')))
            return; // intention is already queued
        if (this.intention_queue.length == 0) this.intention_queue.push(new Intention(this, predicate));
        else {
            this.intention_queue[0].stop();
            this.intention_queue.shift(new Intention(this, predicate))
        }
    }

}

// class IntentionRevisionReplace extends IntentionRevision {

//     async push(predicate) {

//         // Check if already queued
//         const last = this.intention_queue.at(this.intention_queue.length - 1);
//         if (last && last.predicate.join(' ') == predicate.join(' ')) {
//             return; // intention is already being achieved
//         }

//         console.log('IntentionRevisionReplace.push', predicate);
//         const intention = new Intention(this, predicate);
//         this.intention_queue.push(intention);

//         // Force current intention stop 
//         if (last) {
//             last.stop();
//         }
//     }

// }

// class IntentionRevisionRevise extends IntentionRevision {

//     async push(predicate) {
//         // console.log( 'Revising intention queue. Received', ...predicate );
//         if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) ){
//             // console.log("Already found in queue")
//             return;
//         } 
//         console.log("here")
//         const intention = new Intention(this,predicate);
//         this.intention_queue.push(intention);

//         this.intention_queue.forEach(el=>{
//             // console.log("a:",el.predicate)
//         })

//         var current_d = 0;
//         var current_value=0;
//         var current_utility=0;
//         var best_utility=0;
//         var best_index = 0;
//         // console.log("iq prima prima:",this.intention_queue)

//         for( var i=0; i<this.intention_queue.length; i++){
//             // console.log("ANALYZING:",this.intention_queue[i].predicate)
//             if(this.intention_queue[i].predicate[0] == "go_pick_up"){
//                 // console.log("Found go_pick_up")
//                 current_d = distance(me, {x:this.intention_queue[i].predicate[1], y:this.intention_queue[i].predicate[2]});
//                 current_value = parcels.get(this.intention_queue[i].predicate[3]);
//                 current_utility= current_value.reward - current_d;
//                 if(current_utility > best_utility){
//                     best_utility = current_utility;
//                     best_index = i;
//                 }
//             }
//         }
//         if (best_index != 0){
//             // console.log("splicing at",best_index)
//             this.intention_queue[0].stop();
//             // await client.timer(1000)
//             var new_best = this.intention_queue.splice(best_index,1);
//             // console.log("new best:",new_best[0].predicate)
//             this.intention_queue.unshift(new_best[0])
//             // console.log("iq dopo:", this.intention_queue)

//         }
//         // TODO
//         // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
//         // - eventually stop current one
//         // - evaluate validity of intention
//     }

// }

/**
 * Start intention revision loop
 */

const myAgent = new IntentionRevisionQueue();
// const myAgent = new IntentionRevisionReplace();
// const myAgent = new IntentionRevisionRevise();
client.timer(1000)
myAgent.loop();



/**
 * Intention
 */
class Intention {

    // Plan currently used for achieving the intention 
    #current_plan;

    // This is used to stop the intention
    #stopped = false;
    get stopped() {
        return this.#stopped;
    }
    stop() {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if (this.#current_plan)
            this.#current_plan.stop();
    }

    /**
     * #parent refers to caller
     */
    #parent;

    /**
     * predicate is in the form ['go_to', x, y]
     */
    get predicate() {
        return this.#predicate;
    }
    #predicate;

    constructor(parent, predicate) {
        this.#parent = parent;
        this.#predicate = predicate;
    }

    log(...args) {
        if (this.#parent && this.#parent.log)
            this.#parent.log('\t', ...args)
        else
            console.log(...args)
    }

    #started = false;
    /**
     * Using the plan library to achieve an intention
     */
    async achieve() {
        // Cannot start twice
        if (this.#started)
            return this;
        else
            this.#started = true;

        // Trying all plans in the library
        for (const planClass of planLibrary) {

            // if stopped then quit
            if (this.stopped) throw ['stopped intention', ...this.predicate];

            // if plan is 'statically' applicable
            if (planClass.isApplicableTo(...this.predicate)) {
                // plan is instantiated
                this.#current_plan = new planClass(this.parent);
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute(...this.predicate);
                    this.log('succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res);
                    return plan_res
                    // or errors are caught so to continue with next plan
                } catch (error) {
                    this.log('failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', error);
                }
            }

        }

        // if stopped then quit
        if (this.stopped) throw ['stopped intention', ...this.predicate];

        // no plans have been found to satisfy the intention
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ['no plan satisfied the intention ', ...this.predicate]
    }

}

/**
 * Plan library
 */
const planLibrary = [];

class Plan {

    // This is used to stop the plan
    #stopped = false;
    stop() {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for (const i of this.#sub_intentions) {
            i.stop();
        }
    }
    get stopped() {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */
    #parent;

    constructor(parent) {
        this.#parent = parent;
    }

    log(...args) {
        if (this.#parent && this.#parent.log)
            this.#parent.log('\t', ...args)
        else
            console.log(...args)
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate);
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == 'go_pick_up';
    }

    async execute(go_pick_up, x, y, id,) {
        if (this.stopped) throw ['stopped']; // if stopped then quit
        // if(!is_best){
        //     var cur_d = distance(me,{x,y});
        //     if(cur_d >= 1.5) return false;
        // }
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        carried_parcels.add(id)
        console.log("id of picked_up:", id)
        parcels.delete(id);
        return true;
    }

}

class BlindMove extends Plan {

    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to_random';
    }

    async execute(go_to, x, y) {
        if (this.stopped) throw ("stopped")
        await this.subIntention("go_to", x, y);

    }
}


class GoPutDown extends Plan {
    static isApplicableTo(action, a, b, c) {
        // console.log("predicate:", action)
        return action == "go_put_down";   //TODO forse
    }

    async execute(go_put_down, x, y) {
        console.log("putting down")
        var hole = closest_hole(me);
        console.log("Closest hole:", hole)
        var res = await this.subIntention(["go_to", hole[0], hole[1]]);
        // if(res == 1) return 1;
        if (this.stopped) throw ['stopped']
        await client.putdown();
        // for( var i=0; i<myAgent.carried_parcels.size; i++){
        //     console.log("putting down...")
        // }
        carried_parcels.clear()
        return 0;
    }

}


class PlanMove extends Plan {

    static isApplicableTo(action, a, b, c) {
        // console.log("predicate:",action)
        return action == 'go_to' || action == "go_to_random";
    }

    async execute(go_to, x, y) {
        var x_from = me.x;
        var y_from = me.y;
        // console.log("Sono qua")
        if (me.x == x && me.y == y) return 0;
        var changed = true;
        do {
            if (changed) var array_directions = await belief.generate_plan(x_from, y_from, x, y);
            changed = false;
            // console.log("arary directions:",array_directions)
            if (array_directions == -1) { //??????????????????????????????? TODO
                console.log("PLAN IS UNDEFINED")
                var because_of_agent = false;
                for (var [k, v] of bad_agents) {
                    if (v[0] == x && v[1] == y) because_of_agent = true;
                }
                if (!because_of_agent) reachable_tiles[x][y] = false;
                // console.log("unreachable");
                // break;
                throw ["unreachable"];
                // return 1;
            }

            for (var dir of array_directions) {

                if (this.stopped) throw ['stopped'];
                // console.log("updating belief set 2 with",x,y);
                var changes = update_beliefset(x, y);
                // console.log("iiiiiiiiiiiiiiiii")
                if (await client.move(dir)) {
                    console.log("moved", dir)
                }
                else {
                    // console.log("updating belief set 3 with",x,y);
                    update_beliefset(x, y);
                    throw ["stucked"]
                }
                if (changes) {
                    changed = changes;
                    console.log("beliefset updated")
                    break;
                }

            }
        } while (changed);


        return 0;
    }


}


// plan classes are added to plan library 
planLibrary.push(BlindMove)
planLibrary.push(PlanMove)
planLibrary.push(GoPickUp)
planLibrary.push(GoPutDown)


function closest_hole({ x: x1, y: y1 }) {
    // console.log("Closest hole searching")
    var closest;
    var bestdistance = 10000000;
    for (var el of holes) {
        // console.log("el:",el)
        var d = distance({ x: me.x, y: me.y }, { x: el[0], y: el[1] });
        if (d < bestdistance) {
            var occupied = false;
            for (var [key, value] of bad_agents_in_beliefset) {
                if (el[0] == value[0] && el[1] == value[1]) {
                    occupied = true;
                    break;
                }
            }
            if (!occupied) {
                bestdistance = d;
                closest = el;
            }
            // console.log("find new best")
            // bestdistance = d;
            // closest = el;
        }
    }
    return closest;
}


function is_still_valid(intention) {
    switch (intention.predicate[0]) {
        case "go_pick_up": {
            var occupied = false;
            for (let [k, v] of bad_agents) {
                if (v[0] == intention.predicate[1] && v[1] == intention.predicate[2]) {
                    occupied = true;
                    break;
                }
            }
            let id = intention.predicate[3];
            let p = parcels.get(id);
            if (p && (p.carriedBy || occupied)) return false;

            // let current_d = distance(me,{x:p.x, y:p.y});
            // if(current_d <= 5){ //TODO maybe be adjusted
            //     return (x==p.x && y==p.y);
            // }
            return true;
        }
        case "go_put_down": {
            return (carried_parcels != 0)
        }
        case "go_to_random": {
            return true;
        }
        case "go_to": {

            let x = intention.predicate[1];
            let y = intention.predicate[2];
            console.log("going to:", x, y)
            let free = true
            for (let [k, v] of bad_agents) {
                if (v[0] == x && v[1] == y) {
                    free = false;
                    break;
                }
            }
            return free;
        }
    }
}



function update_beliefset(x, y) {
    console.log("xy:", x, y)
    for (let [k, v] in bad_agents_in_beliefset) {
        if (!bad_agents.has(k)/*  && distance(me,{x:v[0], y:v[1]})>=8 */) {
            bad_agents_in_beliefset.delete(k);
            belief.updateBeliefSet(v[0], v[1], true);
        }
    }
    var problems = false;
    // console.log("updating beliefset")
    for (let [key, value] of bad_agents) {
        // console.log(key,value, is_in_mezzo(value[0],value[1],x,y), bad_agents_in_beliefset.has(key), distance(me,{x:value[0],y:value[1]}))
        if (!bad_agents_in_beliefset.has(key) && distance(me, { x: value[0], y: value[1] }) <= 5 && is_in_mezzo(value[0], value[1], x, y)) {
            // console.log("NOT in there")
            belief.updateBeliefSet(value[0], value[1], false);
            bad_agents_in_beliefset.set(key, [value[0], value[1]])
            console.log(bad_agents_in_beliefset.get(key))
            // console.log("Found changes 1")
            problems = true;
        }
        else if (bad_agents_in_beliefset.has(key)) {
            // console.log("is in there")
            var ag = bad_agents_in_beliefset.get(key);
            // console.log("ag.x:",ag[0],"ag.y:",ag[1],"value[0]:",value[0],"value[1]:",value[1])
            if (ag[0] != value[0] || ag[1] != value[1]) {
                // console.log("He moved")
                belief.updateBeliefSet(ag[0], ag[1], true);
                bad_agents_in_beliefset.delete(key)
                if (distance(me, { x: value[0], y: value[1] }) <= 3 && is_in_mezzo(value[0], value[1], x, y)) {
                    belief.updateBeliefSet(value[0], value[1], false);
                    bad_agents_in_beliefset.set(key, [value[0], value[1]])
                    // console.log("Found changes 2")
                    problems = true;
                }
                else {
                    belief.updateBeliefSet(x, y, true);
                }
            }
        }
    }
    if (!problems) {
        console.log("no problems")
    }
    console.log(bad_agents_in_beliefset)
    return problems;
}

function is_in_mezzo(ax, ay, x, y) {
    // console.log("ax:",ax,"ay:",ay,'x:',x,'y:',y, "me.x:",me.x,"me.y:",me.y)
    if (me.x >= x && me.y >= y) return ((x - 1 <= ax && ax <= me.x + 1) && (y - 1 <= ay && ay <= me.y + 1))
    if (me.x >= x && me.y <= y) return ((x - 1 <= ax && ax <= me.x + 1) && (me.y - 1 <= ay && ay <= y + 1))
    if (me.x <= x && me.y >= y) return ((me.x - 1 <= ax && ax <= x + 1) && (y - 1 <= ay && ay <= me.y + 1))
    if (me.x <= x && me.y <= y) return ((me.x - 1 <= ax && ax <= x + 1) && (me.y - 1 <= ay && ay <= y + 1))
}

setInterval(sensingLoop, 500);