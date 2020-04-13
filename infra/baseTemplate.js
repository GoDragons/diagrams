const apiName = "Diagrams";

let template = {
  AWSTemplateFormatVersion: "2010-09-09",
  Transform: "AWS::Serverless-2016-10-31",
  Description:
    "API for an online collaboration tool used to build system design diagrams",
  Parameters: {
    TableName: {
      Type: "String",
      Default: "diagrams_connections",
      Description:
        "(Required) The name of the new DynamoDB to store connection identifiers for each connected clients. Minimum 3 characters",
      MinLength: 3,
      MaxLength: 50,
      AllowedPattern: "^[A-Za-z_]+$",
      ConstraintDescription:
        "Required. Can be characters and underscore only. No numbers or special characters allowed.",
    },
    TableNameRooms: {
      Type: "String",
      Default: "diagrams_rooms",
      Description:
        "(Required) The name of the new DynamoDB to store connection identifiers for each connected clients. Minimum 3 characters",
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

    ConnectionsTable: {
      Type: "AWS::DynamoDB::Table",
      Properties: {
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
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
        TableName: {
          Ref: "TableName",
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
    name: "create-room",
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "TableNameRooms",
          },
        },
      },
    ],
    Environment: {
      Variables: {
        ROOMS_TABLE_NAME: {
          Ref: "TableNameRooms",
        },
      },
    },
  },
  {
    name: "get-rooms",
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "TableNameRooms",
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
        ROOMS_TABLE_NAME: {
          Ref: "TableNameRooms",
        },
      },
    },
  },
  {
    name: "send-message",
    Environment: {
      Variables: {
        TABLE_NAME: {
          Ref: "TableName",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "TableName",
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
        TABLE_NAME: {
          Ref: "TableName",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "TableName",
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
        TABLE_NAME: {
          Ref: "TableName",
        },
      },
    },
    Policies: [
      {
        DynamoDBCrudPolicy: {
          TableName: {
            Ref: "TableName",
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
