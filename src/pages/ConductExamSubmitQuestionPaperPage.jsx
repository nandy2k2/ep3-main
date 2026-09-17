import React, { useEffect, useMemo, useRef, useState } from "react";
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
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Switch,
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
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import AdvancedDrawingPad from "./QuestionDrawingPad";

const bloomLevels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const questionTypes = ["MCQ", "Descriptive", "Short Answer Type", "Long answer Type", "Case Studies"];
const difficulties = ["Easy", "Medium", "Hard"];
const languages = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", "German", "Spanish", "Italian", "French"];
const geminiModels = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];
const aiProviders = ["Gemini", "Ollama", "OpenAI", "Claude"];
const openAiModels = ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.5", "gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "o3", "o4-mini"];
const claudeModels = ["claude-opus-4-1-20250805", "claude-opus-4-20250514", "claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"];

const emptyQuestion = {
  question: "",
  questionhtml: "",
  includemathematicalexpressions: "No",
  mathematicalexpression: "",
  tabledata: [],
  imageurl: "",
  imagefilename: "",
  drawingdataurl: "",
  questiontype: "Short Answer Type",
  difficultylevel: "Medium",
  language: "English",
  marks: 0,
  bloomlevels: [],
  conumber: "",
  co: "",
  attachmenturl: "",
  attachmentfilename: "",
  contentblocks: [],
  attachments: [],
  aimappingcomments: ""
};

const emptyGenerate = {
  sectionIndex: 0,
  count: 5,
  questiontype: "Short Answer Type",
  difficultylevel: "Medium",
  language: "English",
  aiProvider: "Gemini",
  geminiModel: "gemini-2.5-flash",
  openaiModel: "gpt-4.1-mini",
  claudeModel: "claude-3-5-haiku-latest",
  ollamaConfigId: "",
  additionalAiPrompt: "",
  bloomlevels: [],
  conumber: "",
  syllabusMode: "Complete Syllabus",
  selectedModules: [],
  selectedTopics: []
};

const uniq = (items) => [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const paperLabel = (row) => `${row.course || ""}${row.coursecode ? ` (${row.coursecode})` : ""} - ${row.programcode || ""}`;
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const selectAllOption = "__SELECT_ALL__";
const renderCheckboxOption = (props, option, { selected }) => (
  <li {...props}>
    <Checkbox icon={uncheckedIcon} checkedIcon={checkedIcon} checked={selected} sx={{ mr: 1 }} />
    {option === selectAllOption ? "Select all" : option}
  </li>
);
const mathSymbols = ["√", "∑", "∫", "π", "θ", "≤", "≥", "≠", "∞", "±", "÷", "×", "²", "³", "α", "β", "γ", "Δ", "λ", "μ", "σ", "Ω"];
const nl2br = (value) => esc(value).replace(/\n/g, "<br/>");
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
  return `<table class="question-table">${tabledata.map((row) => `<tr>${(row || []).map((cell) => `<td>${nl2br(cell)}</td>`).join("")}</tr>`).join("")}</table>`;
};
const blockHtml = (block) => {
  const type = block.blocktype || block.type;
  if (type === "text") return `<div class="question-text">${renderRichText(block.text)}</div>`;
  if (type === "math") return `<div class="math-block">${nl2br(block.text)}</div>`;
  if (type === "table") return tableToHtml(block.tabledata);
  if (type === "image") return block.url ? `<div class="question-media"><img src="${esc(block.url)}" alt="${esc(block.title || block.filename || "Question image")}" /></div>` : "";
  if (type === "drawing") return block.dataurl ? `<div class="question-media"><img src="${esc(block.dataurl)}" alt="${esc(block.title || "Question drawing")}" /></div>` : "";
  if (type === "attachment") return block.url ? `<div class="question-attachment"><a href="${esc(block.url)}" target="_blank" rel="noreferrer">${esc(block.title || block.filename || "Attachment")}</a></div>` : "";
  return "";
};
const richQuestionHtml = (question) => {
  if (Array.isArray(question.contentblocks) && question.contentblocks.length) {
    const mainQuestion = question.questionhtml || question.question;
    const firstTextBlock = question.contentblocks.find((block) => (block.blocktype || block.type) === "text");
    const firstTextPlain = String(firstTextBlock?.text || "").replace(/<[^>]*>/g, "").trim();
    const mainPlain = String(mainQuestion || "").replace(/<[^>]*>/g, "").trim();
    const mainHtml = mainPlain && mainPlain !== firstTextPlain ? `<div class="question-text question-main">${renderRichText(mainQuestion)}</div>` : "";
    return `${mainHtml}${question.contentblocks.map(blockHtml).join("")}`;
  }
  const textHtml = question.questionhtml || nl2br(question.question);
  const math = question.mathematicalexpression ? `<div class="math-block">${nl2br(question.mathematicalexpression)}</div>` : "";
  const table = tableToHtml(question.tabledata);
  const image = question.imageurl ? `<div class="question-media"><img src="${esc(question.imageurl)}" alt="${esc(question.imagefilename || "Question image")}" /></div>` : "";
  const drawing = question.drawingdataurl ? `<div class="question-media"><img src="${esc(question.drawingdataurl)}" alt="Question drawing" /></div>` : "";
  const attachmentLinks = [
    ...(question.attachmenturl ? [{ title: question.attachmentfilename || "Attachment", url: question.attachmenturl }] : []),
    ...((question.attachments || []).filter((item) => item.url))
  ].map((item) => `<div class="question-attachment"><a href="${esc(item.url)}" target="_blank" rel="noreferrer">${esc(item.title || item.filename || "Attachment")}</a></div>`).join("");
  return `${textHtml}${math}${table}${image}${drawing}${attachmentLinks}`;
};

