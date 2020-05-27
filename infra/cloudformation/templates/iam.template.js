const data = {
  ManageConnectionsPolicy: {
    Type: "AWS::IAM::Policy",
    Properties: {
      Roles: [{ Ref: "WebsocketLambdaFunctionRole" }],
      PolicyDocument: {
        Statement: [
          {
            Effect: "Allow",
            Action: ["execute-api:*"],
            Resource: "*",
          },
        ],
      },
      PolicyName: "ManageConnectionsPolicy",
    },
  },

  ManageDynamoDBPolicy: {
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
              "dynamodb:DescribeStream",
              "dynamodb:GetRecords",
              "dynamodb:GetShardIterator",
              "dynamodb:ListStreams",
            ],
            Resource: "*",
          },
        ],
      },
      PolicyName: "ManageDynamoDBPolicy",
    },
  },
  CallLambdaPolicy: {
    Type: "AWS::IAM::Policy",
    Properties: {
      Roles: [{ Ref: "WebsocketLambdaFunctionRole" }],
      PolicyDocument: {
        Statement: [
          {
            Effect: "Allow",
            Action: ["lambda:InvokeFunction"],
            Resource: ["*"],
          },
        ],
      },
      PolicyName: "CallLambdaPolicy",
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
