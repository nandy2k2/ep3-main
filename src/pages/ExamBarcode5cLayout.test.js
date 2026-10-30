import { barcode5cDocument, barcode5cMarkup, barcode5cStyles } from './ExamBarcode5cLayout';
test('5c uses the sample fields, same SVG twice and original physical dimensions', () => {
  const svg = '<svg width="350" height="102" preserveAspectRatio="xMidYMid meet"></svg>';
  const html = barcode5cMarkup({ blockno: '1', seatno: '2001', regno: '202502100176', shortbarcode: '12345678', course: 'Language Through Literature-II', coursecode: 'AEC125', program: 'B.Sc. Biochemistry', semester: '2', examdate: '2026-04-13' }, svg);
  expect(html.split(svg)).toHaveLength(3);
  for (const value of ['2001', '202502100176', '12345678', 'AEC125', 'Language Through Literature-II', 'SEM 2', '13/04/2026']) expect(html).toContain(value);
  expect(barcode5cStyles).toContain('size:100mm 26mm');
  expect(barcode5cStyles).toContain('width:33mm!important;height:auto!important');
  expect(barcode5cDocument([], {})).toContain('Exam barcode 5c');
});
