import React from "react";
import { Button, Space, Card, Typography, Row, Col } from "antd";
import axios from "axios";
import { Link } from "react-router-dom";

import AvatarList from "AvatarList/AvatarList";
import { REST_API_URL } from "common/constants";

import "./DiagramItem.scss";

export default function DiagramItem({
  diagramId,
  latestVersionId,
  diagramName,
  versions,
  participants,
  refreshList,
  userCredentials,
}) {
  function deleteVersion(versionId) {
    axios
      .post(
        `${REST_API_URL}/delete-version`,
        { diagramId, versionId },
        {
          headers: {
            Authorization: userCredentials.accessToken.jwtToken,
          },
        }
      )
      .then(refreshList)
      .catch((e) => console.log(`Could not delete version:`, e.response.data));
  }
  function deleteDiagram() {
    axios
      .post(
        `${REST_API_URL}/delete-diagram`,
        { diagramId },
        {
          headers: {
            Authorization: userCredentials.accessToken.jwtToken,
          },
        }
      )
      .then(refreshList)
      .catch((e) => console.log(`Could not delete diagram:`, e.response.data));
  }

  // function displayVersions(versions) {
  //   if (!versions || versions.length === 1) {
  //     return null;
  //   }
  //   const versionElements = versions.slice(1).map((version) => {
  //     const { versionId, versionName, lastModified } = version;
  //     return (
  //       <li key={`${diagramId}-${versionId}`} className="version-item">
  //         <Link to={`/diagrams/${diagramId}/${versionId}`}>
  //           <span className="version-name">{versionName}</span>
  //           <span className="last-modified">
  //             {window.moment(lastModified).format("DD MMM YYYY - HH:mm:ss")}
  //           </span>
  //         </Link>
  //         <button onClick={(e) => deleteVersion(versionId)}>
  //           Delete version
  //         </button>
  //       </li>
  //     );
  //   });

  //   return (
  //     <div className="version-list-container">
  //       <p className="version-id">Versions: </p>
  //       <ul className="versions">{versionElements}</ul>
  //     </div>
  //   );
  // }

  const lastModifiedTimestamp = versions[versions.length - 1].lastModified;
  const lastModifiedHumanReadable = window
    .moment(lastModifiedTimestamp)
    .format("DD MMM YYYY");

  return (
    <Col span={24} className="diagram-item">
      <Card key={diagramId} bordered={false}>
        {/* <Link to={`/diagrams/${diagramId}/${latestVersionId}`}>
        <h3 className="title">{diagramName}</h3>
      </Link> */}
        <Link to={`/diagrams/${diagramId}/${latestVersionId}/edit`}>
          <Typography.Paragraph className="name">
            {diagramName}
          </Typography.Paragraph>
        </Link>
        <Typography.Paragraph className="last-modified">
          Last modified: {lastModifiedHumanReadable}
        </Typography.Paragraph>
        {/* <button onClick={deleteDiagram}>Delete diagram</button> */}
        <Row>
          <Col span={12}>
            <Space>
              <Link to={`/diagrams/${diagramId}/${latestVersionId}/edit`}>
                <Button type="primary">Edit</Button>
              </Link>
              <Link to={`/diagrams/${diagramId}/${latestVersionId}/details`}>
                <Button type="secondary">Details</Button>
              </Link>
            </Space>
          </Col>
          <Col span={12}>
            <AvatarList users={participants} />
          </Col>
        </Row>
      </Card>
    </Col>
  );
}
