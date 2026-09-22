import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Delete, PlayArrow, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#7c3aed", "#dc2626", "#0891b2", "#be185d", "#ca8a04"];
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const blankRule = { academicyear: "", title: "", description: "", ruletext: "", status: "Active" };
const filterFields = ["academicyear", "admissionyear", "regulation", "program", "programcode", "semester", "section", "category", "annualincome", "freeshipcardholder", "gender", "state", "city", "quota", "nationality"];
const providers = ["Gemini", "ChatGPT", "Claude", "Ollama"];
const modelOptions = {
  Gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
  ChatGPT: ["gpt-5.1", "gpt-5-mini", "gpt-4.1", "gpt-4o", "gpt-4o-mini"],
  Claude: ["claude-sonnet-4-5", "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"],
  Ollama: ["llama3.1", "llama3.2", "mistral", "qwen2.5"]
};

const fieldLabel = (field) => field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function RuleManager() {
  const [form, setForm] = useState(blankRule);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/scholarshipnew/rules", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scholarship rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  const saveRule = async () => {
    if (!form.title && !file) return setError("Enter a title or upload a file");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      Object.entries({ ...form, colid: global1.colid, user: global1.user, name: global1.name }).forEach(([key, value]) => body.append(key, value || ""));
      if (file) body.append("file", file);
      await ep1.post("/api/v2/scholarshipnew/rules", body, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(blankRule);
      setFile(null);
      setMessage("Scholarship rules saved");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save scholarship rules");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    await ep1.post("/api/v2/scholarshipnew/rules-delete", { colid: global1.colid, id });
    loadRows();
  };

  return (
    <MenuPageShell title="Scholarship Rules">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Scholarship Rules Upload</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Academic year" value={form.academicyear} onChange={(e) => setForm({ ...form, academicyear: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
            <Grid item xs={12} md={5}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={6} label="Bulk text rules" value={form.ruletext} onChange={(e) => setForm({ ...form, ruletext: e.target.value })} /></Grid>
            <Grid item xs={12} md={8}>
              <Button component="label" variant="outlined" startIcon={<UploadFile />}>
                Upload PDF / Word / Text
                <input hidden type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
              {file && <Chip sx={{ ml: 1 }} label={file.name} onDelete={() => setFile(null)} />}
            </Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="contained" startIcon={<Save />} onClick={saveRule} disabled={saving}>{saving ? "Saving..." : "Save rules"}</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ height: 520 }}>
          <DataGrid
            rows={rows}
            getRowId={(row) => row._id}
            loading={loading}
            columns={[
              { field: "academicyear", headerName: "Academic year", width: 140 },
              { field: "title", headerName: "Title", minWidth: 220, flex: 1 },
              { field: "source", headerName: "Source", width: 110 },
              { field: "status", headerName: "Status", width: 110 },
              { field: "filename", headerName: "File", minWidth: 180 },
              { field: "filelink", headerName: "Link", width: 120, renderCell: (params) => params.value ? <Link href={params.value} target="_blank" rel="noreferrer">Open</Link> : "" },
              { field: "extractedtext", headerName: "Extracted chars", width: 140, valueGetter: (params) => (params.row.extractedtext || "").length },
              { field: "actions", headerName: "Actions", width: 120, renderCell: (params) => <Button color="error" size="small" startIcon={<Delete />} onClick={() => deleteRule(params.row._id)}>Delete</Button> }
            ]}
            slots={{ toolbar: GridToolbar }}
          />
        </Paper>
      </Container>
    </MenuPageShell>
  );
}

