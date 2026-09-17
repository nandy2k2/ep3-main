import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Delete, Download, Edit, Print, Save, UploadFile } from "@mui/icons-material";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const fields = [
  "academicyear", "regulation", "program", "programcode", "semester", "course", "coursecode", "student", "regno",
  "abcid", "exam", "examcode", "specialization", "mediumofinstruction", "oldenrolmmentno", "credit",
  "cceobtained", "ccetotal", "ccepercentage", "ccegrade", "seetheoryobtained", "seetheorytotal", "seetheorypercentage", "seetheorygrade",
  "seepracticalobtained", "seepracticaltotal", "seepracticalpercentage", "seepracticalgrade", "overallobtained", "overalltotal",
  "overallpercentage", "overallgrade", "gradepoint", "overallgradepoints", "status"
];
const numericFields = ["credit", "cceobtained", "ccetotal", "ccepercentage", "seetheoryobtained", "seetheorytotal", "seetheorypercentage", "seepracticalobtained", "seepracticaltotal", "seepracticalpercentage", "overallobtained", "overalltotal", "overallpercentage", "gradepoint", "overallgradepoints"];
const filterFields = ["academicyear", "regulation", "program", "programcode", "semester", "course", "coursecode", "student", "regno", "exam", "examcode", "specialization", "mediumofinstruction", "status"];
const labels = {
  academicyear: "Academic Year",
  regulation: "Regulation",
  program: "Program",
  programcode: "Program Code",
  semester: "Semester",
  course: "Course",
  coursecode: "Course Code",
  student: "Student",
  regno: "Reg No",
  abcid: "ABC ID",
  exam: "Exam",
  examcode: "Exam Code",
  specialization: "Specialization",
  mediumofinstruction: "Medium of Instruction",
  oldenrolmmentno: "Old Enrollment No",
  credit: "Credit",
  cceobtained: "CCE Obtained",
  ccetotal: "CCE Total",
  ccepercentage: "CCE %",
  ccegrade: "CCE Grade",
  seetheoryobtained: "SEE Theory Obtained",
  seetheorytotal: "SEE Theory Total",
  seetheorypercentage: "SEE Theory %",
  seetheorygrade: "SEE Theory Grade",
  seepracticalobtained: "SEE Practical Obtained",
  seepracticaltotal: "SEE Practical Total",
  seepracticalpercentage: "SEE Practical %",
  seepracticalgrade: "SEE Practical Grade",
  overallobtained: "Overall Obtained",
  overalltotal: "Overall Total",
  overallpercentage: "Overall %",
  overallgrade: "Overall Grade",
  gradepoint: "Grade Point",
  overallgradepoints: "Overall Grade Points",
  status: "Status"
};
const blank = fields.reduce((acc, field) => ({ ...acc, [field]: numericFields.includes(field) ? 0 : "" }), { status: "Active" });
const text = (value) => String(value ?? "").trim();
const fmt = (value) => (value === null || value === undefined || value === "" ? "-" : value);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const rowId = (row) => row._id || row.id || `${row.regno}-${row.coursecode}-${row.examcode}`;
const msg = (err, fallback) => err.response?.data?.message || err.response?.data?.msg || fallback;
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.3, alignItems: "flex-start", py: 1 },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

function paramsFromFilters(filters = []) {
  return filters.reduce((acc, row) => {
    if (row.field && text(row.value)) acc[row.field] = row.value;
    return acc;
  }, {});
}

function makeFilter() {
  return { id: `${Date.now()}-${Math.random()}`, field: "academicyear", value: "" };
}

async function readExcel(file) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
}

