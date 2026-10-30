import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './Crm2MergeLeadsPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./global1', () => ({ colid: 42, user: 'admin@example.com' }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: ({ value, onChange }) => <select aria-label="Academic year" value={value?.name || ''} onChange={event => onChange({ name: event.target.value })}><option value="" /><option value="2026-27">2026-27</option></select> }));
const records = [{ _id: 'lead1', name: 'Ann One', email: 'one@test.com', active: 'Yes', phone: '111', education: [{ level: '12th', subjects: [{ subject: 'Math', grade: 'A' }] }] }, { _id: 'lead2', name: 'Ann Two', email: 'two@test.com', active: 'Yes', phone: '222' }];
beforeEach(() => {
  window.confirm = jest.fn(() => true);
  ep1.get.mockResolvedValue({ data: { data: records } });
  ep1.post.mockResolvedValue({ data: { deactivated: 1 } });
});
async function search() {
  fireEvent.change(screen.getByLabelText('Academic year'), { target: { value: '2026-27' } });
  fireEvent.change(screen.getByLabelText('Lead name'), { target: { value: 'Ann' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find matching leads' }));
  return screen.findByRole('checkbox', { name: 'Primary lead one@test.com' });
}
test('search is explicit, shows side-by-side details, allows exactly one primary and merges the displayed set', async () => {
  render(<Page />); expect(ep1.get).not.toHaveBeenCalled();
  const first = await search();
  expect(screen.getByText('Math')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Merge leads' })).toBeDisabled();
  fireEvent.click(first);
  const second = screen.getByRole('checkbox', { name: 'Primary lead two@test.com' });
  fireEvent.click(second);
  expect(first).not.toBeChecked(); expect(second).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Merge leads' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2/leads/merge', { colid: 42, user: 'admin@example.com', academicyear: '2026-27', name: 'Ann', ids: ['lead1', 'lead2'], primaryid: 'lead2' }));
  expect(await screen.findByText('Primary lead retained. 1 leads marked Active No.')).toBeTruthy();
});
test('changing search criteria clears candidates and the primary selection', async () => {
  render(<Page />); const first = await search(); fireEvent.click(first);
  fireEvent.change(screen.getByLabelText('Lead name'), { target: { value: 'Other' } });
  expect(screen.queryByRole('checkbox', { name: 'Primary lead one@test.com' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Merge leads' })).toBeDisabled();
});
