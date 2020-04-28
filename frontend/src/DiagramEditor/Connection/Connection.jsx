import React from "react";

import "./Connection.scss";

export default function Connection({ style, id, onContextMenu, onMouseDown }) {
  return (
    <div
      className="connection"
      style={style}
      onMouseDown={(e) => onMouseDown(e, id)}
      onContextMenu={(e) => onContextMenu(e, id)}
      // onContextMenu={(e) => console.log("connection context menu")}
    >
      <i className="end-icon fas fa-angle-right"></i>
    </div>
  );
}
