/* eslint-disable testing-library/no-node-access -- Verify generated printable HTML structure. */
import React from "react";
import { render, screen } from "@testing-library/react";
import Print, { admitCard4Markup, admitCard4aMarkup, splitAdmitCard4Courses } from "./AdmitCard4Print";
const ticket = { institution: { institutionname: "Dynamic Institution", address: "Campus Address", logolink: "https://example.com/logo.png" }, student: { name: "Student Name", regno: "R1", photo: "https://example.com/photo.png" }, studentSignature: { signaturelink: "https://example.com/signature.png" }, exam: { examname: "Dynamic Exam", type: "Regular" }, programMaster: { program: "Dynamic Program" }, rows: [{ coursecode: "T1", papertype: "Theory", semester: "5", examdate: "2026-12-01", examslot: "AM" }, { coursecode: "P1", coursetype: "Practical", semester: "5", batch: "A", examdate: "2026-12-02", examslot: "PM" }, { coursecode: "V1", papertype: "Viva" }] };
test("splits theory and practical/viva using the course type", () => {
  const split = splitAdmitCard4Courses(ticket.rows);
  expect(split.theory.map(row => row.coursecode)).toEqual(["T1"]);
  expect(split.practical.map(row => row.coursecode)).toEqual(["P1", "V1"]);
});
test("uses institution, User photo, stored student signature and dynamic names", () => {
  render(<Print ticket={ticket} />);
  expect(screen.getByText("Dynamic Institution")).toBeTruthy();
  expect(screen.getByText("Campus Address")).toBeTruthy();
  expect(screen.getByText(/Dynamic Program Semester - V/)).toBeTruthy();
  expect(screen.getByAltText("Student photo").src).toBe(ticket.student.photo);
  expect(screen.getByAltText("Student signature").src).toBe(ticket.studentSignature.signaturelink);
  expect(document.querySelector(".admit4-theory").textContent).not.toContain("P1");
  expect(document.querySelector(".admit4-practical").textContent).toContain("P1");
});
test("escapes source data and bulk cards remain sibling pages", () => {
  expect(admitCard4Markup({ ...ticket, student: { name: "<script>bad</script>" } })).not.toContain("<script>");
  render(<Print tickets={[ticket, ticket]} />);
  const cards = document.querySelectorAll(".admit4-card");
  expect(cards.length).toBe(2);
  expect(cards[0].parentElement).toBe(cards[1].parentElement);
});
test('4a moves exam name above identity and places exam code in the box', () => {
  const html = admitCard4aMarkup({ ...ticket, exam: { ...ticket.exam, examcode: 'EX2026' } });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('h1').nextElementSibling.textContent).toBe('(An Autonomous Institution)');
  expect(doc.querySelector('.admit4-program').textContent).toBe('Dynamic Exam');
  expect(doc.querySelector('.admit4-exam').textContent).toBe('Exam CodeEX2026');
  expect(doc.body.textContent).not.toContain('Dynamic Program Semester');
  expect(admitCard4Markup(ticket)).not.toContain('(An Autonomous Institution)');
});
test('4a prints master course codes in both tables without substituting ordinary codes', () => {
  const doc = new DOMParser().parseFromString(admitCard4aMarkup({ ...ticket, rows: ticket.rows.map((row, index) => ({ ...row, coursemastercode: index === 2 ? '' : `MASTER${index}` })) }), 'text/html');
  expect(doc.querySelector('.admit4-theory .paper-row td').textContent).toBe('MASTER0');
  expect(doc.querySelector('.admit4-practical .paper-row td').textContent).toBe('MASTER1');
  expect(doc.querySelectorAll('.admit4-practical .paper-row')[1].firstElementChild.textContent).toBe(' (Viva)');
});
test('4a uses student-uploaded and coe-role signatures without changing original card', () => {
  const signed = { ...ticket, controllerSignature: { signaturelink: 'https://example.com/coe.png' } };
  render(<Print ticket={signed} variant="4a" />);
  expect(screen.getByAltText('Student signature').src).toBe(ticket.studentSignature.signaturelink);
  expect(screen.getByAltText('Controller of Examinations signature').src).toBe(signed.controllerSignature.signaturelink);
  expect(admitCard4Markup(signed)).not.toContain('coe.png');
});
