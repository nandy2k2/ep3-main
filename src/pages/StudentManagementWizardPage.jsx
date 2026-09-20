import React from "react";
import {
  Badge,
  CameraAlt,
  FamilyRestroom,
  Hotel,
  Payment,
  ReceiptLong,
  School
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Student data upload",
    path: "/studentdataupload",
    icon: <School />,
    description: "Create or bulk upload student academic and profile data."
  },
  {
    title: "Student photo upload",
    path: "/studentphotoupload",
    icon: <CameraAlt />,
    description: "Upload student photos for profile, ID card and exam forms."
  },
  {
    title: "Fees Application",
    path: "/feeapplication",
    icon: <Payment />,
    description: "Apply fee structures to selected students with dynamic filters."
  },
  {
    title: "Fees Application Auto",
    path: "/feesapplicationauto",
    icon: <ReceiptLong />,
    description: "Auto-apply configured fees based on student academic data."
  },
  {
    title: "Generate ID card",
    path: "/idcardmanager",
    icon: <Badge />,
    description: "Generate ID cards after student data and photos are ready."
  },
  {
    title: "Parent management",
    path: "/student-parent-management-wizard",
    icon: <FamilyRestroom />,
    description: "Add parent details and link one or more selected students to the parent."
  },
  {
    title: "Hostel assignment",
    path: "/hostelassignment",
    icon: <Hotel />,
    description: "Assign hostel beds or rooms after student admission details are ready."
  }
];

export default function StudentManagementWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Student Management Wizard"
      subtitle="Follow the student lifecycle setup using original live pages and the combined parent-management step."
      steps={steps}
      startLabel="Start student setup"
    />
  );
}
