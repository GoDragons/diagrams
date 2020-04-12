// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// const AWS = require("aws-sdk");

// const ddb = new AWS.DynamoDB.DocumentClient({
//   apiVersion: "2012-08-10",
//   region: process.env.AWS_REGION,
// });

exports.handler = async (event) => {
  // const putParams = {
  //   TableName: process.env.ROOMS_TABLE_NAME,
  //   Item: {
  //     roomId: event.data,
  //   },
  // };
  console.log("createroom function called, event:", event);
  // try {
  //   await ddb.put(putParams).promise();
  // } catch (err) {
  //   return {
  //     statusCode: 500,
  //     body: "Failed to create room: " + JSON.stringify(err),
  //   };
  // }

  return { statusCode: 200, body: "Room created." };
};
