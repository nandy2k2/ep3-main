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
    title: "Exam Scheduler Manual",
    path: "/conduct-exam-scheduler-manual",
    icon: <Today />,
    description: "Manually add, edit, bulk upload, and delete coursewise exam dates and slots."
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
    title: "Exam Barcode Generation",
    path: "/conduct-exam-barcode-generation",
    icon: <Badge />,
    description: "Load exam roll students, select one or more rows, and print barcode stickers using MongoDB codes."
  },
  {
    title: "Exam Barcode 2",
    path: "/conduct-exam-barcode-2",
    icon: <Badge />,
    description: "Print 100mm x 25mm exam barcode stickers in section-wise attendance format."
  },
  {
    title: "Exam Barcode 3",
    path: "/conduct-exam-barcode-3",
    icon: <Badge />,
    description: "Print 100mm x 26mm labels with 8 digit scanner friendly barcodes."
  },
  {
    title: "Exam Barcode 4",
    path: "/conduct-exam-barcode-4",
    icon: <Badge />,
    description: "Print a full-width 100mm x 26mm barcode label with exam code and section in spare space."
  },
  {
    title: "Exam Barcode 5",
    path: "/conduct-exam-barcode-5",
    icon: <Badge />,
    description: "Print right-aligned 100mm x 26mm barcode labels when browser scaling leaves unused space."
  },
  {
    title: "Seat Allocation",
    path: "/conduct-exam-seat-allocation",
    icon: <Assignment />,
    description: "Allocate seats and rooms for eligible exam roll students after barcode generation."
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
    title: "Generate Admit Card 3",
    path: "/conduct-exam-hall-ticket-3",
    icon: <Badge />,
    description: "Generate admit cards with required exam filters and improved bulk printing."
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

const feesAndScholarshipSteps = [
  ...steps.slice(0, 3),
  {
    title: "Exam Fees",
    path: "/conduct-exam-fees",
    icon: <Paid />,
    description: "Configure coursewise or examwise fee items used while students submit the examination form."
  },
  {
    title: "Exam Max Fees",
    path: "/conduct-exam-fees-max",
    icon: <Paid />,
    description: "Set maximum exam-fee caps for selected academic year, regulation, program, and exam combinations."
  },
  {
    title: "Exam Scholarship",
    path: "/exam-scholarship",
    icon: <Rule />,
    description: "Select students whose exam fee should become zero during preapproved form submission."
  },
  {
    title: "Pre Exam Eligibility",
    path: "/pre-exam-eligibility",
    icon: <FactCheck />,
    description: "Maintain barred students or courses so preapproved exam forms can skip ineligible course entries."
  },
  ...steps.slice(3)
];

export function ExaminationConductWizard2Page() {
  return (
    <EmbeddedWizardShell
      title="Examination Conduct Wizard 2"
      subtitle="Run the conduct examination setup with fee, maximum fee, scholarship, and pre-exam eligibility controls embedded."
      steps={feesAndScholarshipSteps}
      startLabel="Start conduct setup"
    />
  );
}
