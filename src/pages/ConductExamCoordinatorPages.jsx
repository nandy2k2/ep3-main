import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
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

const sessions = ["Odd", "Even"];
const examTypes = ["Regular", "Supplementary"];
const statusOptions = ["Active", "Inactive"];
const text = (value) => String(value || "").trim();
const uniq = (items) => [...new Set((items || []).map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const byProgram = (row) => `${text(row.programcode)}||${text(row.program)}`;
const normalizeSemesters = (values = []) => {
  const items = [...new Set((values || []).map(text).filter(Boolean))];
  return items.includes("All") ? ["All"] : items;
};
const semesterText = (values = []) => normalizeSemesters(values).join(",");

function MultiSelect({ label, options, value, onChange, getLabel = (item) => item, disabled = false }) {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      disabled={disabled}
      options={options}
      value={value}
      isOptionEqualToValue={(option, selected) => JSON.stringify(option) === JSON.stringify(selected)}
      getOptionLabel={getLabel}
      onChange={(_, next) => onChange(next)}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox checked={selected} sx={{ mr: 1 }} />
          {getLabel(option)}
        </li>
      )}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

function pageBackground(children) {
  return <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>{children}</Box>;
}

export function ConductExamCoordinatorPage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [courseMapRows, setCourseMapRows] = useState([]);
  const [form, setForm] = useState({ academicyear: "", regulation: "", programs: [], faculty: null, status: "Active" });
  const [editId, setEditId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [optionRes, courseRes, rowRes] = await Promise.all([
      ep1.get("/api/v2/conductexam/coordinators/options", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/conductexam/course-options", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/conductexam/coordinators", { params: { colid: global1.colid } })
    ]);
    setUsers(optionRes.data?.users || []);
    setCourseMapRows(courseRes.data?.data || []);
    setRows(rowRes.data?.data || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Unable to load exam coordinators."));
  }, []);

  const academicYearOptions = useMemo(() => uniq(courseMapRows.map((row) => row.academicyear)), [courseMapRows]);
  const regulationOptions = useMemo(() => uniq(courseMapRows.filter((row) => !form.academicyear || row.academicyear === form.academicyear).map((row) => row.regulation)), [courseMapRows, form.academicyear]);
  const programOptions = useMemo(() => {
    const map = new Map();
    courseMapRows.filter((row) => row.academicyear === form.academicyear && row.regulation === form.regulation).forEach((row) => {
      if (row.programcode) map.set(byProgram(row), { program: row.program, programcode: row.programcode });
    });
    return [...map.values()].sort((a, b) => text(a.program).localeCompare(text(b.program)));
  }, [courseMapRows, form.academicyear, form.regulation]);

  const save = async () => {
    if (!form.academicyear || !form.regulation || !form.programs.length || !form.faculty?.email) {
      setError("Select academic year, regulation, programs and coordinator.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        id: editId || undefined,
        colid: global1.colid,
        name: global1.name,
        user: global1.user,
        academicyear: form.academicyear,
        regulation: form.regulation,
        programs: form.programs,
        facultyname: form.faculty.name,
        facultyemail: form.faculty.email,
        status: form.status
      };
      const res = await ep1.post("/api/v2/conductexam/coordinators", payload);
      setMessage(`${res.data?.saved || 1} coordinator assignment saved.`);
      setForm({ academicyear: "", regulation: "", programs: [], faculty: null, status: "Active" });
      setEditId("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save coordinator.");
    } finally {
      setBusy(false);
    }
  };

  const editRow = (row) => {
    setEditId(row._id);
    setForm({
      academicyear: row.academicyear || "",
      regulation: row.regulation || "",
      programs: [{ program: row.program, programcode: row.programcode }],
      faculty: users.find((user) => text(user.email).toLowerCase() === text(row.facultyemail).toLowerCase()) || { name: row.facultyname, email: row.facultyemail },
      status: row.status || "Active"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (ids) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} coordinator assignment(s)?`)) return;
    setBusy(true);
    try {
      await ep1.post("/api/v2/conductexam/coordinators-delete", { colid: global1.colid, ids });
      setMessage("Coordinator assignment deleted.");
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete coordinator.");
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{ academicyear: "2026-27", regulation: "R2026", program: "B.Sc Computer Science", programcode: "BSC", facultyname: "Coordinator Name", facultyemail: "coordinator@example.com", status: "Active" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Coordinators");
    XLSX.writeFile(workbook, "exam_coordinator_template.xlsx");
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({
        rowNumber: index + 2,
        academicyear: row.academicyear || row["Academic Year"] || "",
        regulation: row.regulation || row.Regulation || "",
        program: row.program || row.Program || "",
        programcode: row.programcode || row["Program Code"] || "",
        facultyname: row.facultyname || row["Faculty Name"] || row.name || "",
        facultyemail: row.facultyemail || row["Faculty Email"] || row.email || "",
        status: row.status || row.Status || "Active"
      }));
      const res = await ep1.post("/api/v2/conductexam/coordinators-bulk", { colid: global1.colid, name: global1.name, user: global1.user, items });
      setMessage(`${res.data?.saved || 0} coordinator assignments uploaded.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload coordinator assignments.");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "regulation", headerName: "Regulation", width: 140 },
    { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "facultyname", headerName: "Coordinator", minWidth: 180, flex: 1 },
    { field: "facultyemail", headerName: "Coordinator Email", minWidth: 220, flex: 1 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => editRow(params.row)}>Edit</Button>
          <Button size="small" color="error" onClick={() => remove([params.row._id])}>Delete</Button>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title="Exam coordinator">
      {pageBackground(
        <>
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={900}>Exam coordinator</Typography>
                <Typography color="text.secondary">Assign coordinators to one or more regulation programs.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                <Button variant="outlined" onClick={downloadTemplate}>Template</Button>
                <Button component="label" variant="contained" startIcon={<UploadFileIcon />} disabled={busy}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button>
                <Button color="error" variant="outlined" disabled={busy || !selectedIds.length} onClick={() => remove(selectedIds)}>Bulk Delete</Button>
              </Stack>
            </Stack>
          </Paper>
          {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2.2}><Autocomplete options={academicYearOptions} value={form.academicyear} onChange={(_, value) => setForm({ ...form, academicyear: value || "", regulation: "", programs: [] })} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
              <Grid item xs={12} md={2.2}><Autocomplete options={regulationOptions} value={form.regulation} onChange={(_, value) => setForm({ ...form, regulation: value || "", programs: [] })} renderInput={(params) => <TextField {...params} label="Regulation" />} /></Grid>
              <Grid item xs={12} md={3.4}><MultiSelect label="Programs" options={programOptions} value={form.programs} onChange={(value) => setForm({ ...form, programs: value })} getLabel={(item) => `${item.program} (${item.programcode})`} disabled={!form.regulation} /></Grid>
              <Grid item xs={12} md={2.6}><Autocomplete options={users} value={form.faculty} getOptionLabel={(item) => item?.email ? `${item.name} (${item.email})` : ""} isOptionEqualToValue={(option, selected) => option.email === selected.email} onChange={(_, value) => setForm({ ...form, faculty: value })} renderInput={(params) => <TextField {...params} label="Faculty / Coordinator" />} /></Grid>
              <Grid item xs={12} md={1.6}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={1.4}><Button fullWidth variant="contained" disabled={busy} onClick={save} sx={{ height: 56 }}>{busy ? "Saving..." : editId ? "Update" : "Save"}</Button></Grid>
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Box sx={{ height: 580 }}>
              <DataGrid
                rows={rows}
                getRowId={(row) => row._id}
                columns={columns}
                checkboxSelection
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={(model) => setSelectedIds(Array.from(model))}
                slots={{ toolbar: GridToolbar }}
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
                sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "start", py: 1 } }}
              />
            </Box>
          </Paper>
        </>
      )}
    </MenuPageShell>
  );
}

