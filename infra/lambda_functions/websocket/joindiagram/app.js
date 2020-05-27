const AWS = require("aws-sdk");

const {
  DIAGRAMS_TABLE_NAME,
  OPEN_DIAGRAMS_TABLE_NAME,
  WEBSOCKET_API_ENDPOINT,
} = process.env;

const api = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: WEBSOCKET_API_ENDPOINT,
});

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

// const lambda = new AWS.Lambda();

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const { connectionId } = event.requestContext;

  // see how many users are already on that diagram
  let usersOnDiagramResult;
  try {
    usersOnDiagramResult = await getUsersOnDiagram(body);
  } catch (e) {
    console.log("Error when querying the users on the open diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  // retrieve the diagram data from the database
  let messageToSendBack = await getMessageToSendBack(
    body,
    usersOnDiagramResult,
    connectionId
  );

  // if retrieval was successful, send user the diagram data
  // otherwise, notify them of the error
  try {
    console.log("Sending the message to the user");
    await api
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(messageToSendBack),
      })
      .promise();
    userCanBeReached = true;
  } catch (e) {
    console.log("Error when trying to post the message: ", e);
    return { statusCode: 500, body: "User dropped off" };
  }

  // add user to the list of users on the diagram
  if (userCanBeReached) {
    try {
      await addUserToOpenDiagram(body, connectionId);
    } catch (e) {
      console.log("Error when adding user to open diagram: ", e);
      return { statusCode: 500, body: e.stack };
    }
  }
  return { statusCode: 200, body: "Connected." };
};

async function addUserToOpenDiagram(body, connectionId) {
  await ddb
    .put({
      TableName: OPEN_DIAGRAMS_TABLE_NAME,
      Item: {
        diagramId: body.diagramId,
        versionId: String(body.versionId),
        connectionId,
        authorId: body.authorId,
      },
    })
    .promise();
}

async function getMessageToSendBack(body, usersOnDiagramResult, connectionId) {
  try {
    const diagramResult = await ddb
      .get({
        TableName: DIAGRAMS_TABLE_NAME,
        Key: {
          diagramId: body.diagramId,
          versionId: String(body.versionId),
        },
      })
      .promise();

    if (!diagramResult.Item) {
      throw new Error("Diagram data not found");
    }
    messageToSendBack = {
      type: "diagramData",
      diagramData: diagramResult.Item,
      participants: usersOnDiagramResult.Items.filter(
        (user) => user.authorId !== body.authorId
      ),
    };
  } catch (e) {
    console.log("Error when reading diagram: ", e);
    messageToSendBack = {
      type: "diagramDataError",
      message: "Diagram not found",
    };
  }
  return messageToSendBack;
}

async function getUsersOnDiagram(body) {
  return ddb
    .query({
      TableName: OPEN_DIAGRAMS_TABLE_NAME,
      IndexName: "versions",
      KeyConditionExpression:
        "diagramId = :diagramId AND versionId = :versionId",
      ExpressionAttributeValues: {
        ":diagramId": body.diagramId,
        ":versionId": body.versionId,
      },
    })
    .promise();
}
