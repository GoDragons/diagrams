const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { USERS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  const { user, activityItem } = event;

  console.log("event = ", event);

  const existingUserData = await ddb
    .get({
      TableName: USERS_TABLE_NAME,
      Key: {
        username: user,
      },
    })
    .promise();

  if (!existingUserData.Item) {
    console.log("No user found");
    return {
      statusCode: 400,
      body: "User does not exist",
    };
  }

  await ddb
    .put({
      TableName: USERS_TABLE_NAME,
      Item: {
        ...existingUserData.Item,
        activity: [activityItem, ...(existingUserData.Item.activity || [])],
      },
    })
    .promise();
  console.log("Activity added successfully");
  return "ok";
};
