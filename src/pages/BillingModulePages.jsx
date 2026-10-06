import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Delete, LockOpen, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const passwordValue = "kumropatash";
const fields = ["item", "status", "paymode", "paidaccount", "refno"];
const blankInvoice = { item: "", fromdate: "", todate: "", amount: "", gst: "", total: "", filelink: "", filename: "", status: "Pending", remarks: "" };
const blankPay = { paidamount: "", tdsdeducted: "", tdspaiddate: "", paiddate: "", paidaccount: "", refno: "", paymode: "", remarks: "" };
const todayInput = (value) => value ? String(value).slice(0, 10) : "";
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const rowsOf = (rows = []) => rows.map((row) => ({ ...row, id: row._id }));

function Message({ message, error }) {
  if (!message) return null;
  return <Alert severity={error ? "error" : "info"}>{message}</Alert>;
}

function UploadInvoiceButton({ onUploaded, disabled }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("colid", global1.colid);
      form.append("user", global1.user);
      form.append("folder", "billing-invoices");
      const res = await ep1.post("/api/v2/aws-file-library/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      onUploaded?.({ url: res.data?.url || "", filename: res.data?.filename || file.name });
    } finally {
      setUploading(false);
    }
  };
  return (
    <Button component="label" disabled={disabled || uploading} variant="outlined" startIcon={uploading ? <CircularProgress size={16} /> : <UploadFile />}>
      {uploading ? "Uploading..." : "Upload invoice"}
      <input hidden type="file" onChange={(event) => upload(event.target.files?.[0])} />
    </Button>
  );
}

