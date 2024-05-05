import React, { useState } from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  padding: 20px;
  background-color: #f5f5f7;
  border-top: 1px solid #d1d1d6;
`;

const Input = styled.input`
  width: calc(100% - 20px);
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
`;

const ChatInput = ({ onSend }) => {
  const [input, setInput] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <InputContainer>
      <Input
        type="text"
        placeholder="Type your message here..."
        value={input}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
    </InputContainer>
  );
};

export default ChatInput;
