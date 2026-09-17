import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import RefreshIcon from "@mui/icons-material/Refresh";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];
const blankFilters = { academicyear: "", regulation: "", exam: "", examcode: "" };

const exportRows = (rows, filename) => {
  if (!rows?.length) return;
  const fields = Object.keys(rows[0]).filter((field) => !field.startsWith("_"));
  const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => `"${String(row[field] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function useScanningOptions() {
  const [options, setOptions] = useState({ academicyear: [], regulation: [], exams: [], roles: [], users: [] });
  const [error, setError] = useState("");
  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/conductexam/scanning-options", { params: { colid: global1.colid } });
      setOptions(res.data?.options || { academicyear: [], regulation: [], exams: [], roles: [], users: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scanning options.");
    }
  };
  useEffect(() => { loadOptions(); }, []);
  return { options, loadOptions, error, setError };
}

function FilterPanel({ filters, setFilters, options, onLoad, loading, children }) {
  const exams = useMemo(() => (options.exams || []).filter((row) => !filters.academicyear || row.academicyear === filters.academicyear), [options.exams, filters.academicyear]);
  const selectedExam = exams.find((row) => row.examcode === filters.examcode) || null;
  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Autocomplete options={options.academicyear || []} value={filters.academicyear || null} onChange={(_, value) => setFilters({ ...filters, academicyear: value || "", exam: "", examcode: "" })} renderInput={(params) => <TextField {...params} label="Academic Year" />} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Autocomplete options={options.regulation || []} value={filters.regulation || null} onChange={(_, value) => setFilters({ ...filters, regulation: value || "" })} renderInput={(params) => <TextField {...params} label="Regulation" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete options={exams} value={selectedExam} getOptionLabel={(option) => option?.label || ""} isOptionEqualToValue={(option, value) => option.examcode === value.examcode && option.academicyear === value.academicyear} onChange={(_, value) => setFilters({ ...filters, exam: value?.exam || "", examcode: value?.examcode || "" })} renderInput={(params) => <TextField {...params} label="Exam / Exam Code" />} />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button fullWidth variant="contained" onClick={onLoad} disabled={loading} sx={{ height: 56 }}>{loading ? "Loading..." : "Load"}</Button>
        </Grid>
        {children}
      </Grid>
    </Paper>
  );
}

const SummaryCard = ({ label, value, color = "#2563eb" }) => (
  <Card elevation={0} sx={{ color: "white", borderRadius: 2, minHeight: 112, background: `linear-gradient(135deg, ${color}, #111827)` }}>
    <CardContent>
      <Typography fontWeight={850}>{label}</Typography>
      <Typography variant="h4" fontWeight={950} sx={{ mt: 1 }}>{value || 0}</Typography>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }) => (
  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 330 }}>
    <Typography fontWeight={900} sx={{ mb: 1 }}>{title}</Typography>
    {children}
  </Paper>
);

