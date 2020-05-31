import React from "react";
import cx from "classnames";
import { Link } from "react-router-dom";

import "./DiagramDetails.scss";

export default function DiagramDetails({
  diagramData,
  isGridSnapActive,
  toggleGridSnap,
  openVersionModal,
  save,
  openShareModal,
}) {
  function displayVersionLabel() {
    if (diagramData.isLatest) {
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
        <Link to="/">
          <button className="home">Home</button>
        </Link>
        <button onClick={openShareModal} className="share">
          Share
        </button>

        {diagramData.isLatest ? (
          <button onClick={openVersionModal} className="create-version">
            Create Version
          </button>
        ) : null}
        {diagramData.isLatest ? (
          <button
            onClick={toggleGridSnap}
            className={cx("grid-snap", { on: isGridSnapActive })}
          >
            Grid Snap: {isGridSnapActive ? "on" : "off"}
          </button>
        ) : null}
        {diagramData.isLatest ? (
          <button onClick={save} className={cx("save")}>
            Save
          </button>
        ) : null}
      </div>
    </div>
  );
}
