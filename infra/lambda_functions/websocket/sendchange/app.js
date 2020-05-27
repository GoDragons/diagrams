const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { OPEN_DIAGRAMS_TABLE_NAME, WEBSOCKET_API_ENDPOINT } = process.env;

const api = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: WEBSOCKET_API_ENDPOINT,
});
exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body:", body);

  const diagramId = body.diagramId;
  const versionId = body.versionId;

  const users = await getUsersOnDiagram({ diagramId, versionId });

  const postData = {
    type: "change",
    change: body.change,
  };

  const postCalls = users.Items.filter(
    // we do not want to propagate changes back to their author
    (user) => user.authorId !== body.change.authorId
  ).map(async ({ connectionId }) => {
    try {
      await api
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(postData),
        })
        .promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        deleteUserFromDatabase(connectionId);
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: "Data sent." };
};

async function getUsersOnDiagram({ diagramId, versionId }) {
  return ddb
    .query({
      TableName: OPEN_DIAGRAMS_TABLE_NAME,
      IndexName: "versions",
      KeyConditionExpression:
        "diagramId = :diagramId AND versionId = :versionId",
      ExpressionAttributeValues: {
        ":diagramId": diagramId,
        ":versionId": versionId,
      },
    })
    .promise();
}

async function deleteUserFromDatabase(connectionId) {
  console.log("Attempting to remove connection:", connectionId);

  try {
    await ddb
      .delete({
        TableName: OPEN_DIAGRAMS_TABLE_NAME,
        Key: {
          connectionId,
        },
      })
      .promise();
    console.log("Successfully deleted connection:", connectionId);
  } catch (e) {
    console.log("Error when deleting connection: ", e);
  }
}
