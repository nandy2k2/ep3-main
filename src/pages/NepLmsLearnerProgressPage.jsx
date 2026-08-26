import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, name: global1.name });
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.3, py: 1, alignItems: "flex-start" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const instName = (institution = {}) => institution.institutionname || institution.insname || institution.name || global1.insname || "Institution";
const instAddress = (institution = {}) => institution.address || institution.address1 || global1.address || "";
const instLogo = (institution = {}) => institution.logolink || institution.logo || institution.inslogo || global1.logo || "";

function exportCsv(filename, rows = [], fields = []) {
  const csv = [fields.map(csvEscape).join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function PrintHeader({ institution }) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #d1d5db", borderRadius: 1, textAlign: "center", color: "#000" }}>
      {instLogo(institution) && <Box component="img" src={instLogo(institution)} alt="logo" sx={{ height: 58, objectFit: "contain", mb: 1 }} />}
      <Typography variant="h5" fontWeight={950}>{instName(institution)}</Typography>
      <Typography variant="body2">{instAddress(institution)}</Typography>
      <Typography variant="h6" fontWeight={950} sx={{ mt: 1 }}>Learner Progress</Typography>
    </Paper>
  );
}

function Stat({ label, value, color = "#2563eb" }) {
  return (
    <Card elevation={0} sx={{ border: `1px solid ${color}33`, borderLeft: `5px solid ${color}`, borderRadius: 2 }}>
      <CardContent>
        <Typography color="text.secondary" fontWeight={800}>{label}</Typography>
        <Typography variant="h5" fontWeight={950} sx={{ color }}>{value ?? 0}</Typography>
      </CardContent>
    </Card>
  );
}

