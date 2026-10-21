import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Crm2Page from "./Crm2Pages";
import ep1 from "../api/ep1";
import MenuPageShell from "./MenuPageShell";
import { DataGrid } from "@mui/x-data-grid";
jest.mock("../api/ep1", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("./MenuPageShell", () => jest.fn(({ children }) => <div>{children}</div>));
jest.mock("@mui/x-data-grid", () => ({ DataGrid: jest.fn(() => <div data-testid="grid" />), GridToolbar: () => null }));

beforeEach(() => {
  ep1.get.mockReset(); ep1.post.mockReset();
  MenuPageShell.mockClear(); DataGrid.mockClear();
  MenuPageShell.mockImplementation(({ children }) => <div>{children}</div>);
  DataGrid.mockImplementation(() => <div data-testid="grid" />);
  ep1.get.mockResolvedValue({ data: { fields: [{ field: "name", type: "String", group: "Identity" }, { field: "email", type: "String", group: "Identity" }, { field: "phone", type: "String", group: "Identity" }] } });
});
const fillBasic = () => {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Lead" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "lead@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
};
test("no leads load initially and successful identity creation opens the grouped tabs", async () => {
  ep1.post.mockResolvedValue({ data: { data: { _id: "lead1", name: "Lead", email: "lead@example.com", phone: "9876543210" } } });
  render(<Crm2Page />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalledTimes(1));
  expect(ep1.get.mock.calls[0][0]).toMatch(/metadata$/);
  fillBasic(); fireEvent.click(screen.getByText("Check duplicates & continue"));
  await screen.findByRole("tab", { name: "CRM Details" });
  expect(screen.getByRole("tab", { name: "Identity" })).toBeTruthy();
  expect(screen.getByLabelText("Counsellor email").readOnly).toBe(true);
});
test("duplicate error keeps the lead in the initial identity step", async () => {
  ep1.post.mockRejectedValue({ response: { data: { message: "Duplicate found: email or phone already exists. Cannot proceed." } } });
  render(<Crm2Page />);
  fillBasic(); fireEvent.click(screen.getByText("Check duplicates & continue"));
  await screen.findByText(/Duplicate found:/);
  expect(screen.queryByRole("tab", { name: "CRM Details" })).toBeNull();
  expect(screen.getByLabelText("Email").value).toBe("lead@example.com");
});
test.each(["source", "pipeline", "type", "category", "leadrating", "case", "distributiontype", "mediumofinstruction", "quota", "document", "admissionoffice", "interactionmode"])("%s master allows consecutive new entries without overwriting", async entity => {
  ep1.post.mockImplementation(async (_, payload) => ({ data: { data: { _id: "saved-id", ...payload } } }));
  render(<Crm2Page entity={entity} />);
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "First entry" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.getByLabelText("Name").value).toBe(""));
  await waitFor(() => expect(screen.getByRole("button", { name: "New" }).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Second entry" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledTimes(2));
  expect(ep1.post.mock.calls[0][0]).toBe(`/api/v2/crm2/masters/${entity}/save`);
  expect(ep1.post.mock.calls[0][1].id).toBeUndefined();
  expect(ep1.post.mock.calls[1][1].id).toBeUndefined();
  expect(ep1.post.mock.calls[1][1].name).toBe("Second entry");
  await waitFor(() => expect(screen.getByLabelText("Name").value).toBe(""));
});
test.each(["source", "pipeline", "type", "category", "leadrating", "case", "distributiontype", "mediumofinstruction", "quota", "document", "admissionoffice", "interactionmode", "leads"])("typing in %s does not rerender navigation or results and save receives the latest text", async entity => {
  ep1.post.mockImplementation(async (_, payload) => ({ data: { data: { _id: "saved-id", ...payload } } }));
  render(<Crm2Page entity={entity} />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalledTimes(1));
  const shellRenders = MenuPageShell.mock.calls.length;
  const gridRenders = DataGrid.mock.calls.length;
  const name = screen.getByLabelText("Name");
  for (const value of ["F", "Fa", "Fac", "Face", "Facebook"]) fireEvent.change(name, { target: { value } });
  const search = screen.getByLabelText(entity === "leads" ? "Search name, email or phone" : "Search name or description");
  fireEvent.change(search, { target: { value: "New search" } });
  expect(name.value).toBe("Facebook");
  expect(MenuPageShell).toHaveBeenCalledTimes(shellRenders);
  expect(DataGrid).toHaveBeenCalledTimes(gridRenders);
  expect(ep1.get).toHaveBeenCalledTimes(1);
  if (entity === "leads") {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "lead@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
  }
  fireEvent.click(screen.getByRole("button", { name: entity === "leads" ? "Check duplicates & continue" : "Save" }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledTimes(1));
  expect(ep1.post.mock.calls[0][1].name).toBe("Facebook");
  await waitFor(() => expect(screen.getByRole("button", { name: "New" }).disabled).toBe(false));
});

const profileMetadata = [
  { field: "name", type: "String", group: "Identity" }, { field: "photo", type: "String", group: "Identity" },
  { field: "gender", type: "String", options: ["Male", "Female", "Not specified"], group: "Identity" },
  { field: "category", type: "String", options: ["SC", "ST", "General", "OBC"], group: "Family & Address" },
  { field: "quota", type: "String", group: "Family & Address" },
  { field: "12thmarks", type: "Number", group: "Education & Work" }, { field: "Mediumofinstruction", type: "String", group: "Education & Work" },
  { field: "active", type: "String", options: ["Yes", "No"], group: "CRM Details" }, { field: "followupdate", type: "Date", group: "CRM Details" },
  { field: "admissionoffice", type: "String", group: "CRM Details" }, { field: "admissionofficeid", type: "String", group: "CRM Details" },
  { field: "campuscounsellor", type: "String", group: "CRM Details" }, { field: "campuscounseloremail", type: "String", group: "CRM Details" },
  { field: "password", type: "String", group: "Additional Details" }
];
async function openProfile() {
  ep1.get.mockImplementation(async url => ({ data: url.endsWith("metadata") ? { fields: profileMetadata } : { data: [{ _id: "doc1", name: "Marksheet" }] } }));
  ep1.post.mockImplementation(async (_, payload) => ({ data: { data: { _id: "lead1", ...payload } } }));
  render(<Crm2Page />);
  fillBasic(); fireEvent.click(screen.getByText("Check duplicates & continue"));
  await screen.findByRole("tab", { name: "Identity" });
}
test("CRM category, follow-up and profile fields are separated into their correct tabs", async () => {
  await openProfile();
  expect(screen.getByLabelText("CRM category")).toBeTruthy();
  expect(screen.getByLabelText("Active")).toBeTruthy();
  expect(screen.getByLabelText("Follow-up date")).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Family & Address" }));
  expect(screen.getByLabelText("Category")).toBeTruthy();
  expect(screen.queryByLabelText("CRM category")).toBeNull();
  expect(screen.getByLabelText("Quota")).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Education & Work" }));
  expect(screen.getByLabelText("12th marks")).toBeTruthy();
  expect(screen.getByLabelText("Medium of Instruction")).toBeTruthy();
});
test("password can be generated, revealed and hidden without saving stale text", async () => {
  Object.defineProperty(window, "crypto", { configurable: true, value: { getRandomValues: values => require("crypto").randomFillSync(values) } });
  await openProfile();
  fireEvent.click(screen.getByRole("tab", { name: "Additional Details" }));
  const input = screen.getByLabelText("Password (write-only, optional)");
  expect(input.type).toBe("password");
  fireEvent.click(screen.getByRole("button", { name: "Generate password" }));
  expect(input.type).toBe("text");
  expect(input.value.length).toBeGreaterThanOrEqual(16);
  const password = input.value;
  fireEvent.click(screen.getByTitle("Hide password"));
  expect(input.type).toBe("password");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(ep1.post.mock.calls.at(-1)[1].password).toBe(password));
});
test("photo AWS upload shows progress and blocks saving until the uploaded link is available", async () => {
  await openProfile();
  fireEvent.click(screen.getByRole("tab", { name: "Identity" }));
  let complete;
  ep1.post.mockImplementation((url, _, config) => {
    if (url.endsWith("upload")) { config.onUploadProgress({ loaded: 50, total: 100 }); return new Promise(resolve => { complete = resolve; }); }
    return Promise.resolve({ data: { data: { _id: "lead1" } } });
  });
  const file = new File(["photo"], "photo.png", { type: "image/png" });
  fireEvent.change(screen.getByText("Upload photo to AWS").querySelector("input"), { target: { files: [file] } });
  expect(screen.getByText("50% uploaded")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Uploading..." }).disabled).toBe(true);
  await act(async () => { complete({ data: { url: "https://example.com/photo.png" } }); });
  expect(screen.getByLabelText("Photo link").value).toBe("https://example.com/photo.png");
  expect(screen.getByAltText("Lead").getAttribute("src")).toBe("https://example.com/photo.png");
});
test("lead documents selected from the master are included in the saved lead", async () => {
  await openProfile();
  fireEvent.click(screen.getByRole("tab", { name: "Documents" }));
  fireEvent.mouseDown(screen.getByLabelText("Document type"));
  fireEvent.click(await screen.findByRole("option", { name: "Marksheet" }));
  fireEvent.change(screen.getByLabelText("Document link"), { target: { value: "https://example.com/marks.pdf" } });
  fireEvent.click(screen.getByRole("button", { name: "Add link" }));
  expect(screen.getByRole("link", { name: "Marksheet" }).getAttribute("href")).toBe("https://example.com/marks.pdf");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(ep1.post.mock.calls.at(-1)[1].documents).toEqual([expect.objectContaining({ documentname: "Marksheet", url: "https://example.com/marks.pdf" })]));
});
test("admission office ID and campus counsellor email auto-populate from selections", async () => {
  await openProfile();
  ep1.get.mockImplementation(async url => ({ data: { data: url.includes("admissionoffice") ? [{ _id: "office1", name: "Main office" }] : [{ _id: "staff1", name: "Campus staff", email: "campus@example.com" }] } }));
  fireEvent.mouseDown(screen.getByLabelText("Admission office"));
  fireEvent.click(await screen.findByRole("option", { name: "Main office" }));
  expect(screen.getByLabelText("Admission office ID").value).toBe("office1");
  expect(screen.getByLabelText("Admission office ID").readOnly).toBe(true);
  fireEvent.mouseDown(screen.getByLabelText("Campus counsellor"));
  fireEvent.click(await screen.findByRole("option", { name: /Campus staff/ }));
  expect(screen.getByLabelText("Campus counsellor email").value).toBe("campus@example.com");
});
test.each([
  ["pipeline", "Change pipeline stage", "Pipeline", "Interested"],
  ["type", "Change type", "Type", "Walk-in"],
  ["source", "Change source", "Source", "Website"],
  ["counselloremail", "Assign counsellor", "Counsellor", "staff@example.com"],
  ["admissionstatus", "Change admission status", "New value", "Admitted"],
  ["active", "Change Active", "New value", "No"]
])("bulk %s sends only the selected leads and chosen update", async (field, button, input, value) => {
  ep1.post.mockResolvedValue({ data: { modified: 2 } });
  render(<Crm2Page />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalledTimes(1));
  act(() => DataGrid.mock.calls.at(-1)[0].onRowSelectionModelChange(["lead1", "lead2"]));
  ep1.get.mockResolvedValue({ data: { data: [{ _id: "option1", name: value, ...(field === "counselloremail" ? { email: value } : {}) }] } });
  fireEvent.click(screen.getByRole("button", { name: button }));
  fireEvent.mouseDown(screen.getByLabelText(input));
  fireEvent.click(await screen.findByRole("option", { name: field === "counselloremail" ? new RegExp(value) : value }));
  fireEvent.click(screen.getByRole("button", { name: "Apply to selected leads" }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledTimes(1));
  expect(ep1.post.mock.calls[0][0]).toBe("/api/v2/crm2/leads/bulk-update");
  expect(ep1.post.mock.calls[0][1]).toMatchObject({ ids: ["lead1", "lead2"], field, value });
  await screen.findByText("2 leads updated");
});
jest.mock("./AiImageFieldExtractor", () => () => null);
