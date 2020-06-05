import React from "react";
import { Button, Space, Typography, Row, Col } from "antd";
import Card from "Card/Card";
import { Link } from "react-router-dom";

import AvatarList from "AvatarList/AvatarList";

import "./DiagramItem.scss";

export default function DiagramItem({
  diagramId,
  latestVersionId,
  diagramName,
  versions,
  participants,
}) {
  let lastModifiedTimestamp;
  let createdTimestamp;

  if (versions) {
    lastModifiedTimestamp = versions[versions.length - 1].lastModified;
    createdTimestamp = parseInt(versions[0].versionId);
  }

  return (
    <Col span={24} className="diagram-item">
      <Card>
        <Link to={`/diagrams/${diagramId}/${latestVersionId}/edit`}>
          <Typography.Paragraph className="name">
            {diagramName}
          </Typography.Paragraph>
        </Link>
        <Typography.Paragraph className="created">
          Created {window.moment(createdTimestamp).fromNow()}
        </Typography.Paragraph>
        <Typography.Paragraph className="last-modified">
          Last modified {window.moment(lastModifiedTimestamp).fromNow()}
        </Typography.Paragraph>

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
