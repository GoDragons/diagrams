import React from "react";

import "./Connection.scss";

export function Connection({
  style,
  id,
  onContextMenu,
  onMouseDown,
  isReadOnlyMode,
}) {
  function handleContextMenu(e) {
    if (isReadOnlyMode) {
      e.preventDefault();
      return;
    }

    if (typeof onContextMenu === "function") {
      onContextMenu(e, id);
    }
  }

  function handleMouseDown(e) {
    if (isReadOnlyMode) {
      return;
    }
    if (typeof onMouseDown === "function") {
      onMouseDown(e, id);
    }
  }

  return (
    <div
      className="connection"
      style={style}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <i className="end-icon fas fa-angle-right"></i>
    </div>
  );
}

export default React.memo(Connection);
