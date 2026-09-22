import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Delete, Download, Edit, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankForm = {
  id: "",
  academicyear: "",
  regulation: "",
  institution: "",
  department: "",
  program: "",
  programcode: "",
  semester: "",
  section: "",
  student: "",
  regno: "",
  studentemail: "",
  title: "",
  category: "",
  level: "",
  organizer: "",
  venue: "",
  activitydate: "",
  journal: "",
  publicationtype: "",
  issn: "",
  doi: "",
  link: "",
  filelink: "",
  status: "Active",
  remarks: ""
};

const labels = {
  academicyear: "Academic Year",
  regulation: "Regulation",
  institution: "Institution",
  department: "Department",
  program: "Program",
  programcode: "Program Code",
  semester: "Semester",
  section: "Section",
  student: "Student",
  regno: "Reg No",
  studentemail: "Student Email",
  title: "Title",
  category: "Category",
  level: "Level",
  organizer: "Organizer",
  venue: "Venue",
  activitydate: "Date",
  journal: "Journal",
  publicationtype: "Publication Type",
  issn: "ISSN",
  doi: "DOI",
  link: "Link",
  filelink: "File Link",
  status: "Status",
  remarks: "Remarks"
};

const filterFields = [
  "academicyear",
  "regulation",
  "institution",
  "department",
  "program",
  "programcode",
  "semester",
  "section",
  "student",
  "regno",
  "category",
  "level",
  "status",
  "activitydatefrom",
  "activitydateto"
];

const commonColumns = [
  "academicyear",
  "regulation",
  "institution",
  "department",
  "program",
  "programcode",
  "semester",
  "section",
  "student",
  "regno",
  "studentemail",
  "title",
  "category",
  "level",
  "organizer",
  "venue",
  "activitydate",
  "status",
  "remarks"
];

const publicationColumns = ["journal", "publicationtype", "issn", "doi", "link", "filelink"];
const seminarColumns = ["link", "filelink"];

const asArray = (model) => Array.isArray(model) ? model : Array.from(model?.ids || []);
const valueText = (value) => String(value ?? "").trim();
const dateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};
const optionLabel = (value) => typeof value === "string" ? value : (value?.label || value?.name || value?.student || "");

function SearchSelect({ label, value, options = [], onChange, multiple = false }) {
  return (
    <Autocomplete
      freeSolo
      multiple={multiple}
      disableCloseOnSelect={multiple}
      options={options}
      value={multiple ? value : (value || null)}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(option, selected) => optionLabel(option) === optionLabel(selected)}
      onChange={(_, next) => onChange(next)}
      onInputChange={(_, next, reason) => {
        if (!multiple && reason === "input") onChange(next);
      }}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          {multiple && <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />}
          {optionLabel(option)}
        </li>
      )}
      renderInput={(params) => <TextField {...params} size="small" label={label} />}
    />
  );
}

function FilterBuilder({ filters, setFilters, options }) {
  const optionMap = {
    academicyear: options.academicyears || [],
    regulation: options.regulations || [],
    institution: options.institutions || [],
    department: options.departments || [],
    program: options.programs || [],
    programcode: options.programcodes || [],
    semester: options.semesters || [],
    section: options.sections || [],
    category: options.categories || [],
    level: options.levels || [],
    status: options.statuses || []
  };
  const update = (id, patch) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  return (
    <Stack spacing={1.5}>
      {filters.map((filter) => (
        <Grid container spacing={1} key={filter.id} alignItems="center">
          <Grid item xs={12} md={4}>
            <SearchSelect
              label="Filter field"
              value={filter.field}
              options={filterFields.map((field) => ({ label: labels[field] || field, value: field }))}
              onChange={(next) => update(filter.id, { field: next?.value || next || "", value: "" })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {["activitydatefrom", "activitydateto"].includes(filter.field) ? (
              <TextField fullWidth size="small" type="date" label={labels[filter.field] || "Date"} InputLabelProps={{ shrink: true }} value={filter.value || ""} onChange={(event) => update(filter.id, { value: event.target.value })} />
            ) : (
              <SearchSelect label="Value" value={filter.value || ""} options={optionMap[filter.field] || []} onChange={(next) => update(filter.id, { value: optionLabel(next) })} />
            )}
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((item) => item.id !== filter.id))}>Remove</Button>
          </Grid>
        </Grid>
      ))}
      <Box>
        <Button startIcon={<Add />} variant="outlined" onClick={() => setFilters((prev) => [...prev, { id: `f${Date.now()}`, field: "academicyear", value: "" }])}>
          Add filter
        </Button>
      </Box>
    </Stack>
  );
}

