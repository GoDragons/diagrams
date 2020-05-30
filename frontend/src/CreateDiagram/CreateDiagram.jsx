import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";

import axios from "axios";
import { REST_API_URL } from "common/constants";

import "./CreateDiagram.scss";

export function CreateDiagram({ userCredentials }) {
  const [diagramName, setDiagramName] = useState("");
  const [isLoading, setIsLoading] = useState("");
  let history = useHistory();

  function createDiagram() {
    setDiagramName("");
    setIsLoading(true);
    console.log("userCredentials:", userCredentials);
    const authorId = userCredentials.accessToken.payload.username;
    console.log("authorId = ", authorId);
    axios
      .post(
        `${REST_API_URL}/create-diagram`,
        { diagramName: diagramName, authorId },
        {
          headers: {
            Authorization: userCredentials.accessToken.jwtToken,
          },
        }
      )
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

  function onKeyPress(e) {
    if (e.key === "Enter") {
      createDiagram();
    }
  }

  return (
    <div className="create-diagram">
      <Link to="/">
        <button className="home">Home</button>
      </Link>

      <p className="label">
        <span>Choose a diagram name</span>
        <span className="explanation">
          (only numbers, letters and underscores allowed)
        </span>
      </p>
      <input
        value={diagramName}
        onChange={onDiagramNameChange}
        onKeyPress={onKeyPress}
      />

      <button
        onClick={createDiagram}
        className={isValid() ? "enabled" : "disabled"}
      >
        {isLoading ? "Submitting..." : "Create"}
      </button>
    </div>
  );
}

// export default withRouter(CreateDiagram);
export default CreateDiagram;
