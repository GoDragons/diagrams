import React from "react";
import { Link, useHistory } from "react-router-dom";

import Card from "Card/Card";

import {
  Button,
  Typography,
  Space,
  Dropdown,
  Menu,
  Row,
  Col,
  Badge,
} from "antd";
import { DownOutlined, GatewayOutlined } from "@ant-design/icons";
import { Auth } from "aws-amplify";

import Avatar from "Avatar/Avatar";

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
    <Card className="main-bar">
      <Row>
        <Col span={1} className="logo-container">
          <Link to="/">
            <GatewayOutlined className="logo" />
          </Link>
        </Col>
        <Col span={23} className="user-column">
          <Dropdown overlay={userMenu}>
            <a
              className="ant-dropdown-link"
              onClick={(e) => e.preventDefault()}
            >
              <Space>
                <Avatar username={userData.username} />

                {userData.username}
                <DownOutlined style={{ fontSize: 12 }} />
              </Space>
            </a>
          </Dropdown>
        </Col>
      </Row>
    </Card>
  );
}
