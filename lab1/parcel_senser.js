
// import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { default as config } from "./../config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

client.socket.on('parcels sensing', (parcels) => {
    console.log(parcels);
})