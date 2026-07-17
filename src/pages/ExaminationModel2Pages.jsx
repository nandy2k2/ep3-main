import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Link,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VerifiedIcon from "@mui/icons-material/Verified";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const baseForm = {
  academicyear: "2026-27",
  regulation: "",
  exam: "",
  examcode: "",
  program: "",
  programcode: "",
  semester: "",
  course: "",
  coursecode: "",
  credit: "",
  student: "",
  regno: "",
  abcid: "",
  theorymarks: "",
  theoryobtained: "",
  theorypercentage: "",
  theorygradepoint: "",
  theorygrade: "",
  practicalmarks: "",
  practicaltotal: "",
  practicalpercentage: "",
  practicalgradepoint: "",
  practicalgrade: "",
  overalltotalmarks: "",
  overallgradepoint: "",
  overallgrade: "",
  overallpercentage: "",
  gpa: "",
  status: "Pass",
  attempt: 1,
  type: "Regular",
  examdate: "",
  resultprocessdate: ""
};

const markFields = Object.keys(baseForm);
const numberFields = ["credit", "theorymarks", "theoryobtained", "theorypercentage", "theorygradepoint", "practicalmarks", "practicaltotal", "practicalpercentage", "practicalgradepoint", "overalltotalmarks", "overallgradepoint", "overallpercentage", "gpa", "attempt"];
const labels = {
  academicyear: "Academic Year",
  examcode: "Exam Code",
  programcode: "Program Code",
  coursecode: "Course Code",
  regno: "Reg No",
  abcid: "ABC ID",
  theorymarks: "Theory Total",
  theoryobtained: "Theory Obtained",
  theorypercentage: "Theory %",
  theorygradepoint: "Theory Grade Point",
  theorygrade: "Theory Grade",
  practicalmarks: "Practical Obtained",
  practicaltotal: "Practical Total",
  practicalpercentage: "Practical %",
  practicalgradepoint: "Practical Grade Point",
  practicalgrade: "Practical Grade",
  overalltotalmarks: "Overall Total Marks",
  overallgradepoint: "Overall Grade Point",
  overallgrade: "Overall Grade",
  overallpercentage: "Overall %",
  resultprocessdate: "Result Process Date"
};

const text = (value) => String(value ?? "").trim();
const msg = (err, fallback) => err.response?.data?.message || err.response?.data?.msg || fallback;
const pct = (obtained, total) => Number(total) ? Number(((Number(obtained || 0) / Number(total || 0)) * 100).toFixed(2)) : 0;

const qrPlacementSx = (position) => ({
  display: "flex",
  justifyContent: position === "bottomcenter" ? "center" : "flex-end",
  mt: 2,
  mb: 1,
  pr: position === "bottomcenter" ? 0 : 1
});

