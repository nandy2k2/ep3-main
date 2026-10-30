import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Box, Button, Grid, IconButton, LinearProgress, Paper, Snackbar, Alert, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete, Download, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";
import { addOption, handleAddOption } from "./addableAutocompleteHelpers";
const studentRoot = "/api/v2/student-bulk-fields", biometricRoot = '/api/v2/biometric-id-mapping';
const names = { regno: "Bulk regno update", rollno: "Bulk rollno update", photo: "Bulk photo update", biometricid: 'Biometric id mapping' };
const fieldLabels = { academicyear: "Academic year", regulation: "Regulation", program: "Program", programcode: "Program code", section: "Section", semester: "Semester", name: "Student", regno: "Regno", rollno: "Rollno", email: "Email", biometricid: 'Biometric ID', role: 'Role', institution: 'Institution', department: 'Department', designation: 'Designation' };
const slots = { toolbar: GridToolbar }, rowId = row => row._id;
const ResultsGrid = React.memo(DataGrid);
function BiometricFilterValues({ field, value, onChange, disabled }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false), [search, setSearch] = useState(''), [options, setOptions] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController(); setLoading(true); setError('');
    const timer = setTimeout(() => {
      ep1.get(`${biometricRoot}/options`, { params: { colid: global1.colid, field, search }, signal: controller.signal }).then(res => setOptions(res.data.data || [])).catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.message || err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, field, search]);
  return <Autocomplete multiple freeSolo disabled={disabled} open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} loading={loading} options={[addOption('+ Add User', '/mbuser'), ...options]} value={value} getOptionLabel={option => typeof option === 'string' ? option : option.label} onInputChange={(_, next, reason) => { if (reason === 'input' || reason === 'clear') setSearch(next); }} onChange={(_, values) => { const addition = values.find(row => row?.__addOption); if (!handleAddOption(addition, navigate)) onChange(values); }} renderInput={params => <TextField {...params} size="small" label="Filter values" error={Boolean(error)} helperText={error} />} />;
}
const EditableCell = React.memo(function EditableCell({ id, field, value, revision, onEdit, onActivity, disabled }) {
  const [draft, setDraft] = useState(value || ""), [progress, setProgress] = useState(null), [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => { setDraft(value || ""); }, [value, revision]);
  const change = value => { setDraft(value); onEdit(id, value); };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!/\.(jpe?g|png)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setError("Use a JPG/PNG image up to 10 MB"); return; }
    setProgress(0); setError(""); setUploading(true); onActivity(1);
    try {
      const body = new FormData(); body.append("colid", global1.colid); body.append("photo", file);
      const res = await ep1.post("/api/v2/student-data-upload-photo", body, { onUploadProgress: event => { if (event.total) setProgress(Math.round(event.loaded / event.total * 100)); } });
      if (!res.data.url) throw new Error("Upload did not return a photo URL");
      change(res.data.url); setProgress(100);
    } catch (err) { setError(err.response?.data?.msg || err.message); setProgress(null); } finally { setUploading(false); onActivity(-1); }
  };
  return <Stack spacing={0.5} sx={{ width: "100%", py: 0.5 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      {field === "photo" && /^https?:\/\//i.test(draft) && <Box component="img" src={draft} alt="Student photo" sx={{ width: 42, height: 48, objectFit: "contain", flexShrink: 0 }} />}
      <TextField fullWidth size="small" disabled={disabled || uploading} value={draft} inputProps={{ "aria-label": `${field} ${id}` }} onChange={event => change(event.target.value)} />
      {field === "photo" && <Button component="label" size="small" disabled={disabled || uploading} startIcon={<UploadFile />}>Upload<input hidden type="file" accept="image/jpeg,image/png" onChange={upload} /></Button>}
    </Stack>
    {progress !== null && <Stack direction="row" spacing={1} alignItems="center"><LinearProgress variant="determinate" value={progress} sx={{ flex: 1 }} /><Typography variant="caption">{progress}%</Typography></Stack>}
    {error && <Typography variant="caption" color="error">{error}</Typography>}
  </Stack>;
});
function Content({ field }) {
  const biometric = field === 'biometricid', root = biometric ? biometricRoot : studentRoot, entity = biometric ? 'users' : 'students';
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState({ fields: [], options: {}, programs: [] }), [filters, setFilters] = useState([]), [rows, setRows] = useState([]), [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false), [uploads, setUploads] = useState(0), [changed, setChanged] = useState(0), [revision, setRevision] = useState(0), [results, setResults] = useState({}), [notice, setNotice] = useState(null);
  const originals = useRef(new Map()), edits = useRef(new Map());
  const notify = (text, severity = "success") => setNotice({ text, severity });
  const fail = error => notify(error.response?.data?.message || error.message, "error");
  useEffect(() => { ep1.get(`${root}/options`, { params: { colid: global1.colid } }).then(res => setMetadata(res.data)).catch(fail); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onEdit = useCallback((id, value) => {
    if (String(originals.current.get(id)?.[field] ?? "").trim() === value.trim()) edits.current.delete(id); else edits.current.set(id, value);
    setChanged(edits.current.size);
  }, [field]);
  const onActivity = useCallback(delta => setUploads(previous => previous + delta), []);
  const load = async () => {
    if (!filters.some(filter => filter.value.length)) return notify(`Apply at least one ${biometric ? 'user' : 'student'} filter`, "warning");
    if (changed && !window.confirm(`Discard unsaved edits and load ${entity} again?`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/${entity}`, { colid: global1.colid, filters });
      const list = res.data.data || []; setRows(list); setSelected([]); setResults({});
      originals.current = new Map(list.map(row => [row._id, row])); edits.current.clear(); setChanged(0); setRevision(previous => previous + 1);
      notify(`Loaded ${list.length} of ${res.data.total} ${entity}${res.data.total > list.length ? `. Refine filters to load the remaining ${entity}.` : "."}`, "info");
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const save = async (onlySelected = false) => {
    const updates = [...edits.current].filter(([id]) => !onlySelected || selected.includes(id)).map(([id, value]) => ({ id, value: value.trim(), oldvalue: String(originals.current.get(id)?.[field] ?? "") }));
    if (!updates.length) return notify("No changed entries to save", "info");
    if (!window.confirm(`Update ${field} for ${updates.length} changed ${entity}? Only User records will be changed.`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/save`, { colid: global1.colid, field, rows: updates });
      const outcomes = res.data.results || []; setResults(Object.fromEntries(outcomes.map(row => [row.id, row.message || row.status])));
      for (const result of outcomes) if (["saved", "unchanged"].includes(result.status)) { const row = originals.current.get(result.id); originals.current.set(result.id, { ...row, [field]: result.value }); edits.current.delete(result.id); }
      setRows(previous => previous.map(row => originals.current.get(row._id) || row)); setChanged(edits.current.size);
      notify(`Updated ${res.data.saved} ${entity}. ${outcomes.filter(row => row.status === "error").length} rows need attention.`, outcomes.some(row => row.status === "error") ? "warning" : "success");
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const download = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.map(row => ({ _id: row._id, [biometric ? 'user' : 'student']: row.name, oldregno: row.regno, [field]: edits.current.get(row._id) ?? row[field] ?? "" }))), biometric ? 'Users' : "Students");
    XLSX.writeFile(workbook, `bulk_${field}_update.xlsx`);
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" }), list = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      for (const record of list) if (!originals.current.has(String(record._id)) || record[field] === undefined) throw new Error(`Use the downloaded template and only loaded ${biometric ? 'user' : 'student'} IDs`);
      for (const record of list) onEdit(String(record._id), String(record[field]));
      setRevision(previous => previous + 1); notify("Imported changes. Review and submit to update User records.");
    } catch (error) { fail(error); }
  };
  const updateFilter = (index, patch) => setFilters(previous => {
    const next = previous.map((row, i) => i === index ? { ...row, ...patch } : row);
    if (next[index].field === "program" && patch.value) {
      const codes = [...new Set(metadata.programs.filter(row => patch.value.includes(row.program)).map(row => row.programcode).filter(Boolean))];
      const codeIndex = next.findIndex(row => row.field === "programcode");
      if (codeIndex >= 0) next[codeIndex] = { field: "programcode", value: codes }; else if (codes.length) next.push({ field: "programcode", value: codes });
    }
    return next;
  });
  const columns = useMemo(() => {
    const editable = { field, headerName: `${fieldLabels[field] || "Photo URL"} (editable)`, width: field === "photo" ? 500 : 230, sortable: false, renderCell: ({ row }) => <EditableCell id={row._id} field={field} value={edits.current.get(row._id) ?? row[field] ?? ""} revision={revision} onEdit={onEdit} onActivity={onActivity} disabled={busy} /> };
    const keys = biometric ? ['name', 'email', 'role', 'regno', 'institution', 'department', 'designation', 'academicyear', 'program', 'programcode', 'semester', 'section'] : ["academicyear", "regulation", "program", "programcode", "section", "semester", "name", "regno", "rollno"];
    const details = keys.filter(key => key !== field).map(key => ({ field: key, headerName: biometric && key === 'name' ? 'Name' : fieldLabels[key], width: biometric && key === 'email' ? 220 : ["name", "program"].includes(key) ? 200 : 140 }));
    return [...(biometric ? [...details.slice(0, 2), editable, ...details.slice(2)] : [...details, editable]), { field: "result", headerName: "Update result", width: 350, renderCell: ({ row }) => results[row._id] || "" }];
  }, [field, biometric, revision, onEdit, onActivity, results, busy]);
  return <Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">{names[field]}</Typography>
    {(busy || uploads > 0) && <LinearProgress />}
    <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
      <Button startIcon={<Add />} disabled={busy || uploads > 0} onClick={() => setFilters(previous => [...previous, { field: biometric ? 'role' : "academicyear", value: [] }])}>Add filter</Button>
      {filters.map((filter, index) => <Grid container spacing={1} key={index}>
        <Grid item xs={12} md={3}><Autocomplete options={metadata.fields} value={filter.field} getOptionLabel={key => biometric && key === 'name' ? 'Name' : fieldLabels[key] || key} onChange={(_, value) => updateFilter(index, { field: value || (biometric ? 'role' : "academicyear"), value: [] })} renderInput={params => <TextField {...params} size="small" label="Field" />} /></Grid>
        <Grid item xs={10} md={8}>{biometric ? <BiometricFilterValues field={filter.field} value={filter.value} disabled={busy} onChange={value => updateFilter(index, { value })} /> : <Autocomplete multiple freeSolo options={[addOption("+ Add Student", "/studentdataupload"), ...(metadata.options[filter.field] || [])]} getOptionLabel={option => typeof option === "string" ? option : option.label} value={filter.value} onChange={(_, values) => { const addition = values.find(row => row?.__addOption); if (!handleAddOption(addition, navigate)) updateFilter(index, { value: values }); }} renderInput={params => <TextField {...params} size="small" label="Filter values" />} />}</Grid>
        <Grid item xs={2} md={1}><IconButton aria-label="Remove filter" onClick={() => setFilters(previous => previous.filter((_, i) => i !== index))}><Delete /></IconButton></Grid>
      </Grid>)}
      <Button variant="contained" disabled={busy || uploads > 0} onClick={load}>{biometric ? 'Load users' : 'Load students'}</Button>
    </Stack></Paper>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button startIcon={<Download />} disabled={!rows.length} onClick={download}>Template / export</Button><Button component="label" startIcon={<UploadFile />} disabled={!rows.length || busy || uploads > 0}>Import changes<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button><Button variant="contained" startIcon={<Save />} disabled={!changed || busy || uploads > 0} onClick={() => save(false)}>Submit changed entries ({changed})</Button><Button variant="outlined" disabled={!changed || !selected.length || busy || uploads > 0} onClick={() => save(true)}>Submit selected changes</Button></Stack>
    <Box sx={{ height: 620 }}><ResultsGrid rows={rows} getRowId={rowId} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} loading={busy} rowHeight={field === "photo" ? 110 : 64} slots={slots} pageSizeOptions={[25, 50, 100]} /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} anchorOrigin={{ vertical: "top", horizontal: "center" }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || "info"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function StudentBulkFieldUpdatePage({ field = "regno" }) { return <MenuPageShell title={names[field]}><Content key={field} field={field} /></MenuPageShell>; }
