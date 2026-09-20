import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { AutoAwesome, Delete, Download, Edit, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const text = (value) => String(value || "").trim();
const uniqueSorted = (values = []) => [...new Set(values.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const basePayload = () => ({ colid: global1.colid, user: global1.user });
const gridSx = {
  "& .MuiDataGrid-cell": { alignItems: "flex-start", lineHeight: 1.35, py: 1, whiteSpace: "normal", wordBreak: "break-word" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

function Shell({ title, children, embedded = false }) {
  if (embedded) {
    return <Box sx={{ p: 0 }}>{children}</Box>;
  }
  return <MenuPageShell title={title}><Box sx={{ p: 3 }}>{children}</Box></MenuPageShell>;
}

function exportTemplate(rows, name) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  XLSX.writeFile(wb, `${name.replace(/\s+/g, "_")}_template.xlsx`);
}

function readExcelRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wb = XLSX.read(new Uint8Array(event.target.result), { type: "array" });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function printNode(ref, title) {
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>${title}</title><style>@page{size:A4;margin:12mm}body{font-family:Arial;color:#111}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #333;padding:5px}.head{text-align:center;margin-bottom:12px}.MuiDataGrid-toolbarContainer,.no-print{display:none}</style></head><body>${ref.current?.innerHTML || ""}</body></html>`);
  win.document.close();
  win.print();
}

function useAcademicOptions() {
  const [options, setOptions] = useState({ institutions: [], faculties: [], departments: [], programs: [], academicyears: [], regulations: [] });
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/academic-configuration/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };
  useEffect(() => { loadOptions(); }, []);
  return { options, loadOptions };
}

const masterConfig = {
  institution: {
    title: "Master institution list",
    blank: { institution: "", institutioncode: "", description: "", status: "Active" },
    fields: ["institution", "institutioncode", "description", "status"],
    columns: [
      { field: "institution", headerName: "Institution", width: 240 },
      { field: "institutioncode", headerName: "Code", width: 130 },
      { field: "description", headerName: "Description", width: 320 },
      { field: "status", headerName: "Status", width: 120 }
    ]
  },
  faculty: {
    title: "Master faculty list",
    blank: { faculty: "", facultycode: "", description: "", status: "Active" },
    fields: ["faculty", "facultycode", "description", "status"],
    columns: [
      { field: "faculty", headerName: "Faculty", width: 240 },
      { field: "facultycode", headerName: "Code", width: 130 },
      { field: "description", headerName: "Description", width: 320 },
      { field: "status", headerName: "Status", width: 120 }
    ]
  },
  department: {
    title: "Department faculty mapping",
    blank: { faculty: "", institution: "", department: "", departmentcode: "", description: "", status: "Active" },
    fields: ["faculty", "institution", "department", "departmentcode", "description", "status"],
    columns: [
      { field: "faculty", headerName: "Faculty", width: 220 },
      { field: "institution", headerName: "Institution", width: 220 },
      { field: "department", headerName: "Department", width: 220 },
      { field: "departmentcode", headerName: "Code", width: 120 },
      { field: "description", headerName: "Description", width: 280 },
      { field: "status", headerName: "Status", width: 120 }
    ]
  }
};

export function AcademicMasterPage({ kind = "institution", embedded = false, onRowsChange }) {
  const config = masterConfig[kind];
  const { options, loadOptions } = useAcademicOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(config.blank);
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get(`/api/v2/academic-configuration/master/${kind}`, { params: basePayload() });
      const data = res.data?.data || [];
      setRows(data);
      if (onRowsChange) onRowsChange(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [kind]);

  const setField = (field, value) => setForm((old) => ({ ...old, [field]: value }));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await ep1.post(`/api/v2/academic-configuration/master/${kind}`, { ...form, id: editingId, ...basePayload() });
      setMessage("Saved");
      setForm(config.blank);
      setEditingId("");
      await Promise.all([load(), loadOptions()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  };
  const deleteRows = async (ids) => {
    if (!ids.length) return setError("Select at least one row");
    if (!window.confirm(`Delete ${ids.length} selected record(s)?`)) return;
    await ep1.post(`/api/v2/academic-configuration/master/${kind}/delete`, { ids, colid: global1.colid });
    setSelected([]);
    setMessage("Deleted");
    await load();
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    try {
      const rows = await readExcelRows(file);
      await ep1.post(`/api/v2/academic-configuration/master/${kind}/bulk`, { rows, ...basePayload() });
      setMessage("Bulk upload completed");
      await Promise.all([load(), loadOptions()]);
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setSaving(false);
    }
  };

  return <Shell title={config.title} embedded={embedded}><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>{config.title}</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}<Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}>{config.fields.map((field) => <Grid item xs={12} md={field === "description" ? 4 : 2} key={field}>{field === "faculty" ? <Autocomplete freeSolo options={options.faculties || []} getOptionLabel={(o) => typeof o === "string" ? o : o.faculty || ""} value={form.faculty || ""} onInputChange={(_, value) => setField("faculty", value || "")} onChange={(_, value) => setField("faculty", typeof value === "string" ? value : value?.faculty || "")} renderInput={(params) => <TextField {...params} size="small" label="Faculty" />} /> : field === "institution" ? <Autocomplete freeSolo options={options.institutions || []} getOptionLabel={(o) => typeof o === "string" ? o : o.institution || ""} value={form.institution || ""} onInputChange={(_, value) => setField("institution", value || "")} onChange={(_, value) => setField("institution", typeof value === "string" ? value : value?.institution || "")} renderInput={(params) => <TextField {...params} size="small" label="Institution" />} /> : field === "status" ? <TextField select fullWidth size="small" label="Status" value={form.status || "Active"} onChange={(e) => setField("status", e.target.value)}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField> : <TextField fullWidth size="small" multiline={field === "description"} minRows={field === "description" ? 2 : 1} label={field} value={form[field] || ""} onChange={(e) => setField(field, e.target.value)} />}</Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} disabled={saving} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid></Grid></Paper><Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}><Button startIcon={<Refresh />} variant="outlined" onClick={load}>Load</Button><Button startIcon={<Download />} variant="outlined" onClick={() => exportTemplate([config.blank], config.title)}>Template</Button><Button component="label" startIcon={<UploadFile />} variant="outlined">Bulk upload<input hidden type="file" accept=".xlsx,.xls" onChange={bulk} /></Button><Button startIcon={<Delete />} color="error" variant="outlined" disabled={!selected.length} onClick={() => deleteRows(selected)}>Bulk delete</Button></Stack>{saving && <LinearProgress sx={{ mb: 2 }} />}<Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(row) => row._id} columns={[...config.columns, { field: "actions", type: "actions", width: 100, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...config.blank, ...row }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRows([row._id])} />] }]} loading={loading} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} autoHeight getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} /></Paper></Shell>;
}

