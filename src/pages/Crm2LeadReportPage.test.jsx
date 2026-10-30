import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page, { leadReportHtml, leadReportValue } from './Crm2LeadReportPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./global1', () => ({ colid: 42 }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows, rowCount }) => <div data-testid="lead-grid">{rows.map(row => <div key={row._id}>{row.name}</div>)}Total {rowCount}</div>, GridToolbar: () => null }));
jest.mock('recharts', () => ({ ResponsiveContainer: ({ children }) => <div>{children}</div>, BarChart: () => <div>Bar chart</div>, PieChart: () => <div>Pie chart</div>, Bar: () => null, Pie: () => null, Cell: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null }));
const fields = [{ field: 'name', type: 'String' }, { field: 'dateadded', label: 'Date added', type: 'Date' }, { field: 'admitted', label: 'Admitted', type: 'String', options: ['Yes','No'] }, { field: 'source', type: 'String' }];
const row = { _id: 'lead1', name: 'Ann', email: 'ann@example.com', admitted: 'Yes', programsinterested: [{ program: 'Science', programcode: 'P1' }, { program: 'Arts', programcode: 'P2' }] };
const result = { data: [row], total: 50, fields, institution: { institutionname: 'College', address: 'Campus Road', logolink: 'https://example.com/logo.png' }, summary: { admitted: [{ name: 'Yes', count: 12 }], active: [{ name: 'Yes', count: 40 }], programs: [{ name: 'Science (P1)', count: 30 }], pipeline: [], source: [], category: [], crmcategory: [], case: [], type: [] } };
beforeEach(() => {
  ep1.get.mockReset();
  ep1.get.mockImplementation(async (url, options) => ({ data: url.endsWith('lead-report-options') ? { fields } : url.endsWith('lead-report-programs') ? { data: [{ program: 'Science', programcode: 'P1' }, { program: 'Arts', programcode: 'P2' }] } : options.params.export ? { ...result, data: [row, { ...row, _id: 'lead2', name: 'Bob from second page' }] } : result }));
});
test('programs support multi-selection with automatic codes, admitted filter and report summary/charts', async () => {
  render(<Page />);
  await waitFor(() => expect(ep1.get).toHaveBeenCalled());
  fireEvent.mouseDown(screen.getByLabelText('Programs interested'));
  fireEvent.click(await screen.findByRole('option', { name: 'Science (P1)' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Arts (P2)' }));
  expect(screen.getByLabelText('Program codes')).toHaveValue('P1, P2');
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Programs interested' }), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
  fireEvent.mouseDown(screen.getByLabelText('Filter values'));
  fireEvent.click(await screen.findByRole('option', { name: 'Yes' }));
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Filter values' }), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Load report' }));
  expect(await screen.findByTestId('lead-grid')).toHaveTextContent('Ann');
  expect(screen.getByTestId('lead-grid')).toHaveTextContent('Total 50');
  const params = ep1.get.mock.calls.filter(([url]) => url.endsWith('/lead-report')).at(-1)[1].params;
  expect(JSON.parse(params.programcodes)).toEqual(['P1','P2']); expect(JSON.parse(params.filters)[0].values).toEqual(['Yes']);
  expect(screen.getByText('Total leads')).toBeInTheDocument(); expect(screen.getAllByText('Bar chart')).toHaveLength(4);
  expect(screen.getAllByTestId('lead-summary-card')).toHaveLength(4);
  expect(screen.getAllByTestId('lead-chart-card')).toHaveLength(8);
  screen.getAllByTestId('lead-chart-card').forEach(card => expect(card).toHaveClass('MuiPaper-root'));
});
test('print preview fetches all matching leads and includes institution branding and off-page rows', async () => {
  render(<Page />);
  await screen.findByTestId('lead-grid'); fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
  const frame = await screen.findByTitle('Lead report print preview');
  expect(frame.getAttribute('srcdoc')).toContain('Bob from second page'); expect(frame.getAttribute('srcdoc')).toContain('Campus Road'); expect(frame.getAttribute('srcdoc')).toContain('https://example.com/logo.png');
  expect(ep1.get.mock.calls.some(([url,options]) => url.endsWith('/lead-report') && options.params.export === 'true')).toBe(true);
});
test('print values flatten program and nested fields and escape user-provided content', () => {
  expect(leadReportValue(row, 'programcode')).toBe('P1; P2');
  expect(leadReportValue({ academicyear: '', programsinterested: [{ academicyear: '2026-27' }] }, 'academicyear')).toBe('2026-27');
  expect(leadReportValue({ education: [{ subjects: [{ grade: 'A' }, { grade: 'B' }] }] }, 'education.subjects.grade')).toBe('A; B');
  const html = leadReportHtml({ ...result, data: [{ ...row, name: '<script>alert(1)</script>' }] }, ['name','programcode']);
  expect(html).not.toContain('<script>'); expect(html).toContain('&lt;script&gt;'); expect(html).toContain('P1; P2');
});
test('loads leads immediately without requiring a first button click', async () => {
  render(<Page />);
  expect(await screen.findByTestId('lead-grid')).toHaveTextContent('Ann');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2/lead-report', expect.objectContaining({ params: expect.objectContaining({ colid: 42, filters: '[]', programcodes: '[]', skip: 0 }) }));
});
test('empty matches are explicitly displayed rather than looking like a failed load', async () => {
  const empty = { ...result, data: [], total: 0 };
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('lead-report-options') ? { fields } : url.endsWith('lead-report-programs') ? { data: [] } : empty }));
  render(<Page />);
  expect(await screen.findByText('No leads match the selected filters.')).toBeInTheDocument();
});
