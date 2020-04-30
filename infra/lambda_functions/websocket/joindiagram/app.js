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

  try {
    await ddb
      .put({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Item: {
          diagramId: body.diagramId,
          connectionId: event.requestContext.connectionId,
          authorId: body.authorId,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when adding user to open diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  let diagramData;

  try {
    const diagramResult = await ddb
      .get({
        TableName: DIAGRAMS_TABLE_NAME,
        Key: {
          diagramId: body.diagramId,
        },
      })
      .promise();
    diagramData = diagramResult.Item;
  } catch (e) {
    console.log("Error when reading diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: JSON.stringify({
          type: "diagramData",
          diagramData,
        }),
      })
      .promise();
  } catch (e) {
    console.log("Error when trying to post the diagram list: ", e);
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
