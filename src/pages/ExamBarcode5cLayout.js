const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const barcode5cStyles = `
  @page{size:100mm 26mm;margin:0}
  html,body{margin:0;padding:0;background:white}
  .b5c-label{width:100mm;height:26mm;position:relative;box-sizing:border-box;overflow:hidden;background:white;color:black;font-family:Arial,Helvetica,sans-serif;break-after:page;page-break-after:always}
  .b5c-label:last-child{break-after:auto;page-break-after:auto}
  .b5c-label *{box-sizing:border-box}
  .b5c-left{position:absolute;left:1.8mm;top:.5mm;width:63mm;height:25mm;display:grid;grid-template-rows:repeat(4,2.4mm) 15.4mm;text-align:center;align-items:center;justify-items:center}
  .b5c-line{font-size:2.3mm;line-height:1;font-weight:900;white-space:nowrap}
  .b5c-right{position:absolute;left:66mm;top:.5mm;width:33mm;height:25mm;border-left:.15mm dashed black;padding-left:.6mm;display:grid;grid-template-rows:5mm 15mm 5mm;align-items:center}
  .b5c-heading,.b5c-course{font-size:1.5mm;line-height:1.1;overflow-wrap:anywhere}
  .b5c-code{display:flex;justify-content:center;align-items:center;width:33mm;max-height:18.2mm}
  .b5c-code svg{width:33mm!important;height:auto!important;max-height:18.2mm!important;display:block;shape-rendering:crispEdges;flex-shrink:0}
  .b5c-right .b5c-code{margin-left:-.6mm}
`;
export function barcode5cMarkup(row, svg) {
  const date = row.examdate && !Number.isNaN(new Date(row.examdate).getTime()) ? new Date(row.examdate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '';
  const seat = row.examseatno && String(row.examseatno) !== String(row._id) ? row.examseatno : row.seatno || '';
  return `<div class="b5c-label"><div class="b5c-left">
    <div class="b5c-line">${escape(row.blockno || '-')} :Block No</div>
    <div class="b5c-line">${escape(seat || '-')} :Seat No</div>
    <div class="b5c-line">${escape(row.regno || '-')} :Enroll No</div>
    <div class="b5c-line">${escape(row.shortbarcode)} :ANS NO.</div>
    <div class="b5c-code">${svg}</div></div>
    <div class="b5c-right"><div class="b5c-heading">${escape(date)} ${escape(row.program)}<br>${row.semester ? `SEM ${escape(row.semester)}` : ''}</div>
    <div class="b5c-code">${svg}</div><div class="b5c-course">${escape(row.course)}<br>${escape(row.coursecode)}</div></div></div>`;
}
export function barcode5cDocument(rows, barcodeMap) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Exam barcode 5c</title><style>${barcode5cStyles}</style></head><body>${rows.map(row => barcode5cMarkup(row, barcodeMap[row.stickerid] || '')).join('')}</body></html>`;
}
