import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";
import ComponentItem from "./ComponentItem/ComponentItem";
import ContextMenu from "./ContextMenu/ContextMenu";

export default class DiagramEditor extends React.Component {
  state = {
    selectedComponentId: null,
    isDraggingComponent: false,
    isPanning: false,
    initialMouseX: null,
    initialMouseY: null,
    deltaX: null,
    deltaY: null,

    isContextMenuShowing: false,
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

  getSelectedComponent = () => {
    const { selectedComponentId } = this.state;

    return this.props.data.components.find(
      ({ id }) => id === selectedComponentId
    );
  };

  onKeyDown = (e) => {
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };

  onMouseUp = (e) => {
    const { isDraggingComponent, isContextMenuShowing } = this.state;
    this.setState({
      isDraggingComponent: false,
    });
    if (isContextMenuShowing) {
      this.setState({
        isContextMenuShowing: false,
        selectedComponentId: null,
      });
      return;
    }

    if (!this.state.isDraggingComponent) {
      return;
    }
    if (!this.state.deltaX && !this.state.deltaY) {
      return;
    }

    this.setState({ isDraggingComponent: false, deltaX: null, deltaY: null });

    const selectedComponent = this.getSelectedComponent();

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
    const { isContextMenuShowing, isDraggingComponent } = this.state;
    if (isContextMenuShowing || !isDraggingComponent) {
      return;
    }
    const { initialMouseX, initialMouseY } = this.state;

    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;

    const selectedComponent = this.getSelectedComponent();

    this.props.moveComponentInDiagram({
      x: selectedComponent.x + deltaX,
      y: selectedComponent.y + deltaY,
      id: selectedComponent.id,
    });

    this.setState({
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      deltaX,
      deltaY,
    });
  };

  onKeyUp = (e) => {
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

    const selectedComponent = this.getSelectedComponent();

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

  onComponentContextMenu = (e, componentId) => {
    e.preventDefault();
    this.setState({
      selectedComponentId: componentId,
      isContextMenuShowing: true,
    });
  };

  displayComponents = () => {
    const { components } = this.props.data;
    const { selectedComponentId } = this.state;
    return components.map((component) => (
      <ComponentItem
        {...component}
        onMouseDown={this.onComponentMouseDown}
        onClick={(e, id) => this.setState({ selectedComponentId: id })}
        onContextMenu={this.onComponentContextMenu}
        selectedComponentId={selectedComponentId}
        key={component.id}
      />
    ));
  };

  displayContextMenu = () => {
    const { isContextMenuShowing } = this.state;
    if (!isContextMenuShowing) {
      return null;
    }

    const selectedComponent = this.getSelectedComponent();

    return <ContextMenu target={selectedComponent} />;
  };

  render() {
    return (
      <div className="diagram-editor">
        <button onClick={this.save} className="save">
          Save
        </button>
        <ComponentList onSelect={this.addComponent} />
        {this.displayContextMenu()}
        <div
          className="editor"
          onClick={(e) => this.setState({ selectedComponentId: null })}
        >
          {this.displayComponents()}
        </div>
      </div>
    );
  }
}
