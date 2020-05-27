const data = {
  ConnectionsTable: {
    Type: "String",
    Default: "diagrams_app_connections",
    Description:
      "(Required) The name of the new DynamoDB to store connection identifiers for each connected clients. Minimum 3 characters",
    MinLength: 3,
    MaxLength: 50,
    AllowedPattern: "^[A-Za-z_]+$",
    ConstraintDescription:
      "Required. Can be characters and underscore only. No numbers or special characters allowed.",
  },
  DiagramsTable: {
    Type: "String",
    Default: "diagrams_app_diagrams",
    Description:
      "(Required) The name of the new DynamoDB to store connection identifiers for each connected clients. Minimum 3 characters",
    MinLength: 3,
    MaxLength: 50,
    AllowedPattern: "^[A-Za-z_]+$",
    ConstraintDescription:
      "Required. Can be characters and underscore only. No numbers or special characters allowed.",
  },
  DiagramMastersTable: {
    Type: "String",
    Default: "diagrams_app_masters",
    Description:
      "(Required) The name of the new DynamoDB to store masters for each open diagram version. Minimum 3 characters",
    MinLength: 3,
    MaxLength: 50,
    AllowedPattern: "^[A-Za-z_]+$",
    ConstraintDescription:
      "Required. Can be characters and underscore only. No numbers or special characters allowed.",
  },
  OpenDiagramsTable: {
    Type: "String",
    Default: "diagrams_app_open_diagrams",
    Description:
      "(Required) The name of the new DynamoDB to store connection identifiers for each open diagram. Minimum 3 characters",
    MinLength: 3,
    MaxLength: 50,
    AllowedPattern: "^[A-Za-z_]+$",
    ConstraintDescription:
      "Required. Can be characters and underscore only. No numbers or special characters allowed.",
  },
};

module.exports = data;
