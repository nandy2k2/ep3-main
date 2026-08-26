import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const clean = (value) => String(value || "").trim();
const uniq = (items) => [...new Set(items.map(clean).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells.map(clean);
};
const parseCsv = (text) => {
  const lines = String(text || "").split(/\r?\n/).filter((line) => clean(line));
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] || "" }), {});
  });
};

const basePatternForm = { academicyear: "", program: "", programcode: "", pattern: "", description: "", status: "Active" };
const baseDetailForm = { patternid: "", academicyear: "", program: "", programcode: "", pattern: "", section: "", question: "", group: "", subquestion: "", order: "", marks: "", instructions: "", status: "Active" };

function useCourseOptions() {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    ep1.get("/api/v2/conductexam/papersetter-options", { params: { colid: global1.colid } })
      .then((res) => setCourses(res.data?.courses || []))
      .catch(() => setCourses([]));
  }, []);
  return courses;
}

function ToolbarButtons({ selected, onDelete, template, onBulk, saving }) {
  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "question_pattern_template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onBulk(parseCsv(text));
    event.target.value = "";
  };
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Button variant="outlined" onClick={downloadTemplate}>Template</Button>
      <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={saving}>
        Bulk Upload
        <input hidden type="file" accept=".csv" onChange={upload} />
      </Button>
      <Button color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={!selected.length || saving} onClick={onDelete}>Bulk Delete</Button>
    </Stack>
  );
}

