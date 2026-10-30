import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page, { admissionPrint } from './Crm2ConfirmAdmissionPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./global1', () => ({ colid: 42, user: 'one@test.com' }));
jest.mock('./Crm2ProgramPages', () => ({ Filters: () => <div>Dynamic programwise lead filters</div> }));
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: ({ rows, onRowSelectionModelChange }) => <div>{rows.map(row => <div key={row._id}>{row.name || row.feeeitem || row.scholarship || row.feeitem}{onRowSelectionModelChange && <button onClick={() => onRowSelectionModelChange([row._id])}>Select {row._id}</button>}</div>)}</div> }));
const lead = { _id: 'a1', leadid: 'l1', academicyear: '2026-27', program: 'Science', programcode: 'P1', lead: { name: 'Applicant' } };
const student = { name: 'Applicant', regno: '42-2026-27-P1-1', email: 'one@test.com', program: 'Science', programcode: 'P1', academicyear: '2026-27' };
let applied;
beforeEach(() => {
  applied = [];
  ep1.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/my-leads') ? { data: [lead], total: 1 } : url === '/api/institution' ? [{ institutionname: 'Test College', address: 'Main road', logolink: 'https://example.com/logo.png' }] : {
    admission: { feesdone: applied.includes('fees'), scholarshipsdone: applied.includes('scholarships'), meritpercentage: 85 }, student,
    fees: [{ _id: 'f1', feeeitem: 'Tuition', amount: 10000 }], scholarships: [{ _id: 's1', scholarship: 'Merit award', calculatedamount: 1000 }], scholarshipbase: 10000,
    ledger: applied.map((kind, index) => ({ _id: `ledger${index}`, feeitem: kind === 'fees' ? 'Tuition' : 'Merit award', amount: kind === 'fees' ? 10000 : -1000, balance: kind === 'fees' ? 10000 : -1000 }))
  } }));
  ep1.post.mockImplementation((url, body) => { if (url.endsWith('/apply')) applied.push(body.kind); return Promise.resolve({ data: url.endsWith('/admit') ? { admissionid: 'ad1', regno: student.regno } : { saved: body.ids.length } }); });
});
test('admission wizard explicitly loads assigned leads then creates student, applies fees and scholarships and prints confirmation', async () => {
  render(<Page />); expect(ep1.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Load leads' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Select a1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue with selected lead' }));
  fireEvent.click(screen.getByRole('button', { name: 'Admit / resume admission' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-admissions/admit', expect.objectContaining({ colid: 42, assignmentid: 'a1', autoregnumber: true })));
  fireEvent.click(await screen.findByRole('button', { name: 'Select f1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply selected fees' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Select s1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply selected scholarships' }));
  expect(await screen.findByText('Admission confirmed: Applicant — 42-2026-27-P1-1')).toBeTruthy();
  expect(screen.getByText('Ledger balance: 9000.00')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
  const frame = await screen.findByTitle('Admission confirmation print preview');
  expect(frame.getAttribute('srcDoc')).toContain('Test College'); expect(frame.getAttribute('srcDoc')).toContain('https://example.com/logo.png');
});
test('print output escapes student and institution fields and includes signed ledger totals', () => {
  const html = admissionPrint({ student: { name: '<script>bad</script>' }, ledger: [{ amount: 100, balance: 100 }, { amount: -10, balance: -10 }] }, { institutionname: 'A & B', address: 'Town' });
  expect(html).not.toContain('<script>'); expect(html).toContain('&lt;script&gt;'); expect(html).toContain('A &amp; B'); expect(html).toContain('Balance: 90.00');
});
