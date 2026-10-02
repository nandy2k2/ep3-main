import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const base = "/api/v2/meeting-management";
const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name });
const dateOnly = (value) => value ? String(value).slice(0, 10) : "";
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const selectionIds = (model) => Array.isArray(model) ? model : Array.from(model?.ids || model || []);
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, alignItems: "flex-start", py: 1 },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

const meetingBlank = {
  title: "",
  agenda: "",
  discussion: "",
  meetingdate: "",
  userspresent: [],
  userspresentemail: [],
  domain: "",
  keywords: "",
  meetinglink: "",
  externalmembers: "",
  issues: "",
  documentlink: "",
  mode: "online"
};

const taskBlank = {
  meetingid: "",
  meeting: "",
  domain: "",
  meetingdate: "",
  task: "",
  description: "",
  duedate: "",
  status: "Open",
  assignedto: [],
  assignedtoemail: []
};

const meetingFields = ["title", "agenda", "discussion", "domain", "keywords", "meetinglink", "externalmembers", "issues", "documentlink", "mode"];
const taskFields = ["meeting", "domain", "task", "description", "status", "assignedto", "assignedtoemail"];
const taskTabStatuses = ["Open", "Pending", "Closed"];

function parseCsv(value) {
  const lines = String(value || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function downloadCsv(filename, headers, sample) {
  const blob = new Blob([`${headers.join(",")}\n${sample.join(",")}`], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function Message({ message, error, setMessage, setError }) {
  return (
    <>
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
    </>
  );
}

function DynamicFilters({ fields, filters, setFilters, optionsMap, onLoad, extra }) {
  const add = () => setFilters((prev) => [...prev, { field: "", value: "" }]);
  const update = (index, patch) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  const remove = (index) => setFilters((prev) => prev.filter((_, i) => i !== index));
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Typography fontWeight={900}>Dynamic filters</Typography>
        <Button size="small" variant="outlined" onClick={add}>Add filter</Button>
        <Button size="small" variant="contained" onClick={onLoad}>Load</Button>
      </Stack>
      <Grid container spacing={1}>
        {filters.map((filter, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => update(index, { field: e.target.value, value: "" })}>
                {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={7}>
              <Autocomplete
                freeSolo
                options={optionsMap?.[filter.field] || []}
                value={filter.value || ""}
                onInputChange={(_, value) => update(index, { value })}
                renderInput={(params) => <TextField {...params} size="small" label="Value" />}
              />
            </Grid>
            <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => remove(index)}>Remove</Button></Grid>
          </React.Fragment>
        ))}
        {extra}
      </Grid>
    </Paper>
  );
}

function AwsUploader({ value, onChange, disabled }) {
  const [configs, setConfigs] = useState([]);
  const [awsconfigid, setAwsconfigid] = useState("");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    ep1.get("/api/v2/aws-file-library/configs", { params: withScope() }).then((res) => {
      setConfigs(res.data || []);
      if (res.data?.[0]?._id) setAwsconfigid(res.data[0]._id);
    }).catch(() => {});
  }, []);
  const upload = async (file) => {
    if (!file) return;
    if (!awsconfigid) return alert("Select AWS configuration");
    const data = new FormData();
    data.append("file", file);
    data.append("colid", global1.colid);
    data.append("user", global1.user);
    data.append("awsconfigid", awsconfigid);
    data.append("folder", "meeting-management");
    setProgress(5);
    const res = await ep1.post("/api/v2/aws-file-library/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => setProgress(Math.round((event.loaded * 100) / (event.total || event.loaded || 1)))
    });
    onChange(res.data?.url || "");
    setProgress(100);
    setTimeout(() => setProgress(0), 900);
  };
  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <Autocomplete
          sx={{ minWidth: 220 }}
          options={configs}
          value={configs.find((item) => item._id === awsconfigid) || null}
          getOptionLabel={(item) => item.name || item.bucket || ""}
          onChange={(_, item) => setAwsconfigid(item?._id || "")}
          renderInput={(params) => <TextField {...params} size="small" label="AWS config" />}
        />
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled}>Upload document<input hidden type="file" onChange={(e) => upload(e.target.files?.[0])} /></Button>
        {value && <Button href={value} target="_blank" rel="noreferrer">Open document</Button>}
      </Stack>
      {progress > 0 && <LinearProgress variant="determinate" value={progress} />}
    </Stack>
  );
}

