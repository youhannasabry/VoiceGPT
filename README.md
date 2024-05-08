# VoiceGPT Project

Welcome to the VoiceGPT project! This repository contains both the server (`voicegpt-server`) and the user interface (`voicegpt-ui`) components. The project integrates voice capabilities with OpenAI's GPT models, providing a seamless interface for voice-based interactions through a web application.

## Features

- **Real-time Voice Interaction**: Utilizes ElevenLabs API to convert text responses from GPT into spoken voice.
- **WebSocket Communication**: Real-time communication between the client and server using Socket.IO.
- **OpenAI Integration**: Leverages OpenAI's powerful GPT models for generating conversational responses.
- **Express Server**: Robust backend with Express.js to handle API requests and routing.
- **React Frontend**: User interface built with React to send and receive messages.

## Installation

To get started with the VoiceGPT project, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/youhannasabry/voicegpt.git
   ```
2. Navigate to the server directory:
   ```bash
   cd voicegpt/voicegpt-server
   ```
3. Install the required dependencies for the server:
   ```bash
   npm install
   ```
4. Set up the environment variables for the server:
   - Rename `.env.example` to `.env`.
   - Fill in the `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` with your respective API keys.
5. Start the server:
   ```bash
   npm start
   ```

6. Open a new terminal and navigate to the UI directory:
   ```bash
   cd voicegpt/voicegpt-ui
   ```
7. Install the required dependencies for the UI:
   ```bash
   npm install
   ```
8. Start the React application:
   ```bash
   npm start
   ```

## Usage

Once the server and the UI are running, open your web browser and go to `http://localhost:3000` to interact with the application. You can start sending prompts and receive responses both in text and voice format.

Thank you for exploring the VoiceGPT project!