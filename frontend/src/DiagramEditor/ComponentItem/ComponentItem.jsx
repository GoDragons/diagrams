import React from "react";

import "./ComponentItem.scss";

import cx from "classnames";

export default function ComponentItem({
  id,
  x,
  y,
  icon,
  label,
  type,
  selectedComponentId,
  onMouseDown,
  onClick,
  onContextMenu,
}) {
  function onComponentClick(e) {
    e.stopPropagation();
    onClick(e, id);
  }

  return (
    <div
      key={id}
      onContextMenu={(e) => onContextMenu(e, id)}
      className={cx("component", {
        selected: id === selectedComponentId,
      })}
      onClick={onComponentClick}
      onMouseDown={(e) => onMouseDown(e, id)}
      style={{ left: x + "px", top: y + "px" }}
    >
      <img src={icon} className="component-icon" />
      <p className="label">
        {type} - {label}
      </p>
    </div>
  );
}
