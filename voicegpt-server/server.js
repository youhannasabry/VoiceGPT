const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create an Express application
const app = express();
app.use(cors());

// Create a server from the Express app
const server = http.createServer(app);

// Initialize socket.io with the server
const io = socketIo(server, {
    cors: {
        origin: "*",  // Adjust accordingly in production for security
        methods: ["GET", "POST"]
    }
});

// Serve a simple test page
app.get('/', (req, res) => {
    res.send('<h1>Hello World</h1>');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for messages from clients
    socket.on('message', (msg) => {
        console.log('Received message: ' + msg);

        // Broadcast the message to all clients
        io.emit('message', msg);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Set the server to listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
