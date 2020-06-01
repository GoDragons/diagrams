import React from "react";

import "./ContextMenu.scss";
import cx from "classnames";

export default function ContextMenu({ target, ...props }) {
  const options = [
    { label: "Connect", callback: "onConnect", icon: "fa-arrow-right" },
    { label: "Clone", callback: "onClone", icon: "fa-clone" },
    { label: "Rename", callback: "onRename", icon: "fa-pencil-alt" },
    { label: "Reverse", callback: "onReverse", icon: "fa-arrows-alt-h" },
    { label: "Delete", callback: "onDelete", icon: "fa-trash" },
    { label: "Follow", callback: "onFollow", icon: "fa-binoculars" },
    { label: "Unfollow", callback: "onUnFollow", icon: "fa-times" },
  ];

  function displayOptions() {
    return options
      .filter(({ callback }) => typeof props[callback] === "function")
      .map((option) => {
        return (
          <li
            key={option.label}
            onMouseUp={(e) => {
              console.log("context click");
              e.stopPropagation();

              props[option.callback](e);
              props.onHide(e);
            }}
          >
            <i className={`icon connect fas ${option.icon}`}></i>
            <span className="label">{option.label}</span>
          </li>
        );
      });
  }

  let style = {};
  if (target) {
    style = {
      top: target.y - 50 + "px",
      left: target.x + 50 + "px",
      position: "absolute",
    };
  }

  return (
    <ul className={cx("context-menu", props.className)} style={style}>
      {displayOptions()}
    </ul>
  );
}
