const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  try {
    await ddb
      .put({
        TableName: DIAGRAMS_TABLE_NAME,
        Item: { ...body.diagramData, lastModified: Date.now() },
      })
      .promise();
  } catch (e) {
    console.log("Error when saving diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: "Connected." };
};
