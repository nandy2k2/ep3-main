import React, { useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete, Button, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Close, ExpandMore, Print, Refresh } from '@mui/icons-material';
import MenuPageShell from './MenuPageShell';
import global1 from './global1';
import ep1 from '../api/ep1';
import { buildCceReports, cceNumber } from './internalMarksCce';
export const cceStyles = `
  .cce-report,.cce-report *{box-sizing:border-box}.cce-report{font-family:Arial,sans-serif;color:#111;background:white}
  .cce-report{margin:0 0 24px}.cce-scroll{overflow-x:auto}.cce-table{width:100%;min-width:900px;border-collapse:collapse;table-layout:fixed;font-size:12px}
  .cce-table th,.cce-table td{border:1px solid #777;padding:9px 5px;text-align:center;overflow-wrap:anywhere;vertical-align:middle}
  .cce-table th{background:#203d60;color:#fff;font-weight:700;line-height:1.3}.cce-table td.course-title,.cce-table td.course-code{text-align:left}
  .cce-table th span{display:block}.cce-status{font-weight:700}.cce-total{font-weight:700}.cce-meta{display:flex;gap:8px 24px;flex-wrap:wrap;margin:10px 0;font-size:13px}
  .cce-header{text-align:center;margin-bottom:18px}.cce-header img{max-height:65px;max-width:140px;object-fit:contain}.cce-header h2{font-size:21px;margin:6px 0}.cce-header h3{font-size:17px;margin:10px 0}.cce-note{font-size:11px;margin-top:8px}
  @page{size:A4 landscape;margin:10mm} @media print{.cce-scroll{overflow:visible}.cce-table{min-width:0;font-size:9px}.cce-table th,.cce-table td{padding:6px 3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}thead{display:table-header-group}tr{break-inside:avoid}.cce-report{break-after:page}.cce-report:last-child{break-after:auto}}
`;
export function CceTable({ report }) {
  const remaining = 72 / Math.max(1, report.columns.length * 2 + 1);
  return <div className="cce-scroll"><table className="cce-table"><colgroup><col style={{ width: '4%' }} /><col style={{ width: '10%' }} /><col style={{ width: '14%' }} />{report.columns.map(column => <React.Fragment key={column.key}><col style={{ width: `${remaining}%` }} /><col style={{ width: `${remaining}%` }} /></React.Fragment>)}<col style={{ width: `${remaining}%` }} /></colgroup>
    <thead><tr><th rowSpan={2}>Sr.<br />No.</th><th rowSpan={2}>Course<br />Code</th><th rowSpan={2}>Course Title</th><th colSpan={report.columns.length * 2}>Continuous and Comprehensive Evaluation (CCE)</th><th rowSpan={2}>CCE Total{report.totalmax != null && <span>(Out of {cceNumber(report.totalmax)})</span>}</th></tr><tr>{report.columns.map(column => <React.Fragment key={column.key}><th>{column.label}<span>(Out of {column.rawmax == null ? 'varies' : cceNumber(column.rawmax)})</span></th><th>{column.label}<span>(Weightage-{column.weight == null ? 'varies' : `${cceNumber(column.weight * 100)}%`})</span></th></React.Fragment>)}</tr></thead>
    <tbody>{report.rows.map((row,index) => <tr key={row.coursecode}><td>{index + 1}</td><td className="course-code">{row.coursecode}</td><td className="course-title">{row.course}</td>{report.columns.map(column => { const cell = row.cells[column.key]; return <React.Fragment key={column.key}><td className={typeof cell.raw === 'string' && cell.raw !== '-' ? 'cce-status' : ''}>{typeof cell.raw === 'string' ? cell.raw : cceNumber(cell.raw)}{column.rawmax == null && cell.rawmax != null && <small> / {cceNumber(cell.rawmax)}</small>}</td><td>{cceNumber(cell.weighted)}{column.weight == null && cell.weight != null && <small> ({cceNumber(cell.weight * 100)}%)</small>}</td></React.Fragment>; })}<td className="cce-total">{row.total}</td></tr>)}</tbody>
  </table></div>;
}
export function CceReport({ report, institution = {}, student = {}, header = false }) {
  return <section className="cce-report">{header && <header className="cce-header">{(institution.logolink || institution.logo) && <img src={institution.logolink || institution.logo} alt="Institution logo" />}<h2>{institution.institutionname || institution.name || ''}</h2><div>{institution.address || ''}</div><h3>Internal Assessment Marks</h3></header>}
    <div className="cce-meta"><strong>{student.name}</strong><span>Enrollment No.: {student.regno}</span><span>Academic year: {report.academicyear}</span><span>Semester: {report.semester}</span><span>{report.program} ({report.programcode})</span><span>{report.exam} ({report.examcode})</span></div><CceTable report={report} /><div className="cce-note">NS: Not submitted / approved marks not available. CCE total is rounded up to the next whole mark.</div>
  </section>;
}
export default function StudentInternalMarksView3Page() {
  const [data, setData] = useState({ data: [], components: [], institution: {}, student: {} }), [year, setYear] = useState(null), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [error, setError] = useState(''), [preview, setPreview] = useState(null);
  const reports = useMemo(() => buildCceReports(data.data, data.components).filter(report => !year || report.academicyear === year).map(report => ({ ...report, rows: report.rows.filter(row => `${row.course} ${row.coursecode}`.toLowerCase().includes(search.toLowerCase())) })).filter(report => report.rows.length), [data, year, search]);
  const load = async () => {
    setBusy(true); setError(''); setLoaded(false); setData({ data: [], components: [], institution: {}, student: {} });
    try {
      if (!global1.colid || !(global1.user || global1.email)) throw new Error('Please sign in as a student again.');
      setData((await ep1.get('/api/v2/student-internal-marks-3', { params: { colid: global1.colid, email: global1.user || global1.email } })).data); setLoaded(true);
    } catch (err) { setError(err.response?.data?.message || err.message); } finally { setBusy(false); }
  };
  const print = () => {
    const win = window.open('', '_blank', 'width=1200,height=850');
    if (!win) { setError('Allow popups to print the marks report.'); return; }
    const content = renderToStaticMarkup(<>{preview.map(report => <CceReport key={report.key} report={report} institution={data.institution || {}} student={data.student} header />)}</>);
    win.document.write(`<!doctype html><html><head><title>Internal Marks View 3</title><style>body{margin:0}${cceStyles}</style></head><body>${content}</body></html>`); win.document.close();
    const images = Array.from(win.document.images);
    Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))).then(() => { win.focus(); win.print(); });
  };
  return <MenuPageShell title="Internal Marks View 3" menuType="student"><Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}><style>{cceStyles}</style><Typography variant="h5">Internal Marks View 3</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><Button startIcon={<Refresh />} variant="contained" disabled={busy} onClick={load}>Load marks</Button><Autocomplete sx={{ minWidth: 200 }} options={[...new Set(data.data.map(row => row.academicyear).filter(Boolean))].sort().reverse()} value={year} onChange={(_,value) => setYear(value)} renderInput={params => <TextField {...params} label="Academic year" size="small" />} /><TextField label="Search course or course code" size="small" value={search} onChange={event => setSearch(event.target.value)} sx={{ flex: 1 }} /><Button startIcon={<Print />} disabled={!reports.length} onClick={() => setPreview(reports)}>Print preview</Button></Stack>
    {busy && <LinearProgress />}{loaded && !reports.length && <Alert severity="info">No approved internal marks found.</Alert>}
    {reports.map(report => <Accordion key={report.key} defaultExpanded disableGutters><AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight={700}>Semester {report.semester} · {report.academicyear} · {report.exam} ({report.examcode})</Typography></AccordionSummary><AccordionDetails><CceReport report={report} student={data.student} /><Button startIcon={<Print />} onClick={() => setPreview([report])}>Print preview</Button></AccordionDetails></Accordion>)}
    <Dialog open={!!preview} onClose={() => setPreview(null)} fullWidth maxWidth="xl"><DialogTitle>Print preview<IconButton title="Close preview" onClick={() => setPreview(null)} sx={{ float: 'right' }}><Close /></IconButton></DialogTitle><DialogContent dividers><Button startIcon={<Print />} variant="contained" sx={{ mb: 2 }} onClick={print}>Print</Button>{preview?.map(report => <CceReport key={report.key} report={report} institution={data.institution || {}} student={data.student} header />)}</DialogContent></Dialog>
    <Snackbar open={!!error} onClose={() => setError('')} autoHideDuration={8000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
