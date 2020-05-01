// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const newDiagramId = `${JSON.parse(event.body).diagramId}-${Date.now()}`;
  const putParams = {
    TableName: process.env.DIAGRAMS_TABLE_NAME,
    Item: {
      diagramId: newDiagramId,
      lastModified: Date.now(),
      revisionName: "Initial Version",
      components: [],
      connections: [],
      groups: [],
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

  return { diagramId: newDiagramId };
};
