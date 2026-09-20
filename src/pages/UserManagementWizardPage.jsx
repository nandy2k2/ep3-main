import React from "react";
import {
  AccountTree,
  Assignment,
  Badge,
  CameraAlt,
  Checklist,
  Groups,
  ManageAccounts
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Non student user",
    path: "/userdataupload",
    icon: <ManageAccounts />,
    description: "Create and maintain non-student users with role, department, designation and login details."
  },
  {
    title: "Menu access management",
    path: "/menuaccesscontrol",
    icon: <Checklist />,
    description: "Assign rolewise menu groups and pages after the user role is created."
  },
  {
    title: "Organizational hierarchy",
    path: "/organizationhierarchy",
    icon: <AccountTree />,
    description: "Map reporting relationships for approvals, dashboards and team reports."
  },
  {
    title: "User photo upload",
    path: "/userphotoupload",
    icon: <CameraAlt />,
    description: "Upload staff/faculty profile photos."
  },
  {
    title: "Consent form setup",
    path: "/userconsentcontent",
    icon: <Assignment />,
    description: "Configure rolewise consent text before users submit or update sensitive profile data."
  },
  {
    title: "Exclude user",
    path: "/exclude-user",
    icon: <Groups />,
    description: "Bulk mark users as excluded or active for accreditation and reporting."
  },
  {
    title: "Rolewise documents",
    path: "/userdocumentrequirements",
    icon: <Badge />,
    description: "Configure rolewise document requirements for uploads and verification."
  }
];

export default function UserManagementWizardPage() {
  return (
    <EmbeddedWizardShell
      title="User Management Wizard"
      subtitle="Follow the user setup sequence using the original live pages."
      steps={steps}
      startLabel="Start user setup"
    />
  );
}
