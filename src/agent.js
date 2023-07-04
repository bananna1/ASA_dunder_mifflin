import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5ZmQ2NDllNzZlIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjc5OTk3Njg2fQ.6_zmgL_C_9QgoOX923ESvrv2i2_1bgL_cWjMw4M7ah4'
)

function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2))
    const dy = Math.abs(Math.round(y1) - Math.round(y2))
    return dx + dy;
}



/**
 * Beliefset revision function
 */
const me = {};
client.onYou(({ id, name, x, y, score }) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
})

const parcels = new Map();
var carried_parcels = new Set();
client.onParcelsSensing(async (perceived_parcels) => {
    for (const p of perceived_parcels) {
        parcels.set(p.id, p)
    }
})

var holes = []
client.onTile((x, y, delivery) => {
    console.log(x,y)
    if (delivery == true) {
        holes.push([x, y]);
    }
})

client.onConfig((param) => {
    // console.log(param);
})
client.onParcelsSensing(agentLoop)


/**
 * Options generation and filtering function
 */

// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )

function agentLoop() {
    // TODO revisit beliefset revision so to trigger option generation only in the case a new parcel is observed

    /**
     * Options generation
     */
    const options = []
    for (const parcel of parcels.values())
        if (!parcel.carriedBy)
            options.push(['go_pick_up', parcel.x, parcel.y, parcel.id]);
    // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

    if(carried_parcels.size != 0) options.push(["go_put_down"])
    /**
     * Options filtering
     */
    let best_option;
    let nearest = Number.MAX_VALUE;
    for (const option of options) {
        if (option[0] == 'go_pick_up') {
            let [go_pick_up, x, y, id] = option;
            let current_d = distance({ x, y }, me)
            if (current_d < nearest) {
                best_option = option
                nearest = current_d
            }
        }
        else if(option[0] == "go_put_down"){
            var hole = closest_hole()
            let [go_put_down] = option;
            let current_d = distance({ x:hole[0], y:hole[1] }, me)
            if (current_d < nearest) {
                best_option = option
                nearest = current_d
            }
        }
    }

    /**
     * Best option is selected
     */
    if (best_option)
        myAgent.push(best_option)
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
            // Consumes intention_queue if not empty
            if (this.intention_queue.length > 0) {
                console.log('intentionRevision.loop', this.intention_queue.map(i => i.predicate));

                // Current intention
                const intention = this.intention_queue[0];

                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                let id = intention.predicate[2]
                let p = parcels.get(id)
                if (p && p.carriedBy) {
                    console.log('Skipping intention because no more valid', intention.predicate)
                    continue;
                }

                // Start achieving intention
                await intention.achieve()
                    // Catch eventual error and continue
                    .catch(error => {
                        // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
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

}

class IntentionRevisionReplace extends IntentionRevision {

    async push(predicate) {

        // Check if already queued
        const last = this.intention_queue.at(this.intention_queue.length - 1);
        if (last && last.predicate.join(' ') == predicate.join(' ')) {
            return; // intention is already being achieved
        }

        console.log('IntentionRevisionReplace.push', predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);

        // Force current intention stop 
        if (last) {
            last.stop();
        }
    }

}

class IntentionRevisionRevise extends IntentionRevision {

    async push(predicate) {
        console.log( 'Revising intention queue. Received', ...predicate );

        if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) ) return;
        console.log("here")
        const intention = new Intention(this,predicate);
        this.intention_queue.push(intention);

        this.intention_queue.forEach(el=>{
            console.log("a:",el.predicate)
        })

        var current_d = 0;
        var current_value=0;
        var current_utility=0;
        var best_utility=0;
        var best_index = 0;
        // console.log("iq prima prima:",this.intention_queue)

        for( var i=0; i<this.intention_queue.length; i++){
            console.log("ANALYZING:",this.intention_queue[i].predicate)
            if(this.intention_queue[i].predicate[0] == "go_pick_up"){
                console.log("Found go_pick_up")
                current_d = distance(me, {x:this.intention_queue[i].predicate[1], y:this.intention_queue[i].predicate[2]});
                current_value = parcels.get(this.intention_queue[i].predicate[3]);
                current_utility= current_value.reward - current_d;
                if(current_utility > best_utility){
                    best_utility = current_utility;
                    best_index = i;
                }
            }
        }   a
        if (best_index != 0){
            console.log("splicing at",best_index)
            this.intention_queue[0].stop();
            // await client.timer(1000)
            var new_best = this.intention_queue.splice(best_index,1);
            console.log("new best:",new_best[0].predicate)
            this.intention_queue.unshift(new_best[0])
            // console.log("iq dopo:", this.intention_queue)

        }
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
    }

}

/**
 * Start intention revision loop
 */

// const myAgent = new IntentionRevisionQueue();
// const myAgent = new IntentionRevisionReplace();
const myAgent = new IntentionRevisionRevise();
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
                    this.log('failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', ...error);
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

    async execute(go_pick_up, x, y, id) {
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        console.log("id of picked_up:", carried_parcels.add(id))
        return true;
    }

}

