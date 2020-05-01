import React, { useState } from "react";

import { Link } from "react-router-dom";

import "./CreateDiagram.scss";

export default function CreateDiagram({ onSubmit }) {
  const [diagramName, setDiagramName] = useState("");

  function submit() {
    onSubmit({ diagramName });
  }

  function isValid() {
    // TODO: use a regex for this
    if (diagramName.includes("-")) {
      return false;
    }
    if (diagramName.length < 1) {
      return false;
    }
    return true;
  }

  function onDiagramNameChange(e) {
    const newText = e.target.value.replace(/[^a-z0-9_]/gi, "");
    setDiagramName(newText);
  }

  return (
    <div
      className="create-diagram
    "
    >
      <Link to="/">
        <button className="home">Home</button>
      </Link>

      <p className="label">
        <span>Choose a diagram name</span>
        <span className="explanation">
          (only numbers, letters and underscores allowed)
        </span>
      </p>
      <input value={diagramName} onChange={onDiagramNameChange} />

      <button onClick={submit} className={isValid() ? "enabled" : "disabled"}>
        Create
      </button>
    </div>
  );
}
