import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AppBar, Autocomplete, Box, Button, CircularProgress, Container, Grid, IconButton, InputAdornment, LinearProgress, Paper, Snackbar, Stack, Tab, Tabs, TextField, Toolbar, Typography } from '@mui/material';
import { Delete, Home, Login, Logout, Save, UploadFile, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import ep1 from '../api/ep1';
import { ProgramChoice } from './Crm2ProgramPages';
import Crm2ProgramsInterested from './Crm2ProgramsInterested';
import Crm2Education from './Crm2Education';
import Crm2Applications from './Crm2Applications';
const root = '/api/v2/lead-portal', storage = 'crm2LeadPortalToken';
const readable = field => field.label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, text => text.toUpperCase());
const dateInput = value => value ? String(value).slice(0,10) : '';
export default function LeadLoginPortal() {
  const [token, setToken] = useState(() => sessionStorage.getItem(storage) || '');
  const [credentials, setCredentials] = useState(() => ({ email: '', password: '', colid: new URLSearchParams(window.location.search).get('colid') || '' }));
  const [visible, setVisible] = useState(false), [lead, setLead] = useState(null), [fields, setFields] = useState([]), [tab, setTab] = useState('Identity');
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [dirty, setDirty] = useState(false), [notice, setNotice] = useState(null), [documentType, setDocumentType] = useState(null);
  const toast = (text, severity = 'success') => setNotice({ text, severity });
  const clear = () => { sessionStorage.removeItem(storage); setToken(''); setLead(null); setDirty(false); };
  const api = useMemo(() => {
    const request = async (method, url, data, config = {}) => {
      try { return await ep1.request({ ...config, method, url, data, headers: { ...config.headers, Authorization: `Bearer ${token}` } }); }
      catch (error) { if (error.response?.status === 401) { sessionStorage.removeItem(storage); setToken(''); setLead(null); } throw error; }
    };
    return { get: (url, config) => request('get', url, undefined, config), post: (url, data, config) => request('post', url, data, config) };
  }, [token]);
  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController(); setBusy(true);
    api.get(`${root}/profile`, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) { setLead(result.data.data); setFields(result.data.fields || []); setDirty(false); } }).catch(error => { if (!controller.signal.aborted) setNotice({ text: error.response?.data?.message || error.message, severity: 'error' }); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, api]);
  const change = (field, value) => { setLead(previous => ({ ...previous, [field]: value })); setDirty(true); };
  const login = async event => {
    event.preventDefault(); setBusy(true);
    try { const result = await ep1.post(`${root}/login`, credentials); sessionStorage.setItem(storage, result.data.token); setToken(result.data.token); setCredentials(previous => ({ ...previous, password: '' })); }
    catch (error) { toast(error.response?.data?.message || error.message, 'error'); }
    finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try { const result = await api.post(`${root}/profile`, lead); setLead(result.data.data); setDirty(false); toast('Profile saved'); return true; }
    catch (error) { toast(error.response?.data?.message || error.message, 'error'); return false; }
    finally { setBusy(false); }
  };
  const changeTab = async (_, value) => { if (value === 'Applications' && dirty && !await save()) return; setTab(value); };
  const logout = async () => {
    if (dirty && !window.confirm('Your profile has unsaved changes. Log out without saving?')) return;
    try { await api.post(`${root}/logout`, {}); } catch (error) { /* Expired sessions can still be cleared locally. */ }
    clear();
  };
  const upload = async (event, photo = false) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (file.size > 25 * 1024 * 1024) return toast('Maximum file size is 25 MB', 'error');
    const body = new FormData(); body.append('file', file); body.append('kind', photo ? 'photo' : 'document'); setUploading(true);
    try { const result = await api.post(`${root}/upload`, body); if (photo) change('photo', result.data.url); else change('documents', [...(lead.documents || []), { documentname: documentType.name, title: result.data.title, url: result.data.url }]); toast('File uploaded. Save your profile to keep the link'); }
    catch (error) { toast(error.response?.data?.message || error.message, 'error'); }
    finally { setUploading(false); }
  };
  const renderField = field => {
    const value = lead[field.field] ?? '', set = value => change(field.field, value);
    if (['country','state','city','quota','Mediumofinstruction'].includes(field.field)) {
      const dependent = field.field === 'state' ? !lead.country : field.field === 'city' ? !lead.state : false;
      return <ProgramChoice api={api} title={readable(field)} endpoint={`${root}/options`} params={{ field: field.field, country: lead.country, state: lead.state }} value={value ? { name: value } : null} disabled={dependent} onChange={option => {
        const selected = option?.name || '';
        setLead(previous => ({ ...previous, [field.field]: selected, ...(field.field === 'country' ? { state: '', city: '' } : field.field === 'state' ? { city: '' } : {}) })); setDirty(true);
      }} />;
    }
    if (field.options?.length || field.type === 'Boolean') return <Autocomplete options={field.options?.length ? field.options : ['Yes','No']} value={field.type === 'Boolean' ? value === true ? 'Yes' : 'No' : value || null} onChange={(_, next) => set(field.type === 'Boolean' ? next === 'Yes' : next || '')} renderInput={params => <TextField {...params} size="small" label={readable(field)} />} />;
    return <TextField fullWidth size="small" label={readable(field)} type={field.type === 'Date' ? 'date' : field.type === 'Number' ? 'number' : 'text'} InputLabelProps={field.type === 'Date' ? { shrink: true } : undefined} value={field.type === 'Date' ? dateInput(value) : value} onChange={event => set(event.target.value)} multiline={field.field === 'address'} minRows={field.field === 'address' ? 2 : undefined} />;
  };
  const groups = [...new Set(fields.map(field => field.group))];
  return <Box sx={{ minHeight: '100vh', bgcolor: '#f3f7fc' }}>
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#172c49', borderBottom: '1px solid #d7e3ef' }}><Toolbar sx={{ gap: 2 }}><Box component="img" src="https://campus.technology/images/logo.png" alt="Kahan Technologies" sx={{ width: 110, height: 42, objectFit: 'contain' }} /><Typography variant="h6" sx={{ flex: 1 }}>Lead portal</Typography><IconButton component={Link} to="/" title="Home"><Home /></IconButton>{lead && <Button startIcon={<Logout />} onClick={logout}>Log out</Button>}</Toolbar></AppBar>
    {busy && <LinearProgress />}
    {!token ? <Container maxWidth="sm" sx={{ py: 6 }}><Paper component="form" onSubmit={login} variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}><Stack spacing={3}><Typography variant="h5">Lead login</Typography><TextField required type="email" autoComplete="username" label="Email" value={credentials.email} onChange={event => setCredentials(previous => ({ ...previous, email: event.target.value }))} /><TextField required autoComplete="current-password" label="Password" type={visible ? 'text' : 'password'} value={credentials.password} onChange={event => setCredentials(previous => ({ ...previous, password: event.target.value }))} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton title={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(previous => !previous)}>{visible ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /><TextField label="Institution ID (optional)" value={credentials.colid} onChange={event => setCredentials(previous => ({ ...previous, colid: event.target.value }))} /><Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={18} /> : <Login />}>Log in</Button></Stack></Paper></Container>
      : lead && <Container maxWidth="xl" sx={{ py: 3 }}><Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}><Box><Typography variant="h5">{lead.name}</Typography><Typography color="text.secondary">{lead.email}</Typography></Box>{tab !== 'Applications' && <Button startIcon={<Save />} variant="contained" disabled={busy || uploading} onClick={save}>Save profile</Button>}</Stack>
        <Paper variant="outlined"><Tabs value={tab} onChange={changeTab} variant="scrollable" scrollButtons="auto">{[...groups, 'Education', 'Documents', 'Programs interested', 'Applications'].map(group => <Tab key={group} value={group} label={group} />)}</Tabs>
          <Box sx={{ p: { xs: 2, md: 3 } }}><Grid container spacing={2}>
            {groups.includes(tab) && fields.filter(field => field.group === tab).sort((a,b) => ({ country: 0, state: 1, city: 2 }[a.field] ?? 3) - ({ country: 0, state: 1, city: 2 }[b.field] ?? 3)).map(field => <Grid item xs={12} sm={6} md={4} key={field.field}>{renderField(field)}{field.field === 'photo' && <Stack direction="row" spacing={1} sx={{ mt: 1 }}>{lead.photo && <Box component="img" src={lead.photo} alt="Lead profile" sx={{ width: 64, height: 64, objectFit: 'cover' }} />}<Button component="label" disabled={uploading} startIcon={<UploadFile />}>Upload photo<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event => upload(event, true)} /></Button></Stack>}</Grid>)}
            {tab === 'Education' && <Crm2Education allowAi={false} value={lead.education || []} onChange={value => change('education', value)} />}
            {tab === 'Programs interested' && <Crm2ProgramsInterested api={api} portal value={lead.programsinterested || []} onChange={value => change('programsinterested', value)} />}
            {tab === 'Applications' && <Grid item xs={12}><Crm2Applications lead={lead} api={api} portal /></Grid>}
            {tab === 'Documents' && <Grid item xs={12}><Stack spacing={2}><ProgramChoice api={api} title="Document type" endpoint={`${root}/options`} params={{ field: 'document' }} value={documentType} onChange={setDocumentType} /><Button component="label" disabled={!documentType || uploading} startIcon={<UploadFile />}>Upload document<input hidden type="file" onChange={event => upload(event)} /></Button>{uploading && <LinearProgress />}{(lead.documents || []).map((document, index) => <Stack key={`${document.url}-${index}`} direction="row" alignItems="center" spacing={2}><Typography sx={{ flex: 1 }}>{document.documentname} · <a href={document.url} target="_blank" rel="noreferrer">{document.title || 'View document'}</a></Typography><IconButton title="Remove document" onClick={() => change('documents', lead.documents.filter((_, i) => i !== index))}><Delete /></IconButton></Stack>)}</Stack></Grid>}
          </Grid></Box>
        </Paper>
      </Stack></Container>}
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Box>;
}
