// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { OPEN_DIAGRAMS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  console.log("Called");
  const body = JSON.parse(event.body);
  let usersOnDiagramResult;
  console.log("event:", event);

  const diagramId = body.diagramId;

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
    console.log("Error when trying to get users for open diagram:", e);
    return { statusCode: 500, body: e.stack };
  }

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  const postData = {
    type: "change",
    change: body.change,
  };

  const postCalls = usersOnDiagramResult.Items.map(async ({ connectionId }) => {
    try {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(postData),
        })
        .promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        try {
          await ddb
            .delete({
              TableName: OPEN_DIAGRAMS_TABLE_NAME,
              Key: { diagramId, connectionId },
            })
            .promise();
        } catch (e) {
          console.log("Error while trying to delete connection:", e);
        }
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
