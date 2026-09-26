import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Delete, NotificationsActive, Save, Send } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const selectedIds = (model) => {
  if (Array.isArray(model)) return model;
  if (model?.ids instanceof Set) return [...model.ids];
  return [];
};

const apiBase = () => {
  try {
    return ep1.defaults.baseURL || window.location.origin;
  } catch {
    return "";
  }
};

function NotificationUserPage({ type = "student", mode = "settings" }) {
  const isStudent = type === "student";
  const isSettings = mode === "settings";
  const title = isSettings
    ? isStudent ? "Notification settings students" : "User notification settings"
    : isStudent ? "Send student notification" : "Send user notification";
  const [fields, setFields] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: isStudent ? "academicyear" : "role", operator: "equals", value: "" }]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [settings, setSettings] = useState({ expopushtoken: "", notification: "Yes" });
  const [messageForm, setMessageForm] = useState({ title: "", message: "", data: "{}", ttl: "" });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
  }, [type]);

  const loadOptions = async () => {
    try {
      setError("");
      const res = await ep1.get("/api/v2/notifications/options", { params: { colid: global1.colid, type } });
      setFields(res.data?.fields || []);
      setOptions(res.data?.options || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load filter options.");
    }
  };

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch, ...(patch.field ? { value: "" } : {}) } : item)));
    setRows([]);
    setSelected([]);
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const activeFilters = filters.filter((filter) => filter.field && (filter.operator === "empty" || filter.operator === "notempty" || filter.value));
      const res = await ep1.post("/api/v2/notifications/users/search", { colid: global1.colid, type, filters: activeFilters });
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setSelected([]);
      setMessage(`Loaded ${res.data?.count || 0} row(s).`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!selected.length) return setError("Select at least one row.");
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/notifications/users/settings", {
        colid: global1.colid,
        type,
        ids: selected,
        expopushtoken: settings.expopushtoken,
        notification: settings.notification
      });
      setMessage(`Updated ${res.data?.updated || 0} user(s).`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update notification settings.");
    } finally {
      setProcessing(false);
    }
  };

  const sendNotification = async () => {
    if (!selected.length) return setError("Select at least one recipient.");
    let parsedData = {};
    try {
      parsedData = messageForm.data ? JSON.parse(messageForm.data) : {};
    } catch {
      return setError("Data must be valid JSON.");
    }
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/notifications/users/send", {
        colid: global1.colid,
        type,
        ids: selected,
        title: messageForm.title,
        message: messageForm.message,
        data: parsedData,
        ttl: messageForm.ttl
      });
      setMessage(`Sent ${res.data?.sent || 0}; skipped ${res.data?.skipped || 0}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send push notification.");
    } finally {
      setProcessing(false);
    }
  };

  const columns = useMemo(() => {
    const base = [
      { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
      { field: "email", headerName: "Email", minWidth: 220, flex: 1 },
      { field: "role", headerName: "Role", width: 120 },
      { field: "notification", headerName: "Notification", width: 130 },
      { field: "expopushtoken", headerName: "Expo Push Token", minWidth: 260, flex: 1 }
    ];
    return isStudent
      ? [
          { field: "academicyear", headerName: "Academic Year", width: 130 },
          { field: "program", headerName: "Program", minWidth: 170, flex: 1 },
          { field: "programcode", headerName: "Program Code", width: 130 },
          { field: "semester", headerName: "Semester", width: 100 },
          { field: "section", headerName: "Section", width: 100 },
          { field: "regno", headerName: "Reg No", width: 140 },
          ...base
        ]
      : [
          ...base,
          { field: "department", headerName: "Department", minWidth: 160 },
          { field: "designation", headerName: "Designation", minWidth: 160 },
          { field: "institution", headerName: "Institution", minWidth: 180 }
        ];
  }, [isStudent]);

  const apiSnippet = `POST ${apiBase()}/api/v2/mobile/notifications/update-by-email
Content-Type: application/json

{
  "email": "user@example.com",
  "expopushtoken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "notification": "Yes"
}`;

  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>{title}</Typography>
              <Typography color="text.secondary">Add filters, load users, select rows and {isSettings ? "update notification settings." : "send Expo push messages."}</Typography>
            </Box>
            <Chip color="primary" icon={<NotificationsActive />} label={isStudent ? "Students" : "Non student users"} />
          </Stack>
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            <Typography fontWeight={900}>Dynamic filters</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setFilters((prev) => [...prev, { field: fields[0]?.field || "name", operator: "equals", value: "" }])}>Add filter</Button>
          </Stack>
          <Grid container spacing={2}>
            {filters.map((filter, index) => (
              <React.Fragment key={index}>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Field" value={filter.field} onChange={(e) => updateFilter(index, { field: e.target.value })}>
                    {fields.map((item) => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField select fullWidth label="Operator" value={filter.operator} onChange={(e) => updateFilter(index, { operator: e.target.value })}>
                    <MenuItem value="equals">Equals</MenuItem>
                    <MenuItem value="contains">Contains</MenuItem>
                    <MenuItem value="notempty">Not empty</MenuItem>
                    <MenuItem value="empty">Empty</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={options?.[filter.field]?.values || []}
                    value={filter.value || ""}
                    onChange={(_, value) => updateFilter(index, { value: value || "" })}
                    onInputChange={(_, value) => updateFilter(index, { value: value || "" })}
                    disabled={filter.operator === "empty" || filter.operator === "notempty"}
                    renderInput={(params) => <TextField {...params} label="Value" />}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton color="error" disabled={filters.length === 1} onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}><Delete /></IconButton>
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              <Button variant="contained" onClick={loadRows} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>Load</Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          {isSettings ? (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Expo Push Token" value={settings.expopushtoken} onChange={(e) => setSettings((prev) => ({ ...prev, expopushtoken: e.target.value }))} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Notification" value={settings.notification} onChange={(e) => setSettings((prev) => ({ ...prev, notification: e.target.value }))}>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button fullWidth variant="contained" startIcon={processing ? <CircularProgress size={16} /> : <Save />} disabled={processing} onClick={saveSettings}>Update selected</Button>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="Title" value={messageForm.title} onChange={(e) => setMessageForm((prev) => ({ ...prev, title: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="TTL seconds" value={messageForm.ttl} onChange={(e) => setMessageForm((prev) => ({ ...prev, ttl: e.target.value }))} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Data JSON" value={messageForm.data} onChange={(e) => setMessageForm((prev) => ({ ...prev, data: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Message" value={messageForm.message} onChange={(e) => setMessageForm((prev) => ({ ...prev, message: e.target.value }))} /></Grid>
              <Grid item xs={12}><Button variant="contained" startIcon={processing ? <CircularProgress size={16} /> : <Send />} disabled={processing} onClick={sendNotification}>Send selected</Button></Grid>
            </Grid>
          )}
        </Paper>

        <Paper elevation={0} sx={{ height: 560, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row._id}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(model) => setSelected(selectedIds(model))}
            rowSelectionModel={selected}
            slots={{ toolbar: GridToolbar }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            sx={{ border: 0 }}
          />
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Typography fontWeight={900}>Mobile app API</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>The mobile app can update token and notification preference without authentication by email.</Typography>
          <Box component="pre" sx={{ m: 0, p: 2, bgcolor: "#0f172a", color: "#e5e7eb", borderRadius: 1, overflow: "auto", fontSize: 13 }}>{apiSnippet}</Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export const StudentNotificationSettingsPage = () => <NotificationUserPage type="student" mode="settings" />;
export const UserNotificationSettingsPage = () => <NotificationUserPage type="user" mode="settings" />;
export const StudentPushNotificationPage = () => <NotificationUserPage type="student" mode="send" />;
export const UserPushNotificationPage = () => <NotificationUserPage type="user" mode="send" />;
