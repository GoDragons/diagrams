const data = {
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
              {
                "Fn::Join": [
                  "/",
                  [
                    { "Fn::GetAtt": ["OpenDiagramsDBTable", "Arn"] },
                    "index",
                    "versions",
                  ],
                ],
              },
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
};

module.exports = data;
