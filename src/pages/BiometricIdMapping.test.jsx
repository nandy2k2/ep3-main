import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './StudentBulkFieldUpdatePages';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./global1', () => ({ colid: 42 }));
let mockColumns;
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: ({ rows, columns }) => { mockColumns = columns; return <div>{rows.map(row => <div key={row._id}>{columns.filter(column => column.renderCell).map(column => <div key={column.field}>{column.renderCell({ row })}</div>)}</div>)}</div>; } }));
beforeEach(() => {
  window.confirm = jest.fn(() => true);
  ep1.get.mockImplementation((url, config) => Promise.resolve({ data: config.params.field ? { data: ['Faculty'] } : { fields: ['role', 'name'], options: {}, programs: [] } }));
  ep1.post.mockImplementation((url, body) => Promise.resolve({ data: url.endsWith('/users') ? { data: [{ _id: 'u1', name: 'One', email: 'one@example.com', biometricid: '00012' }, { _id: 'u2', name: 'Two', email: 'two@example.com' }], total: 2 } : { saved: 1, results: [{ id: 'u1', status: 'saved', value: body.rows[0].value }] } }));
});
async function loadUsers() {
  await waitFor(() => expect(ep1.get).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter values' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Faculty' }));
  fireEvent.click(screen.getByRole('button', { name: 'Load users' }));
  return screen.findByLabelText('biometricid u1');
}
test('loads users on demand, preloads IDs in the third data column, and saves only changed IDs', async () => {
  render(<Page field="biometricid" />);
  expect(ep1.post).not.toHaveBeenCalled();
  const input = await loadUsers();
  expect(input.value).toBe('00012'); expect(screen.getByLabelText('biometricid u2').value).toBe('');
  expect(mockColumns.slice(0, 3).map(column => column.field)).toEqual(['name', 'email', 'biometricid']);
  fireEvent.change(input, { target: { value: '00034' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit changed entries (1)' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/biometric-id-mapping/save', { colid: 42, field: 'biometricid', rows: [{ id: 'u1', value: '00034', oldvalue: '00012' }] }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit changed entries (0)' })).toBeDisabled());
});
test('no users load before filtering and dropdown values are fetched on demand', async () => {
  render(<Page field="biometricid" />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Load users' }));
  expect(await screen.findByText('Apply at least one user filter')).toBeTruthy();
  expect(ep1.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter values' }));
  await screen.findByRole('option', { name: 'Faculty' });
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/biometric-id-mapping/options', expect.objectContaining({ params: { colid: 42, field: 'role', search: '' } }));
});
