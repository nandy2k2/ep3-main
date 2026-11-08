import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Dialog, DialogContent, DialogTitle, Grid, LinearProgress, MenuItem, Paper, Snackbar, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { Add, Send } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import MenuPageShell from './MenuPageShell';
import Crm2LeadFilterPanel, { emptyLeadFilters } from './Crm2LeadFilterPanel';
import { campaignAuth, campaignDate, campaignRoot as root, campaignRowId, campaignSlots, deliveryColumns } from './Crm2CampaignHistory';

const messageOf = err => err.response?.data?.message || err.message;
const get = (path, params, signal) => ep1.get(`${root}${path}`, { ...campaignAuth(), params, signal }).then(response => response.data);
const post = (path, data) => ep1.post(`${root}${path}`, data, campaignAuth()).then(response => response.data);
const textColumn = (field, headerName, width = 150) => ({ field, headerName, width });
const leadColumns = [textColumn('name', 'Lead', 180), textColumn('email', 'Email', 220), textColumn('phone', 'Phone'), textColumn('pipeline', 'Pipeline'), textColumn('leadgroup', 'Lead group'), textColumn('academicyear', 'Academic year'), textColumn('addedby', 'Creation mode'), textColumn('counsellorname', 'Counsellor', 175)];
const steps = ['Campaign', 'Recipients', 'Compose and send'];
const emptyPage = { page: 0, pageSize: 25 };
const pageSizes = [25, 50, 100];
const dateTimeProps = { shrink: true };
const ranges = (from, to) => ({ from: from ? new Date(from).toISOString() : undefined, to: to ? new Date(to).toISOString() : undefined });
const optionEqual = (a, b) => a._id === b._id;
const nameLabel = row => row.name || '';
const campaignLabel = row => row.owner ? `${row.name} (${row.owner})` : row.name;
const sameSelection = (a, b) => a.length === b.length && a.every((id, index) => id === b[index]);

function Toast({ notice, clear }) {
  return <Snackbar open={!!notice} autoHideDuration={8500} onClose={clear} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={clear}>{notice?.text}</Alert></Snackbar>;
}
const Choice = ({ label, options, value, onChange, getLabel = nameLabel, disabled }) => <Autocomplete disabled={disabled} options={options} value={value} onChange={(_, row) => onChange(row)} isOptionEqualToValue={optionEqual} getOptionLabel={getLabel} renderInput={params => <TextField {...params} size="small" label={label} />} />;

const LeadGrid = React.memo(function LeadGrid({ rows, selected, onSelection, busy, page, setPage, total }) {
  return <Box sx={{ height: 400 }}><DataGrid rows={rows} getRowId={campaignRowId} columns={leadColumns} slots={campaignSlots} checkboxSelection disableRowSelectionOnClick loading={busy} rowSelectionModel={selected} onRowSelectionModelChange={onSelection} keepNonExistentRowsSelected={!!page} pageSizeOptions={pageSizes} {...(page ? { paginationMode: 'server', rowCount: total, paginationModel: page, onPaginationModelChange: setPage } : {})} /></Box>;
});

function CampaignChoice({ campaigns, value, onChange, onCreated, notify }) {
  const [form, setForm] = useState(null), [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try { const { data } = await post('/', form); onCreated(data); setForm(null); notify('Campaign created'); }
    catch (err) { notify(messageOf(err), 'error'); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2}>
    <Choice label="Campaign" options={campaigns} value={value} onChange={onChange} getLabel={campaignLabel} />
    <Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }} onClick={() => setForm({ name: '', description: '' })}>Create campaign</Button>
    <Dialog open={!!form} onClose={() => !busy && setForm(null)} fullWidth maxWidth="sm"><DialogTitle>Create campaign</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <TextField label="Campaign name" value={form?.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} inputProps={{ maxLength: 150 }} />
      <TextField label="Description" multiline minRows={3} value={form?.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
      <Button variant="contained" disabled={busy || !form?.name.trim()} onClick={create}>Create</Button>
    </Stack></DialogContent></Dialog>
  </Stack>;
}

