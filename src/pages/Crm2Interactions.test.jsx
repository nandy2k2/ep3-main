import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Crm2Interactions from "./Crm2Interactions";
import ep1 from "../api/ep1";
import { DataGrid } from "@mui/x-data-grid";
jest.mock("../api/ep1", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("@mui/x-data-grid", () => ({ DataGrid: jest.fn(), GridToolbar: () => null }));
const lead = { _id: "507f1f77bcf86cd799439011", name: "Lead", email: "lead@example.com", pipeline: "New" };
function Choice({ title, value, onChange }) {
  return <select aria-label={title} value={value?.name || ""} onChange={e => onChange({ name: e.target.value })}><option value="" /><option>New</option><option>Phone</option><option>Interested</option></select>;
}
beforeEach(() => {
  ep1.get.mockReset(); ep1.post.mockReset(); DataGrid.mockReset(); DataGrid.mockImplementation(() => <div>History grid</div>);
  ep1.get.mockResolvedValue({ data: { data: [], total: 0 } });
  ep1.post.mockResolvedValue({ data: { data: { ...lead, pipeline: "Interested", followupdate: "2026-10-25" } } });
});
test("interaction details save with the selected lead and history does not redraw on typing", async () => {
  const onSaved = jest.fn();
  render(<Crm2Interactions lead={lead} Choice={Choice} onAdd={() => {}} notify={() => {}} onSaved={onSaved} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "New interaction" }).disabled).toBe(false));
  const renders = DataGrid.mock.calls.length;
  fireEvent.change(screen.getByLabelText("Interaction details"), { target: { value: "Discussed fees" } });
  fireEvent.change(screen.getByLabelText("Mode of interaction"), { target: { value: "Phone" } });
  fireEvent.change(screen.getByLabelText("Pipeline stage"), { target: { value: "Interested" } });
  fireEvent.change(screen.getByLabelText("Next follow-up date"), { target: { value: "2026-10-25" } });
  expect(DataGrid).toHaveBeenCalledTimes(renders);
  fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  expect(ep1.post.mock.calls[0][1]).toMatchObject({ leadid: lead._id, details: "Discussed fees", mode: "Phone", pipeline: "Interested", nextfollowupdate: "2026-10-25" });
  await waitFor(() => expect(ep1.get).toHaveBeenCalledTimes(2));
});
