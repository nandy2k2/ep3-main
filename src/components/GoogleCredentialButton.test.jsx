import React from "react";
import { act, render, waitFor } from "@testing-library/react";

process.env.REACT_APP_GOOGLE_CLIENT_ID = "test-client";
const GoogleCredentialButton = require("./GoogleCredentialButton").default;

test("parent renders do not redraw Google login and the latest callback is used", async () => {
  const initialize = jest.fn();
  const renderButton = jest.fn();
  window.google = { accounts: { id: { initialize, renderButton } } };
  const first = jest.fn();
  const latest = jest.fn();
  const view = render(<GoogleCredentialButton onCredential={first} />);
  await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(1));
  view.rerender(<GoogleCredentialButton onCredential={latest} />);
  view.rerender(<GoogleCredentialButton onCredential={latest} />);
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(renderButton).toHaveBeenCalledTimes(1);
  act(() => initialize.mock.calls[0][0].callback({ credential: "credential" }));
  expect(latest).toHaveBeenCalledWith("credential");
  expect(first).not.toHaveBeenCalled();
  delete window.google;
});
