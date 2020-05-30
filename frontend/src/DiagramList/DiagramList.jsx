import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { REST_API_URL } from "common/constants";

import "./DiagramList.scss";

import DiagramItem from "./DiagramItem/DiagramItem";

export default function DiagramList({ userCredentials }) {
  const [diagrams, setDiagrams] = useState();
  useEffect(() => {
    if (userCredentials) {
      getDiagrams();
    }
  }, [userCredentials]);

  function getDiagrams() {
    console.log("getDiagrams() userCredentials = ", userCredentials);
    axios
      .get(`${REST_API_URL}/get-diagrams`, {
        headers: {
          Authorization: userCredentials.accessToken.jwtToken,
        },
      })
      .then((response) => setDiagrams(response.data))
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  function displayDiagramList() {
    if (!diagrams) {
      return <p>Loading diagrams...</p>;
    }
    if (diagrams.length === 0) {
      return <p>There are no diagrams. Create one now!</p>;
    }

    return diagrams.map((diagramData) => (
      <DiagramItem
        key={diagramData.diagramId}
        {...diagramData}
        refreshList={getDiagrams}
      />
    ));
  }

  return (
    <div className="diagram-list-container">
      <Link to="/create-diagram">
        <button className="create-diagram">Create Diagram</button>
      </Link>
      <h1>Diagram List:</h1>
      <div className="diagram-list">{displayDiagramList()}</div>
    </div>
  );
}
