import React from "react";

// import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "./Avatar.scss";

function stringToColor(str) {
  var hash = 0;
  if (str.length > 0) {
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
  }

  var shortened = hash % 360;
  return "hsl(" + shortened + ",100%,32%)";
}

export default function Avatar({ username }) {
  let avatarIcon = <UserOutlined />;
  const initials = username.substring(0, 2).toUpperCase();
  avatarIcon = <span className="avatar-initials">{initials}</span>;
  const bgColor = stringToColor(username);
  console.log("color: ", bgColor);
  return (
    <div className="avatar" style={{ backgroundColor: bgColor }}>
      {avatarIcon}
    </div>
  );
  // return <Avatar size="32" className="avatar" icon={avatarIcon} />;
}
