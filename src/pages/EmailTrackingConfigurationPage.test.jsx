import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import EmailTrackingConfigurationPage from './EmailTrackingConfigurationPage';
import ep1 from '../api/ep1';

const mockShell = jest.fn();
jest.mock('./MenuPageShell', () => ({ children }) => { mockShell(); return <div>{children}</div>; });
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));

test('loads the saved origin, saves the latest value, and can disable tracking', async () => {
  ep1.get.mockResolvedValue({ data: { publicUrl: 'https://old.example.com' } });
  ep1.post.mockImplementation(async (_, payload) => ({ data: { publicUrl: payload.publicUrl.replace(/\/$/, '') } }));
  render(<EmailTrackingConfigurationPage />);
  const input = await screen.findByDisplayValue('https://old.example.com');
  const before = mockShell.mock.calls.length;
  fireEvent.change(input, { target: { value: 'https://new.example.com/' } });
  expect(mockShell).toHaveBeenCalledTimes(before);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Email tracking configuration saved');
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2-campaigns/tracking-settings', { publicUrl: 'https://new.example.com/' }, expect.anything());
  expect(input).toHaveValue('https://new.example.com');
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Email tracking disabled for future sends');
});
