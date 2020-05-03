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
  console.log("body = ", body);

  let targetVersions = [];
  const queryParams = {
    TableName: DIAGRAMS_TABLE_NAME,
    ProjectionExpression: "diagramId, versionId",
    KeyConditionExpression: "diagramId = :diagramId",
    ExpressionAttributeValues: {
      ":diagramId": body.diagramId,
    },
  };

  try {
    const queryResult = await ddb.query(queryParams).promise();
    targetVersions = queryResult.Items;
  } catch (e) {
    console.log(
      `Error when getting the versions for diagramId = ${body.diagramId}`,
      e
    );
  }

  console.log("Target versions:", targetVersions);
  for (let i = 0; i < targetVersions.length; i++) {
    const version = targetVersions[i];

    await ddb
      .delete({
        TableName: DIAGRAMS_TABLE_NAME,
        Key: version,
      })
      .promise();
  }

  return { statusCode: 200, body: "Diagram deleted." };
};
