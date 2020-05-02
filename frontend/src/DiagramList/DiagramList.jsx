import React from "react";

import { Link } from "react-router-dom";

import "./DiagramList.scss";

export default function DiagramList({ diagrams, deleteDiagram }) {
  function displayRevisions({ rootId, revisions }) {
    return revisions.map((revision) => {
      const diagramId = `${rootId}-${revision.revisionId}`;
      return (
        <li key={diagramId} className="revision-item">
          <Link to={`/diagrams/${rootId}-${revision.revisionId}`}>
            <span className="revision-name">{revision.revisionName}</span>
            <span className="last-modified">
              {window
                .moment(revision.lastModified)
                .format("DD MMM YYYY - HH:mm:ss")}
            </span>
          </Link>
          <button onClick={(e) => deleteDiagram(diagramId)}>
            Delete revision
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

    return diagrams.map(({ rootId, revisions }) => {
      // const lastModifiedTimestamp =
      //   revisions[revisions.length - 1].lastModified;
      // const lastModifiedHumanReadable = window
      //   .moment(lastModifiedTimestamp)
      //   .format("DD MMM YYYY");

      return (
        <div className="diagram-item" key={rootId}>
          <Link to={`/diagrams/${rootId}-${revisions[0].revisionId}`}>
            <h3 className="title">{rootId}</h3>
          </Link>

          <p className="revision-id">Revisions: </p>
          <ul className="revisions">
            {displayRevisions({ rootId, revisions })}
          </ul>
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
