const fs = require("fs");
const path = require("path");

const S3_BUCKET_PATH =
  "https://godragons-diagrams-lambda.s3.eu-west-2.amazonaws.com";
const S3_ICON_LOCATION = "icons";

const iconDirectoryPath = path.join(__dirname, "aws_icons");

const icons = fs.readdirSync(iconDirectoryPath);

const outputFilePath = path.join(
  __dirname,
  "frontend",
  "src",
  "data",
  "componentList.json"
);

const output = icons
  .filter((iconFileName) => !iconFileName.includes("light"))
  .map((iconFileName) => {
    return {
      icon: `${S3_BUCKET_PATH}/${S3_ICON_LOCATION}/${iconFileName}`,
      type: iconFileName
        .split(".svg")[0]
        .split("-")
        .join(" ")
        .split("_")
        .join(" "),
    };
  });
fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2));
// console.log("icons:", icons);
