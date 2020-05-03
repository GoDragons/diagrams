import React from "react";

import "./Participants.scss";

export default function Participants({ participants, onFollow }) {
  function displayParticipants() {
    if (!participants) {
      return null;
    }

    return participants.map((participant) => {
      return (
        <li key={participant.authorId} className="participant">
          {participant.authorId}{" "}
          {participant.label ? `(${participant.label})` : ""}
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
