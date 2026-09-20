import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Editor, {
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnNumberedList,
  BtnRedo,
  BtnUnderline,
  BtnUndo,
  Toolbar
} from "react-simple-wysiwyg";
import { Add, AutoFixHigh, CloudUpload, Delete, Edit, Print, Refresh, Save } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import AdvancedDrawingPad from "./QuestionDrawingPad";
import ep1 from "../api/ep1";
import global1 from "./global1";

const initialExam = { academicyear: "", category: "", program: "", programcode: "", semester: "", course: "", coursecode: "", examname: "", examcode: "", durationminutes: 60, starttime: "", endtime: "", timezone: "UTC", instructions: "", status: "Draft" };
const initialQuestionForm = { sectionid: "", questionid: "", questiontext: "", questionhtml: "", mathematicalexpression: "", tabledata: [], drawingdataurl: "", questiontype: "MCQ", marks: 1, modules: [], topics: [], cos: [], bloomlevels: [], options: [{ optiontext: "", iscorrect: true }, { optiontext: "", iscorrect: false }], imageurl: "", imagefilename: "", fileurl: "", filefilename: "", linkurl: "", attachments: [], contentblocks: [] };
const questionUploadHeaders = ["sectionname", "questiontext", "questiontype", "marks", "modules", "topics", "cos", "bloomlevels", "option1", "option2", "option3", "option4", "correctoption", "imageurl", "fileurl", "linkurl", "order"];
const languages = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "French", "Spanish"];
const geminiModels = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
const placementPracticeCategories = [
  "Technical aptitude", "Quantitative aptitude", "Logical reasoning", "Verbal ability", "Coding aptitude",
  "Data interpretation", "Problem solving", "Entrance test", "Campus recruitment", "Interview preparation",
  "Group discussion", "HR round", "Resume screening", "Communication skills", "Business aptitude",
  "Domain fundamentals", "Computer fundamentals", "Database concepts", "Operating systems", "Networking basics",
  "Web development", "Data structures", "Algorithms", "Cloud fundamentals", "Cybersecurity basics",
  "AI and ML basics", "Software testing", "Project management", "Case study", "Situational judgement",
  "Email writing", "Presentation skills", "Numerical ability", "Analytical reasoning", "Industry awareness"
];
const psychometricCategories = [
  "Personality orientation", "Career interest", "Work style", "Leadership", "Teamwork", "Communication",
  "Emotional resilience", "Problem solving", "Decision making", "Creativity", "Adaptability", "Integrity",
  "Motivation", "Stress response", "Learning preference", "Entrepreneurial tendency", "Analytical tendency",
  "Service orientation", "Research orientation", "Sales orientation", "Operations orientation", "Technology orientation",
  "Social confidence", "Detail orientation", "Risk preference", "Planning style", "Conflict handling",
  "Self discipline", "Empathy", "Career values"
];
const timezoneOptions = ["UTC", "Asia/Kolkata", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
const fmt = (value) => value ? new Date(value).toLocaleString() : "";
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local browser timezone";
const fmtZone = (value, timeZone) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, { timeZone: timeZone || browserTimeZone(), dateStyle: "medium", timeStyle: "short" });
  } catch {
    return fmt(value);
  }
};
const dtLocal = (value) => value ? String(value).slice(0, 16) : "";
const rowsOf = (rows) => (rows || []).map((row) => ({ ...row, id: row._id }));
const uniqueValues = (rows, field) => [...new Set((rows || []).map((row) => row?.[field]).filter(Boolean))].sort();
const mathSymbols = ["√", "∑", "∫", "π", "θ", "≤", "≥", "≠", "∞", "±", "÷", "×", "²", "³", "α", "β", "γ", "Δ", "λ", "μ", "σ", "Ω"];
const escHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const nl2br = (value) => escHtml(value).replace(/\n/g, "<br/>");
const sanitizeRichHtml = (value) => String(value || "")
  .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  .replace(/\son\w+="[^"]*"/gi, "")
  .replace(/\son\w+='[^']*'/gi, "")
  .replace(/javascript:/gi, "");
const renderRichText = (value) => {
  const html = sanitizeRichHtml(value);
  return /<[^>]+>/.test(html) ? html : nl2br(html);
};
const tableToHtml = (tabledata = []) => {
  if (!Array.isArray(tabledata) || !tabledata.length) return "";
  return `<table class="question-content-table">${tabledata.map((row) => `<tr>${(row || []).map((cell) => `<td>${nl2br(cell)}</td>`).join("")}</tr>`).join("")}</table>`;
};
const contentBlockHtml = (block = {}) => {
  const type = block.blocktype || block.type;
  if (type === "text") return `<div class="question-rich-text">${renderRichText(block.text)}</div>`;
  if (type === "math") return `<div class="question-math">${nl2br(block.text)}</div>`;
  if (type === "table") return tableToHtml(block.tabledata);
  if (type === "image") return block.url ? `<div class="question-media"><img src="${escHtml(block.url)}" alt="${escHtml(block.title || block.filename || "Question image")}" /></div>` : "";
  if (type === "drawing") return block.dataurl ? `<div class="question-media"><img src="${escHtml(block.dataurl)}" alt="${escHtml(block.title || "Question drawing")}" /></div>` : "";
  if (type === "attachment") return block.url ? `<div class="question-attachment"><a href="${escHtml(block.url)}" target="_blank" rel="noreferrer">${escHtml(block.title || block.filename || "Attachment")}</a></div>` : "";
  return "";
};
const richQuestionHtml = (question = {}) => {
  if (Array.isArray(question.contentblocks) && question.contentblocks.length) {
    const mainQuestion = question.questionhtml || question.questiontext;
    const firstTextBlock = question.contentblocks.find((block) => (block.blocktype || block.type) === "text");
    const firstTextPlain = String(firstTextBlock?.text || "").replace(/<[^>]*>/g, "").trim();
    const mainPlain = String(mainQuestion || "").replace(/<[^>]*>/g, "").trim();
    const mainHtml = mainPlain && mainPlain !== firstTextPlain ? `<div class="question-rich-text">${renderRichText(mainQuestion)}</div>` : "";
    return `${mainHtml}${question.contentblocks.map(contentBlockHtml).join("")}`;
  }
  const textHtml = question.questionhtml ? renderRichText(question.questionhtml) : nl2br(question.questiontext);
  const math = question.mathematicalexpression ? `<div class="question-math">${nl2br(question.mathematicalexpression)}</div>` : "";
  const table = tableToHtml(question.tabledata);
  const image = question.imageurl ? `<div class="question-media"><img src="${escHtml(question.imageurl)}" alt="${escHtml(question.imagefilename || "Question image")}" /></div>` : "";
  const drawing = question.drawingdataurl ? `<div class="question-media"><img src="${escHtml(question.drawingdataurl)}" alt="Question drawing" /></div>` : "";
  const attachments = [
    ...(question.fileurl ? [{ title: question.filefilename || "Question file", url: question.fileurl }] : []),
    ...((question.attachments || []).filter((item) => item.url))
  ].map((item) => `<div class="question-attachment"><a href="${escHtml(item.url)}" target="_blank" rel="noreferrer">${escHtml(item.title || item.filename || "Attachment")}</a></div>`).join("");
  const link = question.linkurl ? `<div class="question-attachment"><a href="${escHtml(question.linkurl)}" target="_blank" rel="noreferrer">Question link</a></div>` : "";
  return `<div class="question-rich-text">${textHtml}</div>${math}${table}${image}${drawing}${attachments}${link}`;
};

function AttachmentLink({ url, label = "Open" }) {
  return url ? <a href={url} target="_blank" rel="noreferrer">{label}</a> : null;
}

function ToolbarButton({ children, title, command, value, disabled }) {
  const apply = (event) => {
    event.preventDefault();
    if (disabled) return;
    document.execCommand(command, false, value);
  };
  return <button type="button" title={title} disabled={disabled} onMouseDown={apply} style={{ minWidth: 30, minHeight: 28, border: "1px solid #cbd5e1", background: "#fff", borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>;
}

function ToolbarSelect({ title, value, options, command, disabled }) {
  const [selected, setSelected] = useState(value);
  const apply = (event) => {
    const next = event.target.value;
    setSelected(next);
    if (!disabled) document.execCommand(command, false, next);
  };
  return (
    <select title={title} value={selected} disabled={disabled} onChange={apply} style={{ height: 30, border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff" }}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function ToolbarColor({ title, command, defaultValue, disabled }) {
  const [value, setValue] = useState(defaultValue);
  const apply = (event) => {
    const next = event.target.value;
    setValue(next);
    if (!disabled) document.execCommand(command, false, next);
  };
  return (
    <label title={title} style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 30, padding: "0 6px", border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff", fontSize: 12 }}>
      {title}
      <input type="color" value={value} disabled={disabled} onChange={apply} style={{ width: 26, height: 22, border: 0, padding: 0, background: "transparent" }} />
    </label>
  );
}

function RichTextBlockEditor({ value, onChange, disabled }) {
  const fontSizes = [
    { value: "1", label: "10" },
    { value: "2", label: "12" },
    { value: "3", label: "14" },
    { value: "4", label: "16" },
    { value: "5", label: "18" },
    { value: "6", label: "24" },
    { value: "7", label: "32" }
  ];
  return (
    <Box sx={{ "& .rsw-editor": { border: "1px solid #cbd5e1", borderRadius: "8px", bgcolor: "#fff" }, "& .rsw-toolbar": { borderBottom: "1px solid #e5e7eb", flexWrap: "wrap", gap: "4px", p: "6px" }, "& .rsw-ce": { minHeight: 130, p: 1.25, outline: "none", "& ul": { listStyle: "disc", pl: 3 }, "& ol": { listStyle: "decimal", pl: 3 } } }}>
      <Editor value={value || ""} disabled={disabled} placeholder="Type formatted question text..." onChange={(event) => onChange(event.target.value)}>
        <Toolbar>
          <BtnUndo disabled={disabled} />
          <BtnRedo disabled={disabled} />
          <BtnBold disabled={disabled} />
          <BtnItalic disabled={disabled} />
          <BtnUnderline disabled={disabled} />
          <BtnBulletList disabled={disabled} />
          <BtnNumberedList disabled={disabled} />
          <ToolbarButton title="Decrease indent" command="outdent" disabled={disabled}>-</ToolbarButton>
          <ToolbarButton title="Increase indent" command="indent" disabled={disabled}>+</ToolbarButton>
          <ToolbarSelect title="Font size" command="fontSize" value="3" options={fontSizes} disabled={disabled} />
          <ToolbarColor title="Text" command="foreColor" defaultValue="#111827" disabled={disabled} />
          <ToolbarColor title="Highlight" command="hiliteColor" defaultValue="#fff3a3" disabled={disabled} />
          <BtnClearFormatting disabled={disabled} />
        </Toolbar>
      </Editor>
    </Box>
  );
}

function QuestionTableEditor({ value = [], onChange, disabled }) {
  const table = Array.isArray(value) ? value : [];
  const ensureTable = () => onChange(table.length ? table : [["", ""], ["", ""]]);
  const updateCell = (rowIndex, colIndex, cellValue) => onChange(table.map((row, rIndex) => rIndex === rowIndex ? row.map((cell, cIndex) => cIndex === colIndex ? cellValue : cell) : row));
  const cols = Math.max(1, ...table.map((row) => row.length));
  if (!table.length) return <Button size="small" variant="outlined" disabled={disabled} onClick={ensureTable}>Create Table</Button>;
  return (
    <Stack spacing={1}>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& td": { border: "1px solid #cbd5e1", p: 0.5 } }}>
          <tbody>
            {table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <TextField fullWidth multiline minRows={1} variant="standard" value={row[colIndex] || ""} disabled={disabled} onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)} InputProps={{ disableUnderline: true, sx: { fontSize: 13, px: 1 } }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button size="small" disabled={disabled} onClick={() => onChange([...table, Array(cols).fill("")])}>Add Row</Button>
        <Button size="small" disabled={disabled} onClick={() => onChange(table.map((row) => [...row, ""]))}>Add Column</Button>
        <Button size="small" color="error" disabled={disabled} onClick={() => onChange([])}>Remove Table</Button>
      </Stack>
    </Stack>
  );
}

function DrawingPad({ value, onChange, disabled, initialColor = "#111827", initialBrushSize = 2, onStyleChange = () => {} }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(initialColor || "#111827");
  const [brushSize, setBrushSize] = useState(Number(initialBrushSize || 2));
  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return { x: (source.clientX - rect.left) * (canvas.width / rect.width), y: (source.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const start = (event) => {
    if (disabled) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = point(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (event) => {
    if (!drawingRef.current || disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.stroke();
  };
  const stop = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) return;
    const image = new Image();
    image.onload = () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = value;
  }, [value]);
  useEffect(() => { onStyleChange({ color, brushsize: brushSize }); }, [color, brushSize]);
  return (
    <Box>
      <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} md={3}><TextField fullWidth label="Brush color" type="color" value={color} disabled={disabled} onChange={(e) => setColor(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={6}><Typography variant="caption" color="text.secondary">Brush size</Typography><Slider min={1} max={18} value={brushSize} disabled={disabled} onChange={(_, value) => setBrushSize(value)} valueLabelDisplay="auto" /></Grid>
      </Grid>
      <Box component="canvas" ref={canvasRef} width={760} height={190} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop} sx={{ width: "100%", height: 190, bgcolor: "#fff", border: "1px solid #cbd5e1", borderRadius: 1, touchAction: "none", cursor: disabled ? "not-allowed" : "crosshair" }} />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => onChange(canvasRef.current.toDataURL("image/png"))}>Save Drawing</Button>
        <Button size="small" color="error" variant="outlined" disabled={disabled || !value} onClick={clear}>Clear</Button>
      </Stack>
    </Box>
  );
}

function OnlineQuestionContentEditor({ question, setQuestion, uploadBlockFile, disabled }) {
  const blocks = Array.isArray(question.contentblocks) ? question.contentblocks : [];
  const patchBlocks = (contentblocks) => setQuestion((prev) => ({ ...prev, contentblocks }));
  const addBlock = (blocktype) => {
    const defaults = {
      text: { blocktype, text: question.questiontext && !blocks.length ? question.questiontext : "" },
      math: { blocktype, text: "", color: "#111827", brushsize: 2 },
      table: { blocktype, tabledata: [["", ""], ["", ""]] },
      image: { blocktype, url: "", filename: "", title: "" },
      drawing: { blocktype, dataurl: "", color: "#111827", brushsize: 2 },
      attachment: { blocktype, url: "", filename: "", title: "" }
    };
    patchBlocks([...blocks, defaults[blocktype]]);
  };
  const updateBlock = (index, patch) => patchBlocks(blocks.map((block, itemIndex) => itemIndex === index ? { ...block, ...patch } : block));
  const moveBlock = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    patchBlocks(next);
  };
  const uploadForBlock = async (file, blockIndex) => {
    const data = await uploadBlockFile(file);
    if (data?.url) updateBlock(blockIndex, { url: data.url, filename: data.filename || data.label || "" });
  };
  const moveQuestionText = () => {
    if (!(question.questionhtml || question.questiontext)) return;
    patchBlocks([{ blocktype: "text", text: renderRichText(question.questionhtml || question.questiontext) }, ...blocks]);
    setQuestion((prev) => ({ ...prev, questiontext: "", questionhtml: "" }));
  };
  return (
    <Paper variant="outlined" sx={{ p: 1.5, width: "100%", bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
        <Button size="small" variant="contained" disabled={disabled || !(question.questionhtml || question.questiontext)} onClick={moveQuestionText}>Move Question Text to Rich Editor</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("text")}>Add Text</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("math")}>Add Math</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("table")}>Add Table</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("image")}>Add Photo</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("drawing")}>Add Drawing</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("attachment")}>Add Attachment</Button>
      </Stack>
      {!blocks.length && <Alert severity="info">Add blocks in the exact order in which the question should appear.</Alert>}
      <Stack spacing={1.5}>
        {blocks.map((block, index) => (
          <Paper key={`${block.blocktype}-${index}`} variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fafc" }}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Chip size="small" label={`${index + 1}. ${block.blocktype}`} />
              <Stack direction="row" spacing={0.5}>
                <Button size="small" disabled={disabled || index === 0} onClick={() => moveBlock(index, -1)}>Up</Button>
                <Button size="small" disabled={disabled || index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>Down</Button>
                <Button size="small" color="error" disabled={disabled} onClick={() => patchBlocks(blocks.filter((_, itemIndex) => itemIndex !== index))}>Delete</Button>
              </Stack>
            </Stack>
            {block.blocktype === "text" && <RichTextBlockEditor value={block.text || ""} disabled={disabled} onChange={(text) => updateBlock(index, { text })} />}
            {block.blocktype === "math" && (
              <Box>
                <TextField fullWidth multiline minRows={2} label="Mathematical expression" disabled={disabled} value={block.text || ""} onChange={(e) => updateBlock(index, { text: e.target.value })} />
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>{mathSymbols.map((symbol) => <Button key={symbol} size="small" variant="outlined" disabled={disabled} onClick={() => updateBlock(index, { text: `${block.text || ""}${symbol}` })} sx={{ minWidth: 34 }}>{symbol}</Button>)}</Stack>
              </Box>
            )}
            {block.blocktype === "table" && <QuestionTableEditor value={block.tabledata || []} disabled={disabled} onChange={(tabledata) => updateBlock(index, { tabledata })} />}
            {block.blocktype === "image" && (
              <Paper variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadForBlock(event.dataTransfer.files?.[0], index); }} sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#fff" }}>
                <TextField fullWidth label="Image title" disabled={disabled} value={block.title || ""} onChange={(e) => updateBlock(index, { title: e.target.value })} sx={{ mb: 1 }} />
                <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={disabled}>Upload or Drop Photo<input hidden type="file" accept="image/*" onChange={(e) => uploadForBlock(e.target.files?.[0], index)} /></Button>
                {block.url && <Box sx={{ mt: 1 }}><img src={block.url} alt={block.title || block.filename || "Question"} style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }} /></Box>}
              </Paper>
            )}
            {block.blocktype === "drawing" && <AdvancedDrawingPad value={block.dataurl || ""} disabled={disabled} initialColor={block.color || "#111827"} initialBrushSize={block.brushsize || 2} onStyleChange={(style) => updateBlock(index, style)} onChange={(dataurl) => updateBlock(index, { dataurl })} />}
            {block.blocktype === "attachment" && (
              <Paper variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadForBlock(event.dataTransfer.files?.[0], index); }} sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#fff" }}>
                <TextField fullWidth label="Attachment title" disabled={disabled} value={block.title || ""} onChange={(e) => updateBlock(index, { title: e.target.value })} sx={{ mb: 1 }} />
                <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={disabled}>Upload or Drop Attachment<input hidden type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => uploadForBlock(e.target.files?.[0], index)} /></Button>
                {block.url && <Button size="small" href={block.url} target="_blank" rel="noreferrer" sx={{ display: "block", mx: "auto", mt: 1 }}>{block.title || block.filename || "Attachment"}</Button>}
              </Paper>
            )}
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}

