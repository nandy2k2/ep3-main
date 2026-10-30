import React, { useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete, Box, Button, Chip, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { ExpandMore, Refresh } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
export function semesterGroups(rows) {
  const groups = new Map();
  rows.forEach(row => {
    const key = JSON.stringify([row.academicyear, row.semester]);
    if (!groups.has(key)) groups.set(key, { key, year: row.academicyear, semester: row.semester, rows: [] });
    groups.get(key).rows.push(row);
  });
  return [...groups.values()].sort((a, b) => String(a.semester).localeCompare(String(b.semester), undefined, { numeric: true }) || String(b.year).localeCompare(String(a.year)));
}
const columns = [
  ['exam', 'Exam', 180], ['examcode', 'Exam code', 130], ['course', 'Course', 220], ['coursecode', 'Course code', 140],
  ['componenttype', 'Type', 110], ['assessmentcomponent', 'Assessment component', 190],
  ['maxmarks', 'Maximum marks', 140], ['marksobtained', 'Marks obtained', 140],
  ['attendance', 'Attendance', 120], ['passstatus', 'Pass / Fail', 110], ['approvalstatus', 'Approval status', 140],
  ['program', 'Program', 200], ['programcode', 'Program code', 140], ['regulation', 'Regulation', 130]
].map(([field, headerName, width]) => ({ field, headerName, width }));
export function internalMarksColumns(weightageView = false) {
  if (!weightageView) return columns;
  const result = columns.filter(column => column.field !== 'passstatus');
  result.splice(result.findIndex(column => column.field === 'maxmarks'), 0, { field: 'weightage', headerName: 'Weightage (%)', width: 150, type: 'number', valueFormatter: params => params.value == null ? '-' : `${Number((Number(params.value) * 100).toFixed(2))}%` });
  return result;
}
export default function StudentInternalMarksViewPage({ weightageView = false }) {
  const title = weightageView ? 'Internal Marks View 2' : 'Internal marks view';
  const viewColumns = useMemo(() => internalMarksColumns(weightageView), [weightageView]);
  const [rows, setRows] = useState([]), [year, setYear] = useState(null), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [error, setError] = useState('');
  const groups = useMemo(() => semesterGroups(rows.filter(row => (!year || row.academicyear === year) && [row.course, row.coursecode, row.exam, row.assessmentcomponent].some(value => String(value || '').toLowerCase().includes(search.toLowerCase())))), [rows, year, search]);
  const load = async () => {
    setBusy(true); setError(''); setRows([]); setLoaded(false);
    try {
      if (!global1.colid || !(global1.user || global1.email)) throw new Error('Please sign in as a student again.');
      const res = await ep1.get(weightageView ? '/api/v2/student-internal-marks-2' : '/api/v2/student-internal-marks', { params: { colid: global1.colid, email: global1.user || global1.email } });
      setRows((res.data.data || []).filter(row => row.scoretype === 'Internal' && row.approvalstatus === 'Approved'));
      setYear(null); setLoaded(true);
    } catch (err) { setError(err.response?.data?.message || err.message); } finally { setBusy(false); }
  };
  return <MenuPageShell title={title} menuType={weightageView ? 'student' : undefined}><Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
    <Typography variant="h5">{title}</Typography>
    <Typography color="text.secondary">Approved internal assessment marks</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button variant="contained" startIcon={<Refresh />} disabled={busy} onClick={load}>Load marks</Button>
      <Autocomplete sx={{ minWidth: 220 }} options={[...new Set(rows.map(row => row.academicyear).filter(Boolean))].sort().reverse()} value={year} onChange={(_, value) => setYear(value)} renderInput={params => <TextField {...params} size="small" label="Academic year" />} />
      <TextField size="small" label="Search course, exam or component" value={search} onChange={event => setSearch(event.target.value)} sx={{ flex: 1 }} />
    </Stack>
    {busy && <LinearProgress />}
    {loaded && !groups.length && <Alert severity="info">No approved internal marks found.</Alert>}
    {groups.map(group => <Accordion key={group.key} defaultExpanded={groups.length === 1} disableGutters>
      <AccordionSummary expandIcon={<ExpandMore />}><Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap><Typography fontWeight={700}>Semester {group.semester || 'Not specified'}</Typography><Typography color="text.secondary">{group.year}</Typography><Chip size="small" label={`${group.rows.length} assessments`} /></Stack></AccordionSummary>
      <AccordionDetails><Box sx={{ height: 420, width: '100%' }}><DataGrid rows={group.rows} columns={viewColumns} getRowId={row => row._id} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick pageSizeOptions={[10,25,50]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} /></Box></AccordionDetails>
    </Accordion>)}
    <Snackbar open={Boolean(error)} autoHideDuration={8000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
