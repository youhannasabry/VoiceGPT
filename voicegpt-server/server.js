require('dotenv').config();  // Load environment variables from .env file

const { OpenAI } = require('openai');  // Import OpenAI SDK
const { ElevenLabsClient } = require('elevenlabs');  // Import ElevenLabs SDK
const http = require('http');  // Import HTTP module for server creation
const socketIo = require('socket.io');  // Import Socket.IO for real-time communication
const express = require('express');  // Import Express framework
const cors = require('cors');  // Import CORS to enable cross-origin requests

// Create an Express application
const app = express();
app.use(cors());  // Enable CORS with default settings

// Create a server from the Express app
const server = http.createServer(app);

// Initialize socket.io with the server
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow all origins (adjust in production for security)
        methods: ["GET", "POST"]  // Allowed methods for CORS
    }
});

// OpenAI setup with API key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ElevenLabs setup with specific voice and model, and API key from environment variables
const voice = "TWUKKXAylkYxxlPe4gx0";
const model = 'eleven_turbo_v2';
const elevenLabsClient = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

// Function to convert text to speech and send the audio URL back to the client
const createAudioStreamFromText = async (text) => {
    const audioStream = await elevenLabsClient.generate({
      voice,
      model_id: model,
      text,
    });
  
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);  // Collect audio stream chunks
    }
  
    const content = Buffer.concat(chunks);  // Combine chunks into a single buffer
    return content;
};

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');
    let conversationHistory = [];  // Initialize conversation history

    // Listen for messages from clients
    socket.on('message', async (msg) => {
        console.log('Received message: ' + msg);
        conversationHistory.push({ "role": "user", "content": msg });  // Log user message

        try {
            // Generate a response using OpenAI's GPT-4 model
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
            conversationHistory.push({ "role": "assistant", "content": aiMessage });  // Log AI response

            // Stream the GPT-4 response to the client
            const audioStream = await createAudioStreamFromText(aiMessage);
            socket.emit('message', aiMessage);
            socket.emit('audio', { audio: audioStream.toString('base64') });  // Send audio stream as base64
        } catch (error) {
            console.error('Error in calling OpenAI API:', error);
            socket.emit('message', 'Error processing your message.');  // Notify client of error
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        conversationHistory = [];  // Clear conversation history on disconnect
    });
});

// Set the server to listen on port 3000 or environment-specified port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
