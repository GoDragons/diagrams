import React from "react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Auth } from "aws-amplify";
import { Route, Switch } from "react-router-dom";
import { Row, Col } from "antd";

import DiagramEditor from "DiagramEditor/DiagramEditor";
import DiagramDetails from "DiagramDetails/DiagramDetails";
import HomePage from "HomePage/HomePage";
import MainBar from "MainBar/MainBar";

import "./App.scss";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'

export class App extends React.Component {
  state = {
    userData: null,
    userCredentials: null,
    pageTitle: "",
  };

  async componentDidMount() {
    const userData = await Auth.currentUserInfo();
    const userCredentials = await Auth.currentSession();
    console.log("userCredentials:", userCredentials);
    this.setState({ userData, userCredentials });
    console.log("userData = ", userData);
  }

  setPageTitle = (pageTitle) => {
    this.setState({ pageTitle });
  };

  render() {
    const { userData } = this.state;
    if (!userData) {
      return <p>Loading...</p>;
    }
    return (
      <div className="app">
        <MainBar {...this.state} />

        <Switch>
          <Route exact path="/">
            <HomePage {...this.state} setPageTitle={this.setPageTitle} />
          </Route>
          <Route exact path="/diagrams/:diagramId/:versionId/edit">
            <DiagramEditor {...this.state} setPageTitle={this.setPageTitle} />
          </Route>
          <Route exact path="/diagrams/:diagramId/details">
            <DiagramDetails {...this.state} setPageTitle={this.setPageTitle} />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default withAuthenticator(App);
