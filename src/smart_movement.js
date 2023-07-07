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