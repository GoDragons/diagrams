// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { OPEN_DIAGRAMS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  let usersOnDiagramResult;

  const diagramId = body.diagramId;
  const versionId = body.versionId;

  try {
    usersOnDiagramResult = await ddb
      .query({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        KeyConditionExpression:
          "diagramId = :diagramId AND versionId = :versionId",
        ExpressionAttributeValues: {
          ":diagramId": diagramId,
          ":versionId": versionId,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when trying to get users for open diagram:", e);
    return { statusCode: 500, body: e.stack };
  }

  const api = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  const postData = {
    type: "change",
    change: body.change,
  };

  const postCalls = usersOnDiagramResult.Items.filter(
    // we do not want to propagate changes back to their author
    (user) => user.authorId !== body.change.authorId
  ).map(async ({ connectionId }) => {
    try {
      await api
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(postData),
        })
        .promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        handleDisconnect({ connectionId, event });
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: "Data sent." };
};

function handleDisconnect({ connectionId, event }) {
  const { domainName, stage } = event.requestContext;

  var params = {
    FunctionName: "HandleDisconnect",
    InvocationType: "Event",
    LogType: "Tail",
    Payload: JSON.stringify({
      connectionId,
      domainName,
      stage,
    }),
  };

  lambda.invoke(params).promise();
}
