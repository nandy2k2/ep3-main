import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const colors = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed"];
const text = (value) => String(value || "").trim();

function PageShell({ title, children }) {
  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: 2 }}>
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Typography variant="h5" fontWeight={900}>{title}</Typography>
        </Paper>
        {children}
      </Box>
    </MenuPageShell>
  );
}

function useBulkEmailOptions() {
  const [options, setOptions] = useState({ emailconfigs: [], roles: [], userFields: [], leadFields: [], campaigns: [] });
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/bulk-email/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };
  useEffect(() => { loadOptions(); }, []);
  return { options, loadOptions };
}

function EmailConfigSelect({ value, onChange, configs }) {
  return (
    <Autocomplete
      options={configs || []}
      value={(configs || []).find((c) => c._id === value) || null}
      getOptionLabel={(option) => option.label || `${option.provider || ""} ${option.username || ""}`}
      onChange={(_, v) => onChange(v?._id || "")}
      renderInput={(params) => <TextField {...params} size="small" label="Email configuration" />}
    />
  );
}

function DynamicFilters({ type, fields, filters, setFilters }) {
  const add = () => setFilters((prev) => [...prev, { field: "", operator: "contains", value: "", values: [] }]);
  const remove = (index) => setFilters((prev) => prev.filter((_, i) => i !== index));
  const update = (index, patch) => setFilters((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const loadValues = async (index, field) => {
    if (!field) return;
    const res = await ep1.get("/api/v2/bulk-email/distinct-values", { params: { colid: global1.colid, type, field } });
    update(index, { field, value: "", values: res.data?.values || [] });
  };
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography fontWeight={800}>Dynamic filters</Typography>
        <Button size="small" variant="outlined" onClick={add}>Add filter</Button>
      </Stack>
      <Grid container spacing={2}>
        {filters.map((filter, index) => (
          <React.Fragment key={`${filter.field}-${index}`}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={fields || []}
                value={filter.field || null}
                onChange={(_, v) => loadValues(index, v || "")}
                renderInput={(params) => <TextField {...params} size="small" label="Field" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth size="small" label="Operator" value={filter.operator || "contains"} onChange={(e) => update(index, { operator: e.target.value })}>
                <MenuItem value="contains">Contains</MenuItem>
                <MenuItem value="equals">Equals</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <Autocomplete
                freeSolo
                options={filter.values || []}
                value={filter.value || ""}
                onInputChange={(_, v) => update(index, { value: v || "" })}
                onChange={(_, v) => update(index, { value: v || "" })}
                renderInput={(params) => <TextField {...params} size="small" label="Value" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth color="error" variant="outlined" onClick={() => remove(index)}>Remove</Button>
            </Grid>
          </React.Fragment>
        ))}
        {!filters.length && <Grid item xs={12}><Typography color="text.secondary">Add filters, then click Load.</Typography></Grid>}
      </Grid>
    </Paper>
  );
}

function UploadLinks({ links, setLinks, disabled }) {
  const [manual, setManual] = useState("");
  const [progress, setProgress] = useState(0);
  const upload = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("colid", global1.colid);
    fd.append("user", global1.user || "");
    fd.append("folder", "bulk-email");
    fd.append("description", `Bulk email attachment ${file.name}`);
    setProgress(1);
    const res = await ep1.post("/api/v2/aws-file-library/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => setProgress(Math.round((event.loaded * 100) / (event.total || 1)))
    });
    const link = res.data?.url || "";
    if (link) setLinks((prev) => [...prev, link]);
    setProgress(0);
  };
  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled}>
          Upload AWS file
          <input hidden type="file" onChange={(e) => upload(e.target.files?.[0])} />
        </Button>
        <TextField size="small" label="Manual AWS/file link" value={manual} onChange={(e) => setManual(e.target.value)} sx={{ flex: 1 }} />
        <Button variant="outlined" disabled={!manual} onClick={() => { setLinks((prev) => [...prev, manual]); setManual(""); }}>Add link</Button>
      </Stack>
      {progress > 0 && <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={18} /><Typography variant="body2">Uploading {progress}%</Typography></Stack>}
      {!!links.length && (
        <Stack spacing={0.5}>
          {links.map((link, index) => (
            <Stack key={link} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ wordBreak: "break-all", flex: 1 }}>{link}</Typography>
              <Button size="small" color="error" onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function MailComposer({ configs, emailconfigid, setEmailconfigid, subject, setSubject, body, setBody, filelinks, setFilelinks, attachmentlinks, setAttachmentlinks, onSend, sending, disabled }) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}><EmailConfigSelect value={emailconfigid} onChange={setEmailconfigid} configs={configs} /></Grid>
        <Grid item xs={12} md={8}><TextField fullWidth size="small" label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></Grid>
        <Grid item xs={12}><TextField fullWidth multiline minRows={5} label="Body text" value={body} onChange={(e) => setBody(e.target.value)} /></Grid>
        <Grid item xs={12} md={6}><Typography fontWeight={800} sx={{ mb: 1 }}>Links shown in email body</Typography><UploadLinks links={filelinks} setLinks={setFilelinks} disabled={sending} /></Grid>
        <Grid item xs={12} md={6}><Typography fontWeight={800} sx={{ mb: 1 }}>Files sent as attachments</Typography><UploadLinks links={attachmentlinks} setLinks={setAttachmentlinks} disabled={sending} /></Grid>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />} disabled={disabled || sending} onClick={onSend}>
              {sending ? "Sending..." : "Send selected"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}

const userColumns = [
  { field: "name", headerName: "Name", width: 190 },
  { field: "email", headerName: "Email", width: 240 },
  { field: "role", headerName: "Role", width: 150 },
  { field: "department", headerName: "Department", width: 180 },
  { field: "designation", headerName: "Designation", width: 180 },
  { field: "phone", headerName: "Phone", width: 140 },
  { field: "academicyear", headerName: "Academic year", width: 140 },
  { field: "program", headerName: "Program", width: 190 },
  { field: "programcode", headerName: "Program code", width: 140 }
].map((col) => ({ ...col, cellClassName: "wrapped-cell" }));

const leadColumns = [
  { field: "name", headerName: "Lead", width: 190 },
  { field: "email", headerName: "Email", width: 240 },
  { field: "phone", headerName: "Phone", width: 140 },
  { field: "year", headerName: "Academic year", width: 140 },
  { field: "program", headerName: "Program", width: 190 },
  { field: "programcode", headerName: "Program code", width: 140 },
  { field: "source", headerName: "Source", width: 150 },
  { field: "pipeline_stage", headerName: "Stage", width: 170 },
  { field: "leadstatus", headerName: "Status", width: 120 }
].map((col) => ({ ...col, cellClassName: "wrapped-cell" }));

function gridSx() {
  return {
    "& .wrapped-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 },
    "& .MuiDataGrid-cell": { alignItems: "flex-start" }
  };
}

export function BulkEmailUsersPage() {
  const { options } = useBulkEmailOptions();
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [emailconfigid, setEmailconfigid] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filelinks, setFilelinks] = useState([]);
  const [attachmentlinks, setAttachmentlinks] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedRecipients = useMemo(() => rows.filter((row) => selected.includes(row._id)), [rows, selected]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.post("/api/v2/bulk-email/users/search", { colid: global1.colid, roles, search, dynamicFilters: filters });
      setRows(res.data?.data || []);
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };
  const send = async () => {
    try {
      setSending(true);
      setError("");
      const res = await ep1.post("/api/v2/bulk-email/send", {
        colid: global1.colid,
        module: "User",
        recipienttype: "User",
        recipients: selectedRecipients,
        emailconfigid,
        subject,
        body,
        filelinks,
        attachmentlinks,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Sent: ${res.data?.sent || 0}, Failed: ${res.data?.failed || 0}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell title="Bulk email users">
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}><Autocomplete multiple disableCloseOnSelect options={options.roles || []} value={roles} onChange={(_, v) => setRoles(v)} renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} />{option}</li>} renderInput={(params) => <TextField {...params} size="small" label="Role" />} /></Grid>
          <Grid item xs={12} md={5}><TextField fullWidth size="small" label="Search name/email/department" value={search} onChange={(e) => setSearch(e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><Button fullWidth variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />} disabled={loading} onClick={load}>{loading ? "Loading..." : "Load users"}</Button></Grid>
        </Grid>
      </Paper>
      <DynamicFilters type="user" fields={options.userFields || []} filters={filters} setFilters={setFilters} />
      <Paper sx={{ p: 1, mb: 2 }}>
        <DataGrid rows={rows} getRowId={(row) => row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} columns={userColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} sx={gridSx()} />
      </Paper>
      <MailComposer configs={options.emailconfigs} emailconfigid={emailconfigid} setEmailconfigid={setEmailconfigid} subject={subject} setSubject={setSubject} body={body} setBody={setBody} filelinks={filelinks} setFilelinks={setFilelinks} attachmentlinks={attachmentlinks} setAttachmentlinks={setAttachmentlinks} onSend={send} sending={sending} disabled={!selected.length || !emailconfigid || !subject || !body} />
    </PageShell>
  );
}

function CampaignForm({ campaigns, loadCampaigns, onSelect }) {
  const [form, setForm] = useState({ campaignname: "", description: "", status: "Active", startdate: "", enddate: "" });
  const [editing, setEditing] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await ep1.post("/api/v2/bulk-email/campaigns", { ...form, id: editing, colid: global1.colid, user: global1.user, name: global1.name });
    setForm({ campaignname: "", description: "", status: "Active", startdate: "", enddate: "" });
    setEditing("");
    await loadCampaigns();
    setSaving(false);
  };
  const columns = [
    { field: "campaignname", headerName: "Campaign", width: 240 },
    { field: "description", headerName: "Description", width: 300 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "startdate", headerName: "Start date", width: 130, valueGetter: ({ row }) => row.startdate ? String(row.startdate).slice(0, 10) : "" },
    { field: "enddate", headerName: "End date", width: 130, valueGetter: ({ row }) => row.enddate ? String(row.enddate).slice(0, 10) : "" },
    { field: "actions", type: "actions", width: 140, getActions: ({ row }) => [
      <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditing(row._id); setForm({ campaignname: row.campaignname || "", description: row.description || "", status: row.status || "Active", startdate: row.startdate ? String(row.startdate).slice(0, 10) : "", enddate: row.enddate ? String(row.enddate).slice(0, 10) : "" }); }} />,
      <GridActionsCellItem icon={<SendIcon />} label="Use" onClick={() => onSelect(row)} />
    ] }
  ];
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography fontWeight={900} sx={{ mb: 1 }}>Campaign master</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Campaign" value={form.campaignname} onChange={(e) => setForm((p) => ({ ...p, campaignname: e.target.value }))} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
        <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Closed">Closed</MenuItem></TextField></Grid>
        <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="date" label="Start" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid>
        <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="date" label="End" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((p) => ({ ...p, enddate: e.target.value }))} /></Grid>
        <Grid item xs={12} md={1}><Button fullWidth variant="contained" disabled={saving || !form.campaignname} onClick={save}>{saving ? "Saving..." : editing ? "Update" : "Save"}</Button></Grid>
      </Grid>
      <DataGrid rows={campaigns || []} getRowId={(row) => row._id} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx()} />
    </Paper>
  );
}

