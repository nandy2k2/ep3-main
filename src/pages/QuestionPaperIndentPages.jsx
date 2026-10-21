import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Paper, Snackbar, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Add, Delete, Edit, UploadFile, Download, CheckCircle, Cancel } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";
import { useNavigate } from "react-router-dom";
import { handleAddOption, addOption, renderAddOption } from "./addableAutocompleteHelpers";

const root = "/api/v2/question-paper-indent";
const titles = { panels: "Paper setter panels", members: "Panel member assignment", workflow: "Panel approval workflow", approval: "Panel member approval", assignments: "Paper setter assignment", report: "Paper setter panel report", missing: "Missing paper setters", auto: "Auto create panels", communications: "Invitation communication log" };
const uniq = (xs) => [...new Set(xs.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
const arrSelection = (v) => Array.isArray(v) ? v : Array.from(v?.ids || []);
const fieldNames = ["program", "programcode", "regulation", "semester", "course", "coursecode", "panelname", "status", "kind", "membername", "memberemail", "invitationstatus", "approvalstatus", "component"];
const profileLabels = { phone: "Phone", password: "Login password (optional)", department: "Department", designation: "Designation", institution: "Institution", googleemail: "Google email", excluded: "Excluded (Yes/No)", joiningdate: "Joining date", admissionyear: "Joining year", gender: "Gender", dateofbirth: "Date of birth", nationality: "Nationality", address: "Address", city: "City", district: "District", state: "State", pincode: "Pincode", country: "Country", qualification: "Qualification", experience: "Experience", pan: "PAN", photo: "Photo link", role: "Role" };
const templateFields = {
  panels: ["program", "programcode", "regulation", "semester", "course", "coursecode", "panelname", "description"],
  members: ["panelid", "kind", "membername", "memberemail", ...Object.keys(profileLabels)],
  workflow: ["panelid", "levels"],
  assignments: ["panelid", "memberid", "component", "startdate", "enddate", "instructions", "admindocuments"]
};

function Choice({ label, options = [], value, onChange, multiple = false, addPath, disabled = false, freeSolo = false, getLabel = (x) => String(x || "") }) {
  const navigate = useNavigate();
  const all = { __all: true };
  return <Autocomplete multiple={multiple} freeSolo={freeSolo} disableCloseOnSelect={multiple} disabled={disabled} size="small"
    onInputChange={(_, next, reason) => { if (freeSolo && reason === "input") onChange(next); }}
    options={[...(addPath ? [addOption(`+ Add ${label}`, addPath)] : []), ...(multiple && options.length ? [all] : []), ...options]}
    value={value || (multiple ? [] : null)}
    isOptionEqualToValue={(a, b) => getLabel(a) === getLabel(b)}
    getOptionLabel={(x) => x.__addOption ? x.label : x.__all ? "Select all" : getLabel(x)}
    onChange={(_, next) => {
      const picked = multiple ? next.find((x) => x.__addOption) : next;
      if (picked?.__addOption) { handleAddOption(picked, navigate); return; }
      if (multiple && next.some((x) => x.__all)) { onChange((value || []).length === options.length ? [] : options); return; }
      onChange(next);
    }}
    renderOption={(props, option, state) => option.__addOption ? renderAddOption(props, option) : <li {...props}>{multiple && <Checkbox checked={option.__all ? value?.length === options.length : state.selected} size="small" />}{option.__all ? "Select all" : getLabel(option)}</li>}
    renderInput={(params) => <TextField {...params} label={label} />} />;
}

function RecordDetails({ value }) {
  if (value == null) return <Typography>—</Typography>;
  if (Array.isArray(value)) return <Stack spacing={2}>{value.map((item, i) => <Paper variant="outlined" sx={{ p: 1.5 }} key={i}><RecordDetails value={item} /></Paper>)}</Stack>;
  if (typeof value === "object") return <Box component="dl" sx={{ m: 0 }}>{Object.entries(value).filter(([key]) => !["__v", "invitationhash"].includes(key)).map(([key, item]) => <Box key={key} sx={{ display: "grid", gridTemplateColumns: "minmax(100px, 25%) 1fr", gap: 1, py: 1, borderBottom: "1px solid #eee" }}><Typography component="dt" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{key}</Typography><Box component="dd" sx={{ m: 0, minWidth: 0 }}><RecordDetails value={item} /></Box></Box>)}</Box>;
  return /^https?:\/\//i.test(String(value)) ? <a href={String(value)} target="_blank" rel="noreferrer">Open document</a> : <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{String(value)}</Typography>;
}

export default function QuestionPaperIndentPage({ mode = "panels" }) {
  const [options, setOptions] = useState({ programs: [], courses: [], users: [], emails: [], whatsapp: [], templates: [] });
  const [program, setProgram] = useState(null), [panels, setPanels] = useState([]), [panel, setPanel] = useState(null);
  const [members, setMembers] = useState([]), [rows, setRows] = useState([]), [ids, setIds] = useState([]);
  const [form, setForm] = useState({}), [profile, setProfile] = useState({}), [editId, setEditId] = useState("");
  const [internalUsers, setInternalUsers] = useState([]), [kind, setKind] = useState("Internal"), [inviteStatus, setInviteStatus] = useState("Not confirmed");
  const [levels, setLevels] = useState([{ order: 1, approvername: "", approveremail: "" }]);
  const [filters, setFilters] = useState([]), [busy, setBusy] = useState(false), [toast, setToast] = useState(null);
  const [report, setReport] = useState(null), [reportTab, setReportTab] = useState(0), [comments, setComments] = useState("");
  const [autoPrograms, setAutoPrograms] = useState([]), [autoSemesters, setAutoSemesters] = useState([]), [autoCourses, setAutoCourses] = useState([]);
  const [invitation, setInvitation] = useState({ channels: ["Email"], subject: "Invitation to paper setter panel", message: "Please review the panel details and confirm whether you accept this invitation.", values: [{ variable: "1", value: "{{details}}" }, { variable: "2", value: "{{accept}}" }, { variable: "3", value: "{{reject}}" }] });
  const [detail, setDetail] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const scope = { colid: global1.colid, user: global1.user };
  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const notify = (message, severity = "success") => setToast({ message, severity });
  const execute = async (fn) => { setBusy(true); try { await fn(); } catch (e) { notify(e.response?.data?.message || e.response?.data?.error || e.message, "error"); } finally { setBusy(false); } };
  const get = (url, params = {}) => ep1.get(`${root}${url}`, { params: { ...scope, ...params } }).then((r) => r.data);
  const post = (url, data = {}) => ep1.post(`${root}${url}`, { ...scope, ...data }).then((r) => r.data);
  useEffect(() => { execute(async () => {
    const [data, master, designations] = await Promise.all([get("/options"), ep1.get("/api/v2/academic-configuration/options", { params: scope }).then((r) => r.data).catch(() => ({})), ep1.get("/api/v2/academic-designations/options", { params: scope }).then((r) => r.data).catch(() => ({}))]);
    setOptions({ ...data, institutions: master.institutions || [], departments: master.departments || [], designations: designations.designations || [] });
  }); }, []);
  useEffect(() => {
    setPanel(null); setRows([]); setIds([]); setMembers([]);
    if (!program) { setPanels([]); return; }
    execute(async () => {
      const p = await get("/panels/rows", { filters: JSON.stringify([{ field: "programcode", value: program.programcode }]) });
      setPanels(p.data || []);
    });
  }, [program?.programcode]);
  useEffect(() => {
    setRows([]); setIds([]); setEditId(""); setForm({}); setProfile({}); setMembers([]);
    if (panel && mode === "assignments") execute(async () => {
      const r = await get("/members/rows", { panelid: panel._id, filters: JSON.stringify([{ field: "approvalstatus", value: "Approved" }, { field: "invitationstatus", value: "Accepted" }]) });
      setMembers(r.data || []);
    });
  }, [panel?._id]);

  const courses = useMemo(() => options.courses.filter((r) => (!program || r.programcode === program.programcode) && (!form.semester || String(r.semester) === String(form.semester))), [options.courses, program, form.semester]);
  const courseOptions = [...new Map(courses.map((r) => [`${r.regulation}|${r.semester}|${r.coursecode}`, r])).values()];
  const selectedCourse = courseOptions.find((c) => c.coursecode === form.coursecode && c.regulation === form.regulation) || null;
  const entity = mode === "approval" ? "members" : mode;
  const load = async () => {
    if (["members", "workflow", "approval", "assignments"].includes(mode) && !panel) throw new Error("Select a panel");
    if (["report", "missing"].includes(mode)) {
      if (!program) throw new Error("Select a program");
      const data = await get("/report", { programcode: program.programcode, semester: form.semester || "" });
      setReport(data); setRows(data.data || []); return;
    }
    const extra = mode === "members" ? [{ field: "kind", value: kind }, ...(kind === "External" ? [{ field: "invitationstatus", value: inviteStatus }] : [])] : [];
    const data = await get(`/${entity}/rows`, { filters: JSON.stringify([...filters, ...(program ? [{ field: "programcode", value: program.programcode }] : []), ...extra].filter((f) => !(["members", "workflow", "approval", "communications"].includes(mode) && ["programcode", "program"].includes(f.field)))), panelid: panel?._id, approval: mode === "approval" ? "Yes" : undefined });
    setRows(data.data || []); setIds([]);
  };
  const save = async () => {
    if (mode === "assignments" && form.documentsText) form.admindocuments = JSON.parse(form.documentsText);
    if (mode === "members" && kind === "Internal" && !editId) {
      if (!internalUsers.length) throw new Error("Select internal users");
      const outcomes = [];
      for (const u of internalUsers) { try { await post("/members/save", { panelid: panel?._id, kind, membername: u.name, memberemail: u.email, profile: u }); outcomes.push(`${u.email}: added`); } catch (e) { outcomes.push(`${u.email}: ${e.response?.data?.message || e.message}`); } }
      setDetail({ outcomes }); setInternalUsers([]);
    } else {
      await post(`/${entity}/save`, { ...form, ...(program ? { program: program.program, programcode: program.programcode } : {}), panelid: panel?._id, kind, profile, levels, id: editId || undefined });
    }
    notify("Saved"); setForm({}); setProfile({}); setEditId(""); await load();
  };
  const remove = async () => { if (!ids.length || !window.confirm(`Delete ${ids.length} selected records?`)) return; await post(`/${entity}/delete`, { ids }); notify("Deleted"); await load(); };
  const edit = (row) => { setEditId(row._id); setForm(row); setProfile(row.profile || {}); if (row.levels) setLevels(row.levels); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const bulk = async (file) => {
    if (!file) return;
    const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const items = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: "" }).map((r) => ({ ...r, panelid: r.panelid || panel?._id, ...(entity === "members" ? { kind: r.kind || kind, profile: Object.fromEntries(Object.keys(profileLabels).map((f) => [f, r[f]])) } : {}), ...(r.levels ? { levels: JSON.parse(r.levels) } : {}), ...(r.admindocuments ? { admindocuments: JSON.parse(r.admindocuments) } : {}) }));
    const data = await post(`/${entity}/bulk`, { items }); setDetail(data.data); notify(`Saved ${data.saved} of ${items.length} rows`); await load();
  };
  const template = () => { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([Object.fromEntries((templateFields[entity] || []).map((f) => [f, f === "panelid" ? panel?._id || "" : f === "levels" ? JSON.stringify([{ order: 1, approvername: "Name", approveremail: "approver@example.com" }]) : ""]))]), "Template"); XLSX.writeFile(book, `question_paper_indent_${entity}.xlsx`); };
  const sendInvite = async () => { const r = await post("/members/invite", { ...invitation, panelid: panel?._id, ids }); setDetail(r.data); setOptions((prev) => ({ ...prev, ...r.options })); notify(`Invitation processing finished; ${r.data.filter((x) => x.status === "Failed").length} failed`, r.data.some((x) => x.status === "Failed") ? "warning" : "success"); };
  const decide = async (decision) => { const data = await post("/approval/decide", { panelid: panel?._id, ids, decision, comments }); setDetail(data.data); notify("Decision saved"); await load(); };
  const visibleReportRows = useMemo(() => {
    const base = report && mode === "report" ? [report.data, report.panels, report.members, report.assignments][reportTab] || [] : rows;
    return base.filter((row) => filters.every((f) => !f.value?.length || (Array.isArray(f.value) ? f.value : [f.value]).some((v) => String(row[f.field] || "").toLowerCase().includes(String(v).toLowerCase()))));
  }, [rows, report, reportTab, filters, mode]);
  const displayRows = visibleReportRows.map((r, i) => ({ ...r, id: r.id || String(r._id || i), phone: r.profile?.phone, department: r.profile?.department, designation: r.profile?.designation, institution: r.profile?.institution, panelname: r.panelname || panels.find((p) => String(p._id) === String(r.panelid))?.panelname }));
  const fields = uniq([...displayRows.flatMap((r) => Object.keys(r)), ...(displayRows.length ? [] : mode === "approval" || mode === "members" ? ["membername", "memberemail", "invitationstatus", "approvalstatus", "currentlevel", "currentapprover"] : templateFields[entity] || [])]).filter((f) => !["id", "_id", "__v", "profile", "levels", "history", "userid", "invitationhash", "colid", "user", "panelid", "memberid"].includes(f));
  const preferred = ["panelname", "program", "programcode", "semester", "course", "coursecode", "membername", "memberemail", "kind", "invitationstatus", "approvalstatus", "currentlevel", "currentapprover", "papersettername", "papersetteremail", "status"];
  const columns = [...preferred.filter((f) => fields.includes(f)), ...fields.filter((f) => !preferred.includes(f))].map((field) => ({ field, headerName: field, minWidth: 155, flex: 1, valueGetter: (p) => typeof p.value === "object" ? JSON.stringify(p.value) : p.value }));
  columns.unshift({ field: "actions", headerName: "Details", width: 100, renderCell: (p) => <Stack direction="row"><IconButton aria-label="View details" disabled={busy} onClick={() => setDetail(p.row)}><CheckCircle /></IconButton>{templateFields[entity] && mode !== "approval" && <IconButton aria-label="Edit" disabled={busy} onClick={() => edit(p.row)}><Edit /></IconButton>}</Stack> });
  const reportChart = ["Approved", "In process", "Not created"].map((status) => ({ name: status, count: (report?.data || []).filter((r) => r.status === status).length }));

  return <MenuPageShell title={`Question paper indent — ${titles[mode]}`}><Stack spacing={2} sx={{ p: 2 }}>
    <Typography variant="h5" fontWeight={800}>{titles[mode]}</Typography>
    {busy && <LinearProgress />}
    <Snackbar open={!!toast} autoHideDuration={8000} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={() => setToast(null)}><Alert variant="filled" severity={toast?.severity || "success"} onClose={() => setToast(null)}>{toast?.message}</Alert></Snackbar>
    <Box component="fieldset" disabled={busy} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: "contents" }}>
    {mode !== "auto" && <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={5}><Choice label="Program" addPath="/programmanagement" options={options.programs} value={program} getLabel={(p) => `${p.program} (${p.programcode})`} onChange={setProgram} /></Grid>
      <Grid item xs={12} md={2}><TextField label="Program code" size="small" fullWidth value={program?.programcode || ""} InputProps={{ readOnly: true }} /></Grid>
      {["members", "workflow", "approval", "assignments", "communications"].includes(mode) && <Grid item xs={12} md={5}><Choice label="Panel" addPath="/question-paper-indent-panels" options={panels} value={panel} getLabel={(p) => `${p.panelname} | Sem ${p.semester} | ${p.coursecode}`} onChange={setPanel} /></Grid>}
    </Grid></Paper>}

    {mode === "panels" && <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={3}><Choice label="Semester" addPath="/regulationcoursemap" options={uniq(options.courses.filter((r) => r.programcode === program?.programcode).map((r) => r.semester))} value={form.semester} onChange={(v) => setForm((p) => ({ ...p, semester: v, course: "", coursecode: "", regulation: "" }))} /></Grid>
      <Grid item xs={12} md={6}><Choice label="Course" addPath="/regulationcoursemap" options={courseOptions} value={selectedCourse} getLabel={(c) => `${c.course} (${c.coursecode}) | ${c.regulation}`} onChange={(v) => setForm((p) => ({ ...p, course: v?.course || "", coursecode: v?.coursecode || "", regulation: v?.regulation || "" }))} /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Course code" value={form.coursecode || ""} InputProps={{ readOnly: true }} /></Grid>
      {["panelname", "description"].map((f) => <Grid item xs={12} md={6} key={f}><TextField fullWidth size="small" label={f} value={form[f] || ""} onChange={(e) => patch(f, e.target.value)} /></Grid>)}
    </Grid></Paper>}

    {mode === "members" && <Paper variant="outlined" sx={{ p: 2 }}>
      <Tabs value={kind} onChange={(_, v) => { setKind(v); setRows([]); setIds([]); setEditId(""); setForm({}); setProfile({}); }}><Tab value="Internal" label="Internal" /><Tab value="External" label="External" /></Tabs>
      {kind === "Internal" && !editId ? <Box sx={{ mt: 2 }}><Choice label="Internal users" addPath="/mbuser" multiple options={options.users} value={internalUsers} onChange={setInternalUsers} getLabel={(u) => `${u.name} (${u.email}) | ${u.role}`} /></Box> : <Grid container spacing={2} sx={{ mt: 0 }}>
        {["membername", "memberemail"].map((f) => <Grid item xs={12} md={6} key={f}><TextField fullWidth size="small" label={f === "membername" ? "Name" : "Email"} value={form[f] || ""} onChange={(e) => patch(f, e.target.value)} /></Grid>)}
        {Object.entries(profileLabels).map(([f, label]) => <Grid item xs={12} md={4} key={f}>{["institution", "department", "designation", "role", "gender", "excluded"].includes(f) ? <Choice label={label} freeSolo={["institution", "department", "designation", "role"].includes(f)} addPath={{ institution: "/academic-master-institutions", department: "/academic-master-departments", designation: "/academic-designations", role: "/mbuser" }[f]} options={f === "institution" ? uniq((options.institutions || []).map((x) => x.institution || x)) : f === "department" ? uniq((options.departments || []).filter((x) => !profile.institution || x.institution === profile.institution).map((x) => x.department || x)) : f === "designation" ? uniq((options.designations || []).map((x) => x.designation || x)) : f === "role" ? uniq(["papersetter", ...options.users.map((u) => u.role)]) : f === "gender" ? ["Male", "Female", "Other"] : ["Yes", "No"]} value={profile[f] || ""} onChange={(v) => setProfile((p) => ({ ...p, [f]: v || "" }))} /> : <TextField fullWidth size="small" label={label} type={f === "password" ? "password" : ["dateofbirth", "joiningdate"].includes(f) ? "date" : "text"} InputLabelProps={{ shrink: true }} value={profile[f] || ""} onChange={(e) => setProfile((p) => ({ ...p, [f]: e.target.value }))} />}</Grid>)}
      </Grid>}
      {kind === "External" && <Box sx={{ mt: 2, maxWidth: 320 }}><Choice label="Invitation status" options={["Not confirmed", "Accepted", "Rejected"]} value={inviteStatus} onChange={(v) => { setInviteStatus(v || "Not confirmed"); setRows([]); setIds([]); }} /></Box>}
    </Paper>}

    {mode === "workflow" && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>{levels.map((l, i) => <Stack direction={{ xs: "column", md: "row" }} spacing={2} key={i}>
      <TextField label="Level" size="small" value={l.order} type="number" sx={{ width: 100 }} onChange={(e) => setLevels((xs) => xs.map((x, j) => i === j ? { ...x, order: Number(e.target.value) } : x))} />
      <Box sx={{ flex: 1 }}><Choice label="Approver" addPath="/mbuser" options={options.users} value={options.users.find((u) => u.email === l.approveremail)} getLabel={(u) => `${u.name} (${u.email})`} onChange={(v) => setLevels((xs) => xs.map((x, j) => i === j ? { ...x, approvername: v?.name || "", approveremail: v?.email || "" } : x))} /></Box>
      <IconButton aria-label="Remove level" onClick={() => setLevels((xs) => xs.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j + 1 })))}><Delete /></IconButton>
    </Stack>)}<Button startIcon={<Add />} onClick={() => setLevels((xs) => [...xs, { order: xs.length + 1, approveremail: "", approvername: "" }])}>Add level</Button></Stack></Paper>}

    {mode === "assignments" && <Paper variant="outlined" sx={{ p: 2 }}><Grid container spacing={2}>
      <Grid item xs={12} md={6}><Choice label="Approved member" addPath="/question-paper-indent-members" options={members} value={members.find((m) => m._id === form.memberid)} getLabel={(m) => `${m.membername} (${m.memberemail})`} onChange={(v) => patch("memberid", v?._id || "")} /></Grid>
      <Grid item xs={12} md={6}><Choice label="Assessment component" addPath="/assessmentcomponent" options={uniq((options.components || []).filter((c) => c.programcode === panel?.programcode && c.coursecode === panel?.coursecode && (!panel?.regulation || c.regulation === panel.regulation) && c.semester === panel?.semester).map((c) => c.assessmentcomponent))} value={form.component} onChange={(v) => patch("component", v || "")} /></Grid>
      {["startdate", "enddate", "instructions"].map((f) => <Grid item xs={12} md={f === "instructions" ? 12 : 6} key={f}><TextField fullWidth size="small" label={f} type={f.endsWith("date") ? "date" : "text"} InputLabelProps={{ shrink: true }} value={String(form[f] || "").slice(0, f.endsWith("date") ? 10 : undefined)} onChange={(e) => patch(f, e.target.value)} /></Grid>)}
      <Grid item xs={12}><Stack spacing={1}><TextField size="small" label="Document title" value={form.documentTitle || ""} onChange={(e) => patch("documentTitle", e.target.value)} /><Button component="label" startIcon={<UploadFile />} disabled={busy}>Upload syllabus / scheme / document<input hidden type="file" onChange={(e) => { const file = e.target.files[0]; e.target.value = ""; if (!file) return; execute(async () => { setUploadProgress(0); try { const body = new FormData(); body.append("file", file); body.append("colid", global1.colid); const r = await ep1.post(`${root}/upload`, body, { onUploadProgress: (event) => setUploadProgress(event.total ? Math.round(event.loaded * 100 / event.total) : 0) }); setForm((p) => ({ ...p, admindocuments: [...(p.admindocuments || []), { title: p.documentTitle || r.data.title, url: r.data.url }], documentTitle: "" })); notify("Document uploaded"); } finally { setUploadProgress(null); } }); }} /></Button>{uploadProgress !== null && <><LinearProgress variant="determinate" value={uploadProgress} /><Typography>{uploadProgress}% uploaded{uploadProgress === 100 ? " — saving to AWS" : ""}</Typography></>}{(form.admindocuments || []).map((doc, i) => <Stack direction="row" alignItems="center" key={i}><a href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a><IconButton aria-label="Remove document" onClick={() => patch("admindocuments", form.admindocuments.filter((_, j) => j !== i))}><Delete /></IconButton></Stack>)}</Stack></Grid>
    </Grid></Paper>}

    {mode === "auto" && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
      <Choice label="Programs" addPath="/programmanagement" multiple options={options.programs} value={autoPrograms} getLabel={(p) => `${p.program} (${p.programcode})`} onChange={(v) => { setAutoPrograms(v); setAutoSemesters([]); setAutoCourses([]); }} />
      <Choice label="Semesters" addPath="/regulationcoursemap" multiple options={uniq(options.courses.filter((c) => autoPrograms.some((p) => p.programcode === c.programcode)).map((c) => c.semester))} value={autoSemesters} onChange={(v) => { setAutoSemesters(v); setAutoCourses([]); }} />
      <Choice label="Courses" addPath="/regulationcoursemap" multiple options={[...new Map(options.courses.filter((c) => autoPrograms.some((p) => p.programcode === c.programcode) && autoSemesters.includes(c.semester)).map((c) => [`${c.programcode}|${c.semester}|${c.coursecode}`, c])).values()]} value={autoCourses} onChange={setAutoCourses} getLabel={(c) => `${c.programcode} | Sem ${c.semester} | ${c.course} (${c.coursecode})`} />
      <Button variant="contained" disabled={busy || !autoCourses.length} onClick={() => execute(async () => { const r = await post("/auto-create", { programcodes: autoPrograms.map((p) => p.programcode), semesters: autoSemesters, coursecodes: autoCourses.map((c) => c.coursecode), courseids: autoCourses.map((c) => c._id) }); setRows(r.data); notify("Panel creation completed"); })}>Create panels</Button>
    </Stack></Paper>}

    {mode !== "auto" && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
      {filters.map((f, i) => <Grid container spacing={1} key={i}><Grid item xs={12} md={4}><Choice label="Filter field" options={fieldNames} value={f.field} onChange={(v) => setFilters((xs) => xs.map((x, j) => i === j ? { field: v, value: [] } : x))} /></Grid><Grid item xs={12} md={7}><Autocomplete freeSolo multiple size="small" options={uniq([...rows, ...options.courses, ...panels].map((r) => r[f.field]))} value={f.value || []} onChange={(_, v) => setFilters((xs) => xs.map((x, j) => i === j ? { ...x, value: v } : x))} renderInput={(p) => <TextField {...p} label="Filter values" />} /></Grid><Grid item xs={12} md={1}><IconButton aria-label="Remove filter" onClick={() => setFilters((xs) => xs.filter((_, j) => j !== i))}><Delete /></IconButton></Grid></Grid>)}
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button startIcon={<Add />} onClick={() => setFilters((xs) => [...xs, { field: "semester", value: [] }])}>Add filter</Button>
        <Button variant="contained" disabled={busy} onClick={() => execute(load)}>Load</Button>
        {templateFields[entity] && mode !== "approval" && <><Button variant="outlined" disabled={busy} onClick={() => execute(async () => { if (form.documentsText) form.admindocuments = JSON.parse(form.documentsText); await save(); })}>{editId ? "Update" : "Save"}</Button><Button disabled={busy} onClick={() => { setForm({}); setProfile({}); setEditId(""); }}>Clear</Button><Button startIcon={<Download />} onClick={template}>Upload template</Button><Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; execute(() => bulk(f)); }} /></Button><Button color="error" startIcon={<Delete />} disabled={busy || !ids.length} onClick={() => execute(remove)}>Delete selected</Button></>}
        {mode === "members" && <Button variant="contained" disabled={busy || !ids.length} onClick={() => execute(async () => { const r = await post("/approval/start", { panelid: panel?._id, ids }); notify(`Submitted ${r.updated} accepted members`); await load(); })}>Submit selected for approval</Button>}
      </Stack>
    </Stack></Paper>}

    {mode === "members" && kind === "External" && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6">Invitations</Typography><Stack spacing={2} sx={{ mt: 2 }}>
      <Choice label="Channels" multiple options={["Email", "WhatsApp"]} value={invitation.channels} onChange={(v) => setInvitation((p) => ({ ...p, channels: v }))} />
      <Choice label="Email configuration" addPath="/emailconfiguration" options={options.emails} value={options.emails.find((c) => c._id === invitation.emailconfigid)} getLabel={(c) => `${c.username} (${c.provider})`} onChange={(v) => setInvitation((p) => ({ ...p, emailconfigid: v?._id }))} />
      <TextField size="small" label="Subject" value={invitation.subject} onChange={(e) => setInvitation((p) => ({ ...p, subject: e.target.value }))} /><TextField multiline minRows={3} label="Invitation message" value={invitation.message} onChange={(e) => setInvitation((p) => ({ ...p, message: e.target.value }))} />
      {invitation.channels.includes("WhatsApp") && <><Choice label="WhatsApp configuration" addPath="/bhash-whatsapp-configuration" options={options.whatsapp} value={options.whatsapp.find((w) => w._id === invitation.whatsappconfigid)} getLabel={(w) => w.name} onChange={(v) => setInvitation((p) => ({ ...p, whatsappconfigid: v?._id }))} /><Choice label="WhatsApp template" addPath="/whatsapp-templates" options={options.templates} value={options.templates.find((t) => t.templatecode === invitation.templateCode)} getLabel={(t) => `${t.templatename} (${t.templatecode})`} onChange={(v) => setInvitation((p) => ({ ...p, templateCode: v?.templatecode }))} />
      <Typography variant="body2">Available WhatsApp credits: <b>{options.whatsappBalance || 0}</b>. Template variables: {"{{name}}, {{panel}}, {{program}}, {{programcode}}, {{semester}}, {{course}}, {{coursecode}}, {{details}}, {{accept}}, {{reject}}"}. Include both response links in the approved provider template.</Typography>
      {invitation.values.map((v, i) => <Stack key={i} direction="row" spacing={1}><TextField size="small" label="Variable" value={v.variable} onChange={(e) => setInvitation((p) => ({ ...p, values: p.values.map((x, j) => j === i ? { ...x, variable: e.target.value } : x) }))} /><TextField size="small" fullWidth label="Value" value={v.value} onChange={(e) => setInvitation((p) => ({ ...p, values: p.values.map((x, j) => j === i ? { ...x, value: e.target.value } : x) }))} /><IconButton aria-label="Remove variable" onClick={() => setInvitation((p) => ({ ...p, values: p.values.filter((_, j) => j !== i) }))}><Delete /></IconButton></Stack>)}<Button onClick={() => setInvitation((p) => ({ ...p, values: [...p.values, { variable: String(p.values.length + 1), value: "" }] }))}>Add variable</Button></>}
      <Button variant="contained" disabled={busy || !ids.length || inviteStatus !== "Not confirmed"} onClick={() => execute(sendInvite)}>Send invitations to selected</Button>
    </Stack></Paper>}

    {mode === "approval" && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}><TextField label="Decision comments" multiline minRows={2} value={comments} onChange={(e) => setComments(e.target.value)} /><Stack direction="row" spacing={2}><Button startIcon={<CheckCircle />} color="success" variant="contained" disabled={busy || !ids.length} onClick={() => execute(() => decide("Approved"))}>Approve selected members</Button><Button startIcon={<Cancel />} color="error" variant="outlined" disabled={busy || !ids.length} onClick={() => execute(() => decide("Rejected"))}>Reject selected members</Button></Stack></Stack></Paper>}

    {report && <><Grid container spacing={2}>{[{ name: "Courses", count: report.data.length }, ...reportChart, { name: "Members", count: report.members.length }, { name: "Assignments", count: report.assignments.length }].map((c) => <Grid item xs={6} md={2} key={c.name}><Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">{c.name}</Typography><Typography variant="h4">{c.count}</Typography></Paper></Grid>)}</Grid><Paper variant="outlined" sx={{ p: 2, height: 280 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={reportChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><ChartTooltip /><Bar dataKey="count" fill="#3181c9" /></BarChart></ResponsiveContainer></Paper>{mode === "report" && <Tabs value={reportTab} onChange={(_, v) => setReportTab(v)} variant="scrollable"><Tab label="Course summary" /><Tab label="Panels" /><Tab label="Members" /><Tab label="Assignments" /></Tabs>}</>}
    <Paper variant="outlined" sx={{ height: 550, width: "100%" }}><DataGrid rows={displayRows} columns={columns} checkboxSelection disableRowSelectionOnClick loading={busy} rowSelectionModel={ids} onRowSelectionModelChange={(v) => setIds(arrSelection(v))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} getRowHeight={() => "auto"} sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", py: 1, overflowWrap: "anywhere" } }} /></Paper>
    </Box>
    <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="lg" fullWidth><DialogTitle>Details<Button onClick={() => setDetail(null)} sx={{ float: "right" }}>Close</Button></DialogTitle><DialogContent><RecordDetails value={detail} /></DialogContent></Dialog>
  </Stack></MenuPageShell>;
}

export function QuestionPaperIndentInvitationPage() {
  const params = new URLSearchParams(window.location.search), token = params.get("token"), initial = params.get("choice");
  const [data, setData] = useState(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(true);
  useEffect(() => { ep1.get(`${root}/invitation`, { params: { token } }).then((r) => setData(r.data)).catch((e) => setMessage(e.response?.data?.message || "Unable to load invitation")).finally(() => setBusy(false)); }, [token]);
  const respond = async (decision) => { setBusy(true); try { const r = await ep1.post(`${root}/invitation`, { token, decision }); setData((p) => ({ ...p, status: r.data.status })); setMessage(`Invitation ${r.data.status.toLowerCase()}. Thank you.`); } catch (e) { setMessage(e.response?.data?.message || e.message); } finally { setBusy(false); } };
  return <Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}><Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h4">Paper setter invitation</Typography>{busy && <LinearProgress />}{message && <Alert severity={data ? "info" : "error"}>{message}</Alert>}{data && <><Typography>Dear {data.member},</Typography><Typography variant="h6">{data.panel.panelname}</Typography><Typography>{data.panel.program} ({data.panel.programcode}) — Semester {data.panel.semester}</Typography><Typography>{data.panel.course} ({data.panel.coursecode})</Typography><Typography>{data.panel.description}</Typography><Chip label={data.status} />{data.status === "Not confirmed" && <Stack direction="row" spacing={2}><Button color="success" variant={initial !== "Rejected" ? "contained" : "outlined"} disabled={busy} onClick={() => respond("Accepted")}>Accept invitation</Button><Button color="error" variant={initial === "Rejected" ? "contained" : "outlined"} disabled={busy} onClick={() => respond("Rejected")}>Reject invitation</Button></Stack>}</>}</Stack></Paper></Box>;
}
