import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";
import ComponentItem from "./ComponentItem/ComponentItem";

export default class DiagramEditor extends React.Component {
  state = {
    selectedComponentId: null,
    isDraggingComponent: false,
    isPanning: false,
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
    if (!this.state.isDraggingComponent) {
      return;
    }

    this.setState({ isDraggingComponent: false });
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

  onComponentMouseDown = (e, selectedComponentId) => {
    this.setState({
      isDraggingComponent: true,
      selectedComponentId,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
    });
  };

  onMouseMove = (e) => {
    if (!this.state.isDraggingComponent) {
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
      <ComponentItem
        {...component}
        onMouseDown={this.onComponentMouseDown}
        onClick={(e, id) => this.setState({ selectedComponentId: id })}
        selectedComponentId={selectedComponentId}
        key={component.id}
      />
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
