import React from "react";
import {
  Assessment,
  CameraAlt,
  FactCheck,
  HowToReg,
  LowPriority,
  MenuBook,
  PersonSearch,
  School,
  TableChart,
  VpnKey
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "My Syllabus",
    path: "/mysyllabus",
    icon: <School />,
    description: "Open faculty syllabus entry for assigned courses before working in the LMS course workspace."
  },
  {
    title: "My CO",
    path: "/myco",
    icon: <School />,
    description: "Open faculty course outcome entry for assigned courses before creating LMS content."
  },
  {
    title: "Course Workspace",
    path: "/neplmscourseworkspace",
    icon: <MenuBook />,
    description: "Create and manage course material, assignments, lesson plans, quizzes, sequences, and class resources."
  },
  {
    title: "Elective Enrollment",
    path: "/neplmselectiveenrollment",
    icon: <HowToReg />,
    description: "Enroll students into elective courses and review approved elective allocations."
  },
  {
    title: "Sectionwise Attendance",
    path: "/neplmssectionwiseattendance",
    icon: <FactCheck />,
    description: "Take attendance sectionwise for scheduled LMS classes."
  },
  {
    title: "Photo Attendance",
    path: "/neplmsphotoattendance",
    icon: <CameraAlt />,
    description: "Take attendance using registered student photos."
  },
  {
    title: "OTP Attendance",
    path: "/neplmsotpattendance",
    icon: <VpnKey />,
    description: "Take OTP based attendance for selected LMS classes."
  },
  {
    title: "Studentwise Attendance Report",
    path: "/neplmsstudentwiseattendance",
    icon: <PersonSearch />,
    description: "Review studentwise attendance percentage and details."
  },
  {
    title: "Student Coursewise Attendance",
    path: "/neplmsstudentcoursewiseattendance",
    icon: <Assessment />,
    description: "Review attendance coursewise for selected students and filters."
  },
  {
    title: "Monthwise Theory Practical Attendance",
    path: "/neplmsmonthwisetheorypracticalattendance",
    icon: <TableChart />,
    description: "View monthwise theory and practical attendance for students."
  },
  {
    title: "Low Attendance Report",
    path: "/neplmslowattendance",
    icon: <LowPriority />,
    description: "Identify students below the required attendance threshold."
  },
  {
    title: "Faculty Course Low Attendance",
    path: "/neplmsfacultycourselowattendance",
    icon: <LowPriority />,
    description: "Review low attendance by faculty and course."
  }
];

export default function LmsWizardPage() {
  return (
    <EmbeddedWizardShell
      title="LMS Wizard"
      subtitle="Use the original LMS pages in one embedded flow for course workspace, attendance, and attendance reports."
      steps={steps}
      startLabel="Start LMS flow"
    />
  );
}
