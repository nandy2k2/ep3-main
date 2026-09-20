import React, { useEffect, useMemo, useState } from "react";
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
import { Delete, Refresh, Save, UploadFile } from "@mui/icons-material";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const clean = (value) => String(value || "").trim();
const rowsOf = (rows) => (rows || []).map((row, index) => ({ ...row, id: row._id || row.facultyemail || `${row.programcode || ""}-${row.designation || row.designations?.join("-")}-${index}` }));
const unique = (rows, field) => [...new Set((rows || []).map((row) => row?.[field]).filter(Boolean))].sort();

const designationBlank = { designation: "", description: "", status: "Active" };
const workloadBlank = { program: "", programcode: "", designations: [], designation: "", workloadhours: "", status: "Active" };

function readWorkbook(file, onRows, setError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      onRows(XLSX.utils.sheet_to_json(ws, { defval: "" }).map((row, index) => ({ ...row, rowNumber: index + 2 })));
    } catch (err) {
      setError(err.message || "Unable to read Excel file");
    }
  };
  reader.readAsArrayBuffer(file);
}

export function AcademicDesignationPage({ embedded = false, onRowsChange }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(designationBlank);
  const [filters, setFilters] = useState({ designation: "", status: "" });
  const [editingId, setEditingId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploadRows, setUploadRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = { colid: global1.colid, ...filters };
      Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });
      const res = await ep1.get("/api/v2/academic-designations", { params });
      const data = res.data?.data || [];
      setRows(data);
      if (onRowsChange) onRowsChange(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load designations");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/academic-designations", { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name });
      setMessage("Designation saved.");
      setForm(designationBlank);
      setEditingId("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save designation");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (ids = selectedIds) => {
    if (!ids.length || !window.confirm("Delete selected designation(s)?")) return;
    await ep1.post("/api/v2/academic-designations/delete", { colid: global1.colid, ids });
    setSelectedIds([]);
    setMessage("Designation(s) deleted.");
    await load();
  };

  const upload = async () => {
    if (!uploadRows.length) return setError("Select Excel first.");
    const res = await ep1.post("/api/v2/academic-designations/bulkupload", { colid: global1.colid, user: global1.user, name: global1.name, items: uploadRows });
    setMessage(`Saved ${res.data?.saved || 0} designation(s).`);
    setUploadRows([]);
    await load();
  };

  const columns = [
    { field: "designation", headerName: "Designation", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 260, flex: 1 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "actions", headerName: "Actions", minWidth: 160, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => { setForm({ designation: row.designation || "", description: row.description || "", status: row.status || "Active" }); setEditingId(row._id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Button><Button size="small" color="error" onClick={() => remove([row._id])}>Delete</Button></Stack> }
  ];

  const content = (
      <Box sx={{ p: embedded ? 0 : 2, bgcolor: embedded ? "transparent" : "#f6f8fb", minHeight: embedded ? "auto" : "100vh" }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center"><Typography variant="h5" fontWeight={900} sx={{ flex: 1 }}>Designation Master</Typography><Button startIcon={<Refresh />} onClick={load}>Refresh</Button></Stack>
          {loading && <LinearProgress />}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}><Autocomplete freeSolo options={unique(rows, "designation")} value={form.designation} onInputChange={(_, value) => setForm((p) => ({ ...p, designation: value }))} renderInput={(params) => <TextField {...params} label="Designation" required />} /></Grid>
              <Grid item xs={12} md={5}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><Button fullWidth sx={{ height: 56 }} variant="contained" startIcon={<Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Dynamic Filters</Typography>
            <Grid container spacing={1.5}>
              {Object.keys(filters).map((field) => <Grid item xs={12} md={3} key={field}><Autocomplete freeSolo options={field === "status" ? ["Active", "Inactive"] : unique(rows, field)} value={filters[field]} onInputChange={(_, value) => setFilters((p) => ({ ...p, [field]: value }))} renderInput={(params) => <TextField {...params} label={field} />} /></Grid>)}
              <Grid item xs={12} md={2}><Button fullWidth sx={{ height: 56 }} variant="contained" onClick={load}>Load</Button></Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Button variant="outlined" onClick={() => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ designation: "Assistant Professor", description: "Teaching faculty", status: "Active" }]), "Designations"); XLSX.writeFile(wb, "designation_template.xlsx"); }}>Template</Button>
              <Button component="label" variant="outlined" startIcon={<UploadFile />}>Choose Excel<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) readWorkbook(file, setUploadRows, setError); }} /></Button>
              <Button variant="contained" disabled={!uploadRows.length} onClick={upload}>Upload</Button>
              <Button color="error" variant="outlined" startIcon={<Delete />} disabled={!selectedIds.length} onClick={() => remove()}>Bulk Delete</Button>
              {!!uploadRows.length && <Chip label={`${uploadRows.length} row(s) ready`} />}
            </Stack>
            <DataGrid rows={rowsOf(rows)} columns={columns} autoHeight checkboxSelection disableRowSelectionOnClick rowSelectionModel={selectedIds} onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "designation_master" } } }} />
          </Paper>
        </Stack>
      </Box>
  );

  if (embedded) return content;
  return <MenuPageShell title="Designation Master">{content}</MenuPageShell>;
}

