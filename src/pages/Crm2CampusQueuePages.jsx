import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Add, ContentCopy, Edit, Fullscreen, Refresh, Save } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';

const root = '/api/v2/crm2-campus-queue';
const headers = () => ({ Authorization: `Bearer ${global1.token}` });
const lookup = { get: (url, options) => ep1.get(url, { ...options, headers: headers() }) };
const get = (path, params, signal) => lookup.get(root + path, { params, signal }).then(response => response.data);
const post = (path, body) => ep1.post(root + path, body, { headers: headers() }).then(response => response.data);
const labelLevel = row => `${row.program} (${row.programcode}) · Level ${row.level}: ${row.title}`;
const errorOf = err => err.response?.data?.message || err.message;
const idOf = row => row._id;
const slots = { toolbar: GridToolbar };
const dateLabel = { shrink: true };
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const field = (key, headerName, width = 140) => ({ field: key, headerName, width });
const levelEqual = (a, b) => a._id === b._id;
function Toast({ notice, clear }) {
  return <Snackbar open={!!notice} autoHideDuration={6500} onClose={clear} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={clear}>{notice?.text}</Alert></Snackbar>;
}
function ProgramSelect({ value, onChange }) {
  return <ProgramChoice title="Program" endpoint={`${root}/programs`} api={lookup} value={value} onChange={onChange} />;
}
function LevelSelect({ levels, value, onChange, disabled }) {
  return <Autocomplete options={levels} value={value} disabled={disabled} onChange={(_, row) => onChange(row)} isOptionEqualToValue={levelEqual} getOptionLabel={labelLevel} renderInput={params => <TextField {...params} size="small" label="Queue level" />} />;
}
const Grid = React.memo(function QueueGrid({ rows, columns, loading }) {
  return <Box sx={{ height: 520 }}><DataGrid rows={rows} columns={columns} getRowId={idOf} loading={loading} slots={slots} slotProps={{ toolbar: { showQuickFilter: true } }} disableRowSelectionOnClick /></Box>;
});
function CounterEditor({ record, levels, onClose, onSaved }) {
  const [level, setLevel] = useState(levels.find(row => row._id === record.levelid) || null);
  const [number, setNumber] = useState(record.number || ''), [active, setActive] = useState(record.active || 'Yes'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const save = async event => {
    event.preventDefault();
    if (!level || !number.trim() || busy) return;
    setBusy(true); setError('');
    try { await post('/counter-master', { id: record._id, levelid: level._id, number, active }); onSaved(); }
    catch (err) { setError(errorOf(err)); }
    finally { setBusy(false); }
  };
  return <Dialog open fullWidth maxWidth="sm" onClose={busy ? undefined : onClose}><Box component="form" onSubmit={save}>
    <DialogTitle>{record._id ? 'Edit counter' : 'Add counter'}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}
      <LevelSelect levels={levels} value={level} onChange={setLevel} disabled={busy || !!record._id} />
      <TextField label="Counter number" value={number} inputProps={{ maxLength: 30 }} onChange={event => setNumber(event.target.value)} disabled={busy} />
      <TextField select label="Active" value={active} onChange={event => setActive(event.target.value)} disabled={busy}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField>
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" startIcon={<Save />} disabled={busy || !level || !number.trim()}>Save</Button></DialogActions>
  </Box></Dialog>;
}
function CounterMaster() {
  const [data, setData] = useState({ levels: [], counters: [] }), [record, setRecord] = useState(null), [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    get('/counter-master', {}, controller.signal).then(result => { if (!controller.signal.aborted) setData(result); }).catch(err => { if (!controller.signal.aborted) setNotice({ text: errorOf(err), severity: 'error' }); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const rows = React.useMemo(() => {
    const byId = new Map(data.levels.map(level => [level._id, level]));
    return data.counters.map(counter => ({ ...counter, program: byId.get(counter.levelid)?.program, level: byId.get(counter.levelid)?.level, title: byId.get(counter.levelid)?.title }));
  }, [data]);
  const columns = React.useMemo(() => [{ field: 'edit', headerName: 'Actions', width: 110, sortable: false, filterable: false, renderCell: ({ row }) => <Button size="small" startIcon={<Edit />} onClick={() => setRecord(row)}>Edit</Button> }, field('program', 'Program', 190), field('level', 'Level'), field('title', 'Level title', 190), field('number', 'Counter number'), field('active', 'Active')], []);
  return <Stack spacing={2}><Stack direction="row" spacing={1}><Button startIcon={<Add />} variant="contained" disabled={!data.levels.length} onClick={() => setRecord({})}>Add counter</Button><Button startIcon={<Refresh />} disabled={loading} onClick={() => setRevision(n => n + 1)}>Refresh</Button></Stack>
    {!loading && !data.levels.length && <Alert severity="info">No program hierarchy levels are configured.</Alert>}
    <Grid rows={rows} columns={columns} loading={loading} />
    {record && <CounterEditor record={record} levels={data.levels} onClose={() => setRecord(null)} onSaved={() => { setRecord(null); setRevision(n => n + 1); setNotice({ text: 'Counter saved' }); }} />}
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}
function MyQueue({ booking }) {
  const [levels, setLevels] = useState([]), [level, setLevel] = useState(null), [day, setDay] = useState(today);
  const [data, setData] = useState([]), [counter, setCounter] = useState(null), [current, setCurrent] = useState(null);
  const [savedCounter, setSavedCounter] = useState(null), [bookingLoaded, setBookingLoaded] = useState(false);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [notice, setNotice] = useState(null), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    get('/my-levels', {}, controller.signal).then(result => {
      if (!controller.signal.aborted) { setLevels(result.data); if (result.data.length === 1) setLevel(result.data[0]); }
    }).catch(err => { if (!controller.signal.aborted) setNotice({ text: errorOf(err), severity: 'error' }); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const levelid = level?._id;
  useEffect(() => {
    setData([]); setCounter(null); setCurrent(null); setSavedCounter(null); setBookingLoaded(false);
    if (!levelid || !day) return undefined;
    const controller = new AbortController();
    let timer;
    const load = async () => {
      try {
        const result = await get(booking ? '/counter-options' : '/my-queue', { levelid, day }, controller.signal);
        if (controller.signal.aborted) return;
        setData(result.data);
        if (booking) { setCurrent(result.current); setSavedCounter(result.savedCounter); setCounter(result.data.find(row => row._id === result.current) || null); setBookingLoaded(true); }
      } catch (err) { if (!controller.signal.aborted) setNotice({ text: errorOf(err), severity: 'error' }); }
      if (!booking && !controller.signal.aborted) timer = setTimeout(load, 5000);
    };
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [levelid, day, revision, booking]);
  const action = React.useCallback(async (row, verb) => {
    setBusy(true);
    try { const result = await post(`/tokens/${row._id}/${verb}`, {}); setNotice({ text: result.message }); }
    catch (err) { setNotice({ text: errorOf(err), severity: 'error' }); }
    finally { setBusy(false); setRevision(n => n + 1); }
  }, []);
  const columns = React.useMemo(() => [field('number', 'Token'), field('lead', 'Lead', 200), field('level', 'Level'), field('counter', 'Counter'), field('status', 'Status'), { field: 'action', headerName: 'Actions', width: 175, sortable: false, filterable: false, renderCell: ({ row }) => <Button disabled={busy} onClick={() => action(row, row.status === 'Waiting' ? 'claim' : 'complete')}>{row.status === 'Waiting' ? 'Claim token' : 'Mark complete'}</Button> }], [action, busy]);
  const save = async () => {
    setBusy(true);
    try { const result = await post('/book-counter', { levelid, day, counterid: counter._id }); setNotice({ text: result.message }); setRevision(n => n + 1); }
    catch (err) { setNotice({ text: errorOf(err), severity: 'error' }); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2}>
    {loading && <LinearProgress />}
    {!loading && !levels.length && <Alert severity="info">No active queue levels are assigned to you.</Alert>}
    <LevelSelect levels={levels} value={level} onChange={setLevel} disabled={busy} />
    <TextField type="date" label="Date" value={day} disabled={busy} onChange={event => setDay(event.target.value)} InputLabelProps={dateLabel} inputProps={booking ? { min: today() } : undefined} sx={{ maxWidth: 250 }} />
    {booking ? <>
      {bookingLoaded && <Alert severity={savedCounter?.active === 'No' ? 'warning' : current ? 'success' : 'info'}>{current ? `Saved counter: ${savedCounter?.number || 'Unavailable'}${savedCounter?.active === 'No' ? ' (inactive)' : ''}` : 'No counter booked for this date and level.'}</Alert>}
      <Autocomplete options={data} value={counter} disabled={!level || !day || busy} isOptionEqualToValue={levelEqual} getOptionLabel={row => row.number} onChange={(_, row) => setCounter(row)} renderInput={params => <TextField {...params} label="Available counter" />} />
      <Button variant="contained" startIcon={<Save />} sx={{ alignSelf: 'flex-start' }} disabled={busy || !counter || counter._id === current || day < today()} onClick={save}>Save counter</Button>
    </> : <><Button startIcon={<Refresh />} disabled={busy || !level || !day} sx={{ alignSelf: 'flex-start' }} onClick={() => setRevision(n => n + 1)}>Refresh</Button><Grid rows={data} columns={columns} loading={busy} /></>}
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}
function IssueToken() {
  const [program, setProgram] = useState(null), [lead, setLead] = useState(null), [token, setToken] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const issue = async () => {
    setBusy(true); setToken(null);
    try { const result = await post('/tokens', { programcode: program.programcode, leadid: lead._id }); setToken(result.data); setNotice({ text: result.existing ? 'This lead already has a token today' : 'Token generated' }); }
    catch (err) { setNotice({ text: errorOf(err), severity: 'error' }); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2}>
    <ProgramSelect value={program} onChange={value => { setProgram(value); setToken(null); }} />
    <ProgramChoice title="Lead" endpoint={`${root}/leads`} api={lookup} value={lead} onChange={value => { setLead(value); setToken(null); }} />
    <Button variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={busy || !lead || !program} onClick={issue}>Generate token</Button>
    {busy && <LinearProgress />}
    {token && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h5">Token {token.number}</Typography><Typography>{token.program} · Level {token.level} · {token.status}</Typography></Paper>}
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}
function DisplayLink() {
  const [program, setProgram] = useState(null), [url, setUrl] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const create = async () => {
    setBusy(true);
    try { const data = await post('/display-link', { programcode: program.programcode }); setUrl(`${window.location.origin}/crm2-campus-queue-screen?${new URLSearchParams(data)}`); }
    catch (err) { setNotice({ text: errorOf(err), severity: 'error' }); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setNotice({ text: 'Display link copied' }); }
    catch { setNotice({ text: 'Select the link field and copy it manually', severity: 'warning' }); }
  };
  return <Stack spacing={2}><ProgramSelect value={program} onChange={value => { setProgram(value); setUrl(''); }} />
    <Button variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={!program || busy} onClick={create}>Generate display link</Button>
    {url && <><TextField label="Display link" value={url} fullWidth InputProps={{ readOnly: true }} /><Typography variant="caption" color="text.secondary">Link expires in 30 days.</Typography><Stack direction="row" spacing={1}><Button startIcon={<ContentCopy />} onClick={copy}>Copy link</Button><Button component="a" href={url} target="_blank" rel="noreferrer">Open display</Button></Stack></>}
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}
export function CampusQueueScreen() {
  const [params] = useSearchParams(), colid = params.get('colid'), programcode = params.get('programcode'), permission = params.get('permission');
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    if (!colid || !programcode || !permission) { setError('A valid display link is required.'); return undefined; }
    let timer;
    const load = async () => {
      let retry = true;
      try {
        const response = await ep1.get(`${root}/public-display`, { params: { colid, programcode }, headers: { Authorization: `Bearer ${permission}` }, signal: controller.signal });
        if (!controller.signal.aborted) { setData(response.data); setError(''); }
      } catch (err) {
        if (!controller.signal.aborted) setError(errorOf(err));
        if (err.response?.status === 403) { retry = false; setData(null); }
      }
      if (!controller.signal.aborted && retry) timer = setTimeout(load, 5000);
    };
    load(); return () => { controller.abort(); clearTimeout(timer); };
  }, [colid, programcode, permission]);
  return <Stack spacing={2} sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 1, md: 4 } }}>
    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center"><Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>{data?.program || 'Campus queue'}</Typography><Button startIcon={<Fullscreen />} onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}>Full screen</Button></Stack>
    {error && <Alert severity="error">{error}</Alert>}
    {!data && !error && <LinearProgress />}
    {data && <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table aria-label="Campus queue"><TableHead><TableRow>{['Token number','Level','Counter number','Status'].map(label => <TableCell key={label} sx={{ fontSize: 20, fontWeight: 700 }}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
      {data.data.map(row => <TableRow key={row.number}><TableCell sx={{ fontSize: 28, fontWeight: 700 }}>{row.number}</TableCell><TableCell sx={{ fontSize: 20 }}>{row.level} · {row.title}</TableCell><TableCell sx={{ fontSize: 20 }}>{row.counter || '-'}</TableCell><TableCell sx={{ fontSize: 20 }}>{row.status}</TableCell></TableRow>)}
      {!data.data.length && <TableRow><TableCell colSpan={4}>No tokens in the queue.</TableCell></TableRow>}
    </TableBody></Table></Paper>}
  </Stack>;
}
const adminColumns = [field('program', 'Program', 205), field('programcode', 'Program code'), { ...field('level', 'Level', 90), type: 'number' }, field('title', 'Level title', 190), field('counter', 'Counter'), field('user', 'Counsellor', 190), field('email', 'Email', 230)];
function CounterAdmin() {
  const [day, setDay] = useState(today), [report, setReport] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const load = async () => {
    setBusy(true);
    try { setReport(await get('/counter-admin', { day })); }
    catch (err) { setNotice({ text: errorOf(err), severity: 'error' }); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2}>
    <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} alignItems="center">
      <TextField type="date" label="Booking date" value={day} onChange={event => setDay(event.target.value)} InputLabelProps={dateLabel} />
      <Button variant="contained" disabled={!day || busy} onClick={load}>Load bookings</Button>
    </Stack>
    {busy && <LinearProgress />}
    {report && <><Typography>{report.day} · {report.data.length} bookings</Typography><Grid rows={report.data} columns={adminColumns} loading={busy} /></>}
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}
const titles = { counters: 'Queue counter master', booking: 'Select queue counter', issue: 'Campus queue', counselor: 'Queue counsellor', display: 'Campus queue display', admin: 'Queue counter admin' };
export default function Crm2CampusQueuePage({ mode }) {
  return <MenuPageShell title={titles[mode]}><Box sx={{ p: { xs: 1, md: 2 } }}>
    {mode === 'counters' ? <CounterMaster /> : mode === 'admin' ? <CounterAdmin /> : mode === 'booking' || mode === 'counselor' ? <MyQueue key={mode} booking={mode === 'booking'} /> : mode === 'issue' ? <IssueToken /> : <DisplayLink />}
  </Box></MenuPageShell>;
}
