import React, { useState, useEffect } from 'react';
import ChatInput from './components/ChatInput';
import MessageDisplay from './components/MessageDisplay';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for messages from the server
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for audio from the server
    socket.on('audio', (audioData) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioData.audio}`);
      audio.play();
    });

    return () => {
      socket.off('message');
      socket.off('audio');
    };
  }, []);

  const handleSend = (newMessage) => {
    // Send the message to the server
    socket.emit('message', newMessage);
    // Optionally add it to our state here if we don't want to rely on the server echo
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="App">
      <MessageDisplay messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default App;
