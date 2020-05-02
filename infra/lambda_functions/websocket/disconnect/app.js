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
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  // delete item from connections data
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
  }

  // get the user data
  const openDiagramsScanParams = {
    TableName: OPEN_DIAGRAMS_TABLE_NAME,
    ProjectionExpression: "connectionId, diagramId, isMaster",
    FilterExpression: "connectionId = :target",

    ExpressionAttributeValues: {
      ":target": event.requestContext.connectionId,
    },
  };

  let connectionsToRemove;
  try {
    connectionsToRemove = await ddb.scan(openDiagramsScanParams).promise();
    console.log("connectionsToRemove: ", connectionsToRemove);
  } catch (e) {
    console.log("Error when deleting connection: ", e);
    // return {
    //   statusCode: 500,
    //   body: "Failed to disconnect: " + JSON.stringify(e),
    // };
  }

  const connectionToRemove = connectionsToRemove.Items[0];
  if (!connectionToRemove) {
    console.log("No connection to remove from open diagrams table");
    // return {
    //   statusCode: 200,
    //   body: "Disconnected",
    // };
  }
  console.log("Attempting to remove connection:", connectionToRemove);

  const deleteParamsOpenDiagramConnection = {
    TableName: OPEN_DIAGRAMS_TABLE_NAME,
    Key: {
      connectionId: connectionToRemove.connectionId,
      diagramId: connectionToRemove.diagramId,
    },
  };
  try {
    console.log("deleteParamsConnection:", deleteParamsOpenDiagramConnection);
    await ddb.delete(deleteParamsOpenDiagramConnection).promise();
    console.log("Successfully deleted connection:", connectionToRemove);
  } catch (e) {
    console.log("Error when deleting connection: ", e);
  }

  console.log(
    "We are about to check if we need a new master for:",
    connectionToRemove
  );

  if (connectionToRemove.isMaster) {
    console.log("we need to choose a new master");
    await chooseMaster(ddb, connectionToRemove.diagramId, apigwManagementApi);
  } else {
    console.log("We do not a new master");
  }

  // return { statusCode: 200, body: "Disconnected." };
};

async function chooseMaster(ddb, diagramId, apigwManagementApi) {
  /* 
  TODO: if the newly-chosen master can't be reached, 
   it needs to be deleted and this function should retry
  */
  let usersOnDiagramResult;
  try {
    usersOnDiagramResult = await ddb
      .query({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        KeyConditionExpression: "diagramId = :d",
        ExpressionAttributeValues: {
          ":d": diagramId,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when querying the users on the open diagram: ", e);
    // return { statusCode: 500, body: e.stack };
  }

  if (usersOnDiagramResult.Items.length === 0) {
    return;
  }

  const newMasterIndex = Math.floor(
    Math.random() * usersOnDiagramResult.Items.length
  );
  const newMasterUserData = usersOnDiagramResult.Items[newMasterIndex];
  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: newMasterUserData.connectionId,
        Data: JSON.stringify({
          type: "master",
        }),
      })
      .promise();
  } catch (e) {
    console.log("Failed to notify user they are master");
    // return { statusCode: 500, body: "User dropped off" };
  }

  try {
    await ddb
      .put({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Item: {
          ...newMasterUserData,
          isMaster: true,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when adding user to open diagram: ", e);
    // return { statusCode: 500, body: e.stack };
  }
}
