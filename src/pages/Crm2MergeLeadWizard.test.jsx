import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Crm2MergeLeadWizard from './Crm2MergeLeadWizard';
import ep1 from '../api/ep1';

const mockGrid = jest.fn(), mockShell = jest.fn();
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => { mockShell(); return <div>{children}</div>; });
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows, columns }) => {
  mockGrid();
  return <div>{rows.map(row => <div key={row._id}>{row.name}{columns[0].renderCell({ row })}</div>)}</div>;
} }));
jest.mock('./Crm2LeadFilterPanel', () => ({ __esModule: true, emptyLeadFilters: { filters: [] }, default: ({ value, onChange }) => <input aria-label="Lead filter" value={value.filters[0]?.value || ''} onChange={event => onChange({ filters: [{ field: 'name', value: event.target.value }] })} /> }));

const leads = [{ _id: 'lead1', name: 'Ann', city: 'Pune' }, { _id: 'lead2', name: 'Ben', city: 'Mumbai' }, { _id: 'lead3', name: 'Cia', city: 'Delhi' }];
const fields = [{ field: 'name', label: 'Name', type: 'String', editable: false }, { field: 'city', label: 'City', type: 'String', editable: true }];
const version = '2026-11-08T09:00:00.000Z';

test('filters independently, adds a third lead, and sends one source for each changed row', async () => {
  ep1.get.mockImplementation(async (url, { params } = {}) => {
    if (url.endsWith('/fields')) return { data: { data: fields, maxLeads: 25 } };
    if (url.endsWith('/leads')) {
      const available = leads.filter(lead => !params.exclude.split(',').includes(lead._id));
      return { data: { data: available.slice(0, 1), total: available.length } };
    }
    return { data: { data: leads.find(lead => url.endsWith(`/lead/${lead._id}`)), version } };
  });
  ep1.post.mockResolvedValue({ data: { primaryId: 'lead2', deactivated: 2, message: 'Merge saved' } });
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Crm2MergeLeadWizard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Load leads' }));
  await screen.findByText('Ann');
  const renders = mockGrid.mock.calls.length, shellRenders = mockShell.mock.calls.length, requests = ep1.get.mock.calls.length;
  fireEvent.change(screen.getByLabelText('Lead filter'), { target: { value: 'Ann' } });
  expect(mockGrid).toHaveBeenCalledTimes(renders);
  expect(mockShell).toHaveBeenCalledTimes(shellRenders);
  expect(ep1.get).toHaveBeenCalledTimes(requests);
  fireEvent.click(screen.getByRole('button', { name: 'Select' }));
  await screen.findByText('First lead: Ann (lead1)');
  expect(screen.getByLabelText('Lead filter')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Load leads' }));
  await screen.findByText('Ben');
  fireEvent.click(screen.getByRole('button', { name: 'Select' }));
  await screen.findByRole('table', { name: 'Lead comparison' });
  fireEvent.click(screen.getByRole('button', { name: 'Add another lead' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.click(dialog.getByRole('button', { name: 'Load leads' }));
  await dialog.findByText('Cia');
  fireEvent.click(dialog.getByRole('button', { name: 'Select' }));
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Primary lead Ben (lead2)' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Keep City from Cia (lead3)' }));
  expect(screen.getByRole('checkbox', { name: 'Keep City from Cia (lead3)' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Keep City from Ben (lead2)' })).not.toBeChecked();
  expect(screen.queryByRole('checkbox', { name: /Keep Name/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Merge selected leads' }));
  await screen.findByRole('link', { name: 'Open primary lead' });
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-merge-wizard/merge', { ids: ['lead1', 'lead2', 'lead3'], primaryId: 'lead2', choices: { city: 'lead3' }, versions: { lead1: version, lead2: version, lead3: version } }, expect.anything());
  confirm.mockRestore();
});