export function ConductExamQuestionPatternPage() {
  const courses = useCourseOptions();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(basePatternForm);
  const [filters, setFilters] = useState({ academicyear: "", programcode: "", pattern: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const courseOptions = useMemo(() => courses.map((row) => ({ ...row, label: `${row.program || ""} (${row.programcode || ""})` })), [courses]);
  const yearOptions = useMemo(() => uniq(courses.map((row) => row.academicyear).concat(rows.map((row) => row.academicyear))), [courses, rows]);
  const patternOptions = useMemo(() => uniq(rows.map((row) => row.pattern)), [rows]);

  const load = async () => {
    try {
      setSaving(true);
      const params = { colid: global1.colid };
      Object.entries(filters).forEach(([key, value]) => { if (clean(value)) params[key] = clean(value); });
      const res = await ep1.get("/api/v2/conductexam/question-patterns", { params });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load question patterns");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const res = await ep1.post("/api/v2/conductexam/question-patterns", { ...form, colid: global1.colid, name: global1.name, user: global1.user });
      setMessage("Question pattern saved.");
      setForm(basePatternForm);
      await load();
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save question pattern");
    } finally {
      setSaving(false);
    }
  };

  const bulkUpload = async (items) => {
    try {
      setSaving(true);
      const res = await ep1.post("/api/v2/conductexam/question-patterns-bulk", { colid: global1.colid, name: global1.name, user: global1.user, rows: items });
      setMessage(`${res.data?.saved || 0} pattern rows uploaded.`);
      if (res.data?.errors?.length) setError(res.data.errors.join(" | "));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to bulk upload patterns");
    } finally {
      setSaving(false);
    }
  };

  const bulkDelete = async () => {
    if (!selected.length || !window.confirm("Delete selected question patterns and their details?")) return;
    try {
      setSaving(true);
      await ep1.post("/api/v2/conductexam/question-patterns-delete", { colid: global1.colid, ids: selected });
      setSelected([]);
      setMessage("Selected patterns deleted.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected patterns");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "program", headerName: "Program", flex: 1, minWidth: 180 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "pattern", headerName: "Pattern", flex: 1, minWidth: 180 },
    { field: "description", headerName: "Description", flex: 1, minWidth: 260 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "actions", headerName: "Edit", width: 100, sortable: false, renderCell: (params) => <Button size="small" onClick={() => setForm({ ...basePatternForm, ...params.row })}>Edit</Button> }
  ];

  return (
    <MenuPageShell title="Question Pattern">
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box><Typography variant="h5" fontWeight={900}>Question Pattern</Typography><Typography color="text.secondary">Create academic year and program-wise question paper patterns.</Typography></Box>
          <ToolbarButtons selected={selected} onDelete={bulkDelete} onBulk={bulkUpload} saving={saving} template="academicyear,program,programcode,pattern,description,status\n2026-27,BDS,BDS01,Pattern A,Section-wise descriptive paper,Active\n" />
        </Stack>
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><Autocomplete freeSolo options={yearOptions} value={form.academicyear} onInputChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value }))} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={courseOptions} getOptionLabel={(row) => row.label || ""} onChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value?.academicyear || prev.academicyear, program: value?.program || "", programcode: value?.programcode || "" }))} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Program Code" value={form.programcode} onChange={(e) => setForm({ ...form, programcode: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Pattern" value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={1}><Button fullWidth variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save} sx={{ height: 56 }}>Save</Button></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}><Autocomplete options={yearOptions} value={filters.academicyear} onInputChange={(_, value) => setFilters((prev) => ({ ...prev, academicyear: value }))} renderInput={(params) => <TextField {...params} label="Filter Year" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={courseOptions} getOptionLabel={(row) => row.label || ""} onChange={(_, value) => setFilters((prev) => ({ ...prev, programcode: value?.programcode || "" }))} renderInput={(params) => <TextField {...params} label="Filter Program" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={patternOptions} value={filters.pattern} onInputChange={(_, value) => setFilters((prev) => ({ ...prev, pattern: value }))} renderInput={(params) => <TextField {...params} label="Filter Pattern" />} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><MenuItem value="">All</MenuItem>{["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={saving} onClick={load} sx={{ height: 56 }}>Load</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1 }}>
          <DataGrid checkboxSelection rows={rows.map((row) => ({ ...row, id: row._id }))} columns={columns} loading={saving} autoHeight slots={{ toolbar: GridToolbar }} onRowSelectionModelChange={(model) => setSelected(Array.from(model.ids || model))} sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1, alignItems: "flex-start" } }} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function ConductExamQuestionPatternDetailsPage() {
  const [patterns, setPatterns] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(baseDetailForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedPattern = useMemo(() => patterns.find((row) => row._id === form.patternid) || null, [patterns, form.patternid]);

  const loadPatterns = async () => {
    const res = await ep1.get("/api/v2/conductexam/question-patterns", { params: { colid: global1.colid, status: "Active" } });
    setPatterns(res.data?.data || []);
  };
  useEffect(() => { loadPatterns().catch(() => setPatterns([])); }, []);
  const load = async (patternid = form.patternid) => {
    try {
      setSaving(true);
      const res = await ep1.get("/api/v2/conductexam/question-pattern-details", { params: { colid: global1.colid, ...(patternid ? { patternid } : {}) } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load pattern details");
    } finally {
      setSaving(false);
    }
  };
  const selectPattern = (pattern) => setForm((prev) => ({
    ...prev,
    patternid: pattern?._id || "",
    academicyear: pattern?.academicyear || "",
    program: pattern?.program || "",
    programcode: pattern?.programcode || "",
    pattern: pattern?.pattern || ""
  }));
  const save = async () => {
    try {
      setSaving(true);
      await ep1.post("/api/v2/conductexam/question-pattern-details", { ...form, colid: global1.colid, name: global1.name, user: global1.user });
      setMessage("Pattern detail saved.");
      const keep = { patternid: form.patternid, academicyear: form.academicyear, program: form.program, programcode: form.programcode, pattern: form.pattern };
      setForm({ ...baseDetailForm, ...keep });
      await load(keep.patternid);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save pattern detail");
    } finally {
      setSaving(false);
    }
  };
  const bulkUpload = async (items) => {
    if (!selectedPattern) return setError("Select a pattern before bulk upload.");
    try {
      setSaving(true);
      const rows = items.map((item) => ({ ...item, patternid: selectedPattern._id, academicyear: selectedPattern.academicyear, program: selectedPattern.program, programcode: selectedPattern.programcode, pattern: selectedPattern.pattern }));
      const res = await ep1.post("/api/v2/conductexam/question-pattern-details-bulk", { colid: global1.colid, name: global1.name, user: global1.user, rows });
      setMessage(`${res.data?.saved || 0} detail rows uploaded.`);
      if (res.data?.errors?.length) setError(res.data.errors.join(" | "));
      await load(selectedPattern._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to bulk upload pattern details");
    } finally {
      setSaving(false);
    }
  };
  const bulkDelete = async () => {
    if (!selected.length || !window.confirm("Delete selected pattern detail rows?")) return;
    try {
      setSaving(true);
      await ep1.post("/api/v2/conductexam/question-pattern-details-delete", { colid: global1.colid, ids: selected });
      setSelected([]);
      setMessage("Selected pattern detail rows deleted.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete pattern details");
    } finally {
      setSaving(false);
    }
  };
  const columns = [
    { field: "order", headerName: "Order", width: 90 },
    { field: "section", headerName: "Section", width: 150 },
    { field: "question", headerName: "Question", width: 150 },
    { field: "group", headerName: "Group", width: 130 },
    { field: "subquestion", headerName: "Sub Question", width: 150 },
    { field: "marks", headerName: "Marks", width: 100 },
    { field: "instructions", headerName: "Instructions", flex: 1, minWidth: 240 },
    { field: "status", headerName: "Status", width: 110 },
    { field: "actions", headerName: "Edit", width: 90, sortable: false, renderCell: (params) => <Button size="small" onClick={() => setForm({ ...baseDetailForm, ...params.row })}>Edit</Button> }
  ];
  return (
    <MenuPageShell title="Question Pattern Details">
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box><Typography variant="h5" fontWeight={900}>Question Pattern Details</Typography><Typography color="text.secondary">Define sections, questions, optional groups and subquestions.</Typography></Box>
          <ToolbarButtons selected={selected} onDelete={bulkDelete} onBulk={bulkUpload} saving={saving} template="section,question,group,subquestion,order,marks,instructions,status\nSection A,Q1,,a,1,5,Answer any five,Active\n" />
        </Stack>
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Autocomplete options={patterns} getOptionLabel={(row) => `${row.pattern || ""} - ${row.program || ""} (${row.programcode || ""}) ${row.academicyear || ""}`} value={selectedPattern} onChange={(_, value) => { selectPattern(value); if (value?._id) load(value._id); }} renderInput={(params) => <TextField {...params} label="Question Pattern" />} /></Grid>
            {["section", "question", "group", "subquestion"].map((field) => <Grid item xs={12} md={2} key={field}><TextField fullWidth label={field === "subquestion" ? "Sub Question" : field[0].toUpperCase() + field.slice(1)} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /></Grid>)}
            <Grid item xs={12} md={1}><TextField fullWidth type="number" label="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></Grid>
            <Grid item xs={12} md={1}><TextField fullWidth type="number" label="Marks" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save} sx={{ height: 56 }}>Save</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1 }}>
          <DataGrid checkboxSelection rows={rows.map((row) => ({ ...row, id: row._id }))} columns={columns} loading={saving} autoHeight slots={{ toolbar: GridToolbar }} onRowSelectionModelChange={(model) => setSelected(Array.from(model.ids || model))} sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1, alignItems: "flex-start" } }} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
