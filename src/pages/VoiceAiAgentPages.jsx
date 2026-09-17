import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import MicIcon from "@mui/icons-material/Mic";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useParams } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blank = {
  agentname: "",
  description: "",
  instructions: "",
  provider: "Gemini",
  geminimodel: "gemini-2.5-flash-lite",
  ollamaconfigid: "",
  active: "Yes",
  status: "Active",
  documents: []
};

const scoped = (payload = {}) => ({
  ...payload,
  colid: global1.colid,
  name: global1.name,
  user: global1.user
});

const publicLinkFor = (publicid) => `${window.location.origin}/voice-ai-agent-talk/${publicid || ""}`;

export function VoiceAiAgentManagerPage() {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [options, setOptions] = useState({ geminiModels: [], ollamaConfigurations: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const loadOptions = useCallback(async () => {
    const response = await ep1.get("/api/v2/voice-ai-agents/options", { params: scoped() });
    setOptions(response.data || { geminiModels: [], ollamaConfigurations: [] });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ep1.get("/api/v2/voice-ai-agents", { params: scoped({ search }) });
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load voice AI agents.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadOptions().catch(() => {});
    loadRows();
  }, [loadOptions, loadRows]);

  const uploadFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const data = new FormData();
        data.append("file", file);
        data.append("colid", global1.colid);
        const response = await ep1.post("/api/v2/voice-ai-agents-upload", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploaded.push({
          title: file.name,
          filename: response.data?.filename || file.name,
          url: response.data?.url || "",
          uploadedby: global1.user,
          uploadeddate: new Date().toISOString()
        });
      }
      setField("documents", [...(form.documents || []), ...uploaded]);
      setMessage(`${uploaded.length} document(s) uploaded. Save the agent to extract and index the content.`);
    } catch (err) {
      setError(err.response?.data?.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = scoped({ ...form, _id: editId });
      const response = await ep1.post("/api/v2/voice-ai-agents", payload);
      setMessage(`Voice agent saved. Public link: ${publicLinkFor(response.data?.publicid)}`);
      setForm(blank);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save voice AI agent.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditId(row._id);
    setForm({
      agentname: row.agentname || "",
      description: row.description || "",
      instructions: row.instructions || "",
      provider: row.provider || "Gemini",
      geminimodel: row.geminimodel || "gemini-2.5-flash-lite",
      ollamaconfigid: row.ollamaconfigid || "",
      active: row.active || "Yes",
      status: row.status || "Active",
      documents: row.documents || []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeDocs = (index) => {
    setField("documents", (form.documents || []).filter((_, idx) => idx !== index));
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    setSaving(true);
    setError("");
    try {
      await ep1.post("/api/v2/voice-ai-agents-delete", scoped({ ids: selectedIds }));
      setSelectedIds([]);
      await loadRows();
      setMessage("Selected voice agents deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected agents.");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { field: "agentname", headerName: "Agent", minWidth: 220, flex: 1, renderCell: (params) => <Typography sx={{ whiteSpace: "normal", lineHeight: 1.35 }}>{params.value}</Typography> },
    { field: "provider", headerName: "Provider", minWidth: 110 },
    { field: "active", headerName: "Active", minWidth: 100 },
    { field: "documents", headerName: "Docs", minWidth: 80, valueGetter: (params) => params.row.documents?.length || 0 },
    {
      field: "publiclink",
      headerName: "Public link",
      minWidth: 300,
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
          <Typography variant="body2" sx={{ whiteSpace: "normal", wordBreak: "break-all" }}>{publicLinkFor(params.row.publicid)}</Typography>
          <Tooltip title="Copy link">
            <IconButton size="small" onClick={() => navigator.clipboard?.writeText(publicLinkFor(params.row.publicid))}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open link">
            <IconButton size="small" onClick={() => window.open(publicLinkFor(params.row.publicid), "_blank", "noopener,noreferrer")}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />
      ]
    }
  ], []);

  return (
    <MenuPageShell title="Voice AI Agents">
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Agent name" value={form.agentname} onChange={(e) => setField("agentname", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={5} label="Manual instructions" value={form.instructions} onChange={(e) => setField("instructions", e.target.value)} />
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
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={options.ollamaConfigurations || []}
                value={(options.ollamaConfigurations || []).find((row) => row._id === form.ollamaconfigid) || null}
                getOptionLabel={(option) => option?.name ? `${option.name} (${option.modelname || ""})` : ""}
                onChange={(_, value) => setField("ollamaconfigid", value?._id || "")}
                renderInput={(params) => <TextField {...params} label="Ollama configuration" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth label="Active" value={form.active} onChange={(e) => setField("active", e.target.value)}>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button component="label" variant="outlined" startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />} disabled={uploading}>
                  Upload PDF/Word documents
                  <input hidden multiple type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadFiles} />
                </Button>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={saving || uploading} onClick={save}>
                  {editId ? "Update agent" : "Create agent"}
                </Button>
                <Button variant="text" onClick={() => { setForm(blank); setEditId(""); }}>Clear</Button>
              </Stack>
            </Grid>
            {!!(form.documents || []).length && (
              <Grid item xs={12}>
                <Stack spacing={1}>
                  {(form.documents || []).map((doc, index) => (
                    <Paper key={`${doc.url}-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                        <TextField size="small" label="Document title" value={doc.title || ""} onChange={(e) => {
                          const next = [...(form.documents || [])];
                          next[index] = { ...next[index], title: e.target.value };
                          setField("documents", next);
                        }} sx={{ minWidth: 260 }} />
                        <Typography sx={{ flex: 1, wordBreak: "break-all" }}>{doc.filename || doc.url}</Typography>
                        <Button href={doc.url} target="_blank" rel="noreferrer" startIcon={<LinkIcon />}>Open</Button>
                        <IconButton color="error" onClick={() => removeDocs(index)}><DeleteIcon /></IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 1 }}>
            <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadRows} disabled={loading}>Load</Button>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={!selectedIds.length || saving} onClick={deleteSelected}>Bulk delete</Button>
          </Stack>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={rows}
              getRowId={(row) => row._id}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
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
      </Stack>
    </MenuPageShell>
  );
}

export function VoiceAiAgentTalkPage() {
  const { publicid } = useParams();
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const visitorId = useMemo(() => {
    const key = "voice-ai-agent-visitor-id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, next);
    return next;
  }, []);

  useEffect(() => {
    ep1.get(`/api/v2/public/voice-ai-agents/${publicid}`)
      .then((response) => {
        setAgent(response.data);
        setMessages([{ role: "agent", text: `Hello. I am ${response.data?.agentname || "your voice agent"}. How can I help?` }]);
      })
      .catch((err) => setError(err.response?.data?.message || "Unable to load this voice agent."));
  }, [publicid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const speak = (textToSpeak) => {
    if (muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (messageText = input) => {
    const question = String(messageText || "").trim();
    if (!question || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "visitor", text: question }]);
    setThinking(true);
    setError("");
    try {
      const response = await ep1.post(`/api/v2/public/voice-ai-agents/${publicid}/chat`, { question, visitorid: visitorId });
      const answer = response.data?.answer || "I could not generate an answer.";
      setMessages((prev) => [...prev, { role: "agent", text: answer }]);
      speak(answer);
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to get an answer.";
      setError(msg);
      setMessages((prev) => [...prev, { role: "agent", text: msg }]);
    } finally {
      setThinking(false);
    }
  };

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Please type your question.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error ? `Voice input error: ${event.error}` : "Voice input failed.");
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) sendMessage(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", p: { xs: 1.5, md: 3 } }}>
      <Paper sx={{ maxWidth: 1050, mx: "auto", minHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ p: 2.5, bgcolor: "#111827", color: "white" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={700}>{agent?.agentname || "Voice AI Agent"}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>{agent?.description || "Ask by voice or type your question."}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`${agent?.documentcount || 0} document(s)`} color="primary" />
              <TextField
                select
                size="small"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{ minWidth: 130, bgcolor: "white", borderRadius: 1 }}
              >
                <MenuItem value="en-US">English US</MenuItem>
                <MenuItem value="en-IN">English India</MenuItem>
                <MenuItem value="hi-IN">Hindi</MenuItem>
              </TextField>
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Switch checked={!muted} onChange={(e) => setMuted(!e.target.checked)} color="success" />}
                label={<Typography variant="body2">Speak</Typography>}
              />
            </Stack>
          </Stack>
        </Box>
        {error && <Alert severity="warning" sx={{ borderRadius: 0 }} onClose={() => setError("")}>{error}</Alert>}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "#eef2f7" }}>
          <Stack spacing={1.5}>
            {messages.map((msg, index) => (
              <Box key={`${msg.role}-${index}`} sx={{ display: "flex", justifyContent: msg.role === "visitor" ? "flex-end" : "flex-start" }}>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: "78%",
                    bgcolor: msg.role === "visitor" ? "#2563eb" : "white",
                    color: msg.role === "visitor" ? "white" : "#111827",
                    borderRadius: msg.role === "visitor" ? "16px 16px 4px 16px" : "16px 16px 16px 4px"
                  }}
                >
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {thinking && (
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <Paper sx={{ p: 1.5, borderRadius: "16px 16px 16px 4px" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography>Thinking...</Typography>
                  </Stack>
                </Paper>
              </Box>
            )}
            <div ref={bottomRef} />
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: "white" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="stretch">
            <TextField
              fullWidth
              placeholder="Type your question, or use the microphone"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button variant="contained" startIcon={<SendIcon />} disabled={thinking || !input.trim()} onClick={() => sendMessage()}>Send</Button>
            <Button
              variant={listening ? "contained" : "outlined"}
              color={listening ? "error" : "primary"}
              startIcon={listening ? <StopIcon /> : <MicIcon />}
              onClick={listening ? stopListening : startListening}
              disabled={thinking}
            >
              {listening ? "Stop" : "Talk"}
            </Button>
            <Button variant="outlined" startIcon={muted ? <VolumeOffIcon /> : <VolumeUpIcon />} onClick={() => setMuted((prev) => !prev)}>
              {muted ? "Muted" : "Voice"}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">Microphone access works best on HTTPS or localhost. Browser permission is required.</Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default VoiceAiAgentManagerPage;
