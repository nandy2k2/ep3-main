import React, { useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Add, Delete, Download, Edit, Save, Upload } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
const root = '/api/v2/admission-scholarships';
const blank = { scholarship: '', description: '', academicyear: '', value: '', type: 'Amount', category: 'All', merit: 'No', meritpercentage: 0, gender: 'All', active: 'Yes' };
const enums = { type: ['Amount', 'Percentage'], category: ['General', 'SC', 'ST', 'OBC', 'All'], merit: ['Yes', 'No'], gender: ['Male', 'Female', 'All'], active: ['Yes', 'No'] };
const fields = ['scholarship', 'description', 'academicyear', 'program', 'programcode', 'value', 'type', 'category', 'merit', 'meritpercentage', 'gender', 'active'];
const labels = { scholarship: 'Scholarship', description: 'Description', program: 'Program', programcode: 'Program code', value: 'Value', type: 'Type', category: 'Category', merit: 'Merit', meritpercentage: 'Merit percentage', gender: 'Gender', active: 'Active' };
labels.academicyear = 'Academic year';
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
export default function AdmissionScholarshipMasterPage() {
  const [form, setForm] = useState(blank), [programs, setPrograms] = useState([]), [edit, setEdit] = useState(''), [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [search, setSearch] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const notify = (message, severity = 'success') => setNotice({ message, severity });
  const reset = () => { setEdit(''); setForm({ ...blank }); setPrograms([]); };
  const load = async () => { const res = await ep1.get(root, { params: { ...scope(), search } }); setRows(res.data.data || []); setSelected([]); };
  const run = async action => { setBusy(true); try { await action(); } catch (error) { notify(error.response?.data?.message || error.message, 'error'); } finally { setBusy(false); } };
  const save = () => run(async () => {
    if (!form.scholarship.trim() || !programs.length) throw Error('Enter scholarship and select at least one program');
    await ep1.post(`${root}/save`, { ...scope(), id: edit || undefined, rows: programs.map(program => ({ ...form, programcode: program.programcode })) });
    reset(); await load(); notify('Scholarship saved');
  });
  const columns = useMemo(() => [{ field: 'edit', headerName: '', width: 75, renderCell: ({ row }) => <Button aria-label={`Edit ${row.scholarship}`} onClick={() => { setEdit(row._id); setForm(Object.fromEntries(Object.keys(blank).map(key => [key, row[key] ?? blank[key]]))); setPrograms([{ program: row.program, programcode: row.programcode }]); }}><Edit /></Button> }, ...fields.map(field => ({ field, headerName: labels[field], minWidth: field === 'description' ? 260 : 155 }))], []);
  const template = () => { const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ ...blank, scholarship: 'Merit award', programcode: 'P1', value: 10, type: 'Percentage', merit: 'Yes', meritpercentage: 80 }]), 'Scholarships'); XLSX.writeFile(workbook, 'admission_scholarship_template.xlsx'); };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await run(async () => { const workbook = XLSX.read(await file.arrayBuffer()); const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
      await ep1.post(`${root}/save`, { ...scope(), rows: data }); await load(); notify('Scholarships uploaded'); });
  };
  return <MenuPageShell title="Scholarship master"><Stack spacing={2} sx={{ p: 3 }}>
    <Typography variant="h5">Scholarship master</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>
      {['scholarship', 'description'].map(field => <TextField key={field} label={labels[field]} value={form[field]} multiline={field === 'description'} onChange={event => setForm(previous => ({ ...previous, [field]: event.target.value }))} />)}
      <ProgramChoice title="Academic year (blank: all years)" endpoint="/api/v2/crm2-programs/academic-years" value={form.academicyear ? { name: form.academicyear } : null} onChange={value => setForm(previous => ({ ...previous, academicyear: value?.name || '' }))} addPath="/programmanagement" />
      <ProgramChoice title="Programs" endpoint="/api/v2/crm2-programs/programs" multiple value={programs} onChange={values => setPrograms(edit ? values.slice(-1) : values)} addPath="/programmanagement" disabled={busy} />
      <TextField label="Program codes" value={programs.map(program => program.programcode).join(', ')} InputProps={{ readOnly: true }} />
      {['value', 'meritpercentage'].map(field => <TextField key={field} label={labels[field]} type="number" value={form[field]} inputProps={{ min: 0, step: 'any', max: field === 'meritpercentage' || form.type === 'Percentage' ? 100 : undefined }} onChange={event => setForm(previous => ({ ...previous, [field]: event.target.value }))} />)}
      {Object.entries(enums).map(([field, options]) => <Autocomplete key={field} options={options} value={form[field]} onChange={(_, value) => setForm(previous => ({ ...previous, [field]: value || blank[field] }))} renderInput={params => <TextField {...params} label={labels[field]} />} />)}
    </Box>
    <Stack direction="row" gap={1} flexWrap="wrap"><Button startIcon={<Save />} variant="contained" disabled={busy} onClick={save}>{edit ? 'Update' : 'Save'}</Button><Button startIcon={<Add />} disabled={busy} onClick={reset}>New</Button></Stack>
    <Stack direction="row" gap={1} flexWrap="wrap"><TextField size="small" label="Search scholarships" value={search} onChange={event => setSearch(event.target.value)} /><Button disabled={busy} onClick={() => run(load)}>Load</Button><Button startIcon={<Download />} onClick={template}>Template</Button><Button component="label" startIcon={<Upload />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button><Button startIcon={<Delete />} color="error" disabled={busy || !selected.length} onClick={() => { if (window.confirm(`Delete ${selected.length} scholarships?`)) run(async () => { await ep1.post(`${root}/delete`, { ...scope(), ids: selected }); reset(); await load(); notify('Scholarships deleted'); }); }}>Delete selected</Button></Stack>
    {busy && <LinearProgress />}
    <Box sx={{ height: 520 }}><DataGrid rows={rows} getRowId={row => row._id} columns={columns} loading={busy} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={setSelected} slots={{ toolbar: GridToolbar }} /></Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