class BlindMove extends Plan {

    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to';
    }

    async execute(go_to, x, y) {

        while (me.x != x || me.y != y) {

            if (this.stopped) throw ['stopped']; // if stopped then quit

            let status_x = false;
            let status_y = false;

            // this.log('me', me, 'xy', x, y);

            if (x > me.x)
                status_x = await client.move('right')
            // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if (x < me.x)
                status_x = await client.move('left')
            // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (y > me.y)
                status_y = await client.move('up')
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if (y < me.y)
                status_y = await client.move('down')
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }

            if (!status_x && !status_y) {
                this.log('stucked');
                throw 'stucked';
            } else if (me.x == x && me.y == y) {
                // this.log('target reached');
            }

        }

        return true;

    }
}


class GoPutDown extends Plan {
    static isApplicableTo(action,a,b,c) {
        console.log("predicate:", action)
        return action == "go_put_down";   //TODO forse
    }

    async execute(go_put_down, x, y) {
        console.log("putting down")
        var hole = closest_hole();
        // console.log("Closest hole:",hole)
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


class SmartMove extends Plan {

    static isApplicableTo ( action,a,b,c ) {
        console.log("predicate:",action)
        return action == 'go_to' || action == "go_to_random";
    }

    async execute ( go_to,x,y ) {    

        return await smart_movement(x,y);
    }


}


// plan classes are added to plan library 
planLibrary.push(BlindMove)
// planLibrary.push(SmartMove)
planLibrary.push(GoPickUp)
planLibrary.push(GoPutDown)


function closest_hole() {
    // console.log("Closest hole searching")
    var closest;
    var bestdistance = 10000000;
    for (var el of holes) {
        // console.log("el:",el)
        var d = distance({ x: me.x, y: me.y }, { x: el[0], y: el[1] });
        if (d < bestdistance) {
            // console.log("find new best")
            bestdistance = d;
            closest = el;
        }
    }
    return closest;
}


async function smart_movement(tx,ty){
    var circumnavigating = 0;
    var tries = 0;
    var total_tries = 5;

    var directions = new Map()
    directions.set(0,"up");
    directions.set(1,"right");
    directions.set(2,"down");
    directions.set(3,"left");

    var circ_moves = []
    console.log("Going to: ",tx,ty)
    // await client.move("right")

    var dir1;
    var dir2;
    var circ_dir1;
    var circ_dir2;

    var last_pos = [];

    var j = 1;
    var c = 0;

    while ((me.x != tx || me.y != ty) && circumnavigating != 3){
        // await client.timer(500)
        if(me.x < tx) dir1= 1; //right
        else if( me.x > tx) dir1 = 3; //left
        else if( me.x == tx) dir1 = -1;
        
        if(me.y < ty) dir2 = 0; //right
        else if( me.y > ty) dir2 = 2; //left
        else if( me.y == ty) dir2 = -1;

        switch (circumnavigating){

            case 0:{
                var status_1 = undefined;
                var status_2 = undefined;
                console.log("Normal movin")

                if(dir1 != -1) status_1 = await client.move(directions.get(dir1))
                if (status_1) {
                    // console.log("Managed to move ",directions.get(dir1))
                    me.x = status_1.x;
                    me.y = status_1.y;
    
                }

                if(dir2 != -1) status_2 = await client.move(directions.get(dir2))
                if (status_2) {
                    // console.log("Managed to move ",directions.get(dir2))
                    me.x = status_2.x;
                    me.y = status_2.y;
    
                }

                if((!status_1 || dir1 == -1) && (!status_2 || dir2 == -1)){
                    console.log("Stucked")
                    circumnavigating = 1;
                    
                    // console.log("A")
                }
                break;
            }

            case 1:{
                console.log("trying to circumnavigate 1")

                var dir_to_try1 = 0;
                var dir_to_try2 = 0;
                console.log(j)
                if(dir1 == -1) {
                    // console.log("case 1")
                    circ_dir1 = (dir2+4+j)%4;
                    circ_dir2 = (dir2+4-j)%4;
                    dir_to_try1 = dir2;
                    dir_to_try2 = dir2;
                }
                else if (dir2 == -1){
                    // console.log("case 2")
                    circ_dir1 = (dir1+4+j)%4;
                    circ_dir2 = (dir1+4-j)%4;
                    dir_to_try1 = dir1;
                    dir_to_try2 = dir1;
                }
                else{
                    // console.log("case 3")
                    circ_dir1 = (dir1+2)%4;
                    circ_dir2 = (dir2+2)%4;
                    dir_to_try1 = dir2;
                    dir_to_try2 = dir1;
                }
                c++;
                if(c==2){
                    j = j*-1;
                    c=0;
                }

                console.log("dir1:",dir1," dir2:",dir2," circ_dir1:",circ_dir1," circ_dir2:",circ_dir2);

                // if(looping){
                //     [dir1, dir2] =  [dir2, dir1]
                //     [circ_dir1, circ_dir2] =  [circ_dir2, circ_dir1]
                // }
                circ_moves = [];
                tries = 0;
                do{
                    // console.log("aaa")
                    var status = undefined;
                    var status_try = undefined;
                    console.log(circ_dir1)
                    status = await client.move(directions.get(circ_dir1))
                    tries++;
                    if(!status){
                        console.log("Cannot move ",directions.get(circ_dir1))
                        circumnavigating = 2; //maybe check if obstacle si a player
                        break;
                    }
                    else{
                        var p = [me.x, me.y];
                        console.log("Moved ",directions.get(circ_dir1))
                        circ_moves.push(circ_dir1)
                        status_try = await client.move(directions.get(dir_to_try1));
                        if(status_try){
                            if(p[0] == last_pos[0] && p[1] == last_pos[1]){
                                looping = true;
                                console.log("looping")
                            }
                            last_pos = p;
                            console.log("Managed to movee ",directions.get(dir_to_try1))
                            circumnavigating = 0;
                            break;
                        }
                    }
                } while (tries < total_tries)
                break;
            }

            case 2:{
                tries = 0;
                var m = circ_moves.shift()
                console.log("Going back..");
                while(m){
                    await client.move(directions.get((m+2)%4))
                    m = circ_moves.shift()
                }
                do{
                    var status = undefined;
                    var status_try = undefined;
                    console.log("in here")
                    status = await client.move(directions.get(circ_dir2))
                    tries++;
                    if(!status){
                        console.log("Cannot move ",directions.get(circ_dir2))
                        circumnavigating = 3; //maybe check if obstacle si a player
                        break;
                    }
                    else{
                        console.log("Moved ",directions.get(circ_dir2))
                        status_try = await client.move(directions.get(dir_to_try2));
                        if(status_try){
                            console.log("Managed to move ",directions.get(dir_to_try2))
                            circumnavigating = 0;
                            break;
                        }
                    }
                } while (tries < total_tries)
                if(tries == total_tries) circumnavigating = 3;
                break;
            }

        }
    }
    console.log("Outside")
    if(circumnavigating == 3){
        console.log("Cannot reach the target");
        // return 1;
    }
    else console.log("Target reached");
}



setInterval(agentLoop, 500);