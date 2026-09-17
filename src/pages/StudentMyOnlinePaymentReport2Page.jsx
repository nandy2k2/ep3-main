import React from "react";
import { StudentOnlinePaymentReportPageBase } from "./StudentOnlinePaymentReportPage";

export default function StudentMyOnlinePaymentReport2Page() {
  return (
    <StudentOnlinePaymentReportPageBase
      studentOnly
      includeProgramNameInReceipt
      pageTitle="My Online Payments 2"
      pageSubtitle="Your online payment records with receipts showing program name and program code."
    />
  );
}
