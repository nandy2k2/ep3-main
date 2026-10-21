import React from "react";
import { Assignment, Checklist, Map, Sync, Work } from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Regulation Course Map",
    path: "/regulationcoursemap",
    icon: <Map />,
    description: "Map courses with academic year, regulation, program, semester, course and course code."
  },
  {
    title: "Workload Allocation",
    path: "/workloadassignment",
    icon: <Work />,
    description: "Assign courses to faculty so faculty-specific internal marks entry can load the correct courses."
  },
  {
    title: "Internal Marks Entry Admin",
    path: "/internal-marks-entry-admin",
    icon: <Assignment />,
    description: "Admin entry screen for internal marks where administrators can select faculty and enter marks."
  },
  {
    title: "Elective Enrollment",
    path: "/neplmselectiveenrollment",
    icon: <Checklist />,
    description: "Enroll students in elective courses."
  },
  {
    title: "Internal Marks Entry Elective Admin",
    path: "/internal-marks-entry-elective-admin",
    icon: <Assignment />,
    description: "Select a user and course, then enter marks for approved elective enrollments."
  },
  {
    title: "Internal Marks Entry Approval",
    path: "/internal-marks-approval",
    icon: <Checklist />,
    description: "Review submitted internal marks and approve or reject them."
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
      subtitle="Manage course mapping, workload, regular and elective marks, approval and interim processing."
      steps={steps}
      startLabel="Start internal marks setup"
    />
  );
}
