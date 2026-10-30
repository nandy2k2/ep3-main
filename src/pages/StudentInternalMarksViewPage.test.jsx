import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Page, { semesterGroups } from './StudentInternalMarksViewPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, user: 'student@example.com' }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: ({ rows }) => <div>{rows.map(row => <div key={row._id}>{row.course} {row.marksobtained}</div>)}</div> }));
test('groups semesters numerically while separating academic years', () => {
  const groups = semesterGroups([{ semester: '10', academicyear: '2026' }, { semester: '2', academicyear: '2026' }, { semester: '2', academicyear: '2025' }]);
  expect(groups.map(group => [group.semester, group.year])).toEqual([['2','2026'],['2','2025'],['10','2026']]);
});
test('loads student-specific approved Internal rows only, without edit actions', async () => {
  ep1.get.mockResolvedValue({ data: { data: [
    { _id: '1', semester: '1', academicyear: '2026-27', scoretype: 'Internal', approvalstatus: 'Approved', course: 'Approved course', marksobtained: 18 },
    { _id: '2', semester: '1', scoretype: 'Internal', approvalstatus: 'Pending', course: 'Pending course' },
    { _id: '3', semester: '1', scoretype: 'External', approvalstatus: 'Approved', course: 'External course' }
  ] } });
  render(<Page />);
  expect(ep1.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Load marks' }));
  expect(await screen.findByText('Approved course 18')).toBeTruthy();
  expect(screen.queryByText(/Pending course|External course/)).toBeNull();
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/student-internal-marks', { params: { colid: 42, email: 'student@example.com' } });
  expect(screen.queryByRole('button', { name: /save|delete|edit/i })).toBeNull();
});
