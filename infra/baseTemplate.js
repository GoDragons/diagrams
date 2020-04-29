const WEBSOCKET_API_NAME = "Diagrams";
const REST_API_NAME = "DiagramsREST";

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

let template = {
  AWSTemplateFormatVersion: "2010-09-09",
  Transform: "AWS::Serverless-2016-10-31",
  Description:
    "API for an online collaboration tool used to build system design diagrams",
  Parameters: {
    ConnectionsTable: {
      Type: "String",
      Default: "diagrams_app_connections",
      Description:
        "(Required) The name of the new DynamoDB to store connection identifiers for each connected clients. Minimum 3 characters",
      MinLength: 3,
      MaxLength: 50,
      AllowedPattern: "^[A-Za-z_]+$",
      ConstraintDescription:
        "Required. Can be characters and underscore only. No numbers or special characters allowed.",
    },
    DiagramsTable: {
      Type: "String",
      Default: "diagrams_app_diagrams",
      Description:
        "(Required) The name of the new DynamoDB to store connection identifiers for each connected clients. Minimum 3 characters",
      MinLength: 3,
      MaxLength: 50,
      AllowedPattern: "^[A-Za-z_]+$",
      ConstraintDescription:
        "Required. Can be characters and underscore only. No numbers or special characters allowed.",
    },
    OpenDiagramsTable: {
      Type: "String",
      Default: "diagrams_app_open_diagrams",
      Description:
        "(Required) The name of the new DynamoDB to store connection identifiers for each open diagram. Minimum 3 characters",
      MinLength: 3,
      MaxLength: 50,
      AllowedPattern: "^[A-Za-z_]+$",
      ConstraintDescription:
        "Required. Can be characters and underscore only. No numbers or special characters allowed.",
    },
  },
  Resources: {
    ManageConnectionsPolicy: {
      Type: "AWS::IAM::Policy",
      Properties: {
        Roles: [{ Ref: "WebsocketLambdaFunctionRole" }],
        PolicyDocument: {
          Statement: [
            {
              Effect: "Allow",
              Action: ["execute-api:ManageConnections"],
              Resource: [
                {
                  "Fn::Sub": `arn:aws:execute-api:*`,
                },
              ],
            },
          ],
        },
        PolicyName: "ManageConnectionsPolicy",
      },
    },
    ManageDynamoDBDiagramTablesPolicy: {
      Type: "AWS::IAM::Policy",
      Properties: {
        Roles: [{ Ref: "WebsocketLambdaFunctionRole" }],
        PolicyDocument: {
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "dynamodb:BatchGetItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
              ],
              Resource: [
                { "Fn::GetAtt": ["ConnectionsDBTable", "Arn"] },
                { "Fn::GetAtt": ["DiagramsDBTable", "Arn"] },
                { "Fn::GetAtt": ["OpenDiagramsDBTable", "Arn"] },
              ],
            },
          ],
        },
        PolicyName: "ManageDynamoDBDiagramTablesPolicy",
      },
    },

    WebsocketLambdaFunctionRole: {
      Type: "AWS::IAM::Role",
      Properties: {
        Description: "Manage connections",
        RoleName: "WebsocketLambdaFunctionRole",
        ManagedPolicyArns: [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        ],
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: ["lambda.amazonaws.com"],
              },
              Action: ["sts:AssumeRole"],
            },
          ],
        },
      },
    },
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

    ConnectionsDBTable: {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          {
            AttributeName: "connectionId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "connectionId",
            KeyType: "HASH",
          },
        ],
        SSESpecification: {
          SSEEnabled: true,
        },
        TableName: {
          Ref: "ConnectionsTable",
        },
      },
    },

    DiagramsDBTable: {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          {
            AttributeName: "diagramId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "diagramId",
            KeyType: "HASH",
          },
        ],
        SSESpecification: {
          SSEEnabled: true,
        },
        TableName: {
          Ref: "DiagramsTable",
        },
      },
    },

    OpenDiagramsDBTable: {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          {
            AttributeName: "diagramId",
            AttributeType: "S",
          },
          {
            AttributeName: "connectionId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "diagramId",
            KeyType: "HASH",
          },
          {
            AttributeName: "connectionId",
            KeyType: "RANGE",
          },
        ],
        SSESpecification: {
          SSEEnabled: true,
        },
        TableName: {
          Ref: "OpenDiagramsTable",
        },
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
  },
  Outputs: {
    WebSocketApiId: {
      Value: {
        Ref: WEBSOCKET_API_NAME,
      },
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
    Role: { "Fn::GetAtt": ["WebsocketLambdaFunctionRole", "Arn"] },
    Environment: ENVIRONMENT_VARIABLES_LAMBDA,
    CodeUri: name.split("-").join("").toLowerCase(),
  };

  return data;
}

function getRESTLambdaFunction({ name, method }) {
  const data = {
    name,
    apiName: REST_API_NAME,
    route: {
      // RouteKey: `${method}/${name}`,
      RouteKey: "$default",
    },
    integration: {
      PayloadFormatVersion: "2.0",
    },
    Role: { "Fn::GetAtt": ["WebsocketLambdaFunctionRole", "Arn"] },
    Environment: ENVIRONMENT_VARIABLES_LAMBDA,
    CodeUri: name.split("-").join("").toLowerCase(),
  };

  return data;
}

const functions = [
  getRESTLambdaFunction({ name: "create-diagram", method: "POST" }),
  getWebsocketLambdaFunction({ name: "get-diagrams" }),
  getWebsocketLambdaFunction({ name: "join-diagram" }),
  getWebsocketLambdaFunction({ name: "save" }),
  getWebsocketLambdaFunction({ name: "send-change" }),
  getWebsocketLambdaFunction({ name: "disconnect", routeKey: "$disconnect" }),
  getWebsocketLambdaFunction({ name: "connect", routeKey: "$connect" }),
];

module.exports = {
  template,
  WEBSOCKET_API_NAME,
  REST_API_NAME,
  functions,
};
