import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Close, Delete, Download, Edit, Refresh, Save, UploadFile } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
const examFields = ['academicyear','exam','examcode','program','programcode','startdate','enddate','amount','finetype','coursetype'];
const labels = { academicyear: 'Academic year', exam: 'Exam', examcode: 'Exam code', program: 'Program', programcode: 'Program code', startdate: 'Start date', enddate: 'End date', amount: 'Amount', finetype: 'Fine type', coursetype: 'Course type' };
const examBlank = { academicyear: '', exam: '', examcode: '', program: '', programcode: '', startdate: '', enddate: '', amount: '', finetype: 'flat', coursetype: 'flat' };
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const message = error => error.response?.data?.message || error.message;
function Choice({ title, options, value, onChange, onAdd, getOptionLabel = value => value, freeSolo = false }) {
  const add = { add: true };
  return <Autocomplete size="small" freeSolo={freeSolo} options={onAdd ? [add, ...options] : options} value={value || null} getOptionLabel={option => option?.add ? `+ Add ${title}` : getOptionLabel(option) || ''} isOptionEqualToValue={(a,b) => JSON.stringify(a) === JSON.stringify(b)} onChange={(_, selected) => selected?.add ? onAdd() : onChange(selected)} renderInput={params => <TextField {...params} label={title} />} />;
}
export default function ConductExamFinePage({ lateFeePolicy = false }) {
  const root = lateFeePolicy ? '/api/v2/late-fee-policy' : '/api/v2/conductexam/exam-fine';
  const fields = lateFeePolicy ? examFields.filter(field => !['exam','examcode','coursetype'].includes(field)) : examFields;
  const blank = lateFeePolicy ? Object.fromEntries(fields.map(field => [field, examBlank[field]])) : examBlank;
  const title = lateFeePolicy ? 'Late fine policy' : 'Exam fine';
  const [form, setForm] = useState(blank), [options, setOptions] = useState({ exams: [], programs: [], academicyears: [] });
  const [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [filters, setFilters] = useState([]);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [embedded, setEmbedded] = useState(''), [frameLoading, setFrameLoading] = useState(false);
  const notify = (text, severity = 'success') => setNotice({ text, severity });
  const run = async callback => { setBusy(true); try { await callback(); } catch (error) { notify(message(error), 'error'); } finally { setBusy(false); } };
  const loadOptions = async () => setOptions((await ep1.get(`${root}-options`, { params: scope() })).data);
  useEffect(() => { loadOptions().catch(error => notify(message(error), 'error')); }, []);
  const load = async () => { setRows(((await ep1.get(root, { params: { ...scope(), filters: JSON.stringify(filters) } })).data.data || []).map(row => ({ ...row, coursetype: row.coursetype === 'overall' ? 'flat' : row.coursetype }))); setSelected([]); };
  const openAdd = path => { setEmbedded(path); setFrameLoading(true); };
  const programs = options.programs.filter((row, i, all) => all.findIndex(other => other.programcode === row.programcode && other.program === row.program) === i);
  const exams = options.exams.filter(row => row.academicyear === form.academicyear);
  const patch = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const save = () => run(async () => {
    await ep1.post(root, { ...form, id: form._id, ...scope() }); setForm(blank); await load(); notify(`${title} saved`);
  });
  const remove = ids => run(async () => {
    if (!window.confirm(`Delete ${ids.length} fine rule(s)?`)) return;
    await ep1.post(`${root}-delete`, { ...scope(), ids }); if (ids.includes(form._id)) setForm(blank); await load(); notify(`${title} deleted`);
  });
  const download = () => { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([fields]), title); XLSX.writeFile(book, lateFeePolicy ? 'late_fine_policy_template.xlsx' : 'exam_fine_template.xlsx'); };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await run(async () => {
      const book = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '' }).map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key, value instanceof Date ? value.toISOString().slice(0,10) : value])));
      const result = (await ep1.post(`${root}-bulk`, { ...scope(), rows: data })).data;
      await load(); notify(`${result.saved} saved${result.errors.length ? `. ${result.errors.map(row => `Row ${row.row}: ${row.message}`).join('; ')}` : ''}`, result.errors.length ? 'warning' : 'success');
    });
  };
  const filterOptions = field => field === 'academicyear' ? options.academicyears : field === 'exam' ? [...new Set(options.exams.map(row => row.examname || row.exam))] : field === 'examcode' ? [...new Set(options.exams.map(row => row.examcode))] : field === 'program' || field === 'programcode' ? [...new Set(programs.map(row => row[field]))] : field === 'finetype' ? ['per day','flat'] : field === 'coursetype' ? ['per course','flat'] : [];
  return <MenuPageShell title={title}><Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">{title}</Typography>{busy && <LinearProgress />}
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><Choice title="Academic year" freeSolo options={options.academicyears} value={form.academicyear} onChange={value => setForm(previous => ({ ...previous, academicyear: value || '', exam: '', examcode: '' }))} /></Grid>
      {!lateFeePolicy && <Grid item xs={12} md={4}><Choice title="Exam" options={exams} value={exams.find(row => row.examcode === form.examcode)} getOptionLabel={row => `${row.examname || row.exam} (${row.examcode})`} onAdd={() => openAdd('/conduct-exam-master')} onChange={row => setForm(previous => ({ ...previous, exam: row?.examname || row?.exam || '', examcode: row?.examcode || '' }))} /></Grid>}
      {!lateFeePolicy && <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Exam code" value={form.examcode} InputProps={{ readOnly: true }} /></Grid>}
      <Grid item xs={12} md={4}><Choice title="Program" options={programs} value={programs.find(row => row.programcode === form.programcode && row.program === form.program)} getOptionLabel={row => `${row.program} (${row.programcode})`} onAdd={() => openAdd('/programmanagement')} onChange={row => setForm(previous => ({ ...previous, program: row?.program || '', programcode: row?.programcode || '' }))} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Program code" value={form.programcode} InputProps={{ readOnly: true }} /></Grid>
      {['startdate','enddate','amount'].map(field => <Grid item xs={12} md={4} key={field}><TextField fullWidth size="small" label={labels[field]} type={field === 'amount' ? 'number' : 'date'} InputLabelProps={{ shrink: true }} inputProps={field === 'amount' ? { min: 0, step: '0.01' } : undefined} value={form[field]} onChange={event => patch(field, event.target.value)} /></Grid>)}
      <Grid item xs={12} md={4}><Choice title="Fine type" options={['per day','flat']} value={form.finetype} onChange={value => patch('finetype', value || '')} /></Grid>
      {!lateFeePolicy && <Grid item xs={12} md={4}><Choice title="Course type" options={['per course','flat']} value={form.coursetype} onChange={value => patch('coursetype', value || '')} /></Grid>}
    </Grid>
    <Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={busy || (!lateFeePolicy && !form.examcode) || !form.academicyear || !form.programcode || !form.startdate || !form.enddate || form.amount === ''} onClick={save}>{form._id ? 'Save changes' : 'Save'}</Button><Button disabled={busy} onClick={() => setForm(blank)}>Reset</Button></Stack>
    <Typography variant="h6">Fine rules</Typography>
    {filters.map((filter, index) => <Grid container spacing={1} key={index}><Grid item xs={12} md={4}><Choice title="Filter field" options={fields} value={filter.field} getOptionLabel={field => labels[field]} onChange={field => setFilters(previous => previous.map((row,i) => i === index ? { field, value: '' } : row))} /></Grid><Grid item xs={10} md={7}>{['startdate','enddate','amount'].includes(filter.field) ? <TextField fullWidth size="small" label="Filter value" type={filter.field === 'amount' ? 'number' : 'date'} InputLabelProps={{ shrink: true }} value={filter.value} onChange={event => setFilters(previous => previous.map((row,i) => i === index ? { ...row, value: event.target.value } : row))} /> : <Choice title="Filter value" options={filterOptions(filter.field)} value={filter.value} onChange={value => setFilters(previous => previous.map((row,i) => i === index ? { ...row, value: value || '' } : row))} />}</Grid><Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => setFilters(previous => previous.filter((_,i) => i !== index))}><Close /></IconButton></Grid></Grid>)}
    <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}><Button startIcon={<Add />} onClick={() => setFilters(previous => [...previous, { field: 'academicyear', value: '' }])}>Add filter</Button><Button startIcon={<Refresh />} disabled={busy} onClick={() => run(load)}>Load</Button><Button startIcon={<Delete />} color="error" disabled={busy || !selected.length} onClick={() => remove(selected)}>Delete selected ({selected.length})</Button><Button startIcon={<Download />} onClick={download}>Upload template</Button><Button startIcon={<UploadFile />} component="label" disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button></Stack>
    <Box sx={{ height: 500 }}><DataGrid rows={rows} getRowId={row => row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} disableRowSelectionOnClick loading={busy} slots={{ toolbar: GridToolbar }} columns={[{ field: 'actions', headerName: 'Edit', width: 70, renderCell: params => <IconButton title="Edit fine" onClick={() => setForm(params.row)}><Edit /></IconButton> }, ...fields.map(field => ({ field, headerName: labels[field], minWidth: 145, flex: field === 'program' ? 1 : undefined }))]} /></Box>
    <Snackbar open={!!notice} autoHideDuration={9000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
    <Dialog open={!!embedded} fullWidth maxWidth="xl" onClose={() => { setEmbedded(''); loadOptions().catch(error => notify(message(error), 'error')); }}><DialogTitle>Add master data<IconButton title="Close" sx={{ float: 'right' }} onClick={() => { setEmbedded(''); loadOptions().catch(error => notify(message(error), 'error')); }}><Close /></IconButton></DialogTitle><DialogContent>{frameLoading && <LinearProgress />}{embedded && <iframe title="Add master data" src={`${embedded}?embedded=1`} onLoad={() => setFrameLoading(false)} style={{ border: 0, width: '100%', height: '75vh' }} />}</DialogContent></Dialog>
  </Stack></MenuPageShell>;
}
