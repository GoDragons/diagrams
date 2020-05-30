const data = {
  DiagramsDBTable: {
    Type: "AWS::DynamoDB::Table",

    Properties: {
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        {
          AttributeName: "diagramId",
          AttributeType: "S",
        },
        {
          AttributeName: "versionId",
          AttributeType: "S",
        },
        {
          AttributeName: "authorId",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "diagramId",
          KeyType: "HASH",
        },
        {
          AttributeName: "versionId",
          KeyType: "RANGE",
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "authors",
          Projection: {
            ProjectionType: "ALL",
          },
          KeySchema: [
            {
              AttributeName: "authorId",
              KeyType: "HASH",
            },
          ],
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
          AttributeName: "versionId",
          AttributeType: "S",
        },
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
      GlobalSecondaryIndexes: [
        {
          IndexName: "versions",
          Projection: {
            ProjectionType: "ALL",
          },
          KeySchema: [
            {
              AttributeName: "diagramId",
              KeyType: "HASH",
            },
            {
              AttributeName: "versionId",
              KeyType: "RANGE",
            },
          ],
        },
      ],

      SSESpecification: {
        SSEEnabled: true,
      },
      StreamSpecification: {
        StreamViewType: "NEW_AND_OLD_IMAGES",
      },
      TableName: {
        Ref: "OpenDiagramsTable",
      },
    },
  },

  DiagramMastersDBTable: {
    Type: "AWS::DynamoDB::Table",
    Properties: {
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        {
          AttributeName: "diagramId",
          AttributeType: "S",
        },
        {
          AttributeName: "versionId",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "diagramId",
          KeyType: "HASH",
        },
        {
          AttributeName: "versionId",
          KeyType: "RANGE",
        },
      ],

      SSESpecification: {
        SSEEnabled: true,
      },
      StreamSpecification: {
        StreamViewType: "NEW_AND_OLD_IMAGES",
      },
      TableName: {
        Ref: "DiagramMastersTable",
      },
    },
  },

  StreamOpenDiagramsTrigger: {
    Type: "AWS::Lambda::EventSourceMapping",
    Properties: {
      EventSourceArn: { "Fn::GetAtt": ["OpenDiagramsDBTable", "StreamArn"] },
      FunctionName: {
        "Fn::GetAtt": ["StreamOpenDiagramsFunction", "Arn"],
      },
      MaximumBatchingWindowInSeconds: 0,
      ParallelizationFactor: 1,
      StartingPosition: "LATEST",
    },
  },

  StreamMastersTrigger: {
    Type: "AWS::Lambda::EventSourceMapping",
    Properties: {
      EventSourceArn: { "Fn::GetAtt": ["DiagramMastersDBTable", "StreamArn"] },
      FunctionName: {
        "Fn::GetAtt": ["StreamMastersFunction", "Arn"],
      },
      MaximumBatchingWindowInSeconds: 0,
      ParallelizationFactor: 1,
      StartingPosition: "LATEST",
    },
  },
};

module.exports = data;
