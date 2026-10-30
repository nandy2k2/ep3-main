import React from 'react';
import AdmitCard4bPrint from './AdmitCard4bPrint';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const image = (url, label, cls = '') => /^https?:\/\/|^data:image\//i.test(String(url || '')) ? `<img class="${cls}" src="${esc(url)}" alt="${label}">` : '';
const examDate = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '';
};
export function admitCard4cMarkup(ticket) {
  const institution = ticket.institution || {}, student = ticket.student || {}, exam = ticket.exam || {}, rows = ticket.rows || [], first = rows[0] || {};
  const program = ticket.programMaster?.displayname || ticket.programMaster?.program || first.program || student.program || '';
  const semesters = [...new Set(rows.map(row => row.semester).filter(Boolean))].join(', ') || student.semester || '';
  const validDate = rows.find(row => row.examdate && !Number.isNaN(new Date(row.examdate).getTime()))?.examdate;
  const month = validDate ? new Date(validDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
  return `<article class="admit4-card admit4c-card">
    <header class="c-head">${image(institution.logolink, 'Institution logo', 'c-logo')}<h1>${esc(institution.institutionname)}</h1><p>${esc(institution.address)}</p><h2>${esc(exam.examname || exam.exam || first.exam)}</h2><div class="c-title">Admit Card</div></header>
    <div class="c-profile"><table class="c-info"><colgroup><col style="width:12%"><col style="width:23%"><col style="width:13%"><col style="width:17%"><col style="width:15%"><col style="width:20%"></colgroup><tbody>
    <tr><td>Program:</td><td>${esc(program)}</td><td>MONTH:</td><td>${esc(month)}</td><td>SEAT NO:</td><td>${esc(first.examseatno && String(first.examseatno) !== String(first._id) ? first.examseatno : first.seatno || '')}</td></tr>
    <tr><td>Class:</td><td>${esc(program)}${semesters ? ` SEM ${esc(semesters)}` : ''}</td><td>YEAR:</td><td>${esc(first.academicyear || exam.academicyear || student.academicyear)}</td><td>STUDENT ID:</td><td>${esc(student.scholarnumber || student.rollno || '')}</td></tr>
    </tbody></table><div class="c-photo-area"><div class="c-photo">${image(student.photo || student.photolink || student.profilephoto, 'Student photo')}</div><div class="c-student-sign">${image(ticket.studentSignature?.signaturelink, 'Student signature')}</div></div></div>
    <table class="c-identity"><colgroup><col style="width:18%"><col style="width:42%"><col style="width:18%"><col style="width:22%"></colgroup><tbody><tr><td rowspan="2">CANDIDATE NAME:</td><td rowspan="2">${esc(student.name || first.student)}</td><td>ENROLLMENT NO:</td><td>${esc(student.regno || first.regno)}</td></tr><tr><td>ABC ID NO:</td><td>${esc(student.abcid)}</td></tr></tbody></table>
    <table class="c-subjects"><colgroup><col style="width:7%"><col style="width:18%"><col style="width:29%"><col style="width:13%"><col style="width:18%"><col style="width:15%"></colgroup><thead><tr><th>SR. NO</th><th>EXAM DATE<br>&amp;<br>TIME</th><th>SUBJECTS</th><th>COURSE CODE</th><th>UNIQUE ID<br>AS PER BARCODE<br>STICKER</th><th>INVIGILATOR<br>SIGN</th></tr></thead><tbody>${rows.map((row, i) => `<tr><td>${i + 1}</td><td>${esc(examDate(row.examdate))}<br>${esc(row.examslot)}</td><td>${esc(row.coursemastercode || row.coursecode)}${row.course ? ` - ${esc(row.course)}` : ''}</td><td>${esc(row.coursemastercode || '')}</td><td></td><td></td></tr>`).join('')}</tbody></table>
    <table class="c-footer"><colgroup><col style="width:48%"><col style="width:25%"><col style="width:27%"></colgroup><tbody><tr><td class="c-declaration" rowspan="2"><div>Declaration by Candidate:<br>I have checked all the details mentioned above and noticed the schedule. Also, I assure that I abide by all rules and regulations mentioned in this Admit Card.</div><div class="c-candidate-sign">Candidate Signature: ${image(ticket.studentSignature?.signaturelink, 'Candidate signature')}</div></td><td class="c-certify" colspan="2">I certify that the Photograph and Signature on this Admit Card are of the correct candidate.</td></tr><tr><td class="c-sign-box"><div class="c-stamp-space"></div>College Stamp</td><td class="c-sign-box"><div class="c-principal">${image(ticket.principalSignature?.signaturelink, 'Principal signature')}</div>Sign of Principal</td></tr></tbody></table>
  </article>`;
}
export const admitCard4cStyles = `
  .admit4c-card{border:1.5px solid black;padding:2mm;font-family:Arial,sans-serif;font-size:9pt;line-height:1.3}
  .admit4c-card table{width:100%;border-collapse:collapse;table-layout:fixed}
  .admit4c-card td,.admit4c-card th{border:1px solid black;padding:1.2mm;overflow-wrap:anywhere;vertical-align:middle}
  .admit4c-card .c-head{position:relative;text-align:center;min-height:24mm;padding-left:19mm;padding-right:3mm}
  .admit4c-card .c-head h1{font-size:12pt;margin:0 0 1mm;font-weight:bold}
  .admit4c-card .c-head p{font-size:8pt;margin:0 0 2mm}
  .admit4c-card .c-head h2{font-size:13pt;margin:1mm 0;font-weight:bold}
  .admit4c-card .c-title{font-size:13pt;margin:0 0 3mm}
  .admit4c-card .c-logo{position:absolute;left:0;top:0;width:17mm;height:18mm;object-fit:contain}
  .admit4c-card .c-profile{display:grid;grid-template-columns:1fr 29mm;gap:4mm;align-items:center;margin-bottom:1.5mm}
  .admit4c-card .c-info tr{height:11mm}.admit4c-card .c-info{font-size:8.5pt}
  .admit4c-card .c-photo{height:25mm;border:1px solid black;padding:.5mm}
  .admit4c-card .c-photo img{width:100%;height:100%;object-fit:contain}
  .admit4c-card .c-student-sign{height:8mm;border:1px solid black;margin-top:2mm;text-align:center}
  .admit4c-card .c-student-sign img{max-width:100%;height:100%;object-fit:contain}
  .admit4c-card .c-identity{font-size:8.5pt;margin-bottom:2mm}.admit4c-card .c-identity tr{height:7mm}
  .admit4c-card .c-subjects{font-size:8pt;margin-bottom:2mm}.admit4c-card .c-subjects th{height:13mm;font-weight:bold;text-align:center}
  .admit4c-card .c-subjects tbody tr{height:9mm}.admit4c-card .c-subjects td:first-child,.admit4c-card .c-subjects td:nth-child(2){text-align:center}
  .admit4c-card .c-footer{font-size:9pt}.admit4c-card .c-declaration{position:relative;vertical-align:top;height:48mm;padding-bottom:12mm}
  .admit4c-card .c-candidate-sign{position:absolute;bottom:3mm;left:2mm;right:2mm;display:flex;align-items:end;gap:2mm}
  .admit4c-card .c-candidate-sign img{height:8mm;max-width:35mm;object-fit:contain}
  .admit4c-card .c-certify{height:20mm;text-align:center}.admit4c-card .c-sign-box{text-align:center;vertical-align:bottom}
  .admit4c-card .c-principal,.admit4c-card .c-stamp-space{height:23mm}
  .admit4c-card .c-principal img{width:100%;height:100%;object-fit:contain}
`;
export default function AdmitCard4cPrint({ tickets }) {
  return <AdmitCard4bPrint tickets={tickets} variant="4c" renderCard={admitCard4cMarkup} extraStyles={admitCard4cStyles} />;
}
