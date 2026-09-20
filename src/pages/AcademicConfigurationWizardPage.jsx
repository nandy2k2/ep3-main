import React from "react";
import {
  AssignmentInd,
  CalendarMonth,
  Checklist,
  CorporateFare,
  Domain,
  EmojiEvents,
  FactCheck,
  Map,
  MenuBook,
  School,
  Badge,
  UploadFile
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Master institution list",
    path: "/academic-master-institutions",
    icon: <CorporateFare />,
    description: "Create and verify institution master values before defining programs."
  },
  {
    title: "Master faculty list",
    path: "/academic-master-faculties",
    icon: <Domain />,
    description: "Create faculty or school master values used by program management."
  },
  {
    title: "Designation master",
    path: "/academic-designations",
    icon: <Badge />,
    description: "Create designation values used by users, workload and HR configuration."
  },
  {
    title: "Department faculty",
    path: "/academic-master-departments",
    icon: <CorporateFare />,
    description: "Map departments under institution and faculty so program management can cascade correctly."
  },
  {
    title: "Program",
    path: "/programmanagement",
    icon: <School />,
    description: "Create and verify program master data before using it in regulation, students, workload, and timetable."
  },
  {
    title: "Regulation",
    path: "/regulationmaster",
    icon: <MenuBook />,
    description: "Define the regulation framework for the academic year and program structure."
  },
  {
    title: "Student Data Upload",
    path: "/studentdataupload",
    icon: <UploadFile />,
    description: "Upload or update student academic and profile records."
  },
  {
    title: "Regulation Group",
    path: "/regulationsubjects",
    icon: <Checklist />,
    description: "Define subject and course choices under the selected regulation and program."
  },
  {
    title: "Regulation Course Map",
    path: "/regulationcoursemap",
    icon: <Map />,
    description: "Map courses to academic year, regulation, program, semester, credits, type, faculty, institution, and department."
  },
  {
    title: "PO",
    path: "/program-outcomes",
    icon: <EmojiEvents />,
    description: "Define program outcomes for academic year, regulation, and program, with optional AI generation."
  },
  {
    title: "CO",
    path: "/colist",
    icon: <FactCheck />,
    description: "Define course outcomes after courses are mapped for the regulation and program."
  },
  {
    title: "Elective Enrollment",
    path: "/neplmselectiveenrollment",
    icon: <FactCheck />,
    description: "Enroll and approve students for elective courses after course mapping and student data are ready."
  },
  {
    title: "Workload",
    path: "/workloadassignment",
    icon: <AssignmentInd />,
    description: "Allocate mapped courses to faculties and confirm teaching responsibility."
  },
  {
    title: "Timetable Manager Sectionwise",
    path: "/neplmssectionwisetimetable",
    icon: <CalendarMonth />,
    description: "Create sectionwise classes from the finalized academic structure."
  }
];

export default function AcademicConfigurationWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Academic Configuration Wizard"
      subtitle="Follow the setup sequence from program master to sectionwise timetable using the original live pages."
      steps={steps}
      startLabel="Start setup"
    />
  );
}
