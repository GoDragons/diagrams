import React from "react";
import "App.css";
import DiagramEditor from "./DiagramEditor/DiagramEditor.jsx";

import axios from "axios";
import { Route, Switch, withRouter } from "react-router-dom";

import CreateDiagram from "CreateDiagram/CreateDiagram";
import DiagramList from "DiagramList/DiagramList";

import { getCloudFormationOuputByName } from "common/outputParser.js";

const REST_API_ID = getCloudFormationOuputByName("RESTSocketApiId");
const REST_API_URL = `https://${REST_API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`;

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
      .then(() => {
        this.setState({
          diagrams: [...diagrams, diagramName],
        });
        this.props.history.push(`/diagrams/${diagramName}`);
      })
      .catch((e) => alert(`Could not create diagram:`, e));
  };

  saveDiagram = (diagramData) => {
    axios
      .post(`${REST_API_URL}/save`, { diagramData })
      .then(() => {
        // alert("Diagram saved successfully");
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
            <DiagramEditor save={this.saveDiagram} />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default withRouter(App);
