import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CounselorDashboard from './CounselorDashboard';
import ep1 from '../api/ep1';
jest.mock('./TelecallerLeads', () => ({ TelecallerLeads: () => <div>Restricted telecaller leads</div>, TelecallerLeadDetails: () => <div>Telecaller notes and pipeline</div> }));
jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./Crm2Pages', () => {
  const { useCrm2Dashboard } = require('./Crm2DashboardContext');
  return { Crm2Content: ({ mode, autoLoad, initialLead, initialTab }) => { const scope = useCrm2Dashboard(); return initialLead ? <div>Full lead {initialLead.name} · {initialTab}</div> : <div>Leads {scope.academicyear} {scope.view || 'all'} {mode} {String(autoLoad)}</div>; } };
});
jest.mock('./CounselorAdmittedReport', () => () => <div>Admitted read-only report</div>);
jest.mock('./CounselorTaskReport', () => {
  const { useCrm2Dashboard } = require('./Crm2DashboardContext');
  return () => { const scope = useCrm2Dashboard(); return <div>Tasks {scope.academicyear}<button onClick={() => scope.onOpenLead('111111111111111111111111')}>Open task lead</button></div>; };
});
beforeEach(() => {
  ep1.get.mockImplementation(async (url, config) => ({ data: url.includes('/lead/') ? { data: { _id: '111111111111111111111111', name: 'Ann' } } : config.params.academicyear ? { data: { academicyear: config.params.academicyear, newleads: 2, pending: 3, admitted: 4, total: 9, since: '2026-10-25T00:00:00Z' } } : { years: ['2026-27','2027-28'] } }));
});
async function chooseYear(year) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Academic year' }));
  fireEvent.click(await screen.findByRole('option', { name: year }));
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
}
test('dashboard date filters are sent with summary loads and telecaller uses its own endpoint', async () => {
  render(<CounselorDashboard telecaller />);
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-10-28' } });
  await chooseYear('2026-27');
  await screen.findByText('Restricted telecaller leads');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-telecaller-dashboard', expect.objectContaining({ params: expect.objectContaining({ academicyear: '2026-27', dateFrom: '2026-10-01', dateTo: '2026-10-28', dateField: 'dateadded' }) }));
});
test('does not load leads before selection and applies the loaded year to original My leads', async () => {
  render(<CounselorDashboard />);
  expect(screen.queryByText(/Leads 2026/)).not.toBeInTheDocument();
  await chooseYear('2026-27');
  await screen.findByText('Leads 2026-27 all my true');
  expect(screen.getByRole('button', { name: 'New leads assigned: 2' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tasks pending: 3' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Admitted leads: 4' })).toBeInTheDocument();
});
test('summary cards open year-scoped original details in a modal without a second menu', async () => {
  render(<CounselorDashboard />); await chooseYear('2026-27');
  await screen.findByText('Leads 2026-27 all my true');
  fireEvent.click(screen.getByRole('button', { name: 'Admitted leads: 4' }));
  expect(within(screen.getByRole('dialog')).getByText('Admitted read-only report')).toBeInTheDocument();
  expect(within(screen.getByRole('dialog')).queryByText(/Leads 2026/)).not.toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('dialog')).getByTitle('Close details'));
  await screen.findByRole('button', { name: 'Tasks pending: 3' });
  fireEvent.click(screen.getByRole('button', { name: 'Tasks pending: 3' }));
  expect(within(screen.getByRole('dialog')).getByText('Tasks 2026-27')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Open task lead' }));
  await screen.findByText('Full lead Ann · Lead tasks');
  expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(2);
});
