import React, { useEffect, useState } from "react";
import { Autocomplete, Box, Button, Grid, LinearProgress, Paper, Stack, TextField, Snackbar, Alert } from "@mui/material";
import { Refresh, EventSeat } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import { addOption, handleAddOption, renderAddOption } from "./addableAutocompleteHelpers";
import ep1 from "../api/ep1";
import global1 from "./global1";
const root = "/api/v2/conductexam";
const uniq = values => [...new Set(values.filter(Boolean))].sort();
const columns = ["student", "regno", "email", "program", "programcode", "semester", "course", "coursecode", "examdate", "examslot", "building", "examroom", "seatno"].map(field => ({ field, headerName: field, width: ["student", "email", "course"].includes(field) ? 210 : 140 }));
const slots = { toolbar: GridToolbar };
const empty = { academicyear: "", regulation: "", examcode: "", program: "", programcode: "", course: "", coursecode: "" };
export const activeManualSeatExams = (exams, academicyear) => exams.filter(row => row.academicyear === academicyear && /^yes$/i.test(String(row.formactive || "").trim()));
function Content() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty), [exams, setExams] = useState([]), [courses, setCourses] = useState([]), [rooms, setRooms] = useState([]), [regulations, setRegulations] = useState([]);
  const [rows, setRows] = useState([]), [selected, setSelected] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const [building, setBuilding] = useState(""), [room, setRoom] = useState(""), [roomid, setRoomid] = useState(""), [capacity, setCapacity] = useState(""), [skip, setSkip] = useState(0);
  const [blockno, setBlockno] = useState("");
  const fail = error => setNotice({ severity: "error", text: error.response?.data?.message || error.message });
  const loadOptions = async () => {
    try {
      const regulationsRes = await ep1.get("/api/v2/regulationmaster", { params: { colid: global1.colid } }); setRegulations(regulationsRes.data.data || []);
      const a = await ep1.get(`${root}/exams`, { params: { colid: global1.colid } }); setExams(a.data.data || []);
      const b = await ep1.get(`${root}/rooms`, { params: { colid: global1.colid } }); setRooms(b.data.data || []);
    } catch (error) { fail(error); }
  };
  useEffect(() => { loadOptions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCourses([]);
    if (!form.examcode) return;
    const controller = new AbortController();
    ep1.get(`${root}/examcourses`, { params: { colid: global1.colid, academicyear: form.academicyear, examcode: form.examcode }, signal: controller.signal }).then(res => setCourses(res.data.data || [])).catch(error => { if (!controller.signal.aborted) fail(error); });
    return () => controller.abort();
  }, [form.academicyear, form.examcode]);
  const reset = patch => { setForm(previous => ({ ...previous, ...patch })); setRows([]); setSelected([]); };
  const ready = Object.values(form).every(Boolean);
  const load = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      const selectedDetails = Object.fromEntries(["academicyear", "examcode", "program", "programcode", "course", "coursecode"].map(field => [field, form[field]]));
      const res = await ep1.get(`${root}/examrolls`, { params: { colid: global1.colid, ...selectedDetails } });
      setRows(res.data.data || []); setSelected([]);
      if (!res.data.data?.length) setNotice({ severity: "info", text: "No examroll students match the selected academic year, exam, program and course." });
    }
    catch (error) { fail(error); } finally { setBusy(false); }
  };
  const allocate = async () => {
    if (!window.confirm(`Allocate ${selected.length} selected examroll rows to ${building}, ${room}, skipping ${skip} seat(s)? Existing allocations for these rows will be replaced.`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/manual-seat-allocation/allocate`, { colid: global1.colid, ...form, ids: selected, building, room, roomid, noofseats: Number(capacity), skip, blockno });
      setNotice({ severity: "success", text: `${res.data.allocated} examroll rows allocated.` });
      await load();
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const choice = (label, options, value, onChange, path, freeSolo = false) => <Autocomplete disabled={busy} freeSolo={freeSolo} options={[addOption(`+ Add ${label}`, path), ...options]} value={value || null} getOptionLabel={option => typeof option === "string" ? option : option.label || option.name || ""} renderOption={renderAddOption} onChange={(_, next) => { if (!handleAddOption(next, navigate)) onChange(next || ""); }} onInputChange={freeSolo ? (_, next, reason) => { if (reason === "input") onChange(next); } : undefined} renderInput={params => <TextField {...params} label={label} size="small" />} />;
  const programOptions = [...new Map(courses.map(row => [`${row.program} (${row.programcode})`, row])).entries()];
  const courseOptions = [...new Map(courses.filter(row => row.program === form.program && row.programcode === form.programcode).map(row => [`${row.course} (${row.coursecode})`, row])).entries()];
  return <Stack spacing={2} sx={{ p: 2 }}>
    {busy && <LinearProgress />}
    <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={4}>{choice("Academic year", uniq(exams.map(row => row.academicyear)), form.academicyear, value => reset({ ...empty, academicyear: value }), "/conduct-exam-master")}</Grid>
      <Grid item xs={12} md={4}>{choice("Regulation", uniq(regulations.map(row => row.regulation)), form.regulation, value => reset({ ...empty, academicyear: form.academicyear, regulation: value }), "/regulationmaster")}</Grid>
      <Grid item xs={12} md={4}>{choice("Exam", activeManualSeatExams(exams, form.academicyear).map(row => `${row.examname || row.exam} (${row.examcode})`), (() => { const row = activeManualSeatExams(exams, form.academicyear).find(item => item.examcode === form.examcode); return row ? `${row.examname || row.exam} (${row.examcode})` : ""; })(), value => { const row = activeManualSeatExams(exams, form.academicyear).find(item => `${item.examname || item.exam} (${item.examcode})` === value); reset({ examcode: row?.examcode || "", program: "", programcode: "", course: "", coursecode: "" }); }, "/conduct-exam-master")}</Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Exam code" value={form.examcode} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={4}>{choice("Program", programOptions.map(([name]) => name), form.program ? `${form.program} (${form.programcode})` : "", value => { const row = programOptions.find(([name]) => name === value)?.[1]; reset({ program: row?.program || "", programcode: row?.programcode || "", course: "", coursecode: "" }); }, "/conduct-exam-populate-courses")}</Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Program code" value={form.programcode} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={8}>{choice("Course", courseOptions.map(([name]) => name), form.course ? `${form.course} (${form.coursecode})` : "", value => { const row = courseOptions.find(([name]) => name === value)?.[1]; reset({ course: row?.course || "", coursecode: row?.coursecode || "" }); }, "/conduct-exam-populate-courses")}</Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Course code" value={form.coursecode} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12}><Button startIcon={<Refresh />} variant="contained" disabled={busy || !ready} onClick={load}>Load students</Button></Grid>
    </Grid></Paper>
    <Box sx={{ height: 480 }}><DataGrid rows={rows} getRowId={row => row._id} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} slots={slots} loading={busy} pageSizeOptions={[25, 50, 100]} /></Box>
    <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={3}>{choice("Building", uniq(rooms.map(row => row.building)), building, value => { setBuilding(value); setRoom(""); setRoomid(""); setCapacity(""); }, "/conduct-exam-rooms", true)}</Grid>
      <Grid item xs={12} md={3}>{choice("Room", uniq(rooms.filter(row => row.building === building).map(row => row.room)), room, value => { setRoom(value); const match = rooms.find(row => row.building === building && row.room === value); setRoomid(match?._id || ""); setCapacity(match?.noofseats ?? ""); }, "/conduct-exam-rooms", true)}</Grid>
      <Grid item xs={12} md={3}><TextField fullWidth disabled={busy} size="small" label="Number of seats" type="number" value={capacity} onChange={event => setCapacity(event.target.value)} /></Grid>
      <Grid item xs={12} md={3}><Autocomplete disabled={busy} options={[0, 1, 2, 3]} value={skip} getOptionLabel={value => String(value)} onChange={(_, value) => setSkip(value ?? 0)} renderInput={params => <TextField {...params} size="small" label="Sitting skip rule" />} /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth disabled={busy} size="small" label="Block number (optional)" value={blockno} onChange={event => setBlockno(event.target.value)} inputProps={{ maxLength: 100 }} helperText="Leave blank to keep existing block numbers" /></Grid>
      <Grid item xs={12}><Button variant="contained" startIcon={<EventSeat />} disabled={busy || !selected.length || !ready || !building || !room || !(Number(capacity) > 0)} onClick={allocate}>Allocate selected ({selected.length})</Button></Grid>
    </Grid></Paper>
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} anchorOrigin={{ vertical: "top", horizontal: "center" }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || "info"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function ManualExamSeatAllocationPage() { return <MenuPageShell title="Manual seat allocation"><Content /></MenuPageShell>; }
