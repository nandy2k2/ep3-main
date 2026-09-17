import React from "react";
import { AutoStories, Checklist, Map } from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Regulation Course Map",
    path: "/regulationcoursemap",
    icon: <Map />,
    description: "Map academic year, regulation, program, semester, course, course code, credits, delivery type, faculty, institution, and department."
  },
  {
    title: "Syllabus",
    path: "/syllabus",
    icon: <AutoStories />,
    description: "Create modules and topics for each mapped course, with bulk upload and AI generation where available."
  },
  {
    title: "CO List",
    path: "/colist",
    icon: <Checklist />,
    description: "Define course outcomes, CO numbers, descriptions, Bloom taxonomy levels, and related attainment inputs."
  }
];

export default function FacultyAcademicWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Faculty Wizard"
      subtitle="Complete the faculty academic setup using the original course map, syllabus, and CO pages embedded in sequence."
      steps={steps}
      startLabel="Start faculty setup"
    />
  );
}
