import React, { useState } from "react";

import { Button, Input, Row, Col, List, Space, Typography } from "antd";

import Card from "Card/Card";
import componentListData from "../data/componentListData.jsx";
import "./ComponentList.scss";

const MAX_COMPONENTS_DISPLAYED = 20;
function ComponentList({ onSelect }) {
  const [filterValue, setFilterValue] = useState("");

  function displayIconColumn(list) {
    return (
      <List
        dataSource={list}
        renderItem={(item) => (
          <div className="item" key={item.type} onClick={(e) => onSelect(item)}>
            <img src={item.iconImport} alt={item.type} />
            <Typography.Paragraph className="label">
              {item.type}
            </Typography.Paragraph>
          </div>
        )}
      />
    );
  }

  let filteredComponentList;
  if (filterValue.length > 0 && filterValue !== " ") {
    filteredComponentList = componentListData.filter((component) =>
      component.type.toLowerCase().includes(filterValue.toLowerCase())
    );
  } else {
    filteredComponentList = componentListData;
  }

  const trimmedComponentList = filteredComponentList.slice(
    0,
    MAX_COMPONENTS_DISPLAYED
  );

  const componentElements = displayIconColumn(trimmedComponentList);

  return (
    <div className="component-list">
      <Input
        className="filter"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        placeholder="Service name..."
      />
      <Card className="scrollable-container">
        <div className="actual-list">{componentElements}</div>
      </Card>
    </div>
  );
}

export default React.memo(ComponentList);
