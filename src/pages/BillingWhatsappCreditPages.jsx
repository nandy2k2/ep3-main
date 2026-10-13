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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Payment, Refresh } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const RATE = 0.65;
const MIN_MESSAGES = 10000;
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dateText = (value) => value ? new Date(value).toLocaleString("en-IN") : "";
const rowsOf = (rows = []) => rows.map((row) => ({ ...row, id: row._id }));

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

function StatCard({ label, value, color = "primary" }) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight={900} color={`${color}.main`}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export function WhatsappCreditsPage() {
  const [searchParams] = useSearchParams();
  const [configs, setConfigs] = useState([]);
  const [configid, setConfigid] = useState("");
  const [balance, setBalance] = useState({ balance: 0, totalpurchased: 0, totalused: 0 });
  const [units, setUnits] = useState(1);
  const [couponcode, setCouponcode] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const messages = useMemo(() => Math.max(1, Number(units || 1)) * MIN_MESSAGES, [units]);
  const originalamount = useMemo(() => Number((messages * RATE).toFixed(2)), [messages]);

  const loadBalance = async () => {
    const res = await ep1.get("/api/v2/whatsapp-credits/balance", { params: { colid: global1.colid } });
    setBalance(res.data?.data || { balance: 0 });
  };

  const loadConfigs = async () => {
    const res = await ep1.get("/api/v2/cashfree/config", { params: { colid: global1.colid, configscope: "Admin", isactive: "Yes" } });
    const rows = res.data?.data || [];
    setConfigs(rows);
    if (!configid && rows[0]?._id) setConfigid(rows[0]._id);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBalance(), loadConfigs()]);
      setError(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load WhatsApp credit details.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const orderid = searchParams.get("order_id") || searchParams.get("orderid");
    if (!orderid) return;
    setLoading(true);
    ep1.get("/api/v2/cashfree/verify", { params: { colid: global1.colid, orderid } })
      .then(() => {
        setMessage("Payment verified. WhatsApp credits updated.");
        setError(false);
        return loadBalance();
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || "Unable to verify WhatsApp credit payment.");
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const calculateQuote = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/whatsapp-credits/quote", { units, couponcode });
      setQuote(res.data?.data || null);
      setError(false);
    } catch (err) {
      setQuote(null);
      setMessage(err.response?.data?.message || "Unable to apply coupon.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    setLoading(true);
    setMessage("");
    try {
      const prepared = await ep1.post("/api/v2/whatsapp-credits/prepare-payment", {
        colid: global1.colid,
        units,
        couponcode,
        user: global1.user,
        name: global1.name
      });
      const payment = prepared.data?.data;
      const returnurl = `${window.location.origin}${window.location.pathname}?order_id={order_id}`;
      const res = await ep1.post("/api/v2/cashfree/order", {
        colid: global1.colid,
        configid,
        configscope: "Admin",
        orderid: payment.orderid,
        amount: payment.payableamount,
        description: `WhatsApp credits ${payment.messages} messages`,
        customername: global1.name || "Customer",
        customeremail: global1.user || "",
        customerphone: "",
        source: "WhatsappCredits",
        sourceid: payment._id,
        user: global1.user,
        name: global1.name,
        returnurl
      });
      const sessionId = res.data?.cashfree?.payment_session_id || res.data?.data?.paymentsessionid;
      if (!sessionId) throw new Error("Cashfree did not return payment session id.");
      await loadCashfreeScript();
      const cashfree = window.Cashfree({ mode: res.data?.mode === "production" ? "production" : "sandbox" });
      await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Unable to initiate WhatsApp credit payment.");
      setError(true);
      setLoading(false);
    }
  };

  const activeQuote = quote || {
    messages,
    originalamount,
    discountamount: 0,
    payableamount: originalamount
  };

  return (
    <MenuPageShell title="Whatsapp credits">
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Whatsapp credits</Typography>
          {message && <Alert severity={error ? "error" : "success"} onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><StatCard label="Current balance" value={money(balance.balance || 0)} color="success" /></Grid>
            <Grid item xs={12} md={4}><StatCard label="Total purchased" value={money(balance.totalpurchased || 0)} /></Grid>
            <Grid item xs={12} md={4}><StatCard label="Total used" value={money(balance.totalused || 0)} color="warning" /></Grid>
          </Grid>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="Admin Cashfree configuration" value={configid} onChange={(e) => setConfigid(e.target.value)}>
                  {configs.map((cfg) => <MenuItem key={cfg._id} value={cfg._id}>{cfg.appid} ({cfg.environment})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Units" value={units} inputProps={{ min: 1 }} onChange={(e) => setUnits(Math.max(1, Number(e.target.value || 1)))} helperText="1 unit = 10000 messages" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Coupon code" value={couponcode} onChange={(e) => setCouponcode(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="outlined" onClick={calculateQuote} disabled={loading}>Apply coupon</Button>
                  <Button fullWidth variant="contained" startIcon={<Payment />} onClick={pay} disabled={loading || !configid}>Pay</Button>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  <Chip label={`Messages: ${money(activeQuote.messages)}`} />
                  <Chip label={`Rate: Rs. ${RATE} per message`} />
                  <Chip label={`Amount: Rs. ${money(activeQuote.originalamount)}`} />
                  <Chip label={`Discount: Rs. ${money(activeQuote.discountamount)}`} color={activeQuote.discountamount ? "success" : "default"} />
                  <Chip label={`Payable: Rs. ${money(activeQuote.payableamount)}`} color="primary" />
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function WhatsappCreditPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [balance, setBalance] = useState({ balance: 0 });
  const [filters, setFilters] = useState({ orderid: "", status: "", paymentstatus: "", couponcode: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/whatsapp-credits/payments", { colid: global1.colid, ...filters });
      setRows(res.data?.data || []);
      setBalance(res.data?.balance || { balance: 0 });
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load WhatsApp credit payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { field: "orderid", headerName: "Order ID", minWidth: 190 },
    { field: "messages", headerName: "Credits", minWidth: 120, valueFormatter: (p) => money(p.value) },
    { field: "originalamount", headerName: "Amount", minWidth: 120, valueFormatter: (p) => money(p.value) },
    { field: "discountamount", headerName: "Discount", minWidth: 120, valueFormatter: (p) => money(p.value) },
    { field: "payableamount", headerName: "Paid/Payable", minWidth: 130, valueFormatter: (p) => money(p.value) },
    { field: "couponcode", headerName: "Coupon", minWidth: 120 },
    { field: "paymentstatus", headerName: "Payment", minWidth: 120, renderCell: ({ value }) => <Chip size="small" color={/^paid$/i.test(value) ? "success" : "warning"} label={value || "Pending"} /> },
    { field: "paiddate", headerName: "Paid date", minWidth: 170, valueFormatter: (p) => dateText(p.value) },
    { field: "createdAt", headerName: "Created", minWidth: 170, valueFormatter: (p) => dateText(p.value) },
    { field: "user", headerName: "User", minWidth: 200 }
  ];

  return (
    <MenuPageShell title="Whatsapp credit payments">
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><StatCard label="Current WhatsApp balance" value={money(balance.balance || 0)} color="success" /></Grid>
          </Grid>
          {message && <Alert severity="error" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {["orderid", "status", "paymentstatus", "couponcode"].map((field) => (
                <Grid item xs={12} md={3} key={field}>
                  <TextField fullWidth size="small" label={field} value={filters[field]} onChange={(e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }))} />
                </Grid>
              ))}
              <Grid item xs={12}><Button variant="contained" startIcon={<Refresh />} onClick={load} disabled={loading}>Load</Button></Grid>
            </Grid>
          </Paper>
          {loading && <LinearProgress />}
          <Paper sx={{ p: 1 }}>
            <DataGrid rows={rowsOf(rows)} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "whatsapp_credit_payments" } } }} />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
