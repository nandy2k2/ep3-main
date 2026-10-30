import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page, { programAdditionalFields } from './ProgramManagementPage';
import ep1 from '../api/ep1';
import * as XLSX from 'xlsx';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, user: 'admin@example.com' }));
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: () => <div /> }));
jest.mock('xlsx', () => ({ utils: { json_to_sheet: jest.fn(() => ({})), book_new: jest.fn(() => ({})), book_append_sheet: jest.fn() }, writeFile: jest.fn() }));
beforeEach(() => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/options') ? { programgroups: ['Science'] } : { data: [] } }));
  ep1.post.mockResolvedValue({ data: {} });
});
test('program group accepts typed values and is submitted with the program', async () => {
  render(<Page embedded />);
  fireEvent.change(screen.getByLabelText('Program'), { target: { value: 'BSc' } });
  fireEvent.change(screen.getByLabelText('Program code'), { target: { value: 'P1' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Program group' }), { target: { value: 'Science' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/mprograms-management', expect.objectContaining({ colid: 42, programgroup: 'Science' })));
});
test('program upload template contains programgroup', async () => {
  render(<Page embedded />);
  fireEvent.click(screen.getByRole('button', { name: /Template/ }));
  expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([expect.objectContaining({ programgroup: 'Commerce' })]);
  const sample = XLSX.utils.json_to_sheet.mock.calls[0][0][0];
  programAdditionalFields.forEach(item => expect(sample).toHaveProperty(item.field));
  await waitFor(() => expect(ep1.get).toHaveBeenCalled());
});
test('incharge is searched on demand and selecting a user automatically populates readonly email', async () => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/incharges') ? { data: [{ name: 'Faculty Name', email: 'faculty@example.com' }] } : url.endsWith('/options') ? {} : { data: [] } }));
  render(<Page embedded />);
  expect(ep1.get.mock.calls.some(([url]) => url.endsWith('/incharges'))).toBe(false);
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Program incharge' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Faculty Name (faculty@example.com)' }));
  expect(screen.getByLabelText('Program incharge email').value).toBe('faculty@example.com');
  expect(screen.getByLabelText('Program incharge email')).toHaveAttribute('readonly');
  fireEvent.change(screen.getByLabelText('Program'), { target: { value: 'BSc' } });
  fireEvent.change(screen.getByLabelText('Program code'), { target: { value: 'P1' } });
  fireEvent.change(screen.getByLabelText('Enrollment code'), { target: { value: 'ENR001' } });
  fireEvent.change(screen.getByLabelText('No. of semesters'), { target: { value: '6' } });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Gender' }));
  fireEvent.click(await screen.findByRole('option', { name: 'All' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/mprograms-management', expect.objectContaining({ enrollmentcode: 'ENR001', noofsemesters: '6', gender: 'All', programincharge: 'Faculty Name', programinchargeemail: 'faculty@example.com' })));
});
