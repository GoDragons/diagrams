import React from "react";
import { shallow } from "enzyme";
import { Link } from "react-router-dom";
import DiagramItem from "./DiagramItem";

describe("DiagramItem component", () => {
  beforeAll(() => {
    global.moment = jest.fn().mockImplementation((timestamp) => {
      return {
        fromNow: () => timestamp + "_ago",
      };
    });
  });
  xit("renders without crashing", () => {
    shallow(<DiagramItem />);
  });
  it("contains the correct link to the 'edit' page in the diagram name", () => {
    const component = shallow(
      <DiagramItem
        diagramId="1234"
        latestVersionId="abcd"
        diagramName="Test diagram"
      />
    );
    const target = component.find(".diagram-name");
    expect(target).toMatchSnapshot();
  });
  it("contains 'created'", () => {
    const component = shallow(
      <DiagramItem versions={[{ versionId: "56789" }]} />
    );
    const target = component.find(".created");
    expect(target).toMatchSnapshot();
  });

  it("contains 'last modified'", () => {
    const component = shallow(
      <DiagramItem versions={[{ lastModified: "9876" }]} />
    );
    const target = component.find(".last-modified");
    expect(target).toMatchSnapshot();
  });

  // it("links to the correct page with the 'edit' button", )
});
