import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import Editor from "@monaco-editor/react";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const providerNames = ["Gemini", "OpenAI", "Claude", "Ollama"];
const defaultModels = {
  Gemini: ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"],
  OpenAI: ["gpt-4.1-mini", "gpt-4.1", "gpt-5.1"],
  Claude: ["claude-3-5-sonnet-latest", "claude-sonnet-4-5"],
  Ollama: ["llama3.1", "llama3.2", "codellama", "qwen2.5-coder"]
};

const sampleCode = `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));`;

const editorLanguage = (language) => {
  const value = String(language || "").toLowerCase();
  if (value.includes("typescript")) return "typescript";
  if (value.includes("python")) return "python";
  if (value === "c++") return "cpp";
  if (value === "c#") return "csharp";
  if (value.includes("java") && !value.includes("script")) return "java";
  if (value.includes("sql")) return "sql";
  if (value.includes("html")) return "html";
  if (value.includes("css")) return "css";
  if (value.includes("json")) return "json";
  if (value.includes("xml")) return "xml";
  if (value.includes("yaml")) return "yaml";
  if (value.includes("markdown")) return "markdown";
  if (value.includes("php")) return "php";
  if (value.includes("ruby")) return "ruby";
  if (value.includes("go")) return "go";
  if (value.includes("rust")) return "rust";
  if (value.includes("swift")) return "swift";
  if (value.includes("kotlin")) return "kotlin";
  if (value.includes("shell") || value.includes("bash")) return "shell";
  return "javascript";
};

const withScope = (payload = {}) => ({
  ...payload,
  colid: global1.colid,
  user: global1.user,
  name: global1.name,
  role: global1.role
});

