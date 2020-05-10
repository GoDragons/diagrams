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
    const { connections } = diagramData;
    const targetIndex = connections.findIndex(
      (element) => element.id === changeData.id
    );

    return {
      ...diagramData,
      connections: [
        ...connections.slice(0, targetIndex),
        changeData,
        ...connections.slice(targetIndex + 1),
      ],
    };
  },

  moveComponent: ({ changeData, diagramData }) => {
    const { components } = diagramData;
    const targetIndex = components.findIndex(
      (element) => element.id === changeData.id
    );

    let updatedElement = {
      ...components[targetIndex],
      x: changeData.x,
      y: changeData.y,
    };

    return {
      ...diagramData,
      components: [
        ...components.slice(0, targetIndex),
        updatedElement,
        ...components.slice(targetIndex + 1),
      ],
    };
  },

  deleteComponent: ({ changeData, diagramData }) => {
    const { components } = diagramData;
    const targetIndex = components.findIndex(
      (element) => element.id === changeData.id
    );

    return {
      ...diagramData,
      components: [
        ...components.slice(0, targetIndex),
        ...components.slice(targetIndex + 1),
      ],
    };
  },

  deleteConnection: ({ changeData, diagramData }) => {
    const { connections } = diagramData;
    const targetIndex = connections.findIndex(
      (element) => element.id === changeData.id
    );

    return {
      ...diagramData,
      connections: [
        ...connections.slice(0, targetIndex),
        ...connections.slice(targetIndex + 1),
      ],
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
