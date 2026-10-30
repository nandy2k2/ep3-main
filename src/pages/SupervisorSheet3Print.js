const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function supervisor3Groups(rows) {
  const groups = new Map();
  rows.forEach(row => {
    const key = JSON.stringify([row.examdate, row.examslot, row.campus, row.building, row.examroom, row.blockno, row.section]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.values()].flatMap(list => {
    const sorted = [...list].sort((a, b) => String(a.examseatno || a.seatno || a.regno || '').localeCompare(String(b.examseatno || b.seatno || b.regno || ''), undefined, { numeric: true }));
    return Array.from({ length: Math.ceil(sorted.length / 36) }, (_, i) => ({ rows: sorted.slice(i * 36, i * 36 + 36) }));
  });
}
export const supervisor3Styles = `
@page{size:A4 portrait;margin:5mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white;color:black;font-family:Arial,sans-serif}
.s3-page{width:200mm;height:286mm;position:relative;overflow:hidden;background:white;break-after:page;page-break-after:always;font-size:8pt}
.s3-page:last-child{break-after:auto;page-break-after:auto}
.s3-head{position:relative;min-height:16mm;text-align:center;padding:1mm 18mm}
.s3-head img{position:absolute;left:2mm;top:0;width:17mm;height:14mm;object-fit:contain}
.s3-head h1{font-size:11pt;margin:0 0 2mm}.s3-head p{font-size:9pt;margin:0}.s3-address{font-size:7pt;margin-bottom:1mm}
.s3-meta{border:1px solid black;display:grid;grid-template-columns:1.4fr 1.5fr 1fr;gap:2mm;padding:1.5mm;margin-bottom:1.5mm;font-size:8pt}
.s3-meta-bottom{grid-column:1/-1;display:flex;justify-content:space-between;gap:2mm}
.s3-table{width:100%;border-collapse:collapse;table-layout:fixed}
.s3-table th,.s3-table td{border:1px solid black;text-align:center;padding:.5mm;overflow-wrap:anywhere}
.s3-table th{font-size:7.5pt;line-height:1.2}.s3-table thead tr:first-child{height:8mm}.s3-table thead tr:nth-child(2){height:6mm}.s3-table thead tr:last-child{height:5mm}
.s3-table tbody tr{height:5.3mm}.s3-table td{font-size:7.5pt;line-height:1.1}
.s3-footer{position:absolute;bottom:0;left:0;right:0;font-size:8pt;font-weight:bold}
.s3-totals{display:flex;justify-content:space-between;gap:4mm;margin-bottom:5mm}
.s3-signatures{display:flex;justify-content:space-between;gap:3mm;align-items:end}
@media print{html,body{width:200mm;margin:0!important;padding:0!important}.s3-page{margin:0!important}}
`;
export function supervisor3Markup(data, identifier = 'seatno') {
  const institution = data.institution || {};
  const labels = { seatno: 'Candidate Seat No', regno: 'Enrollment no', _id: 'MongoDB code', shortbarcode: 'Shortcode' };
  const value = row => identifier === 'seatno' ? row.examseatno || row.seatno || '' : row[identifier] || '';
  return supervisor3Groups(data.rows || []).map((group, index) => {
    const first = group.rows[0], last = group.rows[group.rows.length - 1];
    const date = first.examdate ? new Date(first.examdate) : null;
    const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '';
    return `<article class="s3-page"><header class="s3-head">${/^https?:\/\//i.test(institution.logolink || '') ? `<img src="${escape(institution.logolink)}" alt="Institution logo">` : ''}<h1>${escape(institution.institutionname)}</h1>${institution.address ? `<div class="s3-address">${escape(institution.address)}</div>` : ''}<p>Jr. Supervisor Report</p></header>
    <div class="s3-meta"><div>DATE OF EXAM : ${escape(dateLabel)}</div><div>SESSION : ${escape(data.exam?.examname || data.exam?.exam || first.exam)}</div><div>TIME : ${escape(first.examslot)}</div><div class="s3-meta-bottom"><span>SEAT NOS : ${escape(value(first))}${group.rows.length > 1 ? ` - ${escape(value(last))}` : ''}</span><span>Sr. No : ${index + 1}</span><span>Room No : ${escape(first.examroom)}</span><span>Block No : ${escape(first.blockno)}</span></div></div>
    <table class="s3-table"><colgroup>${[12,17,12,7,7,7,8,12,9,9].map(width => `<col style="width:${width}%">`).join('')}</colgroup><thead>
    <tr><th rowspan="2">${labels[identifier] || labels.seatno}</th><th rowspan="2">ANS No : As per the<br>Barcode Sticker</th><th rowspan="2">Subject Code</th><th colspan="4">Supplementary Detail</th><th rowspan="2">Total Number<br>of Answer<br>Sheets</th><th rowspan="2">Total<br>Number of<br>Pages</th><th rowspan="2">Candidate<br>Signature</th></tr>
    <tr><th>First</th><th>Second</th><th>Third</th><th>Total</th></tr><tr>${['1','2','3','4','5','6','(4+5+6)','(2+7) =8','9','10'].map(item => `<th>${item}</th>`).join('')}</tr></thead><tbody>
    ${group.rows.map(row => `<tr><td>${escape(value(row))}</td><td>${escape(row.shortbarcode)}</td><td>${escape(row.coursecode || data.course?.coursecode)}</td>${Array.from({ length: 7 }, () => '<td></td>').join('')}</tr>`).join('')}
    </tbody></table><footer class="s3-footer"><div class="s3-totals"><span>Total Used Main Answer sheet (Column - 2): ______</span><span>Total Used Supplementary (Column - 7): __________</span></div><div class="s3-signatures"><span>Name of Invigilator: _________________________</span><span>Mob no: ________</span><span>Sign: ___________</span><span>Date: __ / __ / ____</span></div></footer></article>`;
  }).join('');
}