export function ConductExamScanningAssignmentPage() {
  const { options, loadOptions, error: optionError, setError: setOptionError } = useScanningOptions();
  const [filters, setFilters] = useState(blankFilters);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [role, setRole] = useState("");
  const [scanner, setScanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const users = useMemo(() => (options.users || []).filter((user) => !role || user.role === role), [options.users, role]);

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/conductexam/scanning-attended-students", { params: { colid: global1.colid, ...filters } });
      setRows(res.data?.data || []);
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load attended students.");
    } finally {
      setLoading(false);
    }
  };

  const assign = async () => {
    if (!selectedIds.length || !scanner?.email) {
      setError("Select students and scanner user.");
      return;
    }
    try {
      setAssigning(true);
      setError("");
      const res = await ep1.post("/api/v2/conductexam/scanning-assign", {
        colid: global1.colid,
        ids: selectedIds,
        scannername: scanner.name,
        scanneremail: scanner.email,
        scannerrole: scanner.role,
        assignedby: global1.user,
        user: global1.user
      });
      setMessage(`${res.data?.assigned || 0} answer scripts assigned for scanning.`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign scanner.");
    } finally {
      setAssigning(false);
    }
  };

  const columns = [
    { field: "_id", headerName: "MongoDB ID", width: 230 },
    { field: "student", headerName: "Student", minWidth: 180, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 130 },
    { field: "program", headerName: "Program", width: 170 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", minWidth: 190, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 130 },
    { field: "examdate", headerName: "Exam Date", width: 120 },
    { field: "examslot", headerName: "Slot", width: 100 },
    { field: "examroom", headerName: "Room", width: 120 },
    { field: "seatno", headerName: "Seat No", width: 100 },
    { field: "assigned", headerName: "Assigned", width: 110 },
    { field: "scannername", headerName: "Scanner", width: 170 },
    { field: "scanningstatus", headerName: "Status", width: 120 }
  ];

  return (
    <MenuPageShell title="Scanning Assignment">
      <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={950}>Scanning Assignment</Typography>
            <Typography color="text.secondary">Load attended students and assign answer scripts to scanner users.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadOptions}>Refresh options</Button>
        </Stack>
        {(message || error || optionError) && <Alert severity={error || optionError ? "error" : "success"} sx={{ mb: 2 }} onClose={() => { setMessage(""); setError(""); setOptionError(""); }}>{error || optionError || message}</Alert>}
        <FilterPanel filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading}>
          <Grid item xs={12} md={2}>
            <Autocomplete options={options.roles || []} value={role || null} onChange={(_, value) => { setRole(value || ""); setScanner(null); }} renderInput={(params) => <TextField {...params} label="Filter User Role" />} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Autocomplete options={users} value={scanner} getOptionLabel={(option) => option ? `${option.name || ""} - ${option.email || ""} (${option.role || ""})` : ""} isOptionEqualToValue={(option, value) => option.email === value.email} onChange={(_, value) => setScanner(value)} renderInput={(params) => <TextField {...params} label="Scanner User" />} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" color="success" startIcon={<AssignmentTurnedInIcon />} onClick={assign} disabled={assigning || !selectedIds.length || !scanner} sx={{ height: 56 }}>
              {assigning ? "Assigning..." : `Assign Selected (${selectedIds.length})`}
            </Button>
          </Grid>
        </FilterPanel>
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <DataGrid rows={rows.map((row) => ({ ...row, id: row._id }))} columns={columns} loading={loading} checkboxSelection rowSelectionModel={selectedIds} onRowSelectionModelChange={(model) => setSelectedIds(Array.isArray(model) ? model : Array.from(model?.ids || []))} disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} sx={{ minHeight: 620, bgcolor: "white", "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function ConductExamScannerUploadPage() {
  const { options, error: optionError, setError: setOptionError } = useScanningOptions();
  const [filters, setFilters] = useState(blankFilters);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("Pending");
  const [activeRow, setActiveRow] = useState(null);
  const [answerbooklink, setAnswerbooklink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/conductexam/scanning-my-assignments", { params: { colid: global1.colid, scanneremail: global1.user || global1.email, ...filters } });
      setRows(res.data?.data || []);
      setActiveRow(null);
      setAnswerbooklink("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scanner assignments.");
    } finally {
      setLoading(false);
    }
  };

  const displayedRows = rows.filter((row) => row.status === tab);

  const uploadFile = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      setProgress(1);
      const data = new FormData();
      data.append("colid", global1.colid);
      data.append("file", file);
      const res = await ep1.post("/api/v2/conductexam/scanning-upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => setProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 50)
      });
      setAnswerbooklink(res.data?.data?.url || "");
      setMessage("Answer book uploaded. Click Update Answer Book to save it.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload answer book.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const saveLink = async () => {
    if (!activeRow?._id || !answerbooklink) {
      setError("Select an assignment and enter/upload answer book link.");
      return;
    }
    try {
      setUploading(true);
      const res = await ep1.post("/api/v2/conductexam/scanning-answerbook", {
        colid: global1.colid,
        id: activeRow._id,
        scanneremail: global1.user || global1.email,
        answerbooklink,
        user: global1.user
      });
      setMessage(`Answer book updated for MongoDB ID ${res.data?.data?.examrollid || activeRow.mongodbid}.`);
      await loadRows();
      setTab("Completed");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update answer book.");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { field: "mongodbid", headerName: "MongoDB ID", width: 230 },
    { field: "academicyear", headerName: "Academic Year", width: 130 },
    { field: "examcode", headerName: "Exam Code", width: 120 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "coursecode", headerName: "Course Code", width: 130 },
    { field: "examdate", headerName: "Exam Date", width: 120 },
    { field: "examslot", headerName: "Slot", width: 100 },
    { field: "examroom", headerName: "Room", width: 120 },
    { field: "seatno", headerName: "Seat No", width: 100 },
    { field: "invigilator", headerName: "Invigilator", width: 170 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "answerbooklink", headerName: "Answer Book", width: 130, renderCell: (params) => params.value ? <Button size="small" href={params.value} target="_blank">Open</Button> : "" },
    { field: "action", headerName: "Action", width: 130, sortable: false, renderCell: (params) => <Button size="small" variant="outlined" onClick={() => { setActiveRow(params.row); setAnswerbooklink(params.row.answerbooklink || ""); }}>Select</Button> }
  ];

  return (
    <MenuPageShell title="Scanner Upload">
      <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Typography variant="h4" fontWeight={950} sx={{ mb: 0.5 }}>Scanner Upload</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Only MongoDB ID and examination logistics are shown. Student identity is hidden.</Typography>
        {(message || error || optionError) && <Alert severity={error || optionError ? "error" : "success"} sx={{ mb: 2 }} onClose={() => { setMessage(""); setError(""); setOptionError(""); }}>{error || optionError || message}</Alert>}
        <FilterPanel filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label={`Pending (${rows.filter((row) => row.status === "Pending").length})`} value="Pending" />
            <Tab label={`Completed (${rows.filter((row) => row.status === "Completed").length})`} value="Completed" />
          </Tabs>
          <DataGrid rows={displayedRows} columns={columns} loading={loading} getRowId={(row) => row._id} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick sx={{ minHeight: 470, bgcolor: "white" }} />
        </Paper>
        {activeRow && (
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Update Answer Book for MongoDB ID: {activeRow.mongodbid}</Typography>
            {progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, height: 9, borderRadius: 999 }} />}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField fullWidth label="Answer Book Link" value={answerbooklink} onChange={(e) => setAnswerbooklink(e.target.value)} />
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={uploading} sx={{ minWidth: 180 }}>
                Upload AWS
                <input type="file" hidden onChange={(e) => uploadFile(e.target.files?.[0])} />
              </Button>
              <Button variant="contained" onClick={saveLink} disabled={uploading || !answerbooklink} sx={{ minWidth: 190 }}>
                {uploading ? "Working..." : "Update Answer Book"}
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}

function ReportShell({ title, children }) {
  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        {children}
      </Box>
    </MenuPageShell>
  );
}

