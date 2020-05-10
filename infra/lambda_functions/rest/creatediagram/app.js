// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { DIAGRAMS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body: ", body);
  const newDiagramName = body.diagramName;

  try {
    const existingDiagramResult = await ddb
      .scan({
        TableName: DIAGRAMS_TABLE_NAME,
        ProjectionExpression: "diagramId",
        FilterExpression: "diagramName = :diagramName",
        ExpressionAttributeValues: {
          ":diagramName": newDiagramName,
        },
      })
      .promise();
    if (existingDiagramResult.Items.length > 0) {
      return {
        statusCode: 400,
        body: "Diagram name is already in use. Choose another one",
      };
    }
  } catch (e) {
    console.log("Failed to check for existing diagrams:", e);
  }

  const newDiagramId = newDiagramName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/gi, "");
  const newVersionId = Date.now();

  const putParams = {
    TableName: process.env.DIAGRAMS_TABLE_NAME,
    Item: {
      diagramId: newDiagramId,
      lastModified: Date.now(),
      diagramName: newDiagramName,
      versionName: "Current Version",
      isLatest: true,
      versionId: String(newVersionId),
      previousVersionId: undefined,
      components: [],
      connections: [],
      groups: [],
      messages: [],
    },
  };

  try {
    await ddb.put(putParams).promise();
  } catch (err) {
    console.log("error:", err);
    return {
      statusCode: 500,
      body: "Failed to create diagram: " + JSON.stringify(err),
    };
  }

  return { diagramId: newDiagramId, versionId: String(newVersionId) };
};
