import React from "react";

import "./ContextMenu.scss";

export default function ContextMenu({
  target,
  onConnect,
  onClone,
  onDelete,
  onRename,
  onHide,
  onReverse,
}) {
  if (!target) {
    return null;
  }

  const style = { top: target.y - 50 + "px", left: target.x + 50 + "px" };

  function handleMouseUp(e) {
    e.stopPropagation();
    onHide(e);
  }

  return (
    <ul className="context-menu" style={style} onMouseUp={handleMouseUp}>
      {onConnect ? (
        <li
          onClick={(e) => {
            e.stopPropagation();
            onConnect(e);
          }}
        >
          <i className="icon connect fas fa-arrow-right"></i>
          <span className="label">Connect</span>
        </li>
      ) : null}
      {onClone ? (
        <li
          onClick={(e) => {
            e.stopPropagation();
            onClone(e);
          }}
        >
          <i className="icon clone far fa-clone"></i>
          <span className="label">Clone</span>
        </li>
      ) : null}
      {onRename ? (
        <li
          onClick={(e) => {
            e.stopPropagation();
            onRename(e);
          }}
        >
          <i className="icon rename fas fa-pencil-alt"></i>
          <span className="label">Rename</span>
        </li>
      ) : null}
      {onReverse ? (
        <li
          onClick={(e) => {
            e.stopPropagation();
            onReverse(e);
          }}
        >
          <i className="icon reverse fas fa-arrows-alt-h"></i>
          <span className="label">Reverse</span>
        </li>
      ) : null}
      {onDelete ? (
        <li
          onClick={(e) => {
            e.stopPropagation();

            onDelete(e);
          }}
        >
          <i className="icon delete fas fa-trash"></i>
          <span className="label">Delete</span>
        </li>
      ) : null}
    </ul>
  );
}
