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
        ProjectionExpression: "diagramId, lastModified, revisionName",
      })
      .promise();
    const diagramItems = diagramsResult.Items;
    const masterDiagramsRootIDs = new Set();
    diagramItems.forEach((diagramItem) => {
      const rootID = diagramItem.diagramId.split("-")[0];
      masterDiagramsRootIDs.add(rootID);
    });

    masterDiagramsRootIDs.forEach((rootId) => {
      const diagramData = {
        rootId,
        revisions: diagramItems
          .filter((item) => item.diagramId.includes(rootId))
          .map((item) => {
            console.log("item = ", item);
            const { diagramId, ...restOfDetails } = item;
            return {
              ...restOfDetails,
              revisionId: diagramId.split("-")[1],
            };
          })
          .sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1)),
      };
      diagrams.push(diagramData);
    });
  } catch (e) {
    console.log("Error when reading diagrams: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return diagrams;
};
