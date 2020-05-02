import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";
import ComponentItem from "./ComponentItem/ComponentItem";
import ContextMenu from "./ContextMenu/ContextMenu";
import Connection from "./Connection/Connection";
import VersionModal from "./VersionModal/VersionModal";
import ChatBox from "./ChatBox/ChatBox";
import DiagramDetails from "./DiagramDetails/DiagramDetails";

import { withRouter, Link } from "react-router-dom";

import axios from "axios";

import { applyChangeToDiagramData } from "common/diagramChangeHandler.js";

import { getCloudFormationOuputByName } from "common/outputParser.js";

import { REST_API_URL } from "common/constants";

const WEBSOCKET_API_ID = getCloudFormationOuputByName("WebSocketApiId");

const MIN_CANVAS_SCALE = 0.4;
const MAX_CANVAS_SCALE = 2;
const TRIM_CONNECTION_END_AMOUNT = 70; // this is so we can see the end of the connection arrow
const GRID_CELL_SIZE = 20; // for snapping to the grid when moving components
const COMPONENT_WIDTH = 100;
const COMPONENT_HEIGHT = 100;

export class DiagramEditor extends React.Component {
  socket = undefined;
  authorId = null;

  state = {
    isMaster: false,
    isVersionModalOpen: false,
    diagramData: null,
    isReadOnlyMode: false,
    error: null,
    selectedComponentId: null,
    selectedConnectionId: null,
    isDraggingComponent: false,
    isPanning: false,
    isConnecting: false,
    isGridSnapActive: true,
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

    this.generateAuthorId();
    this.initialiseWebSocket();
    this.joinDiagram();
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("mouseup", this.onWindowMouseUp);
    window.removeEventListener("mousemove", this.onWindowMouseMove);

    this.socket.removeEventListener("close", this.onSocketClosed);
    this.socket.close();
  }

  generateAuthorId = () => {
    this.authorId = Math.floor(Math.random() * 1000000000000);
    console.log("authorId:", this.authorId);
  };

  initialiseWebSocket = () => {
    const newSocket = new WebSocket(
      `wss://${WEBSOCKET_API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`
    );

    this.socket = newSocket;

    // Connection opened
    newSocket.addEventListener("open", (event) => {
      console.log("connection open");
    });
    newSocket.addEventListener("close", this.onSocketClosed);

    // Listen for messages
    newSocket.addEventListener("message", this.onMessageReceived);
  };

  onSocketClosed = () => {
    console.log("connection has been closed, reopening");
    this.initialiseWebSocket();
    this.joinDiagram(this.props.match.params.diagramId);
  };

  onMessageReceived = (event) => {
    const messageData = JSON.parse(event.data);
    console.log("message:", messageData);
    switch (messageData.type) {
      case "master":
        this.setState({ isMaster: true });
        break;
      case "diagramData":
        this.handleNewDiagramData(messageData.diagramData);
        break;
      case "diagramDataError":
        this.setState({ error: messageData.message });
        break;
      case "connectionId":
        this.setState({ connectionId: messageData.connectionId });
        break;
      case "change":
        this.handleChange(messageData.change);
        break;
      default:
        break;
    }
  };

  handleNewDiagramData(diagramData) {
    let isReadOnlyMode = !diagramData.isLatest;
    this.setState({ diagramData, isReadOnlyMode });
  }

  handleChange = (change) => {
    const { diagramData } = this.state;
    let newDiagramData = diagramData;
    switch (change.operation) {
      case "newVersion":
        window.location = `/diagrams/${change.data.diagramId}/${change.data.versionId}`;
        return;
      case "chatMessage":
        console.log("chatMessage change = ", change, this.state.isMaster);
        newDiagramData = {
          ...diagramData,
          messages: !diagramData.messages
            ? [change.message]
            : [...diagramData.messages, change.message],
        };
        break;

      default:
        newDiagramData = applyChangeToDiagramData({
          change,
          diagramData: this.state.diagramData,
        });

        break;
    }

    this.setState({
      diagramData: newDiagramData,
    });

    if (this.state.isMaster) {
      this.saveDiagram(newDiagramData);
    }
  };

  createVersion = ({ versionName }) => {
    const { diagramData } = this.state;
    this.setState({ isVersionModalOpen: false });

    axios
      .post(`${REST_API_URL}/create-version`, { diagramData, versionName })
      .then((response) => {
        window.location = `/diagrams/${response.data.diagramId}/${response.data.versionId}`;
        console.log("Version created:", response.data);
        this.sendChange({
          operation: "newVersion",
          data: {
            diagramId: response.data.diagramId,
            versionId: response.data.versionId,
          },
        });
      })
      .catch((e) => alert(`Could not create version:`, e));
  };

  saveDiagram = (diagramData) => {
    axios
      .post(`${REST_API_URL}/save`, { diagramData })
      .then(() => {})
      .catch((e) => alert(`Could not save diagram:`, e));
  };

  joinDiagram = () => {
    const { diagramId, versionId } = this.props.match.params;

    try {
      this.socket.send(
        JSON.stringify({
          message: "joindiagram",
          diagramId,
          versionId,
          authorId: this.authorId,
        })
      );
    } catch (e) {
      setTimeout(() => {
        this.joinDiagram(diagramId);
      }, 300);
    }
  };

