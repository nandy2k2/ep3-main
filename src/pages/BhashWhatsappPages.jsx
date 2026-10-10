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
  Divider,
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

const blankConfig = {
  name: "BhashSMS WhatsApp",
  baseUrl: "https://developer.bhashsms.com",
  endpoint: "https://developer.bhashsms.com/sendMessage",
  authenticateEndpoint: "https://developer.bhashsms.com/appAuthenticate",
  refreshEndpoint: "https://developer.bhashsms.com/appRefresh",
  getTemplatesEndpoint: "https://developer.bhashsms.com/getAllTemplates",
  createTemplateEndpoint: "https://developer.bhashsms.com/createApiTemplate",
  method: "POST",
  authType: "Header",
  authHeaderName: "Authorization",
  apiKey: "",
  username: "",
  password: "",
  accessToken: "",
  refreshToken: "",
  sender: "",
  defaultCountryCode: "91",
  phoneField: "phone",
  toParam: "to",
  messageParam: "message",
  titleParam: "title",
  templateName: "",
  languageCode: "",
  headersJson: "",
  extraPayload: "",
  authenticatePayloadJson: "{\"username\":\"{{username}}\",\"password\":\"{{password}}\"}",
  refreshPayloadJson: "{\"refreshToken\":\"{{refreshToken}}\"}",
  templatePayloadJson: "{\"templateName\":\"{{templateName}}\",\"languageCode\":\"{{languageCode}}\",\"content\":\"{{content}}\"}",
  sendPayloadJson: "{\"to\":\"{{to}}\",\"message\":\"{{message}}\",\"templateName\":\"{{templateName}}\",\"languageCode\":\"{{languageCode}}\"}",
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

export function BhashWhatsappConfigurationPage() {
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState(blankConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [endpointBusy, setEndpointBusy] = useState("");
  const [endpointResult, setEndpointResult] = useState("");
  const [templateDraft, setTemplateDraft] = useState({ templateName: "", languageCode: "en", templateContent: "" });
  const colid = getColid();

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

  const runEndpointAction = async (action) => {
    setEndpointBusy(action);
    setEndpointResult("");
    try {
      const payload = { colid, configid: form._id, id: form._id, ...templateDraft };
      let res;
      if (action === "authenticate") res = await ep1.post("/api/v2/bhash-whatsapp/authenticate", payload);
      if (action === "refresh") res = await ep1.post("/api/v2/bhash-whatsapp/refresh", payload);
      if (action === "templates") res = await ep1.get("/api/v2/bhash-whatsapp/templates", { params: { colid, configid: form._id } });
      if (action === "create-template") res = await ep1.post("/api/v2/bhash-whatsapp/create-template", payload);
      setEndpointResult(JSON.stringify(res?.data?.data || res?.data || {}, null, 2));
      await loadConfigs();
    } catch (error) {
      setEndpointResult(error?.response?.data?.error || error.message || "BhashSMS endpoint call failed");
    } finally {
      setEndpointBusy("");
    }
  };

  const columns = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "endpoint", headerName: "Send endpoint", flex: 1.6, minWidth: 260 },
    { field: "method", headerName: "Method", width: 100 },
    { field: "authType", headerName: "Auth", width: 110 },
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

  return (
    <MenuPageShell title="Bhash WhatsApp Configuration">
      <Stack spacing={2}>
        <Alert severity="info">
          Enter the WhatsApp API endpoint, authentication, and payload field names supplied in your BhashSMS developer account. Approved WhatsApp templates can be supplied with the template and language fields when BhashSMS requires them.
        </Alert>
        {message && <Alert severity={message.includes("saved") || message.includes("deleted") ? "success" : "warning"}>{message}</Alert>}
        <SectionCard
          title="Configuration"
          action={(
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading || saving} onClick={loadConfigs}>Refresh</Button>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>Save</Button>
            </Stack>
          )}
        >
          {saving && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Base URL" value={form.baseUrl} onChange={(e) => update("baseUrl", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Authenticate endpoint" value={form.authenticateEndpoint} onChange={(e) => update("authenticateEndpoint", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Refresh endpoint" value={form.refreshEndpoint} onChange={(e) => update("refreshEndpoint", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Get all templates endpoint" value={form.getTemplatesEndpoint} onChange={(e) => update("getTemplatesEndpoint", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Create API template endpoint" value={form.createTemplateEndpoint} onChange={(e) => update("createTemplateEndpoint", e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth required label="Send message endpoint" value={form.endpoint} onChange={(e) => update("endpoint", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Method" value={form.method} onChange={(e) => update("method", e.target.value)}><MenuItem value="POST">POST</MenuItem><MenuItem value="GET">GET</MenuItem></TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Auth type" value={form.authType} onChange={(e) => update("authType", e.target.value)}>{["Header", "Bearer", "Basic", "Query", "None"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Auth header / query name" value={form.authHeaderName} onChange={(e) => update("authHeaderName", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth type="password" label="API key / token" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Username" value={form.username} onChange={(e) => update("username", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="password" label="Password" value={form.password} onChange={(e) => update("password", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="password" label="Access token" value={form.accessToken} onChange={(e) => update("accessToken", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="password" label="Refresh token" value={form.refreshToken} onChange={(e) => update("refreshToken", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Sender" value={form.sender} onChange={(e) => update("sender", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Default country code" value={form.defaultCountryCode} onChange={(e) => update("defaultCountryCode", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Phone field in user" value={form.phoneField} onChange={(e) => update("phoneField", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="To/mobile parameter" value={form.toParam} onChange={(e) => update("toParam", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Message parameter" value={form.messageParam} onChange={(e) => update("messageParam", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Title parameter" value={form.titleParam} onChange={(e) => update("titleParam", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Template name" value={form.templateName} onChange={(e) => update("templateName", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Language code" value={form.languageCode} onChange={(e) => update("languageCode", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><FormControlLabel control={<Checkbox checked={Boolean(form.isactive)} onChange={(e) => update("isactive", e.target.checked)} />} label="Active" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Authenticate payload JSON" value={form.authenticatePayloadJson} onChange={(e) => update("authenticatePayloadJson", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Refresh payload JSON" value={form.refreshPayloadJson} onChange={(e) => update("refreshPayloadJson", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Create template payload JSON" value={form.templatePayloadJson} onChange={(e) => update("templatePayloadJson", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Send message payload JSON" value={form.sendPayloadJson} onChange={(e) => update("sendPayloadJson", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Extra headers JSON" value={form.headersJson} onChange={(e) => update("headersJson", e.target.value)} placeholder='{"x-api-key":"..."}' /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Extra payload JSON" value={form.extraPayload} onChange={(e) => update("extraPayload", e.target.value)} placeholder='{"channel":"whatsapp"}' /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} /></Grid>
          </Grid>
        </SectionCard>
        <SectionCard title="BhashSMS Endpoint Tools">
          <Stack spacing={2}>
            <Alert severity="info">Save or select a configuration first, then use these actions to call the documented BhashSMS endpoints.</Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="Template name" value={templateDraft.templateName} onChange={(e) => setTemplateDraft((prev) => ({ ...prev, templateName: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Language" value={templateDraft.languageCode} onChange={(e) => setTemplateDraft((prev) => ({ ...prev, languageCode: e.target.value }))} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Template content" value={templateDraft.templateContent} onChange={(e) => setTemplateDraft((prev) => ({ ...prev, templateContent: e.target.value }))} /></Grid>
            </Grid>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              {[
                ["authenticate", "Authenticate"],
                ["refresh", "Refresh token"],
                ["templates", "Get all templates"],
                ["create-template", "Create API template"]
              ].map(([action, label]) => (
                <Button
                  key={action}
                  variant="outlined"
                  disabled={!form._id || Boolean(endpointBusy)}
                  onClick={() => runEndpointAction(action)}
                  startIcon={endpointBusy === action ? <CircularProgress size={16} /> : null}
                >
                  {label}
                </Button>
              ))}
            </Stack>
            {endpointResult && <TextField fullWidth multiline minRows={6} label="Endpoint response" value={endpointResult} InputProps={{ readOnly: true }} />}
          </Stack>
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

export function SendWhatsappPage() {
  const colid = getColid();
  const [configs, setConfigs] = useState([]);
  const [configid, setConfigid] = useState("");
  const [templateForm, setTemplateForm] = useState({
    businessCode: "",
    templateCode: "",
    mobileNumbers: "",
    headerType: "IMAGE",
    headerValue: "",
    values: [{ id: "1", variable: "1", value: "" }]
  });
  const [filters, setFilters] = useState([{ field: "role", values: [] }]);
  const [options, setOptions] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templateSending, setTemplateSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const [templateResult, setTemplateResult] = useState("");

  const selectedRows = useMemo(() => users.filter((row) => selectedIds.includes(row._id)), [users, selectedIds]);

  const loadConfigs = async () => {
    const res = await ep1.get("/api/v2/bhash-whatsapp/config", { params: { colid, active: true } });
    const rows = extractData(res);
    setConfigs(rows);
    if (!configid && rows[0]?._id) setConfigid(rows[0]._id);
  };

  useEffect(() => {
    if (colid) loadConfigs().catch(() => {});
  }, [colid]);

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

  const updateTemplateForm = (field, value) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTemplateValue = (id, field, value) => {
    setTemplateForm((prev) => ({
      ...prev,
      values: prev.values.map((row) => row.id === id ? { ...row, [field]: value } : row)
    }));
  };

  const addTemplateValue = () => {
    setTemplateForm((prev) => ({
      ...prev,
      values: [
        ...prev.values,
        { id: `${Date.now()}-${Math.random()}`, variable: String(prev.values.length + 1), value: "" }
      ]
    }));
  };

  const removeTemplateValue = (id) => {
    setTemplateForm((prev) => ({
      ...prev,
      values: prev.values.length > 1 ? prev.values.filter((row) => row.id !== id) : prev.values
    }));
  };

  const sendTemplatePayload = async () => {
    if (!templateForm.businessCode.trim()) return setTemplateResult("Business code is required.");
    if (!templateForm.templateCode.trim()) return setTemplateResult("Template code is required.");
    if (!templateForm.mobileNumbers.trim()) return setTemplateResult("Mobile number is required.");
    setTemplateSending(true);
    setProgress(10);
    setTemplateResult("");
    try {
      const timer = setInterval(() => setProgress((prev) => (prev >= 92 ? prev : prev + 10)), 350);
      const res = await ep1.post("/api/v2/bhash-whatsapp/send-template-payload", {
        colid,
        configid,
        user: getUser(),
        businessCode: templateForm.businessCode,
        templateCode: templateForm.templateCode,
        mobileNumbers: templateForm.mobileNumbers,
        header: {
          type: templateForm.headerType,
          value: templateForm.headerValue
        },
        values: templateForm.values.map(({ variable, value }) => ({ variable, value })).filter((row) => row.variable || row.value)
      });
      clearInterval(timer);
      setProgress(100);
      setTemplateResult(`WhatsApp template payload sent. Total: ${res.data?.log?.total || 0}.`);
    } catch (error) {
      setProgress(100);
      setTemplateResult(error?.response?.data?.error || error.message || "Unable to send WhatsApp template payload");
    } finally {
      setTimeout(() => setProgress(0), 1000);
      setTemplateSending(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setResult("");
    try {
      const dynamicFilters = filters.filter((item) => item.field && item.values?.length);
      const res = await ep1.post("/api/v2/bhash-whatsapp/users", { colid, dynamicFilters, limit: 10000 });
      setUsers(extractData(res));
      setSelectedIds([]);
    } catch (error) {
      setResult(error?.response?.data?.error || error.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!selectedRows.length) {
      setResult("Select at least one user.");
      return;
    }
    setSending(true);
    setProgress(12);
    setResult("");
    try {
      const timer = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 8));
      }, 500);
      const res = await ep1.post("/api/v2/bhash-whatsapp/send", {
        colid,
        configid,
        title,
        content,
        user: getUser(),
        userids: selectedRows.map((row) => row._id)
      });
      clearInterval(timer);
      setProgress(100);
      const data = res.data || {};
      setResult(`WhatsApp send completed. Sent: ${data.sent || 0}, Failed: ${data.failed || 0}, Total: ${data.total || 0}.`);
    } catch (error) {
      setProgress(100);
      setResult(error?.response?.data?.error || error.message || "Unable to send WhatsApp messages");
    } finally {
      setTimeout(() => setProgress(0), 1200);
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
        <SectionCard
          title="Send Bhash Template WhatsApp"
          action={<Button variant="contained" startIcon={templateSending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} disabled={templateSending} onClick={sendTemplatePayload}>Send WhatsApp</Button>}
        >
          {progress > 0 && templateSending && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}
          {templateResult && <Alert severity={templateResult.includes("sent") ? "success" : "warning"} sx={{ mb: 2 }}>{templateResult}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={configs}
                value={configs.find((item) => item._id === configid) || null}
                onChange={(event, value) => setConfigid(value?._id || "")}
                getOptionLabel={(option) => option?.name || ""}
                renderInput={(params) => <TextField {...params} label="BhashSMS configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required label="Business code" value={templateForm.businessCode} onChange={(e) => updateTemplateForm("businessCode", e.target.value)} placeholder="BSLBXXX15" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required label="Template code" value={templateForm.templateCode} onChange={(e) => updateTemplateForm("templateCode", e.target.value)} placeholder="TEMPLATE001" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth required label="Mobile numbers" value={templateForm.mobileNumbers} onChange={(e) => updateTemplateForm("mobileNumbers", e.target.value)} placeholder="8210011001,918210011002" helperText="Separate multiple numbers with comma." />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Header type" value={templateForm.headerType} onChange={(e) => updateTemplateForm("headerType", e.target.value)}>
                {["", "IMAGE", "VIDEO", "DOCUMENT", "TEXT"].map((item) => <MenuItem key={item || "none"} value={item}>{item || "None"}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField fullWidth label="Header value" value={templateForm.headerValue} onChange={(e) => updateTemplateForm("headerValue", e.target.value)} placeholder="https://bhashsms.com/img/common/bhashsms-logo.webp" />
            </Grid>
          </Grid>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Template variables</Typography>
              <Button variant="outlined" size="small" onClick={addTemplateValue}>Add variable</Button>
            </Stack>
            {templateForm.values.map((row, index) => (
              <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Variable" value={row.variable} onChange={(e) => updateTemplateValue(row.id, "variable", e.target.value)} placeholder={String(index + 1)} />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <TextField fullWidth label="Value" value={row.value} onChange={(e) => updateTemplateValue(row.id, "value", e.target.value)} placeholder="Prakash" />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth color="error" variant="outlined" onClick={() => removeTemplateValue(row.id)}>Remove</Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
          <TextField
            sx={{ mt: 2 }}
            fullWidth
            multiline
            minRows={6}
            label="Payload preview"
            value={JSON.stringify({
              businessCode: templateForm.businessCode,
              templateCode: templateForm.templateCode,
              mobileNumbers: templateForm.mobileNumbers,
              header: templateForm.headerType || templateForm.headerValue ? { type: templateForm.headerType, value: templateForm.headerValue } : undefined,
              values: templateForm.values.map(({ variable, value }) => ({ variable, value })).filter((row) => row.variable || row.value)
            }, null, 2)}
            InputProps={{ readOnly: true }}
          />
        </SectionCard>

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

        <SectionCard
          title={`Users (${users.length})`}
          action={<Chip color="primary" label={`${selectedRows.length} selected`} />}
        >
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

        <SectionCard
          title="Message"
          action={<Button variant="contained" startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} disabled={sending} onClick={send}>Send WhatsApp</Button>}
        >
          {progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}
          {result && <Alert severity={result.includes("completed") ? "success" : "warning"} sx={{ mb: 2 }}>{result}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={configs}
                value={configs.find((item) => item._id === configid) || null}
                onChange={(event, value) => setConfigid(value?._id || "")}
                getOptionLabel={(option) => option?.name || ""}
                renderInput={(params) => <TextField {...params} label="BhashSMS configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={5} label="WhatsApp content" value={content} onChange={(e) => setContent(e.target.value)} /></Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Messages are sent only to the selected rows. Each recipient response is saved in the WhatsApp send log for troubleshooting.
          </Typography>
        </SectionCard>
      </Stack>
    </MenuPageShell>
  );
}
