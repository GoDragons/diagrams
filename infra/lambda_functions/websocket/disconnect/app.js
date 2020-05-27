const AWS = require("aws-sdk");

const { OPEN_DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
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

  return { statusCode: 200, body: "Disconnected." };
};
