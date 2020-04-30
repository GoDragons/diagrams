const fs = require("fs");
const path = require("path");

const { template, functions } = require("./compiler.js");
const { addLambdaResources } = require("./lambda_helpers");

const templateWithLambdaResources = addLambdaResources({ template, functions });

const TEMPLATE_FILE_PATH = path.join(
  __dirname,
  "..",
  ".sam_package",
  "pre_packaged.json"
);

fs.writeFileSync(
  TEMPLATE_FILE_PATH,
  JSON.stringify(templateWithLambdaResources, null, 2)
);
console.log("Template file created");
