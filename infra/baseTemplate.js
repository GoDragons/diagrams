const apiName = "Diagrams";

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
    [apiName]: {
      Type: "AWS::ApiGatewayV2::Api",
      Properties: {
        Name: apiName,
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
          Ref: apiName,
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
          Ref: apiName,
        },
      },
    },
  },
};

const functions = [
  {
    name: "create-diagram",
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
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "DiagramsTable",
          },
        },
      },
      {
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
      {
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
      {
        Statement: [
          {
            Effect: "Allow",
            Action: ["execute-api:ManageConnections"],
            Resource: [
              {
                "Fn::Sub": `arn:aws:execute-api:\${AWS::Region}:\${AWS::AccountId}:\${${apiName}}/*`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "send-change",
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
      {
        Statement: [
          {
            Effect: "Allow",
            Action: ["execute-api:ManageConnections"],
            Resource: [
              {
                "Fn::Sub": `arn:aws:execute-api:\${AWS::Region}:\${AWS::AccountId}:\${${apiName}}/*`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "disconnect",
    routeKey: "$disconnect",
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
    name: "connect",
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
  apiName,
  functions,
};
