import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Add, AutoFixHigh, CloudUpload, Print, Refresh, Save } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const api = "/api/v2/skill-development-zone";
const examBlank = { zone: "Practice", category: "", examname: "", examcode: "", durationminutes: 60, passpercentage: 80, instructions: "", status: "Published", sections: [] };
const sectionBlank = { sectionname: "Section 1", sectiontype: "MCQ", instructions: "", order: 1, questions: [] };
const questionBlank = { questiontext: "", questiontype: "MCQ", marks: 1, options: [{ optiontext: "", iscorrect: true }, { optiontext: "", iscorrect: false }], answerkey: "", explanation: "", order: 1 };
const projectBlank = { category: "", projecttitle: "", description: "", difficulty: "Medium", status: "Published", steps: [] };
const stepBlank = { steptitle: "", description: "", task: "", diagramlink: "", imagelink: "", maxmarks: 10, order: 1 };
const aiBlank = { provider: "gemini", geminiModel: "gemini-2.5-flash", ollamaConfigId: "", count: 5, questiontype: "MCQ", difficulty: "Medium", prompt: "" };
const categories = ["Technical aptitude", "Programming", "Data analysis", "AI and ML", "Web development", "Cybersecurity", "Soft skills", "Communication", "Interview preparation", "Entrepreneurship", "Project management", "Research skills"];
const questionTypes = ["MCQ", "Descriptive", "Fill in the blanks", "Match columns", "Table"];
const kahanLogo = "https://campus.technology/images/logo.png";
const currentEmail = () => global1.email || global1.user || "";
const currentName = () => global1.name || global1.username || global1.student || global1.user || "";
const rowsOf = (rows = []) => rows.map((row) => ({ ...row, id: row._id }));
const fmt = (value) => value ? new Date(value).toLocaleString() : "";
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[match]));
const pct = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 ? 2 : 0)}%`;
const ymd = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
};
const dateChipRange = (kind) => {
  const start = new Date();
  const end = new Date();
  if (kind === "tomorrow") {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
  }
  if (kind === "week") end.setDate(end.getDate() + 6);
  return { fromdate: ymd(start), todate: ymd(end) };
};
const formatSeconds = (value) => {
  const safe = Math.max(0, Number(value) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h ? `${String(h).padStart(2, "0")}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
const answered = (answer) => Boolean(answer?.selectedoptionid || answer?.selectedoptiontext || String(answer?.answertext || "").trim());
const deviceId = () => {
  const key = "skillZoneDeviceId";
  let value = localStorage.getItem(key);
  if (!value) {
    value = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, value);
  }
  return value;
};

const loadCashfreeScript = () => new Promise((resolve, reject) => {
  if (window.Cashfree) return resolve();
  const existing = document.querySelector("script[data-cashfree-sdk='v3']");
  if (existing) {
    existing.addEventListener("load", resolve);
    existing.addEventListener("error", reject);
    return;
  }
  const script = document.createElement("script");
  script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
  script.async = true;
  script.dataset.cashfreeSdk = "v3";
  script.onload = resolve;
  script.onerror = () => reject(new Error("Unable to load Cashfree checkout script"));
  document.body.appendChild(script);
});

function PageAlert({ message, error }) {
  return (
    <>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    </>
  );
}

