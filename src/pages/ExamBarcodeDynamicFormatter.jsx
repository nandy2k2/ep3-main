import React, { useEffect, useState } from "react";
import { Autocomplete, Alert, Box, Button, Grid, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { AutoFixHigh, Download, LocalPrintshop } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";
const defaults = { Gemini: ["gemini-2.5-flash", "gemini-2.5-pro"], OpenAI: ["gpt-4.1", "gpt-4o"], Claude: ["claude-sonnet-4-5", "claude-opus-4-1"], Ollama: ["gemma3", "llava", "llama3.2"] };
const escape = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const fieldNames = { blockno: "Block No", regno: "Reg No", coursecode: "Course Code", examcode: "Exam", section: "" };
export function formattedBarcodeHtml(rows, barcodeMap, layout) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:"><title>Exam barcode dynamic</title><style>
    @page{size:100mm 26mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#eee;color:#000;font-family:Arial,sans-serif}.toolbar{padding:10px}.label{position:relative;width:100mm;height:26mm;background:#fff;margin:8px auto;overflow:hidden;break-after:page;page-break-after:always}.label:last-child{break-after:auto;page-break-after:auto}.barcode{position:absolute;width:33mm;height:18.2mm;display:flex;align-items:center;justify-content:center;overflow:visible}.barcode svg{width:33mm!important;height:auto!important;max-height:18.2mm!important;display:block;shape-rendering:crispEdges}.text{position:absolute;line-height:1.15;color:#000;overflow-wrap:anywhere;white-space:normal}@media print{html,body{width:100mm;margin:0;background:white}.toolbar{display:none}.label{margin:0}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">Print labels (100% scale)</button></div>${rows.map(row => `<section class="label"><div class="barcode" style="left:${layout.barcode.x}mm;top:${layout.barcode.y}mm">${barcodeMap[row.stickerid] || ""}</div>${layout.texts.map(item => {
      const value = item.field === "section" ? row.barcodeSection : row[item.field];
      return `<div class="text" style="left:${item.x}mm;top:${item.y}mm;width:${item.width}mm;font-size:${item.font}pt;text-align:${item.align};font-weight:${item.bold ? 700 : 400}">${escape(fieldNames[item.field] ? `${fieldNames[item.field]}: ${value || "-"}` : value || "-")}</div>`;
    }).join("")}</section>`).join("")}</body></html>`;
}
export default function ExamBarcodeDynamicFormatter({ rows, barcodeMap }) {
  const [provider, setProvider] = useState("Gemini"), [model, setModel] = useState(defaults.Gemini[0]), [models, setModels] = useState(defaults);
  const [prompt, setPrompt] = useState("Keep the barcode on the right. Make the enrollment number prominent and show exam code and section clearly below the barcode.");
  const [layout, setLayout] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    ep1.get("/api/v2/ai-image-field-extraction/models", { params: { colid: global1.colid } }).then(res => { const value = res.data.models || {}; setModels({ ...defaults, ...value, OpenAI: value.ChatGPT || defaults.OpenAI }); }).catch(() => {});
  }, []);
  useEffect(() => { setLayout(null); setError(""); }, [rows, barcodeMap]);
  const format = async () => {
    setBusy(true); setError("");
    try {
      const res = await ep1.post("/api/v2/conductexam/barcode-ai-format", { colid: global1.colid, ids: [...new Set(rows.map(row => row._id))], provider, model, prompt, layout });
      setLayout(res.data.layout);
    } catch (err) { setError(err.response?.data?.message || err.message); } finally { setBusy(false); }
  };
  const html = layout ? formattedBarcodeHtml(rows, barcodeMap, layout) : "";
  const print = () => { const win = window.open("", "_blank", "width=1000,height=800"); if (!win) { setError("Allow pop-ups to open the formatted print preview"); return; } win.document.write(html); win.document.close(); };
  const download = () => { const url = URL.createObjectURL(new Blob([html], { type: "text/html" })); const link = document.createElement("a"); link.href = url; link.download = "exam-barcode-dynamic.html"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <Paper variant="outlined" sx={{ p: 2, mt: 2 }} className="no-print"><Stack spacing={2}>
    <Typography variant="h6">AI label formatting</Typography>
    {busy && <LinearProgress />}{error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}><Autocomplete disabled={busy} options={Object.keys(defaults)} value={provider} onChange={(_, value) => { if (value) { setProvider(value); setModel(models[value]?.[0] || ""); } }} renderInput={params => <TextField {...params} label="AI provider" size="small" />} /></Grid>
      <Grid item xs={12} md={5}><Autocomplete disabled={busy} freeSolo options={models[provider] || []} value={model} onInputChange={(_, value) => setModel(value)} onChange={(_, value) => setModel(value || "")} renderInput={params => <TextField {...params} label="Model" size="small" />} /></Grid>
      <Grid item xs={12}><TextField disabled={busy} multiline minRows={3} fullWidth label="Formatting prompt" value={prompt} onChange={event => setPrompt(event.target.value)} /></Grid>
    </Grid>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" startIcon={<AutoFixHigh />} disabled={busy || !rows.length || !prompt.trim() || !model.trim()} onClick={format}>{busy ? "Formatting..." : "Format generated barcodes"}</Button><Button startIcon={<LocalPrintshop />} disabled={!html} onClick={print}>Formatted print preview</Button><Button startIcon={<Download />} disabled={!html} onClick={download}>Download HTML</Button></Stack>
    {html && <Box component="iframe" title="AI formatted barcode labels" sandbox="allow-scripts allow-modals" srcDoc={html} sx={{ width: "100%", height: 550, border: "1px solid #ddd" }} />}
  </Stack></Paper>;
}
