import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Crm2LeadRecords } from './Crm2LeadRecords';
import ep1 from '../api/ep1';
import { DataGrid } from '@mui/x-data-grid';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('@mui/x-data-grid', () => ({ DataGrid: jest.fn(), GridToolbar: () => null }));
jest.mock('./MenuPageShell', () => ({ children }) => children);
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: () => null }));
const lead = { _id: '507f1f77bcf86cd799439011', name: 'Ann', email: 'ann@example.com', phone: '123' };
beforeEach(() => {
  DataGrid.mockImplementation(() => <div>Records</div>);
  ep1.get.mockResolvedValue({ data: { data: [] } });
  ep1.post.mockResolvedValue({ data: { success: true } });
});
test('task saves with due date, default Open status and owned workspace', async () => {
  render(<Crm2LeadRecords lead={lead} mode="my" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'New' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Call Ann' } });
  fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-11-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2/lead-records/tasks/save', expect.objectContaining({ leadid: lead._id, task: 'Call Ann', duedate: '2026-11-01', status: 'Open', leadmode: 'my' })));
});
test('notes save independently of tasks and grid actions remain first', async () => {
  render(<Crm2LeadRecords lead={lead} kind="notes" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'New' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Interested in science' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2/lead-records/notes/save', expect.objectContaining({ leadid: lead._id, note: 'Interested in science' })));
  expect(DataGrid.mock.calls.at(-1)[0].columns[0].field).toBe('actions');
});
