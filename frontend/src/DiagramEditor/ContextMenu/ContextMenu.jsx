import React from "react";

import "./ContextMenu.scss";

export default function ContextMenu({ target, onClone, onDelete, onRename }) {
  if (!target) {
    return null;
  }

  const style = { top: target.y - 50 + "px", left: target.x + 50 + "px" };

  return (
    <ul
      className="context-menu"
      style={style}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <li
        onClick={(e) => {
          e.stopPropagation();
          onClone(e);
        }}
      >
        <i className="icon clone far fa-clone"></i>
        <span className="label">Clone</span>
      </li>
      <li
        onClick={(e) => {
          e.stopPropagation();
          onRename(e);
        }}
      >
        <i className="icon rename fas fa-pencil-alt"></i>
        <span className="label">Rename</span>
      </li>
      <li
        onClick={(e) => {
          e.stopPropagation();

          onDelete(e);
        }}
      >
        <i className="icon delete fas fa-trash"></i>
        <span className="label">Delete</span>
      </li>
    </ul>
  );
}