function DynamicFilters({ options, filters, setFilters }) {
  const addFilter = () => setFilters([...filters, { field: "academicyear", operator: "equals", value: "" }]);
  const update = (index, patch) => setFilters(filters.map((filter, i) => i === index ? { ...filter, ...patch } : filter));
  return (
    <Stack spacing={1}>
      {filters.map((filter, index) => (
        <Grid container spacing={1} key={index}>
          <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => update(index, { field: e.target.value, value: "" })}>{filterFields.map((field) => <MenuItem key={field} value={field}>{fieldLabel(field)}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Operator" value={filter.operator || "equals"} onChange={(e) => update(index, { operator: e.target.value })}><MenuItem value="equals">Equals</MenuItem><MenuItem value="contains">Contains</MenuItem></TextField></Grid>
          <Grid item xs={12} md={5}>
            <Autocomplete
              freeSolo
              options={options.values?.[filter.field] || []}
              value={filter.value || ""}
              onChange={(_, value) => update(index, { value: value || "" })}
              onInputChange={(_, value) => update(index, { value })}
              renderInput={(params) => <TextField {...params} size="small" label="Value" />}
            />
          </Grid>
          <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters(filters.filter((_, i) => i !== index))}>Remove</Button></Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={addFilter}>Add dynamic filter</Button>
    </Stack>
  );
}

function GeneratePage() {
  const [options, setOptions] = useState({ values: {}, rules: [] });
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "equals", value: "" }]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [ruleids, setRuleids] = useState([]);
  const [ai, setAi] = useState({ provider: "Gemini", model: "gemini-2.5-flash" });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/scholarshipnew/options", { params: { colid: global1.colid } });
    setOptions(res.data || { values: {}, rules: [] });
  };
  useEffect(() => { loadOptions(); }, []);

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/scholarshipnew/students", { colid: global1.colid, filters });
      setStudents(res.data?.data || []);
      setSelected((res.data?.data || []).map((row) => row.regno));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/scholarshipnew/generate", {
        colid: global1.colid,
        filters,
        selectedRegnos: selected,
        ruleids,
        provider: ai.provider,
        model: ai.model,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Generated ${res.data?.created || 0} scholarship eligibility rows for ${res.data?.students || 0} students. Previous rows for these students were overwritten.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate scholarship eligibility");
    } finally {
      setGenerating(false);
    }
  };

  const studentRows = students.map((row) => ({ id: row.regno, ...row }));
  const selectedRuleObjects = (options.rules || []).filter((rule) => ruleids.includes(rule._id));

  return (
    <MenuPageShell title="AI Scholarship Eligibility">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>AI Scholarship Eligibility Generation</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>Student filters</Typography>
          <DynamicFilters options={options} filters={filters} setFilters={setFilters} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Autocomplete multiple options={(options.rules || []).filter((rule) => rule.status === "Active")} value={selectedRuleObjects} onChange={(_, value) => setRuleids(value.map((row) => row._id))} getOptionLabel={(option) => `${option.title}${option.academicyear ? ` (${option.academicyear})` : ""}`} renderInput={(params) => <TextField {...params} label="Scholarship rule sets" />} sx={{ flex: 1 }} />
            <TextField select label="AI provider" value={ai.provider} onChange={(e) => setAi({ provider: e.target.value, model: modelOptions[e.target.value]?.[0] || "" })} sx={{ minWidth: 180 }}>{providers.map((provider) => <MenuItem key={provider} value={provider}>{provider}</MenuItem>)}</TextField>
            <Autocomplete freeSolo options={modelOptions[ai.provider] || []} value={ai.model} onInputChange={(_, value) => setAi((prev) => ({ ...prev, model: value }))} onChange={(_, value) => setAi((prev) => ({ ...prev, model: value || "" }))} renderInput={(params) => <TextField {...params} label="Model" />} sx={{ minWidth: 240 }} />
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadStudents} disabled={loading}>{loading ? "Loading..." : "Load students"}</Button>
            <Button variant="contained" startIcon={<PlayArrow />} onClick={generate} disabled={generating || !selected.length || !ruleids.length}>{generating ? "Generating..." : "Generate"}</Button>
          </Stack>
        </Paper>
        <Paper sx={{ height: 560 }}>
          <DataGrid
            rows={studentRows}
            columns={[
              { field: "name", headerName: "Student", minWidth: 210, flex: 1 },
              { field: "regno", headerName: "Reg no", width: 140 },
              { field: "academicyear", headerName: "Academic year", width: 140 },
              { field: "program", headerName: "Program", minWidth: 180 },
              { field: "programcode", headerName: "Program code", width: 140 },
              { field: "semester", headerName: "Semester", width: 110 },
              { field: "category", headerName: "Category", width: 130 },
              { field: "annualincome", headerName: "Annual income", width: 140 },
              { field: "freeshipcardholder", headerName: "Freeship card", width: 140 },
              { field: "gender", headerName: "Gender", width: 110 }
            ]}
            checkboxSelection
            rowSelectionModel={selected}
            onRowSelectionModelChange={(model) => setSelected(Array.from(model?.ids || model || []))}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
          />
        </Paper>
      </Container>
    </MenuPageShell>
  );
}

