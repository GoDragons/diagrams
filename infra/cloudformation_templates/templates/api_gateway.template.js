const { WEBSOCKET_API_NAME, REST_API_NAME } = require("../constants");

function getWebSocketApi() {
  return {
    [WEBSOCKET_API_NAME]: {
      Type: "AWS::ApiGatewayV2::Api",
      Properties: {
        Name: WEBSOCKET_API_NAME,
        ProtocolType: "WEBSOCKET",
        RouteSelectionExpression: "$request.body.message",
      },
    },
    WebsocketDeployment: {
      Type: "AWS::ApiGatewayV2::Deployment",
      DependsOn: [],
      Properties: {
        ApiId: {
          Ref: WEBSOCKET_API_NAME,
        },
      },
    },
    WebSocketProdStage: {
      Type: "AWS::ApiGatewayV2::Stage",
      Properties: {
        StageName: "Prod",
        DeploymentId: {
          Ref: "WebsocketDeployment",
        },
        ApiId: {
          Ref: WEBSOCKET_API_NAME,
        },
      },
    },
  };
}

function getRESTApi() {
  return {
    [REST_API_NAME]: {
      Type: "AWS::ApiGatewayV2::Api",
      Properties: {
        Name: REST_API_NAME,
        ProtocolType: "HTTP",
        CorsConfiguration: {
          AllowHeaders: ["*"],
          AllowMethods: ["*"],
          AllowOrigins: ["*"],
        },
      },
    },
    RESTDeployment: {
      Type: "AWS::ApiGatewayV2::Deployment",
      DependsOn: [],
      Properties: {
        ApiId: {
          Ref: REST_API_NAME,
        },
      },
    },
    RESTProdStage: {
      Type: "AWS::ApiGatewayV2::Stage",
      Properties: {
        StageName: "Prod",
        DeploymentId: {
          Ref: "RESTDeployment",
        },
        ApiId: {
          Ref: REST_API_NAME,
        },
      },
    },
  };
}

const data = {
  ...getWebSocketApi(),
  ...getRESTApi(),
};

module.exports = data;
