import React from "react";

import "./ComponentItem.scss";

import cx from "classnames";

export default function ComponentItem({
  id,
  x,
  y,
  iconPath,
  label,
  selectedComponentId,
  onMouseDown,
  onMouseUp,
  onContextMenu,
}) {
  return (
    <div
      key={id}
      onContextMenu={(e) => onContextMenu(e, id)}
      className={cx("component", {
        selected: id === selectedComponentId,
      })}
      onMouseDown={(e) => onMouseDown(e, id)}
      onMouseUp={(e) => onMouseUp(e, id)}
      style={{ left: x + "px", top: y + "px" }}
    >
      <div className="component-icon-container">
        <img src={iconPath} className="component-icon" alt={label} />
      </div>
      <p className="label">{label}</p>
    </div>
  );
}
