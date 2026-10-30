import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StudentOnlineFees3Page from './StudentOnlineFees3Page';
import StudentOnlineFeePayment2Page from './StudentOnlineFeePayment2Page';
import LateFeesLedgerPage from './LateFeesLedgerPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./global1', () => ({ colid: 42, regno: 'R1', name: 'Ann', user: 'ann@example.com' }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/x-data-grid', () => ({ DataGrid: () => null, GridToolbar: () => null }));
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => jest.fn(), useSearchParams: () => [new URLSearchParams()] }));
beforeEach(() => {
  ep1.get.mockReset(); ep1.post.mockReset();
  ep1.get.mockImplementation(async url => ({ data: url.includes('mastergateway') ? { data: [{ _id: 'gateway1', gatewayname: 'ICICI', type: 'Internal', status: 'Active' }] } : { studentuser: { program: 'Science', programcode: 'P1' }, data: [{ _id: 'fee1', balance: 1000, duedate: '2020-01-01' }], latefine: { total: 30, applied: [{ ruleid: 'policy1', academicyear: '2026-27', program: 'Science', rate: 10, days: 3, amount: 30, finetype: 'per day' }] } } }));
});
test('Online Fees 3 displays the authoritative fine and uses the new session with the existing ICICI flow', async () => {
  ep1.post.mockImplementation(async url => ({ data: url.endsWith('/session') ? { data: { payment: { _id: 'online1', totalamount: 1030, student: 'Ann' }, gatewayPayload: { amount: 1030, colid: 42, regno: 'R1', studentonlinepaymentid: 'online1' } } } : {} }));
  render(<StudentOnlineFees3Page />);
  expect(await screen.findByText('Rs. 1,030.00')).toBeInTheDocument();
  expect(screen.getByText('Late fine: Rs. 30.00')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Pay all past due fees' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/icicipayment/initiate', expect.objectContaining({ amount: 1030, frontendcallbackurl: expect.stringContaining('/student-online-fees-3') })));
  expect(ep1.post.mock.calls[0][0]).toBe('/api/v2/studentonlinepayment3/session');
  await screen.findByText('Gateway did not return a payment URL.');
});
test('Online Fees 2 still uses its existing pending API and ignores new fine data', async () => {
  render(<StudentOnlineFeePayment2Page />);
  expect(await screen.findByText('Rs. 1,000.00')).toBeInTheDocument();
  expect(screen.queryByText('Late fine: Rs. 30.00')).not.toBeInTheDocument();
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/studentonlinepayment/pending', expect.anything());
});
test('late fees ledger loads scoped paid records and summarizes unique students and payments', async () => {
  ep1.get.mockResolvedValue({ data: { data: [{ _id: 'paid1', studentonlinepaymentid: 'online1', regno: 'R1', paid: 30 }, { _id: 'paid2', studentonlinepaymentid: 'online1', regno: 'R1', paid: 20 }] } });
  render(<LateFeesLedgerPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  expect(await screen.findByText('Rs. 50.00')).toBeInTheDocument();
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/late-fees-ledger', expect.objectContaining({ params: expect.objectContaining({ colid: 42 }) }));
});
