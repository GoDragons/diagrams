import React from "react";

import Avatar from "Avatar/Avatar";

import "./AvatarList.scss";
import { Typography } from "antd";

const MAX_AVATARS_TO_DISPLAY = 5;

export default function AvatarList({ users }) {
  if (!users || users.length === 0) {
    return null;
  }

  const trimmedList = users.slice(0, MAX_AVATARS_TO_DISPLAY);
  let othersElement = null;
  const hiddenCount = users.length - trimmedList.length;
  if (hiddenCount > 0) {
    othersElement = (
      <Typography.Text className="others">
        +{hiddenCount} other{hiddenCount > 1 ? "s" : ""}
      </Typography.Text>
    );
  }

  const list = trimmedList.map((user) => <Avatar key={user} username={user} />);
  return (
    <div className="avatar-list">
      {list}
      {othersElement}
    </div>
  );
}
