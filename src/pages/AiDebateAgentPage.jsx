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
  Aggressive: "Often interrupts, challenges weak points quickly, and speaks with strong energy.",
  Moderate: "Sometimes interjects, usually responds after a clear point, and balances rebuttal with listening.",
  Sober: "Waits until speech pauses, responds calmly, and avoids cutting others off."
};

const modeDelay = {
  Aggressive: 700,
  Moderate: 1600,
  Sober: 3000
};

export default function AiDebateAgentPage() {
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
  const [manualInput, setManualInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const responseTimerRef = useRef(null);
  const latestTranscriptRef = useRef("");
  const runningRef = useRef(false);
  const selectedAgentRef = useRef(null);
  const historyRef = useRef([]);
  const thinkingRef = useRef(false);
  const mutedRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const pendingHeardRef = useRef("");
  const voiceRetryRef = useRef(false);
  const bottomRef = useRef(null);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const loadOptions = useCallback(async () => {
    const response = await ep1.get("/api/v2/ai-debate-agents/options", { params: scoped() });
    setOptions(response.data || { geminiModels: [], ollamaConfigurations: [], modes: ["Aggressive", "Moderate", "Sober"] });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ep1.get("/api/v2/ai-debate-agents", { params: scoped({ search }) });
      setRows(response.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load debate agents");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadOptions().catch(() => {});
    loadRows();
    // Search should load only when the user clicks Load, never on each typed character.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { selectedAgentRef.current = selectedAgent; }, [selectedAgent]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { thinkingRef.current = thinking; }, [thinking]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, thinking, transcript]);

  useEffect(() => () => {
    responseTimerRef.current && clearTimeout(responseTimerRef.current);
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel?.();
  }, []);

  const finishAgentSpeech = () => {
    agentSpeakingRef.current = false;
    if (pendingHeardRef.current) {
      const pendingText = pendingHeardRef.current;
      pendingHeardRef.current = "";
      scheduleResponse(pendingText);
      return;
    }
    setTimeout(() => {
      if (runningRef.current && !recognitionRef.current) startListening();
    }, 350);
  };

  const speak = (value, retrying = false) => {
    const activeAgent = selectedAgentRef.current;
    if (mutedRef.current || !("speechSynthesis" in window)) return;
    voiceRetryRef.current = retrying;
    agentSpeakingRef.current = true;
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    activeRecognition?.stop?.();
    setListening(false);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "en-IN";
    utterance.rate = activeAgent?.mode === "Aggressive" ? 1.08 : activeAgent?.mode === "Sober" ? 0.92 : 1;
    utterance.onstart = () => {
      agentSpeakingRef.current = true;
    };
    utterance.onend = finishAgentSpeech;
    utterance.onerror = finishAgentSpeech;
    window.speechSynthesis.speak(utterance);
    setTimeout(() => {
      if (!voiceRetryRef.current && agentSpeakingRef.current && !window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speak(value, true);
      }
    }, 600);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await ep1.post("/api/v2/ai-debate-agents", scoped({ ...form, _id: editId }));
      setMessage(editId ? "Debate agent updated" : "Debate agent created");
      setForm(blank);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save debate agent");
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
      await ep1.post("/api/v2/ai-debate-agents-delete", scoped({ ids: selectedIds }));
      setSelectedIds([]);
      setMessage("Selected debate agents deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected debate agents");
    } finally {
      setSaving(false);
    }
  };

  const addAgentMessage = (text) => {
    setHistory((prev) => {
      const next = [...prev, { role: "Agent", text, time: new Date().toLocaleTimeString() }];
      historyRef.current = next;
      return next;
    });
    speak(text);
  };

  const startDebate = async (agent = selectedAgent) => {
    if (!agent?._id || thinkingRef.current) return;
    setSelectedAgent(agent);
    selectedAgentRef.current = agent;
    setRunning(true);
    runningRef.current = true;
    setThinking(true);
    thinkingRef.current = true;
    setError("");
    setTranscript("");
    latestTranscriptRef.current = "";
    try {
      const response = await ep1.post("/api/v2/ai-debate-agents-start", scoped({ id: agent._id }));
      const opening = response.data?.response || "Let us begin.";
      const firstHistory = [{ role: "System", text: `Started debate: ${agent.topic}`, time: new Date().toLocaleTimeString() }];
      historyRef.current = firstHistory;
      setHistory(firstHistory);
      addAgentMessage(opening);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start debate");
      setRunning(false);
      runningRef.current = false;
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  };

  const requestResponse = async (heardText) => {
    const agent = selectedAgentRef.current;
    const content = String(heardText || latestTranscriptRef.current || manualInput || "").trim();
    if (!agent?._id || !content || thinkingRef.current) return;
    responseTimerRef.current && clearTimeout(responseTimerRef.current);
    setManualInput("");
    setTranscript("");
    latestTranscriptRef.current = "";
    const nextHistory = [...historyRef.current, { role: "Opponent", text: content, time: new Date().toLocaleTimeString() }];
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setThinking(true);
    thinkingRef.current = true;
    setError("");
    try {
      const response = await ep1.post("/api/v2/ai-debate-agents-respond", scoped({
        id: agent._id,
        transcript: content,
        history: nextHistory.slice(-10)
      }));
      addAgentMessage(response.data?.response || "I disagree, but I need more detail to respond properly.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to get debate response");
    } finally {
      setThinking(false);
      thinkingRef.current = false;
    }
  };

  const scheduleResponse = (value) => {
    const agent = selectedAgentRef.current;
    if (!agent) return;
    responseTimerRef.current && clearTimeout(responseTimerRef.current);
    responseTimerRef.current = setTimeout(() => requestResponse(value), modeDelay[agent.mode] || 1600);
  };

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Please use typed input.");
      return;
    }
    if (recognitionRef.current) return;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
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
      const heard = [latestTranscriptRef.current, finalText].filter(Boolean).join(" ").trim();
      if (finalText) {
        latestTranscriptRef.current = heard;
        setTranscript(heard);
        if (agentSpeakingRef.current) pendingHeardRef.current = heard;
        else scheduleResponse(heard);
      } else if (interim) {
        const visibleText = [latestTranscriptRef.current, interim].filter(Boolean).join(" ").trim();
        responseTimerRef.current && clearTimeout(responseTimerRef.current);
        setTranscript(visibleText);
      }
    };
    recognitionRef.current = recognition;
    setRunning(true);
    runningRef.current = true;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  };

  const stopListening = () => {
    setRunning(false);
    runningRef.current = false;
    setListening(false);
    responseTimerRef.current && clearTimeout(responseTimerRef.current);
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    agentSpeakingRef.current = false;
    pendingHeardRef.current = "";
    activeRecognition?.stop?.();
    window.speechSynthesis?.cancel?.();
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
        <GridActionsCellItem icon={<PlayArrowIcon />} label="Start" onClick={() => startDebate(params.row)} />,
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />
      ]
    }
  ], []);

  return (
    <MenuPageShell title="AI Debate Agent">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField fullWidth required label="Debate topic" value={form.topic} onChange={(e) => setField("topic", e.target.value)} />
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
            <TextField size="small" label="Search debate agents" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={loadRows}>Load</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selectedIds.length || saving} onClick={deleteSelected}>Bulk delete</Button>
          </Stack>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Box sx={{ height: 430 }}>
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
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={800}>Debate room</Typography>
                <Typography variant="body2" color="text.secondary">{selectedAgent ? `${selectedAgent.title || selectedAgent.topic} · ${selectedAgent.mode}` : "Select a debate agent from the grid."}</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={running ? "Running" : "Stopped"} color={running ? "success" : "default"} />
                <Chip label={listening ? "Listening" : "Not listening"} color={listening ? "primary" : "default"} />
                <Chip label={thinking ? "Thinking" : "Ready"} color={thinking ? "warning" : "default"} />
              </Stack>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={!selectedAgent || thinking} onClick={() => startDebate()}>Start debate</Button>
              <Button variant={listening ? "contained" : "outlined"} color={listening ? "error" : "primary"} startIcon={listening ? <StopIcon /> : <MicIcon />} disabled={!selectedAgent || thinking} onClick={listening ? stopListening : startListening}>
                {listening ? "Stop listening" : "Listen and respond"}
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
                      <Box key={`${item.role}-${index}`} sx={{ display: "flex", justifyContent: item.role === "Agent" ? "flex-end" : "flex-start" }}>
                        <Paper sx={{ p: 1.25, maxWidth: "82%", bgcolor: item.role === "Agent" ? "#dbeafe" : item.role === "Opponent" ? "#ffffff" : "#f1f5f9" }}>
                          <Typography variant="caption" color="text.secondary">{item.role} · {item.time}</Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.text}</Typography>
                        </Paper>
                      </Box>
                    ))}
                    {thinking && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography>Preparing response...</Typography>
                      </Stack>
                    )}
                    <div ref={bottomRef} />
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack spacing={1.5}>
                  <TextField fullWidth multiline minRows={5} label="Live heard text" value={transcript} onChange={(e) => {
                    setTranscript(e.target.value);
                    latestTranscriptRef.current = e.target.value;
                  }} />
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" disabled={!selectedAgent || !transcript.trim() || thinking} onClick={() => requestResponse(transcript)}>Respond to heard text</Button>
                    <Tooltip title="Clears only the visible heard text">
                      <IconButton onClick={() => { setTranscript(""); latestTranscriptRef.current = ""; }}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </Stack>
                  <TextField fullWidth multiline minRows={4} label="Manual opponent statement" value={manualInput} onChange={(e) => setManualInput(e.target.value)} />
                  <Button variant="contained" disabled={!selectedAgent || !manualInput.trim() || thinking} onClick={() => requestResponse(manualInput)}>Send manual statement</Button>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
