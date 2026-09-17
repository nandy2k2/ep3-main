import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const allSections = ["event_details", "objectives", "overview", "activities", "outcomes", "feedback", "conclusion"];
const requestFields = [
  "event_title",
  "event_type",
  "event_date",
  "venue",
  "organizer",
  "program",
  "department",
  "audience",
  "participants_count",
  "duration",
  "chief_guest",
  "resource_persons",
  "objectives",
  "agenda",
  "highlights",
  "outcomes",
  "feedback_summary",
  "required_sections",
  "additional_requirements",
  "tone"
];

const blankRequest = {
  event_title: "",
  event_type: "",
  event_date: "",
  venue: "",
  organizer: "",
  program: "",
  department: "",
  audience: "",
  participants_count: "",
  duration: "",
  chief_guest: "",
  resource_persons: "",
  objectives: "",
  agenda: "",
  highlights: "",
  outcomes: "",
  feedback_summary: "",
  required_sections: allSections.join("; "),
  additional_requirements: "",
  tone: "formal"
};

const cardColors = ["#0f766e", "#7c3aed", "#be123c", "#2563eb"];
const trainingPassword = "kumropatash";
const eventReportEndpoints = {
  train: "/api/v2/event-report-rag/train",
  batches: "/api/v2/event-report-rag/batches",
  deleteBatches: "/api/v2/event-report-rag/batches/delete",
  generate: "/api/v2/event-report-rag/generate",
  generated: "/api/v2/event-report-rag/generated",
  deleteGenerated: "/api/v2/event-report-rag/generated/delete",
  downloadHtml: "/api/v2/event-report-rag/download-html"
};

const apiError = (err, fallback) => err.response?.data?.message || err.message || fallback;

const loadDefaultEpaathsalaAiServer = async () => {
  const res = await ep1.get("/api/v2/epaathsala-ai", { params: { colid: global1.colid, active: "Yes" } });
  const rows = res.data?.data || [];
  const selected = rows.find((row) => row.default === "Yes" && row.active === "Yes") || rows.find((row) => row.active === "Yes") || rows[0];
  if (!selected?.server) throw new Error("Configure an active Epaathsala AI server in Settings > Epaathsala AI.");
  return selected.server;
};

const downloadWorkbook = (sheetName, row, filename) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([row]), sheetName);
  XLSX.writeFile(wb, filename);
};

const downloadText = (content, filename, type = "text/plain") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const RequestTextField = React.memo(function RequestTextField({ field, value, onCommit }) {
  const [localValue, setLocalValue] = useState(value || "");
  const multiline = ["objectives", "agenda", "highlights", "outcomes", "feedback_summary", "additional_requirements"].includes(field);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  return (
    <TextField
      fullWidth
      size="small"
      type={field === "event_date" ? "date" : "text"}
      label={field.replace(/_/g, " ")}
      value={localValue}
      multiline={multiline}
      minRows={["objectives", "agenda"].includes(field) ? 3 : 1}
      InputLabelProps={field === "event_date" ? { shrink: true } : undefined}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onCommit(field, localValue)}
    />
  );
});

const metricCard = (title, value, color, subtitle) => (
  <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, bgcolor: "#fff" }}>
    <CardContent>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>{title}</Typography>
      <Typography variant="h4" fontWeight={950} sx={{ color }}>{value}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </CardContent>
  </Card>
);

