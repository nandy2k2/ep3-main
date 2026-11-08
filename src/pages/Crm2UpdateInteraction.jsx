import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Dialog, DialogContent, DialogTitle, Grid, LinearProgress, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Close, Search } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import MenuPageShell from './MenuPageShell';
import { Crm2Content, RemoteChoice } from './Crm2Pages';
import Crm2Interactions from './Crm2Interactions';
import ep1 from '../api/ep1';
import global1 from './global1';

const fields = ['name','email','phone','academicyear','pipeline','source','active','admitted','type','crmcategory','counsellorname'];
const initial = { details: '', interactiontype: 'Incoming', reachable: 'Yes', mode: 'Phone', rating: '' };
export default function Crm2UpdateInteraction() {
  const [filters, setFilters] = useState([{ field: 'name', value: '' }]), [rows, setRows] = useState([]), [lead, setLead] = useState(null);
  const [form, setForm] = useState(initial), [note, setNote] = useState(''), [ratings, setRatings] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const scope = () => ({ colid: global1.colid, user: global1.user || global1.email, token: global1.token });
  const [history, setHistory] = useState({ interactions: [], notes: [] });
  const [historyVersion, setHistoryVersion] = useState(0);
  useEffect(() => {
    setHistory({ interactions: [], notes: [] });
    if (!lead) return undefined;
    const controller = new AbortController();
    ep1.get('/api/v2/crm2/update-interaction/history', { params: { ...scope(), leadid: lead._id }, signal: controller.signal }).then(r => setHistory(r.data)).catch(e => { if (!controller.signal.aborted) setNotice({ severity: 'error', text: e.response?.data?.message || 'Unable to load lead history' }); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?._id, historyVersion]);
  const run = async fn => { setBusy(true); try { await fn(); } catch (e) { setNotice({ severity: 'error', text: e.response?.data?.message || e.message }); } finally { setBusy(false); } };
  useEffect(() => { ep1.get('/api/v2/crm2/masters/leadrating', { params: { colid: global1.colid } }).then(r => setRatings(r.data.data || [])).catch(() => {}); }, []);
  const save = kind => run(async () => { await ep1.post('/api/v2/crm2/update-interaction/save', { ...scope(), ...form, leadid: lead._id, kind, note }); setHistoryVersion(v => v + 1); if (kind === 'note') setNote(''); else setForm(initial); setNotice({ severity: 'success', text: kind === 'note' ? 'Note added' : 'Interaction saved without creating a task' }); });
  return <MenuPageShell title="Update interaction"><Stack spacing={2} sx={{ p: 2 }}>
    {busy && <LinearProgress />}
    <Paper sx={{ p: 2 }}><Stack spacing={2}>{filters.map((filter, i) => <Stack key={i} direction="row" spacing={1}><TextField select label="Field" size="small" value={filter.field} sx={{ minWidth: 180 }} onChange={e => setFilters(prev => prev.map((x,j) => j === i ? { ...x, field: e.target.value } : x))}>{fields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)}</TextField><TextField size="small" label="Contains" value={filter.value} onChange={e => setFilters(prev => prev.map((x,j) => j === i ? { ...x, value: e.target.value } : x))} /><Button onClick={() => setFilters(prev => prev.filter((_,j) => i !== j))}>Remove</Button></Stack>)}<Stack direction="row" spacing={1}><Button startIcon={<Add />} onClick={() => setFilters(prev => [...prev, { field: 'name', value: '' }])}>Add filter</Button><Button startIcon={<Search />} variant="contained" disabled={busy} onClick={() => run(async () => { const r = await ep1.get('/api/v2/crm2/update-interaction/search', { params: { ...scope(), filters: JSON.stringify(filters) } }); setRows(r.data.data || []); })}>Load leads</Button></Stack></Stack></Paper>
    <Paper sx={{ height: 560, width: '100%' }}><DataGrid
      rows={rows} getRowId={row => row._id} loading={busy}
      disableRowSelectionOnClick pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
      slots={{ toolbar: GridToolbar }}
      onRowDoubleClick={({ row }) => { setLead(row); setForm(initial); setNote(''); }}
      columns={[
        { field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false, renderCell: ({ row }) => <Button onClick={() => { setLead(row); setForm(initial); setNote(''); }}>Open</Button> },
        { field: 'name', headerName: 'Lead', minWidth: 200, flex: 1 },
        { field: 'email', headerName: 'Email', minWidth: 220 },
        { field: 'phone', headerName: 'Phone', minWidth: 170 },
        { field: 'academicyear', headerName: 'Academic year', minWidth: 150 },
        { field: 'pipeline', headerName: 'Pipeline stage', minWidth: 180 },
        { field: 'owned', headerName: 'Assigned to me', width: 150, valueGetter: params => params.row.owned ? 'Yes' : 'No' },
      ]}
    /></Paper>
    <Dialog open={!!lead} fullWidth maxWidth="xl" onClose={() => setLead(null)}><DialogTitle>{lead?.name}<Button startIcon={<Close />} sx={{ float: 'right' }} onClick={() => setLead(null)}>Close</Button></DialogTitle><DialogContent dividers>{lead?.owned ? <Crm2Content key={lead._id} entity="leads" mode="my" initialLead={lead} detailOnly /> : lead && <Stack spacing={2}><Alert severity="info">This lead is assigned to another counselor. Only interactions and new notes can be added.</Alert><Typography>{lead.email} · {lead.phone}</Typography><Crm2Interactions key={lead._id} lead={lead} restricted Choice={RemoteChoice} onAdd={() => {}} notify={(text,severity="success") => { setNotice({text,severity}); if(severity === "success") setHistoryVersion(v => v + 1); }} /><TextField multiline minRows={3} label="New note" value={note} onChange={e => setNote(e.target.value)} /><Button disabled={busy || !note.trim()} onClick={() => save('note')}>Add note</Button></Stack>}<Typography variant="h6" sx={{mt:3}}>Previous interactions</Typography>{history.interactions.map(row => <Paper key={row._id} variant="outlined" sx={{p:2,my:1}}><Typography sx={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{row.details}</Typography><Typography variant="body2">{row.interactiontype} · {row.mode} · {row.contact} · {row.pipeline}</Typography><Typography variant="caption">{row.interactiondate ? new Date(row.interactiondate).toLocaleString() : ""} · {row.createdby}</Typography></Paper>)}<Typography variant="h6" sx={{mt:3}}>Previous notes</Typography>{history.notes.map(row => <Paper key={row._id} variant="outlined" sx={{p:2,my:1}}><Typography sx={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{row.note}</Typography><Typography variant="caption">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""} · {row.createdby}</Typography></Paper>)}</DialogContent></Dialog>
    <Snackbar open={!!notice} autoHideDuration={5000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
