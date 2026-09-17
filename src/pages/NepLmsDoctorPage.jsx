import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
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
import DownloadIcon from "@mui/icons-material/Download";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GroupsIcon from "@mui/icons-material/Groups";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const colors = ["#16a34a", "#dc2626", "#2563eb", "#f59e0b", "#7c3aed", "#0891b2"];
const emptyFilters = { academicyear: "", regulation: "", program: "", programcode: "" };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stages = [
  { label: "Validating selected filters", percent: 10 },
  { label: "Fetching workload, timetable and student data", percent: 28 },
  { label: "Matching faculty workload with student records", percent: 48 },
  { label: "Checking sectionwise timetable month by month", percent: 68 },
  { label: "Preparing summary, charts and print data", percent: 88 },
  { label: "Completed", percent: 100 }
];

const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;"
}[char]));

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

const StatusChip = ({ value }) => {
  const ready = value === true || String(value || "").toLowerCase() === "ready";
  return (
    <Chip
      size="small"
      label={value === true ? "Ready" : value || "Pending"}
      color={ready ? "success" : "error"}
      variant={ready ? "filled" : "outlined"}
      sx={{ fontWeight: 800 }}
    />
  );
};

const ChartCard = ({ title, children }) => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", height: 340 }}>
    <Typography fontWeight={900} sx={{ mb: 1 }}>{title}</Typography>
    {children}
  </Paper>
);

const LoadingPanel = ({ label }) => (
  <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 2, border: "1px dashed #cbd5e1", bgcolor: "white" }}>
    <Typography fontWeight={850}>{label}</Typography>
    <Typography variant="body2" color="text.secondary">This section will appear as soon as the LMS doctor prepares it.</Typography>
  </Paper>
);

const popupLinks = [
  { label: "Student data upload", path: "/studentdataupload" },
  { label: "Workload", path: "/workloadassignment" },
  { label: "Timetable sectionwise", path: "/neplmssectionwisetimetable" }
];

