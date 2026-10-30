import { studentDobValue, studentDobInputValue } from './studentDobValue';
test('preserves typed birth dates and empty optional values', () => {
  expect(studentDobValue(' 2004-09-18 ')).toBe('2004-09-18');
  expect(studentDobValue('18/09/2004')).toBe('18/09/2004');
  expect(studentDobValue(null)).toBe('');
});
test('formats Excel date cells and serial dates without timezone conversion', () => {
  expect(studentDobValue(new Date('2004-09-18T00:00:00Z'))).toBe('2004-09-18');
  expect(studentDobValue(45292)).toBe('2024-01-01');
  expect(studentDobValue(1, true)).toBe('1904-01-02');
});
test('calendar values support existing ISO and day-first dates without shifting the day', () => {
  expect(studentDobInputValue('2004-09-18')).toBe('2004-09-18');
  expect(studentDobInputValue('18/09/2004')).toBe('2004-09-18');
  expect(studentDobInputValue('18-9-2004')).toBe('2004-09-18');
  expect(studentDobInputValue('2004-09-18T00:00:00.000Z')).toBe('2004-09-18');
  expect(studentDobInputValue('31/02/2004')).toBe('');
  expect(studentDobInputValue('')).toBe('');
});
