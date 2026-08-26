import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { Add, Cancel, Delete, Edit, FileDownload, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const text = (value) => String(value || "").trim();
const uniqueSorted = (values = []) => [...new Set(values.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const makeFilter = () => ({ id: `${Date.now()}-${Math.random()}`, field: "academicyear", value: "" });
const lectureTypes = ["Theory", "Practical", "Additional"];

const blankForm = {
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  course: "",
  coursecode: "",
  faculty: "",
  facultyemail: "",
  module: "",
  lectureno: "",
  lecturedate: "",
  lecturetype: "Theory",
  status: "Active",
  moduleallocationid: ""
};

const filterFields = [
  "academicyear",
  "regulation",
  "program",
  "programcode",
  "course",
  "coursecode",
  "faculty",
  "facultyemail",
  "module",
  "lecturetype",
  "status"
];

const labels = {
  academicyear: "Academic Year",
  regulation: "Regulation",
  program: "Program",
  programcode: "Program Code",
  course: "Course",
  coursecode: "Course Code",
  faculty: "Faculty",
  facultyemail: "Faculty Email",
  module: "Module",
  lectureno: "Lecture No",
  lecturedate: "Lecture Date",
  lecturetype: "Lecture Type",
  status: "Status"
};

const normalizeHeader = (value) => text(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const headerMap = {
  academicyear: "academicyear",
  regulation: "regulation",
  program: "program",
  programcode: "programcode",
  course: "course",
  coursecode: "coursecode",
  faculty: "faculty",
  facultyname: "faculty",
  facultyemail: "facultyemail",
  module: "module",
  lectureno: "lectureno",
  lectureno: "lectureno",
  lecturenumber: "lectureno",
  lecturedate: "lecturedate",
  lecturedatedate: "lecturedate",
  lecturetype: "lecturetype",
  status: "status"
};

function useInstitution() {
  const [institution, setInstitution] = useState(null);
  useEffect(() => {
    ep1.get("/vins", { params: { colid: global1.colid } }).then((res) => setInstitution(res.data || null)).catch(() => setInstitution(null));
  }, []);
  return institution;
}

function PrintHeader({ institution, title }) {
  return (
    <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", pb: 1.5, borderBottom: "2px solid #111827", mb: 2 }}>
      {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ width: 66, height: 66, objectFit: "contain" }} />}
      <Typography variant="h6" fontWeight={900}>{institution?.institutionname || institution?.insname || global1.insname || "Institution"}</Typography>
      <Typography variant="body2">{institution?.address || ""}</Typography>
      <Typography variant="subtitle1" fontWeight={900}>{title}</Typography>
    </Stack>
  );
}

function SummaryCard({ title, value, color = "#2563eb" }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderLeft: `5px solid ${color}` }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={950}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function ModulePlannerPage() {
  const institution = useInstitution();
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ allocations: [] });
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState([makeFilter()]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploadRows, setUploadRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/moduleplanner", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load module planner");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async (source = form) => {
    try {
      const params = { colid: global1.colid };
      ["academicyear", "regulation", "program", "programcode", "course", "coursecode", "facultyemail"].forEach((field) => {
        if (source[field]) params[field] = source[field];
      });
      const res = await ep1.get("/api/v2/moduleplanner/options", { params });
      setOptions(res.data || { allocations: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dropdown values");
    }
  };

  useEffect(() => { loadRows(); loadOptions(blankForm); }, []);

  const selectAllocation = (row) => {
    const modules = row?.modules?.length ? row.modules : [row?.module].filter(Boolean);
    const next = {
      ...blankForm,
      academicyear: row?.academicyear || "",
      regulation: row?.regulation || "",
      program: row?.program || "",
      programcode: row?.programcode || "",
      course: row?.course || "",
      coursecode: row?.coursecode || "",
      faculty: row?.facultyname || row?.faculty || "",
      facultyemail: row?.facultyemail || "",
      module: modules[0] || "",
      moduleallocationid: row?._id || "",
      lecturetype: "Theory",
      status: "Active"
    };
    setForm(next);
    loadOptions(next);
  };

  const resetForm = () => {
    setForm(blankForm);
    setEditingId("");
    loadOptions(blankForm);
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await ep1.post("/api/v2/moduleplanner", { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name });
      setMessage(editingId ? "Module planner updated" : "Module planner saved");
      resetForm();
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save module planner");
    } finally {
      setLoading(false);
    }
  };

  const editRow = (row) => {
    setEditingId(row._id);
    setForm({ ...blankForm, ...row, moduleallocationid: row.moduleallocationid || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async (ids) => {
    if (!ids.length) return setError("Select at least one row");
    if (!window.confirm(`Delete ${ids.length} module planner row(s)?`)) return;
    try {
      setLoading(true);
      const res = await ep1.post("/api/v2/moduleplanner/delete", { ids, colid: global1.colid });
      setMessage(`Deleted ${res.data?.deleted || ids.length} row(s)`);
      setSelectedIds([]);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete rows");
    } finally {
      setLoading(false);
    }
  };

  const valueOptions = (field) => uniqueSorted(rows.map((row) => row[field]).concat(options[field === "programcode" ? "programcodes" : `${field}s`] || []));
  const moduleOptions = useMemo(() => uniqueSorted((options.allocations || []).flatMap((row) => row.modules?.length ? row.modules : [row.module])), [options]);
  const filteredRows = useMemo(() => rows.filter((row) => filters.every((filter) => {
    if (!filter.field || !filter.value) return true;
    return text(row[filter.field]).toLowerCase() === text(filter.value).toLowerCase();
  })), [rows, filters]);

  const downloadTemplate = () => {
    const sample = options.allocations?.[0] || {};
    const ws = XLSX.utils.json_to_sheet([{
      "Academic Year": sample.academicyear || "2026-27",
      Regulation: sample.regulation || "",
      Program: sample.program || "",
      "Program Code": sample.programcode || "",
      Course: sample.course || "",
      "Course Code": sample.coursecode || "",
      Faculty: sample.facultyname || "",
      "Faculty Email": sample.facultyemail || "",
      Module: sample.module || sample.modules?.[0] || "Module 1",
      "Lecture No": "1",
      "Lecture Date": "2026-07-01",
      "Lecture Type": "Theory",
      Status: "Active"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Module Planner");
    XLSX.writeFile(wb, "Module_Planner_Template.xlsx");
  };

  const readExcel = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(ws, { defval: "" }).map((row, index) => {
          const item = { rowNumber: index + 2 };
          Object.entries(row).forEach(([header, value]) => {
            const mapped = headerMap[normalizeHeader(header)];
            if (mapped) item[mapped] = value;
          });
          return item;
        });
        setUploadRows(parsed);
        setMessage(`${parsed.length} rows ready for upload`);
      } catch (err) {
        setError("Unable to read Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadExcelRows = async () => {
    if (!uploadRows.length) return setError("Choose an Excel file first");
    try {
      setLoading(true);
      const res = await ep1.post("/api/v2/moduleplanner/bulkupload", { colid: global1.colid, user: global1.user, name: global1.name, rows: uploadRows });
      const errors = res.data?.errors || [];
      setMessage(`Inserted ${res.data?.inserted || 0} row(s)${errors.length ? `, ${errors.length} error(s)` : ""}`);
      setError(errors.length ? errors.map((item) => `Row ${item.row}: ${item.message}`).join("; ") : "");
      setUploadRows([]);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit"><Button size="small" onClick={() => editRow(params.row)}><Edit fontSize="small" /></Button></Tooltip>
          <Tooltip title="Delete"><Button size="small" color="error" onClick={() => deleteRows([params.row._id])}><Delete fontSize="small" /></Button></Tooltip>
        </Stack>
      )
    },
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "regulation", headerName: "Regulation", width: 130 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "faculty", headerName: "Faculty", width: 180 },
    { field: "facultyemail", headerName: "Faculty Email", width: 220 },
    { field: "module", headerName: "Module", width: 220 },
    { field: "lectureno", headerName: "Lecture No", width: 120 },
    { field: "lecturedate", headerName: "Lecture Date", width: 130 },
    { field: "lecturetype", headerName: "Lecture Type", width: 140 },
    { field: "status", headerName: "Status", width: 110 }
  ];

  return (
    <MenuPageShell title="Module Planner">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`
          .module-planner-grid .MuiDataGrid-cell { white-space: normal !important; line-height: 1.35 !important; align-items: flex-start !important; padding-top: 8px !important; padding-bottom: 8px !important; }
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body * { visibility: hidden; }
            #module-planner-print, #module-planner-print * { visibility: visible; }
            #module-planner-print { position: absolute; left: 0; top: 0; width: 190mm; box-shadow: none !important; border: 0 !important; }
            .no-print { display: none !important; }
          }
        `}</style>
        <Stack spacing={2}>
          <Paper className="no-print" elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={950}>Module Planner</Typography>
            <Typography color="text.secondary">Datewise lecture allocation from module allocation.</Typography>
          </Paper>
          {message && <Alert className="no-print" severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper className="no-print" component="form" onSubmit={save} elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={7}>
                <Autocomplete
                  options={options.allocations || []}
                  value={(options.allocations || []).find((row) => row._id === form.moduleallocationid) || null}
                  onChange={(_, value) => selectAllocation(value)}
                  getOptionLabel={(row) => row ? `${row.academicyear} | ${row.programcode} | ${row.coursecode} - ${row.course} | ${row.facultyname || row.facultyemail}` : ""}
                  renderInput={(params) => <TextField {...params} required label="Select module allocation" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={moduleOptions}
                  value={form.module || null}
                  onChange={(_, value) => setForm((p) => ({ ...p, module: value || "" }))}
                  renderInput={(params) => <TextField {...params} required label="Module" />}
                />
              </Grid>
              <Grid item xs={12} md={2}><TextField required fullWidth label="Lecture No" value={form.lectureno} onChange={(e) => setForm((p) => ({ ...p, lectureno: e.target.value }))} /></Grid>
              {["academicyear", "regulation", "program", "programcode", "course", "coursecode", "faculty", "facultyemail"].map((field) => (
                <Grid item xs={12} md={field === "course" || field === "facultyemail" ? 3 : 2} key={field}>
                  <TextField fullWidth label={labels[field]} value={form[field]} InputProps={{ readOnly: true }} />
                </Grid>
              ))}
              <Grid item xs={12} md={2}><TextField required fullWidth type="date" label="Lecture Date" value={form.lecturedate} onChange={(e) => setForm((p) => ({ ...p, lecturedate: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Lecture Type" value={form.lecturetype} onChange={(e) => setForm((p) => ({ ...p, lecturetype: e.target.value }))}>
                  {lectureTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  {["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>{editingId ? "Update" : "Save"}</Button>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={resetForm}>Clear</Button>
                  <Button variant="outlined" startIcon={<Refresh />} onClick={() => { loadRows(); loadOptions(form); }}>Reload</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper className="no-print" elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${rows.length} records`} />
              <Chip color={selectedIds.length ? "primary" : "default"} label={`${selectedIds.length} selected`} />
              <Button variant="outlined" startIcon={<FileDownload />} onClick={downloadTemplate}>Template</Button>
              <Button variant="outlined" component="label" startIcon={<UploadFile />}>Choose Excel<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={readExcel} /></Button>
              <Button variant="contained" startIcon={<Add />} disabled={!uploadRows.length || loading} onClick={uploadExcelRows}>Upload {uploadRows.length ? `(${uploadRows.length})` : ""}</Button>
              <Button variant="outlined" color="error" startIcon={<Delete />} disabled={!selectedIds.length || loading} onClick={() => deleteRows(selectedIds)}>Bulk delete</Button>
              <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>Print preview</Button>
            </Stack>
          </Paper>

          <Paper className="no-print" elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography fontWeight={900}>Dynamic Filters</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setFilters((prev) => [...prev, makeFilter()])}>Add filter</Button>
            </Stack>
            <Grid container spacing={1.5}>
              {filters.map((filter) => (
                <React.Fragment key={filter.id}>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Field" value={filter.field} onChange={(e) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, field: e.target.value, value: "" } : item))}>
                      {filterFields.map((field) => <MenuItem key={field} value={field}>{labels[field]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={filter.field === "lecturetype" ? lectureTypes : valueOptions(filter.field)}
                      value={filter.value || null}
                      onChange={(_, value) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, value: value || "" } : item))}
                      renderInput={(params) => <TextField {...params} label="Value" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" startIcon={<Delete />} sx={{ height: 56 }} onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter()] : prev.filter((item) => item.id !== filter.id))}>Remove</Button></Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Paper>

          <Paper className="no-print module-planner-grid" elevation={0} sx={{ p: 1, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <DataGrid
              rows={filteredRows.map((row) => ({ ...row, id: row._id }))}
              columns={columns}
              loading={loading}
              checkboxSelection
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(model) => setSelectedIds(Array.from(model))}
              disableRowSelectionOnClick
              getRowHeight={() => "auto"}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "module_planner" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              sx={{ minWidth: 1900 }}
            />
          </Paper>

          <Paper id="module-planner-print" sx={{ maxWidth: "210mm", mx: "auto", p: 3, bgcolor: "#fff", color: "#111827", border: "1px solid #d1d5db" }}>
            <PrintHeader institution={institution} title="Module Planner" />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr>{["Academic Year", "Program", "Course", "Faculty", "Module", "Lecture No", "Date", "Type"].map((head) => <th key={head} style={{ border: "1px solid #111", padding: 5, background: "#f3f4f6", textAlign: "left" }}>{head}</th>)}</tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row._id}>
                    {[row.academicyear, `${row.program || ""} ${row.programcode || ""}`, `${row.course || ""} ${row.coursecode || ""}`, `${row.faculty || ""} ${row.facultyemail || ""}`, row.module, row.lectureno, row.lecturedate, row.lecturetype].map((value, index) => (
                      <td key={`${row._id}-${index}`} style={{ border: "1px solid #111", padding: 5, verticalAlign: "top" }}>{value || "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function LectureProgressReportPage() {
  const institution = useInstitution();
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState([makeFilter()]);
  const [fromdate, setFromdate] = useState("");
  const [todate, setTodate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/moduleplanner/options", { params: { colid: global1.colid } });
      setOptions(res.data || {});
    } catch (err) {
      setOptions({});
    }
  };

  useEffect(() => { loadOptions(); }, []);

  const valueOptions = (field) => {
    const optionMap = {
      academicyear: options.academicyears,
      regulation: options.regulations,
      program: options.programs,
      programcode: options.programcodes,
      course: options.courses,
      coursecode: options.coursecodes,
      faculty: options.faculty,
      facultyemail: options.facultyemails
    };
    return uniqueSorted([...(optionMap[field] || []), ...rows.map((row) => row[field])]);
  };
  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid, fromdate, todate };
      filters.forEach((filter) => { if (filter.field && filter.value) params[filter.field] = filter.value; });
      const res = await ep1.get("/api/v2/moduleplanner/lecture-progress", { params });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load lecture progress report");
    } finally {
      setLoading(false);
    }
  };

  const chartData = rows.map((row) => ({
    name: row.coursecode || row.course || "-",
    Allotted: row.theoryallotted + row.practicalallotted + row.additionalallotted,
    Taken: row.theorytaken + row.practicaltaken + row.additionaltaken
  }));
  const columns = [
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "faculty", headerName: "Faculty", width: 180 },
    { field: "facultyemail", headerName: "Faculty Email", width: 220 },
    { field: "theoryallotted", headerName: "Theory Allotted", width: 150 },
    { field: "theorytaken", headerName: "Theory Taken", width: 140 },
    { field: "practicalallotted", headerName: "Practical Allotted", width: 170 },
    { field: "practicaltaken", headerName: "Practical Taken", width: 150 },
    { field: "additionalallotted", headerName: "Additional Allotted", width: 180 },
    { field: "additionaltaken", headerName: "Additional Taken", width: 160 }
  ];

  return (
    <MenuPageShell title="Lecture Progress Report">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`
          .lecture-progress-grid .MuiDataGrid-cell { white-space: normal !important; line-height: 1.35 !important; align-items: flex-start !important; padding-top: 8px !important; padding-bottom: 8px !important; }
          @media print {
            @page { size: A4 landscape; margin: 9mm; }
            body * { visibility: hidden; }
            #lecture-progress-print, #lecture-progress-print * { visibility: visible; }
            #lecture-progress-print { position: absolute; left: 0; top: 0; width: 280mm; box-shadow: none !important; border: 0 !important; }
            .no-print { display: none !important; }
          }
        `}</style>
        <Stack spacing={2}>
          <Paper className="no-print" elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="h4" fontWeight={950}>Lecture Progress Report</Typography>
                <Typography color="text.secondary">Compare module planner allocation with timetable lectures taken.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<Refresh />} onClick={loadReport} disabled={loading}>Load</Button>
                <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={!rows.length}>Print</Button>
              </Stack>
            </Stack>
          </Paper>
          {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
          <Paper className="no-print" elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}><TextField fullWidth type="date" label="From Date" value={fromdate} onChange={(e) => setFromdate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="date" label="To Date" value={todate} onChange={(e) => setTodate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={6}><Button variant="contained" startIcon={<Add />} onClick={() => setFilters((prev) => [...prev, makeFilter()])} sx={{ height: 56 }}>Add Dynamic Filter</Button></Grid>
              {filters.map((filter) => (
                <React.Fragment key={filter.id}>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Field" value={filter.field} onChange={(e) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, field: e.target.value, value: "" } : item))}>
                      {filterFields.filter((field) => !["module", "lecturetype", "status"].includes(field)).map((field) => <MenuItem key={field} value={field}>{labels[field]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={valueOptions(filter.field)}
                      value={filter.value || null}
                      freeSolo
                      onChange={(_, value) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, value: value || "" } : item))}
                      onInputChange={(_, value) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, value: value || "" } : item))}
                      renderInput={(params) => <TextField {...params} label="Value" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" startIcon={<Delete />} sx={{ height: 56 }} onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter()] : prev.filter((item) => item.id !== filter.id))}>Remove</Button></Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Paper>
          <Grid className="no-print" container spacing={2}>
            <Grid item xs={12} md={3}><SummaryCard title="Courses" value={summary.courses || 0} /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Faculty" value={summary.faculty || 0} color="#16a34a" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Allotted" value={summary.totalAllotted || 0} color="#f97316" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Taken" value={summary.totalTaken || 0} color="#7c3aed" /></Grid>
          </Grid>
          <Paper className="no-print" elevation={0} sx={{ p: 2, height: 340, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="Allotted" fill="#2563eb" />
                <Bar dataKey="Taken" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          <Paper className="no-print lecture-progress-grid" elevation={0} sx={{ p: 1, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <DataGrid rows={rows.map((row, index) => ({ ...row, id: `${row.coursecode}-${row.facultyemail}-${index}` }))} columns={columns} loading={loading} autoHeight getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "lecture_progress_report" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ minWidth: 1700 }} />
          </Paper>
          <Paper id="lecture-progress-print" sx={{ maxWidth: "297mm", mx: "auto", p: 3, bgcolor: "#fff", color: "#111827", border: "1px solid #d1d5db" }}>
            <PrintHeader institution={institution} title="Lecture Progress Report" />
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={3}><Chip label={`Courses: ${summary.courses || 0}`} sx={{ width: "100%" }} /></Grid>
              <Grid item xs={3}><Chip label={`Faculty: ${summary.faculty || 0}`} sx={{ width: "100%" }} /></Grid>
              <Grid item xs={3}><Chip label={`Allotted: ${summary.totalAllotted || 0}`} sx={{ width: "100%" }} /></Grid>
              <Grid item xs={3}><Chip label={`Taken: ${summary.totalTaken || 0}`} sx={{ width: "100%" }} /></Grid>
            </Grid>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr>{columns.map((column) => <th key={column.field} style={{ border: "1px solid #111", padding: 5, background: "#f3f4f6", textAlign: "left" }}>{column.headerName}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.coursecode}-${row.facultyemail}-${index}`}>
                    {columns.map((column) => <td key={column.field} style={{ border: "1px solid #111", padding: 5 }}>{row[column.field] || 0}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
