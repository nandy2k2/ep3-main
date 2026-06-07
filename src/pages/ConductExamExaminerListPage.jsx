import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankForm = {
  academicyear: "",
  regulation: "",
  exam: "",
  examcode: "",
  program: "",
  programcode: "",
  type: "",
  subject: "",
  semester: "",
  course: "",
  coursecode: "",
  examinername: "",
  examineremail: ""
};
const uniq = (items) => [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const courseLabel = (row) => `${row.course || ""}${row.coursecode ? ` (${row.coursecode})` : ""}`;

export default function ConductExamExaminerListPage() {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editId, setEditId] = useState("");
  const [filters, setFilters] = useState({ academicyear: "", examcode: "", regulation: "", programcode: "", coursecode: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
    loadRows();
  }, []);

  const loadOptions = async (params = {}) => {
    const res = await ep1.get("/api/v2/conductexam/examiner-options", { params: { colid: global1.colid, ...params } });
    setCourses(res.data?.courses || []);
    setUsers(res.data?.users || []);
  };

  const loadRows = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      Object.entries(nextFilters).forEach(([key, value]) => { if (value) params[key] = value; });
      const res = await ep1.get("/api/v2/conductexam/examiners", { params });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load examiner list.");
    } finally {
      setLoading(false);
    }
  };

  const dropdowns = useMemo(() => {
    const byYear = courses.filter((row) => !form.academicyear || row.academicyear === form.academicyear);
    const byExam = byYear.filter((row) => !form.examcode || row.examcode === form.examcode);
    const byRegulation = byExam.filter((row) => !form.regulation || row.regulation === form.regulation);
    const byProgram = byRegulation.filter((row) => !form.programcode || row.programcode === form.programcode);
    const programMap = new Map();
    byRegulation.forEach((row) => {
      if (row.programcode) programMap.set(row.programcode, { programcode: row.programcode, program: row.program });
    });
    const courseMap = new Map();
    byProgram.forEach((row) => {
      if (row.coursecode) courseMap.set(row.coursecode, row);
    });
    return {
      academicyears: uniq(courses.map((row) => row.academicyear)),
      exams: uniq(byYear.map((row) => `${row.examcode}||${row.exam}`)).map((value) => {
        const [examcode, exam] = value.split("||");
        return { examcode, exam };
      }),
      regulations: uniq(byExam.map((row) => row.regulation)),
      programs: [...programMap.values()].sort((a, b) => a.program.localeCompare(b.program)),
      coursesList: [...courseMap.values()].sort((a, b) => a.course.localeCompare(b.course))
    };
  }, [courses, form]);

  const filterOptions = useMemo(() => ({
    academicyear: uniq([...courses.map((row) => row.academicyear), ...rows.map((row) => row.academicyear)]),
    examcode: uniq([...courses.map((row) => row.examcode), ...rows.map((row) => row.examcode)]),
    regulation: uniq([...courses.map((row) => row.regulation), ...rows.map((row) => row.regulation)]),
    programcode: uniq([...courses.map((row) => row.programcode), ...rows.map((row) => row.programcode)]),
    coursecode: uniq([...courses.map((row) => row.coursecode), ...rows.map((row) => row.coursecode)])
  }), [courses, rows]);

  const setCourseDetails = (coursecode) => {
    const selected = dropdowns.coursesList.find((row) => row.coursecode === coursecode);
    setForm((prev) => ({
      ...prev,
      coursecode,
      course: selected?.course || "",
      type: selected?.type || "",
      subject: selected?.subject || "",
      semester: selected?.semester || ""
    }));
  };

  const saveExaminer = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const base = { ...form, colid: global1.colid, user: global1.user };
      if (!base.academicyear || !base.examcode || !base.regulation || !base.programcode || !base.coursecode) {
        setError("Select academic year, exam, regulation, program and course.");
        return;
      }
      if (!editId && selectedUsers.length) {
        const items = selectedUsers.map((user) => ({ ...base, examinername: user.name || "", examineremail: user.email || "" }));
        const res = await ep1.post("/api/v2/conductexam/examiners-bulk", { colid: global1.colid, user: global1.user, items });
        setMessage(`${res.data?.saved || 0} examiner${res.data?.saved === 1 ? "" : "s"} saved.`);
      } else {
        if (!base.examinername || !base.examineremail) {
          setError("Select or enter examiner name and email.");
          return;
        }
        await ep1.post("/api/v2/conductexam/examiners", { ...base, id: editId });
        setMessage(editId ? "Examiner updated." : "Examiner saved.");
      }
      setForm(blankForm);
      setSelectedUsers([]);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save examiner.");
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditId(row._id);
    setForm({ ...blankForm, ...row });
    setSelectedUsers([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRow = async (id) => {
    if (!window.confirm("Delete this examiner entry?")) return;
    await ep1.post("/api/v2/conductexam/examiners-delete", { id, colid: global1.colid });
    setMessage("Examiner deleted.");
    await loadRows();
  };

  const downloadTemplate = () => {
    const first = courses[0] || {};
    const ws = XLSX.utils.json_to_sheet([{
      academicyear: first.academicyear || "2026-27",
      regulation: first.regulation || "NEP 2026",
      exam: first.exam || "Semester End Examination",
      examcode: first.examcode || "SEE-2026",
      program: first.program || "B.Com",
      programcode: first.programcode || "BCOM",
      type: first.type || "Major",
      subject: first.subject || "Accountancy",
      semester: first.semester || "1",
      course: first.course || "Financial Accounting",
      coursecode: first.coursecode || "BCOM101",
      examinername: "Examiner Name",
      examineremail: "examiner@example.com"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Examiner List");
    XLSX.writeFile(wb, "conduct_exam_examiner_list_template.xlsx");
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({ rowNumber: index + 2, ...row }));
      const res = await ep1.post("/api/v2/conductexam/examiners-bulk", { colid: global1.colid, user: global1.user, items });
      setMessage(`${res.data?.saved || 0} rows uploaded.`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to bulk upload examiners.");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Year", width: 120 },
    { field: "exam", headerName: "Exam", minWidth: 180, flex: 1 },
    { field: "examcode", headerName: "Exam Code", width: 140 },
    { field: "regulation", headerName: "Regulation", width: 140 },
    { field: "program", headerName: "Program", minWidth: 160, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "course", headerName: "Course", minWidth: 180, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "examinername", headerName: "Examiner", width: 180 },
    { field: "examineremail", headerName: "Examiner Email", width: 220 },
    { field: "actions", headerName: "Actions", width: 170, sortable: false, renderCell: (params) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => editRow(params.row)}>Edit</Button><Button size="small" color="error" onClick={() => deleteRow(params.row._id)}>Delete</Button></Stack> }
  ];

  return (
    <MenuPageShell title="Examiner List">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Examiner List</Typography>
              <Typography color="text.secondary">Register course-wise examiners for conduct examination.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={downloadTemplate} disabled={uploading || saving}>Template</Button>
              <Button component="label" variant="contained" startIcon={<UploadFileIcon />} disabled={uploading}>
                {uploading ? "Uploading..." : "Bulk Upload"}
                <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
              </Button>
            </Stack>
          </Stack>
          {(loading || saving || uploading) && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Academic Year" value={form.academicyear} onChange={(e) => setForm({ ...blankForm, academicyear: e.target.value })}>{dropdowns.academicyears.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Exam" value={form.examcode} onChange={(e) => {
              const exam = dropdowns.exams.find((item) => item.examcode === e.target.value);
              setForm((prev) => ({ ...blankForm, academicyear: prev.academicyear, examcode: e.target.value, exam: exam?.exam || "" }));
            }}>{dropdowns.exams.map((item) => <MenuItem key={item.examcode} value={item.examcode}>{item.exam} ({item.examcode})</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Regulation" value={form.regulation} onChange={(e) => setForm((prev) => ({ ...prev, regulation: e.target.value, program: "", programcode: "", course: "", coursecode: "" }))}>{dropdowns.regulations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Program" value={form.programcode} onChange={(e) => {
              const program = dropdowns.programs.find((item) => item.programcode === e.target.value);
              setForm((prev) => ({ ...prev, programcode: e.target.value, program: program?.program || "", course: "", coursecode: "" }));
            }}>{dropdowns.programs.map((item) => <MenuItem key={item.programcode} value={item.programcode}>{item.program} ({item.programcode})</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Course" value={form.coursecode} onChange={(e) => setCourseDetails(e.target.value)}>{dropdowns.coursesList.map((item) => <MenuItem key={item.coursecode} value={item.coursecode}>{courseLabel(item)}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={users}
                value={selectedUsers}
                isOptionEqualToValue={(option, value) => option.email === value.email}
                getOptionLabel={(option) => `${option.name || ""}${option.email ? ` (${option.email})` : ""}`}
                onChange={(event, value) => {
                  setSelectedUsers(value || []);
                  if (value?.length === 1) setForm((prev) => ({ ...prev, examinername: value[0].name || "", examineremail: value[0].email || "" }));
                }}
                renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} sx={{ mr: 1 }} />{option.name || ""}{option.email ? ` (${option.email})` : ""}</li>}
                renderInput={(params) => <TextField {...params} label="Bulk Select Examiners" placeholder="Search examiner" />}
              />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Examiner Name" value={form.examinername} onChange={(e) => setForm({ ...form, examinername: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Examiner Email" value={form.examineremail} onChange={(e) => setForm({ ...form, examineremail: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={saveExaminer} disabled={saving} sx={{ height: 56 }}>{saving ? "Saving..." : editId ? "Update" : selectedUsers.length > 1 ? `Save ${selectedUsers.length}` : "Save"}</Button></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={() => { setForm(blankForm); setSelectedUsers([]); setEditId(""); }} sx={{ height: 56 }}>Clear</Button></Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            {Object.entries(filters).map(([key, value]) => (
              <Grid item xs={12} md={2} key={key}>
                <TextField select fullWidth label={key} value={value} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
                  <MenuItem value="">All</MenuItem>
                  {(filterOptions[key] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
            ))}
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={() => loadRows()} disabled={loading} sx={{ height: 56 }}>{loading ? "Loading..." : "Apply"}</Button></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={() => { const next = { academicyear: "", examcode: "", regulation: "", programcode: "", coursecode: "" }; setFilters(next); loadRows(next); }} sx={{ height: 56 }}>Clear</Button></Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          {loading && <LinearProgress sx={{ mb: 1.5 }} />}
          <Box sx={{ height: 600 }}>
            <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "examiner_list" } } }} pageSizeOptions={[10, 25, 50, 100]} disableRowSelectionOnClick />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
