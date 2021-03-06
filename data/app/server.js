import { createServer } from 'http';
import { server as WebSocketServer } from 'websocket';
import { CODE } from './code.js';

const port = process.env.PORT || 3000;

const CONNECTIONS = new Map();//All connections

const server = createServer((request, response) => {
    console.log((new Date()) + ' Received request for ' + request.url);
    
    response.writeHead(200, 'text/html');
    response.write("Hello Vbros !!");
    response.end();
}).listen(port, '0.0.0.0', () => console.log("Listening on port", port));

const wsServer = new WebSocketServer({
    "httpServer": server,
    "autoAcceptConnections": false,
})


function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', request => {
    if (!originIsAllowed(request.origin)) {
        console.log("Denied connection from", request.socket.localAddress);
        return;
    } 

    const connection = request.accept(null, request.origin);

    console.log((new Date()) + ' Connection accepted.', request.host, request.socket.localAddress);

    CONNECTIONS.set(connection, true);

    const welcome = {
        code: 200,
        message: 'Welcome',
    }

    connection.sendUTF(JSON.stringify(welcome));

    connection.on('error', err => {
        console.error("A connection went wrong", err);
        connection.close();
        if (CONNECTIONS.has(connection)) CONNECTIONS.delete(connection);
    });

    connection.on('close', (code, description) => {
        console.log("A connection closed", code, description);
        if (CONNECTIONS.has(connection)) CONNECTIONS.delete(connection);
    })

    connection.on('message', message => {
        if (message.type === 'utf8') {
            console.log('Received Message:');

            try {
                var msg = JSON.parse(message.utf8Data);
                console.log(msg);
            } catch (e) {
                console.log(e);
                connection.sendUTF("Not a valid message");
                return;
            }

            const reply = {
                code: CODE.OK,
                message: "Got it",
            }
            
            connection.sendUTF(JSON.stringify(reply));

            for (let client of CONNECTIONS.keys()) {
                client.sendUTF(JSON.stringify(msg));
            }

            
        }
    })
})