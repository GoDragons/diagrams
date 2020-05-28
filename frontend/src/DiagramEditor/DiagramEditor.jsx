import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

import ComponentList from "../ComponentList/ComponentList";
import ComponentItem from "./ComponentItem/ComponentItem";
import ContextMenu from "./ContextMenu/ContextMenu";
import Connection from "./Connection/Connection";
import VersionModal from "./VersionModal/VersionModal";
import ChatBox from "./ChatBox/ChatBox";
import Participants from "./Participants/Participants";
import DiagramDetails from "./DiagramDetails/DiagramDetails";

import { withRouter, Link } from "react-router-dom";
import Cookie from "js-cookie";

import _ from "lodash";

import axios from "axios";

import { applyChangeToDiagramData } from "common/diagramChangeHandler.js";

import { REST_API_URL, WEBSOCKET_API_URL } from "common/constants";

const MIN_CANVAS_SCALE = 0.4;
const MAX_CANVAS_SCALE = 2;
const TRIM_CONNECTION_END_AMOUNT = 70; // this is so we can see the end of the connection arrow
const GRID_CELL_SIZE = 20; // for snapping to the grid when moving components
const COMPONENT_WIDTH = 100;
const COMPONENT_HEIGHT = 100;
const MAX_CONNECTION_RETRY_COUNT = 2;

export class DiagramEditor extends React.Component {
  socket = undefined;
  authorId = null;
  peerId = null;
  connectionRetryCount = 0;

  state = {
    diagramData: null,
    isMaster: false,
    isVersionModalOpen: false,
    isDraggingComponent: false,
    isLoggedInSomewhereElse: false,
    isReadOnlyMode: false,
    isPanning: false,
    isConnecting: false,
    isGridSnapActive: true,
    isComponentContextMenuShowing: false,
    isConnectionContextMenuShowing: false,
    participants: [],
    error: null,
    selectedComponentId: null,
    selectedConnectionId: null,
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
    participantWeFollow: null,
    followers: [],
    followCanvasX: 0,
    followCanvasY: 0,
    lastFollowEvent: Date.now(),
    canvasScale: 1,
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
    const existingAuthorId = Cookie.get("authorId");
    if (existingAuthorId) {
      this.authorId = existingAuthorId;
    } else {
      this.authorId = String(Math.floor(Math.random() * 1000000000000));
      Cookie.set("authorId", this.authorId);
    }

    console.log("authorId:", this.authorId);
  };

  initialiseWebSocket = () => {
    const newSocket = new WebSocket(WEBSOCKET_API_URL);

    this.socket = newSocket;

    this.socket.sendThrottled = _.throttle(this.socket.send, 60, {
      trailing: false,
    });

    // Connection opened
    newSocket.addEventListener("open", (event) => {
      console.log("connection open");
      this.connectionRetryCount = 0;
    });
    newSocket.addEventListener("close", this.onSocketClosed);

    // Listen for messages
    newSocket.addEventListener("message", this.onMessageReceived);
  };

  onSocketClosed = () => {
    if (this.connectionRetryCount < MAX_CONNECTION_RETRY_COUNT) {
      this.connectionRetryCount++;
      setTimeout(() => {
        console.log("connection has been closed, reopening");
        this.initialiseWebSocket();
        this.joinDiagram();
      }, 1000);
    } else {
      console.log("Reached retry connection limit");
    }
  };

  onMessageReceived = (event) => {
    const messageData = JSON.parse(event.data);
    // console.log("message:", messageData);
    switch (messageData.type) {
      case "master":
        this.setState({ isMaster: true });
        this.saveDiagram(this.state.diagramData);
        break;
      case "diagramData":
        this.handleNewDiagramData(messageData.diagramData);
        this.setState({
          participants: messageData.participants || [],
        });
        break;
      case "diagramDataError":
        this.setState({ error: messageData.message });
        break;
      case "connectionId":
        this.setState({ connectionId: messageData.connectionId });
        break;
      case "disconnectNotification":
        this.removeParticipant(messageData.user);
        break;
      case "joinNotification":
        this.addParticipant(messageData.user);
        break;
      case "loggedInSomewhereElse":
        this.handleLoginSomewhereElse();
        break;
      case "change":
        this.handleChange(messageData.change);
        break;
      default:
        break;
    }
  };

