import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import { timezoneOffsetLabel, timezoneOptions } from "../utils/nepLmsTimezone";

const password = "kumropatash";
const api = {
  options: "/api/v2/timetable-ai-rag/options",
  train: "/api/v2/timetable-ai-rag/train",
  batches: "/api/v2/timetable-ai-rag/batches",
  deleteBatches: "/api/v2/timetable-ai-rag/batches/delete",
  generate: "/api/v2/timetable-ai-rag/generate-from-models",
  generated: "/api/v2/timetable-ai-rag/generated",
  confirm: "/api/v2/timetable-ai-rag/confirm"
};
const cardColors = ["#2563eb", "#0f766e", "#f97316", "#7c3aed"];
const readable = (value, fallback = "") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      const loc = Array.isArray(item?.loc) ? item.loc.join(".") : item?.loc;
      return [loc, item?.msg || item?.message || item?.error, item?.type].filter(Boolean).join(": ") || JSON.stringify(item);
    }).join("; ");
  }
  if (typeof value === "object") return value.message || value.error || JSON.stringify(value);
  return String(value);
};
const errText = (err, fallback) => readable(err.response?.data?.message || err.response?.data?.detail || err.message, fallback);

async function loadDefaultServer() {
  const res = await ep1.get("/api/v2/epaathsala-ai", { params: { colid: global1.colid, active: "Yes" } });
  const rows = res.data?.data || [];
  const selected = rows.find((row) => row.default === "Yes" && row.active === "Yes") || rows.find((row) => row.active === "Yes") || rows[0];
  if (!selected?.server) throw new Error("Configure an active Epaathsala AI server in Settings > Epaathsala AI.");
  return selected.server;
}
const metricCard = (title, value, color) => <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}><CardContent><Typography color="text.secondary" fontWeight={800}>{title}</Typography><Typography variant="h4" fontWeight={950} sx={{ color }}>{value}</Typography></CardContent></Card>;
const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const sheets = {
    Programs: [{ program_id: "BTECH", program_name: "B.Tech Computer Engineering" }],
    Faculties: [{ faculty_id: "faculty@example.com", faculty_name: "Faculty Name", max_weekly_slots: 18, max_daily_slots: 6 }],
    Rooms: [{ room_id: "ROOM101", room_name: "Room 101", capacity: 60, room_type: "classroom" }],
    Courses: [{ course_id: "CS101", course_name: "Programming", required_room_type: "classroom" }],
    Sections: [{ section_id: "BTECH-S1-A", section_name: "B.Tech Sem 1 - A", program_id: "BTECH", semester: 1, student_count: 40 }],
    Section_Courses: [{ section_id: "BTECH-S1-A", course_id: "CS101", faculty_id: "faculty@example.com", sessions_per_week: 3, duration_slots: 1 }],
    Timeslots: [{ slot_id: "BTECH-MON-1", program_id: "BTECH", day: "Monday", start_time: "09:00", end_time: "10:00", order: 1 }],
    Availability: [{ entity_type: "faculty", entity_id: "faculty@example.com", slot_id: "BTECH-MON-1", available: true }],
    Historical_Schedule: [{ record_id: "H001", year: "2026", program_id: "BTECH", semester: 1, section_id: "BTECH-S1-A", course_id: "CS101", faculty_id: "faculty@example.com", room_id: "ROOM101", slot_id: "BTECH-MON-1", satisfaction_rating: 5 }]
  };
  Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name));
  XLSX.writeFile(wb, "timetable_ai_training_template.xlsx");
};

