import React from "react";

import "./Participants.scss";

export default function Participants({ participants, onFollow, authorId }) {
  function displayParticipants() {
    if (!participants) {
      return null;
    }

    return participants.map((participant) => {
      let label = participant.label || "";
      if (participant.authorId === authorId) {
        label += "(me)";
      }
      return (
        <li key={participant.authorId} className="participant">
          {participant.authorId} {label}
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