function RecipientStep({ campaign, selected, onSelect, notify }) {
  const [draft, setDraft] = useState(emptyLeadFilters), [applied, setApplied] = useState(emptyLeadFilters), [page, setPage] = useState(emptyPage);
  const [members, setMembers] = useState([]), [rows, setRows] = useState([]), [total, setTotal] = useState(0), [addIds, setAddIds] = useState([]);
  const [loaded, setLoaded] = useState(0), [busy, setBusy] = useState(false), [saving, setSaving] = useState(false);
  const loadMembers = useCallback(async signal => {
    const { data } = await get(`/${campaign}/members`, {}, signal);
    if (!signal?.aborted) setMembers(data);
  }, [campaign]);
  useEffect(() => {
    const controller = new AbortController();
    loadMembers(controller.signal).catch(err => { if (!controller.signal.aborted) notify(messageOf(err), 'error'); });
    return () => controller.abort();
  }, [loadMembers, notify]);
  useEffect(() => {
    if (!loaded) return undefined;
    const controller = new AbortController();
    setBusy(true);
    get('/leads', { ...applied, filters: JSON.stringify(applied.filters), limit: page.pageSize, skip: page.page * page.pageSize }, controller.signal).then(data => {
      if (!controller.signal.aborted) { setRows(data.data); setTotal(data.total); }
    }).catch(err => { if (!controller.signal.aborted) notify(messageOf(err), 'error'); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [applied, loaded, notify, page]);
  const add = async () => {
    setSaving(true);
    try { const result = await post(`/${campaign}/members`, { ids: addIds }); await loadMembers(); setAddIds([]); notify(`${result.added} lead(s) added`); }
    catch (err) { notify(messageOf(err), 'error'); }
    finally { setSaving(false); }
  };
  return <Stack spacing={2}>
    <Typography variant="h6">Find leads</Typography>
    <Crm2LeadFilterPanel value={draft} onChange={setDraft} academicyear="all" endpoint={root} />
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      <Button variant="outlined" disabled={busy} onClick={() => { setApplied(draft); setPage(emptyPage); setAddIds([]); setLoaded(n => n + 1); }}>Load leads</Button>
      <Button startIcon={<Add />} disabled={saving || !addIds.length} onClick={add}>Add selected to campaign ({addIds.length})</Button>
    </Stack>
    {loaded > 0 && <LeadGrid rows={rows} selected={addIds} onSelection={setAddIds} busy={busy} page={page} setPage={setPage} total={total} />}
    <Typography variant="h6">Campaign members ({members.length})</Typography>
    <LeadGrid rows={members} selected={selected} onSelection={onSelect} busy={saving} />
  </Stack>;
}

function ComposeStep({ campaign, selected, notify, onSent, busy, onBusy }) {
  const [options, setOptions] = useState(null), [mode, setMode] = useState('Email'), [mailType, setMailType] = useState('legacy');
  const [config, setConfig] = useState(null), [template, setTemplate] = useState(null), [language, setLanguage] = useState('en'), [values, setValues] = useState([]);
  const [subject, setSubject] = useState(''), [message, setMessage] = useState(''), [header, setHeader] = useState({ type: '', value: '' });
  const [master, setMaster] = useState(null), [reload, setReload] = useState(0);
  const sending = useRef(false), request = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    get('/send-options', {}, controller.signal).then(data => { if (!controller.signal.aborted) setOptions(data); }).catch(err => { if (!controller.signal.aborted) notify(messageOf(err), 'error'); });
    return () => controller.abort();
  }, [notify, reload]);
  const configPath = mode === 'WhatsApp' ? '/ping-whatsapp-configuration' : mailType === 'legacy' ? '/emailconfiguration' : '/email-settings';
  const configOptions = mode === 'WhatsApp' ? options?.whatsapp.configs : options?.[mailType];
  const openChoice = (row, set, path, title) => row?._id === 'add' ? setMaster({ path, title }) : set(row);
  const submit = async () => {
    if (sending.current) return;
    if (!request.current && !window.confirm(`Send ${mode} to ${selected.length} selected lead(s)?`)) return;
    sending.current = true; onBusy(true);
    try {
      const payload = request.current || { ids: selected, requestId: Array.from(window.crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join(''), mode, configid: config._id, mailType, subject, message, templateid: template?._id, language, values, header };
      request.current = payload;
      const result = await post(`/${campaign}/send`, payload);
      if (result.status !== 'Completed') { notify('This send is still processing. Check the report before sending again.', 'warning'); return; }
      request.current = null;
      notify(`${result.sent} sent, ${result.failed} failed, ${result.unknown} unconfirmed`, result.failed || result.unknown ? 'warning' : 'success');
      onSent();
    } catch (err) {
      if (err.response?.status >= 400 && err.response.status < 500 && !/already exists/i.test(messageOf(err))) request.current = null;
      notify(request.current ? 'Send could not be confirmed. Check the campaign report before retrying.' : messageOf(err), 'error');
    } finally { sending.current = false; onBusy(false); }
  };
  const valid = config && (mode === 'Email' ? subject.trim() && message.trim() : template && language.trim() && values.every(value => value.trim()) && (!header.type || header.value.trim()));
  return <Stack spacing={2}>
    {(!options || busy) && <LinearProgress />}
    <Typography variant="h6">{selected.length} selected recipients</Typography>
    <TextField select size="small" label="Channel" value={mode} disabled={busy} onChange={e => { setMode(e.target.value); setConfig(null); }}><MenuItem value="Email">Email</MenuItem><MenuItem value="WhatsApp">WhatsApp (Ping)</MenuItem></TextField>
    {mode === 'Email' && <TextField select size="small" label="Email configuration type" value={mailType} disabled={busy} onChange={e => { setMailType(e.target.value); setConfig(null); }}><MenuItem value="legacy">Existing email / Gmail</MenuItem><MenuItem value="smtp">Email Settings SMTP</MenuItem></TextField>}
    <Choice disabled={busy} label={mode === 'Email' ? 'Email configuration' : 'Ping configuration'} options={[{ _id: 'add', name: '+ Add configuration' }, ...(configOptions || [])]} value={config} onChange={row => openChoice(row, setConfig, configPath, 'Add configuration')} getLabel={row => row.name || row.username || row.phoneid || ''} />
    {mode === 'Email' ? <>
      <TextField label="Subject" value={subject} disabled={busy} onChange={e => setSubject(e.target.value)} inputProps={{ maxLength: 250 }} />
      <TextField label="Message" multiline minRows={6} value={message} disabled={busy} onChange={e => setMessage(e.target.value)} inputProps={{ maxLength: 30000 }} />
      {options && !options.trackingEnabled && <Alert severity="warning">Email tracking is not configured for this institution.</Alert>}
    </> : <>
      <Typography variant="body2">Available WhatsApp credits: {options?.whatsapp.balance ?? '-'}</Typography>
      <Choice label="Ping template" options={[{ _id: 'add', templatename: '+ Add template' }, ...(options?.whatsapp.templates || [])]} value={template} disabled={busy} getLabel={row => row.templatecode ? `${row.templatename} (${row.templatecode})` : row.templatename} onChange={row => openChoice(row, next => { setTemplate(next); setValues(Array.from({ length: Number(next?.noofvariables) || 0 }, () => '')); }, '/whatsapp-templates', 'Add WhatsApp template')} />
      <TextField label="Language code" size="small" value={language} disabled={busy} onChange={e => setLanguage(e.target.value)} />
      {values.map((value, index) => <TextField key={index} label={String(template?.variablenames || '').split(',')[index]?.trim() || `Variable ${index + 1}`} value={value} disabled={busy} onChange={e => { const next = e.target.value; setValues(prev => prev.map((item, i) => i === index ? next : item)); }} />)}
      <TextField select size="small" label="Template header" value={header.type} disabled={busy} onChange={e => setHeader({ type: e.target.value, value: '' })}><MenuItem value="">None</MenuItem>{['text','image','video','document'].map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField>
      {header.type && <TextField label={header.type === 'text' ? 'Header text' : 'Header URL'} value={header.value} disabled={busy} onChange={e => setHeader({ ...header, value: e.target.value })} />}
    </>}
    <Button sx={{ alignSelf: 'flex-start' }} variant="contained" startIcon={<Send />} disabled={busy || !valid || !selected.length} onClick={submit}>Send message</Button>
    <Dialog open={!!master} fullWidth maxWidth="lg" onClose={() => { setMaster(null); setReload(n => n + 1); }}><DialogTitle>{master?.title}<Button sx={{ float: 'right' }} onClick={() => { setMaster(null); setReload(n => n + 1); }}>Close</Button></DialogTitle><DialogContent sx={{ height: '72vh' }}>{master && <iframe title={master.title} src={`${master.path}?embedded=1`} style={{ width: '100%', height: '100%', border: 0 }} />}</DialogContent></Dialog>
  </Stack>;
}

function CampaignWizard({ counsellor }) {
  const [campaigns, setCampaigns] = useState([]), [campaign, setCampaign] = useState(null), [step, setStep] = useState(0), [selected, setSelected] = useState([]), [notice, setNotice] = useState(null), [busy, setBusy] = useState(false);
  const notify = useCallback((text, severity = 'success') => setNotice({ text, severity }), []);
  useEffect(() => {
    const controller = new AbortController();
    get('/', {}, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setCampaigns(data); }).catch(err => { if (!controller.signal.aborted) notify(messageOf(err), 'error'); });
    return () => controller.abort();
  }, [notify]);
  const choose = row => { setCampaign(row); setSelected([]); };
  const onSelection = useCallback(ids => setSelected(prev => sameSelection(prev, ids) ? prev : ids), []);
  return <Stack spacing={3}>
    <Stepper activeStep={step} alternativeLabel>{steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    {step === 0 && <CampaignChoice campaigns={campaigns} value={campaign} onChange={choose} notify={notify} onCreated={row => { setCampaigns(prev => [row, ...prev]); choose(row); }} />}
    {step === 1 && <RecipientStep key={campaign._id} campaign={campaign._id} selected={selected} onSelect={onSelection} notify={notify} />}
    {step === 2 && <ComposeStep campaign={campaign._id} selected={selected} notify={notify} busy={busy} onBusy={setBusy} onSent={() => { setSelected([]); setStep(1); }} />}
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {step > 0 && <Button disabled={busy} onClick={() => setStep(step - 1)}>Back</Button>}
      {step < 2 && <Button variant="contained" disabled={!campaign || (step === 1 && (!selected.length || selected.length > 50))} onClick={() => setStep(step + 1)}>Continue</Button>}
      {step === 1 && selected.length > 50 && <Alert severity="warning">Select up to 50 recipients per send.</Alert>}
      <Button component="a" href="/crm2-campaign-report">Campaign report</Button>
    </Stack>
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}

export function Crm2CampaignWizardPage({ counsellor = false }) {
  return <MenuPageShell title={counsellor ? 'My campaigns' : 'CRM 2 campaign wizard'}><Stack sx={{ p: { xs: 1, md: 2 } }}><CampaignWizard /></Stack></MenuPageShell>;
}

const runColumns = [campaignDate('createdAt', 'Send date and time'), textColumn('mode', 'Channel'), textColumn('subject', 'Subject or template', 240), textColumn('owner', 'Sent by', 220), textColumn('status', 'Status'), { ...textColumn('total', 'Recipients'), type: 'number' }];
const ReportGrid = React.memo(function ReportGrid({ rows, columns, height, onRowClick }) {
  return <Box sx={{ height }}><DataGrid rows={rows} columns={columns} getRowId={campaignRowId} slots={campaignSlots} onRowClick={onRowClick} /></Box>;
});
const Summary = React.memo(function Summary({ data }) {
  const cards = [['Sent', data.sent], ['Tracked email', data.trackable], ['Recorded opens', data.trackable ? data.opened : '-'], ['Unique clickers', data.trackable ? data.clicked : '-'], ['Click-through rate', data.ctr === null ? '-' : `${data.ctr}%`], ['Failed', data.failed], ['Unconfirmed', data.unknown]];
  const bars = [['Sent', data.sent, '#2468a2'], ['Opened', data.opened, '#23806d'], ['Clicked', data.clicked, '#a65c0c']];
  return <Stack spacing={2}>
    <Grid container spacing={1.5}>{cards.map(([label, value]) => <Grid key={label} item xs={6} sm={4} md={3} lg={2}><Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h5">{value}</Typography></Paper></Grid>)}</Grid>
    <Box component="section" aria-label="Campaign engagement chart" sx={{ borderBlock: '1px solid', borderColor: 'divider', py: 1.5 }}>
      {(data.trackable ? bars : bars.slice(0, 1)).map(([label, value, color]) => <Box key={label} sx={{ display: 'grid', gridTemplateColumns: '75px minmax(0, 1fr) 50px', alignItems: 'center', gap: 1, py: .75 }}><Typography variant="body2">{label}</Typography><Box sx={{ bgcolor: 'action.hover', height: 12 }}><Box sx={{ bgcolor: color, height: '100%', width: `${100 * value / Math.max(1, data.sent)}%` }} /></Box><Typography variant="body2" textAlign="right">{value}</Typography></Box>)}
    </Box>
  </Stack>;
});

function CampaignReport() {
  const [campaigns, setCampaigns] = useState([]), [campaign, setCampaign] = useState(null), [report, setReport] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const [draft, setDraft] = useState({ from: '', to: '', mode: '', status: '', search: '' }), [applied, setApplied] = useState(null), [run, setRun] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    get('/', {}, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setCampaigns(data); }).catch(err => { if (!controller.signal.aborted) setNotice({ text: messageOf(err), severity: 'error' }); });
    return () => controller.abort();
  }, []);
  const campaignId = campaign?._id;
  const apply = useCallback(async (id, criteria) => {
    setBusy(true);
    try { setReport(await get(`/${campaignId}/report`, { ...criteria, ...ranges(criteria.from, criteria.to), run: id || undefined })); setApplied(criteria); setRun(id); }
    catch (err) { setNotice({ text: messageOf(err), severity: 'error' }); }
    finally { setBusy(false); }
  }, [campaignId]);
  const onRunClick = useCallback(({ id }) => { if (!busy) apply(String(id), applied); }, [apply, busy, applied]);
  const field = (name, value) => setDraft(prev => ({ ...prev, [name]: value }));
  return <Stack spacing={2}>
    <Choice label="Campaign" disabled={busy} options={campaigns} value={campaign} getLabel={campaignLabel} onChange={row => { setCampaign(row); setReport(null); setRun(''); }} />
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
      <TextField size="small" label="From date and time" type="datetime-local" InputLabelProps={dateTimeProps} value={draft.from} onChange={e => field('from', e.target.value)} />
      <TextField size="small" label="To date and time" type="datetime-local" InputLabelProps={dateTimeProps} value={draft.to} onChange={e => field('to', e.target.value)} />
      <TextField select size="small" label="Channel" sx={{ minWidth: 140 }} value={draft.mode} onChange={e => field('mode', e.target.value)}><MenuItem value="">All channels</MenuItem><MenuItem value="Email">Email</MenuItem><MenuItem value="WhatsApp">WhatsApp</MenuItem></TextField>
      <TextField select size="small" label="Send status" sx={{ minWidth: 145 }} value={draft.status} onChange={e => field('status', e.target.value)}><MenuItem value="">All statuses</MenuItem>{['Sent','Failed','Pending','Unknown'].map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField>
      <TextField size="small" label="Lead or recipient" value={draft.search} onChange={e => field('search', e.target.value)} />
      <Button variant="contained" disabled={!campaign || busy} onClick={() => apply('', draft)}>Load report</Button>
    </Stack>
    {busy && <LinearProgress />}
    {report && <>
      <Typography variant="h6">Send history</Typography>
      <ReportGrid rows={report.runs} columns={runColumns} height={330} onRowClick={onRunClick} />
      <Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">{run ? 'Selected send' : 'Campaign summary'}</Typography>{run && <Button disabled={busy} onClick={() => apply('', applied)}>All sends</Button>}</Stack>
      <Summary data={report.summary} />
      <Typography variant="body2" color="text.secondary">Email opens are estimated from image loads. Click-through rate uses tracked emails; WhatsApp read and click data is unavailable.</Typography>
      <ReportGrid rows={report.data} columns={deliveryColumns} height={450} />
    </>}
    <Toast notice={notice} clear={() => setNotice(null)} />
  </Stack>;
}
export function Crm2CampaignReportPage() {
  return <MenuPageShell title="CRM 2 campaign report"><Stack sx={{ p: { xs: 1, md: 2 } }}><CampaignReport /></Stack></MenuPageShell>;
}
