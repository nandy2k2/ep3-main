import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, Snackbar, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import { useCrm2Dashboard } from './Crm2DashboardContext';
import CounselorTaskReport from './CounselorTaskReport';
const headers = () => ({ Authorization: `Bearer ${global1.token}` });
export function TelecallerLeads() {
  const dashboard = useCrm2Dashboard(), [rows, setRows] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState({ page: 0, pageSize: 25 }), [busy, setBusy] = useState(false), [error, setError] = useState(''), [search, setSearch] = useState(''), [appliedSearch, setAppliedSearch] = useState('');
  const params = useMemo(() => ({ academicyear: dashboard.academicyear, filters: JSON.stringify(dashboard.filters || []), dateField: dashboard.dateField, dateFrom: dashboard.dateFrom, dateTo: dashboard.dateTo, view: dashboard.view, search: appliedSearch, skip: page.page * page.pageSize, limit: page.pageSize }), [dashboard, appliedSearch, page]);
  useEffect(() => {
    const controller = new AbortController(); setBusy(true);
    ep1.get(`${dashboard.endpoint}/leads`, { params, headers: headers(), signal: controller.signal }).then(result => { if (!controller.signal.aborted) { setRows(result.data.data || []); setTotal(result.data.total || 0); } }).catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || error.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [dashboard.endpoint, params]);
  const columns = useMemo(() => [{ field: 'open', headerName: 'Lead details', width: 140, renderCell: params => <Button onClick={() => dashboard.onOpenLead(params.row._id)}>Open</Button> }, ...['name','email','phone','pipeline','source','type','crmcategory','category','academicyear','admitted','dateadded','telecallername','telecalleremail','counsellorname','counselloremail'].map(field => ({ field, headerName: field, minWidth: 160, ...(field === 'dateadded' ? { valueGetter: params => params.row.dateadded || params.row.createdAt ? new Date(params.row.dateadded || params.row.createdAt).toLocaleString() : '' } : {}) }))], [dashboard]);
  return <Stack spacing={2}><Stack direction="row" spacing={1}><TextField label="Search leads" size="small" value={search} onChange={event => setSearch(event.target.value)} /><Button onClick={() => { setAppliedSearch(search); setPage(previous => ({ ...previous, page: 0 })); }}>Search</Button></Stack><Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} loading={busy} paginationMode="server" rowCount={total} paginationModel={page} onPaginationModelChange={setPage} pageSizeOptions={[25,50,100]} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick onRowDoubleClick={params => dashboard.onOpenLead(params.row._id)} /></Box><Snackbar open={Boolean(error)} onClose={() => setError('')} autoHideDuration={7000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error">{error}</Alert></Snackbar></Stack>;
}
export function TelecallerLeadDetails({ lead }) {
  const dashboard = useCrm2Dashboard(), [tab, setTab] = useState('Profile'), [pipeline, setPipeline] = useState(lead.pipeline || ''), [stages, setStages] = useState([]), [notes, setNotes] = useState([]), [note, setNote] = useState(''), [noteid, setNoteid] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const base = `${dashboard.endpoint}/lead/${lead._id}`;
  const loadNotes = useCallback(async () => { const result = await ep1.get(`${base}/notes`, { params: { academicyear: dashboard.academicyear }, headers: headers() }); setNotes(result.data.data || []); }, [base, dashboard.academicyear]);
  useEffect(() => { loadNotes().catch(error => setNotice({ text: error.response?.data?.message || error.message, severity: 'error' })); ep1.get(`${dashboard.endpoint}/pipeline-options`, { params: { academicyear: dashboard.academicyear }, headers: headers() }).then(result => setStages((result.data.data || []).map(row => row.name))).catch(error => setNotice({ text: error.message, severity: 'error' })); }, [loadNotes, dashboard.endpoint, dashboard.academicyear]);
  const save = async kind => {
    setBusy(true);
    try { await ep1.post(`${base}/${kind}`, { academicyear: dashboard.academicyear, ...(kind === 'pipeline' ? { pipeline } : { note, ...(noteid ? { noteid } : {}) }) }, { headers: headers() }); if (kind === 'notes') { setNote(''); setNoteid(''); await loadNotes(); } setNotice({ text: 'Saved', severity: 'success' }); }
    catch (error) { setNotice({ text: error.response?.data?.message || error.message, severity: 'error' }); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Autocomplete sx={{ width: { xs: '100%', sm: 300 }, minWidth: 0 }} options={stages} value={pipeline || null} onChange={(_, value) => setPipeline(value || '')} renderInput={params => <TextField {...params} label="Pipeline stage" size="small" />} /><Button disabled={busy || !pipeline} onClick={() => save('pipeline')}>Save pipeline</Button></Stack><Tabs value={tab} onChange={(_, value) => setTab(value)}>{['Profile','Notes','Tasks'].map(value => <Tab key={value} value={value} label={value} />)}</Tabs>
    {tab === 'Profile' && <Grid container spacing={2}>{Object.entries(lead).filter(([field]) => !['_id','__v','crm2profileversion'].includes(field)).map(([field,value]) => <Grid item xs={12} sm={6} md={4} key={field}><Typography variant="caption" color="text.secondary">{field}</Typography><Typography sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{value && typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')}</Typography></Grid>)}</Grid>}
    {tab === 'Notes' && <Stack spacing={2}><TextField label="Lead note" multiline minRows={3} value={note} onChange={event => setNote(event.target.value)} /><Stack direction="row"><Button disabled={busy || !note.trim()} onClick={() => save('notes')}>{noteid ? 'Update note' : 'Add note'}</Button>{noteid && <Button onClick={() => { setNoteid(''); setNote(''); }}>Cancel edit</Button>}</Stack>{notes.map(row => <Box key={row._id} sx={{ borderBottom: '1px solid #ddd', py: 1 }}><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{row.note}</Typography><Typography variant="caption">{row.createdby} · {new Date(row.createdAt).toLocaleString()}</Typography><Button onClick={() => { setNoteid(row._id); setNote(row.note); }}>Edit note</Button></Box>)}</Stack>}
    {tab === 'Tasks' && <CounselorTaskReport leadId={lead._id} />}
    <Snackbar open={Boolean(notice)} onClose={() => setNotice(null)} autoHideDuration={7000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
