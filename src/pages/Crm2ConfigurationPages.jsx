import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Grid, IconButton, LinearProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Delete, Edit, Save, UploadFile, Download } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
const root = '/api/v2/crm2/config';
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const addressFields = ['country','state','city'];
const mappingFields = ['academicyear','program','programcode','formid','formtitle'];
const ResultsGrid = React.memo(DataGrid);
const getRowId = row => row._id;
const slots = { toolbar: GridToolbar };
export default function Crm2ConfigurationPage({ kind = 'address' }) {
  const address = kind === 'address', title = address ? 'Address master' : 'Program form mapping';
  const fields = address ? addressFields : mappingFields;
  const [form, setForm] = useState({}), [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const notify = (text, severity = 'success') => setNotice({ text, severity });
  const load = async () => {
    setBusy(true);
    try { const res = await ep1.get(`${root}/${kind}`, { params: { ...scope(), search } }); setRows(res.data.data || []); setSelected([]); }
    catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try { await ep1.post(`${root}/${kind}/save`, { ...form, ...scope(), id: form._id }); setForm({}); await load(); notify('Saved'); }
    catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); }
  };
  const remove = async ids => {
    if (!window.confirm(`Delete ${ids.length} records?`)) return;
    setBusy(true);
    try { await ep1.post(`${root}/${kind}/delete`, { ...scope(), ids }); if (ids.includes(form._id)) setForm({}); await load(); notify('Deleted'); }
    catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); }
  };
  const removeRef = useRef(remove); removeRef.current = remove;
  const selectRows = useCallback(value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || [])), []);
  const download = () => {
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([address ? fields : ['academicyear','programcode','formid']]), 'Upload'); XLSX.writeFile(book, `crm2-${kind}-template.xlsx`);
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setBusy(true);
    try {
      const book = XLSX.read(await file.arrayBuffer());
      const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '', raw: false });
      const res = await ep1.post(`${root}/${kind}/bulk`, { ...scope(), rows: data });
      if (res.data.errors?.length) { const errors = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(errors, XLSX.utils.json_to_sheet(res.data.errors), 'Errors'); XLSX.writeFile(errors, 'crm2-configuration-errors.xlsx'); }
      await load(); notify(`${res.data.saved} saved; ${res.data.errors?.length || 0} failed`, res.data.errors?.length ? 'warning' : 'success');
    } catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); }
  };
  const columns = useMemo(() => [...fields.map(field => ({ field, headerName: ({ academicyear: 'Academic year', programcode: 'Program code', formid: 'Form ID', formtitle: 'Admission form' }[field] || field[0].toUpperCase() + field.slice(1)), minWidth: 160, flex: 1 })), { field: 'actions', headerName: 'Actions', width: 110, sortable: false, renderCell: params => <><IconButton title="Edit" disabled={busy} onClick={() => setForm(params.row)}><Edit /></IconButton><IconButton title="Delete" disabled={busy} onClick={() => removeRef.current([params.row._id])}><Delete /></IconButton></> }], [fields, busy]);
  return <MenuPageShell title={`CRM 2 · ${title}`}><Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">{title}</Typography>
    {busy && <LinearProgress />}
    <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      {address ? fields.map(field => <Grid item xs={12} md={4} key={field}><TextField fullWidth size="small" label={field[0].toUpperCase() + field.slice(1)} value={form[field] || ''} onChange={event => setForm(previous => ({ ...previous, [field]: event.target.value }))} /></Grid>) : <>
        <Grid item xs={12} md={3}><ProgramChoice title="Academic year" endpoint="/api/v2/crm2-programs/academic-years" value={form.academicyear ? { name: form.academicyear } : null} addPath="/programmanagement" onChange={value => setForm(previous => ({ _id: previous._id, academicyear: value?.name || '' }))} /></Grid>
        <Grid item xs={12} md={3}><ProgramChoice title="Program" endpoint="/api/v2/crm2-programs/programs" params={{ academicyear: form.academicyear }} disabled={!form.academicyear} addPath="/programmanagement" value={form.programcode ? { program: form.program, programcode: form.programcode } : null} onChange={value => setForm(previous => ({ ...previous, program: value?.program || '', programcode: value?.programcode || '' }))} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Program code" value={form.programcode || ''} InputProps={{ readOnly: true }} /></Grid>
        <Grid item xs={12} md={3}><ProgramChoice title="Dynamic admission form" endpoint={`${root}/forms`} addPath="/dynamic-admission-form" value={form.formid ? { name: `${form.formtitle || form.formid} (${form.formid})`, formid: form.formid } : null} onChange={value => setForm(previous => ({ ...previous, formid: value?.formid || '', formtitle: value?.title || '' }))} /></Grid>
      </>}
      <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} onClick={save} disabled={busy || (address ? fields.some(field => !form[field]?.trim()) : !form.academicyear || !form.programcode || !form.formid)}>{form._id ? 'Update' : 'Save'}</Button><Button startIcon={<Add />} disabled={busy} onClick={() => setForm({})}>New</Button></Stack></Grid>
    </Grid></Paper>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><TextField label="Search" size="small" value={search} onChange={event => setSearch(event.target.value)} /><Button onClick={load} variant="outlined" disabled={busy}>Load</Button><Button onClick={download} startIcon={<Download />}>Upload template</Button><Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button><Button startIcon={<Delete />} disabled={busy || !selected.length} onClick={() => remove(selected)}>Delete selected ({selected.length})</Button></Stack>
    <Box sx={{ height: 480 }}><ResultsGrid rows={rows} columns={columns} getRowId={getRowId} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={selectRows} slots={slots} loading={busy} /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