export function TrainTimetableAiRagPage() {
  const fileRef = useRef(null);
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem("timetableAiTrainingAuth") === "yes");
  const [pwd, setPwd] = useState("");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("append");
  const [server, setServer] = useState("");
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState([]);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ensureServer = async () => server || loadDefaultServer().then((value) => { setServer(value); return value; });
  const loadBatches = async () => {
    try {
      const ragserver = await ensureServer();
      const res = await ep1.get(api.batches, { params: { colid: global1.colid, ragserver } });
      setBatches(res.data?.data || []);
    } catch (err) { setError(errText(err, "Unable to load training batches")); }
  };
  useEffect(() => { if (authorized) loadBatches(); }, [authorized]);
  const unlock = () => {
    if (pwd === password) {
      sessionStorage.setItem("timetableAiTrainingAuth", "yes");
      setAuthorized(true);
      setPwd("");
    } else setError("Invalid password.");
  };
  const train = async () => {
    if (!file) return setError("Select timetable training Excel first.");
    try {
      setLoading(true); setError(""); setMessage(""); setProgress(8); setSteps([{ label: "Uploading workbook", value: 8 }]);
      const ragserver = await ensureServer();
      const timer = setInterval(() => setProgress((value) => Math.min(92, value + 7)), 350);
      const form = new FormData();
      form.append("file", file); form.append("mode", mode); form.append("colid", global1.colid); form.append("name", global1.name || ""); form.append("user", global1.user || ""); form.append("ragserver", ragserver);
      const res = await ep1.post(api.train, form, { headers: { "Content-Type": "multipart/form-data" } });
      clearInterval(timer);
      setProgress(100); setSteps(res.data?.progress || [{ label: "Training complete", value: 100 }]); setSummary(res.data?.summary || null); setMessage(res.data?.skipped ? res.data.message : "Timetable AI training completed."); loadBatches();
    } catch (err) { setError(errText(err, "Training failed")); } finally { setLoading(false); }
  };
  const deleteBatches = async () => {
    await ep1.post(api.deleteBatches, { colid: global1.colid, ids: selected });
    setSelected([]); setMessage("Selected batches deleted."); loadBatches();
  };
  const chartData = batches.slice(0, 8).reverse().map((row, index) => ({ name: row.batchid || `Batch ${index + 1}`, examples: row.total_examples || 0, historical: row.historical_schedule || 0 }));
  const columns = [
    { field: "batchid", headerName: "Batch", minWidth: 220, flex: 1 },
    { field: "filename", headerName: "File", minWidth: 180, flex: 1 },
    { field: "mode", headerName: "Mode", width: 100 },
    { field: "programs", headerName: "Programs", width: 110 },
    { field: "sections", headerName: "Sections", width: 110 },
    { field: "historical_schedule", headerName: "History rows", width: 130 },
    { field: "total_examples", headerName: "Examples", width: 120 },
    { field: "holdout_accuracy", headerName: "Accuracy", width: 120 },
    { field: "createdAt", headerName: "Trained on", minWidth: 190, valueGetter: (params) => params.row?.createdAt ? new Date(params.row.createdAt).toLocaleString() : "" }
  ];
  if (!authorized) return <MenuPageShell title="Train timetable RAG"><Box sx={{ p: 3, minHeight: "70vh", display: "flex", justifyContent: "center", alignItems: "center" }}><Paper sx={{ p: 3, maxWidth: 460, width: "100%" }}><Stack spacing={2}><Typography variant="h5" fontWeight={950}>Protected training page</Typography>{error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}<TextField autoFocus type="password" label="Password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} /><Button variant="contained" onClick={unlock}>Unlock page</Button></Stack></Paper></Box></MenuPageShell>;
  return <MenuPageShell title="Train timetable RAG"><Box sx={{ p: 3 }}><Stack spacing={2}><Paper sx={{ p: 2 }}><Typography variant="h4" fontWeight={950}>Train timetable RAG</Typography><Typography color="text.secondary">Upload an Excel workbook matching the Epaathsala timetable sheets. RAG server is loaded from Settings > Epaathsala AI.</Typography><Typography variant="body2">Epaathsala AI server: {server || "Not loaded"}</Typography></Paper>{message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}{error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}<Paper sx={{ p: 2 }}><Grid container spacing={2} alignItems="center"><Grid item xs={12} md={4}><Button fullWidth variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileRef.current?.click()}>{file ? file.name : "Select timetable Excel"}</Button><input hidden ref={fileRef} type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Mode" value={mode} onChange={(e) => setMode(e.target.value)}><MenuItem value="append">Append</MenuItem><MenuItem value="reset">Reset</MenuItem></TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={loading} onClick={train} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>{loading ? "Training..." : "Train"}</Button></Grid><Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={downloadTemplate}>Template</Button></Grid><Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" disabled={!selected.length} onClick={deleteBatches}>Bulk delete</Button></Grid><Grid item xs={12}><LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 6 }} /></Grid>{steps.map((step) => <Grid item xs={12} md={3} key={step.label}><Chip sx={{ width: "100%", justifyContent: "flex-start" }} color={step.value === 100 ? "success" : "primary"} label={`${step.label}: ${step.value}%`} /></Grid>)}</Grid></Paper><Grid container spacing={2}><Grid item xs={12} md={3}>{metricCard("Programs", summary?.programs ?? batches[0]?.programs ?? 0, cardColors[0])}</Grid><Grid item xs={12} md={3}>{metricCard("Sections", summary?.sections ?? batches[0]?.sections ?? 0, cardColors[1])}</Grid><Grid item xs={12} md={3}>{metricCard("History rows", summary?.historical_schedule ?? batches[0]?.historical_schedule ?? 0, cardColors[2])}</Grid><Grid item xs={12} md={3}>{metricCard("Examples", summary?.total_examples ?? batches[0]?.total_examples ?? 0, cardColors[3])}</Grid></Grid><Paper sx={{ p: 2, height: 300 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="examples" fill="#2563eb" /><Bar dataKey="historical" fill="#0f766e" /></BarChart></ResponsiveContainer></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={batches} getRowId={(row) => row._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(model) => setSelected(model)} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} /></Paper></Stack></Box></MenuPageShell>;
}

