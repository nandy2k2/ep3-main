import React, { useEffect, useState } from "react";
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
  { label: "Program Management", path: "/programmanagement" },
  { label: "Regulation Course Map", path: "/regulationcoursemap" },
  { label: "Syllabus", path: "/syllabus" },
  { label: "CO", path: "/colist" },
  { label: "Student data upload", path: "/studentdataupload" },
  { label: "Workload", path: "/workloadassignment" },
  { label: "Timetable sectionwise", path: "/neplmssectionwisetimetable" }
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

export default function ConfigurationDoctorPage() {
  const [academicyear, setAcademicyear] = useState("");
  const [options, setOptions] = useState({ academicyear: [] });
  const [summary, setSummary] = useState({});
  const [charts, setCharts] = useState({});
  const [details, setDetails] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const current = hydrateGlobalSession();
      const res = await ep1.get("/api/v2/neplms/configuration-doctor/options", { params: { colid: current.colid || global1.colid } });
      setOptions(res.data?.options || { academicyear: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load academic year options.");
    }
  };

  const runDoctor = async () => {
    setError("");
    if (!academicyear) {
      setError("Please select academic year.");
      return;
    }
    const current = hydrateGlobalSession();
    setLoading(true);
    setProgress(12);
    setStage("Validating academic year");
    setSummary({});
    setCharts({});
    setDetails([]);
    try {
      setTimeout(() => { setProgress(38); setStage("Checking programs and regulation courses"); }, 150);
      setTimeout(() => { setProgress(64); setStage("Checking syllabus, CO, workload and timetable"); }, 350);
      setTimeout(() => { setProgress(82); setStage("Checking students and preparing visuals"); }, 550);
      const res = await ep1.get("/api/v2/neplms/configuration-doctor/report", {
        params: { colid: current.colid || global1.colid, academicyear }
      });
      setInstitution(res.data?.institution || null);
      setSummary(res.data?.summary || {});
      setCharts(res.data?.charts || {});
      setDetails(res.data?.details || []);
      setProgress(100);
      setStage("Configuration doctor completed");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to run configuration doctor.");
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
    { label: "Total Credit", value: summary.totalcredit || 0, tone: "#0891b2", icon: FactCheckIcon },
    { label: "Syllabus Courses", value: summary.syllabusCourses || 0, tone: "#16a34a", icon: FactCheckIcon },
    { label: "CO Courses", value: summary.coCourses || 0, tone: "#f59e0b", icon: FactCheckIcon },
    { label: "Workload Courses", value: summary.workloadCourses || 0, tone: "#4f46e5", icon: FactCheckIcon },
    { label: "Timetable Courses", value: summary.timetableCourses || 0, tone: "#0f766e", icon: FactCheckIcon },
    { label: "Programs With Students", value: summary.programsWithStudents || 0, tone: "#ea580c", icon: SchoolIcon },
    { label: "Students", value: summary.students || 0, tone: "#dc2626", icon: WarningAmberIcon }
  ];

  const columns = [
    { field: "status", headerName: "Status", minWidth: 120, renderCell: (params) => <StatusChip value={params.value} /> },
    { field: "program", headerName: "Program", minWidth: 210, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 140 },
    { field: "faculty", headerName: "Faculty", minWidth: 180 },
    { field: "department", headerName: "Department", minWidth: 180 },
    { field: "coursecount", headerName: "Courses", type: "number", minWidth: 110 },
    { field: "totalcredit", headerName: "Credits", type: "number", minWidth: 105 },
    { field: "syllabuscount", headerName: "Syllabus", type: "number", minWidth: 110 },
    { field: "cocount", headerName: "CO", type: "number", minWidth: 90 },
    { field: "workloadcount", headerName: "Workload", type: "number", minWidth: 120 },
    { field: "timetablecount", headerName: "Timetable", type: "number", minWidth: 120 },
    { field: "studentcount", headerName: "Students", type: "number", minWidth: 110 },
    { field: "readinesspercent", headerName: "Ready %", type: "number", minWidth: 105 },
    { field: "mismatch", headerName: "Actual Mismatch Section", minWidth: 380, flex: 1 }
  ];

  const printPreview = () => {
    const inst = institution || {};
    const logo = inst.logo || inst.logolink || inst.filelink || "";
    const headerLines = [inst.address, inst.phone || inst.mobile, inst.email, inst.website].filter(Boolean).join(" | ");
    const html = `
      <html><head><title>Configuration Doctor</title><style>
      body{font-family:Arial,sans-serif;color:#111;margin:0;background:white}.actions{padding:12px;text-align:right;border-bottom:1px solid #ddd}.actions button{margin-left:8px;padding:8px 14px}.page{padding:18mm 14mm}.header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px}.logo{max-height:70px;max-width:110px;object-fit:contain}h1{margin:5px 0;font-size:22px}h2{text-align:center;font-size:18px;margin:14px 0}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.box{border:1px solid #111;padding:8px;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11px}th,td{border:1px solid #111;padding:5px;text-align:left;vertical-align:top}th{background:#f2f2f2}tr{page-break-inside:avoid}thead{display:table-header-group}@media print{@page{size:A4 landscape;margin:10mm}.actions{display:none}.page{padding:0}}
      </style></head><body>
      <div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
      <div class="page"><div class="header">${logo ? `<img class="logo" src="${safe(logo)}" />` : ""}<h1>${safe(inst.institutionname || inst.institution || "Institution")}</h1><div>${safe(headerLines)}</div><h2>Configuration Doctor</h2><div>Academic Year: ${safe(academicyear)}</div></div>
      <div class="cards">${cards.map((card) => `<div class="box"><b>${safe(card.label)}</b><br>${safe(card.value)}</div>`).join("")}</div>
      <table><thead><tr><th>Sr</th><th>Program</th><th>Code</th><th>Courses</th><th>Credits</th><th>Syllabus</th><th>CO</th><th>Workload</th><th>Timetable</th><th>Students</th><th>Ready %</th><th>Status</th><th>Mismatch</th></tr></thead><tbody>
      ${details.map((row, index) => `<tr><td>${index + 1}</td><td>${safe(row.program)}</td><td>${safe(row.programcode)}</td><td>${safe(row.coursecount)}</td><td>${safe(row.totalcredit)}</td><td>${safe(row.syllabuscount)}</td><td>${safe(row.cocount)}</td><td>${safe(row.workloadcount)}</td><td>${safe(row.timetablecount)}</td><td>${safe(row.studentcount)}</td><td>${safe(row.readinesspercent)}</td><td>${safe(row.status)}</td><td>${safe(row.mismatch)}</td></tr>`).join("")}
      </tbody></table></div></body></html>`;
    const win = window.open("", "_blank", "width=1200,height=900");
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <MenuPageShell title="Configuration Doctor">
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
              <Typography variant="h4" fontWeight={950}>Configuration Doctor</Typography>
              <Typography color="text.secondary">Check program, courses, credits, syllabus, CO, workload, timetable and student readiness by academic year.</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadOptions} disabled={loading}>Refresh</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportRows(details, "configuration_doctor.csv")} disabled={!details.length || loading}>Export</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={printPreview} disabled={!details.length || loading}>Print preview</Button>
              <Button variant="contained" startIcon={<FactCheckIcon />} onClick={runDoctor} disabled={loading}>{loading ? "Checking..." : "Configuration doctor"}</Button>
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
                onChange={(_, value) => setAcademicyear(value || "")}
                renderInput={(params) => <TextField {...params} label="Academic Year" />}
              />
            </Grid>
          </Grid>
          {progress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography variant="body2" fontWeight={800}>{stage || "Checking configuration readiness"}</Typography>
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

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <ChartCard title="Program Readiness">
              <ResponsiveContainer width="100%" height="88%">
                <PieChart>
                  <Pie data={charts.programReadiness || []} dataKey="count" nameKey="name" outerRadius={96} label>
                    {(charts.programReadiness || []).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Course Configuration Coverage">
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={charts.courseCoverage || []}>
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
            <ChartCard title="Programwise Student Count">
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

        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Program Configuration Details</Typography>
          <Box sx={{ height: 620, width: "100%" }}>
            <DataGrid
              rows={details}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              getRowClassName={(params) => (params.row.status === "Ready" ? "ready-row" : params.row.status === "Partial" ? "partial-row" : "error-row")}
              sx={{
                bgcolor: "white",
                "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 },
                "& .ready-row": { bgcolor: "rgba(22, 163, 74, 0.06)" },
                "& .partial-row": { bgcolor: "rgba(245, 158, 11, 0.08)" },
                "& .error-row": { bgcolor: "rgba(220, 38, 38, 0.06)" }
              }}
            />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
