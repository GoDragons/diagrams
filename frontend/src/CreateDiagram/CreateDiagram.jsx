import React, { useState } from "react";

import { Link } from "react-router-dom";

export default function CreateDiagram({ onSubmit }) {
  const [diagramName, setDiagramName] = useState("");

  function submit() {
    onSubmit({ diagramName });
  }

  return (
    <div>
      <Link to="/">
        <button className="home">Home</button>
      </Link>
      <br />
      <label>Create diagram</label>
      <br />
      <input
        value={diagramName}
        onChange={(e) => setDiagramName(e.target.value)}
      />
      <br />
      <button onClick={submit}>Create</button>
    </div>
  );
}
