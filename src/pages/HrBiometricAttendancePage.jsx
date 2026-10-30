import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, LinearProgress, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Delete, Download, Edit, Refresh, Save, Upload } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';
import { embeddedAwarePath } from './addableAutocompleteHelpers';

const root = '/api/v2/hr-biometric-attendance';
const today = new Date().toLocaleDateString('en-CA');
const blank = { academicyear: '2026-27', biometricid: '', date: today, attendance: 1, intime: '', outtime: '' };
export function excelAttendanceRows(sheet, date1904 = false) {
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }).map(row => {
    const result = {};
    for (const [key, value] of Object.entries(row)) result[key.trim().toLowerCase().replace(/[ _-]/g, '')] = value;
    // Read native Excel date serials separately, while retaining formatted biometric IDs (including leading zeros).
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })[0] || [];
    const dateColumn = headers.findIndex(key => String(key).trim().toLowerCase() === 'date');
    const sourceIndex = row.__rowNum__;
    const cell = dateColumn >= 0 && sourceIndex !== undefined ? sheet[XLSX.utils.encode_cell({ r: sourceIndex, c: dateColumn })] : null;
    if (cell?.t === 'n') {
      const parsed = XLSX.SSF.parse_date_code(cell.v, { date1904 });
      if (parsed) result.date = `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
    return result;
  });
}
export default function HrBiometricAttendancePage() {
  const [form, setForm] = useState(blank), [rows, setRows] = useState([]), [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({ academicyear: '2026-27', fromdate: today.slice(0, 8) + '01', todate: today, biometricid: '' });
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [errors, setErrors] = useState([]), [toast, setToast] = useState(null);
  const notify = (message, severity = 'success') => setToast({ message, severity });
  const load = async () => {
    setBusy(true);
    try { const response = await ep1.get(root, { params: { colid: global1.colid, ...filters } }); setRows(response.data.data || []); setSelected([]); }
    catch (error) { notify(error.response?.data?.message || error.message, 'error'); }
    finally { setBusy(false); }
  };
  const process = async (items, deleting = false) => {
    if (!items.length || !window.confirm(deleting ? 'Delete selected attendance and reverse its unsettled deductions?' : 'Save attendance and apply/recalculate salary deductions for unapproved absences?')) return;
    setBusy(true); setProgress(0); setErrors([]);
    const failures = []; let saved = 0;
    try {
      for (let offset = 0; offset < items.length; offset += 50) {
        const batch = items.slice(offset, offset + 50);
        const response = await ep1.post(`${root}/${deleting ? 'delete' : 'save'}`, { colid: global1.colid, user: global1.user, [deleting ? 'ids' : 'rows']: batch });
        for (const result of response.data.results) {
          if (result.success) saved += 1;
          else failures.push({ row: offset + (result.index ?? batch.indexOf(result.id)) + 1, ...result });
        }
        setProgress(Math.round(Math.min(offset + batch.length, items.length) / items.length * 100));
      }
      setErrors(failures); notify(`${saved} processed; ${failures.length} failed`, failures.length ? 'warning' : 'success');
      if (saved) { const response = await ep1.get(root, { params: { colid: global1.colid, ...filters } }); setRows(response.data.data || []); setSelected([]); }
    } catch (error) { setErrors(failures); notify(error.response?.data?.message || error.message, 'error'); }
    finally { setBusy(false); }
  };
  const columns = useMemo(() => [
    { field: 'edit', headerName: 'Edit', width: 65, sortable: false, renderCell: ({ row }) => <Button aria-label="Edit attendance" onClick={() => setForm({ id: row._id, academicyear: row.academicyear, biometricid: row.biometricid, date: row.date, attendance: row.attendance, intime: row.intime || '', outtime: row.outtime || '' })}><Edit /></Button> },
    ...['date', 'biometricid', 'name', 'email', 'role', 'academicyear', 'month', 'year', 'attendance', 'intime', 'outtime', 'monthlysalary', 'deduction', 'reason'].map(field => ({ field, headerName: ({ biometricid: 'Biometric ID', academicyear: 'Academic year', monthlysalary: 'Monthly earnings', deduction: 'Salary deduction' })[field] || field, minWidth: field === 'reason' ? 380 : 145, flex: field === 'reason' ? 1 : undefined }))
  ], []);
  const template = () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([{ academicyear: '2026-27', biometricid: '00012', date: '2026-10-01', attendance: 1, intime: '09:00', outtime: '17:00' }]), 'Attendance');
    XLSX.writeFile(book, 'biometric_attendance_template.xlsx');
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try { const book = XLSX.read(await file.arrayBuffer(), { type: 'array' }); await process(excelAttendanceRows(book.Sheets[book.SheetNames[0]], Boolean(book.Workbook?.WBProps?.date1904))); }
    catch (error) { notify(error.message, 'error'); }
  };
  const field = (key, label, type = 'text', filter = false) => <TextField size="small" label={label} type={type} value={(filter ? filters : form)[key]} disabled={busy || (!filter && Boolean(form.id) && ['biometricid', 'date', 'academicyear'].includes(key))} InputLabelProps={type === 'date' || type === 'time' ? { shrink: true } : undefined} onChange={event => (filter ? setFilters : setForm)(previous => ({ ...previous, [key]: event.target.value }))} />;
  return <MenuPageShell title="Biometric employee attendance"><Box sx={{ p: 3 }}>
    <Typography variant="h5" mb={2}>Biometric employee attendance</Typography>
    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
      <Button component={Link} to={embeddedAwarePath('/biometric-id-mapping')}>Add / update biometric mapping</Button>
      <Button component={Link} to={embeddedAwarePath('/employee-due-salary-new')}>Employee salary</Button>
      <Button component={Link} to={embeddedAwarePath('/employeeledgernew')}>Employee ledger</Button>
    </Stack>
    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
      {field('academicyear', 'Academic year')}{field('biometricid', 'Biometric ID')}{field('date', 'Date', 'date')}
      <TextField select size="small" label="Attendance" value={form.attendance} disabled={busy} onChange={event => setForm(previous => ({ ...previous, attendance: Number(event.target.value) }))}><MenuItem value={1}>Present</MenuItem><MenuItem value={0}>Absent</MenuItem></TextField>
      {field('intime', 'In time', 'time')}{field('outtime', 'Out time', 'time')}
      <Button startIcon={<Save />} variant="contained" disabled={busy} onClick={() => process([form])}>Save / reprocess</Button>
      <Button disabled={busy} onClick={() => setForm({ ...blank })}>New / reset</Button>
      <Button startIcon={<Download />} disabled={busy} onClick={template}>Template</Button>
      <Button component="label" startIcon={<Upload />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls" onChange={upload} /></Button>
    </Stack>
    <Stack direction="row" flexWrap="wrap" gap={2} mb={2}>
      {field('academicyear', 'Filter academic year', 'text', true)}{field('fromdate', 'From date', 'date', true)}{field('todate', 'To date', 'date', true)}{field('biometricid', 'Filter biometric ID', 'text', true)}
      <Button startIcon={<Refresh />} disabled={busy} onClick={load}>Load</Button>
      <Button startIcon={<Delete />} color="error" disabled={busy || !selected.length} onClick={() => process(selected, true)}>Delete selected</Button>
      <Button disabled={busy || !selected.length} onClick={() => process(rows.filter(row => selected.includes(row._id)))}>Reprocess selected</Button>
    </Stack>
    {busy && <Box mb={2}><LinearProgress variant="determinate" value={progress} /><Typography>{progress}%</Typography></Box>}
    {errors.length > 0 && <Box sx={{ maxHeight: 180, overflow: 'auto', mb: 2 }}>{errors.map((error, index) => <Alert severity="error" key={index}>Row {error.row}: {error.biometricid} {error.date} {error.message}</Alert>)}</Box>}
    <Box sx={{ height: 550 }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={setSelected} loading={busy} slots={{ toolbar: GridToolbar }} /></Box>
    <Snackbar open={Boolean(toast)} autoHideDuration={7000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setToast(null)}>{toast ? <Alert variant="filled" severity={toast.severity} onClose={() => setToast(null)}>{toast.message}</Alert> : undefined}</Snackbar>
  </Box></MenuPageShell>;
}
