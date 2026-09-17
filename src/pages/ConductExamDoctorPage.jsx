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
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ep1 from "../api/ep1";
import global1, { hydrateGlobalSession } from "./global1";
import MenuPageShell from "./MenuPageShell";

const colors = ["#16a34a", "#f59e0b", "#dc2626", "#2563eb", "#7c3aed", "#0891b2"];
const popupLinks = [
  { label: "Create exam", path: "/conduct-exam-dates" },
  { label: "Populate exam courses", path: "/conduct-exam-populate-courses" },
  { label: "Exam auto scheduler 3", path: "/conduct-exam-auto-scheduler-3" },
  { label: "Exam roll", path: "/examroll" },
  { label: "Grading template", path: "/exammodel2gradingtemplate" },
  { label: "Grading details", path: "/exammodel2gradingtemplatedetails" },
  { label: "Viva grading template", path: "/exammodel2viva-gradingtemplate" },
  { label: "Paper setter registration", path: "/conduct-exam-paper-setter-registration" },
  { label: "Moderator registration", path: "/conduct-exam-moderator-registration" },
  { label: "Stationary requirement", path: "/conduct-exam-stationary-requirement" },
  { label: "Invigilator allocation", path: "/conduct-exam-invigilator-allocation" },
  { label: "Rooms", path: "/conduct-exam-rooms" }
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
  const color = value === "Ready" ? "success" : value === "Partial" ? "warning" : "error";
  return <Chip size="small" color={color} label={value || "Pending"} sx={{ fontWeight: 850 }} />;
};

const ChartCard = ({ title, children }) => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", height: 340 }}>
    <Typography fontWeight={900} sx={{ mb: 1 }}>{title}</Typography>
    {children}
  </Paper>
);

