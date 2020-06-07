const { WEBSOCKET_API_NAME, REST_API_NAME } = require("../constants");

const ENVIRONMENT_VARIABLES_LAMBDA = {
  Variables: {
    DIAGRAMS_TABLE_NAME: {
      Ref: "DiagramsTable",
    },
    OPEN_DIAGRAMS_TABLE_NAME: {
      Ref: "OpenDiagramsTable",
    },
    DIAGRAM_MASTERS_TABLE_NAME: {
      Ref: "DiagramMastersTable",
    },
    USERS_TABLE_NAME: {
      Ref: "UsersTable",
    },
    WEBSOCKET_API_ENDPOINT:
      "https://jyoqxojbfh.execute-api.eu-west-2.amazonaws.com/Prod",
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

function getRESTFunction({ name, method = "GET", routeKey }) {
  const data = {
    name,
    apiName: REST_API_NAME,
    route: {
      RouteKey: routeKey || `${method} /${name}`,
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
  getRESTFunction({ name: "get-user" }),
  getRESTFunction({ name: "get-diagrams" }),
  getRESTFunction({
    name: "get-diagram",
    routeKey: "GET /get-diagram/{diagramId}",
  }),
  getRESTFunction({
    name: "diagram",
    routeKey: "PUT /diagram/{diagramId}",
  }),
  getRESTFunction({ name: "create-diagram", method: "POST" }),
  getRESTFunction({ name: "delete-diagram", method: "POST" }),
  getRESTFunction({ name: "delete-version", method: "POST" }),
  getRESTFunction({ name: "save", method: "POST" }),
  getRESTFunction({ name: "create-version", method: "POST" }),
  getRESTFunction({ name: "invite-to-diagram", method: "POST" }),
  getRESTFunction({ name: "test", method: "POST" }),
  getWebSocketFunction({ name: "join-diagram" }),
  getWebSocketFunction({ name: "send-change" }),
  getWebSocketFunction({ name: "disconnect", routeKey: "$disconnect" }),
  getWebSocketFunction({ name: "connect", routeKey: "$connect" }),
  getPrivateFunction({ name: "stream-open-diagrams" }),
  getPrivateFunction({ name: "stream-masters" }),
  getPrivateFunction({ name: "record-activity" }),
  // getPrivateFunction({ name: "handle-disconnect" }),
  // getPrivateFunction({ name: "choose-new-master" }),
];
