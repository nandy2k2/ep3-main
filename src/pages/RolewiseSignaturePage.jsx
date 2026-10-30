import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, LinearProgress, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Delete, Edit, Save, UploadFile } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import MenuPageShell from './MenuPageShell';
import { addOption, handleAddOption } from './addableAutocompleteHelpers';
import ep1 from '../api/ep1';
import global1 from './global1';
const endpoint = '/api/v2/role-signatures';
const blank = { role: '', signaturelink: '', status: 'Active', remarks: '' };
function Content() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]), [roles, setRoles] = useState(['coe']), [configs, setConfigs] = useState([]), [form, setForm] = useState(blank), [config, setConfig] = useState(null), [file, setFile] = useState(null), [selected, setSelected] = useState([]), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [notice, setNotice] = useState(null);
  const notify = (text, severity = 'error') => setNotice({ text, severity });
  const load = async () => {
    const res = await ep1.get(endpoint, { params: { colid: global1.colid } });
    setRows(res.data.data || []); setRoles(res.data.roles || ['coe']); setSelected([]);
  };
  useEffect(() => {
    load().catch(error => notify(error.response?.data?.message || error.message));
    ep1.get('/api/v2/aws-file-library/configs', { params: { colid: global1.colid } }).then(res => setConfigs(res.data || [])).catch(error => notify(error.response?.data?.message || error.message));
  }, []);
  const patch = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async () => {
    if (!form.role || (!file && !form.signaturelink)) { notify('Select a role and upload a signature or enter its URL.'); return; }
    if (file && !config) { notify('Select an AWS configuration.'); return; }
    setBusy(true); setProgress(0);
    try {
      let signaturelink = form.signaturelink;
      if (file) {
        if (!file.type.startsWith('image/')) throw new Error('Select an image file.');
        const body = new FormData();
        body.append('file', file); body.append('colid', global1.colid); body.append('user', global1.user || ''); body.append('awsconfigid', config._id); body.append('folder', 'role-signatures'); body.append('description', `Signature for ${form.role}`);
        const upload = await ep1.post('/api/v2/aws-file-library/upload', body, { onUploadProgress: event => { if (event.total) setProgress(Math.round(event.loaded * 100 / event.total)); } });
        signaturelink = upload.data?.url;
        if (!signaturelink) throw new Error('AWS upload did not return a file URL.');
      }
      await ep1.post(endpoint, { ...form, signaturelink, colid: global1.colid, user: global1.user || '' });
      setForm(blank); setFile(null); await load(); notify('Role signature saved.', 'success');
    } catch (error) { notify(error.response?.data?.message || error.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${selected.length} selected signatures?`)) return;
    setBusy(true);
    try { await ep1.post(`${endpoint}/delete`, { colid: global1.colid, ids: selected }); setForm(blank); setFile(null); await load(); notify('Signatures deleted.', 'success'); }
    catch (error) { notify(error.response?.data?.message || error.message); } finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ p: 2 }}><Typography variant="h5">Rolewise signature upload</Typography>
    <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={4}><Autocomplete freeSolo options={roles} value={form.role} onInputChange={(_, value) => patch('role', value)} renderInput={params => <TextField {...params} size="small" label="Role" />} /></Grid>
      <Grid item xs={12} md={4}><Autocomplete options={[addOption('+ Add AWS configuration', '/awsconfigcrudpage'), ...configs]} value={config} getOptionLabel={option => option.__addOption ? option.label : option.name || option.configname || option.bucket || ''} onChange={(_, value) => { if (!handleAddOption(value, navigate)) setConfig(value); }} renderInput={params => <TextField {...params} size="small" label="AWS configuration" />} /></Grid>
      <Grid item xs={12} md={4}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={event => patch('status', event.target.value)}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
      <Grid item xs={12}><TextField fullWidth size="small" label="Signature URL" value={form.signaturelink} onChange={event => patch('signaturelink', event.target.value)} /></Grid>
      <Grid item xs={12}><TextField fullWidth size="small" label="Remarks" value={form.remarks} onChange={event => patch('remarks', event.target.value)} /></Grid>
      <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Button component="label" startIcon={<UploadFile />} disabled={busy}>{file?.name || 'Upload signature'}<input type="file" hidden accept="image/*" onChange={event => { setFile(event.target.files?.[0] || null); event.target.value = ''; }} /></Button><Button variant="contained" startIcon={<Save />} disabled={busy} onClick={save}>Save</Button><Button disabled={busy} onClick={() => { setForm(blank); setFile(null); }}>Reset</Button></Stack></Grid>
    </Grid></Paper>
    {busy && <Box><LinearProgress variant={file && progress ? 'determinate' : 'indeterminate'} value={progress} />{file && <Typography variant="caption">Upload {progress}%</Typography>}</Box>}
    {form.signaturelink && <Box component="img" src={form.signaturelink} alt="Signature preview" sx={{ width: 180, height: 70, objectFit: 'contain' }} />}
    <Button startIcon={<Delete />} color="error" disabled={busy || !selected.length} onClick={remove} sx={{ alignSelf: 'flex-start' }}>Delete selected</Button>
    <Box sx={{ height: 450 }}><DataGrid rows={rows} getRowId={row => row._id} checkboxSelection disableRowSelectionOnClick loading={busy} rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} slots={{ toolbar: GridToolbar }} columns={[{ field: 'role', headerName: 'Role', width: 160 }, { field: 'signaturelink', headerName: 'Signature', flex: 1, minWidth: 200, renderCell: params => <a href={params.value} target="_blank" rel="noreferrer">View signature</a> }, { field: 'status', headerName: 'Status', width: 120 }, { field: 'remarks', headerName: 'Remarks', flex: 1 }, { field: 'edit', headerName: '', width: 90, renderCell: params => <Button startIcon={<Edit />} disabled={busy} onClick={() => { setForm({ ...params.row, id: params.row._id }); setFile(null); }}>Edit</Button> }]} /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'info'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function RolewiseSignaturePage() { return <MenuPageShell title="Rolewise signature upload"><Content /></MenuPageShell>; }
