import React, { useEffect, useState } from "react";
import { Autocomplete, Box, Button, Grid, IconButton, LinearProgress, Paper, Snackbar, Alert, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete, Sync } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const root = "/api/v2/repair-maintenance";
const columns = ["name", "email", "regno", "role", "academicyear", "regulation", "program", "programcode", "semester", "section"].map(field => ({ field, headerName: field, width: field === "email" || field === "name" ? 220 : 150 }));
const slots = { toolbar: GridToolbar };
function Content() {
  const [options, setOptions] = useState({}), [fields, setFields] = useState([]), [filters, setFilters] = useState([]);
  const [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [oldyear, setOldyear] = useState(""), [newyear, setNewyear] = useState("");
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const scope = { colid: global1.colid, source: "students" };
  const fail = err => setNotice({ severity: "error", text: err.response?.data?.message || err.message });
  useEffect(() => {
    let active = true;
    ep1.get(`${root}/selected-program-change/options`, { params: { colid: global1.colid, source: "students" } }).then(res => { if (active) { setOptions(res.data.options || {}); setFields(res.data.fields || []); } }).catch(err => { if (active) fail(err); });
    return () => { active = false; };
  }, []);
  const load = async () => {
    if (!filters.some(filter => filter.value?.length)) return setNotice({ severity: "warning", text: "Add at least one filter before loading students." });
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/selected-program-change/list`, { ...scope, filters });
      setRows(res.data.data || []); setSelected([]);
      setNotice({ severity: "info", text: `Loaded ${res.data.count || 0} students (maximum 5000).` });
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  const apply = async () => {
    if (!window.confirm(`Change academic year from ${oldyear} to ${newyear} for ${selected.length} selected students? Only matching old-year records will change.`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/change-academic-year/apply`, { colid: global1.colid, ids: selected, oldacademicyear: oldyear, newacademicyear: newyear.trim() });
      const matched = new Set(selected);
      setRows(previous => previous.map(row => matched.has(row.id) && row.academicyear === oldyear ? { ...row, academicyear: newyear.trim() } : row));
      setSelected([]);
      setOptions(previous => ({ ...previous, academicyear: [...new Set([...(previous.academicyear || []), newyear.trim()])] }));
      setNotice({ severity: "success", text: `Updated ${res.data.modified} students. Skipped ${res.data.skipped} students not matching the old academic year.` });
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  const updateFilter = (index, patch) => setFilters(previous => previous.map((filter, i) => i === index ? { ...filter, ...patch } : filter));
  return <Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">Change academic year</Typography>
    {busy && <LinearProgress />}
    <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
      <Button startIcon={<Add />} disabled={busy} onClick={() => setFilters(previous => [...previous, { field: "academicyear", value: [] }])}>Add filter</Button>
      {filters.map((filter, index) => <Grid container spacing={1} key={index}>
        <Grid item xs={12} md={3}><Autocomplete disabled={busy} options={fields} value={filter.field} onChange={(_, value) => updateFilter(index, { field: value || "academicyear", value: [] })} renderInput={params => <TextField {...params} label="Field" size="small" />} /></Grid>
        <Grid item xs={10} md={8}><Autocomplete multiple disabled={busy} options={options[filter.field] || []} value={filter.value} onChange={(_, value) => updateFilter(index, { value })} renderInput={params => <TextField {...params} label="Filter values" size="small" />} /></Grid>
        <Grid item xs={2} md={1}><IconButton aria-label="Remove filter" disabled={busy} onClick={() => setFilters(previous => previous.filter((_, i) => i !== index))}><Delete /></IconButton></Grid>
      </Grid>)}
      <Button variant="contained" disabled={busy} onClick={load}>Load students</Button>
    </Stack></Paper>
    <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <Autocomplete sx={{ minWidth: 240 }} disabled={busy} freeSolo options={options.academicyear || []} inputValue={oldyear} onInputChange={(_, value) => setOldyear(value)} renderInput={params => <TextField {...params} label="Old academic year" size="small" />} />
      <TextField disabled={busy} label="New academic year" size="small" value={newyear} onChange={event => setNewyear(event.target.value)} />
      <Button variant="contained" color="warning" startIcon={<Sync />} disabled={busy || !selected.length || !oldyear.trim() || !newyear.trim() || oldyear.trim() === newyear.trim()} onClick={apply}>Apply to selected ({selected.length})</Button>
    </Stack></Paper>
    <Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} checkboxSelection disableRowSelectionOnClick loading={busy} rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} slots={slots} pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}><Alert variant="filled" severity={notice?.severity || "info"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function ChangeAcademicYearPage() { return <MenuPageShell title="Change academic year"><Content /></MenuPageShell>; }
