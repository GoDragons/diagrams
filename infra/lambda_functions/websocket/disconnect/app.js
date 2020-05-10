// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-route-keys-connect-disconnect.html
// The $disconnect route is executed after the connection is closed.
// The connection can be closed by the server or by the client. As the connection is already closed when it is executed,
// $disconnect is a best-effort event.
// API Gateway will try its best to deliver the $disconnect event to your integration, but it cannot guarantee delivery.

const AWS = require("aws-sdk");

const lambda = new AWS.Lambda();

exports.handler = async (event) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const payload = {
    connectionId,
    domainName,
    stage,
    myId: Math.floor(Math.random() * 10000),
  };

  var params = {
    FunctionName: "HandleDisconnect",
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: JSON.stringify(payload),
  };

  await lambda.invoke(params).promise();

  return { statusCode: 200, body: "Disconnected." };
};
