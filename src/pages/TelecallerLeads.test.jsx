import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TelecallerLeadDetails } from './TelecallerLeads';
import { Crm2DashboardContext } from './Crm2DashboardContext';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./CounselorTaskReport', () => () => <div>Read only tasks</div>);
beforeEach(() => {
  ep1.get.mockImplementation(async url => ({ data: { data: url.endsWith('pipeline-options') ? [{ name: 'New' }, { name: 'Interested' }] : [] } }));
  ep1.post.mockResolvedValue({ data: { success: true } });
});
test('telecaller details keep profile read-only and save only pipeline or note fields', async () => {
  render(<Crm2DashboardContext.Provider value={{ academicyear: '2026-27', endpoint: '/api/v2/crm2-telecaller-dashboard', readOnly: true }}><TelecallerLeadDetails lead={{ _id: 'lead1', name: 'Ann', pipeline: 'New', email: 'ann@example.com' }} /></Crm2DashboardContext.Provider>);
  expect(screen.getByText('Ann')).toBeInTheDocument(); expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Pipeline stage' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Interested' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save pipeline' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-telecaller-dashboard/lead/lead1/pipeline', { academicyear: '2026-27', pipeline: 'Interested' }, expect.anything()));
  await screen.findByText('Saved');
  fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
  fireEvent.change(screen.getByLabelText('Lead note'), { target: { value: 'Called today' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-telecaller-dashboard/lead/lead1/notes', { academicyear: '2026-27', note: 'Called today' }, expect.anything()));
  expect(screen.queryByRole('button', { name: /delete|assign|save profile/i })).not.toBeInTheDocument();
});
