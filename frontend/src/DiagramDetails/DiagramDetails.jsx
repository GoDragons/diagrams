import React, { useState, useEffect } from "react";

import axios from "axios";
import { Link } from "react-router-dom";
import {
  Empty,
  List,
  Row,
  Col,
  Button,
  Dropdown,
  Input,
  Menu,
  Space,
  Typography,
  Spin,
  Timeline,
  Statistic,
} from "antd";
import { REST_API_URL } from "common/constants";
import { withRouter } from "react-router-dom";
import { FileTwoTone, FilePdfOutlined } from "@ant-design/icons";

import Card from "Card/Card";

import "./DiagramDetails.scss";

export function DiagramDetails({
  userCredentials,
  userData,
  setPageTitle,
  match,
}) {
  const [infoRequested, setInfoRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [diagramDetails, setDiagramDetails] = useState();

  console.log("loaded");
  useEffect(() => {
    if (!infoRequested) {
      console.log("here");
      setInfoRequested(true);
      getDiagramDetails();
    }
  }, [infoRequested]);

  function getDiagramDetails() {
    return axios
      .get(`${REST_API_URL}/get-diagram/${match.params.diagramId}`, {
        headers: {
          Authorization: userCredentials.accessToken.jwtToken,
        },
      })
      .then((response) => {
        setDiagramDetails(response.data);
        setPageTitle(response.data.diagramName);

        setLoaded(true);
        console.log("diagramDetails:", response.data);
      })
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  function displayContent() {
    if (!loaded) {
      return (
        <div className="empty-page">
          <Spin />
        </div>
      );
    }

    if (!diagramDetails) {
      return null;
    }

    const downloadOptions = (
      <Menu>
        <Menu.Item key="pdf">PDF</Menu.Item>
        <Menu.Item key="jpg">JPG</Menu.Item>
        <Menu.Item key="png">PNG</Menu.Item>
        <Menu.Item key="json">JSON</Menu.Item>
        <Menu.Item key="xml">XML</Menu.Item>
        <Menu.Item key="link">Get Link</Menu.Item>
      </Menu>
    );

    return (
      <div>
        <Row>
          <Col span={16}>
            <Typography.Title level={4} className="diagram-name">
              <FileTwoTone />
              {diagramDetails.authorId}/{diagramDetails.diagramName}
            </Typography.Title>
          </Col>
          <Col span={8} className="main-actions">
            <Space>
              <Link
                to={`/diagrams/${diagramDetails.diagramId}/${diagramDetails.latestVersionId}/edit`}
              >
                <Button type="secondary">Edit</Button>
              </Link>
              {/* <Button type="primary">Download</Button> */}
              <Dropdown.Button overlay={downloadOptions} type="primary">
                Download
              </Dropdown.Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 24]}>
          <Col span={6}>
            <Card>
              <Statistic
                title={`participant${
                  diagramDetails.participants.length === 0 ? "" : "s"
                }`}
                value={diagramDetails.participants.length + 1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={`version${
                  diagramDetails.versions.length === 1 ? "" : "s"
                }`}
                value={diagramDetails.versions.length}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={`component${
                  diagramDetails.componentCount === 1 ? "" : "s"
                }`}
                value={diagramDetails.componentCount}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={`connection${
                  diagramDetails.connectionCount === 1 ? "" : "s"
                }`}
                value={diagramDetails.connectionCount}
              />
            </Card>
          </Col>
          {/* <Col span={6}>
            <Card>
              <Statistic
                title={`last modified`}
                value={window.moment(diagramDetails.lastModified).fromNow()}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={`created`}
                value={window.moment(diagramDetails.created).fromNow()}
              />
            </Card>
          </Col> */}
        </Row>
      </div>
    );
  }

  return <div className="diagram-details-page">{displayContent()}</div>;
}

export default withRouter(DiagramDetails);
