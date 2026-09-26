import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.35, py: 1 },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2, fontWeight: 800 }
};

const blankRule = {
  rulename: "",
  subjectcontains: "",
  contentcontains: "",
  replysubject: "",
  replybody: "",
  priority: 1,
  active: "Yes",
  stopafterreply: "Yes"
};

const blankAgent = {
  agentname: "",
  gmailaccount: "",
  oauthconfigid: "",
  accesstoken: "",
  refreshtoken: "",
  maxemails: 25,
  markasread: "Yes",
  status: "Active",
  rules: [{ ...blankRule, rulename: "Default lead reply", replysubject: "Re: {subject}", replybody: "Dear {name},\n\nThank you for contacting us. Our admissions team will get back to you shortly.\n\nRegards" }]
};

const colors = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0891b2"];
const fmt = (value) => (value ? new Date(value).toLocaleString() : "");

const blankOauth = {
  configname: "",
  gmailaccount: "",
  clientid: "",
  clientsecret: "",
  redirecturi: `${window.location.origin}/crm-gmail-oauth-configuration`,
  scopes: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send",
  accesstoken: "",
  refreshtoken: "",
  active: "Yes",
  default: "No"
};

function StatCard({ label, value, color = "#2563eb" }) {
  return (
    <Card sx={{ height: "100%", borderTop: `4px solid ${color}` }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" fontWeight={900}>{value || 0}</Typography>
      </CardContent>
    </Card>
  );
}

function RuleEditor({ rules, setRules }) {
  const updateRule = (index, field, value) => {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)));
  };
  const addRule = () => setRules((prev) => [...prev, { ...blankRule, priority: prev.length + 1 }]);
  const deleteRule = (index) => setRules((prev) => prev.filter((_, i) => i !== index));
  return (
    <Paper sx={{ p: 2, bgcolor: "#f8fafc" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Reply rules</Typography>
          <Typography variant="body2" color="text.secondary">Rules are checked by priority. Subject and content criteria are case-insensitive.</Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={addRule}>Add rule</Button>
      </Stack>
      <Stack spacing={2}>
        {(rules || []).map((rule, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Rule name" value={rule.rulename || ""} onChange={(e) => updateRule(index, "rulename", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Priority" value={rule.priority || 1} onChange={(e) => updateRule(index, "priority", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Active" value={rule.active || "Yes"} onChange={(e) => updateRule(index, "active", e.target.value)}>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Subject contains" value={rule.subjectcontains || ""} onChange={(e) => updateRule(index, "subjectcontains", e.target.value)} /></Grid>
              <Grid item xs={12} md={1}>
                <IconButton color="error" onClick={() => deleteRule(index)} disabled={(rules || []).length <= 1}><DeleteIcon /></IconButton>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Content contains" value={rule.contentcontains || ""} onChange={(e) => updateRule(index, "contentcontains", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Reply subject" value={rule.replysubject || ""} onChange={(e) => updateRule(index, "replysubject", e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Reply body" helperText="Tokens: {name}, {from}, {fromemail}, {subject}, {snippet}, {agent}" value={rule.replybody || ""} onChange={(e) => updateRule(index, "replybody", e.target.value)} /></Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}

export function CrmGmailOauthConfigurationPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(blankOauth);
  const [editingId, setEditingId] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authUrl, setAuthUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/crm-gmail-oauth-config", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load OAuth configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code) setAuthCode(code);
    if (state && rows.length) {
      const matched = rows.find((row) => row._id === state);
      if (matched) edit(matched);
    }
  }, [rows]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const reset = () => {
    setForm(blankOauth);
    setEditingId("");
    setAuthCode("");
    setAuthUrl("");
  };

  const save = async () => {
    if (!form.configname || !form.clientid || !form.redirecturi) {
      setError("Configuration name, client id and redirect URI are required");
      return;
    }
    setBusy("save");
    setError("");
    try {
      await ep1.post("/api/v2/crm-gmail-oauth-config", {
        ...form,
        id: editingId,
        colid: global1.colid,
        user: global1.user,
        username: global1.name
      });
      setMessage(editingId ? "OAuth configuration updated" : "OAuth configuration saved");
      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save OAuth configuration");
    } finally {
      setBusy("");
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({
      configname: row.configname || "",
      gmailaccount: row.gmailaccount || "",
      clientid: row.clientid || "",
      clientsecret: row.clientsecret || "",
      redirecturi: row.redirecturi || blankOauth.redirecturi,
      scopes: row.scopes || blankOauth.scopes,
      accesstoken: row.accesstoken || "",
      refreshtoken: row.refreshtoken || "",
      active: row.active || "Yes",
      default: row.default || "No"
    });
    setAuthCode("");
    setAuthUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async () => {
    if (!selected.length || !window.confirm("Delete selected Gmail OAuth configurations?")) return;
    await ep1.post("/api/v2/crm-gmail-oauth-config-delete", { colid: global1.colid, ids: selected });
    setSelected([]);
    await load();
  };

  const generateAuthUrl = async () => {
    if (!editingId) {
      setError("Save the configuration first, then generate the authorization URL");
      return;
    }
    setBusy("auth");
    setError("");
    try {
      const res = await ep1.get("/api/v2/crm-gmail-oauth-config-auth-url", { params: { colid: global1.colid, id: editingId } });
      setAuthUrl(res.data?.authurl || "");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate authorization URL");
    } finally {
      setBusy("");
    }
  };

  const exchangeCode = async () => {
    if (!editingId || !authCode) {
      setError("Select a saved configuration and paste the authorization code");
      return;
    }
    setBusy("exchange");
    setError("");
    try {
      await ep1.post("/api/v2/crm-gmail-oauth-config-exchange", { colid: global1.colid, id: editingId, code: authCode });
      setMessage("Authorization code exchanged and refresh token saved");
      setAuthCode("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to exchange authorization code");
    } finally {
      setBusy("");
    }
  };

  const refresh = async (row) => {
    setBusy(row._id);
    setError("");
    try {
      await ep1.post("/api/v2/crm-gmail-oauth-config-refresh", { colid: global1.colid, id: row._id });
      setMessage("Access token refreshed");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refresh token");
    } finally {
      setBusy("");
    }
  };

  const columns = [
    { field: "configname", headerName: "Configuration", width: 220 },
    { field: "gmailaccount", headerName: "Gmail account", width: 230 },
    { field: "clientid", headerName: "Client ID", width: 260 },
    { field: "redirecturi", headerName: "Redirect URI", width: 300 },
    { field: "active", headerName: "Active", width: 100 },
    { field: "default", headerName: "Default", width: 110 },
    { field: "refreshtoken", headerName: "Refresh token", width: 140, valueGetter: ({ row }) => row.refreshtoken ? "Saved" : "Missing" },
    { field: "tokenexpiry", headerName: "Token expiry", width: 190, valueGetter: ({ row }) => fmt(row.tokenexpiry) },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => edit(row)}>Edit</Button>
          <Button size="small" variant="contained" disabled={!!busy} onClick={() => refresh(row)}>{busy === row._id ? "..." : "Refresh"}</Button>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title="Gmail OAuth configuration">
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>
        This page stores the OAuth client and refresh token used by the Email reply agent. Once configured, agents can refresh Gmail access automatically.
      </Alert>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Setup guide</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography component="ol" sx={{ pl: 3, m: 0, lineHeight: 1.8 }}>
              <li>Open Google Cloud Console and create/select a project.</li>
              <li>Enable Gmail API for that project.</li>
              <li>Configure OAuth consent screen. Add the Gmail account as a test user if the app is in testing.</li>
              <li>Create OAuth Client ID with application type Web application.</li>
              <li>Add this page URL, or the redirect URL entered below, under Authorized redirect URIs.</li>
              <li>Copy Client ID and Client Secret into this page and save.</li>
              <li>Click Generate authorization URL, open it, sign in with the Gmail account and allow access.</li>
              <li>After redirect, copy the code from the URL and paste it here, then click Exchange code.</li>
              <li>Select this OAuth configuration in Email reply agent.</li>
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={900}>Required scopes</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Gmail modify is used to read unread messages and mark them read. Gmail send is used to send the reply.</Typography>
            <Paper sx={{ p: 1.5, bgcolor: "#f8fafc", fontFamily: "monospace", fontSize: 13, overflowWrap: "anywhere" }}>
              https://www.googleapis.com/auth/gmail.modify<br />
              https://www.googleapis.com/auth/gmail.send
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              If Google does not return a refresh token, revoke the app access from the Google account, then authorize again with prompt consent.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><TextField fullWidth label="Configuration name" value={form.configname} onChange={(e) => update("configname", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Gmail account" value={form.gmailaccount} onChange={(e) => update("gmailaccount", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Client ID" value={form.clientid} onChange={(e) => update("clientid", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Client Secret" value={form.clientsecret} onChange={(e) => update("clientsecret", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Redirect URI" value={form.redirecturi} onChange={(e) => update("redirecturi", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Scopes" value={form.scopes} onChange={(e) => update("scopes", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth label="Active" value={form.active} onChange={(e) => update("active", e.target.value)}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth label="Default" value={form.default} onChange={(e) => update("default", e.target.value)}><MenuItem value="No">No</MenuItem><MenuItem value="Yes">Yes</MenuItem></TextField></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Access token" value={form.accesstoken} onChange={(e) => update("accesstoken", e.target.value)} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Refresh token" value={form.refreshtoken} onChange={(e) => update("refreshtoken", e.target.value)} /></Grid>
          <Grid item xs={12}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Button variant="contained" startIcon={busy === "save" ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={!!busy} onClick={save}>{editingId ? "Update configuration" : "Save configuration"}</Button>
              <Button variant="outlined" disabled={!editingId || !!busy} onClick={generateAuthUrl}>{busy === "auth" ? "Generating..." : "Generate authorization URL"}</Button>
              <Button variant="outlined" onClick={reset}>Clear</Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selected.length} onClick={remove}>Bulk delete</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      {authUrl && (
        <Paper sx={{ p: 2, mb: 2, border: "1px solid #bfdbfe" }}>
          <Typography fontWeight={900}>Authorization URL</Typography>
          <Typography sx={{ overflowWrap: "anywhere", my: 1 }}>{authUrl}</Typography>
          <Button variant="contained" onClick={() => window.open(authUrl, "_blank", "noopener,noreferrer")}>Open Google consent screen</Button>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={9}><TextField fullWidth label="Paste authorization code from redirected URL" value={authCode} onChange={(e) => setAuthCode(e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth sx={{ height: 56 }} variant="contained" disabled={busy === "exchange"} onClick={exchangeCode}>{busy === "exchange" ? "Exchanging..." : "Exchange code"}</Button></Grid>
          </Grid>
        </Paper>
      )}
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} loading={loading} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} autoHeight pageSizeOptions={[10, 25, 50]} slots={{ toolbar: GridToolbar }} sx={gridSx} />
      </Paper>
    </MenuPageShell>
  );
}

export function CrmEmailReplyAgentPage() {
  const [agents, setAgents] = useState([]);
  const [oauthConfigs, setOauthConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(blankAgent);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/crm-gmail-reply-agent", { params: { colid: global1.colid } });
      setAgents(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load agents");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    const res = await ep1.get("/api/v2/crm-gmail-reply-agent-logs", { params: { colid: global1.colid } });
    setLogs(res.data?.data || []);
  };

  const loadOauthConfigs = async () => {
    const res = await ep1.get("/api/v2/crm-gmail-oauth-config", { params: { colid: global1.colid } });
    setOauthConfigs(res.data?.data || []);
  };

  useEffect(() => {
    loadAgents();
    loadLogs();
    loadOauthConfigs();
  }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const resetForm = () => {
    setForm(blankAgent);
    setEditingId("");
  };

  const save = async () => {
    if (!form.agentname || !form.gmailaccount || (!form.oauthconfigid && !form.accesstoken)) {
      setError("Agent name, Gmail account and OAuth configuration or access token are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await ep1.post("/api/v2/crm-gmail-reply-agent", {
        ...form,
        id: editingId,
        colid: global1.colid,
        user: global1.user,
        username: global1.name
      });
      setMessage(editingId ? "Agent updated" : "Agent created");
      resetForm();
      await loadAgents();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save agent");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({
      agentname: row.agentname || "",
      gmailaccount: row.gmailaccount || "",
      oauthconfigid: row.oauthconfigid || "",
      accesstoken: row.accesstoken || "",
      refreshtoken: row.refreshtoken || "",
      maxemails: row.maxemails || 25,
      markasread: row.markasread || "Yes",
      status: row.status || "Active",
      rules: row.rules?.length ? row.rules : [{ ...blankRule }]
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async () => {
    if (!selected.length || !window.confirm("Delete selected email reply agents?")) return;
    await ep1.post("/api/v2/crm-gmail-reply-agent-delete", { colid: global1.colid, ids: selected });
    setSelected([]);
    await loadAgents();
  };

  const run = async (row) => {
    setRunningId(row._id);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/crm-gmail-reply-agent-run", {
        id: row._id,
        colid: global1.colid,
        user: global1.user,
        username: global1.name
      });
      setMessage(`Agent run completed. Processed ${res.data?.processed || 0} unread mails.`);
      await loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to run agent");
    } finally {
      setRunningId("");
    }
  };

  const agentColumns = [
    { field: "agentname", headerName: "Agent", width: 220 },
    { field: "gmailaccount", headerName: "Gmail account", width: 240 },
    { field: "oauthconfigid", headerName: "OAuth", width: 160, valueGetter: ({ row }) => row.oauthconfigid ? "Configured" : "Manual token" },
    { field: "status", headerName: "Status", width: 110, renderCell: ({ value }) => <Chip size="small" color={value === "Active" ? "success" : "default"} label={value || "Active"} /> },
    { field: "maxemails", headerName: "Max unread", width: 120 },
    { field: "rules", headerName: "Rules", width: 120, valueGetter: ({ row }) => row.rules?.length || 0 },
    { field: "updatedAt", headerName: "Updated", width: 190, valueGetter: ({ row }) => fmt(row.updatedAt) },
    {
      field: "actions",
      headerName: "Actions",
      width: 260,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => edit(row)}>Edit</Button>
          <Button size="small" variant="contained" startIcon={runningId === row._id ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />} disabled={!!runningId} onClick={() => run(row)}>Run</Button>
        </Stack>
      )
    }
  ];

  const logColumns = [
    { field: "processedat", headerName: "Processed at", width: 190, valueGetter: ({ row }) => fmt(row.processedat) },
    { field: "agentname", headerName: "Agent", width: 190 },
    { field: "from", headerName: "From", width: 240 },
    { field: "subject", headerName: "Subject", width: 280 },
    { field: "matchedrule", headerName: "Rule", width: 180 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "reason", headerName: "Reason", width: 220 },
    { field: "error", headerName: "Error", width: 260 }
  ];

  return (
    <MenuPageShell title="Email reply agent">
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>
        Select a saved Gmail OAuth configuration for automatic token refresh, define subject/content matching rules, then run the agent to reply to unread Gmail messages.
      </Alert>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><TextField fullWidth label="Agent name" value={form.agentname} onChange={(e) => updateForm("agentname", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Gmail account" value={form.gmailaccount} onChange={(e) => updateForm("gmailaccount", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="OAuth configuration" value={form.oauthconfigid} onChange={(e) => updateForm("oauthconfigid", e.target.value)}>
              <MenuItem value="">Manual access token</MenuItem>
              {oauthConfigs.map((config) => <MenuItem key={config._id} value={config._id}>{config.configname} - {config.gmailaccount}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Max unread mails" value={form.maxemails} onChange={(e) => updateForm("maxemails", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}>
            <TextField select fullWidth label="Mark as read" value={form.markasread} onChange={(e) => updateForm("markasread", e.target.value)}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField select fullWidth label="Status" value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}><TextField fullWidth multiline minRows={2} label="Manual Gmail access token" helperText="Optional. Prefer OAuth configuration for production." value={form.accesstoken} onChange={(e) => updateForm("accesstoken", e.target.value)} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth multiline minRows={2} label="Manual refresh token / note" value={form.refreshtoken} onChange={(e) => updateForm("refreshtoken", e.target.value)} /></Grid>
        </Grid>
      </Paper>
      <RuleEditor rules={form.rules} setRules={(updater) => setForm((prev) => ({ ...prev, rules: typeof updater === "function" ? updater(prev.rules) : updater }))} />
      <Stack direction="row" spacing={1} sx={{ my: 2 }}>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>{editingId ? "Update agent" : "Save agent"}</Button>
        {editingId && <Button variant="outlined" onClick={resetForm}>Cancel edit</Button>}
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selected.length} onClick={remove}>Bulk delete</Button>
      </Stack>
      <Paper sx={{ p: 1, mb: 2 }}>
        <DataGrid rows={agents} getRowId={(row) => row._id} columns={agentColumns} loading={loading} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} autoHeight pageSizeOptions={[10, 25, 50]} slots={{ toolbar: GridToolbar }} sx={gridSx} />
      </Paper>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Latest reply log</Typography>
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={logs} getRowId={(row) => row._id} columns={logColumns} autoHeight pageSizeOptions={[10, 25, 50]} slots={{ toolbar: GridToolbar }} sx={gridSx} />
      </Paper>
    </MenuPageShell>
  );
}

export function CrmEmailAgentReportPage() {
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ agentid: "", status: "All", from: "", to: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [byStatus, setByStatus] = useState([]);
  const [byRule, setByRule] = useState([]);
  const [daywise, setDaywise] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/crm-gmail-reply-agent", { params: { colid: global1.colid } }).then((res) => setAgents(res.data?.data || [])).catch(() => setAgents([]));
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/crm-gmail-reply-agent-report", { params: { colid: global1.colid, ...filters } });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || {});
      setByStatus(res.data?.byStatus || []);
      setByRule(res.data?.byRule || []);
      setDaywise(res.data?.daywise || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    } finally {
      setLoading(false);
    }
  };

  const chartRules = useMemo(() => byRule.slice(0, 10), [byRule]);

  const columns = [
    { field: "processedat", headerName: "Processed at", width: 190, valueGetter: ({ row }) => fmt(row.processedat) },
    { field: "agentname", headerName: "Agent", width: 190 },
    { field: "gmailaccount", headerName: "Mailbox", width: 220 },
    { field: "from", headerName: "From", width: 240 },
    { field: "subject", headerName: "Subject", width: 300 },
    { field: "matchedrule", headerName: "Matched rule", width: 180 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "replysubject", headerName: "Reply subject", width: 250 },
    { field: "reason", headerName: "Reason", width: 220 },
    { field: "error", headerName: "Error", width: 260 }
  ];

  return (
    <MenuPageShell title="Email agent report">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Agent" value={filters.agentid} onChange={(e) => setFilters((prev) => ({ ...prev, agentid: e.target.value }))}>
              <MenuItem value="">All agents</MenuItem>
              {agents.map((agent) => <MenuItem key={agent._id} value={agent._id}>{agent.agentname}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField select fullWidth label="Status" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              {["All", "Replied", "Skipped", "Error"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} /></Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="contained" disabled={loading} onClick={load}>{loading ? "Loading..." : "Load"}</Button>
              <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      <Box className="print-area">
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Email agent report</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}><StatCard label="Total processed" value={summary.total} color="#2563eb" /></Grid>
          <Grid item xs={12} md={3}><StatCard label="Replied" value={summary.replied} color="#16a34a" /></Grid>
          <Grid item xs={12} md={3}><StatCard label="Skipped" value={summary.skipped} color="#f97316" /></Grid>
          <Grid item xs={12} md={3}><StatCard label="Errors" value={summary.error} color="#dc2626" /></Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Status summary</Typography>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={95} label>{byStatus.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Rulewise processing</Typography>
              <ResponsiveContainer>
                <BarChart data={chartRules}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" hide /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Daywise replies</Typography>
              <ResponsiveContainer>
                <LineChart data={daywise}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} /></LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Paper sx={{ p: 1 }}>
          <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} loading={loading} autoHeight pageSizeOptions={[10, 25, 50, 100]} slots={{ toolbar: GridToolbar }} sx={gridSx} />
        </Paper>
      </Box>
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; color: #000 !important; } .print-area { position: absolute; left: 0; top: 0; width: 100%; background: #fff; } .screen-only, .MuiDataGrid-toolbarContainer, .MuiDataGrid-footerContainer { display: none !important; } }`}</style>
    </MenuPageShell>
  );
}
