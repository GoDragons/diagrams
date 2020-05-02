import React from "react";
import cx from "classnames";
import { Link } from "react-router-dom";

import "./DiagramDetails.scss";

export default function DiagramDetails({
  diagramData,
  isLatestVersion,
  isGridSnapActive,
  toggleGridSnap,
  openVersionModal,
}) {
  function displayVersionLabel() {
    if (isLatestVersion) {
      return <span className="version latest-version">(latest version)</span>;
    } else {
      return (
        <span className="version old-version">
          (old version - read-only mode)
        </span>
      );
    }
  }

  if (!diagramData) {
    return null;
  }

  return (
    <div className="diagram-details">
      <h3 className="diagram-name">
        {diagramData.diagramName}
        {displayVersionLabel()}
      </h3>
      <div className="toolbar">
        <button
          onClick={toggleGridSnap}
          className={cx("grid-snap", { on: isGridSnapActive })}
        >
          Grid Snap: {isGridSnapActive ? "on" : "off"}
        </button>
        <Link to="/">
          <button className="home">Home</button>
        </Link>
        <button onClick={openVersionModal} className="create-version">
          Create Version
        </button>
      </div>
    </div>
  );
}
