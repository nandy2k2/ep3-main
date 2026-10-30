import { supervisor3Groups, supervisor3Markup } from './SupervisorSheet3Print';
const row = { seatno: '2001', shortbarcode: '12345678', coursecode: 'AEC125', examdate: '2026-04-13', examslot: '11:30 AM - 12:30 PM', examroom: '1', blockno: '1', regno: 'REG1' };
const data = { institution: { institutionname: 'Institution', address: 'Campus' }, exam: { examname: 'ESE APRIL' }, rows: [row] };
test('3 prints the ten-column sample with stored barcode answer numbers', () => {
  const doc = new DOMParser().parseFromString(supervisor3Markup(data), 'text/html');
  expect(doc.querySelectorAll('tbody tr td')).toHaveLength(10);
  expect(doc.querySelector('tbody tr').textContent).toContain('12345678');
  expect(doc.querySelector('tbody tr').textContent).toContain('AEC125');
  expect(doc.body.textContent).toContain('Jr. Supervisor Report');
  expect(doc.body.textContent).toContain('Total Used Supplementary');
});
test('36 students per page, splitting rooms and repeating headers and footers', () => {
  const rows = Array.from({ length: 37 }, (_, i) => ({ ...row, seatno: String(2001 + i) }));
  expect(supervisor3Groups(rows)).toHaveLength(2);
  expect(supervisor3Groups([row, { ...row, blockno: '2' }])).toHaveLength(2);
  const doc = new DOMParser().parseFromString(supervisor3Markup({ ...data, rows }), 'text/html');
  expect(doc.querySelectorAll('.s3-page')).toHaveLength(2);
  expect(doc.querySelectorAll('footer')).toHaveLength(2);
  expect(doc.querySelectorAll('tbody tr')).toHaveLength(37);
});
test('regno identifier uses Enrollment no and safely escapes input', () => {
  const html = supervisor3Markup({ ...data, rows: [{ ...row, regno: '<REG1>' }] }, 'regno');
  expect(html).toContain('Enrollment no'); expect(html).toContain('&lt;REG1&gt;');
});
