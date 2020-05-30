import React from "react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Auth } from "aws-amplify";

import "App.scss";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

import { Route, Switch } from "react-router-dom";

import CreateDiagram from "CreateDiagram/CreateDiagram";
import DiagramList from "DiagramList/DiagramList";
import Sidebar from "Sidebar/Sidebar";

export class App extends React.Component {
  state = {
    userData: null,
    userCredentials: null,
  };

  async componentDidMount() {
    const userData = await Auth.currentUserInfo();
    const userCredentials = await Auth.currentSession();
    console.log("userCredentials:", userCredentials);
    this.setState({ userData, userCredentials });
    console.log("userData = ", userData);
  }

  render() {
    const { userData } = this.state;
    if (!userData) {
      return <p>Loading...</p>;
    }
    return (
      <div className="app">
        <Sidebar {...this.state} />
        <Switch>
          <Route exact path="/">
            <DiagramList {...this.state} />
          </Route>
          <Route exact path="/create-diagram">
            <CreateDiagram {...this.state} />
          </Route>
          <Route exact path="/diagrams/:diagramId/:versionId">
            <DiagramEditor {...this.state} />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default withAuthenticator(App);
