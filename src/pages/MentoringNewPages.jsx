import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { BarChart, PieChart } from "@mui/x-charts";
import { Delete, Download, Print, Refresh, Save, SwapHoriz } from "@mui/icons-material";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const today = new Date().toISOString().slice(0, 10);
const blankFilters = { academicyear: "", regulation: "", program: "", programcode: "", semester: "", section: "" };
const safe = (value) => String(value ?? "").trim();
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1, lineHeight: 1.35 },
  "& .MuiDataGrid-columnHeaders": { fontWeight: 800 }
};

const moduleLabel = (module) => module === "Student Welfare" ? "Student Welfare" : "Mentoring New";
const officerLabel = (module) => module === "Student Welfare" ? "Student welfare officer" : "Mentor";
const assignmentTitle = (module) => module === "Student Welfare" ? "Student Welfare Assignment" : "Mentor Assignment";

function StatCard({ label, value, color = "#2563eb" }) {
  return (
    <Card sx={{ height: "100%", borderLeft: `5px solid ${color}` }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" fontWeight={900}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

function useMentoringOptions(module) {
  const [options, setOptions] = useState({ academicyears: [], regulations: [], programs: [], semesters: [], sections: [], officers: [], assignedOfficers: [], interactiontypes: [] });
  const load = async () => {
    const res = await ep1.get("/api/v2/mentoring-new/options", { params: { colid: global1.colid, module } });
    setOptions(res.data || {});
  };
  useEffect(() => { load().catch(() => {}); }, [module]);
  return [options, load];
}

function FilterPanel({ module, filters, setFilters, options, onLoad, loading, extra }) {
  const update = (field, value) => {
    const next = { ...filters, [field]: value || "" };
    if (field === "academicyear") Object.assign(next, { regulation: "", program: "", programcode: "", semester: "", section: "" });
    if (field === "regulation") Object.assign(next, { program: "", programcode: "", semester: "", section: "" });
    if (field === "program") Object.assign(next, { semester: "", section: "" });
    setFilters(next);
  };
  const selectedProgram = filters.program && filters.programcode ? `${filters.program}|||${filters.programcode}` : null;
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={2}>
          <Autocomplete options={options.academicyears || []} value={filters.academicyear || null} onChange={(_, value) => update("academicyear", value)} renderInput={(params) => <TextField {...params} label="Academic Year" />} />
        </Grid>
        <Grid item xs={12} md={2}>
          <Autocomplete options={options.regulations || []} value={filters.regulation || null} onChange={(_, value) => update("regulation", value)} renderInput={(params) => <TextField {...params} label="Regulation" />} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={options.programs || []}
            value={selectedProgram}
            onChange={(_, value) => {
              const [program, programcode] = safe(value).split("|||");
              update("program", program);
              setFilters((prev) => ({ ...prev, program: program || "", programcode: programcode || "", semester: "", section: "" }));
            }}
            getOptionLabel={(option) => {
              const [program, programcode] = safe(option).split("|||");
              return programcode ? `${program} (${programcode})` : safe(option);
            }}
            renderInput={(params) => <TextField {...params} label="Program" />}
          />
        </Grid>
        <Grid item xs={12} md={1.5}>
          <Autocomplete options={options.semesters || []} value={filters.semester || null} onChange={(_, value) => update("semester", value)} renderInput={(params) => <TextField {...params} label="Semester" />} />
        </Grid>
        <Grid item xs={12} md={1.5}>
          <Autocomplete options={options.sections || []} value={filters.section || null} onChange={(_, value) => update("section", value)} renderInput={(params) => <TextField {...params} label="Section" />} />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button fullWidth variant="contained" startIcon={<Refresh />} disabled={loading} onClick={onLoad} sx={{ minHeight: 56 }}>
            {loading ? "Loading..." : `Load ${module === "Student Welfare" ? "Welfare" : "Mentoring"}`}
          </Button>
        </Grid>
        {extra}
      </Grid>
    </Paper>
  );
}

function exportTemplate(module) {
  const rows = [{
    academicyear: "2026-27",
    regulation: "REG-2026-27",
    program: "Program name",
    programcode: "PRG",
    semester: "1",
    student: "Student name",
    studentemail: "student@example.com",
    regno: "REG001",
    section: "A",
    officer: officerLabel(module),
    officeremail: "officer@example.com"
  }];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `${module.toLowerCase().replace(/\s+/g, "_")}_assignment_template.xlsx`);
}

function AssignmentPage({ module = "Mentoring" }) {
  const [options] = useMentoringOptions(module);
  const [filters, setFilters] = useState(blankFilters);
  const [students, setStudents] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [studentSelection, setStudentSelection] = useState([]);
  const [assignedSelection, setAssignedSelection] = useState([]);
  const [officer, setOfficer] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [targetOfficer, setTargetOfficer] = useState(null);
  const [transferremarks, setTransferremarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUnassigned = async () => {
    if (!filters.academicyear || !filters.programcode || !filters.semester) {
      setError("Select academic year, program and semester first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = { colid: global1.colid, module, ...filters };
      const res = await ep1.get("/api/v2/mentoring-new/unassigned-students", { params });
      setStudents((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setStudentSelection([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load unassigned students");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedForOfficer = async (selected = selectedOfficer) => {
    if (!selected?.email) {
      setAssigned([]);
      return;
    }
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/mentoring-new/assignments", { params: { colid: global1.colid, module, officeremail: selected.email, status: "Active" } });
      setAssigned((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setAssignedSelection([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load assigned students");
    } finally {
      setLoading(false);
    }
  };

  const assign = async () => {
    if (!officer?.email) return setError(`Select ${officerLabel(module).toLowerCase()}`);
    if (!studentSelection.length) return setError("Select students");
    setBusy(true);
    setError("");
    try {
      const selectedStudents = students.filter((row) => studentSelection.includes(row.id));
      const res = await ep1.post("/api/v2/mentoring-new/assign", {
        colid: global1.colid,
        user: global1.user,
        module,
        ...filters,
        officer: officer.name,
        officeremail: officer.email,
        students: selectedStudents
      });
      setMessage(`Assigned ${res.data?.saved || 0} student(s)`);
      await loadUnassigned();
      if (selectedOfficer?.email === officer.email) await loadAssignedForOfficer(selectedOfficer);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign students");
    } finally {
      setBusy(false);
    }
  };

  const transfer = async () => {
    if (!assignedSelection.length) return setError("Select assigned students to transfer");
    if (!targetOfficer?.email) return setError(`Select target ${officerLabel(module).toLowerCase()}`);
    setBusy(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/mentoring-new/transfer", {
        colid: global1.colid,
        user: global1.user,
        module,
        ids: assignedSelection,
        officer: targetOfficer.name,
        officeremail: targetOfficer.email,
        transferremarks
      });
      setMessage(`Transferred ${res.data?.updated || 0} student(s)`);
      await loadAssignedForOfficer();
      await loadUnassigned();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to transfer students");
    } finally {
      setBusy(false);
    }
  };

  const bulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const grouped = rows.reduce((acc, row) => {
        const officeremail = safe(row.officeremail || row["Officer Email"]).toLowerCase();
        const officer = safe(row.officer || row.mentor || row["Officer"] || row["Mentor"]);
        if (!officeremail || !safe(row.regno || row["Reg No"])) return acc;
        const key = `${officeremail}|||${officer}`;
        acc[key] = acc[key] || { officer, officeremail, students: [] };
        acc[key].students.push({
          academicyear: safe(row.academicyear || row["Academic Year"]),
          regulation: safe(row.regulation || row.Regulation),
          program: safe(row.program || row.Program),
          programcode: safe(row.programcode || row["Program Code"]),
          semester: safe(row.semester || row.Semester),
          student: safe(row.student || row.name || row.Student),
          studentemail: safe(row.studentemail || row.email || row["Student Email"]),
          regno: safe(row.regno || row["Reg No"]),
          section: safe(row.section || row.Section)
        });
        return acc;
      }, {});
      let saved = 0;
      for (const group of Object.values(grouped)) {
        const res = await ep1.post("/api/v2/mentoring-new/assign", {
          colid: global1.colid,
          user: global1.user,
          module,
          officer: group.officer,
          officeremail: group.officeremail,
          students: group.students
        });
        saved += Number(res.data?.saved || 0);
      }
      setMessage(`Bulk uploaded ${saved} assignment(s)`);
      await loadUnassigned();
      await loadAssignedForOfficer();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to bulk upload assignments");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!assignedSelection.length) return setError("Select assigned rows to delete");
    if (!window.confirm("Delete selected assignment rows?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/mentoring-new/delete", { colid: global1.colid, ids: assignedSelection });
      setMessage(`Deleted ${res.data?.deleted || 0} assignment(s)`);
      await loadAssignedForOfficer();
      await loadUnassigned();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete assignments");
    } finally {
      setBusy(false);
    }
  };

  const studentColumns = [
    { field: "name", headerName: "Student", minWidth: 220, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "program", headerName: "Program", minWidth: 200, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 110 },
    { field: "email", headerName: "Email", minWidth: 220, flex: 1 }
  ];
  const assignedColumns = [
    { field: "student", headerName: "Student", minWidth: 220, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "program", headerName: "Program", minWidth: 200, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 110 },
    { field: "officer", headerName: officerLabel(module), minWidth: 220, flex: 1 },
    { field: "officeremail", headerName: "Officer Email", minWidth: 220, flex: 1 },
    { field: "assigneddate", headerName: "Assigned Date", minWidth: 170, valueGetter: (value) => value ? new Date(value).toLocaleString() : "" }
  ];

  return (
    <MenuPageShell title={assignmentTitle(module)}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>{assignmentTitle(module)}</Typography>
            <Typography color="text.secondary">Load unassigned students, assign them, view only the selected {officerLabel(module).toLowerCase()} mentees, and transfer where required.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Download />} onClick={() => exportTemplate(module)}>Bulk Upload Template</Button>
            <Button variant="contained" component="label" disabled={busy}>
              Bulk Upload
              <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={bulkUpload} />
            </Button>
          </Stack>
        </Stack>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <FilterPanel module={module} filters={filters} setFilters={setFilters} options={options} loading={loading} onLoad={loadUnassigned} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <Autocomplete options={options.officers || []} value={officer} onChange={(_, value) => setOfficer(value)} getOptionLabel={(option) => option?.email ? `${option.name} (${option.email})` : ""} renderInput={(params) => <TextField {...params} label={`Assign ${officerLabel(module)}`} />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button fullWidth variant="contained" startIcon={<Save />} disabled={busy || !studentSelection.length} onClick={assign} sx={{ minHeight: 56 }}>{busy ? "Working..." : "Assign Selected"}</Button>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1, mb: 2, overflowX: "auto" }}>
          <Typography fontWeight={900} sx={{ p: 1 }}>Students not assigned</Typography>
          <DataGrid checkboxSelection rows={students} columns={studentColumns} loading={loading} autoHeight rowSelectionModel={studentSelection} onRowSelectionModelChange={(ids) => setStudentSelection(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `${module}_unassigned_students` } } }} pageSizeOptions={[10, 25, 50, 100]} sx={{ minWidth: 1250, ...gridSx }} />
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Autocomplete options={options.officers || []} value={selectedOfficer} onChange={(_, value) => { setSelectedOfficer(value); loadAssignedForOfficer(value); }} getOptionLabel={(option) => option?.email ? `${option.name} (${option.email})` : ""} renderInput={(params) => <TextField {...params} label={`View ${officerLabel(module)} mentees`} />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete options={options.officers || []} value={targetOfficer} onChange={(_, value) => setTargetOfficer(value)} getOptionLabel={(option) => option?.email ? `${option.name} (${option.email})` : ""} renderInput={(params) => <TextField {...params} label={`Transfer to ${officerLabel(module)}`} />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Transfer remarks" value={transferremarks} onChange={(e) => setTransferremarks(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="contained" color="warning" startIcon={<SwapHoriz />} disabled={busy || !assignedSelection.length} onClick={transfer} sx={{ minHeight: 56 }}>Transfer</Button>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="outlined" color="error" startIcon={<Delete />} disabled={busy || !assignedSelection.length} onClick={remove} sx={{ minHeight: 56 }}>Delete</Button>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <Typography fontWeight={900} sx={{ p: 1 }}>Mentees for selected {officerLabel(module).toLowerCase()}</Typography>
          <DataGrid checkboxSelection rows={assigned} columns={assignedColumns} loading={loading} autoHeight rowSelectionModel={assignedSelection} onRowSelectionModelChange={(ids) => setAssignedSelection(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `${module}_assigned_students` } } }} pageSizeOptions={[10, 25, 50, 100]} sx={{ minWidth: 1500, ...gridSx }} />
        </Paper>
      </Container>
    </MenuPageShell>
  );
}

function AssignmentReportPage({ module = "Mentoring" }) {
  const [options] = useMentoringOptions(module);
  const [filters, setFilters] = useState(blankFilters);
  const [data, setData] = useState({ data: [], byOfficer: [], byProgram: [], totals: {} });
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { ep1.get("/vins", { params: { colid: global1.colid } }).then((res) => setInstitution(res.data || null)).catch(() => {}); }, []);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/mentoring-new/report", { params: { colid: global1.colid, module, ...filters } });
      setData({
        data: (res.data?.data || []).map((row) => ({ ...row, id: row._id })),
        byOfficer: res.data?.byOfficer || [],
        byProgram: res.data?.byProgram || [],
        totals: res.data?.totals || {}
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { field: "officer", headerName: officerLabel(module), minWidth: 220, flex: 1 },
    { field: "officeremail", headerName: "Officer Email", minWidth: 220, flex: 1 },
    { field: "student", headerName: "Student", minWidth: 220, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "program", headerName: "Program", minWidth: 200, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 110 }
  ];
  return (
    <MenuPageShell title={`${moduleLabel(module)} Report`}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <style>{`@media print { body * { visibility:hidden; } #mentor-report-print, #mentor-report-print * { visibility:visible; } #mentor-report-print { position:absolute; left:0; top:0; width:100%; padding:14mm; background:#fff; color:#000; } .no-print{display:none!important;} }`}</style>
        <Stack className="no-print" direction={{ xs: "column", md: "row" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box><Typography variant="h5" fontWeight={900}>{moduleLabel(module)} Report</Typography><Typography color="text.secondary">Course and officer wise mentoring allocation summary.</Typography></Box>
          <Button startIcon={<Print />} variant="outlined" onClick={() => window.print()}>Print Preview</Button>
        </Stack>
        {loading && <LinearProgress className="no-print" sx={{ mb: 2 }} />}
        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Box className="no-print"><FilterPanel module={module} filters={filters} setFilters={setFilters} options={options} loading={loading} onLoad={load} /></Box>
        <Box id="mentor-report-print">
          <Box sx={{ textAlign: "center", mb: 2 }}>
            {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 58 }} />}
            <Typography variant="h5" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
            <Typography>{institution?.address || institution?.institutionaddress || ""}</Typography>
            <Typography variant="h6" fontWeight={900}>{moduleLabel(module)} Report</Typography>
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}><StatCard label="Assigned Students" value={data.totals.students || 0} /></Grid>
            <Grid item xs={12} md={4}><StatCard label={`${officerLabel(module)}s`} value={data.totals.officers || 0} color="#0f766e" /></Grid>
            <Grid item xs={12} md={4}><StatCard label="Programs" value={data.totals.programs || 0} color="#7c3aed" /></Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>By {officerLabel(module)}</Typography><BarChart dataset={data.byOfficer} xAxis={[{ scaleType: "band", dataKey: "officer" }]} series={[{ dataKey: "students", label: "Students" }]} height={260} /></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>By Program</Typography><PieChart series={[{ data: data.byProgram.map((row, index) => ({ id: index, label: row.programcode || row.program || "-", value: row.students })) }]} height={260} /></Paper></Grid>
          </Grid>
          <Paper sx={{ p: 1, overflowX: "auto" }}><DataGrid rows={data.data} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `${module}_assignment_report` } } }} pageSizeOptions={[10, 25, 50, 100]} sx={{ minWidth: 1400, ...gridSx }} /></Paper>
        </Box>
      </Container>
    </MenuPageShell>
  );
}

