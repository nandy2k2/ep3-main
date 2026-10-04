import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MicIcon from "@mui/icons-material/Mic";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import StopIcon from "@mui/icons-material/Stop";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankAgent = {
  title: "",
  topic: "",
  keywords: "",
  additionalprompt: "",
  mode: "Moderate",
  difficulty: "Medium",
  timelimitminutes: 15,
  provider: "Gemini",
  geminimodel: "gemini-2.5-flash-lite",
  ollamaconfigid: "",
  active: "Yes",
  status: "Active"
};

const scoped = (payload = {}) => ({
  ...payload,
  colid: global1.colid,
  user: global1.user,
  name: global1.name
});

const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const printHtml = (html) => {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
};

export function AiRecruitmentInterviewAgentPage() {
  const [form, setForm] = useState(blankAgent);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [options, setOptions] = useState({ geminiModels: [], ollamaConfigurations: [], modes: ["Aggressive", "Moderate", "Sober"], difficulties: ["Easy", "Medium", "Difficult", "Expert"] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/ai-recruitment-interview/options", { params: scoped() });
    setOptions(res.data || options);
  }, []);
  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/ai-recruitment-interview/agents", { params: scoped({ search }) });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load AI recruitment interview agents");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadOptions().catch(() => {});
    loadRows();
    // Load is button-driven after initial render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await ep1.post("/api/v2/ai-recruitment-interview/agents", scoped({ ...form, _id: editId }));
      setMessage(editId ? "Agent updated" : "Agent created");
      setForm(blankAgent);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save agent");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditId(row._id);
    setForm({
      title: row.title || "",
      topic: row.topic || "",
      keywords: (row.keywords || []).join(", "),
      additionalprompt: row.additionalprompt || "",
      mode: row.mode || "Moderate",
      difficulty: row.difficulty || "Medium",
      timelimitminutes: row.timelimitminutes || 15,
      provider: row.provider || "Gemini",
      geminimodel: row.geminimodel || "gemini-2.5-flash-lite",
      ollamaconfigid: row.ollamaconfigid || "",
      active: row.active || "Yes",
      status: row.status || "Active"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    setSaving(true);
    try {
      await ep1.post("/api/v2/ai-recruitment-interview/agents-delete", scoped({ ids: selectedIds }));
      setSelectedIds([]);
      await loadRows();
      setMessage("Selected agents deleted");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected agents");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "title", headerName: "Title", minWidth: 180, flex: 0.8 },
    { field: "topic", headerName: "Topic", minWidth: 260, flex: 1.2 },
    { field: "difficulty", headerName: "Difficulty", minWidth: 120 },
    { field: "timelimitminutes", headerName: "Time limit", minWidth: 110 },
    { field: "mode", headerName: "Mode", minWidth: 110 },
    { field: "provider", headerName: "Provider", minWidth: 110 },
    { field: "active", headerName: "Active", minWidth: 90 },
    { field: "actions", type: "actions", headerName: "Actions", width: 90, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />] }
  ];

  return (
    <MenuPageShell title="AI Recruitment Interview Agent">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Interview topic" value={form.topic} onChange={(e) => setField("topic", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Keywords (comma separated)" value={form.keywords} onChange={(e) => setField("keywords", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Mode" value={form.mode} onChange={(e) => setField("mode", e.target.value)}>{(options.modes || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Difficulty" value={form.difficulty} onChange={(e) => setField("difficulty", e.target.value)}>{(options.difficulties || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Time limit minutes" value={form.timelimitminutes} onChange={(e) => setField("timelimitminutes", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Active" value={form.active} onChange={(e) => setField("active", e.target.value)}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Additional AI prompts" value={form.additionalprompt} onChange={(e) => setField("additionalprompt", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="AI provider" value={form.provider} onChange={(e) => setField("provider", e.target.value)}><MenuItem value="Gemini">Gemini</MenuItem><MenuItem value="Ollama">Ollama</MenuItem></TextField></Grid>
            <Grid item xs={12} md={4}><Autocomplete options={options.geminiModels || []} value={form.geminimodel || ""} onChange={(_, value) => setField("geminimodel", value || "")} renderInput={(params) => <TextField {...params} label="Gemini model" />} /></Grid>
            <Grid item xs={12} md={4}><Autocomplete options={options.ollamaConfigurations || []} value={(options.ollamaConfigurations || []).find((row) => row._id === form.ollamaconfigid) || null} getOptionLabel={(option) => option?.name ? `${option.name} (${option.modelname || ""})` : ""} onChange={(_, value) => setField("ollamaconfigid", value?._id || "")} renderInput={(params) => <TextField {...params} label="Ollama configuration" />} /></Grid>
            <Grid item xs={12} md={1}><Button fullWidth variant="contained" sx={{ height: 56 }} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>Save</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1 }}>
            <TextField size="small" label="Search agents" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={loadRows}>Load</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selectedIds.length || saving} onClick={deleteSelected}>Bulk delete</Button>
          </Stack>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Box sx={{ height: 470 }}><DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selectedIds} onRowSelectionModelChange={(ids) => setSelectedIds(ids)} slots={{ toolbar: GridToolbar }} /></Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function PublicAiRecruitmentInterviewPage() {
  const { token } = useParams();
  const [bundle, setBundle] = useState(null);
  const [history, setHistory] = useState([]);
  const [answer, setAnswer] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [completed, setCompleted] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const answerTimerRef = useRef(null);
  const latestAnswerRef = useRef("");
  const runningRef = useRef(false);
  const thinkingRef = useRef(false);
  const mutedRef = useRef(false);
  const speakerRef = useRef(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    ep1.get(`/api/v2/public/ai-recruitment-interview/${token}`).then((res) => setBundle(res.data)).catch((err) => setError(err.response?.data?.message || "Unable to load interview"));
  }, [token]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { thinkingRef.current = thinking; }, [thinking]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, thinking, answer]);
  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel?.();
    timerRef.current && clearInterval(timerRef.current);
    answerTimerRef.current && clearTimeout(answerTimerRef.current);
  }, []);

  const beginCountdown = (assignment) => {
    timerRef.current && clearInterval(timerRef.current);
    const started = assignment.startedat ? new Date(assignment.startedat).getTime() : Date.now();
    const end = started + (Number(assignment.timelimitminutes || 15) * 60000);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        timerRef.current && clearInterval(timerRef.current);
        finishInterview();
      }
    }, 1000);
  };

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return setError("Speech recognition is not supported in this browser. Please type the answer.");
    if (recognitionRef.current || speakerRef.current) return;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (runningRef.current && !thinkingRef.current && !speakerRef.current) setTimeout(() => startListening(), 700);
    };
    recognition.onerror = (event) => {
      if (event.error && !["no-speech", "aborted"].includes(event.error)) setError(`Listening error: ${event.error}`);
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const piece = result?.[0]?.transcript || "";
        if (result.isFinal) finalText += piece;
        else interim += piece;
      }
      if (finalText) {
        const heard = [latestAnswerRef.current, finalText].filter(Boolean).join(" ").trim();
        latestAnswerRef.current = heard;
        setAnswer(heard);
        answerTimerRef.current && clearTimeout(answerTimerRef.current);
        answerTimerRef.current = setTimeout(() => sendAnswer(heard), 1400);
      } else if (interim) {
        setAnswer([latestAnswerRef.current, interim].filter(Boolean).join(" ").trim());
      }
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { recognitionRef.current = null; setListening(false); }
  }, []);

  const speak = useCallback((value) => {
    if (mutedRef.current || !("speechSynthesis" in window)) {
      if (runningRef.current) setTimeout(() => startListening(), 500);
      return;
    }
    const active = recognitionRef.current;
    recognitionRef.current = null;
    active?.stop?.();
    setListening(false);
    speakerRef.current = true;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "en-IN";
    utterance.onend = () => {
      speakerRef.current = false;
      if (runningRef.current) setTimeout(() => startListening(), 600);
    };
    utterance.onerror = utterance.onend;
    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  const addInterviewer = useCallback((value) => {
    setHistory((prev) => [...prev, { role: "Interviewer", text: value, time: new Date().toLocaleTimeString() }]);
    speak(value);
  }, [speak]);

  const startInterview = async () => {
    setThinking(true);
    thinkingRef.current = true;
    try {
      const res = await ep1.post(`/api/v2/public/ai-recruitment-interview/${token}/start`);
      setBundle((old) => ({ ...(old || {}), assignment: res.data.assignment }));
      setHistory((res.data.assignment?.transcript || []).map((item) => ({ ...item, time: item.time ? new Date(item.time).toLocaleTimeString() : new Date().toLocaleTimeString() })));
      setRunning(true);
      runningRef.current = true;
      beginCountdown(res.data.assignment);
      speak(res.data.response);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start interview");
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  };

  async function sendAnswer(value) {
    const content = String(value || answer || manualAnswer || "").trim();
    if (!content || thinkingRef.current || !runningRef.current) return;
    answerTimerRef.current && clearTimeout(answerTimerRef.current);
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    latestAnswerRef.current = "";
    setAnswer("");
    setManualAnswer("");
    setHistory((prev) => [...prev, { role: "Candidate", text: content, time: new Date().toLocaleTimeString() }]);
    setThinking(true);
    thinkingRef.current = true;
    try {
      const res = await ep1.post(`/api/v2/public/ai-recruitment-interview/${token}/respond`, { answer: content });
      setBundle((old) => ({ ...(old || {}), assignment: res.data.assignment }));
      addInterviewer(res.data.response || "Please continue.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit answer");
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  }

  async function finishInterview() {
    if (completed) return;
    setRunning(false);
    runningRef.current = false;
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel?.();
    setThinking(true);
    thinkingRef.current = true;
    try {
      const res = await ep1.post(`/api/v2/public/ai-recruitment-interview/${token}/complete`);
      setCompleted(res.data.assignment);
      setBundle((old) => ({ ...(old || {}), assignment: res.data.assignment }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to complete interview");
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  const assignment = bundle?.assignment || {};
  const agent = bundle?.agent || {};

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef4ff", p: { xs: 1.5, md: 4 } }}>
      <Paper sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={900}>AI Recruitment Interview</Typography>
            <Typography color="text.secondary">{assignment.candidate} | {assignment.jobtitle} | {agent.difficulty}</Typography>
          </Box>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {completed && <Alert severity="success">Interview completed. Score: {completed.percentage}% | Recommendation: {completed.recommendation}</Alert>}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <Chip label={running ? "Interview running" : assignment.status || "Assigned"} color={running ? "success" : "default"} />
            <Chip label={`Time left ${minutes}:${seconds}`} color={remaining <= 60 && running ? "error" : "primary"} />
            <Chip label={listening ? "Listening" : "Not listening"} color={listening ? "primary" : "default"} />
            <Chip label={thinking ? "Processing" : "Ready"} color={thinking ? "warning" : "default"} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={running || thinking || assignment.status === "Completed"} onClick={startInterview}>Start interview</Button>
            <Button variant="outlined" startIcon={listening ? <StopIcon /> : <MicIcon />} disabled={!running || thinking} onClick={listening ? finishInterview : startListening}>{listening ? "Finish interview" : "Listen"}</Button>
            <Button variant="outlined" startIcon={muted ? <VolumeOffIcon /> : <VolumeUpIcon />} onClick={() => setMuted((prev) => !prev)}>{muted ? "Voice muted" : "Voice on"}</Button>
            <Button variant="outlined" color="success" disabled={!running || thinking} onClick={finishInterview}>Submit final</Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 1.5, height: 420, overflowY: "auto", bgcolor: "#f8fafc" }}>
                <Stack spacing={1.25}>
                  {history.map((item, index) => (
                    <Box key={index} sx={{ display: "flex", justifyContent: item.role === "Interviewer" ? "flex-end" : "flex-start" }}>
                      <Paper sx={{ p: 1.25, maxWidth: "84%", bgcolor: item.role === "Interviewer" ? "#dbeafe" : "#fff" }}>
                        <Typography variant="caption" color="text.secondary">{item.role} · {item.time}</Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.text}</Typography>
                      </Paper>
                    </Box>
                  ))}
                  {thinking && <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={18} /><Typography>Processing...</Typography></Stack>}
                  <div ref={bottomRef} />
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack spacing={1.5}>
                <TextField fullWidth multiline minRows={5} label="Live answer" value={answer} onChange={(e) => { setAnswer(e.target.value); latestAnswerRef.current = e.target.value; }} />
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" disabled={!running || !answer.trim() || thinking} onClick={() => sendAnswer(answer)}>Send answer</Button>
                  <Tooltip title="Clear answer text"><IconButton onClick={() => { setAnswer(""); latestAnswerRef.current = ""; }}><DeleteIcon /></IconButton></Tooltip>
                </Stack>
                <TextField fullWidth multiline minRows={4} label="Manual answer" value={manualAnswer} onChange={(e) => setManualAnswer(e.target.value)} />
                <Button variant="contained" disabled={!running || !manualAnswer.trim() || thinking} onClick={() => sendAnswer(manualAnswer)}>Send manual answer</Button>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Box>
  );
}

export function AiRecruitmentInterviewScoreReportPage() {
  const [filters, setFilters] = useState({ search: "", jobid: "", status: "", shortlisted: "", fromdate: "", todate: "", minScore: 70 });
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/ai-recruitment-interview/assignments", { params: scoped(filters) });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load interview scores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const summary = useMemo(() => {
    const completed = rows.filter((row) => row.status === "Completed");
    const avg = completed.length ? completed.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / completed.length : 0;
    return { total: rows.length, completed: completed.length, shortlisted: rows.filter((row) => row.shortlisted === "Yes").length, avg: avg.toFixed(2) };
  }, [rows]);

  const shortlist = async () => {
    try {
      const res = await ep1.post("/api/v2/ai-recruitment-interview/shortlist-by-score", scoped({ ids: selectedIds, minScore: filters.minScore }));
      setMessage(`Shortlisted ${res.data?.updated || 0} candidates`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to shortlist candidates");
    }
  };

  const print = () => {
    const html = `<!doctype html><html><head><title>AI Recruitment Interview Score Report</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px}.header{text-align:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px}.logo{height:55px;object-fit:contain}table{width:100%;border-collapse:collapse}th,td{border:1px solid #888;padding:4px;vertical-align:top}th{background:#eef2f7}</style></head><body><div class="header">${global1.logo ? `<img class="logo" src="${safe(global1.logo)}"/>` : ""}<h2>${safe(global1.insname || "Institution")}</h2><div>${safe(global1.address || "")}</div><h3>AI Recruitment Interview Score Report</h3></div><table><thead><tr>${["Candidate","Email","Job","Form","Agent","Date","Score","Recommendation","Status","Shortlisted","Summary"].map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td>${safe(row.candidate)}</td><td>${safe(row.candidateemail)}</td><td>${safe(row.jobtitle || row.jobid)}</td><td>${safe(row.formname || row.formid)}</td><td>${safe(row.agenttitle)}</td><td>${safe(row.completedat ? new Date(row.completedat).toLocaleString() : "")}</td><td>${safe(row.percentage)}</td><td>${safe(row.recommendation)}</td><td>${safe(row.status)}</td><td>${safe(row.shortlisted)}</td><td>${safe(row.summary)}</td></tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`;
    printHtml(html);
  };

  const columns = [
    { field: "candidate", headerName: "Candidate", minWidth: 180, flex: 1 },
    { field: "candidateemail", headerName: "Email", minWidth: 210 },
    { field: "jobtitle", headerName: "Job", minWidth: 200, flex: 1 },
    { field: "formname", headerName: "Form", minWidth: 160 },
    { field: "agenttitle", headerName: "Agent", minWidth: 190, flex: 1 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "percentage", headerName: "Score %", minWidth: 100 },
    { field: "recommendation", headerName: "Recommendation", minWidth: 130 },
    { field: "shortlisted", headerName: "Shortlisted", minWidth: 120 },
    { field: "summary", headerName: "AI summary", minWidth: 260, flex: 1.4, renderCell: ({ value }) => <Typography sx={{ whiteSpace: "normal", lineHeight: 1.35 }}>{value}</Typography> },
    { field: "link", headerName: "Link", minWidth: 250, renderCell: ({ value }) => value ? <a href={value} target="_blank" rel="noreferrer">{value}</a> : "" }
  ];

  return (
    <MenuPageShell title="AI Recruitment Interview Score Report">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Grid container spacing={2}>
          {[
            ["Total", summary.total],
            ["Completed", summary.completed],
            ["Shortlisted", summary.shortlisted],
            ["Average %", summary.avg]
          ].map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}
        </Grid>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Job ID" value={filters.jobid} onChange={(e) => setFilters({ ...filters, jobid: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><MenuItem value="">All</MenuItem>{["Assigned","In Progress","Completed","Time Over"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Shortlisted" value={filters.shortlisted} onChange={(e) => setFilters({ ...filters, shortlisted: e.target.value })}><MenuItem value="">All</MenuItem><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.fromdate} onChange={(e) => setFilters({ ...filters, fromdate: e.target.value })} /></Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.todate} onChange={(e) => setFilters({ ...filters, todate: e.target.value })} /></Grid>
            <Grid item xs={12} md={1}><Button fullWidth variant="contained" disabled={loading} onClick={load}>Load</Button></Grid>
          </Grid>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2 }}>
            <TextField size="small" type="number" label="Shortlist min score" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })} />
            <Button variant="outlined" color="success" disabled={!selectedIds.length} onClick={shortlist}>Shortlist selected by score</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={print}>Print preview</Button>
          </Stack>
        </Paper>
        <Paper sx={{ p: 2 }}>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Box sx={{ height: 560 }}><DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selectedIds} onRowSelectionModelChange={(ids) => setSelectedIds(ids)} slots={{ toolbar: GridToolbar }} sx={{ "& .MuiDataGrid-cell": { alignItems: "flex-start", whiteSpace: "normal", lineHeight: 1.35, py: 1 } }} /></Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
