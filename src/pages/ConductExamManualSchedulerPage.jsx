import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import { addOption, handleAddOption, renderAddOption } from "./addableAutocompleteHelpers";

const subjectTypes = ["Major", "Minor", "IDC", "MDC", "AEC", "SEC", "VAC"];
const courseTypes = ["Theory", "Practical", "Tutorial", "Internship", "Project", "Experiential learning"];
const blankForm = {
  academicyear: "",
  regulation: "",
  exam: "",
  examcode: "",
  examdate: "",
  examslot: "",
  program: "",
  programcode: "",
  type: "Major",
  subject: "",
  semester: "",
  course: "",
  coursecode: "",
  coursetype: "Theory",
  deliverytype: "",
  coursemastercode: ""
};
const blankFilters = {
  academicyear: "",
  regulation: "",
  examcode: "",
  programcode: "",
  semester: "",
  coursecode: "",
  examdate: "",
  examslot: ""
};
const uniq = (items) => [...new Set((items || []).map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const normalizeIdSelection = (selection) => Array.isArray(selection) ? selection : Array.from(selection?.ids || []);

export default function ConductExamManualSchedulerPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [courseMapRows, setCourseMapRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(blankFilters);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadExams();
    loadCourseMapRows();
  }, []);

  const loadExams = async () => {
    try {
      const res = await ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } });
      setExams(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exams.");
    }
  };

  const loadCourseMapRows = async (params = {}) => {
    try {
      const res = await ep1.get("/api/v2/conductexam/course-options", { params: { colid: global1.colid, ...params } });
      setCourseMapRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load course options.");
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await ep1.get("/api/v2/conductexam/examcourses", { params });
      setRows(res.data?.data || []);
      setSelectedIds([]);
      setMessage(`${res.data?.data?.length || 0} rows loaded.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exam scheduler rows.");
    } finally {
      setLoading(false);
    }
  };

  const examOptions = useMemo(() => exams.map((exam) => ({
    ...exam,
    label: `${exam.academicyear || ""} - ${exam.examname || exam.exam || ""} (${exam.examcode || ""})`
  })), [exams]);

  const selectedExam = useMemo(() => exams.find((exam) => exam.examcode === form.examcode), [exams, form.examcode]);

  const baseCourseRows = useMemo(() => courseMapRows.filter((row) => {
    if (form.academicyear && row.academicyear !== form.academicyear) return false;
    if (form.regulation && row.regulation !== form.regulation) return false;
    if (form.programcode && row.programcode !== form.programcode) return false;
    if (form.type && row.type !== form.type) return false;
    if (form.subject && row.subject !== form.subject) return false;
    if (form.semester && row.semester !== form.semester) return false;
    return true;
  }), [courseMapRows, form]);

  const regulationOptions = useMemo(() => uniq(courseMapRows.filter((row) => !form.academicyear || row.academicyear === form.academicyear).map((row) => row.regulation)), [courseMapRows, form.academicyear]);
  const programOptions = useMemo(() => {
    const map = new Map();
    courseMapRows.filter((row) => (!form.academicyear || row.academicyear === form.academicyear) && (!form.regulation || row.regulation === form.regulation)).forEach((row) => {
      if (row.programcode) map.set(row.programcode, { program: row.program, programcode: row.programcode });
    });
    return [...map.values()].sort((a, b) => String(a.program).localeCompare(String(b.program)));
  }, [courseMapRows, form.academicyear, form.regulation]);
  const subjectOptions = useMemo(() => uniq(courseMapRows.filter((row) => (!form.academicyear || row.academicyear === form.academicyear) && (!form.regulation || row.regulation === form.regulation) && (!form.programcode || row.programcode === form.programcode) && (!form.type || row.type === form.type)).map((row) => row.subject)), [courseMapRows, form]);
  const semesterOptions = useMemo(() => uniq(courseMapRows.filter((row) => (!form.academicyear || row.academicyear === form.academicyear) && (!form.regulation || row.regulation === form.regulation) && (!form.programcode || row.programcode === form.programcode) && (!form.type || row.type === form.type) && (!form.subject || row.subject === form.subject)).map((row) => row.semester)), [courseMapRows, form]);
  const courseOptions = useMemo(() => {
    const map = new Map();
    baseCourseRows.forEach((row) => {
      if (row.coursecode) map.set(row.coursecode, row);
    });
    return [...map.values()].sort((a, b) => String(a.course).localeCompare(String(b.course)));
  }, [baseCourseRows]);

  const filterOptions = useMemo(() => ({
    academicyear: uniq([...exams.map((row) => row.academicyear), ...courseMapRows.map((row) => row.academicyear), ...rows.map((row) => row.academicyear)]),
    regulation: uniq([...courseMapRows.map((row) => row.regulation), ...rows.map((row) => row.regulation)]),
    examcode: uniq([...exams.map((row) => row.examcode), ...rows.map((row) => row.examcode)]),
    programcode: uniq([...courseMapRows.map((row) => row.programcode), ...rows.map((row) => row.programcode)]),
    semester: uniq([...courseMapRows.map((row) => row.semester), ...rows.map((row) => row.semester)]),
    coursecode: uniq([...courseMapRows.map((row) => row.coursecode), ...rows.map((row) => row.coursecode)]),
    examdate: uniq(rows.map((row) => row.examdate ? String(row.examdate).slice(0, 10) : "")),
    examslot: uniq(rows.map((row) => row.examslot))
  }), [exams, courseMapRows, rows]);

  const setExam = (exam) => {
    if (handleAddOption(exam, navigate)) return;
    setForm((prev) => ({
      ...prev,
      academicyear: exam?.academicyear || "",
      exam: exam?.examname || exam?.exam || "",
      examcode: exam?.examcode || "",
      regulation: "",
      program: "",
      programcode: "",
      subject: "",
      semester: "",
      course: "",
      coursecode: ""
    }));
    if (exam?.academicyear) loadCourseMapRows({ academicyear: exam.academicyear });
  };

  const setProgram = (program) => {
    if (handleAddOption(program, navigate)) return;
    setForm((prev) => ({
      ...prev,
      program: program?.program || "",
      programcode: program?.programcode || "",
      subject: "",
      semester: "",
      course: "",
      coursecode: ""
    }));
  };

  const setCourse = (course) => {
    if (handleAddOption(course, navigate)) return;
    setForm((prev) => ({
      ...prev,
      course: course?.course || "",
      coursecode: course?.coursecode || "",
      coursetype: course?.coursetype || "Theory",
      deliverytype: course?.deliverytype || "",
      coursemastercode: course?.coursemastercode || ""
    }));
  };

  const saveRow = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = { ...form, id: editId, colid: global1.colid, user: global1.user };
      await ep1.post("/api/v2/conductexam/examcourses", payload);
      setMessage(editId ? "Manual scheduler row updated." : "Manual scheduler row saved.");
      setForm(blankForm);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save manual scheduler row.");
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditId(row._id);
    setForm({
      academicyear: row.academicyear || "",
      regulation: row.regulation || "",
      exam: row.exam || "",
      examcode: row.examcode || "",
      examdate: row.examdate ? String(row.examdate).slice(0, 10) : "",
      examslot: row.examslot || "",
      program: row.program || "",
      programcode: row.programcode || "",
      type: row.type || "Major",
      subject: row.subject || "",
      semester: row.semester || "",
      course: row.course || "",
      coursecode: row.coursecode || "",
      coursetype: row.coursetype || "Theory",
      deliverytype: row.deliverytype || "",
      coursemastercode: row.coursemastercode || ""
    });
    if (row.academicyear) loadCourseMapRows({ academicyear: row.academicyear });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async (ids) => {
    const targetIds = ids?.length ? ids : selectedIds;
    if (!targetIds.length) {
      setError("Select at least one row to delete.");
      return;
    }
    if (!window.confirm(`Delete ${targetIds.length} selected scheduler row(s)?`)) return;
    try {
      setSaving(true);
      setError("");
      await Promise.all(targetIds.map((id) => ep1.post("/api/v2/conductexam/examcourses-delete", { id, colid: global1.colid })));
      setMessage(`${targetIds.length} row(s) deleted.`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected rows.");
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{
      academicyear: "2026-27",
      regulation: "R2026",
      exam: "Semester End Examination",
      examcode: "SEE-2026-ODD",
      examdate: "2026-12-01",
      examslot: "10:00 AM - 01:00 PM",
      program: "Master of Computer Applications",
      programcode: "MCA",
      type: "Major",
      subject: "Computer Applications",
      semester: "1",
      course: "Programming Fundamentals",
      coursecode: "MCA101",
      coursetype: "Theory",
      deliverytype: "",
      coursemastercode: ""
    }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manual Scheduler");
    XLSX.writeFile(workbook, "exam_scheduler_manual_template.xlsx");
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      setError("");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({ rowNumber: index + 2, ...row }));
      const res = await ep1.post("/api/v2/conductexam/examcourses-bulk", { colid: global1.colid, user: global1.user, items });
      const errors = res.data?.errors || [];
      setMessage(`${res.data?.saved || 0} rows uploaded.${errors.length ? ` ${errors.length} row(s) skipped.` : ""}`);
      if (errors.length) setError(errors.slice(0, 5).map((item) => `Row ${item.rowNumber}: ${item.message}`).join("\n"));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload manual scheduler file.");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { field: "academicyear", headerName: "Academic Year", width: 130 },
    { field: "regulation", headerName: "Regulation", width: 130 },
    { field: "exam", headerName: "Exam", minWidth: 180, flex: 1 },
    { field: "examcode", headerName: "Exam Code", width: 140 },
    { field: "examdate", headerName: "Exam Date", width: 130, valueGetter: ({ row }) => row.examdate ? String(row.examdate).slice(0, 10) : "" },
    { field: "examslot", headerName: "Exam Slot", width: 170 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "type", headerName: "Type", width: 100 },
    { field: "subject", headerName: "Subject", minWidth: 150, flex: 1 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", minWidth: 190, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "coursetype", headerName: "Course Type", width: 130 },
    { field: "deliverytype", headerName: "Delivery Type", width: 140 },
    { field: "coursemastercode", headerName: "Course Master Code", width: 180 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => editRow(params.row)}>Edit</Button>
          <Button size="small" color="error" onClick={() => deleteRows([params.row._id])}>Delete</Button>
        </Stack>
      )
    }
  ], [selectedIds]);

  return (
    <MenuPageShell title="Exam Scheduler Manual">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Exam Scheduler Manual</Typography>
              <Typography color="text.secondary">Full CRUD and bulk upload for coursewise exam date and slot entries.</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}>Template</Button>
              <Button component="label" variant="contained" startIcon={<UploadFileIcon />} disabled={saving}>
                Bulk Upload
                <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-wrap" }} onClose={() => setError("")}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit Scheduler Row" : "Add Scheduler Row"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={[addOption("+ Add Exam", "/conduct-exam-master"), ...examOptions]}
                value={selectedExam || null}
                getOptionLabel={(option) => option?.__addOption ? option.label : option?.label || ""}
                isOptionEqualToValue={(option, value) => option?._id === value?._id}
                onChange={(event, value) => setExam(value)}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option.label}</li>}
                renderInput={(params) => <TextField {...params} label="Exam" required />}
              />
            </Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth required label="Academic Year" value={form.academicyear} onChange={(e) => setForm({ ...form, academicyear: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete
                freeSolo
                options={[addOption("+ Add Regulation", "/regulationmaster"), ...regulationOptions]}
                value={form.regulation || ""}
                onChange={(event, value) => handleAddOption(value, navigate) || setForm({ ...form, regulation: value || "", program: "", programcode: "", subject: "", semester: "", course: "", coursecode: "" })}
                onInputChange={(event, value, reason) => reason === "input" && setForm({ ...form, regulation: value })}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option}</li>}
                renderInput={(params) => <TextField {...params} required label="Regulation" />}
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <Autocomplete
                options={[addOption("+ Add Program", "/programmanagement"), ...programOptions]}
                value={programOptions.find((item) => item.programcode === form.programcode) || null}
                getOptionLabel={(option) => option?.__addOption ? option.label : option ? `${option.program || ""} (${option.programcode || ""})` : ""}
                isOptionEqualToValue={(option, value) => option?.programcode === value?.programcode}
                onChange={(event, value) => setProgram(value)}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option.program} ({option.programcode})</li>}
                renderInput={(params) => <TextField {...params} required label="Program" />}
              />
            </Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth required label="Program Code" value={form.programcode} onChange={(e) => setForm({ ...form, programcode: e.target.value })} /></Grid>
            <Grid item xs={12} md={1.5}><TextField select fullWidth required label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, subject: "", semester: "", course: "", coursecode: "" })}>{subjectTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete
                freeSolo
                options={[addOption("+ Add Regulation Course Map", "/regulationcoursemap"), ...subjectOptions]}
                value={form.subject || ""}
                onChange={(event, value) => handleAddOption(value, navigate) || setForm({ ...form, subject: value || "", semester: "", course: "", coursecode: "" })}
                onInputChange={(event, value, reason) => reason === "input" && setForm({ ...form, subject: value })}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option}</li>}
                renderInput={(params) => <TextField {...params} required label="Subject" />}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <Autocomplete
                freeSolo
                options={[addOption("+ Add Regulation Course Map", "/regulationcoursemap"), ...semesterOptions]}
                value={form.semester || ""}
                onChange={(event, value) => handleAddOption(value, navigate) || setForm({ ...form, semester: value || "", course: "", coursecode: "" })}
                onInputChange={(event, value, reason) => reason === "input" && setForm({ ...form, semester: value })}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option}</li>}
                renderInput={(params) => <TextField {...params} required label="Semester" />}
              />
            </Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="date" required label="Exam Date" value={form.examdate} onChange={(e) => setForm({ ...form, examdate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth required label="Exam Slot" value={form.examslot} onChange={(e) => setForm({ ...form, examslot: e.target.value })} placeholder="10:00 AM - 01:00 PM" /></Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo
                options={[addOption("+ Add Regulation Course Map", "/regulationcoursemap"), ...courseOptions]}
                value={courseOptions.find((item) => item.coursecode === form.coursecode) || (form.course ? { course: form.course, coursecode: form.coursecode } : null)}
                getOptionLabel={(option) => option?.__addOption ? option.label : option ? `${option.course || ""}${option.coursecode ? ` (${option.coursecode})` : ""}` : ""}
                isOptionEqualToValue={(option, value) => option?.coursecode === value?.coursecode}
                onChange={(event, value) => setCourse(value)}
                onInputChange={(event, value, reason) => reason === "input" && setForm({ ...form, course: value })}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option.course} ({option.coursecode})</li>}
                renderInput={(params) => <TextField {...params} required label="Course" />}
              />
            </Grid>
            <Grid item xs={12} md={2}><TextField fullWidth required label="Course Code" value={form.coursecode} onChange={(e) => setForm({ ...form, coursecode: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Course Type" value={form.coursetype} onChange={(e) => setForm({ ...form, coursetype: e.target.value })}>{courseTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Delivery Type" value={form.deliverytype} onChange={(e) => setForm({ ...form, deliverytype: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Course Master Code" value={form.coursemastercode} onChange={(e) => setForm({ ...form, coursemastercode: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={saveRow}>{editId ? "Update Row" : "Save Row"}</Button>
                <Button variant="outlined" onClick={() => { setForm(blankForm); setEditId(""); }}>Clear</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Load Scheduler Rows</Typography>
          <Grid container spacing={2}>
            {Object.keys(blankFilters).map((field) => (
              <Grid item xs={12} sm={6} md={field === "coursecode" ? 2.5 : 2} key={field}>
                <Autocomplete
                  freeSolo
                  options={filterOptions[field] || []}
                  value={filters[field] || ""}
                  onInputChange={(event, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
                  onChange={(event, value) => setFilters((prev) => ({ ...prev, [field]: value || "" }))}
                  renderInput={(params) => <TextField {...params} label={field} />}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={2}>
              <Button fullWidth variant="contained" onClick={loadRows} disabled={loading} sx={{ height: 56 }}>{loading ? <CircularProgress size={22} color="inherit" /> : "Load"}</Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button fullWidth variant="outlined" onClick={() => { setFilters(blankFilters); setRows([]); setSelectedIds([]); }} sx={{ height: 56 }}>Clear</Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mb: 1.5 }}>
            <Typography variant="h6" fontWeight={900}>Manual Scheduler Rows ({rows.length})</Typography>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={!selectedIds.length || saving} onClick={() => deleteRows(selectedIds)}>Delete Selected ({selectedIds.length})</Button>
          </Stack>
          <Box sx={{ height: 620 }}>
            <DataGrid
              rows={rows}
              getRowId={(row) => row._id}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(selection) => setSelectedIds(normalizeIdSelection(selection))}
              slots={{ toolbar: GridToolbar }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
