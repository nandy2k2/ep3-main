import React from "react";
import {
  AccountTree,
  Badge,
  Business,
  CorporateFare,
  Domain,
  Groups
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Institution details",
    path: "/insdetails",
    icon: <Business />,
    description: "Update the institution name, address, logo and official details used across print previews and reports."
  },
  {
    title: "Master institution list",
    path: "/academic-master-institutions",
    icon: <CorporateFare />,
    description: "Create the institution master values used by programs, users and configuration screens."
  },
  {
    title: "Master faculty list",
    path: "/academic-master-faculties",
    icon: <Domain />,
    description: "Maintain faculty/school master values such as Faculty of Engineering, Faculty of Science and similar units."
  },
  {
    title: "Designation master",
    path: "/academic-designations",
    icon: <Badge />,
    description: "Maintain employee designation master values before creating non-student users."
  },
  {
    title: "Department faculty",
    path: "/academic-master-departments",
    icon: <AccountTree />,
    description: "Map departments under the selected institution and faculty so program and user pages can cascade correctly."
  },
  {
    title: "Non student user",
    path: "/mbuser",
    icon: <Groups />,
    description: "Create staff and other non-student users with role, institution, department and designation."
  }
];

export default function MasterSetupWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Master Setup Wizard"
      subtitle="Complete the core institution, faculty, designation, department and staff setup using the original live pages."
      steps={steps}
      startLabel="Start master setup"
    />
  );
}
