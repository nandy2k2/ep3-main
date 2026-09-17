import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name, role: global1.role });
const gridSx = { "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" } };
const makeFilter = (field = "academicyear") => ({ id: `${Date.now()}-${Math.random()}`, field, value: "" });
const norm = (value) => String(value || "").trim().toLowerCase();
const unique = (rows, field) => [...new Set(rows.map((row) => String(row[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const COLORS = ["#2563eb", "#0f766e", "#f97316", "#7c3aed", "#be123c", "#0891b2"];
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function parseCsv(value) {
  const lines = String(value || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(",")[index] || ""])));
}
function template(filename, fields) {
  const csv = [fields.map(csvEscape).join(","), fields.map(() => "").join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
function DynamicFilters({ fields, rows, filters, setFilters, options = {} }) {
  const update = (id, key, value) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  const valuesFor = (field) => options[field] || unique(rows, field);
  return <Stack spacing={1}>{filters.map((filter) => <Stack key={filter.id} direction={{ xs: "column", md: "row" }} spacing={1}><Autocomplete sx={{ minWidth: 220 }} size="small" options={fields} value={filter.field} onChange={(_, value) => update(filter.id, "field", value || fields[0])} renderInput={(params) => <TextField {...params} label="Field" />} /><Autocomplete sx={{ minWidth: 260 }} size="small" freeSolo options={valuesFor(filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(filter.id, "value", value)} onChange={(_, value) => update(filter.id, "value", value || "")} renderInput={(params) => <TextField {...params} label="Value" />} /><Button color="error" onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter(fields[0])] : prev.filter((item) => item.id !== filter.id))}>Remove</Button></Stack>)}<Box><Button onClick={() => setFilters((prev) => [...prev, makeFilter(fields[0])])}>Add filter</Button></Box></Stack>;
}
function Message({ message, error, setMessage, setError }) {
  return <>{message && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMessage("")}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>{error}</Alert>}</>;
}
function printReport(title, institution, body) {
  const name = institution?.institutionname || institution?.insname || global1.insname || "Institution";
  const address = institution?.address || global1.address || "";
  const logo = institution?.logolink || institution?.logo || global1.logo || "";
  const win = window.open("", "_blank", "width=980,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;color:#000;margin:0}.tools{padding:10px;border-bottom:1px solid #ddd}.page{padding:14mm}.head{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:14px}.logo{height:58px}h1{font-size:20px;margin:4px 0}h2{font-size:16px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #000;padding:6px;font-size:12px;text-align:left;vertical-align:top}.card{border:1px solid #111;padding:10px;margin:10px 0;break-inside:avoid}@media print{.tools{display:none}@page{size:A4 portrait;margin:10mm}.page{padding:0}tr{break-inside:avoid}}</style></head><body><div class="tools"><button onclick="print()">Print</button><button onclick="close()">Close</button></div><div class="page"><div class="head">${logo ? `<img class="logo" src="${logo}"/>` : ""}<h1>${name}</h1><div>${address}</div><h2>${title}</h2></div>${body}</div></body></html>`);
  win.document.close();
}
async function uploadBlob(content, filename, setProgress) {
  const file = new File([content], filename, { type: "text/html" });
  const data = new FormData();
  data.append("file", file);
  data.append("colid", global1.colid);
  data.append("user", global1.user || "");
  data.append("folder", "extracurricular/reports");
  const res = await ep1.post("/api/v2/aws-file-library/upload", data, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress: (event) => event.total && setProgress?.(Math.round((event.loaded * 100) / event.total)) });
  return res.data?.url || "";
}

const activityFields = ["activity", "type", "description", "status"];
export function ExtracurricularActivityPage() {
  const blank = { activity: "", type: "", description: "", status: "Active" };
  const [form, setForm] = useState(blank);
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = useCallback(async () => { const res = await ep1.get("/api/v2/extracurricular/options", { params: withScope() }); setOptions(res.data || {}); }, []);
  const load = async () => { const res = await ep1.get("/api/v2/extracurricular/activities", { params: withScope() }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, [loadOptions]);
  const save = async () => { try { await ep1.post("/api/v2/extracurricular/activities", withScope({ ...form, id: editId })); setForm(blank); setEditId(""); setMessage("Activity saved"); load(); loadOptions(); } catch (e) { setError(e.response?.data?.message || "Unable to save"); } };
  const del = async () => { await ep1.post("/api/v2/extracurricular/activities/delete", withScope({ ids: selected })); setSelected([]); load(); };
  const bulk = async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; const parsed = file.name.endsWith(".json") ? JSON.parse(await file.text()) : parseCsv(await file.text()); await ep1.post("/api/v2/extracurricular/activities/bulk", withScope({ rows: parsed })); load(); };
  const columns = [...activityFields.map((field) => ({ field, headerName: field, minWidth: 150, flex: field === "description" ? 1 : 0 })), { field: "actions", type: "actions", width: 80, getActions: ({ row }) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...blank, ...row }); }} />] }];
  return <MenuPageShell title="Extracurricular Activity"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Activity" value={form.activity} onChange={(e) => setForm((p) => ({ ...p, activity: e.target.value }))} /></Grid><Grid item xs={12} md={3}><Autocomplete freeSolo options={options.activityTypes || []} value={form.type} onInputChange={(_, value) => setForm((p) => ({ ...p, type: value }))} renderInput={(p) => <TextField {...p} size="small" label="Type" />} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid><Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" onClick={save}>Save</Button><Button onClick={() => template("extracurricular_activity_template.csv", activityFields)}>Template</Button><Button component="label" startIcon={<UploadFileIcon />}>Bulk upload<input hidden type="file" onChange={bulk} /></Button><Button color="error" startIcon={<DeleteIcon />} disabled={!selected.length} onClick={del}>Bulk delete</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function ExtracurricularCoordinatorPage() {
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ activityid: "", coordinatorrole: "Coordinator", default: "No", active: "Yes" });
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get("/api/v2/extracurricular/options", { params: withScope() }); setOptions(res.data || {}); };
  const load = async () => { const res = await ep1.get("/api/v2/extracurricular/coordinators", { params: withScope() }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, []);
  const save = async () => { try { await ep1.post("/api/v2/extracurricular/coordinators", withScope({ ...form, selecteduser: user })); setMessage("Coordinator saved"); load(); } catch (e) { setError(e.response?.data?.message || "Unable to save"); } };
  const del = async () => { await ep1.post("/api/v2/extracurricular/coordinators/delete", withScope({ ids: selected })); setSelected([]); load(); };
  const columns = ["activity", "activitytype", "coordinatorrole", "user", "useremail", "default", "active"].map((field) => ({ field, headerName: field, flex: 1, minWidth: 140 }));
  return <MenuPageShell title="Extracurricular Coordinators"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={4}><Autocomplete options={options.activities || []} value={(options.activities || []).find((a) => a._id === form.activityid) || null} getOptionLabel={(o) => `${o.activity || ""} (${o.type || ""})`} onChange={(_, v) => setForm((p) => ({ ...p, activityid: v?._id || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Activity" />} /></Grid><Grid item xs={12} md={3}><Autocomplete options={options.users || []} value={user} getOptionLabel={(o) => o.label || ""} onChange={(_, v) => setUser(v)} renderInput={(p) => <TextField {...p} size="small" label="User" />} /></Grid><Grid item xs={12} md={2}><TextField fullWidth size="small" label="Role" value={form.coordinatorrole} onChange={(e) => setForm((p) => ({ ...p, coordinatorrole: e.target.value }))} /></Grid><Grid item xs={12} md={1.5}><TextField select fullWidth size="small" label="Default" value={form.default} onChange={(e) => setForm((p) => ({ ...p, default: e.target.value }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid><Grid item xs={12} md={1.5}><TextField select fullWidth size="small" label="Active" value={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid><Grid item xs={12}><Button variant="contained" onClick={save}>Save</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><Button color="error" disabled={!selected.length} onClick={del}>Bulk delete</Button><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

const eventFields = ["event", "eventdescription", "objective", "agenda", "description", "activitydetails", "report", "reportlink", "startdate", "enddate", "guests", "status"];
export function ExtracurricularEventPage() {
  const blank = { activityid: "", event: "", eventdescription: "", objective: "", agenda: "", description: "", activitydetails: "", report: "", reportlink: "", startdate: "", enddate: "", guests: "", status: "Active" };
  const [options, setOptions] = useState({});
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [ai, setAi] = useState({ provider: "Gemini", geminiModel: "gemini-2.5-flash", openaiModel: "gpt-4.1-mini", claudeModel: "claude-3-5-sonnet-latest", ollamaConfigId: "", prompt: "" });
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const opt = await ep1.get("/api/v2/extracurricular/options", { params: withScope() }); setOptions(opt.data || {}); const assigned = await ep1.get("/api/v2/extracurricular/assigned-activities", { params: withScope({ user: global1.user }) }); setActivities(assigned.data?.data?.length ? assigned.data.data : opt.data?.activities || []); };
  const load = async () => { const res = await ep1.get("/api/v2/extracurricular/events", { params: withScope({ createdbyemail: global1.user }) }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, []);
  const save = async (nextForm = form) => { const res = await ep1.post("/api/v2/extracurricular/events", withScope({ ...nextForm, id: editId })); setEditId(res.data?.data?._id || editId); setMessage("Event saved"); load(); return res.data?.data; };
  const generateReport = async () => {
    try {
      let event = editId ? rows.find((r) => r._id === editId) : null;
      if (!event) event = await save(form);
      const res = await ep1.post("/api/v2/extracurricular/generate-report", withScope({ ...ai, eventid: event._id, event }));
      const report = res.data?.report || "";
      setProgress(5);
      const link = await uploadBlob(`<html><body>${report.replace(/\n/g, "<br/>")}</body></html>`, `${event.event || "event-report"}.html`, setProgress);
      const next = { ...form, report: [form.report, report].filter(Boolean).join("\n\n"), reportlink: link };
      setForm(next);
      await save(next);
      setMessage("AI report generated, uploaded and appended");
      setProgress(0);
    } catch (e) { setError(e.response?.data?.message || e.message || "Unable to generate report"); setProgress(0); }
  };
  const del = async () => { await ep1.post("/api/v2/extracurricular/events/delete", withScope({ ids: selected })); setSelected([]); load(); };
  const columns = [...["activity", "activitytype", ...eventFields].map((field) => ({ field, headerName: field, minWidth: ["report", "description", "activitydetails"].includes(field) ? 240 : 130, flex: ["event", "report", "description"].includes(field) ? 1 : 0, renderCell: field === "reportlink" ? (p) => p.value ? <Button href={p.value} target="_blank">Open</Button> : "" : undefined })), { field: "actions", type: "actions", width: 80, getActions: ({ row }) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...blank, ...row, activityid: row.activityid, startdate: dateOnly(row.startdate), enddate: dateOnly(row.enddate) }); }} />] }];
  return <MenuPageShell title="Extracurricular Events"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={4}><Autocomplete options={activities} value={activities.find((a) => String(a.activityid || a._id) === String(form.activityid)) || null} getOptionLabel={(o) => `${o.activity || ""} (${o.activitytype || o.type || ""})`} onChange={(_, v) => setForm((p) => ({ ...p, activityid: v?.activityid || v?._id || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Assigned activity" />} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Event" value={form.event} onChange={(e) => setForm((p) => ({ ...p, event: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="End date" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((p) => ({ ...p, enddate: e.target.value }))} /></Grid>{["eventdescription", "objective", "agenda", "description", "activitydetails", "report", "guests"].map((field) => <Grid item xs={12} md={field === "report" ? 12 : 6} key={field}><TextField fullWidth multiline minRows={field === "report" ? 5 : 3} label={field} value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} /></Grid>)}<Grid item xs={12}><TextField fullWidth size="small" label="Report link" value={form.reportlink} onChange={(e) => setForm((p) => ({ ...p, reportlink: e.target.value }))} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={() => save()}>Save event</Button><Button color="error" disabled={!selected.length} onClick={del}>Bulk delete</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 2, mb: 2 }}><Typography fontWeight={900}>AI / Epaathsala report generation</Typography><Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Provider" value={ai.provider} onChange={(e) => setAi((p) => ({ ...p, provider: e.target.value }))}>{["Gemini", "ChatGPT", "Claude", "Ollama", "Epaathsala AI"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><Autocomplete options={ai.provider === "ChatGPT" ? options.openAiModels || [] : ai.provider === "Claude" ? options.claudeModels || [] : options.geminiModels || []} value={ai.provider === "ChatGPT" ? ai.openaiModel : ai.provider === "Claude" ? ai.claudeModel : ai.geminiModel} disabled={["Ollama", "Epaathsala AI"].includes(ai.provider)} onChange={(_, v) => setAi((p) => ({ ...p, [ai.provider === "ChatGPT" ? "openaiModel" : ai.provider === "Claude" ? "claudeModel" : "geminiModel"]: v || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Model" />} /></Grid><Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Ollama model" value={ai.ollamaConfigId} disabled={ai.provider !== "Ollama"} onChange={(e) => setAi((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{(options.ollamaConfigs || []).map((o) => <MenuItem key={o._id} value={o._id}>{o.name} - {o.modelname}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Additional prompt" value={ai.prompt} onChange={(e) => setAi((p) => ({ ...p, prompt: e.target.value }))} /></Grid><Grid item xs={12}><Button variant="outlined" onClick={generateReport}>Generate, upload and append report</Button>{progress > 0 && <LinearProgress sx={{ mt: 1 }} variant="determinate" value={progress} />}</Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

function EventSelector({ options, type, setType, event, setEvent, multiple = false, selectedEvents, setSelectedEvents }) {
  const events = (options.events || []).filter((e) => !type || norm(e.activitytype) === norm(type));
  return <Grid container spacing={2}><Grid item xs={12} md={3}><Autocomplete options={options.activityTypes || []} value={type || ""} onChange={(_, v) => setType(v || "")} renderInput={(p) => <TextField {...p} size="small" label="Type" />} /></Grid><Grid item xs={12} md={9}><Autocomplete multiple={multiple} disableCloseOnSelect={multiple} options={events} value={multiple ? selectedEvents : event} onChange={(_, v) => multiple ? setSelectedEvents(v) : setEvent(v)} getOptionLabel={(o) => `${o.event || ""} (${o.activitytype || ""})`} renderOption={(props, option, { selected }) => <li {...props}>{multiple && <Checkbox checked={selected} />} {option.event}</li>} renderInput={(p) => <TextField {...p} size="small" label="Event" />} /></Grid></Grid>;
}

export function ExtracurricularEventStudentsPage() {
  const [options, setOptions] = useState({});
  const [type, setType] = useState("");
  const [event, setEvent] = useState(null);
  const [filters, setFilters] = useState([makeFilter()]);
  const [students, setStudents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get("/api/v2/extracurricular/options", { params: withScope() }); setOptions(res.data || {}); };
  const loadParticipants = async (e = event) => { if (!e) return; const res = await ep1.get("/api/v2/extracurricular/participants", { params: withScope({ eventid: e._id }) }); setParticipants(res.data?.data || []); };
  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { loadParticipants(); }, [event?._id]);
  const search = async () => { const res = await ep1.post("/api/v2/extracurricular/search-students", withScope({ filters })); setStudents(res.data?.data || []); };
  const add = async () => { if (!event) return setError("Select event"); await ep1.post("/api/v2/extracurricular/participants", withScope({ eventid: event._id, students: students.filter((s) => selectedStudents.includes(s._id)) })); setMessage("Students added"); setSelectedStudents([]); loadParticipants(); };
  const del = async () => { await ep1.post("/api/v2/extracurricular/participants/delete", withScope({ ids: selectedParticipants })); setSelectedParticipants([]); loadParticipants(); };
  const cols = ["name", "student", "email", "studentemail", "regno", "academicyear", "program", "programcode", "semester", "section"].map((f) => ({ field: f, headerName: f, flex: 1, minWidth: 120 }));
  return <MenuPageShell title="Extracurricular Event Students"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><EventSelector options={options} type={type} setType={setType} event={event} setEvent={setEvent} /><DynamicFilters fields={["academicyear", "regulation", "program", "programcode", "semester", "section", "name", "email", "regno"]} rows={students} filters={filters} setFilters={setFilters} options={{ academicyear: options.academicyears, regulation: options.regulations, program: options.programs, programcode: options.programcodes, semester: options.semesters, section: options.sections }} /><Button sx={{ mt: 1 }} variant="contained" onClick={search}>Search students</Button></Paper><Grid container spacing={2}><Grid item xs={12} md={6}><Paper sx={{ p: 1 }}><Button variant="contained" disabled={!selectedStudents.length} onClick={add}>Add selected</Button><DataGrid autoHeight rows={students} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selectedStudents} onRowSelectionModelChange={(ids) => setSelectedStudents(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Grid><Grid item xs={12} md={6}><Paper sx={{ p: 1 }}><Button color="error" disabled={!selectedParticipants.length} onClick={del}>Remove selected</Button><DataGrid autoHeight rows={participants} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selectedParticipants} onRowSelectionModelChange={(ids) => setSelectedParticipants(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Grid></Grid></Box></MenuPageShell>;
}

export function ExtracurricularAttendancePage() {
  const [options, setOptions] = useState({});
  const [type, setType] = useState("");
  const [event, setEvent] = useState(null);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const loadOptions = async () => { const res = await ep1.get("/api/v2/extracurricular/options", { params: withScope() }); setOptions(res.data || {}); };
  const load = async (e = event) => { if (!e) return; const res = await ep1.get("/api/v2/extracurricular/attendance", { params: withScope({ eventid: e._id }) }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { load(); }, [event?._id]);
  const mark = async () => { await ep1.post("/api/v2/extracurricular/attendance/mark", withScope({ ids: selected })); setSelected([]); load(); };
  const cols = ["attendancedate", "event", "activitytype", "student", "regno", "status"].map((f) => ({ field: f, headerName: f, flex: 1, minWidth: 130 }));
  return <MenuPageShell title="Extracurricular Attendance"><Box sx={{ p: 2 }}><Paper sx={{ p: 2, mb: 2 }}><EventSelector options={options} type={type} setType={setType} event={event} setEvent={setEvent} /><Button sx={{ mt: 1 }} variant="contained" disabled={!selected.length} onClick={mark}>Mark selected present</Button></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function ExtracurricularReportPage() {
  const [options, setOptions] = useState({});
  const [type, setType] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState([makeFilter("activitytype")]);
  const loadOptions = async () => { const res = await ep1.get("/api/v2/extracurricular/options", { params: withScope() }); setOptions(res.data || {}); };
  useEffect(() => { loadOptions(); }, []);
  const load = async () => { const params = filters.reduce((acc, item) => item.field && item.value ? { ...acc, [item.field]: item.value } : acc, withScope({ eventids: selectedEvents.map((e) => e._id).join(",") })); const res = await ep1.get("/api/v2/extracurricular/report", { params }); setReport(res.data || null); };
  const print = () => {
    if (!report) return;
    const body = `<h3>Summary</h3><table><tr><th>Events</th><th>Participants</th><th>Present</th><th>Absent</th></tr><tr><td>${report.summary.events}</td><td>${report.summary.participants}</td><td>${report.summary.present}</td><td>${report.summary.absent}</td></tr></table>${(report.events || []).map((e) => `<div class="card"><h3>${e.event}</h3><b>Type:</b> ${e.activitytype || ""}<br/><b>Dates:</b> ${dateOnly(e.startdate)} to ${dateOnly(e.enddate)}<br/><b>Objective:</b><br/>${e.objective || ""}<br/><b>Agenda:</b><br/>${e.agenda || ""}<br/><b>Report:</b><br/>${(e.report || "").replace(/\n/g, "<br/>")}<br/>${e.reportlink ? `<b>Report link:</b> ${e.reportlink}` : ""}</div>`).join("")}`;
    printReport("Extracurricular Activities Report", report.institution, body);
  };
  const chart = (data, typeName = "bar") => <ResponsiveContainer width="100%" height={260}>{typeName === "pie" ? <PieChart><Pie data={data || []} dataKey="value" nameKey="name" outerRadius={90}>{(data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart> : <BarChart data={data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart>}</ResponsiveContainer>;
  return <MenuPageShell title="Extracurricular Report"><Box sx={{ p: 2 }}><Paper sx={{ p: 2, mb: 2 }}><EventSelector multiple options={options} type={type} setType={setType} selectedEvents={selectedEvents} setSelectedEvents={setSelectedEvents} /><Box sx={{ mt: 2 }}><DynamicFilters fields={["activitytype", "activity", "event", "status", "fromdate", "todate"]} rows={options.events || []} filters={filters} setFilters={setFilters} options={{ activitytype: options.activityTypes }} /></Box><Stack direction="row" spacing={1} sx={{ mt: 1 }}><Button variant="outlined" onClick={() => setSelectedEvents((options.events || []).filter((e) => !type || norm(e.activitytype) === norm(type)))}>Select all</Button><Button variant="contained" onClick={load}>Generate report</Button><Button startIcon={<PrintIcon />} disabled={!report} onClick={print}>Print preview</Button></Stack></Paper>{report && <><Grid container spacing={2} sx={{ mb: 2 }}>{Object.entries(report.summary || {}).map(([k, v]) => <Grid item xs={12} md={3} key={k}><Card><CardContent><Typography color="text.secondary">{k}</Typography><Typography variant="h4" fontWeight={900}>{v}</Typography></CardContent></Card></Grid>)}</Grid><Grid container spacing={2} sx={{ mb: 2 }}><Grid item xs={12} md={4}><Paper sx={{ p: 2 }}><Typography fontWeight={900}>Event types</Typography>{chart(report.charts?.byType, "pie")}</Paper></Grid><Grid item xs={12} md={4}><Paper sx={{ p: 2 }}><Typography fontWeight={900}>Activities</Typography>{chart(report.charts?.byActivity)}</Paper></Grid><Grid item xs={12} md={4}><Paper sx={{ p: 2 }}><Typography fontWeight={900}>Monthwise type</Typography>{chart(report.charts?.byMonthType)}</Paper></Grid></Grid><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={report.events || []} getRowId={(r) => r._id} columns={["activitytype", "activity", "event", "startdate", "enddate", "guests", "reportlink"].map((f) => ({ field: f, headerName: f, minWidth: 140, flex: ["event", "activity"].includes(f) ? 1 : 0, renderCell: f === "reportlink" ? (p) => p.value ? <Button href={p.value} target="_blank">Open</Button> : "" : undefined }))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></>}</Box></MenuPageShell>;
}
