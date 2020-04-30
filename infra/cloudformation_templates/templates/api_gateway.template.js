const { WEBSOCKET_API_NAME, REST_API_NAME } = require("../constants");

const data = {
  [WEBSOCKET_API_NAME]: {
    Type: "AWS::ApiGatewayV2::Api",
    Properties: {
      Name: WEBSOCKET_API_NAME,
      ProtocolType: "WEBSOCKET",
      RouteSelectionExpression: "$request.body.message",
    },
  },
  [REST_API_NAME]: {
    Type: "AWS::ApiGatewayV2::Api",
    Properties: {
      Name: REST_API_NAME,
      ProtocolType: "HTTP",
    },
  },
  Deployment: {
    Type: "AWS::ApiGatewayV2::Deployment",
    DependsOn: [],
    Properties: {
      ApiId: {
        Ref: WEBSOCKET_API_NAME,
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
  Stage: {
    Type: "AWS::ApiGatewayV2::Stage",
    Properties: {
      StageName: "Prod",
      Description: "Prod Stage",
      DeploymentId: {
        Ref: "Deployment",
      },
      ApiId: {
        Ref: WEBSOCKET_API_NAME,
      },
    },
  },
  RESTStage: {
    Type: "AWS::ApiGatewayV2::Stage",
    Properties: {
      StageName: "Prod",
      Description: "Prod Stage",
      DeploymentId: {
        Ref: "RESTDeployment",
      },
      ApiId: {
        Ref: REST_API_NAME,
      },
    },
  },
};

module.exports = data;