function printReport({ title, rows, institution, summary, grouped }) {
  const win = window.open("", "_blank");
  if (!win) return;
  const logo = institution?.logolink ? `<img src="${institution.logolink}" style="max-height:70px;object-fit:contain;" />` : "";
  const tableRows = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td><td>${row.academicyear || ""}</td><td>${row.institution || ""}</td><td>${row.program || ""}</td>
      <td>${row.programcode || ""}</td><td>${row.student || ""}</td><td>${row.regno || ""}</td><td>${row.title || ""}</td>
      <td>${row.category || ""}</td><td>${dateOnly(row.activitydate)}</td>
    </tr>
  `).join("");
  const summaryRows = grouped.map((row) => `<tr><td>${row.academicyear || ""}</td><td>${row.program || row.institution || row.category || ""}</td><td>${row.programcode || ""}</td><td>${row.count || 0}</td><td>${row.students || 0}</td></tr>`).join("");
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 14mm; }
          body { font-family: Arial, sans-serif; color:#000; background:#fff; }
          .actions { text-align:right; margin-bottom:12px; }
          @media print { .actions { display:none; } }
          .header { text-align:center; border-bottom:1px solid #000; padding-bottom:10px; margin-bottom:14px; }
          table { width:100%; border-collapse:collapse; font-size:11px; margin-top:10px; }
          th, td { border:1px solid #000; padding:5px; text-align:left; vertical-align:top; }
          th { background:#f4f4f4; }
          tr { break-inside: avoid; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="actions"><button onclick="window.print()">Print</button> <button onclick="window.close()">Close</button></div>
        <div class="header">${logo}<h2>${institution?.institutionname || ""}</h2><div>${institution?.address || ""}</div><h3>${title}</h3></div>
        <p><b>Total Records:</b> ${summary.total || 0} &nbsp; <b>Students:</b> ${summary.students || 0} &nbsp; <b>Programs:</b> ${summary.programs || 0}</p>
        <h4>Summary</h4>
        <table><thead><tr><th>Academic Year</th><th>Group</th><th>Program Code</th><th>Records</th><th>Students</th></tr></thead><tbody>${summaryRows}</tbody></table>
        <h4>Details</h4>
        <table><thead><tr><th>Sr</th><th>Academic Year</th><th>Institution</th><th>Program</th><th>Program Code</th><th>Student</th><th>Reg No</th><th>Title</th><th>Category</th><th>Date</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body>
    </html>
  `);
  win.document.close();
}

