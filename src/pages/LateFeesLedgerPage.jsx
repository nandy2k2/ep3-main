import React, { useState } from 'react';
import { Alert, Autocomplete, Box, Button, Card, CardContent, Grid, IconButton, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Close, Refresh } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
const fields = ['academicyear','program','programcode','semester','student','regno','email','finetype','rate','days','amount','paid','balance','paiddate','gateway','refno','gatewayrefno','studentonlinepaymentid'];
const filtersAllowed = ['academicyear','program','programcode','semester','student','regno','email','gateway','finetype','refno'];
const labels = { academicyear: 'Academic year', programcode: 'Program code', regno: 'Regno', finetype: 'Fine type', paiddate: 'Paid date', refno: 'Reference', gatewayrefno: 'Gateway reference', studentonlinepaymentid: 'Online payment ID' };
const label = field => labels[field] || field[0].toUpperCase() + field.slice(1);
const money = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function LateFeesLedgerPage() {
  const [rows, setRows] = useState([]), [filters, setFilters] = useState([]), [fromdate, setFrom] = useState(''), [todate, setTo] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const update = (index, patch) => setFilters(previous => previous.map((row,i) => i === index ? { ...row, ...patch } : row));
  const load = async () => {
    setBusy(true);
    try { setRows((await ep1.get('/api/v2/late-fees-ledger', { params: { colid: global1.colid, filters: JSON.stringify(filters), fromdate, todate } })).data.data || []); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(false); }
  };
  const payments = new Set(rows.map(row => row.studentonlinepaymentid)).size, students = new Set(rows.map(row => row.regno)).size;
  return <MenuPageShell title="Late fees ledger"><Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">Late fees ledger</Typography>{busy && <LinearProgress />}
    <Grid container spacing={2}>{[['Late fees paid', `Rs. ${money(rows.reduce((sum,row) => sum + Number(row.paid || 0), 0))}`], ['Payments', payments], ['Students', students]].map(([name,value]) => <Grid item xs={12} md={4} key={name}><Card variant="outlined"><CardContent><Typography color="text.secondary">{name}</Typography><Typography variant="h5">{value}</Typography></CardContent></Card></Grid>)}</Grid>
    {filters.map((filter,index) => <Grid container spacing={1} key={index}><Grid item xs={12} md={4}><Autocomplete size="small" options={filtersAllowed} value={filter.field || null} getOptionLabel={label} onChange={(_,field) => update(index, { field, value: '' })} renderInput={params => <TextField {...params} label="Filter field" />} /></Grid><Grid item xs={10} md={7}><TextField size="small" fullWidth label="Filter value" value={filter.value} onChange={event => update(index, { value: event.target.value })} /></Grid><Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => setFilters(previous => previous.filter((_,i) => i !== index))}><Close /></IconButton></Grid></Grid>)}
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button startIcon={<Add />} onClick={() => setFilters(previous => [...previous, { field: 'academicyear', value: '' }])}>Add filter</Button><TextField size="small" type="date" label="Paid from" InputLabelProps={{ shrink: true }} value={fromdate} onChange={event => setFrom(event.target.value)} /><TextField size="small" type="date" label="Paid to" InputLabelProps={{ shrink: true }} value={todate} onChange={event => setTo(event.target.value)} /><Button variant="contained" startIcon={<Refresh />} disabled={busy} onClick={load}>Load</Button></Stack>
    <Box sx={{ height: 550 }}><DataGrid rows={rows} getRowId={row => row._id} loading={busy} slots={{ toolbar: GridToolbar }} columns={fields.map(field => ({ field, headerName: label(field), minWidth: ['program','student','studentonlinepaymentid'].includes(field) ? 200 : 140, ...(field === 'paiddate' ? { valueGetter: params => params.row.paiddate ? new Date(params.row.paiddate).toLocaleString('en-GB') : '' } : ['amount','paid','balance','rate'].includes(field) ? { type: 'number', valueFormatter: params => money(params.value) } : {}) }))} /></Box>
    <Snackbar open={!!error} autoHideDuration={8000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
