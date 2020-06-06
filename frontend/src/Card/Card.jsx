import React from "react";

import { Card } from "antd";

import cx from "classnames";

import "./Card.scss";

export default function ({ children, className }) {
  return (
    <Card bordered={false} className="card" className={cx("card", className)}>
      {children}
    </Card>
  );
}
