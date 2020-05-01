// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const putParams = {
    TableName: process.env.DIAGRAMS_TABLE_NAME,
    Item: {
      diagramId: `${JSON.parse(event.body).diagramId}-${Date.now()}`,
      lastModified: Date.now(),
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

  return { statusCode: 200, body: "Diagram created." };
};
