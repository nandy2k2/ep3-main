import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name, role: global1.role });
const blank = { emailconfigurationid: "", emailconfiguration: "", recipient: "", recipientname: "", subject: "", type: "Attendance", enabled: "Yes" };
const fields = ["emailconfiguration", "recipient", "recipientname", "subject", "type", "enabled"];
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

function parseCsv(value) {
  const lines = String(value || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function exportCsv(filename, rows = [], columns = fields) {
  const csv = [columns.map(csvEscape).join(","), ...rows.map((row) => columns.map((field) => csvEscape(row[field])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function printRows(rows = []) {
  const body = `
    <h2 style="text-align:center">Audit Email Configuration</h2>
    <table><thead><tr>${fields.map((field) => `<th>${field}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${fields.map((field) => `<td>${row[field] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
  `;
  const win = window.open("", "_blank", "width=950,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>Audit Email Configuration</title><style>
    body{font-family:Arial,sans-serif;color:#000;background:#fff;margin:0}.tools{padding:12px;border-bottom:1px solid #ddd}.print-area{padding:14mm}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;font-size:12px;text-align:left;vertical-align:top}
    @media print{.tools{display:none}@page{size:A4 portrait;margin:10mm}tr{break-inside:avoid}}
  </style></head><body><div class="tools"><button onclick="window.print()">Print</button> <button onclick="window.close()">Close</button></div><div class="print-area">${body}</div></body></html>`);
  win.document.close();
}

export default function NepLmsAuditEmailConfigurationPage() {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ emailconfigs: [], types: [], enabledOptions: ["Yes", "No"], filterOptions: {} });
  const [filters, setFilters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/neplms/audit-email-configuration/options", { params: withScope() });
    setOptions(res.data || {});
  };

  useEffect(() => { loadOptions().catch(() => {}); }, []);

  const params = useMemo(() => {
    const query = withScope();
    filters.forEach((filter) => {
      if (filter.field && filter.value) query[filter.field] = filter.value;
    });
    return query;
  }, [filters]);

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/neplms/audit-email-configuration", { params });
      setRows(res.data?.rows || []);
      setMessage("Audit email configurations loaded");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load audit email configuration");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setLoading(true);
      await ep1.post("/api/v2/neplms/audit-email-configuration", withScope({ ...form, id: editId || undefined }));
      setForm(blank);
      setEditId("");
      setMessage("Audit email configuration saved");
      await Promise.all([loadRows(), loadOptions()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    if (!window.confirm("Delete selected audit email configurations?")) return;
    try {
      setLoading(true);
      await ep1.post("/api/v2/neplms/audit-email-configuration/delete", withScope({ ids: selected }));
      setSelected([]);
      setMessage("Selected configurations deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete");
    } finally {
      setLoading(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const textValue = await file.text();
    const data = file.name.endsWith(".json") ? JSON.parse(textValue) : parseCsv(textValue);
    try {
      setLoading(true);
      await ep1.post("/api/v2/neplms/audit-email-configuration/bulk", withScope({ rows: Array.isArray(data) ? data : [data] }));
      setMessage("Bulk upload completed");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "emailconfiguration", headerName: "Email configuration", flex: 1.2 },
    { field: "recipientname", headerName: "Recipient name", flex: 1 },
    { field: "recipient", headerName: "Recipient email", flex: 1.2 },
    { field: "subject", headerName: "Subject", flex: 1.4 },
    { field: "type", headerName: "Type", width: 170 },
    { field: "enabled", headerName: "Enabled", width: 120 },
    {
      field: "actions",
      type: "actions",
      width: 90,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => {
          setEditId(row._id);
          setForm({ ...blank, ...row, emailconfigurationid: row.emailconfigurationid || "" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }} />
      ]
    }
  ];

  return (
    <MenuPageShell title="Audit email configuration">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.emailconfigs || []}
                getOptionLabel={(option) => typeof option === "string" ? option : option.label || option.username || ""}
                value={(options.emailconfigs || []).find((item) => item._id === form.emailconfigurationid) || null}
                onChange={(_, value) => setForm((prev) => ({ ...prev, emailconfigurationid: value?._id || "", emailconfiguration: value?.label || "" }))}
                renderInput={(params) => <TextField {...params} label="Email configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Recipient name" value={form.recipientname} onChange={(event) => setForm((prev) => ({ ...prev, recipientname: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Recipient email" value={form.recipient} onChange={(event) => setForm((prev) => ({ ...prev, recipient: event.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><Autocomplete options={options.types || []} value={form.type || "Attendance"} onChange={(_, value) => setForm((prev) => ({ ...prev, type: value || "Attendance" }))} renderInput={(params) => <TextField {...params} label="Type" />} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Subject" value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><Autocomplete options={options.enabledOptions || ["Yes", "No"]} value={form.enabled || "Yes"} onChange={(_, value) => setForm((prev) => ({ ...prev, enabled: value || "Yes" }))} renderInput={(params) => <TextField {...params} label="Enabled" />} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<SaveIcon />} disabled={loading} onClick={save}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" disabled={loading} onClick={() => { setEditId(""); setForm(blank); }}>Clear</Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("audit-email-configuration-template.csv", [blank])}>Template</Button>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={loading} onClick={remove}>Bulk delete</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => printRows(rows)}>Print preview</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            <Typography fontWeight={900}>Dynamic filters</Typography>
            <Button size="small" variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "", value: "" }])}>Add filter</Button>
            <Button size="small" variant="contained" disabled={loading} onClick={loadRows}>{loading ? "Loading..." : "Load"}</Button>
            <Button size="small" variant="outlined" onClick={() => exportCsv("audit-email-configuration.csv", rows)}>Export</Button>
          </Stack>
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {filters.map((filter, index) => (
              <React.Fragment key={index}>
                <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => setFilters((prev) => prev.map((item, i) => i === index ? { field: event.target.value, value: "" } : item))}>{fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={7}><Autocomplete freeSolo options={options.filterOptions?.[filter.field] || []} value={filter.value || ""} onInputChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value } : item))} renderInput={(params) => <TextField {...params} size="small" label="Value" />} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button></Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} checkboxSelection onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} disableRowSelectionOnClick /></Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function NepLmsAttendanceAuditAgentPage() {
  const [form, setForm] = useState({ academicyear: "", fromdate: "", todate: "" });
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async (path, label) => {
    try {
      setBusy(label);
      setError("");
      setResult(null);
      const res = await ep1.post(path, withScope(form));
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Agent failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <MenuPageShell title="Attendance audit agent">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {result && <Alert severity="success">{JSON.stringify(result)}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label="Academic year" value={form.academicyear} onChange={(event) => setForm((prev) => ({ ...prev, academicyear: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="From date" InputLabelProps={{ shrink: true }} value={form.fromdate} onChange={(event) => setForm((prev) => ({ ...prev, fromdate: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="To date" InputLabelProps={{ shrink: true }} value={form.todate} onChange={(event) => setForm((prev) => ({ ...prev, todate: event.target.value }))} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<AutoModeIcon />} disabled={!!busy} onClick={() => run("/api/v2/neplms/attendance-agent/create-missing-tasks", "create")}>{busy === "create" ? "Checking..." : "Create missing attendance tasks"}</Button>
                <Button variant="outlined" startIcon={<AutoModeIcon />} disabled={!!busy} onClick={() => run("/api/v2/neplms/attendance-agent/complete-taken-tasks", "complete")}>{busy === "complete" ? "Checking..." : "Complete attendance tasks already taken"}</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
