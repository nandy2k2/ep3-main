import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Crm2Applications from './Crm2Applications';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: ({ onChange }) => <button onClick={() => onChange({ _id: 'mapping1' })}>Choose program</button> }));
jest.mock('./PublicAdmissionApplyTabbedProgramDraftPage', () => ({ crmContext }) => <div>Embedded form for {crmContext.application.programapplied}</div>);
const lead = { _id: 'lead1' };
const application = { _id: 'app1', applicationnumber: 'APP-1', programapplied: 'Science', programcode: 'P1', academicyear: '2026-27', applicationstatus: 'Draft', paymentstatus: 'Paid', provisionalpaymentstatus: 'Pending' };
beforeEach(() => {
  ep1.get.mockResolvedValue({ data: { data: [application] } });
  ep1.post.mockResolvedValue({ data: { data: application } });
});
test('lists all applications with program and both payment statuses and reopens the form in a modal', async () => {
  render(<Crm2Applications lead={lead} mode="my" />);
  await screen.findByRole('button', { name: 'APP-1' });
  expect(screen.getByText('Paid')).toBeInTheDocument(); expect(screen.getByText('Pending')).toBeInTheDocument();
  expect(ep1.get.mock.calls[0][1].params).toMatchObject({ leadid: 'lead1', leadmode: 'my' });
  fireEvent.click(screen.getByRole('button', { name: 'APP-1' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(screen.getByText('Embedded form for Science')).toBeInTheDocument();
});
test('new application uses the selected program mapping and opens its returned draft', async () => {
  render(<Crm2Applications lead={lead} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'New application' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'New application' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose program' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open form' }));
  await screen.findByText('Embedded form for Science');
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2/applications/new', expect.objectContaining({ leadid: 'lead1', mappingid: 'mapping1' }));
});
