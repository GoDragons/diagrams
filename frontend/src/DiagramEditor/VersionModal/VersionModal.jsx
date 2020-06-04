import React from "react";
import axios from "axios";

import { Form, Radio, Modal, Button, Input } from "antd";

import { REST_API_URL } from "common/constants";

export default function VersionModal({
  onClose,
  visible,
  diagramData,
  authToken,
  sendChange,
}) {
  if (!visible) {
    return null;
  }

  function onSubmit({ versionName }) {
    axios
      .post(
        `${REST_API_URL}/create-version`,
        { diagramData, versionName },
        {
          headers: {
            Authorization: authToken,
          },
        }
      )
      .then((response) => {
        onClose();
        window.location = `/diagrams/${response.data.diagramId}/${response.data.versionId}`;
        console.log("Version created:", response.data);
        sendChange({
          operation: "newVersion",
          data: {
            diagramId: response.data.diagramId,
            versionId: response.data.versionId,
          },
        });
      })
      .catch((e) => alert(`Could not create version:`, e));
  }

  const layout = {
    labelCol: {
      span: 8,
    },
    wrapperCol: {
      span: 16,
    },
  };
  const tailLayout = {
    wrapperCol: {
      offset: 8,
      span: 16,
    },
  };

  return (
    <Modal
      title="Commit version"
      visible={visible}
      onOk={onSubmit}
      onCancel={onClose}
      footer={null}
    >
      <Form
        {...layout}
        name="basic"
        initialValues={{
          access: "read",
        }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Commit message"
          name="versionName"
          rules={[
            {
              required: true,
              message: "You must specify a commit message",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
