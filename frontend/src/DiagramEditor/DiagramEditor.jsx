import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";
import ComponentItem from "./ComponentItem/ComponentItem";
import ContextMenu from "./ContextMenu/ContextMenu";
import Connection from "./Connection/Connection";

import { withRouter, Link } from "react-router-dom";

const MIN_CANVAS_SCALE = 0.4;
const MAX_CANVAS_SCALE = 2;
const TRIM_CONNECTION_END_AMOUNT = 80; // this is so we can see the end of the connection arrow

export class DiagramEditor extends React.Component {
  state = {
    selectedComponentId: null,
    selectedConnectionId: null,
    isDraggingComponent: false,
    isPanning: false,
    isConnecting: false,
    previousMouseX: null,
    previousMouseY: null,
    mouseCanvasX: null,
    mouseCanvasY: null,
    mouseCanvasXOnOpenContextMenu: null,
    mouseCanvasYOnOpenContextMenu: null,
    initialMouseX: null,
    initialMouseY: null,
    deltaX: null,
    deltaY: null,
    canvasX: -5000,
    canvasY: -5000,
    canvasScale: 1,
    isComponentContextMenuShowing: false,
    isConnectionContextMenuShowing: false,
  };

  componentDidMount() {
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mouseup", this.onWindowMouseUp);
    window.addEventListener("mousemove", this.onWindowMouseMove);

    this.props.joinDiagram(this.props.match.params.diagramId);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("mouseup", this.onWindowMouseUp);
    window.removeEventListener("mousemove", this.onWindowMouseMove);
  }

  getSelectedComponent = () => {
    const { selectedComponentId } = this.state;

    return this.props.data.components.find(
      ({ id }) => id === selectedComponentId
    );
  };

  getSelectedConnection = () => {
    const { selectedConnectionId } = this.state;

    return this.props.data.connections.find(
      ({ id }) => id === selectedConnectionId
    );
  };

  onCanvasMouseMove = (e) => {};

  onKeyDown = (e) => {
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };

  onCanvasMouseUp = (e) => {
    const { isConnecting } = this.state;

    if (!isConnecting) {
      this.setState({ selectedComponentId: null });
    }
  };

  onWindowMouseUp = (e) => {
    this.setState({
      isDraggingComponent: false,
      isPanning: false,
      isConnecting: false,
      isComponentContextMenuShowing: false,
      isConnectionContextMenuShowing: false,
    });
  };

  renameSelectedItem = () => {
    this.setState({ isComponentContextMenuShowing: false });
  };

  startConnect = () => {
    this.setState({ isConnecting: true, isComponentContextMenuShowing: false });
  };

  cloneSelectedItem = () => {
    this.setState({ isComponentContextMenuShowing: false });
    const selectedComponent = this.getSelectedComponent();
    this.addComponent({
      ...selectedComponent,
      x: selectedComponent.x + 30,
      y: selectedComponent.y + 30,
    });
  };

  deleteSelectedConnection = () => {
    const { selectedConnectionId } = this.state;
    this.setState({ isConnectionContextMenuShowing: false });
    this.props.sendChange({
      operation: "deleteConnection",
      data: {
        id: selectedConnectionId,
      },
    });
  };

  reverseSelectedConnection = () => {
    const { selectedConnectionId } = this.state;

    const selectedConnection = this.getSelectedConnection();
    this.setState({ isConnectionContextMenuShowing: false });
    this.props.sendChange({
      operation: "updateConnection",
      data: {
        id: selectedConnectionId,
        from: selectedConnection.to,
        to: selectedConnection.from,
      },
    });
  };

  deleteSelectedItem = () => {
    this.setState({ isComponentContextMenuShowing: false });
    const selectedComponent = this.getSelectedComponent();

    const { data } = this.props;

    const { selectedComponentId } = this.state;

    data.connections.forEach((connection) => {
      if (
        connection.from === selectedComponentId ||
        connection.to === selectedComponentId
      ) {
        this.props.sendChange({
          operation: "deleteConnection",
          data: {
            id: connection.id,
          },
        });
      }
    });

    this.props.sendChange({
      operation: "deleteComponent",
      data: {
        id: selectedComponent.id,
      },
    });
  };

