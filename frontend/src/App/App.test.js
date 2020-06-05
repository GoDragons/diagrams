import React from "react";
import { shallow } from "enzyme";
import { App } from "./App";

import Amplify from "aws-amplify";

jest.mock("aws-amplify");

describe("App component", () => {
  xit("renders without crashing", () => {
    shallow(<App />);
  });
  it("gets the user credentials", () => {
    Amplify.Auth.currentUserInfo.mockResolvedValue({ user: "blabla" });
    shallow(<App />);
    expect(Amplify.Auth.currentUserInfo).toBeCalled();
  });
});
