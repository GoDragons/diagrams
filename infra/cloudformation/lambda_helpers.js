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

function addRoute({ template, functionDetails }) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionDetails.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::ApiGatewayV2::Route",
    Properties: {
      ApiId: {
        Ref: functionDetails.apiName,
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
      ...functionDetails.route,
    },
  };

  template.Resources[`${functionNameCamelCase}Route`] = data;
}

function addIntegration({ template, functionDetails }) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionDetails.name,
    firstWordLowerCase: false,
  });
  const data = {
    Type: "AWS::ApiGatewayV2::Integration",
    Properties: {
      ApiId: {
        Ref: functionDetails.apiName,
      },
      Description: `${functionDetails.name.split("-").join(" ")} Integration`,
      IntegrationType: "AWS_PROXY",
      IntegrationUri: {
        "Fn::Sub": `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${${functionNameCamelCase}Function.Arn}/invocations`,
      },
      ...functionDetails.integration,
    },
  };
  if (functionDetails.PayloadFormatVersion) {
    data.Properties.PayloadFormatVersion = functionDetails.PayloadFormatVersion;
  }

  template.Resources[`${functionNameCamelCase}Integ`] = data;
}

function addLogGroup({ template, functionDetails }) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionDetails.name,
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

function addPermission({ template, functionDetails }) {
  const functionNameCamelCase = makeNameCamelCase({
    name: functionDetails.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Lambda::Permission",
    DependsOn: [functionDetails.apiName],
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

function addFunction({ template, functionDetails }) {
  const {
    apiName,
    name,
    route,
    integration,
    isWebSocket,
    ...functionProperties
  } = functionDetails;
  const functionNameCamelCase = makeNameCamelCase({
    name: functionDetails.name,
    firstWordLowerCase: false,
  });

  const data = {
    Type: "AWS::Serverless::Function",
    Properties: {
      FunctionName: functionNameCamelCase,
      Handler: "app.handler",
      MemorySize: 128,
      Runtime: "nodejs12.x",
      ...functionProperties,
    },
  };

  template.Resources[`${functionNameCamelCase}Function`] = data;

  if (apiName) {
    if (isWebSocket && template.Resources.WebsocketDeployment) {
      template.Resources.WebsocketDeployment.DependsOn.push(
        `${functionNameCamelCase}Route`
      );
    } else if (!isWebSocket && template.Resources.RESTDeployment) {
      template.Resources.RESTDeployment.DependsOn.push(
        `${functionNameCamelCase}Route`
      );
    }
  }
}

function addFunctions({ template, functions }) {
  functions.forEach((functionDetails) => {
    if (functionDetails.apiName) {
      addRoute({ template, functionDetails });
      addIntegration({ template, functionDetails });
      addPermission({ template, functionDetails });
    } else {
    }
    addFunction({ template, functionDetails });
    // addLogGroup({template, functionDetails});
  });
}

function addLambdaResources({ template, functions }) {
  addFunctions({ template, functions });
  return template;
}

module.exports = { addLambdaResources, addFunction };
