import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConductExamFinePage from './ConductExamFinePage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, user: 'admin@example.com' }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/x-data-grid', () => ({ DataGrid: () => null, GridToolbar: () => null }));
beforeEach(() => {
  ep1.get.mockReset(); ep1.post.mockReset();
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('-options') ? { academicyears: ['2026-27'], exams: [{ academicyear: '2026-27', examname: 'Final', examcode: 'EX1' }, { academicyear: '2025-26', examname: 'Old', examcode: 'OLD' }], programs: [{ program: 'Science', programcode: 'P1' }] } : { data: [] } }));
  ep1.post.mockResolvedValue({ data: { success: true } });
});
const choose = async (field, option) => { fireEvent.mouseDown(screen.getByLabelText(field)); fireEvent.click(await screen.findByRole('option', { name: option })); };
test('master dropdowns cascade, auto-select codes and save the fine rule', async () => {
  render(<ConductExamFinePage />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalled());
  await choose('Academic year', '2026-27');
  fireEvent.mouseDown(screen.getByLabelText('Exam'));
  expect(screen.queryByRole('option', { name: 'Old (OLD)' })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('option', { name: 'Final (EX1)' }));
  expect(screen.getByLabelText('Exam code')).toHaveValue('EX1');
  await choose('Program', 'Science (P1)');
  expect(screen.getByLabelText('Program code')).toHaveValue('P1');
  fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-31' } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
  await choose('Fine type', 'per day'); await choose('Course type', 'per course');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/conductexam/exam-fine', expect.objectContaining({ colid: 42, examcode: 'EX1', programcode: 'P1', finetype: 'per day', coursetype: 'per course', amount: '100' })));
});
test('add option opens the original master embedded without a menu', async () => {
  render(<ConductExamFinePage />);
  await choose('Exam', '+ Add Exam');
  expect(screen.getByTitle('Add master data').getAttribute('src')).toBe('/conduct-exam-master?embedded=1');
});
test('late fine policy has no course type or examination fields and saves to its own endpoint', async () => {
  render(<ConductExamFinePage lateFeePolicy />);
  await choose('Academic year', '2026-27'); await choose('Program', 'Science (P1)');
  expect(screen.queryByLabelText('Course type')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Exam')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-31' } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '50' } });
  await choose('Fine type', 'per day');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/late-fee-policy', expect.objectContaining({ colid: 42, programcode: 'P1', finetype: 'per day', amount: '50' })));
  expect(ep1.post.mock.calls[0][1].coursetype).toBeUndefined();
});
