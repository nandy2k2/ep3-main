import React, { useEffect, useState } from "react";
import { Autocomplete, Box, Button, Grid, LinearProgress, Paper, Stack, Typography, Snackbar, Alert, TextField } from "@mui/material";
import { Print, Refresh } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import AdmitCard4Print from "./AdmitCard4Print";
import AdmitCard4bPrint from "./AdmitCard4bPrint";
import AdmitCard4cPrint from "./AdmitCard4cPrint";
import { addOption, handleAddOption } from "./addableAutocompleteHelpers";
import ep1 from "../api/ep1";
import global1 from "./global1";
const fields = ["academicyear", "exam", "program", "programcode", "semester", "section", "regno"];
const labels = { academicyear: "Academic year", exam: "Exam", program: "Program", programcode: "Program code", semester: "Semester", section: "Section", regno: "Enrolment no." };
const columns = ["student", "regno", "academicyear", "exam", "examcode", "program", "programcode", "semester", "coursecount"].map(field => ({ field, headerName: field, width: ["student", "program", "exam"].includes(field) ? 220 : 150 }));
const slots = { toolbar: GridToolbar };
function Content({ variant }) {
  const title = `Admit card ${variant}`;
  const navigate = useNavigate();
  const [options, setOptions] = useState({}), [filters, setFilters] = useState({}), [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [tickets, setTickets] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const [exams, setExams] = useState([]);
  const fail = error => setNotice({ severity: "error", text: error.response?.data?.message || error.message });
  useEffect(() => { ep1.get("/api/v2/conductexam/hallticket-options", { params: { colid: global1.colid } }).then(res => setOptions(res.data.options || {})).catch(fail); }, []);
  useEffect(() => { ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } }).then(res => setExams(res.data.data || [])).catch(fail); }, []);
  const reset = patch => { setFilters(previous => ({ ...previous, ...patch })); setRows([]); setSelected([]); setTickets([]); };
  const load = async () => {
    setBusy(true); setTickets([]);
    try { const res = await ep1.get("/api/v2/conductexam/hallticket-eligible-students", { params: { colid: global1.colid, ...Object.fromEntries(Object.entries(filters).filter(([field]) => field !== "exam")) } }); setRows((res.data.data || []).map(row => ({ ...row, id: `${row.regno}|${row.academicyear}|${row.examcode}` }))); setSelected([]); }
    catch (error) { fail(error); } finally { setBusy(false); }
  };
  const generate = async candidates => {
    setBusy(true); setTickets([]);
    try {
      const next = [];
      for (const row of candidates) {
        const res = await ep1.get("/api/v2/conductexam/hallticket-4", { params: { colid: global1.colid, academicyear: row.academicyear, examcode: row.examcode, regno: row.regno, ...(variant === '4c' ? { variant: '4c' } : ['4a', '4b'].includes(variant) ? { variant: '4a' } : {}) } });
        if (res.data.data) next.push(res.data.data);
      }
      setTickets(next);
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const availableExams = exams.filter(row => row.academicyear === filters.academicyear).map(row => ({ exam: row.examname || row.exam, examcode: row.examcode }));
  const yearOptions = [...new Set([...(options.academicyear || []), ...exams.map(row => row.academicyear)])].filter(Boolean).sort().reverse();
  return <Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5" className="no-print">{title}</Typography>
    {['4a', '4b'].includes(variant) && <Alert severity="info" className="no-print">Student signature comes from Student signature upload under the student's Profile. Controller of Examinations signature comes from Rolewise signature upload under User management for role coe (Active), within this institution.</Alert>}
    {busy && <LinearProgress className="no-print" />}
    {variant === '4c' && <Alert severity="info" className="no-print">Student signature is taken from Student signature upload. Principal signature is taken from the active Rolewise signature for role principal. College Stamp is left blank for stamping. Student ID uses scholar number, or roll number if unavailable.</Alert>}
    <Paper variant="outlined" sx={{ p: 2 }} className="no-print"><Grid container spacing={2}>
      {fields.map(field => <Grid item xs={12} md={4} key={field}><Autocomplete disabled={busy} options={[addOption(`+ Add ${field === "exam" || field === "academicyear" ? "Exam" : "Examroll"}`, field === "exam" || field === "academicyear" ? "/conduct-exam-master" : "/examroll"), ...(field === "exam" ? availableExams.map(row => `${row.exam} (${row.examcode})`) : field === "academicyear" ? yearOptions : options[field] || [])]} value={field === "exam" ? filters.examcode ? `${filters.exam} (${filters.examcode})` : null : filters[field] || null} getOptionLabel={option => typeof option === "string" ? option : option.label} onChange={(_, value) => {
        if (handleAddOption(value, navigate)) return;
        if (field === "academicyear") reset({ academicyear: value || "", exam: "", examcode: "" });
        else if (field === "exam") { const exam = availableExams.find(row => `${row.exam} (${row.examcode})` === value); reset({ exam: exam?.exam || "", examcode: exam?.examcode || "" }); }
        else reset({ [field]: value || "" });
      }} renderInput={params => <TextField {...params} size="small" label={labels[field]} />} /></Grid>)}
      <Grid item xs={12}><Button variant="contained" startIcon={<Refresh />} disabled={busy || !filters.academicyear || !filters.examcode} onClick={load}>Load students</Button></Grid>
    </Grid></Paper>
    <Box sx={{ height: 450 }} className="no-print"><DataGrid rows={rows} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} onRowClick={event => { if (!busy) generate([event.row]); }} slots={slots} loading={busy} /></Box>
    <Stack direction="row" spacing={1} className="no-print"><Button variant="contained" disabled={busy || !selected.length} onClick={() => generate(rows.filter(row => selected.includes(row.id)))}>Generate selected admit cards</Button>{!['4b', '4c'].includes(variant) && <Button startIcon={<Print />} disabled={!tickets.length || busy} onClick={() => window.print()}>Print</Button>}</Stack>
    {variant === '4c' ? <AdmitCard4cPrint tickets={tickets} /> : variant === '4b' ? <AdmitCard4bPrint tickets={tickets} /> : <AdmitCard4Print tickets={tickets} variant={variant} />}
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}><Alert variant="filled" severity={notice?.severity || "info"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function AdmitCard4Page({ variant = '4' }) { return <MenuPageShell title={`Admit card ${variant}`}><Content key={variant} variant={variant} /></MenuPageShell>; }
