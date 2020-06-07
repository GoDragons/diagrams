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
  Divider,
  Typography,
  Spin,
  Timeline,
  Statistic,
} from "antd";
import { REST_API_URL } from "common/constants";
import { withRouter } from "react-router-dom";
import {
  FileTwoTone,
  SettingOutlined,
  EditOutlined,
  DownloadOutlined,
  DownOutlined,
} from "@ant-design/icons";

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

        setLoaded(true);
        setPageTitle(
          <span className="diagram-name">
            <FileTwoTone />
            {response.data.authorId}/{response.data.diagramName}
          </span>
        );
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
      <div className="diagram-details">
        <Row className="main-actions-row">
          <Col span={16}></Col>
          <Col span={8} className="main-actions">
            <Space>
              {/* <Button icon={<SettingOutlined />}>Settings</Button> */}
              <Link
                to={`/diagrams/${diagramDetails.diagramId}/${diagramDetails.latestVersionId}/edit`}
              >
                <Button icon={<EditOutlined />}>Edit</Button>
              </Link>
              <Dropdown overlay={downloadOptions}>
                <Button type="primary" icon={<DownloadOutlined />}>
                  Download <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        <Card className="stats">
          <Typography.Paragraph className="stat-item">
            {(diagramDetails.participants || []).length} participants
          </Typography.Paragraph>
          <Divider type="vertical" />
          <Typography.Paragraph className="stat-item">
            {(diagramDetails.versions || []).length} versions
          </Typography.Paragraph>
          <Divider type="vertical" />
          <Typography.Paragraph className="stat-item">
            {diagramDetails.componentCount} components
          </Typography.Paragraph>
          <Divider type="vertical" />
          <Typography.Paragraph className="stat-item">
            {diagramDetails.connectionCount} connections
          </Typography.Paragraph>
        </Card>
      </div>
    );
  }

  return <div className="diagram-details-page">{displayContent()}</div>;
}

export default withRouter(DiagramDetails);
