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
      return;
    }
    onContextMenu(e, id);
  }

  function handleMouseDown(e) {
    if (isReadOnlyMode) {
      return;
    }
    onMouseDown(e, id);
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