function useMeetingOptions() {
  const [options, setOptions] = useState({ users: [], domains: [], modes: [], statuses: [], meetings: [] });
  const loadOptions = useCallback(async () => {
    const res = await ep1.get(`${base}/options`, { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);
  return [options, loadOptions];
}

const userLabel = (item) => typeof item === "string" ? item : `${item.name || ""}${item.email ? ` (${item.email})` : ""}`.trim();

export function MeetingManagementMeetingsPage() {
  const [options, loadOptions] = useMeetingOptions();
  const [form, setForm] = useState(meetingBlank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [filters, setFilters] = useState([{ field: "title", value: "" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const optionMap = useMemo(() => ({
    domain: options.domains || [],
    mode: options.modes || [],
    title: rows.map((row) => row.title).filter(Boolean)
  }), [options, rows]);

  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get(`${base}/meetings`, { params: paramsFromFilters() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load meetings");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const save = async () => {
    setLoading(true);
    setError("");
    try {
      await ep1.post(`${base}/meetings`, withScope({ ...form, id: editId }));
      setMessage(editId ? "Meeting updated" : "Meeting saved");
      setEditId("");
      setForm(meetingBlank);
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save meeting");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditId(row._id);
    setForm({ ...meetingBlank, ...row, meetingdate: dateOnly(row.meetingdate), userspresent: row.userspresent || [], userspresentemail: row.userspresentemail || [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async () => {
    if (!selection.length) return setError("Select meetings to delete");
    if (!window.confirm("Delete selected meetings and their tasks?")) return;
    await ep1.post(`${base}/meetings-delete`, withScope({ ids: selection }));
    setSelection([]);
    setMessage("Selected meetings deleted");
    await loadRows();
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rowsToUpload = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      await ep1.post(`${base}/meetings-bulk`, withScope({ rows: Array.isArray(rowsToUpload) ? rowsToUpload : [rowsToUpload] }));
      setMessage("Bulk upload completed");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload meetings");
    } finally {
      event.target.value = "";
    }
  };

  const columns = [
    { field: "title", headerName: "Title", minWidth: 220, flex: 1 },
    { field: "meetingdate", headerName: "Meeting Date", minWidth: 125, valueGetter: (params) => dateOnly(params.row.meetingdate) },
    { field: "domain", headerName: "Domain", minWidth: 170 },
    { field: "mode", headerName: "Mode", minWidth: 100 },
    { field: "agenda", headerName: "Agenda", minWidth: 260, flex: 1 },
    { field: "discussion", headerName: "Discussion", minWidth: 260, flex: 1 },
    { field: "userspresent", headerName: "Users Present", minWidth: 240, valueGetter: (params) => (params.row.userspresent || []).join(", ") },
    { field: "issues", headerName: "Issues", minWidth: 220 },
    { field: "documentlink", headerName: "Document", minWidth: 120, renderCell: (params) => params.value ? <Button size="small" href={params.value} target="_blank" rel="noreferrer">Open</Button> : "" },
    {
      field: "tasks",
      headerName: "Tasks",
      minWidth: 120,
      renderCell: (params) => <Button size="small" startIcon={<AssignmentIcon />} component={RouterLink} to={`/meeting-management-tasks?meetingid=${params.row._id}`}>Tasks</Button>
    },
    {
      field: "actions",
      type: "actions",
      width: 70,
      getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />]
    }
  ];

  return (
    <MenuPageShell title="Meeting Management">
      <Stack spacing={2}>
        <Message message={message} error={error} setMessage={setMessage} setError={setError} />
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit Meeting" : "Create Meeting"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Meeting Date" InputLabelProps={{ shrink: true }} value={form.meetingdate} onChange={(e) => setField("meetingdate", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.domains || []} value={form.domain} onInputChange={(_, value) => setField("domain", value)} renderInput={(params) => <TextField {...params} label="Domain" />} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Mode" value={form.mode} onChange={(e) => setField("mode", e.target.value)}>{(options.modes || ["online", "offline"]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Agenda" value={form.agenda} onChange={(e) => setField("agenda", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Discussion" value={form.discussion} onChange={(e) => setField("discussion", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete multiple options={options.users || []} value={(options.users || []).filter((u) => (form.userspresentemail || []).includes(u.email))} getOptionLabel={userLabel} onChange={(_, value) => setForm((prev) => ({ ...prev, userspresent: value.map((u) => u.name || u.email), userspresentemail: value.map((u) => u.email).filter(Boolean) }))} renderInput={(params) => <TextField {...params} label="Users present" />} />
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="External Members" value={form.externalmembers} onChange={(e) => setField("externalmembers", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Keywords" value={form.keywords} onChange={(e) => setField("keywords", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Meeting Link" value={form.meetinglink} onChange={(e) => setField("meetinglink", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Issues" value={form.issues} onChange={(e) => setField("issues", e.target.value)} /></Grid>
            <Grid item xs={12}><AwsUploader value={form.documentlink} onChange={(value) => setField("documentlink", value)} disabled={loading} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            <Button variant="contained" onClick={save} disabled={loading}>{editId ? "Update" : "Save"}</Button>
            <Button variant="outlined" onClick={() => { setEditId(""); setForm(meetingBlank); }}>Clear</Button>
            {editId && <Button component={RouterLink} to={`/meeting-management-tasks?meetingid=${editId}`} startIcon={<AssignmentIcon />}>Task list</Button>}
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => downloadCsv("meeting_management_template.csv", ["title", "agenda", "discussion", "meetingdate", "domain", "keywords", "meetinglink", "externalmembers", "issues", "documentlink", "mode"], ["Academic council meeting", "Agenda text", "Discussion text", "2026-10-01", "Academic Configuration", "academic;meeting", "https://example.com", "External member", "Open issues", "", "online"])}>Template</Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>Bulk Upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={remove}>Bulk Delete</Button>
          </Stack>
        </Paper>
        <DynamicFilters fields={meetingFields} filters={filters} setFilters={setFilters} optionsMap={optionMap} onLoad={loadRows} />
        <Paper sx={{ p: 1 }}>
          <Box sx={{ height: 620 }}>
            <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} checkboxSelection onRowSelectionModelChange={(model) => setSelection(selectionIds(model))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "meeting_management" } } }} disableRowSelectionOnClick sx={gridSx} />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

function TaskForm({ form, setForm, options, loading, onSave, onClear, editId }) {
  const selectedMeeting = (options.meetings || []).find((item) => item._id === form.meetingid) || null;
  const selectedUsers = (options.users || []).filter((u) => (form.assignedtoemail || []).includes(u.email));
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit Task" : "Create Task"}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}><Autocomplete options={options.meetings || []} value={selectedMeeting} getOptionLabel={(item) => item.title || ""} onChange={(_, item) => setForm((prev) => ({ ...prev, meetingid: item?._id || "", meeting: item?.title || "", domain: item?.domain || prev.domain }))} renderInput={(params) => <TextField {...params} label="Meeting" />} /></Grid>
        <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.domains || []} value={form.domain} onInputChange={(_, value) => setField("domain", value)} renderInput={(params) => <TextField {...params} label="Domain" />} /></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth type="date" label="Meeting Date" InputLabelProps={{ shrink: true }} value={form.meetingdate} onChange={(e) => setField("meetingdate", e.target.value)} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={form.duedate} onChange={(e) => setField("duedate", e.target.value)} /></Grid>
        <Grid item xs={12} md={5}><TextField fullWidth label="Task" value={form.task} onChange={(e) => setField("task", e.target.value)} /></Grid>
        <Grid item xs={12} md={5}><Autocomplete multiple options={options.users || []} value={selectedUsers} getOptionLabel={userLabel} onChange={(_, value) => setForm((prev) => ({ ...prev, assignedto: value.map((u) => u.name || u.email), assignedtoemail: value.map((u) => u.email).filter(Boolean) }))} renderInput={(params) => <TextField {...params} label="Assigned To" />} /></Grid>
        <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setField("status", e.target.value)}>{(options.statuses || ["Open", "Pending", "Closed"]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} /></Grid>
      </Grid>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        <Button variant="contained" onClick={onSave} disabled={loading}>{editId ? "Update" : "Save"}</Button>
        <Button variant="outlined" onClick={onClear}>Clear</Button>
      </Stack>
    </Paper>
  );
}

function useTaskColumns(onEdit) {
  return [
    { field: "colid", headerName: "Colid", minWidth: 95 },
    { field: "meeting", headerName: "Meeting", minWidth: 220, flex: 1 },
    { field: "domain", headerName: "Domain", minWidth: 160 },
    { field: "meetingdate", headerName: "Meeting Date", minWidth: 125, valueGetter: (params) => dateOnly(params.row.meetingdate) },
    { field: "task", headerName: "Task", minWidth: 240, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 260, flex: 1 },
    { field: "duedate", headerName: "Due Date", minWidth: 120, valueGetter: (params) => dateOnly(params.row.duedate) },
    { field: "status", headerName: "Status", minWidth: 110 },
    { field: "assignedto", headerName: "Assigned To", minWidth: 220, valueGetter: (params) => (params.row.assignedto || []).join(", ") },
    { field: "assignedtoemail", headerName: "Assigned Email", minWidth: 260, valueGetter: (params) => (params.row.assignedtoemail || []).join(", ") },
    ...(onEdit ? [{ field: "actions", type: "actions", width: 70, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => onEdit(params.row)} />] }] : [])
  ];
}

function statusRows(rows, status) {
  return (rows || []).filter((row) => String(row.status || "Open").toLowerCase() === String(status).toLowerCase());
}

function TaskStatusTabs({ tab, setTab, rows }) {
  return (
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1 }}>
      {taskTabStatuses.map((status) => (
        <Tab key={status} label={`${status} (${statusRows(rows, status).length})`} />
      ))}
    </Tabs>
  );
}

export function MeetingManagementTasksPage() {
  const [searchParams] = useSearchParams();
  const [options, loadOptions] = useMeetingOptions();
  const [form, setForm] = useState({ ...taskBlank, meetingid: searchParams.get("meetingid") || "" });
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [filters, setFilters] = useState([{ field: "meetingid", value: searchParams.get("meetingid") || "" }]);
  const [fromdate, setFromdate] = useState("");
  const [todate, setTodate] = useState("");
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const meetingid = searchParams.get("meetingid") || "";
    if (!meetingid) return;
    const meeting = (options.meetings || []).find((item) => item._id === meetingid);
    setForm((prev) => ({ ...prev, meetingid, meeting: meeting?.title || prev.meeting, domain: meeting?.domain || prev.domain }));
  }, [searchParams, options.meetings]);

  const optionMap = useMemo(() => ({
    meeting: (options.meetings || []).map((item) => item.title),
    meetingid: (options.meetings || []).map((item) => item._id),
    domain: options.domains || [],
    status: options.statuses || []
  }), [options]);

  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope({ fromdate, todate, status, datefield: "duedate" }));

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get(`${base}/tasks`, { params: paramsFromFilters() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filters, fromdate, todate, status]);

  useEffect(() => { if (searchParams.get("meetingid")) loadRows(); }, []);

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      await ep1.post(`${base}/tasks`, withScope({ ...form, id: editId }));
      setMessage(editId ? "Task updated" : "Task saved");
      setEditId("");
      setForm({ ...taskBlank, meetingid: searchParams.get("meetingid") || "" });
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save task");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditId(row._id);
    setForm({ ...taskBlank, ...row, meetingdate: dateOnly(row.meetingdate), duedate: dateOnly(row.duedate), assignedto: row.assignedto || [], assignedtoemail: row.assignedtoemail || [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async () => {
    if (!selection.length) return setError("Select tasks to delete");
    if (!window.confirm("Delete selected tasks?")) return;
    await ep1.post(`${base}/tasks-delete`, withScope({ ids: selection }));
    setSelection([]);
    setMessage("Selected tasks deleted");
    await loadRows();
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rowsToUpload = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      await ep1.post(`${base}/tasks-bulk`, withScope({ rows: Array.isArray(rowsToUpload) ? rowsToUpload : [rowsToUpload] }));
      setMessage("Bulk upload completed");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload tasks");
    } finally {
      event.target.value = "";
    }
  };
  const columns = useTaskColumns(edit).filter((column) => column.field !== "colid");
  const visibleRows = statusRows(rows, taskTabStatuses[tab]);

  return (
    <MenuPageShell title="Meeting Tasks">
      <Stack spacing={2}>
        <Message message={message} error={error} setMessage={setMessage} setError={setError} />
        <TaskForm form={form} setForm={setForm} options={options} loading={loading} editId={editId} onSave={save} onClear={() => { setEditId(""); setForm({ ...taskBlank, meetingid: searchParams.get("meetingid") || "" }); }} />
        <DynamicFilters
          fields={["meetingid", ...taskFields]}
          filters={filters}
          setFilters={setFilters}
          optionsMap={optionMap}
          onLoad={loadRows}
          extra={<>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Due From" InputLabelProps={{ shrink: true }} value={fromdate} onChange={(e) => setFromdate(e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Due To" InputLabelProps={{ shrink: true }} value={todate} onChange={(e) => setTodate(e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><Autocomplete freeSolo options={options.statuses || []} value={status} onInputChange={(_, value) => setStatus(value)} renderInput={(params) => <TextField {...params} size="small" label="Status" />} /></Grid>
          </>}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => downloadCsv("meeting_tasks_template.csv", ["meeting", "domain", "meetingdate", "task", "description", "duedate", "status", "assignedto", "assignedtoemail"], ["Academic council meeting", "Academic Configuration", "2026-10-01", "Prepare minutes", "Task description", "2026-10-05", "Open", "Faculty Name", "faculty@example.com"])}>Template</Button>
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>Bulk Upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={remove}>Bulk Delete</Button>
        </Stack>
        <Paper sx={{ p: 1 }}>
          <TaskStatusTabs tab={tab} setTab={(value) => { setTab(value); setSelection([]); }} rows={rows} />
          <Box sx={{ height: 640 }}>
            <DataGrid rows={visibleRows} columns={columns} getRowId={(row) => row._id} loading={loading} checkboxSelection onRowSelectionModelChange={(model) => setSelection(selectionIds(model))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `meeting_tasks_${taskTabStatuses[tab].toLowerCase()}` } } }} disableRowSelectionOnClick sx={gridSx} />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function MeetingManagementAdminTasksPage() {
  const [options] = useMeetingOptions();
  const [form, setForm] = useState(taskBlank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState([{ field: "domain", value: "" }]);
  const [fromdate, setFromdate] = useState("");
  const [todate, setTodate] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, { fromdate, todate, datefield: "duedate", password });

  const loadRows = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get(`${base}/admin-open-tasks`, { params: paramsFromFilters() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load admin tasks");
    } finally {
      setLoading(false);
    }
  }, [filters, fromdate, todate, password, unlocked]);

  const unlock = async () => {
    if (password !== "kumropatash") {
      setError("Invalid password");
      return;
    }
    setUnlocked(true);
    setError("");
    setMessage("Page unlocked. Add filters and click Load.");
  };

  const save = async () => {
    if (!unlocked) return setError("Unlock the page first.");
    setLoading(true);
    setError("");
    try {
      await ep1.post(`${base}/admin-open-tasks`, { ...form, id: editId, password, user: global1.user, namecreated: global1.name });
      setMessage("Admin task updated");
      setEditId("");
      setForm(taskBlank);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update task");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditId(row._id);
    setForm({ ...taskBlank, ...row, meetingdate: dateOnly(row.meetingdate), duedate: dateOnly(row.duedate), assignedto: row.assignedto || [], assignedtoemail: row.assignedtoemail || [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const columns = useTaskColumns(edit);
  const visibleRows = statusRows(rows, taskTabStatuses[tab]);

  return (
    <MenuPageShell title="All Client Open Meeting Tasks">
      <Stack spacing={2}>
        <Message message={message} error={error} setMessage={setMessage} setError={setError} />
        {!unlocked ? (
          <Paper sx={{ p: 2, maxWidth: 520 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Protected page</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Enter password to view all-client open meeting tasks.</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField fullWidth type="password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && unlock()} />
              <Button variant="contained" onClick={unlock}>Unlock</Button>
            </Stack>
          </Paper>
        ) : null}
        {unlocked && (
          <>
        {editId && <TaskForm form={form} setForm={setForm} options={options} loading={loading} editId={editId} onSave={save} onClear={() => { setEditId(""); setForm(taskBlank); }} />}
        <Alert severity="info">This admin page intentionally shows open meeting tasks across all clients.</Alert>
        <DynamicFilters
          fields={["colid", ...taskFields]}
          filters={filters}
          setFilters={setFilters}
          optionsMap={{ domain: options.domains || [], status: options.statuses || [] }}
          onLoad={loadRows}
          extra={<>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Due From" InputLabelProps={{ shrink: true }} value={fromdate} onChange={(e) => setFromdate(e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Due To" InputLabelProps={{ shrink: true }} value={todate} onChange={(e) => setTodate(e.target.value)} /></Grid>
          </>}
        />
        <Paper sx={{ p: 1 }}>
          <TaskStatusTabs tab={tab} setTab={setTab} rows={rows} />
          <Box sx={{ height: 680 }}>
            <DataGrid rows={visibleRows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `all_client_meeting_tasks_${taskTabStatuses[tab].toLowerCase()}` } } }} disableRowSelectionOnClick sx={gridSx} />
          </Box>
        </Paper>
          </>
        )}
      </Stack>
    </MenuPageShell>
  );
}
