import React from "react";
import axios from "axios";

import { Form, Radio, Modal, Button, Input } from "antd";

import { REST_API_URL } from "common/constants";

export default function ShareModal({
  onClose,
  visible,
  authorId,
  diagramData,

  authToken,
}) {
  if (!visible) {
    return null;
  }

  function onSubmit({ recipient, access }) {
    axios
      .post(
        `${REST_API_URL}/invite-to-diagram`,
        {
          inviter: authorId,
          recipient,
          access,
          diagramId: diagramData.diagramId,
          diagramName: diagramData.diagramName,
        },
        {
          headers: {
            Authorization: authToken,
          },
        }
      )
      .then((response) => {
        onClose();
        console.log("shared:", response.data);
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
      title="Share diagram"
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
        <p>Who do you want to share this diagram with?</p>
        <Form.Item
          label="Username"
          name="recipient"
          rules={[
            {
              required: true,
              message: "You must specify a username",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Type of access" name="access">
          <Radio.Group>
            <Radio.Button value="read">Only read</Radio.Button>
            <Radio.Button value="write">Read and write</Radio.Button>
          </Radio.Group>
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
