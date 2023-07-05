import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "@unitn-asa/pddl-client";
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

export const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyZWUxOTdiZjY4IiwibmFtZSI6ImRhdmlkZSIsImlhdCI6MTY4ODEzMjUzMH0.Ep3bfFpB6ZGgwX6zfVknN8UACXTbVC6D-GHRnDJNTM4'
)

export class BeliefCose {
    #myBeliefSet = new Beliefset();
    #domain;
    constructor() {
        // build domain
        const right = new PddlAction(
            'right',
            '?x ?y ?xn',
            'and (inc ?x ?xn) (at ?x ?y) (valid ?xn ?y)',
            'and (at ?xn ?y) (not (at ?x ?y))'
        );
        
        const left = new PddlAction(
            'left',
            '?x ?y ?xn',
            'and (dec ?x ?xn) (at ?x ?y) (valid ?xn ?y)',
            'and (at ?xn ?y) (not (at ?x ?y))'
        );

        const up = new PddlAction(
            'up',
            '?x ?y ?yn',
            'and (inc ?y ?yn) (at ?x ?y) (valid ?x ?yn)',
            'and (at ?x ?yn) (not (at ?x ?y))'
        );
        
        const down = new PddlAction(
            'down',
            '?x ?y ?yn',
            'and (dec ?y ?yn) (at ?x ?y) (valid ?x ?yn)',
            'and (at ?x ?yn) (not (at ?x ?y))'
        );

        var pddlDomain = new PddlDomain('dunder-mifflin', right, left, up, down);
        this.#domain = pddlDomain.toPddlString();

        // populate belief set
        client.onMap((width, height, tiles) => {
            console.log(tiles);
            for (var i = 0; i < width; i++) {
                for (var j = 0; j < height; j++) {
                    var inTiles = false;
                    var belief = 'valid v' + i + ' v' + j;
                    
                    for (let {x, y} of tiles) {
                        //console.log(x, y);
                        if (x == i && y == j) {
                            inTiles = true;
                            break;
                        }
                    }
                    if (inTiles) {
                        this.#myBeliefSet.declare(belief);
                        // console.log(belief);
                    }
                    else {
                        this.#myBeliefSet.undeclare(belief);  
                        // console.log("NOT", belief);
                    }
                }
            }
            for (var i = 0; i < (width - 1); i++) {
                var next = i + 1;
                var inc = 'inc v' + i + ' v' + next;
                this.#myBeliefSet.declare(inc);
            }
            for (var i = width - 1; i  > 0; i--) {
                var prev = i - 1;
                var dec = 'dec v' + i + ' v' + prev;
                this.#myBeliefSet.declare(dec);
            }
        });

        
    }

    updateBeliefSet(x, y, valid) {
        // INSERIRE CONTROLLI SU x E y???
        var new_belief = 'valid v' + x + ' v' + y; 
        if (valid) {
            this.#myBeliefSet.declare(belief);
        }
        else {
            this.#myBeliefSet.undeclare(belief);
        }
    }

    async generate_plan(x_from, y_from, x_to, y_to) {
        // INSERIRE CONTROLLI SU x E y???
        var curr_pos = 'at v' + x_from + " v" + y_from;
        this.#myBeliefSet.declare(curr_pos);
        var goal = "at v" + x_to + " v" + y_to;
        var pddlProblem = new PddlProblem(
            'dunder-mifflin',
            this.#myBeliefSet.objects.join(' '),
            this.#myBeliefSet.toPddlString(),
            goal
        );

        var problem = pddlProblem.toPddlString();
        // console.log("domain;",this.#domain);
        // console.log("problem:",problem)
        var plan = await onlineSolver(this.#domain, problem); 
        var plan_array = [];
        for (var element of plan) {
            plan_array.push(element.action);
        }
        console.log("pianino:",plan_array)
        return plan_array;
    }

    getBeliefSet() {
        return this.#myBeliefSet.entries;
    }

    

}