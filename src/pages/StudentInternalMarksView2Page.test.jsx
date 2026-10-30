import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Page from './StudentInternalMarksView2Page';
import { internalMarksColumns } from './StudentInternalMarksViewPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, user: 'ann@example.com' }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: ({ rows, columns }) => <div>{columns.map(column => <div key={column.field}>{column.headerName}{rows.map(row => <span key={row._id}>{column.valueFormatter ? column.valueFormatter({ value: row[column.field] }) : row[column.field]}</span>)}</div>)}</div> }));
test('formats fractional component weightage as percentage without changing original columns', () => {
  const column = internalMarksColumns(true).find(item => item.field === 'weightage');
  for (const [value, formatted] of [[0.25,'25%'], [1,'100%'], [0,'0%'], [0.3333,'33.33%'], [null,'-']]) expect(column.valueFormatter({ value })).toBe(formatted);
  expect(internalMarksColumns(true).some(item => item.field === 'passstatus')).toBe(false);
  expect(internalMarksColumns().some(item => item.field === 'passstatus')).toBe(true);
  expect(internalMarksColumns().some(item => item.field === 'weightage')).toBe(false);
});
test('new page loads approved Internal marks and shows weightage, with no Pass/Fail column', async () => {
  ep1.get.mockResolvedValue({ data: { data: [{ _id: 'm1', semester: '1', academicyear: '2026-27', scoretype: 'Internal', approvalstatus: 'Approved', weightage: 0.25, passstatus: 'PASS' }] } });
  render(<Page />);
  fireEvent.click(screen.getByRole('button', { name: 'Load marks' }));
  expect(await screen.findByText('25%')).toBeInTheDocument();
  expect(screen.queryByText(/Pass \/ Fail|^PASS$/)).not.toBeInTheDocument();
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/student-internal-marks-2', { params: { colid: 42, email: 'ann@example.com' } });
});
