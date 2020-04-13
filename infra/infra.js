const { template, apiName, functions } = require("./baseTemplate");

function makeNameCamelCase({ name, firstWordLowerCase = true }) {
  const components = name.split("-");
  const componentsCamelCase = components.map((component, i) => {
    if (firstWordLowerCase && i === 0) {
      return component;
    } else {
      return component.charAt(0).toUpperCase() + component.substring(1);
    }
  });
  return componentsCamelCase.join("");
}

function addRoute(functionData) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::ApiGatewayV2::Route",
    Properties: {
      ApiId: {
        Ref: apiName,
      },
      RouteKey: functionData.routeKey || functionData.name.split("-").join(""),
      AuthorizationType: "NONE",
      OperationName: `${functionNameCamelCase}Route`,
      Target: {
        "Fn::Join": [
          "/",
          [
            "integrations",
            {
              Ref: `${functionNameCamelCase}Integ`,
            },
          ],
        ],
      },
    },
  };

  template.Resources[`${functionNameCamelCase}Route`] = data;
  template.Resources.Deployment.DependsOn.push(`${functionNameCamelCase}Route`);
}

function addIntegration(functionData) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });
  const data = {
    Type: "AWS::ApiGatewayV2::Integration",
    Properties: {
      ApiId: {
        Ref: apiName,
      },
      Description: `${functionData.name.split("-").join(" ")} Integration`,
      IntegrationType: "AWS_PROXY",
      IntegrationUri: {
        "Fn::Sub": `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${${functionNameCamelCase}Function.Arn}/invocations`,
      },
    },
  };

  template.Resources[`${functionNameCamelCase}Integ`] = data;
}

function addFunction(functionData) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Serverless::Function",
    Properties: {
      CodeUri: `${functionData.name.split("-").join("")}/`,
      Handler: "app.handler",
      MemorySize: 128,
      Runtime: "nodejs12.x",
    },
  };

  if (functionData.Environment) {
    data.Properties.Environment = functionData.Environment;
  }
  if (functionData.Policies) {
    data.Properties.Policies = functionData.Policies;
  }
  template.Resources[`${functionNameCamelCase}Function`] = data;
}

function addPermission(functionData) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Lambda::Permission",
    DependsOn: [apiName],
    Properties: {
      Action: "lambda:InvokeFunction",
      FunctionName: {
        Ref: `${functionNameCamelCase}Function`,
      },
      Principal: "apigateway.amazonaws.com",
    },
  };

  template.Resources[`${functionNameCamelCase}Permission`] = data;
}

function addFunctions(functionList) {
  functionList.forEach((functionData) => {
    addRoute(functionData);
    addIntegration(functionData);
    addFunction(functionData);
    addPermission(functionData);
  });
}

const fs = require("fs");

addFunctions(functions);

const TEMPLATE_FILE_PATH = "template.json";

// try {
// execSync(`rm -rf ${OUTPUT_DIRECTORY}`);
// execSync(`mkdir ${OUTPUT_DIRECTORY}`);
// console.log("Removed existing template file");
// } catch (e) {
// console.log("Template file did not exist, creating for the first time");
// }
fs.writeFileSync(TEMPLATE_FILE_PATH, JSON.stringify(template, null, 2));
console.log("Template file created");
