import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import PrintIcon from "@mui/icons-material/Print";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import { printExamSchedule } from "./ConductExamSchedulePrintUtils";

const SELECT_ALL = { value: "__all__", label: "Select All" };
const geminiModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
const text = (value) => String(value || "").trim();
const uniq = (items) => [...new Set((items || []).map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const byCode = (row) => `${row.programcode || ""}||${row.program || ""}`;

function MultiSelect({ label, options, value, onChange, getLabel = (item) => item, disabled = false }) {
  const allOptions = [SELECT_ALL, ...options];
  const selectedAll = options.length > 0 && value.length === options.length;
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      disabled={disabled}
      options={allOptions}
      value={value}
      isOptionEqualToValue={(option, val) => option.value ? option.value === val.value : getLabel(option) === getLabel(val)}
      getOptionLabel={(option) => option.label || getLabel(option)}
      onChange={(_, next, reason, details) => {
        if (details?.option?.value === SELECT_ALL.value) onChange(selectedAll ? [] : options);
        else onChange(next.filter((item) => item.value !== SELECT_ALL.value));
      }}
      renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={option.value === SELECT_ALL.value ? selectedAll : selected} />{option.label || getLabel(option)}</li>}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

const courseColumns = [
  { field: "academicyear", headerName: "Academic Year", width: 140 },
  { field: "regulation", headerName: "Regulation", width: 150 },
  { field: "exam", headerName: "Exam", minWidth: 210, flex: 1 },
  { field: "examcode", headerName: "Exam Code", width: 160 },
  { field: "program", headerName: "Program", minWidth: 190, flex: 1 },
  { field: "programcode", headerName: "Program Code", width: 140 },
  { field: "type", headerName: "Subject Type", width: 130 },
  { field: "subject", headerName: "Subject", minWidth: 170, flex: 1 },
  { field: "semester", headerName: "Semester", width: 110 },
  { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
  { field: "coursecode", headerName: "Course Code", width: 150 },
  { field: "coursetype", headerName: "Course Type", width: 140 },
  { field: "deliverytype", headerName: "Regular/Elective", width: 150 },
  { field: "examdate", headerName: "Exam Date", width: 130 },
  { field: "examslot", headerName: "Exam Slot", width: 160 }
];

export function ConductExamPopulateCoursesPage() {
  const [exams, setExams] = useState([]);
  const [courseMapRows, setCourseMapRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ examId: "", academicyear: "", exam: "", examcode: "", regulation: "", programs: [], subjects: [], courses: [] });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadBase = async () => {
    const [examRes, mapRes, rowRes] = await Promise.all([
      ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/conductexam/course-options", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/conductexam/examcourses", { params: { colid: global1.colid } })
    ]);
    setExams(examRes.data?.data || []);
    setCourseMapRows(mapRes.data?.data || []);
    setRows(rowRes.data?.data || []);
  };

  useEffect(() => { loadBase().catch((err) => setError(err.response?.data?.message || "Unable to load data.")); }, []);

  const regulationOptions = useMemo(() => uniq(courseMapRows.filter((row) => !form.academicyear || row.academicyear === form.academicyear).map((row) => row.regulation)), [courseMapRows, form.academicyear]);
  const programOptions = useMemo(() => {
    const map = new Map();
    courseMapRows.filter((row) => row.academicyear === form.academicyear && row.regulation === form.regulation).forEach((row) => {
      if (row.programcode) map.set(byCode(row), { program: row.program, programcode: row.programcode });
    });
    return [...map.values()].sort((a, b) => text(a.program).localeCompare(text(b.program)));
  }, [courseMapRows, form.academicyear, form.regulation]);
  const selectedProgramCodes = useMemo(() => form.programs.map((row) => row.programcode), [form.programs]);
  const subjectOptions = useMemo(() => uniq(courseMapRows.filter((row) => row.academicyear === form.academicyear && row.regulation === form.regulation && selectedProgramCodes.includes(row.programcode)).map((row) => row.subject)), [courseMapRows, form.academicyear, form.regulation, selectedProgramCodes]);
  const courseOptions = useMemo(() => {
    const map = new Map();
    courseMapRows.filter((row) => row.academicyear === form.academicyear && row.regulation === form.regulation && selectedProgramCodes.includes(row.programcode) && (!form.subjects.length || form.subjects.includes(row.subject))).forEach((row) => {
      if (row.coursecode) map.set(`${row.programcode}||${row.coursecode}||${row.subject}||${row.semester}`, row);
    });
    return [...map.values()].sort((a, b) => `${a.programcode}${a.semester}${a.course}`.localeCompare(`${b.programcode}${b.semester}${b.course}`, undefined, { numeric: true }));
  }, [courseMapRows, form.academicyear, form.regulation, selectedProgramCodes, form.subjects]);

  const selectExam = (id) => {
    const exam = exams.find((item) => item._id === id);
    setForm({ examId: id, academicyear: exam?.academicyear || "", exam: exam?.examname || "", examcode: exam?.examcode || "", regulation: "", programs: [], subjects: [], courses: [] });
  };

  const populate = async () => {
    if (!form.examcode || !form.regulation || !form.programs.length || !form.courses.length) {
      setError("Select exam, regulation, program and courses.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = form.courses.map((course) => ({
        academicyear: form.academicyear,
        regulation: form.regulation,
        exam: form.exam,
        examcode: form.examcode,
        program: course.program,
        programcode: course.programcode,
        type: course.type || "Major",
        subject: course.subject,
        semester: course.semester,
        course: course.course,
        coursecode: course.coursecode,
        coursetype: course.coursetype || "Theory",
        deliverytype: course.deliverytype || "",
        coursemastercode: course.coursemastercode || ""
      }));
      const res = await ep1.post("/api/v2/conductexam/examcourses-bulk", { colid: global1.colid, user: global1.user, items });
      setMessage(`${res.data?.saved || 0} exam course rows populated.`);
      const rowRes = await ep1.get("/api/v2/conductexam/examcourses", { params: { colid: global1.colid, examcode: form.examcode } });
      setRows(rowRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to populate exam courses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title="Populate exam courses">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box><Typography variant="h5" fontWeight={900}>Populate exam courses</Typography><Typography color="text.secondary">Create exam-course rows without exam date and slot. Semester and regular/elective values are picked from Regulation Course Map.</Typography></Box>
            <Button variant="contained" startIcon={<AutoModeIcon />} disabled={loading} onClick={populate}>{loading ? "Populating..." : "Populate"}</Button>
          </Stack>
        </Paper>
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Autocomplete options={exams} value={exams.find((item) => item._id === form.examId) || null} getOptionLabel={(item) => item?._id ? `${item.academicyear} - ${item.examname} (${item.examcode})` : ""} onChange={(_, value) => selectExam(value?._id || "")} renderInput={(params) => <TextField {...params} label="Exam" />} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Academic Year" value={form.academicyear} InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={regulationOptions} value={form.regulation} onChange={(_, value) => setForm((prev) => ({ ...prev, regulation: value || "", programs: [], subjects: [], courses: [] }))} renderInput={(params) => <TextField {...params} label="Regulation" />} /></Grid>
            <Grid item xs={12} md={3}><MultiSelect label="Programs" options={programOptions} value={form.programs} onChange={(value) => setForm((prev) => ({ ...prev, programs: value, subjects: [], courses: [] }))} getLabel={(item) => `${item.program} (${item.programcode})`} disabled={!form.regulation} /></Grid>
            <Grid item xs={12} md={4}><MultiSelect label="Subjects" options={subjectOptions} value={form.subjects} onChange={(value) => setForm((prev) => ({ ...prev, subjects: value, courses: [] }))} disabled={!form.programs.length} /></Grid>
            <Grid item xs={12} md={8}><MultiSelect label="Courses" options={courseOptions} value={form.courses} onChange={(value) => setForm((prev) => ({ ...prev, courses: value }))} getLabel={(item) => `${item.programcode} | Sem ${item.semester} | ${item.subject} | ${item.course} (${item.coursecode}) | ${item.deliverytype || "-"}`} disabled={!form.programs.length} /></Grid>
          </Grid>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Box sx={{ height: 580 }}><DataGrid rows={rows} getRowId={(row) => row._id} columns={courseColumns} slots={{ toolbar: GridToolbar }} pageSizeOptions={[10, 25, 50, 100]} /></Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function ConductExamAutoScheduler2Page() {
  const [exams, setExams] = useState([]);
  const [rows, setRows] = useState([]);
  const [institution, setInstitution] = useState({});
  const [ollama, setOllama] = useState([]);
  const [form, setForm] = useState({ academicyear: "", examcode: "", programs: [], fromdate: "", todate: "", slot1: "10:00 AM - 1:00 PM", slot2: "2:00 PM - 5:00 PM", provider: "Gemini", geminiModel: "gemini-2.5-flash", ollamaConfigId: "", rules: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [aiNotes, setAiNotes] = useState("");

  const loadBase = async () => {
    const [examRes, rowRes, ollamaRes, institutionRes] = await Promise.all([
      ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/conductexam/examcourses", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/ollama-configuration", { params: { colid: global1.colid } }).catch(() => ({ data: { data: [] } })),
      ep1.get("/vins", { params: { colid: global1.colid } }).catch(() => ({ data: {} }))
    ]);
    setExams(examRes.data?.data || []);
    setRows(rowRes.data?.data || []);
    setOllama(ollamaRes.data?.data || ollamaRes.data?.ollama || []);
    setInstitution(institutionRes.data || {});
  };

  useEffect(() => { loadBase().catch((err) => setError(err.response?.data?.message || "Unable to load scheduler data.")); }, []);

  const academicYears = useMemo(() => uniq([...exams.map((row) => row.academicyear), ...rows.map((row) => row.academicyear)]), [exams, rows]);
  const examOptions = useMemo(() => exams.filter((row) => !form.academicyear || row.academicyear === form.academicyear), [exams, form.academicyear]);
  const programOptions = useMemo(() => {
    const map = new Map();
    rows.filter((row) => row.academicyear === form.academicyear && row.examcode === form.examcode).forEach((row) => {
      if (row.programcode) map.set(byCode(row), { program: row.program, programcode: row.programcode });
    });
    return [...map.values()].sort((a, b) => text(a.program).localeCompare(text(b.program)));
  }, [rows, form.academicyear, form.examcode]);
  const filteredRows = useMemo(() => rows.filter((row) => row.academicyear === form.academicyear && row.examcode === form.examcode && (!form.programs.length || form.programs.some((p) => p.programcode === row.programcode))), [rows, form]);

  const selectExam = (examcode) => {
    const exam = exams.find((row) => row.examcode === examcode);
    setForm((prev) => ({ ...prev, examcode, academicyear: exam?.academicyear || prev.academicyear, programs: [] }));
  };

  const runSchedule = async (mode) => {
    if (!form.academicyear || !form.examcode || !form.fromdate || !form.todate) {
      setError("Select academic year, exam, start date and end date.");
      return;
    }
    if (mode === "ai" && form.provider === "Ollama" && !form.ollamaConfigId) {
      setError("Select Ollama configuration.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setAiNotes("");
    try {
      const payload = { ...form, colid: global1.colid, user: global1.user, programcodes: form.programs.map((row) => row.programcode) };
      const endpoint = mode === "ai" ? "/api/v2/conductexam/examcourses-ai-schedule" : "/api/v2/conductexam/examcourses-autoschedule";
      const res = await ep1.post(endpoint, payload);
      setMessage(res.data?.message || "Schedule updated.");
      setAiNotes(res.data?.aiText || "");
      const rowRes = await ep1.get("/api/v2/conductexam/examcourses", { params: { colid: global1.colid, academicyear: form.academicyear, examcode: form.examcode } });
      setRows(rowRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to schedule exam courses.");
    } finally {
      setLoading(false);
    }
  };

  const printPreview = () => {
    printExamSchedule({
      title: "Exam Auto Schedule",
      institution,
      meta: {
        "Academic Year": form.academicyear || "All",
        "Exam Code": form.examcode || "All",
        "Programs": form.programs.length ? form.programs.map((row) => row.programcode).join(", ") : "All",
        "Start Date": form.fromdate || "",
        "End Date": form.todate || "",
        "Generated On": new Date().toLocaleString()
      },
      sections: [{
        title: "Scheduled Courses",
        rows: filteredRows,
        columns: courseColumns.map((column) => ({ field: column.field, headerName: column.headerName })),
        summary: [
          { label: "Total Rows", value: filteredRows.length },
          { label: "Scheduled Rows", value: filteredRows.filter((row) => row.examdate).length },
          { label: "Unscheduled Rows", value: filteredRows.filter((row) => !row.examdate).length }
        ]
      }]
    });
  };

  return (
    <MenuPageShell title="Exam auto scheduler 2">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Exam auto scheduler 2</Typography>
              <Typography color="text.secondary">Select programs in bulk and allocate exam dates and slots after course population.</Typography>
            </Box>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={printPreview} disabled={!filteredRows.length}>Print Preview</Button>
          </Stack>
        </Paper>
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.5}><Autocomplete options={academicYears} value={form.academicyear} onChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value || "", examcode: "", programs: [] }))} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={examOptions} value={examOptions.find((row) => row.examcode === form.examcode) || null} getOptionLabel={(row) => row?._id ? `${row.examname} (${row.examcode})` : ""} onChange={(_, value) => selectExam(value?.examcode || "")} renderInput={(params) => <TextField {...params} label="Exam / Exam Code" />} /></Grid>
            <Grid item xs={12} md={3.5}><MultiSelect label="Programs" options={programOptions} value={form.programs} onChange={(value) => setForm((prev) => ({ ...prev, programs: value }))} getLabel={(item) => `${item.program} (${item.programcode})`} disabled={!form.examcode} /></Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth type="date" label="Start Date" value={form.fromdate} onChange={(e) => setForm((p) => ({ ...p, fromdate: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth type="date" label="End Date" value={form.todate} onChange={(e) => setForm((p) => ({ ...p, todate: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Slot 1" value={form.slot1} onChange={(e) => setForm((p) => ({ ...p, slot1: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Slot 2" value={form.slot2} onChange={(e) => setForm((p) => ({ ...p, slot2: e.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="AI Provider" value={form.provider} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="Gemini">Gemini</MenuItem><MenuItem value="Ollama">Ollama</MenuItem></TextField></Grid>
            {form.provider === "Gemini" ? <Grid item xs={12} md={2}><TextField select fullWidth label="Gemini Model" value={form.geminiModel} onChange={(e) => setForm((p) => ({ ...p, geminiModel: e.target.value }))}>{geminiModels.map((model) => <MenuItem key={model} value={model}>{model}</MenuItem>)}</TextField></Grid> : <Grid item xs={12} md={2}><TextField select fullWidth label="Ollama" value={form.ollamaConfigId} onChange={(e) => setForm((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{ollama.map((item) => <MenuItem key={item._id} value={item._id}>{item.name || item.modelname}</MenuItem>)}</TextField></Grid>}
            <Grid item xs={12} md={8}><TextField fullWidth multiline minRows={2} label="AI scheduling rules / prompt" value={form.rules} onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={loading} onClick={() => runSchedule("auto")} sx={{ height: 56 }}>{loading ? <CircularProgress size={22} color="inherit" /> : "Auto Schedule"}</Button></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="outlined" disabled={loading} onClick={() => runSchedule("ai")} sx={{ height: 56 }}>Schedule with AI</Button></Grid>
            {aiNotes && <Grid item xs={12}><Alert severity="info" sx={{ whiteSpace: "pre-wrap" }}>{aiNotes}</Alert></Grid>}
          </Grid>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Box sx={{ height: 620 }}><DataGrid rows={filteredRows} getRowId={(row) => row._id} columns={courseColumns} slots={{ toolbar: GridToolbar }} pageSizeOptions={[10, 25, 50, 100]} /></Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
