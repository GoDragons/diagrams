const data = {
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
      TableName: {
        Ref: "OpenDiagramsTable",
      },
    },
  },
};

module.exports = data;