export function TrainEventReportRagPage() {
  const fileRef = useRef(null);
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem("eventReportRagTrainingAuth") === "yes");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("append");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [aiServer, setAiServer] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ensureAiServer = async () => {
    if (aiServer) return aiServer;
    setServerLoading(true);
    try {
      const server = await loadDefaultEpaathsalaAiServer();
      setAiServer(server);
      return server;
    } finally {
      setServerLoading(false);
    }
  };

  const loadBatches = async (serverOverride) => {
    try {
      const server = serverOverride || await ensureAiServer();
      const res = await ep1.get(eventReportEndpoints.batches, { params: { colid: global1.colid, ragserver: server } });
      setBatches(res.data?.data || []);
    } catch (err) {
      setServerLoading(false);
      setError(apiError(err, "Unable to load training history"));
    }
  };

  useEffect(() => {
    if (authorized) loadBatches();
  }, [authorized]);

  const unlockTrainingPage = () => {
    if (password === trainingPassword) {
      sessionStorage.setItem("eventReportRagTrainingAuth", "yes");
      setAuthorized(true);
      setPassword("");
      setPasswordError("");
      return;
    }
    setPasswordError("Invalid password.");
  };

  const train = async () => {
    if (!file) {
      setError("Select the Event_Reports Excel file first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setSummary(null);
      setProgress(8);
      setSteps([{ label: "Uploading workbook", value: 8 }]);
      const server = await ensureAiServer();
      const timer = setInterval(() => setProgress((value) => Math.min(92, value + 7)), 350);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      formData.append("colid", global1.colid);
      formData.append("name", global1.name || "");
      formData.append("user", global1.user || "");
      formData.append("ragserver", server);
      const res = await ep1.post(eventReportEndpoints.train, formData, { headers: { "Content-Type": "multipart/form-data" } });
      clearInterval(timer);
      setProgress(100);
      setSteps(res.data?.progress || [{ label: "Training complete", value: 100 }]);
      setSummary(res.data?.summary || null);
      setMessage(res.data?.skipped ? res.data?.message : "Event report RAG training completed.");
      loadBatches();
    } catch (err) {
      setError(apiError(err, "Training failed"));
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => batches.slice(0, 8).reverse().map((item, index) => ({
    name: item.batchid || `Batch ${index + 1}`,
    reports: item.total_reports || 0,
    vocabulary: item.vocabulary_size || 0
  })), [batches]);

  const deleteBatches = async () => {
    if (!selectedBatches.length) return;
    try {
      setLoading(true);
      setError("");
      const server = await ensureAiServer();
      await ep1.post(eventReportEndpoints.deleteBatches, { colid: global1.colid, ragserver: server, ids: selectedBatches });
      setMessage("Selected training batches deleted.");
      setSelectedBatches([]);
      loadBatches();
    } catch (err) {
      setError(apiError(err, "Unable to delete selected training batches"));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "batchid", headerName: "Batch", minWidth: 220, flex: 1 },
    { field: "filename", headerName: "File", minWidth: 180, flex: 1 },
    { field: "mode", headerName: "Mode", width: 100 },
    { field: "new_reports", headerName: "New reports", width: 130 },
    { field: "total_reports", headerName: "Total reports", width: 130 },
    { field: "vocabulary_size", headerName: "Vocabulary", width: 130 },
    { field: "createdAt", headerName: "Trained on", minWidth: 190, valueGetter: (params) => params.row?.createdAt ? new Date(params.row.createdAt).toLocaleString() : "" },
    { field: "user", headerName: "User", minWidth: 180 }
  ];

  if (!authorized) {
    return (
      <MenuPageShell title="Train event report RAG">
        <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Paper elevation={0} sx={{ p: 3, width: "100%", maxWidth: 460, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={950}>Protected training page</Typography>
                <Typography variant="body2" color="text.secondary">Enter the password to load event report RAG training.</Typography>
              </Box>
              {passwordError && <Alert severity="error" onClose={() => setPasswordError("")}>{passwordError}</Alert>}
              <TextField
                autoFocus
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") unlockTrainingPage();
                }}
              />
              <Button variant="contained" onClick={unlockTrainingPage} disabled={!password.trim()}>
                Unlock page
              </Button>
            </Stack>
          </Paper>
        </Box>
      </MenuPageShell>
    );
  }

  return (
    <MenuPageShell title="Train event report RAG">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={950}>Train event report RAG</Typography>
            <Typography color="text.secondary">Upload an Excel workbook with sheet name Event_Reports. Training data is stored by institution and reused for grounded event report generation.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Epaathsala AI server: {serverLoading ? "Loading..." : aiServer || "Not loaded"}
            </Typography>
          </Paper>
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Button fullWidth variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileRef.current?.click()} disabled={loading}>
                  {file ? file.name : "Select training Excel"}
                </Button>
                <input ref={fileRef} type="file" hidden accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Mode" value={mode} onChange={(e) => setMode(e.target.value)} disabled={loading}>
                  <MenuItem value="append">Append</MenuItem>
                  <MenuItem value="reset">Reset</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="contained" onClick={train} disabled={loading || serverLoading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
                  {loading ? "Training..." : "Train model"}
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="outlined" onClick={() => downloadWorkbook("Event_Reports", {
                  report_id: "ER001",
                  event_title: "Python Programming Workshop",
                  event_type: "Workshop",
                  program: "B.Tech",
                  department: "Computer Engineering",
                  audience: "Second-year students",
                  tone: "formal",
                  objectives: "Introduce Python fundamentals; develop problem-solving skills",
                  summary: "Approved event overview",
                  activities: "Opening; demonstrations; practice",
                  outcomes: "Students completed practice tasks",
                  feedback: "Participants requested an advanced session",
                  conclusion: "The workshop completed planned modules"
                }, "event_report_training_template.xlsx")}>Download template</Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth color="error" variant="outlined" disabled={!selectedBatches.length || loading} onClick={deleteBatches}>Bulk delete selected</Button>
              </Grid>
              <Grid item xs={12}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 6 }} />
              </Grid>
              {steps.map((step) => (
                <Grid item xs={12} md={3} key={step.label}>
                  <Chip color={step.value === 100 ? "success" : "primary"} label={`${step.label}: ${step.value}%`} sx={{ width: "100%", justifyContent: "flex-start" }} />
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>{metricCard("Total trained reports", summary?.total_reports ?? batches[0]?.total_reports ?? 0, cardColors[0])}</Grid>
            <Grid item xs={12} md={3}>{metricCard("Last upload reports", summary?.new_reports ?? batches[0]?.new_reports ?? 0, cardColors[1])}</Grid>
            <Grid item xs={12} md={3}>{metricCard("Vocabulary size", summary?.vocabulary_size ?? batches[0]?.vocabulary_size ?? 0, cardColors[2])}</Grid>
            <Grid item xs={12} md={3}>{metricCard("Training batches", summary?.total_batches ?? batches.length, cardColors[3])}</Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 320 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Training growth</Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reports" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="vocabulary" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <DataGrid
              rows={batches}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              checkboxSelection
              rowSelectionModel={selectedBatches}
              onRowSelectionModelChange={(model) => setSelectedBatches(model)}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "event_report_rag_training" } } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function TrainedEventReportsPage() {
  const fileRef = useRef(null);
  const [form, setForm] = useState(blankRequest);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [aiServer, setAiServer] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestJson = useMemo(() => ({
    ...form,
    participants_count: Number(form.participants_count || 0),
    resource_persons: form.resource_persons.split(/[;\n]/).map((item) => item.trim()).filter(Boolean),
    objectives: form.objectives.split(/[;\n]/).map((item) => item.trim()).filter(Boolean),
    agenda: form.agenda.split(/[;\n]/).map((item) => item.trim()).filter(Boolean),
    highlights: form.highlights.split(/[;\n]/).map((item) => item.trim()).filter(Boolean),
    outcomes: form.outcomes.split(/[;\n]/).map((item) => item.trim()).filter(Boolean),
    required_sections: form.required_sections.split(/[;\n]/).map((item) => item.trim()).filter(Boolean)
  }), [form]);

  const commitRequestField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const ensureAiServer = async () => {
    if (aiServer) return aiServer;
    setServerLoading(true);
    try {
      const server = await loadDefaultEpaathsalaAiServer();
      setAiServer(server);
      return server;
    } finally {
      setServerLoading(false);
    }
  };

  useEffect(() => {
    ensureAiServer().catch((err) => {
      setServerLoading(false);
      setError(apiError(err, "Unable to load Epaathsala AI server"));
    });
  }, []);

  const loadGenerated = async () => {
    try {
      setLoading(true);
      setError("");
      const server = await ensureAiServer();
      const res = await ep1.get(eventReportEndpoints.generated, { params: { colid: global1.colid, ragserver: server } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(apiError(err, "Unable to load generated reports"));
    } finally {
      setLoading(false);
    }
  };

  const generate = async (fromExcel = false) => {
    if (fromExcel && !file) {
      setError("Select the Event_Requests Excel file first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setProgress(12);
      const server = await ensureAiServer();
      const timer = setInterval(() => setProgress((value) => Math.min(94, value + 8)), 300);
      let res;
      if (fromExcel) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("colid", global1.colid);
        formData.append("name", global1.name || "");
        formData.append("user", global1.user || "");
        formData.append("ragserver", server);
        res = await ep1.post(eventReportEndpoints.generate, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        res = await ep1.post(eventReportEndpoints.generate, { colid: global1.colid, ragserver: server, name: global1.name, user: global1.user, request: requestJson });
      }
      clearInterval(timer);
      setProgress(100);
      const generated = res.data?.data || [];
      setRows((prev) => [...generated, ...prev]);
      setSelectedRows(generated.map((item) => item._id));
      setPreview(generated[0] || null);
      setMessage(`Generated ${generated.length} event report(s).${res.data?.errors?.length ? ` Failed rows: ${res.data.errors.length}` : ""}`);
    } catch (err) {
      setError(apiError(err, "Report generation failed"));
    } finally {
      setLoading(false);
    }
  };

  const openReport = (row) => {
    const html = `<!doctype html><html><head><title>${row.event_title || "Event report"}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{text-align:center;font-size:22px}h2{font-size:16px;border-bottom:1px solid #111;padding-bottom:4px}p{line-height:1.45}@media print{body{margin:14mm}button{display:none}}</style></head><body><button onclick="window.print()">Print</button>${row.report_html || ""}</body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const downloadSelected = () => {
    const ids = selectedRows.join(",");
    if (!ids) {
      setError("Select at least one generated report.");
      return;
    }
    if (!aiServer) {
      setError("Epaathsala AI server is not loaded.");
      return;
    }
    window.open(`${ep1.defaults.baseURL}${eventReportEndpoints.downloadHtml}?colid=${global1.colid}&ragserver=${encodeURIComponent(aiServer)}&ids=${encodeURIComponent(ids)}`, "_blank");
  };

  const exportJson = () => {
    const selected = rows.filter((row) => selectedRows.includes(row._id));
    downloadText(JSON.stringify(selected.length ? selected : rows, null, 2), "event_reports.json", "application/json");
  };

  const deleteGenerated = async () => {
    if (!selectedRows.length) {
      setError("Select at least one generated report.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const server = await ensureAiServer();
      await ep1.post(eventReportEndpoints.deleteGenerated, { colid: global1.colid, ragserver: server, ids: selectedRows });
      setRows((prev) => prev.filter((row) => !selectedRows.includes(row._id)));
      setSelectedRows([]);
      setPreview(null);
      setMessage("Selected generated reports deleted.");
    } catch (err) {
      setError(apiError(err, "Unable to delete generated reports"));
    } finally {
      setLoading(false);
    }
  };

  const typeChart = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => map.set(row.event_type || "Not specified", (map.get(row.event_type || "Not specified") || 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  const columns = [
    { field: "event_title", headerName: "Event title", minWidth: 240, flex: 1 },
    { field: "event_type", headerName: "Type", minWidth: 150 },
    { field: "event_date", headerName: "Date", minWidth: 120 },
    { field: "program", headerName: "Program", minWidth: 150 },
    { field: "department", headerName: "Department", minWidth: 180 },
    { field: "participants_count", headerName: "Participants", minWidth: 120 },
    { field: "status", headerName: "Status", minWidth: 120 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<VisibilityIcon />} label="Preview" onClick={() => { setPreview(row); openReport(row); }} />
      ]
    }
  ];

  return (
    <MenuPageShell title="Trained event reports">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={950}>Trained event reports</Typography>
            <Typography color="text.secondary">Upload Event_Requests Excel or enter a single event. The system converts facts to JSON and generates grounded reports from trained history.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Epaathsala AI server: {serverLoading ? "Loading..." : aiServer || "Not loaded"}
            </Typography>
          </Paper>
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>{metricCard("Generated reports", rows.length, cardColors[0])}</Grid>
            <Grid item xs={12} md={3}>{metricCard("Selected", selectedRows.length, cardColors[1])}</Grid>
            <Grid item xs={12} md={3}>{metricCard("Event types", typeChart.length, cardColors[2])}</Grid>
            <Grid item xs={12} md={3}>{metricCard("Current progress", `${progress}%`, cardColors[3])}</Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              {requestFields.map((field) => (
                <Grid item xs={12} md={["objectives", "agenda", "highlights", "outcomes", "feedback_summary", "additional_requirements"].includes(field) ? 6 : 3} key={field}>
                  <RequestTextField field={field} value={form[field] || ""} onCommit={commitRequestField} />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" disabled={loading || serverLoading} onClick={() => generate(false)} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>{loading ? "Generating..." : "Generate from form"}</Button>
                  <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={loading || serverLoading} onClick={() => fileRef.current?.click()}>{file ? file.name : "Select Event_Requests Excel"}</Button>
                  <Button variant="contained" color="secondary" disabled={loading || serverLoading || !file} onClick={() => generate(true)}>Generate from Excel</Button>
                  <Button variant="outlined" onClick={() => downloadWorkbook("Event_Requests", blankRequest, "event_report_requests_template.xlsx")}>Download request template</Button>
                  <Button variant="outlined" disabled={serverLoading} onClick={loadGenerated}>Load generated history</Button>
                  <Button variant="outlined" disabled={serverLoading} startIcon={<DownloadIcon />} onClick={downloadSelected}>Download selected HTML</Button>
                  <Button variant="outlined" onClick={exportJson}>Export JSON</Button>
                  <Button variant="outlined" color="error" disabled={!selectedRows.length || loading} onClick={deleteGenerated}>Bulk delete</Button>
                  <input ref={fileRef} type="file" hidden accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Stack>
              </Grid>
              <Grid item xs={12}><LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 6 }} /></Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedRows}
                  onRowSelectionModelChange={(model) => setSelectedRows(model)}
                  loading={loading}
                  autoHeight
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "trained_event_reports" } } }}
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35, alignItems: "flex-start", py: 1 } }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: 340 }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Event type split</Typography>
                <ResponsiveContainer width="100%" height="88%">
                  <PieChart>
                    <Pie data={typeChart} dataKey="value" nameKey="name" outerRadius={95} label>
                      {typeChart.map((_, index) => <Cell key={index} fill={cardColors[index % cardColors.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, maxHeight: 420, overflow: "auto" }}>
                <Typography variant="h6" fontWeight={900}>Converted JSON</Typography>
                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: 12, bgcolor: "#111827", color: "#f9fafb", p: 2, borderRadius: 2 }}>{JSON.stringify(requestJson, null, 2)}</Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, maxHeight: 420, overflow: "auto" }}>
                <Typography variant="h6" fontWeight={900}>Latest report preview</Typography>
                {preview ? <Box dangerouslySetInnerHTML={{ __html: preview.report_html || "" }} sx={{ "& h1": { textAlign: "center", fontSize: 22 }, "& h2": { fontSize: 16, borderBottom: "1px solid #111" }, "& p": { lineHeight: 1.45 } }} /> : <Typography color="text.secondary">Generate or select a report to preview it here.</Typography>}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
