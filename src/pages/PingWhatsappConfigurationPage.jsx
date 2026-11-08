import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, IconButton, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Delete, Download, Edit, Refresh, Save, UploadFile } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';
const root = '/api/v2/ping-whatsapp-configuration';
const blank = { phoneid: '', apiid: '', active: 'Yes' };
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
export default function PingWhatsappConfigurationPage() {
  const [form, setForm] = useState(blank), [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [filters, setFilters] = useState({ phoneid: '', apiid: '', active: '' });
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const notify = (text, severity = 'success') => setNotice({ text, severity });
  const run = async callback => { setBusy(true); try { await callback(); } catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); } };
  const load = async (selection = filters) => { setRows((await ep1.get(root, { params: { ...scope(), ...selection } })).data.data || []); setSelected([]); };
  useEffect(() => { run(() => load()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = () => run(async () => { await ep1.post(root, { ...form, id: form._id, ...scope() }); setForm(blank); await load(); notify('Configuration saved'); });
  const remove = ids => run(async () => {
    if (!window.confirm(`Delete ${ids.length} selected configuration(s)?`)) return;
    await ep1.post(`${root}/delete`, { ...scope(), ids }); if (ids.includes(form._id)) setForm(blank); await load(); notify('Configuration deleted');
  });
  const template = () => { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['phoneid','apiid','active']]), 'Configuration'); XLSX.writeFile(book, 'ping_whatsapp_configuration.xlsx'); };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await run(async () => { const book = XLSX.read(await file.arrayBuffer()); const result = (await ep1.post(`${root}/bulk`, { ...scope(), rows: XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '', raw: false }) })).data; await load(); notify(`${result.saved} configuration(s) saved${result.errors.length ? `. ${result.errors.map(row => `Row ${row.row}: ${row.message}`).join('; ')}` : ''}`, result.errors.length ? 'warning' : 'success'); });
  };
  return <MenuPageShell title="Ping WhatsApp configuration"><Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}><Typography variant="h5">Ping WhatsApp configuration</Typography>{busy && <LinearProgress />}
    <Grid container spacing={2}>
      {['phoneid','apiid'].map(field => <Grid item xs={12} md={4} key={field}><TextField fullWidth size="small" label={field === 'phoneid' ? 'Phone ID' : 'API ID'} value={form[field]} onChange={event => setForm(previous => ({ ...previous, [field]: event.target.value }))} /></Grid>)}
      <Grid item xs={12} md={4}><Autocomplete size="small" options={['Yes','No']} value={form.active} onChange={(_,active) => setForm(previous => ({ ...previous, active: active || 'Yes' }))} renderInput={params => <TextField {...params} label="Active" />} /></Grid>
    </Grid>
    <Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={busy || !form.phoneid.trim() || !form.apiid.trim()} onClick={save}>{form._id ? 'Save changes' : 'Save'}</Button><Button disabled={busy} onClick={() => setForm(blank)}>Reset</Button></Stack>
    <Typography variant="h6">Saved configurations</Typography><Grid container spacing={2}>{['phoneid','apiid'].map(field => <Grid item xs={12} md={4} key={field}><TextField fullWidth size="small" label={field === 'phoneid' ? 'Filter Phone ID' : 'Filter API ID'} value={filters[field]} onChange={event => setFilters(previous => ({ ...previous, [field]: event.target.value }))} /></Grid>)}<Grid item xs={12} md={4}><Autocomplete size="small" options={['Yes','No']} value={filters.active || null} onChange={(_,active) => setFilters(previous => ({ ...previous, active: active || '' }))} renderInput={params => <TextField {...params} label="Filter active" />} /></Grid></Grid>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button startIcon={<Refresh />} disabled={busy} onClick={() => run(() => load())}>Load</Button><Button color="error" startIcon={<Delete />} disabled={busy || !selected.length} onClick={() => remove(selected)}>Delete selected ({selected.length})</Button><Button startIcon={<Download />} onClick={template}>Upload template</Button><Button component="label" disabled={busy} startIcon={<UploadFile />}>Bulk upload<input type="file" hidden accept=".xlsx,.xls,.csv" onChange={upload} /></Button></Stack>
    <Box sx={{ height: 500 }}><DataGrid rows={rows} getRowId={row => row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} disableRowSelectionOnClick loading={busy} slots={{ toolbar: GridToolbar }} columns={[{ field: 'actions', headerName: 'Actions', width: 110, renderCell: params => <><IconButton title="Edit configuration" onClick={() => setForm(params.row)}><Edit /></IconButton><IconButton title="Delete configuration" color="error" onClick={() => remove([params.row._id])}><Delete /></IconButton></> }, { field: 'phoneid', headerName: 'Phone ID', minWidth: 220, flex: 1 }, { field: 'apiid', headerName: 'API ID', minWidth: 220, flex: 1 }, { field: 'active', headerName: 'Active', width: 120 }]} /></Box>
    <Snackbar open={!!notice} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
