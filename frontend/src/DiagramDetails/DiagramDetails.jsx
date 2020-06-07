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
  notification,
} from "antd";
import MarkDown from "react-markdown";
import { REST_API_URL } from "common/constants";
import { withRouter } from "react-router-dom";
import {
  FileTwoTone,
  EyeOutlined,
  SaveOutlined,
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
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [readme, setReadme] = useState("");
  const [readmeNeedsSaving, setReadmeNeedsSaving] = useState(false);

  useEffect(() => {
    if (!infoRequested) {
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

  function saveReadme() {
    setReadmeNeedsSaving(false);
    setIsEditingReadme(false);
    notification.success({
      message: "Readme successfully saved",
      duration: 2,
    });
  }

  function onReadmeChange(e) {
    setReadme(e.target.value);
    if (!readmeNeedsSaving) {
      setReadmeNeedsSaving(true);
    }
  }

  function onReadmeKeyUp(e) {
    if (e.key === "Escape") {
      setIsEditingReadme(false);
    }
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

    // const description = `## This is a tool for creating system architecture designs. \n ----- \n It is all serverless, with a React front-end and a back-end deployed on API Gateway and Lambda, using DynamoDB for data storage. \n\n (more details will come soon)
    // `;

    return (
      <div className="diagram-details">
        <Row className="main-actions-row">
          <Col span={16}></Col>
          <Col span={8} className="main-actions"></Col>
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

        <div className="image-and-description">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Space>
                <Link
                  to={`/diagrams/${diagramDetails.diagramId}/${diagramDetails.latestVersionId}/edit`}
                >
                  <Button icon={<EditOutlined />}>Edit Diagram</Button>
                </Link>
                <Dropdown overlay={downloadOptions}>
                  <Button type="primary" icon={<DownloadOutlined />}>
                    Download <DownOutlined />
                  </Button>
                </Dropdown>
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <>
                  {isEditingReadme ? (
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(e) => setIsEditingReadme(false)}
                    >
                      Preview
                    </Button>
                  ) : (
                    <Button
                      icon={<EditOutlined />}
                      onClick={(e) => setIsEditingReadme(true)}
                    >
                      Edit Readme
                    </Button>
                  )}
                  {readmeNeedsSaving ? (
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={(e) => saveReadme()}
                    >
                      Save Readme
                    </Button>
                  ) : null}
                </>
              </Space>
            </Col>
            <Col span={12}>
              <Card className="snapshot-container">
                <img
                  className="snapshot-image"
                  src="https://d2908q01vomqb2.cloudfront.net/cb4e5208b4cd87268b208e49452ed6e89a68e0b8/2017/11/03/AWS-Network-Diagram-Page-1-1024x678.png"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card className="description-container">
                {isEditingReadme ? (
                  <Input.TextArea
                    value={readme}
                    className="readme-input"
                    onKeyDown={onReadmeKeyUp}
                    onChange={onReadmeChange}
                  />
                ) : (
                  <MarkDown source={readme} />
                )}
              </Card>
            </Col>
          </Row>
        </div>

        <div className="settings">
          <Typography.Title level={4} className="settings-title">
            Project settings
          </Typography.Title>
        </div>
      </div>
    );
  }

  return <div className="diagram-details-page">{displayContent()}</div>;
}

export default withRouter(DiagramDetails);
