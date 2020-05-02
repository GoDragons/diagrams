// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const oldDiagramId = body.diagramData.diagramId;
  const oldVersionId = oldDiagramId.split("-")[1];
  const oldRootId = oldDiagramId.split("-")[0];
  const newVersionId = Date.now();
  const newDiagramId = `${oldRootId}-${newVersionId}`;

  const lastVersionScanParams = {
    TableName: DIAGRAMS_TABLE_NAME,
    FilterExpression: "diagramId = :diagramId",

    ExpressionAttributeValues: {
      ":diagramId": oldDiagramId,
    },
  };
  console.log("lastVersionScanParams:", lastVersionScanParams);
  let oldDiagramData;
  try {
    let result = await ddb.scan(lastVersionScanParams).promise();
    console.log("last version scan result: ", result);
    if (result.Items.length === 0) {
      throw new Error("Couldn't find the previous version of the diagram");
    }
    oldDiagramData = result.Items[0];
  } catch (e) {
    console.log("Error when changing the previous version: ", e);
  }

  try {
    await ddb
      .put({
        TableName: DIAGRAMS_TABLE_NAME,
        Item: {
          ...oldDiagramData,
          latestVersionId: newVersionId,
          versionName: body.versionName,
          lastModified: Date.now(),
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when saving diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  try {
    await ddb
      .put({
        TableName: DIAGRAMS_TABLE_NAME,
        Item: {
          ...body.diagramData,
          diagramId: newDiagramId,
          versionId: newVersionId,
          previousVersionId: oldVersionId,
          latestVersionId: newVersionId,
          versionName: "Current Version",
          lastModified: Date.now(),
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when saving diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return {
    diagramId: newDiagramId,
  };
};
