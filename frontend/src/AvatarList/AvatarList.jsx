import React from "react";

import Avatar from "Avatar/Avatar";

import "./AvatarList.scss";

export default function AvatarList({ users }) {
  if (!users || users.length === 0) {
    return null;
  }

  const list = users.map((user) => <Avatar key={user} username={user} />);
  return <div className="avatar-list">{list}</div>;
}
