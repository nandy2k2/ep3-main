import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Formatter, { formattedBarcodeHtml } from "./ExamBarcodeDynamicFormatter";
import ep1 from "../api/ep1";
jest.mock("../api/ep1", () => ({ get: jest.fn(), post: jest.fn() }));
const layout = { barcode: { x: 66, y: 1 }, texts: [{ field: "regno", x: 2, y: 2, width: 61, font: 9, align: "left", bold: true }] };
const rows = [{ _id: "r1", stickerid: "r1-1", regno: "<script>alert(1)</script>", barcodeSection: "Section 1" }];
const barcodeMap = { "r1-1": '<svg viewBox="0 0 200 100"><rect width="2" height="90" /></svg>' };
test("formatted HTML keeps the original SVG and escapes student text", () => {
  const html = formattedBarcodeHtml(rows, barcodeMap, layout);
  expect(html).toContain(barcodeMap["r1-1"]);
  expect(html).not.toContain("<script>alert(1)</script>");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("size:100mm 26mm");
  expect(html).toContain("width:33mm!important;height:auto!important");
});
test("formatting passes selected provider, model, prompt and scoped record IDs", async () => {
  ep1.get.mockResolvedValue({ data: { models: {} } });
  ep1.post.mockResolvedValue({ data: { layout } });
  render(<Formatter rows={rows} barcodeMap={barcodeMap} />);
  fireEvent.change(screen.getByLabelText("Formatting prompt"), { target: { value: "Right align metadata" } });
  fireEvent.click(screen.getByRole("button", { name: "Format generated barcodes" }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith("/api/v2/conductexam/barcode-ai-format", expect.objectContaining({ ids: ["r1"], provider: "Gemini", model: "gemini-2.5-flash", prompt: "Right align metadata" })));
  expect(await screen.findByTitle("AI formatted barcode labels")).toBeTruthy();
});
