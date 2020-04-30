import React from "react";
import "./App.css";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

import axios from "axios";
import { Route, Switch, withRouter } from "react-router-dom";

import CreateDiagram from "./CreateDiagram/CreateDiagram";
import DiagramList from "./DiagramList/DiagramList";

import STACK_OUTPUT from "./cloudformation_output.json";

function getCloudFormationOuputByName(outputKey) {
  const outputs = STACK_OUTPUT.Stacks[0].Outputs;
  return outputs.find((output) => output.OutputKey === outputKey).OutputValue;
}

const WEBSOCKET_API_ID = getCloudFormationOuputByName("WebSocketApiId");
const REST_API_ID = getCloudFormationOuputByName("RESTSocketApiId");
const REST_API_URL = `https://${REST_API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`;

export class App extends React.Component {
  socket = undefined;
  state = {
    diagrams: null,
    diagramData: null,
  };

  componentDidMount() {
    this.initialiseWebSocket();
    this.getDiagrams();
  }

  initialiseWebSocket = () => {
    const newSocket = new WebSocket(
      `wss://${WEBSOCKET_API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`
    );

    this.socket = newSocket;

    // Connection opened
    newSocket.addEventListener("open", (event) => {
      console.log("connection open");
    });

    // Listen for messages
    newSocket.addEventListener("message", this.onMessageReceived);
  };

  getDiagrams = () => {
    axios
      .get(`${REST_API_URL}/get-diagrams`)
      .then((response) => this.setState({ diagrams: response.data.sort() }))
      .catch((e) => alert(`Could not get diagrams:`, e));
  };

  createDiagram = ({ diagramName }) => {
    const { diagrams } = this.state;
    axios
      .post(`${REST_API_URL}/create-diagram`, { diagramId: diagramName })
      .then(() => {
        this.setState({
          diagrams: [...diagrams, diagramName],
        });
        this.props.history.push(`/diagrams/${diagramName}`);
      })
      .catch((e) => alert(`Could not create diagram:`, e));
  };

  saveDiagram = () => {
    console.log("saveDiagram()");
    const { diagramData } = this.state;
    axios
      .post(`${REST_API_URL}/save`, { diagramData })
      .then(() => {
        alert("Diagram saved successfully");
      })
      .catch((e) => alert(`Could not save diagram:`, e));
  };

  deleteDiagram = (diagramId) => {
    const { diagrams } = this.state;

    axios
      .post(`${REST_API_URL}/delete-diagram`, { diagramId: diagramId })
      .then(() => {
        const targetIndex = this.state.diagrams.findIndex(
          (crtDiagramId) => crtDiagramId === diagramId
        );
        this.setState({
          diagrams: [
            ...diagrams.slice(0, targetIndex),
            ...diagrams.slice(targetIndex + 1),
          ],
        });
      })
      .catch((e) => alert(`Could not delete diagram:`, e));
  };

  onMessageReceived = (event) => {
    const messageData = JSON.parse(event.data);
    console.log("mesage:", messageData);
    switch (messageData.type) {
      case "diagramData":
        this.setState({ diagramData: messageData.diagramData });
        break;
      case "change":
        this.handleChange(messageData.change);
        break;
      default:
        break;
    }
  };

  handleChange = (change) => {
    switch (change.operation) {
      case "addComponent":
        this.addComponent(change.data);
        break;
      case "moveComponent":
        this.moveComponent(change.data);
        break;
      case "deleteComponent":
        this.deleteComponent(change.data);
        break;

      case "addConnection":
        this.addConnection(change.data);
        break;
      case "updateConnection":
        this.updateConnection(change.data);
        break;
      case "deleteConnection":
        this.deleteConnection(change.data);
        break;
      default:
        console.error("unhandled change:", change.data);
        break;
    }
  };

  addComponent = (componentDetails) => {
    this.setState({
      diagramData: {
        ...this.state.diagramData,
        components: [...this.state.diagramData.components, componentDetails],
      },
    });
  };

  addConnection = (connectionDetails) => {
    this.setState({
      diagramData: {
        ...this.state.diagramData,
        connections: [...this.state.diagramData.connections, connectionDetails],
      },
    });
  };

  updateConnection = (connectionDetails) => {
    const { connections } = this.state.diagramData;
    const targetIndex = connections.findIndex(
      (element) => element.id === connectionDetails.id
    );

    this.setState({
      diagramData: {
        ...this.state.diagramData,
        connections: [
          ...connections.slice(0, targetIndex),
          connectionDetails,
          ...connections.slice(targetIndex + 1),
        ],
      },
    });
  };

  moveComponent = (moveDetails) => {
    const { components } = this.state.diagramData;
    const targetIndex = components.findIndex(
      (element) => element.id === moveDetails.id
    );

    let updatedElement = {
      ...components[targetIndex],
      x: moveDetails.x,
      y: moveDetails.y,
    };

    this.setState({
      diagramData: {
        ...this.state.diagramData,
        components: [
          ...components.slice(0, targetIndex),
          updatedElement,
          ...components.slice(targetIndex + 1),
        ],
      },
    });
  };

  deleteComponent = (deleteDetails) => {
    const { components } = this.state.diagramData;
    const targetIndex = components.findIndex(
      (element) => element.id === deleteDetails.id
    );

    this.setState({
      diagramData: {
        ...this.state.diagramData,
        components: [
          ...components.slice(0, targetIndex),
          ...components.slice(targetIndex + 1),
        ],
      },
    });
  };

  deleteConnection = (deleteDetails) => {
    const { connections } = this.state.diagramData;
    const targetIndex = connections.findIndex(
      (element) => element.id === deleteDetails.id
    );

    this.setState({
      diagramData: {
        ...this.state.diagramData,
        connections: [
          ...connections.slice(0, targetIndex),
          ...connections.slice(targetIndex + 1),
        ],
      },
    });
  };

  joinDiagram = (diagramId) => {
    try {
      this.socket.send(
        JSON.stringify({ message: "joindiagram", diagramId: diagramId })
      );
    } catch (e) {
      setTimeout(() => {
        this.joinDiagram(diagramId);
      }, 100);
    }
  };

  sendChange = (changeData) => {
    this.socket.send(
      JSON.stringify({
        message: "sendchange",
        diagramId: this.state.diagramData.diagramId,
        change: changeData,
      })
    );
  };

  render() {
    return (
      <div className="app">
        <Switch>
          <Route exact path="/create-diagram">
            <CreateDiagram onSubmit={this.createDiagram} />
          </Route>
          <Route exact path="/">
            <DiagramList
              diagrams={this.state.diagrams}
              deleteDiagram={this.deleteDiagram}
            />
          </Route>
          <Route exact path="/diagrams/:diagramId">
            <DiagramEditor
              data={this.state.diagramData}
              sendChange={this.sendChange}
              save={this.saveDiagram}
              moveComponent={this.moveComponent}
              joinDiagram={this.joinDiagram}
            />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default withRouter(App);