function DrawingPad({ value, onChange, disabled, initialColor = "#111827", initialBrushSize = 2, onStyleChange = () => {} }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(initialColor || "#111827");
  const [brushSize, setBrushSize] = useState(Number(initialBrushSize || 2));

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const start = (event) => {
    if (disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
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
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  useEffect(() => {
    onStyleChange({ color, brushsize: brushSize });
  }, [color, brushSize]);

  return (
    <Box>
      <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Brush color"
            type="color"
            value={color}
            disabled={disabled}
            onChange={(e) => setColor(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" color="text.secondary">Brush size</Typography>
          <Slider min={1} max={18} value={brushSize} disabled={disabled} onChange={(_, value) => setBrushSize(value)} valueLabelDisplay="auto" />
        </Grid>
      </Grid>
      <Box
        component="canvas"
        ref={canvasRef}
        width={760}
        height={190}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
        sx={{ width: "100%", height: 190, bgcolor: "#fff", border: "1px solid #cbd5e1", borderRadius: 1, touchAction: "none", cursor: disabled ? "not-allowed" : "crosshair" }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => onChange(canvasRef.current.toDataURL("image/png"))}>Save Drawing</Button>
        <Button size="small" color="error" variant="outlined" disabled={disabled || !value} onClick={clear}>Clear</Button>
      </Stack>
    </Box>
  );
}

function QuestionTableEditor({ value = [], onChange, disabled }) {
  const table = Array.isArray(value) ? value : [];
  const ensureTable = () => onChange(table.length ? table : [["", ""], ["", ""]]);
  const updateCell = (rowIndex, colIndex, cellValue) => onChange(table.map((row, rIndex) => rIndex === rowIndex ? row.map((cell, cIndex) => cIndex === colIndex ? cellValue : cell) : row));
  const cols = Math.max(1, ...table.map((row) => row.length));
  return (
    <Box>
      {!table.length ? (
        <Button size="small" variant="outlined" disabled={disabled} onClick={ensureTable}>Add Table</Button>
      ) : (
        <Stack spacing={1}>
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& td": { border: "1px solid #cbd5e1", p: 0.5 } }}>
              <tbody>
                {table.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                      <td key={colIndex}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={1}
                          variant="standard"
                          value={row[colIndex] || ""}
                          disabled={disabled}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          InputProps={{ disableUnderline: true, sx: { fontSize: 13, px: 1 } }}
                        />
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
      )}
    </Box>
  );
}

function ToolbarButton({ children, title, command, value, disabled }) {
  const apply = (event) => {
    event.preventDefault();
    if (disabled) return;
    document.execCommand(command, false, value);
  };
  return (
    <button type="button" title={title} disabled={disabled} onMouseDown={apply} style={{ minWidth: 30, minHeight: 28, border: "1px solid #cbd5e1", background: "#fff", borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function ToolbarSelect({ title, value, options, command, disabled }) {
  const [selected, setSelected] = useState(value);
  const apply = (event) => {
    const next = event.target.value;
    setSelected(next);
    if (disabled) return;
    document.execCommand(command, false, next);
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
    if (disabled) return;
    document.execCommand(command, false, next);
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
    <Box sx={{
      "& .rsw-editor": { border: "1px solid #cbd5e1", borderRadius: "8px", bgcolor: "#fff" },
      "& .rsw-toolbar": { borderBottom: "1px solid #e5e7eb", flexWrap: "wrap", gap: "4px", p: "6px" },
      "& .rsw-ce": { minHeight: 130, p: 1.25, outline: "none", "& ul": { listStyle: "disc", pl: 3 }, "& ol": { listStyle: "decimal", pl: 3 } }
    }}>
      <Editor
        value={value || ""}
        disabled={disabled}
        placeholder="Type formatted question text..."
        onChange={(event) => onChange(event.target.value)}
      >
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

function OrderedQuestionContentEditor({ question, disabled, uploadingKey, uploadAttachment, updateQuestion, sectionIndex, questionIndex }) {
  const blocks = Array.isArray(question.contentblocks) ? question.contentblocks : [];
  const patchBlocks = (nextBlocks) => updateQuestion(sectionIndex, questionIndex, { contentblocks: nextBlocks });
  const moveQuestionTextToRichBlock = () => {
    const generatedText = question.questionhtml || question.question || "";
    if (!generatedText) return;
    patchBlocks([{ blocktype: "text", text: renderRichText(generatedText) }, ...blocks]);
    updateQuestion(sectionIndex, questionIndex, { question: "", questionhtml: "" });
  };
  const addBlock = (blocktype) => {
    const defaults = {
      text: { blocktype, text: question.question && !blocks.length ? question.question : "" },
      math: { blocktype, text: "", color: "#111827", brushsize: 2 },
      table: { blocktype, tabledata: [["", ""], ["", ""]] },
      image: { blocktype, url: "", filename: "", title: "" },
      drawing: { blocktype, dataurl: "", color: "#111827", brushsize: 2 },
      attachment: { blocktype, url: "", filename: "", title: "" }
    };
    patchBlocks([...blocks, defaults[blocktype]]);
  };
  const updateBlock = (index, patch) => patchBlocks(blocks.map((block, itemIndex) => itemIndex === index ? { ...block, ...patch } : block));
  const deleteBlock = (index) => patchBlocks(blocks.filter((_, itemIndex) => itemIndex !== index));
  const moveBlock = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    patchBlocks(next);
  };
  const uploadBlock = (file, kind, blockIndex) => uploadAttachment(file, kind, sectionIndex, questionIndex, blockIndex);
  const handleDrop = (event, kind, blockIndex) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) uploadBlock(file, kind, blockIndex);
  };

  return (
    <Grid item xs={12}>
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#fff" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Button size="small" variant="contained" disabled={disabled || !(question.questionhtml || question.question)} onClick={moveQuestionTextToRichBlock}>Move Question Text to Rich Editor</Button>
          <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("text")}>Add Text</Button>
          <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("math")}>Add Math</Button>
          <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("table")}>Add Table</Button>
          <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("image")}>Add Photo</Button>
          <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("drawing")}>Add Drawing</Button>
          <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("attachment")}>Add Attachment</Button>
        </Stack>
        {!blocks.length && <Alert severity="info">Add content blocks in the exact order required in the question paper.</Alert>}
        <Stack spacing={1.5}>
          {blocks.map((block, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fafc" }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Chip size="small" label={`${index + 1}. ${block.blocktype}`} />
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" disabled={disabled || index === 0} onClick={() => moveBlock(index, -1)}>Up</Button>
                  <Button size="small" disabled={disabled || index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>Down</Button>
                  <Button size="small" color="error" disabled={disabled} onClick={() => deleteBlock(index)}>Delete</Button>
                </Stack>
              </Stack>
              {block.blocktype === "text" && <RichTextBlockEditor value={block.text || ""} disabled={disabled} onChange={(text) => updateBlock(index, { text })} />}
              {block.blocktype === "math" && (
                <Box>
                  <TextField fullWidth multiline minRows={2} label="Mathematical expression" disabled={disabled} value={block.text || ""} onChange={(e) => updateBlock(index, { text: e.target.value })} />
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                    {mathSymbols.map((symbol) => <Button key={symbol} size="small" variant="outlined" disabled={disabled} onClick={() => updateBlock(index, { text: `${block.text || ""}${symbol}` })} sx={{ minWidth: 34 }}>{symbol}</Button>)}
                  </Stack>
                </Box>
              )}
              {block.blocktype === "table" && <QuestionTableEditor value={block.tabledata || []} disabled={disabled} onChange={(tabledata) => updateBlock(index, { tabledata })} />}
              {block.blocktype === "image" && (
                <Paper variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "questionBlockImage", index)} sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#fff" }}>
                  <TextField fullWidth label="Image title" disabled={disabled} value={block.title || ""} onChange={(e) => updateBlock(index, { title: e.target.value })} sx={{ mb: 1 }} />
                  <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled || uploadingKey === `questionBlockImage-${sectionIndex}-${questionIndex}-${index}`}>{uploadingKey === `questionBlockImage-${sectionIndex}-${questionIndex}-${index}` ? "Uploading..." : "Upload or Drop Photo"}<input hidden type="file" accept="image/*" onChange={(e) => uploadBlock(e.target.files?.[0], "questionBlockImage", index)} /></Button>
                  {block.url && <Box sx={{ mt: 1 }}><img src={block.url} alt={block.title || block.filename || "Question"} style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }} /></Box>}
                </Paper>
              )}
              {block.blocktype === "drawing" && <AdvancedDrawingPad value={block.dataurl || ""} disabled={disabled} initialColor={block.color || "#111827"} initialBrushSize={block.brushsize || 2} onStyleChange={(style) => updateBlock(index, style)} onChange={(dataurl) => updateBlock(index, { dataurl })} />}
              {block.blocktype === "attachment" && (
                <Paper variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "questionBlockAttachment", index)} sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#fff" }}>
                  <TextField fullWidth label="Attachment title" disabled={disabled} value={block.title || ""} onChange={(e) => updateBlock(index, { title: e.target.value })} sx={{ mb: 1 }} />
                  <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled || uploadingKey === `questionBlockAttachment-${sectionIndex}-${questionIndex}-${index}`}>{uploadingKey === `questionBlockAttachment-${sectionIndex}-${questionIndex}-${index}` ? "Uploading..." : "Upload or Drop Attachment"}<input hidden type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => uploadBlock(e.target.files?.[0], "questionBlockAttachment", index)} /></Button>
                  {block.url && <Button size="small" href={block.url} target="_blank" rel="noreferrer" sx={{ display: "block", mx: "auto", mt: 1 }}>{block.title || block.filename || "Attachment"}</Button>}
                </Paper>
              )}
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Grid>
  );
}

function RichQuestionTools({ question, disabled, uploadingKey, uploadAttachment, updateQuestion, sectionIndex, questionIndex }) {
  const [showDrawing, setShowDrawing] = useState(false);
  const appendMath = (symbol) => updateQuestion(sectionIndex, questionIndex, {
    includemathematicalexpressions: "Yes",
    mathematicalexpression: `${question.mathematicalexpression || ""}${symbol}`
  });
  const handleDrop = (event, kind) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) uploadAttachment(file, kind, sectionIndex, questionIndex);
  };

  return (
    <Grid item xs={12}>
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#fff" }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Mathematical expression / formula"
              value={question.mathematicalexpression || ""}
              disabled={disabled}
              onChange={(e) => updateQuestion(sectionIndex, questionIndex, { mathematicalexpression: e.target.value, includemathematicalexpressions: e.target.value ? "Yes" : question.includemathematicalexpressions })}
              helperText="Use Unicode symbols or LaTeX style text; it will be shown with the question."
            />
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
              {mathSymbols.map((symbol) => <Button key={symbol} size="small" variant="outlined" disabled={disabled} onClick={() => appendMath(symbol)} sx={{ minWidth: 34 }}>{symbol}</Button>)}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <QuestionTableEditor value={question.tabledata || []} disabled={disabled} onChange={(tabledata) => updateQuestion(sectionIndex, questionIndex, { tabledata })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, "questionImage")}
              sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#f8fafc" }}
            >
              <Typography fontWeight={800}>Question photo</Typography>
              <Typography variant="body2" color="text.secondary">Drag and drop a photo here or upload through AWS.</Typography>
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled || uploadingKey === `questionImage-${sectionIndex}-${questionIndex}`} sx={{ mt: 1 }}>
                {uploadingKey === `questionImage-${sectionIndex}-${questionIndex}` ? "Uploading..." : "Upload Photo"}
                <input hidden type="file" accept="image/*" onChange={(e) => uploadAttachment(e.target.files?.[0], "questionImage", sectionIndex, questionIndex)} />
              </Button>
              {question.imageurl && <Box sx={{ mt: 1 }}><img src={question.imageurl} alt={question.imagefilename || "Question"} style={{ maxWidth: "100%", maxHeight: 160, objectFit: "contain" }} /></Box>}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, "questionAttachment")}
              sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#f8fafc" }}
            >
              <Typography fontWeight={800}>Question attachment</Typography>
              <Typography variant="body2" color="text.secondary">Upload image/PDF/Word through the existing AWS flow.</Typography>
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled || uploadingKey === `questionAttachment-${sectionIndex}-${questionIndex}`} sx={{ mt: 1 }}>
                {uploadingKey === `questionAttachment-${sectionIndex}-${questionIndex}` ? "Uploading..." : "Upload Attachment"}
                <input hidden type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => uploadAttachment(e.target.files?.[0], "questionAttachment", sectionIndex, questionIndex)} />
              </Button>
              {(question.attachments || []).map((item, index) => <Button key={`${item.url}-${index}`} size="small" href={item.url} target="_blank" rel="noreferrer" sx={{ display: "block", mx: "auto", mt: 0.5 }}>{item.title || item.filename || `Attachment ${index + 1}`}</Button>)}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography fontWeight={900}>Drawing canvas</Typography>
              <Button size="small" variant="outlined" disabled={disabled} onClick={() => setShowDrawing((prev) => !prev)}>{showDrawing ? "Hide Drawing" : "Open Drawing Tools"}</Button>
            </Stack>
            {showDrawing && <AdvancedDrawingPad value={question.drawingdataurl || ""} disabled={disabled} onChange={(drawingdataurl) => updateQuestion(sectionIndex, questionIndex, { drawingdataurl })} />}
            {!showDrawing && question.drawingdataurl && <Box sx={{ mt: 1 }}><img src={question.drawingdataurl} alt="Question drawing" style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", border: "1px solid #cbd5e1" }} /></Box>}
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}

