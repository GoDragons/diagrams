function getParameters() {
  let parameters = {};
  try {
    parameters = require("./templates/parameters.template.js");
  } catch (e) {
    // nothing, it just means we don't have parameter overrides
  }
  return parameters;
}

function getOutputs() {
  let outputs = {};
  try {
    outputs = require("./templates/outputs.template.js");
  } catch (e) {
    // nothing, it just means we don't have outputs
  }
  return outputs;
}

function getResources() {
  const path = require("path");
  const fs = require("fs");
  const directoryPath = path.join(__dirname, "templates");

  const FILES_TO_EXCLUDE = ["outputs", "parameters", "lambda"];

  const resourceFiles = fs
    .readdirSync(directoryPath)
    .filter((fileName) => {
      return !FILES_TO_EXCLUDE.some((fileToExclude) =>
        fileName.includes(fileToExclude)
      );
    })
    .map((fileName) => require(`./templates/${fileName}`));

  return resourceFiles.reduce((result, file) => ({ ...result, ...file }));
}

function getFunctions() {
  try {
    const functions = require("./templates/lambda.template.js");
    return functions;
  } catch (e) {
    return [];
    // it just means we have no functions declared
  }
}

function getTemplate() {
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Transform: "AWS::Serverless-2016-10-31",
    Description:
      "API for an online collaboration tool used to build system design diagrams",
    Parameters: getParameters(),
    Outputs: getOutputs(),
    Resources: getResources(),
  };
}

module.exports = {
  template: getTemplate(),
  functions: getFunctions(),
};
