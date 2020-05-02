import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { REST_API_URL } from "common/constants";

import "./DiagramList.scss";

export default function DiagramList() {
  const [diagrams, setDiagrams] = useState();
  useEffect(() => {
    getDiagrams();
  }, []);

  function getDiagrams() {
    axios
      .get(`${REST_API_URL}/get-diagrams`)
      .then((response) => setDiagrams(response.data))
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  function deleteDiagram(diagramId) {
    axios
      .post(`${REST_API_URL}/delete-diagram`, { diagramId })
      .then(getDiagrams)
      .catch((e) => console.log(`Could not delete diagram:`, e.response.data));
  }

  function displayVersions(versions) {
    if (!versions) {
      return null;
    }
    return versions.map((version) => {
      const { diagramId, versionName, lastModified } = version;
      return (
        <li key={diagramId} className="version-item">
          <Link to={`/diagrams/${diagramId}`}>
            <span className="version-name">{versionName}</span>
            <span className="last-modified">
              {window.moment(lastModified).format("DD MMM YYYY - HH:mm:ss")}
            </span>
          </Link>
          <button onClick={(e) => deleteDiagram(diagramId)}>
            Delete version
          </button>
        </li>
      );
    });
  }

  function displayDiagramList() {
    if (!diagrams) {
      return <p>Loading diagrams...</p>;
    }
    if (diagrams.length === 0) {
      return <p>There are no diagrams. Create one now!</p>;
    }

    return diagrams.map(({ diagramId, diagramName, versions }) => {
      // const lastModifiedTimestamp =
      //   versions[versions.length - 1].lastModified;
      // const lastModifiedHumanReadable = window
      //   .moment(lastModifiedTimestamp)
      //   .format("DD MMM YYYY");

      return (
        <div className="diagram-item" key={diagramId}>
          <Link to={`/diagrams/${diagramId}`}>
            <h3 className="title">{diagramName}</h3>
          </Link>

          <p className="version-id">Versions: </p>
          <ul className="versions">{displayVersions(versions)}</ul>
        </div>
      );
    });
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
