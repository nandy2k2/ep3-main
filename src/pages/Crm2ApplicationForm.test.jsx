import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Form from './PublicAdmissionApplyTabbedProgramDraftPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
const application = { _id: 'app1', formid: 'F1', academicyear: '2026-27', name: 'Ann', email: 'ann@example.com', phone: '123', programapplied: 'Science', programcode: 'P1', programtype: 'UG', applicationstatus: 'Draft' };
beforeEach(() => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: url.includes('/applications/application') ? application : url.startsWith('/vins') ? { institutionname: 'College' } : url.startsWith('/admission-dynamic/form?') ? { title: 'Application form' } : url.includes('mastergateway') ? { data: [] } : [] }));
  ep1.post.mockResolvedValue({ data: application });
});
test('CRM mode preloads identity and locks the program, retaining dynamic form draft saving', async () => {
  const saveRef = { current: null }, scope = { colid: 42, user: 'staff@example.com', leadid: 'lead1', leadmode: 'my' };
  render(<MemoryRouter><Form crmContext={{ colid: 42, application, scope, saveRef }} /></MemoryRouter>);
  await screen.findByDisplayValue('Ann');
  expect(screen.getByLabelText('Selected program')).toHaveValue('Science');
  expect(screen.getByLabelText('Selected program')).toHaveAttribute('readonly');
  expect(screen.queryByText('Retrieve Application and Continue Editing')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'New address' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save This Tab' }));
  await waitFor(() => expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2/applications/save', expect.objectContaining({ id: 'app1', leadid: 'lead1', programcode: 'P1', address: 'New address', submit: false }), undefined));
  await screen.findByText(/Draft saved successfully/);
});
