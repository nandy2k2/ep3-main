import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import PrintIcon from "@mui/icons-material/Print";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const filterFields = [
  "academicyear",
  "regulation",
  "exam",
  "examcode",
  "program",
  "programcode",
  "type",
  "subject",
  "semester",
  "course",
  "coursecode",
  "coursetype",
  "examdate",
  "examslot"
];

const labels = {
  academicyear: "Academic Year",
  regulation: "Regulation",
  exam: "Exam",
  examcode: "Exam Code",
  program: "Program",
  programcode: "Program Code",
  type: "Type",
  subject: "Subject",
  semester: "Semester",
  course: "Course",
  coursecode: "Course Code",
  coursetype: "Course Type",
  examdate: "Exam Date",
  examslot: "Exam Slot"
};

const colors = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0891b2", "#4b5563"];

const uniq = (items = []) => [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const countBy = (rows, key) => {
  const map = new Map();
  rows.forEach((row) => {
    const value = row[key] || "Blank";
    map.set(value, (map.get(value) || 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
};

const PrintHeader = ({ institution, title, subtitle }) => (
  <Box sx={{ textAlign: "center", mb: 2, color: "#000" }}>
    {institution?.logo && <Box component="img" src={institution.logo} alt="logo" sx={{ maxHeight: 58, objectFit: "contain", mb: 0.5 }} />}
    <Typography variant="h5" fontWeight={900}>{institution?.name || institution?.institution || institution?.institutionname || "Institution"}</Typography>
    <Typography variant="body2">{institution?.address || institution?.institutionaddress || ""}</Typography>
    {(institution?.phone || institution?.email) && <Typography variant="body2">{[institution.phone, institution.email].filter(Boolean).join(" | ")}</Typography>}
    <Typography variant="h6" fontWeight={900} sx={{ mt: 1, textTransform: "uppercase" }}>{title}</Typography>
    {subtitle && <Typography variant="body2">{subtitle}</Typography>}
  </Box>
);

const SummaryCard = ({ title, value, color = "#eff6ff" }) => (
  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, bgcolor: color, minHeight: 92 }}>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
    <Typography variant="h5" fontWeight={900}>{value}</Typography>
  </Paper>
);

export function ConductExamPopulateDatesPage() {
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ academicyear: "", examcode: "", exam: "", regulation: "", programcode: "", semester: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadExams(); }, []);

  const loadExams = async () => {
    try {
      const res = await ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } });
      setExams(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exams.");
    }
  };

  const academicYears = useMemo(() => uniq(exams.map((row) => row.academicyear)), [exams]);
  const examOptions = useMemo(() => exams.filter((row) => !form.academicyear || row.academicyear === form.academicyear), [exams, form.academicyear]);
  const optionFor = (key) => uniq(rows.map((row) => row[key]));

  const selectExam = (examcode) => {
    const exam = exams.find((row) => row.examcode === examcode && (!form.academicyear || row.academicyear === form.academicyear));
    setForm((prev) => ({ ...prev, examcode, exam: exam?.examname || exam?.exam || "" }));
  };

  const loadStatus = async () => {
    if (!form.academicyear || !form.examcode) {
      setError("Select academic year and exam.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const params = { colid: global1.colid, ...form };
      const res = await ep1.get("/api/v2/conductexam/examroll-date-population-status", { params });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || {});
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load date comparison.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = (model) => {
    if (Array.isArray(model)) return setSelectedIds(model);
    if (model?.ids instanceof Set) return setSelectedIds(model.type === "exclude" ? rows.map((row) => row.courseid).filter((id) => !model.ids.has(id)) : [...model.ids]);
    setSelectedIds([]);
  };

  const overrideDates = async () => {
    if (!selectedIds.length) {
      setError("Select at least one course.");
      return;
    }
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/conductexam/examroll-date-populate", {
        colid: global1.colid,
        academicyear: form.academicyear,
        examcode: form.examcode,
        courseIds: selectedIds,
        user: global1.user
      });
      setMessage(`Updated ${res.data?.updated || 0} exam roll row(s) from scheduler dates.`);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to populate exam roll dates.");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { field: "status", headerName: "Status", width: 150, renderCell: (params) => <Chip size="small" label={params.value} color={params.value === "Matched" ? "success" : params.value === "Mismatch" ? "error" : params.value === "Blank" ? "warning" : "default"} /> },
    { field: "program", headerName: "Program", width: 170 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "schedulerExamDate", headerName: "Scheduler Date", width: 140 },
    { field: "schedulerExamSlot", headerName: "Scheduler Slot", width: 170 },
    { field: "rollCount", headerName: "Rolls", width: 90, type: "number" },
    { field: "matchedCount", headerName: "Matched", width: 100, type: "number" },
    { field: "blankCount", headerName: "Blank", width: 90, type: "number" },
    { field: "mismatchCount", headerName: "Mismatch", width: 110, type: "number" },
    { field: "mismatchSample", headerName: "Mismatch Sample", width: 320 }
  ];

  return (
    <MenuPageShell title="Populate exam dates">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Typography variant="h5" fontWeight={900}>Populate exam dates</Typography>
          <Typography color="text.secondary">Compare exam course scheduler dates with exam roll dates, then override selected courses into exam roll.</Typography>
        </Paper>
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <Autocomplete options={academicYears} value={form.academicyear || null} onChange={(_, value) => setForm({ academicyear: value || "", examcode: "", exam: "", regulation: "", programcode: "", semester: "" })} renderInput={(params) => <TextField {...params} label="Academic Year" />} />
            </Grid>
            <Grid item xs={12} md={3.2}>
              <Autocomplete
                options={examOptions}
                value={examOptions.find((row) => row.examcode === form.examcode) || null}
                getOptionLabel={(option) => option ? `${option.examname || option.exam || ""} (${option.examcode || ""})` : ""}
                onChange={(_, value) => selectExam(value?.examcode || "")}
                renderInput={(params) => <TextField {...params} label="Exam" />}
              />
            </Grid>
            {["regulation", "programcode", "semester"].map((key) => (
              <Grid item xs={12} md={1.8} key={key}>
                <Autocomplete options={optionFor(key)} value={form[key] || null} onChange={(_, value) => setForm((prev) => ({ ...prev, [key]: value || "" }))} renderInput={(params) => <TextField {...params} label={labels[key]} />} />
              </Grid>
            ))}
            <Grid item xs={12} md={1.6}>
              <Button fullWidth variant="contained" onClick={loadStatus} disabled={loading} sx={{ height: 56 }}>{loading ? "Loading..." : "Load"}</Button>
            </Grid>
          </Grid>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => setSelectedIds(rows.filter((row) => ["Mismatch", "Blank"].includes(row.status) && row.schedulerExamDate && row.schedulerExamSlot).map((row) => row.courseid))}>Select mismatch/blank</Button>
            <Button variant="outlined" onClick={() => setSelectedIds(rows.filter((row) => row.schedulerExamDate && row.schedulerExamSlot).map((row) => row.courseid))}>Select all schedulable</Button>
            <Button variant="contained" startIcon={<SyncIcon />} disabled={processing || !selectedIds.length} onClick={overrideDates}>{processing ? "Updating..." : `Override dates (${selectedIds.length})`}</Button>
          </Stack>
        </Paper>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={2}><SummaryCard title="Courses" value={summary.courses || 0} /></Grid>
          <Grid item xs={12} md={2}><SummaryCard title="Roll Rows" value={summary.totalRolls || 0} color="#f0fdf4" /></Grid>
          <Grid item xs={12} md={2}><SummaryCard title="Matched" value={summary.matched || 0} color="#dcfce7" /></Grid>
          <Grid item xs={12} md={2}><SummaryCard title="Mismatch" value={summary.mismatched || 0} color="#fee2e2" /></Grid>
          <Grid item xs={12} md={2}><SummaryCard title="Blank Roll Dates" value={summary.blank || 0} color="#ffedd5" /></Grid>
          <Grid item xs={12} md={2}><SummaryCard title="No Roll Courses" value={summary.noRoll || 0} color="#f3f4f6" /></Grid>
        </Grid>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Box sx={{ height: 640 }}>
            <DataGrid
              rows={rows}
              getRowId={(row) => row.courseid}
              columns={columns}
              checkboxSelection
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={handleSelection}
              loading={loading}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function ConductExamCourseSchedulerReportPage() {
  const [exams, setExams] = useState([]);
  const [optionRows, setOptionRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [institution, setInstitution] = useState({});
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
    loadInstitution();
  }, []);

  const loadInstitution = async () => {
    try {
      const res = await ep1.get("/vins", { params: { colid: global1.colid } });
      setInstitution(res.data || {});
    } catch {
      setInstitution({});
    }
  };

  const loadOptions = async () => {
    try {
      const [examRes, courseRes] = await Promise.all([
        ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/conductexam/examcourses", { params: { colid: global1.colid } })
      ]);
      setExams(examRes.data?.data || []);
      setOptionRows(courseRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load filter options.");
    }
  };

  const valueOptions = (field) => uniq((optionRows.length ? optionRows : rows).map((row) => row[field]));
  const paramsFromFilters = () => {
    const params = { colid: global1.colid };
    filters.forEach((filter) => {
      if (filter.field && filter.value) params[filter.field] = filter.value;
    });
    return params;
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const res = await ep1.get("/api/v2/conductexam/examcourses", { params: paramsFromFilters() });
      setRows(res.data?.data || []);
      setMessage(`Loaded ${res.data?.data?.length || 0} scheduled course row(s).`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scheduler report.");
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => setFilters((prev) => [...prev, { field: "", value: "" }]);
  const updateFilter = (index, key, value) => setFilters((prev) => prev.map((row, idx) => idx === index ? { ...row, [key]: value, ...(key === "field" ? { value: "" } : {}) } : row));
  const removeFilter = (index) => setFilters((prev) => prev.filter((_, idx) => idx !== index));

  const datedRows = rows.filter((row) => row.examdate && row.examslot);
  const blankRows = rows.filter((row) => !row.examdate || !row.examslot);
  const programChart = countBy(rows, "programcode");
  const slotChart = countBy(rows, "examslot");
  const monthChart = countBy(rows.map((row) => ({ ...row, month: row.examdate ? String(row.examdate).slice(0, 7) : "Blank" })), "month");
  const statusChart = [
    { name: "Scheduled", value: datedRows.length },
    { name: "Blank", value: blankRows.length }
  ];

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 130 },
    { field: "regulation", headerName: "Regulation", width: 140 },
    { field: "exam", headerName: "Exam", width: 170 },
    { field: "examcode", headerName: "Exam Code", width: 130 },
    { field: "program", headerName: "Program", width: 170 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "type", headerName: "Type", width: 100 },
    { field: "subject", headerName: "Subject", width: 150 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "coursetype", headerName: "Course Type", width: 130 },
    { field: "examdate", headerName: "Exam Date", width: 130 },
    { field: "examslot", headerName: "Exam Slot", width: 170 }
  ];

  return (
    <MenuPageShell title="Exam course scheduler report">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} className="screen-only" sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Exam course scheduler report</Typography>
              <Typography color="text.secondary">Use dynamic filters to review scheduled courses, blank dates, slots, programs, and monthwise distribution.</Typography>
            </Box>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print Preview</Button>
          </Stack>
        </Paper>
        {message && <Alert className="screen-only" severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="screen-only" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper elevation={0} className="screen-only" sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack spacing={1.5}>
            {filters.map((filter, index) => (
              <Grid container spacing={1.5} key={`${filter.field}-${index}`}>
                <Grid item xs={12} md={4}>
                  <Autocomplete options={filterFields} value={filter.field || null} getOptionLabel={(option) => labels[option] || option || ""} onChange={(_, value) => updateFilter(index, "field", value || "")} renderInput={(params) => <TextField {...params} label="Filter Field" />} />
                </Grid>
                <Grid item xs={12} md={5}>
                  <Autocomplete options={valueOptions(filter.field)} value={filter.value || null} onChange={(_, value) => updateFilter(index, "value", value || "")} renderInput={(params) => <TextField {...params} label="Filter Value" />} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button fullWidth variant="outlined" color="error" onClick={() => removeFilter(index)} sx={{ height: 56 }} disabled={filters.length === 1}>Remove</Button>
                </Grid>
              </Grid>
            ))}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button variant="outlined" onClick={addFilter}>Add Filter</Button>
              <Button variant="contained" onClick={loadReport} disabled={loading}>{loading ? "Loading..." : "Load Report"}</Button>
              <TextField select label="Quick Exam" sx={{ minWidth: 300 }} value="" onChange={(e) => {
                const exam = exams.find((row) => row.examcode === e.target.value);
                setFilters([
                  { field: "academicyear", value: exam?.academicyear || "" },
                  { field: "examcode", value: exam?.examcode || "" }
                ]);
              }}>
                <MenuItem value="">Select exam</MenuItem>
                {exams.map((exam) => <MenuItem key={exam._id} value={exam.examcode}>{exam.academicyear} - {exam.examname || exam.exam} ({exam.examcode})</MenuItem>)}
              </TextField>
            </Stack>
          </Stack>
        </Paper>

        <Box className="print-area">
          <PrintHeader institution={institution} title="Exam Course Scheduler Report" subtitle={filters.filter((row) => row.field && row.value).map((row) => `${labels[row.field] || row.field}: ${row.value}`).join(" | ")} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><SummaryCard title="Total Courses" value={rows.length} /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Scheduled" value={datedRows.length} color="#dcfce7" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Blank Date/Slot" value={blankRows.length} color="#fee2e2" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Programs" value={uniq(rows.map((row) => row.programcode)).length} color="#fef3c7" /></Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 320 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Programwise Courses</Typography>
                <ResponsiveContainer width="100%" height={250}><BarChart data={programChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 320 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Monthwise Schedule</Typography>
                <ResponsiveContainer width="100%" height={250}><BarChart data={monthChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#16a34a" /></BarChart></ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 320 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Schedule Status</Typography>
                <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={statusChart} dataKey="value" nameKey="name" outerRadius={88} label>{statusChart.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 300 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Slotwise Courses</Typography>
                <ResponsiveContainer width="100%" height={230}><BarChart data={slotChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#f97316" /></BarChart></ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Details</Typography>
            <Box sx={{ height: 620 }}>
              <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick />
            </Box>
          </Paper>
        </Box>
        <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; color: #000 !important; } .print-area { position: absolute; left: 0; top: 0; width: 100%; background: #fff; } .screen-only, .MuiDataGrid-toolbarContainer, .MuiDataGrid-footerContainer { display: none !important; } }`}</style>
      </Box>
    </MenuPageShell>
  );
}