export default function ConductExamSubmitQuestionPaperPage({ patternwise = false, mathematical = false, templatewise = false }) {
  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [paperDoc, setPaperDoc] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [ollamaConfigs, setOllamaConfigs] = useState([]);
  const [selectedPatternId, setSelectedPatternId] = useState("");
  const [patternRows, setPatternRows] = useState([]);
  const [translationLanguages, setTranslationLanguages] = useState([]);
  const [includeMathematicalExpressions, setIncludeMathematicalExpressions] = useState(mathematical ? "Yes" : "No");
  const [cos, setCos] = useState([]);
  const [filters, setFilters] = useState({ academicyear: "", examcode: "" });
  const [sections, setSections] = useState([]);
  const [paperAttachment, setPaperAttachment] = useState({ url: "", filename: "" });
  const [syllabusSource, setSyllabusSource] = useState({ url: "", filename: "" });
  const [sampleQuestionPaper, setSampleQuestionPaper] = useState({ url: "", filename: "" });
  const [paperDocuments, setPaperDocuments] = useState([]);
  const [supportDocTitle, setSupportDocTitle] = useState("");
  const [documentDialog, setDocumentDialog] = useState(null);
  const [syllabusDialog, setSyllabusDialog] = useState(null);
  const [paperTab, setPaperTab] = useState("Active");
  const [status, setStatus] = useState("Draft");
  const [generateForm, setGenerateForm] = useState(emptyGenerate);
  const [syllabusContext, setSyllabusContext] = useState({ complete: [], covered: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [formattingPreview, setFormattingPreview] = useState(false);
  const [clearingGenerated, setClearingGenerated] = useState(false);
  const [formattedPreviewHtml, setFormattedPreviewHtml] = useState("");
  const [printRules, setPrintRules] = useState("Use compact formal question paper layout. Keep section, group and subquestion exactly as per pattern.");
  const [institution, setInstitution] = useState(null);
  const [uploadingKey, setUploadingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPaper = useMemo(() => papers.find((row) => row._id === selectedPaperId) || null, [papers, selectedPaperId]);
  const selectedPattern = useMemo(() => patterns.find((row) => String(row._id) === String(selectedPatternId)) || null, [patterns, selectedPatternId]);
  const paperSubmitted = /^(InvigilatorSubmitted|Moderation In Progress|Moderation Submitted|Accepted)$/i.test(status || "");
  const isActivePaper = (row) => {
    const now = new Date();
    const start = row?.startdate ? new Date(row.startdate) : null;
    const end = row?.enddate ? new Date(row.enddate) : null;
    if (start && now < start) return false;
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (now > end) return false;
    }
    return true;
  };
  const tabPapers = useMemo(() => papers.filter((row) => {
    const submitted = /^(InvigilatorSubmitted|Moderation In Progress|Moderation Submitted|Accepted)$/i.test(row.status || "");
    if (paperTab === "Submitted") return submitted;
    if (submitted) return false;
    const now = new Date();
    const start = row.startdate ? new Date(row.startdate) : null;
    const end = row.enddate ? new Date(row.enddate) : null;
    if (paperTab === "Pending") return !!start && now < start;
    if (paperTab === "Past due") {
      if (!end) return false;
      end.setHours(23, 59, 59, 999);
      return now > end;
    }
    return isActivePaper(row);
  }), [papers, paperTab]);
  const filterOptions = useMemo(() => ({
    academicyear: uniq(papers.map((row) => row.academicyear)),
    examcode: uniq(papers.map((row) => row.examcode))
  }), [papers]);
  const coOptions = useMemo(() => cos.map((item) => ({
    conumber: item.conumber || "",
    co: item.co || "",
    label: `${item.conumber || "CO"} - ${item.co || ""}`
  })), [cos]);
  const moduleOptions = useMemo(() => uniq(syllabusContext.complete.map((row) => row.module)), [syllabusContext.complete]);
  const topicOptions = useMemo(() => {
    const selectedModules = generateForm.selectedModules || [];
    const rows = selectedModules.length ? syllabusContext.complete.filter((row) => selectedModules.includes(row.module)) : syllabusContext.complete;
    return uniq(rows.flatMap((row) => row.topics || []));
  }, [syllabusContext.complete, generateForm.selectedModules]);
  const coveredWorkOptions = useMemo(() => uniq(syllabusContext.coveredWorkCompleted || syllabusContext.covered.flatMap((row) => row.topics || [])), [syllabusContext]);

  const toggleAllValues = (selectedValues, allValues, currentValues) => {
    if (!selectedValues.includes(selectAllOption)) return selectedValues;
    const allSelected = allValues.length > 0 && currentValues.length === allValues.length;
    return allSelected ? [] : allValues;
  };

  const updateSelectedModules = (value) => {
    const nextModules = toggleAllValues(value, moduleOptions, generateForm.selectedModules || []);
    setGenerateForm((prev) => ({
      ...prev,
      selectedModules: nextModules,
      selectedTopics: []
    }));
  };

  const updateSelectedTopics = (value, allValues = topicOptions) => {
    const nextTopics = toggleAllValues(value, allValues, generateForm.selectedTopics || []);
    setGenerateForm((prev) => ({
      ...prev,
      selectedTopics: nextTopics
    }));
  };

  const loadPatterns = async (paper = selectedPaper) => {
    if (!paper) {
      setPatterns([]);
      return;
    }
    try {
      const res = await ep1.get("/api/v2/conductexam/question-patterns", {
        params: {
          colid: global1.colid,
          academicyear: paper.academicyear,
          programcode: paper.programcode,
          status: "Active"
        }
      });
      setPatterns(res.data?.data || []);
    } catch (err) {
      setPatterns([]);
    }
  };

  const loadPatternRows = async (patternid, pattern = selectedPattern) => {
    if (!patternid) {
      setPatternRows([]);
      return;
    }
    try {
      const res = await ep1.get("/api/v2/conductexam/question-pattern-details", {
        params: { colid: global1.colid, patternid, status: "Active" }
      });
      const rows = (res.data?.data || []).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      setPatternRows(rows);
      if (patternwise && rows.length) {
        setSections(rows.reduce((acc, row) => {
          const title = row.section || "Section";
          let section = acc.find((item) => item.title === title);
          if (!section) {
            section = { title, instructions: row.instructions || "", marks: 0, questions: [] };
            acc.push(section);
          }
          if (!(section.questions || []).some((question) => question.patternquestion === row.question && question.patterngroup === row.group && question.patternsubquestion === row.subquestion)) {
            section.questions.push({
              ...emptyQuestion,
              patternsection: row.section || "",
              patternquestion: row.question || "",
              questiontype: row.questiontype || "Descriptive",
              includemathematicalexpressions: row.includemathematicalexpressions || "No",
              patterngroup: row.group || "",
              patternsubquestion: row.subquestion || "",
              marks: row.marks || 0,
              questionprompt: row.questionprompt || "",
              question: ""
            });
          }
          section.marks = (section.questions || []).reduce((sum, question) => sum + Number(question.marks || 0), 0);
          return acc;
        }, []));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load pattern details.");
    }
  };

  const loadPapers = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid, papersetteremail: global1.user };
      Object.entries(nextFilters).forEach(([key, value]) => { if (value) params[key] = value; });
      const res = await ep1.get("/api/v2/conductexam/papersetter-assigned-papers", { params });
      setPapers(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load assigned papers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
    loadInstitution();
    loadOllamaConfigs();
  }, []);

  const loadInstitution = async () => {
    try {
      const res = await ep1.get("/vins", { params: { colid: global1.colid } });
      setInstitution(res.data || null);
    } catch (err) {
      setInstitution(null);
    }
  };

  const loadOllamaConfigs = async () => {
    try {
      const res = await ep1.get("/api/v2/ollama-configuration", { params: { colid: global1.colid } });
      setOllamaConfigs((res.data || []).filter((row) => String(row.active || "Yes").toLowerCase() === "yes"));
    } catch (err) {
      setOllamaConfigs([]);
    }
  };

  const loadQuestionPaper = async (paperId) => {
    if (!paperId) return;
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/conductexam/question-paper", { params: { colid: global1.colid, papersetterid: paperId } });
      const doc = res.data?.paper || null;
      setPaperDoc(doc);
      setCos(res.data?.cos || []);
      setSections(doc?.sections?.length ? doc.sections : [{ title: "Section A", instructions: "", marks: 0, questions: [] }]);
      setPaperAttachment({ url: doc?.paperattachmenturl || "", filename: doc?.paperattachmentfilename || "" });
      setSyllabusSource(doc?.syllabussourceurl ? { url: doc.syllabussourceurl, filename: doc.syllabussourcefilename || "" } : { url: "", filename: "" });
      setSampleQuestionPaper(doc?.samplequestionpaperurl ? { url: doc.samplequestionpaperurl, filename: doc.samplequestionpaperfilename || "" } : { url: "", filename: "" });
      setPaperDocuments(doc?.paperdocuments || []);
      setSelectedPatternId(doc?.patternid ? String(doc.patternid) : "");
      setPatternRows(doc?.patternrows || []);
      setTranslationLanguages(doc?.translationlanguages || []);
      setIncludeMathematicalExpressions(doc?.includemathematicalexpressions || (mathematical ? "Yes" : "No"));
      setStatus(doc?.status || "Draft");
      setGenerateForm({ ...emptyGenerate, additionalAiPrompt: doc?.additionalaiprompt || "" });
      const setter = res.data?.setter || {};
      const contextRes = await ep1.get("/api/v2/conductexam/question-paper-syllabus-context", {
        params: {
          colid: global1.colid,
          academicyear: setter.academicyear,
          regulation: setter.regulation,
          program: setter.program,
          programcode: setter.programcode,
          type: setter.type,
          subject: setter.subject,
          semester: setter.semester,
          course: setter.course,
          coursecode: setter.coursecode,
          papersetteremail: global1.user
        }
      });
      const nextContext = {
        complete: contextRes.data?.complete || [],
        covered: contextRes.data?.covered || [],
        coveredWorkCompleted: contextRes.data?.coveredWorkCompleted || [],
        completeRows: contextRes.data?.completeRows || []
      };
      setSyllabusContext(nextContext);
      if (patternwise) {
        await loadPatterns(setter);
        if (doc?.patternid) await loadPatternRows(doc.patternid);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load question paper.");
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (index, patch) => setSections((prev) => prev.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section));
  const addSection = () => setSections((prev) => [...prev, { title: `Section ${String.fromCharCode(65 + prev.length)}`, instructions: "", marks: 0, questions: [] }]);
  const deleteSection = (index) => setSections((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  const addQuestion = (sectionIndex, question = emptyQuestion) => setSections((prev) => prev.map((section, itemIndex) => itemIndex === sectionIndex ? { ...section, questions: [...(section.questions || []), { ...emptyQuestion, ...question }] } : section));
  const updateQuestion = (sectionIndex, questionIndex, patch) => setSections((prev) => prev.map((section, itemIndex) => {
    if (itemIndex !== sectionIndex) return section;
    return { ...section, questions: (section.questions || []).map((question, qIndex) => qIndex === questionIndex ? { ...question, ...patch } : question) };
  }));
  const deleteQuestion = (sectionIndex, questionIndex) => setSections((prev) => prev.map((section, itemIndex) => itemIndex === sectionIndex ? { ...section, questions: (section.questions || []).filter((_, qIndex) => qIndex !== questionIndex) } : section));

  const uploadAttachment = async (file, kind, sectionIndex, questionIndex, blockIndex = null) => {
    if (!file) return;
    try {
      setUploadingKey(`${kind}-${sectionIndex}-${questionIndex}${blockIndex !== null ? `-${blockIndex}` : ""}`);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("colid", global1.colid);
      const res = await ep1.post("/api/v2/conductexam/question-paper-upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const data = res.data?.data || {};
      if (kind === "paper") setPaperAttachment({ url: data.url || "", filename: data.filename || file.name });
      else if (kind === "syllabusSource") setSyllabusSource({ url: data.url || "", filename: data.filename || file.name });
      else if (kind === "sampleQuestionPaper") setSampleQuestionPaper({ url: data.url || "", filename: data.filename || file.name });
      else if (kind === "support") setPaperDocuments((prev) => [...prev, { title: supportDocTitle || file.name, filename: data.filename || file.name, url: data.url || "", uploadedby: global1.user, uploadeddate: new Date().toISOString() }]);
      else if (kind === "questionImage") updateQuestion(sectionIndex, questionIndex, { imageurl: data.url || "", imagefilename: data.filename || file.name });
      else if (kind === "questionAttachment") {
        const current = sections[sectionIndex]?.questions?.[questionIndex]?.attachments || [];
        updateQuestion(sectionIndex, questionIndex, {
          attachmenturl: data.url || "",
          attachmentfilename: data.filename || file.name,
          attachments: [...current, { title: file.name, filename: data.filename || file.name, url: data.url || "", type: file.type || "" }]
        });
      }
      else if (kind === "questionBlockImage" || kind === "questionBlockAttachment") {
        const question = sections[sectionIndex]?.questions?.[questionIndex] || {};
        const blocks = Array.isArray(question.contentblocks) ? question.contentblocks : [];
        const nextBlocks = blocks.map((block, itemIndex) => itemIndex === blockIndex ? {
          ...block,
          url: data.url || "",
          filename: data.filename || file.name,
          title: block.title || file.name
        } : block);
        updateQuestion(sectionIndex, questionIndex, { contentblocks: nextBlocks });
      }
      else updateQuestion(sectionIndex, questionIndex, { attachmenturl: data.url || "", attachmentfilename: data.filename || file.name });
      setSupportDocTitle("");
      setMessage("Attachment uploaded.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload attachment.");
    } finally {
      setUploadingKey("");
    }
  };

  const uploadGeneratedHtmlPaper = async (html) => {
    const filename = `${selectedPaper?.coursecode || "question-paper"}-${Date.now()}.html`;
    const blob = new Blob([html], { type: "text/html" });
    const file = new File([blob], filename, { type: "text/html" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("colid", global1.colid);
    const res = await ep1.post("/api/v2/conductexam/question-paper-upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    const data = res.data?.data || {};
    setPaperAttachment({ url: data.url || "", filename: data.filename || filename });
    return data;
  };

  const getSelectedSyllabusDetails = () => {
    const modules = generateForm.selectedModules || [];
    const topics = generateForm.selectedTopics || [];
    const rows = syllabusContext.completeRows?.length ? syllabusContext.completeRows : syllabusContext.complete;
    return (rows || []).filter((row) => {
      const rowModule = String(row.module || "").trim();
      const rowText = [row.syllabus, row.topic, row.topics, row.description, row.content].flatMap((value) => Array.isArray(value) ? value : [value]).map((value) => String(value || "")).join(" | ");
      const moduleOk = !modules.length || modules.includes(rowModule);
      const topicOk = !topics.length || topics.some((topic) => rowText.includes(topic));
      return moduleOk && topicOk;
    }).map((row) => ({
      module: row.module || "",
      topic: row.topic || "",
      topics: row.topics || [],
      syllabus: row.syllabus || row.description || row.content || "",
      unit: row.unit || "",
      hours: row.hours || row.noofhours || ""
    })).slice(0, 80);
  };

  const clearGeneratedQuestions = async () => {
    if (!selectedPaper) {
      setError("Select an assigned paper.");
      return;
    }
    if (paperSubmitted) {
      setError("Question paper is already submitted for moderation and cannot be edited.");
      return;
    }
    try {
      setClearingGenerated(true);
      setError("");
      setMessage("");
      const blankSections = [{ title: "Section A", instructions: "", marks: 0, questions: [] }];
      await ep1.post("/api/v2/conductexam/question-paper", {
        colid: global1.colid,
        user: global1.user,
        papersetterid: selectedPaper._id,
        component: selectedPaper.component || paperDoc?.component || "",
        status: "Draft",
        paperattachmenturl: "",
        paperattachmentfilename: "",
        syllabussourceurl: syllabusSource.url,
        syllabussourcefilename: syllabusSource.filename,
        samplequestionpaperurl: sampleQuestionPaper.url,
        samplequestionpaperfilename: sampleQuestionPaper.filename,
        additionalaiprompt: generateForm.additionalAiPrompt,
        paperdocuments: paperDocuments,
        patternid: selectedPatternId,
        pattern: selectedPattern?.pattern || paperDoc?.pattern || "",
        patterndescription: selectedPattern?.description || paperDoc?.patterndescription || "",
        includemathematicalexpressions: includeMathematicalExpressions,
        patternrows: patternRows,
        translationlanguages: translationLanguages,
        sections: blankSections
      });
      setSections(blankSections);
      setFormattedPreviewHtml("");
      setPaperAttachment({ url: "", filename: "" });
      setStatus("Draft");
      setMessage("Previously generated questions cleared. You can generate a fresh paper now.");
      await loadQuestionPaper(selectedPaper._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to clear generated questions.");
    } finally {
      setClearingGenerated(false);
    }
  };

  const saveQuestionPaper = async () => {
    if (!selectedPaper) {
      setError("Select an assigned paper.");
      return;
    }
    if (paperSubmitted) {
      setError("Question paper is already submitted for moderation and cannot be edited.");
      return;
    }
    if (!isActivePaper(selectedPaper)) {
      setError("Question paper submission is not active for this date range.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await ep1.post("/api/v2/conductexam/question-paper", {
        colid: global1.colid,
        user: global1.user,
        papersetterid: selectedPaper._id,
        component: selectedPaper.component || paperDoc?.component || "",
        status,
        paperattachmenturl: paperAttachment.url,
        paperattachmentfilename: paperAttachment.filename,
        syllabussourceurl: syllabusSource.url,
        syllabussourcefilename: syllabusSource.filename,
        samplequestionpaperurl: sampleQuestionPaper.url,
        samplequestionpaperfilename: sampleQuestionPaper.filename,
        additionalaiprompt: generateForm.additionalAiPrompt,
        paperdocuments: paperDocuments,
        patternid: selectedPatternId,
        pattern: selectedPattern?.pattern || paperDoc?.pattern || "",
        patterndescription: selectedPattern?.description || paperDoc?.patterndescription || "",
        includemathematicalexpressions: includeMathematicalExpressions,
        patternrows: patternRows,
        translationlanguages: translationLanguages,
        sections
      });
      setMessage("Question paper saved.");
      await loadQuestionPaper(selectedPaper._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save question paper.");
    } finally {
      setSaving(false);
    }
  };

  const submitQuestionPaper = async () => {
    if (!selectedPaper) {
      setError("Select an assigned paper.");
      return;
    }
    if (!isActivePaper(selectedPaper)) {
      setError("Question paper submission is not active for this date range.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/conductexam/question-paper-submit", {
        colid: global1.colid,
        user: global1.user,
        papersetterid: selectedPaper._id
      });
      setPaperDoc(res.data?.data || null);
      setStatus(res.data?.data?.status || "InvigilatorSubmitted");
      setMessage("Question paper submitted for moderation.");
      await loadPapers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit question paper.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateQuestions = async () => {
    if (!selectedPaper) return setError("Select an assigned paper.");
    if (paperSubmitted) return setError("Question paper is already submitted for moderation and cannot be edited.");
    if (patternwise && !selectedPatternId) return setError("Select a question paper pattern.");
    if (patternwise && !patternRows.length) return setError("Selected question paper pattern does not have details.");
    if (templatewise && !sampleQuestionPaper.url) return setError("Upload or enter the sample question paper format first.");
    if (templatewise && !syllabusSource.url) return setError("Upload or enter the syllabus/source file first.");
    if (!generateForm.selectedModules?.length && !generateForm.selectedTopics?.length && !syllabusSource.url && !sampleQuestionPaper.url) {
      return setError(`Select at least one module or topic from ${generateForm.syllabusMode}, or upload a syllabus/sample paper.`);
    }
    try {
      setGenerating(true);
      setError("");
      const co = coOptions.find((item) => item.conumber === generateForm.conumber);
      const res = await ep1.post("/api/v2/conductexam/question-paper-generate", {
        colid: global1.colid,
        ...selectedPaper,
        ...generateForm,
        count: patternwise ? patternRows.length : generateForm.count,
        pattern: selectedPattern?.pattern || "",
        patterndescription: selectedPattern?.description || "",
        patternRows: patternwise ? patternRows : [],
        includeMathematicalExpressions,
        aiProvider: generateForm.aiProvider,
        openaiModel: generateForm.openaiModel,
        claudeModel: generateForm.claudeModel,
        ollamaConfigId: generateForm.ollamaConfigId,
        syllabusSourceUrl: syllabusSource.url,
        syllabusSourceFilename: syllabusSource.filename,
        sampleQuestionPaperUrl: sampleQuestionPaper.url,
        sampleQuestionPaperFilename: sampleQuestionPaper.filename,
        additionalAiPrompt: generateForm.additionalAiPrompt,
        selectedSyllabusDetails: getSelectedSyllabusDetails(),
        templatewise: templatewise ? "Yes" : "No",
        cos: coOptions
      });
      if (templatewise && Array.isArray(res.data?.sections) && res.data.sections.length) {
        const nextSections = res.data.sections.map((section) => ({
          title: section.title || "Section",
          instructions: section.instructions || "",
          marks: Number(section.marks || 0),
          questions: Array.isArray(section.questions) ? section.questions.map((question) => ({
            ...emptyQuestion,
            ...question,
            bloomlevels: Array.isArray(question.bloomlevels) ? question.bloomlevels : generateForm.bloomlevels,
            includemathematicalexpressions: question.includemathematicalexpressions || includeMathematicalExpressions
          })) : []
        }));
        setSections(nextSections);
        setFormattedPreviewHtml(res.data?.html || "");
        const html = buildPatternPrintHtml(res.data?.html || defaultPatternBodyHtml(nextSections), nextSections);
        const uploaded = await uploadGeneratedHtmlPaper(html);
        await ep1.post("/api/v2/conductexam/question-paper", {
          colid: global1.colid,
          user: global1.user,
          papersetterid: selectedPaper._id,
          component: selectedPaper.component || paperDoc?.component || "",
          status,
          paperattachmenturl: uploaded.url || "",
          paperattachmentfilename: uploaded.filename || "",
          syllabussourceurl: syllabusSource.url,
          syllabussourcefilename: syllabusSource.filename,
          samplequestionpaperurl: sampleQuestionPaper.url,
          samplequestionpaperfilename: sampleQuestionPaper.filename,
          additionalaiprompt: generateForm.additionalAiPrompt,
          paperdocuments: paperDocuments,
          includemathematicalexpressions: includeMathematicalExpressions,
          translationlanguages: translationLanguages,
          sections: nextSections
        });
        await loadQuestionPaper(selectedPaper._id);
        setMessage(`Templatewise paper generated, displayed and uploaded as ${uploaded.filename || "HTML file"}.`);
        return;
      }
      const questions = (res.data?.data || []).map((item) => ({
        ...emptyQuestion,
        ...item,
        conumber: item.conumber || co?.conumber || "",
        co: item.co || co?.co || "",
        bloomlevels: Array.isArray(item.bloomlevels) ? item.bloomlevels : generateForm.bloomlevels
      }));
      if (patternwise) {
        const byKey = new Map(questions.map((question) => [
          `${question.patternsection || ""}|${question.patternquestion || ""}|${question.patterngroup || ""}|${question.patternsubquestion || ""}`,
          question
        ]));
        const nextSections = patternRows.reduce((acc, row) => {
          const title = row.section || "Section";
          let section = acc.find((item) => item.title === title);
          if (!section) {
            section = { title, instructions: row.instructions || "", marks: 0, questions: [] };
            acc.push(section);
          }
          const generated = byKey.get(`${row.section || ""}|${row.question || ""}|${row.group || ""}|${row.subquestion || ""}`) || questions.shift() || {};
          section.questions.push({
            ...emptyQuestion,
            ...generated,
            patternsection: row.section || "",
            patternquestion: row.question || "",
            questiontype: generated.questiontype || row.questiontype || "Descriptive",
            includemathematicalexpressions: generated.includemathematicalexpressions || row.includemathematicalexpressions || "No",
            patterngroup: row.group || "",
            patternsubquestion: row.subquestion || "",
            marks: generated.marks || row.marks || 0,
            questionprompt: row.questionprompt || ""
          });
          section.marks = (section.questions || []).reduce((sum, question) => sum + Number(question.marks || 0), 0);
          return acc;
        }, []);
        setSections(nextSections);
      } else {
        setSections((prev) => prev.map((section, index) => index === Number(generateForm.sectionIndex) ? { ...section, questions: [...(section.questions || []), ...questions] } : section));
      }
      setMessage(`${questions.length} questions generated.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate questions.");
    } finally {
      setGenerating(false);
    }
  };

  const buildPatternPrintHtml = (bodyHtml, sectionSource = sections, options = {}) => {
    const { includeToolbar = true } = options;
    const insName = institution?.institutionname || global1.insname || "Institution";
    const address = institution?.address || "";
    const logo = institution?.logolink || global1.logo || "";
    const header = `
      <div style="text-align:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:12px;">
        ${logo ? `<img src="${esc(logo)}" style="max-height:64px;max-width:90px;object-fit:contain;margin-bottom:4px;" />` : ""}
        <div style="font-size:18px;font-weight:800;text-transform:uppercase;">${esc(insName)}</div>
        <div style="font-size:11px;">${esc(address)}</div>
        <div style="font-size:15px;font-weight:800;margin-top:8px;text-transform:uppercase;">Question Paper</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
        <tbody>
          <tr><td style="border:1px solid #999;padding:5px;font-weight:700;">Exam</td><td style="border:1px solid #999;padding:5px;">${esc(selectedPaper?.exam)} (${esc(selectedPaper?.examcode)})</td><td style="border:1px solid #999;padding:5px;font-weight:700;">Academic Year</td><td style="border:1px solid #999;padding:5px;">${esc(selectedPaper?.academicyear)}</td></tr>
          <tr><td style="border:1px solid #999;padding:5px;font-weight:700;">Program</td><td style="border:1px solid #999;padding:5px;">${esc(selectedPaper?.program)} (${esc(selectedPaper?.programcode)})</td><td style="border:1px solid #999;padding:5px;font-weight:700;">Semester</td><td style="border:1px solid #999;padding:5px;">${esc(selectedPaper?.semester)}</td></tr>
          <tr><td style="border:1px solid #999;padding:5px;font-weight:700;">Course</td><td style="border:1px solid #999;padding:5px;">${esc(selectedPaper?.course)} (${esc(selectedPaper?.coursecode)})</td><td style="border:1px solid #999;padding:5px;font-weight:700;">Component</td><td style="border:1px solid #999;padding:5px;">${esc(selectedPaper?.component || paperDoc?.component || "-")}</td></tr>
          <tr><td style="border:1px solid #999;padding:5px;font-weight:700;">Pattern</td><td style="border:1px solid #999;padding:5px;" colspan="3">${esc(selectedPattern?.pattern || paperDoc?.pattern)}</td></tr>
        </tbody>
      </table>`;
    const hasMath = includeMathematicalExpressions === "Yes" || sectionSource.some((section) => (section.questions || []).some((question) => question.includemathematicalexpressions === "Yes" || (question.contentblocks || []).some((block) => block.blocktype === "math")));
    const mathScripts = hasMath ? `<script>
      window.MathJax = { tex: { inlineMath: [['\\\\(','\\\\)'], ['$', '$']], displayMath: [['\\\\[','\\\\]']] }, svg: { fontCache: 'global' } };
    </script><script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>` : "";
    const toolbar = includeToolbar ? `<div class="toolbar"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>` : "";
    return `<!doctype html><html><head><meta charset="utf-8" /><title>Question Paper Preview</title>${mathScripts}<style>
      @page{size:A4 portrait;margin:12mm}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111}.toolbar{position:sticky;top:0;background:#111827;color:#fff;padding:8px;text-align:right;z-index:10}.toolbar button{margin-left:8px;padding:7px 12px}.sheet{width:186mm;min-height:273mm;margin:0 auto;background:#fff;padding:10mm;box-sizing:border-box;border:1px solid #111}.question{break-inside:avoid;margin-bottom:10px;font-size:12px;line-height:1.45}.qline{display:grid;grid-template-columns:34px 1fr 50px;gap:8px}.section{font-weight:800;text-transform:uppercase;border-bottom:1px solid #111;margin:14px 0 8px;padding-bottom:4px}.translation{margin:5px 0 0 42px;font-size:11px;color:#111}.group{font-weight:700;margin-right:4px}.math-block{font-family:"Cambria Math","Times New Roman",serif;white-space:pre-wrap;margin-top:6px}.question-table{width:100%;margin-top:8px;border-collapse:collapse}.question-table td{border:1px solid #333;padding:5px;min-height:18px}.question-media{margin-top:8px}.question-media img{max-width:100%;max-height:260px;object-fit:contain}.question-attachment{margin-top:6px;font-size:11px}table{border-collapse:collapse}td,th{vertical-align:top}.math,.MathJax{font-size:inherit!important}@media print{body{background:#fff}.toolbar{display:none}.sheet{border:0;margin:0;width:auto;min-height:0;padding:0}}
    </style></head><body>${toolbar}<div class="sheet">${header}${bodyHtml}</div></body></html>`;
  };

  const defaultPatternBodyHtml = (sectionSource = sections) => sectionSource.map((section) => `
    <div class="section">${esc(section.title)}${section.instructions ? ` - ${esc(section.instructions)}` : ""}</div>
    ${(section.questions || []).map((question, index) => {
      const number = [question.patternquestion || `Q${index + 1}`, question.patterngroup, question.patternsubquestion].filter(Boolean).join(" / ");
      const translations = (question.translations || []).map((translation) => `<div class="translation"><b>${esc(translation.language)}:</b> ${esc(translation.question)}</div>`).join("");
      return `<div class="question"><div class="qline"><div><b>${esc(number)}</b></div><div>${richQuestionHtml(question)}</div><div style="text-align:right;">${question.marks ? `${esc(question.marks)} marks` : ""}</div></div>${translations}</div>`;
    }).join("")}
  `).join("");

  const openPrintWindow = (html) => {
    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) {
      setError("Popup blocked. Please allow popups to open print preview.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const printPatternPreview = () => {
    if (!selectedPaper || !sections.length) return setError("Select paper and add questions before print preview.");
    openPrintWindow(buildPatternPrintHtml(defaultPatternBodyHtml()));
  };

  const formatPatternPreview = async () => {
    if (!selectedPaper || !sections.length) return setError("Select paper and add questions before AI formatting.");
    try {
      setFormattingPreview(true);
      setError("");
      const res = await ep1.post("/api/v2/conductexam/question-paper-pattern-format", {
        colid: global1.colid,
        aiProvider: generateForm.aiProvider,
        geminiModel: generateForm.geminiModel,
        openaiModel: generateForm.openaiModel,
        claudeModel: generateForm.claudeModel,
        ollamaConfigId: generateForm.ollamaConfigId,
        rules: printRules,
        selectedPaper,
        pattern: selectedPattern || { pattern: paperDoc?.pattern, description: paperDoc?.patterndescription },
        patternRows,
        sections,
        translationlanguages: translationLanguages,
        includemathematicalexpressions: includeMathematicalExpressions,
        sampleQuestionPaperUrl: sampleQuestionPaper.url,
        sampleQuestionPaperFilename: sampleQuestionPaper.filename,
        additionalAiPrompt: generateForm.additionalAiPrompt
      });
      setFormattedPreviewHtml(res.data?.html || "");
      setMessage("AI formatted print preview is ready.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to format print preview with AI.");
    } finally {
      setFormattingPreview(false);
    }
  };

  const printFormattedPreview = () => {
    if (!formattedPreviewHtml) return setError("Create AI formatted preview first.");
    openPrintWindow(buildPatternPrintHtml(formattedPreviewHtml));
  };

  const downloadHtmlPaper = () => {
    if (!sections.length) {
      setError("Generate or add questions before downloading HTML file.");
      return;
    }
    const html = buildPatternPrintHtml(formattedPreviewHtml || defaultPatternBodyHtml());
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedPaper?.coursecode || "question-paper"}-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const translatePaper = async () => {
    if (!selectedPaper) return setError("Select an assigned paper.");
    if (!translationLanguages.length) return setError("Select one or more translation languages.");
    if (paperSubmitted) return setError("Question paper is already submitted for moderation and cannot be edited.");
    try {
      setTranslating(true);
      setError("");
      const res = await ep1.post("/api/v2/conductexam/question-paper-translate", {
        colid: global1.colid,
        geminiModel: generateForm.geminiModel,
        languages: translationLanguages,
        sections
      });
      setSections(res.data?.data || sections);
      setMessage("Translations generated. Review and save the question paper.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to translate question paper.");
    } finally {
      setTranslating(false);
    }
  };

  const analyzeMapping = async () => {
    if (!selectedPaper) return setError("Select an assigned paper.");
    if (paperSubmitted) return setError("Question paper is already submitted for moderation and cannot be edited.");
    try {
      setMapping(true);
      setError("");
      const res = await ep1.post("/api/v2/conductexam/question-paper-ai-map", {
        colid: global1.colid,
        geminiModel: generateForm.geminiModel,
        cos: coOptions,
        sections
      });
      setSections(res.data?.data || sections);
      setMessage("AI mapping completed. Review and save the question paper.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to analyze CO/Bloom mapping.");
    } finally {
      setMapping(false);
    }
  };

  const paperColumns = [
    { field: "academicyear", headerName: "Year", width: 120 },
    { field: "exam", headerName: "Exam", minWidth: 180, flex: 1 },
    { field: "examcode", headerName: "Exam Code", width: 140 },
    { field: "program", headerName: "Program", width: 160 },
    { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "component", headerName: "Component", width: 150 },
    { field: "startdate", headerName: "Start Date", width: 130, valueGetter: (params) => params.row.startdate ? String(params.row.startdate).slice(0, 10) : "" },
    { field: "enddate", headerName: "End Date", width: 130, valueGetter: (params) => params.row.enddate ? String(params.row.enddate).slice(0, 10) : "" },
    { field: "syllabus", headerName: "Syllabus", width: 110, sortable: false, renderCell: (params) => <Button size="small" onClick={(event) => { event.stopPropagation(); setSyllabusDialog(params.row); }}>View</Button> },
    { field: "documents", headerName: "Documents", width: 120, sortable: false, renderCell: (params) => <Button size="small" onClick={(event) => { event.stopPropagation(); setDocumentDialog(params.row); }}>Documents</Button> },
    { field: "status", headerName: "Status", width: 120 }
  ];

  return (
    <MenuPageShell title={templatewise ? "Submit Templatewise Paper" : mathematical ? "Submit Mathematical Pattern" : patternwise ? "Submit Questions Patternwise" : "Submit Question Paper"}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>{templatewise ? "Submit Templatewise Paper" : mathematical ? "Submit Mathematical Pattern" : patternwise ? "Submit Questions Patternwise" : "Submit Question Paper"}</Typography>
              <Typography color="text.secondary">{templatewise ? "Upload syllabus and a sample paper, generate AI questions in the same format, review, print and submit." : mathematical ? "Create patternwise papers with mathematical questions and properly rendered symbols." : patternwise ? "Select a question paper pattern, generate questions as per pattern, translate if required, and submit." : "Select an assigned paper, create sections and questions, upload attachments, and save."}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={!selectedPaper || paperSubmitted || !isActivePaper(selectedPaper) || uploadingKey === "paper-0-0"}>
                {uploadingKey === "paper-0-0" ? "Uploading..." : "Upload Full Paper"}
                <input hidden type="file" onChange={(e) => uploadAttachment(e.target.files?.[0], "paper", 0, 0)} />
              </Button>
              <Button variant="outlined" startIcon={<PrintIcon />} disabled={!selectedPaper || !sections.length} onClick={printPatternPreview}>Print Preview</Button>
              {(patternwise || templatewise) && <Button variant="outlined" color="secondary" disabled={!formattedPreviewHtml} onClick={printFormattedPreview}>Final Print Preview</Button>}
              {templatewise && <Button variant="outlined" color="error" disabled={!selectedPaper || paperSubmitted || clearingGenerated || !sections.some((section) => (section.questions || []).length)} onClick={clearGeneratedQuestions}>{clearingGenerated ? "Clearing..." : "Delete Generated"}</Button>}
              <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={saving || !selectedPaper || paperSubmitted || !isActivePaper(selectedPaper)} onClick={saveQuestionPaper}>{saving ? "Saving..." : "Save Paper"}</Button>
              <Button variant="contained" color="success" startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <FactCheckIcon />} disabled={submitting || saving || !selectedPaper || paperSubmitted || !isActivePaper(selectedPaper)} onClick={submitQuestionPaper}>{submitting ? "Submitting..." : "Submit Paper"}</Button>
            </Stack>
          </Stack>
          {(loading || saving || submitting || generating || mapping || translating || formattingPreview || clearingGenerated) && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {selectedPaper && paperSubmitted && <Alert severity="info" sx={{ mb: 2 }}>This question paper has been submitted for moderation and is now read-only.</Alert>}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}><TextField select fullWidth label="Academic Year" value={filters.academicyear} onChange={(e) => setFilters({ ...filters, academicyear: e.target.value })}><MenuItem value="">All</MenuItem>{filterOptions.academicyear.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Exam" value={filters.examcode} onChange={(e) => setFilters({ ...filters, examcode: e.target.value })}><MenuItem value="">All</MenuItem>{filterOptions.examcode.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={loading} onClick={() => loadPapers()} sx={{ height: 56 }}>{loading ? "Loading..." : "Load Papers"}</Button></Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Assigned Paper" value={selectedPaperId} onChange={(e) => { setSelectedPaperId(e.target.value); loadQuestionPaper(e.target.value); }}><MenuItem value="">Select</MenuItem>{papers.map((item) => <MenuItem key={item._id} value={item._id}>{paperLabel(item)}</MenuItem>)}</TextField></Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Tabs value={paperTab} onChange={(event, value) => setPaperTab(value)} sx={{ mb: 1 }}>
            {["Active", "Pending", "Past due", "Submitted"].map((tab) => <Tab key={tab} value={tab} label={tab} />)}
          </Tabs>
          <Box sx={{ height: 520 }}>
            <DataGrid rows={tabPapers} getRowId={(row) => row._id} columns={paperColumns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} onRowClick={(params) => { setSelectedPaperId(params.row._id); loadQuestionPaper(params.row._id); }} pageSizeOptions={[10, 25, 50]} />
          </Box>
        </Paper>

        {selectedPaper && (
          <>
            <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Grid container spacing={1.5}>
                {[
                  ["Paper", paperLabel(selectedPaper)],
                  ["Exam", `${selectedPaper.exam} (${selectedPaper.examcode})`],
                  ["Program", `${selectedPaper.program} (${selectedPaper.programcode})`],
                  ["Subject", selectedPaper.subject],
                  ["Semester", selectedPaper.semester],
                  ["Component", selectedPaper.component || paperDoc?.component],
                  ["Paper Setter", `${selectedPaper.papersettername} (${selectedPaper.papersetteremail})`],
                  ...(patternwise ? [["Pattern", selectedPattern?.pattern || paperDoc?.pattern || "-"]] : [])
                ].map(([label, value]) => <Grid item xs={12} md={4} key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={800}>{value || "-"}</Typography></Grid>)}
                {patternwise && <Grid item xs={12} md={4}><Autocomplete options={patterns} value={selectedPattern} getOptionLabel={(row) => row ? `${row.pattern || ""} - ${row.description || ""}` : ""} onChange={(_, value) => { setSelectedPatternId(value?._id || ""); loadPatternRows(value?._id || "", value); }} renderInput={(params) => <TextField {...params} label="Question Paper Pattern" />} /></Grid>}
                {(patternwise || templatewise) && <Grid item xs={12} md={5}><Autocomplete multiple disableCloseOnSelect options={languages.filter((item) => item !== "English")} value={translationLanguages} onChange={(_, value) => setTranslationLanguages(value)} renderOption={renderCheckboxOption} renderInput={(params) => <TextField {...params} label="Translate Languages" />} /></Grid>}
                {(patternwise || templatewise) && <Grid item xs={12} md={3}><Button fullWidth variant="outlined" color="secondary" disabled={paperSubmitted || translating || !translationLanguages.length} onClick={translatePaper} sx={{ height: 56 }}>{translating ? "Translating..." : "Translate Paper"}</Button></Grid>}
                {patternwise && !!patternRows.length && <Grid item xs={12}><Alert severity="info">{patternRows.length} question format row(s) loaded. AI generation will create exactly these rows, using the question type, marks, group, subquestion and math settings from the format.</Alert></Grid>}
                <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Submission Window</Typography><Typography fontWeight={800}>{selectedPaper.startdate ? String(selectedPaper.startdate).slice(0, 10) : "-"} to {selectedPaper.enddate ? String(selectedPaper.enddate).slice(0, 10) : "-"}</Typography></Grid>
                <Grid item xs={12} md={3}><TextField select fullWidth label="Status" value={status} disabled={paperSubmitted} onChange={(e) => setStatus(e.target.value)}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Submitted">Submitted</MenuItem><MenuItem value="InvigilatorSubmitted">InvigilatorSubmitted</MenuItem><MenuItem value="Moderation In Progress">Moderation In Progress</MenuItem><MenuItem value="Moderation Submitted">Moderation Submitted</MenuItem><MenuItem value="Accepted">Accepted</MenuItem></TextField></Grid>
                <Grid item xs={12} md={9}><TextField fullWidth label="Full question paper attachment link" value={paperAttachment.url} disabled={paperSubmitted} onChange={(e) => setPaperAttachment({ ...paperAttachment, url: e.target.value })} /></Grid>
                {paperAttachment.url && <Grid item xs={12} md={3}><Button fullWidth variant="outlined" href={paperAttachment.url} target="_blank" rel="noreferrer" sx={{ height: 56 }}>Download Paper</Button></Grid>}
                {templatewise && <Grid item xs={12} md={7}><TextField fullWidth label="Sample question paper/template link" value={sampleQuestionPaper.url} disabled={paperSubmitted} onChange={(e) => setSampleQuestionPaper({ ...sampleQuestionPaper, url: e.target.value })} /></Grid>}
                {templatewise && <Grid item xs={12} md={3}><Button fullWidth component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={paperSubmitted || uploadingKey === "sampleQuestionPaper-0-0"} sx={{ height: 56 }}>{uploadingKey === "sampleQuestionPaper-0-0" ? "Uploading..." : "Upload Sample Paper"}<input hidden type="file" accept=".pdf,.doc,.docx" onChange={(e) => uploadAttachment(e.target.files?.[0], "sampleQuestionPaper", 0, 0)} /></Button></Grid>}
                {templatewise && sampleQuestionPaper.url && <Grid item xs={12} md={2}><Button fullWidth variant="outlined" href={sampleQuestionPaper.url} target="_blank" rel="noreferrer" sx={{ height: 56 }}>View Sample</Button></Grid>}
                <Grid item xs={12} md={4}><TextField fullWidth label="Supporting Document Title" value={supportDocTitle} disabled={paperSubmitted} onChange={(e) => setSupportDocTitle(e.target.value)} /></Grid>
                <Grid item xs={12} md={3}><Button fullWidth component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={paperSubmitted || uploadingKey === "support-0-0"} sx={{ height: 56 }}>{uploadingKey === "support-0-0" ? "Uploading..." : "Upload Supporting Document"}<input hidden type="file" onChange={(e) => uploadAttachment(e.target.files?.[0], "support", 0, 0)} /></Button></Grid>
                <Grid item xs={12} md={5}><Stack direction="row" spacing={1} flexWrap="wrap">{paperDocuments.map((doc, index) => <Button key={`${doc.url}-${index}`} size="small" href={doc.url} target="_blank" rel="noreferrer">{doc.title || doc.filename || `Document ${index + 1}`}</Button>)}</Stack></Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2, ...(paperSubmitted ? { pointerEvents: "none", opacity: 0.72 } : {}) }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>AI Question Generation and Mapping</Typography>
              <Grid container spacing={2}>
                {!templatewise && <Grid item xs={12} md={2}><TextField select fullWidth label="Section" value={generateForm.sectionIndex} onChange={(e) => setGenerateForm({ ...generateForm, sectionIndex: e.target.value })}>{sections.map((section, index) => <MenuItem key={index} value={index}>{section.title || `Section ${index + 1}`}</MenuItem>)}</TextField></Grid>}
                {!(patternwise || templatewise) && <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="No. of Questions" value={generateForm.count} onChange={(e) => setGenerateForm({ ...generateForm, count: e.target.value })} /></Grid>}
                {!(patternwise || templatewise) && <Grid item xs={12} md={2}><TextField select fullWidth label="Question Type" value={generateForm.questiontype} onChange={(e) => setGenerateForm({ ...generateForm, questiontype: e.target.value })}>{questionTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>}
                {!templatewise && <Grid item xs={12} md={1.5}><TextField select fullWidth label="Difficulty" value={generateForm.difficultylevel} onChange={(e) => setGenerateForm({ ...generateForm, difficultylevel: e.target.value })}>{difficulties.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>}
                {!templatewise && <Grid item xs={12} md={2}><TextField select fullWidth label="Language" value={generateForm.language} onChange={(e) => setGenerateForm({ ...generateForm, language: e.target.value })}>{languages.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>}
                <Grid item xs={12} md={2}><TextField select fullWidth label="AI Provider" value={generateForm.aiProvider} onChange={(e) => setGenerateForm({ ...generateForm, aiProvider: e.target.value })}>{aiProviders.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                {generateForm.aiProvider === "Gemini" && <Grid item xs={12} md={2}><TextField select fullWidth label="Gemini Model" value={generateForm.geminiModel} onChange={(e) => setGenerateForm({ ...generateForm, geminiModel: e.target.value })}>{geminiModels.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>}
                {generateForm.aiProvider === "OpenAI" && <Grid item xs={12} md={2}><TextField select fullWidth label="OpenAI Model" value={generateForm.openaiModel} onChange={(e) => setGenerateForm({ ...generateForm, openaiModel: e.target.value })}>{openAiModels.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>}
                {generateForm.aiProvider === "Claude" && <Grid item xs={12} md={2}><TextField select fullWidth label="Claude Model" value={generateForm.claudeModel} onChange={(e) => setGenerateForm({ ...generateForm, claudeModel: e.target.value })}>{claudeModels.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>}
                {generateForm.aiProvider === "Ollama" && <Grid item xs={12} md={2}><TextField select fullWidth label="Ollama Model" value={generateForm.ollamaConfigId} onChange={(e) => setGenerateForm({ ...generateForm, ollamaConfigId: e.target.value })}><MenuItem value="">Default active</MenuItem>{ollamaConfigs.map((item) => <MenuItem key={item._id} value={item._id}>{item.name || item.modelname || item.serveraddress}</MenuItem>)}</TextField></Grid>}
                {patternwise && (
                  <Grid item xs={12} md={3}>
                    <Paper variant="outlined" sx={{ px: 2, py: 1.2, borderRadius: 2, height: "100%" }}>
                      <Typography variant="caption" color="text.secondary">Generation controlled by format</Typography>
                      <Typography fontWeight={900}>{patternRows.length || 0} question row(s)</Typography>
                    </Paper>
                  </Grid>
                )}
                {mathematical && !templatewise && (
                  <Grid item xs={12} md={3}>
                    <Paper variant="outlined" sx={{ px: 2, py: 1.2, borderRadius: 2, height: "100%", display: "flex", alignItems: "center" }}>
                      <FormControlLabel
                        control={<Checkbox checked={includeMathematicalExpressions === "Yes"} onChange={(e) => setIncludeMathematicalExpressions(e.target.checked ? "Yes" : "No")} />}
                        label="Include mathematical expressions and questions"
                      />
                    </Paper>
                  </Grid>
                )}
                {!templatewise && <Grid item xs={12} md={3}><Autocomplete multiple disableCloseOnSelect options={bloomLevels} value={generateForm.bloomlevels} onChange={(e, value) => setGenerateForm({ ...generateForm, bloomlevels: value })} renderInput={(params) => <TextField {...params} label="Bloom Levels" />} /></Grid>}
                {!templatewise && <Grid item xs={12} md={5}><TextField select fullWidth label="CO" value={generateForm.conumber} onChange={(e) => setGenerateForm({ ...generateForm, conumber: e.target.value })}><MenuItem value="">Auto</MenuItem>{coOptions.map((item) => <MenuItem key={item.conumber || item.co} value={item.conumber}>{item.label}</MenuItem>)}</TextField></Grid>}
                {(patternwise || templatewise) && <Grid item xs={12} md={4}><TextField fullWidth label="Syllabus / source file link for AI" value={syllabusSource.url} onChange={(e) => setSyllabusSource((prev) => ({ ...prev, url: e.target.value }))} /></Grid>}
                {(patternwise || templatewise) && <Grid item xs={12} md={2}><Button fullWidth component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploadingKey === "syllabusSource-0-0"} sx={{ height: 56 }}>{uploadingKey === "syllabusSource-0-0" ? "Uploading..." : "Upload Source"}<input hidden type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={(e) => uploadAttachment(e.target.files?.[0], "syllabusSource", 0, 0)} /></Button></Grid>}
                {(patternwise || templatewise) && <Grid item xs={12} md={6}><TextField fullWidth label="AI print formatting rules" value={printRules} onChange={(e) => setPrintRules(e.target.value)} /></Grid>}
                {(patternwise || templatewise) && <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Additional AI prompt" value={generateForm.additionalAiPrompt || ""} onChange={(e) => setGenerateForm({ ...generateForm, additionalAiPrompt: e.target.value })} placeholder="Add strict instructions such as unit-wise weightage, exact difficulty mix, question style, compulsory/optional rules, or formatting notes." /></Grid>}
                {!templatewise && <Grid item xs={12} md={3}>
                  <Paper variant="outlined" sx={{ px: 2, py: 1.2, borderRadius: 2, height: "100%", display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      control={<Switch checked={generateForm.syllabusMode === "Covered Syllabus"} onChange={(e) => setGenerateForm((prev) => ({ ...prev, syllabusMode: e.target.checked ? "Covered Syllabus" : "Complete Syllabus", selectedModules: [], selectedTopics: [] }))} />}
                      label={generateForm.syllabusMode}
                    />
                  </Paper>
                </Grid>}
                {!templatewise && (generateForm.syllabusMode === "Complete Syllabus" ? (
                  <>
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={[selectAllOption, ...moduleOptions]}
                        value={generateForm.selectedModules || []}
                        onChange={(e, value) => updateSelectedModules(value)}
                        renderOption={renderCheckboxOption}
                        renderInput={(params) => <TextField {...params} label="Complete syllabus modules" helperText={`${moduleOptions.length} modules available`} />}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={[selectAllOption, ...topicOptions]}
                        value={generateForm.selectedTopics || []}
                        onChange={(e, value) => updateSelectedTopics(value, topicOptions)}
                        renderOption={renderCheckboxOption}
                        renderInput={(params) => <TextField {...params} label="Complete syllabus topics/content" helperText={`${topicOptions.length} topics available`} />}
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12} md={9}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={[selectAllOption, ...coveredWorkOptions]}
                      value={generateForm.selectedTopics || []}
                      onChange={(e, value) => {
                        const nextTopics = toggleAllValues(value, coveredWorkOptions, generateForm.selectedTopics || []);
                        setGenerateForm((prev) => ({ ...prev, selectedModules: [], selectedTopics: nextTopics }));
                      }}
                      renderOption={renderCheckboxOption}
                      renderInput={(params) => <TextField {...params} label="Completed work" helperText={`${coveredWorkOptions.length} completed work entries available`} />}
                    />
                  </Grid>
                ))}
                <Grid item xs={12} md={2}><Button fullWidth variant="outlined" color="error" disabled={paperSubmitted || generating || clearingGenerated || !sections.some((section) => (section.questions || []).length)} onClick={clearGeneratedQuestions} sx={{ height: 56 }}>{clearingGenerated ? "Clearing..." : "Delete Generated"}</Button></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={generating ? <CircularProgress size={18} /> : <AutoFixHighIcon />} disabled={paperSubmitted || generating || mapping || clearingGenerated} onClick={generateQuestions} sx={{ height: 56 }}>{generating ? "Generating..." : "Generate Fresh"}</Button></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="outlined" color="secondary" startIcon={mapping ? <CircularProgress size={18} /> : <FactCheckIcon />} disabled={paperSubmitted || generating || mapping} onClick={analyzeMapping} sx={{ height: 56 }}>{mapping ? "Mapping..." : "AI CO Mapping"}</Button></Grid>
                {(patternwise || templatewise) && <Grid item xs={12} md={2}><Button fullWidth variant="contained" color="secondary" disabled={formattingPreview || !sections.length} onClick={formatPatternPreview} sx={{ height: 56 }}>{formattingPreview ? "Formatting..." : "AI Format Print"}</Button></Grid>}
                {(patternwise || templatewise) && formattedPreviewHtml && <Grid item xs={12}><Alert severity="success">AI formatted preview is ready. Click Final Print Preview at the top.</Alert></Grid>}
              </Grid>
            </Paper>

            <Stack spacing={2} sx={paperSubmitted ? { pointerEvents: "none", opacity: 0.72 } : {}}>
              <Stack direction="row" spacing={1}><Button variant="contained" startIcon={<AddIcon />} disabled={paperSubmitted} onClick={addSection}>Add Section</Button><Chip label={`${sections.length} sections`} /></Stack>
              {sections.map((section, sectionIndex) => (
                <Card key={sectionIndex} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Grid item xs={12} md={3}><TextField fullWidth label="Section" value={section.title || ""} onChange={(e) => updateSection(sectionIndex, { title: e.target.value })} /></Grid>
                      <Grid item xs={12} md={6}><TextField fullWidth label="Instructions" value={section.instructions || ""} onChange={(e) => updateSection(sectionIndex, { instructions: e.target.value })} /></Grid>
                      <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Marks" value={section.marks || 0} onChange={(e) => updateSection(sectionIndex, { marks: e.target.value })} /></Grid>
                      <Grid item xs={12} md={1.5}><Button fullWidth color="error" variant="outlined" onClick={() => deleteSection(sectionIndex)}>Delete</Button></Grid>
                    </Grid>
                    <Stack spacing={2}>
                      {(section.questions || []).map((question, questionIndex) => {
                        const selectedCo = coOptions.find((item) => item.conumber === question.conumber) || null;
                        return (
                          <Paper key={questionIndex} variant="outlined" sx={{ p: 2, bgcolor: "#fbfdff" }}>
                            <Grid container spacing={2}>
                              {patternwise && <Grid item xs={12}><Alert severity="info">{[question.patternquestion, question.patterngroup, question.patternsubquestion].filter(Boolean).join(" / ") || `Question ${questionIndex + 1}`}</Alert></Grid>}
                              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label={`Question ${questionIndex + 1}`} value={question.question || ""} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { question: e.target.value })} /></Grid>
                              <OrderedQuestionContentEditor
                                question={question}
                                disabled={paperSubmitted}
                                uploadingKey={uploadingKey}
                                uploadAttachment={uploadAttachment}
                                updateQuestion={updateQuestion}
                                sectionIndex={sectionIndex}
                                questionIndex={questionIndex}
                              />
                              <Grid item xs={12} md={2}><TextField select fullWidth label="Type" value={question.questiontype || "Short Answer Type"} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { questiontype: e.target.value })}>{questionTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                              {mathematical && (
                                <Grid item xs={12} md={3}>
                                  <Paper variant="outlined" sx={{ px: 2, py: 1.2, borderRadius: 2, height: "100%", display: "flex", alignItems: "center" }}>
                                    <FormControlLabel
                                      control={<Checkbox checked={question.includemathematicalexpressions === "Yes"} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { includemathematicalexpressions: e.target.checked ? "Yes" : "No" })} />}
                                      label="Math symbols"
                                    />
                                  </Paper>
                                </Grid>
                              )}
                              <Grid item xs={12} md={2}><TextField select fullWidth label="Difficulty" value={question.difficultylevel || "Medium"} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { difficultylevel: e.target.value })}>{difficulties.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                              <Grid item xs={12} md={2}><TextField select fullWidth label="Language" value={question.language || "English"} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { language: e.target.value })}>{languages.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                              <Grid item xs={12} md={1}><TextField fullWidth type="number" label="Marks" value={question.marks || 0} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { marks: e.target.value })} /></Grid>
                              <Grid item xs={12} md={3}><Autocomplete multiple disableCloseOnSelect options={bloomLevels} value={question.bloomlevels || []} onChange={(e, value) => updateQuestion(sectionIndex, questionIndex, { bloomlevels: value })} renderInput={(params) => <TextField {...params} label="Bloom Levels" />} /></Grid>
                              <Grid item xs={12} md={2}><TextField select fullWidth label="CO" value={question.conumber || ""} onChange={(e) => {
                                const co = coOptions.find((item) => item.conumber === e.target.value);
                                updateQuestion(sectionIndex, questionIndex, { conumber: co?.conumber || "", co: co?.co || "" });
                              }}><MenuItem value="">Select</MenuItem>{coOptions.map((item) => <MenuItem key={item.conumber || item.co} value={item.conumber}>{item.label}</MenuItem>)}</TextField></Grid>
                              <Grid item xs={12} md={6}><TextField fullWidth label="Attachment link" value={question.attachmenturl || ""} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { attachmenturl: e.target.value })} /></Grid>
                              <Grid item xs={12} md={3}><Button fullWidth component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploadingKey === `question-${sectionIndex}-${questionIndex}`} sx={{ height: 56 }}>{uploadingKey === `question-${sectionIndex}-${questionIndex}` ? "Uploading..." : "Upload Attachment"}<input hidden type="file" onChange={(e) => uploadAttachment(e.target.files?.[0], "question", sectionIndex, questionIndex)} /></Button></Grid>
                              <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => deleteQuestion(sectionIndex, questionIndex)} sx={{ height: 56 }}>Delete Question</Button></Grid>
                              <Grid item xs={12}><TextField fullWidth label="AI Mapping Comments" value={question.aimappingcomments || ""} onChange={(e) => updateQuestion(sectionIndex, questionIndex, { aimappingcomments: e.target.value })} /></Grid>
                              {patternwise && (question.translations || []).map((translation, tIndex) => (
                                <Grid item xs={12} md={6} key={`${translation.language}-${tIndex}`}>
                                  <TextField fullWidth multiline minRows={2} label={`${translation.language} Translation`} value={translation.question || ""} onChange={(e) => {
                                    const next = [...(question.translations || [])];
                                    next[tIndex] = { ...translation, question: e.target.value };
                                    updateQuestion(sectionIndex, questionIndex, { translations: next });
                                  }} />
                                </Grid>
                              ))}
                              {selectedCo && <Grid item xs={12}><Alert severity="info">{selectedCo.label}</Alert></Grid>}
                            </Grid>
                          </Paper>
                        );
                      })}
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addQuestion(sectionIndex)}>Add Question</Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            {templatewise && (
              <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>Generated Paper Preview</Typography>
                    <Typography variant="body2" color="text.secondary">Review the generated sections and questions before submission or print formatting.</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<PrintIcon />} disabled={!sections.length} onClick={printPatternPreview}>Print Preview</Button>
                    <Button variant="outlined" color="error" disabled={paperSubmitted || clearingGenerated || !sections.some((section) => (section.questions || []).length)} onClick={clearGeneratedQuestions}>{clearingGenerated ? "Clearing..." : "Delete Generated"}</Button>
                    <Button variant="outlined" disabled={!sections.length} onClick={downloadHtmlPaper}>Download HTML</Button>
                    <Button variant="contained" color="secondary" disabled={formattingPreview || !sections.length} onClick={formatPatternPreview}>{formattingPreview ? "Formatting..." : "AI Format Print"}</Button>
                  </Stack>
                </Stack>
                <Box sx={{ bgcolor: "#fff", border: "1px solid #d1d5db", borderRadius: 1, p: 1, height: 720 }}>
                  <iframe
                    title="Generated question paper preview"
                    srcDoc={buildPatternPrintHtml(formattedPreviewHtml || defaultPatternBodyHtml(sections), sections, { includeToolbar: false })}
                    style={{ width: "100%", height: "100%", border: 0, background: "#fff" }}
                  />
                </Box>
              </Paper>
            )}
          </>
        )}
        <Dialog open={!!documentDialog} onClose={() => setDocumentDialog(null)} maxWidth="md" fullWidth>
          <DialogTitle>Documents</DialogTitle>
          <DialogContent>
            <Stack spacing={1} sx={{ pt: 1 }}>
              {[...(documentDialog?.admindocuments || []), ...(paperDocuments || [])].map((doc, index) => <Button key={`${doc.url}-${index}`} href={doc.url} target="_blank" rel="noreferrer" variant="outlined">{doc.title || doc.filename || `Document ${index + 1}`}</Button>)}
              {!documentDialog?.admindocuments?.length && !paperDocuments.length && <Typography color="text.secondary">No documents uploaded.</Typography>}
            </Stack>
          </DialogContent>
        </Dialog>
        <Dialog open={!!syllabusDialog} onClose={() => setSyllabusDialog(null)} maxWidth="md" fullWidth>
          <DialogTitle>Syllabus</DialogTitle>
          <DialogContent>
            <Stack spacing={1} sx={{ pt: 1 }}>
              {(syllabusContext.completeRows || []).map((row, index) => <Paper key={row._id || index} variant="outlined" sx={{ p: 1.5 }}><Typography fontWeight={800}>{row.module}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{row.syllabus}</Typography>{row.sourcefilelink && <Button size="small" href={row.sourcefilelink} target="_blank" rel="noreferrer">Source File</Button>}</Paper>)}
              {!syllabusContext.completeRows?.length && <Typography color="text.secondary">Select a paper first to load syllabus details.</Typography>}
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>
    </MenuPageShell>
  );
}
