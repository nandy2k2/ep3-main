import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogContent, DialogTitle, LinearProgress, Paper, Snackbar, Stack, Step, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Add, CompareArrows, Refresh } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import MenuPageShell from './MenuPageShell';
import Crm2LeadFilterPanel, { emptyLeadFilters } from './Crm2LeadFilterPanel';
import ep1 from '../api/ep1';
import global1 from './global1';

const root = '/api/v2/crm2-merge-wizard';
const auth = () => ({ Authorization: `Bearer ${global1.token}` });
const get = (path, params, signal) => ep1.get(`${root}${path}`, { headers: auth(), params, signal }).then(response => response.data);
const loadLead = async id => { const { data, version } = await get(`/lead/${encodeURIComponent(id)}`); return { ...data, version }; };
const messageOf = err => err.response?.data?.message || err.message;
const firstPage = { page: 0, pageSize: 25 };
const gridSlots = { toolbar: GridToolbar };
const gridSizes = [25, 50, 100];
const getId = row => row._id;
const steps = ['First lead', 'Second lead', 'Compare and merge'];
const columns = [['name','Lead',185],['email','Email',235],['phone','Phone',160],['active','Active',105],['academicyear','Academic year',145],['pipeline','Pipeline',150],['leadgroup','Lead group',150]].map(([field, headerName, width]) => ({ field, headerName, width }));
const leadLabel = lead => `${lead.name || 'Unnamed lead'} (${String(lead._id).slice(-6)})`;
const stickyField = { position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' };

const PickerGrid = React.memo(function PickerGrid({ rows, page, setPage, total, onPick, disabled }) {
  const fields = useMemo(() => [{ field: 'select', headerName: 'Choose', width: 105, sortable: false, filterable: false, renderCell: ({ row }) => <Button size="small" disabled={disabled} onClick={() => onPick(row._id)}>Select</Button> }, ...columns], [onPick, disabled]);
  return <Box sx={{ height: 430 }}><DataGrid rows={rows} columns={fields} getRowId={getId} slots={gridSlots} paginationMode="server" rowCount={total} paginationModel={page} onPaginationModelChange={setPage} pageSizeOptions={gridSizes} loading={disabled} disableRowSelectionOnClick /></Box>;
});

function LeadPicker({ fields, excludedIds, onPick, busy, notify }) {
  const [draft, setDraft] = useState(emptyLeadFilters), [applied, setApplied] = useState(null), [page, setPage] = useState(firstPage);
  const [rows, setRows] = useState([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!applied) return undefined;
    const controller = new AbortController();
    setLoading(true);
    get('/leads', { ...applied, filters: JSON.stringify(applied.filters), exclude: [...excludedIds].join(','), limit: page.pageSize, skip: page.page * page.pageSize }, controller.signal).then(data => {
      if (!controller.signal.aborted) { setRows(data.data); setTotal(data.total); }
    }).catch(err => { if (!controller.signal.aborted) notify(messageOf(err), 'error'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied, excludedIds, notify, page]);
  return <Stack spacing={2}>
    <Crm2LeadFilterPanel value={draft} onChange={setDraft} academicyear="all" endpoint={root} fieldsOverride={fields} />
    <Button variant="outlined" disabled={loading || busy} sx={{ alignSelf: 'flex-start' }} onClick={() => { setPage(firstPage); setApplied({ ...draft }); }}>Load leads</Button>
    {applied && <PickerGrid rows={rows} page={page} setPage={setPage} total={total} onPick={onPick} disabled={loading || busy} />}
  </Stack>;
}

function display(value, type) {
  if (value === undefined || value === null || value === '' || Array.isArray(value) && !value.length) return '-';
  if (type === 'Date' && Number.isFinite(Date.parse(value))) return new Date(value).toLocaleString('en-IN');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

const ComparisonRow = React.memo(function ComparisonRow({ field, leads, selected, onChoose, busy }) {
  return <TableRow>
    <TableCell component="th" scope="row" sx={stickyField}>{field.label}{!field.editable && <Typography variant="caption" display="block" color="text.secondary">Protected</Typography>}</TableCell>
    {leads.map(lead => <TableCell key={lead._id} sx={{ verticalAlign: 'top', bgcolor: selected === lead._id ? 'action.selected' : undefined }}>
      <Stack direction="row" spacing={0.5} alignItems="flex-start">
        {field.editable && <Checkbox size="small" checked={selected === lead._id} disabled={busy} onChange={() => onChoose(field.field, lead._id)} inputProps={{ 'aria-label': `Keep ${field.label} from ${leadLabel(lead)}` }} sx={{ p: 0.5 }} />}
        <Box component="span" sx={{ minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 155, overflow: 'auto', py: 0.5 }}>{display(lead[field.field], field.type)}</Box>
      </Stack>
    </TableCell>)}
  </TableRow>;
});

function Comparison({ fields, leads, primary, choices, onPrimary, onChoose, onRemove, busy }) {
  return <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '66vh' }}>
    <Table stickyHeader size="small" aria-label="Lead comparison" sx={{ tableLayout: 'fixed', minWidth: 195 + 240 * leads.length }}>
      <TableHead><TableRow>
        <TableCell sx={{ ...stickyField, width: 195, zIndex: 3 }}>Field</TableCell>
        {leads.map(lead => <TableCell key={lead._id} sx={{ width: 240, bgcolor: 'background.paper' }}><Stack spacing={0.5}>
          <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{leadLabel(lead)}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" useFlexGap flexWrap="wrap">
            <Checkbox checked={primary === lead._id} disabled={busy} size="small" onChange={() => onPrimary(lead._id)} inputProps={{ 'aria-label': `Primary lead ${leadLabel(lead)}` }} sx={{ p: 0.5 }} />
            <Typography variant="body2">Primary</Typography>
            {leads.length > 2 && <Button size="small" color="error" disabled={busy} onClick={() => onRemove(lead._id)}>Remove</Button>}
          </Stack>
        </Stack></TableCell>)}
      </TableRow></TableHead>
      <TableBody>{fields.map(field => <ComparisonRow key={field.field} field={field} leads={leads} selected={field.editable ? choices[field.field] || primary : undefined} onChoose={onChoose} busy={busy} />)}</TableBody>
    </Table>
  </TableContainer>;
}

function MergeWizard() {
  const [fields, setFields] = useState([]), [limit, setLimit] = useState(25), [step, setStep] = useState(0);
  const [leads, setLeads] = useState([]), [primary, setPrimary] = useState(''), [choices, setChoices] = useState({});
  const [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [done, setDone] = useState(null), [notice, setNotice] = useState(null);
  const notify = useCallback((text, severity = 'success') => setNotice({ text, severity }), []);
  const filterFields = useMemo(() => fields.map(field => field.type === 'Array' ? { ...field, type: 'Mixed' } : field), [fields]);
  const excludedIds = useMemo(() => new Set(leads.map(lead => lead._id)), [leads]);
  useEffect(() => {
    const controller = new AbortController();
    get('/fields', {}, controller.signal).then(data => { if (!controller.signal.aborted) { setFields(data.data); setLimit(data.maxLeads); } }).catch(err => { if (!controller.signal.aborted) notify(messageOf(err), 'error'); });
    return () => controller.abort();
  }, [notify]);
  const pick = useCallback(async id => {
    if (busy || excludedIds.has(id) || leads.length >= limit) return;
    setBusy(true);
    try {
      const lead = await loadLead(id);
      setLeads(prev => [...prev, lead]);
      if (!leads.length) setPrimary(id);
      if (step < 2) setStep(step + 1);
      setAdding(false);
    } catch (err) { notify(messageOf(err), 'error'); }
    finally { setBusy(false); }
  }, [busy, excludedIds, leads.length, limit, notify, step]);
  const choose = useCallback((field, id) => setChoices(prev => ({ ...prev, [field]: id })), []);
  const reset = () => { setLeads([]); setPrimary(''); setChoices({}); setStep(0); setDone(null); };
  const remove = id => {
    const next = leads.filter(lead => lead._id !== id);
    setLeads(next);
    if (primary === id) setPrimary(next[0]._id);
    setChoices(prev => Object.fromEntries(Object.entries(prev).filter(([, source]) => source !== id)));
  };
  const refresh = async () => {
    setBusy(true);
    try { setLeads(await Promise.all(leads.map(lead => loadLead(lead._id)))); notify('Comparison refreshed'); }
    catch (err) { notify(messageOf(err), 'error'); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    if (!window.confirm(`Keep ${leads.find(lead => lead._id === primary)?.name} as primary and mark ${leads.length - 1} other lead(s) inactive?`)) return;
    setBusy(true);
    try {
      const { data } = await ep1.post(`${root}/merge`, { ids: leads.map(lead => lead._id), primaryId: primary, choices, versions: Object.fromEntries(leads.map(lead => [lead._id, lead.version])) }, { headers: auth() });
      setDone(data); notify(data.message);
    } catch (err) { notify(messageOf(err), 'error'); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ p: { xs: 1, md: 2 } }}>
    <Stepper activeStep={done ? steps.length : step} alternativeLabel>{steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    {busy && <LinearProgress />}
    {done ? <>
      <Alert severity="success">{done.message}</Alert>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button component="a" href={`/crm2-lead-editor?id=${encodeURIComponent(done.primaryId)}`}>Open primary lead</Button><Button onClick={reset}>Start another merge</Button></Stack>
    </> : step < 2 ? <>
      {step === 1 && <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center"><Button disabled={busy} onClick={reset}>Back</Button><Typography>First lead: {leadLabel(leads[0])}</Typography></Stack>}
      {!!fields.length && <LeadPicker key={step} fields={filterFields} excludedIds={excludedIds} onPick={pick} busy={busy} notify={notify} />}
    </> : <>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        <Button startIcon={<Add />} disabled={busy || leads.length >= limit} onClick={() => setAdding(true)}>Add another lead</Button>
        <Button startIcon={<Refresh />} disabled={busy} onClick={refresh}>Refresh comparison</Button>
        <Button disabled={busy} onClick={reset}>Start over</Button>
        <Button startIcon={<CompareArrows />} variant="contained" disabled={busy || !primary} onClick={submit}>Merge selected leads</Button>
      </Stack>
      <Comparison fields={fields} leads={leads} primary={primary} choices={choices} onPrimary={setPrimary} onChoose={choose} onRemove={remove} busy={busy} />
    </>}
    <Dialog open={adding} onClose={() => !busy && setAdding(false)} fullWidth maxWidth="xl"><DialogTitle>Add another lead <Button sx={{ float: 'right' }} disabled={busy} onClick={() => setAdding(false)}>Close</Button></DialogTitle><DialogContent dividers>{adding && <LeadPicker fields={filterFields} excludedIds={excludedIds} onPick={pick} busy={busy} notify={notify} />}</DialogContent></Dialog>
    <Snackbar open={!!notice} autoHideDuration={7500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ zIndex: theme => theme.zIndex.modal + 1 }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}

export default function Crm2MergeLeadWizard() {
  return <MenuPageShell title="Merge lead wizard"><MergeWizard /></MenuPageShell>;
}
