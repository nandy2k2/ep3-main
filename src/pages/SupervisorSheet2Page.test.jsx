import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './SupervisorSheet2Page';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./global1', () => ({ colid: 42 }));
const exam = { _id: 'e', academicyear: '2026-27', examname: 'Term End', examcode: 'E1' };
const course = { _id: 'c', program: 'Pharmacy', programcode: 'P1', course: 'Chemistry', coursecode: 'C1' };
beforeEach(() => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/exams') ? { data: [exam] } : url.endsWith('/examcourses') ? { data: [course] } : url.endsWith('/examrolls') ? { data: [{ _id: 'roll1', seatno: '1' }] } : [{ institutionname: 'Master Institution' }] }));
});
async function select(label, text) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(await screen.findByRole('option', { name: text }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: label })).not.toBeDisabled());
}
test('cascades source masters, automatically fills codes and only loads rolls on request', async () => {
  render(<Page />);
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Academic year' })).not.toBeDisabled());
  expect(ep1.get.mock.calls.some(([url]) => url.endsWith('/examrolls'))).toBe(false);
  await select('Academic year', '2026-27');
  await select('Exam', 'Term End (E1)');
  expect(screen.getByLabelText('Exam code').value).toBe('E1');
  await select('Program', 'Pharmacy (P1)');
  expect(screen.getByLabelText('Program code').value).toBe('P1');
  await select('Course', 'Chemistry (C1)');
  expect(screen.getByLabelText('Course code').value).toBe('C1');
  fireEvent.click(screen.getByRole('button', { name: 'Load sheet' }));
  await screen.findByTitle('Supervisor sheet print preview');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/conductexam/examrolls', expect.objectContaining({ params: { colid: 42, academicyear: '2026-27', examcode: 'E1', program: 'Pharmacy', programcode: 'P1', course: 'Chemistry', coursecode: 'C1' } }));
  expect(ep1.get).toHaveBeenCalledWith('/api/institution', { params: { colid: 42 } });
});
