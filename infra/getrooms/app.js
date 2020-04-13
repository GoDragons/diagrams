// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const { ROOMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  let rooms;

  try {
    const roomsResult = await ddb
      .scan({ TableName: ROOMS_TABLE_NAME, ProjectionExpression: "roomId" })
      .promise();
    rooms = roomsResult.Items.map(({ roomId }) => roomId);
  } catch (e) {
    console.log("Error when reading rooms: ", e);
    return { statusCode: 500, body: e.stack };
  }

  const postData = {
    rooms,
  };

  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: postData,
      })
      .promise();
  } catch (e) {
    console.log("Error when trying to post the room list: ", e);
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      await ddb
        .delete({ TableName: TABLE_NAME, Key: { connectionId } })
        .promise();
    } else {
      throw e;
    }
  }

  return { statusCode: 200, body: "Connected." };
};
