const { template, functions } = require("./cloudformation_templates/main.js");

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
        Ref: functionData.apiName,
      },

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
      ...functionData.route,
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
        Ref: functionData.apiName,
      },
      Description: `${functionData.name.split("-").join(" ")} Integration`,
      IntegrationType: "AWS_PROXY",
      IntegrationUri: {
        "Fn::Sub": `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${${functionNameCamelCase}Function.Arn}/invocations`,
      },
      ...functionData.integration,
    },
  };
  if (functionData.PayloadFormatVersion) {
    data.Properties.PayloadFormatVersion = functionData.PayloadFormatVersion;
  }

  template.Resources[`${functionNameCamelCase}Integ`] = data;
}

function addFunction(functionData) {
  const {
    apiName,
    name,
    route,
    integration,
    ...functionProperties
  } = functionData;
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Serverless::Function",
    Properties: {
      FunctionName: functionNameCamelCase,
      CodeUri: `${functionData.name.split("-").join("")}/`,
      Handler: "app.handler",
      MemorySize: 128,
      Runtime: "nodejs12.x",
      ...functionProperties,
    },
  };

  template.Resources[`${functionNameCamelCase}Function`] = data;
}

function addLogGroup(functionData) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Logs::LogGroup",
    DependsOn: `${functionNameCamelCase}Function`,

    Properties: {
      LogGroupName: {
        "Fn::Join": [
          "/",
          ["diagrams", { Ref: `${functionNameCamelCase}Function` }],
        ],
      },
      RetentionInDays: 14,
    },
  };
  template.Resources[`${functionNameCamelCase}LogGroup`] = data;
}

function addPermission(functionData) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionData.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Lambda::Permission",
    DependsOn: [functionData.apiName],
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
    // addLogGroup(functionData);
  });
}

const fs = require("fs");

addFunctions(functions);

const TEMPLATE_FILE_PATH = "template.json";

fs.writeFileSync(TEMPLATE_FILE_PATH, JSON.stringify(template, null, 2));
console.log("Template file created");
