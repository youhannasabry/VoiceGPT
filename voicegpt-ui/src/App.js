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
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);


  useEffect(() => {
    // Function to handle incoming messages
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    // Function to handle incoming audio data
    const handleNewAudio = (audioData) => {
      setAudioQueue(prevQueue => [...prevQueue, `data:audio/mp3;base64,${audioData.audio}`]);
    };

    const playAudio = (audioSrc) => {
      const audio = new Audio(audioSrc);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        setAudioQueue(prevQueue => prevQueue.slice(1));
      };
      setIsPlaying(true);
    };

    if (!isPlaying && audioQueue.length > 0) {
      playAudio(audioQueue[0]);
    }

    // Register event listeners for messages and audio
    socket.on('message', handleNewMessage);
    socket.on('audio', handleNewAudio);

    // Cleanup function to remove event listeners
    return () => {
      socket.off('message', handleNewMessage);
      socket.off('audio', handleNewAudio);
    };
  }, [audioQueue, isPlaying]);

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
