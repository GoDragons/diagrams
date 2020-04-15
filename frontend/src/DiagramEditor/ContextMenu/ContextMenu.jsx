import React from "react";

import "./ContextMenu.scss";

export default function ContextMenu({ target }) {
  const style = { top: target.y + "px", left: target.x + 90 + "px" };

  return (
    <ul className="context-menu" style={style}>
      <li>
        <i className="icon clone far fa-clone"></i>
        <span className="label">Clone</span>
      </li>
      <li>
        <i className="icon rename fas fa-pencil-alt"></i>
        <span className="label">Rename</span>
      </li>
      <li>
        <i className="icon delete fas fa-trash"></i>
        <span className="label">Delete</span>
      </li>
    </ul>
  );
}
