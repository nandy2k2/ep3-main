import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, LinearProgress, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Print, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MenuPageShell from './MenuPageShell';
import { addOption, handleAddOption } from './addableAutocompleteHelpers';
import { supervisorGroups, supervisorMarkup, supervisorStyles } from './SupervisorSheet2Print';
import { supervisor3Groups, supervisor3Markup, supervisor3Styles } from './SupervisorSheet3Print';
import ep1 from '../api/ep1';
import global1 from './global1';
const unique = (rows, fields) => [...new Map(rows.map(row => [JSON.stringify(fields.map(key => row[key])), row])).values()];
function Content({ variant }) {
  const is3 = variant === '3';
  const title = is3 ? 'Supervisor report 3' : 'Supervisor sheet 2';
  const styles = is3 ? supervisor3Styles : supervisorStyles;
  const navigate = useNavigate();
  const [exams, setExams] = useState([]), [courses, setCourses] = useState([]), [year, setYear] = useState(''), [exam, setExam] = useState(null), [program, setProgram] = useState(null), [course, setCourse] = useState(null);
  const [data, setData] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [identifier, setIdentifier] = useState('seatno');
  useEffect(() => {
    const controller = new AbortController();
    if (!Number(global1.colid)) { setNotice('Institution is unavailable. Please sign in again.'); return undefined; }
    setBusy(true);
    ep1.get('/api/v2/conductexam/exams', { params: { colid: global1.colid }, signal: controller.signal }).then(res => {
      if (!Array.isArray(res.data.data)) throw new Error('Unable to load Create exam master data.');
      setExams(res.data.data);
    }).catch(error => { if (!controller.signal.aborted) setNotice(error.response?.data?.message || error.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    setCourses([]);
    if (!year || !exam?.examcode) return undefined;
    const controller = new AbortController();
    setBusy(true);
    ep1.get('/api/v2/conductexam/examcourses', { params: { colid: global1.colid, academicyear: year, examcode: exam.examcode }, signal: controller.signal }).then(res => {
      if (!Array.isArray(res.data.data)) throw new Error('Unable to load Populate exam courses master data.');
      setCourses(res.data.data);
      if (!res.data.data.length) setNotice('No courses have been populated for this academic year and exam. Add them in Populate exam courses.');
    }).catch(error => { if (!controller.signal.aborted) setNotice(error.response?.data?.message || error.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [year, exam?.examcode]);
  const markup = useMemo(() => data ? (is3 ? supervisor3Markup : supervisorMarkup)(data, identifier) : '', [data, identifier, is3]);
  const load = async () => {
    setBusy(true); setData(null);
    try {
      const rolls = await ep1.get('/api/v2/conductexam/examrolls', { params: { colid: global1.colid, academicyear: year, examcode: exam.examcode, program: program.program, programcode: program.programcode, course: course.course, coursecode: course.coursecode } });
      if (!Array.isArray(rolls.data.data)) throw new Error('Unable to load examroll entries.');
      const institution = await ep1.get('/api/institution', { params: { colid: global1.colid } });
      const institutions = Array.isArray(institution.data) ? institution.data : [];
      const rows = rolls.data.data.map(row => ({ ...row, examseatno: row.examseatno === String(row._id) ? row.seatno || '' : row.examseatno }));
      setData({ rows, institution: institutions[institutions.length - 1] || {}, exam, course });
      if (!rows.length) setNotice('No examroll entries found for the selected details.');
    } catch (error) { setNotice(error.response?.data?.message || error.message); } finally { setBusy(false); }
  };
  const print = () => {
    const popup = window.open('', '_blank');
    if (!popup) { setNotice('Allow popups to print the supervisor sheet.'); return; }
    popup.document.write(`<!doctype html><html><head><title>${title}</title><style>${styles}</style></head><body>${markup}</body></html>`);
    popup.document.close();
    const ready = [...popup.document.images].map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }));
    Promise.all(ready).then(() => { if (!popup.closed) { popup.focus(); popup.print(); } });
  };
  const choose = (label, options, value, path, onChange) => <Autocomplete disabled={busy} options={[addOption(`+ Add ${label}`, path), ...options]} value={value} isOptionEqualToValue={(a, b) => typeof a === 'string' ? a === b : a._id === b._id} getOptionLabel={option => typeof option === 'string' ? option : option.__addOption ? option.label : label === 'Program' ? `${option.program} (${option.programcode})` : label === 'Course' ? `${option.course} (${option.coursecode})` : `${option.examname || option.exam} (${option.examcode})`} onChange={(_, next) => { if (!handleAddOption(next, navigate)) { onChange(next); setData(null); } }} renderInput={params => <TextField {...params} label={label} size="small" />} />;
  const missing = data?.rows?.filter(row => !(identifier === 'seatno' ? row.examseatno || row.seatno : row[identifier])).length || 0;
  return <Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">{title}</Typography>
    <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={4}>{choose('Academic year', [...new Set(exams.map(row => row.academicyear))].filter(Boolean).sort().reverse(), year || null, '/conduct-exam-master', value => { setYear(value || ''); setExam(null); setProgram(null); setCourse(null); })}</Grid>
      <Grid item xs={12} md={4}>{choose('Exam', exams.filter(row => row.academicyear === year), exam, '/conduct-exam-master', value => { setExam(value); setProgram(null); setCourse(null); })}</Grid>
      <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Exam code" value={exam?.examcode || ''} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={4}>{choose('Program', unique(courses, ['program', 'programcode']), program, '/conduct-exam-populate-courses', value => { setProgram(value); setCourse(null); })}</Grid>
      <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Program code" value={program?.programcode || ''} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={4}>{choose('Course', unique(courses.filter(row => row.program === program?.program && row.programcode === program?.programcode), ['course', 'coursecode']), course, '/conduct-exam-populate-courses', setCourse)}</Grid>
      <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Course code" value={course?.coursecode || ''} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={4}><TextField select size="small" fullWidth label="Student identifier" value={identifier} onChange={event => setIdentifier(event.target.value)}><MenuItem value="seatno">Seat number</MenuItem><MenuItem value="_id">MongoDB code</MenuItem><MenuItem value="shortbarcode">Shortcode</MenuItem><MenuItem value="regno">Regno</MenuItem></TextField></Grid>
      <Grid item xs={12} md={4}><Stack direction="row" spacing={1}><Button startIcon={<Refresh />} variant="contained" disabled={busy || !year || !exam || !program || !course} onClick={load}>Load sheet</Button><Button startIcon={<Print />} disabled={busy || !data?.rows?.length} onClick={print}>Print</Button></Stack></Grid>
    </Grid></Paper>
    {busy && <LinearProgress />}
    {data?.rows?.length > 0 && <Typography>{data.rows.length} examroll entries | {is3 ? supervisor3Groups(data.rows).length : supervisorGroups(data.rows).length * 2} print pages</Typography>}
    {missing > 0 && <Alert severity="warning">{missing} entries have no selected identifier. Those cells will remain blank.</Alert>}
    {markup && <Box sx={{ overflowX: 'auto', bgcolor: '#e5e7eb', p: 2 }}><iframe title="Supervisor sheet print preview" style={{ border: 0, width: '210mm', height: '1100px', background: '#fff' }} srcDoc={`<!doctype html><html><head><style>${styles}</style></head><body>${markup}</body></html>`} /></Box>}
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="info" onClose={() => setNotice(null)}>{notice}</Alert></Snackbar>
  </Stack>;
}
export default function SupervisorSheet2Page({ variant = '2' }) { return <MenuPageShell title={variant === '3' ? 'Supervisor report 3' : 'Supervisor sheet 2'}><Content key={variant} variant={variant} /></MenuPageShell>; }
