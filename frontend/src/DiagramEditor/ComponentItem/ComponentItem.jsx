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
}) {
  function onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div
      key={id}
      onContextMenu={onContextMenu}
      className={cx("component", {
        selected: id === selectedComponentId,
      })}
      onClick={(e) => onClick(e, id)}
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
