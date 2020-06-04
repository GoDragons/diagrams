import React from "react";
import { Row } from "antd";

import DiagramItem from "./DiagramItem/DiagramItem";

import "./DiagramList.scss";

export default function DiagramList({ diagrams, onRefresh, userCredentials }) {
  function displayDiagramList(diagrams) {
    if (!diagrams) {
      return <p>Loading diagrams...</p>;
    }
    if (diagrams.length === 0) {
      return <p>There are no diagrams. Create one now!</p>;
    }

    return diagrams.map((diagramData) => (
      <DiagramItem
        key={diagramData.diagramId}
        {...diagramData}
        refreshList={onRefresh}
        userCredentials={userCredentials}
      />
    ));
  }

  return (
    <div className="diagram-list-container">
      <Row className="diagram-list" gutter={[16, 24]} justify="center">
        {displayDiagramList(diagrams)}
      </Row>
      {/* {invitedDiagrams.length ? (
        <>
          <h1>Shared with me:</h1>
          <div className="diagram-list">
            {displayDiagramList(invitedDiagrams)}
          </div>
        </>
      ) : null} */}
    </div>
  );
}
