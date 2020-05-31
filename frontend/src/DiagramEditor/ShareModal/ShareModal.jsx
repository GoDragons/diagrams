import React, { useState } from "react";

import "./ShareModal.scss";

export default function ShareModal({ onSubmit, onClose }) {
  const [recipient, setRecipient] = useState("");

  function isValid() {
    if (recipient.length < 1) {
      return false;
    }
    return true;
  }

  function onKeyPress(e) {
    if (e.key === "Enter") {
      onSubmit({ recipient });
    }
  }

  return (
    <div className="share-modal-container">
      <div className="modal">
        <p className="label">
          <span>Username of recipient</span>
          <span className="explanation"></span>
        </p>

        <input
          onChange={(e) => setRecipient(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="e.g. Bob"
          value={recipient}
        />
        <br />
        <button
          className={isValid() ? "enabled" : "disabled"}
          onClick={(e) => onSubmit({ recipient })}
        >
          Submit
        </button>
        <button onClick={() => onClose()}>Cancel</button>
      </div>
    </div>
  );
}
