import React, { useState } from "react";

import "./VersionModal.scss";

export default function VersionModal({ onSubmit, onClose }) {
  const [versionName, setVersionName] = useState("");

  function isValid() {
    // TODO: use a regex for this
    if (versionName.includes("-") || versionName.includes("_")) {
      return false;
    }
    if (versionName.length < 1) {
      return false;
    }
    return true;
  }

  function onKeyPress(e) {
    if (e.key === "Enter") {
      onSubmit({ versionName });
    }
  }

  return (
    <div className="version-modal-container">
      <div className="modal">
        <p className="label">
          <span>Choose a version name</span>
          <span className="explanation">
            (only numbers, letters and spaces allowed)
          </span>
        </p>

        <input
          onChange={(e) => setVersionName(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="e.g. Added a new lambda function"
          value={versionName}
        />
        <br />
        <button
          className={isValid() ? "enabled" : "disabled"}
          onClick={(e) => onSubmit({ versionName })}
        >
          Submit
        </button>
        <button onClick={() => onClose()}>Cancel</button>
      </div>
    </div>
  );
}
