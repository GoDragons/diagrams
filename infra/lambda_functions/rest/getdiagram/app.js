const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  console.log("event = ", JSON.stringify(event, null, 2));
  const { diagramId, versionId } = event.pathParameters;
  const diagramResult = await getDiagram({ diagramId, versionId });
  return diagramResult.Item;
};

async function getDiagram({ diagramId, versionId }) {
  return await ddb
    .get({
      TableName: DIAGRAMS_TABLE_NAME,
      Key: {
        diagramId,
        versionId,
      },
    })
    .promise();
}
