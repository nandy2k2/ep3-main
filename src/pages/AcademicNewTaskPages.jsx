import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
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
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const colors = ["#2563eb", "#16a34a", "#f97316", "#9333ea", "#dc2626", "#0f766e", "#ca8a04"];
const blank = { academicyear: "", faculty: "", facultyemail: "", task: "", category: "", criticality: "Normal", pagelink: "", startdate: "", duedate: "", status: "New", comments: "" };
const statusOptions = ["New", "In process", "Completed"];
const criticalityOptions = ["Low", "Normal", "High", "Critical"];
const filterFields = ["academicyear", "faculty", "facultyemail", "category", "criticality", "status"];

const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, createdby: global1.name });
const dateValue = (value) => value ? String(value).slice(0, 10) : "";
const fmtDate = (value) => value ? new Date(value).toLocaleDateString() : "";
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const routeTo = (link) => {
  const value = String(link || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
};
const normalizeStatus = (value) => {
  if (/^completed$/i.test(String(value || ""))) return "Completed";
  if (/^(in\s*process|in\s*progress)$/i.test(String(value || ""))) return "In process";
  return "New";
};

const parseCsv = (text) => {
  const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
};

const makeColumns = (onEdit) => [
  { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
  { field: "faculty", headerName: "Faculty", minWidth: 180, flex: 1 },
  { field: "facultyemail", headerName: "Faculty Email", minWidth: 210, flex: 1 },
  { field: "task", headerName: "Task", minWidth: 260, flex: 1.4 },
  {
    field: "pagelink",
    headerName: "Page Link",
    minWidth: 130,
    renderCell: (params) => routeTo(params.row.pagelink)
      ? <Button size="small" component={RouterLink} to={routeTo(params.row.pagelink)}>Open</Button>
      : <Typography variant="caption" color="text.secondary">-</Typography>
  },
  { field: "category", headerName: "Category", minWidth: 150 },
  { field: "criticality", headerName: "Criticality", minWidth: 130 },
  { field: "startdate", headerName: "Start Date", minWidth: 120, valueGetter: (params) => fmtDate(params.row.startdate) },
  { field: "duedate", headerName: "Due Date", minWidth: 120, valueGetter: (params) => fmtDate(params.row.duedate) },
  { field: "status", headerName: "Status", minWidth: 130 },
  { field: "comments", headerName: "Comments", minWidth: 240, flex: 1 },
  ...(onEdit ? [{
    field: "actions",
    type: "actions",
    headerName: "Actions",
    width: 80,
    getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => onEdit(params.row)} />]
  }] : [])
];

