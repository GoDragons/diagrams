const STACK_OUTPUT = require("../cloudformation_output.json");

function getCloudFormationOuputByName(outputKey) {
  const outputs = STACK_OUTPUT.Stacks[0].Outputs;
  return outputs.find((output) => output.OutputKey === outputKey).OutputValue;
}

module.exports = {
  getCloudFormationOuputByName,
};
