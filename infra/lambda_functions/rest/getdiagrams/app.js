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
        ProjectionExpression: "diagramId, lastModified, revisionName",
      })
      .promise();
    diagrams = diagramsResult.Items;
  } catch (e) {
    console.log("Error when reading diagrams: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return diagrams;
};
