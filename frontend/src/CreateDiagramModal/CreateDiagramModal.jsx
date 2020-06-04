import React from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

import { Form, Radio, Modal, Button, Input } from "antd";

import { REST_API_URL } from "common/constants";

export default function CreateDiagramModal({
  onClose,
  visible,
  authorId,
  authToken,
}) {
  const history = useHistory();

  if (!visible) {
    return null;
  }

  function onSubmit({ diagramName, visibility, description }) {
    axios
      .post(
        `${REST_API_URL}/create-diagram`,
        { diagramName, visibility, description, authorId },
        {
          headers: {
            Authorization: authToken,
          },
        }
      )
      .then((response) => {
        history.push(
          `/diagrams/${response.data.diagramId}/${response.data.versionId}/edit`
        );
      })
      .catch((e) => alert(`Could not create diagram:`, e));
    // axios
    //   .post(
    //     `${REST_API_URL}/invite-to-diagram`,
    //     {
    //       inviter: authorId,
    //       recipient,
    //       access,
    //       diagramId: diagramId,
    //     },
    //     {
    //       headers: {
    //         Authorization: authToken,
    //       },
    //     }
    //   )
    //   .then((response) => {
    //     onClose();
    //     console.log("shared:", response.data);
    //   })
    //   .catch((e) => alert(`Could not create version:`, e));
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
      title="Create new diagram"
      visible={visible}
      onOk={onSubmit}
      onCancel={onClose}
      footer={null}
    >
      <Form
        {...layout}
        name="basic"
        initialValues={{
          visibility: "public",
        }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Diagram name"
          name="diagramName"
          rules={[
            {
              required: true,
              message: "You must specify a diagram name",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Type of access" name="visibility">
          <Radio.Group>
            <Radio value="public">Public (everyone can see it)</Radio>
            <Radio value="private">Private (only you can see it)</Radio>
            <Radio value="unlisted">
              Unlisted (anyone with the URL can see it)
            </Radio>
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
