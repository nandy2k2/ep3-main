import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankForm = {
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  semester: "",
  exam: "",
  examcode: "",
  note: "",
  status: "Active"
};

const blankStudentFilters = {
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  semester: "",
  section: "",
  name: "",
  regno: "",
  email: ""
};

const filterFields = ["academicyear", "regulation", "examcode", "programcode", "semester", "regno", "status"];
const labels = { academicyear: "Academic Year", regulation: "Regulation", examcode: "Exam Code", programcode: "Program Code", regno: "Reg No" };
const text = (value) => String(value ?? "").trim();
const uniq = (items = []) => [...new Set(items.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const normalizeSelection = (selection) => Array.isArray(selection) ? selection : Array.from(selection?.ids || []);
const examLabel = (exam) => exam ? `${exam.examname || exam.exam || ""} (${exam.examcode || ""})` : "";
const programLabel = (program) => program ? `${program.program || "Program"} (${program.programcode || ""})` : "";

export default function ExamScholarshipPage() {
  const [rows, setRows] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentFilters, setStudentFilters] = useState(blankStudentFilters);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState({});
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const role = global1.role || global1.userrole || global1.usertype || "";
  const useremail = global1.email || global1.user || "";

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/conductexam/exam-scholarship-options", {
        params: { colid: global1.colid, useremail, role }
      });
      setPrograms(res.data?.programs || []);
      setExams(res.data?.exams || []);
      setOptions(res.data?.options || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load options");
    }
  };

  const loadStudentsForContext = async (source = form, nextFilters = studentFilters) => {
    const effective = {
      academicyear: text(nextFilters.academicyear) || source.academicyear,
      regulation: text(nextFilters.regulation) || source.regulation,
      program: text(nextFilters.program) || source.program,
      programcode: text(nextFilters.programcode) || source.programcode,
      semester: text(nextFilters.semester) || source.semester,
      section: text(nextFilters.section)
    };
    if (!effective.academicyear || !effective.regulation || !effective.programcode || !effective.semester) {
      setStudents([]);
      setSelectedStudentIds([]);
      setError("Please select academic year, regulation, program and semester before loading students.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid, ...effective };
      ["name", "regno", "email"].forEach((field) => {
        if (text(nextFilters?.[field])) params[field] = nextFilters[field];
      });
      const studentRes = await ep1.get("/api/v2/conductexam/exam-scholarship-students", { params });
      setStudents(studentRes.data?.data || []);
      setSelectedStudentIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid, useremail, role };
      Object.entries(nextFilters || {}).forEach(([field, value]) => { if (text(value)) params[field] = value; });
      const res = await ep1.get("/api/v2/conductexam/exam-scholarship", { params });
      setRows(res.data?.data || []);
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exam scholarship rows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const dynamicOptions = useMemo(() => {
    const merged = { ...options };
    filterFields.forEach((field) => {
      merged[field] = uniq([...(merged[field] || []), ...rows.map((row) => row[field])]);
    });
    return merged;
  }, [options, rows]);

  const studentSourceOptions = options.studentFilterOptions || {};

  const updateForm = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (["academicyear", "regulation", "programcode", "semester"].some((field) => Object.prototype.hasOwnProperty.call(patch, field))) {
      setStudents([]);
      setSelectedStudentIds([]);
    }
  };

  const selectExam = (exam) => {
    updateForm({
      academicyear: exam?.academicyear || form.academicyear,
      regulation: exam?.regulation || form.regulation,
      exam: exam?.examname || exam?.exam || "",
      examcode: exam?.examcode || ""
    });
  };

  const selectProgram = (program) => {
    updateForm({
      program: program?.program || "",
      programcode: program?.programcode || "",
      semester: form.semester
    });
  };

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedStudentIds.includes(student._id)),
    [students, selectedStudentIds]
  );

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const studentsToSave = editingId
        ? [{ student: selectedStudents[0]?.name || selectedStudents[0]?.student || form.student, regno: selectedStudents[0]?.regno || form.regno, email: selectedStudents[0]?.email || form.email }]
        : selectedStudents.map((student) => ({ student: student.name || student.student, regno: student.regno, email: student.email }));
      const res = await ep1.post("/api/v2/conductexam/exam-scholarship", {
        ...form,
        id: editingId,
        colid: global1.colid,
        user: global1.user,
        students: studentsToSave
      });
      setMessage(`Saved ${res.data?.saved || res.data?.data?.length || 1} scholarship row(s).`);
      setEditingId("");
      setForm(blankForm);
      setStudentFilters(blankStudentFilters);
      setSelectedStudentIds([]);
      setStudents([]);
      await loadRows();
      await loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save exam scholarship");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    const next = { ...blankForm, ...row };
    setForm(next);
    const editStudent = { _id: `edit-${row._id}`, name: row.student, student: row.student, regno: row.regno, email: row.email, academicyear: row.academicyear, regulation: row.regulation, program: row.program, programcode: row.programcode, semester: row.semester };
    setStudents([editStudent]);
    setSelectedStudentIds([editStudent._id]);
    setStudentFilters({
      ...blankStudentFilters,
      academicyear: row.academicyear || "",
      regulation: row.regulation || "",
      program: row.program || "",
      programcode: row.programcode || "",
      semester: row.semester || "",
      name: row.student || "",
      regno: row.regno || "",
      email: row.email || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (ids) => {
    const target = Array.isArray(ids) ? ids : [ids];
    if (!target.length) return;
    if (!window.confirm(`Delete ${target.length} selected row${target.length === 1 ? "" : "s"}?`)) return;
    try {
      setSaving(true);
      await ep1.post("/api/v2/conductexam/exam-scholarship-delete", { colid: global1.colid, ids: target });
      setMessage("Deleted selected row(s).");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete row(s)");
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      academicyear: "2026-27",
      regulation: "R2026",
      exam: "Regular Examination",
      examcode: "REG-2026",
      program: "BCA",
      programcode: "BCA",
      semester: "1",
      student: "Student Name",
      regno: "REG001",
      email: "student@example.com",
      note: "Exam scholarship approved",
      status: "Active"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Scholarship");
    XLSX.writeFile(wb, "exam_scholarship_template.xlsx");
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const fileRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const res = await ep1.post("/api/v2/conductexam/exam-scholarship-bulk", { colid: global1.colid, user: global1.user, rows: fileRows });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      const errors = res.data?.errors || [];
      if (errors.length) setError(errors.slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload Excel");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 100, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />, <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row._id)} />] },
    { field: "academicyear", headerName: "Academic Year", width: 130 },
    { field: "regulation", headerName: "Regulation", width: 120 },
    { field: "exam", headerName: "Exam", width: 180 },
    { field: "examcode", headerName: "Exam Code", width: 130 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "student", headerName: "Student", width: 190 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "note", headerName: "Note", width: 260 },
    { field: "status", headerName: "Status", width: 110 }
  ];

  const studentColumns = [
    { field: "name", headerName: "Student", width: 220 },
    { field: "regno", headerName: "Reg No", width: 150 },
    { field: "email", headerName: "Email", width: 230 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "section", headerName: "Section", width: 110 }
  ];

  return (
    <MenuPageShell title="Exam scholarship">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={950}>Exam scholarship</Typography>
                <Typography color="text.secondary">This page lists students whose exam fee will be waived for the selected exam. If a matching row exists, preapproved forms will not create an exam fee ledger entry.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />} disabled={saving}>
                  Bulk Upload
                  <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} />
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2.5}><Autocomplete options={options.academicyears || []} value={form.academicyear || null} onChange={(_, value) => updateForm({ academicyear: value || "", examcode: "", exam: "" })} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
              <Grid item xs={12} md={2.5}><Autocomplete options={uniq([...(options.regulations || []), ...exams.filter((item) => !form.academicyear || item.academicyear === form.academicyear).map((item) => item.regulation)])} value={form.regulation || null} onChange={(_, value) => updateForm({ regulation: value || "", examcode: "", exam: "" })} renderInput={(params) => <TextField {...params} label="Regulation" />} /></Grid>
              <Grid item xs={12} md={3.5}><Autocomplete options={programs.filter((item) => !form.academicyear || !item.year || item.year === form.academicyear)} getOptionLabel={programLabel} value={programs.find((item) => item.programcode === form.programcode) || null} onChange={(_, value) => selectProgram(value)} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth label="Program Code" value={form.programcode} InputProps={{ readOnly: true }} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete freeSolo options={uniq([...(options.semesters || []), ...students.map((item) => item.semester)])} value={form.semester || ""} onInputChange={(_, value) => updateForm({ semester: value || "" })} onChange={(_, value) => updateForm({ semester: value || "" })} renderInput={(params) => <TextField {...params} label="Semester" />} /></Grid>
              <Grid item xs={12} md={4}><Autocomplete options={exams.filter((item) => (!form.academicyear || item.academicyear === form.academicyear) && (!form.regulation || !item.regulation || item.regulation === form.regulation))} getOptionLabel={examLabel} value={exams.find((item) => item.examcode === form.examcode) || null} onChange={(_, value) => selectExam(value)} renderInput={(params) => <TextField {...params} label="Exam" />} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Exam Code" value={form.examcode} InputProps={{ readOnly: true }} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Note" value={form.note} onChange={(e) => updateForm({ note: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<SaveIcon />} sx={{ height: 56 }} disabled={saving} onClick={save}>{editingId ? "Update" : "Submit"}</Button></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => { setForm(blankForm); setEditingId(""); setStudentFilters(blankStudentFilters); setStudents([]); setSelectedStudentIds([]); }}>Clear</Button></Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6" fontWeight={900}>Select students</Typography>
                <Typography variant="body2" color="text.secondary">Apply filters, load students, then select one or more students using the checkboxes.</Typography>
              </Box>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={studentSourceOptions.academicyears || []}
                    value={studentFilters.academicyear || null}
                    onChange={(_, value) => setStudentFilters((prev) => ({ ...prev, academicyear: value || "" }))}
                    renderInput={(params) => <TextField {...params} size="small" label="Academic Year" />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={studentSourceOptions.regulations || []}
                    value={studentFilters.regulation || null}
                    onChange={(_, value) => setStudentFilters((prev) => ({ ...prev, regulation: value || "" }))}
                    renderInput={(params) => <TextField {...params} size="small" label="Regulation" />}
                  />
                </Grid>
                <Grid item xs={12} md={2.8}>
                  <Autocomplete
                    options={studentSourceOptions.programs || []}
                    getOptionLabel={programLabel}
                    value={(studentSourceOptions.programs || []).find((item) => item.programcode === studentFilters.programcode) || null}
                    onChange={(_, value) => setStudentFilters((prev) => ({ ...prev, program: value?.program || "", programcode: value?.programcode || "" }))}
                    renderInput={(params) => <TextField {...params} size="small" label="Program" />}
                  />
                </Grid>
                <Grid item xs={12} md={1.6}>
                  <TextField fullWidth size="small" label="Program Code" value={studentFilters.programcode || ""} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} md={1.6}>
                  <Autocomplete
                    options={studentSourceOptions.semesters || []}
                    value={studentFilters.semester || null}
                    onChange={(_, value) => setStudentFilters((prev) => ({ ...prev, semester: value || "" }))}
                    renderInput={(params) => <TextField {...params} size="small" label="Semester" />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={studentSourceOptions.sections || []}
                    value={studentFilters.section || null}
                    onChange={(_, value) => setStudentFilters((prev) => ({ ...prev, section: value || "" }))}
                    renderInput={(params) => <TextField {...params} size="small" label="Section" />}
                  />
                </Grid>
                {["name", "regno", "email"].map((field) => (
                  <Grid item xs={12} md={2.5} key={field}>
                    <TextField
                      fullWidth
                      size="small"
                      label={field === "regno" ? "Reg No" : field.charAt(0).toUpperCase() + field.slice(1)}
                      value={studentFilters[field] || ""}
                      onChange={(event) => setStudentFilters((prev) => ({ ...prev, [field]: event.target.value }))}
                    />
                  </Grid>
                ))}
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={() => loadStudentsForContext()}>
                    Load students
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="outlined" sx={{ height: "100%" }} onClick={() => { setStudentFilters(blankStudentFilters); setStudents([]); setSelectedStudentIds([]); }}>
                    Clear student filters
                  </Button>
                </Grid>
              </Grid>
              <Box sx={{ height: 340 }}>
                <DataGrid
                  rows={students}
                  columns={studentColumns}
                  getRowId={(row) => row._id}
                  loading={loading}
                  checkboxSelection
                  disableRowSelectionOnClick
                  rowSelectionModel={selectedStudentIds}
                  onRowSelectionModelChange={(selection) => setSelectedStudentIds(normalizeSelection(selection))}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true } }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">{selectedStudentIds.length} student(s) selected.</Typography>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              {filterFields.map((field) => (
                <Grid item xs={12} md={2} key={field}>
                  <Autocomplete freeSolo options={dynamicOptions[field] || []} value={filters[field] || ""} onInputChange={(_, value) => setFilters((prev) => ({ ...prev, [field]: value }))} onChange={(_, value) => setFilters((prev) => ({ ...prev, [field]: value || "" }))} renderInput={(params) => <TextField {...params} size="small" label={labels[field] || field} />} />
                </Grid>
              ))}
              <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={() => loadRows()}>Load</Button></Grid>
              <Grid item xs={12} md={1.8}><Button fullWidth variant="outlined" color="error" sx={{ height: "100%" }} disabled={!selectedIds.length || saving} onClick={() => remove(selectedIds)}>Delete Selected {selectedIds.length ? `(${selectedIds.length})` : ""}</Button></Grid>
            </Grid>
            <Box sx={{ height: 620 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row._id}
                loading={loading}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={(selection) => setSelectedIds(normalizeSelection(selection))}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_scholarship" } } }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