function DynamicFilters({ filters, setFilters, options, onLoad }) {
  const addFilter = () => setFilters((prev) => [...prev, { field: "", value: "" }]);
  const update = (index, patch) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  const remove = (index) => setFilters((prev) => prev.filter((_, i) => i !== index));
  const valuesFor = (field) => {
    if (field === "academicyear") return options.academicyears || [];
    if (field === "category") return options.categories || [];
    if (field === "criticality") return options.criticalities || criticalityOptions;
    if (field === "status") return options.statuses || [];
    if (field === "faculty") return (options.faculties || []).map((item) => item.name).filter(Boolean);
    if (field === "facultyemail") return (options.faculties || []).map((item) => item.email).filter(Boolean);
    return [];
  };
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Typography fontWeight={900}>Dynamic Filters</Typography>
        <Button size="small" variant="outlined" onClick={addFilter}>Add filter</Button>
        <Button size="small" variant="contained" onClick={onLoad}>Load</Button>
      </Stack>
      <Grid container spacing={1}>
        {filters.map((filter, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => update(index, { field: e.target.value, value: "" })}>
                {filterFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={7}>
              <Autocomplete
                freeSolo
                options={valuesFor(filter.field)}
                value={filter.value || ""}
                onInputChange={(_, value) => update(index, { value })}
                renderInput={(params) => <TextField {...params} size="small" label="Value" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth color="error" variant="outlined" onClick={() => remove(index)}>Remove</Button>
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Paper>
  );
}

export function AcademicNewTaskPage() {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [options, setOptions] = useState({ academicyears: [], categories: [], criticalities: [], statuses: [], faculties: [] });
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/academic-new-tasks/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/academic-new-tasks", { params: paramsFromFilters() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const save = async () => {
    setLoading(true);
    setError("");
    try {
      await ep1.post("/api/v2/academic-new-tasks", withScope({ ...form, id: editId }));
      setMessage(editId ? "Task updated" : "Task saved");
      setForm(blank);
      setEditId("");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save task");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditId(row._id);
    setForm({ ...blank, ...row, criticality: row.criticality || "Normal", status: normalizeStatus(row.status), startdate: dateValue(row.startdate), duedate: dateValue(row.duedate) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async () => {
    if (!selection.length) return setError("Select tasks to delete");
    if (!window.confirm("Delete selected tasks?")) return;
    await ep1.post("/api/v2/academic-new-tasks-delete", withScope({ ids: selection }));
    setSelection([]);
    setMessage("Selected tasks deleted");
    await loadRows();
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      await ep1.post("/api/v2/academic-new-tasks-bulk", withScope({ rows: Array.isArray(rows) ? rows : [rows] }));
      setMessage("Bulk upload completed");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload tasks");
    } finally {
      event.target.value = "";
    }
  };
  const downloadTemplate = () => {
    const headers = ["academicyear", "faculty", "facultyemail", "task", "category", "criticality", "pagelink", "startdate", "duedate", "status", "comments"];
    const blob = new Blob([`${headers.join(",")}\n2026-27,Faculty Name,faculty@example.com,Submit lesson plan,LMS,High,/neplmscourseworkspace,2026-08-01,2026-08-15,New,Initial task`], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "academic_task_template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <MenuPageShell title="Task New">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit Task" : "Add Task"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear} onInputChange={(_, value) => setField("academicyear", value)} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
            <Grid item xs={12} md={5}><Autocomplete options={options.faculties || []} getOptionLabel={(option) => typeof option === "string" ? option : `${option.name || ""} ${option.email || ""}`.trim()} value={(options.faculties || []).find((item) => item.email === form.facultyemail) || null} onChange={(_, value) => { setField("faculty", value?.name || ""); setField("facultyemail", value?.email || ""); }} renderInput={(params) => <TextField {...params} label="Faculty" />} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Faculty Email" value={form.facultyemail} onChange={(e) => setField("facultyemail", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Task" value={form.task} onChange={(e) => setField("task", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.categories || []} value={form.category} onInputChange={(_, value) => setField("category", value)} renderInput={(params) => <TextField {...params} label="Category" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.criticalities || criticalityOptions} value={form.criticality} onInputChange={(_, value) => setField("criticality", value)} renderInput={(params) => <TextField {...params} label="Criticality" />} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Page Link" value={form.pagelink} onChange={(e) => setField("pagelink", e.target.value)} placeholder="/neplmscourseworkspace" /></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setField("status", e.target.value)}>{(options.statuses || statusOptions).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth label="Start Date" value={form.startdate} onChange={(e) => setField("startdate", e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth label="Due Date" value={form.duedate} onChange={(e) => setField("duedate", e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Comments" value={form.comments} onChange={(e) => setField("comments", e.target.value)} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            <Button variant="contained" onClick={save} disabled={loading}>{editId ? "Update" : "Save"}</Button>
            <Button variant="outlined" onClick={() => { setEditId(""); setForm(blank); }}>Clear</Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>Bulk Upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={remove}>Bulk Delete</Button>
          </Stack>
        </Paper>
        <DynamicFilters filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} />
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: 520 }}>
            <DataGrid rows={rows} columns={makeColumns(edit)} getRowId={(row) => row._id} loading={loading} checkboxSelection onRowSelectionModelChange={(ids) => setSelection(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "academic_tasks" } } }} disableRowSelectionOnClick sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }} />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

const CardStat = ({ label, value, color }) => (
  <Card sx={{ borderTop: `4px solid ${color}`, height: "100%" }}><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card>
);

const taskTabMap = ["open", "overdue", "completed"];

export function MyAcademicTasksPage() {
  const [options, setOptions] = useState({ academicyears: [], categories: [] });
  const [academicyear, setAcademicyear] = useState("");
  const [category, setCategory] = useState("");
  const [tab, setTab] = useState(0);
  const [data, setData] = useState({ open: [], overdue: [], completed: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/academic-new-tasks/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/academic-new-tasks/my", {
        params: { colid: global1.colid, facultyemail: global1.user, academicyear, category }
      });
      setData(res.data || { open: [], overdue: [], completed: [], summary: {} });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your tasks");
    } finally {
      setLoading(false);
    }
  }, [academicyear, category]);

  useEffect(() => { loadOptions().catch(() => {}); loadTasks(); }, []);

  const rows = data[taskTabMap[tab]] || [];
  const summary = data.summary || {};

  return (
    <MenuPageShell title="My Tasks">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={options.academicyears || []}
              value={academicyear}
              onInputChange={(_, value) => setAcademicyear(value)}
              renderInput={(params) => <TextField {...params} label="Academic Year" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={options.categories || []}
              value={category}
              onInputChange={(_, value) => setCategory(value)}
              renderInput={(params) => <TextField {...params} label="Category" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={loadTasks} disabled={loading}>Load</Button>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><CardStat label="Open" value={summary.open || 0} color="#2563eb" /></Grid>
          <Grid item xs={12} md={4}><CardStat label="Overdue" value={summary.overdue || 0} color="#dc2626" /></Grid>
          <Grid item xs={12} md={4}><CardStat label="Completed" value={summary.completed || 0} color="#16a34a" /></Grid>
        </Grid>
        <Paper sx={{ p: 2 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label={`Open (${summary.open || 0})`} />
            <Tab label={`Overdue (${summary.overdue || 0})`} />
            <Tab label={`Completed (${summary.completed || 0})`} />
          </Tabs>
          <Box sx={{ height: 620 }}>
            <DataGrid
              rows={rows}
              columns={makeColumns()}
              getRowId={(row) => row._id}
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `my_tasks_${taskTabMap[tab]}` } } }}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }}
            />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function AcademicNewTaskReportPage() {
  const [options, setOptions] = useState({ academicyears: [], categories: [], criticalities: [], statuses: [], faculties: [] });
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [report, setReport] = useState({ rows: [], summary: {}, institution: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());
  useEffect(() => {
    ep1.get("/api/v2/academic-new-tasks/options", { params: withScope() }).then((res) => setOptions(res.data || {})).catch(() => {});
  }, []);
  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/academic-new-tasks-report", { params: paramsFromFilters() });
      setReport(res.data || { rows: [], summary: {} });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    } finally {
      setLoading(false);
    }
  };
  const summary = report.summary || {};
  const institution = report.institution || {};
  return (
    <MenuPageShell title="Task New Report">
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <DynamicFilters filters={filters} setFilters={setFilters} options={options} onLoad={loadReport} />
        <Paper className="print-header" sx={{ p: 2, display: "none", "@media print": { display: "block" } }}>
          <Typography variant="h5" fontWeight={900}>{institution.institutionname || institution.name || "Institution"}</Typography>
          <Typography>{institution.address || ""}</Typography>
          <Typography variant="h6" fontWeight={900}>Task Report</Typography>
        </Paper>
        <Stack direction="row" justifyContent="flex-end"><Button startIcon={<PrintIcon />} variant="outlined" onClick={() => window.print()}>Print Preview</Button></Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><CardStat label="Total Tasks" value={summary.total || 0} color="#2563eb" /></Grid>
          <Grid item xs={12} md={3}><CardStat label="Not Completed" value={summary.pending || 0} color="#f97316" /></Grid>
          <Grid item xs={12} md={3}><CardStat label="Completed" value={summary.completed || 0} color="#16a34a" /></Grid>
          <Grid item xs={12} md={3}><CardStat label="Overdue" value={summary.overdue || 0} color="#dc2626" /></Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900}>Categorywise Tasks</Typography><ResponsiveContainer><BarChart data={summary.byCategory || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></Paper></Grid>
          <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900}>Criticality</Typography><ResponsiveContainer><BarChart data={summary.byCriticality || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#dc2626" /></BarChart></ResponsiveContainer></Paper></Grid>
          <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900}>Status Distribution</Typography><ResponsiveContainer><PieChart><Pie data={summary.byStatus || []} dataKey="count" nameKey="name" outerRadius={105} label>{(summary.byStatus || []).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Paper></Grid>
        </Grid>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: 560 }}>
            <DataGrid rows={report.rows || []} columns={makeColumns()} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "academic_task_report" } } }} sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }} />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