export default function NepLmsAiCodingPlatformPage() {
  const [options, setOptions] = useState({ languages: [], providerModels: defaultModels, savedKeys: {}, ollamaConfigs: [] });
  const [form, setForm] = useState({
    provider: "Gemini",
    model: "gemini-2.5-flash-lite",
    ollamaConfigId: "",
    language: "JavaScript",
    ownApiKey: "",
    useOwnKey: "No"
  });
  const [code, setCode] = useState(sampleCode);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationRef = useRef([]);

  const modelOptions = useMemo(() => {
    if (form.provider === "Ollama") {
      const fromConfigs = (options.ollamaConfigs || []).map((item) => item.modelname).filter(Boolean);
      return Array.from(new Set([...fromConfigs, ...(options.providerModels?.Ollama || defaultModels.Ollama)]));
    }
    return options.providerModels?.[form.provider] || defaultModels[form.provider] || [];
  }, [form.provider, options]);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "provider") {
        const models = options.providerModels?.[value] || defaultModels[value] || [];
        next.model = models[0] || "";
        next.ollamaConfigId = "";
      }
      return next;
    });
  };

  const loadOptions = useCallback(async () => {
    try {
      const res = await ep1.get("/api/v2/neplms-ai-coding-platform/options", { params: withScope() });
      const loaded = res.data || {};
      setOptions({
        languages: loaded.languages || [],
        providerModels: loaded.providerModels || defaultModels,
        savedKeys: loaded.savedKeys || {},
        ollamaConfigs: loaded.ollamaConfigs || []
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load AI coding options.");
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const markers = (result?.errors || []).map((item) => ({
      startLineNumber: Number(item.line) || 1,
      startColumn: Number(item.column) || 1,
      endLineNumber: Number(item.line) || 1,
      endColumn: Math.max(Number(item.column) || 1, 120),
      message: `${item.message}${item.suggestion ? `\nSuggestion: ${item.suggestion}` : ""}`,
      severity: /warn/i.test(item.severity)
        ? monacoRef.current.MarkerSeverity.Warning
        : /info/i.test(item.severity)
          ? monacoRef.current.MarkerSeverity.Info
          : monacoRef.current.MarkerSeverity.Error
    }));
    const model = editorRef.current.getModel();
    monacoRef.current.editor.setModelMarkers(model, "ai-coding-platform", markers);
    const decorations = (result?.errors || []).map((item) => ({
      range: new monacoRef.current.Range(Number(item.line) || 1, 1, Number(item.line) || 1, 1),
      options: { isWholeLine: true, className: "aiCodingErrorLine", glyphMarginClassName: "aiCodingErrorGlyph" }
    }));
    decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, decorations);
  }, [result]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const execute = async () => {
    if (!code.trim()) {
      setError("Please enter code before executing.");
      return;
    }
    if (form.useOwnKey === "Yes" && form.provider !== "Ollama" && !form.ownApiKey.trim()) {
      setError("Enter your API key or change Use own key to No.");
      return;
    }
    try {
      setRunning(true);
      setError("");
      setMessage("Checking code with AI...");
      setResult(null);
      const res = await ep1.post("/api/v2/neplms-ai-coding-platform/check", withScope({
        provider: form.provider,
        model: form.model,
        language: form.language,
        code,
        ownApiKey: form.useOwnKey === "Yes" ? form.ownApiKey : "",
        ollamaConfigId: form.ollamaConfigId
      }));
      setResult(res.data?.result || null);
      setMessage("AI code check completed.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to check code.");
    } finally {
      setRunning(false);
    }
  };

  const outputText = useMemo(() => {
    if (!result) return "";
    return [
      `Status: ${result.success ? "Success" : "Needs attention"}`,
      result.summary ? `Summary: ${result.summary}` : "",
      "",
      "Output:",
      result.output || "-",
      "",
      "Errors / Warnings:",
      ...(result.errors || []).length
        ? (result.errors || []).map((item) => `Line ${item.line || 1}: ${item.message}${item.suggestion ? `\n  Suggestion: ${item.suggestion}` : ""}`)
        : ["No errors reported."],
      "",
      "Notes:",
      ...(result.notes || []).length ? result.notes : ["-"]
    ].filter((item) => item !== "").join("\n");
  }, [result]);

  return (
    <MenuPageShell title="AI Coding Platform">
      <Box sx={{
        p: 2,
        "& .aiCodingErrorLine": { background: "rgba(244, 67, 54, 0.16)" },
        "& .aiCodingErrorGlyph": { background: "#d32f2f", borderRadius: "50%" }
      }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>AI Coding Platform</Typography>
                <Typography variant="body2" color="text.secondary">
                  Write code, ask the selected AI to check it, view expected output, and fix line-level errors.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Role: ${global1.role || ""}`} />
                <Chip label={`User: ${global1.user || ""}`} color="primary" variant="outlined" />
              </Stack>
            </Stack>
            {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="AI provider" value={form.provider} onChange={(e) => setField("provider", e.target.value)}>
                  {providerNames.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  freeSolo
                  options={modelOptions}
                  value={form.model}
                  onInputChange={(event, value) => setField("model", value || "")}
                  onChange={(event, value) => setField("model", value || "")}
                  renderInput={(params) => <TextField {...params} label="Model" />}
                />
              </Grid>
              {form.provider === "Ollama" && (
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    size="small"
                    options={options.ollamaConfigs || []}
                    getOptionLabel={(option) => `${option.name || ""} ${option.modelname || ""}`.trim()}
                    value={(options.ollamaConfigs || []).find((item) => item._id === form.ollamaConfigId) || null}
                    onChange={(event, value) => {
                      setField("ollamaConfigId", value?._id || "");
                      if (value?.modelname) setField("model", value.modelname);
                    }}
                    renderInput={(params) => <TextField {...params} label="Ollama configuration" />}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={form.provider === "Ollama" ? 2 : 3}>
                <Autocomplete
                  size="small"
                  options={options.languages || []}
                  value={form.language}
                  onChange={(event, value) => setField("language", value || "JavaScript")}
                  renderInput={(params) => <TextField {...params} label="Programming language" />}
                />
              </Grid>
              {form.provider !== "Ollama" && (
                <>
                  <Grid item xs={12} md={2}>
                    <TextField select fullWidth size="small" label="Use own key" value={form.useOwnKey} onChange={(e) => setField("useOwnKey", e.target.value)}>
                      <MenuItem value="No">No</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      label="Own API key"
                      value={form.ownApiKey}
                      onChange={(e) => setField("ownApiKey", e.target.value)}
                      disabled={form.useOwnKey !== "Yes"}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                  disabled={running}
                  onClick={execute}
                  sx={{ minHeight: 40 }}
                >
                  {running ? "Checking..." : "Execute"}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" color={options.savedKeys?.[form.provider] ? "success" : "default"} label={`${form.provider} settings key: ${options.savedKeys?.[form.provider] ? "Available" : "Not configured"}`} />
                  <Chip size="small" icon={<AutoFixHighIcon />} label="AI checks code and highlights reported line errors" />
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Code editor</Typography>
                <Box sx={{ height: "62vh", border: "1px solid #d7dde8", borderRadius: 1, overflow: "hidden" }}>
                  <Editor
                    height="100%"
                    language={editorLanguage(form.language)}
                    value={code}
                    theme="vs-dark"
                    onMount={handleEditorMount}
                    onChange={(value) => setCode(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      glyphMargin: true,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Output editor</Typography>
                <Box sx={{ height: "62vh", border: "1px solid #d7dde8", borderRadius: 1, overflow: "hidden" }}>
                  <Editor
                    height="100%"
                    language="text"
                    value={outputText}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {!!result?.correctedCode && (
            <Paper sx={{ p: 1.5 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>AI corrected code</Typography>
              <Box sx={{ height: 260, border: "1px solid #d7dde8", borderRadius: 1, overflow: "hidden" }}>
                <Editor
                  height="100%"
                  language={editorLanguage(form.language)}
                  value={result.correctedCode}
                  theme="vs-dark"
                  options={{ readOnly: true, minimap: { enabled: false }, wordWrap: "on", automaticLayout: true }}
                />
              </Box>
            </Paper>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
