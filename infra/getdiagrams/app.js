// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  console.log("This is the new version being called");
  let diagrams;

  try {
    console.log("before db query");
    const diagramsResult = await ddb
      .scan({
        TableName: DIAGRAMS_TABLE_NAME,
        ProjectionExpression: "diagramId",
      })
      .promise();
    diagrams = diagramsResult.Items.map(({ diagramId }) => diagramId);
    console.log("after db query");
  } catch (e) {
    console.log("Error when reading diagrams: ", e);
    return { statusCode: 500, body: e.stack };
  }

  console.log("these are the diagrams:", diagrams);
  return { statusCode: 200, body: diagrams };
};
