import { supervisorGroups, supervisorMarkup } from './SupervisorSheet2Print';
const row = { _id: 'abcdef012345678901234567', seatno: '1001', shortbarcode: '12345678', blockno: '7', examroom: '101', examdate: '2026-10-23', examslot: '10:00 - 12:00', section: 'A' };
const data = { institution: { institutionname: 'Master Institution', address: 'Master address' }, exam: { examname: 'Theory exam', examcode: 'E1' }, course: { program: 'Pharmacy', programcode: 'P1', course: 'Chemistry', coursecode: 'C1' }, rows: [row] };
test('repeats the complete attendance and reverse-page boxes for every thirty students', () => {
  const rows = Array.from({ length: 31 }, (_, i) => ({ ...row, seatno: String(i + 1) }));
  const doc = new DOMParser().parseFromString(supervisorMarkup({ ...data, rows }), 'text/html');
  expect(doc.querySelectorAll('.ss-page')).toHaveLength(4);
  expect(doc.querySelectorAll('.ss-attendance tbody tr')).toHaveLength(60);
  expect(doc.querySelectorAll('.ss-sticker')).toHaveLength(16);
  expect(doc.querySelectorAll('.ss-seat-box')).toHaveLength(16);
  expect(doc.querySelectorAll('.ss-emergency tbody tr')).toHaveLength(6);
});
test('groups different rooms and slots separately', () => {
  expect(supervisorGroups([row, { ...row, examroom: '102' }, { ...row, examslot: 'PM' }])).toHaveLength(3);
});
test('autonomous heading is below institution name and supplementary columns are wider', () => {
  const doc = new DOMParser().parseFromString(supervisorMarkup(data), 'text/html');
  expect(doc.querySelector('.ss-brand h2').nextElementSibling.textContent).toBe('(An Autonomous Institution)');
  const cols = doc.querySelectorAll('.ss-attendance col');
  expect(Array.from(cols).slice(3, 8).every(col => col.style.width === '11.6%')).toBe(true);
  expect(cols[1].style.width).toBe('12%');
  expect(cols[8].style.width).toBe('12%');
  expect(Array.from(cols).reduce((sum, col) => sum + parseFloat(col.style.width), 0)).toBeCloseTo(100);
});
test('regno selection prints enrollment number with the requested column heading', () => {
  const doc = new DOMParser().parseFromString(supervisorMarkup({ ...data, rows: [{ ...row, regno: 'ENROLL-2026-001' }] }, 'regno'), 'text/html');
  expect(doc.querySelector('.ss-id').textContent).toBe('ENROLL-2026-001');
  expect(doc.querySelector('.ss-attendance thead').textContent).toContain('Enrollment no');
  expect(doc.querySelector('.ss-attendance thead').textContent).not.toContain('Seat No.');
});
test('uses the chosen identifier and dynamic institution, exam and block data', () => {
  for (const [field, value] of [['seatno', '1001'], ['_id', row._id], ['shortbarcode', '12345678']]) {
    const doc = new DOMParser().parseFromString(supervisorMarkup(data, field), 'text/html');
    expect(doc.querySelector('.ss-id').textContent).toBe(value);
    expect(doc.body.textContent).toContain('Master Institution');
    expect(doc.body.textContent).toContain('Theory exam');
    expect(doc.body.textContent).toContain('Block No.: 7');
  }
});
test('escapes data and does not fabricate missing seat numbers', () => {
  const markup = supervisorMarkup({ ...data, institution: { institutionname: '<script>bad</script>' }, rows: [{ ...row, seatno: '' }] });
  expect(markup).not.toContain('<script>');
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  expect(doc.querySelector('.ss-id').textContent).toBe('');
});