export default function NepLmsDoctorPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [options, setOptions] = useState({});
  const [summary, setSummary] = useState({});
  const [charts, setCharts] = useState({});
  const [facultySummary, setFacultySummary] = useState([]);
  const [courseDetails, setCourseDetails] = useState([]);
  const [timetableDetails, setTimetableDetails] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [visibleSections, setVisibleSections] = useState({
    cards: false,
    charts: false,
    faculty: false,
    courses: false,
    timetable: false
  });
  const [error, setError] = useState("");
  const [popup, setPopup] = useState(null);

  const requestParams = useMemo(() => ({
    colid: global1.colid,
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
  }), [filters]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async (nextFilters = filters) => {
    try {
      const res = await ep1.get("/api/v2/neplms/lms-doctor/options", {
        params: {
          colid: global1.colid,
          ...Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value))
        }
      });
      setOptions(res.data?.options || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load LMS doctor filter options.");
    }
  };

  const setFilter = (field, value) => {
    const next = {
      ...filters,
      [field]: value || "",
      ...(field === "program" ? { programcode: "" } : {})
    };
    setFilters(next);
    loadOptions(next);
  };

  const runDoctor = async () => {
    setError("");
    if (!filters.academicyear || !filters.regulation || !filters.programcode) {
      setError("Please select academic year, regulation and program code before running LMS doctor.");
      return;
    }
    setLoading(true);
    setVisibleSections({ cards: false, charts: false, faculty: false, courses: false, timetable: false });
    setSummary({});
    setCharts({});
    setFacultySummary([]);
    setCourseDetails([]);
    setTimetableDetails([]);
    setProgress(stages[0].percent);
    setStage(stages[0].label);
    let stageIndex = 1;
    const timer = setInterval(() => {
      const nextStage = stages[Math.min(stageIndex, stages.length - 2)];
      setStage(nextStage.label);
      setProgress((prev) => Math.max(prev, nextStage.percent));
      stageIndex += 1;
    }, 900);
    try {
      const res = await ep1.get("/api/v2/neplms/lms-doctor/report", { params: requestParams });
      clearInterval(timer);
      setInstitution(res.data?.institution || null);
      setStage("Loading summary cards");
      setProgress(92);
      setSummary(res.data?.summary || {});
      setVisibleSections((prev) => ({ ...prev, cards: true }));
      await sleep(80);
      setStage("Loading charts");
      setProgress(94);
      setCharts(res.data?.charts || {});
      setVisibleSections((prev) => ({ ...prev, charts: true }));
      await sleep(80);
      setStage("Loading faculty summary");
      setProgress(96);
      setFacultySummary(res.data?.facultySummary || []);
      setVisibleSections((prev) => ({ ...prev, faculty: true }));
      await sleep(80);
      setStage("Loading course diagnostics");
      setProgress(98);
      setCourseDetails(res.data?.courseDetails || []);
      setVisibleSections((prev) => ({ ...prev, courses: true }));
      await sleep(80);
      setStage("Loading sectionwise timetable diagnostics");
      setTimetableDetails(res.data?.timetableDetails || []);
      setVisibleSections((prev) => ({ ...prev, timetable: true }));
      await sleep(80);
      setStage(stages[5].label);
      setProgress(100);
    } catch (err) {
      clearInterval(timer);
      setSummary({});
      setCharts({});
      setFacultySummary([]);
      setCourseDetails([]);
      setTimetableDetails([]);
      setVisibleSections({ cards: false, charts: false, faculty: false, courses: false, timetable: false });
      setError(err.response?.data?.message || "Unable to run LMS doctor.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setStage("");
      }, 1500);
    }
  };

  const dropdown = (field, label) => (
    <Grid item xs={12} sm={6} md={3}>
      <Autocomplete
        options={options[field] || []}
        value={filters[field] || null}
        onChange={(_, value) => setFilter(field, value)}
        renderInput={(params) => <TextField {...params} label={label} />}
      />
    </Grid>
  );

  const cards = [
    { label: "Faculty", value: summary.totalFaculty || 0, icon: GroupsIcon, tone: "#2563eb" },
    { label: "Courses Checked", value: summary.totalCourses || 0, icon: SchoolIcon, tone: "#7c3aed" },
    { label: "Fully Ready", value: summary.readyCourses || 0, icon: FactCheckIcon, tone: "#16a34a" },
    { label: "Not Ready", value: summary.notReadyCourses || 0, icon: WarningAmberIcon, tone: "#dc2626" },
    { label: "Workload Mismatch", value: summary.workloadNotReady || 0, icon: WarningAmberIcon, tone: "#f59e0b" },
    { label: "Timetable Mismatch", value: summary.timetableNotReady || 0, icon: WarningAmberIcon, tone: "#0891b2" }
  ];

  const facultyColumns = [
    { field: "facultyname", headerName: "Faculty", minWidth: 210, flex: 1 },
    { field: "facultyemail", headerName: "Email", minWidth: 220 },
    { field: "coursecount", headerName: "Courses", type: "number", minWidth: 110 },
    { field: "readycourses", headerName: "Ready", type: "number", minWidth: 100 },
    { field: "notreadycourses", headerName: "Not Ready", type: "number", minWidth: 120 },
    { field: "workloadreadycourses", headerName: "Student Map Ready", type: "number", minWidth: 160 },
    { field: "workloaddriftcourses", headerName: "Student Map Pending", type: "number", minWidth: 170 },
    { field: "timetablereadycourses", headerName: "Timetable Ready", type: "number", minWidth: 150 },
    { field: "timetabledriftcourses", headerName: "Timetable Pending", type: "number", minWidth: 165 },
    { field: "readinesspercent", headerName: "Ready %", type: "number", minWidth: 110 },
    { field: "courses", headerName: "Course List", minWidth: 320, flex: 1 }
  ];

  const courseColumns = [
    { field: "ready", headerName: "Overall", minWidth: 120, renderCell: (params) => <StatusChip value={params.value ? "Ready" : "Not ready"} /> },
    { field: "workloadstatus", headerName: "Student Mapping", minWidth: 150, renderCell: (params) => <StatusChip value={params.value} /> },
    { field: "timetablestatus", headerName: "Timetable", minWidth: 180, renderCell: (params) => <StatusChip value={params.value} /> },
    { field: "facultyname", headerName: "Faculty", minWidth: 200, flex: 1 },
    { field: "facultyemail", headerName: "Email", minWidth: 220 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    { field: "type", headerName: "Major/Type", minWidth: 120 },
    { field: "subject", headerName: "Subject", minWidth: 150 },
    { field: "coursecode", headerName: "Course Code", minWidth: 130 },
    { field: "course", headerName: "Course", minWidth: 240, flex: 1 },
    { field: "workloadstudentcount", headerName: "Students", type: "number", minWidth: 115 },
    { field: "timetableclasscount", headerName: "Classes", type: "number", minWidth: 105 },
    { field: "timetablegroups", headerName: "Section Months", type: "number", minWidth: 145 },
    { field: "remarks", headerName: "Mismatch Section", minWidth: 360, flex: 1 }
  ];

  const timetableColumns = [
    { field: "status", headerName: "Status", minWidth: 130, renderCell: (params) => <StatusChip value={params.value} /> },
    { field: "facultyname", headerName: "Faculty", minWidth: 200, flex: 1 },
    { field: "facultyemail", headerName: "Email", minWidth: 220 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    { field: "section", headerName: "Section", minWidth: 120 },
    { field: "month", headerName: "Month", minWidth: 130 },
    { field: "coursecode", headerName: "Course Code", minWidth: 130 },
    { field: "course", headerName: "Course", minWidth: 240, flex: 1 },
    { field: "classcount", headerName: "Classes", type: "number", minWidth: 105 },
    { field: "studentcount", headerName: "Matching Students", type: "number", minWidth: 160 }
  ];

  const printPreview = () => {
    const inst = institution || {};
    const logo = inst.logo || inst.logolink || inst.filelink || "";
    const headerLines = [inst.address, inst.phone || inst.mobile, inst.email, inst.website].filter(Boolean).join(" | ");
    const htmlRows = (rows, fields) => rows.map((row, index) => `<tr><td>${index + 1}</td>${fields.map((field) => `<td>${safe(row[field])}</td>`).join("")}</tr>`).join("");
    const html = `
      <html>
      <head>
        <title>LMS Doctor</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; background: #fff; margin: 0; }
          .actions { padding: 12px; text-align: right; border-bottom: 1px solid #ddd; }
          .actions button { margin-left: 8px; padding: 8px 14px; }
          .page { padding: 18mm 14mm; }
          .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
          .logo { max-height: 70px; max-width: 110px; object-fit: contain; }
          h1 { margin: 5px 0; font-size: 22px; }
          h2 { text-align: center; font-size: 18px; margin: 14px 0; }
          .meta, .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
          .box { border: 1px solid #111; padding: 8px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 11px; }
          th, td { border: 1px solid #111; padding: 5px; text-align: left; vertical-align: top; }
          th { background: #f2f2f2; }
          .ok { color: #047857; font-weight: 700; }
          .bad { color: #b91c1c; font-weight: 700; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            .actions { display: none; }
            .page { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
        <div class="page">
          <div class="header">
            ${logo ? `<img class="logo" src="${safe(logo)}" />` : ""}
            <h1>${safe(inst.institutionname || inst.institution || "Institution")}</h1>
            <div>${safe(headerLines)}</div>
            <h2>LMS Doctor Report</h2>
          </div>
          <div class="meta">
            <div class="box"><b>Academic Year</b><br />${safe(filters.academicyear)}</div>
            <div class="box"><b>Regulation</b><br />${safe(filters.regulation)}</div>
            <div class="box"><b>Program</b><br />${safe(filters.program)}</div>
            <div class="box"><b>Program Code</b><br />${safe(filters.programcode)}</div>
          </div>
          <div class="cards">
            ${cards.map((card) => `<div class="box"><b>${safe(card.label)}</b><br />${safe(card.value)}</div>`).join("")}
          </div>
          <h2>Faculty Summary</h2>
          <table><thead><tr><th>Sr</th><th>Faculty</th><th>Email</th><th>Courses</th><th>Ready</th><th>Not Ready</th><th>Ready %</th><th>Course List</th></tr></thead><tbody>
            ${htmlRows(facultySummary, ["facultyname", "facultyemail", "coursecount", "readycourses", "notreadycourses", "readinesspercent", "courses"])}
          </tbody></table>
          <h2>Course Diagnostic</h2>
          <table><thead><tr><th>Sr</th><th>Faculty</th><th>Semester</th><th>Subject</th><th>Course Code</th><th>Course</th><th>Students</th><th>Classes</th><th>Student Mapping</th><th>Timetable</th><th>Remarks</th></tr></thead><tbody>
            ${htmlRows(courseDetails, ["facultyname", "semester", "subject", "coursecode", "course", "workloadstudentcount", "timetableclasscount", "workloadstatus", "timetablestatus", "remarks"])}
          </tbody></table>
          <h2>Sectionwise Monthwise Timetable Diagnostic</h2>
          <table><thead><tr><th>Sr</th><th>Faculty</th><th>Semester</th><th>Section</th><th>Month</th><th>Course Code</th><th>Course</th><th>Classes</th><th>Matching Students</th><th>Status</th></tr></thead><tbody>
            ${htmlRows(timetableDetails, ["facultyname", "semester", "section", "month", "coursecode", "course", "classcount", "studentcount", "status"])}
          </tbody></table>
        </div>
      </body>
      </html>`;
    const popup = window.open("", "_blank", "width=1200,height=900");
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  };

  return (
    <MenuPageShell title="LMS doctor">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Dialog open={Boolean(popup)} onClose={() => setPopup(null)} fullWidth maxWidth="xl">
          <DialogTitle sx={{ pr: 7 }}>
            {popup?.label}
            <IconButton onClick={() => setPopup(null)} sx={{ position: "absolute", right: 12, top: 10 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, height: "82vh" }}>
            {popup && <Box component="iframe" title={popup.label} src={`${popup.path}?embedded=1`} sx={{ width: "100%", height: "100%", border: 0 }} />}
          </DialogContent>
        </Dialog>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={950}>LMS doctor</Typography>
              <Typography color="text.secondary">Diagnose workload, student mapping, and sectionwise timetable readiness for the selected program.</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadOptions()} disabled={loading}>Refresh filters</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportRows(courseDetails, "lms_doctor_course_details.csv")} disabled={!courseDetails.length || loading}>Export</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={printPreview} disabled={!courseDetails.length || loading}>Print preview</Button>
              <Button variant="contained" startIcon={<FactCheckIcon />} onClick={runDoctor} disabled={loading}>{loading ? "Checking..." : "LMS doctor"}</Button>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            {popupLinks.map((link) => (
              <Button key={link.path} variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={() => setPopup(link)}>
                {link.label}
              </Button>
            ))}
          </Stack>
          <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
            {dropdown("academicyear", "Academic Year")}
            {dropdown("regulation", "Regulation")}
            {dropdown("program", "Program")}
            {dropdown("programcode", "Program Code")}
          </Grid>
          {progress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography variant="body2" fontWeight={800}>
                  {stage || (progress >= 100 ? "LMS doctor completed" : "Checking LMS readiness")}
                </Typography>
                <Typography variant="body2" fontWeight={900} color={progress >= 100 ? "success.main" : "primary.main"}>
                  {Math.round(progress)}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
            </Box>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        {loading && !visibleSections.cards ? <LoadingPanel label="Preparing summary cards..." /> : (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
                  <Card elevation={0} sx={{ color: "white", borderRadius: 2, minHeight: 124, background: `linear-gradient(135deg, ${card.tone} 0%, #111827 100%)` }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={850}>{card.label}</Typography>
                        <Icon />
                      </Stack>
                      <Typography variant="h4" fontWeight={950} sx={{ mt: 1 }}>{card.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {loading && !visibleSections.charts ? <LoadingPanel label="Preparing charts..." /> : (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <ChartCard title="Overall Course Readiness">
                <ResponsiveContainer width="100%" height="88%">
                  <PieChart>
                    <Pie data={charts.courseReadiness || []} dataKey="count" nameKey="name" outerRadius={96} label>
                      {(charts.courseReadiness || []).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartCard title="Student Mapping vs Timetable">
                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={[...(charts.workloadReadiness || []), ...(charts.timetableReadiness || [])]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={72} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartCard title="Facultywise Ready vs Pending">
                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={charts.facultywise || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ready" stackId="a" fill="#16a34a" />
                    <Bar dataKey="notready" stackId="a" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        )}

        {loading && !visibleSections.faculty ? <LoadingPanel label="Preparing faculty summary..." /> : <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Faculty Summary</Typography>
          <Box sx={{ height: 430, width: "100%" }}>
            <DataGrid
              rows={facultySummary}
              columns={facultyColumns}
              loading={loading}
              getRowId={(row) => row.id || row.facultyemail || row.facultyname}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              sx={{ bgcolor: "white", "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }}
            />
          </Box>
        </Paper>}

        {loading && !visibleSections.courses ? <LoadingPanel label="Preparing course diagnostics..." /> : <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Course Diagnostic</Typography>
          <Box sx={{ height: 520, width: "100%" }}>
            <DataGrid
              rows={courseDetails}
              columns={courseColumns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              getRowClassName={(params) => (params.row.ready ? "ready-row" : "error-row")}
              sx={{
                bgcolor: "white",
                "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 },
                "& .ready-row": { bgcolor: "rgba(22, 163, 74, 0.06)" },
                "& .error-row": { bgcolor: "rgba(220, 38, 38, 0.06)" }
              }}
            />
          </Box>
        </Paper>}

        {loading && !visibleSections.timetable ? <LoadingPanel label="Preparing sectionwise monthwise timetable diagnostics..." /> : <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Sectionwise Monthwise Timetable Diagnostic</Typography>
          <Box sx={{ height: 520, width: "100%" }}>
            <DataGrid
              rows={timetableDetails}
              columns={timetableColumns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              getRowClassName={(params) => (params.row.ready ? "ready-row" : "error-row")}
              sx={{
                bgcolor: "white",
                "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 },
                "& .ready-row": { bgcolor: "rgba(22, 163, 74, 0.06)" },
                "& .error-row": { bgcolor: "rgba(220, 38, 38, 0.06)" }
              }}
            />
          </Box>
        </Paper>}
      </Box>
    </MenuPageShell>
  );
}
