require('dotenv').config();  // Load environment variables from .env file
const http = require('http');  // Import HTTP module for server creation
const express = require('express');  // Import Express framework
const cors = require('cors');  // Import CORS to enable cross-origin requests
const WebSocket = require('ws');
const socketIo = require('socket.io');  // Import Socket.IO for real-time communication
const { OpenAI } = require('openai');  // Import OpenAI SDK

// Create an Express application
const app = express();
const corsOptions = {
    origin: 'https://voice-gpt-jade-ten.vercel.app',
    optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));  // Enable CORS with the specified options

// Create a server from the Express app
const server = http.createServer(app);

// Initialize socket.io with the server
const io = socketIo(server, {
    cors: {
        origin: "https://voice-gpt-jade-ten.vercel.app/",  // Allow origins (adjust in production for security)
        methods: ["GET", "POST"],  // Allowed methods for CORS
        credentials: true,
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const voiceId = "TWUKKXAylkYxxlPe4gx0"; // replace with your voice_id
const model = 'eleven_turbo_v2';
const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
let socket;

io.on('connection', (ioSocket) => {
    console.log('A user connected');
    let conversationHistory = [];  // Initialize conversation history

    ioSocket.on('message', async (msg) => {
        console.log('Received message: ' + msg);
        conversationHistory.push({ "role": "user", "content": msg });  // Log user message

        // Initialize WebSocket connection upon receiving a message
        socket = new WebSocket(wsUrl);

        socket.onopen = async function (event) {
            const bosMessage = {
                "text": " ",
                "voice_settings": {
                    "stability": 0.8,
                    "similarity_boost": 0.8
                },
                "xi_api_key": process.env.ELEVENLABS_API_KEY, // replace with your API key
            };

            socket.send(JSON.stringify(bosMessage));

            const stream = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: conversationHistory,
                temperature: 1,
                max_tokens: 4096,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                stream: true,
            });

            for await (const chunk of stream) {
                if (chunk.choices[0]?.delta?.content) {
                    const textMessage = {
                        "text": chunk.choices[0]?.delta?.content,
                        "try_trigger_generation": true,
                    };
                    ioSocket.emit('message', chunk.choices[0]?.delta?.content);
                    socket.send(JSON.stringify(textMessage));
                }
            }

            // Send the EOS message with an empty string
            const eosMessage = {
                "text": ""
            };

            socket.send(JSON.stringify(eosMessage));
        };

        socket.onmessage = function (event) {
            const response = JSON.parse(event.data);

            if (response.audio) {
                console.log("Received audio chunk");
                // decode and handle the audio data (e.g., play it)
                const audioChunk = response.audio.toString("base64");  // decode base64
                io.emit('audio', { audio: audioChunk }); // Emit the audio chunk through the io socket
            } else {
                console.log("No audio data in the response");
            }

            if (response.isFinal) {
                // the generation is complete
            }

            if (response.normalizedAlignment) {
                // use the alignment info if needed
            }
        };

        socket.onerror = function (error) {
            console.error(`WebSocket Error: ${error}`);
        };

        socket.onclose = function (event) {
            if (event.wasClean) {
                console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
            } else {
                console.warn('Connection died');
            }
        };
    });

    // Handle disconnection
    ioSocket.on('disconnect', () => {
        console.log('A user disconnected');
        conversationHistory = [];  // Clear conversation history on disconnect
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
