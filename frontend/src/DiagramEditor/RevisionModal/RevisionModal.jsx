import React, { useState } from "react";

import "./RevisionModal.scss";

export default function RevisionModal({ onSubmit }) {
  const [revisionName, setRevisionName] = useState("");
  return (
    <div className="revision-modal-container">
      <div className="modal">
        <span>Choose a revision name</span>
        <br />
        <input
          onChange={(e) => setRevisionName(e.target.value)}
          value={revisionName}
        />
        <br />
        <button onClick={(e) => onSubmit({ revisionName })}>Submit</button>
      </div>
    </div>
  );
}
