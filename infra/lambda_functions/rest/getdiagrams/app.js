// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  let diagrams = [];

  try {
    const diagramsResult = await ddb
      .scan({
        TableName: DIAGRAMS_TABLE_NAME,
        ProjectionExpression:
          "diagramId, diagramName, rootId, lastModified, versionName, versionId, latestVersionId",
      })
      .promise();
    const diagramItems = diagramsResult.Items;
    const masterDiagramsRootIds = new Set();
    diagramItems.forEach((diagramItem) => {
      masterDiagramsRootIds.add(diagramItem.rootId);
    });

    masterDiagramsRootIds.forEach((rootId) => {
      const versions = diagramItems
        .filter((item) => item.rootId === rootId)
        .sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1));
      const diagramData = {
        rootId,
        versions,
        diagramName: versions[0].diagramName,
        diagramId: versions[versions.length - 1].diagramId,
      };
      diagrams.push(diagramData);
    });
  } catch (e) {
    console.log("Error when reading diagrams: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return diagrams;
};
