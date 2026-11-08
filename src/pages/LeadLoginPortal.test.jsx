import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LeadLoginPortal from './LeadLoginPortal';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ post: jest.fn(), request: jest.fn() }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: () => <div>Searchable choice</div> }));
jest.mock('./Crm2Education', () => () => <div>Education editor</div>);
jest.mock('./Crm2ProgramsInterested', () => ({ portal }) => <div>{portal ? 'Portal programs' : 'Staff programs'}</div>);
jest.mock('./Crm2Applications', () => ({ portal, lead }) => <div>{portal ? 'Own applications' : 'Staff applications'} {lead._id}</div>);
const lead = { _id: 'lead1', colid: 42, name: 'Ann', email: 'ann@example.com', phone: '1234567890' };
const fields = [{ field: 'name', label: 'name', group: 'Identity', type: 'String' }, { field: 'email', label: 'email', group: 'Identity', type: 'String' }];
beforeEach(() => {
  sessionStorage.clear();
  ep1.post.mockResolvedValue({ data: { token: 'lead-token' } });
  ep1.request.mockImplementation(async config => ({ data: { data: config.method === 'post' && config.url.endsWith('/profile') ? { ...lead, ...config.data } : lead, fields } }));
});
test('logs in with Lead master credentials and loads the self profile using its separate token', async () => {
  render(<MemoryRouter><LeadLoginPortal /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: lead.email } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByDisplayValue('Ann');
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/lead-portal/login', expect.objectContaining({ email: lead.email, password: 'password' }));
  expect(ep1.request).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/v2/lead-portal/profile', headers: { Authorization: 'Bearer lead-token' } }));
  expect(sessionStorage.getItem('crm2LeadPortalToken')).toBe('lead-token');
  expect(sessionStorage.getItem('password')).toBeNull();
});
test('saves edited profile before opening own applications and exposes interested programs', async () => {
  sessionStorage.setItem('crm2LeadPortalToken', 'lead-token');
  render(<MemoryRouter><LeadLoginPortal /></MemoryRouter>);
  await screen.findByDisplayValue('Ann');
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ann updated' } });
  fireEvent.click(screen.getByRole('tab', { name: 'Applications' }));
  await screen.findByText('Own applications lead1');
  expect(ep1.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'post', url: '/api/v2/lead-portal/profile', data: expect.objectContaining({ name: 'Ann updated' }) }));
  fireEvent.click(screen.getByRole('tab', { name: 'Programs interested' }));
  expect(screen.getByText('Portal programs')).toBeInTheDocument();
});
test('expired sessions return to lead login instead of staff login', async () => {
  sessionStorage.setItem('crm2LeadPortalToken', 'expired');
  ep1.request.mockRejectedValue({ response: { status: 401, data: { message: 'Session expired' } } });
  render(<MemoryRouter><LeadLoginPortal /></MemoryRouter>);
  await screen.findByRole('button', { name: 'Log in' });
  await waitFor(() => expect(sessionStorage.getItem('crm2LeadPortalToken')).toBeNull());
});

test('saves a pasted link or an AWS upload as the lead profile photo', async () => {
  sessionStorage.setItem('crm2LeadPortalToken', 'lead-token');
  const awsUrl = 'https://example.s3.amazonaws.com/lead.jpg';
  ep1.request.mockImplementation(async config => config.url.endsWith('/upload')
    ? { data: { url: awsUrl } }
    : { data: { data: config.method === 'post' ? { ...lead, ...config.data } : lead, fields } });
  render(<MemoryRouter><LeadLoginPortal /></MemoryRouter>);
  const link = await screen.findByLabelText('Photo link');
  fireEvent.change(link, { target: { value: 'https://example.com/lead.jpg' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(ep1.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'post', data: expect.objectContaining({ photo: 'https://example.com/lead.jpg' }) })));
  const fileInput = screen.getByText('Upload photo to AWS').querySelector('input');
  fireEvent.change(fileInput, { target: { files: [new File(['test'], 'lead.jpg', { type: 'image/jpeg' })] } });
  await screen.findByDisplayValue(awsUrl);
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(ep1.request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'post', data: expect.objectContaining({ photo: awsUrl }) })));
});
