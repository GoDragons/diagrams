const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const {
  DIAGRAM_MASTERS_TABLE_NAME,
  OPEN_DIAGRAMS_TABLE_NAME,
  WEBSOCKET_API_ENDPOINT,
} = process.env;

const api = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: WEBSOCKET_API_ENDPOINT,
});

exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));
  const operation = event.Records[0].eventName;

  const data = event.Records[0].dynamodb;
  console.log("Operation:", operation);
  switch (operation) {
    case "INSERT":
      await handleInsert(data.NewImage);
      break;
    case "REMOVE":
      await handleRemove(data.OldImage);
      break;
  }

  return "ok";
};

async function handleRemove({ diagramId, versionId, connectionId, authorId }) {
  await removeMaster({ diagramId, versionId, connectionId, authorId });
  await sendNotification({
    authorId: authorId.S,
    diagramId: diagramId.S,
    versionId: versionId.S,
    connectionId: connectionId.S,
    isJoin: false,
  });
}

async function handleInsert({ diagramId, versionId, connectionId, authorId }) {
  await addMaster({ diagramId, versionId, connectionId, authorId });

  await sendNotification({
    authorId: authorId.S,
    diagramId: diagramId.S,
    versionId: versionId.S,
    connectionId: connectionId.S,
    isJoin: true,
  });
}

async function addMaster({ diagramId, versionId, connectionId, authorId }) {
  const putParams = {
    TableName: DIAGRAM_MASTERS_TABLE_NAME,
    Item: {
      diagramId: diagramId.S,
      versionId: versionId.S,
      connectionId: connectionId.S,
      authorId: authorId.S,
    },
    ConditionExpression:
      "attribute_not_exists(diagramId) and attribute_not_exists(versionId)",
  };

  try {
    await ddb.put(putParams).promise();
    console.log("Insert successful");
  } catch (e) {
    if (e.code === "ConditionalCheckFailedException") {
      console.log("We already have a master");
      // this is expected, it just means we already have a master
    } else {
      console.log("Failed to add master:", e);
      throw e;
    }
  }
}

async function removeMaster({ diagramId, versionId, connectionId, authorId }) {
  console.log("Removing master");
  try {
    const deleteParams = {
      TableName: DIAGRAM_MASTERS_TABLE_NAME,
      Key: {
        diagramId: diagramId.S,
        versionId: versionId.S,
      },
      ConditionExpression: "connectionId = :connectionId",
      ExpressionAttributeValues: {
        ":connectionId": connectionId.S,
      },
    };
    console.log("Delete Params:", deleteParams);
    await ddb.delete(deleteParams).promise();
    console.log("Successfully removed master:", connectionId.S);
  } catch (e) {
    if (e.code === "ConditionalCheckFailedException") {
      console.log("The user was not master");
    } else {
      console.log("Error when removing master: ", e);
      throw e;
    }
  }
}

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

async function sendNotification({
  authorId,
  diagramId,
  versionId,
  connectionId,
  isJoin,
}) {
  console.log(`Sending notification about ${isJoin ? "join" : "disconnect"}`);
  const users = await getUsersOnDiagram({ diagramId, versionId });
  console.log("users: ", users);
  for (let i = 0; i < users.Items.length; i++) {
    const user = users.Items[i];
    console.log(
      `Sending notification to: authorId = ${user.authorId} and connectionId = ${user.connectionId} about: authorId=${authorId} and connectionId=${connectionId}`
    );
    if (
      isJoin &&
      user.authorId === authorId &&
      user.connectionId !== connectionId
    ) {
      console.log("Logged in somewhere else:", authorId);
      await deleteUserFromDatabase(user.connectionId);
      await notifyLoggedInSomewhereElse(user.connectionId);
    } else if (!isJoin && user.authorId === authorId) {
      // we don't want to notify other sessions for this user that they have just dropped off
    } else {
      try {
        console.log("Notifying user", user.connectionId);
        await api
          .postToConnection({
            ConnectionId: user.connectionId,
            Data: JSON.stringify({
              type: isJoin ? "joinNotification" : "disconnectNotification",
              user: {
                authorId,
              },
            }),
          })
          .promise();
        console.log("User notified");
      } catch (e) {
        if (e.statusCode === 410) {
          await deleteUserFromDatabase(user.connectionId);
          console.log("User is gone");
        } else {
          console.log("Error when posting to user: ", e);
        }
      }
    }
  }

  return;
}

async function notifyLoggedInSomewhereElse(connectionId) {
  console.log("notifyLoggedInSomewhereElse:", connectionId);
  try {
    await api
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          type: "loggedInSomewhereElse",
        }),
      })
      .promise();
  } catch (e) {}
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
