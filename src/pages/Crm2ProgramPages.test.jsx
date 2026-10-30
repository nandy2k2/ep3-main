import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Page, { ProgramChoice, LeadBulkActionDialog } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, user: 'one@example.com' }));
const program = { _id: 'p1', program: 'Science', programcode: 'P1' };
const person = { _id: 'u1', name: 'One', email: 'one@example.com' };
const mapping = { _id: 'm1', ...program, counsellorname: 'One', counselloremail: 'one@example.com', location: 'North' };
beforeEach(() => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: { data: url.endsWith('/programs') ? [program] : url.endsWith('/counsellors') ? [person] : url.endsWith('/mappings') ? [mapping] : [] } }));
  ep1.post.mockResolvedValue({ data: { data: mapping, saved: 1 } });
});
async function choose(name, option) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name }));
  fireEvent.click(await screen.findByRole('option', { name: option }));
}
test('mapping cascades country, state and city and saves the full location', async () => {
  ep1.get.mockImplementation((url, options) => Promise.resolve({ data: { data: url.endsWith('/programs') ? [program] : url.endsWith('/counsellors') ? [person] : url.endsWith('/address-options') ? [options.params.field === 'country' ? 'India' : options.params.field === 'state' ? 'Gujarat' : 'Ahmedabad'] : [] } }));
  render(<Page mode="mapping" />);
  expect(screen.getByRole('combobox', { name: 'State' })).toBeDisabled();
  await choose('Program', 'Science (P1)'); await choose('Counselor', 'One - one@example.com');
  await choose('Country', 'India'); await choose('State', 'Gujarat'); await choose('City', 'Ahmedabad');
  fireEvent.click(screen.getByRole('button', { name: 'Save mapping' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-programs/mappings/save', expect.objectContaining({ country: 'India', state: 'Gujarat', city: 'Ahmedabad' })));
});
test('transfer dialog cascades counselor by program and submits selected assignment IDs', async () => {
  const onSaved = jest.fn(), onClose = jest.fn(), notify = jest.fn();
  render(<LeadBulkActionDialog action="transfer" mode="my" ids={['assignment1']} onSaved={onSaved} onClose={onClose} notify={notify} />);
  expect(screen.getByRole('combobox', { name: 'Transfer counselor' })).toBeDisabled();
  await choose('Transfer program', 'Science (P1)');
  await choose('Transfer counselor', 'One - one@example.com | North');
  expect(screen.getByLabelText('Program code').value).toBe('P1');
  expect(screen.getByLabelText('Counselor email').value).toBe('one@example.com');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/mappings', expect.objectContaining({ params: expect.objectContaining({ programcode: 'P1' }) }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-programs/bulk-action', expect.objectContaining({ mode: 'my', action: 'transfer', ids: ['assignment1'], programcode: 'P1', mappingid: mapping._id })));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(notify).toHaveBeenCalledWith('1 lead transferred.', 'success');
});
test('bulk Active dialog submits Yes/No for selected assignments', async () => {
  render(<LeadBulkActionDialog action="active" mode="my" ids={['assignment1', 'assignment2']} onSaved={jest.fn()} onClose={jest.fn()} notify={jest.fn()} />);
  await choose('Active', 'No');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Active update' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-programs/bulk-action', expect.objectContaining({ ids: ['assignment1', 'assignment2'], mode: 'my', action: 'active', active: 'No' })));
});
test('mapping loads program and counselor on demand, then fills codes and email', async () => {
  render(<Page mode="mapping" />);
  expect(ep1.get.mock.calls.some(([url]) => url.endsWith('/programs'))).toBe(false);
  await choose('Program', 'Science (P1)');
  await choose('Counselor', 'One - one@example.com');
  expect(screen.getByLabelText('Program code').value).toBe('P1');
  expect(screen.getByLabelText('Counselor email').value).toBe('one@example.com');
  fireEvent.change(screen.getByLabelText('Location (optional)'), { target: { value: 'North' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save mapping' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-programs/mappings/save', expect.objectContaining({ colid: 42, programcode: 'P1', counselloremail: 'one@example.com', location: 'North' })));
});
test('mapped counselor options show counselor and location, not the program name', async () => {
  render(<ProgramChoice title="Counselor for Science" endpoint="/api/v2/crm2-programs/mappings" value={null} onChange={jest.fn()} />);
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Counselor for Science' }));
  expect(await screen.findByRole('option', { name: 'One - one@example.com | North' })).toBeTruthy();
});
test('programwise leads loads only when requested and sends current-user scope', async () => {
  render(<Page mode="my" />);
  expect(ep1.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/my-leads', expect.objectContaining({ params: expect.objectContaining({ colid: 42, user: 'one@example.com' }) })));
  fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter field' }));
  fireEvent.click(await screen.findByRole('option', { name: 'programcode' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter value' }));
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/filter-options', expect.objectContaining({ params: expect.objectContaining({ field: 'programcode', user: 'one@example.com' }) })));
});
test('programwise Active No tab reloads using the chosen status and resets pagination', async () => {
  render(<Page mode="my" />);
  fireEvent.click(screen.getByRole('tab', { name: 'Leads with Active No' }));
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/my-leads', expect.objectContaining({ params: expect.objectContaining({ active: 'No', skip: 0 }) })));
});
test('lead program assignment provides one mapped counselor chooser per program and auto assign hides it', async () => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: { data: url.endsWith('/leads') ? [{ _id: 'lead1', name: 'Applicant', email: 'lead@example.com' }] : url.endsWith('/academic-years') ? ['2026-27'] : url.endsWith('/programs') ? [program] : [mapping], total: 1 } }));
  render(<Page mode="assignment" />);
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  const row = await screen.findByRole('row', { name: /Applicant/ });
  fireEvent.click(within(row).getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /Select programs/ }));
  expect(screen.getByRole('combobox', { name: 'Programs' })).toBeDisabled();
  await choose('Academic year', '2026-27');
  await choose('Programs', 'Science (P1)');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/programs', expect.objectContaining({ params: expect.objectContaining({ academicyear: '2026-27' }) }));
  expect(screen.getByRole('combobox', { name: 'Counselor for Science' })).toBeTruthy();
  fireEvent.click(screen.getByLabelText('Auto assign a mapped counselor for each program'));
  expect(screen.queryByRole('combobox', { name: 'Counselor for Science' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Assign selected leads' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-programs/assign', expect.objectContaining({ academicyear: '2026-27', autoassign: true, leadids: ['lead1'], programs: [{ programcode: 'P1', mappingid: undefined }] })));
  expect(await screen.findByText('Program assignment completed: 1 lead/program assignment saved.')).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
test('per-lead icon opens all saved program assignments with counselor and interaction details', async () => {
  let resolveAssignments;
  ep1.get.mockImplementation(url => url.includes('/lead-assignments/') ? new Promise(resolve => { resolveAssignments = resolve; }) : Promise.resolve({ data: { data: [{ _id: 'lead1', name: 'Applicant', email: 'lead@example.com', phone: '1234' }], total: 1 } }));
  render(<Page mode="assignment" />);
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  fireEvent.click(await screen.findByRole('button', { name: 'View assigned programs for Applicant' }));
  expect(await screen.findByText('Loading assigned programs...')).toBeTruthy();
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/lead-assignments/lead1', expect.objectContaining({ params: { colid: 42, user: 'one@example.com' } }));
  resolveAssignments({ data: { data: [{ _id: 'assignment1', program: 'Science', programcode: 'P1', counsellorname: 'One', counselloremail: 'one@example.com', location: 'North', pipeline: 'Interested', case: 'Callback', followupdate: '2026-11-01', interactions: [{ details: 'Discussed eligibility', mode: 'Phone', createdby: 'one@example.com' }] }] } });
  expect(await screen.findByText('Science (P1)')).toBeTruthy();
  expect(screen.getByText('One')).toBeTruthy();
  expect(screen.getByText('North')).toBeTruthy();
  expect(screen.getByText('Interested')).toBeTruthy();
  expect(screen.getByText('Discussed eligibility')).toBeTruthy();
});
test('assignment details displays a clear empty state', async () => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: { data: url.includes('/lead-assignments/') ? [] : [{ _id: 'lead1', name: 'Applicant' }], total: 1 } }));
  render(<Page mode="assignment" />);
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  fireEvent.click(await screen.findByRole('button', { name: 'View assigned programs for Applicant' }));
  expect(await screen.findByText('No programs have been assigned to this lead.')).toBeTruthy();
});
