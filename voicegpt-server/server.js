require('dotenv').config();  // Load environment variables from .env file

const { OpenAI } = require('openai');  // Import OpenAI SDK
const { ElevenLabsClient } = require('elevenlabs');  // Import ElevenLabs SDK
const http = require('http');  // Import HTTP module for server creation
const socketIo = require('socket.io');  // Import Socket.IO for real-time communication
const express = require('express');  // Import Express framework
const cors = require('cors');  // Import CORS to enable cross-origin requests

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

// Function to remove Markdown formatting from text
function stripMarkdown(markdownText) {
    const plainText = markdownText
        .replace(/!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g, '') // Remove images
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to text
        .replace(/`{3,}(.*?)`{3,}/gs, '$1') // Remove code blocks
        .replace(/`(.+?)`/g, '$1') // Remove inline code
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold formatting
        .replace(/(\*|_)(.*?)\1/g, '$2') // Remove emphasis
        .replace(/\~\~(.*?)\~\~/g, '$1'); // Remove strikethrough

    return plainText;
}

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

            let buffer = "";  // Initialize an empty buffer to accumulate output

            for await (const chunk of stream) {
                if (chunk.choices[0]?.delta?.content) {
                    buffer += chunk.choices[0].delta.content;  // Accumulate the output in the buffer
                    // Check if the buffer contains complete sentences
                    const regex = /(?<=[.!?])\s+(?=[A-Z]|\d)/;
                    const sentences = buffer.split(regex).filter(Boolean); // Split and remove empty elements
                    if (sentences.length > 1) {
                        let completeText = stripMarkdown(sentences.slice(0, -1).join(" "));  // Get all complete sentences
                        conversationHistory.push({ "role": "assistant", "content": completeText });  // Log AI response

                        const audioStream = await createAudioStreamFromText(completeText);
                        socket.emit('message', completeText);
                        socket.emit('audio', { audio: audioStream.toString('base64') });

                        buffer = sentences[sentences.length - 1];  // Keep the incomplete sentence in the buffer
                    }
                }
            }

            // After the loop, process any remaining content in the buffer
            if (buffer.trim()) {
                buffer = stripMarkdown(buffer);
                conversationHistory.push({ "role": "assistant", "content": buffer });  // Log AI response
                const audioStream = await createAudioStreamFromText(buffer);
                socket.emit('message', buffer);
                socket.emit('audio', { audio: audioStream.toString('base64') });
            }

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
