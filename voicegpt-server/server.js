require('dotenv').config();

const { OpenAI } = require('openai');
const http = require('http');
const WebSocket = require('ws');
const socketIo = require('socket.io');
const express = require('express');
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

//OpenAI setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const voiceId = "21m00Tcm4TlvDq8ikWAM"; // replace with your voice_id
const model = 'eleven_turbo_v2';
const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;


// Function to convert text to speech and send the audio URL back to the client
async function textToSpeechAndSend(socket, text) {
    const xiApiKey = process.env.ELEVENLABS_API_KEY;
    const wsSocket = new WebSocket(wsUrl);

    wsSocket.onopen = () => {
        // Initialize the connection with BOS
        const bosMessage = {
            "text": " ",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            },
            "xi_api_key": xiApiKey,
        };

        wsSocket.send(JSON.stringify(bosMessage));  // Corrected to use wsSocket instead of socket

        // Send the input text message
        const textMessage = {
            "text": text,
            "try_trigger_generation": true,
        };

        wsSocket.send(JSON.stringify(textMessage));  // Corrected to use wsSocket instead of socket

        // End the input stream
        const eosMessage = {
            "text": ""
        };

        wsSocket.send(JSON.stringify(eosMessage));  // Corrected to use wsSocket instead of socket
    };

    wsSocket.onmessage = (event) => {
        const response = JSON.parse(event.data);

        if (response.audio) {
            const audioChunk = Buffer.from(response.audio, 'base64');  // Corrected decoding method
            console.log("Received audio chunk");
            // Emit the audio URL for the frontend to play
            const audioBlob = new Blob([audioChunk], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            socket.emit('audio_url', audioUrl);
        } else {
            console.log("No audio data in the response");
        }

        if (response.isFinal) {
            socket.emit('audio_end');
        }
    };

    wsSocket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        socket.emit('error', 'WebSocket error in TTS conversion');
    };

    wsSocket.onclose = (event) => {
        if (!event.wasClean) {
            console.warn('TTS WebSocket closed unexpectedly');
        }
    };
}

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');
    let conversationHistory = [];

    // Listen for messages from clients
    socket.on('message', async (msg) => {
        console.log('Received message: ' + msg);
        conversationHistory.push({ "role": "user", "content": msg });

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: conversationHistory,
                temperature: 1,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            const aiMessage = response.choices[0].message.content;
            conversationHistory.push({ "role": "assistant", "content": aiMessage });


            socket.emit('message', aiMessage);
            // Convert the GPT-4 response to speech and stream it back to the client
            // textToSpeechAndSend(socket, aiMessage);
        } catch (error) {
            console.error('Error in calling OpenAI API:', error);
            socket.emit('message', 'Error processing your message.');
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        conversationHistory = []; // Clear conversation history on disconnect
    });
});
// Set the server to listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
