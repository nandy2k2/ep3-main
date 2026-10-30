import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, LinearProgress, MenuItem, Select, Snackbar, Stack, TextField } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import { useCrm2Dashboard } from './Crm2DashboardContext';
const root = '/api/v2/crm2-counselor-dashboard';
const gridSlots = { toolbar: GridToolbar }, rowId = row => row._id;
export default function CounselorTaskReport({ leadId }) {
  const dashboard = useCrm2Dashboard(), [rows, setRows] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [search, setSearch] = useState('');
  const endpoint = dashboard.endpoint || root;
  const load = useCallback(async () => {
    setBusy(true);
    try { const result = await ep1.get(`${endpoint}/tasks`, { params: { academicyear: dashboard.academicyear, leadid: leadId, filters: JSON.stringify(dashboard.filters || []), dateField: dashboard.dateField, dateFrom: dashboard.dateFrom, dateTo: dashboard.dateTo }, headers: { Authorization: `Bearer ${global1.token}` } }); setRows(result.data.data || []); }
    catch (error) { setError(error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  }, [dashboard.academicyear, dashboard.filters, dashboard.dateField, dashboard.dateFrom, dashboard.dateTo, leadId, endpoint]);
  useEffect(() => { load(); }, [load]);
  const update = useCallback(async (id, status) => {
    setBusy(true);
    try { await ep1.post(`${endpoint}/tasks/${id}/status`, { academicyear: dashboard.academicyear, status }, { headers: { Authorization: `Bearer ${global1.token}` } }); await load(); }
    catch (error) { setError(error.response?.data?.message || error.message); setBusy(false); }
  }, [dashboard.academicyear, endpoint, load]);
  const columns = useMemo(() => [
    { field: 'lead', headerName: 'Lead', minWidth: 190, renderCell: params => <Button onClick={() => dashboard.onOpenLead?.(params.row.leadid)}>{params.value || params.row.leadid}</Button> },
    ...['leademail','leadphone','task','duedate'].map(field => ({ field, headerName: ({ leademail: 'Email', leadphone: 'Phone', task: 'Task', duedate: 'Due date' }[field]), minWidth: field === 'task' ? 300 : 170, ...(field === 'duedate' ? { valueGetter: params => String(params.row.duedate || '').slice(0,10) } : {}) })),
    { field: 'status', headerName: 'Status', width: 160, renderCell: params => dashboard.readOnly ? params.value : <Select size="small" inputProps={{ 'aria-label': `Status for ${params.row.task}` }} value={params.value} disabled={busy} onChange={event => update(params.row._id, event.target.value)}>{['Open','Pending','Closed'].map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select> }
  ], [dashboard, busy, update]);
  const visible = useMemo(() => rows.filter(row => ['lead','leademail','leadphone','task'].some(field => String(row[field] || '').toLowerCase().includes(search.toLowerCase()))), [rows, search]);
  return <Stack spacing={2}>{busy && <LinearProgress />}<Stack direction="row" spacing={1}><TextField size="small" label="Search pending tasks" value={search} onChange={event => setSearch(event.target.value)} /><Button onClick={load} disabled={busy}>Refresh</Button></Stack><Box sx={{ height: 480 }}><DataGrid rows={visible} columns={columns} getRowId={rowId} loading={busy} disableRowSelectionOnClick slots={gridSlots} /></Box><Snackbar open={Boolean(error)} autoHideDuration={7000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar></Stack>;
}
