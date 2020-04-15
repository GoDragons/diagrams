const fs = require("fs");
const path = require("path");

const iconDirectoryPath = path.join(__dirname, "src", "aws_icons");

const icons = fs.readdirSync(iconDirectoryPath);

const outputFilePath = path.join(
  __dirname,
  "src",
  "data",
  "componentListData.jsx"
);

function getComponentNameBasic(fileName) {
  return fileName
    .split(".svg")[0]
    .split("-")
    .join("")
    .split("_")
    .join("")
    .split(".")
    .join("")
    .trim();
}

const filteredIcons = icons.filter(
  (iconFileName) => !iconFileName.includes("copy")
);

let filteredIconsNoDuplicates = [];

filteredIcons.forEach((iconFileName) => {
  const componentName = getComponentNameBasic(iconFileName);
  const itemAlreadyExists = filteredIconsNoDuplicates.find(
    (crtItemFileName) => {
      const crtItemComponentName = getComponentNameBasic(crtItemFileName);
      return componentName === crtItemComponentName;
    }
  );
  if (!itemAlreadyExists) {
    // console.log(componentName);
    filteredIconsNoDuplicates.push(iconFileName);
  } else {
    console.log("----------duplicate:", iconFileName);
  }
});

const importsOutput = filteredIconsNoDuplicates
  .map((iconFileName) => {
    const componentNameBasic = getComponentNameBasic(iconFileName);

    const componentNameRightCasing =
      componentNameBasic[0].toUpperCase() + componentNameBasic.substring(1);

    return `import ${componentNameRightCasing} from '../aws_icons/${iconFileName}';`;
  })
  .join("\n");

const dataOutput = filteredIconsNoDuplicates.map((iconFileName) => {
  const componentNameBasic = getComponentNameBasic(iconFileName);

  const componentNameRightCasing =
    componentNameBasic[0].toUpperCase() + componentNameBasic.substring(1);
  return {
    iconImport: `---${componentNameRightCasing}---`,
    iconPath: `/static/media/${iconFileName}`,
    type: iconFileName
      .split(".svg")[0]
      .split("-")
      .join(" ")
      .split("_")
      .join(" "),
  };
});

const dataOutputStringified = JSON.stringify(dataOutput, null, 2);
const dataOutputAsJSX = dataOutputStringified
  .split('"---')
  .join("")
  .split('---"')
  .join("");

const dataVariable = `\n\nconst data = ${dataOutputAsJSX};\n`;
const exportStatement = `\nexport default data;`;
const reactImportStatement = 'import React from "react";\n\n';

const completeOutput =
  reactImportStatement + importsOutput + dataVariable + exportStatement;
fs.writeFileSync(outputFilePath, completeOutput);