const aiProviders = ["Gemini", "Ollama", "ChatGPT", "Claude"];
const modelOptions = {
  Gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-pro"],
  Ollama: ["llama3.1", "llama3.2", "mistral", "qwen2.5"],
  ChatGPT: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
  Claude: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"]
};

export function ProgramOutcomePage() {
  const { options } = useAcademicOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ academicyear: "", regulation: "", program: "", programcode: "", pocode: "", po: "", status: "Active" });
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [ai, setAi] = useState({ provider: "Gemini", model: "gemini-2.5-flash", prompt: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/academic-configuration/po", { params: { ...basePayload(), ...filters } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load PO");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async (override = {}) => {
    await ep1.post("/api/v2/academic-configuration/po", { ...form, ...override, id: override.id === undefined ? editingId : override.id, ...basePayload() });
    setMessage("Saved");
    setForm({ academicyear: "", regulation: "", program: "", programcode: "", pocode: "", po: "", status: "Active" });
    setEditingId("");
    await load();
  };
  const deleteRows = async (ids) => {
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected PO row(s)?`)) return;
    await ep1.post("/api/v2/academic-configuration/po/delete", { ids, colid: global1.colid });
    setSelected([]);
    await load();
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const excelRows = await readExcelRows(file);
    await ep1.post("/api/v2/academic-configuration/po/bulk", { rows: excelRows, ...basePayload() });
    setMessage("Bulk upload completed");
    await load();
  };
  const generate = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await ep1.post("/api/v2/academic-configuration/po/generate", { ...form, ...ai, ...basePayload() });
      setGenerated(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed");
    } finally {
      setLoading(false);
    }
  };
  const saveGenerated = async () => {
    for (const item of generated) {
      await save({ ...form, pocode: item.pocode, po: item.po, id: "" });
    }
    setGenerated([]);
  };

  return <Shell title="Program Outcomes"><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Program Outcomes (PO)</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}<Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={2}><Autocomplete freeSolo options={uniqueSorted([...(options.academicyears || []), ...rows.map((row) => row.academicyear)])} value={form.academicyear || ""} onInputChange={(_, value) => setForm((p) => ({ ...p, academicyear: value || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Academic year" />} /></Grid><Grid item xs={12} md={2}><Autocomplete freeSolo options={uniqueSorted([...(options.regulations || []), ...rows.map((row) => row.regulation)])} value={form.regulation || ""} onInputChange={(_, value) => setForm((p) => ({ ...p, regulation: value || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Regulation" />} /></Grid><Grid item xs={12} md={3}><Autocomplete options={options.programs || []} getOptionLabel={(option) => `${option.program || ""} (${option.programcode || ""})`} value={(options.programs || []).find((p) => p.programcode === form.programcode) || null} onChange={(_, value) => setForm((p) => ({ ...p, program: value?.program || "", programcode: value?.programcode || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Program" />} /></Grid><Grid item xs={12} md={1.5}><TextField fullWidth size="small" label="PO code" value={form.pocode || ""} onChange={(e) => setForm((p) => ({ ...p, pocode: e.target.value }))} /></Grid><Grid item xs={12} md={3.5}><TextField fullWidth multiline minRows={2} size="small" label="PO" value={form.po || ""} onChange={(e) => setForm((p) => ({ ...p, po: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status || "Active"} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} onClick={() => save()}>{editingId ? "Update" : "Save"}</Button></Grid></Grid></Paper><Paper sx={{ p: 2, mb: 2 }}><Typography fontWeight={800} sx={{ mb: 1 }}>AI generate PO</Typography><Grid container spacing={2}><Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Provider" value={ai.provider} onChange={(e) => setAi((p) => ({ ...p, provider: e.target.value, model: modelOptions[e.target.value]?.[0] || "" }))}>{aiProviders.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><Autocomplete freeSolo options={modelOptions[ai.provider] || []} value={ai.model || ""} onInputChange={(_, value) => setAi((p) => ({ ...p, model: value || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Model" />} /></Grid><Grid item xs={12} md={5}><TextField fullWidth size="small" label="Additional prompt" value={ai.prompt || ""} onChange={(e) => setAi((p) => ({ ...p, prompt: e.target.value }))} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<AutoAwesome />} onClick={generate}>Generate</Button></Grid></Grid>{loading && <LinearProgress sx={{ mt: 2 }} />}{!!generated.length && <Box sx={{ mt: 2 }}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={800}>Generated outcomes</Typography><Button variant="outlined" onClick={saveGenerated}>Save all</Button></Stack>{generated.map((item, index) => <Card key={`${item.pocode}-${index}`} sx={{ my: 1 }}><CardContent><Typography fontWeight={800}>{item.pocode}</Typography><Typography>{item.po}</Typography></CardContent></Card>)}</Box>}</Paper><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}>{["academicyear", "regulation", "programcode", "pocode"].map((field) => <Grid item xs={12} md={2} key={field}><TextField fullWidth size="small" label={`Filter ${field}`} value={filters[field] || ""} onChange={(e) => setFilters((p) => ({ ...p, [field]: e.target.value }))} /></Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={load}>Load</Button></Grid><Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={() => exportTemplate([{ academicyear: "2026-27", regulation: "R2026", program: "MCA", programcode: "MCA", pocode: "PO1", po: "Outcome text", status: "Active" }], "Program Outcomes")}>Template</Button></Grid><Grid item xs={12} md={2}><Button component="label" fullWidth variant="outlined">Bulk upload<input hidden type="file" accept=".xlsx,.xls" onChange={bulk} /></Button></Grid><Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" disabled={!selected.length} onClick={() => deleteRows(selected)}>Bulk delete</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(row) => row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} loading={loading} autoHeight getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} columns={[{ field: "academicyear", headerName: "Academic year", width: 130 }, { field: "regulation", headerName: "Regulation", width: 130 }, { field: "program", headerName: "Program", width: 190 }, { field: "programcode", headerName: "Program code", width: 130 }, { field: "pocode", headerName: "PO code", width: 110 }, { field: "po", headerName: "PO", width: 520 }, { field: "status", headerName: "Status", width: 110 }, { field: "actions", type: "actions", width: 100, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ academicyear: row.academicyear || "", regulation: row.regulation || "", program: row.program || "", programcode: row.programcode || "", pocode: row.pocode || "", po: row.po || "", status: row.status || "Active" }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRows([row._id])} />] }]} /></Paper></Shell>;
}

export function MyProgramStudentsPage() {
  const [programs, setPrograms] = useState([]);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef(null);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/academic-configuration/my-program-students", { params: { ...basePayload(), useremail: global1.user, ...filters } });
      setPrograms(res.data?.programs || []);
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const programOptions = useMemo(() => programs.map((row) => ({ program: row.program, programcode: row.programcode })), [programs]);
  const summary = useMemo(() => ({ students: rows.length, programs: uniqueSorted(rows.map((row) => row.programcode)).length, semesters: uniqueSorted(rows.map((row) => row.semester)).length }), [rows]);
  return <Shell title="My Program students"><Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}><Box><Typography variant="h5" fontWeight={900}>My Program students</Typography><Typography variant="body2" color="text.secondary">Students are restricted to programs assigned in Programwise Access.</Typography></Box><Button startIcon={<Print />} onClick={() => printNode(printRef, "My Program students")}>Print preview</Button></Stack>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><Autocomplete options={programOptions} getOptionLabel={(option) => `${option.program || ""} (${option.programcode || ""})`} value={programOptions.find((item) => item.programcode === filters.programcode) || null} onChange={(_, value) => setFilters((p) => ({ ...p, programcode: value?.programcode || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Assigned program" />} /></Grid>{["academicyear", "regulation", "semester", "section", "student", "regno"].map((field) => <Grid item xs={12} md={1.5} key={field}><TextField fullWidth size="small" label={field} value={filters[field] || ""} onChange={(e) => setFilters((p) => ({ ...p, [field]: e.target.value }))} /></Grid>)}<Grid item xs={12} md={1.5}><Button fullWidth variant="contained" onClick={load}>Load</Button></Grid></Grid></Paper>{loading && <LinearProgress sx={{ mb: 2 }} />}<Box ref={printRef}><Grid container spacing={2} sx={{ mb: 2 }}>{[["Students", summary.students], ["Programs", summary.programs], ["Semesters", summary.semesters]].map(([label, value]) => <Grid item xs={12} md={4} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid><Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>{programs.map((program) => <Chip key={program._id} label={`${program.program} (${program.programcode})`} />)}</Stack><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(row) => row._id} loading={loading} autoHeight getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "my_program_students" } } }} columns={[{ field: "name", headerName: "Student", width: 190 }, { field: "email", headerName: "Email", width: 220 }, { field: "phone", headerName: "Phone", width: 130 }, { field: "regno", headerName: "Reg no", width: 130 }, { field: "academicyear", headerName: "Academic year", width: 130 }, { field: "regulation", headerName: "Regulation", width: 120 }, { field: "program", headerName: "Program", width: 180 }, { field: "programcode", headerName: "Program code", width: 130 }, { field: "semester", headerName: "Semester", width: 110 }, { field: "section", headerName: "Section", width: 110 }, { field: "category", headerName: "Category", width: 130 }, { field: "gender", headerName: "Gender", width: 110 }, { field: "status", headerName: "Status", width: 110 }]} /></Paper></Box></Shell>;
}
