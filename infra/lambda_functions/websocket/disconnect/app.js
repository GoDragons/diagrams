// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-route-keys-connect-disconnect.html
// The $disconnect route is executed after the connection is closed.
// The connection can be closed by the server or by the client. As the connection is already closed when it is executed,
// $disconnect is a best-effort event.
// API Gateway will try its best to deliver the $disconnect event to your integration, but it cannot guarantee delivery.

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { CONNECTIONS_TABLE_NAME, OPEN_DIAGRAMS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;

  // delete item from connections data
  try {
    await ddb
      .delete({
        TableName: CONNECTIONS_TABLE_NAME,
        Key: {
          connectionId,
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when deleting connection:", e);
  }

  // get the user data
  let userConnectionData;
  try {
    const userQueryResult = await ddb
      .get({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Key: {
          connectionId,
        },
      })
      .promise();
    userConnectionData = userQueryResult.Item;
  } catch (e) {
    console.log("Could not retrieve user data: ", e);
    throw e;
  }

  if (!userConnectionData) {
    console.log("No connection to remove from open diagrams table");
    return;
  }
  console.log("Attempting to remove connection:", userConnectionData);

  try {
    await ddb
      .delete({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Key: {
          connectionId,
        },
      })
      .promise();
    console.log("Successfully deleted connection:", userConnectionData);
  } catch (e) {
    console.log("Error when deleting connection: ", e);
  }

  console.log(
    "We are about to check if we need a new master for:",
    userConnectionData
  );

  if (userConnectionData.isMaster) {
    console.log("we need to choose a new master");
    chooseNewMaster(event, userConnectionData);
  } else {
    console.log("We do not a new master");
  }

  return { statusCode: 200, body: "Disconnected." };
};

function chooseNewMaster(event, userConnectionData) {
  const lambda = new AWS.Lambda();

  var params = {
    FunctionName: "ChooseNewMaster", // the lambda function we are going to invoke
    InvocationType: "Event",
    LogType: "Tail",
    Payload: JSON.stringify({
      domainName: event.requestContext.domainName,
      stage: event.requestContext.stage,
      diagramId: userConnectionData.diagramId,
      versionId: userConnectionData.versionId,
    }),
  };

  lambda.invoke(params).promise();

  // lambda.invoke(params, function (err, data) {
  //   if (err) {
  //     context.fail(err);
  //   } else {
  //     context.succeed("Lambda_B said " + data.Payload);
  //   }
  // });
}
