import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const defaultBaseUrl = "https://apiv2.bhashsms.com";
const defaultAuthEndpoint = `${defaultBaseUrl}/auth/v1/appAuthenticate`;
const defaultSendEndpoint = `${defaultBaseUrl}/customer/api/v1/campaign/sendMessage`;

const blankConfig = {
  name: "BhashSMS WhatsApp",
  baseUrl: defaultBaseUrl,
  authenticateEndpoint: defaultAuthEndpoint,
  endpoint: defaultSendEndpoint,
  apiKey: "",
  businessCode: "",
  templateCode: "",
  templateName: "",
  defaultCountryCode: "91",
  phoneField: "phone",
  isactive: true,
  notes: ""
};

const filterFields = [
  "role",
  "academicyear",
  "admissionyear",
  "regulation",
  "program",
  "programcode",
  "semester",
  "section",
  "department",
  "designation",
  "category",
  "gender",
  "city",
  "state",
  "institution",
  "excluded",
  "notification"
];

const getColid = () => global1.colid || localStorage.getItem("colid") || "";
const getUser = () => global1.user || localStorage.getItem("user") || "";
const extractData = (res) => res?.data?.data || res?.data || [];
const blankTemplate = {
  templatename: "",
  templatecode: "",
  provider: "BhashSMS",
  noofvariables: 0,
  variablenames: "",
  active: "Yes"
};
const splitVariableNames = (template = {}) => String(template.variablenames || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const buildValueRowsFromTemplate = (template = {}) => {
  const names = splitVariableNames(template);
  const count = Math.max(names.length, Number(template.noofvariables || 0), 1);
  return Array.from({ length: count }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    variable: String(index + 1),
    label: names[index] || `Variable ${index + 1}`,
    value: ""
  }));
};

