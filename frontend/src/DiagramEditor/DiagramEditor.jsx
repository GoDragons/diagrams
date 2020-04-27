import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";
import ComponentItem from "./ComponentItem/ComponentItem";
import ContextMenu from "./ContextMenu/ContextMenu";

import { withRouter, Link } from "react-router-dom";

const VIEWPORT_WIDTH = 1000;
const VIEWPORT_HEIGHT = 600;
const MIN_CANVAS_SCALE = 0.4;
const MAX_CANVAS_SCALE = 2;

export class DiagramEditor extends React.Component {
  state = {
    selectedComponentId: null,
    isDraggingComponent: false,
    isPanning: false,
    previousMouseX: null,
    previousMouseY: null,
    initialMouseX: null,
    initialMouseY: null,
    deltaX: null,
    deltaY: null,
    canvasX: -5000,
    canvasY: -5000,
    canvasScale: 1,
    isContextMenuShowing: false,
  };

  componentDidMount() {
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);

    this.props.joinDiagram(this.props.match.params.diagramId);
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
    const { oldIsDraggingComponent, isContextMenuShowing } = this.state;

    this.setState({
      isDraggingComponent: false,
      isPanning: false,
    });
    if (isContextMenuShowing) {
      this.setState({
        isContextMenuShowing: false,
        selectedComponentId: null,
      });
      return;
    }

    if (!oldIsDraggingComponent) {
      return;
    }

    const wholeDeltaX = e.clientX - (this.state.initialMouseX || 0);
    const wholeDeltaY = e.clientY - (this.state.initialMouseY || 0);

    if (!wholeDeltaX && !wholeDeltaY) {
      console.log("we have no delta");
      return;
    }

    this.setState({
      deltaX: null,
      deltaY: null,
      initialMouseX: null,
      initialMouseY: null,
    });

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

  renameSelectedItem = () => {
    this.setState({ isContextMenuShowing: false });
  };

  cloneSelectedItem = () => {
    console.log("cloneSelectedItem");
    this.setState({ isContextMenuShowing: false });
    const selectedComponent = this.getSelectedComponent();
    this.addComponent({
      ...selectedComponent,
      x: selectedComponent.x + 30,
      y: selectedComponent.y + 30,
    });
  };

  deleteSelectedItem = () => {
    this.setState({ isContextMenuShowing: false });
    const selectedComponent = this.getSelectedComponent();

    this.props.sendChange({
      operation: "deleteComponent",
      data: {
        id: selectedComponent.id,
      },
    });
  };

  zoom = (e) => {
    console.log("wheel");

    const { canvasScale } = this.state;
    const deltaScale = -e.deltaY / 30000;

    const targetXPercent = e.nativeEvent.offsetX / VIEWPORT_WIDTH;
    const targetYPercent = e.nativeEvent.offsetY / VIEWPORT_HEIGHT;

    console.log(targetXPercent, targetYPercent);

    // const offsetX = targetXPercent - 0.5;
    // const offsetY = targetYPercent - 0.5;

    // const newCanvasX = canvasX + targetXPercent * offsetX;
    // const newCanvasY = canvasY + targetYPercent * offsetY;

    let computedScale = canvasScale + deltaScale;
    let newScale = Math.min(
      Math.max(computedScale, MIN_CANVAS_SCALE),
      MAX_CANVAS_SCALE
    );

    if (newScale !== canvasScale) {
      this.setState({ canvasScale: newScale });
    }

    // this.setState({
    // canvasScale: canvasScale + deltaScale,
    // canvasX: newCanvasX,
    // canvasY: newCanvasY,
    // });
  };

  onPanStart = (e) => {
    this.setState({
      isPanning: true,
      previousMouseX: e.clientX,
      previousMouseY: e.clientY,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
    });
  };

  onComponentMouseDown = (e, selectedComponentId) => {
    this.setState({
      isDraggingComponent: true,
      selectedComponentId,
      previousMouseX: e.clientX,
      previousMouseY: e.clientY,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
    });
  };

  onMouseMove = (e) => {
    const { isContextMenuShowing, isDraggingComponent, isPanning } = this.state;
    if (isContextMenuShowing || (!isDraggingComponent && !isPanning)) {
      return;
    }
    const { previousMouseX, previousMouseY, canvasX, canvasY } = this.state;

    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    if (isDraggingComponent) {
      const selectedComponent = this.getSelectedComponent();

      this.props.moveComponent({
        x: selectedComponent.x + deltaX,
        y: selectedComponent.y + deltaY,
        id: selectedComponent.id,
      });
    } else if (isPanning) {
      this.setState({
        canvasX: canvasX + deltaX,
        canvasY: canvasY + deltaY,
      });
    }

    this.setState({
      previousMouseX: e.clientX,
      previousMouseY: e.clientY,
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
        iconPath: componentDetails.iconPath,
        x: componentDetails.x || 5000,
        y: componentDetails.y || 5000,
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

    return (
      <ContextMenu
        target={selectedComponent}
        onRename={this.renameSelectedItem}
        onDelete={this.deleteSelectedItem}
        onClone={this.cloneSelectedItem}
      />
    );
  };

  render() {
    const { canvasX, canvasY, canvasScale } = this.state;
    if (!this.props.data) {
      return <p>Loading...</p>;
    }

    return (
      <div className="diagram-editor">
        <button onClick={this.save} className="save">
          Save
        </button>
        <button onClick={this.save} className="home">
          <Link to="/">Home</Link>
        </button>
        <ComponentList onSelect={this.addComponent} />

        <div className="editor">
          <div
            className="canvas"
            style={{
              top: canvasY + "px",
              left: canvasX + "px",
              transform: `scale(${canvasScale})`,
            }}
            onWheel={this.zoom}
            onMouseDown={this.onPanStart}
            onClick={(e) => this.setState({ selectedComponentId: null })}
          >
            {this.displayContextMenu()}
            {this.displayComponents()}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(DiagramEditor);