function InteractionPage({ module = "Mentoring" }) {
  const [options] = useMentoringOptions(module);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ interactiondate: today, interactiontype: "Counselling", interaction: "", actiontaken: "", followupdate: "", remarks: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMine = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/mentoring-new/assignments", { params: { colid: global1.colid, module, officeremail: global1.user, status: "Active" } });
      setAssignments((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { loadMine(); }, [module]);

  const loadSessions = async (assignment) => {
    if (!assignment) return;
    setSelected(assignment);
    const res = await ep1.get("/api/v2/mentoring-new/interactions", { params: { colid: global1.colid, module, officeremail: global1.user, regno: assignment.regno } });
    setSessions((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
  };

  const save = async () => {
    if (!selected?._id) return setError("Select a student");
    if (!form.interactiondate) return setError("Select interaction date");
    setBusy(true);
    setError("");
    try {
      await ep1.post("/api/v2/mentoring-new/interactions", { ...form, colid: global1.colid, user: global1.user, module, assignmentid: selected._id });
      setMessage("Interaction saved");
      setForm({ interactiondate: today, interactiontype: "Counselling", interaction: "", actiontaken: "", followupdate: "", remarks: "" });
      await loadSessions(selected);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save interaction");
    } finally {
      setBusy(false);
    }
  };

  const assignmentColumns = [
    { field: "student", headerName: "Student", minWidth: 220, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 110 }
  ];
  const sessionColumns = [
    { field: "interactiondate", headerName: "Date", width: 130 },
    { field: "interactiontype", headerName: "Type", width: 150 },
    { field: "interaction", headerName: "Interaction", minWidth: 260, flex: 1 },
    { field: "actiontaken", headerName: "Action Taken", minWidth: 240, flex: 1 },
    { field: "followupdate", headerName: "Follow Up", width: 130 },
    { field: "remarks", headerName: "Remarks", minWidth: 220, flex: 1 }
  ];

  return (
    <MenuPageShell title={`${moduleLabel(module)} Interaction`}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>{moduleLabel(module)} Interaction</Typography>
        {busy && <LinearProgress sx={{ mb: 2 }} />}
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 1, overflowX: "auto" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1 }}>
                <Typography fontWeight={900}>My Students</Typography>
                <Button size="small" startIcon={<Refresh />} onClick={loadMine}>Refresh</Button>
              </Stack>
              <DataGrid rows={assignments} columns={assignmentColumns} autoHeight onRowClick={(params) => loadSessions(params.row)} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} sx={{ minWidth: 780, ...gridSx }} />
            </Paper>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography fontWeight={900} sx={{ mb: 1 }}>{selected ? `${selected.student} (${selected.regno})` : "Select a student"}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.interactiondate} onChange={(e) => setForm((p) => ({ ...p, interactiondate: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><Autocomplete options={options.interactiontypes || []} value={form.interactiontype || null} onChange={(_, value) => setForm((p) => ({ ...p, interactiontype: value || "" }))} renderInput={(params) => <TextField {...params} label="Type" />} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Follow Up" InputLabelProps={{ shrink: true }} value={form.followupdate} onChange={(e) => setForm((p) => ({ ...p, followupdate: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Interaction" value={form.interaction} onChange={(e) => setForm((p) => ({ ...p, interaction: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Action Taken" value={form.actiontaken} onChange={(e) => setForm((p) => ({ ...p, actiontaken: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} /></Grid>
                <Grid item xs={12}><Button variant="contained" startIcon={<Save />} disabled={busy || !selected} onClick={save}>{busy ? "Saving..." : "Save Interaction"}</Button></Grid>
              </Grid>
            </Paper>
            <Paper sx={{ p: 1, overflowX: "auto" }}><Typography fontWeight={900} sx={{ p: 1 }}>Interaction History</Typography><DataGrid rows={sessions} columns={sessionColumns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `${module}_interactions` } } }} sx={{ minWidth: 1200, ...gridSx }} /></Paper>
          </Grid>
        </Grid>
      </Container>
    </MenuPageShell>
  );
}

function SessionReportPage({ module = "Mentoring" }) {
  const [options] = useMentoringOptions(module);
  const [filters, setFilters] = useState({ ...blankFilters, officeremail: "", fromdate: "", todate: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ byOfficer: [], byType: [], byDate: [], totals: {} });
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => { ep1.get("/vins", { params: { colid: global1.colid } }).then((res) => setInstitution(res.data || null)).catch(() => {}); }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/mentoring-new/interactions", { params: { colid: global1.colid, module, ...filters } });
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setSummary(res.data?.summary || { byOfficer: [], byType: [], byDate: [], totals: {} });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load session report");
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { field: "interactiondate", headerName: "Date", width: 130 },
    { field: "officer", headerName: officerLabel(module), minWidth: 210, flex: 1 },
    { field: "student", headerName: "Student", minWidth: 210, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "interactiontype", headerName: "Type", width: 150 },
    { field: "interaction", headerName: "Interaction", minWidth: 260, flex: 1 },
    { field: "actiontaken", headerName: "Action Taken", minWidth: 240, flex: 1 }
  ];
  return (
    <MenuPageShell title={`${moduleLabel(module)} Session Report`}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <style>{`@media print { body * { visibility:hidden; } #session-report-print, #session-report-print * { visibility:visible; } #session-report-print { position:absolute; left:0; top:0; width:100%; padding:14mm; background:#fff; color:#000; } .no-print{display:none!important;} }`}</style>
        <Stack className="no-print" direction={{ xs: "column", md: "row" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box><Typography variant="h5" fontWeight={900}>{moduleLabel(module)} Session Report</Typography><Typography color="text.secondary">Filter session records with charts, cards and printable details.</Typography></Box>
          <Button startIcon={<Print />} variant="outlined" onClick={() => window.print()}>Print Preview</Button>
        </Stack>
        {loading && <LinearProgress className="no-print" sx={{ mb: 2 }} />}
        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
          <FilterPanel
            module={module}
            filters={filters}
            setFilters={setFilters}
            options={options}
            loading={loading}
            onLoad={load}
            extra={(
              <>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={options.officers || []}
                    value={(options.officers || []).find((item) => item.email === filters.officeremail) || null}
                    onChange={(_, value) => setFilters((p) => ({ ...p, officeremail: value?.email || "" }))}
                    getOptionLabel={(option) => option?.email ? `${option.name} (${option.email})` : ""}
                    renderInput={(params) => <TextField {...params} label={officerLabel(module)} />}
                  />
                </Grid>
                <Grid item xs={12} md={2}><TextField fullWidth type="date" label="From Date" InputLabelProps={{ shrink: true }} value={filters.fromdate} onChange={(e) => setFilters((p) => ({ ...p, fromdate: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField fullWidth type="date" label="To Date" InputLabelProps={{ shrink: true }} value={filters.todate} onChange={(e) => setFilters((p) => ({ ...p, todate: e.target.value }))} /></Grid>
              </>
            )}
          />
        </Paper>
        <Box id="session-report-print">
          <Box sx={{ textAlign: "center", mb: 2 }}>
            {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 58 }} />}
            <Typography variant="h5" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
            <Typography>{institution?.address || institution?.institutionaddress || ""}</Typography>
            <Typography variant="h6" fontWeight={900}>{moduleLabel(module)} Session Report</Typography>
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}><StatCard label="Sessions" value={summary.totals?.sessions || 0} /></Grid>
            <Grid item xs={12} md={4}><StatCard label={`${officerLabel(module)}s`} value={summary.totals?.officers || 0} color="#0f766e" /></Grid>
            <Grid item xs={12} md={4}><StatCard label="Students" value={new Set(rows.map((row) => row.regno)).size} color="#7c3aed" /></Grid>
          </Grid>
          <Tabs className="no-print" value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label="Charts" />
            <Tab label="Details" />
          </Tabs>
          {(tab === 0 || typeof window === "undefined") && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Sessions by date</Typography><BarChart dataset={summary.byDate || []} xAxis={[{ scaleType: "band", dataKey: "interactiondate" }]} series={[{ dataKey: "sessions", label: "Sessions" }]} height={260} /></Paper></Grid>
              <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Sessions by type</Typography><PieChart series={[{ data: (summary.byType || []).map((row, index) => ({ id: index, label: row.interactiontype || "-", value: row.sessions })) }]} height={260} /></Paper></Grid>
            </Grid>
          )}
          <Paper sx={{ p: 1, overflowX: "auto" }}><DataGrid rows={rows} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: `${module}_session_report` } } }} pageSizeOptions={[10, 25, 50, 100]} sx={{ minWidth: 1700, ...gridSx }} /></Paper>
        </Box>
      </Container>
    </MenuPageShell>
  );
}

export function MentorAssignmentPage() { return <AssignmentPage module="Mentoring" />; }
export function MentoringNewReportPage() { return <AssignmentReportPage module="Mentoring" />; }
export function MentoringNewInteractionPage() { return <InteractionPage module="Mentoring" />; }
export function MentoringNewSessionReportPage() { return <SessionReportPage module="Mentoring" />; }
export function StudentWelfareAssignmentPage() { return <AssignmentPage module="Student Welfare" />; }
export function StudentWelfareReportPage() { return <AssignmentReportPage module="Student Welfare" />; }
export function StudentWelfareInteractionPage() { return <InteractionPage module="Student Welfare" />; }
export function StudentWelfareSessionReportPage() { return <SessionReportPage module="Student Welfare" />; }