function downloadRows(filename, rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

function SearchableField({ label, value, options, onChange, disabled = false }) {
  return (
    <Autocomplete
      freeSolo
      disabled={disabled}
      options={options || []}
      value={value || ""}
      onChange={(_, next) => onChange(next || "")}
      onInputChange={(_, next) => onChange(next || "")}
      renderInput={(params) => <TextField {...params} fullWidth size="small" label={label} />}
    />
  );
}

function DynamicFilters({ filters, setFilters, options, onLoad, loading }) {
  const update = (id, patch) => setFilters(filters.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
      <Typography fontWeight={900} sx={{ mb: 1 }}>Dynamic Filters</Typography>
      <Stack spacing={1}>
        {filters.map((filter) => (
          <Grid container spacing={1} key={filter.id}>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => update(filter.id, { field: e.target.value, value: "" })}>
                {filterFields.map((field) => <MenuItem key={field} value={field}>{labels[field]}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <SearchableField label="Value" value={filter.value} options={options[filter.field] || []} onChange={(value) => update(filter.id, { value })} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" color="error" onClick={() => setFilters(filters.filter((row) => row.id !== filter.id))}>Remove</Button>
            </Grid>
          </Grid>
        ))}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={() => setFilters([...filters, makeFilter()])}>Add Filter</Button>
          <Button variant="contained" disabled={loading} onClick={onLoad} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>Load</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function PrintHeader({ institution = {}, title }) {
  const logo = institution.logolink || institution.logo || global1.logo || "";
  return (
    <Box sx={{ textAlign: "center", mb: 1 }}>
      {logo && <Box component="img" src={logo} alt="logo" sx={{ height: 54, objectFit: "contain", mb: 0.5 }} />}
      <Typography sx={{ fontSize: 18, fontWeight: 950 }}>{institution.institutionname || institution.insname || global1.insname || "Institution"}</Typography>
      <Typography sx={{ fontSize: 11 }}>{institution.address || ""}</Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 950, mt: 0.5 }}>{title}</Typography>
    </Box>
  );
}

function useMcaOptions(source = {}) {
  const [options, setOptions] = useState({});
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [institution, setInstitution] = useState({});
  const [gradingTemplates, setGradingTemplates] = useState([]);
  const [classConfigurations, setClassConfigurations] = useState([]);
  const loadOptions = async (next = source) => {
    const res = await ep1.get("/api/v2/mca-marksheet/options", {
      params: {
        colid: global1.colid,
        academicyear: next.academicyear || "",
        regulation: next.regulation || "",
        program: next.program || "",
        programcode: next.programcode || "",
        semester: next.semester || ""
      }
    });
    setOptions(res.data?.options || {});
    setStudents(res.data?.students || []);
    setCourses(res.data?.courses || []);
    setExams(res.data?.exams || []);
    setGradingTemplates(res.data?.gradingTemplates || []);
    setClassConfigurations(res.data?.classConfigurations || []);
    setInstitution(res.data?.institution || {});
  };
  useEffect(() => { loadOptions(source).catch(() => {}); }, []);
  return { options, students, courses, exams, gradingTemplates, classConfigurations, institution, loadOptions };
}

export function McaMarksheetEntryPage() {
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState([makeFilter()]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [templateid, setTemplateid] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { options, students, courses, exams, gradingTemplates, loadOptions } = useMcaOptions(form);

  const updateForm = (field, value) => {
    const next = { ...form, [field]: value };
    if (["academicyear", "regulation", "program", "programcode", "semester"].includes(field)) loadOptions(next).catch(() => {});
    setForm(next);
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/mca-marksheet/rows", { params: { colid: global1.colid, ...paramsFromFilters(filters) } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load MCA marksheet rows"));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      await ep1.post("/api/v2/mca-marksheet/rows", { ...form, colid: global1.colid, user: global1.user, name: global1.name });
      setMessage("MCA marksheet row saved.");
      setForm(blank);
      await loadRows();
    } catch (err) {
      setError(msg(err, "Unable to save MCA marksheet row"));
    } finally {
      setSaving(false);
    }
  };

  const deleteRows = async (ids) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} selected row(s)?`)) return;
    try {
      setLoading(true);
      await ep1.post("/api/v2/mca-marksheet/rows-delete", { colid: global1.colid, ids });
      setSelected([]);
      await loadRows();
    } catch (err) {
      setError(msg(err, "Unable to delete rows"));
    } finally {
      setLoading(false);
    }
  };

  const bulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setLoading(true);
      const uploadRows = await readExcel(file);
      const res = await ep1.post("/api/v2/mca-marksheet/rows-bulk", { colid: global1.colid, user: global1.user, name: global1.name, rows: uploadRows });
      setMessage(`${res.data?.saved || 0} rows uploaded.`);
      await loadRows();
    } catch (err) {
      setError(msg(err, "Unable to upload rows"));
    } finally {
      setLoading(false);
    }
  };

  const processGrades = async () => {
    if (!templateid) {
      setError("Select a grading scheme first.");
      return;
    }
    const activeFilters = paramsFromFilters(filters);
    if (!selected.length && !Object.keys(activeFilters).length) {
      setError("Select rows or apply at least one filter before processing grades.");
      return;
    }
    try {
      setProcessing(true);
      const res = await ep1.post("/api/v2/mca-marksheet/process-grades", {
        colid: global1.colid,
        templateid,
        ids: selected,
        filters: selected.length ? {} : activeFilters
      });
      setMessage(`${res.data?.updated || 0} row(s) processed. Percentages, overall totals and grades updated.`);
      await loadRows();
    } catch (err) {
      setError(msg(err, "Unable to process grades"));
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { field: "actions", type: "actions", width: 110, getActions: (params) => [
      <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => setForm({ ...blank, ...params.row, id: params.row._id })} />,
      <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRows([params.row._id])} />
    ] },
    ...fields.map((field) => ({ field, headerName: labels[field], minWidth: ["course", "student", "specialization"].includes(field) ? 220 : 135, flex: ["course", "student", "specialization"].includes(field) ? 1 : undefined }))
  ];

  return (
    <MenuPageShell title="MCA Marksheet Data">
      <Stack spacing={2} sx={{ p: 2 }}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>Add / Edit Marks</Typography>
          <Grid container spacing={1.5}>
            {["academicyear", "regulation", "program", "semester"].map((field) => (
              <Grid item xs={12} md={3} key={field}>
                <SearchableField label={labels[field]} value={form[field]} options={options[field] || []} onChange={(value) => updateForm(field, value)} />
              </Grid>
            ))}
            <Grid item xs={12} md={3}><SearchableField label="Program Code" value={form.programcode} options={options.programcode || []} onChange={(value) => updateForm("programcode", value)} /></Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={courses}
                getOptionLabel={(option) => typeof option === "string" ? option : `${option.course || ""} (${option.coursecode || ""})`}
                onChange={(_, row) => row && setForm({ ...form, course: row.course || "", coursecode: row.coursecode || "", credit: row.credit || form.credit })}
                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Course" />}
              />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Course Code" value={form.coursecode || ""} onChange={(e) => updateForm("coursecode", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={students}
                getOptionLabel={(option) => typeof option === "string" ? option : `${option.name || ""} (${option.regno || ""})`}
                onChange={(_, row) => row && setForm({ ...form, student: row.name || "", regno: row.regno || "", abcid: row.abcid || form.abcid })}
                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Student / Reg No" />}
              />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Reg No" value={form.regno || ""} onChange={(e) => updateForm("regno", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={exams}
                getOptionLabel={(option) => typeof option === "string" ? option : `${option.examname || ""} (${option.examcode || ""})`}
                onChange={(_, row) => row && setForm({ ...form, exam: row.examname || "", examcode: row.examcode || "" })}
                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Exam" />}
              />
            </Grid>
            {fields.filter((field) => !["academicyear", "regulation", "program", "programcode", "semester", "course", "coursecode", "student", "regno", "exam", "examcode"].includes(field)).map((field) => (
              <Grid item xs={12} md={numericFields.includes(field) ? 2 : 3} key={field}>
                <TextField fullWidth size="small" type={numericFields.includes(field) ? "number" : "text"} label={labels[field]} value={form[field] ?? ""} onChange={(e) => updateForm(field, e.target.value)} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} disabled={saving} onClick={save}>Save</Button>
                <Button variant="outlined" onClick={() => setForm(blank)}>Clear</Button>
                <Button variant="outlined" startIcon={<Download />} onClick={() => downloadRows("mca_marksheet_template.xlsx", [fields.reduce((acc, field) => ({ ...acc, [field]: "" }), {})])}>Template</Button>
                <Button component="label" variant="outlined" startIcon={<UploadFile />}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={bulkUpload} /></Button>
                <Button variant="outlined" color="error" disabled={!selected.length || loading} onClick={() => deleteRows(selected)}>Bulk Delete</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>Process Percentages And Grades</Typography>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={gradingTemplates}
                getOptionLabel={(option) => `${option.academicyear || ""} - ${option.templatename || option.templateid || ""}`}
                value={gradingTemplates.find((item) => item.templateid === templateid) || null}
                onChange={(_, value) => setTemplateid(value?.templateid || "")}
                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Grading Scheme" />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" disabled={processing} onClick={processGrades} startIcon={processing ? <CircularProgress size={16} color="inherit" /> : null}>Process Loaded / Selected Rows</Button>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                  {selected.length ? `${selected.length} selected row(s) will be processed.` : "If no rows are selected, the current filters will be processed."}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <DynamicFilters filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Paper sx={{ height: 650 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={rowId}
            checkboxSelection
            rowSelectionModel={selected}
            onRowSelectionModelChange={setSelected}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            sx={gridSx}
            pageSizeOptions={[25, 50, 100]}
          />
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function McaMarksheetPrintPage() {
  const [studentFilterFields, setStudentFilterFields] = useState([]);
  const [studentFilterOptions, setStudentFilterOptions] = useState({});
  const [studentFilters, setStudentFilters] = useState([{ field: "", operator: "equals", value: "" }]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marksheetFilters, setMarksheetFilters] = useState({
    academicyear: "",
    regulation: "",
    program: "",
    programcode: "",
    semester: "",
    exam: "",
    examcode: "",
    classconfigurationprogram: ""
  });
  const [data, setData] = useState(null);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [storingBlockchain, setStoringBlockchain] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");
  const { options, classConfigurations, loadOptions } = useMcaOptions({});

  useEffect(() => {
    ep1.get("/api/v2/student-dynamic-filter/options", { params: { colid: global1.colid } })
      .then((res) => {
        setStudentFilterFields(res.data?.fields || []);
        setStudentFilterOptions(res.data?.options || {});
      })
      .catch(() => {});
  }, []);

  const cleanStudentFilters = () =>
    studentFilters
      .map((filter) => ({
        field: filter.field,
        operator: filter.operator || "equals",
        value: text(filter.value)
      }))
      .filter((filter) => filter.field && (filter.operator === "notempty" || filter.value));

  const updateStudentFilter = (index, field, value) => {
    setStudentFilters((prev) => prev.map((filter, itemIndex) => {
      if (itemIndex !== index) return filter;
      const next = { ...filter, [field]: value };
      if (field === "field" || (field === "operator" && value === "notempty")) next.value = "";
      return next;
    }));
  };

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      setError("");
      setData(null);
      setSelectedStudent(null);
      const res = await ep1.post("/api/v2/student-dynamic-filter/search", { colid: global1.colid, filters: cleanStudentFilters() });
      setStudents(res.data?.data || []);
    } catch (err) {
      setError(msg(err, "Unable to load students from dynamic filters"));
    } finally {
      setStudentsLoading(false);
    }
  };

  const selectStudent = (student) => {
    const next = {
      academicyear: student.academicyear || "",
      regulation: student.regulation || "",
      program: student.program || "",
      programcode: student.programcode || "",
      semester: student.semester || "",
      exam: "",
      examcode: "",
      classconfigurationprogram: student.program || ""
    };
    setSelectedStudent(student);
    setMarksheetFilters(next);
    setData(null);
    setBlockchainInfo(null);
    loadOptions(next).catch(() => {});
  };

  const updateMarksheetFilter = (field, value) => {
    const next = { ...marksheetFilters, [field]: value };
    if (field === "program") {
      const programCode = (options.programcode || []).find((item) => String(item).toLowerCase() === String(value).toLowerCase());
      if (programCode && !next.programcode) next.programcode = programCode;
    }
    setMarksheetFilters(next);
    setData(null);
    setBlockchainInfo(null);
    if (["academicyear", "regulation", "program", "programcode", "semester"].includes(field)) loadOptions(next).catch(() => {});
  };

  const loadMarksheet = async () => {
    if (!selectedStudent?.regno) {
      setError("Select a student first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/mca-marksheet/print", {
        params: {
          colid: global1.colid,
          regno: selectedStudent.regno,
          student: selectedStudent.name,
          ...Object.fromEntries(Object.entries(marksheetFilters).filter(([, value]) => text(value)))
        }
      });
      setData(res.data || null);
      setBlockchainInfo(null);
      if (!(res.data?.rows || []).length) setError("No MCA marksheet data found for the selected filters.");
    } catch (err) {
      setError(msg(err, "Unable to generate marksheet"));
    } finally {
      setLoading(false);
    }
  };

  const storeBlockchain = async () => {
    if (!selectedStudent?.regno || !rows.length) {
      setError("Generate the marksheet before storing in blockchain.");
      return;
    }
    try {
      setStoringBlockchain(true);
      setError("");
      const res = await ep1.post("/api/v2/mca-marksheet/blockchain-store", {
        colid: global1.colid,
        regno: selectedStudent.regno,
        student: selectedStudent.name,
        ...Object.fromEntries(Object.entries(marksheetFilters).filter(([, value]) => text(value))),
        origin: window.location.origin,
        user: global1.user
      });
      setBlockchainInfo(res.data?.data || null);
      setData((prev) => prev ? {
        ...prev,
        rows: (prev.rows || []).map((row) => ({
          ...row,
          statementno: res.data?.data?.statementno || row.statementno,
          blockchainhash: res.data?.data?.hash || row.blockchainhash,
          blockchainrecordid: res.data?.data?.statementno || row.blockchainrecordid
        }))
      } : prev);
    } catch (err) {
      setError(msg(err, "Unable to store MCA marksheet in blockchain"));
    } finally {
      setStoringBlockchain(false);
    }
  };

  const rows = data?.rows || [];
  const first = rows[0] || {};
  const student = data?.student || {};
  const summary = data?.summary || {};
  const moocRows = data?.mooc || [];
  const seeT = (row) => text(row.seetheorygrade) || (num(row.seetheorytotal) ? `${fmt(row.seetheoryobtained)}/${fmt(row.seetheorytotal)}` : "-");
  const seeP = (row) => text(row.seepracticalgrade) || (num(row.seepracticaltotal) ? `${fmt(row.seepracticalobtained)}/${fmt(row.seepracticaltotal)}` : "-");
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return value;
    return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
  };
  const classConfigurationProgramOptions = useMemo(() => {
    const seen = new Set();
    return (classConfigurations || [])
      .map((item) => text(item.program))
      .filter(Boolean)
      .filter((program) => {
        const key = program.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classConfigurations]);
  const studentColumns = [
    { field: "name", headerName: "Student", width: 190 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "email", headerName: "Email", width: 210 },
    { field: "academicyear", headerName: "Academic Year", width: 130 },
    { field: "regulation", headerName: "Regulation", width: 130 },
    { field: "program", headerName: "Program", width: 190 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 110 },
    {
      field: "select",
      headerName: "Select",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant={selectedStudent?._id === params.row._id ? "contained" : "outlined"}
          onClick={() => selectStudent(params.row)}
        >
          Select
        </Button>
      )
    }
  ];

  const detailRows = [
    ["Programme", first.program],
    ["Specialization", first.specialization],
    ["Enrollment No.", first.regno],
    ["Old Enrollment No.", first.oldenrolmmentno],
    ["Exam Period", first.exam],
    ["Semester", first.semester],
    ["Medium of Instruction", first.mediumofinstruction],
    ["ABC ID", first.abcid || student.abcid],
    ["Name", first.student || student.name]
  ];

  return (
    <MenuPageShell title="MCA Marksheet">
      <Stack spacing={2} sx={{ p: 2 }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .mca-print, .mca-print * { visibility: visible; }
            .mca-print { position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm; margin: 0; box-shadow: none !important; }
            .screen-only { display: none !important; }
            @page { size: A4 portrait; margin: 10mm; }
          }
          .mca-print table { border-collapse: collapse; width: 100%; }
          .mca-print th, .mca-print td { border: 1px solid #111; padding: 4px 6px; font-size: 11px; vertical-align: top; }
          .mca-print th { font-weight: 900; text-align: center; }
          .mca-print, .mca-print * { color: #111 !important; }
          .mca-course-table { border: 1px solid #111 !important; }
          .mca-course-table th { border: 1px solid #111 !important; }
          .mca-course-table td {
            border-left: 1px solid #111 !important;
            border-right: 1px solid #111 !important;
            border-top: 0 !important;
            border-bottom: 0 !important;
            text-align: center;
          }
          .mca-course-table tbody tr:first-child td { border-top: 0 !important; }
          .mca-course-table tbody tr:last-child td { border-bottom: 1px solid #111 !important; }
          .mca-course-table .course-code-cell,
          .mca-course-table .course-title-cell {
            text-align: left !important;
          }
        `}</style>
        {error && <Alert className="screen-only" severity="warning" onClose={() => setError("")}>{error}</Alert>}
        {blockchainInfo?.statementno && (
          <Alert className="screen-only" severity="success" onClose={() => setBlockchainInfo(null)}>
            Stored in blockchain. Statement No: {blockchainInfo.statementno}
          </Alert>
        )}
        <Box className="screen-only">
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>1. Select student using dynamic filters</Typography>
            <Stack spacing={1.5}>
              {studentFilters.map((filter, index) => (
                <Grid container spacing={1.5} key={index}>
                  <Grid item xs={12} md={3}>
                    <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => updateStudentFilter(index, "field", e.target.value)}>
                      <MenuItem value="">Select field</MenuItem>
                      {studentFilterFields.map((item) => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField select fullWidth size="small" label="Operator" value={filter.operator} onChange={(e) => updateStudentFilter(index, "operator", e.target.value)}>
                      <MenuItem value="equals">Equals</MenuItem>
                      <MenuItem value="contains">Contains</MenuItem>
                      <MenuItem value="notempty">Not empty</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    {filter.operator === "notempty" ? (
                      <TextField fullWidth size="small" label="Value" value="Not empty" disabled />
                    ) : (
                      <Autocomplete
                        freeSolo
                        options={filter.field ? (studentFilterOptions[filter.field]?.values || []) : []}
                        value={filter.value || ""}
                        onInputChange={(_, value) => updateStudentFilter(index, "value", value || "")}
                        renderInput={(params) => <TextField {...params} size="small" label={studentFilterFields.find((item) => item.field === filter.field)?.label || "Value"} />}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" onClick={() => setStudentFilters((prev) => [...prev, { field: "", operator: "equals", value: "" }])}>Add</Button>
                      <Button color="error" variant="outlined" onClick={() => setStudentFilters((prev) => prev.length === 1 ? [{ field: "", operator: "equals", value: "" }] : prev.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                    </Stack>
                  </Grid>
                </Grid>
              ))}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" disabled={studentsLoading} onClick={loadStudents} startIcon={studentsLoading ? <CircularProgress size={16} color="inherit" /> : null}>Load Students</Button>
                {selectedStudent && <Chip color="success" label={`Selected: ${selectedStudent.name || ""} ${selectedStudent.regno ? `(${selectedStudent.regno})` : ""}`} />}
              </Stack>
            </Stack>
          </Paper>
          <Paper sx={{ height: 360, mb: 2 }}>
            <DataGrid
              rows={students}
              columns={studentColumns}
              getRowId={(row) => row._id || row.regno || row.email}
              loading={studentsLoading}
              slots={{ toolbar: GridToolbar }}
              sx={gridSx}
              pageSizeOptions={[10, 25, 50]}
            />
          </Paper>
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>2. Confirm marksheet parameters and generate</Typography>
            <Grid container spacing={1.5}>
              {["academicyear", "regulation", "program", "programcode", "semester", "exam", "examcode"].map((field) => (
                <Grid item xs={12} md={field === "program" ? 3 : 2} key={field}>
                  <SearchableField
                    label={labels[field] || field}
                    value={marksheetFilters[field] || ""}
                    options={options[field] || []}
                    onChange={(value) => updateMarksheetFilter(field, value)}
                    disabled={!selectedStudent}
                  />
                </Grid>
              ))}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  disabled={!selectedStudent}
                  freeSolo
                  options={classConfigurationProgramOptions}
                  value={marksheetFilters.classconfigurationprogram || ""}
                  onChange={(_, item) => updateMarksheetFilter("classconfigurationprogram", item || "")}
                  onInputChange={(_, value) => updateMarksheetFilter("classconfigurationprogram", value || "")}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Class Configuration Program" helperText="All class ranges for the selected program will be applied." />}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" disabled={!selectedStudent || loading} onClick={loadMarksheet} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>Generate Marksheet</Button>
                  <Button variant="outlined" startIcon={<Print />} disabled={!rows.length} onClick={() => window.print()}>Print</Button>
                  <Button variant="outlined" disabled={!rows.length || storingBlockchain} onClick={storeBlockchain} startIcon={storingBlockchain ? <CircularProgress size={16} /> : null}>Store In Blockchain</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Box>
        {rows.length ? (
          <Paper className="mca-print" elevation={0} sx={{ width: "210mm", minHeight: "297mm", mx: "auto", p: "11mm", bgcolor: "#fff", color: "#111" }}>
            <Box sx={{ position: "relative" }}>
              <PrintHeader institution={data?.institution || {}} title="Semester Performance Report" />
              {(student.photo || first.photo) && <Box component="img" src={student.photo || first.photo} alt="student" sx={{ position: "absolute", right: 4, top: 8, width: 64, height: 78, objectFit: "cover", border: "1px solid #111" }} />}
              <table>
                <tbody>
                  {detailRows.map((row, index) => index % 2 === 0 ? (
                    <tr key={row[0]}>
                      <td style={{ width: "22%", fontWeight: 800 }}>{row[0]}</td>
                      <td style={{ width: "39%", fontWeight: row[0] === "Name" ? 900 : 500 }}>{fmt(row[1])}</td>
                      <td style={{ width: "20%", fontWeight: 800 }}>{detailRows[index + 1]?.[0] || ""}</td>
                      <td style={{ width: "19%" }}>{detailRows[index + 1] ? fmt(detailRows[index + 1][1]) : ""}</td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
              <Box sx={{ mt: 1 }}>
                <table className="mca-course-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Course Code</th>
                      <th style={{ textAlign: "left" }}>Course Title</th>
                      <th>Credit</th>
                      <th>CCE</th>
                      <th>SEE (T)</th>
                      <th>SEE (P)</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={rowId(row)}>
                        <td className="course-code-cell">{fmt(row.coursecode)}</td>
                        <td className="course-title-cell" style={{ fontWeight: 700 }}>{fmt(row.course)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(row.credit)}</td>
                        <td style={{ textAlign: "center" }}>{fmt(row.ccegrade || (num(row.ccetotal) ? `${row.cceobtained}/${row.ccetotal}` : ""))}</td>
                        <td style={{ textAlign: "center" }}>{seeT(row)}</td>
                        <td style={{ textAlign: "center" }}>{seeP(row)}</td>
                        <td style={{ textAlign: "center", fontWeight: 800 }}>{fmt(row.overallgrade)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
              <Box sx={{ mt: 1 }}>
                <table>
                  <tbody>
                    <tr><td colSpan={4} style={{ textAlign: "center", fontWeight: 900 }}>Semester Performance Index</td></tr>
                    <tr>
                      <td style={{ textAlign: "center", fontWeight: 800 }}>Credits Offered : {fmt(summary.creditsOffered)}</td>
                      <td style={{ textAlign: "center", fontWeight: 800 }}>Credits Earned : {fmt(summary.creditsEarned)}</td>
                      <td style={{ textAlign: "center", fontWeight: 800 }}>Grade Points Earned (G) : {formatNumber(summary.gradePointsEarned)}</td>
                      <td style={{ textAlign: "center", fontWeight: 800 }}>SPI : {formatNumber(summary.spi)}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>
              <Box sx={{ mt: 1 }}>
                <table>
                  <thead>
                    <tr><th># MOOC Course Title</th><th>Platform</th><th>University Name</th></tr>
                  </thead>
                  <tbody>
                    {moocRows.length ? moocRows.map((row) => (
                      <tr key={row._id}>
                        <td style={{ fontWeight: 700 }}>{fmt(row.valueaddedcourse)}</td>
                        <td style={{ textAlign: "center" }}>{fmt(row.provider)}</td>
                        <td style={{ textAlign: "center" }}>{fmt(row.universityname || row.department || "-")}</td>
                      </tr>
                    )) : <tr><td colSpan={3} style={{ textAlign: "center" }}>-</td></tr>}
                  </tbody>
                </table>
              </Box>
              <Box sx={{ mt: 1 }}>
                <table>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", textAlign: "center", fontWeight: 900 }}>Result : {fmt(summary.result)}</td>
                      <td style={{ width: "50%", textAlign: "center", fontWeight: 900 }}>Class : {fmt(summary.classassigned || "-")}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>
              <Typography sx={{ fontSize: 11, mt: 1 }}># "Marks and credits for these subjects will not be considered for class or total."</Typography>
              <Typography sx={{ fontSize: 11 }}># "This marksheet reflects the current semester result only."</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>* AB - Absent</Typography>
              <Typography sx={{ fontSize: 11, mt: 1 }}>Date of issue : {new Date().toLocaleDateString("en-GB")}</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 12 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800 }}>Statement No. : {fmt(blockchainInfo?.statementno || first.statementno || first.blockchainrecordid || first.examcode || first.regno)}</Typography>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ height: 38 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 900 }}>Registrar</Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        ) : (
          <Card>
            <CardContent>
              <Typography color="text.secondary">Select a student using dynamic filters, then click Generate Marksheet.</Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </MenuPageShell>
  );
}
