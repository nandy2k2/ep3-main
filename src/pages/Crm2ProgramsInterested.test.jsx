import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Editor from './Crm2ProgramsInterested';
import { Crm2DashboardContext } from './Crm2DashboardContext';
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: ({ title, onChange, disabled, params }) => <button disabled={disabled} onClick={() => onChange(title === 'Academic year for programs' ? { name: '2026-27' } : [{ program: 'Pharmacy', programcode: '012' }, { program: 'Science', programcode: '013' }])}>{title}{params?.academicyear ? ` ${params.academicyear}` : ''}</button> }));
test('dashboard fixes the program year and hides other-year priorities without removing saved programs', () => {
  render(<Crm2DashboardContext.Provider value={{ academicyear: '2026-27' }}><Editor value={[{ academicyear: '2025-26', program: 'Old', programcode: 'OLD' }]} onChange={() => {}} /></Crm2DashboardContext.Provider>);
  expect(screen.getByRole('button', { name: 'Academic year for programs' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Programs interested 2026-27' })).toBeEnabled();
  expect(screen.queryByText(/Old \(OLD\)/)).not.toBeInTheDocument();
});
test('selecting multiple programs retains other years and auto selects their codes', () => {
  const onChange = jest.fn();
  render(<Editor value={[{ academicyear: '2025-26', program: 'Old', programcode: 'OLD' }]} onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Programs interested' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Academic year for programs' }));
  fireEvent.click(screen.getByRole('button', { name: 'Programs interested 2026-27' }));
  expect(onChange).toHaveBeenCalledWith([
    { academicyear: '2025-26', program: 'Old', programcode: 'OLD' },
    { academicyear: '2026-27', program: 'Pharmacy', programcode: '012', priority: 2 },
    { academicyear: '2026-27', program: 'Science', programcode: '013', priority: 3 }
  ]);
});
test('each interested program has an editable priority', () => {
  const onChange = jest.fn();
  render(<Editor value={[{ academicyear: '2026-27', program: 'Science', programcode: '012', priority: 1 }]} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Priority for Science (012)'), { target: { value: '2' } });
  expect(onChange).toHaveBeenCalledWith([{ academicyear: '2026-27', program: 'Science', programcode: '012', priority: '2' }]);
});