export function DesignationWorkloadHoursPage() {
  const [options, setOptions] = useState({ programs: [], designations: [] });
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(workloadBlank);
  const [editingId, setEditingId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploadRows, setUploadRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/academic-designations/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/designation-workload-hours", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load workload hour rules");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadOptions(); load(); }, []);

  const selectProgram = (value) => setForm((p) => ({ ...p, program: value?.program || "", programcode: value?.programcode || "" }));
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/designation-workload-hours", { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name });
      setMessage("Designation workload rule saved.");
      setForm(workloadBlank);
      setEditingId("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save rule");
    } finally {
      setLoading(false);
    }
  };
  const remove = async (ids = selectedIds) => {
    if (!ids.length || !window.confirm("Delete selected rule(s)?")) return;
    await ep1.post("/api/v2/designation-workload-hours/delete", { colid: global1.colid, ids });
    setSelectedIds([]);
    await load();
  };
  const upload = async () => {
    const res = await ep1.post("/api/v2/designation-workload-hours/bulkupload", { colid: global1.colid, user: global1.user, name: global1.name, items: uploadRows });
    setMessage(`Inserted ${res.data?.inserted || 0} rule(s).`);
    setUploadRows([]);
    await load();
  };
  const columns = [
    { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "designation", headerName: "Designations", minWidth: 260, flex: 1 },
    { field: "workloadhours", headerName: "Weekly Workload Hours", minWidth: 180, type: "number" },
    { field: "status", headerName: "Status", minWidth: 110 },
    { field: "actions", headerName: "Actions", minWidth: 160, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => { setForm({ program: row.program || "", programcode: row.programcode || "", designations: row.designations || [], designation: row.designation || "", workloadhours: row.workloadhours || "", status: row.status || "Active" }); setEditingId(row._id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Button><Button size="small" color="error" onClick={() => remove([row._id])}>Delete</Button></Stack> }
  ];
  return (
    <MenuPageShell title="Designation Workload Hours">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center"><Typography variant="h5" fontWeight={900} sx={{ flex: 1 }}>Designation Workload Hours</Typography><Button startIcon={<Refresh />} onClick={() => { loadOptions(); load(); }}>Refresh</Button></Stack>
          {loading && <LinearProgress />}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}><Autocomplete options={options.programs || []} getOptionLabel={(row) => `${row.program || ""}${row.programcode ? ` (${row.programcode})` : ""}`} value={(options.programs || []).find((row) => row.programcode === form.programcode) || null} onChange={(_, value) => selectProgram(value)} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
              <Grid item xs={12} md={4}><Autocomplete multiple disableCloseOnSelect options={options.designations || []} value={form.designations || []} onChange={(_, value) => setForm((p) => ({ ...p, designations: value, designation: value.join(", ") }))} renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} sx={{ mr: 1 }} />{option}</li>} renderInput={(params) => <TextField {...params} label="Designation" />} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Workload Hours" value={form.workloadhours} onChange={(e) => setForm((p) => ({ ...p, workloadhours: e.target.value }))} /></Grid>
              <Grid item xs={12} md={1.5}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={1.5}><Button fullWidth sx={{ height: 56 }} variant="contained" startIcon={<Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Button variant="outlined" onClick={() => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ program: "BSc", programcode: "BSC", designation: "Assistant Professor", workloadhours: 18, status: "Active" }]), "Rules"); XLSX.writeFile(wb, "designation_workload_hours_template.xlsx"); }}>Template</Button>
              <Button component="label" variant="outlined" startIcon={<UploadFile />}>Choose Excel<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) readWorkbook(file, setUploadRows, setError); }} /></Button>
              <Button variant="contained" disabled={!uploadRows.length} onClick={upload}>Upload</Button>
              <Button color="error" variant="outlined" startIcon={<Delete />} disabled={!selectedIds.length} onClick={() => remove()}>Bulk Delete</Button>
              {!!uploadRows.length && <Chip label={`${uploadRows.length} row(s) ready`} />}
            </Stack>
            <DataGrid rows={rowsOf(rows)} columns={columns} autoHeight checkboxSelection disableRowSelectionOnClick rowSelectionModel={selectedIds} onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "designation_workload_hours" } } }} />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function WorkloadDoctorPage() {
  const [options, setOptions] = useState({ academicyears: [] });
  const [academicyear, setAcademicyear] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/workloadassignment/options", { params: { colid: global1.colid } })
      .then((res) => setOptions(res.data || {}))
      .catch((err) => setError(err.response?.data?.message || "Unable to load academic years"));
  }, []);

  const load = async () => {
    if (!academicyear) return setError("Select academic year.");
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/workloadassignment/doctor", { params: { colid: global1.colid, academicyear } });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to run workload doctor");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    ["Faculty", summary.faculty || 0, "#1d4ed8"],
    ["OK", summary.ok || 0, "#15803d"],
    ["Less", summary.less || 0, "#b45309"],
    ["More", summary.more || 0, "#b91c1c"],
    ["No Rule", summary.norule || 0, "#6b7280"]
  ];
  const columns = [
    { field: "facultyname", headerName: "Faculty", minWidth: 180 },
    { field: "facultyemail", headerName: "Email", minWidth: 230 },
    { field: "designation", headerName: "Designation", minWidth: 180 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "programcodes", headerName: "Program Codes", minWidth: 180 },
    { field: "courses", headerName: "Courses", minWidth: 100, type: "number" },
    { field: "assignedhours", headerName: "Assigned Weekly Hours", minWidth: 180, type: "number" },
    { field: "expectedhours", headerName: "Designation Weekly Hours", minWidth: 200, type: "number" },
    { field: "variance", headerName: "Difference", minWidth: 130, type: "number" },
    { field: "workloadstatus", headerName: "Status", minWidth: 130, renderCell: ({ value }) => <Chip size="small" label={value} color={value === "OK" ? "success" : value === "Less" ? "warning" : value === "More" ? "error" : "default"} /> }
  ];

  return (
    <MenuPageShell title="Workload Doctor">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Workload Doctor</Typography>
          {loading && <LinearProgress />}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} md={4}><Autocomplete options={options.academicyears || []} value={academicyear} onChange={(_, value) => setAcademicyear(value || "")} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
              <Grid item xs={12} md={2}><Button fullWidth sx={{ height: 56 }} variant="contained" onClick={load}>Load</Button></Grid>
            </Grid>
          </Paper>
          <Grid container spacing={2}>
            {cards.map(([label, value, color]) => (
              <Grid item xs={12} sm={6} md={2.4} key={label}>
                <Paper sx={{ p: 2, borderLeft: `6px solid ${color}` }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color }}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Assigned vs Designation Weekly Workload</Typography>
            <DataGrid rows={rowsOf(rows)} columns={columns} autoHeight getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "workload_doctor" } } }} sx={{ minWidth: 1500, "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start" } }} />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
