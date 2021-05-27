import { createServer } from 'http';
import { server as WebSocketServer } from 'websocket';
import { CODE } from './code.js';

const port = process.env.PORT || 7979;

const CONNECTIONS = {}//All connections

const server = createServer((request, response) => {
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

    CONNECTIONS[connection] = connection;

    const welcome = {
        code: 200,
        message: 'Welcome',
    }

    connection.sendUTF(JSON.stringify(welcome));

    connection.on('error', err => {
        console.error("A connection went wrong", err);
        connection.close();
        if (CONNECTIONS[connection]) delete CONNECTIONS[connection];
    });

    connection.on('close', (code, description) => {
        console.log("A connection closed", code, description);
        if (CONNECTIONS[connection]) delete CONNECTIONS[connection];
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

            for (let connection of Object.keys(CONNECTIONS)) {
                connection.sendUTF(JSON.stringify(msg));
            }

            connection.sendUTF(JSON.stringify(reply))
        }
    })
})