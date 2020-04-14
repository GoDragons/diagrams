import React from "react";
import "./DiagramEditor.scss";

import RandomWords from "random-words";

export default class DiagramEditor extends React.Component {
  addComponent = () => {
    this.props.sendChange({
      operation: "addElement",
      data: {
        type: "lambda",
        label: `Function ${Math.floor(Math.random() * 10000)}`,
        x: 0,
        y: 0,
        id: `lambda_${RandomWords({ exactly: 3, join: "-" })}`,
      },
    });
  };
  displayComponents = () => {
    const { components } = this.props.data;
    return components.map((component) => (
      <p key={component.id} className="component">
        {component.type} - {component.label}
      </p>
    ));
  };
  render() {
    return (
      <div className="diagram-editor">
        <button onClick={this.addComponent} className="add-component">
          Add component
        </button>
        <div className="editor">{this.displayComponents()}</div>
      </div>
    );
  }
}
