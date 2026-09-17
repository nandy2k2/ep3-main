import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { Add, Delete, Download, Edit, PlayArrow, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankForm = {
  id: "",
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  feeitems: [],
  latefineperday: "",
  maxamount: "",
  status: "Active",
  comments: ""
};

const labels = {
  academicyear: "Academic Year",
  regulation: "Regulation",
  program: "Program",
  programcode: "Program Code",
  feeitem: "Fee Item",
  latefineperday: "Late Fine Per Day",
  maxamount: "Max Amount",
  fineapplicabletillnow: "Fine Applicable Till Now",
  affectedledgercount: "Ledger Rows",
  status: "Status",
  comments: "Comments",
  lastappliedat: "Last Applied At",
  lastappliedcount: "Last Applied Count",
  lastappliedamount: "Last Applied Amount"
};

const filterFields = ["academicyear", "regulation", "program", "programcode", "feeitem", "status"];
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const displayDate = (value) => value ? new Date(value).toLocaleString() : "";
const selectionToArray = (model) => Array.isArray(model) ? model : Array.from(model?.ids || []);

function optionLabel(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.label || value.program || value.programcode || "";
}

function SearchSelect({ label, value, options = [], onChange, multiple = false, disabled = false }) {
  return (
    <Autocomplete
      freeSolo
      multiple={multiple}
      disableCloseOnSelect={multiple}
      options={options}
      value={multiple ? value : (value || null)}
      disabled={disabled}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(option, selected) => optionLabel(option) === optionLabel(selected)}
      onChange={(_, next) => onChange(next)}
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

export default function LateFinePage() {
  const colid = useMemo(() => global1.colid, []);
  const [form, setForm] = useState(blankForm);
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ academicyears: [], regulations: [], programs: [], feeitems: [] });
  const [filters, setFilters] = useState([{ id: "f1", field: "academicyear", value: "" }]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ active: false, value: 0, text: "" });

  const totals = useMemo(() => rows.reduce((sum, row) => ({
    rules: sum.rules + 1,
    ledgers: sum.ledgers + Number(row.affectedledgercount || 0),
    currentFine: sum.currentFine + Number(row.fineapplicabletillnow || 0)
  }), { rules: 0, ledgers: 0, currentFine: 0 }), [rows]);

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/latefine/options", { params: { colid } });
    setOptions(res.data.options || {});
  };

  const cleanFilters = () => filters.filter((item) => item.field && String(item.value || "").trim());

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/latefine/list", { colid, filters: cleanFilters() });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load late fine rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions().catch((err) => setError(err.response?.data?.message || "Unable to load options"));
    loadRows();
  }, []);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleProgramChange = (value) => {
    if (typeof value === "string") {
      setForm((prev) => ({ ...prev, program: value }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      program: value?.program || "",
      programcode: value?.programcode || prev.programcode || "",
      regulation: value?.regulation || prev.regulation || "",
      academicyear: value?.academicyear || prev.academicyear || ""
    }));
  };

  const reset = () => setForm(blankForm);

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        feeitem: form.feeitems[0] || "",
        feeitems: form.id ? undefined : form.feeitems,
        colid,
        user: global1.user,
        name: global1.name || global1.user
      };
      await ep1.post("/api/v2/latefine/save", payload);
      setMessage(form.id ? "Late fine rule updated." : "Late fine rule saved.");
      reset();
      await loadRows();
      await loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save late fine rule");
    } finally {
      setBusy(false);
    }
  };

  const editRow = (row) => {
    setForm({
      id: row._id,
      academicyear: row.academicyear || "",
      regulation: row.regulation || "",
      program: row.program || "",
      programcode: row.programcode || "",
      feeitems: row.feeitem ? [row.feeitem] : [],
      latefineperday: row.latefineperday ?? "",
      maxamount: row.maxamount ?? "",
      status: row.status || "Active",
      comments: row.comments || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async (ids) => {
    if (!ids.length) return setError("Select at least one row to delete.");
    if (!window.confirm(`Delete ${ids.length} late fine rule(s)?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/latefine/delete", { colid, ids });
      setMessage(`Deleted ${res.data.deleted || ids.length} late fine rule(s).`);
      setSelectedRows([]);
      await loadRows();
      await loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected rules");
    } finally {
      setBusy(false);
    }
  };

  const applySelected = async () => {
    if (!selectedRows.length) return setError("Select one or more late fine rules first.");
    setBusy(true);
    setError("");
    setMessage("");
    setProgress({ active: true, value: 0, text: "Starting late fine update..." });
    let matched = 0;
    let modified = 0;
    let balanceDelta = 0;
    try {
      for (let index = 0; index < selectedRows.length; index += 1) {
        const id = selectedRows[index];
        const row = rows.find((item) => item._id === id || item.id === id);
        setProgress({
          active: true,
          value: Math.round((index / selectedRows.length) * 100),
          text: `Applying ${row?.feeitem || "late fine rule"} (${index + 1}/${selectedRows.length})`
        });
        const res = await ep1.post("/api/v2/latefine/apply", { colid, ids: [id] });
        matched += Number(res.data.matched || 0);
        modified += Number(res.data.modified || 0);
        balanceDelta += Number(res.data.balanceDelta || 0);
      }
      setProgress({ active: true, value: 100, text: "Late fine update completed." });
      setMessage(`Applied late fine rules. Ledger rows matched: ${matched}, updated: ${modified}, balance changed by Rs. ${money(balanceDelta)}.`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to apply late fine");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress({ active: false, value: 0, text: "" }), 1500);
    }
  };

  const addFilter = () => setFilters((prev) => [...prev, { id: `${Date.now()}`, field: "feeitem", value: "" }]);
  const updateFilter = (id, patch) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, ...patch, ...(patch.field ? { value: "" } : {}) } : item));
  const removeFilter = (id) => setFilters((prev) => prev.length > 1 ? prev.filter((item) => item.id !== id) : [{ id: "f1", field: "academicyear", value: "" }]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      academicyear: "2026-27",
      regulation: "R2026",
      program: "B.Com",
      programcode: "BCOM",
      feeitem: "Semester Fee",
      latefineperday: 10,
      maxamount: 500,
      status: "Active",
      comments: "Late fine after due date"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Late Fine");
    XLSX.writeFile(wb, "Late_Fine_Template.xlsx");
  };

  const readExcel = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const res = await ep1.post("/api/v2/latefine/bulk", { colid, user: global1.user, name: global1.name, rows: jsonRows });
        setMessage(`Bulk upload completed. Saved: ${res.data.inserted || 0}`);
        if (res.data.errors?.length) setError(res.data.errors.map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
        await loadRows();
        await loadOptions();
      } catch (err) {
        setError(err.response?.data?.message || "Unable to upload late fine Excel");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 105,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <Tooltip title="Edit"><IconButton size="small" onClick={() => editRow(row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteRows([row._id])}><Delete fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    },
    "academicyear", "regulation", "program", "programcode", "feeitem", "latefineperday", "maxamount",
    "fineapplicabletillnow", "affectedledgercount", "status", "lastappliedat", "lastappliedcount", "lastappliedamount", "comments"
  ].map((field) => typeof field === "string" ? ({
    field,
    headerName: labels[field] || field,
    minWidth: ["program", "feeitem", "comments"].includes(field) ? 190 : 135,
    flex: ["program", "feeitem", "comments"].includes(field) ? 1 : undefined,
    type: ["latefineperday", "maxamount", "fineapplicabletillnow", "affectedledgercount", "lastappliedcount", "lastappliedamount"].includes(field) ? "number" : undefined,
    valueFormatter: (params) => field === "lastappliedat" ? displayDate(params.value) : params.value
  }) : field);

  return (
    <MenuPageShell title="Late fine">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f9ff", minHeight: "100vh" }}>
        <style>{`
          .late-fine-grid .MuiDataGrid-cell { white-space: normal !important; align-items: flex-start; line-height: 1.35 !important; padding-top: 8px !important; padding-bottom: 8px !important; }
          @media print {
            body * { visibility: hidden; }
            #late-fine-print, #late-fine-print * { visibility: visible; }
            #late-fine-print { position: absolute; left: 0; top: 0; width: 100%; background: #fff; padding: 16px; }
            .screen-only { display: none !important; }
            .MuiDataGrid-toolbarContainer, .MuiDataGrid-footerContainer { display: none !important; }
          }
        `}</style>

        <Paper className="screen-only" elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #dbeafe" }}>
          <Breadcrumbs sx={{ mb: 0.75 }}>
            <Link underline="hover" color="inherit" href="/dashdashfacnew">Dashboard</Link>
            <Typography color="text.primary">Fees</Typography>
            <Typography color="text.primary">Late fine</Typography>
          </Breadcrumbs>
          <Typography variant="h5" fontWeight={900}>Late fine</Typography>
          <Typography color="text.secondary">Configure per-day late fee rules and apply them to matching student ledger rows.</Typography>
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {(loading || busy) && !progress.active && <LinearProgress sx={{ mb: 2 }} />}
        {progress.active && (
          <Paper className="screen-only" sx={{ p: 2, mb: 2, border: "1px solid #bfdbfe" }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between"><Typography fontWeight={800}>{progress.text}</Typography><Typography>{progress.value}%</Typography></Stack>
              <LinearProgress variant="determinate" value={progress.value} />
            </Stack>
          </Paper>
        )}

        <Paper className="screen-only" sx={{ p: 2, mb: 2, border: "1px solid #dbeafe" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>{form.id ? "Edit late fine rule" : "Add late fine rule"}</Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={2.4}><SearchSelect label="Academic Year" value={form.academicyear} options={options.academicyears || []} onChange={(value) => setField("academicyear", optionLabel(value))} /></Grid>
            <Grid item xs={12} md={2.4}><SearchSelect label="Regulation" value={form.regulation} options={options.regulations || []} onChange={(value) => setField("regulation", optionLabel(value))} /></Grid>
            <Grid item xs={12} md={3}><SearchSelect label="Program" value={form.program} options={options.programs || []} onChange={handleProgramChange} /></Grid>
            <Grid item xs={12} md={2}><SearchSelect label="Program Code" value={form.programcode} options={options.programcodes || []} onChange={(value) => setField("programcode", optionLabel(value))} /></Grid>
            <Grid item xs={12} md={2.2}><SearchSelect label="Status" value={form.status} options={["Active", "Inactive"]} onChange={(value) => setField("status", optionLabel(value) || "Active")} /></Grid>
            <Grid item xs={12} md={5}><SearchSelect label="Fee Items" value={form.feeitems} options={options.feeitems || []} multiple disabled={!!form.id} onChange={(value) => setField("feeitems", value.map(optionLabel).filter(Boolean))} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Late fine per day" value={form.latefineperday} onChange={(e) => setField("latefineperday", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Max amount" value={form.maxamount} onChange={(e) => setField("maxamount", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Comments" value={form.comments} onChange={(e) => setField("comments", e.target.value)} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<Save />} disabled={busy || !form.academicyear || !form.programcode || !form.feeitems.length} onClick={save}>{busy ? "Working..." : form.id ? "Update" : "Save"}</Button>
                <Button variant="outlined" onClick={reset}>Clear</Button>
                <Button variant="outlined" startIcon={<Download />} onClick={downloadTemplate}>Template</Button>
                <Button variant="outlined" component="label" startIcon={<UploadFile />} disabled={busy}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls" onChange={readExcel} /></Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper className="screen-only" sx={{ p: 2, mb: 2, border: "1px solid #dbeafe" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
            <Typography variant="h6" fontWeight={900}>Dynamic filters</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" startIcon={<Add />} variant="outlined" onClick={addFilter}>Add Filter</Button>
              <Button size="small" startIcon={<Refresh />} variant="contained" disabled={loading} onClick={loadRows}>Load</Button>
              <Button size="small" variant="outlined" onClick={() => setFilters([{ id: "f1", field: "academicyear", value: "" }])}>Clear</Button>
              <Button size="small" startIcon={<PlayArrow />} color="success" variant="contained" disabled={busy || !selectedRows.length} onClick={applySelected}>Apply selected</Button>
              <Button size="small" startIcon={<Delete />} color="error" variant="outlined" disabled={busy || !selectedRows.length} onClick={() => deleteRows(selectedRows)}>Bulk Delete</Button>
              <Button size="small" startIcon={<Print />} variant="outlined" onClick={() => window.print()}>Print</Button>
            </Stack>
          </Stack>
          <Grid container spacing={1.5}>
            {filters.map((filter) => (
              <React.Fragment key={filter.id}>
                <Grid item xs={12} md={4}><SearchSelect label="Field" value={filter.field} options={filterFields} onChange={(value) => updateFilter(filter.id, { field: optionLabel(value) })} /></Grid>
                <Grid item xs={12} md={7}><SearchSelect label={labels[filter.field] || filter.field} value={filter.value} options={filter.field === "program" ? (options.programs || []) : filter.field === "programcode" ? (options.programcodes || []) : filter.field === "feeitem" ? (options.feeitems || []) : filter.field === "regulation" ? (options.regulations || []) : filter.field === "academicyear" ? (options.academicyears || []) : ["Active", "Inactive"]} onChange={(value) => updateFilter(filter.id, { value: optionLabel(value) })} /></Grid>
                <Grid item xs={12} md={1}><IconButton color="error" onClick={() => removeFilter(filter.id)}><Delete /></IconButton></Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Paper>

        <Box id="late-fine-print">
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}><Paper sx={{ p: 1.5, border: "1px solid #dbeafe" }}><Typography color="text.secondary">Rules</Typography><Typography variant="h6" fontWeight={900}>{totals.rules}</Typography></Paper></Grid>
            <Grid item xs={12} md={4}><Paper sx={{ p: 1.5, border: "1px solid #dbeafe" }}><Typography color="text.secondary">Matching Ledger Rows</Typography><Typography variant="h6" fontWeight={900}>{totals.ledgers}</Typography></Paper></Grid>
            <Grid item xs={12} md={4}><Paper sx={{ p: 1.5, border: "1px solid #dbeafe" }}><Typography color="text.secondary">Current Fine Sum</Typography><Typography variant="h6" fontWeight={900}>Rs. {money(totals.currentFine)}</Typography></Paper></Grid>
          </Grid>
          <Paper sx={{ p: 2, border: "1px solid #dbeafe" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={900}>Late fine rules</Typography>
              <Chip label={`${selectedRows.length} selected`} color={selectedRows.length ? "primary" : "default"} />
            </Stack>
            <Box sx={{ height: "100vh", minHeight: 650 }}>
              <DataGrid
                className="late-fine-grid"
                rows={rows}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                loading={loading}
                getRowHeight={() => "auto"}
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(model) => setSelectedRows(selectionToArray(model))}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "late_fine" } } }}
                pageSizeOptions={[25, 50, 100]}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </MenuPageShell>
  );
}
