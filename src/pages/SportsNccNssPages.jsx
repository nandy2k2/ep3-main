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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const api = "/api/v2/sports-ncc-nss";
const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name, role: global1.role });
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const norm = (value) => String(value || "").trim().toLowerCase();
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const gridSx = { "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" } };
const COLORS = ["#2563eb", "#0f766e", "#f97316", "#7c3aed", "#be123c", "#0891b2"];
const filterFields = ["academicyear", "regulation", "program", "programcode", "semester", "section", "name", "email", "regno"];
const makeFilter = (field = "academicyear") => ({ id: `${Date.now()}-${Math.random()}`, field, value: "" });

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
function unique(rows, field) {
  return [...new Set((rows || []).map((row) => String(row[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
function Message({ message, error, setMessage, setError }) {
  return <>{message && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMessage("")}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>{error}</Alert>}</>;
}
function DynamicFilters({ rows, filters, setFilters, fields = filterFields, options = {} }) {
  const update = (id, key, value) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  return <Stack spacing={1}>{filters.map((filter) => <Stack key={filter.id} direction={{ xs: "column", md: "row" }} spacing={1}><Autocomplete size="small" sx={{ minWidth: 220 }} options={fields} value={filter.field} onChange={(_, value) => update(filter.id, "field", value || fields[0])} renderInput={(params) => <TextField {...params} label="Field" />} /><Autocomplete freeSolo size="small" sx={{ minWidth: 260 }} options={options[filter.field] || unique(rows, filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(filter.id, "value", value)} onChange={(_, value) => update(filter.id, "value", value || "")} renderInput={(params) => <TextField {...params} label="Value" />} /><Button color="error" onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter(fields[0])] : prev.filter((item) => item.id !== filter.id))}>Remove</Button></Stack>)}<Box><Button onClick={() => setFilters((prev) => [...prev, makeFilter(fields[0])])}>Add filter</Button></Box></Stack>;
}
function printHtml(title, institution, body) {
  const name = institution?.institutionname || institution?.insname || global1.insname || "Institution";
  const address = institution?.address || global1.address || "";
  const logo = institution?.logolink || institution?.logo || global1.logo || "";
  const win = window.open("", "_blank", "width=980,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;color:#000;margin:0}.tools{padding:10px;border-bottom:1px solid #ddd}.page{padding:14mm}.head{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:14px}.logo{height:58px}h1{font-size:20px;margin:4px 0}h2{font-size:16px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #000;padding:6px;font-size:12px;text-align:left;vertical-align:top}.card{border:1px solid #111;padding:10px;margin:10px 0;break-inside:avoid}@media print{.tools{display:none}@page{size:A4 portrait;margin:10mm}.page{padding:0}tr{break-inside:avoid}thead{display:table-header-group}}</style></head><body><div class="tools"><button onclick="print()">Print</button><button onclick="close()">Close</button></div><div class="page"><div class="head">${logo ? `<img class="logo" src="${logo}"/>` : ""}<h1>${name}</h1><div>${address}</div><h2>${title}</h2></div>${body}</div></body></html>`);
  win.document.close();
}
async function uploadFile(file, folder, setProgress) {
  const data = new FormData();
  data.append("file", file);
  data.append("colid", global1.colid);
  data.append("user", global1.user || "");
  data.append("folder", folder);
  const res = await ep1.post("/api/v2/aws-file-library/upload", data, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress: (event) => event.total && setProgress?.(Math.round((event.loaded * 100) / event.total)) });
  return res.data?.url || "";
}
async function uploadHtml(content, filename, folder, setProgress) {
  return uploadFile(new File([content], filename, { type: "text/html" }), folder, setProgress);
}
function ActivitySelect({ options, value, onChange, label = "Activity" }) {
  return <Autocomplete options={options.activities || []} value={(options.activities || []).find((a) => String(a._id) === String(value)) || null} getOptionLabel={(o) => `${o.activity || ""} (${o.activitytype || ""})`} onChange={(_, v) => onChange(v)} renderInput={(p) => <TextField {...p} size="small" label={label} />} />;
}
function GroupSelect({ groups, value, onChange, label = "Group" }) {
  return <Autocomplete options={groups || []} value={(groups || []).find((g) => String(g._id) === String(value)) || null} getOptionLabel={(o) => `${o.groupname || ""} - ${o.activity || ""} (${o.activitytype || ""})`} onChange={(_, v) => onChange(v)} renderInput={(p) => <TextField {...p} size="small" label={label} />} />;
}

export function SportsNccNssActivityPage() {
  const blank = { activity: "", activitytype: "Sports", description: "", status: "Active" };
  const [form, setForm] = useState(blank);
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = useCallback(async () => { const res = await ep1.get(`${api}/options`, { params: withScope() }); setOptions(res.data || {}); }, []);
  const load = async () => { const res = await ep1.get(`${api}/activities`, { params: withScope() }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, [loadOptions]);
  const save = async () => { try { await ep1.post(`${api}/activities`, withScope({ ...form, id: editId })); setForm(blank); setEditId(""); setMessage("Activity saved"); load(); loadOptions(); } catch (e) { setError(e.response?.data?.message || "Unable to save"); } };
  const del = async () => { await ep1.post(`${api}/activities/delete`, withScope({ ids: selected })); setSelected([]); load(); };
  const bulk = async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; await ep1.post(`${api}/activities/bulk`, withScope({ rows: parseCsv(await file.text()) })); load(); };
  const columns = ["activitytype", "activity", "description", "status"].map((field) => ({ field, headerName: field, minWidth: 140, flex: field === "description" ? 1 : 0 })).concat({ field: "actions", type: "actions", width: 80, getActions: ({ row }) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...blank, ...row }); }} />] });
  return <MenuPageShell title="Sports NCC NSS Activity"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><Autocomplete options={options.activityTypes || ["Sports", "NCC", "NSS"]} value={form.activitytype} onChange={(_, v) => setForm((p) => ({ ...p, activitytype: v || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Activity type" />} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Activity" value={form.activity} onChange={(e) => setForm((p) => ({ ...p, activity: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={save}>Save</Button><Button onClick={() => template("sports_ncc_nss_activity_template.csv", ["activitytype", "activity", "description", "status"])}>Template</Button><Button component="label" startIcon={<UploadFileIcon />}>Bulk upload<input hidden type="file" onChange={bulk} /></Button><Button color="error" startIcon={<DeleteIcon />} disabled={!selected.length} onClick={del}>Bulk delete</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function SportsNccNssCoordinatorPage() {
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ activityid: "", activitytype: "", startdate: "", enddate: "", default: "No", active: "Yes" });
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get(`${api}/options`, { params: withScope() }); setOptions(res.data || {}); };
  const load = async () => { const res = await ep1.get(`${api}/coordinators`, { params: withScope() }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, []);
  const save = async () => { try { await ep1.post(`${api}/coordinators`, withScope({ ...form, selecteduser: user })); setMessage("Coordinator assignment saved"); load(); } catch (e) { setError(e.response?.data?.message || "Unable to save"); } };
  const del = async () => { await ep1.post(`${api}/coordinators/delete`, withScope({ ids: selected })); setSelected([]); load(); };
  const columns = ["activitytype", "activity", "user", "useremail", "startdate", "enddate", "default", "active"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["activity", "useremail"].includes(field) ? 1 : 0 }));
  return <MenuPageShell title="Sports NCC NSS Coordinator Assignment"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={4}><ActivitySelect options={options} value={form.activityid} onChange={(v) => setForm((p) => ({ ...p, activityid: v?._id || "", activitytype: v?.activitytype || "" }))} /></Grid><Grid item xs={12} md={2}><TextField fullWidth size="small" label="Type" value={form.activitytype} InputProps={{ readOnly: true }} /></Grid><Grid item xs={12} md={4}><Autocomplete options={options.users || []} value={user} getOptionLabel={(o) => o.label || ""} onChange={(_, v) => setUser(v)} renderInput={(p) => <TextField {...p} size="small" label="User" />} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Default" value={form.default} onChange={(e) => setForm((p) => ({ ...p, default: e.target.value }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid><Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="End date" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((p) => ({ ...p, enddate: e.target.value }))} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" onClick={save}>Save</Button><Button color="error" disabled={!selected.length} onClick={del}>Bulk delete</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function SportsNccNssGroupPage() {
  const blank = { activityid: "", activitytype: "", groupname: "", description: "", startdate: "", enddate: "", status: "Active" };
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadActivities = async () => { const res = await ep1.get(`${api}/assigned-activities`, { params: withScope({ user: global1.user }) }); setActivities(res.data?.data || []); };
  const load = async () => { const res = await ep1.get(`${api}/groups`, { params: withScope({ mine: "Yes", user: global1.user }) }); setRows(res.data?.data || []); };
  useEffect(() => { loadActivities(); load(); }, []);
  const save = async () => { try { await ep1.post(`${api}/groups`, withScope({ ...form, id: editId })); setForm(blank); setEditId(""); setMessage("Group saved"); load(); } catch (e) { setError(e.response?.data?.message || "Unable to save"); } };
  const del = async () => { await ep1.post(`${api}/groups/delete`, withScope({ ids: selected })); setSelected([]); load(); };
  const columns = ["activitytype", "activity", "groupname", "description", "startdate", "enddate", "status"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["groupname", "description"].includes(field) ? 1 : 0 })).concat({ field: "actions", type: "actions", width: 80, getActions: ({ row }) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...blank, ...row, activityid: row.activityid, startdate: dateOnly(row.startdate), enddate: dateOnly(row.enddate) }); }} />] });
  return <MenuPageShell title="Sports NCC NSS Activity Group"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={4}><Autocomplete options={activities} value={activities.find((a) => String(a.activityid) === String(form.activityid)) || null} getOptionLabel={(o) => `${o.activity || ""} (${o.activitytype || ""})`} onChange={(_, v) => setForm((p) => ({ ...p, activityid: v?.activityid || "", activitytype: v?.activitytype || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Assigned activity" />} /></Grid><Grid item xs={12} md={2}><TextField fullWidth size="small" label="Type" value={form.activitytype} InputProps={{ readOnly: true }} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Group" value={form.groupname} onChange={(e) => setForm((p) => ({ ...p, groupname: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="End date" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((p) => ({ ...p, enddate: e.target.value }))} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" onClick={save}>Save group</Button><Button color="error" disabled={!selected.length} onClick={del}>Bulk delete</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function SportsNccNssGroupStudentsPage() {
  const [options, setOptions] = useState({});
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [filters, setFilters] = useState([makeFilter()]);
  const [students, setStudents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get(`${api}/options`, { params: withScope() }); setOptions(res.data || {}); const mine = await ep1.get(`${api}/groups`, { params: withScope({ mine: "Yes", user: global1.user }) }); setGroups(mine.data?.data || []); };
  const loadMembers = async (g = group) => { if (!g) return; const res = await ep1.get(`${api}/members`, { params: withScope({ groupid: g._id }) }); setMembers(res.data?.data || []); };
  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { loadMembers(); }, [group?._id]);
  const search = async () => { const res = await ep1.post(`${api}/search-students`, withScope({ filters })); setStudents(res.data?.data || []); };
  const add = async () => { if (!group) return setError("Select group"); await ep1.post(`${api}/members`, withScope({ groupid: group._id, students: students.filter((s) => selectedStudents.includes(s._id)) })); setMessage("Students added"); setSelectedStudents([]); loadMembers(); };
  const del = async () => { await ep1.post(`${api}/members/delete`, withScope({ ids: selectedMembers })); setSelectedMembers([]); loadMembers(); };
  const studentCols = ["name", "email", "regno", "academicyear", "regulation", "program", "programcode", "semester", "section"].map((field) => ({ field, headerName: field, minWidth: 120, flex: ["name", "email"].includes(field) ? 1 : 0 }));
  const memberCols = ["student", "studentemail", "regno", "academicyear", "program", "programcode", "semester", "section", "source"].map((field) => ({ field, headerName: field, minWidth: 120, flex: ["student", "studentemail"].includes(field) ? 1 : 0 }));
  return <MenuPageShell title="Sports NCC NSS Group Students"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={5}><Autocomplete options={options.activityTypes || []} onChange={(_, v) => setGroups((options.groups || []).filter((g) => !v || norm(g.activitytype) === norm(v)))} renderInput={(p) => <TextField {...p} size="small" label="Activity type" />} /></Grid><Grid item xs={12} md={7}><GroupSelect groups={groups} value={group?._id} onChange={setGroup} /></Grid><Grid item xs={12}><DynamicFilters rows={students} filters={filters} setFilters={setFilters} options={{ academicyear: options.academicyears, regulation: options.regulations, program: options.programs, programcode: options.programcodes, semester: options.semesters, section: options.sections }} /></Grid><Grid item xs={12}><Button variant="contained" onClick={search}>Search students</Button></Grid></Grid></Paper><Grid container spacing={2}><Grid item xs={12} md={6}><Paper sx={{ p: 1 }}><Button variant="contained" disabled={!selectedStudents.length} onClick={add}>Add selected to group</Button><DataGrid autoHeight rows={students} getRowId={(r) => r._id} columns={studentCols} checkboxSelection rowSelectionModel={selectedStudents} onRowSelectionModelChange={(ids) => setSelectedStudents(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Grid><Grid item xs={12} md={6}><Paper sx={{ p: 1 }}><Button color="error" disabled={!selectedMembers.length} onClick={del}>Remove selected</Button><DataGrid autoHeight rows={members} getRowId={(r) => r._id} columns={memberCols} checkboxSelection rowSelectionModel={selectedMembers} onRowSelectionModelChange={(ids) => setSelectedMembers(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Grid></Grid></Box></MenuPageShell>;
}

export function StudentSportsNccNssApplicationPage() {
  const [options, setOptions] = useState({});
  const [type, setType] = useState("");
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [form, setForm] = useState({ application: "", reason: "", attachmentlink: "" });
  const [applications, setApplications] = useState([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get(`${api}/options`, { params: withScope() }); setOptions(res.data || {}); };
  const loadGroups = async () => { const res = await ep1.get(`${api}/student/groups`, { params: withScope({ user: global1.user, activitytype: type }) }); setGroups(res.data?.data || []); };
  const loadApplications = async () => { const res = await ep1.get(`${api}/student/applications`, { params: withScope({ user: global1.user }) }); setApplications(res.data?.data || []); };
  useEffect(() => { loadOptions(); loadApplications(); }, []);
  useEffect(() => { loadGroups(); }, [type]);
  const attach = async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setProgress(1); const link = await uploadFile(file, "sports-ncc-nss/applications", setProgress); setForm((p) => ({ ...p, attachmentlink: link })); setProgress(0); };
  const submit = async () => { try { if (!group) return setError("Select group"); await ep1.post(`${api}/student/apply`, withScope({ ...form, groupid: group._id })); setMessage("Application submitted"); setForm({ application: "", reason: "", attachmentlink: "" }); setGroup(null); loadGroups(); loadApplications(); } catch (e) { setError(e.response?.data?.message || "Unable to submit"); } };
  const cols = ["activitytype", "activity", "groupname", "status", "reason", "approvercomment", "attachmentlink"].map((field) => ({ field, headerName: field, minWidth: 140, flex: ["reason", "approvercomment"].includes(field) ? 1 : 0, renderCell: field === "attachmentlink" ? (p) => p.value ? <Button href={p.value} target="_blank">Open</Button> : "" : undefined }));
  return <MenuPageShell title="Sports NCC NSS Group Application"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><Autocomplete options={options.activityTypes || []} value={type} onChange={(_, v) => setType(v || "")} renderInput={(p) => <TextField {...p} size="small" label="Activity type" />} /></Grid><Grid item xs={12} md={9}><GroupSelect groups={groups} value={group?._id} onChange={setGroup} /></Grid><Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Application" value={form.application} onChange={(e) => setForm((p) => ({ ...p, application: e.target.value }))} /></Grid><Grid item xs={12} md={6}><TextField fullWidth multiline minRows={4} label="Reason to join" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button component="label" startIcon={<UploadFileIcon />}>Upload attachment<input hidden type="file" onChange={attach} /></Button>{form.attachmentlink && <Button href={form.attachmentlink} target="_blank">View attachment</Button>}<Button variant="contained" onClick={submit}>Submit application</Button></Stack>{progress > 0 && <LinearProgress sx={{ mt: 1 }} variant="determinate" value={progress} />}</Grid></Grid></Paper><Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ mb: 1 }}>My applications</Typography><DataGrid autoHeight rows={applications} getRowId={(r) => r._id} columns={cols} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function SportsNccNssApplicationApprovalPage() {
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [rows, setRows] = useState([]);
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadGroups = async () => { const res = await ep1.get(`${api}/groups`, { params: withScope({ mine: "Yes", user: global1.user }) }); setGroups(res.data?.data || []); };
  const load = async () => { if (!group) return; const res = await ep1.get(`${api}/applications`, { params: withScope({ groupid: group._id, status }) }); setRows(res.data?.data || []); };
  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { load(); }, [group?._id, status]);
  const decide = async (nextStatus) => { try { for (const id of selected) await ep1.post(`${api}/applications/decision`, withScope({ id, status: nextStatus, approvercomment: comment })); setSelected([]); setMessage(`Applications ${nextStatus}`); load(); } catch (e) { setError(e.response?.data?.message || "Unable to update"); } };
  const cols = ["student", "studentemail", "regno", "academicyear", "program", "programcode", "semester", "section", "reason", "status", "attachmentlink"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["reason", "studentemail"].includes(field) ? 1 : 0, renderCell: field === "attachmentlink" ? (p) => p.value ? <Button href={p.value} target="_blank">Open</Button> : "" : undefined }));
  return <MenuPageShell title="Sports NCC NSS Applications"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={6}><GroupSelect groups={groups} value={group?._id} onChange={setGroup} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Tab" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Approved">Approved</MenuItem><MenuItem value="Rejected">Rejected</MenuItem></TextField></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Approval comment" value={comment} onChange={(e) => setComment(e.target.value)} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" disabled={!selected.length} onClick={() => decide("Approved")}>Approve selected</Button><Button color="error" disabled={!selected.length} onClick={() => decide("Rejected")}>Reject selected</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function SportsNccNssEventPage() {
  const blank = { groupid: "", event: "", eventdescription: "", objective: "", agenda: "", description: "", activitydetails: "", report: "", reportlink: "", photos: [], startdate: "", enddate: "", location: "", guests: "", status: "Active" };
  const [options, setOptions] = useState({});
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [editId, setEditId] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [markClassAttendance, setMarkClassAttendance] = useState("No");
  const [ai, setAi] = useState({ provider: "Gemini", geminiModel: "gemini-2.5-flash", openaiModel: "gpt-4.1-mini", claudeModel: "claude-3-5-sonnet-latest", ollamaConfigId: "", prompt: "" });
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const opt = await ep1.get(`${api}/options`, { params: withScope() }); setOptions(opt.data || {}); const mine = await ep1.get(`${api}/groups`, { params: withScope({ mine: "Yes", user: global1.user }) }); setGroups(mine.data?.data || []); };
  const load = async () => { const res = await ep1.get(`${api}/events`, { params: withScope({ createdbyemail: global1.user }) }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, []);
  const save = async (next = form) => { const res = await ep1.post(`${api}/events`, withScope({ ...next, id: editId })); setEditId(res.data?.data?._id || editId); setMessage("Event saved"); load(); return res.data?.data; };
  const del = async () => { await ep1.post(`${api}/events/delete`, withScope({ ids: selectedEvents })); setSelectedEvents([]); load(); };
  const loadMembers = async (eventid) => { if (!eventid) return; const res = await ep1.get(`${api}/event-members`, { params: withScope({ eventid }) }); setMembers(res.data?.data || []); };
  const uploadReportFile = async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setProgress(1); const link = await uploadFile(file, "sports-ncc-nss/reports", setProgress); setForm((p) => ({ ...p, reportlink: link })); setProgress(0); };
  const uploadPhoto = async (event) => { const files = Array.from(event.target.files || []); event.target.value = ""; if (!files.length) return; setProgress(1); const links = []; for (const file of files) links.push({ title: file.name, link: await uploadFile(file, "sports-ncc-nss/photos", setProgress) }); setForm((p) => ({ ...p, photos: [...(p.photos || []), ...links] })); setProgress(0); };
  const generateReport = async () => {
    try {
      let event = editId ? rows.find((r) => r._id === editId) : null;
      if (!event) event = await save(form);
      const res = await ep1.post(`${api}/generate-report`, withScope({ ...ai, eventid: event._id, event }));
      const report = res.data?.report || "";
      setProgress(5);
      const link = await uploadHtml(`<html><body>${report.replace(/\n/g, "<br/>")}</body></html>`, `${event.event || "sports-ncc-nss-report"}.html`, "sports-ncc-nss/reports", setProgress);
      const next = { ...form, report: [form.report, report].filter(Boolean).join("\n\n"), reportlink: link };
      setForm(next);
      await save(next);
      setProgress(0);
      setMessage("Report generated, uploaded and appended");
    } catch (e) { setProgress(0); setError(e.response?.data?.message || e.message || "Unable to generate report"); }
  };
  const mark = async () => { const eventid = editId || rows.find((r) => r.event === form.event)?._id; if (!eventid) return setError("Save or select an event first"); await ep1.post(`${api}/event-attendance/mark`, withScope({ eventid, memberids: selectedMembers, markClassAttendance })); setMessage("Attendance marked"); };
  const columns = ["activitytype", "activity", "groupname", "event", "startdate", "enddate", "location", "guests", "reportlink"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["event", "groupname"].includes(field) ? 1 : 0, renderCell: field === "reportlink" ? (p) => p.value ? <Button href={p.value} target="_blank">Open</Button> : "" : undefined })).concat({ field: "actions", type: "actions", width: 90, getActions: ({ row }) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...blank, ...row, groupid: row.groupid, startdate: dateOnly(row.startdate), enddate: dateOnly(row.enddate), photos: row.photos || [] }); loadMembers(row._id); }} />] });
  const memberCols = ["student", "studentemail", "regno", "academicyear", "program", "semester", "section"].map((field) => ({ field, headerName: field, minWidth: 120, flex: ["student", "studentemail"].includes(field) ? 1 : 0 }));
  return <MenuPageShell title="Sports NCC NSS Events"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={5}><GroupSelect groups={groups} value={form.groupid} onChange={(v) => setForm((p) => ({ ...p, groupid: v?._id || "" }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Event" value={form.event} onChange={(e) => setForm((p) => ({ ...p, event: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="End date" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((p) => ({ ...p, enddate: e.target.value }))} /></Grid>{["eventdescription", "objective", "agenda", "description", "activitydetails", "report", "location", "guests"].map((field) => <Grid item xs={12} md={field === "report" ? 12 : 6} key={field}><TextField fullWidth multiline={field !== "location" && field !== "guests"} minRows={field === "report" ? 5 : 2} label={field} value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} /></Grid>)}<Grid item xs={12}><TextField fullWidth size="small" label="Report link" value={form.reportlink} onChange={(e) => setForm((p) => ({ ...p, reportlink: e.target.value }))} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={() => save()}>Save event</Button><Button component="label">Upload report<input hidden type="file" onChange={uploadReportFile} /></Button><Button component="label">Upload photos<input hidden multiple type="file" accept="image/*" onChange={uploadPhoto} /></Button><Button color="error" disabled={!selectedEvents.length} onClick={del}>Bulk delete</Button></Stack>{progress > 0 && <LinearProgress sx={{ mt: 1 }} variant="determinate" value={progress} />}{(form.photos || []).length > 0 && <Typography sx={{ mt: 1 }} variant="body2">{form.photos.map((p) => p.title).join(", ")}</Typography>}</Grid></Grid></Paper><Paper sx={{ p: 2, mb: 2 }}><Typography fontWeight={900}>AI / Epaathsala report generation</Typography><Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Provider" value={ai.provider} onChange={(e) => setAi((p) => ({ ...p, provider: e.target.value }))}>{["Gemini", "ChatGPT", "Claude", "Ollama", "Epaathsala AI"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><Autocomplete disabled={["Ollama", "Epaathsala AI"].includes(ai.provider)} options={ai.provider === "ChatGPT" ? options.openAiModels || [] : ai.provider === "Claude" ? options.claudeModels || [] : options.geminiModels || []} value={ai.provider === "ChatGPT" ? ai.openaiModel : ai.provider === "Claude" ? ai.claudeModel : ai.geminiModel} onChange={(_, v) => setAi((p) => ({ ...p, [ai.provider === "ChatGPT" ? "openaiModel" : ai.provider === "Claude" ? "claudeModel" : "geminiModel"]: v || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Model" />} /></Grid><Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Ollama model" value={ai.ollamaConfigId} disabled={ai.provider !== "Ollama"} onChange={(e) => setAi((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{(options.ollamaConfigs || []).map((o) => <MenuItem key={o._id} value={o._id}>{o.name} - {o.modelname}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Additional prompt" value={ai.prompt} onChange={(e) => setAi((p) => ({ ...p, prompt: e.target.value }))} /></Grid><Grid item xs={12}><Button variant="outlined" onClick={generateReport}>Generate, upload and append report</Button></Grid></Grid></Paper><Grid container spacing={2}><Grid item xs={12} md={7}><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selectedEvents} onRowSelectionModelChange={(ids) => setSelectedEvents(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Grid><Grid item xs={12} md={5}><Paper sx={{ p: 1 }}><Stack direction="row" spacing={1} sx={{ mb: 1 }}><TextField select size="small" label="Mark LMS classes" value={markClassAttendance} onChange={(e) => setMarkClassAttendance(e.target.value)}><MenuItem value="No">No</MenuItem><MenuItem value="Yes">Yes</MenuItem></TextField><Button variant="contained" disabled={!selectedMembers.length} onClick={mark}>Mark selected present</Button></Stack><DataGrid autoHeight rows={members} getRowId={(r) => r._id} columns={memberCols} checkboxSelection rowSelectionModel={selectedMembers} onRowSelectionModelChange={(ids) => setSelectedMembers(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Grid></Grid></Box></MenuPageShell>;
}

export function SportsNccNssReportPage() {
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([makeFilter("activitytype")]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadOptions = async () => { const res = await ep1.get(`${api}/options`, { params: withScope() }); setOptions(res.data || {}); };
  useEffect(() => { loadOptions(); }, []);
  const load = async () => { setLoading(true); const params = filters.reduce((acc, item) => item.field && item.value ? { ...acc, [item.field]: item.value } : acc, withScope()); const res = await ep1.get(`${api}/report`, { params }); setReport(res.data || null); setLoading(false); };
  const chart = (data, type = "bar") => <ResponsiveContainer width="100%" height={260}>{type === "pie" ? <PieChart><Pie data={data || []} dataKey="value" nameKey="name" outerRadius={90}>{(data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart> : <BarChart data={data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart>}</ResponsiveContainer>;
  const print = () => {
    if (!report) return;
    const body = `<h3>Summary</h3><table><tr>${Object.keys(report.summary || {}).map((k) => `<th>${k}</th>`).join("")}</tr><tr>${Object.values(report.summary || {}).map((v) => `<td>${v}</td>`).join("")}</tr></table>${(report.events || []).map((e) => `<div class="card"><h3>${e.event}</h3><b>Type:</b> ${e.activitytype || ""}<br/><b>Group:</b> ${e.groupname || ""}<br/><b>Dates:</b> ${dateOnly(e.startdate)} to ${dateOnly(e.enddate)}<br/><b>Location:</b> ${e.location || ""}<br/><b>Guests:</b> ${e.guests || ""}<br/><b>Objective:</b><br/>${e.objective || ""}<br/><b>Agenda:</b><br/>${e.agenda || ""}<br/><b>Report:</b><br/>${(e.report || "").replace(/\n/g, "<br/>")}<br/>${e.reportlink ? `<b>Report link:</b> ${e.reportlink}<br/>` : ""}${(e.photos || []).map((p) => `<b>Photo:</b> ${p.title || ""} ${p.link || ""}<br/>`).join("")}</div>`).join("")}`;
    printHtml("Sports NCC NSS Report", report.institution, body);
  };
  const columns = ["activitytype", "activity", "groupname", "event", "startdate", "enddate", "location", "guests", "reportlink"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["event", "groupname"].includes(field) ? 1 : 0, renderCell: field === "reportlink" ? (p) => p.value ? <Button href={p.value} target="_blank">Open</Button> : "" : undefined }));
  return <MenuPageShell title="Sports NCC NSS Report"><Box sx={{ p: 2 }}><Paper sx={{ p: 2, mb: 2 }}><DynamicFilters fields={["activitytype", "activity", "groupname", "event", "status", "fromdate", "todate"]} rows={options.groups || []} filters={filters} setFilters={setFilters} options={{ activitytype: options.activityTypes }} /><Stack direction="row" spacing={1} sx={{ mt: 1 }}><Button variant="contained" onClick={load}>Generate report</Button><Button startIcon={<PrintIcon />} disabled={!report} onClick={print}>Print preview</Button></Stack>{loading && <LinearProgress sx={{ mt: 1 }} />}</Paper>{report && <><Grid container spacing={2} sx={{ mb: 2 }}>{Object.entries(report.summary || {}).map(([k, v]) => <Grid item xs={12} md={3} key={k}><Card><CardContent><Typography color="text.secondary">{k}</Typography><Typography variant="h4" fontWeight={900}>{v}</Typography></CardContent></Card></Grid>)}</Grid><Grid container spacing={2} sx={{ mb: 2 }}><Grid item xs={12} md={4}><Paper sx={{ p: 2 }}><Typography fontWeight={900}>Activity type</Typography>{chart(report.charts?.byType, "pie")}</Paper></Grid><Grid item xs={12} md={4}><Paper sx={{ p: 2 }}><Typography fontWeight={900}>Activity</Typography>{chart(report.charts?.byActivity)}</Paper></Grid><Grid item xs={12} md={4}><Paper sx={{ p: 2 }}><Typography fontWeight={900}>Monthwise type</Typography>{chart(report.charts?.byMonthType)}</Paper></Grid></Grid><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={report.events || []} getRowId={(r) => r._id} columns={columns} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></>}</Box></MenuPageShell>;
}
