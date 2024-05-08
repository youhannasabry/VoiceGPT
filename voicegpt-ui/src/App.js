import React, { useState, useEffect } from 'react';
import ChatInput from './components/ChatInput';
import MessageDisplay from './components/MessageDisplay';
import io from 'socket.io-client';

// Establish a connection to the server using WebSocket to avoid CORS issues with HTTP polling
const socket = io('https://voicegpt-server-22d7f06d60b3.herokuapp.com/', {
  withCredentials: true,
  transports: ['websocket']
});

function App() {
  // State hooks to store messages and manage audio queue and playback status
  const [messages, setMessages] = useState([]);
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Function to handle incoming messages by updating the messages state
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    // Function to handle incoming audio data by updating the audio queue state
    const handleNewAudio = (audioData) => {
      setAudioQueue(prevQueue => [...prevQueue, `data:audio/mp3;base64,${audioData.audio}`]);
    };

    // Function to play audio from the queue
    const playAudio = (audioSrc) => {
      const audio = new Audio(audioSrc);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        setAudioQueue(prevQueue => prevQueue.slice(1)); // Remove the played audio from the queue
      };
      setIsPlaying(true);
    };

    // Check if there is audio in the queue and if nothing is currently playing, then play the first audio in the queue
    if (!isPlaying && audioQueue.length > 0) {
      playAudio(audioQueue[0]);
    }

    // Register event listeners for messages and audio
    socket.on('message', handleNewMessage);
    socket.on('audio', handleNewAudio);

    // Cleanup function to remove event listeners on component unmount
    return () => {
      socket.off('message', handleNewMessage);
      socket.off('audio', handleNewAudio);
    };
  }, [audioQueue, isPlaying]); // Effect dependencies include audioQueue and isPlaying

  // Function to send a new message to the server and update local state
  const handleSend = (newMessage) => {
    socket.emit('message', newMessage);
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
