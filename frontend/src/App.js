import React from "react";
import "App.scss";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

import { Route, Switch, withRouter } from "react-router-dom";

import CreateDiagram from "CreateDiagram/CreateDiagram";
import DiagramList from "DiagramList/DiagramList";

export class App extends React.Component {
  render() {
    return (
      <div className="app">
        <Switch>
          <Route exact path="/">
            <DiagramList />
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

export default withRouter(App);
