import React, { useState } from "react";

import "./ChatBox.scss";

export default function ChatBox({ messages, onSend }) {
  const [newMessage, setNewMessage] = useState("");

  function onSubmit() {
    onSend(newMessage);
    setNewMessage("");
  }

  function displayMessages() {
    if (!messages) {
      return <p className="message">No messages yet</p>;
    }
    return messages.map((messageItem, i) => {
      return (
        <p className="message" key={i}>
          {messageItem.content}
        </p>
      );
    });
  }

  return (
    <div className="chat-box">
      <div className="message-list">{displayMessages()}</div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={onSubmit}>Send</button>
    </div>
  );
}
