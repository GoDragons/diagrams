// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME, OPEN_DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  console.log("event body:", body);

  let usersOnDiagramResult;
  try {
    usersOnDiagramResult = await ddb
      .query({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        KeyConditionExpression: "diagramId = :d",
        ExpressionAttributeValues: {
          ":d": body.diagramId,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when querying the users on the open diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  let newUsersIsMaster = false;
  if (usersOnDiagramResult.Items.length === 0) {
    newUsersIsMaster = true;
    try {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: event.requestContext.connectionId,
          Data: JSON.stringify({
            type: "master",
          }),
        })
        .promise();
    } catch (e) {
      console.log("Failed to notify user they are master");
      return { statusCode: 500, body: "User dropped off" };
    }
  }

  try {
    await ddb
      .put({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Item: {
          diagramId: body.diagramId,
          connectionId: event.requestContext.connectionId,
          authorId: body.authorId,
          isMaster: newUsersIsMaster,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when adding user to open diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  let messageToSendBack;

  try {
    const diagramResult = await ddb
      .get({
        TableName: DIAGRAMS_TABLE_NAME,
        Key: {
          diagramId: body.diagramId,
        },
      })
      .promise();

    if (!diagramResult.Item) {
      throw new Error("Diagram data not found");
    }
    messageToSendBack = {
      type: "diagramData",
      diagramData: diagramResult.Item,
    };
  } catch (e) {
    console.log("Error when reading diagram: ", e);
    messageToSendBack = {
      type: "diagramDataError",
      message: "Diagram not found",
    };
  }

  try {
    console.log("Sending the message to the user");
    await apigwManagementApi
      .postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: JSON.stringify(messageToSendBack),
      })
      .promise();
  } catch (e) {
    console.log("Error when trying to post the message: ", e);
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      await ddb
        .delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } })
        .promise();
    } else {
      throw e;
    }
  }

  return { statusCode: 200, body: "Connected." };
};
