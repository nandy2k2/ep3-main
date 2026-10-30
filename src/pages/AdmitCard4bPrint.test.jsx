import { admitCard4bDocument } from './AdmitCard4bPrint';
test('4b retains 4a data and enlarges only its COE signature', () => {
  const html = admitCard4bDocument([{ student: { name: 'Student' }, controllerSignature: { signaturelink: 'https://example.com/coe.png' }, rows: [{ coursemastercode: 'MASTER1' }] }]);
  expect(html).toContain('MASTER1');
  expect(html).toContain('(An Autonomous Institution)');
  expect(html).toContain('https://example.com/coe.png');
  expect(html).toContain('height:20mm;width:65mm');
  expect(html).toContain('page.clientHeight-2');
  expect(html).toContain('@page{size:A4 portrait;margin:10mm}');
});
test('bulk output contains one separately fitted page per ticket', () => {
  const html = admitCard4bDocument([{}, {}, {}]);
  expect((html.match(/<section class="admit4b-page">/g) || []).length).toBe(3);
});
