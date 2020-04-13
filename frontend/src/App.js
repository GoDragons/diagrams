import React from "react";
import "./App.css";

const API_ID = "rvl2rhoje8";

export default class App extends React.Component {
  socket = undefined;
  state = {
    diagramName: "",
    diagrams: null,
  };

  componentDidMount() {
    const newSocket = new WebSocket(
      `wss://${API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`
    );

    this.socket = newSocket;

    // Connection opened
    newSocket.addEventListener("open", (event) => {
      console.log("connection open");
      this.getDiagrams();
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
        this.handleDiagramList(messageData);
        break;
      default:
        console.log("unknown message:", messageData);
        break;
    }
  };

  handleDiagramList = (messageData) => {
    this.setState({ diagrams: messageData.diagrams });
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

  displayDiagrams = () => {
    const { diagrams } = this.state;
    if (!diagrams) {
      return <p>Loading diagrams...</p>;
    }
    if (diagrams.length === 0) {
      return <p>There are no diagrams. Create one now!</p>;
    }

    return diagrams.map((diagramId) => <p key={diagramId}>{diagramId}</p>);
  };

  getDiagrams = () => {
    this.socket.send(JSON.stringify({ message: "getdiagrams", data: "" }));
  };

  render() {
    const { diagramName } = this.state;
    return (
      <div className="App">
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
          {this.displayDiagrams()}
        </div>
      </div>
    );
  }
}
