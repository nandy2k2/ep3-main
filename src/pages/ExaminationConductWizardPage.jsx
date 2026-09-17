import React from "react";
import {
  Assignment,
  Article,
  Badge,
  FactCheck,
  Paid,
  PlaylistAddCheck,
  Rule,
  School,
  Summarize,
  Sync,
  Today
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Assessment Components",
    path: "/assessmentcomponent",
    icon: <PlaylistAddCheck />,
    description: "Define internal, external, theory, practical, and viva components used during marks entry and processing."
  },
  {
    title: "Create Exam",
    path: "/conduct-exam-master",
    icon: <School />,
    description: "Create the examination master with academic year, regulation, exam name, exam code, session, type, and semester."
  },
  {
    title: "Populate Exam Courses",
    path: "/conduct-exam-populate-courses",
    icon: <Assignment />,
    description: "Populate courses for selected programs using regulation course map data."
  },
  {
    title: "Exam Auto Scheduler 3",
    path: "/conduct-exam-auto-scheduler-3",
    icon: <Today />,
    description: "Allocate dates and slots using configured slots, date ranges, and optional holiday-list checking."
  },
  {
    title: "Exam Scheduler Report",
    path: "/conduct-exam-course-scheduler-report",
    icon: <Summarize />,
    description: "Review scheduled courses with dynamic filters, summary cards, charts, details, and print preview."
  },
  {
    title: "Populate Exam Dates",
    path: "/conduct-exam-populate-dates",
    icon: <Sync />,
    description: "Compare scheduler dates with exam roll dates and update selected coursewise exam roll dates."
  },
  {
    title: "ATKT Scheduler",
    path: "/conduct-exam-atkt-scheduler",
    icon: <FactCheck />,
    description: "Build supplementary course and exam-roll entries from failed student data for the selected exam."
  },
  {
    title: "Exam Form Builder",
    path: "/conduct-exam-form-builder",
    icon: <Article />,
    description: "Configure fields and editable profile details for the student dynamic exam form."
  },
  {
    title: "Student Exam Form",
    path: "/conduct-exam-student-form",
    icon: <Assignment />,
    description: "Generate and print the student exam form from exam roll and student profile details."
  },
  {
    title: "Examroll Rules Check",
    path: "/examrollrulescheck",
    icon: <Rule />,
    description: "Check and bulk update attendance, fee, disciplinary, backlog, ATKT, and admit-card eligibility rules."
  },
  {
    title: "Generate Hall Ticket 2",
    path: "/conduct-exam-hall-ticket-2",
    icon: <Badge />,
    description: "Generate admit cards in the second printable format for selected students."
  },
  {
    title: "Exam Rate Card",
    path: "/conduct-exam-rate-card",
    icon: <Paid />,
    description: "Configure rates for paper setters, moderators, examiners, and practical examination work."
  }
];

export default function ExaminationConductWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Examination Conduct Wizard 1"
      subtitle="Run the conduct examination setup through the original live pages, embedded step by step."
      steps={steps}
      startLabel="Start conduct setup"
    />
  );
}
