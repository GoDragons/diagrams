const AWS = require("aws-sdk");

const {
  WEBSOCKET_API_ENDPOINT,
  OPEN_DIAGRAMS_TABLE_NAME,
  DIAGRAM_MASTERS_TABLE_NAME,
} = process.env;

const api = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: WEBSOCKET_API_ENDPOINT,
});

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));
  const operation = event.Records[0].eventName;
  const data = event.Records[0].dynamodb;

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

async function handleInsert({ connectionId }) {
  try {
    await api
      .postToConnection({
        ConnectionId: connectionId.S,
        Data: JSON.stringify({
          type: "master",
        }),
      })
      .promise();
    console.log(`Notified user ${connectionId.S} they are master:`, e);
  } catch (e) {
    console.log(`Error notifying user ${connectionId.S} they are master:`, e);
  }
}

async function handleRemove({ diagramId, versionId }) {
  const users = await getUsersOnDiagram({
    diagramId: diagramId.S,
    versionId: versionId.S,
  });
  if (users.Items.length === 0) {
    console.log(
      "No users left on diagram, we do not need to choose a new master"
    );
    return;
  }

  console.log("We need to choose a new master");

  const newMasterIndex = Math.floor(Math.random() * users.Items.length);
  const newMasterUserData = users.Items[newMasterIndex];

  await addMaster({
    diagramId,
    versionId,
    connectionId: newMasterUserData.connectionId,
    authorId: newMasterUserData.authorId,
  });
}

async function addMaster({ diagramId, versionId, connectionId, authorId }) {
  const putParams = {
    TableName: DIAGRAM_MASTERS_TABLE_NAME,
    Item: {
      diagramId: diagramId,
      versionId: versionId,
      connectionId: connectionId,
      authorId: authorId,
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