function FilterBuilder({ filters, setFilters }) {
  const update = (index, patch) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  return (
    <Stack spacing={1}>
      {filters.map((filter, index) => (
        <Grid container spacing={1} key={index}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => update(index, { field: e.target.value })}>
              {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Value" value={filter.value} onChange={(e) => update(index, { value: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "item", value: "" }])}>Add filter</Button>
    </Stack>
  );
}

export function BillingInvoicesPage() {
  const [form, setForm] = useState(blankInvoice);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("Pending");
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "amount" || field === "gst") next.total = Number(next.amount || 0) + Number(next.gst || 0);
      return next;
    });
  };

  const load = async (status = tab) => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/billing/invoices", { params: { colid: global1.colid, status } });
      setRows(res.data?.data || []);
      setError(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load invoices.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/billing/invoices", { ...form, id: editingId, colid: global1.colid, user: global1.user, username: global1.name });
      setForm(blankInvoice);
      setEditingId("");
      setMessage("Invoice saved.");
      setError(false);
      await load(tab);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to save invoice.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({ ...blankInvoice, ...row, fromdate: todayInput(row.fromdate), todate: todayInput(row.todate) });
  };

  const remove = async () => {
    if (!selected.length) return;
    setLoading(true);
    try {
      await ep1.post("/api/v2/billing/invoices/delete", { colid: global1.colid, ids: selected });
      setMessage("Selected invoices deleted.");
      setSelected([]);
      await load(tab);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to delete invoices.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "item", headerName: "Item", minWidth: 180, flex: 1 },
    { field: "fromdate", headerName: "From", minWidth: 120, valueFormatter: (p) => todayInput(p.value) },
    { field: "todate", headerName: "To", minWidth: 120, valueFormatter: (p) => todayInput(p.value) },
    { field: "amount", headerName: "Amount", minWidth: 110, valueFormatter: (p) => money(p.value) },
    { field: "gst", headerName: "GST", minWidth: 100, valueFormatter: (p) => money(p.value) },
    { field: "total", headerName: "Total", minWidth: 110, valueFormatter: (p) => money(p.value) },
    { field: "status", headerName: "Status", minWidth: 110, renderCell: ({ value }) => <Chip size="small" color={value === "Paid" ? "success" : "warning"} label={value} /> },
    { field: "filelink", headerName: "Invoice", minWidth: 120, renderCell: ({ value }) => value ? <Button size="small" href={value} target="_blank">Open</Button> : "-" },
    { field: "edit", headerName: "Edit", minWidth: 100, renderCell: ({ row }) => <Button size="small" onClick={() => edit(row)}>Edit</Button> }
  ];

  return (
    <MenuPageShell title="Billing invoices">
      <Box sx={{ p: 2, minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Billing invoices</Typography>
          <Message message={message} error={error} />
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="Item" value={form.item} onChange={(e) => update("item", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="date" label="From date" InputLabelProps={{ shrink: true }} value={form.fromdate} onChange={(e) => update("fromdate", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="date" label="To date" InputLabelProps={{ shrink: true }} value={form.todate} onChange={(e) => update("todate", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Amount" value={form.amount} onChange={(e) => update("amount", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="GST" value={form.gst} onChange={(e) => update("gst", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Total" value={form.total} onChange={(e) => update("total", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Paid">Paid</MenuItem></TextField></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="File link" value={form.filelink} onChange={(e) => update("filelink", e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><UploadInvoiceButton disabled={loading} onUploaded={({ url, filename }) => setForm((p) => ({ ...p, filelink: url, filename }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Remarks" value={form.remarks} onChange={(e) => update("remarks", e.target.value)} /></Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button disabled={loading} variant="contained" startIcon={<Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button>
                  <Button disabled={loading} variant="outlined" onClick={() => { setForm(blankInvoice); setEditingId(""); }}>Clear</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 1 }}>
            <Tabs value={tab} onChange={(_, value) => { setTab(value); load(value); }}>
              <Tab value="Pending" label="Pending" />
              <Tab value="Paid" label="Paid" />
            </Tabs>
            <Stack direction="row" spacing={1} sx={{ p: 1 }}>
              <Button startIcon={<Refresh />} onClick={() => load(tab)} disabled={loading}>Load</Button>
              <Button color="error" startIcon={<Delete />} onClick={remove} disabled={loading || !selected.length}>Bulk delete</Button>
            </Stack>
            {loading && <LinearProgress />}
            <DataGrid rows={rowsOf(rows)} columns={columns} checkboxSelection onRowSelectionModelChange={(ids) => setSelected(ids)} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "billing_invoices" } } }} pageSizeOptions={[10, 25, 50, 100]} />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function BillingPayDetailsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("Pending");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState(blankPay);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const load = async (status = tab) => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/billing/invoices", { params: { colid: global1.colid, status } });
      setRows(res.data?.data || []);
      setError(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load invoices.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (unlocked) load().catch(() => {}); }, [unlocked]);

  const unlock = () => {
    if (password !== passwordValue) {
      setMessage("Invalid password.");
      setError(true);
      return;
    }
    setUnlocked(true);
    setMessage("");
  };

  const edit = (row) => {
    setSelectedInvoice(row);
    setForm({
      paidamount: row.paidamount || "",
      tdsdeducted: row.tdsdeducted || Math.max(Number(row.total || 0) - Number(row.paidamount || 0), 0),
      tdspaiddate: todayInput(row.tdspaiddate),
      paiddate: todayInput(row.paiddate),
      paidaccount: row.paidaccount || "",
      refno: row.refno || "",
      paymode: row.paymode || "",
      remarks: row.remarks || ""
    });
  };

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "paidamount") next.tdsdeducted = Math.max(Number(selectedInvoice?.total || 0) - Number(value || 0), 0);
      return next;
    });
  };

  const save = async () => {
    if (!selectedInvoice) return;
    setLoading(true);
    try {
      await ep1.post("/api/v2/billing/pay-details", { ...form, id: selectedInvoice._id, colid: global1.colid, password });
      setMessage("Payment details saved.");
      setError(false);
      setSelectedInvoice(null);
      setForm(blankPay);
      await load(tab);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to save payment details.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!unlocked) {
    return (
      <MenuPageShell title="Billing pay details">
        <Box sx={{ p: 2 }}><Paper sx={{ p: 3, maxWidth: 520 }}><Typography variant="h5" fontWeight={900}>Unlock pay details</Typography><Message message={message} error={error} /><TextField fullWidth type="password" label="Password" sx={{ my: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} /><Button variant="contained" startIcon={<LockOpen />} onClick={unlock}>Unlock</Button></Paper></Box>
      </MenuPageShell>
    );
  }

  return (
    <MenuPageShell title="Billing pay details">
      <Box sx={{ p: 2 }}><Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>Billing pay details</Typography>
        <Message message={message} error={error} />
        {selectedInvoice && <Paper sx={{ p: 2 }}><Grid container spacing={2}>
          <Grid item xs={12}><Alert severity="info">Editing payment for {selectedInvoice.item}. Total invoice amount: Rs. {money(selectedInvoice.total)}</Alert></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Paid amount" value={form.paidamount} onChange={(e) => update("paidamount", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth type="number" label="TDS deducted" value={form.tdsdeducted} onChange={(e) => update("tdsdeducted", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth type="date" label="TDS paid date" InputLabelProps={{ shrink: true }} value={form.tdspaiddate} onChange={(e) => update("tdspaiddate", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Paid date" InputLabelProps={{ shrink: true }} value={form.paiddate} onChange={(e) => update("paiddate", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Paid account" value={form.paidaccount} onChange={(e) => update("paidaccount", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Ref no" value={form.refno} onChange={(e) => update("refno", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Pay mode" value={form.paymode} onChange={(e) => update("paymode", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><Button fullWidth sx={{ height: 56 }} variant="contained" startIcon={<Save />} disabled={loading} onClick={save}>Save pay details</Button></Grid>
        </Grid></Paper>}
        <Paper sx={{ p: 1 }}>
          <Tabs value={tab} onChange={(_, value) => { setTab(value); load(value); }}><Tab value="Pending" label="Pending" /><Tab value="Paid" label="Paid" /></Tabs>
          {loading && <LinearProgress />}
          <DataGrid rows={rowsOf(rows)} columns={[
            { field: "item", headerName: "Item", minWidth: 180, flex: 1 },
            { field: "fromdate", headerName: "From", minWidth: 120, valueFormatter: (p) => todayInput(p.value) },
            { field: "total", headerName: "Total", minWidth: 110, valueFormatter: (p) => money(p.value) },
            { field: "paidamount", headerName: "Paid", minWidth: 110, valueFormatter: (p) => money(p.value) },
            { field: "tdsdeducted", headerName: "TDS deducted", minWidth: 130, valueFormatter: (p) => money(p.value) },
            { field: "tdspaiddate", headerName: "TDS paid date", minWidth: 140, valueFormatter: (p) => todayInput(p.value) },
            { field: "status", headerName: "Status", minWidth: 100 },
            { field: "edit", headerName: "Pay details", minWidth: 130, renderCell: ({ row }) => <Button size="small" onClick={() => edit(row)}>Edit</Button> }
          ]} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "billing_pay_details" } } }} />
        </Paper>
      </Stack></Box>
    </MenuPageShell>
  );
}

export function BillingTdsReportPage() {
  const [filters, setFilters] = useState([{ field: "item", value: "" }]);
  const [range, setRange] = useState({ fromdate: "", todate: "" });
  const [report, setReport] = useState({ data: [], statusSummary: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/billing/tds-report", { colid: global1.colid, ...range, dynamicFilters: filters.filter((f) => f.value) });
      setReport(res.data || { data: [], statusSummary: [], summary: {} });
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load TDS report.");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    ["Invoices", report.summary?.invoices || 0],
    ["TDS deducted", money(report.summary?.totalTdsDeducted)],
    ["TDS paid", money(report.summary?.totalTdsPaid)],
    ["TDS pending", money(report.summary?.totalTdsPending)]
  ];

  const print = () => window.print();

  return (
    <MenuPageShell title="Billing TDS report">
      <Box sx={{ p: 2 }}><Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>TDS deducted vs TDS paid</Typography>
        {message && <Alert severity="warning">{message}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="From date" InputLabelProps={{ shrink: true }} value={range.fromdate} onChange={(e) => setRange((p) => ({ ...p, fromdate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="To date" InputLabelProps={{ shrink: true }} value={range.todate} onChange={(e) => setRange((p) => ({ ...p, todate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><FilterBuilder filters={filters} setFilters={setFilters} /></Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" onClick={load} disabled={loading}>Load</Button><Button startIcon={<Print />} onClick={print}>Print</Button></Stack></Grid>
          </Grid>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>
        <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} sm={6} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
        <Paper sx={{ p: 2 }}><Typography variant="h6" fontWeight={900}>Status summary</Typography><Box sx={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={report.statusSummary || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="status" /><YAxis /><Tooltip /><Legend /><Bar dataKey="tdsdeducted" name="TDS deducted" fill="#3b82f6" /></BarChart></ResponsiveContainer></Box></Paper>
        <Paper sx={{ p: 1 }}><DataGrid rows={rowsOf(report.data)} columns={[
          { field: "item", headerName: "Item", minWidth: 180, flex: 1 },
          { field: "fromdate", headerName: "From", minWidth: 120, valueFormatter: (p) => todayInput(p.value) },
          { field: "total", headerName: "Total", minWidth: 110, valueFormatter: (p) => money(p.value) },
          { field: "paidamount", headerName: "Paid", minWidth: 110, valueFormatter: (p) => money(p.value) },
          { field: "tdsdeducted", headerName: "TDS deducted", minWidth: 130, valueFormatter: (p) => money(p.value) },
          { field: "tdspaiddate", headerName: "TDS paid date", minWidth: 140, valueFormatter: (p) => todayInput(p.value) },
          { field: "status", headerName: "Status", minWidth: 100 }
        ]} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "billing_tds_report" } } }} /></Paper>
      </Stack></Box>
    </MenuPageShell>
  );
}

export function BillingSubscriptionPage() {
  const [form, setForm] = useState({ active: "Yes", reason: "" });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const load = async () => {
    const res = await ep1.get("/api/v2/billing/subscription", { params: { colid: global1.colid } });
    setForm({ active: res.data?.data?.active || "Yes", reason: res.data?.data?.reason || "" });
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const save = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/billing/subscription", { ...form, colid: global1.colid, user: global1.user, username: global1.name, password });
      global1.subscriptiondeactivated = /^no$/i.test(res.data?.data?.active) ? "Yes" : "No";
      setMessage(/^no$/i.test(res.data?.data?.active) ? "Subscription deactivated. Only All login will be allowed." : "Subscription activated.");
      setError(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to update subscription.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const deactivated = /^no$/i.test(form.active);
  return (
    <MenuPageShell title="Billing subscription">
      <Box sx={{ p: 2 }}><Paper sx={{ p: 3, maxWidth: 760 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Subscription activation</Typography>
          <Alert severity={deactivated ? "error" : "success"}>{deactivated ? "This account is deactivated. Only All role can log in and only Billing will be visible." : "This account is active."}</Alert>
          <Message message={message} error={error} />
          <TextField select fullWidth label="Active" value={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField>
          <TextField fullWidth multiline minRows={3} label="Reason / remarks" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
          <TextField fullWidth type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button variant="contained" startIcon={<Save />} disabled={loading} onClick={save}>{loading ? "Saving..." : "Save subscription status"}</Button>
        </Stack>
      </Paper></Box>
    </MenuPageShell>
  );
}