function SummaryCards({ totals = {} }) {
  const cards = [
    ["Students", totals.students || 0, "#2563eb"],
    ["Eligible rows", totals.scholarships || 0, "#16a34a"],
    ["Scholarship types", totals.scholarshipTypes || 0, "#7c3aed"],
    ["Total possible amount", money(totals.totalAmount || 0), "#f97316"]
  ];
  return <Grid container spacing={2} sx={{ mb: 2 }}>{cards.map(([label, value, color]) => <Grid item xs={12} md={3} key={label}><Card sx={{ borderLeft: `5px solid ${color}` }}><CardContent><Typography variant="overline">{label}</Typography><Typography variant="h5" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>;
}

function ReportPage() {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState({ data: [], totals: {}, charts: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { colid: global1.colid, ...filters };
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);
      const res = await ep1.get("/api/v2/scholarshipnew/report", { params });
      setData(res.data || { data: [], totals: {}, charts: {} });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const rows = (data.data || []).map((row) => ({ id: row._id, ...row }));
  return (
    <MenuPageShell title="AI Scholarship Report">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <style>{`@media print{.no-print{display:none!important}.MuiDataGrid-toolbarContainer{display:none!important}}`}</style>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" sx={{ mb: 2 }} spacing={2}>
          <Box><Typography variant="h5" fontWeight={900}>AI Scholarship Report</Typography><Typography color="text.secondary">Generated applicable scholarships by student, category, program and type.</Typography></Box>
          <Button className="no-print" startIcon={<Print />} variant="outlined" onClick={() => window.print()}>Print preview</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {["academicyear", "programcode", "semester", "category", "gender", "scholarshiptype", "scholarshipname"].map((field) => <Grid item xs={12} md={field === "scholarshipname" ? 3 : 1.5} key={field}><TextField fullWidth size="small" label={fieldLabel(field)} value={filters[field] || ""} onChange={(e) => setFilters({ ...filters, [field]: e.target.value })} /></Grid>)}
            <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" onClick={load} disabled={loading}>{loading ? "Loading..." : "Load"}</Button></Grid>
          </Grid>
        </Paper>
        <SummaryCards totals={data.totals} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={7}><Paper sx={{ p: 2, height: 360 }}><Typography fontWeight={800}>Scholarship-wise</Typography><ResponsiveContainer width="100%" height="88%"><BarChart data={(data.charts?.byScholarship || []).slice(0, 12)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></Paper></Grid>
          <Grid item xs={12} md={5}><Paper sx={{ p: 2, height: 360 }}><Typography fontWeight={800}>Scholarship type</Typography><ResponsiveContainer width="100%" height="88%"><PieChart><Pie data={data.charts?.byType || []} dataKey="count" nameKey="name" outerRadius={105} label>{(data.charts?.byType || []).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></Paper></Grid>
        </Grid>
        <Paper sx={{ height: 620 }}>
          <DataGrid
            rows={rows}
            loading={loading}
            columns={[
              { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
              { field: "regno", headerName: "Reg no", width: 130 },
              { field: "program", headerName: "Program", minWidth: 180 },
              { field: "programcode", headerName: "Program code", width: 130 },
              { field: "category", headerName: "Category", width: 120 },
              { field: "scholarshipname", headerName: "Scholarship", minWidth: 240, flex: 1 },
              { field: "scholarshiptype", headerName: "Type", width: 130 },
              { field: "amount", headerName: "Amount", width: 130, valueFormatter: ({ value }) => money(value) },
              { field: "matchscore", headerName: "Match %", width: 110 },
              { field: "criteria", headerName: "Criteria", minWidth: 260, flex: 1 },
              { field: "reason", headerName: "Reason", minWidth: 260, flex: 1 },
              { field: "applicationlink", headerName: "Link", width: 130, renderCell: (params) => params.value ? <Link href={params.value} target="_blank" rel="noreferrer">Open</Link> : "" }
            ]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "ai_scholarship_report" } } }}
          />
        </Paper>
      </Container>
    </MenuPageShell>
  );
}

export const ScholarshipNewRulesPage = RuleManager;
export const ScholarshipNewGeneratePage = GeneratePage;
export const ScholarshipNewReportPage = ReportPage;
