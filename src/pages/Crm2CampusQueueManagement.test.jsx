import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Crm2CampusQueueManagement from './Crm2CampusQueueManagement';
import ep1 from '../api/ep1';

const mockGrid = jest.fn(), mockShell = jest.fn();
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => { mockShell(); return <div>{children}</div>; });
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: ({ title, onChange }) => <button type="button" onClick={() => onChange(title === 'Campus counsellor' ? { _id: 'staff1', name: 'Ann', email: 'ann@example.com' } : { program: 'Engineering', programcode: '001' })}>Choose {title}</button> }));
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows, columns }) => { mockGrid(); return <div>{rows.map(row => <div key={row._id}>{row.title}{columns[0].renderCell({ row })}</div>)}</div>; } }));

test('creates a level and assigns a staff user without typing rerendering the grid', async () => {
  let rows = [{ _id: 'level1', program: 'Engineering', programcode: '001', level: 1, title: 'Reception', active: 'Yes' }];
  ep1.get.mockImplementation(async () => ({ data: { data: rows } }));
  ep1.post.mockImplementation(async (url, body) => {
    if (url.endsWith('/levels')) rows = [...rows, { ...body, _id: 'level2', program: 'Engineering' }];
    return { data: { data: {} } };
  });
  render(<Crm2CampusQueueManagement />);
  await screen.findByText('Reception');
  fireEvent.click(screen.getByRole('button', { name: 'Add level' }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.click(form.getByRole('button', { name: 'Choose Program' }));
  expect(form.getByLabelText('Program code')).toHaveValue('001');
  fireEvent.change(form.getByRole('spinbutton', { name: /^Level/ }), { target: { value: '2' } });
  const grid = mockGrid.mock.calls.length, shell = mockShell.mock.calls.length, requests = ep1.get.mock.calls.length;
  fireEvent.change(form.getByRole('textbox', { name: /^Title/ }), { target: { value: 'Counselling' } });
  expect(mockGrid).toHaveBeenCalledTimes(grid);
  expect(mockShell).toHaveBeenCalledTimes(shell);
  expect(ep1.get).toHaveBeenCalledTimes(requests);
  fireEvent.click(form.getByRole('button', { name: 'Save' }));
  await screen.findByText('Counselling');
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-campus-queue/levels', expect.objectContaining({ programcode: '001', level: '2', title: 'Counselling', active: 'Yes' }), expect.anything());
  fireEvent.click(screen.getByRole('tab', { name: 'Counsellor assignments' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Assign counsellor' })[1]);
  const assign = within(screen.getByRole('dialog'));
  fireEvent.click(assign.getByRole('button', { name: 'Choose Campus counsellor' }));
  expect(assign.getByLabelText('Counsellor email')).toHaveValue('ann@example.com');
  fireEvent.click(assign.getByRole('button', { name: 'Save' }));
  await screen.findByText('Counsellor assigned');
  expect(ep1.post).toHaveBeenLastCalledWith('/api/v2/crm2-campus-queue/levels/level2/counsellor', { userid: 'staff1' }, expect.anything());
});
