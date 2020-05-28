import React, { useState, useEffect } from "react";

import ContextMenu from "../ContextMenu/ContextMenu";

import "./Participants.scss";

export default function Participants({
  participants,
  onFollow,
  onUnFollow,
  authorId,
  followers,
  participantWeFollow,
}) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState();

  useEffect(() => {
    window.addEventListener("click", hideContextMenu);
    return () => {
      window.removeEventListener("click", hideContextMenu);
    };
  }, []);

  function hideContextMenu() {
    setShowContextMenu(false);
  }

  function handleContextMenu(e, participant) {
    e.preventDefault();
    setShowContextMenu(true);
    setSelectedParticipant(participant);
  }

  function displayContextMenu(participant) {
    if (!showContextMenu) {
      return null;
    }
    if (participant.authorId !== selectedParticipant.authorId) {
      return null;
    }

    const contextMenuProps = {};
    if (participant.authorId === participantWeFollow) {
      contextMenuProps.onUnFollow = (e) => onUnFollow(selectedParticipant);
    } else {
      contextMenuProps.onFollow = (e) => onFollow(selectedParticipant);
    }

    return (
      <ContextMenu
        {...contextMenuProps}
        onHide={(e) => setShowContextMenu(false)}
        className="participant-list-menu"
      />
    );
  }

  function displayParticipants() {
    if (!participants) {
      return null;
    }

    return participants.map((participant) => {
      let label = participant.label || "";

      let icon = null;

      const isFollower = followers.includes(participant.authorId);
      if (participant.authorId === authorId) {
        icon = <i className="fas fa-user me" />;
      } else if (participant.authorId === participantWeFollow) {
        icon = <i className="fas fa-binoculars we-follow" />;
      } else if (isFollower) {
        icon = <i className="fas fa-binoculars follower" />;
      }

      return (
        <li
          key={participant.authorId}
          className="participant"
          onContextMenu={(e) => handleContextMenu(e, participant)}
        >
          <span>{participant.authorId}</span> <span>{label}</span> {icon}
          {displayContextMenu(participant)}
        </li>
      );
    });
  }
  return (
    <div className="participants">
      <p className="title">Participants</p>
      <ul className="participant-list">{displayParticipants()}</ul>
    </div>
  );
}
