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
    ProdWebsocketDomainName: {
      Type: "AWS::ApiGateway::DomainName",
      Properties: {
        DomainName: "ws-diagrams.godragons.com",
        RegionalCertificateArn:
          "arn:aws:acm:eu-west-2:994541973446:certificate/b67e9782-a0a3-4e20-ab98-3a8cdc52faab",
        EndpointConfiguration: {
          Types: ["REGIONAL"],
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
    ProdRESTCustomDomainName: {
      Type: "AWS::ApiGatewayV2::DomainName",
      Properties: {
        DomainName: "rest-diagrams.godragons.com",
        DomainNameConfigurations: [
          {
            CertificateArn:
              "arn:aws:acm:eu-west-2:994541973446:certificate/b67e9782-a0a3-4e20-ab98-3a8cdc52faab",
            CertificateName: "*.godragons.com",
            EndpointType: "REGIONAL",
          },
        ],
      },
    },
    // ProdRESTCustomMapping: {
    //   Type: "AWS::ApiGatewayV2::ApiMapping",
    //   DependsOn: "ProdRESTCustomDomainName",
    //   Properties: {
    //     ApiId: {
    //       Ref: REST_API_NAME,
    //     },
    //     DomainName: "rest-diagrams.godragons.com",
    //     Stage: {
    //       Ref: "RESTProdStage",
    //     },
    //   },
    // },
  };
}

const data = {
  ...getWebSocketApi(),
  ...getRESTApi(),
};

module.exports = data;