export function GenerateTimetableAiPage() {
  const [options, setOptions] = useState({});
  const [server, setServer] = useState("");
  const [form, setForm] = useState({ academicyear: "", regulation: "", programcodes: [], semesters: [], startdate: "", enddate: "", timezone: "Asia/Kolkata" });
  const [generated, setGenerated] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ensureServer = async () => server || loadDefaultServer().then((value) => { setServer(value); return value; });
  const loadOptions = async () => {
    const [opt, ragserver] = await Promise.all([ep1.get(api.options, { params: { colid: global1.colid } }), ensureServer().catch(() => "")]);
    setOptions(opt.data || {}); if (ragserver) setServer(ragserver);
  };
  useEffect(() => { loadOptions().catch((err) => setError(errText(err, "Unable to load options"))); }, []);
  const generate = async () => {
    try {
      setLoading(true); setError(""); setMessage("");
      const ragserver = await ensureServer();
      const res = await ep1.post(api.generate, { ...form, colid: global1.colid, name: global1.name, user: global1.user, ragserver });
      setGenerated(res.data?.data || null);
      setMessage(`Generated ${res.data?.data?.expandedrows?.length || 0} date-wise timetable rows for review.`);
    } catch (err) { setError(errText(err, "Unable to generate timetable")); } finally { setLoading(false); }
  };
  const confirm = async () => {
    try {
      if (!generated?._id) return setError("Generate a timetable first.");
      setLoading(true);
      const res = await ep1.post(api.confirm, { colid: global1.colid, id: generated._id, user: global1.user, timezone: form.timezone });
      setMessage(`Timetable inserted: ${res.data?.inserted || 0} rows.`);
      setGenerated((prev) => ({ ...prev, status: "Inserted", insertedcount: res.data?.inserted || 0 }));
    } catch (err) { setError(errText(err, "Unable to insert timetable")); } finally { setLoading(false); }
  };
  const loadHistory = async () => {
    const res = await ep1.get(api.generated, { params: { colid: global1.colid } });
    setHistory(res.data?.data || []);
  };
  const downloadPreview = () => {
    if (!generated) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(generated.timetable || []), "Generated_Timetable");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(generated.expandedrows || []), "ERP_Insert_Preview");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(generated.faculty_workload || []), "Faculty_Workload");
    XLSX.writeFile(wb, "ai_generated_timetable_preview.xlsx");
  };
  const timetableCols = ["day", "start_time", "end_time", "program_name", "semester", "section_name", "course_name", "faculty_name", "room_name", "preference_score"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["course_name", "faculty_name"].includes(field) ? 1 : 0 }));
  const expandedCols = ["classdate", "classtime", "timezone", "program", "programcode", "semester", "section", "course", "coursecode", "faculty", "roomno", "durationminutes"].map((field) => ({ field, headerName: field, minWidth: field === "timezone" ? 160 : 130, flex: ["course", "faculty"].includes(field) ? 1 : 0, valueGetter: (params) => field === "timezone" ? (params.row.timezone || form.timezone) : params.row[field] }));
  return <MenuPageShell title="Generate timetable AI"><Box sx={{ p: 3 }}><Stack spacing={2}><Paper sx={{ p: 2 }}><Typography variant="h4" fontWeight={950}>Generate timetable from ERP models</Typography><Typography color="text.secondary">Build the timetable input from workload, course map, periods, rooms, students and existing timetable history. Review before inserting into NEP LMS timetable.</Typography><Typography variant="body2">Epaathsala AI server: {server || "Not loaded"}</Typography></Paper>{message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}{error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}<Paper sx={{ p: 2 }}><Grid container spacing={2}><Grid item xs={12} md={2}><Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear} onInputChange={(_, value) => setForm((p) => ({ ...p, academicyear: value }))} renderInput={(p) => <TextField {...p} size="small" label="Academic year" />} /></Grid><Grid item xs={12} md={2}><Autocomplete freeSolo options={options.regulations || []} value={form.regulation} onInputChange={(_, value) => setForm((p) => ({ ...p, regulation: value }))} renderInput={(p) => <TextField {...p} size="small" label="Regulation" />} /></Grid><Grid item xs={12} md={3}><Autocomplete multiple disableCloseOnSelect options={options.programcodes || []} value={form.programcodes} onChange={(_, value) => setForm((p) => ({ ...p, programcodes: value }))} renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} />{option}</li>} renderInput={(p) => <TextField {...p} size="small" label="Program codes" />} /></Grid><Grid item xs={12} md={3}><Autocomplete multiple disableCloseOnSelect options={options.semesters || []} value={form.semesters} onChange={(_, value) => setForm((p) => ({ ...p, semesters: value }))} renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} />{option}</li>} renderInput={(p) => <TextField {...p} size="small" label="Semesters" />} /></Grid><Grid item xs={12} md={1}><TextField fullWidth type="date" size="small" label="From" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid><Grid item xs={12} md={1}><TextField fullWidth type="date" size="small" label="To" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((p) => ({ ...p, enddate: e.target.value }))} /></Grid><Grid item xs={12} md={4}><TextField select fullWidth size="small" label="Timezone" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{timezoneOptions.map((item) => <MenuItem key={item} value={item}>{item} ({timezoneOffsetLabel(item)})</MenuItem>)}</TextField></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" disabled={loading} onClick={generate} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>Generate timetable</Button><Button variant="contained" color="success" disabled={!generated || generated.status === "Inserted" || loading} onClick={confirm}>Approve and add timetable</Button><Button variant="outlined" disabled={!generated} onClick={downloadPreview}>Download preview Excel</Button><Button variant="outlined" onClick={loadHistory}>Load generation history</Button></Stack></Grid></Grid></Paper>{loading && <LinearProgress />}<Grid container spacing={2}><Grid item xs={12} md={3}>{metricCard("Weekly classes", generated?.timetable?.length || 0, cardColors[0])}</Grid><Grid item xs={12} md={3}>{metricCard("Rows to insert", generated?.expandedrows?.length || 0, cardColors[1])}</Grid><Grid item xs={12} md={3}>{metricCard("Unscheduled", generated?.unscheduled?.length || 0, cardColors[2])}</Grid><Grid item xs={12} md={3}>{metricCard("Quality", generated?.quality_score ?? "-", cardColors[3])}</Grid></Grid>{generated && <><Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ p: 1 }}>Generated weekly timetable</Typography><DataGrid autoHeight rows={generated.timetable || []} getRowId={(row) => `${row.program_id}-${row.section_id}-${row.course_id}-${row.slot_id}-${row.faculty_id}-${row.room_id}`} columns={timetableCols} slots={{ toolbar: GridToolbar }} /></Paper><Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ p: 1 }}>Date-wise rows that will be inserted</Typography><DataGrid autoHeight rows={(generated.expandedrows || []).map((row, index) => ({ ...row, _previewid: `${row.classdate}-${row.programcode}-${row.semester}-${row.section}-${row.coursecode}-${row.classtime}-${index}` }))} getRowId={(row) => row._previewid} columns={expandedCols} slots={{ toolbar: GridToolbar }} /></Paper><Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ p: 1 }}>Unscheduled / warnings</Typography><DataGrid autoHeight rows={(generated.unscheduled || []).map((row, index) => ({ ...row, _previewid: row.id || `${row.course_id || "item"}-${row.section_id || "section"}-${index}` }))} getRowId={(row) => row._previewid} columns={Object.keys((generated.unscheduled || [])[0] || { message: "" }).map((field) => ({ field, headerName: field, minWidth: 140, flex: 1 }))} slots={{ toolbar: GridToolbar }} /></Paper></>}{history.length > 0 && <Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ p: 1 }}>Generation history</Typography><DataGrid autoHeight rows={history} getRowId={(row) => row._id} columns={["generationid", "academicyear", "regulation", "status", "quality_score", "insertedcount", "createdAt"].map((field) => ({ field, headerName: field, minWidth: 150, flex: field === "generationid" ? 1 : 0 }))} slots={{ toolbar: GridToolbar }} /></Paper>}</Stack></Box></MenuPageShell>;
}
