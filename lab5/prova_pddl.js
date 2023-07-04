import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "@unitn-asa/pddl-client";

async function main () {
    const myBeliefset = new Beliefset();
    myBeliefset.declare('clear base2');
    myBeliefset.declare('clear base3');
    myBeliefset.undeclare('clear base1');
    myBeliefset.undeclare('clear disk1');
    myBeliefset.undeclare('clear disk2');
    myBeliefset.declare('clear disk3');
    myBeliefset.declare('on disk3 disk2');
    myBeliefset.declare('on disk2 disk1');
    myBeliefset.declare('on disk1 base1');
    myBeliefset.declare('empty');
    myBeliefset.declare('smaller disk3 disk2');
    myBeliefset.declare('smaller disk3 disk1');
    myBeliefset.declare('smaller disk3 base1');
    myBeliefset.declare('smaller disk3 base2');
    myBeliefset.declare('smaller disk3 base3');
    myBeliefset.declare('smaller disk2 disk1');
    myBeliefset.declare('smaller disk2 base1');
    myBeliefset.declare('smaller disk2 base2');
    myBeliefset.declare('smaller disk2 base3');
    myBeliefset.declare('smaller disk1 base1');
    myBeliefset.declare('smaller disk1 base2');
    myBeliefset.declare('smaller disk1 base3');
    /* myBeliefset.undeclare('holding disk1');
    myBeliefset.undeclare('holding disk2');
    myBeliefset.undeclare('holding disk3');
    myBeliefset.undeclare('holding base1');
    myBeliefset.undeclare('holding base2');
    myBeliefset.undeclare('holding base3'); */

    //console.log(myBeliefset);

    var pddlProblem = new PddlProblem(
        'hanoi',
        myBeliefset.objects.join(' '),
        myBeliefset.toPddlString(),
        'and (on disk3 disk2) (on disk2 disk1) (on disk1 base2) (empty)'
    );

    const pickup = new PddlAction(
        'pickup',
        '?disk ?bottom',
        'and (clear ?disk) (empty) (not (clear ?bottom)) (on ?disk ?bottom)',
        'and (holding ?disk) (not (empty)) (not (clear ?disk)) (clear ?bottom) (not (on ?disk ?bottom))',
        async (disk, bottom) => console.log('exec pickup', disk, bottom)
    );

    const putdown = new PddlAction(
        'putdown',
        '?disk ?bottom',
        'and (not (empty)) (not (clear ?disk)) (holding ?disk) (clear ?bottom) (not (on ?disk ?bottom)) (smaller ?disk ?bottom)',
        'and (on ?disk ?bottom) (not (clear ?bottom)) (clear ?disk) (empty) (not (holding ?disk))',
        async (disk, bottom) => console.log('exec putdown', disk, bottom)
    );
    
    console.log( pickup.toPddlString() );
    console.log( putdown.toPddlString() );
    console.log( PddlAction.tokenize( pickup.precondition ) );
    console.log( PddlAction.tokenize( pickup.effect ) );

    console.log( PddlAction.tokenize( putdown.precondition ) );
    console.log( PddlAction.tokenize( putdown.effect ) );
    
   
    
    let problem = pddlProblem.toPddlString();
    console.log( problem );
    var pddlDomain = new PddlDomain('hanoi', pickup, putdown);
    let domain = pddlDomain.toPddlString();
    console.log('domain', domain );
    var plan = await onlineSolver( domain, problem );
    const pddlExecutor = new PddlExecutor( pickup, putdown );
    pddlExecutor.exec( plan );

}
main();