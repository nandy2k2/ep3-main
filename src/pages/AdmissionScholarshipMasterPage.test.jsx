import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './AdmissionScholarshipMasterPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./global1', () => ({ colid: 42, user: 'admin@example.com' }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: ({ onChange, title }) => title === 'Programs' ? <button onClick={() => onChange([{ program: 'Science', programcode: 'P1' }, { program: 'Arts', programcode: 'P2' }])}>Select two programs</button> : <span>Academic year</span> }));
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: () => <div>Scholarship grid</div> }));
beforeEach(() => { ep1.get.mockResolvedValue({ data: { data: [] } }); ep1.post.mockResolvedValue({ data: { saved: 2 } }); });
test('creates scholarship for each selected program and auto-fills program codes', async () => {
  render(<Page />); expect(ep1.get).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Scholarship'), { target: { value: 'Merit award' } });
  fireEvent.change(screen.getByLabelText('Value'), { target: { value: '5000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Select two programs' }));
  expect(screen.getByLabelText('Program codes').value).toBe('P1, P2');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalled());
  const body = ep1.post.mock.calls[0][1]; expect(body.colid).toBe(42); expect(body.rows.map(row => row.programcode)).toEqual(['P1', 'P2']);
  expect(body.rows[0]).toEqual(expect.objectContaining({ scholarship: 'Merit award', type: 'Amount', category: 'All', merit: 'No', active: 'Yes' }));
  expect(await screen.findByText('Scholarship saved')).toBeTruthy();
});
test('requires scholarship and program before submitting', async () => {
  render(<Page />); fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Enter scholarship and select at least one program')).toBeTruthy(); expect(ep1.post).not.toHaveBeenCalled();
});
