const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  console.log("event = ", JSON.stringify(event, null, 2));
  const { diagramId } = event.pathParameters;
  const versionsResult = await getDiagramVersions({ diagramId });
  const diagrams = groupVersions(versionsResult);
  return diagrams;
};

async function getDiagramVersions({ diagramId }) {
  return await ddb
    .query({
      TableName: DIAGRAMS_TABLE_NAME,
      KeyConditionExpression: "diagramId = :diagramId",
      ExpressionAttributeValues: {
        ":diagramId": diagramId,
      },
    })
    .promise();
}

function groupVersions(versionList) {
  let diagrams = [];
  const diagramIds = new Set();
  if (!versionList.Items) {
    return diagrams;
  }
  versionList.Items.forEach((diagram) => {
    diagramIds.add(diagram.diagramId);
  });

  diagramIds.forEach((diagramId) => {
    // we only want to return the diagram's metadata, without the actual drawing

    const versions = versionList.Items.filter(
      (item) => item.diagramId === diagramId
    ).sort((a, b) => (a.versionId < b.versionId ? 1 : -1));

    const lastVersion = versions[0];

    const diagramData = {
      ...lastVersion,
      versions,
      componentCount: lastVersion.components.length,
      groupCount: lastVersion.groups.length,
      connectionCount: lastVersion.connections.length,
      latestVersionId: lastVersion.versionId,
    };

    delete diagramData.components;
    delete diagramData.connections;
    delete diagramData.groups;
    delete diagramData.versionId;

    diagrams.push(diagramData);
  });
  return diagrams[0];
}
