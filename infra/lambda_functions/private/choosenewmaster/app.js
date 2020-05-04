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

const { OPEN_DIAGRAMS_TABLE_NAME } = process.env;

const MAX_TRY_COUNT = 100;

exports.handler = async (event) => {
  const api = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: event.domainName + "/" + event.stage,
  });

  await chooseMaster(event, api);
};

async function chooseMaster(event, api, tryCount = 0) {
  let usersOnDiagramResult;
  try {
    usersOnDiagramResult = await ddb
      .query({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        IndexName: "versions",
        KeyConditionExpression:
          "diagramId = :diagramId AND versionId = :versionId",
        ExpressionAttributeValues: {
          ":diagramId": event.diagramId,
          ":versionId": event.versionId,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when querying the users on the open diagram: ", e);
    return;
  }

  console.log("Users on diagram:", usersOnDiagramResult.Items.length);

  if (usersOnDiagramResult.Items.length === 0) {
    return;
  }

  const newMasterIndex = Math.floor(
    Math.random() * usersOnDiagramResult.Items.length
  );
  const newMasterUserData = usersOnDiagramResult.Items[newMasterIndex];
  try {
    await api
      .postToConnection({
        ConnectionId: newMasterUserData.connectionId,
        Data: JSON.stringify({
          type: "master",
        }),
      })
      .promise();
    console.log("New master notified successfully");
  } catch (e) {
    console.log("Failed to notify user they are master");
    try {
      await ddb
        .delete({
          TableName: OPEN_DIAGRAMS_TABLE_NAME,
          Key: {
            connectionId: newMasterUserData.connectionId,
          },
        })
        .promise();
      console.log("Successfully deleted connection:", newMasterUserData);
    } catch (e) {
      console.log("Error when deleting connection: ", e);
    }
    if (tryCount < MAX_TRY_COUNT) {
      console.log("Trying again");
      await chooseMaster(event, api, tryCount + 1);
    }
    return;
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
    console.log("New master added successfully to the database");
  } catch (e) {
    console.log("Error when adding user to open diagram: ", e);
    // return { statusCode: 500, body: e.stack };
  }
}
