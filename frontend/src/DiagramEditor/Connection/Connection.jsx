import React from "react";

import "./Connection.scss";

export default function Connection({ style, id, onContextMenu, onMouseDown }) {
  return (
    <div
      className="connection"
      style={style}
      onMouseDown={(e) => {
        if (typeof onMouseDown === "function") onMouseDown(e, id);
      }}
      onContextMenu={(e) => onContextMenu(e, id)}
    >
      <i className="end-icon fas fa-angle-right"></i>
    </div>
  );
}