export function StudentAcademicActivityEntryPage({ type = "Seminar" }) {
  const title = type === "Publication" ? "Student Publications" : "Student Seminars";
  const isStudentRole = String(global1.role || "").toLowerCase() === "student";
  const [form, setForm] = useState(blankForm);
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [options, setOptions] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const studentOptions = useMemo(() => students.map((item) => ({
    ...item,
    label: `${item.name || ""} ${item.regno ? `(${item.regno})` : ""} ${item.programcode ? `- ${item.programcode}` : ""}`
  })), [students]);

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/student-academic-activities/options", { params: { colid: global1.colid } });
    const allStudents = res.data.students || [];
    const visibleStudents = isStudentRole
      ? allStudents.filter((item) => String(item.regno || "") === String(global1.regno || "") || String(item.email || "").toLowerCase() === String(global1.user || global1.email || "").toLowerCase())
      : allStudents;
    setStudents(visibleStudents);
    setOptions(res.data.options || {});
    if (isStudentRole && visibleStudents[0]) {
      selectStudent(visibleStudents[0]);
    }
  };

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/student-academic-activities/list", {
        colid: global1.colid,
        activitytype: type,
        ...(isStudentRole ? { regno: global1.regno || "" } : {})
      });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id, activitydate: dateOnly(row.activitydate) })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions().catch((err) => setError(err.response?.data?.message || "Unable to load options"));
    loadRows();
  }, [type]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const reset = () => setForm(blankForm);
  const selectStudent = (student) => {
    if (!student || typeof student === "string") return setField("student", student || "");
    setForm((prev) => ({
      ...prev,
      academicyear: student.academicyear || prev.academicyear,
      regulation: student.regulation || prev.regulation,
      institution: student.institution || prev.institution,
      department: student.department || prev.department,
      program: student.program || prev.program,
      programcode: student.programcode || prev.programcode,
      semester: student.semester || prev.semester,
      section: student.section || prev.section,
      student: student.name || "",
      regno: student.regno || "",
      studentemail: student.email || ""
    }));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ep1.post("/api/v2/student-academic-activities/save", {
        ...form,
        colid: global1.colid,
        activitytype: type,
        user: global1.user,
        name: global1.name || global1.user
      });
      setMessage(`${title} record saved.`);
      reset();
      await loadRows();
      await loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save record");
    } finally {
      setBusy(false);
    }
  };

  const editRow = (row) => {
    setForm({ ...blankForm, ...row, id: row._id || row.id, activitydate: dateOnly(row.activitydate) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async (ids) => {
    if (!ids.length) return setError("Select one or more rows.");
    if (!window.confirm(`Delete ${ids.length} record(s)?`)) return;
    setBusy(true);
    try {
      await ep1.post("/api/v2/student-academic-activities/delete", { colid: global1.colid, ids });
      setSelectedRows([]);
      setMessage("Selected records deleted.");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete records");
    } finally {
      setBusy(false);
    }
  };

  const columnsForType = type === "Publication" ? [...commonColumns, ...publicationColumns] : [...commonColumns, ...seminarColumns];
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      renderCell: (params) => <IconButton size="small" onClick={() => editRow(params.row)}><Edit fontSize="small" /></IconButton>
    },
    ...columnsForType.map((field) => ({ field, headerName: labels[field] || field, width: field === "title" ? 260 : 150 }))
  ];

  const downloadTemplate = () => {
    const sample = {
      "Academic Year": "2026-27",
      Regulation: "R2026",
      Institution: "",
      Department: "",
      Program: "MCA",
      "Program Code": "MCA",
      Semester: "1",
      Section: "A",
      Student: "Sample Student",
      "Reg No": "REG001",
      "Student Email": "student@example.com",
      Title: type === "Publication" ? "Sample paper title" : "Sample seminar title",
      Category: type === "Publication" ? "Journal" : "Seminar",
      Level: "National",
      Organizer: "Institution",
      Venue: "Auditorium",
      Date: "2026-09-21",
      Journal: type === "Publication" ? "Sample Journal" : "",
      "Publication Type": type === "Publication" ? "Research Paper" : "",
      ISSN: "",
      DOI: "",
      Link: "",
      "File Link": "",
      Status: "Active",
      Remarks: ""
    };
    const worksheet = XLSX.utils.json_to_sheet([sample]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title.toLowerCase().replaceAll(" ", "_")}_template.xlsx`);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({ ...row, rowNumber: index + 2, activitytype: type }));
      const res = await ep1.post("/api/v2/student-academic-activities/bulk", {
        colid: global1.colid,
        activitytype: type,
        user: global1.user,
        name: global1.name || global1.user,
        items
      });
      const errors = res.data.errors || [];
      setMessage(`${res.data.saved || 0} records uploaded${errors.length ? `, ${errors.length} skipped` : ""}.`);
      setError(errors.map((item) => `Row ${item.rowNumber}: ${item.message}`).join("; "));
      await loadRows();
      await loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload records");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MenuPageShell title={title}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ md: "center" }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">Add student {type.toLowerCase()} details with searchable student selection, bulk upload and bulk delete.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button startIcon={<Refresh />} variant="outlined" onClick={loadRows}>Load</Button>
            <Button startIcon={<Download />} variant="outlined" onClick={downloadTemplate}>Template</Button>
            <Button component="label" startIcon={<UploadFile />} variant="outlined">Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} /></Button>
            <Button startIcon={<Delete />} color="error" variant="outlined" disabled={busy || !selectedRows.length} onClick={() => deleteRows(selectedRows)}>Bulk delete</Button>
          </Stack>
        </Stack>
        {busy && <LinearProgress sx={{ mt: 2 }} />}
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>{form.id ? "Edit record" : "Add record"}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            {isStudentRole ? (
              <TextField fullWidth size="small" label="Student" value={form.student || global1.name || ""} InputProps={{ readOnly: true }} />
            ) : (
              <SearchSelect label="Student" value={form.student} options={studentOptions} onChange={selectStudent} />
            )}
          </Grid>
          {["academicyear", "regulation", "institution", "department", "program", "programcode", "semester", "section", "regno", "studentemail"].map((field) => (
            <Grid item xs={12} md={field === "studentemail" ? 4 : 2} key={field}>
              <TextField fullWidth size="small" label={labels[field]} value={form[field]} onChange={(event) => setField(field, event.target.value)} />
            </Grid>
          ))}
          <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Title" value={form.title} onChange={(event) => setField("title", event.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Category" value={form.category} onChange={(event) => setField("category", event.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" select label="Level" value={form.level} onChange={(event) => setField("level", event.target.value)}><MenuItem value="">Select</MenuItem>{["Institution", "District", "State", "National", "International"].map((item) => <MenuItem value={item} key={item}>{item}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Organizer" value={form.organizer} onChange={(event) => setField("organizer", event.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Venue" value={form.venue} onChange={(event) => setField("venue", event.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.activitydate} onChange={(event) => setField("activitydate", event.target.value)} /></Grid>
          {type === "Publication" && (
            <>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Journal" value={form.journal} onChange={(event) => setField("journal", event.target.value)} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Publication Type" value={form.publicationtype} onChange={(event) => setField("publicationtype", event.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth size="small" label="ISSN" value={form.issn} onChange={(event) => setField("issn", event.target.value)} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="DOI" value={form.doi} onChange={(event) => setField("doi", event.target.value)} /></Grid>
            </>
          )}
          <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Link" value={form.link} onChange={(event) => setField("link", event.target.value)} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth size="small" label="File Link" value={form.filelink} onChange={(event) => setField("filelink", event.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" select label="Status" value={form.status} onChange={(event) => setField("status", event.target.value)}>{["Active", "Inactive", "Submitted", "Approved", "Rejected"].map((item) => <MenuItem value={item} key={item}>{item}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} size="small" label="Remarks" value={form.remarks} onChange={(event) => setField("remarks", event.target.value)} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
          <Button startIcon={<Save />} variant="contained" disabled={busy} onClick={save}>{form.id ? "Update" : "Save"}</Button>
          <Button variant="outlined" onClick={reset}>Clear</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(model) => setSelectedRows(asArray(model))}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: GridToolbar }}
          sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start" } }}
        />
      </Paper>
    </MenuPageShell>
  );
}

export function StudentAcademicActivityReportPage({ type = "Seminar" }) {
  const title = type === "Publication" ? "Student Publications Report" : "Student Seminars Report";
  const [filters, setFilters] = useState([{ id: "f1", field: "academicyear", value: "" }]);
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [summary, setSummary] = useState({ total: 0, students: 0, programs: 0, institutions: 0 });
  const [academicyearProgram, setAcademicyearProgram] = useState([]);
  const [institutionWise, setInstitutionWise] = useState([]);
  const [categoryWise, setCategoryWise] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/student-academic-activities/options", { params: { colid: global1.colid } })
      .then((res) => setOptions(res.data.options || {}))
      .catch((err) => setError(err.response?.data?.message || "Unable to load options"));
  }, []);

  const cleanFilters = () => filters.filter((item) => item.field && valueText(item.value));

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/student-academic-activities/report", {
        colid: global1.colid,
        activitytype: type,
        filters: cleanFilters()
      });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id, activitydate: dateOnly(row.activitydate) })));
      setInstitution(res.data.institution || null);
      setSummary(res.data.summary || {});
      setAcademicyearProgram(res.data.academicyearProgram || []);
      setInstitutionWise(res.data.institutionWise || []);
      setCategoryWise(res.data.categoryWise || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportRows = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Details");
    XLSX.writeFile(workbook, `${title.toLowerCase().replaceAll(" ", "_")}.xlsx`);
  };

  const columns = [...commonColumns, ...(type === "Publication" ? publicationColumns : seminarColumns)].map((field) => ({
    field,
    headerName: labels[field] || field,
    width: field === "title" ? 280 : 150
  }));

  return (
    <MenuPageShell title={title}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ md: "center" }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">Select filters, then load details and charts.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button startIcon={<Refresh />} variant="contained" disabled={loading} onClick={loadReport}>Load report</Button>
            <Button startIcon={<Download />} variant="outlined" disabled={!rows.length} onClick={exportRows}>Export</Button>
            <Button startIcon={<Print />} variant="outlined" disabled={!rows.length} onClick={() => printReport({ title, rows, institution, summary, grouped: academicyearProgram })}>Print preview</Button>
          </Stack>
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <FilterBuilder filters={filters} setFilters={setFilters} options={options} />
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          ["Records", summary.total || 0],
          ["Students", summary.students || 0],
          ["Programs", summary.programs || 0],
          ["Institutions", summary.institutions || 0]
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={900}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 340 }}>
            <Typography fontWeight={800} gutterBottom>Academic year and program wise</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={academicyearProgram.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="programcode" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Records" />
                <Bar dataKey="students" fill="#22c55e" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 340 }}>
            <Typography fontWeight={800} gutterBottom>Institution wise</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={institutionWise.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="institution" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Records" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: GridToolbar }}
          sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start" } }}
        />
      </Paper>
    </MenuPageShell>
  );
}
