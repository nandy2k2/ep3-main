import PendingFeesPage from "./PendingFeesPage";

export default function PendingFees3Page() {
  return <PendingFeesPage title="Pending Fees 3" requiredFields={["academicyear", "programcode", "semester", "feeitem"]} />;
}
