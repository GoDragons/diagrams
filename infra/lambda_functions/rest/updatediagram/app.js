const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  console.log("event = ", JSON.stringify(event, null, 2));
  const propertiesToChange = JSON.parse(event.body);
  const { diagramId, versionId } = event.pathParameters;

  const existingDiagramData = await getDiagramData({ diagramId, versionId });
  console.log("existingDiagramData:", existingDiagramData);
  let newDiagramData = { ...existingDiagramData.Item, ...propertiesToChange };

  await updateDiagramData(newDiagramData);
  return "ok";
};

async function updateDiagramData(newDiagramData) {
  await ddb
    .put({
      TableName: DIAGRAMS_TABLE_NAME,
      Item: newDiagramData,
    })
    .promise();
}

async function getDiagramData({ diagramId, versionId }) {
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
