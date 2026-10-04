import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import StopIcon from "@mui/icons-material/Stop";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blank = {
  title: "",
  topic: "",
  keywords: "",
  additionalprompt: "",
  mode: "Moderate",
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

const modeHelp = {
  Aggressive: "Tough interview mode: sharper questions, more probing, and less tolerance for vague answers.",
  Moderate: "Balanced interview mode: clear assessment and natural follow-up questions.",
  Sober: "Supportive interview mode: calm tone, patient follow-ups, and slower pace."
};

export default function AiVoiceInterviewPage() {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [options, setOptions] = useState({ geminiModels: [], ollamaConfigurations: [], modes: ["Aggressive", "Moderate", "Sober"] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const answerTimerRef = useRef(null);
  const latestAnswerRef = useRef("");
  const runningRef = useRef(false);
  const selectedAgentRef = useRef(null);
  const historyRef = useRef([]);
  const thinkingRef = useRef(false);
  const mutedRef = useRef(false);
  const interviewerSpeakingRef = useRef(false);
  const bottomRef = useRef(null);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const loadOptions = useCallback(async () => {
    const response = await ep1.get("/api/v2/ai-interview-agents/options", { params: scoped() });
    setOptions(response.data || { geminiModels: [], ollamaConfigurations: [], modes: ["Aggressive", "Moderate", "Sober"] });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ep1.get("/api/v2/ai-interview-agents", { params: scoped({ search }) });
      setRows(response.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load interview agents");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadOptions().catch(() => {});
    loadRows();
    // Search loads only when Load is clicked, so typing stays responsive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { selectedAgentRef.current = selectedAgent; }, [selectedAgent]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { thinkingRef.current = thinking; }, [thinking]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, thinking, candidateAnswer]);

  useEffect(() => () => {
    answerTimerRef.current && clearTimeout(answerTimerRef.current);
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel?.();
  }, []);

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Please use typed answer.");
      return;
    }
    if (recognitionRef.current || interviewerSpeakingRef.current) return;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (runningRef.current && !thinkingRef.current && !interviewerSpeakingRef.current) {
        setTimeout(() => startListening(), 600);
      }
    };
    recognition.onerror = (event) => {
      if (event.error && !["no-speech", "aborted"].includes(event.error)) {
        setError(`Listening error: ${event.error}`);
      }
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
        setCandidateAnswer(heard);
        answerTimerRef.current && clearTimeout(answerTimerRef.current);
        answerTimerRef.current = setTimeout(() => submitAnswer(heard), 1500);
      } else if (interim) {
        setCandidateAnswer([latestAnswerRef.current, interim].filter(Boolean).join(" ").trim());
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }, []);

  const speak = useCallback((value) => {
    if (mutedRef.current || !("speechSynthesis" in window)) {
      if (runningRef.current) setTimeout(() => startListening(), 500);
      return;
    }
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    activeRecognition?.stop?.();
    setListening(false);
    interviewerSpeakingRef.current = true;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "en-IN";
    utterance.rate = selectedAgentRef.current?.mode === "Aggressive" ? 1.06 : selectedAgentRef.current?.mode === "Sober" ? 0.92 : 1;
    utterance.onend = () => {
      interviewerSpeakingRef.current = false;
      if (runningRef.current) setTimeout(() => startListening(), 600);
    };
    utterance.onerror = utterance.onend;
    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  const addInterviewerMessage = useCallback((value) => {
    setHistory((prev) => {
      const next = [...prev, { role: "Interviewer", text: value, time: new Date().toLocaleTimeString() }];
      historyRef.current = next;
      return next;
    });
    speak(value);
  }, [speak]);

  async function submitAnswer(value) {
    const agent = selectedAgentRef.current;
    const content = String(value || candidateAnswer || manualAnswer || "").trim();
    if (!agent?._id || !content || thinkingRef.current) return;
    answerTimerRef.current && clearTimeout(answerTimerRef.current);
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    activeRecognition?.stop?.();
    setCandidateAnswer("");
    latestAnswerRef.current = "";
    setManualAnswer("");
    const nextHistory = [...historyRef.current, { role: "Candidate", text: content, time: new Date().toLocaleTimeString() }];
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setThinking(true);
    thinkingRef.current = true;
    setError("");
    try {
      const response = await ep1.post("/api/v2/ai-interview-agents-respond", scoped({
        id: agent._id,
        answer: content,
        history: nextHistory.slice(-12)
      }));
      addInterviewerMessage(response.data?.response || "Thank you. Please explain that with more detail.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assess answer");
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  }

  const startInterview = async (agent = selectedAgent) => {
    if (!agent?._id || thinkingRef.current) return;
    setSelectedAgent(agent);
    selectedAgentRef.current = agent;
    setRunning(true);
    runningRef.current = true;
    setThinking(true);
    thinkingRef.current = true;
    setError("");
    setCandidateAnswer("");
    latestAnswerRef.current = "";
    try {
      const response = await ep1.post("/api/v2/ai-interview-agents-start", scoped({ id: agent._id }));
      const opening = response.data?.response || "Let us begin. Please introduce yourself briefly.";
      const firstHistory = [{ role: "System", text: `Started interview: ${agent.topic}`, time: new Date().toLocaleTimeString() }];
      historyRef.current = firstHistory;
      setHistory(firstHistory);
      addInterviewerMessage(opening);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start interview");
      setRunning(false);
      runningRef.current = false;
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  };

  const stopInterview = () => {
    setRunning(false);
    runningRef.current = false;
    setListening(false);
    answerTimerRef.current && clearTimeout(answerTimerRef.current);
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    interviewerSpeakingRef.current = false;
    activeRecognition?.stop?.();
    window.speechSynthesis?.cancel?.();
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await ep1.post("/api/v2/ai-interview-agents", scoped({ ...form, _id: editId }));
      setMessage(editId ? "Interview agent updated" : "Interview agent created");
      setForm(blank);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save interview agent");
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
    setError("");
    try {
      await ep1.post("/api/v2/ai-interview-agents-delete", scoped({ ids: selectedIds }));
      setSelectedIds([]);
      setMessage("Selected interview agents deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected interview agents");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { field: "title", headerName: "Title", minWidth: 180, flex: 0.8 },
    { field: "topic", headerName: "Topic", minWidth: 300, flex: 1.3, renderCell: (params) => <Typography sx={{ whiteSpace: "normal", lineHeight: 1.35 }}>{params.value}</Typography> },
    { field: "mode", headerName: "Mode", minWidth: 120 },
    { field: "provider", headerName: "Provider", minWidth: 110 },
    { field: "active", headerName: "Active", minWidth: 90 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem icon={<PlayArrowIcon />} label="Start" onClick={() => startInterview(params.row)} />,
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />
      ]
    }
  ], []);

  return (
    <MenuPageShell title="AI Voice Interview">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField fullWidth required label="Interview topic" value={form.topic} onChange={(e) => setField("topic", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Keywords (optional, comma separated)" value={form.keywords} onChange={(e) => setField("keywords", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Mode" value={form.mode} onChange={(e) => setField("mode", e.target.value)}>
                {(options.modes || ["Aggressive", "Moderate", "Sober"]).map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Active" value={form.active} onChange={(e) => setField("active", e.target.value)}>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={4} label="Additional AI prompts (optional)" value={form.additionalprompt} onChange={(e) => setField("additionalprompt", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="AI provider" value={form.provider} onChange={(e) => setField("provider", e.target.value)}>
                <MenuItem value="Gemini">Gemini</MenuItem>
                <MenuItem value="Ollama">Ollama</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.geminiModels || []}
                value={form.geminimodel || ""}
                onChange={(_, value) => setField("geminimodel", value || "")}
                renderInput={(params) => <TextField {...params} label="Gemini model" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.ollamaConfigurations || []}
                value={(options.ollamaConfigurations || []).find((row) => row._id === form.ollamaconfigid) || null}
                getOptionLabel={(option) => option?.name ? `${option.name} (${option.modelname || ""})` : ""}
                onChange={(_, value) => setField("ollamaconfigid", value?._id || "")}
                renderInput={(params) => <TextField {...params} label="Ollama configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="contained" sx={{ height: 56 }} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>
                Save
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">{modeHelp[form.mode]}</Alert>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 1 }}>
            <TextField size="small" label="Search interview agents" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={loadRows}>Load</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selectedIds.length || saving} onClick={deleteSelected}>Bulk delete</Button>
          </Stack>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Box sx={{ height: 420 }}>
            <DataGrid
              rows={rows}
              getRowId={(row) => row._id}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
              onRowClick={(params) => setSelectedAgent(params.row)}
              slots={{ toolbar: GridToolbar }}
              sx={{
                "& .MuiDataGrid-cell": {
                  alignItems: "flex-start",
                  whiteSpace: "normal",
                  lineHeight: 1.35,
                  py: 1
                }
              }}
            />
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={800}>Interview room</Typography>
                <Typography variant="body2" color="text.secondary">{selectedAgent ? `${selectedAgent.title || selectedAgent.topic} · ${selectedAgent.mode}` : "Select an interview agent from the grid."}</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={running ? "Running" : "Stopped"} color={running ? "success" : "default"} />
                <Chip label={listening ? "Listening" : "Not listening"} color={listening ? "primary" : "default"} />
                <Chip label={thinking ? "Assessing" : "Ready"} color={thinking ? "warning" : "default"} />
              </Stack>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={!selectedAgent || thinking} onClick={() => startInterview()}>Start interview</Button>
              <Button variant={listening ? "contained" : "outlined"} color={listening ? "error" : "primary"} startIcon={listening ? <StopIcon /> : <MicIcon />} disabled={!selectedAgent || thinking || !running} onClick={listening ? stopInterview : startListening}>
                {listening ? "Stop interview" : "Listen for answer"}
              </Button>
              <Button variant="outlined" startIcon={muted ? <VolumeOffIcon /> : <VolumeUpIcon />} onClick={() => setMuted((prev) => !prev)}>
                {muted ? "Voice muted" : "Voice on"}
              </Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 1.5, height: 360, overflowY: "auto", bgcolor: "#f8fafc" }}>
                  <Stack spacing={1.25}>
                    {history.map((item, index) => (
                      <Box key={`${item.role}-${index}`} sx={{ display: "flex", justifyContent: item.role === "Interviewer" ? "flex-end" : "flex-start" }}>
                        <Paper sx={{ p: 1.25, maxWidth: "84%", bgcolor: item.role === "Interviewer" ? "#dbeafe" : item.role === "Candidate" ? "#ffffff" : "#f1f5f9" }}>
                          <Typography variant="caption" color="text.secondary">{item.role} · {item.time}</Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.text}</Typography>
                        </Paper>
                      </Box>
                    ))}
                    {thinking && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography>Assessing answer and preparing next question...</Typography>
                      </Stack>
                    )}
                    <div ref={bottomRef} />
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack spacing={1.5}>
                  <TextField fullWidth multiline minRows={5} label="Live candidate answer" value={candidateAnswer} onChange={(e) => {
                    setCandidateAnswer(e.target.value);
                    latestAnswerRef.current = e.target.value;
                  }} />
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" disabled={!selectedAgent || !candidateAnswer.trim() || thinking} onClick={() => submitAnswer(candidateAnswer)}>Assess answer</Button>
                    <Tooltip title="Clears only the visible answer text">
                      <IconButton onClick={() => { setCandidateAnswer(""); latestAnswerRef.current = ""; }}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </Stack>
                  <TextField fullWidth multiline minRows={4} label="Manual candidate answer" value={manualAnswer} onChange={(e) => setManualAnswer(e.target.value)} />
                  <Button variant="contained" disabled={!selectedAgent || !manualAnswer.trim() || thinking} onClick={() => submitAnswer(manualAnswer)}>Send manual answer</Button>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
