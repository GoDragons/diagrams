// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME, OPEN_DIAGRAMS_TABLE_NAME } = process.env;

const lambda = new AWS.Lambda();

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

let api;
exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const { domainName, stage, connectionId } = event.requestContext;

  api = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: domainName + "/" + stage,
  });

  console.log("event body:", body);

  // see how many users are already on that diagram
  let usersOnDiagramResult;
  try {
    usersOnDiagramResult = await getUsersOnDiagram(body);
  } catch (e) {
    console.log("Error when querying the users on the open diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  // if the new user is the only one on the diagram, notify them that they are master
  let newUserIsMaster = usersOnDiagramResult.Items.length === 0;
  if (newUserIsMaster) {
    try {
      await notifyUserTheyAreMaster(connectionId);
    } catch (e) {
      console.log("Failed to notify user they are master");
      return { statusCode: 500, body: "User dropped off" };
    }
  }

  // retrieve the diagram data from the database
  let messageToSendBack = await getMessageToSendBack(
    body,
    usersOnDiagramResult,
    connectionId
  );

  // if retrieval was successful, send user the diagram data
  // otherwise, notify them of the error
  try {
    console.log("Sending the message to the user");
    await api
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(messageToSendBack),
      })
      .promise();
    userCanBeReached = true;
  } catch (e) {
    console.log("Error when trying to post the message: ", e);
    return { statusCode: 500, body: "User dropped off" };
  }

  // add user to the list of users on the diagram
  if (userCanBeReached) {
    try {
      await addUserToOpenDiagram(body, connectionId, newUserIsMaster);
      console.log("before sendJoinNotification()");
      await sendJoinNotification({
        authorId: body.authorId,
        connectionId,
        users: usersOnDiagramResult.Items,
        domainName,
        stage,
      });
      console.log("after sendJoinNotification()");
    } catch (e) {
      console.log("Error when adding user to open diagram: ", e);
      return { statusCode: 500, body: e.stack };
    }
  }
  console.log("The end.");
  return { statusCode: 200, body: "Connected." };
};

async function addUserToOpenDiagram(body, connectionId, isMaster) {
  await ddb
    .put({
      TableName: OPEN_DIAGRAMS_TABLE_NAME,
      Item: {
        diagramId: body.diagramId,
        versionId: String(body.versionId),
        connectionId,
        authorId: body.authorId,
        isMaster,
      },
    })
    .promise();
}

async function getMessageToSendBack(body, usersOnDiagramResult, connectionId) {
  try {
    const diagramResult = await ddb
      .get({
        TableName: DIAGRAMS_TABLE_NAME,
        Key: {
          diagramId: body.diagramId,
          versionId: String(body.versionId),
        },
      })
      .promise();

    if (!diagramResult.Item) {
      throw new Error("Diagram data not found");
    }
    messageToSendBack = {
      type: "diagramData",
      diagramData: diagramResult.Item,
      participants: [
        ...usersOnDiagramResult.Items,
        { connectionId, authorId: body.authorId },
      ],
    };
  } catch (e) {
    console.log("Error when reading diagram: ", e);
    messageToSendBack = {
      type: "diagramDataError",
      message: "Diagram not found",
    };
  }
  return messageToSendBack;
}

async function notifyUserTheyAreMaster(connectionId) {
  return api
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        type: "master",
      }),
    })
    .promise();
}

async function getUsersOnDiagram(body) {
  return ddb
    .query({
      TableName: OPEN_DIAGRAMS_TABLE_NAME,
      IndexName: "versions",
      KeyConditionExpression:
        "diagramId = :diagramId AND versionId = :versionId",
      ExpressionAttributeValues: {
        ":diagramId": body.diagramId,
        ":versionId": body.versionId,
      },
    })
    .promise();
}

async function sendJoinNotification({ authorId, users, domainName, stage }) {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log("Sending notification to:", user);
    if (user.authorId === authorId) {
      console.log("There is already a user with authorId", authorId);
      console.log("Calling disconnect function");
      await disconnectAndNotifyUser({
        connectionId: user.connectionId,
        domainName,
        stage,
      });
      console.log("Called disconnect function");
    } else {
      try {
        console.log("Notifying user", user.connectionId);
        await api
          .postToConnection({
            ConnectionId: user.connectionId,
            Data: JSON.stringify({
              type: "joinNotification",
              user: {
                authorId,
              },
            }),
          })
          .promise();
        console.log("User notified");
      } catch (e) {
        if (e.statusCode === 410) {
          console.log("User is gone");
        } else {
          console.log("Error when posting to user: ", e);
        }
      }
    }
  }

  return;
}

async function disconnectAndNotifyUser({ connectionId, domainName, stage }) {
  console.log("START disconnectAndNotifyUser() ");
  const payload = {
    connectionId,
    domainName,
    stage,
    loggedInSomewhereElse: true,
    myId: Math.floor(Math.random() * 10000),
  };

  var params = {
    FunctionName: "HandleDisconnect",
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: JSON.stringify(payload),
  };

  console.log("MIDDLE disconnectAndNotifyUser() ");
  await lambda.invoke(params).promise();
}
