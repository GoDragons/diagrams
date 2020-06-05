import React, { useState, useEffect } from "react";

import axios from "axios";
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
} from "antd";
import { REST_API_URL } from "common/constants";
import { withRouter } from "react-router-dom";
import { FileTwoTone, FilePdfOutlined } from "@ant-design/icons";

import Card from "Card/Card";

import "./DiagramDetails.scss";

export function DiagramDetails({ userCredentials, userData, match }) {
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
              <Button type="secondary">Edit</Button>
              {/* <Button type="primary">Download</Button> */}
              <Dropdown.Button overlay={downloadOptions} type="primary">
                Download
              </Dropdown.Button>
            </Space>
          </Col>
        </Row>
        <Card>
          <Row>
            <Col span={8}>
              {diagramDetails.participants.length + 1} participant
              {diagramDetails.participants.length === 0 ? "" : "s"}
            </Col>
            <Col span={8}>
              {/* {diagramDetails.versions.length + 1} version */}
              {/* {diagramDetails.versions.length === 0 ? "" : "s"} */}
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  return <div className="diagram-details-page">{displayContent()}</div>;
}

export default withRouter(DiagramDetails);
