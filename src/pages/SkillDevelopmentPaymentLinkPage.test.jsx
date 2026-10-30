import React from 'react';
import { render, screen } from '@testing-library/react';
import ep1 from '../api/ep1';
import Page from './SkillDevelopmentPaymentLinkPage';
jest.mock('../api/ep1', () => ({ post: jest.fn() }));
beforeEach(() => { window.history.replaceState(null, '', '/skill-development-payment-link'); });
test('missing query parameters do not initiate a payment', async () => {
  render(<Page />);
  expect(await screen.findByText('The payment link requires colid, regno and amount.')).toBeTruthy();
  expect(ep1.post).not.toHaveBeenCalled();
});
test('return token verifies payment and shows logout instruction', async () => {
  window.history.replaceState(null, '', '/skill-development-payment-link?token=test-token');
  ep1.post.mockResolvedValue({ data: { paid: true, message: 'Please logout and login again.' } });
  render(<Page />);
  expect(await screen.findByText('Please logout and login again.')).toBeTruthy();
  expect(ep1.post).toHaveBeenCalledWith('/api/v2/skill-payment-link/verify', { token: 'test-token' });
});
