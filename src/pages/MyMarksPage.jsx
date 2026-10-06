import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const courseKey = (row) => `${row.academicyear}||${row.regulation}||${row.programcode}||${row.semester}||${row.coursecode}`;
const courseLabel = (row) => row ? `${row.coursecode || ""} - ${row.course || ""} | ${row.program || ""} (${row.programcode || ""}) | ${row.regulation || ""}` : "";
const examLabel = (row) => row ? `${row.examname || row.exam || ""} (${row.examcode || ""})` : "";

export default function MyMarksPage() {
  const [options, setOptions] = useState({ academicyears: [], semesters: [], courses: [], exams: [] });
  const [filters, setFilters] = useState({ academicyear: "", examcode: "", exam: "", regulation: "", semester: "", coursekey: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCourse = useMemo(() => options.courses.find((row) => courseKey(row) === filters.coursekey) || null, [options.courses, filters.coursekey]);
  const selectedExam = useMemo(() => (options.exams || []).find((row) => row.examcode === filters.examcode) || null, [options.exams, filters.examcode]);

  const loadOptions = async (next = filters) => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/internal-marks-entry/options", {
        params: {
          colid: global1.colid,
          academicyear: next.academicyear,
          semester: next.semester,
          facultyemail: global1.user
        }
      });
      setOptions(res.data || { academicyears: [], semesters: [], courses: [], exams: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load my marks options.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOptions(); }, []);

  const updateFilter = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value || "" };
      if (field === "academicyear") Object.assign(next, { examcode: "", exam: "", regulation: "", semester: "", coursekey: "" });
      if (field === "examcode") {
        const exam = (options.exams || []).find((row) => row.examcode === value);
        next.exam = exam?.examname || exam?.exam || "";
      }
      if (field === "semester") Object.assign(next, { coursekey: "" });
      if (field === "coursekey") next.regulation = selectedCourse?.regulation || next.regulation;
      if (field === "academicyear" || field === "semester") loadOptions(next);
      return next;
    });
    setRows([]);
  };

  const loadRows = async () => {
    if (!filters.academicyear || !filters.examcode || !filters.semester || !selectedCourse) {
      setError("Select academic year, exam, semester and course.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const params = {
        colid: global1.colid,
        academicyear: filters.academicyear,
        examcode: filters.examcode,
        regulation: selectedCourse.regulation,
        programcode: selectedCourse.programcode,
        semester: selectedCourse.semester,
        coursecode: selectedCourse.coursecode,
        examineremail: global1.user
      };
      const res = await ep1.get("/api/v2/examination-model2/component-marks", { params });
      const data = res.data?.data || [];
      setRows(data);
      if (!data.length) setMessage("No marks found for the selected filters.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load my marks.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
    { field: "regno", headerName: "Reg No", minWidth: 130 },
    { field: "exam", headerName: "Exam", minWidth: 170 },
    { field: "examcode", headerName: "Exam Code", minWidth: 130 },
    { field: "program", headerName: "Program", minWidth: 170 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    { field: "course", headerName: "Course", minWidth: 190, flex: 1 },
    { field: "coursecode", headerName: "Course Code", minWidth: 130 },
    { field: "componenttype", headerName: "Component Type", minWidth: 140 },
    { field: "scoretype", headerName: "Score Type", minWidth: 120 },
    { field: "assessmentcomponent", headerName: "Assessment Component", minWidth: 190 },
    { field: "maxmarks", headerName: "Max Marks", minWidth: 110, type: "number" },
    { field: "rawmarks", headerName: "Raw Marks", minWidth: 110, type: "number" },
    { field: "marksobtained", headerName: "Marks Obtained", minWidth: 140, type: "number" },
    { field: "passstatus", headerName: "Pass Status", minWidth: 120 },
    { field: "submissionstatus", headerName: "Submission", minWidth: 130 }
  ];

  return (
    <MenuPageShell title="My marks">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={950}>My marks</Typography>
            <Typography color="text.secondary">Read-only view of component marks entered by the logged-in faculty.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="info" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <Autocomplete options={options.academicyears || []} value={filters.academicyear || ""} onChange={(_, value) => updateFilter("academicyear", value)} renderInput={(params) => <TextField {...params} label="Academic year" />} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete options={options.exams || []} value={selectedExam} getOptionLabel={examLabel} onChange={(_, value) => updateFilter("examcode", value?.examcode || "")} disabled={!filters.academicyear} renderInput={(params) => <TextField {...params} label="Exam / Exam code" />} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Autocomplete options={options.semesters || []} value={filters.semester || ""} onChange={(_, value) => updateFilter("semester", value)} renderInput={(params) => <TextField {...params} label="Semester" />} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete options={options.courses || []} value={selectedCourse} getOptionLabel={courseLabel} onChange={(_, value) => updateFilter("coursekey", value ? courseKey(value) : "")} renderInput={(params) => <TextField {...params} label="Course" />} />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button fullWidth variant="contained" sx={{ height: 56 }} disabled={loading} onClick={loadRows}>{loading ? <CircularProgress size={18} /> : "Load"}</Button>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
              <Chip label={`Faculty: ${global1.user}`} />
              <Chip color="info" label={`Rows: ${rows.length}`} />
              <Chip label="Read only" />
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Box sx={{ height: 640 }}>
              <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "my_marks" } } }} pageSizeOptions={[10, 25, 50, 100]} />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
