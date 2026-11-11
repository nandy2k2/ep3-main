import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Crm2CampusQueuePage, { CampusQueueScreen } from './Crm2CampusQueuePages';
import ep1 from '../api/ep1';

jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows, slotProps }) => <div data-testid="bookings" data-quick-filter={slotProps.toolbar.showQuickFilter}>{rows.map(row => <div key={row._id}>{row.program} {row.user} {row.counter}</div>)}</div> }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: ({ title, onChange }) => <button type="button" onClick={() => onChange(title === 'Lead' ? { _id: 'lead1' } : { program: 'Engineering', programcode: '001' })}>{title}</button> }));

test('issues and shows a token for the selected lead and program', async () => {
  ep1.post.mockResolvedValue({ data: { data: { number: 7, program: 'Engineering', level: 1, status: 'Waiting' } } });
  render(<Crm2CampusQueuePage mode="issue" />);
  fireEvent.click(screen.getByRole('button', { name: 'Program' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lead' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate token' }));
  expect(await screen.findByText('Token 7')).toBeInTheDocument();
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-campus-queue/tokens', { programcode: '001', leadid: 'lead1' }, expect.anything());
});
test('generates a standalone screen link containing the signed permission', async () => {
  ep1.post.mockResolvedValue({ data: { colid: 42, programcode: '001', permission: 'signed' } });
  render(<Crm2CampusQueuePage mode="display" />);
  fireEvent.click(screen.getByRole('button', { name: 'Program' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate display link' }));
  const link = await screen.findByRole('link', { name: 'Open display' });
  const url = new URL(link.href);
  expect(url.pathname).toBe('/crm2-campus-queue-screen');
  expect(url.searchParams.get('permission')).toBe('signed');
  expect(url.searchParams.get('colid')).toBe('42');
});
test('public screen uses the link permission and shows token, level and counter', async () => {
  ep1.get.mockResolvedValue({ data: { program: 'Engineering', data: [{ number: 7, level: 2, title: 'Counselling', counter: 'C-2', status: 'Serving' }] } });
  render(<MemoryRouter initialEntries={['/crm2-campus-queue-screen?colid=42&programcode=001&permission=signed']}><CampusQueueScreen /></MemoryRouter>);
  expect(await screen.findByText('C-2')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Campus queue' })).toHaveTextContent('Counselling');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-campus-queue/public-display', expect.objectContaining({ params: { colid: '42', programcode: '001' }, headers: { Authorization: 'Bearer signed' } }));
});
test('shows the saved counter even when it is no longer selectable', async () => {
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('/my-levels') ? { data: [{ _id: 'level1', program: 'Engineering', level: 1 }] } : { data: [], current: 'counter1', savedCounter: { number: 'A1', active: 'No' } } }));
  render(<Crm2CampusQueuePage mode="booking" />);
  expect(await screen.findByText('Saved counter: A1 (inactive)')).toBeInTheDocument();
});
test('admin loads bookings for the chosen date with grid filters enabled', async () => {
  ep1.get.mockResolvedValue({ data: { day: '2026-11-11', data: [{ _id: 'booking1', program: 'Engineering', user: 'Ann', counter: 'A1' }] } });
  render(<Crm2CampusQueuePage mode="admin" />);
  fireEvent.change(screen.getByLabelText('Booking date'), { target: { value: '2026-11-11' } });
  fireEvent.click(screen.getByRole('button', { name: 'Load bookings' }));
  expect(await screen.findByText('Engineering Ann A1')).toBeInTheDocument();
  expect(screen.getByTestId('bookings')).toHaveAttribute('data-quick-filter', 'true');
  expect(ep1.get).toHaveBeenCalledWith('/api/v2/crm2-campus-queue/counter-admin', expect.objectContaining({ params: { day: '2026-11-11' } }));
});
