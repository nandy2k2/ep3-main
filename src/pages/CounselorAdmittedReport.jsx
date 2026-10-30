import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import { useCrm2Dashboard } from './Crm2DashboardContext';
const columns = ['name','email','phone','academicyear','admitted','admissionstatus','counsellorname','counselloremail','source','pipeline','crmcategory','category','agentname','country','state','city'].map(field => ({ field, headerName: ({ name: 'Lead', academicyear: 'Academic year', admissionstatus: 'Admission status', counsellorname: 'Counselor', counselloremail: 'Counselor email', crmcategory: 'CRM category' }[field] || field), minWidth: 170 }));
export default function CounselorAdmittedReport() {
  const dashboard = useCrm2Dashboard(), [rows, setRows] = useState([]), [total, setTotal] = useState(0), [search, setSearch] = useState(''), [appliedSearch, setAppliedSearch] = useState(''), [page, setPage] = useState({ page: 0, pageSize: 25 }), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const result = await ep1.get(`${dashboard.endpoint || '/api/v2/crm2-counselor-dashboard'}/admitted`, { params: { academicyear: dashboard.academicyear, filters: JSON.stringify(dashboard.filters || []), dateField: dashboard.dateField, dateFrom: dashboard.dateFrom, dateTo: dashboard.dateTo, search: appliedSearch, limit: page.pageSize, skip: page.page * page.pageSize }, headers: { Authorization: `Bearer ${global1.token}` } }); setRows(result.data.data || []); setTotal(result.data.total || 0); }
    catch (error) { setError(error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  }, [dashboard.academicyear, dashboard.endpoint, dashboard.filters, dashboard.dateField, dashboard.dateFrom, dashboard.dateTo, appliedSearch, page]);
  useEffect(() => { load(); }, [load]);
  return <Stack spacing={2}><Typography>Admitted leads: {total}</Typography><Snackbar open={Boolean(error)} autoHideDuration={7000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar><Stack direction="row" spacing={1}><TextField label="Search admitted leads" size="small" value={search} onChange={event => setSearch(event.target.value)} /><Button onClick={() => { setAppliedSearch(search); setPage(previous => ({ ...previous, page: 0 })); }}>Search</Button></Stack><Box sx={{ height: 520 }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} loading={busy} paginationMode="server" rowCount={total} paginationModel={page} onPaginationModelChange={setPage} pageSizeOptions={[25,50,100]} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box></Stack>;
}
