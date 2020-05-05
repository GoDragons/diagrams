const AWS = require("aws-sdk");

const lambda = new AWS.Lambda();

exports.handler = async (event) => {
  console.log("event = ", event);
  console.log("A1");
  const body = JSON.parse(event.body);
  const mainResult = await waitForStuff(body);
  console.log("A2");
  return "ok";
};

async function waitForStuff(body) {
  console.log("B1");
  const result = await new Promise((resolve) => {
    console.log("B2");
    setTimeout(async () => {
      console.log("B3");
      console.log("middle");
      callLambda(body).then(resolve);
    }, 500);
  });
  console.log("B4");
  return result;
}

async function callLambda(body) {
  console.log("C1");
  var params = {
    FunctionName: "HandleDisconnect",
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: JSON.stringify({
      connectionId: body.connectionId,
      domainName: "j0cxryh737.execute-api.eu-west-2.amazonaws.com",
      stage: "Prod",
      myId: Math.floor(Math.random() * 10000),
    }),
  };
  const response = await lambda.invoke(params);
  console.log("C2");
  return response;
}
