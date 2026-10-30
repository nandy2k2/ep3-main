import React from "react";
const escape = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const imageUrl = value => /^(https?:\/\/|data:image\/)/i.test(String(value || "")) ? escape(value) : "";
const date = value => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" });
};
const roman = value => ({ 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" }[value] || value);
export const splitAdmitCard4Courses = rows => ({
  theory: rows.filter(row => !/practical|viva/i.test(row.papertype || row.coursetype || "Theory")),
  practical: rows.filter(row => /practical|viva/i.test(row.papertype || row.coursetype || "Theory"))
});
export function admitCard4Markup(ticket, variant = '4') {
  if (!ticket) return "";
  const student = ticket.student || {}, institution = ticket.institution || {}, exam = ticket.exam || {}, rows = ticket.rows || [];
  const first = rows[0] || {}, split = splitAdmitCard4Courses(rows);
  const is4a = variant === '4a';
  const examName = exam.examname || exam.exam || first.exam || '';
  const semesters = [...new Set(rows.map(row => row.semester).filter(Boolean))];
  const program = ticket.programMaster?.program || ticket.programMaster?.name || first.program || student.program || "";
  const logo = imageUrl(institution.logolink || institution.logo), photo = imageUrl(student.photo || student.photolink || student.profilephoto), signature = imageUrl(ticket.studentSignature?.signaturelink);
  const controllerSignature = is4a ? imageUrl(ticket.controllerSignature?.signaturelink) : '';
  const tableRows = (list, practical, minimum) => Array.from({ length: Math.max(list.length, minimum) }, (_, index) => {
    const row = list[index];
    return `<tr class="paper-row"><td>${escape((is4a ? row?.coursemastercode : row?.coursecode) || "")}${row && /viva/i.test(row.papertype || row.coursetype) ? " (Viva)" : ""}</td>${practical ? `<td>${escape(row?.batch || "")}</td>` : ""}<td>${escape(date(row?.examdate))}</td><td>${escape(row?.examslot || "")}</td><td></td></tr>`;
  }).join("");
  return `<article class="admit4-card${is4a ? ' admit4a-card' : ''}">
    <div class="admit4-header"><div>${logo ? `<img class="admit4-logo" src="${logo}" alt="Institution logo">` : ""}</div><div class="admit4-institution"><h1>${escape(institution.institutionname || "")}</h1>${is4a ? '<div class="admit4a-autonomous">(An Autonomous Institution)</div>' : ''}<div>${escape(institution.address || "")}</div><h2>HALL TICKET</h2></div><div class="admit4-exam">${is4a ? `Exam Code<br>${escape(exam.examcode || first.examcode || '')}` : `${escape(examName)}<br>EXAMINATION`}</div></div>
    <div class="admit4-profile"><div><div class="admit4-program">${is4a ? escape(examName) : `${escape(program)} Semester - ${escape((semesters.length ? semesters : [student.semester || ""]).map(roman).join(", "))}${exam.type ? ` (${escape(exam.type)})` : ""}`}</div><table class="admit4-identity"><tbody><tr><td>Student Name:</td><td>${escape(student.name || first.student)}</td></tr><tr><td>Enrolment No.:</td><td>${escape(student.regno || first.regno)}</td></tr></tbody></table></div><div class="admit4-photo-sign"><div class="admit4-photo">${photo ? `<img src="${photo}" alt="Student photo">` : "Passport<br>size Photo"}</div><div class="admit4-sign">${signature ? `<img src="${signature}" alt="Student signature">` : "Student Sign"}</div></div></div>
    <table class="admit4-table admit4-theory"><colgroup><col style="width:18%"><col style="width:22%"><col style="width:29%"><col style="width:31%"></colgroup><thead><tr><th colspan="4" class="admit4-table-title">TERM END THEORY EXAMINATION:</th></tr><tr><th>Course Code</th><th>Examination Date</th><th>Examination Time</th><th>Signature of Jr. Supervisor</th></tr></thead><tbody>${tableRows(split.theory, false, 8)}<tr><td colspan="4" class="admit4-notes">1. Students will have to take their seats in examination hall before 30 minutes of theory exam start time.<br>2. Students will be allowed to enter in the examination hall only up to 10 minutes after the exam start time.<br>3. Students will be allowed to leave the examination hall only after an hour of exam start time.</td></tr></tbody></table>
    <table class="admit4-table admit4-practical"><colgroup><col style="width:18%"><col style="width:10%"><col style="width:18%"><col style="width:23%"><col style="width:31%"></colgroup><thead><tr><th colspan="5" class="admit4-table-title">TERM END PRACTICAL EXAMINATION:</th></tr><tr><th>Course Code</th><th>Batch</th><th>Examination<br>Date</th><th>Examination Time</th><th>Signature of Examiner</th></tr></thead><tbody>${tableRows(split.practical, true, 6)}<tr><td colspan="5" class="admit4-notes">All the students are instructed to remain present 30 minutes prior to the scheduled time at concerned laboratory.</td></tr><tr><td colspan="5" class="admit4-controller">${controllerSignature ? `<div><img class="admit4-coe-signature" src="${controllerSignature}" alt="Controller of Examinations signature"></div>` : ''}Controller of Examinations</td></tr></tbody></table>
  </article>`;
}
export const admitCard4Styles = `
  .admit4-card{width:186mm;max-width:100%;margin:0 auto 8mm;background:white;color:black;font-family:"Times New Roman",serif;font-size:11pt;line-height:1.12;box-sizing:border-box;padding:0}
  .admit4-card *{box-sizing:border-box;color:#000}.admit4-header{display:grid;grid-template-columns:25mm 1fr 36mm;gap:3mm;align-items:start;min-height:28mm}.admit4-logo{width:22mm;height:26mm;object-fit:contain}.admit4-institution{text-align:center}.admit4-institution h1{font-size:18pt;margin:0 0 1mm;line-height:1.1}.admit4-institution h2{font-size:17pt;margin:3mm 0 0}.admit4-exam{border:1px solid black;text-align:center;padding:1mm;font-size:11pt;margin-top:5mm;overflow-wrap:anywhere}
  .admit4-profile{display:grid;grid-template-columns:1fr 32mm;gap:10mm;margin-bottom:5mm;align-items:start}.admit4-program{text-align:center;font-size:12pt;margin:3mm 0 5mm}.admit4-identity{width:100%;border-collapse:collapse}.admit4-identity td{border:1px solid black;height:11mm;padding:1.5mm;overflow-wrap:anywhere}.admit4-identity td:first-child{width:35mm}.admit4-photo-sign{width:31mm}.admit4-photo{border:1px solid black;width:31mm;height:31mm;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif;font-size:10pt}.admit4-photo img{width:100%;height:100%;object-fit:contain}.admit4-sign{width:31mm;height:9mm;margin-top:2mm;border:1px solid black;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;font-size:9pt}.admit4-sign img{max-width:100%;max-height:100%;object-fit:contain}
  .admit4-table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0 0 5mm}.admit4-table th,.admit4-table td{border:1px solid black;text-align:left;font-weight:normal;padding:.8mm 1.5mm;overflow-wrap:anywhere;vertical-align:middle}.admit4-table th{height:6mm}.admit4-table-title{font-size:12pt;height:8mm!important}.admit4-table .paper-row{height:8mm}.admit4-notes{font-size:10pt;line-height:1.12}.admit4-controller{height:24mm;text-align:right!important;vertical-align:bottom!important;padding:0 2mm 5mm!important}.admit4-table thead{display:table-header-group}.admit4-table tr{break-inside:avoid}
  @media print{@page{size:A4 portrait;margin:12mm}body{margin:0}.no-print{display:none!important}.admit4-card{width:186mm;max-width:100%;margin:0;break-after:page;page-break-after:always}.admit4-card:last-child{break-after:auto;page-break-after:auto}}
`;
export const admitCard4aMarkup = ticket => admitCard4Markup(ticket, '4a');
export const admitCard4aStyles = `.admit4a-card .admit4-institution h2{font-size:13pt;margin-top:2mm}.admit4a-autonomous{font-size:11pt;margin:0 0 1mm}.admit4a-card .admit4-notes{text-align:left!important}.admit4a-card .admit4-header{min-height:31mm}.admit4-coe-signature{height:10mm;max-width:45mm;object-fit:contain}`;
export default function AdmitCard4Print({ ticket, tickets = [], variant = '4' }) {
  const all = tickets.length ? tickets.map(item => item.ticket || item) : ticket ? [ticket] : [];
  if (!all.length) return null;
  return <div id="admit4-print"><style>{`${admitCard4Styles}${admitCard4aStyles}@media print{body *{visibility:hidden}#admit4-print,#admit4-print *{visibility:visible}#admit4-print{position:absolute;left:0;top:0;width:186mm}}`}</style><div dangerouslySetInnerHTML={{ __html: all.map(item => admitCard4Markup(item, variant)).join("") }} /></div>;
}
