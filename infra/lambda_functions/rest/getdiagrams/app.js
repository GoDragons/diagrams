const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  let diagrams = [];

  try {
    const diagramsResult = await ddb
      .scan({
        TableName: DIAGRAMS_TABLE_NAME,
        ProjectionExpression:
          "diagramId, diagramName, lastModified, versionName, versionId, isLatest",
      })
      .promise();
    const diagramItems = diagramsResult.Items;
    const diagramIds = new Set();
    diagramItems.forEach((diagramItem) => {
      diagramIds.add(diagramItem.diagramId);
    });

    diagramIds.forEach((diagramId) => {
      const versions = diagramItems
        .filter((item) => item.diagramId === diagramId)
        .sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1));
      const diagramData = {
        versions,
        diagramName: versions[0].diagramName,
        diagramId: versions[0].diagramId,
        latestVersionId: versions[0].versionId,
      };
      diagrams.push(diagramData);
    });
  } catch (e) {
    console.log("Error when reading diagrams: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return diagrams;
};
