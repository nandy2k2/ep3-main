import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { Delete, Edit, Payment, Refresh, Save } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankConfig = {
  id: "",
  appid: "",
  secretkey: "",
  environment: "sandbox",
  apiVersion: "2023-08-01",
  returnurl: "",
  notifyurl: "",
  isactive: "Yes",
  notes: ""
};
const blankPay = { amount: "", description: "Billing payment", customername: "", customeremail: "", customerphone: "" };
const activeText = (value) => (value === true || /^yes|true|active|1$/i.test(String(value || "")) ? "Yes" : "No");
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dateText = (value) => value ? new Date(value).toLocaleString("en-IN") : "";
const rowsOf = (rows = []) => rows.map((row) => ({ ...row, id: row._id }));

function StatusMessage({ message, error, clear }) {
  if (!message) return null;
  return <Alert severity={error ? "error" : "success"} onClose={clear}>{message}</Alert>;
}

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

function CashfreeConfigurationBase({ title = "Cashfree configuration", configscope = "Admin", passwordProtected = false }) {
  const [form, setForm] = useState(blankConfig);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(!passwordProtected);

  const colid = useMemo(() => global1.colid, []);
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const load = async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/cashfree/config", { params: { colid, configscope } });
      setRows(res.data?.data || []);
      setError(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load Cashfree configuration.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (unlocked) load().catch(() => {}); }, [unlocked, configscope]);

  const save = async () => {
    setLoading(true);
    setMessage("");
    try {
      await ep1.post("/api/v2/cashfree/config", {
        ...form,
        colid,
        configscope,
        name: global1.name,
        user: global1.user,
        isactive: form.isactive === "Yes"
      });
      setForm(blankConfig);
      setMessage("Cashfree configuration saved.");
      setError(false);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to save Cashfree configuration.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const edit = (row) => {
    setForm({
      id: row._id,
      appid: row.appid || "",
      secretkey: row.secretkey || "",
      environment: row.environment || "sandbox",
      apiVersion: row.apiVersion || "2023-08-01",
      returnurl: row.returnurl || "",
      notifyurl: row.notifyurl || "",
      isactive: activeText(row.isactive),
      notes: row.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this Cashfree configuration?")) return;
    setLoading(true);
    try {
      await ep1.post("/api/v2/cashfree/config/delete", { colid, id: row._id });
      setMessage("Cashfree configuration deleted.");
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to delete Cashfree configuration.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "actions", headerName: "Actions", width: 170, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" startIcon={<Edit />} onClick={() => edit(row)}>Edit</Button><Button size="small" color="error" startIcon={<Delete />} onClick={() => remove(row)}>Delete</Button></Stack> },
    { field: "appid", headerName: "App ID", minWidth: 220, flex: 1 },
    { field: "secretkey", headerName: "Secret key", minWidth: 220, flex: 1 },
    { field: "environment", headerName: "Environment", minWidth: 130 },
    { field: "apiVersion", headerName: "API version", minWidth: 140 },
    { field: "isactive", headerName: "Active", minWidth: 100, valueGetter: (params) => activeText(params.row.isactive) },
    { field: "returnurl", headerName: "Return URL", minWidth: 260, flex: 1 },
    { field: "notifyurl", headerName: "Notify URL", minWidth: 260, flex: 1 },
    { field: "notes", headerName: "Notes", minWidth: 220, flex: 1 }
  ];

  if (!unlocked) {
    return (
      <MenuPageShell title={title}>
        <Box sx={{ p: 2 }}>
          <Paper sx={{ p: 3, maxWidth: 520 }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={900}>{title}</Typography>
              <Alert severity="info">Enter password to open Cashfree configuration.</Alert>
              {message && <Alert severity="error" onClose={() => setMessage("")}>{message}</Alert>}
              <TextField
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (password === "kumropatash") setUnlocked(true);
                    else {
                      setError(true);
                      setMessage("Invalid password.");
                    }
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (password === "kumropatash") setUnlocked(true);
                  else {
                    setError(true);
                    setMessage("Invalid password.");
                  }
                }}
              >
                Unlock
              </Button>
            </Stack>
          </Paper>
        </Box>
      </MenuPageShell>
    );
  }

  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={900}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">Store Cashfree App ID and Secret Key for payment order creation.</Typography>
          </Box>
          <StatusMessage message={message} error={error} clear={() => setMessage("")} />
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="App ID" value={form.appid} onChange={(e) => update("appid", e.target.value)} required /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Secret key" value={form.secretkey} onChange={(e) => update("secretkey", e.target.value)} required /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Environment" value={form.environment} onChange={(e) => update("environment", e.target.value)}><MenuItem value="sandbox">Sandbox</MenuItem><MenuItem value="production">Production</MenuItem></TextField></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" label="API version" value={form.apiVersion} onChange={(e) => update("apiVersion", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Active" value={form.isactive} onChange={(e) => update("isactive", e.target.value)}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Return URL" value={form.returnurl} onChange={(e) => update("returnurl", e.target.value)} helperText="Leave blank to use the payment page URL." /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Notify URL" value={form.notifyurl} onChange={(e) => update("notifyurl", e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} /></Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={loading || !form.appid || !form.secretkey} onClick={save}>{form.id ? "Update" : "Save"}</Button><Button variant="outlined" disabled={loading} onClick={() => setForm(blankConfig)}>New</Button><Button startIcon={<Refresh />} disabled={loading} onClick={load}>Refresh</Button></Stack></Grid>
            </Grid>
          </Paper>
          {loading && <LinearProgress />}
          <Paper sx={{ p: 1 }}><DataGrid rows={rowsOf(rows)} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "cashfree_configuration" } } }} /></Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function CashfreeConfigurationPage() {
  return <CashfreeConfigurationBase title="Cashfree configuration" configscope="Admin" passwordProtected />;
}

export function ClientCashfreeConfigurationPage() {
  return <CashfreeConfigurationBase title="Client cashfree configuration" configscope="Client" />;
}

export function BillingCashfreePaymentPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ ...blankPay, customername: global1.name || "", customeremail: global1.user || "" });
  const [configs, setConfigs] = useState([]);
  const [configid, setConfigid] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(null);

  const loadConfigs = async () => {
    const res = await ep1.get("/api/v2/cashfree/config", { params: { colid: global1.colid, configscope: "Admin", isactive: "Yes" } });
    const data = res.data?.data || [];
    setConfigs(data);
    if (!configid && data[0]?._id) setConfigid(data[0]._id);
  };

  useEffect(() => {
    loadConfigs().catch((err) => {
      setMessage(err.response?.data?.message || "Unable to load Cashfree configuration.");
      setError(true);
    });
  }, []);

  useEffect(() => {
    const orderid = searchParams.get("order_id") || searchParams.get("orderid");
    if (!orderid) return;
    setLoading(true);
    ep1.get("/api/v2/cashfree/verify", { params: { colid: global1.colid, orderid } })
      .then((res) => {
        setVerified(res.data?.data || null);
        setMessage("Cashfree payment status updated.");
        setError(false);
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || "Unable to verify Cashfree payment.");
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const pay = async () => {
    setLoading(true);
    setMessage("");
    setVerified(null);
    try {
      const returnurl = `${window.location.origin}${window.location.pathname}?order_id={order_id}`;
      const res = await ep1.post("/api/v2/cashfree/order", {
        ...form,
        configid,
        configscope: "Admin",
        colid: global1.colid,
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
      setMessage(err.response?.data?.message || err.message || "Unable to initiate Cashfree payment.");
      setError(true);
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title="Billing Cashfree payment">
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={900}>Pay through Cashfree</Typography>
            <Typography variant="body2" color="text.secondary">Enter any billing amount and proceed through Cashfree redirect checkout.</Typography>
          </Box>
          <StatusMessage message={message} error={error} clear={() => setMessage("")} />
          {loading && <LinearProgress />}
          {verified && <Alert severity={/^paid$/i.test(verified.paymentstatus) ? "success" : "info"}>Order {verified.orderid}: {verified.paymentstatus || verified.status} for Rs. {money(verified.amount)}</Alert>}
          <Paper sx={{ p: 2, maxWidth: 900 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField select fullWidth label="Cashfree configuration" value={configid} onChange={(e) => setConfigid(e.target.value)}>{configs.map((cfg) => <MenuItem key={cfg._id} value={cfg._id}>{cfg.appid} ({cfg.environment})</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Amount" value={form.amount} onChange={(e) => update("amount", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Customer name" value={form.customername} onChange={(e) => update("customername", e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Customer email" value={form.customeremail} onChange={(e) => update("customeremail", e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Customer phone" value={form.customerphone} onChange={(e) => update("customerphone", e.target.value)} /></Grid>
              <Grid item xs={12}><Button variant="contained" startIcon={<Payment />} disabled={loading || !Number(form.amount) || !configid} onClick={pay}>Pay now</Button></Grid>
            </Grid>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function BillingCashfreePaymentLogPage() {
  const [filters, setFilters] = useState({ orderid: "", customeremail: "", status: "", paymentstatus: "", fromdate: "", todate: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/cashfree/logs", { colid: global1.colid, ...filters });
      setRows(res.data?.data || []);
      setError(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load Cashfree payment logs.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (row) => {
    setLoading(true);
    try {
      await ep1.get("/api/v2/cashfree/verify", { params: { colid: global1.colid, orderid: row.orderid } });
      setMessage("Payment status refreshed.");
      setError(false);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to verify payment.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const columns = [
    { field: "orderid", headerName: "Order ID", minWidth: 180 },
    { field: "amount", headerName: "Amount", minWidth: 110, valueFormatter: (p) => money(p.value) },
    { field: "paymentstatus", headerName: "Payment status", minWidth: 140, renderCell: ({ value }) => <Chip size="small" color={/^paid$/i.test(value) ? "success" : "warning"} label={value || "Pending"} /> },
    { field: "status", headerName: "Gateway status", minWidth: 140 },
    { field: "customername", headerName: "Customer", minWidth: 180 },
    { field: "customeremail", headerName: "Email", minWidth: 220 },
    { field: "customerphone", headerName: "Phone", minWidth: 140 },
    { field: "description", headerName: "Description", minWidth: 220, flex: 1 },
    { field: "environment", headerName: "Environment", minWidth: 120 },
    { field: "createdAt", headerName: "Created", minWidth: 170, valueFormatter: (p) => dateText(p.value) },
    { field: "paiddate", headerName: "Paid date", minWidth: 170, valueFormatter: (p) => dateText(p.value) },
    { field: "verify", headerName: "Verify", minWidth: 120, renderCell: ({ row }) => <Button size="small" onClick={() => verify(row)}>Verify</Button> }
  ];

  return (
    <MenuPageShell title="Cashfree payment log">
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Cashfree payment log</Typography>
          <StatusMessage message={message} error={error} clear={() => setMessage("")} />
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {["orderid", "customeremail", "status", "paymentstatus"].map((field) => <Grid item xs={12} md={3} key={field}><TextField fullWidth size="small" label={field} value={filters[field]} onChange={(e) => setFilters((p) => ({ ...p, [field]: e.target.value }))} /></Grid>)}
              <Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="From date" InputLabelProps={{ shrink: true }} value={filters.fromdate} onChange={(e) => setFilters((p) => ({ ...p, fromdate: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="To date" InputLabelProps={{ shrink: true }} value={filters.todate} onChange={(e) => setFilters((p) => ({ ...p, todate: e.target.value }))} /></Grid>
              <Grid item xs={12}><Button variant="contained" startIcon={<Refresh />} disabled={loading} onClick={load}>Load</Button></Grid>
            </Grid>
          </Paper>
          {loading && <LinearProgress />}
          <Paper sx={{ p: 1 }}><DataGrid rows={rowsOf(rows)} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "cashfree_payment_log" } } }} /></Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
