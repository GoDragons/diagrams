import React from "react";
import "./App.css";

const API_ID = "s5fb5vb8c3";

export default class App extends React.Component {
  socket = undefined;
  state = {
    message: "",
    roomName: "",
    messageList: [],
  };

  componentDidMount() {
    const newSocket = new WebSocket(
      `wss://${API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`
    );

    this.socket = newSocket;

    // Connection opened
    newSocket.addEventListener("open", function (event) {
      console.log("connection open");
    });

    // Listen for messages
    newSocket.addEventListener("message", this.onMessageReceived);
  }

  onMessageReceived = (event) => {
    this.setState({ messageList: [...this.state.messageList, event.data] });
  };

  displayMessageList = () => {
    if (!this.state.messageList || this.state.messageList.length === 0) {
      return <p>No messages yet. Send one now!</p>;
    }

    return this.state.messageList.map((message, index) => (
      <p key={index}>Server: {message}</p>
    ));
  };

  sendMessage = () => {
    this.socket.send(
      JSON.stringify({ message: "sendmessage", data: this.state.message })
    );
    this.setState({ message: "" });
  };

  createRoom = () => {
    this.socket.send(
      JSON.stringify({ message: "createroom", data: this.state.roomName })
    );
    this.setState({ roomName: "" });
  };

  getRooms = () => {
    this.socket.send(JSON.stringify({ message: "getrooms", data: "" }));
  };

  render() {
    const { message, roomName } = this.state;
    return (
      <div className="App">
        <div>
          <label>Send message</label>
          <br />
          <input
            value={message}
            onChange={(e) => this.setState({ message: e.target.value })}
          />
          <br />
          <button onClick={this.sendMessage}>Send</button>
        </div>
        <br />
        <br />
        <br />
        <div>
          <label>Create room</label>
          <br />
          <input
            value={roomName}
            onChange={(e) => this.setState({ roomName: e.target.value })}
          />
          <br />
          <button onClick={this.createRoom}>Create</button>
        </div>
        <br />
        <br />
        <br />
        <div>
          <p>Messages received so far: </p>
          {this.displayMessageList()}
        </div>
        <button onClick={this.getRooms}>Get Rooms</button>
      </div>
    );
  }
}
