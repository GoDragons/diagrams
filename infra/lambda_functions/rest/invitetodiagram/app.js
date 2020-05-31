const AWS = require("aws-sdk");

const { USERS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body = ", body);
  const { inviter, recipient, diagramId } = body;

  await addInvite({ inviter, recipient, diagramId });

  // const username = event.requestContext.authorizer.jwt.claims.username;
  return "ok";
};

async function addInvite({ inviter, recipient, diagramId }) {
  console.log("inviter = ", inviter);
  console.log("recipient = ", recipient);
  console.log("diagramId = ", diagramId);
  const userRecord = await getUserRecord({ username: recipient });
  let invites = [];
  if (!userRecord.Item) {
    console.log("There is no user record, creating one now");
  } else {
    invites = userRecord.invites;
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
