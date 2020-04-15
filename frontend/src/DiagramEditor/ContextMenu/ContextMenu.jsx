import React from "react";

import "./ContextMenu.scss";

export default function ContextMenu({ target }) {
  const style = { top: target.y + "px", left: target.x + 90 + "px" };

  return (
    <ul className="context-menu" style={style}>
      <li>Delete</li>
      <li>Clone</li>
      <li>Rename</li>
    </ul>
  );
}
