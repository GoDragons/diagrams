import React from "react";
import "./App.css";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

const API_ID = "sf779zf729";

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
    console.log("event:", event);
    const messageData = JSON.parse(event.data);
    console.log("messageData:", messageData);
    switch (messageData.type) {
      case "diagramList":
        this.handleDiagramList(messageData.diagrams);
        break;
      case "diagramData":
        console.log("received diagramData:", messageData);
        this.setState({ diagramData: messageData.diagramData });
        break;
      case "change":
        console.log("received change:", messageData);
        this.handleChange(messageData.change);
        break;
      default:
        console.log("unknown message:", messageData);
        break;
    }
  };

  handleDiagramList = (diagrams) => {
    this.setState({ diagrams: diagrams });
  };

  handleChange = (change) => {
    console.log("handling change:", change);
    switch (change.operation) {
      case "addElement":
        this.addElementToDiagram(change.data);
        break;
      case "moveElement":
        this.moveElementInDiagram(change.data);
        break;
      case "deleteElement":
        this.deleteElementFromDiagram(change.data);
        break;
    }
  };

  addElementToDiagram = (elementDetails) => {
    this.setState({
      diagramData: {
        ...this.state.diagramData,
        components: [...this.state.diagramData.components, elementDetails],
      },
    });
  };

  moveElementInDiagram = (moveDetails) => {};

  deleteElementFromDiagram = (deleteDetails) => {};

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
    console.log("sendChange() changeData = ", changeData);
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