  sendChange = (change) => {
    const { isReadOnlyMode } = this.state;
    if (isReadOnlyMode) {
      return;
    }
    this.handleChange(change);

    this.socket.send(
      JSON.stringify({
        message: "sendchange",
        diagramId: this.state.diagramData.diagramId,
        change: { ...change, authorId: this.authorId },
      })
    );
  };

  sendChatMessage = (messageContent) => {
    this.sendChange({
      operation: "chatMessage",
      message: {
        content: messageContent,
      },
    });
  };

  getSelectedComponent = () => {
    const { selectedComponentId } = this.state;

    return this.state.diagramData.components.find(
      ({ id }) => id === selectedComponentId
    );
  };

  getSelectedConnection = () => {
    const { selectedConnectionId } = this.state;

    return this.state.diagramData.connections.find(
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
    this.sendChange({
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
    this.sendChange({
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

    const { selectedComponentId, diagramData } = this.state;

    diagramData.connections.forEach((connection) => {
      if (
        connection.from === selectedComponentId ||
        connection.to === selectedComponentId
      ) {
        this.sendChange({
          operation: "deleteConnection",
          data: {
            id: connection.id,
          },
        });
      }
    });

    this.sendChange({
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
    console.log("component mouse down");
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
        this.sendChange({
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

        this.sendChange({
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
      canvasX,
      canvasY,
      previousMouseX,
      previousMouseY,
      isGridSnapActive,
    } = this.state;
    if (
      isComponentContextMenuShowing ||
      isConnectionContextMenuShowing ||
      (!isDraggingComponent && !isPanning && !isConnecting)
    ) {
      return;
    }

    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    const newX = e.clientX - canvasX - COMPONENT_WIDTH / 2;
    const newY = e.clientY - canvasY - COMPONENT_HEIGHT / 2;

    const gridSnapNewX = Math.ceil(newX / GRID_CELL_SIZE) * GRID_CELL_SIZE;
    const gridSnapNewY = Math.ceil(newY / GRID_CELL_SIZE) * GRID_CELL_SIZE;

    if (isDraggingComponent) {
      const selectedComponent = this.getSelectedComponent();

      const newDiagramData = applyChangeToDiagramData({
        change: {
          operation: "moveComponent",
          data: {
            x: isGridSnapActive ? gridSnapNewX : newX,
            y: isGridSnapActive ? gridSnapNewY : newY,
            id: selectedComponent.id,
          },
        },
        diagramData: this.state.diagramData,
      });

      this.setState({ diagramData: newDiagramData });
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
    this.sendChange({
      operation: "moveComponent",
      data: {
        x: selectedComponent.x + deltaX,
        y: selectedComponent.y + deltaY,
        id: selectedComponent.id,
      },
    });
  };

  addComponent = (componentDetails) => {
    this.sendChange({
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
    const { components } = this.state.diagramData;
    const { selectedComponentId, isReadOnlyMode } = this.state;
    return components.map((component) => (
      <ComponentItem
        {...component}
        isReadOnlyMode={isReadOnlyMode}
        onMouseDown={this.onComponentMouseDown}
        onMouseUp={this.onComponentMouseUp}
        onContextMenu={this.onComponentContextMenu}
        selectedComponentId={selectedComponentId}
        key={component.id}
      />
    ));
  };

  displayConnections = () => {
    const { connections, components } = this.state.diagramData;
    const { isReadOnlyMode } = this.state;
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
        fromComponent.x + COMPONENT_WIDTH / 2,
        fromComponent.y + COMPONENT_HEIGHT / 2,
        toComponent.x + COMPONENT_WIDTH / 2,
        toComponent.y + COMPONENT_HEIGHT / 2,
        TRIM_CONNECTION_END_AMOUNT
      );
      return (
        <Connection
          key={connection.id}
          id={connection.id}
          style={style}
          onMouseDown={this.onConnectionMouseDown}
          onContextMenu={this.onConnectionContextMenu}
          isReadOnlyMode={isReadOnlyMode}
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

  displayVersionModal = () => {
    if (!this.state.isVersionModalOpen) {
      return null;
    }

    return (
      <VersionModal
        onSubmit={this.createVersion}
        onClose={() => this.setState({ isVersionModalOpen: false })}
      />
    );
  };

  displayChatBox = () => {
    const { isReadOnlyMode } = this.state;
    if (isReadOnlyMode) {
      return null;
    }

    return <ComponentList onSelect={this.addComponent} />;
  };
  displayComponentList = () => {
    const { isReadOnlyMode, diagramData } = this.state;
    if (isReadOnlyMode) {
      return null;
    }

    return (
      <ChatBox messages={diagramData.messages} onSend={this.sendChatMessage} />
    );
  };

  render() {
    const {
      canvasX,
      canvasY,
      canvasScale,
      isGridSnapActive,
      diagramData,
      error,
      isMaster,
    } = this.state;
    if (error) {
      return (
        <>
          <p>{error}</p>
          <Link to="/">
            <button className="home">Home</button>
          </Link>
        </>
      );
    }
    if (!diagramData) {
      return <p>Loading...</p>;
    }

    return (
      <div className="diagram-editor">
        {this.displayVersionModal()}

        {isMaster ? <span className="is-master">master</span> : null}

        <DiagramDetails
          {...this.state}
          openVersionModal={(e) => this.setState({ isVersionModalOpen: true })}
          toggleGridSnap={() =>
            this.setState({ isGridSnapActive: !isGridSnapActive })
          }
        />

        {this.displayComponentList()}
        {this.displayChatBox()}

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
