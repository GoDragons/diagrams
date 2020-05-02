const { WEBSOCKET_API_NAME, REST_API_NAME } = require("../constants");

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

module.exports = [
  getRESTLambdaFunction({ name: "create-diagram", method: "POST" }),
  getRESTLambdaFunction({ name: "delete-diagram", method: "POST" }),
  getRESTLambdaFunction({ name: "get-diagrams" }),
  getRESTLambdaFunction({ name: "save", method: "POST" }),
  getRESTLambdaFunction({ name: "create-version", method: "POST" }),
  getWebsocketLambdaFunction({ name: "join-diagram" }),
  getWebsocketLambdaFunction({ name: "send-change" }),
  getWebsocketLambdaFunction({ name: "disconnect", routeKey: "$disconnect" }),
  getWebsocketLambdaFunction({ name: "connect", routeKey: "$connect" }),
];
