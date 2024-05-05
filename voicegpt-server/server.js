require('dotenv').config();

const { OpenAI } = require('openai');
const { ElevenLabsClient } = require('elevenlabs');
const http = require('http');
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
      chunks.push(chunk);
    }
  
    const content = Buffer.concat(chunks);
    return content;
  };

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

            // Stream the GPT-4 response to the client
            const audioStream = await createAudioStreamFromText(aiMessage);
            socket.emit('message', aiMessage);
            socket.emit('audio', { audio: audioStream.toString('base64') });
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
