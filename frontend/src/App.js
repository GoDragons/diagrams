import React from "react";
import "./App.css";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

const API_ID = "j6mw8j4i6h";

export default class App extends React.Component {
  socket = undefined;
  state = {
    diagramName: "",
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

  createDiagram = () => {
    this.socket.send(
      JSON.stringify({ message: "creatediagram", data: this.state.diagramName })
    );
    this.setState({
      diagramName: "",
      diagrams: [...this.state.diagrams, this.state.diagramName],
    });
  };

  joinDiagram = (diagramId) => {
    this.socket.send(
      JSON.stringify({ message: "joindiagram", diagramId: diagramId })
    );
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

  displayDiagramList = () => {
    const { diagrams } = this.state;
    if (!diagrams) {
      return <p>Loading diagrams...</p>;
    }
    if (diagrams.length === 0) {
      return <p>There are no diagrams. Create one now!</p>;
    }

    return diagrams.map((diagramId) => (
      <button
        key={diagramId}
        className="diagram-item"
        onClick={(e) => this.joinDiagram(diagramId)}
      >
        {diagramId}
      </button>
    ));
  };

  displayDiagramData = () => {
    const { diagramData } = this.state;
    if (!diagramData) {
      return <p>No diagram is open</p>;
    }

    return (
      <DiagramEditor
        data={diagramData}
        sendChange={this.sendChange}
        save={this.save}
        moveComponent={this.moveComponent}
      />
    );
  };
  render() {
    const { diagramName } = this.state;
    return (
      <div className="app">
        <div>
          <label>Create diagram</label>
          <br />
          <input
            value={diagramName}
            onChange={(e) => this.setState({ diagramName: e.target.value })}
          />
          <br />
          <button onClick={this.createDiagram}>Create</button>
        </div>
        <br />
        <br />
        <br />
        <div>
          <p>Diagrams:</p>
          <div className="diagram-list">{this.displayDiagramList()}</div>
        </div>
        <div>
          <p>Current diagram:</p>
          {this.displayDiagramData()}
        </div>
      </div>
    );
  }
}
