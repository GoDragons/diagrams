import React from "react";
import "App.scss";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

import axios from "axios";
import { Route, Switch, withRouter } from "react-router-dom";

import CreateDiagram from "CreateDiagram/CreateDiagram";
import DiagramList from "DiagramList/DiagramList";

import { REST_API_URL } from "common/constants";

export class App extends React.Component {
  state = {
    diagrams: null,
  };

  componentDidMount() {
    this.getDiagrams();
  }

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
      .then((response) => {
        this.getDiagrams();
        this.props.history.push(`/diagrams/${response.data.diagramId}`);
      })
      .catch((e) => alert(`Could not create diagram:`, e));
  };

  deleteDiagram = ({ diagramId }) => {
    const { diagrams } = this.state;

    axios
      .post(`${REST_API_URL}/delete-diagram`, { diagramId })
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
            <DiagramEditor />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default withRouter(App);
