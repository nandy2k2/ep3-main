import { admitCard4cMarkup, admitCard4cStyles } from './AdmitCard4cPrint';
import { admitCard4bDocument } from './AdmitCard4bPrint';
const ticket = { institution: { institutionname: 'Test Institution', address: 'Campus' }, student: { name: '<Student>', regno: 'R1', abcid: 'ABC1', scholarnumber: 'SCH1' }, exam: { examname: 'Term End Exam' }, principalSignature: { signaturelink: 'https://example.com/principal.png' }, rows: [{ course: 'Theory Subject', coursemastercode: 'MASTER1', papertype: 'Theory', seatno: '2001' }, { course: 'Practical Subject', coursemastercode: 'MASTER2', papertype: 'Practical' }] };
test('4c matches the combined table and candidate declaration layout', () => {
  const doc = new DOMParser().parseFromString(admitCard4cMarkup(ticket), 'text/html');
  expect(doc.querySelectorAll('.c-subjects tbody tr')).toHaveLength(2);
  expect(doc.body.textContent).toContain('MASTER1');
  expect(doc.body.textContent).toContain('MASTER2');
  expect(doc.body.textContent).toContain('SCH1');
  expect(doc.body.textContent).toContain('ABC1');
  expect(doc.body.textContent).toContain('2001');
  expect(doc.body.textContent).toContain('College Stamp');
  expect(doc.body.textContent).toContain('Sign of Principal');
  expect(doc.querySelector('.c-principal img').getAttribute('src')).toBe('https://example.com/principal.png');
  expect(doc.querySelector('.c-identity').textContent).toContain('<Student>');
  expect(doc.querySelector('student')).toBeNull();
});
test('4c uses isolated one-page bulk print framing', () => {
  const html = admitCard4bDocument([ticket, ticket], admitCard4cMarkup, admitCard4cStyles, '4c');
  expect(html).toContain('<title>Admit card 4c</title>');
  expect(html.match(/<section class="admit4b-page">/g)).toHaveLength(2);
});
