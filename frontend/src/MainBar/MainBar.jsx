import React from "react";
import { useHistory } from "react-router-dom";

import {
  Button,
  Avatar,
  Typography,
  Space,
  Dropdown,
  Menu,
  Row,
  Col,
  Badge,
} from "antd";
import { UserOutlined, DownOutlined, GatewayOutlined } from "@ant-design/icons";
import { Auth } from "aws-amplify";

import "./MainBar.scss";

export default function MainBar({ userData }) {
  let history = useHistory();

  async function signOut() {
    try {
      await Auth.signOut();
      console.log("you've been signed out");
      history.push("/");
      window.location.reload();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  function displayUserData() {
    return (
      <div className="user-data">
        <p>username: {userData.username}</p>
        <p>email: {userData.attributes.email}</p>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const userMenu = (
    <Menu>
      <Menu.Item onClick={signOut}>My Account</Menu.Item>

      <Menu.Item onClick={signOut}>
        <Space>
          Activity<Badge count={1}></Badge>
        </Space>
      </Menu.Item>
      <Menu.Item onClick={signOut}>Sign out</Menu.Item>
    </Menu>
  );

  return (
    <div className="main-bar">
      <Row>
        <Col span={1}>
          <GatewayOutlined className="logo" />
        </Col>
        <Col span={23} className="user-column">
          <Dropdown overlay={userMenu}>
            <a
              className="ant-dropdown-link"
              onClick={(e) => e.preventDefault()}
            >
              <Space>
                <Avatar size="32" className="avatar" icon={<UserOutlined />} />

                {userData.username}
                <DownOutlined style={{ fontSize: 12 }} />
              </Space>
            </a>
          </Dropdown>
        </Col>
      </Row>
    </div>
  );
}
