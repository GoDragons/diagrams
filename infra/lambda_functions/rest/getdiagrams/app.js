const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  let diagrams = [];
  console.log("event = ", JSON.stringify(event, null, 2));
  const authorId = "";
  const username = event.requestContext.authorizer.jwt.claims.username;

  const diagramsForAuthor = await getDiagramsForAuthor(username);

  const diagramIds = new Set();
  diagramsForAuthor.Items.forEach((diagram) => {
    diagramIds.add(diagram.diagramId);
  });

  diagramIds.forEach((diagramId) => {
    const versions = diagramsForAuthor.Items.filter(
      (item) => item.diagramId === diagramId
    ).sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1));
    const diagramData = {
      versions,
      diagramName: versions[0].diagramName,
      diagramId: versions[0].diagramId,
      latestVersionId: versions[0].versionId,
    };
    diagrams.push(diagramData);
  });

  return diagrams;
};

async function getDiagramsForAuthor(authorId) {
  return ddb
    .query({
      TableName: DIAGRAMS_TABLE_NAME,
      IndexName: "authors",
      KeyConditionExpression: "authorId = :authorId",
      ExpressionAttributeValues: {
        ":authorId": authorId,
      },
    })
    .promise();
}