function useExamOptions() {
  const [options, setOptions] = useState({});
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const load = async () => {
    const res = await ep1.get("/api/v2/examination-model2/options", { params: { colid: global1.colid } });
    setOptions(res.data?.options || {});
    setPrograms(res.data?.programs || []);
    setCourses(res.data?.courses || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  return { options, programs, courses, reloadOptions: load };
}

export function ExaminationModel2MarksPage() {
  const { options, courses, reloadOptions } = useExamOptions();
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(baseForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ academicyear: "2026-27", examcode: "", programcode: "", semester: "", studentsearch: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadRows(); }, []);
  useEffect(() => {
    if (form.academicyear && form.program && form.programcode && form.semester) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [form.academicyear, form.regulation, form.program, form.programcode, form.semester]);

  const updateForm = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (["theorymarks", "theoryobtained"].includes(field)) next.theorypercentage = pct(next.theoryobtained, next.theorymarks);
      if (["practicalmarks", "practicaltotal"].includes(field)) next.practicalpercentage = pct(next.practicalmarks, next.practicaltotal);
      if (["theoryobtained", "practicalmarks"].includes(field) && !prev.overalltotalmarks) next.overalltotalmarks = Number((Number(next.theoryobtained || 0) + Number(next.practicalmarks || 0)).toFixed(2));
      if (["credit", "overallgradepoint"].includes(field)) next.gpa = Number((Number(next.credit || 0) * Number(next.overallgradepoint || 0)).toFixed(2));
      return next;
    });
  };

  const applyCourse = (course) => {
    if (!course) return;
    setForm((prev) => ({
      ...prev,
      academicyear: course.academicyear || prev.academicyear,
      regulation: course.regulation || prev.regulation,
      program: course.program || prev.program,
      programcode: course.programcode || prev.programcode,
      semester: course.semester || prev.semester,
      course: course.course || prev.course,
      coursecode: course.coursecode || prev.coursecode,
      credit: course.credit ?? prev.credit
    }));
  };

  const loadStudents = async () => {
    try {
      const res = await ep1.get("/api/v2/examination-model2/students", {
        params: {
          colid: global1.colid,
          academicyear: form.academicyear,
          regulation: form.regulation,
          program: form.program,
          programcode: form.programcode,
          semester: form.semester
        }
      });
      setStudents(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load students"));
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/examination-model2/marks", { params: { colid: global1.colid, ...filters } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load marks"));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await ep1.post("/api/v2/examination-model2/marks", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Marks updated" : "Marks added");
      setEditingId("");
      setForm(baseForm);
      await loadRows();
      await reloadOptions();
    } catch (err) {
      setError(msg(err, "Unable to save marks"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({ ...baseForm, ...row });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this marks entry?")) return;
    try {
      await ep1.post("/api/v2/examination-model2/marks-delete", { id: row._id, colid: global1.colid });
      setMessage("Deleted");
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to delete"));
    }
  };

  const downloadTemplate = () => {
    const sample = { ...baseForm, academicyear: "2026-27", exam: "Semester Exam", examcode: "SEM1", program: "B.Com", programcode: "BCOM", semester: "1", course: "Financial Accounting", coursecode: "FA101", credit: 4, student: "Student Name", regno: "REG001", abcid: "ABC123", theorymarks: 70, theoryobtained: 55, theorygradepoint: 8, theorygrade: "A", practicalmarks: 25, practicaltotal: 30, practicalgradepoint: 8, practicalgrade: "A", overalltotalmarks: 80, overallgradepoint: 8, overallgrade: "A", status: "Pass" };
    const ws = XLSX.utils.json_to_sheet([sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Marks");
    XLSX.writeFile(wb, "examination_model2_marks_template.xlsx");
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const res = await ep1.post("/api/v2/examination-model2/marks-bulk", { colid: global1.colid, user: global1.user, rows });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      setError((res.data?.errors || []).slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      await loadRows();
      await reloadOptions();
    } catch (err) {
      setError(msg(err, "Unable to upload Excel"));
    } finally {
      setSaving(false);
    }
  };

  const optionField = (field, label, md = 2) => (
    <Grid item xs={12} md={md}>
      <TextField select fullWidth size="small" label={label} value={form[field] || ""} onChange={(e) => updateForm(field, e.target.value)}>
        <MenuItem value="">Select</MenuItem>
        {(options[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
      </TextField>
    </Grid>
  );

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 120, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />, <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row)} />] },
    ...markFields.map((field) => ({ field, headerName: labels[field] || field, width: ["student", "course", "program"].includes(field) ? 190 : 140, type: numberFields.includes(field) ? "number" : "string" }))
  ];

  return (
    <MenuPageShell title="Exam Marks Entry 2">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Exam Marks Entry 2</Typography>
            <Typography color="text.secondary">Enter or bulk upload complete marks records with ABC ID, credits and GPA.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              {optionField("academicyear", "Academic Year")}
              {optionField("regulation", "Regulation")}
              {optionField("exam", "Exam")}
              {optionField("examcode", "Exam Code")}
              {optionField("program", "Program")}
              {optionField("programcode", "Program Code")}
              {optionField("semester", "Semester")}
              <Grid item xs={12} md={4}>
                <Autocomplete options={courses} getOptionLabel={(o) => `${o.course || ""} - ${o.coursecode || ""}`} onChange={(_, v) => applyCourse(v)} renderInput={(params) => <TextField {...params} size="small" label="Search course" />} />
              </Grid>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Course" value={form.course} onChange={(e) => updateForm("course", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Course Code" value={form.coursecode} onChange={(e) => updateForm("coursecode", e.target.value)} /></Grid>
              <Grid item xs={12} md={1}><TextField fullWidth size="small" type="number" label="Credit" value={form.credit} onChange={(e) => updateForm("credit", e.target.value)} /></Grid>
              <Grid item xs={12} md={1}><Button fullWidth variant="outlined" sx={{ height: "100%" }} onClick={loadStudents}>Load students</Button></Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={students}
                  getOptionLabel={(o) => `${o.name || ""} - ${o.regno || ""} - ${o.abcid || ""}`}
                  onChange={(_, v) => v && setForm((prev) => ({ ...prev, student: v.name || "", regno: v.regno || "", abcid: v.abcid || "" }))}
                  renderInput={(params) => <TextField {...params} size="small" label="Search student" />}
                />
              </Grid>
              {["student", "regno", "abcid", "theorymarks", "theoryobtained", "theorypercentage", "theorygradepoint", "theorygrade", "practicalmarks", "practicaltotal", "practicalpercentage", "practicalgradepoint", "practicalgrade", "overalltotalmarks", "overallgradepoint", "overallgrade", "overallpercentage", "gpa", "attempt", "examdate", "resultprocessdate"].map((field) => (
                <Grid item xs={12} md={field === "student" ? 3 : 1.5} key={field}>
                  <TextField fullWidth size="small" type={["examdate", "resultprocessdate"].includes(field) ? "date" : numberFields.includes(field) ? "number" : "text"} InputLabelProps={["examdate", "resultprocessdate"].includes(field) ? { shrink: true } : undefined} label={labels[field] || field} value={form[field] || ""} onChange={(e) => updateForm(field, e.target.value)} />
                </Grid>
              ))}
              <Grid item xs={12} md={1.5}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => updateForm("status", e.target.value)}>{["Pass", "Fail"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Type" value={form.type} onChange={(e) => updateForm("type", e.target.value)}>{["Regular", "Supplementary"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
                  <Button variant="outlined" onClick={() => { setEditingId(""); setForm(baseForm); }}>Clear</Button>
                  <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={saving}>
                    Bulk upload
                    <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} />
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              {["academicyear", "examcode", "programcode", "semester"].map((field) => <Grid item xs={12} md={2} key={field}><TextField select fullWidth size="small" label={labels[field] || field} value={filters[field] || ""} onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}><MenuItem value="">All</MenuItem>{(options[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>)}
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Student / Regno / ABC ID" value={filters.studentsearch} onChange={(e) => setFilters({ ...filters, studentsearch: e.target.value })} /></Grid>
              <Grid item xs={12} md={1}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={loadRows}>Apply</Button></Grid>
            </Grid>
            <Box sx={{ height: 620, width: "100%" }}>
              <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_marks" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }} />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

const templateFormBase = { academicyear: "2026-27", templatedescription: "", status: "Active" };
const templateDetailFormBase = { academicyear: "2026-27", templatename: "", templateid: "", frommarks: "", tomarks: "", gradepoint: "", grade: "" };

function readExcelRows(file) {
  return file.arrayBuffer().then((buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  });
}

export function ExaminationModel2GradingTemplatePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(templateFormBase);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/examination-model2/grading-templates", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load grading templates"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await ep1.post("/api/v2/examination-model2/grading-templates", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Template updated" : "Template added");
      setEditingId("");
      setForm(templateFormBase);
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to save template"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this grading template?")) return;
    try {
      await ep1.post("/api/v2/examination-model2/grading-templates-delete", { colid: global1.colid, id: row._id });
      setMessage("Deleted");
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to delete template"));
    }
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const res = await ep1.post("/api/v2/examination-model2/grading-templates-bulk", { colid: global1.colid, user: global1.user, rows: await readExcelRows(file) });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      setError((res.data?.errors || []).slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to upload template"));
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ academicyear: "2026-27", templatedescription: "UG absolute grading template", status: "Active" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Templates");
    XLSX.writeFile(wb, "exam_model2_grading_template.xlsx");
  };

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 120, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditingId(params.row._id); setForm({ ...templateFormBase, ...params.row }); }} />, <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row)} />] },
    { field: "academicyear", headerName: "Academic Year", width: 160 },
    { field: "templatedescription", headerName: "Template Description", width: 320 },
    { field: "status", headerName: "Status", width: 140 }
  ];

  return (
    <MenuPageShell title="Grading Template">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Grading Template</Typography>
            <Typography color="text.secondary">Create academic-year wise grading templates for Exam Model 2 processing.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Academic Year" value={form.academicyear} onChange={(e) => setForm({ ...form, academicyear: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Template Description" value={form.templatedescription} onChange={(e) => setForm({ ...form, templatedescription: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Active", "Inactive"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={saving} onClick={save}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</Button></Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Button variant="outlined" onClick={() => { setEditingId(""); setForm(templateFormBase); }}>Clear</Button><Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button><Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={saving}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} /></Button></Stack></Grid>
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Box sx={{ height: 520, width: "100%" }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_grading_templates" } } }} pageSizeOptions={[10, 25, 50, 100]} /></Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function ExaminationModel2GradingTemplateDetailPage() {
  const [templates, setTemplates] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(templateDetailFormBase);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTemplates = async () => {
    const res = await ep1.get("/api/v2/examination-model2/grading-templates", { params: { colid: global1.colid } });
    setTemplates(res.data?.data || []);
  };
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/examination-model2/grading-template-details", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load grading details"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadTemplates().catch(() => {}); loadRows(); }, []);

  const applyTemplate = (id) => {
    const template = templates.find((item) => item._id === id);
    setForm({ ...form, templateid: id, templatename: template?.templatedescription || "", academicyear: template?.academicyear || form.academicyear });
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await ep1.post("/api/v2/examination-model2/grading-template-details", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Grade range updated" : "Grade range added");
      setEditingId("");
      setForm(templateDetailFormBase);
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to save grade range"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this grade range?")) return;
    try {
      await ep1.post("/api/v2/examination-model2/grading-template-details-delete", { colid: global1.colid, id: row._id });
      setMessage("Deleted");
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to delete grade range"));
    }
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const res = await ep1.post("/api/v2/examination-model2/grading-template-details-bulk", { colid: global1.colid, user: global1.user, rows: await readExcelRows(file) });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      setError((res.data?.errors || []).slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to upload grade ranges"));
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const first = templates[0];
    const ws = XLSX.utils.json_to_sheet([{ academicyear: first?.academicyear || "2026-27", templatename: first?.templatedescription || "UG absolute grading template", templateid: first?._id || "paste_template_id", frommarks: 90, tomarks: 100, gradepoint: 10, grade: "O" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Details");
    XLSX.writeFile(wb, "exam_model2_grading_template_details.xlsx");
  };

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 120, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditingId(params.row._id); setForm({ ...templateDetailFormBase, ...params.row }); }} />, <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row)} />] },
    { field: "academicyear", headerName: "Academic Year", width: 150 },
    { field: "templatename", headerName: "Template Name", width: 260 },
    { field: "templateid", headerName: "Template ID", width: 220 },
    { field: "frommarks", headerName: "From Marks", width: 130, type: "number" },
    { field: "tomarks", headerName: "To Marks", width: 130, type: "number" },
    { field: "gradepoint", headerName: "Grade Point", width: 130, type: "number" },
    { field: "grade", headerName: "Grade", width: 110 }
  ];

  return (
    <MenuPageShell title="Grading Template Details">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Grading Template Details</Typography>
            <Typography color="text.secondary">Define marks ranges, grade points and grades for every template.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}><TextField select fullWidth size="small" label="Template" value={form.templateid} onChange={(e) => applyTemplate(e.target.value)}><MenuItem value="">Select</MenuItem>{templates.map((item) => <MenuItem key={item._id} value={item._id}>{item.academicyear} - {item.templatedescription}</MenuItem>)}</TextField></Grid>
              {["academicyear", "templatename", "frommarks", "tomarks", "gradepoint", "grade"].map((field) => <Grid item xs={12} md={field === "templatename" ? 3 : 1.5} key={field}><TextField fullWidth size="small" type={["frommarks", "tomarks", "gradepoint"].includes(field) ? "number" : "text"} label={labels[field] || field} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /></Grid>)}
              <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Button variant="contained" disabled={saving} onClick={save}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</Button><Button variant="outlined" onClick={() => { setEditingId(""); setForm(templateDetailFormBase); }}>Clear</Button><Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button><Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={saving}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} /></Button></Stack></Grid>
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Box sx={{ height: 560, width: "100%" }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_grading_template_details" } } }} pageSizeOptions={[10, 25, 50, 100]} /></Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

const classConfigurationFormBase = {
  academicyear: "2026-27",
  program: "",
  programcode: "",
  fromsgpa: "",
  tosgpa: "",
  classassigned: ""
};

export function ExaminationModel2ClassConfigurationPage() {
  const { options, reloadOptions } = useExamOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(classConfigurationFormBase);
  const [filters, setFilters] = useState({ academicyear: "", programcode: "" });
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/examination-model2/class-configurations", {
        params: { colid: global1.colid, ...filters }
      });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load class configuration"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await ep1.post("/api/v2/examination-model2/class-configurations", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Class configuration updated" : "Class configuration added");
      setEditingId("");
      setForm(classConfigurationFormBase);
      await loadRows();
      await reloadOptions();
    } catch (err) {
      setError(msg(err, "Unable to save class configuration"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this class configuration?")) return;
    try {
      await ep1.post("/api/v2/examination-model2/class-configurations-delete", { colid: global1.colid, id: row._id });
      setMessage("Deleted");
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to delete class configuration"));
    }
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const res = await ep1.post("/api/v2/examination-model2/class-configurations-bulk", {
        colid: global1.colid,
        user: global1.user,
        rows: await readExcelRows(file)
      });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      setError((res.data?.errors || []).slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      loadRows();
    } catch (err) {
      setError(msg(err, "Unable to upload class configuration"));
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        academicyear: "2026-27",
        program: "B.Com",
        programcode: "BCOM",
        fromsgpa: 8,
        tosgpa: 10,
        classassigned: "First Class with Distinction"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Class Configuration");
    XLSX.writeFile(wb, "exam_model2_class_configuration.xlsx");
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditingId(params.row._id); setForm({ ...classConfigurationFormBase, ...params.row }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row)} />
      ]
    },
    { field: "academicyear", headerName: "Academic Year", width: 150 },
    { field: "program", headerName: "Program", width: 220 },
    { field: "programcode", headerName: "Program Code", width: 160 },
    { field: "fromsgpa", headerName: "From SGPA", width: 130, type: "number" },
    { field: "tosgpa", headerName: "To SGPA", width: 130, type: "number" },
    { field: "classassigned", headerName: "Class Assigned", width: 260 }
  ];

  return (
    <MenuPageShell title="Class Configuration">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Class Configuration</Typography>
            <Typography color="text.secondary">Map SGPA/API ranges to assigned classes for Exam Model 2 marksheets.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Academic Year" value={form.academicyear} onChange={(e) => setForm({ ...form, academicyear: e.target.value })}>
                  <MenuItem value="">Select</MenuItem>
                  {(options.academicyear || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth size="small" label="Program" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
                  <MenuItem value="">Select</MenuItem>
                  {(options.program || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Program Code" value={form.programcode} onChange={(e) => setForm({ ...form, programcode: e.target.value })}>
                  <MenuItem value="">Select</MenuItem>
                  {(options.programcode || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="number" label="From SGPA" value={form.fromsgpa} onChange={(e) => setForm({ ...form, fromsgpa: e.target.value })} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="number" label="To SGPA" value={form.tosgpa} onChange={(e) => setForm({ ...form, tosgpa: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Class Assigned" value={form.classassigned} onChange={(e) => setForm({ ...form, classassigned: e.target.value })} /></Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" disabled={saving} onClick={save}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</Button>
                  <Button variant="outlined" onClick={() => { setEditingId(""); setForm(classConfigurationFormBase); }}>Clear</Button>
                  <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={saving}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} /></Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Academic Year" value={filters.academicyear} onChange={(e) => setFilters({ ...filters, academicyear: e.target.value })}>
                  <MenuItem value="">All</MenuItem>
                  {(options.academicyear || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Program Code" value={filters.programcode} onChange={(e) => setFilters({ ...filters, programcode: e.target.value })}>
                  <MenuItem value="">All</MenuItem>
                  {(options.programcode || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={loadRows}>Apply</Button></Grid>
            </Grid>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_class_configuration" } } }} pageSizeOptions={[10, 25, 50, 100]} />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

const uniquePairs = (rows, codeField, nameField) => {
  const map = new Map();
  rows.forEach((row) => {
    const code = text(row[codeField]);
    if (code && !map.has(code)) map.set(code, { code, name: text(row[nameField]), label: `${text(row[nameField]) || code} (${code})` });
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
};

function CheckboxSelect({ label, value, options, onChange }) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
      SelectProps={{
        multiple: true,
        renderValue: (selected) => selected.join(", ")
      }}
    >
      {options.map((item) => (
        <MenuItem key={item.code || item} value={item.code || item}>
          <Checkbox checked={value.indexOf(item.code || item) > -1} />
          <ListItemText primary={item.label || item} />
        </MenuItem>
      ))}
    </TextField>
  );
}

export function ExaminationModel2GradeProcessingPage() {
  const { options } = useExamOptions();
  const [templates, setTemplates] = useState([]);
  const [marksRows, setMarksRows] = useState([]);
  const [resultRows, setResultRows] = useState([]);
  const [form, setForm] = useState({ academicyear: "2026-27", exam: "", examcode: "", programcodes: [], coursecodes: [], templateid: "", component: "Overalltotal" });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/examination-model2/grading-templates", { params: { colid: global1.colid, status: "Active" } })
      .then((res) => setTemplates(res.data?.data || []))
      .catch(() => {});
  }, []);

  const loadMatchingMarks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/examination-model2/marks", { params: { colid: global1.colid, academicyear: form.academicyear, exam: form.exam, examcode: form.examcode } });
      setMarksRows(res.data?.data || []);
      setResultRows([]);
    } catch (err) {
      setError(msg(err, "Unable to load matching marks"));
    } finally {
      setLoading(false);
    }
  };

  const process = async () => {
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/examination-model2/process-grades", { ...form, colid: global1.colid, user: global1.user });
      setResultRows(res.data?.data || []);
      setMessage(`Grade processing completed. Updated: ${res.data?.updated || 0}. Skipped: ${(res.data?.skipped || []).length}`);
      await loadMatchingMarks();
    } catch (err) {
      setError(msg(err, "Unable to process grades"));
    } finally {
      setProcessing(false);
    }
  };

  const programChoices = useMemo(() => uniquePairs(marksRows, "programcode", "program"), [marksRows]);
  const courseChoices = useMemo(() => uniquePairs(marksRows, "coursecode", "course"), [marksRows]);
  const displayRows = resultRows.length ? resultRows : marksRows;
  const columns = ["academicyear", "exam", "examcode", "program", "programcode", "course", "coursecode", "student", "regno", "theoryobtained", "theorygradepoint", "theorygrade", "practicalmarks", "practicalgradepoint", "practicalgrade", "overalltotalmarks", "overallgradepoint", "overallgrade", "gpa"].map((field) => ({ field, headerName: labels[field] || field, width: ["student", "course", "program"].includes(field) ? 190 : 140, type: numberFields.includes(field) ? "number" : "string" }));

  return (
    <MenuPageShell title="Process Grade Template">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Process Grade Template</Typography>
            <Typography color="text.secondary">Apply a selected grade template to theory, practical or overall totals for selected courses.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              {["academicyear", "exam", "examcode"].map((field) => <Grid item xs={12} md={2} key={field}><TextField select fullWidth size="small" label={labels[field] || field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value, programcodes: [], coursecodes: [] })}><MenuItem value="">Select</MenuItem>{(options[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>)}
              <Grid item xs={12} md={2}><Button fullWidth variant="outlined" disabled={loading} sx={{ height: "100%" }} onClick={loadMatchingMarks}>{loading ? "Loading..." : "Load marks"}</Button></Grid>
              <Grid item xs={12} md={4}><TextField select fullWidth size="small" label="Grading Template" value={form.templateid} onChange={(e) => setForm({ ...form, templateid: e.target.value })}><MenuItem value="">Select</MenuItem>{templates.map((item) => <MenuItem key={item._id} value={item._id}>{item.academicyear} - {item.templatedescription}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={4}><CheckboxSelect label="Program / Program Code" value={form.programcodes} options={programChoices} onChange={(value) => setForm({ ...form, programcodes: value })} /></Grid>
              <Grid item xs={12} md={4}><CheckboxSelect label="Course / Course Code" value={form.coursecodes} options={courseChoices} onChange={(value) => setForm({ ...form, coursecodes: value })} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Component" value={form.component} onChange={(e) => setForm({ ...form, component: e.target.value })}>{["Theory", "Practical", "Overalltotal"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={processing || !displayRows.length} sx={{ height: "100%" }} onClick={process}>{processing ? <><CircularProgress size={18} sx={{ mr: 1 }} />Processing...</> : "Process grades"}</Button></Grid>
            </Grid>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Loaded Records</Typography><Typography variant="h4" fontWeight={950}>{marksRows.length}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Selected Programs</Typography><Typography variant="h4" fontWeight={950}>{form.programcodes.length || "All"}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Selected Courses</Typography><Typography variant="h4" fontWeight={950}>{form.coursecodes.length || "All"}</Typography></CardContent></Card></Grid>
          </Grid>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Box sx={{ height: 620, width: "100%" }}><DataGrid rows={displayRows} columns={columns} getRowId={(row) => row._id} loading={loading || processing} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_grade_processing" } } }} pageSizeOptions={[10, 25, 50, 100]} /></Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function ExaminationModel2PercentageCalculationPage() {
  const { options } = useExamOptions();
  const [marksRows, setMarksRows] = useState([]);
  const [resultRows, setResultRows] = useState([]);
  const [form, setForm] = useState({ academicyear: "2026-27", exam: "", examcode: "", programcodes: [], coursecodes: [], component: "Theory" });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMatchingMarks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/examination-model2/marks", { params: { colid: global1.colid, academicyear: form.academicyear, exam: form.exam, examcode: form.examcode } });
      setMarksRows(res.data?.data || []);
      setResultRows([]);
    } catch (err) {
      setError(msg(err, "Unable to load matching marks"));
    } finally {
      setLoading(false);
    }
  };

  const calculate = async () => {
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/examination-model2/process-percentages", { ...form, colid: global1.colid, user: global1.user });
      setResultRows(res.data?.data || []);
      setMessage(`Percentage calculation completed. Updated: ${res.data?.updated || 0}`);
      await loadMatchingMarks();
    } catch (err) {
      setError(msg(err, "Unable to calculate percentage"));
    } finally {
      setProcessing(false);
    }
  };

  const programChoices = useMemo(() => uniquePairs(marksRows, "programcode", "program"), [marksRows]);
  const courseChoices = useMemo(() => uniquePairs(marksRows, "coursecode", "course"), [marksRows]);
  const displayRows = resultRows.length ? resultRows : marksRows;
  const columns = ["academicyear", "exam", "examcode", "program", "programcode", "course", "coursecode", "student", "regno", "theorymarks", "theoryobtained", "theorypercentage", "practicaltotal", "practicalmarks", "practicalpercentage", "overalltotalmarks", "overallpercentage"].map((field) => ({ field, headerName: labels[field] || field, width: ["student", "course", "program"].includes(field) ? 190 : 140, type: numberFields.includes(field) ? "number" : "string" }));

  return (
    <MenuPageShell title="Percentage Calculation">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Percentage Calculation</Typography>
            <Typography color="text.secondary">Calculate theory, practical or overall percentage for selected Exam Model 2 marks.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              {["academicyear", "exam", "examcode"].map((field) => <Grid item xs={12} md={2} key={field}><TextField select fullWidth size="small" label={labels[field] || field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value, programcodes: [], coursecodes: [] })}><MenuItem value="">Select</MenuItem>{(options[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>)}
              <Grid item xs={12} md={2}><Button fullWidth variant="outlined" disabled={loading} sx={{ height: "100%" }} onClick={loadMatchingMarks}>{loading ? "Loading..." : "Load marks"}</Button></Grid>
              <Grid item xs={12} md={4}><CheckboxSelect label="Program / Program Code" value={form.programcodes} options={programChoices} onChange={(value) => setForm({ ...form, programcodes: value })} /></Grid>
              <Grid item xs={12} md={4}><CheckboxSelect label="Course / Course Code" value={form.coursecodes} options={courseChoices} onChange={(value) => setForm({ ...form, coursecodes: value })} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Component" value={form.component} onChange={(e) => setForm({ ...form, component: e.target.value })}>{["Theory", "Practical", "Overall"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={processing || !displayRows.length} sx={{ height: "100%" }} onClick={calculate}>{processing ? <><CircularProgress size={18} sx={{ mr: 1 }} />Calculating...</> : "Calculate percentage"}</Button></Grid>
            </Grid>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Loaded Records</Typography><Typography variant="h4" fontWeight={950}>{marksRows.length}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Selected Programs</Typography><Typography variant="h4" fontWeight={950}>{form.programcodes.length || "All"}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Selected Courses</Typography><Typography variant="h4" fontWeight={950}>{form.coursecodes.length || "All"}</Typography></CardContent></Card></Grid>
          </Grid>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Box sx={{ height: 620, width: "100%" }}><DataGrid rows={displayRows} columns={columns} getRowId={(row) => row._id} loading={loading || processing} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_percentage_calculation" } } }} pageSizeOptions={[10, 25, 50, 100]} /></Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function ExaminationModel2ComponentFailRulePage() {
  const { options } = useExamOptions();
  const [marksRows, setMarksRows] = useState([]);
  const [resultRows, setResultRows] = useState([]);
  const [form, setForm] = useState({
    academicyear: "2026-27",
    regulation: "",
    exam: "",
    examcode: "",
    semester: "",
    programcodes: [],
    coursecodes: [],
    components: ["Theory", "Practical"]
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredRows = useMemo(() => marksRows.filter((row) => {
    if (form.programcodes.length && !form.programcodes.includes(text(row.programcode))) return false;
    if (form.coursecodes.length && !form.coursecodes.includes(text(row.coursecode))) return false;
    return true;
  }), [marksRows, form.programcodes, form.coursecodes]);

  const failPreviewRows = useMemo(() => filteredRows.filter((row) => {
    const theoryFail = form.components.includes("Theory") && /^f$/i.test(text(row.theorygrade));
    const practicalFail = form.components.includes("Practical") && /^f$/i.test(text(row.practicalgrade));
    return theoryFail || practicalFail;
  }), [filteredRows, form.components]);

  const loadMatchingMarks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/examination-model2/marks", {
        params: {
          colid: global1.colid,
          academicyear: form.academicyear,
          regulation: form.regulation,
          exam: form.exam,
          examcode: form.examcode,
          semester: form.semester
        }
      });
      setMarksRows(res.data?.data || []);
      setResultRows([]);
    } catch (err) {
      setError(msg(err, "Unable to load matching marks"));
    } finally {
      setLoading(false);
    }
  };

  const process = async () => {
    if (!window.confirm(`Apply fail rule to ${failPreviewRows.length} matching record(s)?`)) return;
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/examination-model2/process-component-fail-rule", { ...form, colid: global1.colid, user: global1.user });
      setResultRows(res.data?.data || []);
      setMessage(`Component fail rule completed. Checked: ${res.data?.checked || 0}. Updated: ${res.data?.updated || 0}`);
      await loadMatchingMarks();
    } catch (err) {
      setError(msg(err, "Unable to process component fail rule"));
    } finally {
      setProcessing(false);
    }
  };

  const programChoices = useMemo(() => uniquePairs(marksRows, "programcode", "program"), [marksRows]);
  const courseChoices = useMemo(() => uniquePairs(marksRows, "coursecode", "course"), [marksRows]);
  const displayRows = resultRows.length ? resultRows : filteredRows;
  const columns = [
    "academicyear", "regulation", "exam", "examcode", "program", "programcode", "semester", "course", "coursecode",
    "student", "regno", "theorygrade", "practicalgrade", "overallgrade", "overallgradepoint", "gpa", "status"
  ].map((field) => ({ field, headerName: labels[field] || field, width: ["student", "course", "program"].includes(field) ? 190 : 140, type: numberFields.includes(field) ? "number" : "string" }));

  return (
    <MenuPageShell title="Component Fail Rule">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Component Fail Rule</Typography>
            <Typography color="text.secondary">If a student has grade F in selected Theory/Practical components, update Overall Grade as F, GPA as 0 and status as Fail.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              {["academicyear", "regulation", "exam", "examcode", "semester"].map((field) => (
                <Grid item xs={12} md={2} key={field}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={labels[field] || field}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value, programcodes: [], coursecodes: [] })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {(options[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                </Grid>
              ))}
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="outlined" disabled={loading} sx={{ height: "100%" }} onClick={loadMatchingMarks}>
                  {loading ? <><CircularProgress size={18} sx={{ mr: 1 }} />Loading...</> : "Load marks"}
                </Button>
              </Grid>
              <Grid item xs={12} md={4}><CheckboxSelect label="Program / Program Code" value={form.programcodes} options={programChoices} onChange={(value) => setForm({ ...form, programcodes: value })} /></Grid>
              <Grid item xs={12} md={4}><CheckboxSelect label="Course / Course Code" value={form.coursecodes} options={courseChoices} onChange={(value) => setForm({ ...form, coursecodes: value })} /></Grid>
              <Grid item xs={12} md={2}><CheckboxSelect label="Fail Source" value={form.components} options={["Theory", "Practical"]} onChange={(value) => setForm({ ...form, components: value })} /></Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" disabled={processing || !failPreviewRows.length || !form.components.length} sx={{ height: "100%" }} onClick={process}>
                  {processing ? <><CircularProgress size={18} sx={{ mr: 1 }} />Processing...</> : "Apply fail rule"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Loaded Records</Typography><Typography variant="h4" fontWeight={950}>{marksRows.length}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={3}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">After Filters</Typography><Typography variant="h4" fontWeight={950}>{filteredRows.length}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={3}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Will Become Overall F</Typography><Typography variant="h4" fontWeight={950}>{failPreviewRows.length}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={3}><Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}><CardContent><Typography color="text.secondary">Updated Last Run</Typography><Typography variant="h4" fontWeight={950}>{resultRows.length}</Typography></CardContent></Card></Grid>
          </Grid>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Box sx={{ height: 620, width: "100%" }}>
              <DataGrid
                rows={displayRows}
                columns={columns}
                getRowId={(row) => row._id}
                loading={loading || processing}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "exam_model2_component_fail_rule" } } }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function ExaminationModel2MarksheetPage() {
  const { options } = useExamOptions();
  const [filters, setFilters] = useState({ academicyear: "2026-27", examcode: "", programcode: "", regno: "" });
  const [students, setStudents] = useState([]);
  const [marksheet, setMarksheet] = useState(null);
  const [qr, setQr] = useState("");
  const [blockchainLink, setBlockchainLink] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [periodMode, setPeriodMode] = useState("Semester");
  const [gradeMetricMode, setGradeMetricMode] = useState("SGPA");
  const [includeClassAssigned, setIncludeClassAssigned] = useState(false);

  const loadStudents = async () => {
    const res = await ep1.get("/api/v2/examination-model2/students", { params: { colid: global1.colid, academicyear: filters.academicyear, programcode: filters.programcode } });
    setStudents(res.data?.data || []);
  };
  const generate = async () => {
    try {
      setError("");
      setMessage("");
      const res = await ep1.get("/api/v2/examination-model2/marksheet", { params: { colid: global1.colid, ...filters } });
      setMarksheet(res.data);
      setBlockchainLink("");
      setQr("");
    } catch (err) {
      setError(msg(err, "Unable to generate marksheet"));
    }
  };
  const storeBlockchain = async () => {
    try {
      const res = await ep1.post("/api/v2/examination-model2/marksheet-blockchain-store", { colid: global1.colid, ...filters, origin: window.location.origin, user: global1.user });
      const url = res.data?.data?.verificationurl || `${window.location.origin}/verify-exam-model2-marksheet?colid=${global1.colid}&regno=${encodeURIComponent(filters.regno)}&hash=${encodeURIComponent(res.data?.data?.hash || "")}`;
      setBlockchainLink(url);
      setQr(await QRCode.toDataURL(url, { width: 160, margin: 1 }));
      setMessage("Stored in blockchain");
    } catch (err) {
      setError(msg(err, "Unable to store in blockchain"));
    }
  };
  const config = marksheet?.marksheetconfiguration || {};
  const show = (field, fallback = true) => !config[field] || config[field] === "Yes" || fallback;
  const programDisplay = config.programnamedisplay === "programcode" ? marksheet?.student?.programcode : marksheet?.student?.program;
  const periodLabel = periodMode === "Year" ? "Year" : "Semester";
  const gradeMetricLabel = gradeMetricMode === "API" ? "API" : "SGPA";
  const issueDate = new Date().toLocaleDateString("en-IN");

  return (
    <MenuPageShell title="Exam Model 2 Marksheet">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} className="screen-only" sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Generate Marksheet</Typography>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
              {["academicyear", "examcode", "programcode"].map((field) => <Grid item xs={12} md={2} key={field}><TextField select fullWidth label={labels[field] || field} value={filters[field]} onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}><MenuItem value="">Select</MenuItem>{(options[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>)}
              <Grid item xs={12} md={2}><Button fullWidth variant="outlined" sx={{ height: "100%" }} onClick={loadStudents}>Load students</Button></Grid>
              <Grid item xs={12} md={4}><Autocomplete options={students} getOptionLabel={(o) => `${o.name || ""} - ${o.regno || ""}`} onChange={(_, v) => setFilters({ ...filters, regno: v?.regno || "" })} renderInput={(params) => <TextField {...params} label="Student" />} /></Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={periodMode === "Year"} onChange={(e) => setPeriodMode(e.target.checked ? "Year" : "Semester")} />}
                  label={periodMode === "Year" ? "Year mode" : "Semester mode"}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={gradeMetricMode === "API"} onChange={(e) => setGradeMetricMode(e.target.checked ? "API" : "SGPA")} />}
                  label={gradeMetricMode === "API" ? "API mode" : "SGPA mode"}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={includeClassAssigned} onChange={(e) => setIncludeClassAssigned(e.target.checked)} />}
                  label="Include class assigned"
                />
              </Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" onClick={generate}>Generate</Button><Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!marksheet}>Print</Button><Button variant="contained" color="success" startIcon={<VerifiedIcon />} onClick={storeBlockchain} disabled={!marksheet}>Store in blockchain</Button>{blockchainLink && <Button variant="outlined" href={blockchainLink} target="_blank">Retrieve blockchain</Button>}</Stack></Grid>
            </Grid>
          </Paper>
          {error && <Alert severity="error" className="screen-only" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" className="screen-only" onClose={() => setMessage("")}>{message}</Alert>}
          {marksheet && (
            <Paper id="exam-model2-marksheet-print" elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #d1d5db", bgcolor: "white", position: "relative", maxWidth: 980, mx: "auto" }}>
              {config.watermark && <Typography sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, color: "rgba(15,23,42,0.05)", fontWeight: 950, pointerEvents: "none", transform: "rotate(-24deg)" }}>{config.watermark}</Typography>}
              <Stack alignItems="center" sx={{ mb: 2 }}>
                {marksheet.institution?.logo && <Box component="img" src={marksheet.institution.logo} sx={{ height: 70, objectFit: "contain", mb: 1 }} />}
                <Typography variant="h5" fontWeight={950}>{marksheet.institution?.insname || marksheet.institution?.name || global1.insname || "Institution"}</Typography>
                <Typography align="center" color="text.secondary">{marksheet.institution?.address || marksheet.institution?.address1 || ""}</Typography>
                <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>{periodLabel} Statement of Marks</Typography>
                <Typography variant="caption" color="text.secondary">Date of Issue: {issueDate}</Typography>
              </Stack>
              <Grid container spacing={1.2} sx={{ mb: 2 }}>
                <Grid item xs={3}><Avatar src={marksheet.student.photo || ""} sx={{ width: 110, height: 110 }} /></Grid>
                <Grid item xs={9}>
                  <Grid container spacing={1}>
                    {[["Name", marksheet.student.name], ["Reg No", marksheet.student.regno], ["ABC ID", marksheet.student.abcid], ["Program", programDisplay], ["Program Code", marksheet.student.programcode], [periodLabel, marksheet.student.semester], ["Academic Year", marksheet.student.academicyear], ["Regulation", marksheet.student.regulation], [gradeMetricLabel, marksheet.summary.sgpa], ...(includeClassAssigned ? [["Class Assigned", marksheet.summary.classassigned || "NA"]] : []), ["Date of Issue", issueDate]].map(([k, v]) => <Grid item xs={6} md={3} key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography fontWeight={800}>{v || "NA"}</Typography></Grid>)}
                  </Grid>
                </Grid>
              </Grid>
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>{["Course Code", "Course", "Credit", "Theory Grade", "Practical Grade", "Overall Grade", "Status"].map((h) => <th key={h} style={{ border: "1px solid #111827", padding: 8, background: "#f3f4f6" }}>{h}</th>)}</tr></thead>
                  <tbody>{marksheet.marks.map((row) => <tr key={row._id}>
                    {show("coursecode") && <td style={{ border: "1px solid #111827", padding: 8 }}>{row.coursecode}</td>}
                    {show("course") && <td style={{ border: "1px solid #111827", padding: 8 }}>{row.course}</td>}
                    {show("credits") && <td style={{ border: "1px solid #111827", padding: 8 }}>{row.credit}</td>}
                    <td style={{ border: "1px solid #111827", padding: 8 }}>{row.theorygrade}</td>
                    <td style={{ border: "1px solid #111827", padding: 8 }}>{row.practicalgrade}</td>
                    {show("grade") && <td style={{ border: "1px solid #111827", padding: 8 }}>{row.overallgrade}</td>}
                    {show("backlogindicator") && <td style={{ border: "1px solid #111827", padding: 8 }}>{row.status}</td>}
                  </tr>)}</tbody>
                </table>
              </Box>
              <Box sx={{ mt: 2, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <tbody>{[["Credits Offered", marksheet.summary.creditsoffered], ["Credits Earned", marksheet.summary.creditsearned], [gradeMetricLabel, marksheet.summary.sgpa], ["CGPA", marksheet.summary.cgpa], ...(includeClassAssigned ? [["Class Assigned", marksheet.summary.classassigned || "NA"]] : []), ["Result", marksheet.summary.result], ["Result Process Date", marksheet.summary.resultprocessdate], ["Date of Issue", issueDate]].map(([k, v]) => <tr key={k}><td style={{ border: "1px solid #111827", padding: 8, fontWeight: 800 }}>{k}</td><td style={{ border: "1px solid #111827", padding: 8 }}>{v}</td></tr>)}</tbody>
                </table>
              </Box>
              {blockchainLink && <Typography sx={{ mt: 2 }} variant="caption">Blockchain verification: <Link href={blockchainLink} target="_blank">{blockchainLink}</Link></Typography>}
              {qr && (
                <Box sx={qrPlacementSx(config.qrcodeposition || "bottomright")}>
                  <Box sx={{ width: 128, textAlign: "center", p: 1, border: "1px solid #d1d5db", bgcolor: "#fff" }}>
                    <Box component="img" src={qr} alt="Blockchain verification QR" sx={{ width: 110, height: 110, display: "block", mx: "auto" }} />
                    <Typography variant="caption" fontWeight={800}>Verify QR</Typography>
                  </Box>
                </Box>
              )}
              {show("signature") && <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}><Typography>Prepared by</Typography><Typography>Checked by</Typography><Typography>Controller of Examinations</Typography></Stack>}
            </Paper>
          )}
        </Stack>
      </Box>
      <style>{`@media print { body * { visibility: hidden; } #exam-model2-marksheet-print, #exam-model2-marksheet-print * { visibility: visible; } #exam-model2-marksheet-print { position: absolute; left: 0; top: 0; width: 100%; max-width: 100% !important; box-shadow: none; border: none; } .screen-only { display: none !important; } }`}</style>
    </MenuPageShell>
  );
}

export function PublicExamModel2MarksheetVerifyPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    ep1.get("/api/v2/public/examination-model2/marksheet-blockchain-verify", { params: Object.fromEntries(params.entries()) })
      .then((res) => setResult(res.data))
      .catch((err) => setError(msg(err, "Unable to verify marksheet")));
  }, []);
  const record = result?.data?.[0];
  const payload = record?.payload || {};
  return (
    <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, maxWidth: 1000, mx: "auto", borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={950}>Blockchain Marksheet Verification</Typography>
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        {result && <Alert severity={result.verified ? "success" : "warning"} sx={{ my: 2 }}>{result.verified ? "Verified from blockchain." : "No matching blockchain record found."}</Alert>}
        {record && <>
          <Typography fontWeight={900}>Hash: {record.hash}</Typography>
          <Typography color="text.secondary">Stored on: {new Date(record.timestamp).toLocaleString()}</Typography>
          <Typography variant="h6" fontWeight={900} sx={{ mt: 2 }}>{payload.student?.name} - {payload.student?.regno}</Typography>
          <DataGrid rows={payload.marks || []} columns={[{ field: "coursecode", headerName: "Course Code", width: 140 }, { field: "course", headerName: "Course", width: 220 }, { field: "credit", headerName: "Credit", width: 100 }, { field: "overallgrade", headerName: "Grade", width: 120 }, { field: "status", headerName: "Status", width: 120 }]} getRowId={(row) => row._id || row.coursecode} autoHeight pageSizeOptions={[10, 25, 50, 100]} />
        </>}
      </Paper>
    </Box>
  );
}
