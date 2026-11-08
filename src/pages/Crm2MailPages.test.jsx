import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Crm2MailPage from './Crm2MailPages';
import ep1 from '../api/ep1';

jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows }) => <ul>{rows.map(row => <li key={row._id}>{row.name}</li>)}</ul> }));

test('intake 2 loads reviewed tabs by status and shows fresh results only after analysis', async () => {
  ep1.get.mockImplementation(async (url, { params } = {}) => ({ data: { data: url.endsWith('/config')
    ? [{ _id: 'config', active: true, name: 'Admissions', username: 'admissions@example.com' }]
    : [{ _id: params?.bucket, name: `${params?.bucket} result` }] } }));
  ep1.post.mockResolvedValue({ data: { freshIds: ['111111111111111111111111'], message: '1 ready for review' } });
  render(<Crm2MailPage criteriaChoice />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith(expect.stringMatching(/\/config$/), expect.anything()));
  expect(ep1.get.mock.calls.some(([url]) => url.endsWith('/candidates'))).toBe(false);
  fireEvent.click(await screen.findByRole('tab', { name: 'Accepted' }));
  expect(await screen.findByText('accepted result')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Approve selected' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Rejected' }));
  expect(await screen.findByText('rejected result')).toBeInTheDocument();
  expect(ep1.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('tab', { name: 'Fresh' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Email configuration' }));
  fireEvent.click(await screen.findByRole('option', { name: /Admissions/ }));
  fireEvent.change(screen.getByLabelText('Subject contains'), { target: { value: 'Admission' } });
  fireEvent.change(screen.getByLabelText('Body contains'), { target: { value: 'Enquiry' } });
  fireEvent.change(screen.getByLabelText('From date and time'), { target: { value: '2026-11-08T09:30' } });
  fireEvent.change(screen.getByLabelText('To date and time'), { target: { value: '2026-11-08T17:30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Analyze emails' }));
  expect(await screen.findByText('fresh result')).toBeInTheDocument();
  const range = { from: new Date('2026-11-08T09:30').toISOString(), to: new Date('2026-11-08T17:30').toISOString() };
  expect(ep1.post).toHaveBeenCalledWith(expect.stringMatching(/\/scan$/), expect.objectContaining(range), expect.anything());
  expect(ep1.get).toHaveBeenLastCalledWith(expect.stringMatching(/\/candidates$/), expect.objectContaining({ params: { bucket: 'fresh', ids: '111111111111111111111111', ...range } }));
});
