import React, { useState } from "react";

import "./RevisionModal.scss";

export default function RevisionModal({ onSubmit, onClose }) {
  const [revisionName, setRevisionName] = useState("");

  function isValid() {
    // TODO: use a regex for this
    if (revisionName.includes("-") || revisionName.includes("_")) {
      return false;
    }
    if (revisionName.length < 1) {
      return false;
    }
    return true;
  }

  return (
    <div className="revision-modal-container">
      <div className="modal">
        <p className="label">
          <span>Choose a revision name</span>
          <span className="explanation">
            (only numbers, letters and spaces allowed)
          </span>
        </p>

        <input
          onChange={(e) => setRevisionName(e.target.value)}
          placeholder="e.g. Added a new lambda function"
          value={revisionName}
        />
        <br />
        <button
          className={isValid() ? "enabled" : "disabled"}
          onClick={(e) => onSubmit({ revisionName })}
        >
          Submit
        </button>
        <button onClick={() => onClose()}>Cancel</button>
      </div>
    </div>
  );
}
