import React from "react";
import "./DiagramEditor.scss";

import cx from "classnames";
import RandomWords from "random-words";

export default class DiagramEditor extends React.Component {
  state = {
    selectedComponentId: null,
    isDragging: false,
  };

  componentDidMount() {
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown = (e) => {
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };

  onKeyUp = (e) => {
    const { selectedComponentId } = this.state;
    let deltaX = 0;
    let deltaY = 0;

    switch (e.key) {
      case "ArrowUp":
        deltaY = -10;
        break;
      case "ArrowDown":
        deltaY = 10;
        break;
      case "ArrowRight":
        deltaX = 10;
        break;
      case "ArrowLeft":
        deltaX = -10;
        break;
      default:
        return;
    }

    console.log("deltaX:", deltaX);
    console.log("deltaY:", deltaY);

    const selectedComponent = this.props.data.components.find(
      ({ id }) => id === selectedComponentId
    );

    this.props.sendChange({
      operation: "moveComponent",
      data: {
        x: selectedComponent.x + deltaX,
        y: selectedComponent.y + deltaY,
        id: selectedComponent.id,
      },
    });
  };

  addComponent = () => {
    this.props.sendChange({
      operation: "addElement",
      data: {
        type: "lambda",
        label: `Function ${Math.floor(Math.random() * 10000)}`,
        x: 0,
        y: 0,
        id: `lambda_${RandomWords({ exactly: 3, join: "-" })}`,
      },
    });
  };

  save = () => {
    this.props.save();
  };

  displayComponents = () => {
    const { components } = this.props.data;
    const { selectedComponentId } = this.state;
    return components.map((component) => (
      <div
        key={component.id}
        className={cx("component", {
          selected: component.id === selectedComponentId,
        })}
        onClick={(e) => this.setState({ selectedComponentId: component.id })}
        style={{ left: component.x + "px", top: component.y + "px" }}
      >
        <label>
          {component.type} - {component.label}
        </label>
      </div>
    ));
  };
  render() {
    return (
      <div className="diagram-editor">
        <button onClick={this.addComponent} className="add-component">
          Add component
        </button>
        <button onClick={this.save} className="save">
          Save
        </button>
        <div className="editor">{this.displayComponents()}</div>
      </div>
    );
  }
}
