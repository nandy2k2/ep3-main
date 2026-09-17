import React, { useEffect, useMemo, useState } from "react";
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
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const base = "/api/v2/neplms/event-attendance-request";
const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name, role: global1.role });
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const gridSx = { "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" } };
const makeFilter = (field = "status") => ({ id: `${Date.now()}-${Math.random()}`, field, value: "" });
const unique = (rows, field) => [...new Set((rows || []).map((row) => String(row[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

function Message({ message, error, setMessage, setError }) {
  return <>{message && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMessage("")}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>{error}</Alert>}</>;
}
async function uploadFile(file, folder, setProgress) {
  const data = new FormData();
  data.append("file", file);
  data.append("colid", global1.colid);
  data.append("user", global1.user || "");
  data.append("folder", folder);
  const res = await ep1.post("/api/v2/aws-file-library/upload", data, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => event.total && setProgress?.(Math.round((event.loaded * 100) / event.total))
  });
  return res.data?.url || "";
}
function DocumentLinks({ links = [] }) {
  return <Stack spacing={0.5}>{(links || []).map((doc, index) => doc?.link ? <Button key={`${doc.link}-${index}`} size="small" href={doc.link} target="_blank">{doc.title || `Document ${index + 1}`}</Button> : null)}</Stack>;
}
function DynamicFilters({ rows, filters, setFilters, options = {} }) {
  const fields = ["status", "eventname", "eventtype", "student", "studentemail", "regno", "academicyear", "program", "programcode", "semester", "section", "fromdate", "todate"];
  const update = (id, key, value) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  return <Stack spacing={1}>{filters.map((filter) => <Stack key={filter.id} direction={{ xs: "column", md: "row" }} spacing={1}><Autocomplete size="small" sx={{ minWidth: 220 }} options={fields} value={filter.field} onChange={(_, value) => update(filter.id, "field", value || fields[0])} renderInput={(params) => <TextField {...params} label="Field" />} /><Autocomplete freeSolo size="small" sx={{ minWidth: 260 }} options={options[filter.field] || unique(rows, filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(filter.id, "value", value)} onChange={(_, value) => update(filter.id, "value", value || "")} renderInput={(params) => <TextField {...params} label="Value" />} /><Button color="error" onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter(fields[0])] : prev.filter((item) => item.id !== filter.id))}>Remove</Button></Stack>)}<Box><Button onClick={() => setFilters((prev) => [...prev, makeFilter(fields[0])])}>Add filter</Button></Box></Stack>;
}

export function StudentEventAttendanceRequestPage() {
  const blank = { eventdate: "", eventname: "", eventtype: "", organizer: "", venue: "", reason: "", remarks: "", documentlinks: [] };
  const [options, setOptions] = useState({});
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get(`${base}/options`, { params: withScope() }); setOptions(res.data || {}); };
  const load = async () => { const res = await ep1.get(`${base}/my`, { params: withScope({ user: global1.user }) }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); load(); }, []);
  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setProgress(1);
    const links = [];
    for (const file of files) links.push({ title: file.name, link: await uploadFile(file, "event-attendance/student-documents", setProgress) });
    setForm((prev) => ({ ...prev, documentlinks: [...(prev.documentlinks || []), ...links] }));
    setProgress(0);
  };
  const submit = async () => {
    try {
      await ep1.post(`${base}/submit`, withScope(form));
      setForm(blank);
      setMessage("Event attendance request submitted");
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to submit request");
    }
  };
  const columns = [
    "eventdate", "eventname", "eventtype", "organizer", "venue", "reason", "status", "welfarecomment", "attendancemodifiedcount"
  ].map((field) => ({ field, headerName: field, minWidth: 140, flex: ["eventname", "reason", "welfarecomment"].includes(field) ? 1 : 0 })).concat([
    { field: "documents", headerName: "Documents", minWidth: 180, renderCell: ({ row }) => <DocumentLinks links={row.documentlinks} /> },
    { field: "welfaredocuments", headerName: "Welfare documents", minWidth: 180, renderCell: ({ row }) => <DocumentLinks links={row.welfaredocumentlinks} /> }
  ]);
  return <MenuPageShell title="Event Attendance Request"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth type="date" size="small" label="Event date" InputLabelProps={{ shrink: true }} value={form.eventdate} onChange={(e) => setForm((p) => ({ ...p, eventdate: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Event name" value={form.eventname} onChange={(e) => setForm((p) => ({ ...p, eventname: e.target.value }))} /></Grid><Grid item xs={12} md={3}><Autocomplete freeSolo options={options.eventTypes || []} value={form.eventtype} onInputChange={(_, value) => setForm((p) => ({ ...p, eventtype: value }))} renderInput={(p) => <TextField {...p} size="small" label="Event type" />} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Venue" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Organizer" value={form.organizer} onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))} /></Grid><Grid item xs={12} md={8}><TextField fullWidth multiline minRows={3} label="Reason / application" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button component="label" startIcon={<UploadFileIcon />}>Upload documents<input hidden multiple type="file" onChange={upload} /></Button><Button variant="contained" onClick={submit}>Submit request</Button></Stack>{progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />}{form.documentlinks?.length > 0 && <Typography variant="body2" sx={{ mt: 1 }}>{form.documentlinks.map((doc) => doc.title).join(", ")}</Typography>}</Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(row) => row._id} columns={columns} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function WelfareEventAttendanceApprovalPage() {
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([makeFilter("status")]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comment, setComment] = useState("");
  const [docs, setDocs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get(`${base}/options`, { params: withScope() }); setOptions(res.data || {}); };
  useEffect(() => { loadOptions(); }, []);
  const params = () => filters.reduce((acc, filter) => filter.field && filter.value ? { ...acc, [filter.field]: filter.value } : acc, withScope());
  const load = async () => { setLoading(true); const res = await ep1.get(`${base}/list`, { params: params() }); setRows(res.data?.data || []); setLoading(false); };
  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setProgress(1);
    const links = [];
    for (const file of files) links.push({ title: file.name, link: await uploadFile(file, "event-attendance/welfare-documents", setProgress) });
    setDocs((prev) => [...prev, ...links]);
    setProgress(0);
  };
  const review = async (status) => {
    try {
      for (const id of selected) await ep1.post(`${base}/review`, withScope({ id, status, welfarecomment: comment, welfaredocumentlinks: docs }));
      setSelected([]);
      setDocs([]);
      setComment("");
      setMessage(`${status} completed`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update request");
    }
  };
  const summary = useMemo(() => ({
    open: rows.filter((row) => row.status === "Open").length,
    approved: rows.filter((row) => row.status === "Approved").length,
    rejected: rows.filter((row) => row.status === "Rejected").length
  }), [rows]);
  const columns = [
    "status", "eventdate", "eventname", "eventtype", "student", "studentemail", "regno", "program", "programcode", "semester", "section", "reason", "welfarecomment", "attendancemodifiedcount"
  ].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["eventname", "studentemail", "reason", "welfarecomment"].includes(field) ? 1 : 0 })).concat([
    { field: "documents", headerName: "Student documents", minWidth: 180, renderCell: ({ row }) => <DocumentLinks links={row.documentlinks} /> },
    { field: "welfaredocuments", headerName: "Welfare documents", minWidth: 180, renderCell: ({ row }) => <DocumentLinks links={row.welfaredocumentlinks} /> }
  ]);
  return <MenuPageShell title="Welfare Event Attendance Approval"><Box sx={{ p: 2 }}><Message message={message} error={error} setMessage={setMessage} setError={setError} /><Grid container spacing={2} sx={{ mb: 2 }}>{Object.entries(summary).map(([key, value]) => <Grid item xs={12} md={4} key={key}><Card><CardContent><Typography color="text.secondary">{key}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid><Paper sx={{ p: 2, mb: 2 }}><DynamicFilters rows={rows} filters={filters} setFilters={setFilters} options={{ status: options.statuses, eventtype: options.eventTypes, academicyear: options.academicyears, program: options.programs, programcode: options.programcodes, semester: options.semesters, section: options.sections }} /><Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={load}>Load requests</Button><Button component="label" startIcon={<UploadFileIcon />}>Upload review documents<input hidden multiple type="file" onChange={upload} /></Button><Button variant="contained" color="success" disabled={!selected.length} onClick={() => review("Approved")}>Approve selected</Button><Button variant="outlined" color="error" disabled={!selected.length} onClick={() => review("Rejected")}>Reject selected</Button></Stack><TextField fullWidth multiline minRows={2} sx={{ mt: 2 }} label="Welfare comment" value={comment} onChange={(e) => setComment(e.target.value)} />{progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />}{docs.length > 0 && <Typography variant="body2" sx={{ mt: 1 }}>{docs.map((doc) => doc.title).join(", ")}</Typography>}</Paper>{loading && <LinearProgress sx={{ mb: 1 }} />}<Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(row) => row._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></MenuPageShell>;
}
