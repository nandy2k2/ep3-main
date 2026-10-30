import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page, { programReportPrint } from './Crm2ProgramReportPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, user: 'one@example.com' }));
jest.mock('recharts', () => {
  const Component = ({ children }) => <div>{children}</div>;
  return { Bar: Component, BarChart: Component, CartesianGrid: () => null, Cell: () => null, Pie: Component, PieChart: Component, ResponsiveContainer: Component, Tooltip: () => null, XAxis: () => null, YAxis: () => null };
});
const fields = [{ field: 'pipeline', type: 'String' }, { field: 'category', type: 'String' }, { field: 'annualincome', type: 'Number' }];
const result = { data: [{ _id: 'a1', name: 'Applicant', email: 'lead@example.com', academicyear: '2026-27', program: 'Science', programcode: 'P1', pipeline: 'Interested', education: [{ level: '12th', grade: 'A' }] }], total: 31, uniqueLeads: 31, fields, legacy: 0, context: { academicyear: '2026-27', programcode: 'P1', program: { program: 'Science' } }, summary: { pipeline: [{ name: 'Interested', count: 31 }], category: [{ name: 'OBC', count: 31 }], case: [{ name: 'Callback', count: 31 }], source: [{ name: 'Website', count: 31 }], counselor: [{ name: 'one@example.com', count: 31 }], crmcategory: [], type: [], admissionstatus: [] } };
beforeEach(() => {
  ep1.get.mockImplementation((url, config) => Promise.resolve({ data: url.endsWith('/academic-years') ? { data: ['2026-27'] } : url.endsWith('/programs') ? { data: [{ _id: 'p1', program: 'Science', programcode: 'P1' }] } : url.endsWith('/report-options') ? config.params.field ? { data: ['Interested'] } : { fields } : result }));
});
async function choose(label, option) { fireEvent.mouseDown(screen.getByRole('combobox', { name: label })); fireEvent.click(await screen.findByRole('option', { name: option })); }
async function selection() { await choose('Academic year', '2026-27'); await choose('Program', 'Science (P1)'); }
test('requires year/program, cascades programs by year, and loads filtered report only on request', async () => {
  render(<Page />);
  expect(screen.getByRole('button', { name: 'Load report' })).toBeDisabled();
  expect(ep1.get.mock.calls.some(([url]) => url.endsWith('/report'))).toBe(false);
  await selection();
  expect(screen.getByLabelText('Program code').value).toBe('P1');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/programs', expect.objectContaining({ params: expect.objectContaining({ academicyear: '2026-27' }) }));
  fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
  await choose('Filter value', 'Interested');
  fireEvent.click(screen.getByRole('button', { name: 'Load report' }));
  expect(await screen.findByText('Lead allocations')).toBeTruthy();
  expect(screen.getByText('Lead details (31)')).toBeTruthy();
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-programs/report', expect.objectContaining({ params: expect.objectContaining({ colid: 42, academicyear: '2026-27', programcode: 'P1', filters: JSON.stringify([{ field: 'pipeline', value: 'Interested' }]) }) }));
});
test('summary report displays pipeline/category/case/source charts and full lead details popup', async () => {
  render(<Page summaryMode />); await selection();
  fireEvent.click(screen.getByRole('button', { name: 'Load report' }));
  expect(await screen.findByText('Pipeline stagewise leads')).toBeTruthy();
  expect(screen.getByText('Categorywise leads')).toBeTruthy();
  expect(screen.getByText('Casewise leads')).toBeTruthy(); expect(screen.getByText('Sourcewise leads')).toBeTruthy();
  fireEvent.click(await screen.findByRole('button', { name: 'Details' }));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  expect(screen.getByText('[{"level":"12th","grade":"A"}]')).toBeTruthy();
});
test('changing year clears prior report and program selection', async () => {
  render(<Page />); await selection(); fireEvent.click(screen.getByRole('button', { name: 'Load report' })); await screen.findByText('Lead allocations');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Load report' })).not.toBeDisabled());
  const clears = screen.getAllByTitle('Clear');
  fireEvent.click(clears[0]);
  await waitFor(() => expect(screen.queryByText('Lead allocations')).toBeNull());
  expect(screen.getByLabelText('Program code').value).toBe('');
});
test('print includes institution details and safely escapes source data', () => {
  const html = programReportPrint(result, [{ name: '<script>bad</script>', email: 'lead@example.com' }], { institutionname: 'Institution', address: 'Campus address', logolink: 'https://example.com/logo.png' });
  expect(html).toContain('Institution'); expect(html).toContain('Campus address'); expect(html).toContain('https://example.com/logo.png');
  expect(html).toContain('Science (P1)'); expect(html).toContain('2026-27'); expect(html).toContain('Interested'); expect(html).not.toContain('<script>');
});
