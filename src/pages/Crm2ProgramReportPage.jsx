import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Close, Download, Print } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
const root = '/api/v2/crm2-programs';
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const colors = ['#2878c8', '#078675', '#c14e72', '#c17b19', '#7661b1', '#4497a5', '#ae5340', '#63783c'];
const names = { name: 'Lead', email: 'Email', phone: 'Phone', academicyear: 'Academic year', program: 'Program', programcode: 'Program code', counsellorname: 'Counselor', counselloremail: 'Counselor email', followupdate: 'Follow-up date', pipeline: 'Pipeline stage', category: 'Category', crmcategory: 'CRM category', case: 'Case', source: 'Source', type: 'Type', location: 'Location', assignedby: 'Assigned by', createdAt: 'Created', updatedAt: 'Updated', leadacademicyear: 'Lead academic year', admissionstatus: 'Admission status' };
const titleOf = field => names[field] || field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, value => value.toUpperCase());
const printable = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const escape = value => printable(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const basicFields = ['name', 'email', 'phone', 'academicyear', 'program', 'programcode', 'pipeline', 'category', 'crmcategory', 'case', 'source', 'counsellorname', 'counselloremail', 'location', 'followupdate'];
const sourcePaths = { pipeline: '/crm2-pipeline-master', case: '/crm2-case-master', source: '/crm2-source-master', type: '/crm2-type-master', crmcategory: '/crm2-category-master', counsellorname: '/crm2-counselor-program-mapping', counselloremail: '/crm2-counselor-program-mapping' };
function useEvent(handler) { const ref = useRef(handler); ref.current = handler; return useCallback((...args) => ref.current(...args), []); }
export function programReportPrint(result, rows, institution = {}) {
  const columns = ['name', 'email', 'phone', 'pipeline', 'category', 'crmcategory', 'case', 'source', 'counsellorname', 'followupdate'];
  const summaries = Object.entries(result.summary || {}).map(([field, values]) => `<section><h3>${escape(titleOf(field))}</h3><table><tr><th>Value</th><th>Leads</th></tr>${values.map(row => `<tr><td>${escape(row.name)}</td><td>${row.count}</td></tr>`).join('')}</table></section>`).join('');
  return `<!doctype html><html><head><title>Programwise lead report</title><style>@page{size:A4 landscape;margin:10mm}body{font:11px Arial;color:#000}header{text-align:center;margin-bottom:15px}header img{width:65px;height:65px;object-fit:contain}h1{font-size:21px;margin:4px}h2{font-size:16px}h3{font-size:13px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #444;padding:5px;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}.summaries{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.details{page-break-before:always}section{break-inside:avoid}</style></head><body><header>${/^https?:\/\//i.test(institution.logolink || '') ? `<img src="${escape(institution.logolink)}" alt="Institution logo">` : ''}<h1>${escape(institution.institutionname)}</h1><div>${escape(institution.address)}</div><h2>Programwise lead report</h2><div>${escape(result.context.academicyear)} | ${escape(result.context.program.program)} (${escape(result.context.programcode)})</div></header><p>All matching allocations: ${result.total} | Unique leads: ${result.uniqueLeads} | Details printed: ${rows.length}</p><div class="summaries">${summaries}</div><h2 class="details">Lead details</h2><table style="table-layout:fixed"><thead><tr>${columns.map(field => `<th>${escape(titleOf(field))}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(field => `<td>${escape(field === 'followupdate' ? row[field]?.slice(0, 10) : row[field])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
}
const Visuals = React.memo(function Visuals({ result, summaryMode }) {
  const charts = summaryMode ? ['pipeline', 'category', 'case', 'source', 'crmcategory', 'counselor', 'type', 'admissionstatus'] : ['pipeline', 'counselor'];
  return <Stack spacing={3}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>{[
    ['Lead allocations', result.total], ['Unique leads', result.uniqueLeads], ['Counselors', (result.summary.counselor || []).filter(row => row.name !== 'Not specified').length], ['Admitted', (result.summary.admissionstatus || []).find(row => row.name === 'Admitted')?.count || 0]
  ].map(([title, value], index) => <Paper key={title} variant="outlined" sx={{ p: 2, borderTop: `3px solid ${colors[index]}` }}><Typography variant="body2" color="text.secondary">{title}</Typography><Typography variant="h5">{value}</Typography></Paper>)}</Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
      {charts.map((field, index) => <Box key={field} sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{titleOf(field)}wise leads</Typography>
        <Box sx={{ height: 320, minWidth: 0 }}><ResponsiveContainer width="100%" height="100%">
          {index % 2 ? <PieChart><Pie data={result.summary[field] || []} dataKey="count" nameKey="name" outerRadius={100} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>{(result.summary[field] || []).map((row, i) => <Cell key={row.name} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart>
            : <BarChart data={result.summary[field] || []} margin={{ top: 15, bottom: 35, right: 15 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={65} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Leads" fill={colors[index % colors.length]} /></BarChart>}
        </ResponsiveContainer></Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{(result.summary[field] || []).map((row, i) => <Typography variant="caption" key={row.name} sx={{ maxWidth: '100%', overflowWrap: 'anywhere' }}><Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, mr: 0.5, bgcolor: index % 2 ? colors[i % colors.length] : colors[index % colors.length] }} />{row.name}: {row.count}</Typography>)}</Stack>
      </Box>)}
    </Box></Stack>;
});
const Details = React.memo(function Details({ result, page, onPage, selected, setSelected, onOpen, busy }) {
  const columns = useMemo(() => {
    const all = [...new Set([...basicFields, ...result.fields.map(row => row.field), 'documents', 'education', 'interactions', 'assignedby', 'createdAt', 'updatedAt'])];
    return [{ field: 'view', headerName: '', width: 85, sortable: false, renderCell: params => <Button onClick={() => onOpen(params.row)}>Details</Button> }, ...all.map(field => ({ field, headerName: titleOf(field), width: /email/.test(field) ? 250 : 180, valueGetter: params => printable(params.row[field]) }))];
  }, [result.fields, onOpen]);
  const initial = useMemo(() => ({ columns: { columnVisibilityModel: Object.fromEntries(columns.filter(column => !['view', ...basicFields].includes(column.field)).map(column => [column.field, false])) } }), [columns]);
  return <Box sx={{ height: 560 }}><DataGrid rows={result.data} getRowId={row => row._id} columns={columns} initialState={initial} loading={busy} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} paginationMode="server" paginationModel={page} onPaginationModelChange={onPage} rowCount={result.total} pageSizeOptions={[25, 50, 100]} slots={{ toolbar: GridToolbar }} /></Box>;
});
function Content({ summaryMode }) {
  const [year, setYear] = useState(null), [program, setProgram] = useState(null), [fields, setFields] = useState([]), [filters, setFilters] = useState([]), [result, setResult] = useState(null), [activeQuery, setActiveQuery] = useState(null), [page, setPage] = useState({ page: 0, pageSize: 25 }), [selected, setSelected] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [detail, setDetail] = useState(null);
  const notify = (text, severity = 'error') => setNotice({ text, severity, id: Date.now() });
  useEffect(() => { ep1.get(`${root}/report-options`, { params: scope() }).then(res => setFields(res.data.fields || [])).catch(error => notify(error.response?.data?.message || error.message)); }, []);
  const reset = () => { setResult(null); setFilters([]); setSelected([]); setActiveQuery(null); };
  const load = useEvent(async (query, pagination = { page: 0, pageSize: 25 }) => {
    setBusy(true);
    try { const res = await ep1.get(`${root}/report`, { params: { ...scope(), ...query, limit: pagination.pageSize, skip: pagination.page * pagination.pageSize } }); setResult(res.data); setActiveQuery(query); setPage(pagination); setSelected([]); }
    catch (error) { notify(error.response?.data?.message || error.message); } finally { setBusy(false); }
  });
  const onPage = useEvent(pagination => load(activeQuery, pagination));
  const openDetail = useCallback(row => setDetail(row), []);
  const exportRows = async () => {
    if (selected.length) return result.data.filter(row => selected.includes(row._id));
    const res = await ep1.get(`${root}/report`, { params: { ...scope(), ...activeQuery, export: 'true' } });
    return res.data.data;
  };
  const download = async () => {
    setBusy(true);
    try {
      const rows = await exportRows(), book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows.map(row => Object.fromEntries(Object.entries(row).filter(([field]) => !['_id', '__v', 'colid', 'mappingid'].includes(field)).map(([field, value]) => [titleOf(field), printable(value)])))), 'Leads');
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(Object.entries(result.summary).flatMap(([field, values]) => values.map(row => ({ Summary: titleOf(field), Value: row.name, Leads: row.count })))), 'Summary');
      XLSX.writeFile(book, 'crm2_programwise_leads.xlsx');
    } catch (error) { notify(error.response?.data?.message || error.message); } finally { setBusy(false); }
  };
  const print = async () => {
    const popup = window.open('', '_blank');
    if (!popup) { notify('Allow popups to open print preview.'); return; }
    popup.document.write('<p>Preparing report...</p>'); popup.document.close(); setBusy(true);
    try {
      const rows = await exportRows(), institution = await ep1.get('/api/institution', { params: { colid: global1.colid } });
      const institutions = Array.isArray(institution.data) ? institution.data : [];
      if (popup.closed) return;
      popup.document.open(); popup.document.write(programReportPrint(result, rows, institutions[institutions.length - 1] || {})); popup.document.close();
      await Promise.all([...popup.document.images].map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })));
      if (!popup.closed) { popup.focus(); popup.print(); }
    } catch (error) { popup.close(); notify(error.response?.data?.message || error.message); } finally { setBusy(false); }
  };
  return <Stack spacing={3} sx={{ p: 2 }}><Typography variant="h5">{summaryMode ? 'Programwise summary report' : 'Programwise lead report'}</Typography>
    <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 2 }}>Step 1 - Academic year and program</Typography><Grid container spacing={2}>
      <Grid item xs={12} md={4}><ProgramChoice title="Academic year" endpoint={`${root}/academic-years`} addPath="/programmanagement" value={year} onChange={value => { setYear(value); setProgram(null); reset(); }} disabled={busy} /></Grid>
      <Grid item xs={12} md={5}><ProgramChoice key={year?.name || 'empty'} title="Program" endpoint={`${root}/programs`} params={{ academicyear: year?.name }} addPath="/programmanagement" disabled={!year || busy} value={program} onChange={value => { setProgram(value); reset(); }} /></Grid>
      <Grid item xs={12} md={3}><TextField size="small" fullWidth label="Program code" value={program?.programcode || ''} InputProps={{ readOnly: true }} /></Grid>
    </Grid></Paper>
    <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ mb: 2 }}>Step 2 - Filters</Typography><Stack spacing={2}>{filters.map((filter, index) => {
      const definition = fields.find(row => row.field === filter.field);
      return <Grid container spacing={1} key={index}><Grid item xs={12} md={4}><Autocomplete options={fields} getOptionLabel={row => titleOf(row.field)} value={definition || null} onChange={(_, value) => setFilters(previous => previous.map((row, i) => i === index ? { field: value?.field || '', value: '' } : row))} renderInput={params => <TextField {...params} size="small" label="Filter field" />} /></Grid><Grid item xs={10} md={7}>{definition?.type === 'Date' || definition?.type === 'Number' ? <TextField fullWidth size="small" label="Filter value" type={definition.type === 'Date' ? 'date' : 'number'} InputLabelProps={{ shrink: true }} value={filter.value} onChange={event => setFilters(previous => previous.map((row, i) => i === index ? { ...row, value: event.target.value } : row))} /> : <ProgramChoice key={`${index}-${filter.field}-${program?.programcode}`} title="Filter value" freeSolo endpoint={`${root}/report-options`} addPath={sourcePaths[filter.field]} params={{ academicyear: year?.name, programcode: program?.programcode, field: filter.field }} disabled={!year || !program || !filter.field} value={filter.value ? { name: filter.value } : null} onChange={value => setFilters(previous => previous.map((row, i) => i === index ? { ...row, value: typeof value === 'string' ? value : value?.name || '' } : row))} />}</Grid><Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => setFilters(previous => previous.filter((_, i) => i !== index))}><Close /></IconButton></Grid></Grid>;
    })}<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button startIcon={<Add />} disabled={!program || busy} onClick={() => setFilters(previous => [...previous, { field: 'pipeline', value: '' }])}>Add filter</Button><Button variant="contained" disabled={!year || !program || busy} onClick={() => load({ academicyear: year.name, programcode: program.programcode, filters: JSON.stringify(filters) }, { page: 0, pageSize: page.pageSize })}>Load report</Button></Stack></Stack></Paper>
    {busy && <LinearProgress />}
    {result && <>{result.legacy > 0 && <Alert severity="warning">{result.legacy} older allocations for this program have no academic year and are excluded from this report.</Alert>}<Visuals result={result} summaryMode={summaryMode} /><Stack direction="row" spacing={1}><Button startIcon={<Download />} disabled={busy} onClick={download}>{selected.length ? 'Export selected' : 'Export all matching'}</Button><Button startIcon={<Print />} disabled={busy} onClick={print}>Print preview</Button></Stack><Typography variant="h6">Lead details ({result.total})</Typography><Details result={result} page={page} onPage={onPage} selected={selected} setSelected={setSelected} onOpen={openDetail} busy={busy} /></>}
    <Dialog open={Boolean(detail)} fullWidth maxWidth="lg" onClose={() => setDetail(null)}><DialogTitle>{detail?.name} - All details<IconButton title="Close details" sx={{ float: 'right' }} onClick={() => setDetail(null)}><Close /></IconButton></DialogTitle><DialogContent><Grid container spacing={2} sx={{ pt: 1 }}>{Object.entries(detail || {}).filter(([field]) => !['_id', 'colid', '__v', 'mappingid'].includes(field)).map(([field, value]) => <Grid item xs={12} md={typeof value === 'object' ? 12 : 6} key={field}><Typography variant="caption" color="text.secondary">{titleOf(field)}</Typography><Typography component="div" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{printable(value) || '-'}</Typography></Grid>)}</Grid></DialogContent></Dialog>
    <Snackbar key={notice?.id} open={Boolean(notice)} autoHideDuration={7000} onClose={(_, reason) => { if (reason !== 'clickaway') setNotice(null); }} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'error'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function Crm2ProgramReportPage({ summaryMode = false }) { return <MenuPageShell title={summaryMode ? 'Programwise summary report' : 'Programwise lead report'}><Content key={String(summaryMode)} summaryMode={summaryMode} /></MenuPageShell>; }
