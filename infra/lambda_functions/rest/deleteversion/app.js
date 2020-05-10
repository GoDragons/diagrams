// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body = ", body);
  const deleteParams = {
    TableName: process.env.DIAGRAMS_TABLE_NAME,
    Key: body,
  };

  try {
    await ddb.delete(deleteParams).promise();
  } catch (err) {
    console.log("error:", err);
    return {
      statusCode: 500,
      body: "Failed to delete diagram: " + JSON.stringify(err),
    };
  }

  return { statusCode: 200, body: "Diagram deleted." };
};
