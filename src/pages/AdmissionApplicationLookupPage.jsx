import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";

const isPaid = (status, paidamount) => String(status || "").toUpperCase() === "SUCCESS" || Number(paidamount || 0) > 0;

export default function AdmissionApplicationLookupPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const colid = query.get("colid") || "";
  const [applicationNumber, setApplicationNumber] = useState(query.get("applicationid") || "");
  const [application, setApplication] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [fields, setFields] = useState([]);
  const [formDefinition, setFormDefinition] = useState(null);
  const [applicationFee, setApplicationFee] = useState(null);
  const [provisionalFee, setProvisionalFee] = useState(null);
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [selectedPaymentGatewayId, setSelectedPaymentGatewayId] = useState("");
  const [activePaymentTab, setActivePaymentTab] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (colid) {
      loadInstitution();
      loadPaymentGateways();
    }
  }, [colid]);

  const loadInstitution = async () => {
    const res = await ep1.get(`/vins?colid=${colid}`);
    setInstitution(res.data || null);
  };

  const loadPaymentGateways = async () => {
    try {
      const res = await ep1.get("/api/v2/mastergateway", { params: { colid, status: "Active" } });
      const gateways = res.data?.data || [];
      setPaymentGateways(gateways);
      const defaultGateway = gateways.find((item) => item.default === "Yes") || gateways[0];
      if (defaultGateway) setSelectedPaymentGatewayId(defaultGateway._id);
    } catch (err) {
      setPaymentGateways([]);
    }
  };

  const loadFieldsAndForm = async (item) => {
    const formid = item.formid || "default";
    const [fieldRes, formRes] = await Promise.all([
      ep1.get(`/admission-dynamic/fields?colid=${colid}&formid=${encodeURIComponent(formid)}`),
      ep1.get(`/admission-dynamic/form?colid=${colid}&formid=${encodeURIComponent(formid)}`).catch(() => ({ data: null }))
    ]);
    setFields(fieldRes.data || []);
    setFormDefinition(formRes.data || null);
  };

  const getApplicationFee = async (item) => {
    const res = await ep1.get("/api/v2/applicationfee", {
      params: { colid, academicyear: item.academicyear, programcode: item.programcode, active: "Yes" }
    });
    return (res.data?.data || []).find((fee) => Number(fee.amount || 0) > 0) || null;
  };

  const getProvisionalFee = async (item) => {
    const res = await ep1.get("/api/v2/provisionaladmissionfee", {
      params: { colid, academicyear: item.academicyear, programcode: item.programcode }
    });
    return (res.data?.data || []).find((fee) => Number(fee.amount || 0) > 0) || null;
  };

  const loadApplication = async () => {
    if (!colid || !applicationNumber.trim()) {
      setMessage("Please enter application number.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const res = await ep1.get("/admission-dynamic/application", {
        params: { colid, id: applicationNumber.trim() }
      });
      const item = res.data;
      setApplication(item);
      await loadFieldsAndForm(item);
      const [fee, provisional] = await Promise.all([getApplicationFee(item), getProvisionalFee(item)]);
      setApplicationFee(fee);
      setProvisionalFee(provisional);
    } catch (err) {
      setApplication(null);
      setMessage(err.response?.data?.msg || "Unable to load application.");
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (paymentKind) => {
    const selectedFee = paymentKind === "Provisional" ? provisionalFee : applicationFee;
    if (!application || !selectedFee) return;
    const selectedGateway = paymentGateways.find((item) => item._id === selectedPaymentGatewayId);
    try {
      setPaymentLoading(true);
      setMessage("");
      const applicationId = String(application._id || "").trim();
      const studentName = String(application.name || application.email || "Admission Applicant").trim();
      const feeItem = paymentKind === "Provisional" ? "Provisional Admission Fee" : "Application Fee";
      const feeAmount = Number(selectedFee.amount || 0);
      const normalizedGatewayName = String(selectedGateway?.gatewayname || "").replace(/\s|-/g, "").toLowerCase();
      const useExternalGateway = selectedGateway?.type === "External" && !normalizedGatewayName.includes("easebuzz");
      if (useExternalGateway) {
        if (!selectedGateway.externallink) {
          setMessage("Selected gateway is not configured with an external payment link.");
          return;
        }
        const params = new URLSearchParams({
          colid: String(colid),
          applicationid: applicationId,
          student: studentName,
          name: studentName,
          email: application.email || "",
          phone: application.phone || "",
          academicyear: application.academicyear || "",
          program: application.programapplied || "",
          programcode: application.programcode || "",
          feeitem: feeItem,
          amount: String(feeAmount),
          type: "Admission",
          paymentfor: paymentKind,
          gateway: selectedGateway.gatewayname || "",
          returnurl: selectedGateway.callbackurl || window.location.href
        });
        const joiner = selectedGateway.externallink.includes("?") ? "&" : "?";
        window.location.assign(`${selectedGateway.externallink}${joiner}${params.toString()}`);
        return;
      }
      const paymentResponse = await ep1.post("/api/v2/easebuzzpayment/initiate", {
        colid,
        user: studentName,
        name: studentName,
        student: studentName,
        regno: applicationId,
        feeitem: feeItem,
        amount: String(feeAmount),
        type: "Admission",
        paymentfor: paymentKind,
        applicationid: applicationId,
        description: `${feeItem} for ${application.programapplied || application.programcode || "Admission"}`,
        email: application.email || "",
        phone: application.phone || ""
      });
      const paymentUrl =
        paymentResponse?.data?.data?.paymenturl ||
        paymentResponse?.data?.paymenturl ||
        paymentResponse?.data?.url ||
        paymentResponse?.data?.redirectUrl;
      if (paymentUrl) window.location.href = paymentUrl;
      else setMessage("Payment was initiated but payment URL was not returned.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to initiate payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const exportApplication = () => {
    if (!application) return;
    const data = {
      applicationid: application._id,
      academicyear: application.academicyear,
      name: application.name,
      email: application.email,
      phone: application.phone,
      program: application.programapplied,
      programcode: application.programcode,
      applicationstatus: application.applicationstatus,
      applicationfeeamount: application.applicationfeeamount,
      paymentstatus: application.paymentstatus,
      paymentrefno: application.paymentrefno,
      provisionalfeeamount: application.provisionalfeeamount,
      provisionalpaymentstatus: application.provisionalpaymentstatus,
      provisionalpaymentrefno: application.provisionalpaymentrefno,
      ...(application.extraFields || {})
    };
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Application");
    XLSX.writeFile(wb, `Admission_Application_${application._id}.xlsx`);
  };

  const renderValue = (label, value) => (
    <Grid item xs={12} sm={6} md={4} key={label}>
      <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 1, p: 1, minHeight: 56, bgcolor: "#fff" }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>{value || "-"}</Typography>
      </Box>
    </Grid>
  );

  const renderSubjectTable = (title, rows = []) => (
    <Grid item xs={12}>
      <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 1, overflow: "hidden" }}>
        <Typography sx={{ bgcolor: "#e2e8f0", px: 1.25, py: 0.75, fontWeight: 800 }}>{title}</Typography>
        <Grid container sx={{ bgcolor: "#f8fafc", borderTop: "1px solid #cbd5e1" }}>
          <Grid item xs={8} sx={{ px: 1.25, py: 0.75, borderRight: "1px solid #e5e7eb" }}>
            <Typography variant="caption" fontWeight={900}>Subject</Typography>
          </Grid>
          <Grid item xs={4} sx={{ px: 1.25, py: 0.75, textAlign: "right" }}>
            <Typography variant="caption" fontWeight={900}>Marks</Typography>
          </Grid>
        </Grid>
        {(rows.length ? rows : [{ subject: "-", marks: "-" }]).map((row, index) => (
          <Grid container key={`${title}-${index}`} sx={{ borderTop: "1px solid #e5e7eb" }}>
            <Grid item xs={8} sx={{ px: 1.25, py: 0.75, borderRight: "1px solid #f1f5f9" }}>
              <Typography variant="body2">{row.subject || "-"}</Typography>
            </Grid>
            <Grid item xs={4} sx={{ px: 1.25, py: 0.75, textAlign: "right" }}>
              <Typography variant="body2">{row.marks || "-"}</Typography>
            </Grid>
          </Grid>
        ))}
      </Box>
    </Grid>
  );

  const paymentPanel = application && (
    (applicationFee && !isPaid(application.paymentstatus, application.paidamount)) ||
    (provisionalFee && !isPaid(application.provisionalpaymentstatus, application.provisionalpaidamount))
  );

  const commonDetails = application ? [
    ["Application ID", application._id],
    ["Academic Year", application.academicyear],
    ["Name", application.name],
    ["Email", application.email],
    ["Phone", application.phone],
    ["Address", application.address],
    ["Gender", application.gender],
    ["Category", application.category],
    ["Program Type", application.programtype],
    ["Program Applied", application.programapplied],
    ["Program Code", application.programcode],
    ["Tenth Marks", application.tenthmarks],
    ["Twelve Marks", application.twelvemarks],
    ["External Theory Marks", application.externaltheorymarks],
    ["English Marks", application.englishmarks],
    ["Date of Birth", application.dateofbirth],
    ["Date of Application", application.dateofapplication],
    ["Age", application.age],
    ["Twelve Subjects", application.twelvesubjects],
    ["Application Status", application.applicationstatus]
  ] : [];

  const dynamicDetails = application ? fields
    .map((field) => [field.label, application.extraFields?.[field.fieldname]])
    .filter((item) => item[1] !== undefined && item[1] !== "") : [];
  const documents = application?.documents || [];
  const photoDocument = documents.find((doc) => String(doc.documenttype || "").toLowerCase() === "photo" && doc.url);

  return (
    <Box sx={{ bgcolor: "#f5f7fb", minHeight: "100vh", py: 3 }}>
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body * { visibility: hidden; }
            #application-print-view, #application-print-view * { visibility: visible; }
            #application-print-view { position: absolute; left: 0; top: 0; width: 190mm; box-shadow: none !important; border: 0 !important; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <Paper className="no-print" sx={{ maxWidth: 860, mx: "auto", p: 2, mb: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Admission Application Print View</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField fullWidth label="Application number" value={applicationNumber} onChange={(e) => setApplicationNumber(e.target.value)} />
          <Button variant="contained" disabled={loading} onClick={loadApplication}>{loading ? "Loading..." : "Load"}</Button>
          {application && <Button variant="outlined" onClick={() => window.print()}>Print</Button>}
          {application && <Button variant="outlined" onClick={exportApplication}>Export</Button>}
        </Stack>
        {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
      </Paper>

      {paymentPanel && (
        <Paper className="no-print" sx={{ maxWidth: 860, mx: "auto", p: 2, mb: 2 }}>
          <Tabs value={activePaymentTab} onChange={(_, value) => setActivePaymentTab(value)} sx={{ mb: 2 }}>
            <Tab label="Application Fee" />
            <Tab label="Provisional Fee" />
          </Tabs>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField select size="small" label="Payment Gateway" value={selectedPaymentGatewayId} onChange={(e) => setSelectedPaymentGatewayId(e.target.value)} sx={{ minWidth: 250 }}>
              <MenuItem value="">Easebuzz (existing configuration)</MenuItem>
              {paymentGateways.map((gateway) => <MenuItem key={gateway._id} value={gateway._id}>{gateway.gatewayname} ({gateway.type})</MenuItem>)}
            </TextField>
            {activePaymentTab === 0 && (
              applicationFee && !isPaid(application.paymentstatus, application.paidamount)
                ? <Button variant="contained" color="success" disabled={paymentLoading} onClick={() => makePayment("Application")}>{paymentLoading ? "Processing..." : `Pay Application Fee Rs. ${Number(applicationFee.amount || 0).toLocaleString("en-IN")}`}</Button>
                : <Alert severity="success" sx={{ flex: 1 }}>Application fee is already paid or not required.</Alert>
            )}
            {activePaymentTab === 1 && (
              provisionalFee && !isPaid(application.provisionalpaymentstatus, application.provisionalpaidamount)
                ? <Button variant="contained" color="success" disabled={paymentLoading} onClick={() => makePayment("Provisional")}>{paymentLoading ? "Processing..." : `Pay Provisional Fee Rs. ${Number(provisionalFee.amount || 0).toLocaleString("en-IN")}`}</Button>
                : <Alert severity="success" sx={{ flex: 1 }}>Provisional fee is already paid or not required.</Alert>
            )}
          </Stack>
        </Paper>
      )}

      {application && (
        <Paper id="application-print-view" sx={{ maxWidth: "210mm", mx: "auto", p: 3, bgcolor: "#fff", color: "#111827", border: "1px solid #d1d5db" }}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={9}>
              <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", pb: 1.5, borderBottom: "2px solid #1f2937" }}>
                {institution?.logolink && <Box component="img" src={institution.logolink} alt="Institution logo" sx={{ maxHeight: 72, maxWidth: 150, objectFit: "contain" }} />}
                <Typography variant="h6" fontWeight={900}>{institution?.institutionname || "Institution"}</Typography>
                <Typography variant="body2">{institution?.address || ""}</Typography>
                <Typography variant="subtitle1" fontWeight={900}>Admission Application Acknowledgement</Typography>
                <Typography variant="body2">{formDefinition?.title || "Admission Application"}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ height: 145, border: "2px dashed #64748b", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 1 }}>
                {photoDocument ? (
                  <Box component="img" src={photoDocument.url} alt="Applicant" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">Paste recent passport size photo here</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 1, p: 1.25 }}>
                <Typography variant="body2"><b>Application ID:</b> {application._id}</Typography>
                <Typography variant="body2"><b>Submitted on:</b> {new Date(application.createdAt || Date.now()).toLocaleString("en-IN")}</Typography>
                <Typography variant="body2"><b>Application Fee:</b> {applicationFee ? `Rs. ${Number(applicationFee.amount || application.applicationfeeamount || 0).toLocaleString("en-IN")}` : "Not required"}</Typography>
                <Typography variant="body2"><b>Application Fee Status:</b> {application.paymentstatus || "Not Required"} {application.paymentrefno ? `(${application.paymentrefno})` : ""}</Typography>
                <Typography variant="body2"><b>Provisional Fee:</b> {provisionalFee ? `Rs. ${Number(provisionalFee.amount || application.provisionalfeeamount || 0).toLocaleString("en-IN")}` : "Not required"}</Typography>
                <Typography variant="body2"><b>Provisional Fee Status:</b> {application.provisionalpaymentstatus || "Not Required"} {application.provisionalpaymentrefno ? `(${application.provisionalpaymentrefno})` : ""}</Typography>
              </Box>
            </Grid>

            {commonDetails.map(([label, value]) => renderValue(label, value))}
            {dynamicDetails.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 1 }}>Additional Details</Typography>
              </Grid>
            )}
            {dynamicDetails.map(([label, value]) => renderValue(label, value))}

            {renderSubjectTable("Tenth Subjects and Marks", application.tenthsubjectmarks || [])}
            {renderSubjectTable("Twelve Subjects and Marks", application.twelvesubjectmarks || [])}

            {documents.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 1, overflow: "hidden" }}>
                  <Typography sx={{ bgcolor: "#e2e8f0", px: 1.25, py: 0.75, fontWeight: 800 }}>Uploaded Documents</Typography>
                  <Grid container sx={{ bgcolor: "#f8fafc", borderTop: "1px solid #cbd5e1" }}>
                    {["Document Type", "File", "Description"].map((heading) => (
                      <Grid item xs={4} key={heading} sx={{ px: 1.25, py: 0.75, borderRight: "1px solid #e5e7eb" }}>
                        <Typography variant="caption" fontWeight={900}>{heading}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  {documents.map((doc, index) => (
                    <Grid container key={`${doc.key || doc.url || doc.filename}-${index}`} sx={{ borderTop: "1px solid #e5e7eb" }}>
                      <Grid item xs={4} sx={{ px: 1.25, py: 0.75 }}>
                        <Typography variant="body2">{doc.documenttype || "-"}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ px: 1.25, py: 0.75 }}>
                        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{doc.originalname || doc.filename || "-"}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ px: 1.25, py: 0.75 }}>
                        <Typography variant="body2">{doc.description || "-"}</Typography>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 1, p: 1.5, mt: 1 }}>
                <Typography variant="subtitle2" fontWeight={900}>Declaration</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  I hereby declare that the information submitted in this application is true and correct to the best of my knowledge. I understand that admission is subject to verification of documents, eligibility, seat availability, and the rules and regulations of the institution. If any information is found incorrect or incomplete, my application/admission may be cancelled by the institution.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}><Box sx={{ height: 70, borderBottom: "1px solid #111827", display: "flex", alignItems: "flex-end", pb: 0.5 }}><Typography variant="body2">Applicant Signature</Typography></Box></Grid>
            <Grid item xs={6}><Box sx={{ height: 70, borderBottom: "1px solid #111827", display: "flex", alignItems: "flex-end", pb: 0.5 }}><Typography variant="body2">Date</Typography></Box></Grid>

            <Grid item xs={12}>
              <Box sx={{ border: "2px solid #1f2937", borderRadius: 1, p: 1.5, mt: 1 }}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>For Office Use Only</Typography>
                <Grid container spacing={2}>
                  {["Documents Checked By", "Eligibility Verified By", "Approved By", "Remarks"].map((label) => (
                    <Grid item xs={12} sm={6} key={label}>
                      <Box sx={{ height: 54, borderBottom: "1px solid #111827", display: "flex", alignItems: "flex-end", pb: 0.5 }}>
                        <Typography variant="body2">{label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
