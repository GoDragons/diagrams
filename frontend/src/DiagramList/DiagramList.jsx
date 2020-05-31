import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { REST_API_URL } from "common/constants";

import "./DiagramList.scss";

import DiagramItem from "./DiagramItem/DiagramItem";

export default function DiagramList({ userCredentials }) {
  const [loaded, setLoaded] = useState(false);
  const [ownDiagrams, setOwnDiagrams] = useState();
  const [invitedDiagrams, setInvitedDiagrams] = useState();

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
      .then((response) => {
        setOwnDiagrams(response.data.ownDiagrams);
        setInvitedDiagrams(response.data.invitedDiagrams);
        setLoaded(true);
      })
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  function displayDiagramList(diagrams) {
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

  if (!loaded) {
    return <p>Loading...</p>;
  }

  return (
    <div className="diagram-list-container">
      <Link to="/create-diagram">
        <button className="create-diagram">Create Diagram</button>
      </Link>
      <h1>My Diagrams:</h1>
      <div className="diagram-list">{displayDiagramList(ownDiagrams)}</div>
      {invitedDiagrams.length ? (
        <>
          <h1>Shared with me:</h1>
          <div className="diagram-list">
            {displayDiagramList(invitedDiagrams)}
          </div>
        </>
      ) : null}
    </div>
  );
}
