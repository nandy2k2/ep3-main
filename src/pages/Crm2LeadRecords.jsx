import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, IconButton, LinearProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Delete, Download, Edit, Save, UploadFile } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
import { useCrm2Dashboard } from './Crm2DashboardContext';
import CounselorTaskReport from './CounselorTaskReport';
const statuses = ['Open','Pending','Closed'];
const Results = React.memo(DataGrid);
const rowId = row => row._id;
const slots = { toolbar: GridToolbar };
const rowHeight = () => 'auto';
const initial = { task: '', duedate: '', status: 'Open', note: '' };
const dateInput = value => value ? String(value).slice(0, 10) : '';
export function Crm2LeadRecords(props) {
  const dashboard = useCrm2Dashboard();
  return dashboard?.taskStatusOnly && props.kind !== 'notes' && !props.compact ? <CounselorTaskReport leadId={props.lead?._id} /> : <Crm2LeadRecordEditor {...props} />;
}
function Crm2LeadRecordEditor({ kind = 'tasks', lead = null, mode = '', compact = false }) {
  const dashboard = useCrm2Dashboard();
  const tasks = kind === 'tasks', title = tasks ? 'Lead tasks' : 'Lead notes', root = `/api/v2/crm2/lead-records/${kind}`;
  const scope = () => ({ colid: global1.colid, user: global1.user || global1.email, ...(mode ? { leadmode: mode } : {}), ...(dashboard ? { dashboardyear: dashboard.academicyear, token: global1.token } : {}) });
  const [form, setForm] = useState(initial), [rows, setRows] = useState([]), [selected, setSelected] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false), [search, setSearch] = useState(''), [status, setStatus] = useState(dashboard?.view === 'tasks' ? 'Unclosed' : null), [notice, setNotice] = useState(null);
  const toast = (text, severity = 'success') => setNotice({ text, severity });
  const load = async signal => {
    const res = await ep1.get(root, { params: { ...scope(), leadid: lead?._id, search, status: tasks ? status || '' : undefined }, signal });
    if (!signal?.aborted) { setRows(res.data.data || []); setSelected([]); }
  };
  const execute = async fn => {
    setBusy(true);
    try { await fn(); } catch (error) { toast(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); }
  };
  useEffect(() => {
    if (!lead?._id && !dashboard) return undefined;
    const controller = new AbortController(); setBusy(true);
    load(controller.signal).catch(error => { if (!controller.signal.aborted) toast(error.response?.data?.message || error.message, 'error'); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
    // The containing editor remounts this workspace when the lead changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?._id, kind, mode]);
  const save = () => execute(async () => {
    await ep1.post(`${root}/save`, { ...form, ...scope(), id: form._id, leadid: lead?._id || form.leadid });
    setForm(initial); setFormOpen(false); await load(); toast(tasks ? 'Task saved' : 'Note saved');
  });
  const remove = ids => execute(async () => {
    if (!window.confirm(`Delete ${ids.length} selected ${kind}?`)) return;
    await ep1.post(`${root}/delete`, { ...scope(), ids, leadid: lead?._id });
    if (ids.includes(form._id)) setForm(initial); await load(); toast('Deleted');
  });
  const removeRef = useRef(remove); removeRef.current = remove;
  const selectRows = useCallback(value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || [])), []);
  const edit = useCallback(row => { setForm({ ...row, duedate: dateInput(row.duedate) }); setFormOpen(true); }, []);
  const columns = useMemo(() => [{ field: tasks ? 'task' : 'note', headerName: tasks ? 'Tasks' : 'Notes', minWidth: 320, flex: 1, sortable: false, renderCell: p => <Stack spacing={0.7} sx={{ width: '100%', py: 1.25, whiteSpace: 'normal', overflowWrap: 'anywhere' }}><Typography sx={{ fontWeight: 650, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{p.value}</Typography>{tasks && <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap"><Typography variant="caption">Due: {dateInput(p.row.duedate) || '-'}</Typography><Typography variant="caption">Status: {p.row.status || '-'}</Typography></Stack>}<Typography variant="caption" color="text.secondary">Added: {p.row.createdAt ? new Date(p.row.createdAt).toLocaleString() : '-'} · By: {p.row.createdby || '-'}</Typography><Stack direction="row" spacing={0.5}><IconButton size="small" title="Edit record" disabled={busy} onClick={() => edit(p.row)}><Edit fontSize="small" /></IconButton><IconButton size="small" title="Delete record" disabled={busy} onClick={() => removeRef.current([p.row._id])}><Delete fontSize="small" /></IconButton></Stack></Stack> }], [tasks, busy, edit]);
  const template = () => {
    const keys = [...(lead ? [] : ['leadid']), ...(tasks ? ['task','duedate','status'] : ['note'])];
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([keys]), 'Upload'); XLSX.writeFile(book, `crm2-lead-${kind}-template.xlsx`);
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await execute(async () => {
      const book = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '' });
      const res = await ep1.post(`${root}/bulk`, { ...scope(), leadid: lead?._id, rows: data });
      if (res.data.errors?.length) { const errors = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(errors, XLSX.utils.json_to_sheet(res.data.errors), 'Errors'); XLSX.writeFile(errors, 'crm2-lead-record-errors.xlsx'); }
      await load(); toast(`${res.data.saved} saved; ${res.data.errors?.length || 0} failed`, res.data.errors?.length ? 'warning' : 'success');
    });
  };
  const activeLead = lead || (form.leadid ? { _id: form.leadid, name: form.lead, email: form.leademail, phone: form.leadphone } : null);
  const restrictedTaskCreate = compact && dashboard?.taskStatusOnly && tasks;
  return <Stack spacing={2} sx={{ p: compact ? 1.5 : 2, width: '100%' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">{title}{activeLead ? ` · ${activeLead.name}` : ''}</Typography>{!restrictedTaskCreate && <Button startIcon={<Add />} disabled={busy} onClick={() => { setForm(initial); setFormOpen(true); }}>Add {tasks ? 'task' : 'note'}</Button>}</Stack>
    {busy && <LinearProgress />}
    {formOpen && (!restrictedTaskCreate || form._id) && <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      {activeLead && [['Lead ID',activeLead._id],['Lead',activeLead.name],['Lead email',activeLead.email],['Lead phone',activeLead.phone]].map(([label,value]) => <Grid key={label} item xs={12} md={3}><TextField fullWidth size="small" label={label} value={value || ''} InputProps={{ readOnly: true }} /></Grid>)}
      <Grid item xs={12}><TextField fullWidth multiline minRows={3} label={tasks ? 'Task' : 'Note'} value={tasks ? form.task : form.note} onChange={event => setForm(previous => ({ ...previous, [tasks ? 'task' : 'note']: event.target.value }))} /></Grid>
      {tasks && <><Grid item xs={12} md={6}><TextField size="small" fullWidth type="date" label="Due date" InputLabelProps={{ shrink: true }} value={form.duedate || ''} onChange={event => setForm(previous => ({ ...previous, duedate: event.target.value }))} /></Grid><Grid item xs={12} md={6}><Autocomplete options={statuses} value={form.status || 'Open'} onChange={(_, value) => setForm(previous => ({ ...previous, status: value || 'Open' }))} renderInput={params => <TextField {...params} size="small" label="Status" />} /></Grid></>}
      <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={busy || !activeLead || !(tasks ? form.task && form.duedate : form.note)} onClick={save}>{form._id ? 'Update' : 'Save'} {tasks ? 'task' : 'note'}</Button><Button disabled={busy} onClick={() => { setForm(initial); setFormOpen(false); }}>Cancel</Button></Stack></Grid>
    </Grid></Paper>}
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><TextField label="Search records" size="small" value={search} onChange={event => setSearch(event.target.value)} />{tasks && <Autocomplete sx={{ width: 180 }} options={dashboard ? [...statuses, 'Unclosed'] : statuses} value={status} onChange={(_, value) => setStatus(value)} renderInput={params => <TextField {...params} size="small" label="Filter status" />} />}<Button disabled={busy} onClick={() => execute(() => load())}>Load</Button><Button startIcon={<Delete />} disabled={busy || !selected.length} onClick={() => remove(selected)}>Delete selected</Button><Button startIcon={<Download />} onClick={template}>Upload template</Button><Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button></Stack>
    <Box sx={{ height: compact ? 360 : 420 }}><Results rows={rows} columns={columns} getRowId={rowId} getRowHeight={rowHeight} slots={slots} loading={busy} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={selectRows} /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function Crm2LeadRecordPage({ kind = 'tasks' }) {
  const [lead, setLead] = useState(null);
  return <MenuPageShell title={kind === 'tasks' ? 'CRM 2 · Lead tasks' : 'CRM 2 · Lead notes'}><Box sx={{ p: 2 }}><ProgramChoice title="Select lead" endpoint="/api/v2/crm2/lead-options" value={lead} addPath="/crm2-leads" onChange={setLead} /><Crm2LeadRecords key={lead?._id || 'all'} kind={kind} lead={lead} /></Box></MenuPageShell>;
}
