const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const { DIAGRAMS_TABLE_NAME } = process.env;

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body: ", body);
  const { diagramName, authorId, description, visibility } = body;

  // try {
  //   const existingDiagramResult = await ddb
  //     .scan({
  //       TableName: DIAGRAMS_TABLE_NAME,
  //       ProjectionExpression: "diagramId",
  //       FilterExpression: "diagramName = :diagramName",
  //       ExpressionAttributeValues: {
  //         ":diagramName": diagramName,
  //       },
  //     })
  //     .promise();
  //   if (existingDiagramResult.Items.length > 0) {
  //     return {
  //       statusCode: 400,
  //       body: "Diagram name is already in use. Choose another one",
  //     };
  //   }
  // } catch (e) {
  //   console.log("Failed to check for existing diagrams:", e);
  // }

  const newVersionId = Date.now();
  const newDiagramId =
    diagramName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/gi, "") + newVersionId;

  const putParams = {
    TableName: process.env.DIAGRAMS_TABLE_NAME,
    Item: {
      diagramId: newDiagramId,
      lastModified: Date.now(),
      diagramName,
      authorId,
      description,
      visibility,
      versionName: "Current Version",
      isLatest: true,
      versionId: String(newVersionId),
      previousVersionId: undefined,
      components: [],
      connections: [],
      groups: [],
      messages: [],
      participants: [],
    },
  };

  try {
    await ddb.put(putParams).promise();
  } catch (err) {
    console.log("error:", err);
    return {
      statusCode: 500,
      body: "Failed to create diagram: " + JSON.stringify(err),
    };
  }

  await recordActivity({
    user: authorId,
    activityItem: {
      name: `<b>You</b> created a diagram called <b>${diagramName}</b>`,
      type: "create-diagram",
    },
  });

  return { diagramId: newDiagramId, versionId: String(newVersionId) };
};

async function recordActivity({ user, activityItem }) {
  const lambda = new AWS.Lambda();

  await lambda
    .invoke({
      FunctionName: "RecordActivity",
      InvocationType: "Event",
      LogType: "Tail",
      Payload: JSON.stringify({
        user,
        activityItem,
      }),
    })
    .promise();
}
