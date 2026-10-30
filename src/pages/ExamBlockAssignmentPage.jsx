import React, { useEffect, useState } from "react";
import { Autocomplete, Box, Button, Checkbox, Grid, LinearProgress, Paper, Snackbar, Alert, Stack, TextField, Typography } from "@mui/material";
import { Refresh, Save } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import { addOption, handleAddOption, renderAddOption } from "./addableAutocompleteHelpers";
import ep1 from "../api/ep1";
import global1 from "./global1";
const root = "/api/v2/conductexam/block-assignment";
const columns = ["student", "regno", "email", "program", "programcode", "semester", "course", "coursecode", "examdate", "examslot", "building", "examroom", "seatno", "blockno"].map(field => ({ field, headerName: field === "blockno" ? "Block number" : field, width: ["student", "email", "course"].includes(field) ? 210 : 140 }));
const slots = { toolbar: GridToolbar }, all = { selectAll: true, label: "Select all programs" };
const label = row => row.__addOption || row.selectAll ? row.label : `${row.program} (${row.programcode})`;
const rowId = row => row._id;
function Content() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]), [year, setYear] = useState(""), [exam, setExam] = useState(null), [programs, setPrograms] = useState([]), [selectedPrograms, setSelectedPrograms] = useState([]);
  const [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [blockno, setBlockno] = useState(""), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const fail = error => setNotice({ severity: "error", text: error.response?.data?.message || error.message });
  const clearRows = () => { setRows([]); setSelected([]); };
  useEffect(() => {
    ep1.get(`${root}/exams`, { params: { colid: global1.colid } }).then(res => setExams(res.data.data || [])).catch(fail);
  }, []);
  useEffect(() => {
    setPrograms([]); setSelectedPrograms([]); clearRows(); if (!year || !exam) return;
    const controller = new AbortController();
    ep1.get(`${root}/programs`, { params: { colid: global1.colid, academicyear: year, examcode: exam.examcode }, signal: controller.signal }).then(res => setPrograms(res.data.data || [])).catch(error => { if (!controller.signal.aborted) fail(error); });
    return () => controller.abort();
  }, [year, exam]);
  const scope = () => ({ colid: global1.colid, academicyear: year, examcode: exam?.examcode, programs: selectedPrograms });
  const load = async () => {
    setBusy(true);
    try { const res = await ep1.post(`${root}/students`, scope()); setRows(res.data.data || []); setSelected([]); setNotice({ severity: "info", text: `Loaded ${res.data.data?.length || 0} examroll rows.` }); }
    catch (error) { fail(error); } finally { setBusy(false); }
  };
  const assign = async () => {
    if (!window.confirm(`Assign block ${blockno.trim()} to ${selected.length} selected examroll rows?`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/assign`, { ...scope(), ids: selected, blockno: blockno.trim() });
      const refreshed = await ep1.post(`${root}/students`, scope()); setRows(refreshed.data.data || []); setSelected([]);
      setNotice({ severity: "success", text: `Assigned: ${res.data.modified}. Matched: ${res.data.matched}. Skipped: ${res.data.skipped}.` });
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">Exam block allocation</Typography>
    {busy && <LinearProgress />}
    <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 2 }}>Step 1 — Select exam</Typography><Grid container spacing={2}>
      <Grid item xs={12} md={4}><Autocomplete disabled={busy} options={[...new Set(exams.map(row => row.academicyear))].filter(Boolean).sort().reverse()} value={year || null} onChange={(_, value) => { setYear(value || ""); setExam(null); clearRows(); }} renderInput={params => <TextField {...params} size="small" label="Academic year" />} /></Grid>
      <Grid item xs={12} md={5}><Autocomplete disabled={busy || !year} options={[addOption("+ Add Exam", "/conduct-exam-master"), ...exams.filter(row => row.academicyear === year)]} getOptionLabel={row => row.__addOption ? row.label : `${row.examname} (${row.examcode})`} renderOption={(props, row) => renderAddOption(props, { ...row, label: row.__addOption ? row.label : `${row.examname} (${row.examcode})` })} value={exam} onChange={(_, value) => { if (!handleAddOption(value, navigate)) { setExam(value); clearRows(); } }} renderInput={params => <TextField {...params} size="small" label="Exam" />} /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Exam code" value={exam?.examcode || ""} InputProps={{ readOnly: true }} /></Grid>
    </Grid></Paper>
    <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 2 }}>Step 2 — Select programs and block</Typography><Grid container spacing={2}>
      <Grid item xs={12} md={8}><Autocomplete multiple disableCloseOnSelect disabled={busy || !exam} options={[addOption("+ Add Populated Exam Courses", "/conduct-exam-populate-courses"), all, ...programs]} getOptionLabel={label} isOptionEqualToValue={(a, b) => a.program === b.program && a.programcode === b.programcode && Boolean(a.selectAll) === Boolean(b.selectAll) && Boolean(a.__addOption) === Boolean(b.__addOption)} value={selectedPrograms} renderOption={(props, row, state) => <li {...props}><Checkbox checked={row.selectAll ? programs.length > 0 && selectedPrograms.length === programs.length : state.selected} />{label(row)}</li>} onChange={(_, values) => { const addition = values.find(row => row.__addOption); if (handleAddOption(addition, navigate)) return; setSelectedPrograms(values.some(row => row.selectAll) ? selectedPrograms.length === programs.length ? [] : programs : values); clearRows(); }} renderInput={params => <TextField {...params} size="small" label="Programs / program codes" />} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Block number" value={blockno} onChange={event => setBlockno(event.target.value)} inputProps={{ maxLength: 100 }} /></Grid>
      <Grid item xs={12}><Button variant="contained" startIcon={<Refresh />} disabled={busy || !year || !exam || !selectedPrograms.length} onClick={load}>Load students</Button></Grid>
    </Grid></Paper>
    <Box sx={{ height: 560 }}><DataGrid rows={rows} getRowId={rowId} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} loading={busy} slots={slots} pageSizeOptions={[25, 50, 100]} /></Box>
    <Button variant="contained" startIcon={<Save />} disabled={busy || !selected.length || !blockno.trim()} onClick={assign}>Assign block number ({selected.length})</Button>
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} anchorOrigin={{ vertical: "top", horizontal: "center" }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || "info"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function ExamBlockAssignmentPage() { return <MenuPageShell title="Exam block allocation"><Content /></MenuPageShell>; }
