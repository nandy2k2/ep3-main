import React, { useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, IconButton, LinearProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ProgramChoice } from './Crm2ProgramPages';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
const fields = ['name','email','phone','academicyear','pipeline','source','admitted','active','crmcategory','category','counsellorname','counselloremail','agentname','agentemail','country','state','city'];
const columns = [...fields.map(field => ({ field, headerName: ({ academicyear: 'Lead academic year', crmcategory: 'CRM category', counsellorname: 'Counselor', counselloremail: 'Counselor email', agentname: 'Agent', agentemail: 'Agent email' }[field] || field[0].toUpperCase() + field.slice(1)), minWidth: 160 })), { field: 'programsinterested', headerName: 'Programs interested', minWidth: 350, valueGetter: params => (params.row?.programsinterested || []).map(row => `${row.academicyear}: ${row.program} (${row.programcode})`).join('; ') }];
export default function Crm2ProgramwiseLeadSearch() {
  const [year, setYear] = useState(null), [programs, setPrograms] = useState([]), [filters, setFilters] = useState([]);
  const [rows, setRows] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState({ page: 0, pageSize: 25 });
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [loaded, setLoaded] = useState(false);
  const reset = () => { setRows([]); setTotal(0); setLoaded(false); setPage(previous => ({ ...previous, page: 0 })); };
  const load = async (pagination = { ...page, page: 0 }) => {
    setBusy(true); setNotice('');
    try {
      const res = await ep1.get('/api/v2/crm2/config/interested-leads', { params: { colid: global1.colid, academicyear: year?.name, programcodes: JSON.stringify(programs.map(row => row.programcode)), filters: JSON.stringify(filters), limit: pagination.pageSize, skip: pagination.page * pagination.pageSize } });
      setRows(res.data.data || []); setTotal(res.data.total || 0); setPage(pagination); setLoaded(true);
    } catch (error) { setNotice(error.response?.data?.message || error.message); } finally { setBusy(false); }
  };
  const patchFilter = (i, patch) => { setFilters(previous => previous.map((row, n) => n === i ? { ...row, ...patch } : row)); reset(); };
  return <MenuPageShell title="CRM 2 · Programwise lead search"><Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">Programwise lead search</Typography>
    <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={4}><ProgramChoice title="Academic year" endpoint="/api/v2/crm2-programs/academic-years" value={year} addPath="/programmanagement" onChange={value => { setYear(value); setPrograms([]); reset(); }} /></Grid>
      <Grid item xs={12} md={8}><ProgramChoice title="Programs" endpoint="/api/v2/crm2-programs/programs" params={{ academicyear: year?.name || '' }} value={programs} multiple addPath="/programmanagement" disabled={!year} onChange={value => { setPrograms(value); reset(); }} /></Grid>
      <Grid item xs={12}><TextField size="small" fullWidth label="Program codes" value={programs.map(row => row.programcode).join(', ')} InputProps={{ readOnly: true }} /></Grid>
    </Grid></Paper>
    <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1.5}>
      {filters.map((filter, i) => <Grid container spacing={1} key={i}>
        <Grid item xs={12} md={4}><Autocomplete options={['pipeline','source','admitted']} value={filter.field} getOptionLabel={value => ({ pipeline: 'Pipeline stage', source: 'Source', admitted: 'Admitted' }[value] || value)} onChange={(_, field) => patchFilter(i, { field: field || 'pipeline', value: '' })} renderInput={params => <TextField {...params} size="small" label="Filter field" />} /></Grid>
        <Grid item xs={10} md={7}>{filter.field === 'admitted' ? <Autocomplete options={['Yes','No']} value={filter.value || null} onChange={(_, value) => patchFilter(i, { value: value || '' })} renderInput={params => <TextField {...params} label="Admitted" size="small" />} /> : <ProgramChoice title="Filter value" endpoint={`/api/v2/crm2/masters/${filter.field}`} addPath={`/crm2-${filter.field}-master`} value={filter.value ? { name: filter.value } : null} onChange={value => patchFilter(i, { value: value?.name || '' })} />}</Grid>
        <Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => { setFilters(previous => previous.filter((_, n) => n !== i)); reset(); }}><Close /></IconButton></Grid>
      </Grid>)}
      <Stack direction="row" spacing={1}><Button startIcon={<Add />} onClick={() => { setFilters(previous => [...previous, { field: 'pipeline', value: '' }]); reset(); }}>Add filter</Button><Button variant="contained" disabled={busy || !year || !programs.length} onClick={() => load()}>Load leads</Button></Stack>
    </Stack></Paper>
    {busy && <LinearProgress />}
    {loaded && <Typography>{total} matching leads</Typography>}
    <Box sx={{ height: 530 }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} loading={busy} rowCount={total} paginationMode="server" paginationModel={page} onPaginationModelChange={next => { if (loaded) load(next); else setPage(next); }} pageSizeOptions={[25,50,100]} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
