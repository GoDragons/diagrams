// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  let diagrams;

  try {
    const diagramsResult = await ddb
      .scan({
        TableName: DIAGRAMS_TABLE_NAME,
        ProjectionExpression: "diagramId",
      })
      .promise();
    diagrams = diagramsResult.Items.map(({ diagramId }) => diagramId);
  } catch (e) {
    console.log("Error when reading iagrams: ", e);
    return { statusCode: 500, body: e.stack };
  }

  const postData = {
    diagrams,
  };

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: JSON.stringify(postData),
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