function DynamicFilters({ fields, filters, setFilters, onApply, loading, valueOptions = {} }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.2}>
        {filters.map((filter, index) => (
          <Grid container spacing={1.2} key={`filter-${index}`}>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Field" value={filter.field} onChange={(e) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, field: e.target.value } : item))}>
                {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth label="Operator" value={filter.operator} onChange={(e) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, operator: e.target.value } : item))}>
                <MenuItem value="contains">Contains</MenuItem>
                <MenuItem value="equals">Equals</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={valueOptions[filter.field] || []}
                value={filter.value || ""}
                onInputChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value } : item))}
                onChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value: value || "" } : item))}
                renderInput={(params) => <TextField {...params} fullWidth label="Value" />}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button color="error" sx={{ height: 56 }} onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
            </Grid>
          </Grid>
        ))}
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Add />} variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: fields[0], operator: "contains", value: "" }])}>Add Filter</Button>
          <Button variant="contained" disabled={loading} onClick={onApply}>Apply</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function MultiCheckAutocomplete({ label, options = [], value = [], onChange }) {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={Array.isArray(value) ? value : []}
      onChange={(_, next) => onChange(next)}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox checked={selected} sx={{ mr: 1 }} />
          <Box sx={{ whiteSpace: "normal" }}>{option}</Box>
        </li>
      )}
      renderTags={(selected, getTagProps) => selected.map((option, index) => <Chip size="small" label={option} {...getTagProps({ index })} />)}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

const examFilterFields = ["academicyear", "category", "program", "programcode", "semester", "course", "coursecode", "examname", "examcode", "status", "username", "user"];
const rowMatchesFilters = (row, filters = []) => filters.every((filter) => {
  const field = filter.field;
  const value = String(filter.value || "").trim().toLowerCase();
  if (!field || !value) return true;
  const rowValue = String(row?.[field] || "").toLowerCase();
  return String(filter.operator || "contains").toLowerCase() === "equals" ? rowValue === value : rowValue.includes(value);
});

