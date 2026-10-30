import React from 'react';
import { AccountTree, Assignment, Business, Category, Contacts, Description, Forum, Groups, Language, LocationOn, School, Star, Tune } from '@mui/icons-material';
import EmbeddedWizardShell from './EmbeddedWizardShell';
export const crm2SetupSteps = [
  { title: 'Program management', path: '/programmanagement', icon: <School /> },
  { title: 'Source master', path: '/crm2-source-master', icon: <Tune /> },
  { title: 'Pipeline master', path: '/crm2-pipeline-master', icon: <AccountTree /> },
  { title: 'Type master', path: '/crm2-type-master', icon: <Category /> },
  { title: 'Category master', path: '/crm2-category-master', icon: <Category /> },
  { title: 'Lead rating master', path: '/crm2-leadrating-master', icon: <Star /> },
  { title: 'Case master', path: '/crm2-case-master', icon: <Assignment /> },
  { title: 'Distribution type master', path: '/crm2-distributiontype-master', icon: <AccountTree /> },
  { title: 'Medium of instruction master', path: '/crm2-mediumofinstruction-master', icon: <Language /> },
  { title: 'Quota master', path: '/crm2-quota-master', icon: <Groups /> },
  { title: 'Document master', path: '/crm2-document-master', icon: <Description /> },
  { title: 'Admission office master', path: '/crm2-admissionoffice-master', icon: <Business /> },
  { title: 'Interaction master', path: '/crm2-interactionmode-master', icon: <Forum /> },
  { title: 'Agent master', path: '/crm2-agent-master', icon: <Contacts /> },
  { title: 'Address master', path: '/crm2-address-master', icon: <LocationOn /> },
  { title: 'Counselor program mapping', path: '/crm2-counselor-program-mapping', icon: <Groups /> },
  { title: 'Program form mapping', path: '/crm2-program-form-mapping', icon: <Description /> }
];
export default function Crm2SetupWizardPage() {
  return <EmbeddedWizardShell title="CRM 2 Setup Wizard" subtitle="CRM 2 configuration" steps={crm2SetupSteps} startLabel="Start CRM 2 setup" />;
}
