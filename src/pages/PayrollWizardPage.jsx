import React from "react";
import {
  AccountBalanceWallet,
  AssignmentTurnedIn,
  Calculate,
  Payments,
  ReceiptLong,
  Summarize,
  TableChart
} from "@mui/icons-material";
import EmbeddedWizardShell from "./EmbeddedWizardShell";

const steps = [
  {
    title: "Salary structure",
    path: "/salary-structure",
    icon: <ReceiptLong />,
    description: "Define salary structure components and recurring payroll heads."
  },
  {
    title: "Assign Salary Structure",
    path: "/salassign1",
    icon: <AssignmentTurnedIn />,
    description: "Assign an active salary structure to employees before monthly salary population."
  },
  {
    title: "Employee Salary Structure new",
    path: "/employee-salary-structure-new",
    icon: <AccountBalanceWallet />,
    description: "Maintain employee-wise salary components with searchable employee and component selection."
  },
  {
    title: "Populate Salary",
    path: "/salarytransfer",
    icon: <Payments />,
    description: "Generate monthly salary entries from assigned salary structures and payroll inputs."
  },
  {
    title: "Populate Arrear",
    path: "/populatearrear",
    icon: <Calculate />,
    description: "Populate prorated arrears using salary structure effective dates and applied dates."
  },
  {
    title: "Salary deduction TDS and PF",
    path: "/saldeductiontdspf",
    icon: <Summarize />,
    description: "Configure and process statutory salary deductions including TDS and PF."
  },
  {
    title: "Monthwise salary sheet drilldown",
    path: "/salarypivot1",
    icon: <TableChart />,
    description: "Review monthwise salary sheet details with drilldown reporting."
  }
];

export default function PayrollWizardPage() {
  return (
    <EmbeddedWizardShell
      title="Payroll Wizard"
      subtitle="Follow the payroll setup and processing sequence using the original live payroll pages."
      steps={steps}
      startLabel="Start payroll setup"
    />
  );
}
