const helpers = {
  addComponent: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      components: [...diagramData.components, changeData],
    };
  },

  addConnection: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      connections: [...diagramData.connections, changeData],
    };
  },

  updateConnection: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      connections: diagramData.connections.map((connection) =>
        connection.id === changeData.id ? changeData : connection
      ),
    };
  },

  moveComponent: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      components: diagramData.components.map((component) =>
        component.id === changeData.id
          ? { ...component, x: changeData.x, y: changeData.y }
          : component
      ),
    };
  },

  deleteComponent: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      components: diagramData.components.filter((x) => x.id !== changeData.id),
    };
  },

  deleteConnection: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      connections: diagramData.connections.filter(
        (x) => x.id !== changeData.id
      ),
    };
  },

  chatMessage: ({ changeData, diagramData }) => {
    return {
      ...diagramData,
      messages: [...(diagramData.messages || []), changeData.message],
    };
  },
};

module.exports = {
  applyChangeToDiagramData: ({ change, diagramData }) => {
    const targetHelper = helpers[change.operation];
    if (!targetHelper) {
      throw new Error(`Unknown operation ${change.operation}`);
    }

    return targetHelper({
      changeData: change.data,
      diagramData,
    });
  },
};