export default function NepLmsLearnerProgressPage() {
  const [options, setOptions] = useState({ fields: [], options: {} });
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/neplms/learning-profile/options", { params: withScope() })
      .then((res) => setOptions(res.data || { fields: [], options: {} }))
      .catch(() => setOptions({ fields: [], options: {} }));
  }, []);

  const searchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      setProfile(null);
      const res = await ep1.post("/api/v2/neplms/learning-profile/students", withScope({ filters }));
      setStudents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to search students");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (student) => {
    try {
      setLoading(true);
      setError("");
      setSelected(student);
      const res = await ep1.post("/api/v2/neplms/learning-profile", withScope({ id: student._id, regno: student.regno, email: student.email }));
      setProfile(res.data || null);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load learner progress");
    } finally {
      setLoading(false);
    }
  };

  const studentColumns = [
    { field: "name", headerName: "Student", minWidth: 190, flex: 1 },
    { field: "regno", headerName: "Regno", minWidth: 140 },
    { field: "academicyear", headerName: "Academic year", minWidth: 140 },
    { field: "program", headerName: "Program", minWidth: 180 },
    { field: "programcode", headerName: "Program code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 110 },
    { field: "section", headerName: "Section", minWidth: 110 },
    { field: "actions", headerName: "Action", minWidth: 110, renderCell: (params) => <Button size="small" variant="contained" onClick={() => loadProfile(params.row)} disabled={loading}>Select</Button> }
  ];
  const courseColumns = ["academicyear", "semester", "course", "coursecode", "attendancePercentage", "assignments", "averageAssignmentMarks", "quizzes", "averageQuizMarks", "sequenceCompleted", "courseMaterials", "averageMaterialWatch", "grade", "passstatus"].map((field) => ({ field, headerName: field, minWidth: 135, flex: ["course"].includes(field) ? 1 : 0 }));
  const linkColumn = (field) => ({ field, headerName: field, minWidth: 130, renderCell: (params) => params.value ? <Button href={params.value} target="_blank" rel="noreferrer" size="small">Open</Button> : "" });
  const assignmentColumns = ["assignmenttitle", "course", "coursecode", "submitteddate", "marks", "fullmarks", "status", "facultycomments"].map((field) => ({ field, headerName: field, minWidth: 150, flex: ["assignmenttitle", "facultycomments"].includes(field) ? 1 : 0 })).concat([linkColumn("url")]);
  const quizColumns = ["quiztitle", "course", "coursecode", "submitteddate", "obtainedmarks", "totalmarks", "status"].map((field) => ({ field, headerName: field, minWidth: 150 }));
  const sequenceColumns = ["lessonplantitle", "contenttitle", "course", "coursecode", "completedsteps", "totalsteps", "progresspercentage", "completedat", "comments"].map((field) => ({ field, headerName: field, minWidth: 150, flex: field === "comments" ? 1 : 0 }));
  const materialColumns = ["title", "course", "coursecode", "watchedseconds", "durationseconds", "watchedpercent", "lastwatchedat"].map((field) => ({ field, headerName: field, minWidth: 150 }));

  const chartData = profile?.courses || [];
  const summary = profile?.summary || {};
  const addFilter = () => setFilters((prev) => [...prev, { field: "", value: "" }]);
  const updateFilter = (index, patch) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  const rowsFor = (rows = []) => rows.map((row, index) => ({ id: row._id || `${row.regno || row.coursecode || "row"}-${index}`, ...row }));

  return (
    <MenuPageShell title="Learner progress">
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>Dynamic Student Filters</Typography>
          <Grid container spacing={1}>
            {filters.map((filter, index) => (
              <React.Fragment key={index}>
                <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => updateFilter(index, { field: event.target.value, value: "" })}>{(options.fields || []).map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={7}><Autocomplete freeSolo options={(options.options || {})[filter.field] || []} value={filter.value || ""} onInputChange={(_, value) => updateFilter(index, { value })} renderInput={(params) => <TextField {...params} size="small" label="Value" />} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button></Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={addFilter}>Add filter</Button>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={searchStudents} disabled={loading}>{loading ? "Loading..." : "Load students"}</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("learner_progress_courses.csv", profile?.courses || [], courseColumns.map((column) => column.field))}>Export courses</Button>
          </Stack>
        </Paper>
        <Paper className="no-print" sx={{ p: 2 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>Students</Typography>
          <Box sx={{ height: 360 }}>
            <DataGrid rows={rowsFor(students)} columns={studentColumns} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
          </Box>
        </Paper>
        <Box className="print-area">
          <PrintHeader institution={profile?.institution || {}} />
          {selected && <Alert severity="info" sx={{ mb: 2 }}>{selected.name} | {selected.regno} | {selected.program} | Semester {selected.semester}</Alert>}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><Stat label="Courses" value={summary.courses} /></Grid>
            <Grid item xs={12} md={3}><Stat label="Attendance %" value={summary.attendancePercentage} color="#16a34a" /></Grid>
            <Grid item xs={12} md={3}><Stat label="Assignments" value={summary.assignments} color="#7c3aed" /></Grid>
            <Grid item xs={12} md={3}><Stat label="Sequential completed" value={summary.sequentialCompleted} color="#f97316" /></Grid>
            <Grid item xs={12} md={3}><Stat label="Quiz attempts" value={summary.quizzes} color="#0891b2" /></Grid>
            <Grid item xs={12} md={3}><Stat label="Live quiz attempts" value={summary.liveQuizzes} color="#dc2626" /></Grid>
            <Grid item xs={12} md={3}><Stat label="Course materials watched" value={summary.courseMaterialsWatched} color="#0f766e" /></Grid>
            <Grid item xs={12} md={3}><Stat label="Avg material watch %" value={summary.averageMaterialWatch} color="#b45309" /></Grid>
          </Grid>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Coursewise Progress</Typography>
            <Box sx={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="coursecode" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendancePercentage" fill="#2563eb" />
                  <Bar dataKey="averageQuizMarks" fill="#16a34a" />
                  <Bar dataKey="averageMaterialWatch" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
          {[
            ["Course details", profile?.courses || [], courseColumns],
            ["Assignments", profile?.assignments || [], assignmentColumns],
            ["Sequential content completion", profile?.sequentialProgress || [], sequenceColumns],
            ["Course material watch", profile?.courseMaterialWatch || [], materialColumns],
            ["Quiz scores", profile?.quizzes || [], quizColumns],
            ["Live quiz scores", profile?.liveQuizAttempts || [], quizColumns]
          ].map(([title, data, columns]) => (
            <Paper sx={{ p: 2, mb: 2 }} key={title}>
              <Typography fontWeight={900} sx={{ mb: 1 }}>{title}</Typography>
              <Box sx={{ height: 420 }}>
                <DataGrid rows={rowsFor(data)} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
              </Box>
            </Paper>
          ))}
        </Box>
      </Stack>
    </MenuPageShell>
  );
}
