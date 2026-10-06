import React from "react";
import { Assignment, Checklist, DateRange, Map, Sync, Work } from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Regulation Course Map",
    path: "/regulationcoursemap",
    icon: <Map />,
    description: "Map courses with academic year, regulation, program, semester, course and course code."
  },
  {
    title: "Assessment Component",
    path: "/assessmentcomponent",
    icon: <Checklist />,
    description: "Configure component type, score type, assessment component, marks, pass marks and weightage."
  },
  {
    title: "Workload Allocation",
    path: "/workloadassignment",
    icon: <Work />,
    description: "Assign courses to faculty so faculty-specific internal marks entry can load the correct courses."
  },
  {
    title: "Internal Marks Entry Dates",
    path: "/internal-marks-entry-dates",
    icon: <DateRange />,
    description: "Activate start and end dates for faculty internal marks entry by exam, program and semester."
  },
  {
    title: "Internal Marks Entry Admin",
    path: "/internal-marks-entry-admin",
    icon: <Assignment />,
    description: "Admin entry screen for internal marks where administrators can select faculty and enter marks."
  },
  {
    title: "Interim Processing",
    path: "/exammodel2-interim-marks-transfer",
    icon: <Sync />,
    description: "Process interim component marks and transfer them into the next marks processing stage."
  }
];

export default function InternalMarksEntryWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Internal Marks Entry Wizard"
      subtitle="Configure courses, components, workload, date windows and admin marks entry through embedded live pages."
      steps={steps}
      startLabel="Start internal marks setup"
    />
  );
}
