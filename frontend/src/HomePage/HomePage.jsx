import React, { useState, useEffect } from "react";
import {
  Empty,
  List,
  Space,
  Row,
  Col,
  Button,
  Input,
  Typography,
  Spin,
  Avatar,
  Timeline,
} from "antd";
import { Link } from "react-router-dom";
import {
  PlusCircleOutlined,
  RocketTwoTone,
  ShareAltOutlined,
} from "@ant-design/icons";
import axios from "axios";
import CreateDiagramModal from "CreateDiagramModal/CreateDiagramModal";

import DiagramList from "DiagramList/DiagramList";

import { REST_API_URL } from "common/constants";
import "./HomePage.scss";

const { Search } = Input;
const { Title } = Typography;

export default function HomePage({ userData, userCredentials }) {
  const [infoRequested, setInfoRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ownDiagrams, setOwnDiagrams] = useState();
  const [userDetails, setUserDetails] = useState();
  const [invitedDiagrams, setInvitedDiagrams] = useState();
  const [publicDiagrams, setPublicDiagrams] = useState();
  const [isCreateDiagramModalOpen, setIsCreateDiagramModalOpen] = useState(
    false
  );

  useEffect(() => {
    if (!infoRequested) {
      setInfoRequested(true);
      async function getData() {
        await getDiagrams();
        await getUserData();
        setLoaded(true);
      }
      getData();
    }
  }, [infoRequested]);

  function getDiagrams() {
    console.log("getDiagrams() userCredentials = ", userCredentials);
    return axios
      .get(`${REST_API_URL}/get-diagrams`, {
        headers: {
          Authorization: userCredentials.accessToken.jwtToken,
        },
      })
      .then((response) => {
        setOwnDiagrams(response.data.ownDiagrams);
        // setOwnDiagrams([]);
        setInvitedDiagrams(response.data.invitedDiagrams);
        setPublicDiagrams(response.data.publicDiagrams);
      })
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  function getUserData() {
    return axios
      .get(`${REST_API_URL}/get-user`, {
        headers: {
          Authorization: userCredentials.accessToken.jwtToken,
        },
      })
      .then((response) => {
        setUserDetails(response.data);
        console.log("A userDetails:", response.data);
      })
      .catch((e) => console.log(`Could not get user data:`, e));
  }

  function displayOwnSection() {
    return (
      <div className="section own-section">
        <div className="own-diagrams-section">
          <Title level={4} className="my-diagrams-title">
            My Diagrams
            {ownDiagrams.length === 0 ? null : (
              <Button
                type="primary"
                className="create-new"
                onClick={() => setIsCreateDiagramModalOpen(true)}
              >
                <PlusCircleOutlined /> Create New
              </Button>
            )}
          </Title>

          {ownDiagrams.length === 0 ? (
            <Empty
              className="own-diagrams-empty"
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              imageStyle={{
                height: 100,
              }}
              description="You don't have any diagrams yet"
            >
              <Button
                type="primary"
                onClick={() => setIsCreateDiagramModalOpen(true)}
              >
                Create one now
              </Button>
            </Empty>
          ) : (
            <DiagramList
              userCredentials={userCredentials}
              diagrams={ownDiagrams.slice(0, 3)}
              onRefresh={getDiagrams}
            />
          )}
        </div>

        <div className="invited-diagrams-section">
          <Title level={4} className="shared-with-me-title">
            Shared with me
          </Title>

          {invitedDiagrams.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="You don't have any invites yet"
            />
          ) : (
            <DiagramList
              userCredentials={userCredentials}
              diagrams={invitedDiagrams}
              onRefresh={getDiagrams}
            />
          )}
        </div>
      </div>
    );
  }

  function displayPublicSection() {
    return (
      <div className="section public-section">
        <Title level={4} className="public-title">
          Explore diagrams
        </Title>

        <Search
          className="public-search"
          placeholder="input search text"
          onSearch={(value) => console.log(value)}
        />

        {publicDiagrams.length === 0 ? (
          <Empty
            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            imageStyle={{
              height: 100,
            }}
            description="You don't have any diagrams yet"
          >
            <Button
              type="primary"
              onClick={() => setIsCreateDiagramModalOpen(true)}
            >
              Create one now
            </Button>
          </Empty>
        ) : (
          <List
            size="large"
            bordered={false}
            dataSource={publicDiagrams}
            className="public-diagram-list"
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.authorId}/${item.diagramName}`}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  }

  function displayActivitySection() {
    console.log("userDetails:", userDetails);
    return (
      <div className="section activity-section">
        <Title level={4} className="activity-title">
          Your activity
        </Title>

        {userDetails.activity.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="You don't have any activity yet"
          />
        ) : (
          <Timeline>
            {userDetails.activity.map((item) => {
              let icon = undefined;
              switch (item.type) {
                case "invite":
                  icon = <ShareAltOutlined />;
                  break;
                case "account":
                  icon = <RocketTwoTone />;
                  break;
              }

              return (
                <Timeline.Item key={item.name} dot={icon}>
                  <p dangerouslySetInnerHTML={{ __html: item.name }} />
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </div>
    );
  }

  return (
    <div className="home-page">
      {!loaded ? (
        <div className="empty-page">
          <Spin />
        </div>
      ) : (
        <>
          <Row className="main-content">
            <Col span={6}>{displayPublicSection()}</Col>
            <Col span={12}>{displayOwnSection()}</Col>
            <Col span={6}>{displayActivitySection()}</Col>
          </Row>
          <CreateDiagramModal
            visible={isCreateDiagramModalOpen}
            onClose={() => setIsCreateDiagramModalOpen(false)}
            authToken={userCredentials.accessToken.jwtToken}
            authorId={userCredentials.accessToken.payload.username}
          />
        </>
      )}
    </div>
  );
}