export function ConductExamScanningProgressReportPage() {
  const { options, error: optionError, setError: setOptionError } = useScanningOptions();
  const [filters, setFilters] = useState(blankFilters);
  const [summary, setSummary] = useState({});
  const [roomwise, setRoomwise] = useState([]);
  const [programwise, setProgramwise] = useState([]);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/conductexam/scanning-progress-report", { params: { colid: global1.colid, ...filters } });
      setSummary(res.data?.summary || {});
      setRoomwise(res.data?.roomwise || []);
      setProgramwise(res.data?.programwise || []);
      setDetails(res.data?.details || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scanning report.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "mongodbid", headerName: "MongoDB ID", width: 230 },
    { field: "program", headerName: "Program", width: 170 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course Code", width: 130 },
    { field: "room", headerName: "Room", width: 220 },
    { field: "assigned", headerName: "Assigned", width: 110 },
    { field: "scanned", headerName: "Scanned", width: 110 }
  ];

  return (
    <ReportShell title="Scanning Assignment Report">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box><Typography variant="h4" fontWeight={950}>Scanning Assignment Report</Typography><Typography color="text.secondary">Roomwise, programwise and overall scanning status.</Typography></Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportRows(details, "scanning_assignment_report.csv")} disabled={!details.length}>Export</Button>
      </Stack>
      {(error || optionError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => { setError(""); setOptionError(""); }}>{error || optionError}</Alert>}
      <FilterPanel filters={filters} setFilters={setFilters} options={options} onLoad={loadReport} loading={loading} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}><SummaryCard label="Attended Students" value={summary.total} /></Grid>
        <Grid item xs={12} md={3}><SummaryCard label="Assigned" value={summary.assigned} color="#16a34a" /></Grid>
        <Grid item xs={12} md={3}><SummaryCard label="Scanned" value={summary.scanned} color="#7c3aed" /></Grid>
        <Grid item xs={12} md={3}><SummaryCard label="Pending" value={summary.pending} color="#dc2626" /></Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Programwise Scanning">
            <ResponsiveContainer width="100%" height="88%"><BarChart data={programwise}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="group" hide /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="assigned" fill="#2563eb" /><Bar dataKey="scanned" fill="#16a34a" /><Bar dataKey="pending" fill="#dc2626" /></BarChart></ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Roomwise Scanning">
            <ResponsiveContainer width="100%" height="88%"><BarChart data={roomwise}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="group" hide /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="assigned" fill="#2563eb" /><Bar dataKey="scanned" fill="#16a34a" /><Bar dataKey="pending" fill="#dc2626" /></BarChart></ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <DataGrid rows={details} columns={columns} loading={loading} getRowId={(row) => row.id} slots={{ toolbar: GridToolbar }} sx={{ minHeight: 520, bgcolor: "white" }} />
      </Paper>
    </ReportShell>
  );
}

