import React from 'react';
import styled from 'styled-components';

const MessagesContainer = styled.div`
  height: 80vh;
  overflow-y: auto;
  padding: 20px;
  background-color: white;
`;

const Message = styled.div`
  margin-bottom: 10px;
  line-height: 1.5;
  font-size: 16px;
  color: #333;
`;

const MessageDisplay = ({ messages }) => {
  return (
    <MessagesContainer>
      {messages.map((msg, index) => (
        <Message key={index}>{msg}</Message>
      ))}
    </MessagesContainer>
  );
};

export default MessageDisplay;
