import React, { useState } from "react";

import "./ComponentList.scss";
import componentListData from "../data/componentListData.jsx";
const MAX_COMPONENTS_DISPLAYED = 20;

function ComponentList({ onSelect }) {
  const [filterValue, setFilterValue] = useState("");

  function displayIconColumn(list) {
    return list.map((item) => (
      <div className="item" key={item.type} onClick={(e) => onSelect(item)}>
        <img src={item.iconImport} alt={item.type} />
        <p className="label">{item.type}</p>
      </div>
    ));
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
  const partitionIndex = Math.floor(trimmedComponentList.length / 2) || 1;

  const componentElementsLeft = displayIconColumn(
    trimmedComponentList.slice(0, partitionIndex)
  );
  const componentElementsRight = displayIconColumn(
    trimmedComponentList.slice(partitionIndex)
  );

  return (
    <div className="component-list">
      <input
        className="filter"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        placeholder="Service name..."
      ></input>
      <div className="scrollable-container">
        <div className="actual-list">
          <div className="column column-left">{componentElementsLeft}</div>
          <div className="column column-right">{componentElementsRight}</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ComponentList);
