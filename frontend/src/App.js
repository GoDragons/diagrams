import React from "react";
import "./App.css";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

import { Route, Switch, withRouter } from "react-router-dom";

import CreateDiagram from "./CreateDiagram/CreateDiagram";
import DiagramList from "./DiagramList/DiagramList";

const API_ID = "1vt7e367o8";

export class App extends React.Component {
  socket = undefined;
  state = {
    diagrams: null,
    diagramData: null,
  };

  componentDidMount() {
    const newSocket = new WebSocket(
      `wss://${API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`
    );

    this.socket = newSocket;

    // Connection opened
    newSocket.addEventListener("open", (event) => {
      console.log("connection open");
      this.socket.send(JSON.stringify({ message: "getdiagrams", data: "" }));
    });

    // Listen for messages
    newSocket.addEventListener("message", this.onMessageReceived);
  }

  onMessageReceived = (event) => {
    const messageData = JSON.parse(event.data);
    console.log("mesage:", messageData);
    switch (messageData.type) {
      case "diagramList":
        this.handleDiagramList(messageData.diagrams);
        break;
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

  handleDiagramList = (diagrams) => {
    this.setState({ diagrams: diagrams });
  };

  handleChange = (change) => {
    switch (change.operation) {
      case "addElement":
        this.addElement(change.data);
        break;
      case "moveComponent":
        this.moveComponent(change.data);
        break;
      case "deleteComponent":
        this.deleteComponent(change.data);
        break;
      default:
        console.error("unhandled change:", change.data);
        break;
    }
  };

  addElement = (elementDetails) => {
    this.setState({
      diagramData: {
        ...this.state.diagramData,
        components: [...this.state.diagramData.components, elementDetails],
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

  createDiagram = ({ diagramName }) => {
    const { diagrams } = this.state;
    this.socket.send(
      JSON.stringify({ message: "creatediagram", data: diagramName })
    );
    this.setState({
      diagramName: "",
      diagrams: [...diagrams, diagramName],
    });
    this.props.history.push("/");
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

  save = () => {
    this.socket.send(
      JSON.stringify({
        message: "save",
        diagramData: this.state.diagramData,
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
            <DiagramList diagrams={this.state.diagrams} />
          </Route>
          <Route exact path="/diagrams/:diagramId">
            <DiagramEditor
              data={this.state.diagramData}
              sendChange={this.sendChange}
              save={this.save}
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
