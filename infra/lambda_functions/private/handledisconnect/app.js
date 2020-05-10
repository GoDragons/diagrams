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

let api;

exports.handler = async (event) => {
  console.log("event = ", event);
  const { domainName, stage, connectionId, loggedInSomewhereElse } = event;
  api = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: domainName + "/" + stage,
  });

  console.log("START Deleting user", connectionId);

  if (loggedInSomewhereElse) {
    await notifyLoggedInSomewhereElse(connectionId);
  }

  const user = await deleteUserFromDatabase(connectionId);
  console.log("FINISH deleting user", connectionId);
  if (user) {
    chooseNewMaster({ domainName, stage, user });
    sendDisconnectNotification(user);
  }
  return "ok";
};

async function notifyLoggedInSomewhereElse(connectionId) {
  console.log("notifyLoggedInSomewhereElse:", connectionId);
  try {
    await api
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          type: "loggedInSomewhereElse",
        }),
      })
      .promise();
  } catch (e) {}
}

async function deleteUserFromDatabase(connectionId) {
  // get the user data
  let user;
  try {
    const userQueryResult = await ddb
      .get({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Key: {
          connectionId,
        },
      })
      .promise();
    user = userQueryResult.Item;
  } catch (e) {
    console.log("Could not retrieve user data: ", e);
    throw e;
  }

  if (!user) {
    console.log("No connection to remove from open diagrams table");
    return;
  }
  console.log("Attempting to remove connection:", user);

  try {
    await ddb
      .delete({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Key: {
          connectionId,
        },
      })
      .promise();
    console.log("Successfully deleted connection:", user);
  } catch (e) {
    console.log("Error when deleting connection: ", e);
  }

  return user;
}

function chooseNewMaster({ domainName, stage, user }) {
  const lambda = new AWS.Lambda();

  console.log("We are about to check if we need a new master for:", user);

  if (!user.isMaster) {
    console.log("We do not a new master");
    return;
  }
  console.log("we need to choose a new master");

  var params = {
    FunctionName: "ChooseNewMaster",
    InvocationType: "Event",
    LogType: "Tail",
    Payload: JSON.stringify({
      domainName,
      stage,
      diagramId: user.diagramId,
      versionId: user.versionId,
    }),
  };

  lambda.invoke(params).promise();
}

async function sendDisconnectNotification({ authorId, diagramId, versionId }) {
  let usersOnDiagramResult;
  try {
    usersOnDiagramResult = await ddb
      .query({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        IndexName: "versions",
        KeyConditionExpression:
          "diagramId = :diagramId AND versionId = :versionId",
        ExpressionAttributeValues: {
          ":diagramId": diagramId,
          ":versionId": versionId,
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

  usersOnDiagramResult.Items.forEach(async (user) => {
    try {
      await api
        .postToConnection({
          ConnectionId: user.connectionId,
          Data: JSON.stringify({
            type: "disconnectNotification",
            user: {
              authorId: authorId,
            },
          }),
        })
        .promise();
    } catch (e) {
      console.log(`Cannot send notification to user ${user.connectionId}`);
    }
  });
}