export function ConductExamScannerReportPage() {
  const { options, error: optionError, setError: setOptionError } = useScanningOptions();
  const [filters, setFilters] = useState(blankFilters);
  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/conductexam/scanning-scanner-report", { params: { colid: global1.colid, ...filters } });
      setSummary(res.data?.summary || {});
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scanner report.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "scannername", headerName: "Scanner", width: 220 },
    { field: "scanneremail", headerName: "Scanner Email", width: 240 },
    { field: "scannerrole", headerName: "Role", width: 150 },
    { field: "assigned", headerName: "Assigned", type: "number", width: 130 },
    { field: "completed", headerName: "Completed", type: "number", width: 130 },
    { field: "pending", headerName: "Pending", type: "number", width: 130 }
  ];

  return (
    <ReportShell title="Scanner Report">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box><Typography variant="h4" fontWeight={950}>Scanner Report</Typography><Typography color="text.secondary">Scanner-wise assigned and completed answer scripts.</Typography></Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportRows(rows, "scanner_report.csv")} disabled={!rows.length}>Export</Button>
      </Stack>
      {(error || optionError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => { setError(""); setOptionError(""); }}>{error || optionError}</Alert>}
      <FilterPanel filters={filters} setFilters={setFilters} options={options} onLoad={loadReport} loading={loading} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}><SummaryCard label="Scanners" value={summary.scanners} /></Grid>
        <Grid item xs={12} md={3}><SummaryCard label="Assigned" value={summary.assigned} color="#16a34a" /></Grid>
        <Grid item xs={12} md={3}><SummaryCard label="Completed" value={summary.completed} color="#7c3aed" /></Grid>
        <Grid item xs={12} md={3}><SummaryCard label="Pending" value={summary.pending} color="#dc2626" /></Grid>
        <Grid item xs={12} md={7}>
          <ChartCard title="Scanner Workload">
            <ResponsiveContainer width="100%" height="88%"><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="scannername" hide /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="assigned" fill="#2563eb" /><Bar dataKey="completed" fill="#16a34a" /><Bar dataKey="pending" fill="#dc2626" /></BarChart></ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={5}>
          <ChartCard title="Overall Completion">
            <ResponsiveContainer width="100%" height="88%"><PieChart><Pie data={[{ name: "Completed", value: summary.completed || 0 }, { name: "Pending", value: summary.pending || 0 }]} dataKey="value" nameKey="name" outerRadius={90} label>{[0, 1].map((_, index) => <Cell key={index} fill={colors[index + 1]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <DataGrid rows={rows} columns={columns} loading={loading} getRowId={(row) => row.id} slots={{ toolbar: GridToolbar }} sx={{ minHeight: 520, bgcolor: "white" }} />
      </Paper>
    </ReportShell>
  );
}
