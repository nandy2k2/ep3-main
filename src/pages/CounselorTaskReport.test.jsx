import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CounselorTaskReport from './CounselorTaskReport';
import { Crm2DashboardContext } from './Crm2DashboardContext';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: ({ rows, columns }) => <div>{rows.map(row => <div key={row._id}>{columns.filter(column => column.renderCell).map(column => <div key={column.field}>{column.renderCell({ row, value: row[column.field] })}</div>)}</div>)}</div> }));
beforeEach(() => {
  ep1.get.mockResolvedValue({ data: { data: [{ _id: 'task1', leadid: 'lead1', lead: 'Ann', task: 'Call Ann', status: 'Open' }] } });
  ep1.post.mockResolvedValue({ data: { success: true } });
});
test('pending tasks have no creation controls, open full lead details and allow status-only updates', async () => {
  const open = jest.fn();
  render(<Crm2DashboardContext.Provider value={{ academicyear: '2026-27', onOpenLead: open }}><CounselorTaskReport /></Crm2DashboardContext.Provider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Ann' })); expect(open).toHaveBeenCalledWith('lead1');
  expect(screen.queryByRole('button', { name: /add|new|delete/i })).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status for Call Ann' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Closed' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-counselor-dashboard/tasks/task1/status', { academicyear: '2026-27', status: 'Closed' }, expect.anything()));
});
test('telecaller task view cannot update statuses', async () => {
  render(<Crm2DashboardContext.Provider value={{ academicyear: '2026-27', endpoint: '/api/v2/crm2-telecaller-dashboard', readOnly: true }}><CounselorTaskReport /></Crm2DashboardContext.Provider>);
  await screen.findByRole('button', { name: 'Ann' });
  expect(screen.queryByRole('combobox', { name: 'Status for Call Ann' })).not.toBeInTheDocument();
  expect(screen.getByText('Open')).toBeInTheDocument();
});