export function OnlineExamManagementPage({ myMode = false, admissionMode = false, examContext, pageTitle, categoryTemplates = [], psychometricMode = false }) {
  const activeExamContext = examContext || (admissionMode ? "Admission" : "Student");
  const activeTitle = pageTitle || (admissionMode ? "Admission Online Examination" : (myMode ? "My Online Exam" : "Online Examination"));
  const [options, setOptions] = useState({ programs: [], ollama: [] });
  const [exams, setExams] = useState([]);
  const [listFilters, setListFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [exam, setExam] = useState(initialExam);
  const [editingId, setEditingId] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [sectionForm, setSectionForm] = useState({ sectionname: "", sectiontype: "MCQ", instructions: "", order: 0 });
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [questionOptions, setQuestionOptions] = useState({ modules: [], topics: [], cos: [], bloomlevels: [] });
  const [ai, setAi] = useState({ provider: "Gemini", geminiModel: "gemini-2.5-flash", ollamaConfigId: "", language: "English", difficulty: "Medium", count: 5, topic: "", mapWithAi: true, categories: [] });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [opt, list] = await Promise.all([
        ep1.get(admissionMode ? "/api/v2/admission-online-exam/options" : "/api/v2/online-exam/options", { params: { colid: global1.colid, examcontext: activeExamContext } }),
        ep1.get("/api/v2/online-exam/exams", { params: { colid: global1.colid, examcontext: activeExamContext, ...(!admissionMode && myMode ? { createdby: global1.user } : {}) } })
      ]);
      setOptions(opt.data || { programs: [], ollama: [] });
      setExams(list.data?.data || []);
      if (selectedExam?._id) {
        const fresh = (list.data?.data || []).find((x) => x._id === selectedExam._id);
        if (fresh) setSelectedExam(fresh);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load online exams.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!selectedExam?._id) return;
    ep1.get("/api/v2/online-exam/question-options", {
      params: {
        colid: global1.colid,
        academicyear: selectedExam.academicyear,
        program: selectedExam.program,
        programcode: selectedExam.programcode,
        course: selectedExam.course,
        coursecode: selectedExam.coursecode
      }
    }).then((res) => setQuestionOptions(res.data || { modules: [], topics: [], cos: [], bloomlevels: [] }))
      .catch(() => setQuestionOptions({ modules: [], topics: [], cos: [], bloomlevels: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"] }));
  }, [selectedExam]);

  const courseMaps = admissionMode ? [] : (options.programs || []);
  const displayedExams = useMemo(() => exams.filter((row) => rowMatchesFilters(row, listFilters)), [exams, listFilters]);
  const examValueOptions = useMemo(() => Object.fromEntries(examFilterFields.map((field) => [field, uniqueValues(exams, field)])), [exams]);
  const yearOptions = useMemo(() => admissionMode ? (options.applicationValues?.academicyear || options.examValues?.academicyear || []) : uniqueValues(courseMaps, "academicyear"), [admissionMode, options, courseMaps]);
  const categoryOptions = useMemo(() => admissionMode ? (options.applicationValues?.category || options.examValues?.category || []) : [], [admissionMode, options]);
  const programOptions = useMemo(() => admissionMode ? (options.applicationValues?.programapplied || options.examValues?.program || []) : uniqueValues(courseMaps.filter((p) => !exam.academicyear || p.academicyear === exam.academicyear), "program"), [admissionMode, options, courseMaps, exam.academicyear]);
  const programCodeOptions = useMemo(() => admissionMode ? (options.applicationValues?.programcode || options.examValues?.programcode || []) : uniqueValues(courseMaps.filter((p) => (!exam.academicyear || p.academicyear === exam.academicyear) && (!exam.program || p.program === exam.program)), "programcode"), [admissionMode, options, courseMaps, exam.academicyear, exam.program]);
  const semesterOptions = useMemo(() => uniqueValues(courseMaps.filter((p) => (!exam.academicyear || p.academicyear === exam.academicyear) && (!exam.programcode || p.programcode === exam.programcode)), "semester"), [courseMaps, exam.academicyear, exam.programcode]);
  const courseOptions = useMemo(() => uniqueValues(courseMaps.filter((p) => (!exam.academicyear || p.academicyear === exam.academicyear) && (!exam.programcode || p.programcode === exam.programcode) && (!exam.semester || String(p.semester || "") === String(exam.semester || ""))), "course"), [courseMaps, exam.academicyear, exam.programcode, exam.semester]);
  const courseCodeOptions = useMemo(() => uniqueValues(courseMaps.filter((p) => (!exam.academicyear || p.academicyear === exam.academicyear) && (!exam.programcode || p.programcode === exam.programcode) && (!exam.semester || String(p.semester || "") === String(exam.semester || "")) && (!exam.course || p.course === exam.course)), "coursecode"), [courseMaps, exam.academicyear, exam.programcode, exam.semester, exam.course]);
  const updateExamCourseField = (field, value) => {
    setExam((prev) => {
      const next = { ...prev, [field]: value || "" };
      if (admissionMode) {
        if (field === "programcode") {
          const knownProgram = (options.applicationValues?.programapplied || options.examValues?.program || []).find((item) => item === next.program);
          return { ...next, program: knownProgram || next.program, course: "Admission Entrance", coursecode: next.category || "ENTRANCE" };
        }
        return { ...next, course: "Admission Entrance", coursecode: next.category || "ENTRANCE" };
      }
      const match = courseMaps.find((p) =>
        (!next.academicyear || p.academicyear === next.academicyear)
        && (!next.program || p.program === next.program)
        && (!next.programcode || p.programcode === next.programcode)
        && (!next.semester || String(p.semester || "") === String(next.semester || ""))
        && (!next.course || p.course === next.course)
        && (!next.coursecode || p.coursecode === next.coursecode)
      );
      return match ? { ...next, program: next.program || match.program || "", programcode: next.programcode || match.programcode || "", semester: next.semester || match.semester || "", course: next.course || match.course || "", coursecode: next.coursecode || match.coursecode || "" } : next;
    });
  };
  const saveExam = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/online-exam/exams", { ...exam, examcontext: activeExamContext, course: admissionMode ? "Admission Entrance" : exam.course, coursecode: admissionMode ? (exam.category || "ENTRANCE") : exam.coursecode, id: editingId, colid: global1.colid, user: global1.user, username: global1.name });
      setExam(initialExam);
      setEditingId("");
      setMessage("Online exam saved.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save exam.");
    } finally {
      setLoading(false);
    }
  };
  const editExam = (row) => {
    setEditingId(row._id);
    setExam({ ...initialExam, ...row, starttime: dtLocal(row.starttime), endtime: dtLocal(row.endtime) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteExam = async (row) => {
    if (!window.confirm("Delete this online exam?")) return;
    await ep1.post("/api/v2/online-exam/exams-delete", { colid: global1.colid, id: row._id });
    load();
  };
  const saveSection = async () => {
    if (!selectedExam?._id) return setMessage("Select an exam first.");
    await ep1.post("/api/v2/online-exam/sections", { ...sectionForm, colid: global1.colid, examid: selectedExam._id });
    setSectionForm({ sectionname: "", sectiontype: "MCQ", instructions: "", order: 0 });
    await load();
  };
  const upload = async (file, field) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("colid", global1.colid);
    fd.append("context", "question");
    const res = await ep1.post("/api/v2/online-exam/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    const uploaded = res.data?.data || {};
    setQuestionForm((prev) => ({ ...prev, [field]: uploaded.url || "", [`${field.replace(/url$/, "")}filename`]: uploaded.filename || uploaded.label || "" }));
    return uploaded;
  };
  const uploadBlockFile = async (file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("colid", global1.colid);
    fd.append("context", "question-block");
    const res = await ep1.post("/api/v2/online-exam/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data?.data || null;
  };
  const saveQuestion = async (payload = questionForm) => {
    if (!selectedExam?._id || !payload.sectionid) return setMessage("Select exam and section.");
    await ep1.post("/api/v2/online-exam/questions", { ...payload, colid: global1.colid, examid: selectedExam._id });
    setQuestionForm({ ...initialQuestionForm, sectionid: payload.sectionid, questiontype: payload.questiontype });
    setMessage(payload.questionid ? "Question updated." : "Question added.");
    await load();
  };
  const deleteQuestion = async (sectionid, questionid) => {
    if (!selectedExam?._id || !sectionid || !questionid) return;
    if (!window.confirm("Delete this question?")) return;
    await ep1.post("/api/v2/online-exam/questions-delete", { colid: global1.colid, examid: selectedExam._id, sectionid, questionid });
    setSelectedQuestionIds((prev) => prev.filter((id) => id !== `${sectionid}::${questionid}`));
    setMessage("Question deleted.");
    await load();
  };
  const deleteSelectedQuestions = async () => {
    if (!selectedExam?._id || !selectedQuestionIds.length) return setMessage("Select at least one question.");
    if (!window.confirm(`Delete ${selectedQuestionIds.length} selected question(s)?`)) return;
    setLoading(true);
    try {
      for (const key of selectedQuestionIds) {
        const [sectionid, questionid] = key.split("::");
        await ep1.post("/api/v2/online-exam/questions-delete", { colid: global1.colid, examid: selectedExam._id, sectionid, questionid });
      }
      setSelectedQuestionIds([]);
      setMessage("Selected questions deleted.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete selected questions.");
    } finally {
      setLoading(false);
    }
  };
  const downloadQuestionTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      sectionname: selectedExam?.sections?.find((s) => s._id === questionForm.sectionid)?.sectionname || "Section A",
      questiontext: "Sample MCQ question text",
      questiontype: "MCQ",
      marks: 1,
      modules: "Module 1",
      topics: "Topic 1",
      cos: "CO1",
      bloomlevels: "Understand",
      option1: "Option A",
      option2: "Option B",
      option3: "Option C",
      option4: "Option D",
      correctoption: "1",
      imageurl: "",
      fileurl: "",
      linkurl: "",
      order: 1
    }], { header: questionUploadHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "online_exam_questions_template.xlsx");
  };
  const splitCell = (value) => String(value || "").split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  const normalizeQuestionRow = (row) => {
    const section = (selectedExam?.sections || []).find((s) => String(s.sectionname || "").trim().toLowerCase() === String(row.sectionname || "").trim().toLowerCase());
    const sectionid = section?._id || row.sectionid || questionForm.sectionid;
    const questiontype = row.questiontype || questionForm.questiontype || "MCQ";
    const options = [1, 2, 3, 4, 5, 6].map((index) => String(row[`option${index}`] || "").trim()).filter(Boolean);
    const correct = String(row.correctoption || row.correctanswer || "1").trim().toLowerCase();
    return {
      sectionid,
      questionid: "",
      questiontext: row.questiontext || row.question || "",
      questiontype,
      marks: row.marks || 1,
      modules: splitCell(row.modules || row.module),
      topics: splitCell(row.topics || row.topic),
      cos: splitCell(row.cos || row.co),
      bloomlevels: splitCell(row.bloomlevels || row.blooms),
      options: /^mcq$/i.test(questiontype) ? options.map((optiontext, index) => ({ optiontext, iscorrect: correct === String(index + 1) || correct === optiontext.toLowerCase() })) : [],
      imageurl: row.imageurl || "",
      imagefilename: row.imagefilename || "",
      fileurl: row.fileurl || "",
      filefilename: row.filefilename || "",
      linkurl: row.linkurl || "",
      attachments: [],
      contentblocks: [],
      order: row.order || 0
    };
  };
  const readQuestionExcel = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!selectedExam?._id) return setMessage("Select an exam first.");
    if (!questionForm.sectionid && !(selectedExam.sections || []).length) return setMessage("Add/select a section before bulk upload.");
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }).map(normalizeQuestionRow).filter((row) => row.sectionid && row.questiontext);
        if (!rows.length) {
          setMessage("No valid questions found in the uploaded file.");
          return;
        }
        for (const row of rows) {
          await ep1.post("/api/v2/online-exam/questions", { ...row, colid: global1.colid, examid: selectedExam._id });
        }
        setMessage(`${rows.length} question(s) uploaded.`);
        await load();
      } catch (error) {
        setMessage(error.response?.data?.message || error.message || "Unable to bulk upload questions.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const editQuestion = (section, question) => {
    setQuestionForm({
      ...initialQuestionForm,
      ...question,
      sectionid: section._id,
      questionid: question._id,
      modules: question.modules || [],
      topics: question.topics || [],
      cos: question.cos || [],
      bloomlevels: question.bloomlevels || [],
      options: question.options?.length ? question.options : initialQuestionForm.options,
      tabledata: question.tabledata || [],
      attachments: question.attachments || [],
      contentblocks: question.contentblocks || []
    });
    window.scrollTo({ top: 520, behavior: "smooth" });
  };
  const generate = async () => {
    if (!selectedExam?._id) return setMessage("Select exam first.");
    if (!questionForm.sectionid && !categoryTemplates.length) return setMessage("Select exam and section.");
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/online-exam/generate-questions", {
        ...ai,
        provider: ai.provider,
        colid: global1.colid,
        examcontext: activeExamContext,
        categories: ai.categories,
        questiontype: questionForm.questiontype,
        course: selectedExam.course,
        coursecode: selectedExam.coursecode,
        modules: questionForm.modules,
        topics: questionForm.topics,
        cos: questionForm.cos,
        bloomlevels: questionForm.bloomlevels
      });
      const generatedRows = res.data?.data || [];
      const sectionMap = new Map((selectedExam.sections || []).map((section) => [String(section.sectionname || "").trim().toLowerCase(), section._id]));
      const ensureSection = async (sectionName) => {
        const cleanName = String(sectionName || "").trim();
        if (!cleanName) return questionForm.sectionid;
        const key = cleanName.toLowerCase();
        if (sectionMap.has(key)) return sectionMap.get(key);
        const sectionRes = await ep1.post("/api/v2/online-exam/sections", {
          colid: global1.colid,
          user: global1.user,
          examid: selectedExam._id,
          sectionname: cleanName,
          sectiontype: questionForm.questiontype,
          instructions: `Generated for ${cleanName}`,
          order: sectionMap.size + 1
        });
        const created = (sectionRes.data?.data?.sections || []).find((section) => String(section.sectionname || "").trim().toLowerCase() === key);
        if (created?._id) sectionMap.set(key, created._id);
        return created?._id || questionForm.sectionid;
      };
      for (const [index, q] of generatedRows.entries()) {
        const generatedSection = q.sectionname || q.category || ai.categories?.[index % Math.max(ai.categories?.length || 1, 1)] || "";
        const sectionid = await ensureSection(generatedSection);
        if (!sectionid) continue;
        await ep1.post("/api/v2/online-exam/questions", {
          ...questionForm,
          colid: global1.colid,
          user: global1.user,
          examid: selectedExam._id,
          sectionid,
          questionid: "",
          questiontext: q.questiontext,
          questionhtml: q.questionhtml || "",
          marks: q.marks || questionForm.marks,
          options: q.options || [],
          modules: q.modules || questionForm.modules,
          topics: q.topics || questionForm.topics,
          cos: q.cos || questionForm.cos,
          bloomlevels: q.bloomlevels || questionForm.bloomlevels,
          contentblocks: q.contentblocks || []
        });
      }
      await load();
      setMessage("AI generated questions added.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title={activeTitle}>
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center"><Typography variant="h5" fontWeight={900} sx={{ flex: 1 }}>{activeTitle}</Typography><Button startIcon={<Refresh />} onClick={load}>Refresh</Button></Stack>
          {myMode && <Alert severity="info">Only exams created by {global1.name || global1.user} are shown on this page.</Alert>}
          {message && <Alert severity={/unable|select/i.test(message) ? "warning" : "success"} onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}><Autocomplete freeSolo options={yearOptions} value={exam.academicyear || ""} onInputChange={(_, value) => updateExamCourseField("academicyear", value)} onChange={(_, value) => updateExamCourseField("academicyear", value)} renderInput={(params) => <TextField {...params} label="Academic year" />} /></Grid>
              {(admissionMode || !!categoryTemplates.length) && <Grid item xs={12} md={2}><Autocomplete freeSolo options={categoryTemplates.length ? categoryTemplates : categoryOptions} value={exam.category || ""} onInputChange={(_, value) => updateExamCourseField("category", value)} onChange={(_, value) => updateExamCourseField("category", value)} renderInput={(params) => <TextField {...params} label="Category" />} /></Grid>}
              <Grid item xs={12} md={2}><Autocomplete freeSolo options={programOptions} value={exam.program || ""} onInputChange={(_, value) => updateExamCourseField("program", value)} onChange={(_, value) => updateExamCourseField("program", value)} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete freeSolo options={programCodeOptions} value={exam.programcode || ""} onInputChange={(_, value) => updateExamCourseField("programcode", value)} onChange={(_, value) => updateExamCourseField("programcode", value)} renderInput={(params) => <TextField {...params} label="Program code" />} /></Grid>
              {!admissionMode && <Grid item xs={12} md={2}><Autocomplete freeSolo options={semesterOptions} value={exam.semester || ""} onInputChange={(_, value) => updateExamCourseField("semester", value)} onChange={(_, value) => updateExamCourseField("semester", value)} renderInput={(params) => <TextField {...params} label="Semester" />} /></Grid>}
              {!admissionMode && <Grid item xs={12} md={2}><Autocomplete freeSolo options={courseOptions} value={exam.course || ""} onInputChange={(_, value) => updateExamCourseField("course", value)} onChange={(_, value) => updateExamCourseField("course", value)} renderInput={(params) => <TextField {...params} label="Course" />} /></Grid>}
              {!admissionMode && <Grid item xs={12} md={2}><Autocomplete freeSolo options={courseCodeOptions} value={exam.coursecode || ""} onInputChange={(_, value) => updateExamCourseField("coursecode", value)} onChange={(_, value) => updateExamCourseField("coursecode", value)} renderInput={(params) => <TextField {...params} label="Course code" />} /></Grid>}
              <Grid item xs={12} md={6}><TextField fullWidth label="Exam name" value={exam.examname} onChange={(e) => setExam((p) => ({ ...p, examname: e.target.value }))} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Exam code" value={exam.examcode} onChange={(e) => setExam((p) => ({ ...p, examcode: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Duration minutes" value={exam.durationminutes} onChange={(e) => setExam((p) => ({ ...p, durationminutes: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={exam.status} onChange={(e) => setExam((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem><MenuItem value="Closed">Closed</MenuItem></TextField></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="datetime-local" label="Start time" InputLabelProps={{ shrink: true }} value={exam.starttime} onChange={(e) => setExam((p) => ({ ...p, starttime: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="datetime-local" label="End time" InputLabelProps={{ shrink: true }} value={exam.endtime} onChange={(e) => setExam((p) => ({ ...p, endtime: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}><TextField select fullWidth label="Timezone" value={exam.timezone || "UTC"} onChange={(e) => setExam((p) => ({ ...p, timezone: e.target.value }))}>{timezoneOptions.map((zone) => <MenuItem key={zone} value={zone}>{zone}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={3}><Button fullWidth variant="contained" sx={{ height: 56 }} onClick={saveExam} startIcon={<Save />}>{editingId ? "Update Exam" : "Create Exam"}</Button></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Instructions" value={exam.instructions} onChange={(e) => setExam((p) => ({ ...p, instructions: e.target.value }))} /></Grid>
            </Grid>
          </Paper>

          <DynamicFilters fields={examFilterFields} filters={listFilters} setFilters={setListFilters} onApply={() => setMessage("Filters applied.")} loading={loading} valueOptions={examValueOptions} />

          <Paper sx={{ p: 1 }}>
            <DataGrid rows={rowsOf(displayedExams)} columns={[
              { field: "examname", headerName: "Exam", minWidth: 180, flex: 1 },
              { field: "examcode", headerName: "Code", minWidth: 130 },
              { field: "academicyear", headerName: "Year", minWidth: 120 },
              ...((admissionMode || !!categoryTemplates.length) ? [{ field: "category", headerName: "Category", minWidth: 150 }] : []),
              { field: "programcode", headerName: "Program", minWidth: 130 },
              ...(!admissionMode ? [{ field: "semester", headerName: "Semester", minWidth: 110 }] : []),
              ...(!admissionMode ? [{ field: "coursecode", headerName: "Course", minWidth: 130 }] : []),
              { field: "starttime", headerName: "Start", minWidth: 180, valueFormatter: ({ value }) => fmt(value) },
              { field: "endtime", headerName: "End", minWidth: 180, valueFormatter: ({ value }) => fmt(value) },
              { field: "status", headerName: "Status", minWidth: 110 },
              { field: "actions", headerName: "Actions", minWidth: 230, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => setSelectedExam(row)}>Manage</Button><Button size="small" onClick={() => editExam(row)}>Edit</Button><Button size="small" color="error" onClick={() => deleteExam(row)}>Delete</Button></Stack> }
            ]} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[10, 25, 50, 100]} />
          </Paper>

          {selectedExam && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={900}>{selectedExam.examname} - Sections and Questions</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={3}><TextField fullWidth label="Section name" value={sectionForm.sectionname} onChange={(e) => setSectionForm((p) => ({ ...p, sectionname: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth label="Type" value={sectionForm.sectiontype} onChange={(e) => setSectionForm((p) => ({ ...p, sectiontype: e.target.value }))}><MenuItem value="MCQ">MCQ</MenuItem><MenuItem value="Descriptive">Descriptive</MenuItem></TextField></Grid>
                <Grid item xs={12} md={5}><TextField fullWidth label="Section instructions" value={sectionForm.instructions} onChange={(e) => setSectionForm((p) => ({ ...p, instructions: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth sx={{ height: 56 }} variant="contained" onClick={saveSection}>Add Section</Button></Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}><TextField select fullWidth label="Section" value={questionForm.sectionid} onChange={(e) => setQuestionForm((p) => ({ ...p, sectionid: e.target.value }))}>{(selectedExam.sections || []).map((s) => <MenuItem key={s._id} value={s._id}>{s.sectionname}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth label="Question type" value={questionForm.questiontype} onChange={(e) => setQuestionForm((p) => ({ ...p, questiontype: e.target.value }))}><MenuItem value="MCQ">MCQ</MenuItem><MenuItem value="Descriptive">Descriptive</MenuItem></TextField></Grid>
                <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Marks" value={questionForm.marks} onChange={(e) => setQuestionForm((p) => ({ ...p, marks: e.target.value }))} /></Grid>
                <Grid item xs={12} md={5}><TextField fullWidth label="Link attachment" value={questionForm.linkurl} onChange={(e) => setQuestionForm((p) => ({ ...p, linkurl: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><MultiCheckAutocomplete label="Module" options={questionOptions.modules || []} value={questionForm.modules} onChange={(value) => setQuestionForm((p) => ({ ...p, modules: value }))} /></Grid>
                <Grid item xs={12} md={3}><MultiCheckAutocomplete label="Topic" options={questionOptions.topics || []} value={questionForm.topics} onChange={(value) => setQuestionForm((p) => ({ ...p, topics: value }))} /></Grid>
                <Grid item xs={12} md={3}><MultiCheckAutocomplete label="CO" options={questionOptions.cos || []} value={questionForm.cos} onChange={(value) => setQuestionForm((p) => ({ ...p, cos: value }))} /></Grid>
                <Grid item xs={12} md={3}><MultiCheckAutocomplete label="Bloom taxonomy levels" options={questionOptions.bloomlevels || []} value={questionForm.bloomlevels} onChange={(value) => setQuestionForm((p) => ({ ...p, bloomlevels: value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Question" value={questionForm.questiontext} onChange={(e) => setQuestionForm((p) => ({ ...p, questiontext: e.target.value }))} /></Grid>
                <Grid item xs={12}>
                  <OnlineQuestionContentEditor question={questionForm} setQuestion={setQuestionForm} uploadBlockFile={uploadBlockFile} disabled={loading} />
                </Grid>
                {questionForm.questiontype === "MCQ" && questionForm.options.map((o, i) => (
                  <Grid item xs={12} md={3} key={`opt-${i}`}>
                    <TextField fullWidth label={`Option ${i + 1}`} value={o.optiontext} onChange={(e) => setQuestionForm((p) => ({ ...p, options: p.options.map((x, idx) => idx === i ? { ...x, optiontext: e.target.value } : x) }))} />
                    <FormControlLabel control={<Checkbox checked={!!o.iscorrect} onChange={(e) => setQuestionForm((p) => ({ ...p, options: p.options.map((x, idx) => idx === i ? { ...x, iscorrect: e.target.checked } : { ...x, iscorrect: false }) }))} />} label="Correct" />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button component="label" startIcon={<CloudUpload />}>Upload image<input hidden type="file" onChange={(e) => upload(e.target.files?.[0], "imageurl")} /></Button>
                    <Button component="label" startIcon={<CloudUpload />}>Upload file<input hidden type="file" onChange={(e) => upload(e.target.files?.[0], "fileurl")} /></Button>
                    <Button variant="contained" onClick={() => saveQuestion()}>{questionForm.questionid ? "Update Question" : "Add Question"}</Button>
                    {questionForm.questionid && <Button variant="outlined" onClick={() => setQuestionForm({ ...initialQuestionForm, sectionid: questionForm.sectionid, questiontype: questionForm.questiontype })}>Cancel Edit</Button>}
                    <Button variant="outlined" onClick={() => setQuestionForm((p) => ({ ...p, options: [...p.options, { optiontext: "", iscorrect: false }] }))}>Add Option</Button>
                    <Button variant="outlined" onClick={downloadQuestionTemplate}>Question Template</Button>
                    <Button component="label" variant="outlined" startIcon={<CloudUpload />}>Bulk Upload Questions<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={readQuestionExcel} /></Button>
                    <Button color="error" variant="outlined" startIcon={<Delete />} disabled={!selectedQuestionIds.length} onClick={deleteSelectedQuestions}>Delete Selected ({selectedQuestionIds.length})</Button>
                  </Stack>
                </Grid>
              </Grid>
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography fontWeight={900}>AI Question Generation</Typography>
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Provider" value={ai.provider} onChange={(e) => setAi((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="Gemini">Gemini</MenuItem><MenuItem value="Ollama">Ollama</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Gemini model" value={ai.geminiModel} onChange={(e) => setAi((p) => ({ ...p, geminiModel: e.target.value }))}>{geminiModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Ollama" value={ai.ollamaConfigId} onChange={(e) => setAi((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{(options.ollama || []).map((o) => <MenuItem key={o._id} value={o._id}>{o.name} - {o.modelname}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Language" value={ai.language} onChange={(e) => setAi((p) => ({ ...p, language: e.target.value }))}>{languages.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Difficulty" value={ai.difficulty} onChange={(e) => setAi((p) => ({ ...p, difficulty: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth type="number" label="No. questions" value={ai.count} onChange={(e) => setAi((p) => ({ ...p, count: e.target.value }))} /></Grid>
                  {!!categoryTemplates.length && <Grid item xs={12} md={6}><MultiCheckAutocomplete label={psychometricMode ? "Psychometric categories" : "Placement question categories"} options={categoryTemplates} value={ai.categories} onChange={(value) => setAi((p) => ({ ...p, categories: value }))} /></Grid>}
                  <Grid item xs={12} md={3}><FormControlLabel control={<Checkbox checked={!!ai.mapWithAi} onChange={(e) => setAi((p) => ({ ...p, mapWithAi: e.target.checked }))} />} label="Use AI agent for CO/Bloom mapping" /></Grid>
                  <Grid item xs={12} md={10}><TextField fullWidth label="Prompt / topic" value={ai.topic} onChange={(e) => setAi((p) => ({ ...p, topic: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth sx={{ height: 56 }} startIcon={<AutoFixHigh />} variant="contained" onClick={generate}>Generate</Button></Grid>
                </Grid>
              </Paper>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {(selectedExam.sections || []).map((s) => (
                  <Paper key={s._id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography fontWeight={900}>{s.sectionname} ({s.sectiontype})</Typography>
                    {(s.questions || []).map((q, i) => (
                      <Box key={q._id} sx={{ mt: 1.2, p: 1, border: "1px solid #e5e7eb", borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <Checkbox
                            checked={selectedQuestionIds.includes(`${s._id}::${q._id}`)}
                            onChange={(e) => setSelectedQuestionIds((prev) => e.target.checked ? [...prev, `${s._id}::${q._id}`] : prev.filter((id) => id !== `${s._id}::${q._id}`))}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={800}>Question {i + 1}</Typography>
                            <Box
                              sx={{ mt: 0.5, "& img": { maxWidth: "100%", maxHeight: 180, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%" }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 18, my: 1 } }}
                              dangerouslySetInnerHTML={{ __html: richQuestionHtml(q) }}
                            />
                          </Box>
                          <Chip size="small" label={`${q.marks} marks`} />
                          <Button size="small" startIcon={<Edit />} onClick={() => editQuestion(s, q)}>Edit</Button>
                          <Button size="small" color="error" startIcon={<Delete />} onClick={() => deleteQuestion(s._id, q._id)}>Delete</Button>
                        </Stack>
                        <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mt: 0.8 }}>
                          {(q.modules || []).map((item) => <Chip key={`m-${q._id}-${item}`} size="small" label={`Module: ${item}`} />)}
                          {(q.topics || []).map((item) => <Chip key={`t-${q._id}-${item}`} size="small" label={`Topic: ${item}`} />)}
                          {(q.cos || []).map((item) => <Chip key={`co-${q._id}-${item}`} size="small" label={`CO: ${item}`} />)}
                          {(q.bloomlevels || []).map((item) => <Chip key={`b-${q._id}-${item}`} size="small" label={`Bloom: ${item}`} />)}
                          {q.imageurl && <Chip size="small" label={<AttachmentLink url={q.imageurl} label="Image" />} />}
                          {q.fileurl && <Chip size="small" label={<AttachmentLink url={q.fileurl} label="File" />} />}
                        </Stack>
                      </Box>
                    ))}
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function MyOnlineExamManagementPage() {
  return <OnlineExamManagementPage myMode />;
}

export function AdmissionOnlineExamManagementPage() {
  return <OnlineExamManagementPage admissionMode />;
}

export function PlacementPracticeTestPage() {
  return <OnlineExamManagementPage examContext="Placementpractice" pageTitle="Placement Practice Test" categoryTemplates={placementPracticeCategories} />;
}

export function PsychometricTestPage() {
  return <OnlineExamManagementPage examContext="Psychometric" pageTitle="Psychometric Test" categoryTemplates={psychometricCategories} psychometricMode />;
}

const examLabel = (exam) => exam ? `${exam.examname || ""} (${exam.examcode || ""}) | ${exam.course || ""} (${exam.coursecode || ""}) | ${exam.status || ""}` : "";
const groupLabel = (group) => group ? `${group.groupname || ""} | ${group.course || ""} (${group.coursecode || ""}) | Sem ${group.semester || ""}` : "";

export function OnlineExamCourseGroupAssignmentPage() {
  const [options, setOptions] = useState({ exams: [], groups: [], filterValues: {} });
  const [assignments, setAssignments] = useState([]);
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [form, setForm] = useState({ status: "Active", remarks: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [opt, list] = await Promise.all([
        ep1.get("/api/v2/online-exam/course-group-assignment-options", { params: { colid: global1.colid, user: global1.user } }),
        ep1.get("/api/v2/online-exam/course-group-assignments", { params: { colid: global1.colid, user: global1.user } })
      ]);
      setOptions(opt.data || { exams: [], groups: [], filterValues: {} });
      setAssignments(list.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load course group exam data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredAssignments = useMemo(() => assignments.filter((row) => rowMatchesFilters(row, filters)), [assignments, filters]);
  const groupOptions = useMemo(() => (options.groups || []).filter((group) => (
    !selectedExam
    || ((!selectedExam.academicyear || String(group.academicyear || "") === String(selectedExam.academicyear || ""))
      && (!selectedExam.regulation || String(group.regulation || "") === String(selectedExam.regulation || ""))
      && (!selectedExam.programcode || String(group.programcode || "") === String(selectedExam.programcode || ""))
      && (!selectedExam.semester || String(group.semester || "") === String(selectedExam.semester || ""))
      && (!selectedExam.coursecode || String(group.coursecode || "") === String(selectedExam.coursecode || "")))
  )), [options.groups, selectedExam]);

  const save = async () => {
    if (!selectedExam?._id || !selectedGroup?.groupname) return setMessage("Select online exam and course group.");
    setLoading(true);
    try {
      await ep1.post("/api/v2/online-exam/course-group-assignments", {
        colid: global1.colid,
        user: global1.user,
        examid: selectedExam._id,
        ...selectedGroup,
        status: form.status,
        remarks: form.remarks
      });
      setMessage("Online exam assigned to course group.");
      setSelectedExam(null);
      setSelectedGroup(null);
      setForm({ status: "Active", remarks: "" });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to assign online exam.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return setMessage("Select assignments to delete.");
    if (!window.confirm(`Delete ${selectedIds.length} selected assignment(s)?`)) return;
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/online-exam/course-group-assignments-delete", { colid: global1.colid, user: global1.user, ids: selectedIds });
      setMessage(`${res.data?.deleted || 0} assignment(s) deleted.`);
      setSelectedIds([]);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete selected assignments.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title="Course Group Exam">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900}>Course Group Exam</Typography>
              <Typography color="text.secondary">Assign online exams created by you to course groups created by you.</Typography>
            </Box>
            <Button startIcon={<Refresh />} variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
          {message && <Alert severity={/unable|select|delete/i.test(message) ? "warning" : "success"} onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}

          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={options.exams || []}
                  value={selectedExam}
                  onChange={(_, value) => {
                    setSelectedExam(value);
                    setSelectedGroup(null);
                  }}
                  getOptionLabel={examLabel}
                  isOptionEqualToValue={(option, value) => option._id === value?._id}
                  renderInput={(params) => <TextField {...params} label="Online exam created by me" />}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={groupOptions}
                  value={selectedGroup}
                  onChange={(_, value) => setSelectedGroup(value)}
                  getOptionLabel={groupLabel}
                  isOptionEqualToValue={(option, value) => `${option.facultyemail}-${option.groupname}-${option.coursecode}` === `${value?.facultyemail}-${value?.groupname}-${value?.coursecode}`}
                  renderInput={(params) => <TextField {...params} label="Course group created by me" />}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={10}>
                <TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth sx={{ height: 56 }} variant="contained" onClick={save}>Assign</Button>
              </Grid>
            </Grid>
          </Paper>

          <DynamicFilters
            fields={["academicyear", "regulation", "program", "programcode", "semester", "course", "coursecode", "examname", "examcode", "groupname", "status"]}
            filters={filters}
            setFilters={setFilters}
            onApply={() => setMessage("Filters applied.")}
            loading={loading}
            valueOptions={options.filterValues || {}}
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button color="error" variant="outlined" disabled={!selectedIds.length || loading} onClick={deleteSelected}>Bulk delete</Button>
          </Stack>
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={rowsOf(filteredAssignments)}
              columns={[
                { field: "examname", headerName: "Exam", minWidth: 180, flex: 1 },
                { field: "examcode", headerName: "Exam code", minWidth: 130 },
                { field: "groupname", headerName: "Group", minWidth: 170, flex: 1 },
                { field: "academicyear", headerName: "Academic year", minWidth: 130 },
                { field: "programcode", headerName: "Program", minWidth: 120 },
                { field: "semester", headerName: "Semester", minWidth: 100 },
                { field: "coursecode", headerName: "Course", minWidth: 120 },
                { field: "status", headerName: "Status", minWidth: 110 },
                { field: "remarks", headerName: "Remarks", minWidth: 220, flex: 1 }
              ]}
              autoHeight
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))}
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "course_group_exam_assignments" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function StudentOnlineExamPage({ examContext = "Student", title = "Online Examination" }) {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [active, setActive] = useState({ section: 0, question: 0 });
  const [remaining, setRemaining] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");
  const submitRef = useRef(false);
  const colid = global1.colid;
  const regno = global1.regno;
  const [searchParams] = useSearchParams();
  const requestedExamId = searchParams.get("examid") || "";
  const userZone = browserTimeZone();

  const load = async () => {
    const res = await ep1.get("/api/v2/online-exam/student-exams", { params: { colid, regno, examcontext: examContext } });
    setExams(res.data?.data || []);
  };
  useEffect(() => { load().catch((e) => setMessage(e.response?.data?.message || "Unable to load exams.")); }, []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    if (!attempt || attempt.submittime) return undefined;
    const id = setInterval(() => {
      if (!navigator.onLine) return;
      setRemaining((value) => {
        if (value <= 1) {
          submit("Time over", true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [attempt]);
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

  const start = async (exam) => {
    try {
      await document.documentElement.requestFullscreen?.();
      const res = await ep1.post("/api/v2/online-exam/start-attempt", { colid, regno, examid: exam._id });
      setSelectedExam(res.data.exam);
      setAttempt(res.data.attempt);
      setAnswers(res.data.attempt.answers || []);
      setRemaining(res.data.attempt.remainingseconds || exam.durationminutes * 60);
      submitRef.current = false;
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to start exam.");
    }
  };
  const answerPatch = (questionid, patch) => setAnswers((prev) => prev.map((a) => String(a.questionid) === String(questionid) ? { ...a, ...patch } : a));
  const uploadAnswer = async (file, answer) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("colid", colid);
    fd.append("context", "answer");
    const res = await ep1.post("/api/v2/online-exam/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    answerPatch(answer.questionid, { attachmenturl: res.data?.data?.url || "" });
  };
  const save = async () => {
    if (!attempt || submitRef.current) return;
    await ep1.post("/api/v2/online-exam/save-attempt", { colid, attemptid: attempt._id, answers, remainingseconds: remaining });
  };
  const submit = async (reason = "Submitted by student", auto = false) => {
    if (!attempt || submitRef.current) return;
    submitRef.current = true;
    try {
      await ep1.post("/api/v2/online-exam/submit-attempt", { colid, attemptid: attempt._id, answers, remainingseconds: remaining, autosubmitted: auto, submitreason: reason });
      setMessage(`Exam submitted. ${reason}`);
      setAttempt((p) => ({ ...p, submittime: new Date(), status: "Submitted" }));
      document.exitFullscreen?.().catch(() => {});
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to submit exam.");
    }
  };
  const currentSection = selectedExam?.sections?.[active.section];
  const currentQuestion = currentSection?.questions?.[active.question];
  const currentAnswer = answers.find((a) => String(a.questionid) === String(currentQuestion?._id));
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const displayedExams = requestedExamId ? exams.filter((exam) => String(exam._id) === String(requestedExamId)) : exams;

  if (attempt && !attempt.submittime && selectedExam) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", color: "#fff", p: 2 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2, bgcolor: "#111827", color: "#fff" }}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={2}>
              <Box sx={{ flex: 1 }}><Typography variant="h5" fontWeight={900}>{selectedExam.examname}</Typography><Typography>{selectedExam.course} ({selectedExam.coursecode})</Typography></Box>
              <Chip color={online ? "success" : "warning"} label={online ? "Online" : "Offline - timer paused"} />
              <Typography variant="h4" fontWeight={900}>{minutes}:{seconds}</Typography>
              <Button variant="outlined" onClick={save}>Save</Button>
              <Button variant="contained" color="error" onClick={() => submit("Final submitted", false)}>Submit</Button>
            </Stack>
          </Paper>
          {message && <Alert severity="warning">{message}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1.5, height: "calc(100vh - 150px)", overflow: "auto" }}>
                {(selectedExam.sections || []).map((s, si) => (
                  <Box key={s._id} sx={{ mb: 1.5 }}>
                    <Typography fontWeight={900}>{s.sectionname}</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {(s.questions || []).map((q, qi) => <Button key={q._id} size="small" variant={active.section === si && active.question === qi ? "contained" : "outlined"} onClick={() => setActive({ section: si, question: qi })}>{qi + 1}</Button>)}
                    </Stack>
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2, minHeight: "calc(100vh - 150px)" }}>
                <Typography variant="h6" fontWeight={900}>{currentSection?.sectionname}</Typography>
                <Box
                  sx={{ mt: 2, color: "#111827", "& img": { maxWidth: "100%", maxHeight: 320, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%", my: 1 }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 20, my: 1 }, "& a": { color: "#2563eb" } }}
                  dangerouslySetInnerHTML={{ __html: richQuestionHtml(currentQuestion) }}
                />
                {/^mcq$/i.test(currentQuestion?.questiontype || currentSection?.sectiontype) ? (
                  <Stack spacing={1} sx={{ mt: 3 }}>{(currentQuestion?.options || []).map((o) => <FormControlLabel key={o._id} control={<Radio checked={currentAnswer?.selectedoptionid === o._id} onChange={() => answerPatch(currentQuestion._id, { selectedoptionid: o._id, selectedoptiontext: o.optiontext })} />} label={o.optiontext} />)}</Stack>
                ) : (
                  <TextField fullWidth multiline minRows={8} sx={{ mt: 3 }} label="Answer" value={currentAnswer?.answertext || ""} onChange={(e) => answerPatch(currentQuestion._id, { answertext: e.target.value })} />
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button component="label" startIcon={<CloudUpload />}>Upload answer attachment<input hidden type="file" onChange={(e) => uploadAnswer(e.target.files?.[0], currentAnswer)} /></Button>
                  {currentAnswer?.attachmenturl && <AttachmentLink url={currentAnswer.attachmenturl} label="Uploaded answer file" />}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>{title}</Typography>
          {message && <Alert severity="warning">{message}</Alert>}
          <Grid container spacing={2}>
            {displayedExams.map((exam) => (
              <Grid item xs={12} md={4} key={exam._id}>
                <Card>
                  <CardContent>
                    <Typography fontWeight={900}>{exam.examname}</Typography>
                    <Typography color="text.secondary">{exam.course} ({exam.coursecode})</Typography>
                    <Typography variant="body2"><b>Saved timezone:</b> {exam.timezone || "UTC"}</Typography>
                    <Typography variant="body2">Start: {fmtZone(exam.starttime, exam.timezone || "UTC")}</Typography>
                    <Typography variant="body2">End: {fmtZone(exam.endtime, exam.timezone || "UTC")}</Typography>
                    <Typography variant="body2"><b>Your timezone:</b> {userZone}</Typography>
                    <Typography variant="body2">Your start: {fmtZone(exam.starttime, userZone)}</Typography>
                    <Typography variant="body2">Your end: {fmtZone(exam.endtime, userZone)}</Typography>
                    {exam.attempt?.submittime ? <Chip sx={{ mt: 1 }} label="Submitted" /> : <Button sx={{ mt: 1 }} variant="contained" disabled={!exam.canStart} onClick={() => start(exam)}>{exam.canStart ? "Start Exam" : "Not Available Now"}</Button>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {requestedExamId && !displayedExams.length && <Grid item xs={12}><Alert severity="info">The selected exam is not available for this student.</Alert></Grid>}
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function StudentPlacementPracticeTestPage() {
  return <StudentOnlineExamPage examContext="Placementpractice" title="Placement Practice Test" />;
}

export function StudentPsychometricTestPage() {
  return <StudentOnlineExamPage examContext="Psychometric" title="Psychometric Test" />;
}

export function StudentOnlineExam2Page() {
  const [courses, setCourses] = useState([]);
  const [student, setStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const colid = global1.colid;
  const regno = global1.regno;
  const userZone = browserTimeZone();

  const loadCourses = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/online-exam/student-courses", { params: { colid, regno } });
      const rows = res.data?.data || [];
      setCourses(rows);
      setStudent(res.data?.student || null);
      if (rows.length && !selectedCourse) setSelectedCourse(rows[0]);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load course list.");
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async (course) => {
    if (!course?.coursecode) {
      setExams([]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/online-exam/student-exams", { params: { colid, regno, coursecode: course.coursecode } });
      setExams((res.data?.data || []).filter((exam) => exam.canStart && !exam.attempt?.submittime));
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load active exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (selectedCourse) loadExams(selectedCourse); }, [selectedCourse]);

  return (
    <MenuPageShell title="Online Exam 2" menuType="student">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900}>Online Exam 2</Typography>
              <Typography color="text.secondary">
                Select a course to view active published exams for your academic profile.
              </Typography>
            </Box>
            <Button startIcon={<Refresh />} variant="outlined" onClick={() => selectedCourse ? loadExams(selectedCourse) : loadCourses()}>Refresh</Button>
          </Stack>

          {message && <Alert severity="warning">{message}</Alert>}
          {loading && <LinearProgress />}

          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <Autocomplete
                  options={courses}
                  value={selectedCourse}
                  onChange={(_, value) => setSelectedCourse(value)}
                  getOptionLabel={(row) => row ? `${row.course || ""} (${row.coursecode || ""})` : ""}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography fontWeight={800}>{option.course} ({option.coursecode})</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sem {option.semester || "-"} | {option.coursetype || "-"} | {option.deliverytype || "-"}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => <TextField {...params} label="Course" />}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Alert severity="info">
                  Student: {student?.name || global1.name || "-"} | Academic year: {student?.academicyear || "-"} | Regulation: {student?.regulation || "-"} | Program: {student?.program || "-"} ({student?.programcode || "-"})
                </Alert>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Timezone information</Typography>
            <Typography variant="body2">User/browser timezone: <b>{userZone}</b></Typography>
            <Typography variant="body2" color="text.secondary">
              Each exam card shows the timezone saved with the exam and the same start/end instant converted to your browser timezone.
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            {exams.map((exam) => {
              const savedZone = exam.timezone || "Not saved";
              const zoneDiffers = savedZone && savedZone !== userZone;
              return (
                <Grid item xs={12} md={6} lg={4} key={exam._id}>
                  <Card sx={{ height: "100%", border: "1px solid #bbf7d0", bgcolor: "#f0fdf4" }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Chip color="success" label="Active now" sx={{ alignSelf: "flex-start" }} />
                        <Typography variant="h6" fontWeight={900}>{exam.examname}</Typography>
                        <Typography color="text.secondary">{exam.course} ({exam.coursecode})</Typography>
                        <Box sx={{ p: 1.2, bgcolor: "#fff", border: "1px solid #dcfce7", borderRadius: 1 }}>
                          <Typography variant="body2"><b>Saved timezone:</b> {savedZone}</Typography>
                          <Typography variant="body2"><b>User timezone:</b> {userZone}</Typography>
                          {zoneDiffers && <Typography variant="caption" color="warning.main">Timezone conversion shown below.</Typography>}
                        </Box>
                        <Box>
                          <Typography variant="body2"><b>Saved start:</b> {fmtZone(exam.starttime, exam.timezone)}</Typography>
                          <Typography variant="body2"><b>Saved end:</b> {fmtZone(exam.endtime, exam.timezone)}</Typography>
                          <Typography variant="body2"><b>Your start:</b> {fmtZone(exam.starttime, userZone)}</Typography>
                          <Typography variant="body2"><b>Your end:</b> {fmtZone(exam.endtime, userZone)}</Typography>
                        </Box>
                        <Typography variant="body2">Duration: {exam.durationminutes || 0} minutes</Typography>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/student-online-exam?examid=${encodeURIComponent(exam._id)}`)}
                        >
                          Start Exam
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
            {!loading && selectedCourse && !exams.length && (
              <Grid item xs={12}>
                <Alert severity="info">No active online exam is available right now for the selected course.</Alert>
              </Grid>
            )}
            {!loading && !courses.length && (
              <Grid item xs={12}>
                <Alert severity="info">No courses were found for your academic year, regulation, program, program code and semester.</Alert>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function StudentCourseGroupExamPage() {
  const [courses, setCourses] = useState([]);
  const [student, setStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const colid = global1.colid;
  const regno = global1.regno;
  const userZone = browserTimeZone();

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/online-exam/student-course-group-courses", { params: { colid, regno } });
      const rows = res.data?.data || [];
      setCourses(rows);
      setStudent(res.data?.student || null);
      if (rows.length) setSelectedCourse((prev) => prev || rows[0]);
      if (!rows.length) setMessage("No course group courses are assigned to you for your current academic profile.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load course group courses.");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async (course) => {
    if (!course?.coursecode) {
      setGroups([]);
      setSelectedGroup(null);
      return;
    }
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/online-exam/student-course-group-groups", {
        params: {
          colid,
          regno,
          academicyear: course.academicyear,
          regulation: course.regulation,
          programcode: course.programcode,
          semester: course.semester,
          coursecode: course.coursecode
        }
      });
      const rows = res.data?.data || [];
      setGroups(rows);
      setSelectedGroup(rows[0] || null);
      setExams([]);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load course groups.");
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async (group = selectedGroup) => {
    if (!group?.groupname) {
      setExams([]);
      return;
    }
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/online-exam/student-course-group-exams", {
        params: {
          colid,
          regno,
          academicyear: group.academicyear,
          regulation: group.regulation,
          program: group.program,
          programcode: group.programcode,
          semester: group.semester,
          course: group.course,
          coursecode: group.coursecode,
          facultyemail: group.facultyemail,
          groupname: group.groupname
        }
      });
      setExams(res.data?.data || []);
      if (!(res.data?.data || []).length) setMessage("No active published exam is assigned to this course group.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load group exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (selectedCourse) loadGroups(selectedCourse); }, [selectedCourse]);
  useEffect(() => { if (selectedGroup) loadExams(selectedGroup); }, [selectedGroup]);

  return (
    <MenuPageShell title="Course Group Exam" menuType="student">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900}>Course Group Exam</Typography>
              <Typography color="text.secondary">Select your course group to view assigned online exams with timezone conversion.</Typography>
            </Box>
            <Button startIcon={<Refresh />} variant="outlined" onClick={() => selectedGroup ? loadExams(selectedGroup) : loadCourses()}>Refresh</Button>
          </Stack>
          {message && <Alert severity="info" onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}

          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={courses}
                  value={selectedCourse}
                  onChange={(_, value) => setSelectedCourse(value)}
                  getOptionLabel={(row) => row ? `${row.course || ""} (${row.coursecode || ""}) | Sem ${row.semester || ""}` : ""}
                  isOptionEqualToValue={(option, value) => `${option.coursecode}-${option.semester}` === `${value?.coursecode}-${value?.semester}`}
                  renderInput={(params) => <TextField {...params} label="Course assigned to me" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={groups}
                  value={selectedGroup}
                  onChange={(_, value) => setSelectedGroup(value)}
                  getOptionLabel={groupLabel}
                  isOptionEqualToValue={(option, value) => `${option.facultyemail}-${option.groupname}-${option.coursecode}` === `${value?.facultyemail}-${value?.groupname}-${value?.coursecode}`}
                  renderInput={(params) => <TextField {...params} label="My course group" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Alert severity="info">
                  {student?.name || global1.name || "-"} | {student?.academicyear || "-"} | Sem {student?.semester || "-"}
                </Alert>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={900}>Timezone information</Typography>
            <Typography variant="body2">Your browser timezone: <b>{userZone}</b></Typography>
            <Typography variant="body2" color="text.secondary">Each exam shows saved timezone dates and the same dates converted to your browser timezone.</Typography>
          </Paper>

          <Grid container spacing={2}>
            {exams.map((exam) => (
              <Grid item xs={12} md={6} lg={4} key={exam._id}>
                <Card sx={{ height: "100%", border: exam.canStart ? "1px solid #86efac" : "1px solid #e5e7eb", bgcolor: exam.canStart ? "#f0fdf4" : "#fff" }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <Chip color={exam.canStart ? "success" : "default"} label={exam.canStart ? "Active now" : "Not active"} />
                        {exam.attempt?.submittime && <Chip label="Submitted" />}
                      </Stack>
                      <Typography variant="h6" fontWeight={900}>{exam.examname}</Typography>
                      <Typography color="text.secondary">{exam.course} ({exam.coursecode})</Typography>
                      <Typography variant="body2"><b>Group:</b> {exam.groupname || selectedGroup?.groupname || "-"}</Typography>
                      <Typography variant="body2"><b>Saved timezone:</b> {exam.timezone || "UTC"}</Typography>
                      <Typography variant="body2"><b>Saved start:</b> {fmtZone(exam.starttime, exam.timezone || "UTC")}</Typography>
                      <Typography variant="body2"><b>Saved end:</b> {fmtZone(exam.endtime, exam.timezone || "UTC")}</Typography>
                      <Typography variant="body2"><b>Your start:</b> {fmtZone(exam.starttime, userZone)}</Typography>
                      <Typography variant="body2"><b>Your end:</b> {fmtZone(exam.endtime, userZone)}</Typography>
                      <Button
                        variant="contained"
                        disabled={!exam.canStart || !!exam.attempt?.submittime}
                        onClick={() => navigate(`/student-online-exam?examid=${encodeURIComponent(exam._id)}`)}
                      >
                        Start Exam
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {!loading && selectedGroup && !exams.length && (
              <Grid item xs={12}>
                <Alert severity="info">No online exam is assigned to the selected course group.</Alert>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExamResponsesPage({ myMode = false, examContext = "Student", pageTitle }) {
  const [filters, setFilters] = useState([{ field: "examname", operator: "contains", value: "" }]);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [evalForm, setEvalForm] = useState({ provider: "Gemini", geminiModel: "gemini-2.5-flash", ollamaConfigId: "", rules: "" });
  const [options, setOptions] = useState({ ollama: [], responseValues: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const title = pageTitle || (myMode ? "My Online Exam Responses" : "Online Exam Responses");
  useEffect(() => { ep1.get("/api/v2/online-exam/options", { params: { colid: global1.colid, examcontext: examContext } }).then((r) => setOptions(r.data || {})); }, [examContext]);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/online-exam/responses", { colid: global1.colid, examcontext: examContext, dynamicFilters: filters.filter((f) => f.value), ...(myMode ? { createdby: global1.user } : {}) });
      setRows(res.data?.data || []);
    } finally { setLoading(false); }
  };
  const updateAnswer = (id, patch) => setSelected((prev) => ({ ...prev, answers: prev.answers.map((a) => a._id === id ? { ...a, ...patch } : a) }));
  const aiEval = async () => {
    const res = await ep1.post("/api/v2/online-exam/ai-evaluate", { ...evalForm, colid: global1.colid, attemptid: selected._id });
    const evals = res.data?.data || [];
    setSelected((prev) => ({ ...prev, answers: prev.answers.map((a) => {
      const e = evals.find((x) => String(x.questionid) === String(a.questionid) || String(x._id) === String(a._id));
      return e ? { ...a, marksobtained: e.marksobtained, comments: e.comments, grade: e.grade, aicomments: e.comments } : a;
    }) }));
  };
  const grade = async () => {
    const res = await ep1.post("/api/v2/online-exam/grade-attempt", { colid: global1.colid, attemptid: selected._id, answers: selected.answers, grade: selected.grade, comments: selected.comments });
    setSelected(res.data?.data);
    setMessage("Grades saved.");
    load();
  };
  const deleteSelectedResponses = async () => {
    if (!selectedIds.length) return setMessage("Select one or more candidate responses.");
    if (!window.confirm("Delete selected responses and enable those candidates to take the exam again?")) return;
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/online-exam/responses-delete", { colid: global1.colid, ids: selectedIds });
      setSelectedIds([]);
      setSelected(null);
      setMessage(`${res.data?.deletedCount || 0} response(s) deleted. Candidate(s) enabled again.`);
      await load();
      const opt = await ep1.get("/api/v2/online-exam/options", { params: { colid: global1.colid } });
      setOptions(opt.data || {});
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete responses.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>{title}</Typography>
          {myMode && <Alert severity="info">Only responses for exams created by {global1.name || global1.user} are shown.</Alert>}
          {message && <Alert severity={/unable|select/i.test(message) ? "warning" : "success"}>{message}</Alert>}
          <DynamicFilters fields={["academicyear", "program", "programcode", "course", "coursecode", "examname", "examcode", "student", "regno", "status"]} filters={filters} setFilters={setFilters} onApply={load} loading={loading} valueOptions={options.responseValues || {}} />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button color="error" variant="outlined" disabled={loading || !selectedIds.length} onClick={deleteSelectedResponses}>Delete selected responses and enable candidates</Button>
          </Stack>
          <Paper sx={{ p: 1 }}><DataGrid rows={rowsOf(rows)} columns={[{ field: "examname", headerName: "Exam", minWidth: 180 }, { field: "student", headerName: "Student", minWidth: 180 }, { field: "regno", headerName: "Regno", minWidth: 130 }, { field: "coursecode", headerName: "Course", minWidth: 120 }, { field: "status", headerName: "Status", minWidth: 120 }, { field: "marksobtained", headerName: "Marks", minWidth: 100 }, { field: "view", headerName: "View", width: 100, renderCell: ({ row }) => <Button size="small" onClick={() => setSelected(row)}>Open</Button> }]} autoHeight checkboxSelection disableRowSelectionOnClick rowSelectionModel={selectedIds} onRowSelectionModelChange={(model) => setSelectedIds(model)} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[10, 25, 50, 100]} /></Paper>
          <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="lg" fullWidth>
            <DialogTitle>Evaluate Response</DialogTitle>
            <DialogContent dividers>
              {selected && <Stack spacing={2}>
                <Typography fontWeight={900}>{selected.student} - {selected.examname}</Typography>
                <Grid container spacing={1.5}><Grid item xs={12} md={3}><TextField select fullWidth label="Provider" value={evalForm.provider} onChange={(e) => setEvalForm((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="Gemini">Gemini</MenuItem><MenuItem value="Ollama">Ollama</MenuItem></TextField></Grid><Grid item xs={12} md={3}><TextField select fullWidth label="Gemini model" value={evalForm.geminiModel} onChange={(e) => setEvalForm((p) => ({ ...p, geminiModel: e.target.value }))}>{geminiModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><TextField select fullWidth label="Ollama" value={evalForm.ollamaConfigId} onChange={(e) => setEvalForm((p) => ({ ...p, ollamaConfigId: e.target.value }))}>{(options.ollama || []).map((o) => <MenuItem key={o._id} value={o._id}>{o.name} - {o.modelname}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><Button fullWidth sx={{ height: 56 }} variant="outlined" onClick={aiEval}>AI Evaluate</Button></Grid><Grid item xs={12}><TextField fullWidth label="AI evaluation rules" value={evalForm.rules} onChange={(e) => setEvalForm((p) => ({ ...p, rules: e.target.value }))} /></Grid></Grid>
                {(selected.answers || []).map((a, i) => <Paper key={a._id} variant="outlined" sx={{ p: 1.5 }}><Typography fontWeight={900}>Question {i + 1}</Typography><Box sx={{ mt: 1, "& img": { maxWidth: "100%", maxHeight: 240, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%" }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 18, my: 1 } }} dangerouslySetInnerHTML={{ __html: richQuestionHtml(a) }} /><Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>Answer: {a.answertext || a.selectedoptiontext}</Typography>{a.attachmenturl && <AttachmentLink url={a.attachmenturl} label="Attachment" />}<Grid container spacing={1.5} sx={{ mt: 1 }}><Grid item xs={12} md={2}><TextField fullWidth type="number" label={`Marks / ${a.maxmarks}`} value={a.marksobtained || 0} onChange={(e) => updateAnswer(a._id, { marksobtained: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label="Grade" value={a.grade || ""} onChange={(e) => updateAnswer(a._id, { grade: e.target.value })} /></Grid><Grid item xs={12} md={8}><TextField fullWidth label="Comments" value={a.comments || ""} onChange={(e) => updateAnswer(a._id, { comments: e.target.value })} /></Grid></Grid>{a.aicomments && <Typography color="text.secondary" sx={{ mt: 1 }}>AI: {a.aicomments}</Typography>}</Paper>)}
              </Stack>}
            </DialogContent>
            <DialogActions><Button onClick={() => setSelected(null)}>Close</Button><Button variant="contained" onClick={grade}>Save Grades</Button></DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function MyOnlineExamResponsesPage() {
  return <OnlineExamResponsesPage myMode />;
}

export function OnlineExamReportPage({ myMode = false, examContext = "Student", pageTitle }) {
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [report, setReport] = useState({ data: [], summary: {}, byCourse: [], byCategory: [] });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/online-exam/report", { colid: global1.colid, examcontext: examContext, dynamicFilters: filters.filter((f) => f.value), ...(myMode ? { createdby: global1.user } : {}) });
      setReport(res.data || { data: [], summary: {}, byCourse: [], byCategory: [] });
    } finally { setLoading(false); }
  };
  const cards = [["Total Attempts", report.summary?.total || 0], ["Submitted", report.summary?.submitted || 0], ["Graded", report.summary?.graded || 0], ["Average Marks", report.summary?.average || 0]];
  const title = pageTitle || (myMode ? "My Online Exam Report" : "Online Exam Report");
  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>{title}</Typography>
          {myMode && <Alert severity="info">This report is scoped to exams created by {global1.name || global1.user}.</Alert>}
          <DynamicFilters fields={["academicyear", "category", "program", "programcode", "coursecode", "examname", "examcode", "student", "regno", "status"]} filters={filters} setFilters={setFilters} onApply={load} loading={loading} />
          <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900} sx={{ mb: 1 }}>Course-wise performance</Typography><ResponsiveContainer width="100%" height="88%"><BarChart data={report.byCourse || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="coursecode" /><YAxis /><Tooltip /><Legend /><Bar dataKey="attempts" fill="#2563eb" /><Bar dataKey="submitted" fill="#16a34a" /><Bar dataKey="average" fill="#f97316" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900} sx={{ mb: 1 }}>Category-wise performance</Typography><ResponsiveContainer width="100%" height="88%"><BarChart data={report.byCategory || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" hide /><YAxis /><Tooltip /><Legend /><Bar dataKey="attempts" fill="#7c3aed" /><Bar dataKey="submitted" fill="#0891b2" /><Bar dataKey="average" fill="#f97316" /></BarChart></ResponsiveContainer></Paper></Grid>
          </Grid>
          <Paper sx={{ p: 1 }}><DataGrid rows={rowsOf(report.data)} columns={[{ field: "examname", headerName: "Exam", minWidth: 180 }, { field: "category", headerName: "Category", minWidth: 150 }, { field: "student", headerName: "Student", minWidth: 180 }, { field: "regno", headerName: "Regno", minWidth: 130 }, { field: "programcode", headerName: "Program", minWidth: 120 }, { field: "coursecode", headerName: "Course", minWidth: 120 }, { field: "status", headerName: "Status", minWidth: 120 }, { field: "marksobtained", headerName: "Marks", minWidth: 100 }, { field: "totalmarks", headerName: "Total", minWidth: 100 }]} autoHeight loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "online_exam_report" } } }} pageSizeOptions={[10, 25, 50, 100]} /></Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function MyOnlineExamReportPage() {
  return <OnlineExamReportPage myMode />;
}

export function PlacementPracticeReportPage() {
  return <OnlineExamReportPage examContext="Placementpractice" pageTitle="Placement Practice Test Report" />;
}

export function PlacementPracticeSummaryReportPage() {
  return <OnlineExaminationSummaryReportPage examContext="Placementpractice" pageTitle="Placement Practice Test Summary" subtitle="Program, course, category and faculty-wise placement practice test summary." />;
}

export function PlacementPracticeDetailsPage() {
  return <OnlineExaminationDetailsPage examContext="Placementpractice" pageTitle="Placement Practice Test Details" />;
}

export function PsychometricTestReportPage() {
  return <OnlineExamReportPage examContext="Psychometric" pageTitle="Psychometric Test Report" />;
}

export function PsychometricTestSummaryReportPage() {
  return <OnlineExaminationSummaryReportPage examContext="Psychometric" pageTitle="Psychometric Test Summary" subtitle="Program, course, category and faculty-wise psychometric test summary." />;
}

export function PsychometricTestDetailsPage() {
  return <OnlineExaminationDetailsPage examContext="Psychometric" pageTitle="Psychometric Test Details" />;
}

const psychometricCareerPrediction = (scores = []) => {
  const byName = Object.fromEntries(scores.map((score) => [String(score.category || "").toLowerCase(), Number(score.percentage || 0)]));
  const avg = (...keys) => keys.reduce((sum, key) => sum + (byName[key] || 0), 0) / Math.max(keys.length, 1);
  const tracks = [
    { name: "Technology, data and product roles", score: avg("technology orientation", "analytical tendency", "problem solving", "detail orientation") },
    { name: "Management, sales and client-facing roles", score: avg("leadership", "communication", "sales orientation", "social confidence") },
    { name: "Research, quality and compliance roles", score: avg("research orientation", "integrity", "detail orientation", "self discipline") },
    { name: "Creative, entrepreneurial and innovation roles", score: avg("creativity", "entrepreneurial tendency", "adaptability", "risk preference") },
    { name: "People, training and service roles", score: avg("empathy", "service orientation", "teamwork", "communication") }
  ].sort((a, b) => b.score - a.score);
  return tracks[0]?.score ? tracks.slice(0, 2).map((track) => track.name).join(" / ") : "Collect more psychometric responses for a stronger prediction.";
};

export function PsychometricProfileReportPage() {
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [options, setOptions] = useState({ responseValues: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/online-exam/options", { params: { colid: global1.colid, examcontext: "Psychometric" } }).then((res) => setOptions(res.data || {}));
  }, []);

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/online-exam/responses", { colid: global1.colid, examcontext: "Psychometric", dynamicFilters: filters.filter((f) => f.value) });
      setRows(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load psychometric profiles.");
    } finally {
      setLoading(false);
    }
  };

  const profiles = useMemo(() => rows.map((attempt) => {
    const bucket = {};
    (attempt.answers || []).forEach((answer) => {
      const category = answer.sectionname || answer.category || "General";
      if (!bucket[category]) bucket[category] = { category, score: 0, total: 0 };
      bucket[category].score += Number(answer.marksobtained || 0);
      bucket[category].total += Number(answer.maxmarks || answer.marks || 0);
    });
    const scores = Object.values(bucket).map((item) => ({
      ...item,
      percentage: item.total ? Number(((item.score / item.total) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.percentage - a.percentage);
    const overallTotal = scores.reduce((sum, item) => sum + item.total, 0);
    const overallScore = scores.reduce((sum, item) => sum + item.score, 0);
    return {
      ...attempt,
      categoryScores: scores,
      overallpercentage: overallTotal ? Number(((overallScore / overallTotal) * 100).toFixed(2)) : 0,
      strongestareas: scores.slice(0, 3).map((item) => item.category).join(", "),
      careerprediction: psychometricCareerPrediction(scores)
    };
  }), [rows]);

  const chartRows = useMemo(() => {
    const aggregate = {};
    profiles.forEach((profile) => (profile.categoryScores || []).forEach((score) => {
      if (!aggregate[score.category]) aggregate[score.category] = { category: score.category, total: 0, count: 0 };
      aggregate[score.category].total += score.percentage;
      aggregate[score.category].count += 1;
    }));
    return Object.values(aggregate).map((row) => ({ category: row.category, average: Number((row.total / row.count).toFixed(2)) })).sort((a, b) => b.average - a.average);
  }, [profiles]);

  const cards = [
    ["Profiles", profiles.length],
    ["Submitted", profiles.filter((row) => /^submitted|graded$/i.test(row.status || "")).length],
    ["Average Score", profiles.length ? Number((profiles.reduce((sum, row) => sum + row.overallpercentage, 0) / profiles.length).toFixed(2)) : 0],
    ["Categories", chartRows.length]
  ];

  return (
    <MenuPageShell title="Psychometric Profile Report">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Psychometric Profile Report</Typography>
          {message && <Alert severity="warning">{message}</Alert>}
          {loading && <LinearProgress />}
          <DynamicFilters
            fields={["academicyear", "program", "programcode", "course", "coursecode", "examname", "examcode", "student", "regno", "status"]}
            filters={filters}
            setFilters={setFilters}
            onApply={load}
            loading={loading}
            valueOptions={options.responseValues || {}}
          />
          <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Average Category Profile</Typography>
            <ResponsiveContainer width="100%" height="88%"><BarChart data={chartRows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" hide /><YAxis /><Tooltip /><Legend /><Bar dataKey="average" fill="#4f46e5" /></BarChart></ResponsiveContainer>
          </Paper>
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={rowsOf(profiles)}
              columns={[
                { field: "examname", headerName: "Exam", minWidth: 180 },
                { field: "student", headerName: "Student", minWidth: 180 },
                { field: "regno", headerName: "Regno", minWidth: 130 },
                { field: "programcode", headerName: "Program", minWidth: 120 },
                { field: "overallpercentage", headerName: "Overall %", minWidth: 120 },
                { field: "strongestareas", headerName: "Strongest areas", minWidth: 260, flex: 1 },
                { field: "careerprediction", headerName: "Career prediction", minWidth: 320, flex: 1 },
                { field: "view", headerName: "Profile", width: 110, renderCell: ({ row }) => <Button size="small" onClick={() => setSelected(row)}>Open</Button> }
              ]}
              autoHeight
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "psychometric_profile_report" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
          <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
            <DialogTitle>Psychometric Profile</DialogTitle>
            <DialogContent dividers>
              {selected && <Stack spacing={2}>
                <Typography fontWeight={900}>{selected.student} ({selected.regno})</Typography>
                <Alert severity="info">{selected.careerprediction}</Alert>
                <Paper sx={{ p: 2, height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={selected.categoryScores || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" hide /><YAxis /><Tooltip /><Legend /><Bar dataKey="percentage" fill="#16a34a" /></BarChart></ResponsiveContainer>
                </Paper>
                <DataGrid rows={(selected.categoryScores || []).map((row, index) => ({ ...row, id: index + 1 }))} columns={[{ field: "category", headerName: "Category", flex: 1, minWidth: 220 }, { field: "score", headerName: "Score", minWidth: 100 }, { field: "total", headerName: "Total", minWidth: 100 }, { field: "percentage", headerName: "Percentage", minWidth: 120 }]} autoHeight pageSizeOptions={[10, 25, 50]} />
              </Stack>}
            </DialogContent>
            <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExaminationSummaryReportPage({ examContext = "Student", pageTitle = "Online examination report", subtitle = "Course, semester and faculty-wise online examination summary." }) {
  const [options, setOptions] = useState({ programs: [] });
  const [filters, setFilters] = useState({ academicyear: "", program: "", programcode: "" });
  const [report, setReport] = useState({ details: [], grouped: [], statusSummary: [], facultySummary: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/online-exam/options", { params: { colid: global1.colid, examcontext: examContext } })
      .then((res) => setOptions(res.data || { programs: [] }))
      .catch(() => setMessage("Unable to load filter options."));
  }, [examContext]);

  const courseMaps = options.programs || [];
  const academicYearOptions = useMemo(() => uniqueValues(courseMaps, "academicyear"), [courseMaps]);
  const programOptions = useMemo(() => uniqueValues(courseMaps.filter((row) => !filters.academicyear || row.academicyear === filters.academicyear), "program"), [courseMaps, filters.academicyear]);
  const programCodeOptions = useMemo(() => uniqueValues(courseMaps.filter((row) => (!filters.academicyear || row.academicyear === filters.academicyear) && (!filters.program || row.program === filters.program)), "programcode"), [courseMaps, filters.academicyear, filters.program]);
  const statusChart = useMemo(() => (report.statusSummary || []).map((row) => ({ name: row.status, examinations: row.examinations, attended: row.attended })), [report.statusSummary]);
  const facultyChart = useMemo(() => (report.facultySummary || []).slice(0, 12).map((row) => ({ name: row.faculty || row.facultyemail || "-", examinations: row.examinations, attended: row.attended })), [report.facultySummary]);

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/online-exam/examination-report", { colid: global1.colid, examcontext: examContext, ...filters });
      setReport(res.data || { details: [], grouped: [], statusSummary: [], facultySummary: [], summary: {} });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load online examination report.");
    } finally {
      setLoading(false);
    }
  };

  const printPreview = () => {
    const win = window.open("", "_blank", "width=1100,height=850");
    if (!win) return setMessage("Popup blocked. Please allow popups for print preview.");
    const rowHtml = (report.grouped || []).map((row, index) => `
      <tr>
        <td>${index + 1}</td><td>${escHtml(row.academicyear)}</td><td>${escHtml(row.program)}</td><td>${escHtml(row.programcode)}</td><td>${escHtml(row.category || "-")}</td>
        <td>${escHtml(row.semester)}</td><td>${escHtml(row.course)}</td><td>${escHtml(row.coursecode)}</td>
        <td>${escHtml(row.faculty)}</td><td>${escHtml(row.examinations)}</td><td>${escHtml(row.attended)}</td><td>${escHtml(row.submitted)}</td><td>${escHtml(row.graded)}</td>
      </tr>`).join("");
    const detailHtml = (report.details || []).map((row, index) => `
      <tr>
        <td>${index + 1}</td><td>${escHtml(row.examname)}</td><td>${escHtml(row.examcode)}</td><td>${escHtml(row.category || "-")}</td><td>${escHtml(row.course)}</td><td>${escHtml(row.coursecode)}</td>
        <td>${escHtml(row.semester || "-")}</td><td>${escHtml(row.faculty)}</td><td>${escHtml(row.status)}</td><td>${escHtml(fmt(row.starttime))}</td><td>${escHtml(row.attended)}</td>
      </tr>`).join("");
    win.document.write(`<!doctype html><html><head><title>${escHtml(pageTitle)}</title><style>
      @page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111;background:#fff}h1,h2{text-align:center;margin:4px 0}
      .meta{text-align:center;margin-bottom:14px}.cards{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:10px 0}.card{border:1px solid #111;padding:8px;text-align:center}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:11px}th,td{border:1px solid #111;padding:5px;text-align:left;vertical-align:top}th{background:#f0f4ff}
      .actions{margin:10px 0;text-align:right}@media print{.actions{display:none}}
    </style></head><body>
      <div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
      <h1>${escHtml(pageTitle)}</h1>
      <div class="meta">${escHtml(filters.academicyear || "All academic years")} | ${escHtml(filters.program || "All programs")} | ${escHtml(filters.programcode || "All program codes")}</div>
      <div class="cards">
        <div class="card"><b>${report.summary?.totalExaminations || 0}</b><br/>Exams</div>
        <div class="card"><b>${report.summary?.totalCourses || 0}</b><br/>Courses</div>
        <div class="card"><b>${report.summary?.totalFaculty || 0}</b><br/>Faculty</div>
        <div class="card"><b>${report.summary?.totalAttended || 0}</b><br/>Attended</div>
        <div class="card"><b>${report.summary?.totalSubmitted || 0}</b><br/>Submitted</div>
        <div class="card"><b>${report.summary?.totalGraded || 0}</b><br/>Graded</div>
      </div>
      <h2>Course Semester Faculty Summary</h2>
      <table><thead><tr><th>#</th><th>Academic year</th><th>Program</th><th>Program code</th><th>Category</th><th>Semester</th><th>Course</th><th>Course code</th><th>Faculty</th><th>Exams</th><th>Attended</th><th>Submitted</th><th>Graded</th></tr></thead><tbody>${rowHtml}</tbody></table>
      <h2>Exam Details</h2>
      <table><thead><tr><th>#</th><th>Exam</th><th>Exam code</th><th>Category</th><th>Course</th><th>Course code</th><th>Semester</th><th>Faculty</th><th>Status</th><th>Scheduled</th><th>Attended</th></tr></thead><tbody>${detailHtml}</tbody></table>
    </body></html>`);
    win.document.close();
  };

  const cards = [
    ["Examinations", report.summary?.totalExaminations || 0],
    ["Courses", report.summary?.totalCourses || 0],
    ["Faculty", report.summary?.totalFaculty || 0],
    ["Attended", report.summary?.totalAttended || 0],
    ["Submitted", report.summary?.totalSubmitted || 0],
    ["Graded", report.summary?.totalGraded || 0]
  ];

  return (
    <MenuPageShell title={pageTitle}>
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900}>{pageTitle}</Typography>
              <Typography color="text.secondary">{subtitle}</Typography>
            </Box>
            <Button variant="outlined" startIcon={<Print />} disabled={!report.grouped?.length} onClick={printPreview}>Print preview</Button>
          </Stack>
          {message && <Alert severity={/unable|blocked/i.test(message) ? "warning" : "info"} onClose={() => setMessage("")}>{message}</Alert>}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}><Autocomplete options={academicYearOptions} value={filters.academicyear || ""} onChange={(_, value) => setFilters((p) => ({ ...p, academicyear: value || "", program: "", programcode: "" }))} onInputChange={(_, value) => setFilters((p) => ({ ...p, academicyear: value || "", program: "", programcode: "" }))} renderInput={(params) => <TextField {...params} label="Academic year" />} /></Grid>
              <Grid item xs={12} md={3}><Autocomplete options={programOptions} value={filters.program || ""} onChange={(_, value) => setFilters((p) => ({ ...p, program: value || "", programcode: "" }))} onInputChange={(_, value) => setFilters((p) => ({ ...p, program: value || "", programcode: "" }))} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
              <Grid item xs={12} md={3}><Autocomplete options={programCodeOptions} value={filters.programcode || ""} onChange={(_, value) => setFilters((p) => ({ ...p, programcode: value || "" }))} onInputChange={(_, value) => setFilters((p) => ({ ...p, programcode: value || "" }))} renderInput={(params) => <TextField {...params} label="Program code" />} /></Grid>
              <Grid item xs={12} md={3}><Button fullWidth variant="contained" sx={{ height: 56 }} onClick={load} disabled={loading}>{loading ? "Loading..." : "Load report"}</Button></Grid>
            </Grid>
            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
          <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} sm={6} md={2} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900} sx={{ mb: 1 }}>Status-wise examinations</Typography><ResponsiveContainer width="100%" height="88%"><BarChart data={statusChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="examinations" fill="#2563eb" /><Bar dataKey="attended" fill="#16a34a" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 340 }}><Typography fontWeight={900} sx={{ mb: 1 }}>Faculty-wise examinations</Typography><ResponsiveContainer width="100%" height="88%"><BarChart data={facultyChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Legend /><Bar dataKey="examinations" fill="#7c3aed" /><Bar dataKey="attended" fill="#f97316" /></BarChart></ResponsiveContainer></Paper></Grid>
          </Grid>
          <Paper sx={{ p: 1 }}>
            <Typography sx={{ p: 1 }} fontWeight={900}>Course / semester / faculty summary</Typography>
            <DataGrid rows={(report.grouped || []).map((row, index) => ({ ...row, id: index + 1 }))} columns={[
              { field: "academicyear", headerName: "Academic year", minWidth: 130 },
              { field: "program", headerName: "Program", minWidth: 180 },
              { field: "programcode", headerName: "Program code", minWidth: 130 },
              { field: "category", headerName: "Category", minWidth: 150 },
              { field: "semester", headerName: "Semester", minWidth: 110 },
              { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
              { field: "coursecode", headerName: "Course code", minWidth: 130 },
              { field: "faculty", headerName: "Faculty", minWidth: 180 },
              { field: "facultyemail", headerName: "Faculty email", minWidth: 220 },
              { field: "examinations", headerName: "No. of exams", minWidth: 120 },
              { field: "attended", headerName: "Attended", minWidth: 110 },
              { field: "submitted", headerName: "Submitted", minWidth: 110 },
              { field: "graded", headerName: "Graded", minWidth: 100 }
            ]} autoHeight loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "online_examination_report_summary" } } }} pageSizeOptions={[10, 25, 50, 100]} />
          </Paper>
          <Paper sx={{ p: 1 }}>
            <Typography sx={{ p: 1 }} fontWeight={900}>Examination details</Typography>
            <DataGrid rows={(report.details || []).map((row) => ({ ...row, id: row._id }))} columns={[
              { field: "examname", headerName: "Exam", minWidth: 200, flex: 1 },
              { field: "examcode", headerName: "Exam code", minWidth: 130 },
              { field: "category", headerName: "Category", minWidth: 150 },
              { field: "academicyear", headerName: "Academic year", minWidth: 130 },
              { field: "programcode", headerName: "Program", minWidth: 120 },
              { field: "semester", headerName: "Semester", minWidth: 110 },
              { field: "course", headerName: "Course", minWidth: 220 },
              { field: "coursecode", headerName: "Course code", minWidth: 130 },
              { field: "faculty", headerName: "Faculty", minWidth: 180 },
              { field: "starttime", headerName: "Scheduled from", minWidth: 180, renderCell: ({ row }) => fmt(row.starttime) },
              { field: "endtime", headerName: "Scheduled to", minWidth: 180, renderCell: ({ row }) => fmt(row.endtime) },
              { field: "status", headerName: "Status", minWidth: 110 },
              { field: "attended", headerName: "Attended", minWidth: 110 },
              { field: "submitted", headerName: "Submitted", minWidth: 110 },
              { field: "graded", headerName: "Graded", minWidth: 100 }
            ]} autoHeight loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "online_examination_report_details" } } }} pageSizeOptions={[10, 25, 50, 100]} />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExaminationDetailsPage({ examContext = "Student", pageTitle = "Online examination details" }) {
  const [options, setOptions] = useState({ academicyears: [], faculty: [] });
  const [filters, setFilters] = useState({ academicyear: "", faculty: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [stage, setStage] = useState("Completed");
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewTab, setViewTab] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    ep1.get("/api/v2/online-exam/examination-details-options", { params: { colid: global1.colid, examcontext: examContext } })
      .then((res) => setOptions(res.data || { academicyears: [], faculty: [] }))
      .catch(() => setMessage("Unable to load online examination filters."));
  }, [examContext]);

  const load = async () => {
    if (!filters.academicyear || !filters.faculty) {
      setMessage("Select academic year and faculty.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/online-exam/examination-details", { colid: global1.colid, examcontext: examContext, ...filters });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || {});
      setSelectedExam(null);
      setSelectedResponse(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load online examination details.");
    } finally {
      setLoading(false);
    }
  };

  const stageRows = useMemo(() => rows.filter((row) => row.runstage === stage), [rows, stage]);
  const questions = useMemo(() => (selectedExam?.sections || []).flatMap((section) => (section.questions || []).map((question, index) => ({ ...question, sectionname: section.sectionname, sectiontype: section.sectiontype, sectionorder: section.order, id: `${section._id || section.sectionname}-${question._id || index}` }))), [selectedExam]);
  const selectedExamAttempts = selectedExam?.attempts || [];
  const cards = [
    ["Total exams", summary.total || 0],
    ["Completed", summary.completed || 0],
    ["Ongoing", summary.ongoing || 0],
    ["Pending", summary.pending || 0],
    ["Attended", summary.attended || 0],
    ["Submitted", summary.submitted || 0]
  ];

  const openExam = (row) => {
    setSelectedExam(row);
    setSelectedResponse(null);
    setViewTab(row.runstage === "Pending" ? 0 : viewTab);
  };

  return (
    <MenuPageShell title={pageTitle}>
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>{pageTitle}</Typography>
          {message && <Alert severity={/unable|select/i.test(message) ? "warning" : "info"} onClose={() => setMessage("")}>{message}</Alert>}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Autocomplete options={options.academicyears || []} value={filters.academicyear || ""} onChange={(_, value) => setFilters((p) => ({ ...p, academicyear: value || "" }))} onInputChange={(_, value) => setFilters((p) => ({ ...p, academicyear: value || "" }))} renderInput={(params) => <TextField {...params} label="Academic year" />} />
              </Grid>
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={options.faculty || []}
                  value={(options.faculty || []).find((item) => item.user === filters.faculty || item.username === filters.faculty) || null}
                  getOptionLabel={(option) => option?.label || ""}
                  isOptionEqualToValue={(option, value) => option.user === value?.user}
                  onChange={(_, value) => setFilters((p) => ({ ...p, faculty: value?.user || value?.username || "" }))}
                  renderInput={(params) => <TextField {...params} label="Faculty" />}
                />
              </Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" sx={{ height: 56 }} disabled={loading} onClick={load}>{loading ? "Loading..." : "Load"}</Button></Grid>
            </Grid>
            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>

          <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} sm={6} md={2} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>

          <Paper sx={{ p: 1 }}>
            <Tabs value={stage} onChange={(_, value) => { setStage(value); setSelectedExam(null); setSelectedResponse(null); }} variant="scrollable">
              <Tab value="Completed" label={`Completed (${summary.completed || 0})`} />
              <Tab value="Pending" label={`Pending (${summary.pending || 0})`} />
              <Tab value="Ongoing" label={`Ongoing (${summary.ongoing || 0})`} />
            </Tabs>
            <DataGrid
              rows={stageRows.map((row) => ({ ...row, id: row._id }))}
              columns={[
                { field: "examname", headerName: "Exam", minWidth: 200, flex: 1 },
                { field: "examcode", headerName: "Exam code", minWidth: 130 },
                { field: "program", headerName: "Program", minWidth: 170 },
                { field: "programcode", headerName: "Program code", minWidth: 130 },
                { field: "semester", headerName: "Semester", minWidth: 100 },
                { field: "course", headerName: "Course", minWidth: 220 },
                { field: "coursecode", headerName: "Course code", minWidth: 130 },
                { field: "starttime", headerName: "Start", minWidth: 180, renderCell: ({ row }) => fmt(row.starttime) },
                { field: "endtime", headerName: "End", minWidth: 180, renderCell: ({ row }) => fmt(row.endtime) },
                { field: "status", headerName: "Status", minWidth: 110 },
                { field: "attended", headerName: "Attended", minWidth: 100 },
                { field: "submitted", headerName: "Submitted", minWidth: 110 },
                { field: "graded", headerName: "Graded", minWidth: 90 },
                { field: "open", headerName: "Open", minWidth: 110, renderCell: ({ row }) => <Button size="small" onClick={() => openExam(row)}>Select</Button> }
              ]}
              autoHeight
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "online_examination_details" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </Paper>

          {selectedExam && (
            <Paper sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={900}>{selectedExam.examname}</Typography>
                  <Typography color="text.secondary">{selectedExam.course} ({selectedExam.coursecode}) | {selectedExam.runstage} | {fmt(selectedExam.starttime)}</Typography>
                </Box>
                {selectedExam.runstage !== "Pending" && (
                  <Tabs value={viewTab} onChange={(_, value) => { setViewTab(value); setSelectedResponse(null); }}>
                    <Tab label="Questions" />
                    <Tab label="Responses" />
                  </Tabs>
                )}
              </Stack>

              {(selectedExam.runstage === "Pending" || viewTab === 0) && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {(selectedExam.sections || []).map((section) => (
                    <Paper key={section._id || section.sectionname} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography fontWeight={900}>{section.sectionname || "Section"} {section.sectiontype ? `(${section.sectiontype})` : ""}</Typography>
                      {(section.questions || []).map((question, index) => (
                        <Box key={question._id || index} sx={{ mt: 1.5, p: 1.5, border: "1px solid #e2e8f0", borderRadius: 1, bgcolor: "#fff" }}>
                          <Typography fontWeight={900}>Question {index + 1} | Marks: {question.marks || 0}</Typography>
                          <Box sx={{ mt: 1, "& img": { maxWidth: "100%", maxHeight: 260, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%" }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 18, my: 1 } }} dangerouslySetInnerHTML={{ __html: richQuestionHtml(question) }} />
                          {!!question.options?.length && <Stack spacing={0.5} sx={{ mt: 1 }}>{question.options.map((opt, optIndex) => <Typography key={opt._id || optIndex} color={opt.iscorrect ? "success.main" : "text.primary"}>{String.fromCharCode(65 + optIndex)}. {opt.optiontext}{opt.iscorrect ? " (Correct)" : ""}</Typography>)}</Stack>}
                        </Box>
                      ))}
                    </Paper>
                  ))}
                  {!questions.length && <Alert severity="info">No questions are available for this examination.</Alert>}
                </Stack>
              )}

              {selectedExam.runstage !== "Pending" && viewTab === 1 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={5}>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <DataGrid
                        rows={selectedExamAttempts.map((row) => ({ ...row, id: row._id }))}
                        columns={[
                          { field: "student", headerName: "Student", minWidth: 170, flex: 1 },
                          { field: "regno", headerName: "Regno", minWidth: 120 },
                          { field: "status", headerName: "Status", minWidth: 110 },
                          { field: "marksobtained", headerName: "Marks", minWidth: 90 },
                          { field: "open", headerName: "Open", minWidth: 90, renderCell: ({ row }) => <Button size="small" onClick={() => setSelectedResponse(row)}>View</Button> }
                        ]}
                        autoHeight
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{ toolbar: { showQuickFilter: true } }}
                        pageSizeOptions={[10, 25, 50]}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    {!selectedResponse && <Alert severity="info">Select a student response to view all answers, marks and AI comments.</Alert>}
                    {selectedResponse && (
                      <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Typography fontWeight={900}>{selectedResponse.student} ({selectedResponse.regno || "-"})</Typography>
                          <Typography color="text.secondary">Status: {selectedResponse.status || "-"} | Marks: {selectedResponse.marksobtained || 0} / {selectedResponse.totalmarks || 0}</Typography>
                        </Paper>
                        {(selectedResponse.answers || []).map((answer, index) => (
                          <Paper key={answer._id || index} variant="outlined" sx={{ p: 1.5 }}>
                            <Typography fontWeight={900}>Question {index + 1} | Marks: {answer.marksobtained || 0} / {answer.maxmarks || 0}</Typography>
                            <Box sx={{ mt: 1, "& img": { maxWidth: "100%", maxHeight: 240, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%" }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 18, my: 1 } }} dangerouslySetInnerHTML={{ __html: richQuestionHtml(answer) }} />
                            <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}><b>Response:</b> {answer.answertext || answer.selectedoptiontext || "-"}</Typography>
                            {answer.attachmenturl && <AttachmentLink url={answer.attachmenturl} label="Attachment" />}
                            <Typography sx={{ mt: 1 }}><b>Grade:</b> {answer.grade || "-"}</Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap" }}><b>Evaluator comments:</b> {answer.comments || "-"}</Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap" }} color="text.secondary"><b>AI comments:</b> {answer.aicomments || "-"}</Typography>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Grid>
                </Grid>
              )}
            </Paper>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

const admissionAssignmentFields = ["academicyear", "category", "programapplied", "programcode", "name", "email", "phone", "applicationid", "applicationnumber", "username", "applicationstatus", "enrollmentstatus", "paymentstatus"];
const admissionScoreFields = ["academicyear", "category", "program", "programcode", "examname", "examcode", "student", "email", "regno", "applicationnumber", "status"];

export function AdmissionExamAssignmentPage() {
  const [options, setOptions] = useState({ exams: [], applicationValues: {}, examValues: {} });
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/admission-online-exam/options", { params: { colid: global1.colid } });
    setOptions(res.data || { exams: [], applicationValues: {}, examValues: {} });
  };
  useEffect(() => { loadOptions().catch(() => setMessage("Unable to load admission entrance options.")); }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-online-exam/applications", { colid: global1.colid, dynamicFilters: filters.filter((f) => f.value) });
      setApplications(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load admission applications.");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    const res = await ep1.get("/api/v2/admission-online-exam/assignments", { params: { colid: global1.colid } });
    setAssignments(res.data?.data || []);
  };
  useEffect(() => { loadAssignments().catch(() => {}); }, []);

  const assign = async () => {
    if (!selectedExam?._id || !selectedIds.length) return setMessage("Select exam and applicants.");
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-online-exam/assign", {
        colid: global1.colid,
        examid: selectedExam._id,
        applicationids: selectedIds,
        remarks,
        user: global1.user,
        username: global1.name
      });
      setMessage(`${res.data?.assigned || 0} applicant(s) assigned to exam.`);
      setSelectedIds([]);
      setRemarks("");
      await Promise.all([loadAssignments(), loadOptions()]);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to assign exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title="Admission Exam Assignment">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Admission Exam Assignment</Typography>
          {message && <Alert severity={/unable|select/i.test(message) ? "warning" : "success"} onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Autocomplete
                  options={options.exams || []}
                  value={selectedExam}
                  onChange={(_, value) => setSelectedExam(value)}
                  getOptionLabel={(exam) => exam ? `${exam.examname || ""} (${exam.examcode || ""}) | ${exam.academicyear || ""} | ${exam.program || ""} (${exam.programcode || ""}) | ${exam.category || ""}` : ""}
                  isOptionEqualToValue={(option, value) => option._id === value?._id}
                  renderInput={(params) => <TextField {...params} label="Admission entrance exam" />}
                />
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Grid>
              <Grid item xs={12}><Button variant="contained" disabled={loading || !selectedIds.length || !selectedExam} onClick={assign}>Assign selected applicants</Button></Grid>
            </Grid>
          </Paper>
          <DynamicFilters fields={admissionAssignmentFields} filters={filters} setFilters={setFilters} onApply={loadApplications} loading={loading} valueOptions={options.applicationValues || {}} />
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={rowsOf(applications)}
              columns={[
                { field: "name", headerName: "Applicant", minWidth: 180, flex: 1 },
                { field: "email", headerName: "Email", minWidth: 220, flex: 1 },
                { field: "applicationnumber", headerName: "Application No", minWidth: 150 },
                { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
                { field: "category", headerName: "Category", minWidth: 120 },
                { field: "program", headerName: "Program", minWidth: 180 },
                { field: "programcode", headerName: "Program Code", minWidth: 130 },
                { field: "applicationstatus", headerName: "Status", minWidth: 130 }
              ]}
              autoHeight
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admission_exam_applications" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
          <Paper sx={{ p: 1 }}>
            <Typography fontWeight={900} sx={{ p: 1 }}>Recent Assignments</Typography>
            <DataGrid
              rows={rowsOf(assignments)}
              columns={[
                { field: "examname", headerName: "Exam", minWidth: 180 },
                { field: "applicantname", headerName: "Applicant", minWidth: 180 },
                { field: "applicantemail", headerName: "Email", minWidth: 220 },
                { field: "applicationnumber", headerName: "Application No", minWidth: 140 },
                { field: "programcode", headerName: "Program", minWidth: 120 },
                { field: "status", headerName: "Status", minWidth: 120 },
                { field: "remarks", headerName: "Remarks", minWidth: 220, flex: 1 }
              ]}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admission_exam_assignments" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

const entranceComponentFields = ["academicyear", "regulation", "program", "programcode", "component", "status"];
const entranceStudentFilterFields = ["academicyear", "category", "programapplied", "programcode", "name", "email", "phone", "applicationid", "applicationnumber", "username", "applicationstatus", "enrollmentstatus", "paymentstatus"];

function AdmissionEntranceCriteria({ criteria, setCriteria, options, includeCategory = false, children }) {
  const programs = options.programs || [];
  const programNames = uniqueValues(programs, "program");
  const programCodes = uniqueValues(programs.filter((p) => !criteria.program || p.program === criteria.program), "programcode");
  const update = (field, value) => {
    setCriteria((prev) => {
      const next = { ...prev, [field]: value || "" };
      if (field === "program") {
        const match = programs.find((p) => p.program === value);
        if (match) next.programcode = match.programcode || next.programcode;
      }
      if (field === "programcode") {
        const match = programs.find((p) => p.programcode === value);
        if (match) next.program = match.program || next.program;
      }
      return next;
    });
  };
  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={2}><Autocomplete freeSolo options={options.academicyears || []} value={criteria.academicyear || ""} onInputChange={(_, value) => update("academicyear", value)} onChange={(_, value) => update("academicyear", value)} renderInput={(params) => <TextField {...params} label="Academic year" />} /></Grid>
        <Grid item xs={12} md={2}><Autocomplete freeSolo options={options.regulations || []} value={criteria.regulation || ""} onInputChange={(_, value) => update("regulation", value)} onChange={(_, value) => update("regulation", value)} renderInput={(params) => <TextField {...params} label="Regulation" />} /></Grid>
        <Grid item xs={12} md={3}><Autocomplete freeSolo options={programNames} value={criteria.program || ""} onInputChange={(_, value) => update("program", value)} onChange={(_, value) => update("program", value)} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
        <Grid item xs={12} md={2}><Autocomplete freeSolo options={programCodes} value={criteria.programcode || ""} onInputChange={(_, value) => update("programcode", value)} onChange={(_, value) => update("programcode", value)} renderInput={(params) => <TextField {...params} label="Program code" />} /></Grid>
        {includeCategory && <Grid item xs={12} md={2}><Autocomplete freeSolo options={options.categories || []} value={criteria.category || ""} onInputChange={(_, value) => update("category", value)} onChange={(_, value) => update("category", value)} renderInput={(params) => <TextField {...params} label="Category" />} /></Grid>}
        {children}
      </Grid>
    </Paper>
  );
}

export function AdmissionEntranceAssessmentComponentsPage() {
  const [options, setOptions] = useState({ academicyears: [], regulations: [], programs: [], valueOptions: {} });
  const [form, setForm] = useState({ academicyear: "", regulation: "", program: "", programcode: "", component: "", maxmarks: "", order: "", status: "Active" });
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/admission-entrance/components-options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };
  const load = async () => {
    setLoading(true);
    try {
      const params = { colid: global1.colid };
      filters.filter((f) => f.value).forEach((f) => { params[f.field] = f.value; });
      const res = await ep1.get("/api/v2/admission-entrance/components", { params });
      setRows(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load entrance components.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadOptions().catch(() => setMessage("Unable to load options.")); }, []);
  const save = async (payload = form) => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/admission-entrance/components", { ...payload, id: editingId, colid: global1.colid, user: global1.user, username: global1.name });
      setForm({ academicyear: "", regulation: "", program: "", programcode: "", component: "", maxmarks: "", order: "", status: "Active" });
      setEditingId("");
      setMessage("Assessment component saved.");
      await Promise.all([load(), loadOptions()]);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save assessment component.");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditingId(row._id);
    setForm({ ...form, ...row });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteSelected = async () => {
    if (!selectedIds.length) return setMessage("Select components to delete.");
    if (!window.confirm(`Delete ${selectedIds.length} selected component(s)?`)) return;
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-entrance/components-delete", { colid: global1.colid, ids: selectedIds });
      setSelectedIds([]);
      setMessage(`${res.data?.deletedCount || 0} component(s) deleted.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete selected components.");
    } finally {
      setLoading(false);
    }
  };
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ academicyear: "2026-27", regulation: "REG-2026", program: "BDS", programcode: "BDS", component: "Interview", maxmarks: 50, order: 1, status: "Active" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Components");
    XLSX.writeFile(wb, "admission_entrance_components_template.xlsx");
  };
  const uploadTemplate = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        for (const row of data) await save({ ...row, status: row.status || "Active" });
        setMessage(`${data.length} component(s) uploaded.`);
      } catch (error) {
        setMessage(error.message || "Unable to upload components.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <MenuPageShell title="Entrance Assessment Components">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Entrance Assessment Components</Typography>
          {message && <Alert severity={/unable|select/i.test(message) ? "warning" : "success"} onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}
          <AdmissionEntranceCriteria criteria={form} setCriteria={setForm} options={options}>
            <Grid item xs={12} md={3}><TextField fullWidth label="Component" value={form.component || ""} onChange={(e) => setForm((p) => ({ ...p, component: e.target.value }))} /></Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Max marks" value={form.maxmarks || ""} onChange={(e) => setForm((p) => ({ ...p, maxmarks: e.target.value }))} /></Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Order" value={form.order || ""} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} /></Grid>
            <Grid item xs={12} md={1.5}><TextField select fullWidth label="Status" value={form.status || "Active"} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
            <Grid item xs={12} md={1.5}><Button fullWidth sx={{ height: 56 }} variant="contained" disabled={loading} onClick={() => save()}>{editingId ? "Update" : "Save"}</Button></Grid>
          </AdmissionEntranceCriteria>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" onClick={downloadTemplate}>Template</Button>
            <Button component="label" variant="outlined" startIcon={<CloudUpload />}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadTemplate} /></Button>
            <Button color="error" variant="outlined" disabled={!selectedIds.length || loading} onClick={deleteSelected}>Bulk Delete</Button>
          </Stack>
          <DynamicFilters fields={entranceComponentFields} filters={filters} setFilters={setFilters} onApply={load} loading={loading} valueOptions={options.valueOptions || {}} />
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={rowsOf(rows)}
              columns={[
                { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
                { field: "regulation", headerName: "Regulation", minWidth: 130 },
                { field: "program", headerName: "Program", minWidth: 180 },
                { field: "programcode", headerName: "Program Code", minWidth: 130 },
                { field: "component", headerName: "Component", minWidth: 180, flex: 1 },
                { field: "maxmarks", headerName: "Max Marks", minWidth: 110 },
                { field: "order", headerName: "Order", minWidth: 90 },
                { field: "status", headerName: "Status", minWidth: 110 },
                { field: "actions", headerName: "Actions", minWidth: 110, renderCell: ({ row }) => <Button size="small" onClick={() => edit(row)}>Edit</Button> }
              ]}
              autoHeight
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admission_entrance_components" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function AdmissionEntranceMarksEntryPage() {
  const [options, setOptions] = useState({ academicyears: [], regulations: [], programs: [], categories: [], applicationValues: {} });
  const [criteria, setCriteria] = useState({ academicyear: "", regulation: "", program: "", programcode: "", category: "" });
  const [filters, setFilters] = useState([{ field: "name", operator: "contains", value: "" }]);
  const [components, setComponents] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const loadOptions = async () => {
    const [componentOpt, admissionOpt] = await Promise.all([
      ep1.get("/api/v2/admission-entrance/components-options", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/admission-online-exam/options", { params: { colid: global1.colid } })
    ]);
    setOptions({ ...(componentOpt.data || {}), applicationValues: admissionOpt.data?.applicationValues || {} });
  };
  useEffect(() => { loadOptions().catch(() => setMessage("Unable to load options.")); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-entrance/marks-load", { ...criteria, colid: global1.colid, dynamicFilters: filters.filter((f) => f.value) });
      setComponents(res.data?.components || []);
      setRows(res.data?.data || []);
      if (!(res.data?.components || []).length) setMessage("No active components found for the selected academic year, regulation and program.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load students and marks.");
    } finally {
      setLoading(false);
    }
  };
  const updateMark = (rowId, componentId, value) => {
    setRows((prev) => prev.map((row) => row.id === rowId ? { ...row, componentMarks: { ...(row.componentMarks || {}), [componentId]: value } } : row));
  };
  const save = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-entrance/marks-save", { ...criteria, colid: global1.colid, rows, user: global1.user, username: global1.name });
      setMessage(`${res.data?.saved || 0} student mark record(s) saved.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save marks.");
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { field: "applicantname", headerName: "Student", minWidth: 180, flex: 1 },
    { field: "applicationnumber", headerName: "Application No", minWidth: 140 },
    { field: "applicantemail", headerName: "Email", minWidth: 220 },
    { field: "category", headerName: "Category", minWidth: 120 },
    ...components.map((component) => ({
      field: `component_${component._id}`,
      headerName: `${component.component} / ${component.maxmarks || 0}`,
      minWidth: 150,
      renderCell: ({ row }) => (
        <TextField
          size="small"
          type="number"
          value={row.componentMarks?.[component._id] ?? ""}
          onChange={(e) => updateMark(row.id, String(component._id), e.target.value)}
          inputProps={{ min: 0, max: component.maxmarks || undefined }}
        />
      )
    })),
    { field: "totalmarks", headerName: "Saved Total", minWidth: 120 }
  ];
  return (
    <MenuPageShell title="Entrance Marks Entry">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Entrance Marks Entry</Typography>
          {message && <Alert severity={/unable|no active/i.test(message) ? "warning" : "success"} onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}
          <AdmissionEntranceCriteria criteria={criteria} setCriteria={setCriteria} options={options} includeCategory>
            <Grid item xs={12} md={1.5}><Button fullWidth sx={{ height: 56 }} variant="contained" disabled={loading} onClick={load}>Load</Button></Grid>
            <Grid item xs={12} md={1.5}><Button fullWidth sx={{ height: 56 }} variant="contained" color="success" disabled={loading || !rows.length} onClick={save}>Save Marks</Button></Grid>
          </AdmissionEntranceCriteria>
          <DynamicFilters fields={entranceStudentFilterFields} filters={filters} setFilters={setFilters} onApply={load} loading={loading} valueOptions={options.applicationValues || {}} />
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              autoHeight
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admission_entrance_marks" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function AdmissionEntranceReportPage() {
  const [options, setOptions] = useState({ academicyears: [], regulations: [], programs: [], categories: [], applicationValues: {} });
  const [criteria, setCriteria] = useState({ academicyear: "", regulation: "", program: "", programcode: "", category: "", includeOnlineExam: false, sortBy: "overallMarks", sortDir: "desc" });
  const [filters, setFilters] = useState([{ field: "name", operator: "contains", value: "" }]);
  const [report, setReport] = useState({ components: [], data: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const loadOptions = async () => {
    const [componentOpt, admissionOpt] = await Promise.all([
      ep1.get("/api/v2/admission-entrance/components-options", { params: { colid: global1.colid } }),
      ep1.get("/api/v2/admission-online-exam/options", { params: { colid: global1.colid } })
    ]);
    setOptions({ ...(componentOpt.data || {}), applicationValues: admissionOpt.data?.applicationValues || {} });
  };
  useEffect(() => { loadOptions().catch(() => setMessage("Unable to load options.")); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-entrance/report", { ...criteria, includeOnlineExam: criteria.includeOnlineExam ? "Yes" : "No", colid: global1.colid, dynamicFilters: filters.filter((f) => f.value) });
      setReport(res.data || { components: [], data: [], summary: {} });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load entrance report.");
    } finally {
      setLoading(false);
    }
  };
  const sortOptions = ["rank", "applicantname", "applicationnumber", "category", "componentTotal", "onlineExamMarks", "overallMarks", ...(report.components || []).map((c) => String(c._id))];
  const columns = [
    { field: "rank", headerName: "Rank", minWidth: 80 },
    { field: "applicantname", headerName: "Student", minWidth: 180, flex: 1 },
    { field: "applicationnumber", headerName: "Application No", minWidth: 140 },
    { field: "applicantemail", headerName: "Email", minWidth: 220 },
    { field: "category", headerName: "Category", minWidth: 120 },
    { field: "programcode", headerName: "Program", minWidth: 120 },
    ...(report.components || []).map((component) => ({
      field: `component_${component._id}`,
      headerName: component.component,
      minWidth: 140,
      valueGetter: ({ row }) => row.componentMarks?.[component._id] || 0
    })),
    { field: "componentTotal", headerName: "Component Total", minWidth: 140 },
    ...(criteria.includeOnlineExam ? [{ field: "onlineExamMarks", headerName: "Online Exam Marks", minWidth: 150 }] : []),
    { field: "overallMarks", headerName: "Overall Marks", minWidth: 140 }
  ];
  const cards = [["Candidates", report.summary?.candidates || 0], ["Average", report.summary?.average || 0], ["Highest", report.summary?.highest || 0], ["Components", report.components?.length || 0]];
  return (
    <MenuPageShell title="Entrance Report">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Entrance Report</Typography>
          {message && <Alert severity="warning" onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}
          <AdmissionEntranceCriteria criteria={criteria} setCriteria={setCriteria} options={options} includeCategory>
            <Grid item xs={12} md={2}><FormControlLabel control={<Checkbox checked={!!criteria.includeOnlineExam} onChange={(e) => setCriteria((p) => ({ ...p, includeOnlineExam: e.target.checked }))} />} label="Include online examination marks" /></Grid>
            <Grid item xs={12} md={2}><Autocomplete freeSolo options={sortOptions} value={criteria.sortBy || "overallMarks"} onInputChange={(_, value) => setCriteria((p) => ({ ...p, sortBy: value || "overallMarks" }))} onChange={(_, value) => setCriteria((p) => ({ ...p, sortBy: value || "overallMarks" }))} renderInput={(params) => <TextField {...params} label="Sort by" />} /></Grid>
            <Grid item xs={12} md={1.5}><TextField select fullWidth label="Sort" value={criteria.sortDir || "desc"} onChange={(e) => setCriteria((p) => ({ ...p, sortDir: e.target.value }))}><MenuItem value="desc">Highest first</MenuItem><MenuItem value="asc">Lowest first</MenuItem></TextField></Grid>
            <Grid item xs={12} md={1.5}><Button fullWidth sx={{ height: 56 }} variant="contained" disabled={loading} onClick={load}>Load Report</Button></Grid>
          </AdmissionEntranceCriteria>
          <DynamicFilters fields={entranceStudentFilterFields} filters={filters} setFilters={setFilters} onApply={load} loading={loading} valueOptions={options.applicationValues || {}} />
          <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={report.data || []}
              columns={columns}
              autoHeight
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admission_entrance_merit_report" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function AdmissionApplicantExamPage() {
  const [login, setLogin] = useState(() => JSON.parse(localStorage.getItem("admissionApplicantExamLogin") || "null"));
  const [form, setForm] = useState({ colid: "", username: "", password: "" });
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [active, setActive] = useState({ section: 0, question: 0 });
  const [remaining, setRemaining] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submitRef = useRef(false);
  const userZone = browserTimeZone();

  const loadExams = async (applicant = login) => {
    if (!applicant?.applicationid) return;
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/admission-online-exam/applicant-exams", { params: { colid: applicant.colid, applicationid: applicant.applicationid } });
      setExams(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load assigned entrance exams.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (login?.applicationid) loadExams(login); }, []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    if (!attempt || attempt.submittime) return undefined;
    const id = setInterval(() => {
      if (!navigator.onLine) return;
      setRemaining((value) => {
        if (value <= 1) {
          submit("Time over", true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
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

  const doLogin = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-online-exam/login", form);
      setLogin(res.data?.applicant);
      localStorage.setItem("admissionApplicantExamLogin", JSON.stringify(res.data?.applicant));
      setMessage("Login successful.");
      await loadExams(res.data?.applicant);
    } catch (error) {
      setMessage(error.response?.data?.message || "Invalid applicant login.");
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("admissionApplicantExamLogin");
    setLogin(null);
    setExams([]);
    setAttempt(null);
  };
  const start = async (exam) => {
    try {
      await document.documentElement.requestFullscreen?.();
      const res = await ep1.post("/api/v2/admission-online-exam/start-attempt", { colid: login.colid, applicationid: login.applicationid, examid: exam._id });
      setSelectedExam(res.data.exam);
      setAttempt(res.data.attempt);
      setAnswers(res.data.attempt.answers || []);
      setRemaining(res.data.attempt.remainingseconds || exam.durationminutes * 60);
      submitRef.current = false;
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to start exam.");
    }
  };
  const answerPatch = (questionid, patch) => setAnswers((prev) => prev.map((a) => String(a.questionid) === String(questionid) ? { ...a, ...patch } : a));
  const uploadAnswer = async (file, answer) => {
    if (!file || !answer) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("colid", login.colid);
    fd.append("context", "admission-answer");
    const res = await ep1.post("/api/v2/online-exam/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    answerPatch(answer.questionid, { attachmenturl: res.data?.data?.url || "" });
  };
  const save = async () => {
    if (!attempt || submitRef.current) return;
    await ep1.post("/api/v2/online-exam/save-attempt", { colid: login.colid, attemptid: attempt._id, answers, remainingseconds: remaining });
    setMessage("Saved.");
  };
  const submit = async (reason = "Submitted by applicant", auto = false) => {
    if (!attempt || submitRef.current) return;
    submitRef.current = true;
    try {
      await ep1.post("/api/v2/online-exam/submit-attempt", { colid: login.colid, attemptid: attempt._id, answers, remainingseconds: remaining, autosubmitted: auto, submitreason: reason });
      setMessage(`Exam submitted. ${reason}`);
      setAttempt((p) => ({ ...p, submittime: new Date(), status: "Submitted" }));
      document.exitFullscreen?.().catch(() => {});
      await loadExams(login);
    } catch (error) {
      submitRef.current = false;
      setMessage(error.response?.data?.message || "Unable to submit exam.");
    }
  };
  const currentSection = selectedExam?.sections?.[active.section];
  const currentQuestion = currentSection?.questions?.[active.question];
  const currentAnswer = answers.find((a) => String(a.questionid) === String(currentQuestion?._id));
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  if (attempt && !attempt.submittime && selectedExam) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", color: "#fff", p: 2 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2, bgcolor: "#111827", color: "#fff" }}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={2}>
              <Box sx={{ flex: 1 }}><Typography variant="h5" fontWeight={900}>{selectedExam.examname}</Typography><Typography>{login?.name} | {login?.applicationnumber || login?.applicationid}</Typography></Box>
              <Chip color={online ? "success" : "warning"} label={online ? "Online" : "Offline - timer paused"} />
              <Typography variant="h4" fontWeight={900}>{minutes}:{seconds}</Typography>
              <Button variant="outlined" onClick={save}>Save</Button>
              <Button variant="contained" color="error" onClick={() => submit("Final submitted", false)}>Submit</Button>
            </Stack>
          </Paper>
          {message && <Alert severity="warning">{message}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1.5, height: "calc(100vh - 150px)", overflow: "auto" }}>
                {(selectedExam.sections || []).map((s, si) => (
                  <Box key={s._id} sx={{ mb: 1.5 }}>
                    <Typography fontWeight={900}>{s.sectionname}</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {(s.questions || []).map((q, qi) => <Button key={q._id} size="small" variant={active.section === si && active.question === qi ? "contained" : "outlined"} onClick={() => setActive({ section: si, question: qi })}>{qi + 1}</Button>)}
                    </Stack>
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2, minHeight: "calc(100vh - 150px)" }}>
                <Typography variant="h6" fontWeight={900}>{currentSection?.sectionname}</Typography>
                <Box
                  sx={{ mt: 2, color: "#111827", "& img": { maxWidth: "100%", maxHeight: 320, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%", my: 1 }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 20, my: 1 }, "& a": { color: "#2563eb" } }}
                  dangerouslySetInnerHTML={{ __html: richQuestionHtml(currentQuestion) }}
                />
                {/^mcq$/i.test(currentQuestion?.questiontype || currentSection?.sectiontype) ? (
                  <Stack spacing={1} sx={{ mt: 3 }}>{(currentQuestion?.options || []).map((o) => <FormControlLabel key={o._id} control={<Radio checked={currentAnswer?.selectedoptionid === o._id} onChange={() => answerPatch(currentQuestion._id, { selectedoptionid: o._id, selectedoptiontext: o.optiontext })} />} label={o.optiontext} />)}</Stack>
                ) : (
                  <TextField fullWidth multiline minRows={8} sx={{ mt: 3 }} label="Answer" value={currentAnswer?.answertext || ""} onChange={(e) => answerPatch(currentQuestion._id, { answertext: e.target.value })} />
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button component="label" startIcon={<CloudUpload />}>Upload answer attachment<input hidden type="file" onChange={(e) => uploadAnswer(e.target.files?.[0], currentAnswer)} /></Button>
                  {currentAnswer?.attachmenturl && <AttachmentLink url={currentAnswer.attachmenturl} label="Uploaded answer file" />}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  if (!login) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Paper sx={{ p: 3, width: "100%", maxWidth: 520 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={900}>Admission Entrance Exam Login</Typography>
            {message && <Alert severity="warning">{message}</Alert>}
            <TextField label="Institution ID" value={form.colid} onChange={(e) => setForm((p) => ({ ...p, colid: e.target.value }))} />
            <TextField label="Username / Email / Application No" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            <Button variant="contained" disabled={loading} onClick={doLogin}>{loading ? "Checking..." : "Login"}</Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={900}>Admission Entrance Exams</Typography>
            <Typography color="text.secondary">{login.name} | {login.email} | {login.program} ({login.programcode})</Typography>
          </Box>
          <Button variant="outlined" onClick={() => loadExams(login)}>Refresh</Button>
          <Button color="error" onClick={logout}>Logout</Button>
        </Stack>
        {message && <Alert severity="info" onClose={() => setMessage("")}>{message}</Alert>}
        {loading && <LinearProgress />}
        <Grid container spacing={2}>
          {exams.map((exam) => (
            <Grid item xs={12} md={4} key={exam._id}>
              <Card sx={{ height: "100%", bgcolor: exam.canStart ? "#f0fdf4" : "#fff" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={900}>{exam.examname}</Typography>
                    <Typography variant="body2"><b>Saved timezone:</b> {exam.timezone || "UTC"}</Typography>
                    <Typography variant="body2">Saved start: {fmtZone(exam.starttime, exam.timezone || "UTC")}</Typography>
                    <Typography variant="body2">Saved end: {fmtZone(exam.endtime, exam.timezone || "UTC")}</Typography>
                    <Typography variant="body2"><b>Your timezone:</b> {userZone}</Typography>
                    <Typography variant="body2">Your start: {fmtZone(exam.starttime, userZone)}</Typography>
                    <Typography variant="body2">Your end: {fmtZone(exam.endtime, userZone)}</Typography>
                    {exam.attempt?.submittime ? <Chip label={`Submitted | Score ${exam.attempt.marksobtained || 0}/${exam.attempt.totalmarks || 0}`} /> : <Button variant="contained" disabled={!exam.canStart} onClick={() => start(exam)}>{exam.canStart ? "Start Exam" : "Not Available Now"}</Button>}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {!loading && !exams.length && <Grid item xs={12}><Alert severity="info">No admission entrance exam is assigned to you right now.</Alert></Grid>}
        </Grid>
      </Stack>
    </Box>
  );
}

export function AdmissionEntranceScoresPage() {
  const [options, setOptions] = useState({ examValues: {} });
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "contains", value: "" }]);
  const [report, setReport] = useState({ data: [], byProgram: [], summary: {} });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/admission-online-exam/options", { params: { colid: global1.colid } });
    setOptions(res.data || { examValues: {} });
  };
  useEffect(() => { loadOptions().catch(() => {}); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/admission-online-exam/scores", { colid: global1.colid, dynamicFilters: filters.filter((f) => f.value) });
      setReport(res.data || { data: [], byProgram: [], summary: {} });
    } finally {
      setLoading(false);
    }
  };
  const cards = [["Candidates", report.summary?.candidates || 0], ["Submitted", report.summary?.submitted || 0], ["Graded", report.summary?.graded || 0], ["Average", report.summary?.average || 0]];
  return (
    <MenuPageShell title="Admission Entrance Scores">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Admission Entrance Scores</Typography>
          <DynamicFilters fields={admissionScoreFields} filters={filters} setFilters={setFilters} onApply={load} loading={loading} valueOptions={options.examValues || {}} />
          <Grid container spacing={2}>{cards.map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
          <Paper sx={{ p: 2, height: 330 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={report.byProgram || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="programcode" /><YAxis /><Tooltip /><Legend /><Bar dataKey="candidates" fill="#2563eb" /><Bar dataKey="submitted" fill="#16a34a" /><Bar dataKey="average" fill="#f97316" /></BarChart></ResponsiveContainer></Paper>
          <Paper sx={{ p: 1 }}>
            <DataGrid
              rows={rowsOf(report.data)}
              columns={[
                { field: "examname", headerName: "Exam", minWidth: 180 },
                { field: "student", headerName: "Applicant", minWidth: 180 },
                { field: "email", headerName: "Email", minWidth: 220 },
                { field: "applicationnumber", headerName: "Application No", minWidth: 140 },
                { field: "category", headerName: "Category", minWidth: 120 },
                { field: "programcode", headerName: "Program", minWidth: 120 },
                { field: "status", headerName: "Status", minWidth: 120 },
                { field: "marksobtained", headerName: "Total Score", minWidth: 130, renderCell: ({ row }) => <Button size="small" onClick={() => setSelected(row)}>{row.marksobtained || 0}/{row.totalmarks || 0}</Button> }
              ]}
              autoHeight
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admission_entrance_scores" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
            />
          </Paper>
          <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="lg" fullWidth>
            <DialogTitle>Detailed Score</DialogTitle>
            <DialogContent dividers>
              {selected && <Stack spacing={1.5}>
                <Typography fontWeight={900}>{selected.student} - {selected.examname}</Typography>
                {(selected.answers || []).map((answer, index) => (
                  <Paper key={answer._id || answer.questionid} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography fontWeight={800}>Question {index + 1}</Typography>
                    <Box sx={{ mt: 0.5, "& img": { maxWidth: "100%", maxHeight: 220, objectFit: "contain" }, "& table": { borderCollapse: "collapse", width: "100%" }, "& td": { border: "1px solid #cbd5e1", p: 0.75 }, "& .question-math": { fontFamily: "Cambria Math, Georgia, serif", fontSize: 18, my: 1 } }} dangerouslySetInnerHTML={{ __html: richQuestionHtml(answer) }} />
                    <Typography variant="body2" sx={{ mt: 0.5 }}>Answer: {answer.answertext || answer.selectedoptiontext || "-"}</Typography>
                    <Typography variant="body2">Marks: {answer.marksobtained || 0}/{answer.maxmarks || 0}</Typography>
                    {answer.comments && <Typography variant="body2">Comments: {answer.comments}</Typography>}
                  </Paper>
                ))}
              </Stack>}
            </DialogContent>
            <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