function SectionCard({ title, children, action }) {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 8px 22px rgba(30, 64, 175, 0.08)" }}>
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5} sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function ValueRows({ rows, setRows }) {
  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };
  const addRow = () => {
    setRows((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, variable: String(prev.length + 1), value: "" }]);
  };
  const removeRow = (id) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : [{ ...prev[0], variable: "1", value: "" }]));
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Template values</Typography>
        <Button variant="outlined" size="small" onClick={addRow}>Add value</Button>
      </Stack>
      {rows.map((row, index) => (
        <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={row.label ? `Variable (${row.label})` : "Variable"} value={row.variable} onChange={(e) => updateRow(row.id, { variable: e.target.value })} placeholder={String(index + 1)} />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField fullWidth label="Value" value={row.value} onChange={(e) => updateRow(row.id, { value: e.target.value })} placeholder="Value to replace in template" />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth color="error" variant="outlined" onClick={() => removeRow(row.id)}>Remove</Button>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Stack>
  );
}

export function BhashWhatsappConfigurationPage() {
  const colid = getColid();
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState(blankConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const loadConfigs = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/bhash-whatsapp/config", { params: { colid } });
      setConfigs(extractData(res));
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to load WhatsApp configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (colid) loadConfigs();
  }, [colid]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await ep1.post("/api/v2/bhash-whatsapp/config", { ...form, colid, user: getUser() });
      setMessage("BhashSMS WhatsApp configuration saved.");
      setForm(blankConfig);
      await loadConfigs();
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    setSaving(true);
    setMessage("");
    try {
      await ep1.post("/api/v2/bhash-whatsapp/config/delete", { colid, id: row._id });
      setMessage("Configuration deleted.");
      if (form._id === row._id) setForm(blankConfig);
      await loadConfigs();
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to delete configuration");
    } finally {
      setSaving(false);
    }
  };

  const authenticate = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/bhash-whatsapp/authenticate", { colid, configid: form._id });
      setMessage(res?.data?.tokenUpdated ? "Authentication successful. Access token saved." : "Authentication completed.");
      await loadConfigs();
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to authenticate with BhashSMS");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "businessCode", headerName: "Business code", width: 160 },
    { field: "templateName", headerName: "Default templateCode", flex: 1, minWidth: 180 },
    { field: "endpoint", headerName: "Send endpoint", flex: 1.5, minWidth: 250 },
    { field: "isactive", headerName: "Active", width: 90, valueGetter: (params) => (params.row?.isactive ? "Yes" : "No") },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => setForm({ ...blankConfig, ...params.row })}>Edit</Button>
          <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => remove(params.row)}>Delete</Button>
        </Stack>
      )
    }
  ];

  if (!unlocked) {
    return (
      <MenuPageShell title="Bhash WhatsApp Configuration">
        <Box sx={{ p: 2 }}>
          <Paper sx={{ p: 3, maxWidth: 520 }}>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Bhash WhatsApp Configuration</Typography>
              <Alert severity="info">Enter password to open WhatsApp configuration.</Alert>
              {message && <Alert severity="error" onClose={() => setMessage("")}>{message}</Alert>}
              <TextField
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (password === "kumropatash") setUnlocked(true);
                    else setMessage("Invalid password.");
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (password === "kumropatash") setUnlocked(true);
                  else setMessage("Invalid password.");
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
    <MenuPageShell title="Bhash WhatsApp Configuration">
      <Stack spacing={2}>
        <Alert severity="info">
          Configure the BhashSMS WhatsApp dashboard details here. The system authenticates by posting the API key to appAuthenticate and sends templates using Authorization: Bearer accessToken.
        </Alert>
        {message && <Alert severity={message.includes("saved") || message.includes("successful") || message.includes("deleted") ? "success" : "warning"}>{message}</Alert>}
        <SectionCard
          title="Configuration"
          action={(
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading || saving} onClick={loadConfigs}>Refresh</Button>
              <Button variant="outlined" disabled={!form._id || saving} onClick={authenticate}>Authenticate</Button>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>Save</Button>
            </Stack>
          )}
        >
          {saving && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth required label="Business code" value={form.businessCode} onChange={(e) => update("businessCode", e.target.value)} placeholder="BSLBXXX15" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Default templateCode" value={form.templateName || form.templateCode} onChange={(e) => { update("templateName", e.target.value); update("templateCode", e.target.value); }} placeholder="TEMPLATE001" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth type="password" required label="API key" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><Alert severity="info">BhashSMS v2 authentication needs only the API key. Username and password are not used.</Alert></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Authenticate endpoint" value={form.authenticateEndpoint} onChange={(e) => update("authenticateEndpoint", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Send message endpoint" value={form.endpoint} onChange={(e) => update("endpoint", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Default country code" value={form.defaultCountryCode} onChange={(e) => update("defaultCountryCode", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Phone field in user" value={form.phoneField} onChange={(e) => update("phoneField", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><FormControlLabel control={<Checkbox checked={Boolean(form.isactive)} onChange={(e) => update("isactive", e.target.checked)} />} label="Active" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} /></Grid>
          </Grid>
        </SectionCard>
        <SectionCard title="Saved Configurations">
          <Box sx={{ height: 420, width: "100%" }}>
            <DataGrid rows={configs} columns={columns} getRowId={(row) => row._id} loading={loading} components={{ Toolbar: GridToolbar }} disableRowSelectionOnClick />
          </Box>
        </SectionCard>
      </Stack>
    </MenuPageShell>
  );
}

export function WhatsappTemplatesPage() {
  const colid = getColid();
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(blankTemplate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/bhash-whatsapp/local-templates", { params: { colid } });
      setRows(extractData(res));
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to load WhatsApp templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (colid) load();
  }, [colid]);

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "variablenames") {
        const count = String(value || "").split(",").map((item) => item.trim()).filter(Boolean).length;
        next.noofvariables = count || prev.noofvariables || 0;
      }
      return next;
    });
  };

  const save = async () => {
    if (!form.templatename.trim()) return setMessage("Template name is required.");
    if (!form.templatecode.trim()) return setMessage("Template code is required.");
    setSaving(true);
    setMessage("");
    try {
      await ep1.post("/api/v2/bhash-whatsapp/local-templates", { ...form, colid, user: getUser(), name: global1.name });
      setMessage("WhatsApp template saved.");
      setForm(blankTemplate);
      await load();
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to save WhatsApp template");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ids = selectedIds) => {
    const validIds = Array.from(ids || []).filter(Boolean);
    if (!validIds.length) return setMessage("Select at least one template.");
    if (!window.confirm("Delete selected WhatsApp template(s)?")) return;
    setSaving(true);
    setMessage("");
    try {
      await ep1.post("/api/v2/bhash-whatsapp/local-templates/delete", { colid, ids: validIds });
      setMessage("WhatsApp template deleted.");
      setSelectedIds([]);
      await load();
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to delete WhatsApp template");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "templatename", headerName: "Template name", flex: 1, minWidth: 190 },
    { field: "templatecode", headerName: "Template code", flex: 1, minWidth: 170 },
    { field: "provider", headerName: "Provider", width: 140 },
    { field: "noofvariables", headerName: "Variables", width: 110 },
    { field: "variablenames", headerName: "Variable names", flex: 1.4, minWidth: 240 },
    { field: "active", headerName: "Active", width: 100 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => setForm({ ...blankTemplate, ...row })}>Edit</Button>
          <Button size="small" color="error" variant="outlined" onClick={() => remove([row._id])}>Delete</Button>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title="Whatsapp templates">
      <Stack spacing={2}>
        <Alert severity="info">Create reusable WhatsApp template definitions. Send WhatsApp pages use these templates to auto-fill template code and expected variable values.</Alert>
        {message && <Alert severity={message.includes("saved") || message.includes("deleted") ? "success" : "warning"}>{message}</Alert>}
        <SectionCard
          title="Template"
          action={(
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading || saving} onClick={load}>Refresh</Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={saving || !selectedIds.length} onClick={() => remove()}>Bulk delete</Button>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>Save</Button>
            </Stack>
          )}
        >
          {saving && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth required label="Template name" value={form.templatename} onChange={(e) => update("templatename", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth required label="Template code" value={form.templatecode} onChange={(e) => update("templatecode", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Provider" value={form.provider} onChange={(e) => update("provider", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="No of variables" value={form.noofvariables} onChange={(e) => update("noofvariables", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth label="Active" value={form.active} onChange={(e) => update("active", e.target.value)}>
                {["Yes", "No"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Variable names" value={form.variablenames} onChange={(e) => update("variablenames", e.target.value)} helperText="Separate variable names by comma, e.g. student_name, program, amount" /></Grid>
          </Grid>
        </SectionCard>
        <SectionCard title="Saved templates" action={<Chip color="primary" label={`${selectedIds.length} selected`} />}>
          <Box sx={{ height: 460, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              checkboxSelection
              disableRowSelectionOnClick
              components={{ Toolbar: GridToolbar }}
              rowSelectionModel={selectedIds}
              selectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
              onSelectionModelChange={(ids) => setSelectedIds(ids)}
            />
          </Box>
        </SectionCard>
      </Stack>
    </MenuPageShell>
  );
}

export function SendWhatsappPage() {
  const colid = getColid();
  const [configs, setConfigs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [configid, setConfigid] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filters, setFilters] = useState([{ field: "role", values: [] }]);
  const [options, setOptions] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [templateCode, setTemplateCode] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [headerType, setHeaderType] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [values, setValues] = useState([{ id: "1", variable: "1", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const selectedConfig = useMemo(() => configs.find((item) => item._id === configid) || null, [configs, configid]);
  const selectedRows = useMemo(() => users.filter((row) => selectedIds.includes(row._id)), [users, selectedIds]);

  const payloadPreview = useMemo(() => ({
    businessCode,
    templateCode,
    mobileNumbers: `${selectedRows.length} selected users`,
    header: headerType && headerValue ? { type: headerType, value: headerValue } : undefined,
    values: values.map(({ variable, value }) => ({ variable, value })).filter((row) => row.variable && row.value !== "")
  }), [businessCode, templateCode, selectedRows.length, headerType, headerValue, values]);

  const loadConfigs = async () => {
    const res = await ep1.get("/api/v2/bhash-whatsapp/config", { params: { colid, active: true } });
    const rows = extractData(res);
    setConfigs(rows);
    if (!configid && rows[0]?._id) {
      setConfigid(rows[0]._id);
      setBusinessCode(rows[0].businessCode || "");
      setTemplateCode(rows[0].templateName || rows[0].templateCode || "");
    }
  };
  const loadTemplates = async () => {
    const res = await ep1.get("/api/v2/bhash-whatsapp/local-templates", { params: { colid, active: "Yes" } });
    setTemplates(extractData(res));
  };

  useEffect(() => {
    if (colid) {
      loadConfigs().catch(() => {});
      loadTemplates().catch(() => {});
    }
  }, [colid]);

  useEffect(() => {
    if (selectedConfig) {
      setBusinessCode(selectedConfig.businessCode || "");
      if (!templateCode) setTemplateCode(selectedConfig.templateName || selectedConfig.templateCode || "");
    }
  }, [selectedConfig]);

  const loadOptions = async (field) => {
    if (!field || options[field]) return;
    try {
      const res = await ep1.get("/api/v2/bhash-whatsapp/filter-options", { params: { colid, field } });
      setOptions((prev) => ({ ...prev, [field]: extractData(res) }));
    } catch (error) {
      setOptions((prev) => ({ ...prev, [field]: [] }));
    }
  };

  const changeFilter = (index, patch) => {
    setFilters((prev) => prev.map((item, pos) => (pos === index ? { ...item, ...patch } : item)));
  };

  const loadUsers = async () => {
    setLoading(true);
    setMessage("");
    try {
      const dynamicFilters = filters.filter((item) => item.field && item.values?.length);
      const res = await ep1.post("/api/v2/bhash-whatsapp/users", { colid, dynamicFilters, limit: 10000 });
      setUsers(extractData(res));
      setSelectedIds([]);
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!selectedRows.length) return setMessage("Select at least one user.");
    if (!businessCode.trim()) return setMessage("Business code is required.");
    if (!templateCode.trim()) return setMessage("Template code is required.");
    setSending(true);
    setProgress(10);
    setMessage("");
    let timer;
    try {
      timer = setInterval(() => setProgress((prev) => (prev >= 92 ? prev : prev + 8)), 400);
      const res = await ep1.post("/api/v2/bhash-whatsapp/send", {
        colid,
        configid,
        user: getUser(),
        userids: selectedRows.map((row) => row._id),
        businessCode,
        templateCode,
        header: headerType && headerValue ? { type: headerType, value: headerValue } : undefined,
        values: values.map(({ variable, value }) => ({ variable, value })).filter((row) => row.variable && row.value !== "")
      });
      setProgress(100);
      setMessage(`WhatsApp send completed. Sent: ${res.data?.sent || 0}, Failed: ${res.data?.failed || 0}, Total: ${res.data?.total || 0}.`);
    } catch (error) {
      setProgress(100);
      setMessage(error?.response?.data?.error || error.message || "Unable to send WhatsApp messages");
    } finally {
      if (timer) clearInterval(timer);
      setTimeout(() => setProgress(0), 1000);
      setSending(false);
    }
  };

  const columns = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 210 },
    { field: "phone", headerName: "Phone", width: 150 },
    { field: "role", headerName: "Role", width: 130 },
    { field: "academicyear", headerName: "Academic year", width: 150 },
    { field: "program", headerName: "Program", flex: 1, minWidth: 170 },
    { field: "programcode", headerName: "Program code", width: 130 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 110 },
    { field: "department", headerName: "Department", flex: 1, minWidth: 150 }
  ];

  return (
    <MenuPageShell title="Send WhatsApp">
      <Stack spacing={2}>
        <Alert severity="info">
          Select users dynamically, choose a BhashSMS template, add optional header media and any number of template values. The backend will authenticate with the saved API key and send using the required bearer token.
        </Alert>
        {message && <Alert severity={message.includes("completed") ? "success" : "warning"}>{message}</Alert>}
        <SectionCard title="Dynamic Filters">
          <Stack spacing={1.5}>
            {filters.map((filter, index) => (
              <Paper key={`${filter.field}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={filterFields}
                      value={filter.field}
                      onChange={(event, value) => {
                        changeFilter(index, { field: value || "", values: [] });
                        if (value) loadOptions(value);
                      }}
                      renderInput={(params) => <TextField {...params} label="Filter field" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Autocomplete
                      multiple
                      options={options[filter.field] || []}
                      value={filter.values || []}
                      onOpen={() => loadOptions(filter.field)}
                      onChange={(event, value) => changeFilter(index, { values: value })}
                      renderTags={(value, getTagProps) => value.map((option, tagIndex) => <Chip label={option} {...getTagProps({ index: tagIndex })} />)}
                      renderInput={(params) => <TextField {...params} label="Values" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((item, pos) => pos !== index))}>Remove</Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "programcode", values: [] }])}>Add filter</Button>
              <Button variant="contained" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />} disabled={loading} onClick={loadUsers}>Load users</Button>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard title={`Users (${users.length})`} action={<Chip color="primary" label={`${selectedRows.length} selected`} />}>
          <Box sx={{ height: 470, width: "100%" }}>
            <DataGrid
              rows={users}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              checkboxSelection
              disableRowSelectionOnClick
              components={{ Toolbar: GridToolbar }}
              selectionModel={selectedIds}
              rowSelectionModel={selectedIds}
              onSelectionModelChange={(ids) => setSelectedIds(ids)}
              onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
              sx={{ bgcolor: "white", "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35 } }}
            />
          </Box>
        </SectionCard>

        <SectionCard title="Template Message" action={<Button variant="contained" startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} disabled={sending} onClick={send}>Send WhatsApp</Button>}>
          {progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={configs}
                value={selectedConfig}
                onChange={(event, value) => setConfigid(value?._id || "")}
                getOptionLabel={(option) => option?.name || ""}
                renderInput={(params) => <TextField {...params} label="BhashSMS configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required label="Business code" value={businessCode} onChange={(e) => setBusinessCode(e.target.value)} placeholder="BSLBXXX15" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={templates}
                value={selectedTemplate}
                onChange={(event, value) => {
                  setSelectedTemplate(value || null);
                  setTemplateCode(value?.templatecode || "");
                  if (value) setValues(buildValueRowsFromTemplate(value));
                }}
                getOptionLabel={(option) => option?.templatename ? `${option.templatename} (${option.templatecode})` : ""}
                renderInput={(params) => <TextField {...params} required label="Template" placeholder="Search WhatsApp template" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required label="templateCode" value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} placeholder="TEMPLATE001" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Template variables" value={selectedTemplate ? `${selectedTemplate.noofvariables || 0} - ${selectedTemplate.variablenames || "No variable names"}` : ""} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Header type" value={headerType} onChange={(e) => setHeaderType(e.target.value)}>
                {["", "IMAGE", "VIDEO", "DOCUMENT", "TEXT"].map((item) => <MenuItem key={item || "none"} value={item}>{item || "None"}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField fullWidth label="Header value / image link" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} placeholder="https://bhashsms.com/img/common/bhashsms-logo.webp" />
            </Grid>
            <Grid item xs={12}>
              <ValueRows rows={values} setRows={setValues} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={7} label="Payload preview" value={JSON.stringify(payloadPreview, null, 2)} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
        </SectionCard>
      </Stack>
    </MenuPageShell>
  );
}

export function SendDirectWhatsappPage() {
  const colid = getColid();
  const [configs, setConfigs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [configid, setConfigid] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateCode, setTemplateCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [headerType, setHeaderType] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [values, setValues] = useState([{ id: "1", variable: "1", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const selectedConfig = useMemo(() => configs.find((item) => item._id === configid) || null, [configs, configid]);
  const payloadPreview = useMemo(() => ({
    businessCode: selectedConfig?.businessCode || "",
    templateCode,
    mobileNumbers: phoneNumber,
    header: headerType && headerValue ? { type: headerType, value: headerValue } : undefined,
    values: values.map(({ variable, value }) => ({ variable, value })).filter((row) => row.variable && row.value !== "")
  }), [selectedConfig, templateCode, phoneNumber, headerType, headerValue, values]);

  const loadConfigs = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/bhash-whatsapp/config", { params: { colid, active: true } });
      const rows = extractData(res);
      setConfigs(rows);
      if (!configid && rows[0]?._id) {
        setConfigid(rows[0]._id);
        setTemplateCode(rows[0].templateName || rows[0].templateCode || "");
      }
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || "Unable to load BhashSMS configuration");
    } finally {
      setLoading(false);
    }
  };
  const loadTemplates = async () => ep1.get("/api/v2/bhash-whatsapp/local-templates", { params: { colid, active: "Yes" } })
    .then((res) => setTemplates(extractData(res)));

  useEffect(() => {
    if (colid) {
      loadConfigs();
      loadTemplates().catch(() => {});
    }
  }, [colid]);

  useEffect(() => {
    if (selectedConfig && !templateCode) setTemplateCode(selectedConfig.templateName || selectedConfig.templateCode || "");
  }, [selectedConfig]);

  const send = async () => {
    if (!configid) return setMessage("Select BhashSMS configuration.");
    if (!templateCode.trim()) return setMessage("Template is required.");
    if (!phoneNumber.trim()) return setMessage("Phone number is required.");
    setSending(true);
    setProgress(10);
    setMessage("");
    let timer;
    try {
      timer = setInterval(() => setProgress((prev) => (prev >= 92 ? prev : prev + 10)), 350);
      await ep1.post("/api/v2/bhash-whatsapp/send-template-payload", {
        colid,
        configid,
        user: getUser(),
        templateCode,
        mobileNumbers: phoneNumber,
        header: headerType && headerValue ? { type: headerType, value: headerValue } : undefined,
        values: values.map(({ variable, value }) => ({ variable, value })).filter((row) => row.variable && row.value !== "")
      });
      setProgress(100);
      setMessage("WhatsApp message sent.");
    } catch (error) {
      setProgress(100);
      setMessage(error?.response?.data?.error || error.message || "Unable to send WhatsApp message");
    } finally {
      if (timer) clearInterval(timer);
      setTimeout(() => setProgress(0), 1000);
      setSending(false);
    }
  };

  return (
    <MenuPageShell title="Send Direct WhatsApp">
      <Stack spacing={2}>
        <Alert severity="info">
          Select the saved BhashSMS configuration, enter the approved template and phone number. API key, business code and endpoints are taken from configuration.
        </Alert>
        {message && <Alert severity={message.includes("sent") ? "success" : "warning"}>{message}</Alert>}
        <SectionCard
          title="Direct Template Message"
          action={<Button variant="contained" startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} disabled={sending} onClick={send}>Send WhatsApp</Button>}
        >
          {progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={configs}
                value={selectedConfig}
                loading={loading}
                onChange={(event, value) => {
                  setConfigid(value?._id || "");
                  setTemplateCode(value?.templateName || value?.templateCode || "");
                }}
                getOptionLabel={(option) => option?.name || ""}
                renderInput={(params) => <TextField {...params} label="BhashSMS configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={templates}
                value={selectedTemplate}
                onChange={(event, value) => {
                  setSelectedTemplate(value || null);
                  setTemplateCode(value?.templatecode || "");
                  if (value) setValues(buildValueRowsFromTemplate(value));
                }}
                getOptionLabel={(option) => option?.templatename ? `${option.templatename} (${option.templatecode})` : ""}
                renderInput={(params) => <TextField {...params} required label="Template" placeholder="Search WhatsApp template" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="8210011001" helperText="Use comma for multiple direct numbers." />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required label="templateCode" value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} placeholder="TEMPLATE001" />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Template variables" value={selectedTemplate ? `${selectedTemplate.noofvariables || 0} - ${selectedTemplate.variablenames || "No variable names"}` : ""} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Header type" value={headerType} onChange={(e) => setHeaderType(e.target.value)}>
                {["", "IMAGE", "VIDEO", "DOCUMENT", "TEXT"].map((item) => <MenuItem key={item || "none"} value={item}>{item || "None"}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField fullWidth label="Header value / image link" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} placeholder="Optional, only if the template needs media header" />
            </Grid>
            <Grid item xs={12}>
              <ValueRows rows={values} setRows={setValues} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={7} label="Payload preview" value={JSON.stringify(payloadPreview, null, 2)} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
        </SectionCard>
      </Stack>
    </MenuPageShell>
  );
}
