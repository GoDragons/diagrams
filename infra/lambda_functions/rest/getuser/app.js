const AWS = require("aws-sdk");

const { USERS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const firstActivity = {
  name: "<b>You</b> created your <b>account</b>. Woohoo!",
  type: "account",
};

exports.handler = async (event) => {
  console.log(
    "event.requestContext:",
    JSON.stringify(event.requestContext, null, 2)
  );
  const username = event.requestContext.authorizer.jwt.claims.username;
  let userRecord = await getUserRecord({ username });
  if (Object.keys(userRecord).length === 0) {
    userRecord = await createUserRecord({ username });
  } else if (userRecord.Item.activity.length === 0) {
    userRecord = await addFirstActivity({ userRecord });
  }
  return userRecord.Item;
};

async function addFirstActivity({ userRecord }) {
  await ddb
    .put({
      TableName: USERS_TABLE_NAME,
      Item: {
        ...userRecord,
        activity: [...userRecord.activity, firstActivity],
      },
    })
    .promise();
  return { Item: userRecord };
}

async function createUserRecord({ username }) {
  const userRecord = {
    username,
    invites: [],
    activity: [firstActivity],
  };
  await ddb
    .put({
      TableName: USERS_TABLE_NAME,
      Item: userRecord,
    })
    .promise();
  return { Item: userRecord };
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
