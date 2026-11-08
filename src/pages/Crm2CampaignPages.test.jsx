import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Crm2CampaignWizardPage, Crm2CampaignReportPage } from './Crm2CampaignPages';
import ep1 from '../api/ep1';

const mockGrid = jest.fn(), mockShell = jest.fn();
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => { mockShell(); return <div>{children}</div>; });
jest.mock('./Crm2LeadFilterPanel', () => ({ __esModule: true, default: ({ value, onChange }) => <input aria-label="Lead search" value={value.filters[0]?.value || ''} onChange={e => onChange({ ...value, filters: [{ field: 'name', value: e.target.value }] })} />, emptyLeadFilters: { filters: [] } }));
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows, onRowSelectionModelChange, onRowClick }) => {
  mockGrid();
  return <div>{rows.map(row => <button key={row._id} onClick={() => onRowSelectionModelChange ? onRowSelectionModelChange([row._id]) : onRowClick?.({ id: row._id })}>{row.name || row.subject}</button>)}</div>;
} }));

const campaign = { _id: 'campaign1', name: 'Admissions' };
async function choose(label, option) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(await screen.findByRole('option', { name: option }));
}
beforeEach(() => jest.clearAllMocks());
test('wizard retains existing members, keeps typing local, and sends the latest draft', async () => {
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => array.fill(1) } });
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  const lead = { _id: 'lead1', name: 'Ann', email: 'ann@example.com' };
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('/send-options') ? { legacy: [{ _id: 'mail1', username: 'office@example.com' }], smtp: [], whatsapp: { configs: [], templates: [] }, trackingEnabled: true } : url.endsWith('/members') ? { data: [lead] } : url.endsWith('/leads') ? { data: [{ _id: 'lead2', name: 'Ben' }], total: 1 } : { data: [campaign] } }));
  ep1.post.mockResolvedValue({ data: { status: 'Completed', sent: 1, failed: 0, unknown: 0 } });
  render(<Crm2CampaignWizardPage counsellor />);
  await choose('Campaign', 'Admissions');
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('button', { name: 'Ann' });
  const before = mockGrid.mock.calls.length, shellBefore = mockShell.mock.calls.length, requestsBefore = ep1.get.mock.calls.length;
  fireEvent.change(screen.getByLabelText('Lead search'), { target: { value: 'Ben' } });
  expect(mockGrid).toHaveBeenCalledTimes(before);
  expect(mockShell).toHaveBeenCalledTimes(shellBefore);
  expect(ep1.get).toHaveBeenCalledTimes(requestsBefore);
  fireEvent.click(screen.getByRole('button', { name: 'Load leads' }));
  await screen.findByRole('button', { name: 'Ben' });
  fireEvent.click(screen.getByRole('button', { name: 'Ann' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await choose('Email configuration', 'office@example.com');
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Admission update' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Latest draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByText('1 sent, 0 failed, 0 unconfirmed');
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-campaigns/campaign1/send', expect.objectContaining({ ids: ['lead1'], subject: 'Admission update', message: 'Latest draft', mode: 'Email' }), expect.anything());
  confirm.mockRestore();
});
test('report loads the selected campaign and drills into a send run without refetching while typing', async () => {
  const report = { runs: [{ _id: 'run1', subject: 'First send' }], data: [], summary: { sent: 1, trackable: 1, opened: 1, clicked: 1, failed: 0, unknown: 0, ctr: 100 } };
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('/report') ? report : { data: [campaign] } }));
  render(<Crm2CampaignReportPage />);
  await choose('Campaign', 'Admissions');
  fireEvent.click(screen.getByRole('button', { name: 'Load report' }));
  await screen.findByText('100%');
  const before = mockGrid.mock.calls.length, requestsBefore = ep1.get.mock.calls.length;
  fireEvent.change(screen.getByLabelText('Lead or recipient'), { target: { value: 'Ann' } });
  expect(mockGrid).toHaveBeenCalledTimes(before);
  expect(ep1.get).toHaveBeenCalledTimes(requestsBefore);
  fireEvent.click(screen.getByRole('button', { name: 'First send' }));
  await waitFor(() => expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-campaigns/campaign1/report', expect.objectContaining({ params: expect.objectContaining({ run: 'run1' }) })));
});
