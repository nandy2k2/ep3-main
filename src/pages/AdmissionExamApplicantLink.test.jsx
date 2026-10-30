import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LinkPanel, { applicantExamLoginUrl } from "./AdmissionExamApplicantLink";
import global1 from "./global1";
test("applicant login link uses the frontend origin and institution ID", () => {
  expect(applicantExamLoginUrl("https://campus.example.com", 42)).toBe("https://campus.example.com/admission-applicant-exam?colid=42");
  expect(applicantExamLoginUrl("https://campus.example.com", "")).toBe("https://campus.example.com/admission-applicant-exam");
});
test("visible applicant login button and copy action share the same URL", async () => {
  global1.colid = 42;
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<LinkPanel />);
  const url = `${window.location.origin}/admission-applicant-exam?colid=42`;
  expect(screen.getByRole("link", { name: "Open applicant login" }).getAttribute("href")).toBe(url);
  expect(screen.getByLabelText("Applicant exam login link").value).toBe(url);
  fireEvent.click(screen.getByRole("button", { name: "Copy login link" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(url));
});
