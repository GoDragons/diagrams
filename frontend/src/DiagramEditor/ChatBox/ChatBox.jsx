import React, { useState } from "react";

import "./ChatBox.scss";

import cx from "classnames";

export default function ChatBox({ messages, onSend, authorId }) {
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
        <p
          className={cx("message", {
            ours: messageItem.authorId === authorId,
          })}
          key={i}
        >
          <span className="message-content">{messageItem.content}</span>

          <span className="timestamp">
            {window.moment(messageItem.sentAt).format("HH:mm")}
          </span>
        </p>
      );
    });
  }

  return (
    <div className="chat-box">
      <p className="title">Chat</p>
      <div className="message-list">{displayMessages()}</div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={onSubmit}>Send</button>
    </div>
  );
}
