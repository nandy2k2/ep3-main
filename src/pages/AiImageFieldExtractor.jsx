import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ep1 from "../api/ep1";
import global1 from "./global1";

const defaultModels = {
  Gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
  ChatGPT: ["gpt-5.1", "gpt-5", "gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"],
  Claude: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"],
  Ollama: ["llama3.2-vision", "llava", "qwen2.5vl", "gemma3"]
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, mime: file.type || "image/png", data: reader.result });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function AiImageFieldExtractor({ title = "AI extract from image", fields = [], context = "", onApply }) {
  const [provider, setProvider] = useState("Gemini");
  const [model, setModel] = useState(defaultModels.Gemini[1]);
  const [models, setModels] = useState(defaultModels);
  const [ollamaConfigs, setOllamaConfigs] = useState([]);
  const [ollamaConfigId, setOllamaConfigId] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState({});
  const [notes, setNotes] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const targetFields = useMemo(() => fields.filter((field) => field?.name), [fields]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await ep1.get("/api/v2/ai-image-field-extraction/models", { params: { colid: global1.colid } });
        setModels({ ...defaultModels, ...(res.data?.models || {}) });
        const configs = res.data?.ollamaConfigs || [];
        setOllamaConfigs(configs);
        const defaultConfig = configs.find((item) => String(item.default || "").toLowerCase() === "yes") || configs[0];
        if (defaultConfig) setOllamaConfigId(defaultConfig._id);
      } catch {
        setModels(defaultModels);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const options = models[provider] || [];
    setModel(options[0] || "");
  }, [provider, models]);

  const runExtraction = async () => {
    if (!files.length) {
      setError("Select one or more images first");
      return;
    }
    if (!targetFields.length) {
      setError("No fields are available for extraction");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setProgress(8);
      const images = [];
      for (let index = 0; index < files.length; index += 1) {
        images.push(await fileToDataUrl(files[index]));
        setProgress(Math.min(35, Math.round(((index + 1) / files.length) * 35)));
      }
      setProgress(48);
      const res = await ep1.post("/api/v2/ai-image-field-extraction", {
        colid: global1.colid,
        provider,
        model,
        ollamaConfigId,
        context,
        fields: targetFields,
        images
      });
      setProgress(90);
      setResult(res.data?.fields || {});
      setNotes(res.data?.notes || []);
      setMessage("Fields extracted. Review and apply the values you want to use.");
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to extract fields from image");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (field, value) => {
    setResult((prev) => ({ ...prev, [field]: value }));
  };

  const resetExtraction = () => {
    setFiles([]);
    setResult({});
    setNotes([]);
    setProgress(0);
    setMessage("");
    setError("");
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#f8fbff" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload one or more images, extract the visible values with AI, review them, then apply to the form. You can repeat this any time.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {files.map((file) => <Chip key={`${file.name}-${file.size}`} size="small" label={file.name} />)}
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
      {progress > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" fontWeight={700}>AI extraction progress</Typography>
            <Typography variant="body2">{progress}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} md={2}>
          <TextField select fullWidth size="small" label="AI Provider" value={provider} onChange={(event) => setProvider(event.target.value)}>
            {["Gemini", "ChatGPT", "Ollama", "Claude"].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <Autocomplete
            freeSolo
            options={models[provider] || []}
            value={model || ""}
            onInputChange={(_, value) => setModel(value)}
            onChange={(_, value) => setModel(value || "")}
            renderInput={(params) => <TextField {...params} size="small" label="Model" />}
          />
        </Grid>
        {provider === "Ollama" && (
          <Grid item xs={12} md={3}>
            <TextField select fullWidth size="small" label="Ollama server" value={ollamaConfigId} onChange={(event) => setOllamaConfigId(event.target.value)}>
              {ollamaConfigs.map((item) => (
                <MenuItem key={item._id} value={item._id}>{item.name} - {item.modelname}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
        <Grid item xs={12} md={provider === "Ollama" ? 4 : 7}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={loading}>
              Select images
              <input hidden multiple type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
            </Button>
            <Button variant="contained" startIcon={<AutoFixHighIcon />} onClick={runExtraction} disabled={loading}>
              {loading ? "Extracting..." : "Extract fields"}
            </Button>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={resetExtraction} disabled={loading}>
              Repeat
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {Object.keys(result).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>Review extracted values</Typography>
          <Grid container spacing={1.5}>
            {targetFields.map((field) => (
              <Grid item xs={12} md={3} key={field.name}>
                <TextField
                  fullWidth
                  size="small"
                  label={field.label || field.name}
                  value={result[field.name] ?? ""}
                  onChange={(event) => updateResult(field.name, event.target.value)}
                />
              </Grid>
            ))}
            {notes.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">{notes.join(" ")}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button variant="contained" onClick={() => onApply?.(result)} disabled={loading}>
                Apply extracted values to form
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}
