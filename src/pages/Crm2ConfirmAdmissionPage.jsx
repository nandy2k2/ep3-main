import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControlLabel, LinearProgress, Snackbar, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { Print, Refresh, Save } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Filters } from './Crm2ProgramPages';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
const root = '/api/v2/crm2-admissions';
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const steps = ['Select programwise lead', 'Admit student', 'Apply fees', 'Apply scholarships', 'Confirmation'];
const display = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const escape = value => display(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const labels = { _id: 'ID', regno: 'Registration no', academicyear: 'Academic year', programcode: 'Program code', feeitem: 'Fee item', feeeitem: 'Fee item', feecategory: 'Fee category', calculatedamount: 'Scholarship amount' };
function ReadGrid({ rows, selected, onSelect, busy = false }) {
  const columns = useMemo(() => [...new Set(rows.flatMap(row => Object.keys(row)))].filter(field => !['__v', 'password', 'authenticatorsecret'].includes(field)).map(field => ({ field, headerName: labels[field] || field, minWidth: 160, renderCell: params => <span title={display(params.value)}>{display(params.value)}</span> })), [rows]);
  return <Box sx={{ height: 410 }}><DataGrid rows={rows} getRowId={row => row._id} columns={columns} checkboxSelection={Boolean(onSelect)} rowSelectionModel={selected || []} onRowSelectionModelChange={onSelect} disableRowSelectionOnClick loading={busy} slots={{ toolbar: GridToolbar }} /></Box>;
}
export function admissionPrint(data, institution) {
  const student = data.student || {}, ledger = data.ledger || [];
  const columns = ['feeitem', 'feegroup', 'feecategory', 'semester', 'amount', 'paid', 'concession', 'balance'];
  const total = field => ledger.reduce((sum, row) => sum + Number(row[field] || 0), 0).toFixed(2);
  return `<!doctype html><html><head><title>Admission confirmation</title><style>@page{size:A4;margin:12mm}body{font:12px Arial;color:#000}header{text-align:center}header img{width:70px;height:70px;object-fit:contain}h1{font-size:21px}h2{font-size:16px}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #444;padding:6px;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}</style></head><body><header>${/^https?:\/\//i.test(institution.logolink || '') ? `<img src="${escape(institution.logolink)}" alt="Institution logo">` : ''}<h1>${escape(institution.institutionname)}</h1><div>${escape(institution.address)}</div><h2>Admission confirmation</h2></header><table><tbody>${['name', 'regno', 'email', 'phone', 'academicyear', 'admissionyear', 'program', 'programcode', 'regulation', 'semester', 'section', 'gender', 'category'].map(field => `<tr><th>${escape(labels[field] || field)}</th><td>${escape(student[field])}</td></tr>`).join('')}</tbody></table><h2>Student ledger</h2><table><thead><tr>${columns.map(field => `<th>${escape(labels[field] || field)}</th>`).join('')}</tr></thead><tbody>${ledger.map(row => `<tr>${columns.map(field => `<td>${escape(row[field])}</td>`).join('')}</tr>`).join('')}</tbody></table><p>Total amount: ${total('amount')} | Paid: ${total('paid')} | Concession: ${total('concession')} | Balance: ${total('balance')}</p></body></html>`;
}
function LeadSelection({ onSelect, notify }) {
  const [filters, setFilters] = useState([]), [search, setSearch] = useState(''), [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [busy, setBusy] = useState(false), [page, setPage] = useState({ page: 0, pageSize: 25 }), [total, setTotal] = useState(0);
  const load = async (pagination = page) => {
    setBusy(true); setSelected([]);
    try { const res = await ep1.get('/api/v2/crm2-programs/my-leads', { params: { ...scope(), active: 'Yes', filters: JSON.stringify(filters), search, limit: pagination.pageSize, skip: pagination.page * pagination.pageSize } }); setRows(res.data.data || []); setTotal(res.data.total || 0); }
    catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); }
  };
  const columns = useMemo(() => ['name', 'email', 'phone', 'academicyear', 'program', 'programcode', 'counsellorname', 'pipeline', 'case', 'active', 'admitted'].map(field => ({ field, headerName: labels[field] || field, minWidth: 170, valueGetter: params => ['name', 'email', 'phone', 'active'].includes(field) ? params.row.lead?.[field] || '' : params.row[field] || '' })), []);
  return <Stack spacing={2}><TextField label="Search lead name, email or phone" value={search} onChange={event => setSearch(event.target.value)} /><Filters mine filters={filters} setFilters={setFilters} />
    <Button startIcon={<Refresh />} disabled={busy} onClick={() => { const first = { ...page, page: 0 }; setPage(first); load(first); }}>Load leads</Button>
    <Box sx={{ height: 440 }}><DataGrid rows={rows} getRowId={row => row._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={ids => setSelected(ids.slice(-1))} disableRowSelectionOnClick loading={busy} paginationMode="server" rowCount={total} paginationModel={page} onPaginationModelChange={value => { setPage(value); load(value); }} pageSizeOptions={[25, 50, 100]} slots={{ toolbar: GridToolbar }} /></Box>
    <Button variant="contained" disabled={busy || selected.length !== 1} onClick={() => onSelect(rows.find(row => row._id === selected[0]))}>Continue with selected lead</Button>
  </Stack>;
}
export default function Crm2ConfirmAdmissionPage() {
  const [step, setStep] = useState(0), [assignment, setAssignment] = useState(null), [automatic, setAutomatic] = useState(true), [form, setForm] = useState({ regno: '', semester: '1', section: 'A', regulation: '', password: '', meritpercentage: '' });
  const [admissionid, setAdmissionid] = useState(''), [data, setData] = useState(null), [selected, setSelected] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [temporary, setTemporary] = useState(''), [preview, setPreview] = useState('');
  const notify = (message, severity = 'success') => setNotice({ message, severity });
  const run = async fn => { setBusy(true); try { await fn(); } catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); } };
  const reload = async id => { const res = await ep1.get(`${root}/details`, { params: { ...scope(), admissionid: id || admissionid } }); setData(res.data); return res.data; };
  const admit = () => run(async () => {
    const res = await ep1.post(`${root}/admit`, { ...scope(), assignmentid: assignment._id, ...form, autoregnumber: automatic });
    setAdmissionid(res.data.admissionid); setTemporary(res.data.temporarypassword || '');
    const value = await reload(res.data.admissionid); setSelected([]); setStep(value.admission.scholarshipsdone ? 4 : value.admission.feesdone ? 3 : 2);
    notify(res.data.resumed ? 'Existing admission loaded' : `Student admitted: ${res.data.regno}`);
  });
  const apply = kind => run(async () => {
    const res = await ep1.post(`${root}/apply`, { ...scope(), admissionid, kind, ids: selected });
    await reload(); setSelected([]); setStep(kind === 'fees' ? 3 : 4); notify(`${res.data.saved} ${kind} entries applied`);
  });
  const print = () => run(async () => {
    const result = await ep1.get('/api/institution', { params: { colid: global1.colid } });
    const institution = Array.isArray(result.data) ? result.data[0] || {} : result.data?.data || result.data || {};
    setPreview(admissionPrint(data, institution));
  });
  return <MenuPageShell title="Confirm admission"><Stack spacing={3} sx={{ p: 3 }}>
    <Typography variant="h5">Confirm admission</Typography><Stepper activeStep={step} alternativeLabel sx={{ overflowX: 'auto' }}>{steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    {busy && <LinearProgress />}
    {step === 0 && <LeadSelection notify={notify} onSelect={value => { setAssignment(value); setStep(1); }} />}
    {assignment && <Typography fontWeight={600}>{assignment.lead?.name} | {assignment.academicyear} | {assignment.program} ({assignment.programcode})</Typography>}
    {step === 1 && <Stack spacing={2}>
      <FormControlLabel control={<Checkbox checked={automatic} onChange={event => setAutomatic(event.target.checked)} />} label="Auto-generate unique registration number" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>{Object.keys(form).map(field => <TextField key={field} label={({ regno: 'Registration no', password: 'Student password (blank: generate)', meritpercentage: 'Qualifying merit percentage (optional)' })[field] || field} type={field === 'password' ? 'password' : field === 'meritpercentage' ? 'number' : 'text'} inputProps={field === 'meritpercentage' ? { min: 0, max: 100, step: 'any' } : undefined} disabled={busy || (field === 'regno' && automatic)} value={form[field]} onChange={event => setForm(previous => ({ ...previous, [field]: event.target.value }))} />)}</Box>
      <Stack direction="row" gap={2}><Button disabled={busy} onClick={() => setStep(0)}>Back</Button><Button variant="contained" startIcon={<Save />} disabled={busy || (!automatic && !form.regno.trim())} onClick={admit}>Admit / resume admission</Button></Stack>
    </Stack>}
    {temporary && <Alert severity="warning" onClose={() => setTemporary('')}>Generated student password: {temporary}</Alert>}
    {(step === 2 || step === 3) && data && <Stack spacing={2}>
      {step === 3 && <Typography>Percentage scholarship base: {Number(data.scholarshipbase).toFixed(2)}</Typography>}
      {step === 3 && data.admission.meritpercentage == null && <Alert severity="info">Qualifying merit percentage is unavailable. Merit-based scholarships are excluded.</Alert>}
      {!data[step === 2 ? 'fees' : 'scholarships'].length && <Alert severity="info">No matching {step === 2 ? 'fees' : 'scholarships'} found.</Alert>}
      <ReadGrid rows={data[step === 2 ? 'fees' : 'scholarships']} selected={selected} onSelect={setSelected} busy={busy} />
      <Stack direction="row" gap={2}><Button disabled={busy} onClick={() => run(() => reload())}>Reload matches</Button><Button disabled={busy || !selected.length} variant="contained" onClick={() => apply(step === 2 ? 'fees' : 'scholarships')}>Apply selected {step === 2 ? 'fees' : 'scholarships'}</Button><Button disabled={busy} onClick={() => apply(step === 2 ? 'fees' : 'scholarships')}>{selected.length ? 'Apply and continue' : 'Continue without applying'}</Button></Stack>
    </Stack>}
    {step === 4 && data && <Stack spacing={2}>
      <Alert severity="success">Admission confirmed: {data.student.name} — {data.student.regno}</Alert>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>{['name', 'regno', 'email', 'phone', 'academicyear', 'program', 'programcode', 'semester', 'section', 'gender', 'category'].map(field => <Box key={field}><Typography variant="caption">{labels[field] || field}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>{data.student[field] || '-'}</Typography></Box>)}</Box>
      <ReadGrid rows={data.ledger} />
      <Typography>Ledger balance: {data.ledger.reduce((sum, row) => sum + Number(row.balance || 0), 0).toFixed(2)}</Typography>
      <Stack direction="row" gap={2}><Button disabled={busy} startIcon={<Print />} onClick={print}>Print preview</Button><Button disabled={busy} onClick={() => { setStep(0); setAssignment(null); setAdmissionid(''); setData(null); setTemporary(''); setForm({ regno: '', semester: '1', section: 'A', regulation: '', password: '', meritpercentage: '' }); }}>New admission</Button></Stack>
    </Stack>}
    <Dialog open={Boolean(preview)} fullWidth maxWidth="lg" onClose={() => setPreview('')}><DialogTitle>Admission confirmation<Stack direction="row" gap={1}><Button onClick={async () => { const frame = document.getElementById('admission-confirmation-print'); await Promise.all([...frame.contentDocument.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.onload = resolve; image.onerror = resolve; }))); frame.contentWindow.focus(); frame.contentWindow.print(); }}>Print</Button><Button onClick={() => setPreview('')}>Close</Button></Stack></DialogTitle><DialogContent sx={{ height: '75vh' }}><iframe id="admission-confirmation-print" title="Admission confirmation print preview" srcDoc={preview} style={{ border: 0, width: '100%', height: '100%' }} /></DialogContent></Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ zIndex: theme => theme.zIndex.modal + 200 }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
