import React from "react";

import "./ComponentItem.scss";

import cx from "classnames";

export function ComponentItem({
  id,
  x,
  y,
  iconPath,
  label,
  selectedComponentId,
  onMouseDown,
  onMouseUp,
  onContextMenu,
  isReadOnlyMode,
}) {
  function handleContextMenu(e) {
    if (isReadOnlyMode) {
      e.preventDefault();
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
  function handleMouseUp(e) {
    if (isReadOnlyMode) {
      return;
    }
    onMouseUp(e, id);
  }

  return (
    <div
      className={cx("component", {
        "is-read-only-mode": isReadOnlyMode,
        "is-interactive": !isReadOnlyMode,
        selected: !isReadOnlyMode && id === selectedComponentId,
      })}
      style={{ left: x + "px", top: y + "px" }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="component-icon-container">
        <img src={iconPath} className="component-icon" alt={label} />
      </div>
      <p className="label">{label}</p>
    </div>
  );
}

export default React.memo(ComponentItem);