export function CrmEmailCampaignPage() {
  const { options, loadOptions } = useBulkEmailOptions();
  const [campaign, setCampaign] = useState(null);
  const [filters, setFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [emailconfigid, setEmailconfigid] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filelinks, setFilelinks] = useState([]);
  const [attachmentlinks, setAttachmentlinks] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const selectedRecipients = useMemo(() => rows.filter((row) => selected.includes(row._id)), [rows, selected]);
  const load = async () => {
    try {
      setLoading(true);
      const res = await ep1.post("/api/v2/bulk-email/leads/search", { colid: global1.colid, search, fromDate, toDate, dynamicFilters: filters });
      setRows(res.data?.data || []);
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load leads");
    } finally {
      setLoading(false);
    }
  };
  const send = async () => {
    try {
      setSending(true);
      const res = await ep1.post("/api/v2/bulk-email/send", {
        colid: global1.colid,
        module: "CRM",
        recipienttype: "Lead",
        campaignid: campaign?._id,
        campaignname: campaign?.campaignname,
        recipients: selectedRecipients,
        emailconfigid,
        subject,
        body,
        filelinks,
        attachmentlinks,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Campaign email sent. Sent: ${res.data?.sent || 0}, Failed: ${res.data?.failed || 0}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send campaign");
    } finally {
      setSending(false);
    }
  };
  return (
    <PageShell title="CRM email campaign">
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <CampaignForm campaigns={options.campaigns || []} loadCampaigns={loadOptions} onSelect={setCampaign} />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}><Autocomplete options={options.campaigns || []} value={campaign} getOptionLabel={(o) => o.campaignname || ""} onChange={(_, v) => setCampaign(v)} renderInput={(params) => <TextField {...params} size="small" label="Select campaign" />} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Search lead/email/phone" value={search} onChange={(e) => setSearch(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={toDate} onChange={(e) => setToDate(e.target.value)} /></Grid>
          <Grid item xs={12} md={1}><Button fullWidth variant="contained" disabled={loading} onClick={load}>{loading ? "..." : "Load"}</Button></Grid>
        </Grid>
      </Paper>
      <DynamicFilters type="lead" fields={options.leadFields || []} filters={filters} setFilters={setFilters} />
      <Paper sx={{ p: 1, mb: 2 }}><DataGrid rows={rows} getRowId={(row) => row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} columns={leadColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx()} /></Paper>
      <MailComposer configs={options.emailconfigs} emailconfigid={emailconfigid} setEmailconfigid={setEmailconfigid} subject={subject} setSubject={setSubject} body={body} setBody={setBody} filelinks={filelinks} setFilelinks={setFilelinks} attachmentlinks={attachmentlinks} setAttachmentlinks={setAttachmentlinks} onSend={send} sending={sending} disabled={!campaign || !selected.length || !emailconfigid || !subject || !body} />
    </PageShell>
  );
}

export function CrmCampaignReportPage() {
  const { options } = useBulkEmailOptions();
  const [campaign, setCampaign] = useState(null);
  const [opened, setOpened] = useState("All");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, opened: 0, notopened: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const res = await ep1.post("/api/v2/bulk-email/campaign-report", { colid: global1.colid, campaignid: campaign?._id || "", opened });
    setRows(res.data?.data || []);
    setSummary(res.data?.summary || {});
    setLoading(false);
  };
  const pieData = [{ name: "Opened", value: summary.opened || 0 }, { name: "Not opened", value: summary.notopened || 0 }];
  return (
    <PageShell title="CRM campaign report">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}><Autocomplete options={options.campaigns || []} value={campaign} getOptionLabel={(o) => o.campaignname || ""} onChange={(_, v) => setCampaign(v)} renderInput={(params) => <TextField {...params} size="small" label="Campaign" />} /></Grid>
          <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Opened filter" value={opened} onChange={(e) => setOpened(e.target.value)}><MenuItem value="All">All</MenuItem><MenuItem value="Yes">Viewed</MenuItem><MenuItem value="No">Not viewed</MenuItem></TextField></Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={loading} onClick={load}>{loading ? "Loading..." : "Load"}</Button></Grid>
        </Grid>
      </Paper>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[["Total", summary.total], ["Sent", summary.sent], ["Failed", summary.failed], ["Opened", summary.opened], ["Not opened", summary.notopened]].map(([label, value]) => <Grid item xs={12} md={2.4} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value || 0}</Typography></CardContent></Card></Grid>)}
      </Grid>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" nameKey="name" label>{pieData.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Paper></Grid>
        <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><ResponsiveContainer><BarChart data={pieData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer></Paper></Grid>
      </Grid>
      <Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(row) => row._id} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx()} columns={[
        { field: "campaignname", headerName: "Campaign", width: 200 },
        { field: "recipientname", headerName: "Recipient", width: 200 },
        { field: "recipientemail", headerName: "Email", width: 240 },
        { field: "subject", headerName: "Subject", width: 260 },
        { field: "status", headerName: "Status", width: 110 },
        { field: "opened", headerName: "Opened", width: 110 },
        { field: "sentat", headerName: "Sent at", width: 190, valueGetter: ({ row }) => row.sentat ? new Date(row.sentat).toLocaleString() : "" },
        { field: "openedat", headerName: "Opened at", width: 190, valueGetter: ({ row }) => row.openedat ? new Date(row.openedat).toLocaleString() : "" },
        { field: "error", headerName: "Error", width: 260 }
      ]} /></Paper>
    </PageShell>
  );
}

