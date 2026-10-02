import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
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
import GavelIcon from "@mui/icons-material/Gavel";
import MicIcon from "@mui/icons-material/Mic";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blank = {
  title: "",
  casedescription: "",
  aiLawyerSide: "Respondent",
  aiLawyerExperience: "Medium",
  provider: "Gemini",
  geminimodel: "gemini-2.5-flash-lite",
  ollamaconfigid: "",
  active: "Yes",
  status: "Draft"
};

const scoped = (payload = {}) => ({
  ...payload,
  colid: global1.colid,
  user: global1.user,
  name: global1.name
});

const dateText = (value) => (value ? new Date(value).toLocaleString() : "");

export default function AiJudgeHearingPage() {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [options, setOptions] = useState({ geminiModels: [], ollamaConfigurations: [], sides: ["Petitioner", "Respondent"], experiences: ["Easy", "Medium", "Very experienced"] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState("");
  const [uploading, setUploading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [generatedDocRequest, setGeneratedDocRequest] = useState("");
  const [documentForm, setDocumentForm] = useState({ title: "", side: "Shared", notes: "", file: null });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [liveVoice, setLiveVoice] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptBottomRef = useRef(null);
  const liveVoiceRef = useRef(false);
  const speakingRef = useRef(false);
  const submittingVoiceRef = useRef(false);
  const finalSpeechRef = useRef("");
  const silenceTimerRef = useRef(null);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const loadOptions = useCallback(async () => {
    const response = await ep1.get("/api/v2/ai-judge-hearings/options", { params: scoped() });
    setOptions(response.data || { geminiModels: [], ollamaConfigurations: [], sides: ["Petitioner", "Respondent"], experiences: ["Easy", "Medium", "Very experienced"] });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ep1.get("/api/v2/ai-judge-hearings", { params: scoped({ search }) });
      const loaded = response.data?.rows || [];
      setRows(loaded);
      if (selectedHearing?._id) {
        const fresh = loaded.find((item) => item._id === selectedHearing._id);
        if (fresh) setSelectedHearing(fresh);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load AI Judge hearings");
    } finally {
      setLoading(false);
    }
  }, [search, selectedHearing?._id]);

  useEffect(() => {
    loadOptions().catch(() => {});
    loadRows();
    // Search loads on button click to avoid typing lag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedHearing?.transcript?.length, working]);

  useEffect(() => () => {
    silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel?.();
  }, []);

  useEffect(() => {
    liveVoiceRef.current = liveVoice;
  }, [liveVoice]);

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  const statusColor = useMemo(() => ({
    Draft: "default",
    "In Progress": "success",
    Paused: "warning",
    Closed: "error"
  }), []);

  const save = async () => {
    if (!form.casedescription.trim()) {
      setError("Case description is required");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await ep1.post("/api/v2/ai-judge-hearings", scoped({ ...form, _id: editId }));
      const row = response.data?.row;
      setNotice(editId ? "AI Judge hearing updated." : "AI Judge hearing created.");
      setForm(blank);
      setEditId("");
      await loadRows();
      if (row) setSelectedHearing(row);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save AI Judge hearing");
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditId(row._id);
    setForm({
      title: row.title || "",
      casedescription: row.casedescription || "",
      aiLawyerSide: row.aiLawyerSide || "Respondent",
      aiLawyerExperience: row.aiLawyerExperience || "Medium",
      provider: row.provider || "Gemini",
      geminimodel: row.geminimodel || "gemini-2.5-flash-lite",
      ollamaconfigid: row.ollamaconfigid || "",
      active: row.active || "Yes",
      status: row.status || "Draft"
    });
    setSelectedHearing(row);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async () => {
    if (!selectedIds.length) {
      setError("Select at least one hearing to delete");
      return;
    }
    setWorking("Deleting");
    setError("");
    try {
      await ep1.post("/api/v2/ai-judge-hearings-delete", scoped({ ids: selectedIds }));
      setNotice("Selected hearing(s) deleted.");
      setSelectedIds([]);
      setSelectedHearing(null);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete hearings");
    } finally {
      setWorking("");
    }
  };

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Please type the statement.");
      return;
    }
    if (speakingRef.current || submittingVoiceRef.current) return;
    recognitionRef.current?.stop?.();
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (liveVoiceRef.current && !speakingRef.current && !submittingVoiceRef.current) {
        setTimeout(() => {
          if (liveVoiceRef.current && !recognitionRef.current && !speakingRef.current) startListening();
        }, 450);
      }
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const chunk = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText += `${chunk} `;
        else interimText += `${chunk} `;
      }
      const combined = `${finalSpeechRef.current} ${finalText} ${interimText}`.replace(/\s+/g, " ").trim();
      if (combined) setMessageText(combined);
      if (finalText.trim()) {
        finalSpeechRef.current = `${finalSpeechRef.current} ${finalText}`.replace(/\s+/g, " ").trim();
        silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const readyText = finalSpeechRef.current.trim();
          if (liveVoiceRef.current && readyText && !speakingRef.current && !submittingVoiceRef.current) {
            submitSpokenStatement(readyText);
          }
        }, 1600);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const speakMessages = useCallback((messages = []) => {
    if (!voiceEnabled || !messages.length || !("speechSynthesis" in window)) {
      if (liveVoiceRef.current) setTimeout(() => startListening(), 300);
      return;
    }
    const voiceMessages = messages.filter((item) => ["Judge", "AI Lawyer"].includes(item.role) && item.text);
    if (!voiceMessages.length) {
      if (liveVoiceRef.current) setTimeout(() => startListening(), 300);
      return;
    }
    stopListening();
    window.speechSynthesis.cancel();
    setSpeaking(true);
    speakingRef.current = true;
    let index = 0;
    const speakNext = () => {
      if (index >= voiceMessages.length) {
        setSpeaking(false);
        speakingRef.current = false;
        if (liveVoiceRef.current) setTimeout(() => startListening(), 500);
        return;
      }
      const item = voiceMessages[index];
      index += 1;
      const utterance = new SpeechSynthesisUtterance(`${item.role}${item.side ? ` for ${item.side}` : ""}. ${item.text}`);
      utterance.lang = "en-IN";
      utterance.rate = item.role === "Judge" ? 0.95 : 1;
      utterance.pitch = item.role === "Judge" ? 0.92 : 1.05;
      utterance.onend = speakNext;
      utterance.onerror = speakNext;
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  }, [startListening, stopListening, voiceEnabled]);

  const runAction = async (endpoint, label, extra = {}, speakNewMessages = true) => {
    if (!selectedHearing?._id) {
      setError("Select a hearing first");
      return null;
    }
    const previousTranscriptLength = selectedHearing.transcript?.length || 0;
    setWorking(label);
    setError("");
    setNotice("");
    try {
      const response = await ep1.post(endpoint, scoped({ id: selectedHearing._id, ...extra }));
      if (response.data?.row) {
        setSelectedHearing(response.data.row);
        setRows((prev) => prev.map((item) => (item._id === response.data.row._id ? response.data.row : item)));
        if (speakNewMessages) speakMessages((response.data.row.transcript || []).slice(previousTranscriptLength));
      }
      setNotice(`${label} completed.`);
      return response.data?.row || null;
    } catch (err) {
      setError(err.response?.data?.message || `${label} failed`);
      return null;
    } finally {
      setWorking("");
    }
  };

  const submitMessage = async () => {
    const value = messageText.trim();
    if (!value) {
      setError("Enter the user's statement first");
      return;
    }
    await runAction("/api/v2/ai-judge-hearings-message", "Hearing response", { text: value });
    finalSpeechRef.current = "";
    setMessageText("");
  };

  const submitSpokenStatement = async (value) => {
    if (!value || submittingVoiceRef.current) return;
    submittingVoiceRef.current = true;
    stopListening();
    setMessageText(value);
    const row = await runAction("/api/v2/ai-judge-hearings-message", "Voice hearing response", { text: value });
    if (row) {
      finalSpeechRef.current = "";
      setMessageText("");
    }
    submittingVoiceRef.current = false;
    if (liveVoiceRef.current && !speakingRef.current) setTimeout(() => startListening(), 600);
  };

  const uploadDocument = async () => {
    if (!selectedHearing?._id) {
      setError("Select a hearing before uploading documents");
      return;
    }
    if (!documentForm.file && !documentForm.notes.trim()) {
      setError("Attach a document or enter document notes");
      return;
    }
    setUploading(true);
    setError("");
    setNotice("");
    try {
      let filelink = "";
      let filename = "";
      let mimetype = "";
      if (documentForm.file) {
        const data = new FormData();
        data.append("file", documentForm.file);
        data.append("colid", global1.colid);
        data.append("user", global1.user || "");
        data.append("folder", `ai-judge/${selectedHearing._id}`);
        data.append("description", documentForm.title || documentForm.file.name);
        const uploadRes = await ep1.post("/api/v2/aws-file-library/upload", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        filelink = uploadRes.data?.url || "";
        filename = uploadRes.data?.originalname || uploadRes.data?.filename || documentForm.file.name;
        mimetype = documentForm.file.type || "";
        if (!filelink) throw new Error("AWS upload did not return a file link");
      }
      const response = await ep1.post("/api/v2/ai-judge-hearings-document", scoped({
        id: selectedHearing._id,
        title: documentForm.title || filename || "Hearing document",
        side: documentForm.side,
        filelink,
        filename,
        mimetype,
        notes: documentForm.notes
      }));
      setSelectedHearing(response.data?.row || selectedHearing);
      setDocumentForm({ title: "", side: "Shared", notes: "", file: null });
      setNotice("Document added and made visible to the AI Judge and both sides.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload document");
    } finally {
      setUploading(false);
    }
  };

  const generateDocument = async () => {
    await runAction("/api/v2/ai-judge-hearings-generate-document", "AI lawyer document", { request: generatedDocRequest });
    setGeneratedDocRequest("");
  };

  const toggleLiveVoice = () => {
    if (liveVoice) {
      setLiveVoice(false);
      liveVoiceRef.current = false;
      finalSpeechRef.current = "";
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
      stopListening();
      return;
    }
    setLiveVoice(true);
    liveVoiceRef.current = true;
    finalSpeechRef.current = messageText.trim();
    startListening();
  };

  const hearingColumns = [
    { field: "title", headerName: "Hearing", flex: 1, minWidth: 220 },
    { field: "userSide", headerName: "User side", width: 120 },
    { field: "aiLawyerSide", headerName: "AI lawyer side", width: 140 },
    { field: "aiLawyerExperience", headerName: "Experience", width: 150 },
    { field: "provider", headerName: "AI", width: 100 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => <Chip size="small" color={statusColor[params.value] || "default"} label={params.value || "Draft"} />
    },
    { field: "updatedAt", headerName: "Updated", width: 170, valueGetter: (params) => dateText(params.row?.updatedAt) },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 130,
      getActions: (params) => [
        <GridActionsCellItem key="open" icon={<GavelIcon />} label="Open" onClick={() => setSelectedHearing(params.row)} showInMenu />,
        <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => editRow(params.row)} showInMenu />
      ]
    }
  ];

  const documentColumns = [
    { field: "title", headerName: "Document", flex: 1, minWidth: 180, valueGetter: (params) => params.row?.title || params.row?.filename || "Document" },
    { field: "side", headerName: "Side", width: 120 },
    { field: "generated", headerName: "AI generated", width: 130 },
    { field: "uploadedby", headerName: "By", width: 130 },
    { field: "uploadedat", headerName: "Uploaded", width: 170, valueGetter: (params) => dateText(params.row?.uploadedat) },
    {
      field: "open",
      headerName: "Open",
      width: 90,
      renderCell: (params) => params.row?.filelink ? (
        <Tooltip title="Open document">
          <IconButton component="a" href={params.row.filelink} target="_blank" rel="noreferrer" size="small">
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null
    }
  ];

  return (
    <MenuPageShell title="AI Judge" currentPage="AI Jusge" showSearch>
      <Stack spacing={2}>
        {(error || notice) && (
          <Alert severity={error ? "error" : "success"} onClose={() => { setError(""); setNotice(""); }}>
            {error || notice}
          </Alert>
        )}
        {(saving || loading || working || uploading) && (
          <LinearProgress />
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6">{editId ? "Edit hearing agent" : "Create AI Judge hearing"}</Typography>
                <TextField label="Title" value={form.title} onChange={(event) => setField("title", event.target.value)} fullWidth />
                <TextField label="Describe the case" value={form.casedescription} onChange={(event) => setField("casedescription", event.target.value)} fullWidth multiline minRows={6} />
                <TextField select label="AI lawyer side" value={form.aiLawyerSide} onChange={(event) => setField("aiLawyerSide", event.target.value)} fullWidth>
                  {(options.sides || ["Petitioner", "Respondent"]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select label="AI lawyer experience" value={form.aiLawyerExperience} onChange={(event) => setField("aiLawyerExperience", event.target.value)} fullWidth>
                  {(options.experiences || ["Easy", "Medium", "Very experienced"]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select label="AI provider" value={form.provider} onChange={(event) => setField("provider", event.target.value)} fullWidth>
                  <MenuItem value="Gemini">Gemini</MenuItem>
                  <MenuItem value="Ollama">Ollama</MenuItem>
                </TextField>
                {form.provider === "Gemini" ? (
                  <Autocomplete
                    freeSolo
                    options={options.geminiModels || []}
                    value={form.geminimodel || ""}
                    onChange={(_, value) => setField("geminimodel", value || "")}
                    onInputChange={(_, value) => setField("geminimodel", value || "")}
                    renderInput={(params) => <TextField {...params} label="Gemini model" />}
                  />
                ) : (
                  <Autocomplete
                    options={options.ollamaConfigurations || []}
                    value={(options.ollamaConfigurations || []).find((item) => item._id === form.ollamaconfigid) || null}
                    getOptionLabel={(option) => option?.name || option?.modelname || option?.serveraddress || ""}
                    onChange={(_, value) => setField("ollamaconfigid", value?._id || "")}
                    renderInput={(params) => <TextField {...params} label="Ollama configuration" />}
                  />
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={save} disabled={saving || working}>
                    {editId ? "Update" : "Save"}
                  </Button>
                  <Button variant="outlined" onClick={() => { setForm(blank); setEditId(""); }}>
                    Clear
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadRows} disabled={loading}>
                    Load
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  <TextField label="Search hearings" value={search} onChange={(event) => setSearch(event.target.value)} fullWidth />
                  <Button variant="contained" onClick={loadRows} disabled={loading}>Load</Button>
                  <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={deleteRows} disabled={!selectedIds.length || Boolean(working)}>Delete</Button>
                </Stack>
                <Box sx={{ height: 360 }}>
                  <DataGrid
                    rows={rows}
                    columns={hearingColumns}
                    getRowId={(row) => row._id}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))}
                    slots={{ toolbar: GridToolbar }}
                    onRowDoubleClick={(params) => setSelectedHearing(params.row)}
                    loading={loading}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="h6">Hearing workspace</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedHearing ? selectedHearing.title : "Select a hearing to start, pause, resume, upload documents, and continue proceedings."}
                </Typography>
              </Box>
              {selectedHearing && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`User: ${selectedHearing.userSide}`} />
                  <Chip label={`AI lawyer: ${selectedHearing.aiLawyerSide}`} color="primary" />
                  <Chip label={selectedHearing.status || "Draft"} color={statusColor[selectedHearing.status] || "default"} />
                </Stack>
              )}
            </Stack>

            {selectedHearing ? (
              <>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={Boolean(working)} onClick={() => runAction("/api/v2/ai-judge-hearings-start", selectedHearing.status === "Paused" ? "Resume hearing" : "Start hearing")}>
                    {selectedHearing.status === "Paused" ? "Resume" : "Start"}
                  </Button>
                  <Button variant="outlined" startIcon={<PauseIcon />} disabled={Boolean(working)} onClick={() => runAction("/api/v2/ai-judge-hearings-pause", "Pause hearing")}>
                    Pause
                  </Button>
                  <Button color="error" variant="outlined" startIcon={<StopIcon />} disabled={Boolean(working)} onClick={() => runAction("/api/v2/ai-judge-hearings-close", "Final order")}>
                    Final order
                  </Button>
                  <Button variant={liveVoice ? "contained" : "outlined"} color={liveVoice ? "success" : "primary"} startIcon={<MicIcon />} onClick={toggleLiveVoice} disabled={Boolean(working)}>
                    {liveVoice ? "Live hearing on" : "Start live voice"}
                  </Button>
                  <Button variant="outlined" startIcon={voiceEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />} onClick={() => {
                    setVoiceEnabled((prev) => !prev);
                    if (voiceEnabled) window.speechSynthesis?.cancel?.();
                  }}>
                    {voiceEnabled ? "Voice on" : "Voice off"}
                  </Button>
                  {working && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography variant="body2">{working}...</Typography>
                    </Stack>
                  )}
                  {speaking && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VolumeUpIcon color="primary" />
                      <Typography variant="body2">Judge/lawyer speaking...</Typography>
                    </Stack>
                  )}
                  {listening && !speaking && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MicIcon color="success" />
                      <Typography variant="body2">Listening to user...</Typography>
                    </Stack>
                  )}
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} lg={7}>
                    <Paper variant="outlined" sx={{ p: 2, height: 520, overflow: "auto", bgcolor: "#fafcff" }}>
                      <Stack spacing={1.25}>
                        {(selectedHearing.transcript || []).length ? selectedHearing.transcript.map((item, index) => (
                          <Box key={item._id || index} sx={{
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: item.role === "Judge" ? "#eef5ff" : item.role === "AI Lawyer" ? "#fff7e6" : "#f0fff4",
                            border: "1px solid #e4e8ef"
                          }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Chip size="small" label={item.role || "Statement"} color={item.role === "Judge" ? "primary" : item.role === "AI Lawyer" ? "warning" : "success"} />
                              {item.side && <Typography variant="caption" color="text.secondary">{item.side}</Typography>}
                              <Typography variant="caption" color="text.secondary">{dateText(item.createdat)}</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.text}</Typography>
                          </Box>
                        )) : (
                          <Alert severity="info">No proceedings yet. Click Start to let the AI Judge frame the issues and let the AI lawyer give an opening.</Alert>
                        )}
                        <div ref={transcriptBottomRef} />
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} lg={5}>
                    <Stack spacing={2}>
                      <TextField
                        label="User statement / response"
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        multiline
                        minRows={7}
                        fullWidth
                        helperText="Use the mic to dictate, or type the user's argument. The AI lawyer and judge will respond and the text will be saved."
                      />
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button variant="contained" startIcon={<SendIcon />} onClick={submitMessage} disabled={!messageText.trim() || Boolean(working)}>
                          Submit to hearing
                        </Button>
                        <Button variant="outlined" startIcon={<MicIcon />} onClick={listening ? stopListening : startListening}>
                          {listening ? "Stop listening" : "Listen"}
                        </Button>
                        <Button variant="outlined" startIcon={<VolumeUpIcon />} onClick={() => speakMessages((selectedHearing.transcript || []).slice(-2))}>
                          Speak latest
                        </Button>
                      </Stack>
                      <Divider />
                      <TextField
                        label="AI lawyer document request"
                        value={generatedDocRequest}
                        onChange={(event) => setGeneratedDocRequest(event.target.value)}
                        multiline
                        minRows={3}
                        fullWidth
                        placeholder="Example: prepare counter affidavit on maintainability with supporting principles"
                      />
                      <Button variant="outlined" startIcon={<GavelIcon />} onClick={generateDocument} disabled={Boolean(working)}>
                        Generate AI lawyer document
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Documents visible to both parties and judge</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <TextField label="Document title" value={documentForm.title} onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField select label="Side" value={documentForm.side} onChange={(event) => setDocumentForm((prev) => ({ ...prev, side: event.target.value }))} fullWidth>
                          <MenuItem value="Shared">Shared</MenuItem>
                          <MenuItem value={selectedHearing.userSide}>User side</MenuItem>
                          <MenuItem value={selectedHearing.aiLawyerSide}>AI lawyer side</MenuItem>
                          <MenuItem value="Judge">Judge</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{ height: "100%" }}>
                          {documentForm.file ? documentForm.file.name : "Upload PDF/Image/Word"}
                          <input hidden type="file" accept="application/pdf,image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setDocumentForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))} />
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Notes" value={documentForm.notes} onChange={(event) => setDocumentForm((prev) => ({ ...prev, notes: event.target.value }))} fullWidth multiline minRows={2} />
                      </Grid>
                    </Grid>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />} onClick={uploadDocument} disabled={uploading}>
                        Add document
                      </Button>
                    </Stack>
                    <Box sx={{ height: 300 }}>
                      <DataGrid
                        rows={selectedHearing.documents || []}
                        columns={documentColumns}
                        getRowId={(row) => row._id || `${row.title}-${row.uploadedat}-${row.filename}`}
                        slots={{ toolbar: GridToolbar }}
                        getRowHeight={() => "auto"}
                      />
                    </Box>
                    {(selectedHearing.documents || []).some((item) => item.notes) && (
                      <Stack spacing={1}>
                        {(selectedHearing.documents || []).filter((item) => item.notes).map((item, index) => (
                          <Paper key={item._id || index} variant="outlined" sx={{ p: 1.5 }}>
                            <Typography variant="subtitle2">{item.title || item.filename || "Document notes"}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.notes}</Typography>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </>
            ) : (
              <Alert severity="info">Select a saved hearing from the grid above.</Alert>
            )}
          </Stack>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
