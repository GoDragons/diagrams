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
  const [diagramName, setDiagramName] = useState("");
  const [description, setDescription] = useState("");
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
        setReadme(response.data.readme || "");
        setDiagramName(response.data.diagramName || "");
        setDescription(response.data.description || "");
        setLoaded(true);
        setPageTitle("Project details");
        console.log("diagramDetails:", response.data);
      })
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  function saveReadme() {
    setReadmeNeedsSaving(false);
    setIsEditingReadme(false);
    putDiagram({ readme }).then(
      () => {
        notification.success({
          message: "Readme successfully saved",
          duration: 2,
        });
      },
      () => {
        setReadmeNeedsSaving(true);
        notification.error({
          message: "We couldn't save the readme",
          description: "Our team has been notified. Please try again later",
          duration: 0, // we do not want to auto-hide error messages
        });
      }
    );
  }

  function saveProperty({ messageProperty, ...values }) {
    putDiagram(values).then(
      () => {
        notification.success({
          message: `Successfully updated ${messageProperty}`,
          duration: 2,
        });
      },
      () => {
        notification.error({
          message: `We couldn't save the ${messageProperty}`,
          description: "Our team has been notified. Please try again later",
          duration: 0, // we do not want to auto-hide error messages
        });
      }
    );
  }

  function putDiagram(values) {
    return axios.put(
      `${REST_API_URL}/diagram/${diagramDetails.diagramId}/${diagramDetails.latestVersionId}`,
      values,
      {
        headers: {
          Authorization: userCredentials.accessToken.jwtToken,
        },
      }
    );
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

  function onDiagramNameChange(newDiagramName) {
    setDiagramName(newDiagramName);
    saveProperty({
      messageProperty: "diagram name",
      diagramName: newDiagramName,
    });
  }

  function onDescriptionChange(newDescription) {
    setDescription(newDescription);
    saveProperty({
      messageProperty: "diagram description",
      description: newDescription,
    });
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
        <Card>
          <Row className="main-actions-row">
            <Col span={16} className="diagram-name-container">
              <Typography.Title level={4} className="diagram-name-and-author">
                <FileTwoTone />
                {diagramDetails.authorId} /{" "}
                <Typography.Text
                  editable={{
                    onChange: onDiagramNameChange,
                  }}
                  className="diagram-name"
                >
                  {diagramName}
                </Typography.Text>
                <Typography.Text className="last-updated">
                  (last updated{" "}
                  {window.moment(diagramDetails.lastUpdatedDate).fromNow()})
                </Typography.Text>
              </Typography.Title>
              <Typography.Paragraph
                editable={{ onChange: onDescriptionChange }}
                className="description"
              >
                {description}
              </Typography.Paragraph>
            </Col>
            <Col span={8} className="main-actions stats">
              <Statistic
                value={(diagramDetails.participants || []).length}
                title="participants"
              />
              <Statistic
                value={(diagramDetails.versions || []).length}
                title="versions"
              />
              <Statistic
                value={diagramDetails.componentCount}
                title="components"
              />
            </Col>
          </Row>
        </Card>

        <div className="snapshot-and-readme">
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
                      onClick={saveReadme}
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
              <Card className="readme-container">
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