  rejoinDiagram = () => {
    this.setState({ isLoggedInSomewhereElse: false });
    this.initialiseWebSocket();
    this.joinDiagram();
  };

  handleLoginSomewhereElse = () => {
    this.socket.removeEventListener("close", this.onSocketClosed);
    this.socket.close();
    this.setState({ isLoggedInSomewhereElse: true, isMaster: false });
  };

  addParticipant = (user) => {
    const { participants } = this.state;
    const participantAlreadyExists = participants.find(
      (x) => x.authorId === user.authorId
    );

    if (participantAlreadyExists) {
      this.setState({
        participants: participants.map((x) => (x.authorId === user ? user : x)),
      });
    } else {
      this.setState({
        participants: [...participants, user],
      });
    }
  };

  removeParticipant = (user) => {
    const { participants, followers, participantWeFollow } = this.state;

    this.setState({
      participants: participants.filter((x) => x.authorId !== user.authorId),
      participantWeFollow:
        user.authorId === participantWeFollow ? null : participantWeFollow,
      followers: followers.filter((x) => x !== user.authorId),
    });
  };

  handleNewDiagramData(diagramData) {
    let isReadOnlyMode = !diagramData.isLatest;
    this.setState({ diagramData, isReadOnlyMode });
  }

  handleChange = (change) => {
    // console.log("change:", change);
    const { diagramData } = this.state;
    let newDiagramData = diagramData;
    switch (change.operation) {
      case "newVersion":
        window.location = `/diagrams/${change.data.diagramId}/${change.data.versionId}`;
        return;

      case "follow-start":
        this.setState({
          followers: [...this.state.followers, change.authorId],
        });
        return;

      case "follow-end":
        this.setState({
          followers: this.state.followers.filter((x) => x !== change.authorId),
        });
        return;

      case "stop-following":
        this.setState({
          participantWeFollow: undefined,
        });
        return;

      case "pan":
        const deltaTime = change.timestamp - this.state.lastFollowEvent;
        if (deltaTime > 0) {
          this.setState({
            followCanvasX: change.data.x,
            followCanvasY: change.data.y,
            lastFollowEvent: change.timestamp,
          });
        }
        return;

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
        this.joinDiagram();
      }, 300);
    }
  };

  sendChange = (change, options = {}) => {
    // console.log("sendChange() change = ", change, "options = ", options);
    const { isReadOnlyMode, diagramData } = this.state;
    const { diagramId, versionId } = diagramData;
    if (isReadOnlyMode) {
      return;
    }

    const IGNORED_CHANGES = ["follow-start"]; // changes we don't want to apply on ourselves

    let processedChange = {
      ...change,
      authorId: this.authorId,
      timestamp: Date.now(),
    };

    const messageToSend = {
      message: "sendchange",
      diagramId: diagramId,
      versionId: versionId,
      change: processedChange,
    };

    if (options.recipients) {
      messageToSend.recipients = options.recipients;
    }

    if (!IGNORED_CHANGES.includes(change.operation)) {
      this.handleChange(processedChange);
    }

    if (messageToSend.recipients && messageToSend.recipients.length === 0) {
      return;
    }

    if (options.throttled) {
      this.socket.sendThrottled(JSON.stringify(messageToSend));
    } else {
      this.socket.send(JSON.stringify(messageToSend));
    }
  };

  sendChatMessage = (messageContent) => {
    console.log("messageContent", messageContent);
    this.sendChange({
      operation: "chatMessage",
      data: {
        content: messageContent,
        authorId: this.authorId,
        sendAt: Date.now(),
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
    const newY = e.clientY - canvasY - COMPONENT_HEIGHT;

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
      this.applyPan({
        newX: canvasX + deltaX,
        newY: canvasY + deltaY,
      });
    }

    this.setState({
      previousMouseX: e.clientX,
      previousMouseY: e.clientY,
      deltaX,
      deltaY,
    });
  };

  applyPan = ({ newX, newY }) => {
    this.setState({
      canvasX: newX,
      canvasY: newY,
    });

    this.sendChange(
      {
        operation: "pan",
        data: {
          x: newX,
          y: newY,
        },
      },
      { recipients: this.state.followers, throttled: true }
    );
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

  followParticipant = (participant) => {
    const { participantWeFollow } = this.state;

    if (participantWeFollow) {
      this.sendChange(
        { operation: "follow-end" },
        { recipients: [participantWeFollow] }
      );
    }

    this.setState({ participantWeFollow: participant.authorId });
    this.sendChange(
      { operation: "follow-start" },
      { recipients: [participant.authorId] }
    );
  };

  unFollowParticipant = (participant) => {
    this.setState({ participantWeFollow: null });
    this.sendChange(
      { operation: "follow-end" },
      { recipients: [participant.authorId] }
    );
  };

  removeFollower = (participant) => {
    this.setState({
      followers: this.state.followers.filter(
        (follower) => follower !== participant.authorId
      ),
    });
    this.sendChange(
      { operation: "stop-following" },
      { recipients: [participant.authorId] }
    );
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

  displayComponentList = () => {
    const { isReadOnlyMode } = this.state;
    if (isReadOnlyMode) {
      return null;
    }

    return <ComponentList onSelect={this.addComponent} />;
  };

  displayChatBox = () => {
    const { isReadOnlyMode, diagramData } = this.state;
    if (isReadOnlyMode) {
      return null;
    }

    return (
      <ChatBox
        messages={diagramData.messages}
        onSend={this.sendChatMessage}
        authorId={this.authorId}
      />
    );
  };

  displayParticipants = () => {
    const { isReadOnlyMode } = this.state;
    if (isReadOnlyMode) {
      return null;
    }

    return (
      <Participants
        participants={this.state.participants}
        authorId={this.authorId}
        onFollow={this.followParticipant}
        onUnFollow={this.unFollowParticipant}
        onRemoveFollower={this.removeFollower}
        followers={this.state.followers}
        participantWeFollow={this.state.participantWeFollow}
      />
    );
  };

  displayDiagramDetails = () => {
    const { isGridSnapActive } = this.state;
    return (
      <DiagramDetails
        {...this.state}
        openVersionModal={(e) => this.setState({ isVersionModalOpen: true })}
        toggleGridSnap={() =>
          this.setState({ isGridSnapActive: !isGridSnapActive })
        }
      />
    );
  };

  displayOverlays = () => {
    const { isMaster } = this.state;
    return (
      <div>
        {this.displayVersionModal()}
        {this.displayChatBox()}
        {this.displayParticipants()}
        {this.displayLoggedInSomewhereElse()}

        {isMaster ? <span className="is-master">master</span> : null}
      </div>
    );
  };

  displayLoggedInSomewhereElse = () => {
    if (!this.state.isLoggedInSomewhereElse) {
      return null;
    }
    return (
      <div className="logged-in-somewhere-else">
        <h2 className="title">
          You have been disconnected because you have logged in somewhere else
        </h2>
        <button onClick={this.rejoinDiagram}>Use app here</button>
      </div>
    );
  };

  displayEditor = () => {
    const {
      canvasX,
      canvasY,
      canvasScale,
      followCanvasX,
      followCanvasY,
    } = this.state;

    const chosenCanvasX = followCanvasX !== null ? followCanvasX : canvasX;
    const chosenCanvasY = followCanvasY !== null ? followCanvasY : canvasY;
    const canvasProps = {
      className: "canvas",
      style: {
        top: chosenCanvasY + "px",
        left: chosenCanvasX + "px",
        transform: `scale(${canvasScale})`,
      },
      onWheel: this.zoom,
      onMouseDown: this.onPanStart,
      onMouseUp: this.onCanvasMouseUp,
      onMouseMove: this.onCanvasMouseMove,
    };

    return (
      <div className="editor">
        <div {...canvasProps}>
          {this.displayComponentContextMenu()}
          {this.displayConnectionContextMenu()}

          {this.displayComponents()}
          {this.displayConnections()}
          {this.displayConnectArrow()}
        </div>
      </div>
    );
  };

  render() {
    const { diagramData, error } = this.state;
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
        {this.displayOverlays()}
        <div className="main-container">
          <div className="canvas-container">
            {this.displayDiagramDetails()}
            {this.displayEditor()}
          </div>
          {this.displayComponentList()}
        </div>
      </div>
    );
  }
}

export default withRouter(DiagramEditor);
