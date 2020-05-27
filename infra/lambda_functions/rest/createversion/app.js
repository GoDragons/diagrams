const AWS = require("aws-sdk");

const { DIAGRAMS_TABLE_NAME } = process.env;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const diagramId = body.diagramData.diagramId;
  const oldVersionId = body.diagramData.versionId;

  const newVersionId = Date.now();

  const lastVersionQueryParams = {
    TableName: DIAGRAMS_TABLE_NAME,
    KeyConditionExpression: "diagramId = :diagramId AND versionId = :versionId",
    ExpressionAttributeValues: {
      ":diagramId": diagramId,
      ":versionId": oldVersionId,
    },
  };
  console.log("lastVersionQueryParams:", lastVersionQueryParams);
  let oldDiagramData;
  try {
    let result = await ddb.query(lastVersionQueryParams).promise();
    console.log("Last version query result: ", result);
    if (result.Items.length === 0) {
      throw new Error("Couldn't find the previous version of the diagram");
    }
    oldDiagramData = result.Items[0];
  } catch (e) {
    console.log("Error when changing the previous version: ", e);
  }

  console.log("oldDiagramData: ", oldDiagramData);
  try {
    await ddb
      .put({
        TableName: DIAGRAMS_TABLE_NAME,
        Item: {
          ...body.diagramData,
          isLatest: false,
          versionName: body.versionName,
          lastModified: Date.now(),
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when saving diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  try {
    await ddb
      .put({
        TableName: DIAGRAMS_TABLE_NAME,
        Item: {
          ...body.diagramData,
          diagramId,
          versionId: String(newVersionId),
          previousVersionId: String(oldVersionId),
          isLatest: true,
          versionName: "Current Version",
          lastModified: Date.now(),
        },
      })
      .promise();
  } catch (e) {
    console.log("Error when saving diagram: ", e);
    return { statusCode: 500, body: e.stack };
  }

  return {
    diagramId,
    versionId: String(newVersionId),
  };
};
