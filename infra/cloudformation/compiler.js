const { WEBSOCKET_API_NAME, REST_API_NAME } = require("./constants");

function getParameters() {
  let parameters = {};
  try {
    parameters = require("./templates/parameters.template.js");
  } catch (e) {
    // nothing, it just means we don't have parameter overrides
  }
  return parameters;
}

function getOutputs() {
  let outputs = {};
  try {
    outputs = require("./templates/outputs.template.js");
  } catch (e) {
    // nothing, it just means we don't have outputs
  }
  return outputs;
}

function getResources() {
  const path = require("path");
  const fs = require("fs");
  const directoryPath = path.join(__dirname, "templates");

  const FILES_TO_EXCLUDE = ["outputs", "parameters"];

  const resourceFiles = fs
    .readdirSync(directoryPath)
    .filter((fileName) => {
      return !FILES_TO_EXCLUDE.some((fileToExclude) =>
        fileName.includes(fileToExclude)
      );
    })
    .map((fileName) => require(`./templates/${fileName}`));

  return resourceFiles.reduce((result, file) => ({ ...result, ...file }));
}

function getTemplate() {
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Transform: "AWS::Serverless-2016-10-31",
    Description:
      "API for an online collaboration tool used to build system design diagrams",
    Parameters: getParameters(),
    Outputs: getOutputs(),
    Resources: getResources(),
  };
}

const ENVIRONMENT_VARIABLES_LAMBDA = {
  Variables: {
    CONNECTIONS_TABLE_NAME: {
      Ref: "ConnectionsTable",
    },
    DIAGRAMS_TABLE_NAME: {
      Ref: "DiagramsTable",
    },
    OPEN_DIAGRAMS_TABLE_NAME: {
      Ref: "OpenDiagramsTable",
    },
  },
};

function getWebsocketLambdaFunction({ name, routeKey }) {
  const data = {
    name,
    apiName: WEBSOCKET_API_NAME,
    route: {
      RouteKey: routeKey || name.split("-").join(""),
    },
    isWebSocket: true,
    Role: { "Fn::GetAtt": ["WebsocketLambdaFunctionRole", "Arn"] },
    Environment: ENVIRONMENT_VARIABLES_LAMBDA,
    CodeUri:
      "../lambda_functions/websocket/" + name.split("-").join("").toLowerCase(),
  };

  return data;
}

function getRESTLambdaFunction({ name, method = "GET" }) {
  const data = {
    name,
    apiName: REST_API_NAME,
    route: {
      RouteKey: `${method} /${name}`,
    },
    integration: {
      PayloadFormatVersion: "2.0",
    },
    Role: { "Fn::GetAtt": ["WebsocketLambdaFunctionRole", "Arn"] },
    Environment: ENVIRONMENT_VARIABLES_LAMBDA,
    CodeUri:
      "../lambda_functions/rest/" + name.split("-").join("").toLowerCase(),
  };

  return data;
}

module.exports = {
  template: getTemplate(),
  functions: [
    getRESTLambdaFunction({ name: "create-diagram", method: "POST" }),
    getRESTLambdaFunction({ name: "delete-diagram", method: "POST" }),
    getRESTLambdaFunction({ name: "get-diagrams" }),
    getRESTLambdaFunction({ name: "save", method: "POST" }),
    getRESTLambdaFunction({ name: "create-revision", method: "POST" }),
    getWebsocketLambdaFunction({ name: "join-diagram" }),
    getWebsocketLambdaFunction({ name: "send-change" }),
    getWebsocketLambdaFunction({ name: "disconnect", routeKey: "$disconnect" }),
    getWebsocketLambdaFunction({ name: "connect", routeKey: "$connect" }),
  ],
};
