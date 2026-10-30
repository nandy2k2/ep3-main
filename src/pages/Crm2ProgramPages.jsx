import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, LinearProgress, Paper, Snackbar, Stack, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { Add, Close, Delete, Edit, Save, AccountTree } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import MenuPageShell from './MenuPageShell';
import { addOption, handleAddOption } from './addableAutocompleteHelpers';
import ep1 from '../api/ep1';
import global1 from './global1';
import { useCrm2Dashboard } from './Crm2DashboardContext';
const root = '/api/v2/crm2-programs', crm = '/api/v2/crm2';
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const message = error => error.response?.data?.message || error.message;
const titles = { mapping: 'Counselor program mapping', assignment: 'Lead program assignment', my: 'Programwise leads' };
const label = row => row?.__addOption ? row.label : typeof row === 'string' ? row : row?.counselloremail ? `${row.counsellorname} - ${row.counselloremail}${row.location ? ` | ${row.location}` : ''}` : row?.programcode ? `${row.program} (${row.programcode})` : row?.email ? `${row.name} - ${row.email}` : row?.name || '';
function useEvent(fn) { const ref = useRef(fn); ref.current = fn; return useCallback((...args) => ref.current(...args), []); }
export function ProgramChoice({ title, endpoint, value, onChange, multiple = false, addPath, freeSolo = false, params = {}, disabled = false, api = ep1, optionLabel = label }) {
  const dashboard = useCrm2Dashboard();
  const [addPage, setAddPage] = useState(''), [addLoading, setAddLoading] = useState(false);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false), [search, setSearch] = useState(''), [options, setOptions] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const paramsKey = JSON.stringify(params);
  useEffect(() => {
    if (!open || disabled) return undefined;
    const controller = new AbortController(); setBusy(true); setError('');
    const timer = setTimeout(() => {
      api.get(endpoint, { params: { ...scope(), ...JSON.parse(paramsKey), ...(dashboard ? { dashboardyear: dashboard.academicyear, academicyear: dashboard.academicyear, token: global1.token } : {}), search, limit: 100 }, signal: controller.signal }).then(res => setOptions((res.data.data || []).map(row => typeof row === 'string' ? { name: row } : row))).catch(err => { if (!controller.signal.aborted) setError(message(err)); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, search, endpoint, paramsKey, disabled, api, dashboard]);
  return <><Autocomplete disabled={disabled} open={open && !disabled} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} multiple={multiple} disableCloseOnSelect={multiple} freeSolo={freeSolo} loading={busy} options={[...(addPath ? [addOption(`+ Add ${title}`, addPath)] : []), ...options]} value={value} getOptionLabel={optionLabel} isOptionEqualToValue={(a, b) => a._id && b._id ? a._id === b._id : optionLabel(a) === optionLabel(b)} onInputChange={(_, next, reason) => { if (reason === 'input' || reason === 'clear') setSearch(next); }} onChange={(_, next) => {
    const added = multiple ? next.find(row => row.__addOption) : next;
    if (dashboard && added?.__addOption) { setAddPage(added.path); setAddLoading(true); return; }
    if (handleAddOption(added, navigate)) return;
    onChange(next);
  }} renderOption={(props, option, state) => <li {...props}>{multiple && !option.__addOption && <Checkbox checked={state.selected} size="small" />}{optionLabel(option)}</li>} renderInput={input => <TextField {...input} label={title} size="small" error={Boolean(error)} helperText={error} InputProps={{ ...input.InputProps, endAdornment: <>{busy && <CircularProgress size={16} />}{input.InputProps.endAdornment}</> }} />} /><Dialog open={Boolean(addPage)} fullWidth maxWidth="xl" onClose={() => setAddPage('')}><DialogTitle>Add {title}<IconButton title="Close add page" sx={{ float: 'right' }} onClick={() => setAddPage('')}><Close /></IconButton></DialogTitle><DialogContent sx={{ height: '80vh', p: 0 }}>{addLoading && <LinearProgress />}{addPage && <iframe title={`Add ${title}`} onLoad={() => setAddLoading(false)} src={`${addPage}${addPage.includes('?') ? '&' : '?'}embedded=1&dashboardyear=${encodeURIComponent(dashboard?.academicyear || '')}`} style={{ width: '100%', height: '100%', border: 0 }} />}</DialogContent></Dialog></>;
}
const fields = ['name', 'email', 'phone', 'academicyear', 'source', 'pipeline', 'type', 'crmcategory', 'category', 'case', 'state', 'city', 'active', 'admissionstatus', 'agentname', 'admissionoffice'];
const masterFor = { source: 'source', pipeline: 'pipeline', type: 'type', crmcategory: 'category', case: 'case', agentname: 'agent', admissionoffice: 'admissionoffice' };
export function Filters({ filters, setFilters, mine }) {
  return <Stack spacing={1}>{filters.map((filter, i) => {
    const kind = masterFor[filter.field];
    return <Grid container spacing={1} key={i}><Grid item xs={12} md={4}><Autocomplete options={mine ? [...fields, 'program', 'programcode', 'location', 'followupdate'] : fields} value={filter.field} onChange={(_, field) => setFilters(previous => previous.map((row, n) => n === i ? { field: field || '', value: '' } : row))} renderInput={params => <TextField {...params} size="small" label="Filter field" />} /></Grid><Grid item xs={10} md={7}>
      {filter.field === 'followupdate' ? <TextField fullWidth size="small" type="date" label="Follow-up date" InputLabelProps={{ shrink: true }} value={filter.value} onChange={event => setFilters(previous => previous.map((row, n) => n === i ? { ...row, value: event.target.value } : row))} /> : <ProgramChoice title="Filter value" freeSolo endpoint={mine ? `${root}/filter-options` : kind ? `${crm}/masters/${kind}` : `${crm}/field-options`} params={mine || !kind ? { field: filter.field } : {}} addPath={kind ? `/crm2-${kind}-master` : undefined} value={filter.value ? { name: filter.value } : null} onChange={value => setFilters(previous => previous.map((row, n) => n === i ? { ...row, value: typeof value === 'string' ? value : value?.name || '' } : row))} />}
    </Grid><Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => setFilters(previous => previous.filter((_, n) => n !== i))}><Close /></IconButton></Grid></Grid>;
  })}<Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }} onClick={() => setFilters(previous => [...previous, { field: 'academicyear', value: '' }])}>Add filter</Button></Stack>;
}
function MappingForm({ edit, onSaved, notify }) {
  const [program, setProgram] = useState(null), [person, setPerson] = useState(null), [location, setLocation] = useState(''), [busy, setBusy] = useState(false);
  const [address, setAddress] = useState({ country: '', state: '', city: '' });
  useEffect(() => { setProgram(edit ? { program: edit.program, programcode: edit.programcode } : null); setPerson(edit ? { name: edit.counsellorname, email: edit.counselloremail } : null); setLocation(edit?.location || ''); setAddress({ country: edit?.country || '', state: edit?.state || '', city: edit?.city || '' }); }, [edit]);
  const save = async () => {
    setBusy(true);
    try { await ep1.post(`${root}/mappings/save`, { ...scope(), id: edit?._id, programcode: program.programcode, counselloremail: person.email, location, ...address }); setProgram(null); setPerson(null); setLocation(''); setAddress({ country: '', state: '', city: '' }); await onSaved(); notify('Mapping saved.', 'success'); }
    catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  };
  return <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
    <Grid item xs={12} md={6}><ProgramChoice title="Program" endpoint={`${root}/programs`} value={program} onChange={setProgram} addPath="/programmanagement" /></Grid>
    <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Program code" value={program?.programcode || ''} InputProps={{ readOnly: true }} /></Grid>
    <Grid item xs={12} md={6}><ProgramChoice title="Counselor" endpoint={`${crm}/counsellors`} value={person} onChange={setPerson} addPath="/mbuser" /></Grid>
    <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Counselor email" value={person?.email || ''} InputProps={{ readOnly: true }} /></Grid>
    {['country','state','city'].map(field => <Grid item xs={12} md={4} key={field}><ProgramChoice title={field[0].toUpperCase() + field.slice(1)} endpoint={`${crm}/config/address-options`} params={{ field, country: address.country, state: address.state }} value={address[field] ? { name: address[field] } : null} addPath="/crm2-address-master" disabled={field === 'state' ? !address.country : field === 'city' ? !address.country || !address.state : false} onChange={value => setAddress(previous => ({ ...previous, [field]: value?.name || '', ...(field === 'country' ? { state: '', city: '' } : field === 'state' ? { city: '' } : {}) }))} /></Grid>)}
    <Grid item xs={12}><TextField fullWidth size="small" label="Location (optional)" value={location} onChange={event => setLocation(event.target.value)} /></Grid>
    <Grid item xs={12}><Button startIcon={<Save />} variant="contained" disabled={busy || !program || !person} onClick={save}>{edit ? 'Update mapping' : 'Save mapping'}</Button></Grid>
  </Grid></Paper>;
}
function AssignPrograms({ leadids, onDone, notify }) {
  const [programs, setPrograms] = useState([]), [mappings, setMappings] = useState({}), [auto, setAuto] = useState(false), [busy, setBusy] = useState(false);
  const [year, setYear] = useState(null);
  const save = async () => {
    setBusy(true);
    try { const res = await ep1.post(`${root}/assign`, { ...scope(), academicyear: year.name, leadids, autoassign: auto, programs: programs.map(row => ({ programcode: row.programcode, mappingid: mappings[row.programcode]?._id })) }); onDone(res.data.saved); }
    catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ pt: 1 }}>
    <ProgramChoice title="Academic year" endpoint={`${root}/academic-years`} value={year} onChange={value => { setYear(value); setPrograms([]); setMappings({}); }} addPath="/programmanagement" disabled={busy} />
    <ProgramChoice key={year?.name || 'no-year'} title="Programs" multiple endpoint={`${root}/programs`} params={{ academicyear: year?.name }} disabled={!year || busy} value={programs} onChange={setPrograms} addPath="/programmanagement" />
    <FormControlLabel control={<Checkbox checked={auto} onChange={event => setAuto(event.target.checked)} />} label="Auto assign a mapped counselor for each program" />
    {!auto && programs.map(row => <Box key={row.programcode} sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, py: 1 }}><Typography fontWeight={600} sx={{ mb: 1 }}>{row.program} ({row.programcode})</Typography><ProgramChoice title={`Counselor for ${row.program}`} endpoint={`${root}/mappings`} params={{ programcode: row.programcode }} value={mappings[row.programcode] || null} onChange={value => setMappings(previous => ({ ...previous, [row.programcode]: value }))} addPath="/crm2-counselor-program-mapping" /></Box>)}
    {busy && <LinearProgress />}
    <Button startIcon={<Save />} variant="contained" disabled={busy || !year || !programs.length || (!auto && programs.some(row => !mappings[row.programcode]))} onClick={save}>Assign selected leads</Button>
  </Stack>;
}
export function LeadBulkActionDialog({ action, mode, ids, onClose, onSaved, notify }) {
  const dashboard = useCrm2Dashboard();
  const [program, setProgram] = useState(null), [mapping, setMapping] = useState(null), [chosenYear, setYear] = useState(null), [active, setActive] = useState('Yes'), [busy, setBusy] = useState(false);
  const year = dashboard ? { name: dashboard.academicyear } : chosenYear;
  const save = async () => {
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/bulk-action`, { ...scope(), ...(dashboard ? { dashboardyear: dashboard.academicyear, token: global1.token } : {}), mode, ids, action, active, academicyear: year?.name, programcode: program?.programcode, mappingid: mapping?._id });
      notify(`${res.data.saved} lead${res.data.saved === 1 ? '' : 's'} ${action === 'transfer' ? 'transferred' : `marked Active: ${active}`}.`, 'success');
      onClose(); onSaved();
    } catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  };
  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!busy) onClose(); }}><DialogTitle>{action === 'transfer' ? 'Transfer leads' : 'Change Active'} ({ids.length})</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    {action === 'transfer' ? <>
      {mode === 'master' && <ProgramChoice title="Academic year" endpoint={`${root}/academic-years`} value={year} onChange={value => { setYear(value); setProgram(null); setMapping(null); }} addPath="/programmanagement" disabled={busy || Boolean(dashboard)} />}
      <ProgramChoice title="Transfer program" endpoint={`${root}/programs`} params={mode === 'master' ? { academicyear: year?.name } : {}} value={program} onChange={value => { setProgram(value); setMapping(null); }} addPath="/programmanagement" disabled={busy || (mode === 'master' && !year)} />
      <TextField label="Program code" value={program?.programcode || ''} InputProps={{ readOnly: true }} />
      <ProgramChoice key={program?.programcode || 'none'} title="Transfer counselor" endpoint={`${root}/mappings`} params={{ programcode: program?.programcode }} value={mapping} onChange={setMapping} addPath="/crm2-counselor-program-mapping" disabled={!program || busy} />
      <TextField label="Counselor email" value={mapping?.counselloremail || ''} InputProps={{ readOnly: true }} />
    </> : <Autocomplete options={['Yes', 'No']} value={active} disabled={busy} onChange={(_, value) => setActive(value)} renderInput={params => <TextField {...params} label="Active" />} />}
    {busy && <LinearProgress />}
    <Stack direction="row" spacing={1}><Button variant="contained" disabled={busy || (action === 'transfer' ? !program || !mapping || (mode === 'master' && !year) : !active)} onClick={save}>Confirm {action === 'transfer' ? 'transfer' : 'Active update'}</Button><Button disabled={busy} onClick={onClose}>Cancel</Button></Stack>
  </Stack></DialogContent></Dialog>;
}
function LeadWorkspace({ assignment, onSaved, notify }) {
  const [admitted, setAdmitted] = useState(assignment.admitted ?? assignment.lead?.admitted ?? 'No');
  const [form, setForm] = useState({ pipeline: assignment.pipeline || '', case: assignment.case || '', followupdate: assignment.followupdate ? assignment.followupdate.slice(0, 10) : '', details: '', mode: '' }), [busy, setBusy] = useState(false), [history, setHistory] = useState(assignment.interactions || []);
  const patch = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const save = async () => {
    setBusy(true);
    try { const res = await ep1.post(`${root}/my-leads/save`, { ...scope(), id: assignment._id, ...form, admitted }); setHistory(res.data.data.interactions || []); patch('details', ''); onSaved(); notify('Program lead updated.', 'success'); }
    catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ pt: 1 }}><Typography fontWeight={600}>{assignment.lead?.name} - {assignment.program} ({assignment.programcode})</Typography><Typography>{assignment.lead?.email} | {assignment.lead?.phone}</Typography><Grid container spacing={2}>
    {['pipeline', 'case', 'mode'].map(field => { const kind = field === 'mode' ? 'interactionmode' : field; return <Grid item xs={12} md={4} key={field}><ProgramChoice title={field === 'mode' ? 'Interaction mode' : field === 'case' ? 'Case' : 'Pipeline stage'} endpoint={`${crm}/masters/${kind}`} addPath={`/crm2-${kind}-master`} value={form[field] ? { name: form[field] } : null} onChange={value => patch(field, value?.name || '')} /></Grid>; })}
    <Grid item xs={12} md={4}><TextField fullWidth size="small" type="date" label="Follow-up date" InputLabelProps={{ shrink: true }} value={form.followupdate} onChange={event => patch('followupdate', event.target.value)} /></Grid>
    <Grid item xs={12} md={4}><Autocomplete options={['Yes', 'No']} value={admitted} onChange={(_, value) => setAdmitted(value || 'No')} renderInput={params => <TextField {...params} label="Admitted" size="small" />} /></Grid>
    <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Interaction details" value={form.details} onChange={event => patch('details', event.target.value)} /></Grid>
  </Grid><Button variant="contained" startIcon={<Save />} disabled={busy || (Boolean(form.details.trim()) && !form.mode)} onClick={save}>Save changes / interaction</Button>
    <Typography variant="h6">Program interaction history</Typography>
    {[...history].reverse().map((row, i) => <Box key={row._id || i} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}><Typography variant="caption">{new Date(row.createdAt).toLocaleString()} | {row.mode} | {row.createdby}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{row.details}</Typography><Typography variant="body2">Pipeline: {row.pipeline || '-'} | Case: {row.case || '-'} | Follow-up: {row.followupdate?.slice(0, 10) || '-'}</Typography></Box>)}
  </Stack>;
}
function AssignedPrograms({ lead, onClose }) {
  const [rows, setRows] = useState([]), [busy, setBusy] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setRows([]); setError('');
    ep1.get(`${root}/lead-assignments/${lead._id}`, { params: scope(), signal: controller.signal }).then(res => { if (!controller.signal.aborted) setRows(res.data.data || []); }).catch(err => { if (!controller.signal.aborted) setError(message(err)); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [lead._id]);
  const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : '-';
  return <Dialog open fullWidth maxWidth="lg" onClose={onClose}><DialogTitle>Assigned programs - {lead.name}<IconButton title="Close assigned programs" sx={{ float: 'right' }} onClick={onClose}><Close /></IconButton></DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    <Typography>{lead.email} | {lead.phone}</Typography>
    {busy && <Box><LinearProgress /><Typography sx={{ mt: 1 }}>Loading assigned programs...</Typography></Box>}
    {error && <Alert severity="error">{error}</Alert>}
    {!busy && !error && !rows.length && <Alert severity="info">No programs have been assigned to this lead.</Alert>}
    {rows.map(row => <Paper key={row._id} variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 2 }}>{row.program} ({row.programcode})</Typography><Grid container spacing={2}>{[
      ['Academic year', row.academicyear], ['Counselor', row.counsellorname], ['Counselor email', row.counselloremail], ['Location', row.location], ['Pipeline', row.pipeline], ['Case', row.case], ['Follow-up date', row.followupdate?.slice(0, 10)], ['Assigned by', row.assignedby], ['Created', date(row.createdAt)], ['Updated by', row.updatedby], ['Last updated', date(row.updatedAt)]
    ].map(([title, value]) => <Grid item xs={12} sm={6} md={4} key={title}><Typography variant="caption" color="text.secondary">{title}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>{value || '-'}</Typography></Grid>)}</Grid><Typography sx={{ mt: 2, mb: 1 }} fontWeight={600}>Interaction history ({row.interactions?.length || 0})</Typography>{[...(row.interactions || [])].reverse().map((entry, index) => <Box key={entry._id || index} sx={{ py: 1, borderTop: '1px solid', borderColor: 'divider' }}><Typography variant="caption">{date(entry.createdAt)} | {entry.mode} | {entry.createdby}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{entry.details}</Typography><Typography variant="body2">Pipeline: {entry.pipeline || '-'} | Case: {entry.case || '-'} | Follow-up: {entry.followupdate?.slice(0, 10) || '-'}</Typography></Box>)}</Paper>)}
  </Stack></DialogContent></Dialog>;
}
const Results = React.memo(function Results({ mode, rows, selected, setSelected, total, page, onPage, busy, onOpen }) {
  const columns = useMemo(() => mode === 'mapping' ? [...['program', 'programcode', 'counsellorname', 'counselloremail', 'country', 'state', 'city', 'location'].map(field => ({ field, headerName: field, width: field.includes('email') ? 260 : 200 })), { field: 'edit', headerName: '', width: 90, renderCell: params => <Button startIcon={<Edit />} onClick={() => onOpen(params.row)}>Edit</Button> }] : [
    ...(mode === 'assignment' ? [{ field: 'assignedPrograms', headerName: 'Programs', width: 100, sortable: false, filterable: false, renderCell: params => <Tooltip title="View assigned programs and counselors"><IconButton aria-label={`View assigned programs for ${params.row.name}`} disabled={busy} onClick={event => { event.stopPropagation(); onOpen(params.row); }}><AccountTree /></IconButton></Tooltip> }] : []),
    ...['name', 'email', 'phone', 'academicyear', 'source', 'type', 'active'].map(field => ({ field, headerName: field, width: field === 'email' ? 250 : 180, valueGetter: params => mode === 'my' ? field === 'academicyear' ? params.row.academicyear || '' : params.row.lead?.[field] || '' : params.row[field] })),
    ...(mode === 'my' ? ['program', 'programcode', 'pipeline', 'case', 'followupdate', 'location'].map(field => ({ field, headerName: field, width: 180, renderCell: params => <span>{field === 'followupdate' ? params.value?.slice(0, 10) || '' : params.value}</span> })) : ['pipeline', 'crmcategory'].map(field => ({ field, headerName: field, width: 160 }))),
    { field: 'admitted', headerName: 'Admitted', width: 130, valueGetter: params => (mode === 'my' ? params.row.admitted ?? params.row.lead?.admitted : params.row.admitted) || 'No' },
    ...(mode === 'my' ? [{ field: 'open', headerName: '', width: 120, renderCell: params => <Button onClick={() => onOpen(params.row)}>Interactions</Button> }] : [])
  ], [mode, onOpen, busy]);
  return <Box sx={{ height: 520 }}><DataGrid rows={rows} getRowId={row => row._id} columns={columns} loading={busy} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} slots={{ toolbar: GridToolbar }} {...(mode === 'mapping' ? {} : { paginationMode: 'server', rowCount: total, paginationModel: page, onPaginationModelChange: onPage, pageSizeOptions: [25, 50, 100] })} /></Box>;
});
function Content({ mode }) {
  const [rows, setRows] = useState([]), [filters, setFilters] = useState([]), [search, setSearch] = useState(''), [selected, setSelected] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState({ page: 0, pageSize: 25 }), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [edit, setEdit] = useState(null), [assignOpen, setAssignOpen] = useState(false), [detail, setDetail] = useState(null);
  const [assignmentLead, setAssignmentLead] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const [activeTab, setActiveTab] = useState('Yes');
  const notify = useEvent((text, severity = 'success') => setNotice({ text, severity, id: Date.now() }));
  const load = useEvent(async (pagination = page, active = activeTab) => {
    setBusy(true);
    try {
      const url = mode === 'mapping' ? `${root}/mappings` : mode === 'my' ? `${root}/my-leads` : `${crm}/leads`;
      const res = await ep1.get(url, { params: { ...scope(), search, active: mode === 'my' ? active : undefined, filters: JSON.stringify(filters), limit: pagination.pageSize, skip: pagination.page * pagination.pageSize } }); setRows(res.data.data || []); setTotal(res.data.total || 0); setSelected([]);
    } catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  });
  useEffect(() => { if (mode === 'mapping') load(); }, [mode, load]);
  const onPage = useEvent(value => { setPage(value); load(value); });
  const open = useEvent(async row => {
    if (mode === 'mapping') { setEdit(row); return; }
    if (mode === 'assignment') { setAssignmentLead(row); return; }
    setBusy(true);
    try { const res = await ep1.get(`${root}/my-leads/${row._id}`, { params: scope() }); setDetail(res.data.data); }
    catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  });
  const remove = async () => {
    if (!window.confirm(`Delete ${selected.length} mappings? Existing lead assignments will remain.`)) return;
    setBusy(true);
    try { await ep1.post(`${root}/mappings/delete`, { ...scope(), ids: selected }); setEdit(null); await load(); notify('Mappings deleted.'); }
    catch (error) { notify(message(error), 'error'); } finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ p: 2 }}><Typography variant="h5">{titles[mode]}</Typography>
    {mode === 'mapping' && <><MappingForm edit={edit} notify={notify} onSaved={async () => { setEdit(null); await load(); }} /><Button sx={{ alignSelf: 'flex-start' }} startIcon={<Add />} onClick={() => setEdit(null)}>New mapping</Button></>}
    <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><TextField size="small" sx={{ minWidth: 260 }} label="Search" value={search} onChange={event => setSearch(event.target.value)} /><Button variant="contained" disabled={busy} onClick={() => { const first = { ...page, page: 0 }; setPage(first); load(first); }}>Load</Button>
    {mode === 'mapping' && <Button color="error" startIcon={<Delete />} disabled={busy || !selected.length} onClick={remove}>Delete selected</Button>}
    {mode === 'my' && <><Button disabled={busy || !selected.length} onClick={() => setBulkAction('transfer')}>Transfer leads</Button><Button disabled={busy || !selected.length} onClick={() => setBulkAction('active')}>Change Active</Button></>}
    {mode === 'assignment' && <Button disabled={busy || !selected.length} onClick={() => setAssignOpen(true)}>Select programs ({selected.length} leads)</Button>}</Stack>{mode !== 'mapping' && <Filters mine={mode === 'my'} filters={filters} setFilters={setFilters} />}</Stack></Paper>
    {busy && <LinearProgress />}
    {mode === 'my' && <Tabs value={activeTab} onChange={(_, value) => { setActiveTab(value); setSelected([]); setRows([]); setDetail(null); const first = { ...page, page: 0 }; setPage(first); load(first, value); }}><Tab value="Yes" label="Leads with Active Yes" disabled={busy} /><Tab value="No" label="Leads with Active No" disabled={busy} /></Tabs>}
    <Results mode={mode} rows={rows} selected={selected} setSelected={setSelected} total={total} page={page} onPage={onPage} busy={busy} onOpen={open} />
    <Dialog open={assignOpen} fullWidth maxWidth="md" onClose={() => setAssignOpen(false)}><DialogTitle>Assign programs<IconButton title="Close" sx={{ float: 'right' }} onClick={() => setAssignOpen(false)}><Close /></IconButton></DialogTitle><DialogContent><AssignPrograms leadids={selected} notify={notify} onDone={count => { setAssignOpen(false); notify(`Program assignment completed: ${count} lead/program assignment${count === 1 ? '' : 's'} saved.`, 'success'); load(); }} /></DialogContent></Dialog>
    {assignmentLead && <AssignedPrograms lead={assignmentLead} onClose={() => setAssignmentLead(null)} />}
    {bulkAction && <LeadBulkActionDialog action={bulkAction} mode="my" ids={selected} notify={notify} onClose={() => setBulkAction('')} onSaved={() => { setDetail(null); load(); }} />}
    <Dialog open={Boolean(detail)} fullWidth maxWidth="lg" onClose={() => setDetail(null)}><DialogTitle>Programwise lead<IconButton title="Close" sx={{ float: 'right' }} onClick={() => setDetail(null)}><Close /></IconButton></DialogTitle><DialogContent>{detail && <LeadWorkspace key={detail._id} assignment={detail} notify={notify} onSaved={() => load()} />}</DialogContent></Dialog>
    <Snackbar key={notice?.id} open={Boolean(notice)} autoHideDuration={7000} sx={{ zIndex: theme => theme.zIndex.modal + 200 }} onClose={(_, reason) => { if (reason !== 'clickaway') setNotice(null); }} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function Crm2ProgramPage({ mode }) { return <MenuPageShell title={titles[mode]}><Content key={mode} mode={mode} /></MenuPageShell>; }
