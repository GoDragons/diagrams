import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

import { BrowserRouter as Router } from "react-router-dom";

// import { Auth } from "aws-amplify";

// const cognitoUserPoolId = "eu-west-2_Ma9rzxsi5";
// const cognitoClientId = "40qqlnrvn6aa1366b6tb2sm0vb";
// const cognitoAppWebDomain = "auth-diagrams.godragons.com";

import Amplify from "aws-amplify";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

loadApp();

function loadApp() {
  ReactDOM.render(
    <Router>
      <App />
    </Router>,
    document.getElementById("root")
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
