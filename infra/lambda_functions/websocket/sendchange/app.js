const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const {
  OPEN_DIAGRAMS_TABLE_NAME,
  DIAGRAM_MASTERS_TABLE_NAME,
  WEBSOCKET_API_ENDPOINT,
} = process.env;

const api = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: WEBSOCKET_API_ENDPOINT,
});
exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body:", body);

  const { diagramId, versionId, recipients } = body;

  let users = await getUsersOnDiagram({ diagramId, versionId });
  await checkForOutdatedMaster({ diagramId, versionId, users });

  // sometimes, we want to send a message only to a subset of users, e.g when following someone
  if (recipients) {
    users.Items = users.Items.filter((user) =>
      recipients.includes(user.authorId)
    );
  }

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

async function checkForOutdatedMaster({ diagramId, versionId, users }) {
  console.log("Check for outdated master");
  try {
    const masterResult = await ddb
      .query({
        TableName: DIAGRAM_MASTERS_TABLE_NAME,
        KeyConditionExpression:
          "diagramId = :diagramId AND versionId = :versionId",
        ExpressionAttributeValues: {
          ":diagramId": diagramId,
          ":versionId": versionId,
        },
      })
      .promise();

    if (masterResult.Items.length > 0) {
      const master = masterResult.Items[0];
      const masterIsOK = users.Items.some(
        (user) =>
          user.authorId === master.authorId &&
          user.connectionId === master.connectionId
      );
      if (!masterIsOK) {
        await removeMaster({
          diagramId,
          versionId,
          connectionId: master.connectionId,
        });
      }
    }
  } catch (e) {
    console.log("Error checking for outdated master:", e);
  }
}

async function removeMaster({ diagramId, versionId, connectionId }) {
  console.log("Outdated master found, removing");
  try {
    const deleteParams = {
      TableName: DIAGRAM_MASTERS_TABLE_NAME,
      Key: {
        diagramId: diagramId,
        versionId: versionId,
      },
      ConditionExpression: "connectionId = :connectionId",
      ExpressionAttributeValues: {
        ":connectionId": connectionId,
      },
    };
    console.log("Delete Params:", deleteParams);
    await ddb.delete(deleteParams).promise();
    console.log("Successfully removed master:", connectionId);
  } catch (e) {
    if (e.code === "ConditionalCheckFailedException") {
      console.log("The user was not master");
    } else {
      console.log("Error when removing master: ", e);
      throw e;
    }
  }
}
