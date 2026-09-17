import React from "react";
import {
  AssignmentInd,
  CalendarMonth,
  Checklist,
  FactCheck,
  Map,
  MenuBook,
  School,
  UploadFile
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
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
    title: "Regulation Subjects",
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
