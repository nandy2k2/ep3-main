import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import Page, { excelAttendanceRows } from './HrBiometricAttendancePage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ Link: ({ children }) => <span>{children}</span> }));
jest.mock('./global1', () => ({ colid: 42, user: 'admin@example.com' }));
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: () => <div>Attendance grid</div> }));
beforeEach(() => {
  window.confirm = jest.fn(() => true);
  ep1.get.mockResolvedValue({ data: { data: [] } });
  ep1.post.mockResolvedValue({ data: { results: [{ success: true, data: {} }] } });
});
test('no initial records load and saving submits biometric ID, not employee details', async () => {
  render(<Page />);
  expect(ep1.get).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Employee')).toBeNull();
  fireEvent.change(screen.getByLabelText('Biometric ID'), { target: { value: '00012' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save / reprocess' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalled());
  const body = ep1.post.mock.calls[0][1];
  expect(body.colid).toBe(42); expect(body.rows[0].biometricid).toBe('00012');
  expect(body.rows[0].employeeemail).toBeUndefined();
  expect(await screen.findByText('1 processed; 0 failed')).toBeTruthy();
});
test('Excel conversion retains formatted leading-zero IDs and converts Excel date serials', () => {
  const sheet = XLSX.utils.aoa_to_sheet([['academicyear', 'biometricid', 'date', 'attendance'], ['2026-27', 12, 46314, 0]]);
  sheet.B2.z = '00000'; sheet.C2.z = 'm/d/yy';
  const row = excelAttendanceRows(sheet)[0];
  expect(row.biometricid).toBe('00012'); expect(row.date).toMatch(/^2026-\d{2}-\d{2}$/); expect(row.attendance).toBe('0');
});
