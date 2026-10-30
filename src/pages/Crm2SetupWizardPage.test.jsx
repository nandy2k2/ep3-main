import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Page, { crm2SetupSteps } from './Crm2SetupWizardPage';
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./global1', () => ({ persistGlobalSession: jest.fn() }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
test('includes all seventeen requested original pages in order', () => {
  expect(crm2SetupSteps.map(step => step.path)).toEqual(['/programmanagement','/crm2-source-master','/crm2-pipeline-master','/crm2-type-master','/crm2-category-master','/crm2-leadrating-master','/crm2-case-master','/crm2-distributiontype-master','/crm2-mediumofinstruction-master','/crm2-quota-master','/crm2-document-master','/crm2-admissionoffice-master','/crm2-interactionmode-master','/crm2-agent-master','/crm2-address-master','/crm2-counselor-program-mapping','/crm2-program-form-mapping']);
});
test('embeds the original pages without menus and shows loading feedback when changing steps', () => {
  render(<Page />);
  expect(screen.getByTitle('Program management')).toHaveAttribute('src', '/programmanagement?embedded=1');
  expect(screen.getByText('Loading Program management...')).toBeInTheDocument();
  fireEvent.load(screen.getByTitle('Program management'));
  expect(screen.queryByText('Loading Program management...')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByTitle('Source master')).toHaveAttribute('src', '/crm2-source-master?embedded=1');
  expect(screen.getByText('Loading Source master...')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Program form mapping' }));
  expect(screen.getByTitle('Program form mapping')).toHaveAttribute('src', '/crm2-program-form-mapping?embedded=1');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});
