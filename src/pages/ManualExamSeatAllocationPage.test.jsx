import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ManualExamSeatAllocationPage, { activeManualSeatExams } from "./ManualExamSeatAllocationPage";
import ep1 from "../api/ep1";
import global1 from "./global1";
jest.mock("../api/ep1", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("./MenuPageShell", () => ({ children }) => <div>{children}</div>);
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("@mui/x-data-grid", () => ({ DataGrid: () => <div>Student grid</div>, GridToolbar: () => null }));
test("active exams use academic year, not the optional regulation on the exam master", () => {
  const rows = [
    { examcode: "A", academicyear: "2026-27", regulation: "", formactive: "Yes" },
    { examcode: "B", academicyear: "2026-27", regulation: "Other", formactive: "Yes" },
    { examcode: "C", academicyear: "2026-27", formactive: "No" },
    { examcode: "D", academicyear: "2025-26", formactive: "Yes" }
  ];
  expect(activeManualSeatExams(rows, "2026-27").map(row => row.examcode)).toEqual(["A", "B"]);
});
test("student data does not load automatically and allocation requires complete selection", async () => {
  global1.colid = 42;
  ep1.get.mockResolvedValue({ data: { data: [] } });
  render(<ManualExamSeatAllocationPage />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalledTimes(3));
  expect(ep1.get).toHaveBeenCalledWith("/api/v2/regulationmaster", expect.objectContaining({ params: expect.objectContaining({ colid: expect.anything() }) }));
  expect(ep1.get.mock.calls.some(([url]) => url.endsWith("examrolls"))).toBe(false);
  expect(screen.getByRole("button", { name: "Load students" }).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Allocate selected (0)" }).disabled).toBe(true);
});
test("programs and courses cascade from populated exam courses without a regulation restriction", async () => {
  global1.colid = 42;
  ep1.get.mockImplementation(async url => ({ data: { data: url.endsWith("regulationmaster") ? [{ regulation: "R26" }] : url.endsWith("exams") ? [{ academicyear: "2026-27", examname: "Final", examcode: "E1", formactive: "Yes" }] : url.endsWith("examcourses") ? [{ program: "BSc", programcode: "P1", course: "Physics", coursecode: "PHY1" }, { program: "BA", programcode: "P2", course: "History", coursecode: "H1" }] : [] } }));
  render(<ManualExamSeatAllocationPage />);
  const choose = async (label, option) => {
    fireEvent.mouseDown(screen.getByLabelText(label));
    fireEvent.click(await screen.findByRole("option", { name: option }));
  };
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith("/api/v2/conductexam/rooms", expect.anything()));
  await choose("Academic year", "2026-27");
  await choose("Regulation", "R26");
  await choose("Exam", "Final (E1)");
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith("/api/v2/conductexam/examcourses", expect.objectContaining({ params: { colid: 42, academicyear: "2026-27", examcode: "E1" } })));
  await choose("Program", "BSc (P1)");
  expect(screen.getByLabelText("Program code").value).toBe("P1");
  fireEvent.mouseDown(screen.getByLabelText("Course"));
  expect(await screen.findByRole("option", { name: "Physics (PHY1)" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: "History (H1)" })).toBeNull();
  fireEvent.click(screen.getByRole("option", { name: "Physics (PHY1)" }));
  expect(screen.getByLabelText("Course code").value).toBe("PHY1");
  fireEvent.click(screen.getByRole("button", { name: "Load students" }));
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith("/api/v2/conductexam/examrolls", { params: { colid: 42, academicyear: "2026-27", examcode: "E1", program: "BSc", programcode: "P1", course: "Physics", coursecode: "PHY1" } }));
});