export function CrmRecampaignPage() {
  const { options } = useBulkEmailOptions();
  const [campaign, setCampaign] = useState(null);
  const [opened, setOpened] = useState("No");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [emailconfigid, setEmailconfigid] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filelinks, setFilelinks] = useState([]);
  const [attachmentlinks, setAttachmentlinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedRecipients = useMemo(() => rows.filter((row) => selected.includes(row._id)).map((row) => ({ _id: row.recipientid, name: row.recipientname, email: row.recipientemail })), [rows, selected]);
  const load = async () => {
    setLoading(true);
    const res = await ep1.post("/api/v2/bulk-email/campaign-report", { colid: global1.colid, campaignid: campaign?._id || "", opened });
    setRows(res.data?.data || []);
    setSelected([]);
    setLoading(false);
  };
  const send = async () => {
    try {
      setSending(true);
      const res = await ep1.post("/api/v2/bulk-email/send", {
        colid: global1.colid,
        module: "CRM",
        recipienttype: "Lead",
        campaignid: campaign?._id,
        campaignname: `${campaign?.campaignname || "Campaign"} - Recampaign`,
        recipients: selectedRecipients,
        emailconfigid,
        subject,
        body,
        filelinks,
        attachmentlinks,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Recampaign sent. Sent: ${res.data?.sent || 0}, Failed: ${res.data?.failed || 0}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send recampaign");
    } finally {
      setSending(false);
    }
  };
  return (
    <PageShell title="CRM recampaign">
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}><Autocomplete options={options.campaigns || []} value={campaign} getOptionLabel={(o) => o.campaignname || ""} onChange={(_, v) => setCampaign(v)} renderInput={(params) => <TextField {...params} size="small" label="Campaign" />} /></Grid>
          <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Who to target" value={opened} onChange={(e) => setOpened(e.target.value)}><MenuItem value="Yes">Viewed</MenuItem><MenuItem value="No">Not viewed</MenuItem><MenuItem value="All">All</MenuItem></TextField></Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={loading || !campaign} onClick={load}>{loading ? "Loading..." : "Load"}</Button></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1, mb: 2 }}><DataGrid rows={rows} getRowId={(row) => row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx()} columns={[
        { field: "recipientname", headerName: "Recipient", width: 200 },
        { field: "recipientemail", headerName: "Email", width: 240 },
        { field: "subject", headerName: "Previous subject", width: 260 },
        { field: "opened", headerName: "Opened", width: 110 },
        { field: "sentat", headerName: "Sent at", width: 190, valueGetter: ({ row }) => row.sentat ? new Date(row.sentat).toLocaleString() : "" }
      ]} /></Paper>
      <MailComposer configs={options.emailconfigs} emailconfigid={emailconfigid} setEmailconfigid={setEmailconfigid} subject={subject} setSubject={setSubject} body={body} setBody={setBody} filelinks={filelinks} setFilelinks={setFilelinks} attachmentlinks={attachmentlinks} setAttachmentlinks={setAttachmentlinks} onSend={send} sending={sending} disabled={!selected.length || !emailconfigid || !subject || !body} />
    </PageShell>
  );
}
