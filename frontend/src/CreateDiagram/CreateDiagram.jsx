import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";

import axios from "axios";
import { REST_API_URL } from "common/constants";

import "./CreateDiagram.scss";

export function CreateDiagram() {
  const [diagramName, setDiagramName] = useState("");
  let history = useHistory();

  function createDiagram() {
    axios
      .post(`${REST_API_URL}/create-diagram`, { diagramName: diagramName })
      .then((response) => {
        history.push(
          `/diagrams/${response.data.diagramId}/${response.data.versionId}`
        );
      })
      .catch((e) => alert(`Could not create diagram:`, e));
  }

  function isValid() {
    if (diagramName.length < 1) {
      return false;
    }
    return true;
  }

  function onDiagramNameChange(e) {
    const newText = e.target.value;
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

      <button
        onClick={createDiagram}
        className={isValid() ? "enabled" : "disabled"}
      >
        Create
      </button>
    </div>
  );
}

// export default withRouter(CreateDiagram);
export default CreateDiagram;
