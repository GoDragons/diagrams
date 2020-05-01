import React from "react";

import { Link } from "react-router-dom";

import "./DiagramList.scss";

export default function DiagramList({ diagrams, deleteDiagram }) {
  function displayDiagramList() {
    if (!diagrams) {
      return <p>Loading diagrams...</p>;
    }
    if (diagrams.length === 0) {
      return <p>There are no diagrams. Create one now!</p>;
    }

    return diagrams.map(({ diagramId, lastModified, revisionName }) => (
      <div className="diagram-item" key={diagramId}>
        <Link to={`/diagrams/${diagramId}`}>
          <h3 className="title">{diagramId}</h3>
        </Link>
        <p className="created">Last modified: {lastModified}</p>
        <p className="revision-id">Revision ID: {0}</p>
        <p className="revision-id">Revision Name: {revisionName}</p>
        <button onClick={(e) => deleteDiagram({ diagramId })}>Delete</button>
      </div>
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