export default function ConductExamDoctorPage() {
  const [academicyear, setAcademicyear] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [options, setOptions] = useState({ academicyear: [], exams: [] });
  const [summary, setSummary] = useState({});
  const [charts, setCharts] = useState({});
  const [programDetails, setProgramDetails] = useState([]);
  const [courseDetails, setCourseDetails] = useState([]);
  const [semesterStudentDetails, setSemesterStudentDetails] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
  }, []);

  const examOptions = useMemo(() => (options.exams || []).filter((row) => !academicyear || row.academicyear === academicyear), [options.exams, academicyear]);

  const loadOptions = async () => {
    try {
      const current = hydrateGlobalSession();
      const res = await ep1.get("/api/v2/conductexam/doctor-options", { params: { colid: current.colid || global1.colid } });
      setOptions(res.data?.options || { academicyear: [], exams: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exam options.");
    }
  };

  const runDoctor = async () => {
    setError("");
    if (!academicyear || !selectedExam?.examcode) {
      setError("Please select academic year and exam.");
      return;
    }
    const current = hydrateGlobalSession();
    setLoading(true);
    setProgress(10);
    setStage("Checking selected exam");
    setSummary({});
    setCharts({});
    setProgramDetails([]);
    setCourseDetails([]);
    setSemesterStudentDetails([]);
    try {
      setTimeout(() => { setProgress(32); setStage("Checking courses, timetable and examroll"); }, 150);
      setTimeout(() => { setProgress(58); setStage("Checking grading, paper setters and moderators"); }, 350);
      setTimeout(() => { setProgress(82); setStage("Checking stationery and invigilator allocation"); }, 550);
      const res = await ep1.get("/api/v2/conductexam/doctor-report", {
        params: {
          colid: current.colid || global1.colid,
          academicyear,
          exam: selectedExam.exam,
          examcode: selectedExam.examcode
        }
      });
      setInstitution(res.data?.institution || null);
      setSummary(res.data?.summary || {});
      setCharts(res.data?.charts || {});
      setProgramDetails(res.data?.programDetails || []);
      setCourseDetails(res.data?.courseDetails || []);
      setSemesterStudentDetails(res.data?.semesterStudentDetails || []);
      setProgress(100);
      setStage("Exam conduct doctor completed");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to run exam conduct doctor.");
      setProgress(0);
      setStage("");
    } finally {
      setLoading(false);
      setTimeout(() => { setProgress(0); setStage(""); }, 1400);
    }
  };

  const cards = [
    { label: "Programs", value: summary.programs || 0, tone: "#2563eb", icon: SchoolIcon },
    { label: "Courses", value: summary.courses || 0, tone: "#7c3aed", icon: FactCheckIcon },
    { label: "Grading Schemes", value: summary.gradingTemplates || 0, tone: "#0891b2", icon: FactCheckIcon },
    { label: "Paper Setter Courses", value: summary.paperSetterCourses || 0, tone: "#16a34a", icon: FactCheckIcon },
    { label: "Moderator Courses", value: summary.moderatorCourses || 0, tone: "#f59e0b", icon: FactCheckIcon },
    { label: "Timetable Courses", value: summary.timetableCourses || 0, tone: "#0f766e", icon: FactCheckIcon },
    { label: "Students", value: summary.students || 0, tone: "#dc2626", icon: WarningAmberIcon },
    { label: "Invigilator Rooms", value: summary.invigilatorRooms || 0, tone: "#4f46e5", icon: FactCheckIcon }
  ];

  const programColumns = [
    { field: "status", headerName: "Status", minWidth: 120, renderCell: (params) => <StatusChip value={params.value} /> },
    { field: "program", headerName: "Program", minWidth: 210, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 140 },
    { field: "semesters", headerName: "Semesters", minWidth: 130 },
    { field: "coursecount", headerName: "Courses", type: "number", minWidth: 105 },
    { field: "gradingtemplatecount", headerName: "Grading", type: "number", minWidth: 105 },
    { field: "vivagradingtemplatecount", headerName: "Viva Grading", type: "number", minWidth: 130 },
    { field: "papersettercoursecount", headerName: "Paper Setter", type: "number", minWidth: 130 },
    { field: "moderatorcoursecount", headerName: "Moderator", type: "number", minWidth: 120 },
    { field: "timetablecoursecount", headerName: "Timetable", type: "number", minWidth: 120 },
    { field: "examrollcount", headerName: "Examroll Rows", type: "number", minWidth: 130 },
    { field: "studentcount", headerName: "Students", type: "number", minWidth: 110 },
    { field: "stationarycount", headerName: "Stationary", type: "number", minWidth: 120 },
    { field: "invigilatorroomcount", headerName: "Invig. Rooms", type: "number", minWidth: 125 },
    { field: "readinesspercent", headerName: "Ready %", type: "number", minWidth: 105 },
    { field: "mismatch", headerName: "Mismatch", minWidth: 380, flex: 1 }
  ];

  const courseColumns = [
    { field: "status", headerName: "Status", minWidth: 110, renderCell: (params) => <StatusChip value={params.value === "Ready" ? "Ready" : "Pending"} /> },
    { field: "program", headerName: "Program", minWidth: 190 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 105 },
    { field: "course", headerName: "Course", minWidth: 240, flex: 1 },
    { field: "coursecode", headerName: "Course Code", minWidth: 135 },
    { field: "coursetype", headerName: "Type", minWidth: 110 },
    { field: "examdate", headerName: "Exam Date", minWidth: 120 },
    { field: "examslot", headerName: "Slot", minWidth: 120 },
    { field: "papersetter", headerName: "Paper Setter", minWidth: 125 },
    { field: "moderator", headerName: "Moderator", minWidth: 115 },
    { field: "studentcount", headerName: "Students", type: "number", minWidth: 110 },
    { field: "mismatch", headerName: "Mismatch", minWidth: 300, flex: 1 }
  ];

  const studentColumns = [
    { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 140 },
    { field: "semester", headerName: "Semester", minWidth: 120 },
    { field: "examrollcount", headerName: "Examroll Rows", type: "number", minWidth: 140 },
    { field: "studentcount", headerName: "Unique Students", type: "number", minWidth: 150 }
  ];

  const printPreview = () => {
    const inst = institution || {};
    const logo = inst.logo || inst.logolink || inst.filelink || "";
    const headerLines = [inst.address, inst.phone || inst.mobile, inst.email, inst.website].filter(Boolean).join(" | ");
    const html = `
      <html><head><title>Exam Conduct Doctor</title><style>
      body{font-family:Arial,sans-serif;color:#111;margin:0;background:white}.actions{padding:12px;text-align:right;border-bottom:1px solid #ddd}.actions button{margin-left:8px;padding:8px 14px}.page{padding:18mm 14mm}.header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px}.logo{max-height:70px;max-width:110px;object-fit:contain}h1{margin:5px 0;font-size:22px}h2{text-align:center;font-size:18px;margin:14px 0}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.box{border:1px solid #111;padding:8px;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:10px}th,td{border:1px solid #111;padding:5px;text-align:left;vertical-align:top}th{background:#f2f2f2}tr{page-break-inside:avoid}thead{display:table-header-group}@media print{@page{size:A4 landscape;margin:10mm}.actions{display:none}.page{padding:0}}
      </style></head><body>
      <div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
      <div class="page"><div class="header">${logo ? `<img class="logo" src="${safe(logo)}" />` : ""}<h1>${safe(inst.institutionname || inst.institution || "Institution")}</h1><div>${safe(headerLines)}</div><h2>Exam Conduct Doctor</h2><div>${safe(academicyear)} | ${safe(selectedExam?.label || selectedExam?.examcode)}</div></div>
      <div class="cards">${cards.map((card) => `<div class="box"><b>${safe(card.label)}</b><br>${safe(card.value)}</div>`).join("")}</div>
      <table><thead><tr><th>Sr</th><th>Program</th><th>Code</th><th>Courses</th><th>Grading</th><th>Viva Grading</th><th>Paper Setter</th><th>Moderator</th><th>Timetable</th><th>Students</th><th>Stationary</th><th>Invig. Rooms</th><th>Ready %</th><th>Status</th><th>Mismatch</th></tr></thead><tbody>
      ${programDetails.map((row, index) => `<tr><td>${index + 1}</td><td>${safe(row.program)}</td><td>${safe(row.programcode)}</td><td>${safe(row.coursecount)}</td><td>${safe(row.gradingtemplatecount)}</td><td>${safe(row.vivagradingtemplatecount)}</td><td>${safe(row.papersettercoursecount)}</td><td>${safe(row.moderatorcoursecount)}</td><td>${safe(row.timetablecoursecount)}</td><td>${safe(row.studentcount)}</td><td>${safe(row.stationarycount)}</td><td>${safe(row.invigilatorroomcount)}</td><td>${safe(row.readinesspercent)}</td><td>${safe(row.status)}</td><td>${safe(row.mismatch)}</td></tr>`).join("")}
      </tbody></table></div></body></html>`;
    const win = window.open("", "_blank", "width=1200,height=900");
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <MenuPageShell title="Exam Conduct Doctor">
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
              <Typography variant="h4" fontWeight={950}>Exam Conduct Doctor</Typography>
              <Typography color="text.secondary">Check exam setup readiness across courses, grading, paper setter, moderator, timetable, examroll, stationery and invigilation.</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadOptions} disabled={loading}>Refresh</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportRows(programDetails, "exam_conduct_doctor_programs.csv")} disabled={!programDetails.length || loading}>Export</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={printPreview} disabled={!programDetails.length || loading}>Print preview</Button>
              <Button variant="contained" startIcon={<FactCheckIcon />} onClick={runDoctor} disabled={loading}>{loading ? "Checking..." : "Exam conduct doctor"}</Button>
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
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.academicyear || []}
                value={academicyear || null}
                onChange={(_, value) => {
                  setAcademicyear(value || "");
                  setSelectedExam(null);
                }}
                renderInput={(params) => <TextField {...params} label="Academic Year" />}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Autocomplete
                options={examOptions}
                value={selectedExam}
                getOptionLabel={(option) => option?.label || ""}
                isOptionEqualToValue={(option, value) => option.examcode === value.examcode && option.academicyear === value.academicyear}
                onChange={(_, value) => setSelectedExam(value)}
                renderInput={(params) => <TextField {...params} label="Exam / Exam Code" />}
              />
            </Grid>
          </Grid>
          {progress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography variant="body2" fontWeight={800}>{stage || "Checking exam conduct readiness"}</Typography>
                <Typography variant="body2" fontWeight={900} color={progress >= 100 ? "success.main" : "primary.main"}>{Math.round(progress)}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
            </Box>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Grid item xs={12} sm={6} md={3} lg={1.5} key={card.label}>
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

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <ChartCard title="Program Readiness">
              <ResponsiveContainer width="100%" height="88%">
                <PieChart>
                  <Pie data={charts.readiness || []} dataKey="count" nameKey="name" outerRadius={96} label>
                    {(charts.readiness || []).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Exam Coverage">
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={charts.coverage || []}>
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
            <ChartCard title="Programwise Students">
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={charts.programStudents || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", mb: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Programwise Readiness</Typography>
          <Box sx={{ height: 520, width: "100%" }}>
            <DataGrid rows={programDetails} columns={programColumns} loading={loading} getRowId={(row) => row.id} disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} sx={{ bgcolor: "white", "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", mb: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Coursewise Details</Typography>
          <Box sx={{ height: 520, width: "100%" }}>
            <DataGrid rows={courseDetails} columns={courseColumns} loading={loading} getRowId={(row) => row.id} disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} sx={{ bgcolor: "white", "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Program Semester Student Count</Typography>
          <Box sx={{ height: 420, width: "100%" }}>
            <DataGrid rows={semesterStudentDetails} columns={studentColumns} loading={loading} getRowId={(row) => row.id} disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} sx={{ bgcolor: "white" }} />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
