// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-route-keys-connect-disconnect.html
// The $disconnect route is executed after the connection is closed.
// The connection can be closed by the server or by the client. As the connection is already closed when it is executed,
// $disconnect is a best-effort event.
// API Gateway will try its best to deliver the $disconnect event to your integration, but it cannot guarantee delivery.

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { CONNECTIONS_TABLE_NAME, OPEN_DIAGRAMS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  const deleteParamsConnection = {
    TableName: CONNECTIONS_TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId,
    },
  };

  try {
    await ddb.delete(deleteParamsConnection).promise();
  } catch (e) {
    console.log("Error when deleting connection:", e);
    return {
      statusCode: 500,
      body: "Failed to disconnect: " + JSON.stringify(e),
    };
  }
  const openDiagramsScanParams = {
    TableName: OPEN_DIAGRAMS_TABLE_NAME,
    ProjectionExpression: "connectionId, diagramId",
    FilterExpression: "connectionId = :target",

    ExpressionAttributeValues: {
      ":target": event.requestContext.connectionId,
    },
  };

  console.log("openDiagramsScanParams:", openDiagramsScanParams);

  try {
    const connectionsToRemove = await ddb
      .scan(openDiagramsScanParams)
      .promise();
    console.log("connectionsToRemove: ", connectionsToRemove);

    const connectionToRemove = connectionsToRemove.Items[0];
    if (!connectionToRemove) {
      console.log("No connection to remove from open diagrams table");
    } else {
      console.log("Attempting to remove connection:", connectionToRemove);
      const deleteParamsOpenDiagramConnection = {
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Key: {
          connectionId: connectionToRemove.connectionId,
          diagramId: connectionToRemove.diagramId,
        },
      };
      try {
        console.log(
          "deleteParamsConnection:",
          deleteParamsOpenDiagramConnection
        );
        await ddb.delete(deleteParamsOpenDiagramConnection).promise();
        console.log("Successfully deleted connection:", connectionToRemove);
      } catch (e) {
        console.log("Error when deleting connection: ", e);
      }
    }
  } catch (e) {
    console.log("Error when deleting connection: ", e);
    return {
      statusCode: 500,
      body: "Failed to disconnect: " + JSON.stringify(e),
    };
  }

  return { statusCode: 200, body: "Disconnected." };
};
