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
    creds: null,
  };

  async componentDidMount() {
    const userData = await Auth.currentUserInfo();
    const creds = await Auth.currentSession();
    console.log("creds:", creds);
    this.setState({ userData, creds });
    console.log("userData = ", userData);
  }

  render() {
    const { userData, creds } = this.state;
    return (
      <div className="app">
        <Sidebar userData={userData} creds={creds} />
        <Switch>
          <Route exact path="/">
            <DiagramList userData={userData} creds={creds} />
          </Route>
          <Route exact path="/create-diagram">
            <CreateDiagram />
          </Route>
          <Route exact path="/diagrams/:diagramId/:versionId">
            <DiagramEditor />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default withAuthenticator(App);
