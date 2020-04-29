const WEBSOCKET_API_NAME = "Diagrams";
const REST_API_NAME = "Diagrams-REST";

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
        Roles: [{ Ref: "ManageConnectionsRole" }],
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
    ManageConnectionsRole: {
      Type: "AWS::IAM::Role",
      Properties: {
        Description: "Manage connections",
        RoleName: "ManageConnectionsRole",
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
};

const functions = [
  {
    name: "create-diagram",
    apiName: WEBSOCKET_API_NAME,
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "DiagramsTable",
          },
        },
      },
    ],
    Environment: {
      Variables: {
        DIAGRAMS_TABLE_NAME: {
          Ref: "DiagramsTable",
        },
      },
    },
  },
  {
    name: "get-diagrams",
    apiName: WEBSOCKET_API_NAME,
    Role: {
      Ref: "ManageConnectionsRole",
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "DiagramsTable",
          },
        },
      },
    ],
    Environment: {
      Variables: {
        DIAGRAMS_TABLE_NAME: {
          Ref: "DiagramsTable",
        },
      },
    },
  },
  {
    name: "join-diagram",
    apiName: WEBSOCKET_API_NAME,
    Role: {
      Ref: "ManageConnectionsRole",
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "DiagramsTable",
          },
        },
      },
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "OpenDiagramsTable",
          },
        },
      },
    ],
    Environment: {
      Variables: {
        OPEN_DIAGRAMS_TABLE_NAME: {
          Ref: "OpenDiagramsTable",
        },
        DIAGRAMS_TABLE_NAME: {
          Ref: "DiagramsTable",
        },
      },
    },
  },
  {
    name: "save",
    apiName: WEBSOCKET_API_NAME,
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "DiagramsTable",
          },
        },
      },
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "OpenDiagramsTable",
          },
        },
      },
    ],
    Environment: {
      Variables: {
        DIAGRAMS_TABLE_NAME: {
          Ref: "DiagramsTable",
        },
      },
    },
  },
  {
    name: "send-message",
    apiName: WEBSOCKET_API_NAME,
    Role: {
      Ref: "ManageConnectionsRole",
    },
    Environment: {
      Variables: {
        CONNECTIONS_TABLE_NAME: {
          Ref: "ConnectionsTable",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "ConnectionsTable",
          },
        },
      },
    ],
  },
  {
    name: "send-change",
    apiName: WEBSOCKET_API_NAME,
    Role: {
      Ref: "ManageConnectionsRole",
    },
    Environment: {
      Variables: {
        OPEN_DIAGRAMS_TABLE_NAME: {
          Ref: "OpenDiagramsTable",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "OpenDiagramsTable",
          },
        },
      },
    ],
  },
  {
    name: "disconnect",
    apiName: WEBSOCKET_API_NAME,
    routeKey: "$disconnect",
    Environment: {
      Variables: {
        CONNECTIONS_TABLE_NAME: {
          Ref: "ConnectionsTable",
        },
        OPEN_DIAGRAMS_TABLE_NAME: {
          Ref: "OpenDiagramsTable",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "ConnectionsTable",
          },
        },
      },
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "OpenDiagramsTable",
          },
        },
      },
    ],
  },
  {
    name: "connect",
    apiName: WEBSOCKET_API_NAME,
    routeKey: "$connect",
    Environment: {
      Variables: {
        CONNECTIONS_TABLE_NAME: {
          Ref: "ConnectionsTable",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "ConnectionsTable",
          },
        },
      },
    ],
  },
];

module.exports = {
  template,
  WEBSOCKET_API_NAME,
  REST_API_NAME,
  functions,
};
