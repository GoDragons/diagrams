import React from "react";
import "./DiagramEditor.scss";

import cx from "classnames";
import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";

export default class DiagramEditor extends React.Component {
  state = {
    selectedComponentId: null,
    isDragging: false,
    initialMouseX: null,
    initialMouseY: null,
  };

  componentDidMount() {
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
  }

  onKeyDown = (e) => {
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };

  onMouseUp = (e) => {
    if (!this.state.isDragging) {
      return;
    }

    this.setState({ isDragging: false });
    const { selectedComponentId } = this.state;

    const selectedComponent = this.props.data.components.find(
      ({ id }) => id === selectedComponentId
    );

    this.props.sendChange({
      operation: "moveComponent",
      data: {
        x: selectedComponent.x,
        y: selectedComponent.y,
        id: selectedComponent.id,
      },
    });
  };

  onMouseDown = (e, selectedComponentId) => {
    this.setState({
      isDragging: true,
      selectedComponentId,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
    });
  };

  onMouseMove = (e) => {
    if (!this.state.isDragging) {
      return;
    }
    const { initialMouseX, initialMouseY, selectedComponentId } = this.state;

    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;

    const selectedComponent = this.props.data.components.find(
      ({ id }) => id === selectedComponentId
    );

    this.props.moveComponentInDiagram({
      x: selectedComponent.x + deltaX,
      y: selectedComponent.y + deltaY,
      id: selectedComponent.id,
    });

    this.setState({
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
    });
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

  addComponent = (componentDetails) => {
    this.props.sendChange({
      operation: "addElement",
      data: {
        type: componentDetails.type,
        label: componentDetails.type,
        icon: componentDetails.icon,
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
        onMouseDown={(e) => this.onMouseDown(e, component.id)}
        style={{ left: component.x + "px", top: component.y + "px" }}
      >
        <img src={component.icon} className="component-icon" />
        <p className="label">
          {component.type} - {component.label}
        </p>
      </div>
    ));
  };
  render() {
    return (
      <div className="diagram-editor">
        <button onClick={this.save} className="save">
          Save
        </button>
        <ComponentList onSelect={this.addComponent} />
        <div className="editor">{this.displayComponents()}</div>
      </div>
    );
  }
}
