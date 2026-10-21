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
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SyncIcon from "@mui/icons-material/Sync";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const pageConfig = {
  students: {
    title: "Student program change",
    source: "students",
    note: "Select one or more students, then change program and program code only for the selected student rows.",
    columns: ["academicyear", "regulation", "program", "programcode", "semester", "section", "name", "email", "regno"]
  },
  coursemap: {
    title: "Regulation course map program change",
    source: "coursemap",
    note: "Select one or more course map rows, then change program and program code only for the selected courses.",
    columns: ["academicyear", "regulation", "program", "programcode", "semester", "subject", "type", "course", "coursecode", "coursetype", "deliverytype", "status"]
  },
  ledger: {
    title: "Student ledger program change",
    source: "ledger",
    note: "Select one or more ledger rows, then change program and program code only for the selected ledger items.",
    columns: ["academicyear", "regulation", "program", "programcode", "semester", "student", "user", "regno", "feegroup", "feecategory", "feeitem", "amount", "paid", "balance", "status"]
  }
};

const blankProgram = { oldprogram: "", oldprogramcode: "", newprogram: "", newprogramcode: "" };

function DynamicFilters({ fields, options, filters, setFilters }) {
  const addFilter = () => setFilters((prev) => [...prev, { field: fields[0] || "", value: [] }]);
  const updateFilter = (index, patch) => setFilters((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const removeFilter = (index) => setFilters((prev) => prev.filter((_, i) => i !== index));
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={900}>Dynamic filters</Typography>
        <Button startIcon={<AddIcon />} onClick={addFilter} variant="outlined" size="small">Add filter</Button>
      </Stack>
      {filters.map((filter, index) => (
        <Grid container spacing={1} alignItems="center" key={`${filter.field}-${index}`}>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => updateFilter(index, { field: e.target.value, value: [] })}>
              {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Autocomplete
              multiple
              freeSolo
              options={options[filter.field] || []}
              value={Array.isArray(filter.value) ? filter.value : []}
              onChange={(_, value) => updateFilter(index, { value })}
              renderTags={(value, getTagProps) => value.map((option, tagIndex) => <Chip label={option} {...getTagProps({ index: tagIndex })} />)}
              renderInput={(params) => <TextField {...params} size="small" label="Values" placeholder="Search or type" />}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button color="error" onClick={() => removeFilter(index)}><DeleteIcon /></Button>
          </Grid>
        </Grid>
      ))}
      {!filters.length && <Alert severity="info">Add filters, then click Load. Nothing is loaded by default.</Alert>}
    </Stack>
  );
}

function SelectedProgramChangePage({ mode }) {
  const cfg = pageConfig[mode];
  const [fields, setFields] = useState([]);
  const [options, setOptions] = useState({});
  const [programs, setPrograms] = useState([]);
  const [filters, setFilters] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(blankProgram);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const oldProgramValue = useMemo(() => programs.find((row) => row.program === form.oldprogram && row.programcode === form.oldprogramcode) || null, [programs, form.oldprogram, form.oldprogramcode]);
  const newProgramValue = useMemo(() => programs.find((row) => row.program === form.newprogram && row.programcode === form.newprogramcode) || null, [programs, form.newprogram, form.newprogramcode]);

  const loadOptions = async () => {
    try {
      setError("");
      const res = await ep1.get("/api/v2/repair-maintenance/selected-program-change/options", { params: { colid: global1.colid, source: cfg.source } });
      setFields(res.data?.fields || []);
      setOptions(res.data?.options || {});
      setPrograms(res.data?.programs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load filter options");
    }
  };

  useEffect(() => { loadOptions(); }, [mode]);

  const loadRows = async () => {
    try {
      setLoading(true);
      setProgress(20);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/repair-maintenance/selected-program-change/list", { colid: global1.colid, source: cfg.source, filters });
      setRows(res.data?.data || []);
      setSelectedIds([]);
      setMessage(`Loaded ${res.data?.count || 0} row(s).`);
      setProgress(100);
    } catch (err) {
      setProgress(100);
      setError(err.response?.data?.message || "Unable to load rows");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const applyChange = async () => {
    if (!selectedIds.length) return setError("Select at least one row from the grid.");
    if (!form.oldprogram || !form.oldprogramcode || !form.newprogram || !form.newprogramcode) return setError("Old program, old program code, new program and new program code are required.");
    if (!window.confirm(`Change ${selectedIds.length} selected row(s) from ${form.oldprogram} (${form.oldprogramcode}) to ${form.newprogram} (${form.newprogramcode})?`)) return;
    try {
      setLoading(true);
      setProgress(10);
      setError("");
      setMessage("");
      const timer = setInterval(() => setProgress((prev) => (prev >= 90 ? prev : prev + 15)), 250);
      const res = await ep1.post("/api/v2/repair-maintenance/selected-program-change/apply", { colid: global1.colid, source: cfg.source, ids: selectedIds, ...form });
      clearInterval(timer);
      setProgress(100);
      setMessage(`Updated ${res.data?.modified || 0} of ${res.data?.matched || 0} matched selected row(s).`);
      await loadRows();
    } catch (err) {
      setProgress(100);
      setError(err.response?.data?.message || "Unable to apply change");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 900);
    }
  };

  const updateProgram = (prefix, value) => {
    if (value && typeof value === "object") setForm((prev) => ({ ...prev, [`${prefix}program`]: value.program || "", [`${prefix}programcode`]: value.programcode || "" }));
  };

  const columns = cfg.columns.map((field) => ({ field, headerName: field, minWidth: field.length > 10 ? 170 : 130, flex: ["name", "student", "course", "feeitem", "email", "user"].includes(field) ? 1 : undefined }));

  return (
    <MenuPageShell title={cfg.title}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>{cfg.title}</Typography>
            <Typography color="text.secondary">{cfg.note}</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {progress > 0 && <LinearProgress variant="determinate" value={progress} />}

          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <CardContent>
              <DynamicFilters fields={fields} options={options} filters={filters} setFilters={setFilters} />
              <Stack direction="row" spacing={1.2} sx={{ mt: 2 }}>
                <Button variant="contained" disabled={loading} onClick={loadRows}>Load</Button>
                <Button variant="outlined" disabled={loading} onClick={loadOptions}>Reload options</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete options={programs} value={oldProgramValue} getOptionLabel={(option) => `${option.program || ""} (${option.programcode || ""})`} onChange={(_, value) => updateProgram("old", value)} renderInput={(params) => <TextField {...params} label="Search old program" size="small" />} />
                </Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Old program" value={form.oldprogram} onChange={(e) => setForm((p) => ({ ...p, oldprogram: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Old program code" value={form.oldprogramcode} onChange={(e) => setForm((p) => ({ ...p, oldprogramcode: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete options={programs} value={newProgramValue} getOptionLabel={(option) => `${option.program || ""} (${option.programcode || ""})`} onChange={(_, value) => updateProgram("new", value)} renderInput={(params) => <TextField {...params} label="Search new program" size="small" />} />
                </Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="New program" value={form.newprogram} onChange={(e) => setForm((p) => ({ ...p, newprogram: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="New program code" value={form.newprogramcode} onChange={(e) => setForm((p) => ({ ...p, newprogramcode: e.target.value }))} /></Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="warning" startIcon={<SyncIcon />} disabled={loading || !selectedIds.length} onClick={applyChange}>Apply to selected ({selectedIds.length})</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ height: 560, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  checkboxSelection
                  disableRowSelectionOnClick
                  rowSelectionModel={selectedIds}
                  onRowSelectionModelChange={(model) => setSelectedIds(Array.isArray(model) ? model : Array.from(model?.ids || []))}
                  components={{ Toolbar: GridToolbar }}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                />
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export const StudentProgramSelectedChangePage = () => <SelectedProgramChangePage mode="students" />;
export const CourseMapProgramSelectedChangePage = () => <SelectedProgramChangePage mode="coursemap" />;
export const LedgerProgramSelectedChangePage = () => <SelectedProgramChangePage mode="ledger" />;
