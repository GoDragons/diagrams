import React from "react";
import cx from "classnames";
import { Link } from "react-router-dom";

import "./DiagramDetails.scss";

export default function DiagramDetails({
  diagramData,
  isGridSnapActive,
  toggleGridSnap,
  openVersionModal,
}) {
  if (!diagramData) {
    return null;
  }
  return (
    <div className="diagram-details">
      <h3 className="diagram-name">{diagramData.diagramName}</h3>
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
