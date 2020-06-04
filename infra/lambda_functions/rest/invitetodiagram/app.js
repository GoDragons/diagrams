const AWS = require("aws-sdk");

const { USERS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body = ", body);
  const { inviter, recipient, diagramId, diagramName } = body;

  await addInvite({ inviter, recipient, diagramId });
  await recordActivity({
    user: inviter,
    activityItem: {
      name: `<b>You</b> invited <b>${recipient}</b> to diagram <b>${diagramName}</b>`,
      type: "invite",
    },
  });
  await recordActivity({
    user: recipient,
    activityItem: {
      name: `<b>You</b> were invited by <b>${inviter}</b> to diagram <b>${diagramName}</b>`,
      type: "invite",
    },
  });
  return "ok";
};

async function recordActivity({ user, activityItem }) {
  const lambda = new AWS.Lambda();

  await lambda
    .invoke({
      FunctionName: "RecordActivity",
      InvocationType: "Event",
      LogType: "Tail",
      Payload: JSON.stringify({
        user,
        activityItem,
      }),
    })
    .promise();
}

async function addInvite({ inviter, recipient, diagramId }) {
  console.log("inviter = ", inviter);
  console.log("recipient = ", recipient);
  console.log("diagramId = ", diagramId);
  const userRecord = await getUserRecord({ username: recipient });
  console.log("userRecord = ", userRecord);
  let invites = [];
  if (!userRecord.Item) {
    console.log("There is no user record, creating one now");
  } else {
    invites = userRecord.Item.invites;
  }
  const inviteAlreadyExists = invites.some((x) => x.S === diagramId);
  if (!inviteAlreadyExists) {
    invites.push(diagramId);
  }

  const putParams = {
    TableName: USERS_TABLE_NAME,
    Item: {
      username: recipient,
      invites,
    },
  };

  try {
    await ddb.put(putParams).promise();
    console.log("Insert successful");
  } catch (e) {
    console.log("Failed to add invite:", e);
    throw e;
  }
}

async function getUserRecord({ username }) {
  return await ddb
    .get({
      TableName: USERS_TABLE_NAME,
      Key: {
        username,
      },
    })
    .promise();
}
