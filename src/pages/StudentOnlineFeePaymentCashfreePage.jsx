import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { AccountBalanceWallet, ArrowBack, Payment, Refresh } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate, useSearchParams } from "react-router-dom";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const cashfreeGatewayId = "cashfree-client";
const currency = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const selectionToArray = (selection) => Array.from(selection?.ids || selection || []);
const validEmail = (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim()) ? String(value || "").trim() : "");
const validPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? digits : "";
};

const loadCashfreeScript = () => new Promise((resolve, reject) => {
  if (window.Cashfree) return resolve();
  const existing = document.querySelector("script[data-cashfree-sdk='v3']");
  if (existing) {
    existing.addEventListener("load", resolve, { once: true });
    existing.addEventListener("error", reject, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
  script.async = true;
  script.dataset.cashfreeSdk = "v3";
  script.onload = resolve;
  script.onerror = () => reject(new Error("Unable to load Cashfree checkout script"));
  document.body.appendChild(script);
});

const columns = [
  { field: "academicyear", headerName: "Year", minWidth: 110 },
  { field: "program", headerName: "Program", minWidth: 160 },
  { field: "programcode", headerName: "Program Code", minWidth: 130 },
  { field: "feegroup", headerName: "Fee Group", minWidth: 180, flex: 1 },
  { field: "feeitem", headerName: "Fee Item", minWidth: 240, flex: 1 },
  { field: "feecategory", headerName: "Category", minWidth: 130 },
  { field: "semester", headerName: "Semester", minWidth: 110 },
  { field: "amount", headerName: "Amount", minWidth: 130, type: "number", valueFormatter: (params) => currency(params.value) },
  { field: "paid", headerName: "Paid", minWidth: 120, type: "number", valueFormatter: (params) => currency(params.value) },
  { field: "balance", headerName: "Balance Payable", minWidth: 160, type: "number", valueFormatter: (params) => currency(params.value) }
];

export default function StudentOnlineFeePaymentCashfreePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fees, setFees] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [cashfreeConfig, setCashfreeConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSeverity, setMessageSeverity] = useState("success");
  const [error, setError] = useState("");

  const colid = useMemo(() => global1.colid, []);
  const regno = useMemo(() => global1.regno || global1.user || "", []);
  const selectedFees = useMemo(() => fees.filter((row) => selectedRows.includes(row._id)), [fees, selectedRows]);
  const totalPayable = useMemo(() => selectedFees.reduce((sum, row) => sum + Number(row.balance || 0), 0), [selectedFees]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [feeRes, configRes] = await Promise.all([
        ep1.get("/api/v2/studentonlinepayment/pending", { params: { colid, regno } }),
        ep1.get("/api/v2/cashfree/config", { params: { colid, configscope: "Client", isactive: "Yes" } })
      ]);
      setFees(feeRes.data?.data || []);
      setCashfreeConfig(configRes.data?.data?.[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load pending fees or Cashfree configuration.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCashfree = async (orderid) => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/cashfree/verify", { params: { colid, orderid } });
      const paid = /^paid$/i.test(String(res.data?.data?.paymentstatus || ""));
      setMessageSeverity(paid ? "success" : "info");
      setMessage(paid ? "Cashfree payment completed successfully. Ledger balance will refresh below." : "Cashfree payment status updated. Please refresh if gateway confirmation is pending.");
      await loadData();
    } catch (err) {
      setMessageSeverity("error");
      setMessage(err.response?.data?.message || "Unable to verify Cashfree payment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orderid = searchParams.get("order_id") || searchParams.get("orderid") || searchParams.get("cashfree_order_id");
    if (orderid) verifyCashfree(orderid);
    if (colid && regno) loadData();
  }, [colid, regno]);

  const startPayment = async () => {
    if (!cashfreeConfig) {
      setError("Client Cashfree configuration is not active.");
      return;
    }
    if (!selectedRows.length) {
      setError("Please select at least one fee item.");
      return;
    }
    setPaying(true);
    setError("");
    setMessage("");
    try {
      const sessionRes = await ep1.post("/api/v2/studentonlinepayment/session", {
        colid,
        regno,
        ledgerids: selectedRows,
        gatewayid: cashfreeGatewayId,
        student: global1.name || "",
        name: global1.name || "",
        user: global1.user || "",
        email: validEmail(global1.email) || validEmail(global1.user),
        phone: validPhone(global1.phone),
        program: global1.program || "",
        programcode: global1.programcode || "",
        regulation: global1.regulation || "",
        academicyear: global1.academicyear || "",
        semester: global1.semester || "",
        section: global1.section || ""
      });
      const session = sessionRes.data?.data;
      const returnurl = `${window.location.origin}/studentonlinefeepayment3?order_id={order_id}`;
      const cashfreeRes = await ep1.post("/api/v2/cashfree/order", {
        ...session.gatewayPayload,
        configid: cashfreeConfig._id,
        configscope: "Client",
        name: global1.name || session.payment.student || regno,
        user: global1.user || "",
        customername: global1.name || session.payment.student || regno,
        customeremail: validEmail(global1.email) || validEmail(global1.user) || "student@example.com",
        customerphone: validPhone(global1.phone) || "9999999999",
        amount: session.payment.totalamount || totalPayable,
        source: "StudentFeesOnline",
        sourceid: session.payment._id,
        studentonlinepaymentid: session.payment._id,
        type: "Student",
        description: `Student fee payment ${regno}`,
        returnurl,
        frontendcallbackurl: `${window.location.origin}/studentonlinefeepayment3`
      });
      const paymentLink = cashfreeRes.data?.cashfree?.payment_link || cashfreeRes.data?.data?.paymentlink;
      if (paymentLink) {
        window.location.assign(paymentLink);
        return;
      }
      const sessionId = cashfreeRes.data?.cashfree?.payment_session_id || cashfreeRes.data?.data?.paymentsessionid;
      if (!sessionId) throw new Error("Cashfree did not return payment session id.");
      await loadCashfreeScript();
      const cashfree = window.Cashfree({ mode: cashfreeRes.data?.mode === "production" ? "production" : "sandbox" });
      await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to initiate Cashfree payment.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <MenuPageShell title="Pay fees online Cashfree" menuType="student">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>Online Fees Payment - Cashfree</Typography>
            <Typography variant="body2" color="text.secondary">Select pending fee items and pay through Client Cashfree configuration.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} disabled={loading || paying}>Refresh</Button>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/studentdashboard")}>Dashboard</Button>
          </Stack>
        </Stack>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {message && <Alert severity={messageSeverity} sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!cashfreeConfig && !loading && <Alert severity="warning" sx={{ mb: 2 }}>No active Client Cashfree configuration found.</Alert>}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <Card><CardContent><Stack direction="row" spacing={1} alignItems="center"><AccountBalanceWallet color="primary" /><Typography fontWeight={800}>Selected Amount</Typography></Stack><Typography variant="h4" fontWeight={900}>Rs. {currency(totalPayable)}</Typography><Chip size="small" label={`${selectedRows.length} fee item(s) selected`} /></CardContent></Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                <Box sx={{ flex: 1 }}><Typography fontWeight={800}>Gateway</Typography><Typography color="text.secondary">{cashfreeConfig ? `Cashfree (${cashfreeConfig.environment})` : "Not configured"}</Typography></Box>
                <Button variant="contained" startIcon={<Payment />} disabled={paying || loading || totalPayable <= 0 || !cashfreeConfig} onClick={startPayment}>{paying ? "Starting payment..." : "Pay with Cashfree"}</Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
        <Paper sx={{ height: 560, overflow: "hidden" }}>
          <DataGrid
            rows={fees}
            columns={columns}
            getRowId={(row) => row._id}
            checkboxSelection
            disableRowSelectionOnClick
            loading={loading}
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={(model) => setSelectedRows(selectionToArray(model))}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            slots={{ toolbar: GridToolbar }}
          />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
