import React from "react";

import { Card } from "antd";

import "./Card.scss";

export default function ({ children }) {
  return (
    <Card bordered={false} className="card">
      {children}
    </Card>
  );
}
