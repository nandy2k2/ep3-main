import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, LinearProgress, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Merge, Search } from '@mui/icons-material';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
const root = '/api/v2/crm2/leads';
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const label = field => ({ _id: 'Lead ID', academicyear: 'Academic year', crmcategory: 'CRM category', counsellorname: 'Counselor', counselloremail: 'Counselor email' })[field] || field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, value => value.toUpperCase());
function Value({ value }) {
  if (value === null || value === undefined || value === '') return <span>-</span>;
  if (Array.isArray(value)) return <Stack spacing={1}>{value.map((item, index) => <Box key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}><Value value={item} /></Box>)}</Stack>;
  if (typeof value === 'object') return <Stack spacing={0.5}>{Object.entries(value).filter(([key]) => key !== '_id').map(([key, item]) => <Box key={key}><Typography component="span" fontWeight={600}>{label(key)}: </Typography><Value value={item} /></Box>)}</Stack>;
  const text = String(value);
  if (/^https?:\/\//i.test(text)) return <a href={text} target="_blank" rel="noreferrer">{text}</a>;
  return <span>{text}</span>;
}
export default function Crm2MergeLeadsPage() {
  const [year, setYear] = useState(null), [name, setName] = useState(''), [rows, setRows] = useState([]), [primary, setPrimary] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [searched, setSearched] = useState(false);
  const notify = (message, severity = 'success') => setNotice({ message, severity });
  const reset = () => { setRows([]); setPrimary(''); setSearched(false); };
  const fields = useMemo(() => {
    const first = ['name', 'email', 'phone', 'academicyear', 'active', 'counsellorname', 'counselloremail'];
    const all = [...new Set(rows.flatMap(row => Object.keys(row)))].filter(key => !['password', 'emailkey', 'phonekey', '__v'].includes(key));
    return [...first.filter(key => all.includes(key)), ...all.filter(key => !first.includes(key)).sort()];
  }, [rows]);
  const load = async () => {
    setBusy(true); reset();
    try { const res = await ep1.get(`${root}/merge-candidates`, { params: { ...scope(), academicyear: year.name, name: name.trim() } }); setRows(res.data.data || []); setSearched(true); }
    catch (error) { notify(error.response?.data?.message || error.message, 'error'); }
    finally { setBusy(false); }
  };
  const merge = async () => {
    if (!window.confirm(`Keep the selected primary lead and mark the other ${rows.length - 1} leads Active No?`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/merge`, { ...scope(), academicyear: year.name, name: name.trim(), ids: rows.map(row => row._id), primaryid: primary });
      setRows(previous => previous.map(row => row._id === primary ? row : { ...row, active: 'No' }));
      notify(`Primary lead retained. ${res.data.deactivated} leads marked Active No.`);
    } catch (error) { notify(error.response?.data?.message || error.message, 'error'); }
    finally { setBusy(false); }
  };
  return <MenuPageShell title="Merge leads"><Stack spacing={2} sx={{ p: 3 }}>
    <Typography variant="h5">Merge leads</Typography>
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'center' }}>
      <Box sx={{ minWidth: 240 }}><ProgramChoice title="Academic year" endpoint="/api/v2/crm2-programs/academic-years" value={year} addPath="/programmanagement" disabled={busy} onChange={value => { setYear(value); reset(); }} /></Box>
      <TextField size="small" label="Lead name" value={name} disabled={busy} onChange={event => { setName(event.target.value); reset(); }} />
      <Button variant="contained" startIcon={<Search />} disabled={busy || !year || !name.trim()} onClick={load}>Find matching leads</Button>
      <Button variant="contained" startIcon={<Merge />} disabled={busy || rows.length < 2 || !primary} onClick={merge}>Merge leads</Button>
    </Stack>
    {busy && <LinearProgress />}
    {searched && !rows.length && <Alert severity="info">No matching leads found.</Alert>}
    {rows.length > 0 && <Box sx={{ overflow: 'auto', maxHeight: '75vh', border: '1px solid', borderColor: 'divider' }}><Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: 180 + rows.length * 290 }}>
      <TableHead><TableRow><TableCell sx={{ width: 180 }}>Details</TableCell>{rows.map(row => <TableCell key={row._id} sx={{ width: 290, bgcolor: row._id === primary ? 'action.selected' : 'background.paper' }}><Typography fontWeight={700}>{row.name}</Typography><Typography variant="caption">{row.email}</Typography><Box><Checkbox disabled={busy} checked={primary === row._id} onChange={(_, checked) => setPrimary(checked ? row._id : '')} inputProps={{ 'aria-label': `Primary lead ${row.email}` }} />Primary lead</Box></TableCell>)}</TableRow></TableHead>
      <TableBody>{fields.map(field => <TableRow key={field}><TableCell sx={{ verticalAlign: 'top', fontWeight: 600 }}>{label(field)}</TableCell>{rows.map(row => <TableCell key={row._id} sx={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', bgcolor: row._id === primary ? 'action.selected' : undefined }}><Value value={row[field]} /></TableCell>)}</TableRow>)}</TableBody>
    </Table></Box>}
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