export function ConductExamMyExamPage() {
  const [rows, setRows] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courseMapRows, setCourseMapRows] = useState([]);
  const [form, setForm] = useState({ academicyear: "", examname: "", examcode: "", regulation: "", programs: [], semester: [], session: "Odd", type: "Regular" });
  const [readinessRows, setReadinessRows] = useState([]);
  const [selectedReadinessIds, setSelectedReadinessIds] = useState([]);
  const [readinessSummary, setReadinessSummary] = useState(null);
  const [lastExamContext, setLastExamContext] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const email = text(global1.user).toLowerCase();
    const [assignmentRes, examRes, courseRes] = await Promise.all([
      ep1.get("/api/v2/conductexam/coordinators", { params: { colid: global1.colid, facultyemail: global1.user, status: "Active" } }),
      ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/conductexam/course-options", { params: { colid: global1.colid } })
    ]);
    const assigned = (assignmentRes.data?.data || []).filter((row) => text(row.facultyemail).toLowerCase() === email);
    setAssignments(assigned);
    setCourseMapRows(courseRes.data?.data || []);
    setRows((examRes.data?.data || []).filter((exam) => assigned.some((row) => row.programcode === exam.programcode || (!exam.programcode && row.academicyear === exam.academicyear))));
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Unable to load coordinator exams."));
  }, []);

  const academicYearOptions = useMemo(() => uniq(assignments.map((row) => row.academicyear)), [assignments]);
  const regulationOptions = useMemo(() => uniq(assignments.filter((row) => !form.academicyear || row.academicyear === form.academicyear).map((row) => row.regulation)), [assignments, form.academicyear]);
  const programOptions = useMemo(() => {
    const map = new Map();
    assignments.filter((row) => row.academicyear === form.academicyear && row.regulation === form.regulation).forEach((row) => map.set(byProgram(row), { program: row.program, programcode: row.programcode }));
    return [...map.values()].sort((a, b) => text(a.program).localeCompare(text(b.program)));
  }, [assignments, form.academicyear, form.regulation]);
  const selectedProgramCodes = useMemo(() => form.programs.map((row) => text(row.programcode)).filter(Boolean), [form.programs]);
  const mappedSemesterOptions = useMemo(() => {
    if (!form.academicyear || !form.regulation || !selectedProgramCodes.length) return [];
    const matched = courseMapRows.filter((row) =>
      text(row.academicyear) === text(form.academicyear) &&
      text(row.regulation) === text(form.regulation) &&
      selectedProgramCodes.includes(text(row.programcode))
    );
    const semesters = uniq(matched.map((row) => row.semester));
    return semesters.length ? ["All", ...semesters] : [];
  }, [courseMapRows, form.academicyear, form.regulation, selectedProgramCodes]);

  const decorateReadinessRows = (items = []) => items.map((row, index) => ({
    id: `${row.examcode || "check"}-${row.programcode}-${row.coursecode}-${row.semester}-${index}`,
    ...row
  }));

  const buildReadinessSummary = (items = [], coursesPopulated = 0) => ({
    totalCourses: items.length,
    coursesPopulated,
    syllabusUploaded: items.filter((row) => row.syllabusstatus === "Uploaded").length,
    syllabusPending: items.filter((row) => row.syllabusstatus === "Pending").length,
    syllabusFilePending: items.filter((row) => row.syllabusstatus === "Entered only").length,
    coUploaded: items.filter((row) => row.costatus === "Uploaded").length,
    coPending: items.filter((row) => row.costatus === "Pending").length,
    assessmentAdded: items.filter((row) => row.assessmentstatus === "Added").length,
    assessmentPending: items.filter((row) => row.assessmentstatus === "Pending").length,
    readyCourses: items.filter((row) => row.ready).length,
    deficientCourses: items.filter((row) => !row.ready).length
  });

  const checkReadiness = async () => {
    if (!form.academicyear || !form.regulation || !form.programs.length || !form.semester.length) {
      setError("Select academic year, regulation, assigned programs and semester before checking readiness.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setReadinessRows([]);
    setSelectedReadinessIds([]);
    setReadinessSummary(null);
    setProgress(5);
    setProgressLabel("Checking course readiness...");
    try {
      const multiple = form.programs.length > 1;
      const readiness = [];
      for (let index = 0; index < form.programs.length; index += 1) {
        const program = form.programs[index];
        const examcode = text(form.examcode) ? (multiple ? `${form.examcode}-${program.programcode}` : form.examcode) : "";
        setProgressLabel(`Checking syllabus, CO and assessment component for ${program.programcode}...`);
        const res = await ep1.post("/api/v2/conductexam/examcourses-populate-from-coursemap", {
          colid: global1.colid,
          user: global1.user,
          academicyear: form.academicyear,
          exam: form.examname,
          examname: form.examname,
          examcode,
          regulation: form.regulation,
          program: program.program,
          programcode: program.programcode,
          semesters: form.semester,
          dryrun: true
        });
        readiness.push(...(res.data?.readiness || []).map((row) => ({ ...row, examcode })));
        setProgress(Math.min(95, 10 + Math.round(((index + 1) / Math.max(1, form.programs.length)) * 85)));
      }
      const decorated = decorateReadinessRows(readiness);
      setReadinessRows(decorated);
      setReadinessSummary(buildReadinessSummary(decorated, 0));
      setLastExamContext({ academicyear: form.academicyear, regulation: form.regulation, examname: form.examname, examcode: form.examcode });
      setProgress(100);
      setProgressLabel("Readiness check completed.");
      setMessage(`Readiness checked for ${readiness.length} course(s). No exam or exam course rows were created.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to check readiness.");
      setProgressLabel("Stopped.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!form.academicyear || !form.examname || !form.examcode || !form.regulation || !form.programs.length || !form.semester.length) {
      setError("Select academic year, regulation, assigned programs, semester, exam name and exam code.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setReadinessRows([]);
    setSelectedReadinessIds([]);
    setReadinessSummary(null);
    setLastExamContext({ academicyear: form.academicyear, regulation: form.regulation, examname: form.examname, examcode: form.examcode });
    setProgress(5);
    setProgressLabel("Creating exam records...");
    try {
      const multiple = form.programs.length > 1;
      const readiness = [];
      let populated = 0;
      for (let index = 0; index < form.programs.length; index += 1) {
        const program = form.programs[index];
        const examcode = multiple ? `${form.examcode}-${program.programcode}` : form.examcode;
        await ep1.post("/api/v2/conductexam/exams", {
          colid: global1.colid,
          user: global1.user,
          academicyear: form.academicyear,
          examname: form.examname,
          examcode,
          regulation: form.regulation,
          program: program.program,
          programcode: program.programcode,
          semester: semesterText(form.semester),
          session: form.session,
          type: form.type
        });
        setProgress(35);
        setProgressLabel(`Loading subjects and checking readiness for ${program.programcode}...`);
        const populateRes = await ep1.post("/api/v2/conductexam/examcourses-populate-from-coursemap", {
          colid: global1.colid,
          user: global1.user,
          academicyear: form.academicyear,
          exam: form.examname,
          examname: form.examname,
          examcode,
          regulation: form.regulation,
          program: program.program,
          programcode: program.programcode,
          semesters: form.semester
        });
        readiness.push(...(populateRes.data?.readiness || []).map((row) => ({ ...row, examcode })));
        populated += populateRes.data?.saved || 0;
        setProgress(Math.min(95, 35 + Math.round(((index + 1) / Math.max(1, form.programs.length)) * 60)));
      }
      const decorated = decorateReadinessRows(readiness);
      setReadinessRows(decorated);
      setReadinessSummary(buildReadinessSummary(decorated, populated));
      setProgress(100);
      setProgressLabel("Completed.");
      setMessage(`${form.programs.length} exam record(s) created and ${populated} course row(s) populated from regulation course map.`);
      setForm({ academicyear: "", examname: "", examcode: "", regulation: "", programs: [], semester: [], session: "Odd", type: "Regular" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create my exam.");
      setProgressLabel("Stopped.");
    } finally {
      setBusy(false);
    }
  };

  const addStudents = async () => {
    const context = {
      academicyear: form.academicyear || lastExamContext?.academicyear || "",
      regulation: form.regulation || lastExamContext?.regulation || "",
      examname: form.examname || lastExamContext?.examname || "",
      examcode: form.examcode || lastExamContext?.examcode || ""
    };
    if (!context.academicyear || !context.regulation || !context.examname || !context.examcode) {
      setError("Select or create an exam with exam name and exam code before adding students.");
      return;
    }
    const selectedSet = new Set(selectedReadinessIds);
    const courses = selectedSet.size ? readinessRows.filter((row) => selectedSet.has(row.id)) : readinessRows;
    if (!courses.length) {
      setError("Check readiness or create the exam first, then select course rows for adding students.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setProgress(5);
    setProgressLabel("Adding students to exam roll...");
    try {
      const groups = courses.reduce((map, row) => {
        const key = row.examcode || context.examcode;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
        return map;
      }, new Map());
      let saved = 0;
      let uniqueStudents = 0;
      const errors = [];
      let index = 0;
      for (const [examcode, groupCourses] of groups.entries()) {
        setProgressLabel(`Adding students for exam code ${examcode}...`);
        const res = await ep1.post("/api/v2/conductexam/examrolls-add-students-for-courses", {
          colid: global1.colid,
          user: global1.user,
          academicyear: context.academicyear,
          regulation: context.regulation,
          exam: context.examname,
          examname: context.examname,
          examcode,
          courses: groupCourses
        });
        saved += res.data?.saved || 0;
        uniqueStudents += res.data?.uniqueStudents || 0;
        errors.push(...(res.data?.errors || []));
        index += 1;
        setProgress(Math.min(95, 10 + Math.round((index / Math.max(1, groups.size)) * 85)));
      }
      setProgress(100);
      setProgressLabel("Students added.");
      setMessage(`${saved} exam roll row(s) added/updated for ${uniqueStudents} unique student(s).${errors.length ? ` ${errors.length} row issue(s) skipped.` : ""}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add students.");
      setProgressLabel("Stopped.");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "examname", headerName: "Exam Name", minWidth: 220, flex: 1 },
    { field: "examcode", headerName: "Exam Code", minWidth: 170, flex: 1 },
    { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 140 },
    { field: "session", headerName: "Session", width: 120 },
    { field: "type", headerName: "Type of Exam", width: 150 }
  ];
  const readinessColumns = [
    { field: "examcode", headerName: "Exam Code", width: 140 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "semester", headerName: "Sem", width: 80 },
    { field: "coursecode", headerName: "Course Code", width: 130 },
    { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
    { field: "syllabusstatus", headerName: "Syllabus", width: 135, renderCell: ({ row }) => <Chip size="small" color={row.syllabusstatus === "Uploaded" ? "success" : row.syllabusstatus === "Entered only" ? "warning" : "error"} label={row.syllabusstatus} /> },
    { field: "costatus", headerName: "CO", width: 110, renderCell: ({ value }) => <Chip size="small" color={value === "Uploaded" ? "success" : "error"} label={value} /> },
    { field: "assessmentstatus", headerName: "Assessment", width: 135, renderCell: ({ value }) => <Chip size="small" color={value === "Added" ? "success" : "error"} label={value} /> },
    { field: "deficiencies", headerName: "Deficiencies", minWidth: 260, flex: 1, valueGetter: ({ row }) => (row.deficiencies || []).join(", ") || "Ready" },
    {
      field: "links",
      headerName: "Action Links",
      width: 310,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Button size="small" component={RouterLink} to="/syllabus">Syllabus</Button>
          {row.syllabuslink && <Button size="small" href={row.syllabuslink} target="_blank" rel="noreferrer">Open</Button>}
          <Button size="small" component={RouterLink} to="/colist">Add CO</Button>
          <Button size="small" component={RouterLink} to="/assessmentcomponent">Assessment</Button>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title="Create my exam">
      {pageBackground(
        <>
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={900}>Create my exam</Typography>
            <Typography color="text.secondary">Create exams only for programs assigned to you as exam coordinator.</Typography>
          </Paper>
          {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}><Autocomplete options={academicYearOptions} value={form.academicyear} onChange={(_, value) => setForm({ ...form, academicyear: value || "", regulation: "", programs: [], semester: [] })} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete options={regulationOptions} value={form.regulation} onChange={(_, value) => setForm({ ...form, regulation: value || "", programs: [], semester: [] })} renderInput={(params) => <TextField {...params} label="Regulation" />} /></Grid>
              <Grid item xs={12} md={3}><MultiSelect label="Assigned Programs" options={programOptions} value={form.programs} onChange={(value) => setForm({ ...form, programs: value, semester: [] })} getLabel={(item) => `${item.program} (${item.programcode})`} disabled={!form.regulation} /></Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth label="Exam Name" value={form.examname} onChange={(e) => setForm({ ...form, examname: e.target.value })} /></Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth label="Exam Code" value={form.examcode} onChange={(e) => setForm({ ...form, examcode: e.target.value })} /></Grid>
              <Grid item xs={12} md={3}><MultiSelect label="Semester" options={mappedSemesterOptions} value={form.semester} onChange={(value) => setForm({ ...form, semester: normalizeSemesters(value) })} disabled={!mappedSemesterOptions.length} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Session" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>{sessions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Type of Exam" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{examTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={8}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="outlined" disabled={busy} onClick={checkReadiness} sx={{ height: 48 }}>{busy ? "Please wait..." : "Check Readiness"}</Button>
                  <Button variant="contained" disabled={busy} onClick={save} sx={{ height: 48 }}>{busy ? "Please wait..." : "Create Exam"}</Button>
                  <Button color="success" variant="contained" disabled={busy || !readinessRows.length} onClick={addStudents} sx={{ height: 48 }}>{busy ? "Please wait..." : "Add Students"}</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          {(busy || progress > 0 || readinessSummary) && (
            <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={800}>{progressLabel || "Exam course population"}</Typography>
                  <Typography fontWeight={900}>{progress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
                {readinessSummary && (
                  <Grid container spacing={1.5}>
                    {[
                      ["Courses populated", readinessSummary.coursesPopulated, "primary"],
                      ["Ready courses", readinessSummary.readyCourses, "success"],
                      ["Deficient courses", readinessSummary.deficientCourses, readinessSummary.deficientCourses ? "error" : "success"],
                      ["Syllabus uploaded", readinessSummary.syllabusUploaded, "success"],
                      ["Syllabus pending", readinessSummary.syllabusPending + readinessSummary.syllabusFilePending, readinessSummary.syllabusPending || readinessSummary.syllabusFilePending ? "warning" : "success"],
                      ["CO uploaded", readinessSummary.coUploaded, "success"],
                      ["CO pending", readinessSummary.coPending, readinessSummary.coPending ? "error" : "success"],
                      ["Assessment pending", readinessSummary.assessmentPending, readinessSummary.assessmentPending ? "error" : "success"]
                    ].map(([label, value, color]) => (
                      <Grid item xs={12} sm={6} md={3} key={label}>
                        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#fff", borderColor: color === "error" ? "#fecaca" : color === "warning" ? "#fde68a" : "#dbeafe" }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="h5" fontWeight={900} color={`${color}.main`}>{value}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Stack>
            </Paper>
          )}
          {readinessRows.length > 0 && (
            <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1} sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>Course readiness summary</Typography>
                  <Typography color="text.secondary">Subjects were populated from regulation course map. Pending items are highlighted course-wise.</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button component={RouterLink} to="/syllabus" variant="outlined">Add syllabus</Button>
                  <Button component={RouterLink} to="/colist" variant="outlined">Add CO</Button>
                  <Button component={RouterLink} to="/assessmentcomponent" variant="outlined">Add assessment component</Button>
                </Stack>
              </Stack>
              <Box sx={{ height: 520 }}>
                <DataGrid
                  rows={readinessRows}
                  columns={readinessColumns}
                  checkboxSelection
                  rowSelectionModel={selectedReadinessIds}
                  onRowSelectionModelChange={(model) => setSelectedReadinessIds(Array.from(model))}
                  slots={{ toolbar: GridToolbar }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  disableRowSelectionOnClick
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "start", py: 1 } }}
                />
              </Box>
            </Paper>
          )}
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Box sx={{ height: 560 }}>
              <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} slots={{ toolbar: GridToolbar }} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
            </Box>
          </Paper>
        </>
      )}
    </MenuPageShell>
  );
}
