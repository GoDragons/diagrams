const { WEBSOCKET_API_NAME, REST_API_NAME } = require("../constants");

const { addFunction } = require("../lambda_helpers");

const ENVIRONMENT_VARIABLES_LAMBDA = {
  Variables: {
    DIAGRAMS_TABLE_NAME: {
      Ref: "DiagramsTable",
    },
    OPEN_DIAGRAMS_TABLE_NAME: {
      Ref: "OpenDiagramsTable",
    },
  },
};

function getWebSocketFunction({ name, routeKey }) {
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

function getRESTFunction({ name, method = "GET" }) {
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

function getPrivateFunction({ name }) {
  const data = {
    name,
    Role: { "Fn::GetAtt": ["WebsocketLambdaFunctionRole", "Arn"] },
    Environment: ENVIRONMENT_VARIABLES_LAMBDA,
    CodeUri:
      "../lambda_functions/private/" + name.split("-").join("").toLowerCase(),
  };
  return data;
}

module.exports = [
  getRESTFunction({ name: "create-diagram", method: "POST" }),
  getRESTFunction({ name: "delete-diagram", method: "POST" }),
  getRESTFunction({ name: "delete-version", method: "POST" }),
  getRESTFunction({ name: "get-diagrams" }),
  getRESTFunction({ name: "save", method: "POST" }),
  getRESTFunction({ name: "create-version", method: "POST" }),
  getWebSocketFunction({ name: "join-diagram" }),
  getWebSocketFunction({ name: "send-change" }),
  getWebSocketFunction({ name: "disconnect", routeKey: "$disconnect" }),
  getWebSocketFunction({ name: "connect", routeKey: "$connect" }),
  getPrivateFunction({ name: "choose-new-master", method: "POST" }),
  getPrivateFunction({ name: "handle-disconnect", method: "POST" }),
];
