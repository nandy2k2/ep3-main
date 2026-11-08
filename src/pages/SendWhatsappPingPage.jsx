import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Close, Delete, Refresh, Send } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';

const fields = ['role','academicyear','regulation','program','programcode','semester','section','department','designation','category','gender','city','state','institution','name','email','phone'];
const addOption = { _id: '__add', templatename: '+ Add template', phoneid: '+ Add configuration' };
const ContentOnly = ({ children }) => <>{children}</>;
const columns = [
  { field: 'name', headerName: 'Name', minWidth: 180, flex: 1 },
  { field: 'email', headerName: 'Email', minWidth: 220, flex: 1 },
  ...['phone','role','academicyear','program','programcode','semester','section'].map(field => ({ field, headerName: field, minWidth: 130, flex: 1 }))
];
export default function SendWhatsappPingPage({ direct = false, embedded = false, initialPhoneNumbers = '', applicationIds }) {
  const PageShell = embedded ? ContentOnly : MenuPageShell;
  const colid = global1.colid;
  const [configs, setConfigs] = useState([]), [templates, setTemplates] = useState([]), [balance, setBalance] = useState(0);
  const [config, setConfig] = useState(null), [template, setTemplate] = useState(null), [language, setLanguage] = useState('en');
  const [values, setValues] = useState([]), [headerType, setHeaderType] = useState(''), [headerValue, setHeaderValue] = useState('');
  const [filters, setFilters] = useState([{ field: 'role', values: [] }]), [options, setOptions] = useState({});
  const [users, setUsers] = useState([]), [selected, setSelected] = useState([]), [results, setResults] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState(initialPhoneNumbers);
  const directNumbers = [...new Set(phoneNumbers.split(/[,;\n]+/).map(phone => {
    const number = phone.replace(/\D/g, '');
    return number.length === 10 ? `91${number}` : number;
  }).filter(Boolean))];
  const recipientIds = applicationIds || (direct ? directNumbers : selected);
  const [busy, setBusy] = useState(false), [sending, setSending] = useState(false), [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState(null), [modal, setModal] = useState(null), [frameLoading, setFrameLoading] = useState(false);
  const notify = (text, severity = 'error') => setNotice({ text, severity });
  const loadOptions = async () => {
    try {
      const { data } = await ep1.get('/api/v2/ping-whatsapp/options', { params: { colid } });
      setConfigs(data.configs || []); setTemplates(data.templates || []); setBalance(data.balance || 0);
      setConfig(previous => data.configs.find(row => row._id === previous?._id) || data.configs[0] || null);
    } catch (error) { notify(error.response?.data?.error || error.message); }
  };
  useEffect(() => { if (colid) loadOptions(); }, [colid]); // eslint-disable-line react-hooks/exhaustive-deps
  const openAdd = path => { setFrameLoading(true); setModal(path); };
  const loadFilter = async field => {
    if (!field || options[field]) return;
    try { const { data } = await ep1.get('/api/v2/bhash-whatsapp/filter-options', { params: { colid, field } }); setOptions(previous => ({ ...previous, [field]: data.data || [] })); }
    catch (error) { notify(error.response?.data?.error || error.message); }
  };
  const patchFilter = (index, patch) => setFilters(previous => previous.map((row, i) => i === index ? { ...row, ...patch } : row));
  const loadUsers = async () => {
    setBusy(true);
    try { const { data } = await ep1.post('/api/v2/bhash-whatsapp/users', { colid, dynamicFilters: filters.filter(row => row.field && row.values.length), limit: 10000 }); setUsers(data.data || []); setSelected([]); }
    catch (error) { notify(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  const send = async () => {
    if (!config || !template || !recipientIds.length) return notify('Select configuration, Ping template and recipients');
    if (direct && !applicationIds && directNumbers.some(phone => !/^[1-9]\d{7,14}$/.test(phone))) return notify('Enter valid phone numbers with country code');
    if (values.some(value => !value.trim()) || !language.trim() || (headerType && !headerValue.trim())) return notify('Fill template language, variables and selected header');
    if (!window.confirm(`Send Ping template to ${recipientIds.length} recipients?`)) return;
    setSending(true); setProgress(0); setResults([]);
    const collected = [];
    try {
      for (let i = 0; i < recipientIds.length; i += 10) {
        const { data } = await ep1.post(applicationIds ? '/api/v2/admission-application-management-2/send-ping' : direct ? '/api/v2/ping-whatsapp/send-direct' : '/api/v2/ping-whatsapp/send', {
          colid, user: global1.user || global1.email, configid: config._id, templateid: template._id,
          language: language.trim(), values, header: headerType ? { type: headerType, value: headerValue.trim() } : undefined,
          ...(applicationIds ? { applicationids: recipientIds.slice(i, i + 10) } : direct ? { mobileNumbers: recipientIds.slice(i, i + 10).join(',') } : { userids: recipientIds.slice(i, i + 10) })
        }, { timeout: 90000 });
        collected.push(...data.recipients); setResults([...collected]); setBalance(data.balance);
        setProgress(Math.round(Math.min(i + 10, recipientIds.length) / recipientIds.length * 100));
      }
      const accepted = collected.filter(row => row.status === 'Accepted').length;
      notify(`${accepted} accepted by Ping; ${collected.length - accepted} failed, skipped or unconfirmed.`, accepted === collected.length ? 'success' : 'warning');
      setSelected([]);
    } catch (error) { setSelected([]); notify(error.response?.data?.error || `${error.message}. Sending stopped; check results before resending.`); }
    finally { setSending(false); loadOptions(); }
  };
  const preview = {
    messaging_product: 'whatsapp', recipient_type: 'individual', to: (direct ? directNumbers[0] : users.find(row => selected.includes(row._id))?.phone) || 'RECIPIENT_NUMBER', type: 'template',
    template: { name: template?.templatecode || '', language: { code: language }, components: [
      ...(headerType ? [{ type: 'header', parameters: [headerType === 'text' ? { type: 'text', text: headerValue } : { type: headerType, [headerType]: { link: headerValue } }] }] : []),
      ...(values.length ? [{ type: 'body', parameters: values.map(text => ({ type: 'text', text })) }] : [])
    ] }
  };
  return <PageShell title={direct ? 'Send Direct WhatsApp Ping' : 'Send WhatsApp Ping'}><Stack spacing={2} sx={{ p: { xs: 1, md: 2 } }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5">{direct ? 'Send Direct WhatsApp Ping' : 'Send WhatsApp Ping'}</Typography><Chip label={`WhatsApp credits: ${balance}`} color="primary" variant="outlined" /></Stack>
    {direct ? <TextField label="Phone numbers" placeholder="919008168822, 919876543210" multiline minRows={2} value={phoneNumbers} disabled={sending} InputProps={{ readOnly: !!applicationIds }} onChange={event => setPhoneNumbers(event.target.value)} /> : <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Stack spacing={2}><Typography variant="h6">Recipients</Typography>
      {filters.map((filter, index) => <Grid container spacing={1} key={index} alignItems="center"><Grid item xs={12} sm={3}><Autocomplete size="small" options={fields} value={filter.field} onChange={(_, field) => patchFilter(index, { field: field || '', values: [] })} renderInput={params => <TextField {...params} label="Filter field" />} /></Grid><Grid item xs={10} sm={8}><Autocomplete multiple size="small" options={options[filter.field] || []} value={filter.values} onOpen={() => loadFilter(filter.field)} onChange={(_, value) => patchFilter(index, { values: value })} renderInput={params => <TextField {...params} label="Values" />} /></Grid><Grid item xs={2} sm={1}><IconButton title="Remove filter" onClick={() => setFilters(previous => previous.filter((_, i) => i !== index))}><Delete /></IconButton></Grid></Grid>)}
      <Stack direction="row" spacing={1}><Button startIcon={<Add />} onClick={() => setFilters(previous => [...previous, { field: 'programcode', values: [] }])}>Add filter</Button><Button variant="contained" startIcon={<Refresh />} disabled={busy || sending} onClick={loadUsers}>Load users</Button><Chip label={`${selected.length} selected`} /></Stack>
      <Box sx={{ height: 420 }}><DataGrid rows={users} columns={columns} getRowId={row => row._id} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={ids => !sending && setSelected(ids)} loading={busy} slots={{ toolbar: GridToolbar }} /></Box>
    </Stack></Paper>}
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Stack spacing={2}><Typography variant="h6">Ping template message</Typography><Grid container spacing={2}>
      <Grid item xs={12} md={4}><Autocomplete options={[addOption, ...configs]} value={config} getOptionLabel={row => row.phoneid || ''} isOptionEqualToValue={(a,b) => a._id === b._id} onChange={(_, row) => row?._id === '__add' ? openAdd('/ping-whatsapp-configuration') : setConfig(row)} renderInput={params => <TextField {...params} label="Ping configuration / Phone ID" required />} /></Grid>
      <Grid item xs={12} md={5}><Autocomplete options={[addOption, ...templates]} value={template} getOptionLabel={row => row._id === '__add' ? row.templatename : `${row.templatename} (${row.templatecode})`} isOptionEqualToValue={(a,b) => a._id === b._id} onChange={(_, row) => { if (row?._id === '__add') return openAdd('/whatsapp-templates'); setTemplate(row); setValues(Array.from({ length: Number(row?.noofvariables || 0) }, () => '')); }} renderInput={params => <TextField {...params} label="Ping template" required />} /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth label="Language code" value={language} onChange={event => setLanguage(event.target.value)} required /></Grid>
      <Grid item xs={12} md={6}><TextField fullWidth label="Template code / API template name" value={template?.templatecode || ''} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={6}><TextField fullWidth label="Variables" value={template ? `${template.noofvariables || 0}: ${template.variablenames || 'None'}` : ''} InputProps={{ readOnly: true }} /></Grid>
      {values.map((value,index) => <Grid item xs={12} md={4} key={index}><TextField fullWidth label={`${index + 1}. ${template?.variablenames?.split(',')[index]?.trim() || 'Value'}`} value={value} onChange={event => { const text = event.target.value; setValues(previous => previous.map((old, i) => i === index ? text : old)); }} required /></Grid>)}
      <Grid item xs={12} md={3}><TextField select fullWidth label="Optional header" value={headerType} onChange={event => setHeaderType(event.target.value)}>{['','text','image','video','document'].map(type => <MenuItem key={type} value={type}>{type || 'None'}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12} md={9}><TextField fullWidth label={headerType === 'text' ? 'Header text' : 'Header media URL'} disabled={!headerType} value={headerValue} onChange={event => setHeaderValue(event.target.value)} /></Grid>
    </Grid><Box component="fieldset" disabled={sending} sx={{ border: 0, p: 0, m: 0 }}><Button variant="contained" startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send />} disabled={sending || !recipientIds.length || !config || !template} onClick={send}>Send WhatsApp Ping</Button></Box>
      {sending && <Stack spacing={1}><LinearProgress variant="determinate" value={progress} /><Typography variant="body2">Processed {progress}%</Typography></Stack>}
      <Box component="details"><Typography component="summary">Request preview</Typography><TextField fullWidth multiline minRows={8} maxRows={16} value={JSON.stringify(preview,null,2)} InputProps={{ readOnly: true }} /></Box>
    </Stack></Paper>
    {!!results.length && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6">Send results</Typography><Box sx={{ height: 350 }}><DataGrid rows={results.map((row,i) => ({ ...row, id: i }))} columns={[{ field: 'name', headerName: 'Name', flex: 1 },{ field: 'phone', headerName: 'Phone', width: 170 },{ field: 'status', headerName: 'Status', width: 120 },{ field: 'error', headerName: 'Details', flex: 2, minWidth: 250 }]} /></Box></Paper>}
    <Dialog fullWidth maxWidth="xl" open={!!modal} onClose={() => { setModal(null); loadOptions(); }}><DialogTitle>Add master record<IconButton title="Close" sx={{ float: 'right' }} onClick={() => { setModal(null); loadOptions(); }}><Close /></IconButton></DialogTitle><DialogContent>{frameLoading && <LinearProgress />}<Box component="iframe" title="Master record" src={modal ? `${modal}?embedded=1` : undefined} onLoad={() => setFrameLoading(false)} sx={{ width: '100%', height: '75vh', border: 0 }} /></DialogContent></Dialog>
    <Snackbar open={!!notice} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'error'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack></PageShell>;
}
