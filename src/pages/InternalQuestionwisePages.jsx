import React, { useEffect, useState } from "react";
import { Autocomplete, Box, Button, Checkbox, Grid, IconButton, LinearProgress, Paper, Snackbar, Alert, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete, Edit, RestartAlt, Save, UploadFile, Download, Sync } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import EmbeddedWizardShell from "./EmbeddedWizardShell";
import { addOption, handleAddOption, optionLabel, renderAddOption } from "./addableAutocompleteHelpers";
const root = "/api/v2/internal-questionwise";
const uniq = values => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
const courseLabel = row => `${row.course} (${row.coursecode}) | ${row.programcode} | Sem ${row.semester} | ${row.regulation}`;
const title = { questions: "Assessment question paper", entry: "Internal marks entry questionwise", aggregate: "Aggregate Internal marks" };
const blank = { questionno: "", question: "", questiontype: "Descriptive", fullmarks: "" };
const slots = { toolbar: GridToolbar };
function Content({ mode }) {
  const navigate = useNavigate(), multi = mode === "questions";
  const [exams, setExams] = useState([]), [courses, setCourses] = useState([]), [year, setYear] = useState(""), [examcode, setExamcode] = useState("");
  const [programs, setPrograms] = useState([]), [semesters, setSemesters] = useState([]), [targets, setTargets] = useState([]), [locked, setLocked] = useState(false);
  const [cos, setCos] = useState({}), [coids, setCoids] = useState({}), [draft, setDraft] = useState(blank), [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]), [marks, setMarks] = useState({}), [assessments, setAssessments] = useState([]), [assessmentid, setAssessmentid] = useState("");
  const [courseAssessments, setCourseAssessments] = useState({}), [componentIds, setComponentIds] = useState({});
  const [selected, setSelected] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [loaded, setLoaded] = useState(false);
  const scope = { colid: global1.colid, user: global1.user, username: global1.name };
  const notify = (message, severity = "success") => setNotice({ text: message, severity });
  const fail = error => notify(error.response?.data?.message || error.message, "error");
  useEffect(() => { ep1.get(`${root}/options`, { params: { colid: global1.colid } }).then(res => setExams(res.data.exams || [])).catch(fail); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCourses([]); if (!year) return;
    const controller = new AbortController();
    ep1.get(`${root}/options`, { params: { colid: global1.colid, academicyear: year }, signal: controller.signal }).then(res => setCourses(res.data.courses || [])).catch(error => { if (!controller.signal.aborted) fail(error); });
    return () => controller.abort();
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps
  const clearGrid = () => { setLoaded(false); setSelected([]); setQuestions([]); setStudents([]); setMarks({}); setAssessmentid(""); };
  const context = row => ({ academicyear: year, examcode, regulation: row.regulation, program: row.program, programcode: row.programcode, semester: row.semester, course: row.course, coursecode: row.coursecode, assessmentid: multi ? componentIds[row._id] || "" : assessmentid });
  useEffect(() => {
    setCourseAssessments({}); setComponentIds({}); setAssessmentid("");
    const controller = new AbortController();
    const fetchOptions = async () => {
      try {
        const options = {};
        for (const row of targets) {
          const res = await ep1.get(`${root}/options`, { params: { colid: global1.colid, academicyear: year, regulation: row.regulation, programcode: row.programcode, semester: row.semester, coursecode: row.coursecode }, signal: controller.signal });
          options[row._id] = res.data.assessments || [];
        }
        if (!controller.signal.aborted) setCourseAssessments(options);
      } catch (error) { if (!controller.signal.aborted) fail(error); }
    };
    fetchOptions();
    return () => controller.abort();
  }, [targets, year]); // eslint-disable-line react-hooks/exhaustive-deps
  const load = async () => {
    if (!year || !examcode || !targets.length) return notify("Select academic year, exam and courses", "warning");
    if (targets.some(row => !context(row).assessmentid)) return notify("Select an assessment component for each selected course", "warning");
    setBusy(true); setSelected([]); setLoaded(false);
    try {
      if (multi) {
        const nextCos = {}, list = [];
        for (const row of targets) {
          const params = { ...scope, ...context(row) };
          const coRes = await ep1.get(`${root}/options`, { params }); nextCos[row._id] = coRes.data.cos || [];
          const qRes = await ep1.get(`${root}/questions`, { params }); list.push(...(qRes.data.data || []));
        }
        setCos(nextCos); setQuestions(list); setLocked(true);
      } else {
        const res = await ep1.get(`${root}/grid`, { params: { ...scope, ...context(targets[0]), mode } });
        setQuestions(res.data.questions || []); setStudents(res.data.students || []); setAssessments(res.data.assessments || []);
        setMarks(Object.fromEntries((res.data.marks || []).map(row => [`${row.regno}|${row.questionid}`, row.marks])));
        if (res.data.entryWindow?.message) notify(res.data.entryWindow.message, "info");
      }
      setLoaded(true);
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const saveQuestion = async () => {
    setBusy(true);
    try {
      await ep1.post(`${root}/questions/save`, { ...scope, academicyear: year, examcode, ...draft, targets: targets.map(row => ({ ...context(row), coid: coids[row._id] })) });
      setDraft(blank); setCoids({}); await load(); notify("Question saved. Step 1 selection is retained.");
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const deleteQuestions = async () => {
    if (!window.confirm(`Delete ${selected.length} selected questions? Questions with saved marks cannot be deleted.`)) return;
    setBusy(true);
    try { await ep1.post(`${root}/questions/delete`, { ...scope, ids: selected }); await load(); notify("Questions deleted"); } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const linkLegacyQuestions = async () => {
    if (targets.length !== 1) return notify("Select a single course in Step 1 to link legacy questions", "warning");
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/questions/link-component`, { ...scope, ...context(targets[0]), ids: selected });
      await load(); notify(`Linked ${res.data.linked} legacy questions and their saved marks to the selected component.`);
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const saveMarks = async () => {
    for (const student of students) for (const question of questions) {
      const value = marks[`${student.regno}|${question._id}`];
      if (value !== "" && value != null && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > question.fullmarks)) return notify(`Marks for ${student.regno}, Q${question.questionno} must be between 0 and ${question.fullmarks}`, "error");
    }
    setBusy(true);
    try {
      const cells = students.flatMap(student => questions.map(question => ({ regno: student.regno, questionid: question._id, marks: marks[`${student.regno}|${question._id}`] ?? "" })));
      const res = await ep1.post(`${root}/marks/save`, { ...scope, ...context(targets[0]), cells }); notify(`Saved ${res.data.saved} question/student cells`);
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const aggregate = async () => {
    if (!window.confirm(`Aggregate marks for ${selected.length} selected students into the selected assessment component? Existing draft marks for that component will be replaced.`)) return;
    setBusy(true);
    try {
      const res = await ep1.post(`${root}/aggregate`, { ...scope, ...context(targets[0]), assessmentid, regnos: selected });
      notify(`Processed ${selected.length} students. ${(res.data.errors || []).map(row => row.message).join("; ")}`, res.data.errors?.length ? "warning" : "success");
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const template = () => {
    const sample = { academicyear: year || "2026-27", examcode, regulation: targets[0]?.regulation || "", programcode: targets[0]?.programcode || "", semester: targets[0]?.semester || "1", coursecode: targets[0]?.coursecode || "", assessmentid: targets[0] ? context(targets[0]).assessmentid : "", questionno: "1", question: "Explain the concept", questiontype: "Descriptive", fullmarks: 10, coid: cos[targets[0]?._id]?.[0]?._id || "" };
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([sample]), "Questions"); XLSX.writeFile(workbook, "assessment_questions.xlsx");
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setBusy(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const res = await ep1.post(`${root}/questions/bulk`, { ...scope, rows: XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" }) });
      await load(); notify(`Saved ${res.data.saved}. ${(res.data.errors || []).join("; ")}`, res.data.errors?.length ? "warning" : "success");
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
  const uploadMarks = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const imported = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" }), next = { ...marks };
      for (const row of imported) {
        const student = students.find(item => item.regno === String(row.regno)); if (!student) throw new Error(`Student ${row.regno} is not in the loaded list`);
        for (const question of questions) if (row[`Q${question.questionno}`] !== undefined) {
          const value = row[`Q${question.questionno}`]; if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > question.fullmarks)) throw new Error(`Invalid marks for ${row.regno}, Q${question.questionno}`);
          next[`${student.regno}|${question._id}`] = value;
        }
      }
      setMarks(next); notify("Marks imported. Review and save questionwise marks.");
    } catch (error) { fail(error); }
  };
  const marksTemplate = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(students.map(student => ({ regno: student.regno, student: student.name, ...Object.fromEntries(questions.map(question => [`Q${question.questionno}`, marks[`${student.regno}|${question._id}`] ?? ""])) }))), "Marks");
    XLSX.writeFile(workbook, "questionwise_marks.xlsx");
  };
  const choice = (label, options, value, change, path, multiple = false) => <Autocomplete disabled={busy || locked} multiple={multiple} disableCloseOnSelect={multiple} options={[addOption(`+ Add ${label}`, path), ...options]} getOptionLabel={optionLabel} renderOption={multiple ? (props, option, state) => option?.__addOption ? renderAddOption(props, option) : <li {...props}><Checkbox checked={state.selected} />{optionLabel(option)}</li> : renderAddOption} value={multiple ? value : value || null} onChange={(_, next) => { const addition = multiple ? next.find(row => row?.__addOption) : next; if (!handleAddOption(addition, navigate)) change(multiple ? next : next || ""); }} renderInput={params => <TextField {...params} label={label} size="small" />} />;
  const filteredCourses = courses.filter(row => programs.includes(`${row.program} (${row.programcode})`) && semesters.includes(row.semester));
  const columns = multi ? ["programcode", "semester", "course", "coursecode", "questionno", "question", "questiontype", "fullmarks", "conumber", "co"].map(field => ({ field, headerName: field, width: field === "question" || field === "co" ? 300 : 150 })) : [
    { field: "name", headerName: "Student", width: 200 }, { field: "regno", headerName: "Regno", width: 170 },
    ...questions.map(question => ({ field: question._id, headerName: `Q${question.questionno} / ${question.fullmarks}`, description: `${question.question} | ${question.conumber || ""}: ${question.co || ""}`, width: 160, sortable: false,
      renderCell: ({ row }) => mode === "entry" ? <TextField size="small" type="number" inputProps={{ min: 0, max: question.fullmarks, step: "any", "aria-label": `${row.regno} Q${question.questionno}` }} value={marks[`${row.regno}|${question._id}`] ?? ""} onChange={event => { const value = event.target.value; if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > question.fullmarks)) { notify(`Q${question.questionno}: marks must be between 0 and ${question.fullmarks}`, "error"); return; } setMarks(previous => ({ ...previous, [`${row.regno}|${question._id}`]: value })); }} /> : marks[`${row.regno}|${question._id}`] ?? "—" })),
    { field: "total", headerName: "Total", width: 120, renderCell: ({ row }) => questions.reduce((sum, question) => sum + Number(marks[`${row.regno}|${question._id}`] || 0), 0).toFixed(2) }
  ];
  return <Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5">{title[mode]}</Typography>
    {busy && <LinearProgress />}
    <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6">Step 1</Typography><Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid item xs={12} md={3}>{choice("Academic year", uniq(exams.map(row => row.academicyear)), year, value => { setYear(value); setExamcode(""); setPrograms([]); setSemesters([]); setTargets([]); clearGrid(); }, "/conduct-exam-master")}</Grid>
      <Grid item xs={12} md={5}>{choice("Exam", exams.filter(row => row.academicyear === year).map(row => `${row.examname} (${row.examcode})`), (() => { const row = exams.find(item => item.examcode === examcode && item.academicyear === year); return row ? `${row.examname} (${row.examcode})` : ""; })(), value => { setExamcode(exams.find(row => `${row.examname} (${row.examcode})` === value && row.academicyear === year)?.examcode || ""); clearGrid(); }, "/conduct-exam-master")}</Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Exam code" value={examcode} InputProps={{ readOnly: true }} /></Grid>
      <Grid item xs={12} md={6}>{choice("Programs / program codes", uniq(courses.map(row => `${row.program} (${row.programcode})`)), multi ? programs : programs[0] || "", value => { setPrograms(multi ? value : value ? [value] : []); setSemesters([]); setTargets([]); clearGrid(); }, "/programmanagement", multi)}</Grid>
      <Grid item xs={12} md={6}>{choice("Semester", uniq(courses.filter(row => programs.includes(`${row.program} (${row.programcode})`)).map(row => row.semester)), multi ? semesters : semesters[0] || "", value => { setSemesters(multi ? value : value ? [value] : []); setTargets([]); clearGrid(); }, "/regulationcoursemap", multi)}</Grid>
      <Grid item xs={12}>{choice("Courses / course codes", uniq(filteredCourses.map(courseLabel)), multi ? targets.map(courseLabel) : targets[0] ? courseLabel(targets[0]) : "", value => { const values = multi ? value : value ? [value] : []; setTargets(filteredCourses.filter(row => values.includes(courseLabel(row)))); clearGrid(); }, "/regulationcoursemap", multi)}</Grid>
      {targets.map(row => <Grid item xs={12} key={row._id}><Autocomplete disabled={busy || locked} options={[addOption("+ Add Assessment Component", "/assessmentcomponent"), ...(courseAssessments[row._id] || [])]} getOptionLabel={item => item.__addOption ? item.label : `${item.assessmentcomponent} | ${item.componenttype} | ${item.assessmentgroup || ""} | Max ${item.marks}`} value={(courseAssessments[row._id] || []).find(item => item._id === (multi ? componentIds[row._id] : assessmentid)) || null} onChange={(_, value) => { if (handleAddOption(value, navigate)) return; setLoaded(false); setSelected([]); setQuestions([]); setStudents([]); setMarks({}); if (multi) setComponentIds(previous => ({ ...previous, [row._id]: value?._id || "" })); else setAssessmentid(value?._id || ""); }} renderInput={params => <TextField {...params} label={`Assessment component - ${courseLabel(row)}`} size="small" />} /></Grid>)}
      <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" disabled={busy || !year || !examcode || !targets.length} onClick={load}>{multi ? "Continue to step 2" : "Load"}</Button><Button startIcon={<RestartAlt />} disabled={busy} onClick={() => { setLocked(false); setYear(""); setExamcode(""); setPrograms([]); setSemesters([]); setTargets([]); clearGrid(); setDraft(blank); setCoids({}); }}>Reset step 1</Button></Stack></Grid>
    </Grid></Paper>
    {loaded && multi && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6">Step 2</Typography><Grid container spacing={2}>
      {Object.keys(blank).map(field => <Grid item xs={12} md={field === "question" ? 12 : 4} key={field}>{field === "questiontype" ? <Autocomplete options={["MCQ", "Descriptive", "Practical"]} value={draft.questiontype} onChange={(_, value) => setDraft(previous => ({ ...previous, questiontype: value || "Descriptive" }))} renderInput={params => <TextField {...params} label="Question type" />} /> : <TextField fullWidth label={field} multiline={field === "question"} minRows={field === "question" ? 4 : undefined} type={field === "fullmarks" ? "number" : "text"} value={draft[field]} onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} />}</Grid>)}
      {targets.map(row => <Grid item xs={12} key={row._id}><Autocomplete options={[addOption("+ Add CO", "/colist"), ...(cos[row._id] || [])]} getOptionLabel={option => option?.__addOption ? option.label : `${option.conumber || "CO"}: ${option.co}`} value={(cos[row._id] || []).find(co => co._id === coids[row._id]) || null} onChange={(_, value) => { if (!handleAddOption(value, navigate)) setCoids(previous => ({ ...previous, [row._id]: value?._id || "" })); }} renderInput={params => <TextField {...params} label={`CO - ${courseLabel(row)}`} />} /></Grid>)}
      <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={busy} onClick={saveQuestion}>Save question</Button><Button startIcon={<Download />} onClick={template}>Template</Button><Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button><Button color="error" startIcon={<Delete />} disabled={busy || !selected.length} onClick={deleteQuestions}>Delete selected</Button></Stack></Grid>
    </Grid></Paper>}
    {loaded && multi && questions.some(row => !row.assessmentid) && <Stack spacing={1}><Alert severity="warning">Older questions have no assessment component. Select those questions and link them to the component chosen in Step 1 before entering or aggregating marks.</Alert><Button disabled={busy || !selected.length} onClick={linkLegacyQuestions}>Link selected legacy questions to component</Button></Stack>}
    {loaded && <Box sx={{ height: 560 }}><DataGrid rows={multi ? questions : students} getRowId={row => multi ? row._id : row.regno} columns={multi ? [...columns, { field: "edit", headerName: "Edit", renderCell: ({ row }) => <IconButton aria-label="Edit question" onClick={() => { const target = targets.find(item => item.coursecode === row.coursecode && item.programcode === row.programcode && item.semester === row.semester); if (targets.length !== 1 || !target) return notify("Reset step 1 and select this question's single course to edit", "warning"); setDraft({ questionno: row.questionno, question: row.question, questiontype: row.questiontype, fullmarks: row.fullmarks }); setCoids({ [target._id]: row.coid }); }}><Edit /></IconButton> }] : columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={value => setSelected(Array.isArray(value) ? value : Array.from(value?.ids || []))} slots={slots} /></Box>}
    {loaded && mode === "entry" && <Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={busy || !questions.length} onClick={saveMarks}>Save questionwise marks</Button><Button startIcon={<Download />} onClick={marksTemplate}>Marks template / export</Button><Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload marks<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadMarks} /></Button><Button color="error" startIcon={<Delete />} disabled={busy || !selected.length} onClick={() => { if (window.confirm("Clear all question marks for selected students? Save to apply the removal.")) setMarks(previous => ({ ...previous, ...Object.fromEntries(selected.flatMap(regno => questions.map(question => [`${regno}|${question._id}`, ""]))) })); }}>Clear selected marks</Button></Stack>}
    {loaded && mode === "aggregate" && <Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="Saved assessment component" value={assessments.find(row => row._id === assessmentid)?.assessmentcomponent || ""} InputProps={{ readOnly: true }} /><Button variant="contained" startIcon={<Sync />} disabled={busy || !assessmentid || !selected.length} onClick={aggregate}>Process selected ({selected.length})</Button></Stack>}
    <Snackbar open={Boolean(notice)} autoHideDuration={9000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}><Alert variant="filled" severity={notice?.severity || "info"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function InternalQuestionwisePage({ mode = "questions" }) { return <MenuPageShell title={title[mode]}><Content key={mode} mode={mode} /></MenuPageShell>; }
export function InternalQuestionwiseWizard() {
  const steps = [
    ["Regulation course map", "/regulationcoursemap"], ["Assessment component", "/assessmentcomponent"], ["Internal marks entry dates", "/internal-marks-entry-dates"],
    [title.questions, "/assessment-question-paper"], [title.entry, "/internal-marks-entry-questionwise"], [title.aggregate, "/aggregate-internal-marks"]
  ].map(([name, path]) => ({ title: name, path, icon: <Add /> }));
  return <EmbeddedWizardShell title="Internal Questionwise Wizard" steps={steps} startLabel="Start" />;
}