  zoom = (e) => {
    const { canvasScale } = this.state;
    const deltaScale = -e.deltaY / 30000;

    // const targetXPercent = e.nativeEvent.offsetX / VIEWPORT_WIDTH;
    // const targetYPercent = e.nativeEvent.offsetY / VIEWPORT_HEIGHT;

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

  onConnectionMouseDown = (e, connectionId) => {
    this.setState({
      selectedConnectionId: connectionId,
    });
  };

  onComponentMouseDown = (e, componentId) => {
    const { isConnecting } = this.state;
    if (isConnecting) {
      return;
    }

    this.setState({
      selectedComponentId: componentId,
      isDraggingComponent: true,
      previousMouseX: e.clientX,
      previousMouseY: e.clientY,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
    });
  };

  onComponentMouseUp = (e, componentId) => {
    e.stopPropagation();

    const {
      isConnecting,
      selectedComponentId,
      isDraggingComponent,
    } = this.state;

    this.setState({
      isDraggingComponent: false,
      isPanning: false,
      isConnecting: false,
    });

    if (isConnecting) {
      if (selectedComponentId !== componentId) {
        this.props.sendChange({
          operation: "addConnection",
          data: {
            from: selectedComponentId,
            to: componentId,
            id: `connection_${RandomWords({ exactly: 3, join: "-" })}`,
          },
        });
      }
    } else {
      this.setState({ selectedComponentId: componentId });
    }

    if (isDraggingComponent) {
      const selectedComponent = this.getSelectedComponent();

      if (selectedComponent) {
        const wholeDeltaX = e.clientX - (this.state.initialMouseX || 0);
        const wholeDeltaY = e.clientY - (this.state.initialMouseY || 0);

        if (!wholeDeltaX && !wholeDeltaY) {
          console.log("onComponentMouseUp: we have no mouse move delta");
          return;
        }

        this.setState({
          deltaX: null,
          deltaY: null,
          initialMouseX: null,
          initialMouseY: null,
        });

        this.props.sendChange({
          operation: "moveComponent",
          data: {
            x: selectedComponent.x,
            y: selectedComponent.y,
            id: selectedComponent.id,
          },
        });
      }
    }
  };

  onWindowMouseMove = (e) => {
    const {
      isComponentContextMenuShowing,
      isConnectionContextMenuShowing,
      isDraggingComponent,
      isPanning,
      isConnecting,
    } = this.state;
    if (
      isComponentContextMenuShowing ||
      isConnectionContextMenuShowing ||
      (!isDraggingComponent && !isPanning && !isConnecting)
    ) {
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
      operation: "addComponent",
      data: {
        type: componentDetails.type,
        label: componentDetails.type,
        iconPath: componentDetails.iconPath,
        x: componentDetails.x || 5500,
        y: componentDetails.y || 5500,
        id: `component_${RandomWords({ exactly: 3, join: "-" })}`,
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
      isComponentContextMenuShowing: true,
    });
  };

  onConnectionContextMenu = (e, connectionId) => {
    e.preventDefault();
    const { canvasX, canvasY, canvasScale } = this.state;

    this.setState({
      selectedConnection: connectionId,
      isConnectionContextMenuShowing: true,
      mouseCanvasXOnOpenContextMenu: e.screenX / canvasScale - canvasX,
      mouseCanvasYOnOpenContextMenu: e.screenY / canvasScale - canvasY,
    });
  };

  displayComponents = () => {
    const { components } = this.props.data;
    const { selectedComponentId } = this.state;
    return components.map((component) => (
      <ComponentItem
        {...component}
        onMouseDown={this.onComponentMouseDown}
        onMouseUp={this.onComponentMouseUp}
        onContextMenu={this.onComponentContextMenu}
        selectedComponentId={selectedComponentId}
        key={component.id}
      />
    ));
  };

  displayConnections = () => {
    const { connections, components } = this.props.data;

    return connections.map((connection) => {
      const fromComponent = components.find(
        (component) => component.id === connection.from
      );
      const toComponent = components.find(
        (component) => component.id === connection.to
      );

      if (!fromComponent || !toComponent) {
        /*
        It means we have an orphan connection.
         It's probably OK, since this can happen right after deleting a component, 
         before the connections have been automatically removed
        */
        return null;
      }

      const style = this.getConnectionStyle(
        fromComponent.x,
        fromComponent.y,
        toComponent.x,
        toComponent.y,
        TRIM_CONNECTION_END_AMOUNT
      );
      return (
        <Connection
          key={connection.id}
          id={connection.id}
          style={style}
          onMouseDown={this.onConnectionMouseDown}
          onContextMenu={this.onConnectionContextMenu}
        />
      );
    });
  };

  displayComponentContextMenu = () => {
    const { isComponentContextMenuShowing } = this.state;
    if (!isComponentContextMenuShowing) {
      return null;
    }

    const selectedComponent = this.getSelectedComponent();

    return (
      <ContextMenu
        target={selectedComponent}
        onRename={this.renameSelectedItem}
        onDelete={this.deleteSelectedItem}
        onClone={this.cloneSelectedItem}
        onConnect={this.startConnect}
        onHide={(e) => {
          this.setState({
            isPanning: false,
          });
        }}
      />
    );
  };

  displayConnectionContextMenu = () => {
    const {
      isConnectionContextMenuShowing,
      mouseCanvasXOnOpenContextMenu,
      mouseCanvasYOnOpenContextMenu,
    } = this.state;

    if (!isConnectionContextMenuShowing) {
      return null;
    }

    const selectedConnection = this.getSelectedConnection();

    const target = {
      ...selectedConnection,
      x: mouseCanvasXOnOpenContextMenu,
      y: mouseCanvasYOnOpenContextMenu,
    };

    return (
      <ContextMenu
        target={target}
        onDelete={this.deleteSelectedConnection}
        onReverse={this.reverseSelectedConnection}
        onHide={(e) => {
          this.setState({
            isPanning: false,
          });
        }}
      />
    );
  };

  getConnectionStyle = (fromX, fromY, toX, toY, trimEndAmount = 0) => {
    var distanceX = fromX - toX;
    var distanceY = fromY - toY;

    var distance =
      Math.sqrt(distanceX * distanceX + distanceY * distanceY) - trimEndAmount;

    var angleDeg = (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;

    return {
      top: fromY + "px",
      left: fromX + "px",
      width: `${distance}px`,
      transform: `rotate(${angleDeg}deg)`,
    };
  };

  displayConnectArrow = () => {
    if (!this.state.isConnecting) {
      return null;
    }

    const selectedComponent = this.getSelectedComponent();

    if (!selectedComponent) {
      return null;
    }

    const { previousMouseX, previousMouseY, canvasX, canvasY } = this.state;

    const style = this.getConnectionStyle(
      selectedComponent.x,
      selectedComponent.y,
      previousMouseX - canvasX,
      previousMouseY - canvasY
    );
    return <Connection key="new-connection" style={style} />;
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
            onMouseUp={this.onCanvasMouseUp}
            onMouseMove={this.onCanvasMouseMove}
          >
            {this.displayComponentContextMenu()}
            {this.displayConnectionContextMenu()}
            {this.displayComponents()}
            {this.displayConnections()}
            {this.displayConnectArrow()}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(DiagramEditor);
