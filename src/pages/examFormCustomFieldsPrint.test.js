import { customFieldsPrintHtml } from "./examFormCustomFieldsPrint";

test("prints every tab in order with labels and current values, including zero and false", () => {
  const tabs = [{ title: "Second", order: 2, fields: [{ fieldname: "notes", label: "Notes" }] }, { title: "First", order: 1, fields: [{ fieldname: "zero", label: "Count" }, { fieldname: "false", label: "Consent" }, { fieldname: "missing", label: "Missing" }] }];
  const html = customFieldsPrintHtml(tabs, { zero: 0, false: false, notes: "Line one\nLine two" });
  expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
  expect(html).toContain(">0</td>");
  expect(html).toContain(">false</td>");
  expect(html).toContain(">-</td>");
  expect(html).toContain("Line one\nLine two");
  expect(tabs[0].title).toBe("Second");
});
test("escapes custom labels and values rather than executing document HTML", () => {
  const html = customFieldsPrintHtml([{ title: "<script>", fields: [{ fieldname: "x", label: "<img>" }] }], { x: ["<script>", "A&B"] });
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;img&gt;");
  expect(html).toContain("&lt;script&gt;, A&amp;B");
});
test("handles forms without configured fields", () => {
  expect(customFieldsPrintHtml()).toContain("No custom fields configured");
});
