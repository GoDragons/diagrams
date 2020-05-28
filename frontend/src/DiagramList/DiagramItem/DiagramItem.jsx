import React, { useState } from "react";

import axios from "axios";
import { Link } from "react-router-dom";

import { REST_API_URL } from "common/constants";
import "./DiagramItem.scss";

export default function DiagramItem({
  diagramId,
  latestVersionId,
  diagramName,
  versions,
  refreshList,
}) {
  const [shouldDisplayVersions, setShouldDisplayVersions] = useState(false);

  function deleteVersion(versionId) {
    axios
      .post(`${REST_API_URL}/delete-version`, { diagramId, versionId })
      .then(refreshList)
      .catch((e) => console.log(`Could not delete version:`, e.response.data));
  }
  function deleteDiagram() {
    axios
      .post(`${REST_API_URL}/delete-diagram`, { diagramId })
      .then(refreshList)
      .catch((e) => console.log(`Could not delete diagram:`, e.response.data));
  }

  function displayVersions(versions) {
    if (!shouldDisplayVersions) {
      return null;
    }
    if (!versions || versions.length === 1) {
      return null;
    }
    const versionElements = versions.slice(1).map((version) => {
      const { versionId, versionName, lastModified } = version;
      return (
        <li key={`${diagramId}-${versionId}`} className="version-item">
          <Link to={`/diagrams/${diagramId}/${versionId}`}>
            <span className="version-name">{versionName}</span>
            <span className="last-modified">
              {window.moment(lastModified).format("DD MMM YYYY - HH:mm:ss")}
            </span>
          </Link>
          <button onClick={(e) => deleteVersion(versionId)}>
            Delete version
          </button>
        </li>
      );
    });

    return (
      <div className="version-list-container">
        <p className="version-id">Versions: </p>
        <ul className="versions">{versionElements}</ul>
      </div>
    );
  }

  const lastModifiedTimestamp = versions[versions.length - 1].lastModified;
  const lastModifiedHumanReadable = window
    .moment(lastModifiedTimestamp)
    .format("DD MMM YYYY");

  return (
    <div className="diagram-item" key={diagramId}>
      <Link to={`/diagrams/${diagramId}/${latestVersionId}`}>
        <h3 className="title">{diagramName}</h3>
      </Link>
      <p className="last-modified">Last modified:{lastModifiedHumanReadable}</p>
      <button onClick={deleteDiagram}>Delete diagram</button>
      <button onClick={(e) => setShouldDisplayVersions(!shouldDisplayVersions)}>
        {shouldDisplayVersions ? "Hide" : "Show"} history
      </button>

      {displayVersions(versions)}
    </div>
  );
}
