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

    return () => {
      socket.off('message');
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
