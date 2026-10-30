import React from 'react';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import Actions, { facultyActions } from './FacultyDashboardActions';
import { persistGlobalSession } from './global1';
jest.mock('./global1', () => ({ persistGlobalSession: jest.fn() }));
test('all ten actions open the existing page in a menu-free dialog', async () => {
  render(<Actions />);
  expect(facultyActions).toHaveLength(10);
  for (const action of facultyActions) {
    fireEvent.click(screen.getByRole('button', { name: action.title, exact: true }));
    const dialog = screen.getByRole('dialog');
    const frame = within(dialog).getByTitle(`${action.title} workspace`);
    expect(frame).toHaveAttribute('src', `${action.path}?embedded=1`);
    expect(within(dialog).getByRole('status')).toHaveTextContent(`Loading ${action.title}`);
    fireEvent.load(frame);
    expect(within(dialog).queryByRole('status')).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close workspace' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  }
  expect(persistGlobalSession).toHaveBeenCalledTimes(10);
});
