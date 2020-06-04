const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME, USERS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  console.log("event = ", JSON.stringify(event, null, 2));

  const username = event.requestContext.authorizer.jwt.claims.username;

  const diagramsForAuthorRaw = await getDiagramsForAuthor(username);
  const invitesForAuthorRaw = await getInvitesForAuthor(username);
  const publicDiagramsRaw = await getPublicDiagrams();

  const ownDiagrams = groupVersions(diagramsForAuthorRaw);
  const invitedDiagrams = groupVersions(invitesForAuthorRaw);
  const publicDiagrams = groupVersions(publicDiagramsRaw);

  return {
    ownDiagrams,
    invitedDiagrams,
    publicDiagrams,
  };
};

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
    const versions = versionList.Items.filter(
      (item) => item.diagramId === diagramId
    ).sort((a, b) => (a.versionId < b.versionId ? 1 : -1));
    const diagramData = {
      versions,
      participants: versions[0].participants,
      description: versions[0].description,
      authorId: versions[0].authorId,
      diagramName: versions[0].diagramName,
      diagramId: versions[0].diagramId,
      latestVersionId: versions[0].versionId,
    };
    diagrams.push(diagramData);
  });
  return diagrams;
}

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
  // const invites = await getInvitesForAuthor(authorId);
}

async function getPublicDiagrams() {
  const scanParams = {
    TableName: DIAGRAMS_TABLE_NAME,
    FilterExpression: "visibility = :visibility",
    ExpressionAttributeValues: {
      ":visibility": "public",
    },
  };

  console.log("scanParams = ", scanParams);

  return await ddb.scan(scanParams).promise();
}

async function getInvitesForAuthor(authorId) {
  const userRecord = await getUserRecord({ username: authorId });

  if (!userRecord.Item) {
    return [];
  }
  const invites = userRecord.Item.invites;

  if (!invites || invites.length === 0) {
    return [];
  }

  const expressionAttributeValues = {};
  const inviteParams = invites
    .map((invite, i) => {
      console.log("invite = ", invite);
      const key = `:invite${i + 1}`;
      expressionAttributeValues[key] = invite;
      return key;
    })
    .join(",");

  const scanParams = {
    TableName: DIAGRAMS_TABLE_NAME,
    FilterExpression: `diagramId IN (${inviteParams})`,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  console.log("scanParams = ", scanParams);

  return await ddb.scan(scanParams).promise();
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
