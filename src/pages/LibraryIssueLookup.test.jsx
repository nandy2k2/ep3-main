import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import LibraryIssueLookup from "./LibraryIssueLookup";
import ep1 from "../api/ep1";

jest.mock("../api/ep1", () => ({ get: jest.fn() }));

beforeEach(() => { jest.useFakeTimers(); ep1.get.mockReset(); ep1.get.mockResolvedValue({ data: { data: [] } }); });
afterEach(() => { jest.useRealTimers(); });

test("no records load on mount and typing is debounced with a bounded server query", async () => {
  render(<LibraryIssueLookup kind="books" value={null} onChange={() => {}} />);
  expect(ep1.get).not.toHaveBeenCalled();
  const input = screen.getByLabelText("Select or scan accession no");
  fireEvent.change(input, { target: { value: "Phy" } });
  fireEvent.change(input, { target: { value: "Physics" } });
  expect(ep1.get).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(300); });
  expect(ep1.get).toHaveBeenCalledTimes(1);
  expect(ep1.get.mock.calls[0][1].params).toMatchObject({ search: "Physics", limit: 30, compact: "yes" });
});

test("new typing aborts older requests and filters reach the server", async () => {
  render(<LibraryIssueLookup kind="students" filters={{ programcode: "P1" }} revision={1} value={null} onChange={() => {}} />);
  await act(async () => { jest.advanceTimersByTime(300); });
  const signal = ep1.get.mock.calls[0][1].signal;
  fireEvent.change(screen.getByLabelText("Select student"), { target: { value: "Student" } });
  expect(signal.aborted).toBe(true);
  await act(async () => { jest.advanceTimersByTime(300); });
  expect(ep1.get.mock.calls.at(-1)[1].params).toMatchObject({ programcode: "P1", search: "Student" });
});

test("opening the student dropdown loads a small selectable batch without preloading", async () => {
  ep1.get.mockResolvedValue({ data: { data: [{ _id: "student1", name: "Anita", regno: "R1", email: "anita@example.com" }] } });
  const onChange = jest.fn();
  render(<LibraryIssueLookup kind="students" value={null} onChange={onChange} />);
  expect(ep1.get).not.toHaveBeenCalled();
  fireEvent.mouseDown(screen.getByLabelText("Select student"));
  await act(async () => { jest.advanceTimersByTime(300); });
  expect(ep1.get).toHaveBeenCalledTimes(1);
  expect(ep1.get.mock.calls[0][1].params).toMatchObject({ limit: 30, compact: "yes", search: "" });
  fireEvent.click(screen.getByRole("option", { name: "Anita - R1 - anita@example.com" }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ regno: "R1" }));
});