function CategoryField({ value, onChange, options = categories, label = "Category" }) {
  const allOptions = [...new Set([...(options || []), ...categories].filter(Boolean))];
  const palette = ["primary", "secondary", "success", "warning", "info"];
  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Autocomplete
        freeSolo
        sx={{ minWidth: { xs: "100%", sm: 340 }, flex: 1 }}
        options={allOptions}
        value={value || ""}
        onInputChange={(_, next) => onChange(next || "")}
        onChange={(_, next) => onChange(next || "")}
        renderInput={(params) => <TextField {...params} label={label} fullWidth />}
      />
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {allOptions.map((category, index) => (
          <Chip
            key={category}
            clickable
            color={value === category ? palette[index % palette.length] : "default"}
            variant={value === category ? "filled" : "outlined"}
            label={category}
            onClick={() => onChange(category)}
            sx={{ fontWeight: 800 }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function CategoryMultiFilter({ value = [], onChange, options = categories, label = "Categories", helper = "" }) {
  const allOptions = [...new Set([...(options || []), ...categories].filter(Boolean))];
  const palette = ["primary", "secondary", "success", "warning", "info"];
  const toggle = (category) => {
    const exists = value.includes(category);
    onChange(exists ? value.filter((item) => item !== category) : [...value, category]);
  };
  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Autocomplete
        multiple
        freeSolo
        options={allOptions}
        value={value}
        onChange={(_, next) => onChange([...new Set((next || []).map((item) => String(item || "").trim()).filter(Boolean))])}
        renderInput={(params) => <TextField {...params} label={label} helperText={helper} fullWidth />}
        sx={{ minWidth: { xs: "100%", md: 460 }, flex: 1 }}
      />
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {allOptions.map((category, index) => {
          const selected = value.includes(category);
          return (
            <Chip
              key={category}
              clickable
              color={selected ? palette[index % palette.length] : "default"}
              variant={selected ? "filled" : "outlined"}
              label={category}
              onClick={() => toggle(category)}
              sx={{ fontWeight: 800 }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

function AwsUploadButton({ onUploaded, folder = "skill-development", label = "Upload through AWS" }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setProgress(1);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("colid", global1.colid);
      data.append("folder", folder);
      data.append("description", file.name);
      const res = await ep1.post("/api/v2/aws-file-library/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => event.total && setProgress(Math.round((event.loaded * 100) / event.total))
      });
      onUploaded?.({ url: res.data?.url || "", filename: res.data?.data?.filename || file.name });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  return (
    <Stack spacing={0.5}>
      <Button component="label" variant="outlined" startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}>
        {uploading ? "Uploading..." : label}
        <input hidden type="file" onChange={(event) => upload(event.target.files?.[0])} />
      </Button>
      {uploading && <LinearProgress variant="determinate" value={progress} />}
    </Stack>
  );
}

function QuestionEditor({ exam, setExam, selectedSection, setSelectedSection, options }) {
  const sections = exam.sections || [];
  const section = sections[selectedSection] || null;
  const updateSection = (patch) => setExam((prev) => ({ ...prev, sections: (prev.sections || []).map((item, index) => index === selectedSection ? { ...item, ...patch } : item) }));
  const addSection = () => setExam((prev) => ({ ...prev, sections: [...(prev.sections || []), { ...sectionBlank, sectionname: `Section ${(prev.sections || []).length + 1}`, order: (prev.sections || []).length + 1 }] }));
  const removeSection = () => setExam((prev) => ({ ...prev, sections: (prev.sections || []).filter((_, index) => index !== selectedSection) }));
  const updateQuestion = (qIndex, patch) => updateSection({ questions: (section?.questions || []).map((item, index) => index === qIndex ? { ...item, ...patch } : item) });
  const addQuestion = () => updateSection({ questions: [...(section?.questions || []), { ...questionBlank, order: (section?.questions || []).length + 1 }] });
  const removeQuestion = (qIndex) => updateSection({ questions: (section?.questions || []).filter((_, index) => index !== qIndex) });
  const addGenerated = (questions) => updateSection({ questions: [...(section?.questions || []), ...(questions || []).map((q, index) => ({ ...q, order: (section?.questions || []).length + index + 1 }))] });

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<Add />} onClick={addSection}>Add section</Button>
        <Autocomplete
          options={sections.map((s, index) => ({ ...s, index }))}
          value={sections[selectedSection] ? { ...sections[selectedSection], index: selectedSection } : null}
          getOptionLabel={(item) => item.sectionname || `Section ${item.index + 1}`}
          onChange={(_, next) => setSelectedSection(next?.index || 0)}
          sx={{ minWidth: 240 }}
          renderInput={(params) => <TextField {...params} label="Section" size="small" />}
        />
        <Button color="error" disabled={!section} onClick={removeSection}>Delete section</Button>
      </Stack>
      {section ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><TextField fullWidth label="Section name" value={section.sectionname || ""} onChange={(e) => updateSection({ sectionname: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField select fullWidth label="Section type" value={section.sectiontype || "MCQ"} onChange={(e) => updateSection({ sectiontype: e.target.value })}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={4}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={addQuestion}>Add question</Button></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Instructions" value={section.instructions || ""} onChange={(e) => updateSection({ instructions: e.target.value })} /></Grid>
          <Grid item xs={12}><AiQuestionGenerator exam={exam} section={section} onGenerated={addGenerated} options={options} /></Grid>
          {(section.questions || []).map((question, qIndex) => (
            <Grid item xs={12} key={qIndex}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight={900}>Question {qIndex + 1}</Typography>
                  <Chip size="small" label={question.questiontype || "MCQ"} />
                  <Box sx={{ flex: 1 }} />
                  <Button color="error" size="small" onClick={() => removeQuestion(qIndex)}>Remove</Button>
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={8}><TextField fullWidth multiline minRows={3} label="Question" value={question.questiontext || ""} onChange={(e) => updateQuestion(qIndex, { questiontext: e.target.value })} /></Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Type" value={question.questiontype || "MCQ"} onChange={(e) => updateQuestion(qIndex, { questiontype: e.target.value })}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Marks" value={question.marks || 1} onChange={(e) => updateQuestion(qIndex, { marks: Number(e.target.value) })} /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Answer key / explanation" value={question.answerkey || ""} onChange={(e) => updateQuestion(qIndex, { answerkey: e.target.value })} /></Grid>
                  {["MCQ", "Fill in the blanks"].includes(question.questiontype || "MCQ") && (
                    <Grid item xs={12}>
                      <Stack spacing={1}>
                        {(question.options || []).map((option, oIndex) => (
                          <Stack direction="row" spacing={1} key={oIndex} alignItems="center">
                            <Radio checked={Boolean(option.iscorrect)} onChange={() => updateQuestion(qIndex, { options: (question.options || []).map((opt, idx) => ({ ...opt, iscorrect: idx === oIndex })) })} />
                            <TextField fullWidth size="small" label={`Option ${oIndex + 1}`} value={option.optiontext || ""} onChange={(e) => updateQuestion(qIndex, { options: (question.options || []).map((opt, idx) => idx === oIndex ? { ...opt, optiontext: e.target.value } : opt) })} />
                            <Button color="error" onClick={() => updateQuestion(qIndex, { options: (question.options || []).filter((_, idx) => idx !== oIndex) })}>Remove</Button>
                          </Stack>
                        ))}
                        <Button onClick={() => updateQuestion(qIndex, { options: [...(question.options || []), { optiontext: "", iscorrect: false }] })}>Add option</Button>
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : <Alert severity="info">Add a section to start adding questions.</Alert>}
    </Paper>
  );
}

function AiQuestionGenerator({ exam, section, onGenerated, options }) {
  const [form, setForm] = useState(aiBlank);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const generate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.post(`${api}/exams/generate-questions`, { ...form, zone: exam.zone, category: exam.category, colid: global1.colid });
      onGenerated(res.data?.data || []);
      setMessage(`${res.data?.data?.length || 0} question(s) generated for ${section.sectionname}.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to generate questions.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fafc" }}>
      <Typography fontWeight={900} sx={{ mb: 1 }}>Generate questions with AI</Typography>
      {message && <Alert severity={message.includes("Unable") ? "error" : "success"} sx={{ mb: 1 }}>{message}</Alert>}
      <Grid container spacing={1}>
        <Grid item xs={12} md={2}><TextField select size="small" fullWidth label="Provider" value={form.provider} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="gemini">Gemini</MenuItem><MenuItem value="ollama">Ollama</MenuItem></TextField></Grid>
        {form.provider === "gemini" ? <Grid item xs={12} md={3}><TextField select size="small" fullWidth label="Gemini model" value={form.geminiModel} onChange={(e) => setForm((p) => ({ ...p, geminiModel: e.target.value }))}>{(options.geminiModels || []).map((model) => <MenuItem key={model} value={model}>{model}</MenuItem>)}</TextField></Grid> : <Grid item xs={12} md={3}><TextField select size="small" fullWidth label="Ollama config" value={form.ollamaConfigId} onChange={(e) => setForm((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{(options.ollama || []).map((item) => <MenuItem key={item._id} value={item._id}>{item.name || item.modelname}</MenuItem>)}</TextField></Grid>}
        <Grid item xs={6} md={2}><TextField size="small" type="number" fullWidth label="No. of questions" value={form.count} onChange={(e) => setForm((p) => ({ ...p, count: e.target.value }))} /></Grid>
        <Grid item xs={6} md={2}><TextField select size="small" fullWidth label="Question type" value={form.questiontype} onChange={(e) => setForm((p) => ({ ...p, questiontype: e.target.value }))}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={3}><Button fullWidth variant="contained" disabled={loading} onClick={generate}>{loading ? "Generating..." : "Generate"}</Button></Grid>
        <Grid item xs={12}><TextField size="small" fullWidth multiline minRows={2} label="Additional AI prompt" value={form.prompt} onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))} /></Grid>
      </Grid>
    </Paper>
  );
}

function ExamAdmin({ zone = "Practice", title = "Practice tests" }) {
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ ...examBlank, zone });
  const [selectedSection, setSelectedSection] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [optRes, listRes] = await Promise.all([
      ep1.get(`${api}/options`, { params: { colid: global1.colid } }),
      ep1.get(`${api}/exams`, { params: { zone } })
    ]);
    setOptions(optRes.data || {});
    setRows(listRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, [zone]);
  const save = async () => {
    setError(""); setMessage("");
    try {
      await ep1.post(`${api}/exams`, { ...form, zone, user: global1.user, username: currentName(), colid: global1.colid });
      setMessage("Exam saved.");
      setForm({ ...examBlank, zone });
      setSelectedSection(0);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save exam.");
    }
  };
  const edit = (row) => {
    setForm({ ...examBlank, ...row, id: row._id, sections: row.sections || [] });
    setSelectedSection(0);
  };
  const del = async (row) => {
    if (!window.confirm("Delete this exam?")) return;
    await ep1.post(`${api}/exams/delete`, { id: row._id });
    await load();
  };
  const columns = [
    { field: "category", headerName: "Category", minWidth: 160 },
    { field: "examname", headerName: "Exam", flex: 1, minWidth: 220 },
    { field: "examcode", headerName: "Code", minWidth: 140 },
    { field: "durationminutes", headerName: "Duration", minWidth: 100 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "actions", headerName: "Actions", minWidth: 190, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => edit(row)}>Edit</Button><Button size="small" color="error" onClick={() => del(row)}>Delete</Button></Stack> }
  ];
  return (
    <Stack spacing={2}>
      <PageAlert message={message} error={error} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>{title}</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={4}><CategoryField value={form.category} options={zone === "Practice" ? options.examCategories : options.projectCategories} onChange={(category) => setForm((p) => ({ ...p, category }))} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Exam name" value={form.examname} onChange={(e) => setForm((p) => ({ ...p, examname: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth label="Exam code" value={form.examcode} onChange={(e) => setForm((p) => ({ ...p, examcode: e.target.value }))} /></Grid>
          <Grid item xs={6} md={1}><TextField fullWidth type="number" label="Minutes" value={form.durationminutes} onChange={(e) => setForm((p) => ({ ...p, durationminutes: e.target.value }))} /></Grid>
          <Grid item xs={6} md={1}><TextField fullWidth type="number" label="Pass %" value={form.passpercentage} onChange={(e) => setForm((p) => ({ ...p, passpercentage: e.target.value }))} /></Grid>
          <Grid item xs={12} md={3}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
          <Grid item xs={12} md={9}><TextField fullWidth multiline minRows={2} label="Instructions" value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} /></Grid>
          <Grid item xs={12}><QuestionEditor exam={form} setExam={setForm} selectedSection={selectedSection} setSelectedSection={setSelectedSection} options={options} /></Grid>
          <Grid item xs={12}><Stack direction="row" spacing={1}><Button startIcon={<Save />} variant="contained" onClick={save}>Save exam</Button><Button onClick={() => setForm({ ...examBlank, zone })}>New</Button><Button startIcon={<Refresh />} onClick={load}>Refresh</Button></Stack></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rowsOf(rows)} columns={columns} autoHeight slots={{ toolbar: GridToolbar }} />
      </Paper>
    </Stack>
  );
}

function ProjectAdmin() {
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(projectBlank);
  const [ai, setAi] = useState({ provider: "gemini", geminiModel: "gemini-2.5-flash", ollamaConfigId: "", prompt: "", difficulty: "Medium" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [optRes, listRes] = await Promise.all([ep1.get(`${api}/options`, { params: { colid: global1.colid } }), ep1.get(`${api}/projects`)]);
    setOptions(optRes.data || {});
    setRows(listRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const updateStep = (index, patch) => setForm((prev) => ({ ...prev, steps: (prev.steps || []).map((step, idx) => idx === index ? { ...step, ...patch } : step) }));
  const save = async () => {
    setMessage(""); setError("");
    try {
      await ep1.post(`${api}/projects`, { ...form, user: global1.user, username: currentName(), colid: global1.colid });
      setMessage("Project saved.");
      setForm(projectBlank);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save project.");
    }
  };
  const generate = async () => {
    setMessage(""); setError("");
    try {
      const res = await ep1.post(`${api}/projects/generate`, { ...ai, category: form.category, colid: global1.colid });
      setForm((prev) => ({ ...prev, ...res.data?.data, category: res.data?.data?.category || prev.category }));
      setMessage("AI project generated. Review and save.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate project.");
    }
  };
  const del = async (row) => {
    if (!window.confirm("Delete this project?")) return;
    await ep1.post(`${api}/projects/delete`, { id: row._id });
    await load();
  };
  return (
    <Stack spacing={2}>
      <PageAlert message={message} error={error} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>Project and certification zone projects</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={4}><CategoryField value={form.category} options={options.projectCategories} onChange={(category) => setForm((p) => ({ ...p, category }))} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Project title" value={form.projecttitle} onChange={(e) => setForm((p) => ({ ...p, projecttitle: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth label="Difficulty" value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))} /></Grid>
          <Grid item xs={12} md={3}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fafc" }}>
              <Typography fontWeight={900} sx={{ mb: 1 }}>Generate project through AI</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} md={2}><TextField select size="small" fullWidth label="Provider" value={ai.provider} onChange={(e) => setAi((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="gemini">Gemini</MenuItem><MenuItem value="ollama">Ollama</MenuItem></TextField></Grid>
                {ai.provider === "gemini" ? <Grid item xs={12} md={3}><TextField select size="small" fullWidth label="Gemini model" value={ai.geminiModel} onChange={(e) => setAi((p) => ({ ...p, geminiModel: e.target.value }))}>{(options.geminiModels || []).map((model) => <MenuItem key={model} value={model}>{model}</MenuItem>)}</TextField></Grid> : <Grid item xs={12} md={3}><TextField select size="small" fullWidth label="Ollama config" value={ai.ollamaConfigId} onChange={(e) => setAi((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{(options.ollama || []).map((item) => <MenuItem key={item._id} value={item._id}>{item.name || item.modelname}</MenuItem>)}</TextField></Grid>}
                <Grid item xs={12} md={5}><TextField size="small" fullWidth label="AI prompt" value={ai.prompt} onChange={(e) => setAi((p) => ({ ...p, prompt: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<AutoFixHigh />} onClick={generate}>Generate</Button></Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}><Button startIcon={<Add />} onClick={() => setForm((p) => ({ ...p, steps: [...(p.steps || []), { ...stepBlank, order: (p.steps || []).length + 1 }] }))}>Add step</Button></Grid>
          {(form.steps || []).map((step, index) => (
            <Grid item xs={12} key={index}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><Typography fontWeight={900}>Step {index + 1}</Typography><Box sx={{ flex: 1 }} /><Button color="error" onClick={() => setForm((p) => ({ ...p, steps: (p.steps || []).filter((_, idx) => idx !== index) }))}>Remove</Button></Stack>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Step title" value={step.steptitle || ""} onChange={(e) => updateStep(index, { steptitle: e.target.value })} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Max marks" value={step.maxmarks || 10} onChange={(e) => updateStep(index, { maxmarks: Number(e.target.value) })} /></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Diagram link" value={step.diagramlink || ""} onChange={(e) => updateStep(index, { diagramlink: e.target.value })} /></Grid>
                  <Grid item xs={12} md={3}><AwsUploadButton folder="skill-development/project-step" onUploaded={({ url }) => updateStep(index, { imagelink: url })} label="Upload image/file" /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Description" value={step.description || ""} onChange={(e) => updateStep(index, { description: e.target.value })} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Task for student" value={step.task || ""} onChange={(e) => updateStep(index, { task: e.target.value })} /></Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}><Stack direction="row" spacing={1}><Button startIcon={<Save />} variant="contained" onClick={save}>Save project</Button><Button onClick={() => setForm(projectBlank)}>New</Button><Button startIcon={<Refresh />} onClick={load}>Refresh</Button></Stack></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rowsOf(rows)} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "category", headerName: "Category", minWidth: 160 },
          { field: "projecttitle", headerName: "Project", flex: 1, minWidth: 220 },
          { field: "difficulty", headerName: "Difficulty", minWidth: 120 },
          { field: "status", headerName: "Status", minWidth: 120 },
          { field: "actions", headerName: "Actions", minWidth: 180, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => setForm({ ...projectBlank, ...row, id: row._id })}>Edit</Button><Button size="small" color="error" onClick={() => del(row)}>Delete</Button></Stack> }
        ]} />
      </Paper>
    </Stack>
  );
}

function StudentExamCard({ exam, mode = "practice" }) {
  const navigate = useNavigate();
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><Chip label={exam.category} /><Chip color="primary" label={`${exam.durationminutes || 60} min`} /></Stack>
        <Typography variant="h6" fontWeight={900}>{exam.examname}</Typography>
        <Typography color="text.secondary">{exam.instructions}</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(`/student-skill-development-exam?examid=${exam._id}&mode=${mode}`)}>Start test</Button>
      </CardContent>
    </Card>
  );
}

function StudentCertificationCard({ exam, linkedProjects = [], onDetails, onShowMarks, onGenerateCertificate }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip label={exam.category} />
          <Chip color="primary" label={`${exam.durationminutes || 60} min`} />
          <Chip color="success" label={`Pass ${exam.passpercentage || 80}%`} />
        </Stack>
        <Typography variant="h6" fontWeight={900}>{exam.examname}</Typography>
        <Typography color="text.secondary" sx={{ mb: 1 }}>{exam.instructions}</Typography>
        <Typography fontWeight={800}>Linked projects</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ my: 1 }}>
          {linkedProjects.length ? linkedProjects.map((project) => <Chip key={project._id} size="small" variant="outlined" label={project.projecttitle} />) : <Chip size="small" color="warning" label="No linked project configured" />}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
          <Button variant="contained" onClick={() => onDetails(exam)}>Details</Button>
          <Button variant="outlined" onClick={() => onShowMarks(exam)}>Show marks</Button>
          <Button color="success" variant="outlined" onClick={() => onGenerateCertificate(exam)}>Generate certificate</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AttemptsView({ attempts, showCorrect = true, showSectionSummary = false, showSelected = true }) {
  return (
    <Stack spacing={1}>
      {(attempts || []).map((attempt) => (
        <Paper variant="outlined" sx={{ p: 1.5 }} key={attempt._id}>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Typography fontWeight={900}>{attempt.examname}</Typography>
            <Chip label={`${attempt.marksobtained}/${attempt.totalmarks}`} color={attempt.passstatus === "Pass" ? "success" : "warning"} />
            <Chip label={attempt.passstatus} />
            <Typography color="text.secondary">{fmt(attempt.submittime)}</Typography>
          </Stack>
          {showSectionSummary && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {Object.values((attempt.answers || []).reduce((acc, answer) => {
                const key = answer.sectionname || "Section";
                acc[key] = acc[key] || { section: key, marks: 0, total: 0 };
                acc[key].marks += Number(answer.marksobtained || 0);
                acc[key].total += Number(answer.maxmarks || 0);
                return acc;
              }, {})).map((item) => (
                <Chip key={item.section} label={`${item.section}: ${item.marks}/${item.total}`} variant="outlined" />
              ))}
            </Stack>
          )}
          {(attempt.answers || []).map((answer, index) => (
            <Box key={answer._id || index} sx={{ mt: 1, p: 1, bgcolor: answer.iscorrect ? "#ecfdf5" : "#fff7ed", borderRadius: 1 }}>
              <Typography fontWeight={800}>{index + 1}. {answer.questiontext}</Typography>
              {showSelected && <Typography><b>Selected:</b> {answer.selectedoptiontext || answer.answertext || "-"}</Typography>}
              {showCorrect && <Typography><b>Right answer:</b> {answer.correctanswer || "-"}</Typography>}
              <Typography><b>Marks:</b> {answer.marksobtained}/{answer.maxmarks}</Typography>
            </Box>
          ))}
        </Paper>
      ))}
    </Stack>
  );
}

function AttemptSummaryList({ attempts = [], selectedAttempt, onSelect }) {
  return (
    <Stack spacing={1.5}>
      {attempts.length ? attempts.map((attempt) => (
        <Paper
          key={attempt._id}
          variant="outlined"
          sx={{
            p: 1.5,
            borderColor: selectedAttempt?._id === attempt._id ? "primary.main" : "divider",
            bgcolor: selectedAttempt?._id === attempt._id ? "#eff6ff" : "#fff"
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={900}>{attempt.examname}</Typography>
              <Typography color="text.secondary" variant="body2">{attempt.category || "-"} | {fmt(attempt.submittime || attempt.updatedAt || attempt.createdAt)}</Typography>
            </Box>
            <Chip color={attempt.passstatus === "Pass" ? "success" : "warning"} label={`${attempt.marksobtained || 0}/${attempt.totalmarks || 0}`} />
            <Chip label={pct(attempt.percentage)} variant="outlined" />
            <Chip label={attempt.passstatus || attempt.status || "Submitted"} />
            <Button variant="outlined" onClick={() => onSelect(attempt)}>View details</Button>
          </Stack>
        </Paper>
      )) : <Alert severity="info">No attempted exams found.</Alert>}
    </Stack>
  );
}

function printKahanReceipt(row) {
  const html = `<html><head><title>Skill Development Receipt</title><style>
    @page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#111827;background:#f8fafc;margin:0}.toolbar{text-align:right;padding:12px}.toolbar button{padding:8px 14px;margin-left:8px}.sheet{max-width:760px;margin:0 auto 18px;background:#fff;padding:28px;border:1px solid #dbeafe;border-radius:12px}.head{display:flex;gap:16px;align-items:center;border-bottom:3px solid #3b82f6;padding-bottom:16px;margin-bottom:18px}.logo{width:150px;max-height:64px;object-fit:contain}.brand h1{margin:0;font-size:24px}.brand p{margin:4px 0;color:#475569}.title{text-align:center;font-size:22px;font-weight:900;margin:18px 0}.grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #d1d5db;border-bottom:0}.cell{border-bottom:1px solid #d1d5db;padding:11px}.cell:nth-child(odd){border-right:1px solid #d1d5db}.cell b{display:block;color:#334155;font-size:12px;text-transform:uppercase;margin-bottom:4px}.amount{font-size:26px;font-weight:900;color:#2563eb}.note{margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;padding:12px;border-radius:8px}.foot{margin-top:28px;text-align:center;color:#64748b;font-size:12px}@media print{body{background:#fff}.toolbar{display:none}.sheet{border:0;border-radius:0;max-width:none;padding:0}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div><div class="sheet"><div class="head"><img class="logo" src="${safe(kahanLogo)}" /><div class="brand"><h1>Kahan Technologies Pvt Ltd.</h1><p>A portfolio company of <b><i>Bennett, Coleman &amp; Co. Ltd, Times of India group.</i></b></p></div></div><div class="title">Skill Development Access Receipt</div><div class="grid"><div class="cell"><b>Receipt / Order ID</b>${safe(row.orderid)}</div><div class="cell"><b>Status</b>${safe(row.paymentstatus)}</div><div class="cell"><b>Student</b>${safe(row.student)}</div><div class="cell"><b>Email</b>${safe(row.email)}</div><div class="cell"><b>Reg No</b>${safe(row.regno)}</div><div class="cell"><b>Amount</b><span class="amount">${safe(money(row.amount))}</span></div><div class="cell"><b>Access From</b>${safe(fmt(row.accessfrom))}</div><div class="cell"><b>Access Till</b>${safe(fmt(row.accesstill))}</div><div class="cell"><b>Payment Date</b>${safe(fmt(row.updatedAt || row.createdAt))}</div><div class="cell"><b>Service</b>Project and certification zone access</div></div><div class="note">This receipt is generated for Skill Development Zone access. Institution name, logo and address are intentionally not printed on this receipt.</div><div class="foot">This is a digitally generated receipt.</div></div></body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

function StudentSkillPurchases() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.get(`${api}/access/purchases`, { params: { email: currentEmail(), regno: global1.regno } });
      setRows(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load purchases.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  return (
    <Stack spacing={2}>
      {message && <Alert severity="error">{message}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={900}>Past purchases</Typography>
            <Typography color="text.secondary">View Skill Development Zone access purchases and reprint Kahan receipt.</Typography>
          </Box>
          <Button startIcon={loading ? <CircularProgress size={16} /> : <Refresh />} onClick={load}>Refresh</Button>
        </Stack>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid
          rows={rowsOf(rows)}
          autoHeight
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          columns={[
            { field: "orderid", headerName: "Order ID", minWidth: 210 },
            { field: "student", headerName: "Student", minWidth: 160 },
            { field: "email", headerName: "Email", minWidth: 220 },
            { field: "amount", headerName: "Amount", minWidth: 110, valueFormatter: (p) => money(p.value) },
            { field: "paymentstatus", headerName: "Status", minWidth: 120 },
            { field: "accessfrom", headerName: "Access from", minWidth: 180, valueFormatter: (p) => fmt(p.value) },
            { field: "accesstill", headerName: "Access till", minWidth: 180, valueFormatter: (p) => fmt(p.value) },
            { field: "receipt", headerName: "Receipt", minWidth: 130, renderCell: ({ row }) => <Button size="small" startIcon={<Print />} onClick={() => printKahanReceipt(row)}>Receipt</Button> }
          ]}
        />
      </Paper>
    </Stack>
  );
}

function StudentClasses() {
  const [access, setAccess] = useState({ active: false });
  const [options, setOptions] = useState({});
  const [categoriesFilter, setCategoriesFilter] = useState([]);
  const [dates, setDates] = useState(dateChipRange("week"));
  const [rows, setRows] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");
  const load = async (nextCategories = categoriesFilter, nextDates = dates) => {
    const params = { email: currentEmail(), colid: global1.colid };
    const [accessRes, optRes, classRes, regRes] = await Promise.all([
      ep1.get(`${api}/access/status`, { params }),
      ep1.get(`${api}/options`, { params }),
      ep1.get(`${api}/classes`, { params: { status: "Active", categories: nextCategories.join(","), ...nextDates } }),
      ep1.get(`${api}/classes/registrations`, { params: { email: currentEmail() } })
    ]);
    setAccess(accessRes.data || { active: false });
    setOptions(optRes.data || {});
    setRows(classRes.data?.data || []);
    setRegistrations(regRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const setQuick = (kind) => {
    const next = dateChipRange(kind);
    setDates(next);
    load(categoriesFilter, next);
  };
  const register = async (klass) => {
    setMessage("");
    try {
      const res = await ep1.post(`${api}/classes/register`, { classid: klass._id, student: currentName(), email: currentEmail(), regno: global1.regno, colid: global1.colid });
      setMessage(res.data?.message || "Registration saved.");
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to register.");
    }
  };
  const cancel = async (reg) => {
    await ep1.post(`${api}/classes/cancel`, { id: reg._id });
    setMessage("Registration cancelled.");
    await load();
  };
  const regFor = (classid) => registrations.find((row) => String(row.classid) === String(classid) && ["Confirmed", "Waitlist"].includes(row.registrationstatus));
  const grouped = rows.reduce((acc, row) => {
    const key = ymd(row.classdate);
    acc[key] = [...(acc[key] || []), row];
    return acc;
  }, {});
  return (
    <Stack spacing={2}>
      {message && <Alert severity={message.includes("required") || message.includes("Full") || message.includes("Unable") ? "warning" : "info"}>{message}</Alert>}
      {!access.active && <Alert severity="warning">All classes are visible. Payment is required before registration.</Alert>}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={6}><CategoryMultiFilter value={categoriesFilter} options={options.classCategories} label="Class categories" onChange={(next) => { setCategoriesFilter(next); load(next, dates); }} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} label="From date" value={dates.fromdate} onChange={(e) => setDates((p) => ({ ...p, fromdate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} label="To date" value={dates.todate} onChange={(e) => setDates((p) => ({ ...p, todate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={() => load()}>Load</Button></Grid>
          <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Chip clickable color="primary" label="Today" onClick={() => setQuick("today")} /><Chip clickable color="secondary" label="Tomorrow" onClick={() => setQuick("tomorrow")} /><Chip clickable color="success" label="This week" onClick={() => setQuick("week")} /></Stack></Grid>
        </Grid>
      </Paper>
      {Object.keys(grouped).length === 0 && <Alert severity="info">No classes found for selected filters.</Alert>}
      {Object.entries(grouped).map(([date, list]) => (
        <Paper sx={{ p: 2 }} key={date}>
          <Typography variant="h6" fontWeight={900}>{date}</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {list.map((klass) => {
              const reg = regFor(klass._id);
              const confirmed = reg?.registrationstatus === "Confirmed" && reg.enabled !== "No";
              return (
                <Grid item xs={12} md={4} key={klass._id}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}><Chip label={klass.category} /><Chip label={klass.classtime || "Time not set"} /></Stack>
                      <Typography variant="h6" fontWeight={900}>{klass.topic}</Typography>
                      <Typography color="text.secondary">Capacity: {klass.capacity || 0}</Typography>
                      {reg && <Alert severity={confirmed ? "success" : "info"} sx={{ my: 1 }}>{reg.registrationstatus}{reg.waitlistno ? ` #${reg.waitlistno}` : ""}</Alert>}
                      {confirmed && klass.link && <Button href={klass.link} target="_blank" variant="outlined" sx={{ mr: 1 }}>Open link</Button>}
                      {!reg ? <Button variant="contained" onClick={() => register(klass)}>Register</Button> : <Button color="error" onClick={() => cancel(reg)}>Cancel</Button>}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      ))}
    </Stack>
  );
}

export function StudentSkillDevelopmentExamRunnerPage() {
  const [params] = useSearchParams();
  const examid = params.get("examid");
  const mode = params.get("mode") === "certification" ? "Certification" : "Practice";
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [active, setActive] = useState({ section: 0, question: 0 });
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const submitRef = useRef(false);
  const didStartRef = useRef(false);
  const device = useMemo(deviceId, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const loadAndStart = async () => {
    if (!examid || didStartRef.current) return;
    didStartRef.current = true;
    try {
      const examRes = await ep1.get(`${api}/exams`, { params: { id: examid, zone: mode } });
      const selectedExam = examRes.data?.data?.[0];
      if (!selectedExam) throw new Error("Exam not found.");
      await document.documentElement.requestFullscreen?.();
      const startRes = await ep1.post(`${api}/attempts/start`, {
        examid,
        student: currentName(),
        email: currentEmail(),
        regno: global1.regno,
        colid: global1.colid,
        deviceid: device
      });
      setExam(startRes.data?.exam || selectedExam);
      setAttempt(startRes.data?.attempt);
      setAnswers(startRes.data?.attempt?.answers || []);
      setRemaining(startRes.data?.attempt?.remainingseconds || (selectedExam.durationminutes || 60) * 60);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to start exam.");
    }
  };

  useEffect(() => { loadAndStart(); }, [examid, mode]);

  const save = async (nextRemaining = remaining) => {
    if (!attempt || submitRef.current || !navigator.onLine) return;
    await ep1.post(`${api}/attempts/save`, {
      attemptid: attempt._id,
      answers,
      remainingseconds: nextRemaining,
      colid: global1.colid,
      deviceid: device
    });
  };

  const submit = async (reason = "Submitted by student", auto = false) => {
    if (!attempt || submitRef.current) return;
    submitRef.current = true;
    try {
      const res = await ep1.post(`${api}/attempts/submit`, {
        attemptid: attempt._id,
        answers,
        remainingseconds: remaining,
        autosubmitted: auto,
        submitreason: reason,
        student: currentName(),
        email: currentEmail(),
        regno: global1.regno,
        colid: global1.colid,
        deviceid: device
      });
      setAttempt(res.data?.data);
      setMessage(`Exam submitted. Score: ${res.data?.data?.marksobtained}/${res.data?.data?.totalmarks}. ${reason}`);
      document.exitFullscreen?.().catch(() => {});
    } catch (error) {
      submitRef.current = false;
      setMessage(error.response?.data?.message || "Unable to submit exam.");
    }
  };

  useEffect(() => {
    if (!attempt || attempt.submittime) return undefined;
    const id = setInterval(() => {
      if (!navigator.onLine) return;
      setRemaining((value) => {
        const next = Math.max(0, value - 1);
        if (next <= 0) submit("Time over", true);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || attempt.submittime) return undefined;
    const id = setInterval(() => save().catch(() => {}), 10000);
    return () => clearInterval(id);
  }, [attempt, answers, remaining]);

  useEffect(() => {
    if (!attempt || attempt.submittime) return undefined;
    const handler = () => {
      if (document.hidden || !document.fullscreenElement) submit("Exited fullscreen or switched tab", true);
    };
    const blur = () => submit("Window focus lost", true);
    document.addEventListener("visibilitychange", handler);
    document.addEventListener("fullscreenchange", handler);
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      document.removeEventListener("fullscreenchange", handler);
      window.removeEventListener("blur", blur);
    };
  }, [attempt, answers, remaining]);

  const patchAnswer = (questionid, patch) => setAnswers((prev) => prev.map((answer) => String(answer.questionid) === String(questionid) ? { ...answer, ...patch } : answer));
  const section = exam?.sections?.[active.section];
  const question = section?.questions?.[active.question];
  const answer = answers.find((row) => String(row.questionid) === String(question?._id));

  if (attempt?.submittime) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#eef2ff", p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
          <Typography variant="h4" fontWeight={900}>Submitted</Typography>
          {message && <Alert severity="success" sx={{ my: 2 }}>{message}</Alert>}
          <Typography><b>Score:</b> {attempt.marksobtained}/{attempt.totalmarks} ({pct(attempt.percentage)})</Typography>
          <Typography><b>Status:</b> {attempt.passstatus}</Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => window.location.href = "/student-skill-development-zone"}>Back to Skill development</Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", p: 2 }}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900}>{exam?.examname || "Starting exam..."}</Typography>
              <Typography color="text.secondary">{mode} | {exam?.category}</Typography>
            </Box>
            <Chip color={online ? "success" : "warning"} label={online ? "Online" : "Offline - timer paused"} />
            <Typography variant="h4" fontWeight={900} sx={{ color: "#111827", bgcolor: "#e0f2fe", px: 2, py: 1, borderRadius: 1 }}>{formatSeconds(remaining)}</Typography>
            <Button variant="outlined" onClick={() => save()}>Save</Button>
            <Button variant="contained" color="error" onClick={() => submit("Final submitted", false)}>Submit</Button>
          </Stack>
        </Paper>
        {message && !attempt?.submittime && <Alert severity="warning">{message}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1.5, height: "calc(100vh - 150px)", overflow: "auto" }}>
              {(exam?.sections || []).map((sec, si) => (
                <Box key={sec._id || si} sx={{ mb: 2 }}>
                  <Typography fontWeight={900}>{sec.sectionname}</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                    {(sec.questions || []).map((q, qi) => {
                      const ans = answers.find((row) => String(row.questionid) === String(q._id));
                      return <Button key={q._id} size="small" color={answered(ans) ? "success" : "primary"} variant={active.section === si && active.question === qi ? "contained" : "outlined"} onClick={() => setActive({ section: si, question: qi })}>{qi + 1}</Button>;
                    })}
                  </Stack>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 2, minHeight: "calc(100vh - 150px)" }}>
              {question ? (
                <>
                  <Typography variant="h6" fontWeight={900}>{section?.sectionname}</Typography>
                  <Typography sx={{ mt: 2, whiteSpace: "pre-wrap", fontWeight: 800 }}>{question.questiontext}</Typography>
                  {["MCQ", "Fill in the blanks"].includes(question.questiontype || "MCQ") ? (
                    <Stack spacing={1} sx={{ mt: 3 }}>{(question.options || []).map((option) => <FormControlLabel key={option._id} control={<Radio checked={answer?.selectedoptionid === option._id} onChange={() => patchAnswer(question._id, { selectedoptionid: option._id, selectedoptiontext: option.optiontext })} />} label={option.optiontext} />)}</Stack>
                  ) : (
                    <TextField fullWidth multiline minRows={8} sx={{ mt: 3 }} label="Answer" value={answer?.answertext || ""} onChange={(e) => patchAnswer(question._id, { answertext: e.target.value })} />
                  )}
                </>
              ) : <Alert severity="info">Loading questions...</Alert>}
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

function StudentPracticeTests() {
  const [category, setCategory] = useState([]);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [options, setOptions] = useState({});
  const [tab, setTab] = useState(0);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const load = async (nextCategory = category) => {
    const categoryParam = nextCategory.join(",");
    const [optRes, examRes, attemptRes] = await Promise.all([
      ep1.get(`${api}/options`, { params: { colid: global1.colid } }),
      ep1.get(`${api}/exams`, { params: { zone: "Practice", status: "Published", categories: categoryParam } }),
      ep1.get(`${api}/attempts`, { params: { zone: "Practice", email: currentEmail() } })
    ]);
    setOptions(optRes.data || {});
    setExams(examRes.data?.data || []);
    setAttempts(attemptRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_, value) => { setTab(value); setSelectedAttempt(null); }} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Practice tests" />
          <Tab label={`Attempted (${attempts.length})`} />
        </Tabs>
      </Paper>
      {tab === 0 && (
        <>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
              <CategoryMultiFilter value={category} options={options.examCategories} onChange={(next) => { setCategory(next); load(next); }} helper="Select one or more categories, or click the colorful chips below." />
              <Button variant="contained" onClick={() => load()}>Search tests</Button>
            </Stack>
          </Paper>
          <Grid container spacing={2}>{exams.map((exam) => <Grid item xs={12} md={6} key={exam._id}><StudentExamCard exam={exam} mode="practice" /></Grid>)}</Grid>
          {!exams.length && <Alert severity="info">No practice tests found for the selected category.</Alert>}
        </>
      )}
      {tab === 1 && (
        <>
          <Alert severity="info">Every practice test attempt is saved separately. Select any attempt to view question-wise selected answers and right answers.</Alert>
          <AttemptSummaryList attempts={attempts} selectedAttempt={selectedAttempt} onSelect={setSelectedAttempt} />
          {selectedAttempt && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>{selectedAttempt.examname} - attempt details</Typography>
              <AttemptsView attempts={[selectedAttempt]} />
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}

function CouponAdmin() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ couponcode: "", discountamount: 0, fromdate: "", todate: "", status: "Active" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const res = await ep1.get(`${api}/coupons`);
    setRows(res.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const save = async () => {
    setMessage(""); setError("");
    try {
      await ep1.post(`${api}/coupons`, { ...form, user: global1.user, username: currentName(), colid: global1.colid });
      setForm({ couponcode: "", discountamount: 0, fromdate: "", todate: "", status: "Active" });
      setMessage("Coupon saved.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save coupon.");
    }
  };
  const del = async (row) => {
    if (!window.confirm("Delete this coupon?")) return;
    await ep1.post(`${api}/coupons/delete`, { id: row._id });
    await load();
  };
  return (
    <Stack spacing={2}>
      <PageAlert message={message} error={error} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>Coupon code</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={3}><TextField fullWidth label="Coupon code" value={form.couponcode} onChange={(e) => setForm((p) => ({ ...p, couponcode: e.target.value.toUpperCase() }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Discount amount" value={form.discountamount} onChange={(e) => setForm((p) => ({ ...p, discountamount: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} label="From date" value={form.fromdate || ""} onChange={(e) => setForm((p) => ({ ...p, fromdate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} label="To date" value={form.todate || ""} onChange={(e) => setForm((p) => ({ ...p, todate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
          <Grid item xs={12} md={1}><Button fullWidth sx={{ height: "100%" }} variant="contained" onClick={save}>Save</Button></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rowsOf(rows)} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "couponcode", headerName: "Coupon", minWidth: 160 },
          { field: "discountamount", headerName: "Discount", minWidth: 130, valueFormatter: (p) => money(p.value) },
          { field: "fromdate", headerName: "From", minWidth: 150, valueFormatter: (p) => fmt(p.value) },
          { field: "todate", headerName: "To", minWidth: 150, valueFormatter: (p) => fmt(p.value) },
          { field: "status", headerName: "Status", minWidth: 120 },
          { field: "actions", headerName: "Actions", minWidth: 170, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => setForm({ ...row, id: row._id, fromdate: row.fromdate?.slice?.(0, 10) || "", todate: row.todate?.slice?.(0, 10) || "" })}>Edit</Button><Button size="small" color="error" onClick={() => del(row)}>Delete</Button></Stack> }
        ]} />
      </Paper>
    </Stack>
  );
}

function CertificationLinkAdmin() {
  const [options, setOptions] = useState({});
  const [category, setCategory] = useState("");
  const [exams, setExams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [editing, setEditing] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async (nextCategory = category) => {
    const [optRes, examRes, projectRes, linkRes] = await Promise.all([
      ep1.get(`${api}/options`, { params: { colid: global1.colid } }),
      ep1.get(`${api}/exams`, { params: { zone: "Certification", status: "Published", categories: nextCategory } }),
      ep1.get(`${api}/projects`, { params: { status: "Published", categories: nextCategory } }),
      ep1.get(`${api}/certification-links`, { params: { categories: nextCategory } })
    ]);
    setOptions(optRes.data || {});
    setExams(examRes.data?.data || []);
    setProjects(projectRes.data?.data || []);
    setRows(linkRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const save = async () => {
    setMessage(""); setError("");
    try {
      await ep1.post(`${api}/certification-links`, {
        id: editing,
        category,
        examids: selectedExams.map((item) => item._id),
        projectids: selectedProjects.map((item) => item._id),
        user: global1.user,
        username: currentName(),
        colid: global1.colid
      });
      setSelectedExams([]);
      setSelectedProjects([]);
      setEditing("");
      setMessage("Certification-project link saved.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save link.");
    }
  };
  const edit = (row) => {
    setEditing(row._id);
    setCategory(row.category || "");
    setSelectedExams(exams.filter((item) => (row.examids || []).includes(String(item._id))));
    setSelectedProjects(projects.filter((item) => (row.projectids || []).includes(String(item._id))));
  };
  const del = async (row) => {
    if (!window.confirm("Delete this link?")) return;
    await ep1.post(`${api}/certification-links/delete`, { id: row._id });
    await load();
  };
  return (
    <Stack spacing={2}>
      <PageAlert message={message} error={error} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>Certification project linking</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={3}><CategoryField value={category} options={options.examCategories} onChange={(value) => { setCategory(value); load(value); }} /></Grid>
          <Grid item xs={12} md={4}><Autocomplete multiple options={exams} value={selectedExams} onChange={(_, value) => setSelectedExams(value)} getOptionLabel={(item) => `${item.examname || ""} ${item.examcode ? `(${item.examcode})` : ""}`} renderInput={(params) => <TextField {...params} label="Certification examinations" />} /></Grid>
          <Grid item xs={12} md={4}><Autocomplete multiple options={projects} value={selectedProjects} onChange={(_, value) => setSelectedProjects(value)} getOptionLabel={(item) => item.projecttitle || ""} renderInput={(params) => <TextField {...params} label="Linked projects" />} /></Grid>
          <Grid item xs={12} md={1}><Button fullWidth sx={{ height: "100%" }} variant="contained" onClick={save}>Save</Button></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rowsOf(rows)} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "category", headerName: "Category", minWidth: 160 },
          { field: "examnames", headerName: "Exams", flex: 1, minWidth: 240, valueGetter: (p) => (p.row.examnames || []).join(", ") },
          { field: "projecttitles", headerName: "Projects", flex: 1, minWidth: 240, valueGetter: (p) => (p.row.projecttitles || []).join(", ") },
          { field: "status", headerName: "Status", minWidth: 110 },
          { field: "actions", headerName: "Actions", minWidth: 160, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => edit(row)}>Edit</Button><Button size="small" color="error" onClick={() => del(row)}>Delete</Button></Stack> }
        ]} />
      </Paper>
    </Stack>
  );
}

function ClassAdmin() {
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ classdate: ymd(), classtime: "", topic: "", category: "", link: "", capacity: 0, status: "Active" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [optRes, classRes] = await Promise.all([
      ep1.get(`${api}/options`, { params: { colid: global1.colid } }),
      ep1.get(`${api}/classes`)
    ]);
    setOptions(optRes.data || {});
    setRows(classRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const save = async () => {
    setMessage(""); setError("");
    try {
      await ep1.post(`${api}/classes`, { ...form, user: global1.user, username: currentName(), colid: global1.colid });
      setForm({ classdate: ymd(), classtime: "", topic: "", category: "", link: "", capacity: 0, status: "Active" });
      setMessage("Class saved.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save class.");
    }
  };
  const del = async (row) => {
    if (!window.confirm("Delete this class?")) return;
    await ep1.post(`${api}/classes/delete`, { id: row._id });
    await load();
  };
  return (
    <Stack spacing={2}>
      <PageAlert message={message} error={error} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>Classes</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} label="Class date" value={form.classdate || ""} onChange={(e) => setForm((p) => ({ ...p, classdate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth label="Time" placeholder="10:00 AM" value={form.classtime} onChange={(e) => setForm((p) => ({ ...p, classtime: e.target.value }))} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Topic" value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} /></Grid>
          <Grid item xs={12} md={3}><CategoryField value={form.category} options={options.classCategories} onChange={(category) => setForm((p) => ({ ...p, category }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Capacity" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Class link" value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
          <Grid item xs={12} md={4}><Stack direction="row" spacing={1} sx={{ height: "100%" }}><Button variant="contained" onClick={save}>Save</Button><Button onClick={() => setForm({ classdate: ymd(), classtime: "", topic: "", category: "", link: "", capacity: 0, status: "Active" })}>New</Button><Button startIcon={<Refresh />} onClick={load}>Refresh</Button></Stack></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rowsOf(rows)} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "classdate", headerName: "Date", minWidth: 140, valueFormatter: (p) => ymd(p.value) },
          { field: "classtime", headerName: "Time", minWidth: 110 },
          { field: "topic", headerName: "Topic", flex: 1, minWidth: 220 },
          { field: "category", headerName: "Category", minWidth: 150 },
          { field: "capacity", headerName: "Capacity", minWidth: 110 },
          { field: "status", headerName: "Status", minWidth: 110 },
          { field: "actions", headerName: "Actions", minWidth: 170, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => setForm({ ...row, id: row._id, classdate: ymd(row.classdate) })}>Edit</Button><Button size="small" color="error" onClick={() => del(row)}>Delete</Button></Stack> }
        ]} />
      </Paper>
    </Stack>
  );
}

function ClassRegistrationAdmin() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [message, setMessage] = useState("");
  const loadClasses = async () => {
    const res = await ep1.get(`${api}/classes`, { params: { status: "Active" } });
    setClasses(res.data?.data || []);
  };
  const loadRows = async (klass = selectedClass) => {
    if (!klass?._id) return setRows([]);
    const res = await ep1.get(`${api}/classes/registrations`, { params: { classid: klass._id } });
    setRows(res.data?.data || []);
  };
  useEffect(() => { loadClasses().catch(() => {}); }, []);
  const bulk = async (enabled) => {
    await ep1.post(`${api}/classes/registrations/status`, { ids: selection, enabled });
    setMessage(`Selected users ${enabled === "Yes" ? "enabled" : "disabled"}.`);
    setSelection([]);
    await loadRows();
  };
  return (
    <Stack spacing={2}>
      {message && <Alert severity="success">{message}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <Autocomplete options={classes} value={selectedClass} onChange={(_, value) => { setSelectedClass(value); loadRows(value); }} getOptionLabel={(item) => `${ymd(item.classdate)} ${item.classtime || ""} - ${item.topic || ""}`} sx={{ minWidth: 420 }} renderInput={(params) => <TextField {...params} label="Select class" />} />
          <Button variant="contained" onClick={() => loadRows()}>Load students</Button>
          <Button disabled={!selection.length} onClick={() => bulk("Yes")}>Enable selected</Button>
          <Button disabled={!selection.length} color="error" onClick={() => bulk("No")}>Disable selected</Button>
        </Stack>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <DataGrid checkboxSelection onRowSelectionModelChange={(model) => setSelection(model)} rowSelectionModel={selection} rows={rowsOf(rows)} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "student", headerName: "Student", minWidth: 180 },
          { field: "email", headerName: "Email", minWidth: 220 },
          { field: "regno", headerName: "Regno", minWidth: 140 },
          { field: "registrationstatus", headerName: "Status", minWidth: 140 },
          { field: "enabled", headerName: "Enabled", minWidth: 110 },
          { field: "waitlistno", headerName: "Waitlist no", minWidth: 120 },
          { field: "registeredat", headerName: "Registered at", minWidth: 190, valueFormatter: (p) => fmt(p.value) }
        ]} />
      </Paper>
    </Stack>
  );
}

function StudentProjectCertification({ view = "projects" }) {
  const navigate = useNavigate();
  const [access, setAccess] = useState({ active: false });
  const [options, setOptions] = useState({});
  const [projectCategories, setProjectCategories] = useState([]);
  const [examCategories, setExamCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certExams, setCertExams] = useState([]);
  const [links, setLinks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [marksExam, setMarksExam] = useState(null);
  const [paymentContext, setPaymentContext] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payable, setPayable] = useState(600);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });
  const [paying, setPaying] = useState(false);
  const [projectTab, setProjectTab] = useState(0);
  const [selectedProjectSubmission, setSelectedProjectSubmission] = useState(null);
  const toastColor = {
    success: { bg: "#15803d", border: "#86efac" },
    warning: { bg: "#b45309", border: "#fde68a" },
    error: { bg: "#b91c1c", border: "#fecaca" },
    info: { bg: "#1d4ed8", border: "#bfdbfe" }
  };
  const notify = (nextMessage, severity = "info") => {
    setToast({ open: true, message: nextMessage, severity });
    setMessage(nextMessage);
  };
  const load = async (nextProjectCategories = projectCategories, nextExamCategories = examCategories) => {
    const params = { email: currentEmail(), colid: global1.colid };
    const [accessRes, optionRes, projectRes, examRes, linkRes, submissionRes, attemptRes, certRes] = await Promise.all([
      ep1.get(`${api}/access/status`, { params }),
      ep1.get(`${api}/options`, { params }),
      ep1.get(`${api}/projects`, { params: { status: "Published", categories: nextProjectCategories.join(",") } }),
      ep1.get(`${api}/exams`, { params: { zone: "Certification", status: "Published", categories: nextExamCategories.join(",") } }),
      ep1.get(`${api}/certification-links`, { params: { status: "Active" } }),
      ep1.get(`${api}/project-submissions`, { params: { email: currentEmail() } }),
      ep1.get(`${api}/attempts`, { params: { zone: "Certification", email: currentEmail() } }),
      ep1.get(`${api}/certificates`, { params: { email: currentEmail() } })
    ]);
    setAccess(accessRes.data || { active: false });
    setOptions(optionRes.data || {});
    setProjects(projectRes.data?.data || []);
    setCertExams(examRes.data?.data || []);
    setLinks(linkRes.data?.data || []);
    setSubmissions(submissionRes.data?.data || []);
    setAttempts(attemptRes.data?.data || []);
    setCertificates(certRes.data?.data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const requirePayment = (context) => {
    if (access.active) return false;
    setPaymentContext(context);
    setCoupon("");
    setDiscount(0);
    setPayable(600);
    notify("Please complete payment to open details.", "warning");
    return true;
  };
  const linkedProjectsForExam = (exam) => {
    const ids = links.filter((link) => (link.examids || []).includes(String(exam?._id))).flatMap((link) => link.projectids || []);
    return projects.filter((project) => ids.includes(String(project._id)));
  };
  const projectSubmissionsByStatus = (kind) => submissions.filter((item) => {
    const status = String(item.status || "Submitted").toLowerCase();
    if (kind === "accepted") return status === "accepted";
    if (kind === "redo") return status === "redo" || status === "rejected" || Boolean(item.redoinstructions);
    return !["accepted", "redo", "rejected"].includes(status);
  });
  const openProjectFromSubmission = (submission) => {
    if (requirePayment({ type: "project", title: submission.projecttitle, record: { _id: submission.projectid, projecttitle: submission.projecttitle } })) return;
    navigate(`/student-skill-development-project?projectid=${submission.projectid}`);
  };
  const openProject = (project) => {
    if (requirePayment({ type: "project", title: project.projecttitle, record: project })) return;
    navigate(`/student-skill-development-project?projectid=${project._id}`);
  };
  const openCertification = (exam) => {
    if (requirePayment({ type: "certification", title: exam.examname, record: exam })) return;
    setSelectedCertification(exam);
  };
  const showMarks = (exam) => {
    if (requirePayment({ type: "certification", title: exam.examname, record: exam })) return;
    setSelectedCertification(exam);
    setMarksExam(exam);
  };
  const afterPaymentOpen = () => {
    if (!paymentContext) return;
    if (paymentContext.type === "project") navigate(`/student-skill-development-project?projectid=${paymentContext.record?._id}`);
    if (paymentContext.type === "certification") setSelectedCertification(paymentContext.record);
    setPaymentContext(null);
  };
  const validateCoupon = async () => {
    setMessage("");
    try {
      const res = await ep1.get(`${api}/coupons/validate`, { params: { couponcode: coupon, amount: 600 } });
      setDiscount(res.data?.discountamount || 0);
      setPayable(res.data?.payableamount ?? 600);
      notify(`Coupon applied. Discount ${money(res.data?.discountamount || 0)}.`, "success");
    } catch (err) {
      setDiscount(0);
      setPayable(600);
      notify(err.response?.data?.message || "Coupon is invalid.", "warning");
    }
  };
  const pay = async () => {
    setPaying(true);
    try {
      if (payable <= 0) {
        await ep1.post(`${api}/access/activate-coupon`, { colid: global1.colid, couponcode: coupon, email: currentEmail(), student: currentName(), regno: global1.regno });
        notify("Coupon verified. Access activated for one month.", "success");
        await load();
        afterPaymentOpen();
        return;
      }
      const orderid = `SKILL-${global1.colid || "0"}-${Date.now()}`;
      const res = await ep1.post("/api/v2/cashfree/order", {
        colid: global1.colid,
        amount: payable,
        orderid,
        configscope: "Admin",
        source: "SkillDevelopmentAccess",
        sourceid: currentEmail(),
        description: `Skill development project and certification zone access${coupon ? ` (${coupon})` : ""}`,
        customername: currentName(),
        customeremail: currentEmail(),
        customerphone: global1.phone || "9999999999",
        user: global1.user,
        name: currentName(),
        returnurl: `${window.location.origin}${window.location.pathname}?skill_order_id={order_id}`
      });
      localStorage.setItem("skillZonePendingPayment", JSON.stringify({ orderid, originalamount: 600, amount: payable, discountamount: discount, couponcode: coupon }));
      const sessionId = res.data?.cashfree?.payment_session_id || res.data?.data?.paymentsessionid;
      if (!sessionId) throw new Error("Cashfree did not return payment session id.");
      await loadCashfreeScript();
      const cashfree = window.Cashfree({ mode: res.data?.mode === "production" ? "production" : "sandbox" });
      await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
    } catch (err) {
      notify(err.response?.data?.message || err.message || "Unable to initiate payment.", "warning");
    } finally {
      setPaying(false);
    }
  };
  useEffect(() => {
    const orderid = new URLSearchParams(window.location.search).get("skill_order_id") || new URLSearchParams(window.location.search).get("order_id");
    if (!orderid) return;
    const pending = JSON.parse(localStorage.getItem("skillZonePendingPayment") || "{}");
    ep1.get("/api/v2/cashfree/verify", { params: { colid: global1.colid, orderid } })
      .then(() => ep1.post(`${api}/access/activate-paid`, { colid: global1.colid, orderid, email: currentEmail(), student: currentName(), regno: global1.regno, originalamount: pending.originalamount || 600, amount: pending.amount, discountamount: pending.discountamount, couponcode: pending.couponcode }))
      .then(() => { localStorage.removeItem("skillZonePendingPayment"); notify("Payment verified. Access activated for one month.", "success"); load(); })
      .catch((err) => notify(err.response?.data?.message || "Unable to verify access payment.", "warning"));
  }, []);
  const generateCertificate = async (exam = selectedCertification) => {
    if (!exam) return notify("Please select a certification exam first.", "warning");
    if (requirePayment({ type: "certification", title: exam.examname, record: exam })) return;
    const attempt = attempts.find((item) => item.passstatus === "Pass" && String(item.examid) === String(exam._id));
    const linked = linkedProjectsForExam(exam);
    const project = submissions.find((item) => item.status === "Accepted" && linked.some((projectRow) => String(projectRow._id) === String(item.projectid)));
    if (!attempt) return notify("Certificate cannot be generated. The certification exam is not passed yet.", "warning");
    if (!project) return notify("Certificate cannot be generated. One linked project must be accepted first.", "warning");
    const res = await ep1.post(`${api}/certificates/generate`, { projectsubmissionid: project._id, certificationattemptid: attempt._id, colid: global1.colid });
    notify(`Certificate generated: ${res.data?.data?.certificatecode}`, "success");
    await load();
  };
  const printCertificate = (cert) => {
    const html = `<html><head><title>Certificate of Completion</title><style>
      @page{size:A4 landscape;margin:8mm}
      *{box-sizing:border-box}
      body{margin:0;background:#eaf2ff;font-family:"Inter","Segoe UI",Arial,sans-serif;color:#0f172a}
      .toolbar{padding:12px 16px;text-align:right;background:#f8fafc;border-bottom:1px solid #dbeafe}
      .toolbar button{border:0;border-radius:8px;background:#2563eb;color:#fff;padding:9px 16px;margin-left:8px;font-weight:800;cursor:pointer}
      .certificate{width:281mm;height:194mm;margin:8px auto;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 48%,#e7f0ff 100%);position:relative;overflow:hidden;border:1px solid #bfdbfe;box-shadow:0 24px 70px rgba(15,23,42,.22);padding:10mm 15mm}
      .certificate:before{content:"";position:absolute;inset:8mm;border:2px solid #2563eb;opacity:.75;pointer-events:none}
      .certificate:after{content:"";position:absolute;right:-38mm;top:-45mm;width:125mm;height:125mm;border-radius:50%;background:radial-gradient(circle,#60a5fa 0%,#dbeafe 55%,transparent 72%);opacity:.42}
      .corner{position:absolute;left:-28mm;bottom:-32mm;width:115mm;height:115mm;border-radius:50%;background:radial-gradient(circle,#93c5fd 0%,#eff6ff 58%,transparent 72%);opacity:.45}
      .content{position:relative;z-index:1;text-align:center;height:100%;display:flex;flex-direction:column;align-items:center}
      .brand{display:flex;align-items:center;justify-content:center;gap:18px;width:100%;margin-bottom:4mm}
      .logo{width:44mm;max-height:18mm;object-fit:contain}
      .brand-text{text-align:left;border-left:3px solid #2563eb;padding-left:14px}
      .brand-text h2{margin:0;font-size:18px;letter-spacing:.08em;text-transform:uppercase;color:#1e3a8a}
      .brand-text p{margin:4px 0 0;font-size:11px;color:#334155;font-weight:700}
      .eyebrow{font-size:13px;text-transform:uppercase;letter-spacing:.34em;color:#2563eb;font-weight:900;margin-top:2mm}
      h1{font-family:Georgia,"Times New Roman",serif;font-size:44px;line-height:1.05;margin:4mm 0 2mm;color:#0f172a;font-weight:900}
      .rule{width:120mm;height:2px;background:linear-gradient(90deg,transparent,#2563eb,transparent);margin:2mm auto 5mm}
      .presented{font-size:16px;color:#475569;margin:0}
      .student{font-family:Georgia,"Times New Roman",serif;font-size:34px;font-weight:900;color:#1d4ed8;margin:3mm 0;border-bottom:2px solid #93c5fd;min-width:150mm;padding:0 10mm 1.5mm}
      .statement{font-size:16px;line-height:1.5;max-width:215mm;color:#1f2937;margin:1mm auto 0}
      .highlight{font-weight:900;color:#0f172a}
      .details{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;width:205mm;margin:6mm auto 0;text-align:left}
      .detail{border:1px solid #bfdbfe;background:rgba(255,255,255,.75);border-radius:10px;padding:8px 12px;font-size:13px}
      .detail b{display:block;text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:#1d4ed8;margin-bottom:3px}
      .footer{display:grid;grid-template-columns:1fr;gap:5px;width:100%;margin-top:auto;padding-top:7mm;text-align:center}
      .code{text-align:center;font-family:"Courier New",monospace;font-size:12px;color:#334155}
      .digital-note{font-size:12px;color:#475569;font-weight:800}
      @media print{html,body{width:281mm;height:194mm;background:#fff;overflow:hidden}.toolbar{display:none}.certificate{margin:0;box-shadow:none;border:0;width:281mm;height:194mm;page-break-after:avoid;page-break-inside:avoid}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div><section class="certificate"><div class="corner"></div><div class="content"><div class="brand"><img class="logo" src="${safe(kahanLogo)}" alt="Kahan Technologies logo" /><div class="brand-text"><h2>Kahan Technologies Pvt Ltd.</h2><p>A portfolio company of Bennett, Coleman &amp; Co. Ltd. (BCCL), Times of India group.</p></div></div><div class="eyebrow">Skill Development Zone</div><h1>Certificate of Completion</h1><div class="rule"></div><p class="presented">This certificate is proudly awarded to</p><div class="student">${safe(cert.student || "Student")}</div><p class="statement">for successfully completing the <span class="highlight">${safe(cert.projecttitle || "Skill Development Project")}</span> project and clearing the certification assessment <span class="highlight">${safe(cert.examname || "Certification Examination")}</span>.</p><div class="details"><div class="detail"><b>Certificate Code</b>${safe(cert.certificatecode || "-")}</div><div class="detail"><b>Issue Date</b>${safe(cert.issuedate ? new Date(cert.issuedate).toLocaleDateString() : new Date().toLocaleDateString())}</div><div class="detail"><b>Student Email</b>${safe(cert.email || "-")}</div><div class="detail"><b>Registration No.</b>${safe(cert.regno || "-")}</div></div><div class="footer"><div class="code">Verify with Certificate Code: ${safe(cert.certificatecode || "-")}</div><div class="digital-note">This document is electronically generated and does not require a signature.</div></div></div></section><script>window.print()</script></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };
  return (
    <Stack spacing={2}>
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 2 }}
      >
        <Box
          role="alert"
          sx={{
            minWidth: { xs: "88vw", sm: 420 },
            maxWidth: 680,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            bgcolor: (toastColor[toast.severity] || toastColor.info).bg,
            border: `1px solid ${(toastColor[toast.severity] || toastColor.info).border}`,
            color: "#fff",
            boxShadow: "0 18px 45px rgba(15,23,42,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontWeight: 800,
            lineHeight: 1.35
          }}
          onClick={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Box>
      </Snackbar>
      {access.active ? <Alert severity="success">Access active till {fmt(access.data?.accesstill)}</Alert> : <Alert severity="warning">Browse projects and certifications. Payment is checked only when you open details.</Alert>}
      {paymentContext && (
        <Paper sx={{ p: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
          <Typography variant="h6" fontWeight={900}>Payment summary</Typography>
          <Typography color="text.secondary">Selected: {paymentContext.title}</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }} alignItems="center">
            <Grid item xs={12} md={2}><Typography><b>Fee:</b> {money(600)}</Typography></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Discount coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={validateCoupon}>Apply coupon</Button></Grid>
            <Grid item xs={12} md={2}><Typography><b>Discount:</b> {money(discount)}</Typography></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" disabled={paying} onClick={pay}>{paying ? "Opening Cashfree..." : `Pay ${money(payable)}`}</Button></Grid>
          </Grid>
        </Paper>
      )}
      {view === "projects" && <>
        <Typography variant="h6" fontWeight={900}>Projects</Typography>
        <Paper sx={{ p: 1 }}>
          <Tabs value={projectTab} onChange={(_, value) => { setProjectTab(value); setSelectedProjectSubmission(null); }} variant="scrollable" allowScrollButtonsMobile>
            <Tab label="Project search" />
            <Tab label={`Attempted / ongoing (${projectSubmissionsByStatus("ongoing").length})`} />
            <Tab label={`Accepted Projects (${projectSubmissionsByStatus("accepted").length})`} />
            <Tab label={`Redo (${projectSubmissionsByStatus("redo").length})`} />
          </Tabs>
        </Paper>
        {projectTab === 0 && (
          <>
            <Paper sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
                <CategoryMultiFilter value={projectCategories} options={options.projectCategories} onChange={(next) => { setProjectCategories(next); load(next, examCategories); }} label="Project categories" />
                <Button variant="contained" onClick={() => load()}>Search projects</Button>
              </Stack>
            </Paper>
            <Grid container spacing={2}>
              {projects.map((project) => <Grid item xs={12} md={4} key={project._id}><Card sx={{ height: "100%" }}><CardContent><Chip label={project.category} /><Typography variant="h6" fontWeight={900}>{project.projecttitle}</Typography><Typography color="text.secondary">{project.description}</Typography><Button sx={{ mt: 1 }} variant="contained" onClick={() => openProject(project)}>Details</Button></CardContent></Card></Grid>)}
            </Grid>
            {!projects.length && <Alert severity="info">No projects found for the selected category.</Alert>}
          </>
        )}
        {[1, 2, 3].includes(projectTab) && (
          <>
            <DataGrid
              autoHeight
              rows={rowsOf(projectSubmissionsByStatus(projectTab === 2 ? "accepted" : projectTab === 3 ? "redo" : "ongoing"))}
              columns={[
                { field: "projecttitle", headerName: "Project", flex: 1, minWidth: 220 },
                { field: "category", headerName: "Category", minWidth: 150 },
                { field: "status", headerName: "Status", width: 130 },
                { field: "percentage", headerName: "Project %", width: 120, valueFormatter: (p) => pct(p.value) },
                { field: "updatedAt", headerName: "Updated", width: 180, valueFormatter: (p) => fmt(p.value) },
                { field: "reviewercomments", headerName: "Reviewer comments", flex: 1, minWidth: 220 },
                { field: "redoinstructions", headerName: "Redo instructions", flex: 1, minWidth: 220 },
                {
                  field: "actions",
                  headerName: "Action",
                  width: projectTab === 2 ? 120 : 190,
                  renderCell: ({ row }) => projectTab === 2
                    ? <Button size="small" onClick={() => setSelectedProjectSubmission(row)}>View</Button>
                    : <Stack direction="row" spacing={1}><Button size="small" onClick={() => setSelectedProjectSubmission(row)}>Details</Button><Button size="small" variant="contained" onClick={() => openProjectFromSubmission(row)}>{projectTab === 3 ? "Resubmit" : "Open"}</Button></Stack>
                }
              ]}
            />
            {selectedProjectSubmission && (
              <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} sx={{ mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={900}>{selectedProjectSubmission.projecttitle}</Typography>
                    <Typography color="text.secondary">Status: {selectedProjectSubmission.status} | Score: {pct(selectedProjectSubmission.percentage)}</Typography>
                  </Box>
                  {projectTab !== 2 && <Button variant="contained" onClick={() => openProjectFromSubmission(selectedProjectSubmission)}>{projectTab === 3 ? "Resubmit project" : "Open project"}</Button>}
                </Stack>
                {selectedProjectSubmission.reviewercomments && <Alert severity="info" sx={{ mb: 1 }}><b>Reviewer comments:</b> {selectedProjectSubmission.reviewercomments}</Alert>}
                {selectedProjectSubmission.redoinstructions && <Alert severity="warning" sx={{ mb: 1 }}><b>Redo instructions:</b> {selectedProjectSubmission.redoinstructions}</Alert>}
                {(selectedProjectSubmission.responses || []).map((response, index) => (
                  <Paper key={response._id || response.stepid || index} variant="outlined" sx={{ p: 1.5, my: 1 }}>
                    <Typography fontWeight={900}>Step {index + 1}: {response.steptitle || response.stepid}</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}><b>Your response:</b> {response.response || "-"}</Typography>
                    {response.filelink && <Button href={response.filelink} target="_blank" size="small">Open uploaded file</Button>}
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip label={`Marks ${response.marksobtained || 0}/${response.maxmarks || 0}`} />
                      <Chip label={response.status || "Submitted"} variant="outlined" />
                    </Stack>
                    {response.aicomments && <Alert severity="info" sx={{ mt: 1 }}><b>AI comments:</b> {response.aicomments}</Alert>}
                    {response.usercomments && <Alert severity="warning" sx={{ mt: 1 }}><b>User comments:</b> {response.usercomments}</Alert>}
                  </Paper>
                ))}
              </Paper>
            )}
          </>
        )}
      </>}
      {view === "certifications" && <>
        <Typography variant="h6" fontWeight={900}>Certification exams</Typography>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
            <CategoryMultiFilter value={examCategories} options={options.examCategories} onChange={(next) => { setExamCategories(next); load(projectCategories, next); }} label="Exam categories" />
            <Button variant="contained" onClick={() => load()}>Search exams</Button>
          </Stack>
        </Paper>
        <Grid container spacing={2}>{certExams.map((exam) => <Grid item xs={12} md={6} key={exam._id}><StudentCertificationCard exam={exam} linkedProjects={linkedProjectsForExam(exam)} onDetails={openCertification} onShowMarks={showMarks} onGenerateCertificate={generateCertificate} /></Grid>)}</Grid>
        {selectedCertification && <Paper sx={{ p: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}><Box sx={{ flex: 1 }}><Typography variant="h6" fontWeight={900}>{selectedCertification.examname}</Typography><Typography color="text.secondary">Complete one linked project and pass this certification exam with {selectedCertification.passpercentage || 80}% or above.</Typography></Box><Button variant="contained" onClick={() => navigate(`/student-skill-development-exam?examid=${selectedCertification._id}&mode=certification`)}>Start examination</Button><Button variant="outlined" onClick={() => showMarks(selectedCertification)}>Show marks</Button><Button color="success" variant="outlined" onClick={() => generateCertificate(selectedCertification)}>Generate certificate</Button></Stack><Typography fontWeight={900} sx={{ mt: 2 }}>Related projects</Typography><Grid container spacing={1} sx={{ mt: 0.5 }}>{linkedProjectsForExam(selectedCertification).map((project) => <Grid item xs={12} md={4} key={project._id}><Card variant="outlined"><CardContent><Typography fontWeight={900}>{project.projecttitle}</Typography><Button size="small" onClick={() => openProject(project)}>Open project</Button></CardContent></Card></Grid>)}</Grid>{marksExam && String(marksExam._id) === String(selectedCertification._id) && <><Typography variant="h6" fontWeight={900} sx={{ mt: 2 }}>Scores</Typography><AttemptsView attempts={attempts.filter((item) => String(item.examid) === String(selectedCertification._id))} showCorrect={false} showSelected={false} showSectionSummary /></>}</Paper>}
      </>}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6" fontWeight={900}>Certificates</Typography></Stack>
        <DataGrid sx={{ mt: 1 }} autoHeight rows={rowsOf(certificates)} columns={[{ field: "certificatecode", headerName: "Certificate", minWidth: 190 }, { field: "projecttitle", headerName: "Project", flex: 1 }, { field: "examname", headerName: "Exam", flex: 1 }, { field: "issuedate", headerName: "Issue date", minWidth: 180, valueFormatter: (p) => fmt(p.value) }, { field: "print", headerName: "Print", width: 120, renderCell: ({ row }) => <Button size="small" startIcon={<Print />} onClick={() => printCertificate(row)}>Print</Button> }]} />
      </Paper>
    </Stack>
  );
}

export function StudentSkillDevelopmentProjectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const projectid = params.get("projectid");
  const [project, setProject] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [projectRes, submissionRes] = await Promise.all([
        ep1.get(`${api}/projects`, { params: { id: projectid, status: "Published" } }),
        ep1.get(`${api}/project-submissions`, { params: { email: currentEmail() } })
      ]);
      const selected = projectRes.data?.data?.[0];
      if (!selected) throw new Error("Project not found.");
      const latest = (submissionRes.data?.data || []).find((item) => String(item.projectid) === String(projectid));
      setProject(selected);
      setSubmission(latest || null);
      const saved = {};
      (latest?.responses || []).forEach((item) => {
        saved[item.stepid] = { stepid: item.stepid, response: item.response || "", filelink: item.filelink || "" };
      });
      setResponses(saved);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to load project.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectid]);
  const submitProject = async () => {
    if (!project) return;
    setLoading(true);
    try {
      await ep1.post(`${api}/projects/submit`, { projectid: project._id, responses: Object.values(responses), student: currentName(), email: currentEmail(), regno: global1.regno, colid: global1.colid });
      setMessage("Project submitted for AI/user review.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to submit project.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <MenuPageShell title="Skill development project" menuType="student">
      <Box sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={900}>{project?.projecttitle || "Project"}</Typography>
            <Typography color="text.secondary">{project?.category}</Typography>
          </Box>
          <Button onClick={() => navigate("/student-skill-development-zone")}>Back</Button>
        </Stack>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {message && <Alert severity={message.includes("Unable") || message.includes("not found") ? "warning" : "info"} sx={{ mb: 2 }}>{message}</Alert>}
        {submission && <Alert severity="info" sx={{ mb: 2 }}>Previous submission loaded. Current status: {submission.status}{submission.reviewercomments ? ` - ${submission.reviewercomments}` : ""}{submission.redoinstructions ? ` - ${submission.redoinstructions}` : ""}</Alert>}
        {project && (
          <Paper sx={{ p: 2 }}>
            <Typography sx={{ mb: 2 }}>{project.description}</Typography>
            {(project.steps || []).map((step, index) => {
              const savedStep = (submission?.responses || []).find((item) => String(item.stepid) === String(step._id));
              return <Paper key={step._id} variant="outlined" sx={{ p: 1.5, my: 1 }}><Typography fontWeight={900}>Step {index + 1}: {step.steptitle}</Typography><Typography>{step.description}</Typography><Typography sx={{ whiteSpace: "pre-wrap", my: 1 }}><b>Task:</b> {step.task}</Typography>{step.imagelink && <Button href={step.imagelink} target="_blank">Open step file</Button>}{savedStep?.aicomments && <Alert severity="info" sx={{ mt: 1 }}><b>AI comments:</b> {savedStep.aicomments}</Alert>}{savedStep?.usercomments && <Alert severity="warning" sx={{ mt: 1 }}><b>Reviewer comments:</b> {savedStep.usercomments}</Alert>}<TextField fullWidth multiline minRows={4} sx={{ mt: 1 }} label="Your response" value={responses[step._id]?.response || ""} onChange={(e) => setResponses((p) => ({ ...p, [step._id]: { ...(p[step._id] || {}), stepid: step._id, response: e.target.value } }))} /><Box sx={{ mt: 1 }}><AwsUploadButton folder="skill-development/student-project" onUploaded={({ url }) => setResponses((p) => ({ ...p, [step._id]: { ...(p[step._id] || {}), stepid: step._id, filelink: url } }))} /></Box>{responses[step._id]?.filelink && <Button href={responses[step._id].filelink} target="_blank">Open uploaded file</Button>}</Paper>;
            })}
            <Button variant="contained" disabled={loading} onClick={submitProject}>Submit project</Button>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}

function SkillDevelopmentPasswordGate({ children }) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("skillDevelopmentAdminUnlocked") === "Yes");
  const [error, setError] = useState("");
  const unlock = () => {
    if (password === "kumropatash") {
      sessionStorage.setItem("skillDevelopmentAdminUnlocked", "Yes");
      setUnlocked(true);
      setError("");
    } else {
      setError("Invalid password.");
    }
  };
  if (unlocked) return children;
  return (
    <MenuPageShell title="Skill development">
      <Box sx={{ p: 2, maxWidth: 520 }}>
        <Typography variant="h4" fontWeight={900}>Skill development</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Enter password to access this module.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField fullWidth type="password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") unlock(); }} />
          <Button variant="contained" onClick={unlock}>Unlock</Button>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

function ReviewWorkspace() {
  const statusTabs = [
    { label: "Pending", statuses: ["Submitted", "Evaluated", "Redo"] },
    { label: "Approved", statuses: ["Accepted"] },
    { label: "Rejected", statuses: ["Rejected"] }
  ];
  const [tab, setTab] = useState(0);
  const [options, setOptions] = useState({});
  const [projects, setProjects] = useState([]);
  const [projectCategories, setProjectCategories] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [rows, setRows] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stepResponses, setStepResponses] = useState([]);
  const [reviewercomments, setReviewercomments] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const loadProjects = async (nextCategories = projectCategories, nextText = projectFilter) => {
    const [optionRes, projectRes] = await Promise.all([
      ep1.get(`${api}/options`, { params: { colid: global1.colid } }),
      ep1.get(`${api}/projects`, { params: { status: "Published", categories: nextCategories.join(","), projecttitle: nextText } })
    ]);
    setOptions(optionRes.data || {});
    setProjects(projectRes.data?.data || []);
  };
  const load = async () => {
    setLoading(true);
    const status = statusTabs[tab].statuses.join(",");
    const params = selectedProject ? { projectid: selectedProject._id } : {};
    const [subRes, attemptRes] = await Promise.all([
      ep1.get(`${api}/project-submissions`, { params }),
      ep1.get(`${api}/attempts`, { params: { zone: "Certification" } })
    ]);
    const filtered = (subRes.data?.data || []).filter((row) => status.split(",").includes(row.status || "Submitted"));
    setRows(subRes.data?.data || []);
    setRows(filtered);
    setAttempts(attemptRes.data?.data || []);
    setSelected((prev) => {
      if (!prev) return null;
      const next = filtered.find((row) => row._id === prev._id);
      return next || null;
    });
    setLoading(false);
  };
  useEffect(() => { loadProjects().catch(() => {}); }, []);
  useEffect(() => { load().catch(() => setLoading(false)); }, [tab, selectedProject]);
  useEffect(() => {
    setStepResponses((selected?.responses || []).map((item) => ({ ...item })));
    setReviewercomments(selected?.reviewercomments || selected?.redoinstructions || "");
  }, [selected]);
  const evaluate = async (row) => {
    setLoading(true);
    await ep1.post(`${api}/projects/evaluate`, { id: row._id, colid: global1.colid, provider: "" });
    setMessage("Project evaluated.");
    await load();
  };
  const review = async (row, status) => {
    const finalStatus = status === "Accepted" ? "Accepted" : "Rejected";
    await ep1.post(`${api}/projects/review`, {
      id: row._id,
      status: finalStatus,
      reviewercomments,
      redoinstructions: finalStatus === "Rejected" ? reviewercomments : "",
      responses: stepResponses
    });
    setMessage(finalStatus === "Accepted" ? "Project approved." : "Project sent back for redo.");
    setSelected(null);
    await load();
  };
  const updateStep = (index, patch) => setStepResponses((prev) => prev.map((item, idx) => idx === index ? { ...item, ...patch } : item));
  return (
    <Stack spacing={2}>
      {message && <Alert severity="success">{message}</Alert>}
      {loading && <LinearProgress />}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>Select project</Typography>
        <Grid container spacing={2} alignItems="flex-start" sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={4}><CategoryMultiFilter value={projectCategories} options={options.projectCategories} onChange={(next) => { setProjectCategories(next); loadProjects(next, projectFilter); }} label="Project category" /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Project search" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={() => loadProjects(projectCategories, projectFilter)}>Search</Button></Grid>
          <Grid item xs={12} md={3}><Autocomplete options={projects} value={selectedProject} onChange={(_, value) => { setSelectedProject(value); setSelected(null); }} getOptionLabel={(item) => item?.projecttitle || ""} renderInput={(params) => <TextField {...params} label="Project" />} /></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_, value) => { setTab(value); setSelected(null); }} variant="scrollable" scrollButtons="auto">
          {statusTabs.map((item) => <Tab key={item.label} label={item.label} />)}
        </Tabs>
        <DataGrid
          autoHeight
          loading={loading}
          rows={rowsOf(rows)}
          slots={{ toolbar: GridToolbar }}
          onRowClick={({ row }) => setSelected(row)}
          columns={[
            { field: "student", headerName: "Student", minWidth: 190 },
            { field: "email", headerName: "Email", minWidth: 220 },
            { field: "regno", headerName: "Regno", minWidth: 130 },
            { field: "projecttitle", headerName: "Project", flex: 1 },
            { field: "status", headerName: "Status", minWidth: 130 },
            { field: "percentage", headerName: "Project %", minWidth: 120, valueFormatter: (p) => pct(p.value) },
            { field: "updatedAt", headerName: "Updated", minWidth: 190, valueFormatter: (p) => fmt(p.value) }
          ]}
        />
      </Paper>
      {selected && (
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={900}>{selected.student} - {selected.projecttitle}</Typography>
              <Typography color="text.secondary">{selected.email} | {selected.regno} | {selected.status}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => evaluate(selected)}>Evaluate with AI</Button>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {stepResponses.map((response, index) => (
              <Grid item xs={12} key={response._id || response.stepid || index}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography fontWeight={900}>Step {index + 1}: {response.steptitle}</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap", my: 1 }}>{response.response || "-"}</Typography>
                  {response.filelink && <Button href={response.filelink} target="_blank">Open submitted file</Button>}
                  {response.aicomments && <Alert severity="info" sx={{ my: 1 }}><b>AI comments:</b> {response.aicomments}</Alert>}
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={2}><TextField fullWidth type="number" label={`Marks / ${response.maxmarks || 0}`} value={response.marksobtained ?? 0} onChange={(e) => updateStep(index, { marksobtained: e.target.value })} /></Grid>
                    <Grid item xs={12} md={10}><TextField fullWidth multiline minRows={2} label="Manual comments" value={response.usercomments || ""} onChange={(e) => updateStep(index, { usercomments: e.target.value })} /></Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <TextField fullWidth multiline minRows={3} sx={{ mt: 2 }} label="Final reviewer comments / redo instructions" value={reviewercomments} onChange={(e) => setReviewercomments(e.target.value)} />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
            <Button variant="contained" color="success" onClick={() => review(selected, "Accepted")}>Accept</Button>
            <Button variant="contained" color="warning" onClick={() => review(selected, "Rejected")}>Ask student to redo</Button>
          </Stack>
        </Paper>
      )}
      <Paper sx={{ p: 1 }}>
        <Typography variant="h6" fontWeight={900} sx={{ p: 1 }}>Certification attempts</Typography>
        <DataGrid autoHeight rows={rowsOf(attempts)} slots={{ toolbar: GridToolbar }} columns={[{ field: "student", headerName: "Student", minWidth: 170 }, { field: "email", headerName: "Email", minWidth: 220 }, { field: "examname", headerName: "Exam", flex: 1 }, { field: "marksobtained", headerName: "Marks", width: 100 }, { field: "totalmarks", headerName: "Total", width: 100 }, { field: "percentage", headerName: "%", width: 100 }, { field: "passstatus", headerName: "Status", width: 120 }]} />
      </Paper>
    </Stack>
  );
}

export function SkillDevelopmentZonePage() {
  const [tab, setTab] = useState(0);
  return (
    <SkillDevelopmentPasswordGate>
      <MenuPageShell title="Skill development">
        <Box sx={{ p: 2 }}>
          <Typography variant="h4" fontWeight={900}>Skill development zone</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Special global zone. These records are intentionally not scoped by institution/colid.</Typography>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
            <Tab label="Practice test" />
            <Tab label="Projects" />
            <Tab label="Certification exam" />
            <Tab label="Certification links" />
            <Tab label="Coupon codes" />
            <Tab label="Classes" />
            <Tab label="Class registrations" />
            <Tab label="Review and certificates" />
          </Tabs>
          {tab === 0 && <ExamAdmin zone="Practice" title="Practice test" />}
          {tab === 1 && <ProjectAdmin />}
          {tab === 2 && <ExamAdmin zone="Certification" title="Certification online examination" />}
          {tab === 3 && <CertificationLinkAdmin />}
          {tab === 4 && <CouponAdmin />}
          {tab === 5 && <ClassAdmin />}
          {tab === 6 && <ClassRegistrationAdmin />}
          {tab === 7 && <ReviewWorkspace />}
        </Box>
      </MenuPageShell>
    </SkillDevelopmentPasswordGate>
  );
}

export function StudentSkillDevelopmentZonePage() {
  const [tab, setTab] = useState(0);
  return (
    <MenuPageShell title="Skill development" menuType="student">
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" fontWeight={900}>Skill development</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Practice tests are open. Project and certification access requires Rs. 600 monthly access.</Typography>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
          <Tab label="Practice tests" />
          <Tab label="Projects" />
          <Tab label="Certification" />
          <Tab label="Classes" />
          <Tab label="Past purchases" />
        </Tabs>
        {tab === 0 && <StudentPracticeTests />}
        {tab === 1 && <StudentProjectCertification view="projects" />}
        {tab === 2 && <StudentProjectCertification view="certifications" />}
        {tab === 3 && <StudentClasses />}
        {tab === 4 && <StudentSkillPurchases />}
      </Box>
    </MenuPageShell>
  );
}
