import React, { useState, useEffect } from 'react';
import ChatInput from './components/ChatInput';
import MessageDisplay from './components/MessageDisplay';
import io from 'socket.io-client';

// Establish a connection to the server
const socket = io('https://voicegpt-server-22d7f06d60b3.herokuapp.com/', {
  withCredentials: true,
  transports: ['websocket']  // Use WebSocket to avoid CORS issues with HTTP polling
});

function App() {
  // State to store messages
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Function to handle incoming messages
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    // Function to handle incoming audio data
    const handleNewAudio = (audioData) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioData.audio}`);
      audio.play();
    };

    // Register event listeners for messages and audio
    socket.on('message', handleNewMessage);
    socket.on('audio', handleNewAudio);

    // Cleanup function to remove event listeners
    return () => {
      socket.off('message', handleNewMessage);
      socket.off('audio', handleNewAudio);
    };
  }, []);

  // Function to send a new message to the server
  const handleSend = (newMessage) => {
    socket.emit('message', newMessage);
    // Update local state to include the new message
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  return (
    <div className="App">
      <MessageDisplay messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default App;
