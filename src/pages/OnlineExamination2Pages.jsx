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
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Add, AutoFixHigh, Block, CheckCircle, CloudUpload, Delete, Edit, PlayArrow, Refresh, Save, Stop } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import AdvancedDrawingPad from "./QuestionDrawingPad";
import ep1 from "../api/ep1";
import global1 from "./global1";

const api = "/api/v2/online-exam-2";
const examBlank = { academicyear: "", category: "", program: "", programcode: "", semester: "", course: "", coursecode: "", examname: "", examcode: "", durationminutes: 60, timezone: "UTC", instructions: "", status: "Draft", allowseconddevice: "No" };
const sectionBlank = { sectionname: "", sectiontype: "MCQ", instructions: "", order: 0 };
const questionBlank = { sectionid: "", questiontext: "", questionhtml: "", questiontype: "MCQ", marks: 1, modules: [], topics: [], options: [{ optiontext: "", iscorrect: true }, { optiontext: "", iscorrect: false }], tabledata: [], tabletext: "", contentblocks: [], order: 0 };
const aiBlank = { provider: "gemini", geminiModel: "gemini-2.5-flash", ollamaConfigId: "", questiontype: "MCQ", count: 5, difficulty: "Medium", language: "English", prompt: "", modules: [], topics: [], sourcefileurl: "", sourcefilename: "" };
const assignmentBlank = { academicyear: "", regulation: "", program: "", programcode: "", semester: [], section: [] };
const questionTypes = ["MCQ", "Descriptive", "Table", "Fill in the blanks", "Match columns"];
const geminiModelOptions = ["gemini-3.5-pro", "gemini-3.0-pro", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
const richSymbols = ["√", "∑", "∫", "π", "θ", "≤", "≥", "≠", "∞", "±", "÷", "×", "²", "³", "α", "β", "γ", "δ", "Δ", "λ", "μ", "σ", "Ω", "∂", "∇", "≈", "≡", "∈", "∉", "∩", "∪", "⊂", "⊆", "→", "←", "↔", "⇒", "⇔", "∀", "∃", "∴", "∵", "∠", "⊥", "∥", "℃", "℉", "₹"];
const sampleTemplates = {
  "Match columns": {
    questiontext: "Match the items in Column A with the correct items in Column B.",
    tabletext: "Column A,Column B\nCPU,Brain of the computer\nRAM,Temporary memory\nHTTP,Web communication protocol\nSQL,Database query language"
  },
  "Fill in the blanks": {
    questiontext: "Fill in the blanks: The ____ stores temporary data and the ____ is used to query relational databases.",
    options: [{ optiontext: "RAM, SQL", iscorrect: true }, { optiontext: "ROM, HTML", iscorrect: false }, { optiontext: "CPU, CSS", iscorrect: false }, { optiontext: "GPU, TCP", iscorrect: false }]
  },
  Table: {
    questiontext: "Study the table and answer the question based on the given values.",
    tabletext: "Year,Admissions,Placements\n2024,120,96\n2025,140,112\n2026,160,132"
  }
};
const fmt = (value) => value ? new Date(value).toLocaleString() : "";
const rowsOf = (rows = []) => rows.map((row) => ({ ...row, id: row._id }));
const unique = (rows, field) => [...new Set((rows || []).map((row) => row?.[field]).filter(Boolean))].sort();
const formatSeconds = (value) => {
  const safe = Math.max(0, Number(value) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h ? `${String(h).padStart(2, "0")}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
const html = (value) => String(value || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
const answered = (answer) => Boolean(answer?.selectedoptionid || answer?.selectedoptiontext || String(answer?.answertext || "").trim() || answer?.attachmenturl);
const parseTableText = (value) => String(value || "").split("\n").map((line) => line.split(/,|\t/).map((cell) => cell.trim())).filter((row) => row.some(Boolean));
const tableHtml = (tabledata = []) => Array.isArray(tabledata) && tabledata.length
  ? `<table class="exam2-question-table">${tabledata.map((row) => `<tr>${(row || []).map((cell) => `<td>${String(cell ?? "")}</td>`).join("")}</tr>`).join("")}</table>`
  : "";
const blockHtml = (block = {}) => {
  if (block.blocktype === "text") return `<div>${block.text || ""}</div>`;
  if (block.blocktype === "math") return `<div class="math">${block.text || ""}</div>`;
  if (block.blocktype === "table") return tableHtml(block.tabledata);
  if (block.blocktype === "image") return block.url ? `<div><img src="${block.url}" alt="${block.title || block.filename || "image"}" /></div>` : "";
  if (block.blocktype === "drawing") return block.dataurl ? `<div><img src="${block.dataurl}" alt="drawing" /></div>` : "";
  return "";
};
const isChoiceQuestion = (type) => /^(mcq|fill in the blanks)$/i.test(String(type || ""));

const getDeviceId = () => {
  const key = "onlineExam2DeviceId";
  let current = localStorage.getItem(key);
  if (!current) {
    current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, current);
  }
  return current;
};

const renderQuestionHtml = (question = {}) => {
  if (Array.isArray(question.contentblocks) && question.contentblocks.length) {
    return html(question.contentblocks.map(blockHtml).join(""));
  }
  const base = question.questionhtml || question.questiontext || "";
  const math = question.mathematicalexpression ? `<div class="math">${question.mathematicalexpression}</div>` : "";
  const image = question.imageurl ? `<div><img src="${question.imageurl}" alt="question" /></div>` : "";
  return html(`${base}${math}${tableHtml(question.tabledata)}${image}`);
};

function QuickAutocomplete({ label, value, options, onChange, multiple = false }) {
  return (
    <Autocomplete
      multiple={multiple}
      options={options || []}
      value={multiple ? (Array.isArray(value) ? value : []) : (value || null)}
      onChange={(_, next) => onChange(next || (multiple ? [] : ""))}
      getOptionLabel={(option) => String(option || "")}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

function ExamSelect({ value, onChange, label = "Exam" }) {
  const [exams, setExams] = useState([]);
  useEffect(() => {
    ep1.get(`${api}/exams`, { params: { colid: global1.colid } }).then((res) => setExams(res.data?.data || [])).catch(() => setExams([]));
  }, []);
  return (
    <Autocomplete
      options={exams}
      value={exams.find((exam) => String(exam._id) === String(value)) || null}
      onChange={(_, exam) => onChange(exam?._id || "", exam || null)}
      getOptionLabel={(exam) => exam ? `${exam.examname || ""} (${exam.examcode || ""})` : ""}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

function RichQuestionEditor({ question, setQuestion, uploadFile, disabled }) {
  const blocks = Array.isArray(question.contentblocks) ? question.contentblocks : [];
  const patchBlocks = (contentblocks) => setQuestion((prev) => ({ ...prev, contentblocks }));
  const addBlock = (blocktype) => {
    const block = blocktype === "table"
      ? { blocktype, tabledata: [["", ""], ["", ""]] }
      : blocktype === "drawing"
        ? { blocktype, dataurl: "", color: "#111827", brushsize: 2 }
        : blocktype === "image"
          ? { blocktype, url: "", filename: "", title: "" }
          : { blocktype, text: "" };
    patchBlocks([...blocks, block]);
  };
  const updateBlock = (index, patch) => patchBlocks(blocks.map((block, i) => i === index ? { ...block, ...patch } : block));
  const removeBlock = (index) => patchBlocks(blocks.filter((_, i) => i !== index));
  const appendSymbol = (index, symbol) => updateBlock(index, { text: `${blocks[index]?.text || ""}${symbol}` });
  const uploadImage = async (index, file) => {
    if (!file) return;
    const uploaded = await uploadFile(file, "question-images");
    updateBlock(index, { url: uploaded.url, filename: uploaded.filename, title: uploaded.label });
  };
  const updateTableCell = (blockIndex, rowIndex, colIndex, value) => {
    const table = blocks[blockIndex]?.tabledata || [];
    updateBlock(blockIndex, { tabledata: table.map((row, r) => r === rowIndex ? row.map((cell, c) => c === colIndex ? value : cell) : row) });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("text")}>Add Text</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("math")}>Add Equation/Symbols</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("table")}>Add Table</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("image")}>Add Image/Photo</Button>
        <Button size="small" variant="outlined" disabled={disabled} onClick={() => addBlock("drawing")}>Add Drawing</Button>
      </Stack>
      {!blocks.length && <Alert severity="info">Add text, equation, table, image/photo or drawing blocks. They will be shown to students in the same order.</Alert>}
      {blocks.map((block, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip size="small" label={block.blocktype} />
            <Box sx={{ flex: 1 }} />
            <Button size="small" color="error" disabled={disabled} onClick={() => removeBlock(index)}>Remove</Button>
          </Stack>
          {block.blocktype === "text" && (
            <TextField fullWidth multiline minRows={8} label="Descriptive question text" value={block.text || ""} disabled={disabled} onChange={(e) => updateBlock(index, { text: e.target.value })} />
          )}
          {block.blocktype === "math" && (
            <Box>
              <TextField fullWidth multiline minRows={3} label="Mathematical expression / symbols" value={block.text || ""} disabled={disabled} onChange={(e) => updateBlock(index, { text: e.target.value })} />
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                {richSymbols.map((symbol) => <Button key={symbol} size="small" variant="outlined" disabled={disabled} onClick={() => appendSymbol(index, symbol)} sx={{ minWidth: 34 }}>{symbol}</Button>)}
              </Stack>
            </Box>
          )}
          {block.blocktype === "table" && (
            <Box sx={{ overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& td": { border: "1px solid #cbd5e1", p: 0.5 } }}>
                <tbody>
                  {(block.tabledata || []).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex}><TextField fullWidth variant="standard" value={cell} disabled={disabled} onChange={(e) => updateTableCell(index, rowIndex, colIndex, e.target.value)} InputProps={{ disableUnderline: true }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" disabled={disabled} onClick={() => updateBlock(index, { tabledata: [...(block.tabledata || []), Array(Math.max(...(block.tabledata || [[]]).map((row) => row.length), 2)).fill("")] })}>Add row</Button>
                <Button size="small" disabled={disabled} onClick={() => updateBlock(index, { tabledata: (block.tabledata || []).map((row) => [...row, ""]) })}>Add column</Button>
              </Stack>
            </Box>
          )}
          {block.blocktype === "image" && (
            <Stack spacing={1}>
              <Button component="label" startIcon={<CloudUpload />} disabled={disabled}>Upload image/photo<input hidden type="file" accept="image/*" onChange={(e) => uploadImage(index, e.target.files?.[0])} /></Button>
              {block.url && <Box component="img" src={block.url} alt={block.title || "question"} sx={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain", border: "1px solid #e5e7eb" }} />}
            </Stack>
          )}
          {block.blocktype === "drawing" && (
            <AdvancedDrawingPad value={block.dataurl || ""} disabled={disabled} initialColor={block.color || "#111827"} initialBrushSize={block.brushsize || 2} onStyleChange={(style) => updateBlock(index, style)} onChange={(dataurl) => updateBlock(index, { dataurl })} />
          )}
        </Paper>
      ))}
    </Stack>
  );
}

export function OnlineExam2ManagementPage() {
  const navigate = useNavigate();
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [exam, setExam] = useState(examBlank);
  const [selected, setSelected] = useState(null);
  const [section, setSection] = useState(sectionBlank);
  const [question, setQuestion] = useState(questionBlank);
  const [aiForm, setAiForm] = useState(aiBlank);
  const [questionOptions, setQuestionOptions] = useState({ modules: [], topics: [] });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [opt, list] = await Promise.all([
        ep1.get(`${api}/options`, { params: { colid: global1.colid } }),
        ep1.get(`${api}/exams`, { params: { colid: global1.colid } })
      ]);
      setOptions(opt.data || {});
      setRows(list.data?.data || []);
      if (selected?._id) {
        const fresh = (list.data?.data || []).find((row) => row._id === selected._id);
        if (fresh) setSelected(fresh);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load online examination 2.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!selected?._id) return;
    ep1.get(`${api}/question-options`, {
      params: {
        colid: global1.colid,
        academicyear: selected.academicyear,
        program: selected.program,
        programcode: selected.programcode,
        semester: selected.semester,
        course: selected.course,
        coursecode: selected.coursecode
      }
    }).then((res) => setQuestionOptions(res.data || { modules: [], topics: [] })).catch(() => setQuestionOptions({ modules: [], topics: [] }));
  }, [selected?._id]);

  const courses = Array.isArray(options.programs) ? options.programs.filter(Boolean) : [];
  const programs = useMemo(() => {
    const map = new Map();
    courses.forEach((row) => {
      if (row?.programcode) map.set(row.programcode, row);
    });
    return [...map.values()];
  }, [courses]);
  const courseOptions = courses.filter((row) => row && (!exam.academicyear || row.academicyear === exam.academicyear) && (!exam.programcode || row.programcode === exam.programcode) && (!exam.semester || row.semester === exam.semester));

  const saveExam = async () => {
    setLoading(true);
    try {
      await ep1.post(`${api}/exams`, { ...exam, id: selected?._id, colid: global1.colid, user: global1.user, username: global1.name });
      setExam(examBlank);
      setSelected(null);
      await load();
      setMessage("Exam saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save exam.");
    } finally {
      setLoading(false);
    }
  };
  const editExam = (row) => {
    setSelected(row);
    setExam({ ...examBlank, ...row });
  };
  const deleteExam = async (row) => {
    if (!window.confirm("Delete this Online examination 2 exam?")) return;
    await ep1.post(`${api}/exams-delete`, { colid: global1.colid, id: row._id });
    if (selected?._id === row._id) setSelected(null);
    await load();
  };
  const saveSection = async () => {
    if (!selected?._id) return setMessage("Select an exam first.");
    await ep1.post(`${api}/sections`, { ...section, colid: global1.colid, examid: selected._id });
    setSection(sectionBlank);
    await load();
  };
  const saveQuestion = async () => {
    if (!selected?._id || !question.sectionid) return setMessage("Select an exam and section first.");
    const tabledata = question.tabletext ? parseTableText(question.tabletext) : question.tabledata;
    const firstTextBlock = (question.contentblocks || []).find((block) => block.blocktype === "text" && block.text);
    await ep1.post(`${api}/questions`, { ...question, questiontext: question.questiontext || firstTextBlock?.text || "", questionhtml: question.questionhtml || firstTextBlock?.text || question.questiontext || "", tabledata, colid: global1.colid, examid: selected._id });
    setQuestion(questionBlank);
    await load();
  };
  const uploadFile = async (file, context = "source") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("colid", global1.colid);
    fd.append("context", context);
    const res = await ep1.post(`${api}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data?.data || {};
  };
  const uploadSourceFile = async (file) => {
    if (!file) return;
    const ok = /\.(pdf|doc|docx)$/i.test(file.name || "");
    if (!ok) return setMessage("Upload PDF, DOC or DOCX only.");
    setLoading(true);
    try {
      const uploaded = await uploadFile(file, "ai-source");
      setAiForm((p) => ({ ...p, sourcefileurl: uploaded.url || "", sourcefilename: uploaded.filename || uploaded.label || "" }));
      setMessage("Source file uploaded to AWS and will be sent as link to AI.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to upload source file.");
    } finally {
      setLoading(false);
    }
  };
  const generateQuestions = async () => {
    if (!selected?._id || !question.sectionid) return setMessage("Select an exam and section first.");
    setLoading(true);
    try {
      const res = await ep1.post(`${api}/generate-questions`, {
        ...aiForm,
        colid: global1.colid,
        course: selected.course,
        coursecode: selected.coursecode,
        program: selected.program,
        programcode: selected.programcode,
        semester: selected.semester,
        modules: aiForm.modules,
        topics: aiForm.topics
      });
      const generated = res.data?.data || [];
      for (const [index, item] of generated.entries()) {
        await ep1.post(`${api}/questions`, {
          ...item,
          sectionid: question.sectionid,
          colid: global1.colid,
          examid: selected._id,
          order: item.order || index + 1
        });
      }
      setMessage(`${generated.length} AI question(s) added.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title="Online Examination 2">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900}>Online Examination 2</Typography>
              <Typography color="text.secondary">Live exam copy without start/end date. The original online examination is not changed.</Typography>
            </Box>
            <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
          </Stack>
          {loading && <LinearProgress />}
          {message && <Alert severity="info" onClose={() => setMessage("")}>{message}</Alert>}

          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}><QuickAutocomplete label="Academic year" value={exam.academicyear} options={options.academicyears || []} onChange={(v) => setExam((p) => ({ ...p, academicyear: v }))} /></Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete options={programs} value={programs.find((p) => p.programcode === exam.programcode) || null} getOptionLabel={(p) => p ? `${p.program || p.name || ""} (${p.programcode || ""})` : ""} onChange={(_, p) => setExam((old) => ({ ...old, program: p?.program || p?.name || "", programcode: p?.programcode || "" }))} renderInput={(params) => <TextField {...params} label="Program" />} />
              </Grid>
              <Grid item xs={12} md={1.5}><QuickAutocomplete label="Semester" value={exam.semester} options={unique(courses.filter((c) => !exam.programcode || c.programcode === exam.programcode), "semester")} onChange={(v) => setExam((p) => ({ ...p, semester: v }))} /></Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete options={courseOptions} value={courseOptions.find((c) => c.coursecode === exam.coursecode) || null} getOptionLabel={(c) => c ? `${c.course || ""} (${c.coursecode || ""})` : ""} onChange={(_, c) => setExam((old) => ({ ...old, course: c?.course || "", coursecode: c?.coursecode || "" }))} renderInput={(params) => <TextField {...params} label="Course" />} />
              </Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth label="Category" value={exam.category} onChange={(e) => setExam((p) => ({ ...p, category: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Exam name" value={exam.examname} onChange={(e) => setExam((p) => ({ ...p, examname: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Exam code" value={exam.examcode} onChange={(e) => setExam((p) => ({ ...p, examcode: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Duration minutes" value={exam.durationminutes} onChange={(e) => setExam((p) => ({ ...p, durationminutes: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={exam.status} onChange={(e) => setExam((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem></TextField></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Allow second device" value={exam.allowseconddevice} onChange={(e) => setExam((p) => ({ ...p, allowseconddevice: e.target.value }))}><MenuItem value="No">No</MenuItem><MenuItem value="Yes">Yes</MenuItem></TextField></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Detailed instructions" value={exam.instructions} onChange={(e) => setExam((p) => ({ ...p, instructions: e.target.value }))} /></Grid>
              <Grid item xs={12}><Button variant="contained" startIcon={<Save />} onClick={saveExam}>{selected ? "Update exam" : "Save exam"}</Button></Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <DataGrid
              autoHeight
              rows={rowsOf(rows)}
              columns={[
                { field: "examname", headerName: "Exam", width: 220 },
                { field: "examcode", headerName: "Code", width: 140 },
                { field: "program", headerName: "Program", width: 220 },
                { field: "semester", headerName: "Semester", width: 110 },
                { field: "course", headerName: "Course", width: 220 },
                { field: "durationminutes", headerName: "Duration", width: 110 },
                { field: "isstarted", headerName: "Started", width: 110 },
                { field: "status", headerName: "Status", width: 120 },
                { field: "actions", headerName: "Actions", width: 320, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => editExam(row)} startIcon={<Edit />}>Edit</Button><Button size="small" onClick={() => { setSelected(row); setQuestion((q) => ({ ...q, sectionid: row.sections?.[0]?._id || "" })); }}>Questions</Button><Button size="small" variant="contained" onClick={() => navigate(`/online-examination-2-details?examid=${row._id}`)}>Details</Button><Button size="small" color="error" onClick={() => deleteExam(row)}><Delete fontSize="small" /></Button></Stack> }
              ]}
              slots={{ toolbar: GridToolbar }}
            />
          </Paper>

          {selected && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={900}>Question setup: {selected.examname}</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={3}><TextField fullWidth label="Section" value={section.sectionname} onChange={(e) => setSection((p) => ({ ...p, sectionname: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth label="Type" value={section.sectiontype} onChange={(e) => setSection((p) => ({ ...p, sectiontype: e.target.value }))}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={5}><TextField fullWidth label="Instructions" value={section.instructions} onChange={(e) => setSection((p) => ({ ...p, instructions: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={<Add />} onClick={saveSection}>Add section</Button></Grid>
                <Grid item xs={12} md={3}><TextField select fullWidth label="Section" value={question.sectionid} onChange={(e) => setQuestion((p) => ({ ...p, sectionid: e.target.value }))}>{(selected.sections || []).map((s) => <MenuItem key={s._id} value={s._id}>{s.sectionname}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth label="Question type" value={question.questiontype} onChange={(e) => setQuestion((p) => ({ ...p, questiontype: e.target.value }))}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Marks" value={question.marks} onChange={(e) => setQuestion((p) => ({ ...p, marks: e.target.value }))} /></Grid>
                <Grid item xs={12} md={5}><TextField fullWidth label="Question" value={question.questiontext} onChange={(e) => setQuestion((p) => ({ ...p, questiontext: e.target.value, questionhtml: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><QuickAutocomplete multiple label="Module from syllabus" value={question.modules} options={questionOptions.modules || []} onChange={(v) => setQuestion((p) => ({ ...p, modules: v }))} /></Grid>
                <Grid item xs={12} md={6}><QuickAutocomplete multiple label="Topic from syllabus" value={question.topics} options={questionOptions.topics || []} onChange={(v) => setQuestion((p) => ({ ...p, topics: v }))} /></Grid>
                {sampleTemplates[question.questiontype] && (
                  <Grid item xs={12}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setQuestion((p) => ({ ...p, ...sampleTemplates[p.questiontype], tabledata: parseTableText(sampleTemplates[p.questiontype].tabletext || ""), questionhtml: sampleTemplates[p.questiontype].questiontext || p.questionhtml }))}
                    >
                      Load sample input for {question.questiontype}
                    </Button>
                  </Grid>
                )}
                {["Table", "Match columns"].includes(question.questiontype) && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label={question.questiontype === "Match columns" ? "Match columns data. First row: Column A, Column B" : "Table data. Use comma or tab separated rows"}
                      value={question.tabletext || ""}
                      onChange={(e) => setQuestion((p) => ({ ...p, tabletext: e.target.value, tabledata: parseTableText(e.target.value) }))}
                      helperText="Example: Term,Meaning on first row, then one pair per row."
                    />
                  </Grid>
                )}
                {isChoiceQuestion(question.questiontype) && question.options.map((option, index) => (
                  <Grid item xs={12} md={3} key={index}>
                    <TextField fullWidth label={`Option ${index + 1}`} value={option.optiontext} onChange={(e) => setQuestion((p) => ({ ...p, options: p.options.map((o, i) => i === index ? { ...o, optiontext: e.target.value } : o) }))} InputProps={{ endAdornment: <Checkbox checked={option.iscorrect} onChange={(e) => setQuestion((p) => ({ ...p, options: p.options.map((o, i) => i === index ? { ...o, iscorrect: e.target.checked } : { ...o, iscorrect: false }) }))} /> }} />
                  </Grid>
                ))}
                {question.questiontype === "Descriptive" && (
                  <Grid item xs={12}>
                    <Typography fontWeight={900} sx={{ mb: 1 }}>Descriptive rich question content</Typography>
                    <RichQuestionEditor question={question} setQuestion={setQuestion} uploadFile={uploadFile} disabled={loading} />
                  </Grid>
                )}
                <Grid item xs={12}><Button variant="contained" onClick={saveQuestion}>Add question</Button></Grid>
              </Grid>
              <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: "#f8fafc" }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>AI question generation</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Target section for AI questions"
                      value={question.sectionid}
                      onChange={(e) => setQuestion((p) => ({ ...p, sectionid: e.target.value }))}
                    >
                      {(selected.sections || []).map((s) => <MenuItem key={s._id} value={s._id}>{s.sectionname}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="AI provider" value={aiForm.provider} onChange={(e) => setAiForm((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="gemini">Gemini</MenuItem><MenuItem value="ollama">Ollama</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={3}>
                    {aiForm.provider === "ollama" ? (
                      <TextField select fullWidth label="Ollama model" value={aiForm.ollamaConfigId} onChange={(e) => setAiForm((p) => ({ ...p, ollamaConfigId: e.target.value }))}>
                        {(options.ollama || []).map((model) => <MenuItem key={model._id} value={model._id}>{model.name || model.modelname}</MenuItem>)}
                      </TextField>
                    ) : (
                      <Autocomplete freeSolo options={geminiModelOptions} value={aiForm.geminiModel} onInputChange={(_, value) => setAiForm((p) => ({ ...p, geminiModel: value }))} renderInput={(params) => <TextField {...params} label="Gemini model" />} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Question type" value={aiForm.questiontype} onChange={(e) => setAiForm((p) => ({ ...p, questiontype: e.target.value }))}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Count" value={aiForm.count} onChange={(e) => setAiForm((p) => ({ ...p, count: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField select fullWidth label="Difficulty" value={aiForm.difficulty} onChange={(e) => setAiForm((p) => ({ ...p, difficulty: e.target.value }))}><MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Language" value={aiForm.language} onChange={(e) => setAiForm((p) => ({ ...p, language: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={6}><QuickAutocomplete multiple label="Module from syllabus" value={aiForm.modules} options={questionOptions.modules || []} onChange={(v) => setAiForm((p) => ({ ...p, modules: v }))} /></Grid>
                  <Grid item xs={12} md={6}><QuickAutocomplete multiple label="Topic from syllabus" value={aiForm.topics} options={questionOptions.topics || []} onChange={(v) => setAiForm((p) => ({ ...p, topics: v }))} /></Grid>
                  <Grid item xs={12} md={6}>
                    <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={loading}>
                      Upload PDF/Word source through AWS
                      <input hidden type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => uploadSourceFile(e.target.files?.[0])} />
                    </Button>
                    {aiForm.sourcefileurl && <Typography variant="caption" sx={{ display: "block", mt: 0.75 }}>Uploaded: <a href={aiForm.sourcefileurl} target="_blank" rel="noreferrer">{aiForm.sourcefilename || "source file"}</a></Typography>}
                  </Grid>
                  {sampleTemplates[aiForm.questiontype] && (
                    <Grid item xs={12} md={6}>
                      <Alert severity="info">
                        Sample {aiForm.questiontype}: {sampleTemplates[aiForm.questiontype].questiontext}
                      </Alert>
                    </Grid>
                  )}
                  <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Additional AI prompt" value={aiForm.prompt} onChange={(e) => setAiForm((p) => ({ ...p, prompt: e.target.value }))} /></Grid>
                  <Grid item xs={12}><Button variant="contained" startIcon={<AutoFixHigh />} disabled={loading} onClick={generateQuestions}>Generate and add to selected section</Button></Grid>
                </Grid>
              </Paper>
            </Paper>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExam2LiveControlPage() {
  const [params] = useSearchParams();
  const [examid, setExamid] = useState(params.get("examid") || "");
  const [details, setDetails] = useState(null);
  const [assignment, setAssignment] = useState(assignmentBlank);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (id = examid) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ep1.get(`${api}/details`, { params: { colid: global1.colid, examid: id } });
      setDetails(res.data || null);
      const e = res.data?.exam || {};
      setAssignment((p) => ({ ...p, academicyear: e.academicyear || "", program: e.program || "", programcode: e.programcode || "" }));
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load exam details.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [examid]);
  useEffect(() => {
    if (!examid) return undefined;
    const id = setInterval(() => load(examid), 10000);
    return () => clearInterval(id);
  }, [examid]);

  const action = async (path, body = {}) => {
    setLoading(true);
    try {
      await ep1.post(`${api}/${path}`, { ...body, colid: global1.colid, examid });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };
  const saveAssignment = async () => {
    await action("assignments", { ...assignment, user: global1.user, username: global1.name });
    setAssignment(assignmentBlank);
  };
  const attempts = details?.attempts || [];

  return (
    <MenuPageShell title="Online Examination 2 Details">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}><ExamSelect value={examid} onChange={(id) => setExamid(id)} /></Grid>
              <Grid item xs={12} md={7}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" color="success" startIcon={<PlayArrow />} disabled={!examid || loading} onClick={() => action("start-exam")}>Start exam</Button>
                  <Button variant="outlined" color="error" startIcon={<Stop />} disabled={!examid || loading} onClick={() => action("stop-exam")}>Stop exam</Button>
                  <Button startIcon={<Refresh />} onClick={() => load()}>Refresh</Button>
                  {details?.exam && <Chip label={`Status: ${details.exam.isstarted === "Yes" ? "Started" : "Stopped"}`} color={details.exam.isstarted === "Yes" ? "success" : "default"} />}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          {loading && <LinearProgress />}
          {message && <Alert severity="info" onClose={() => setMessage("")}>{message}</Alert>}
          {details?.exam && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Logged in</Typography><Typography variant="h4">{attempts.filter((a) => a.active).length}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Started attempts</Typography><Typography variant="h4">{attempts.length}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Submitted</Typography><Typography variant="h4">{attempts.filter((a) => a.submittime).length}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Duration</Typography><Typography variant="h4">{details.exam.durationminutes}m</Typography></CardContent></Card></Grid>
            </Grid>
          )}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>Student assignment</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={2}><TextField fullWidth label="Academic year" value={assignment.academicyear} onChange={(e) => setAssignment((p) => ({ ...p, academicyear: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Regulation" value={assignment.regulation} onChange={(e) => setAssignment((p) => ({ ...p, regulation: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Program" value={assignment.program} onChange={(e) => setAssignment((p) => ({ ...p, program: e.target.value }))} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Program code" value={assignment.programcode} onChange={(e) => setAssignment((p) => ({ ...p, programcode: e.target.value }))} /></Grid>
              <Grid item xs={12} md={1.5}><QuickAutocomplete multiple label="Semester" value={assignment.semester} options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]} onChange={(v) => setAssignment((p) => ({ ...p, semester: v }))} /></Grid>
              <Grid item xs={12} md={1.5}><QuickAutocomplete multiple label="Section" value={assignment.section} options={["A", "B", "C", "D", "NA"]} onChange={(v) => setAssignment((p) => ({ ...p, section: v }))} /></Grid>
              <Grid item xs={12}><Button variant="contained" onClick={saveAssignment}>Save assignment</Button></Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <DataGrid autoHeight rows={rowsOf(details?.assignments || [])} columns={[{ field: "academicyear", headerName: "Academic year", width: 140 }, { field: "regulation", headerName: "Regulation", width: 130 }, { field: "program", headerName: "Program", width: 220 }, { field: "programcode", headerName: "Program code", width: 140 }, { field: "semester", headerName: "Semester", width: 110 }, { field: "section", headerName: "Section", width: 100 }]} />
            </Box>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>Live students</Typography>
            <DataGrid
              autoHeight
              rows={rowsOf(attempts)}
              columns={[
                { field: "student", headerName: "Student", width: 180 },
                { field: "regno", headerName: "Regno", width: 140 },
                { field: "status", headerName: "Status", width: 120 },
                { field: "active", headerName: "Active", width: 100, renderCell: ({ row }) => row.active ? <Chip size="small" color="success" label="Live" /> : <Chip size="small" label="Offline" /> },
                { field: "loggedinseconds", headerName: "Logged in", width: 130, valueGetter: ({ row }) => formatSeconds(row.loggedinseconds) },
                { field: "serverremainingseconds", headerName: "Remaining", width: 130, valueGetter: ({ row }) => formatSeconds(row.serverremainingseconds) },
                { field: "barred", headerName: "Barred", width: 110 },
                { field: "ipaddress", headerName: "IP", width: 170 },
                { field: "actions", headerName: "Action", width: 260, renderCell: ({ row }) => <Stack direction="row" spacing={1}>{row.barred === "Yes" ? <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => action("bar-student", { attemptid: row._id, barred: "No" })}>Reactivate</Button> : <Button size="small" color="error" startIcon={<Block />} onClick={() => action("bar-student", { attemptid: row._id, barred: "Yes", barreason: "Barred by examiner" })}>Bar</Button>}</Stack> }
              ]}
              slots={{ toolbar: GridToolbar }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function StudentOnlineExamLive2Page() {
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [declareState, setDeclareState] = useState({ instructionsunderstood: false, hardwareok: false });
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [active, setActive] = useState({ section: 0, question: 0 });
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const submitRef = useRef(false);
  const deviceid = useMemo(getDeviceId, []);

  const load = async () => {
    try {
      const res = await ep1.get(`${api}/student-exams`, { params: { colid: global1.colid, regno: global1.regno } });
      setExams(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load assigned exams.");
    }
  };
  useEffect(() => { load(); }, []);
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
    const id = setInterval(() => save().catch(() => {}), 15000);
    return () => clearInterval(id);
  }, [attempt, answers]);
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
  }, [attempt, answers]);

  const start = async () => {
    if (!selected) return;
    if (!declareState.instructionsunderstood || !declareState.hardwareok) return setMessage("Please tick both declarations.");
    try {
      await document.documentElement.requestFullscreen?.();
      const res = await ep1.post(`${api}/start-attempt`, { colid: global1.colid, regno: global1.regno, examid: selected._id, deviceid, instructionsunderstood: "Yes", hardwareok: "Yes" });
      setExam(res.data.exam);
      setAttempt(res.data.attempt);
      setAnswers(res.data.attempt.answers || []);
      setRemaining(res.data.attempt.remainingseconds || selected.durationminutes * 60);
      submitRef.current = false;
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to start exam.");
    }
  };
  const patchAnswer = (questionid, patch) => setAnswers((prev) => prev.map((answer) => String(answer.questionid) === String(questionid) ? { ...answer, ...patch } : answer));
  const save = async () => {
    if (!attempt || submitRef.current || !navigator.onLine) return;
    const res = await ep1.post(`${api}/save-attempt`, { colid: global1.colid, attemptid: attempt._id, deviceid, answers });
    if (res.data?.data?.remainingseconds !== undefined) setRemaining(res.data.data.remainingseconds);
  };
  const submit = async (reason = "Submitted by student", auto = false) => {
    if (!attempt || submitRef.current) return;
    submitRef.current = true;
    try {
      await ep1.post(`${api}/submit-attempt`, { colid: global1.colid, attemptid: attempt._id, deviceid, answers, autosubmitted: auto, submitreason: reason });
      setAttempt((p) => ({ ...p, submittime: new Date(), status: "Submitted" }));
      setMessage(`Exam submitted. ${reason}`);
      document.exitFullscreen?.().catch(() => {});
      await load();
    } catch (error) {
      submitRef.current = false;
      setMessage(error.response?.data?.message || "Unable to submit exam.");
    }
  };

  const section = exam?.sections?.[active.section];
  const question = section?.questions?.[active.question];
  const answer = answers.find((row) => String(row.questionid) === String(question?._id));

  if (attempt && !attempt.submittime && exam) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", p: 2 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}><Typography variant="h5" fontWeight={900}>{exam.examname}</Typography><Typography>{exam.course} ({exam.coursecode})</Typography></Box>
              <Chip color={online ? "success" : "warning"} label={online ? "Online" : "Offline - timer paused"} />
              <Typography variant="h4" fontWeight={900} sx={{ color: "#111827", bgcolor: "#e0f2fe", px: 2, py: 1, borderRadius: 1 }}>{formatSeconds(remaining)}</Typography>
              <Button variant="outlined" onClick={save}>Save</Button>
              <Button variant="contained" color="error" onClick={() => submit("Final submitted", false)}>Submit</Button>
            </Stack>
          </Paper>
          {message && <Alert severity="warning">{message}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1.5, height: "calc(100vh - 150px)", overflow: "auto" }}>
                {(exam.sections || []).map((s, si) => (
                  <Box key={s._id} sx={{ mb: 2 }}>
                    <Typography fontWeight={900}>{s.sectionname}</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {(s.questions || []).map((q, qi) => {
                        const a = answers.find((row) => String(row.questionid) === String(q._id));
                        return <Button key={q._id} size="small" color={answered(a) ? "success" : "primary"} variant={active.section === si && active.question === qi ? "contained" : "outlined"} onClick={() => setActive({ section: si, question: qi })}>{qi + 1}</Button>;
                      })}
                    </Stack>
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2, minHeight: "calc(100vh - 150px)", "& img": { maxWidth: "100%" }, "& .math": { fontFamily: "Cambria Math, serif", fontSize: 22 }, "& .exam2-question-table": { borderCollapse: "collapse", width: "100%", my: 2 }, "& .exam2-question-table td": { border: "1px solid #94a3b8", p: 1 } }}>
                <Typography variant="h6" fontWeight={900}>{section?.sectionname}</Typography>
                <Box sx={{ mt: 2 }} dangerouslySetInnerHTML={{ __html: renderQuestionHtml(question) }} />
                {isChoiceQuestion(question?.questiontype || section?.sectiontype) ? (
                  <Stack spacing={1} sx={{ mt: 3 }}>{(question?.options || []).map((option) => <FormControlLabel key={option._id} control={<Radio checked={answer?.selectedoptionid === option._id} onChange={() => patchAnswer(question._id, { selectedoptionid: option._id, selectedoptiontext: option.optiontext })} />} label={option.optiontext} />)}</Stack>
                ) : (
                  <TextField fullWidth multiline minRows={8} sx={{ mt: 3 }} label="Answer" value={answer?.answertext || ""} onChange={(e) => patchAnswer(question._id, { answertext: e.target.value })} />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  return (
    <MenuPageShell title="Online Examination 2" menuType="student">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>Online Examination 2</Typography>
          {message && <Alert severity="warning" onClose={() => setMessage("")}>{message}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2 }}>
                <Typography fontWeight={900}>Assigned exams</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {exams.map((row) => <Button key={row._id} variant={selected?._id === row._id ? "contained" : "outlined"} onClick={() => setSelected(row)}>{row.examname} | {row.course} | {row.isstarted === "Yes" ? "Started" : "Waiting"}</Button>)}
                  {!exams.length && <Alert severity="info">No assigned Online examination 2 tests are available.</Alert>}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2 }}>
                {selected ? (
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={900}>{selected.examname}</Typography>
                    <Typography>{selected.course} ({selected.coursecode}) | Duration: {selected.durationminutes} minutes</Typography>
                    <Alert severity={selected.isstarted === "Yes" ? "success" : "info"}>{selected.isstarted === "Yes" ? "The examiner has started this exam." : "Waiting for examiner to start this exam."}</Alert>
                    <Box sx={{ p: 2, border: "1px solid #dbeafe", bgcolor: "#eff6ff", borderRadius: 1 }}>
                      <Typography fontWeight={900}>Instructions</Typography>
                      <Typography sx={{ whiteSpace: "pre-line" }}>{selected.instructions || "Read every question carefully. Do not switch tabs or leave fullscreen during the exam."}</Typography>
                    </Box>
                    <FormControlLabel control={<Checkbox checked={declareState.instructionsunderstood} onChange={(e) => setDeclareState((p) => ({ ...p, instructionsunderstood: e.target.checked }))} />} label="I have read and understood all exam instructions." />
                    <FormControlLabel control={<Checkbox checked={declareState.hardwareok} onChange={(e) => setDeclareState((p) => ({ ...p, hardwareok: e.target.checked }))} />} label="All required hardware, software and network are working properly." />
                    {selected.attempt?.submittime ? <Chip label="Submitted" /> : <Button variant="contained" disabled={selected.isstarted !== "Yes"} onClick={start}>Start exam</Button>}
                  </Stack>
                ) : <Alert severity="info">Select an exam to view instructions and start when it is live.</Alert>}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExam2DeclarationsPage() {
  const [academicyear, setAcademicyear] = useState("");
  const [examid, setExamid] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const load = async () => {
    const res = await ep1.post(`${api}/declarations`, { colid: global1.colid, academicyear, ...(examid ? { examid } : {}) });
    setRows(res.data?.data || []);
    setSummary(res.data?.summary || {});
  };
  return (
    <MenuPageShell title="Online Examination 2 Declarations">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth label="Academic year" value={academicyear} onChange={(e) => setAcademicyear(e.target.value)} /></Grid><Grid item xs={12} md={5}><ExamSelect value={examid} onChange={setExamid} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={load}>Load</Button></Grid></Grid></Paper>
          <Grid container spacing={2}><Grid item xs={12} md={4}><Card><CardContent><Typography>Total</Typography><Typography variant="h4">{summary.total || 0}</Typography></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><Typography>Completed declarations</Typography><Typography variant="h4">{summary.completedDeclarations || 0}</Typography></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><Typography>Missing</Typography><Typography variant="h4">{summary.missing || 0}</Typography></CardContent></Card></Grid></Grid>
          <Paper sx={{ p: 2 }}><DataGrid autoHeight rows={rowsOf(rows)} columns={[{ field: "examname", headerName: "Exam", width: 200 }, { field: "student", headerName: "Student", width: 180 }, { field: "regno", headerName: "Regno", width: 130 }, { field: "instructionsunderstood", headerName: "Understood", width: 130 }, { field: "hardwareok", headerName: "Hardware OK", width: 130 }, { field: "declarationip", headerName: "IP", width: 160 }, { field: "declarationat", headerName: "Date time", width: 180, valueGetter: ({ row }) => fmt(row.declarationat) }]} slots={{ toolbar: GridToolbar }} /></Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExam2ResponsesPage() {
  const [examid, setExamid] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ai, setAi] = useState({ provider: "gemini", geminiModel: "gemini-2.5-flash", rules: "" });
  const load = async () => {
    const res = await ep1.post(`${api}/responses`, { colid: global1.colid, ...(examid ? { examid } : {}) });
    setRows(res.data?.data || []);
  };
  const runAi = async () => {
    if (!selected) return;
    const res = await ep1.post(`${api}/ai-evaluate`, { ...ai, colid: global1.colid, attemptid: selected._id });
    const evaluations = res.data?.data || [];
    setSelected((prev) => ({ ...prev, answers: (prev.answers || []).map((answer) => {
      const found = evaluations.find((item) => String(item._id) === String(answer._id) || String(item.questionid) === String(answer.questionid));
      return found ? { ...answer, marksobtained: found.marksobtained, aicomments: found.comments, comments: found.comments, grade: found.grade } : answer;
    }) }));
  };
  const saveGrade = async () => {
    if (!selected) return;
    await ep1.post(`${api}/grade-attempt`, { colid: global1.colid, attemptid: selected._id, answers: selected.answers, grade: selected.grade, comments: selected.comments });
    await load();
  };
  return (
    <MenuPageShell title="Online Examination 2 Responses">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}><Grid container spacing={2}><Grid item xs={12} md={6}><ExamSelect value={examid} onChange={setExamid} /></Grid><Grid item xs={12} md={2}><Button variant="contained" onClick={load}>Load</Button></Grid></Grid></Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}><Paper sx={{ p: 2 }}><DataGrid autoHeight rows={rowsOf(rows)} columns={[{ field: "student", headerName: "Student", width: 180 }, { field: "regno", headerName: "Regno", width: 130 }, { field: "status", headerName: "Status", width: 120 }, { field: "marksobtained", headerName: "Marks", width: 100 }, { field: "actions", headerName: "View", width: 120, renderCell: ({ row }) => <Button size="small" onClick={() => setSelected(row)}>Open</Button> }]} /></Paper></Grid>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2 }}>
                {selected ? <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={900}>{selected.student} | {selected.regno}</Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}><TextField select label="AI provider" value={ai.provider} onChange={(e) => setAi((p) => ({ ...p, provider: e.target.value }))}><MenuItem value="gemini">Gemini</MenuItem><MenuItem value="ollama">Ollama</MenuItem></TextField><TextField label="Gemini model" value={ai.geminiModel} onChange={(e) => setAi((p) => ({ ...p, geminiModel: e.target.value }))} /><Button variant="outlined" onClick={runAi}>AI evaluate descriptive</Button><Button variant="contained" onClick={saveGrade}>Save edited scores</Button></Stack>
                  {(selected.answers || []).map((answer, index) => <Paper key={answer._id} variant="outlined" sx={{ p: 1.5 }}><Typography fontWeight={900}>Q{index + 1}. {answer.questiontext}</Typography><Typography color="text.secondary">Answer: {answer.answertext || answer.selectedoptiontext || "-"}</Typography><TextField sx={{ mt: 1, mr: 1 }} type="number" label="Marks" value={answer.marksobtained || 0} onChange={(e) => setSelected((p) => ({ ...p, answers: p.answers.map((a) => a._id === answer._id ? { ...a, marksobtained: e.target.value } : a) }))} /><TextField sx={{ mt: 1 }} fullWidth label="AI/Faculty comments" value={answer.comments || answer.aicomments || ""} onChange={(e) => setSelected((p) => ({ ...p, answers: p.answers.map((a) => a._id === answer._id ? { ...a, comments: e.target.value } : a) }))} /></Paper>)}
                </Stack> : <Alert severity="info">Select a submission to review answers, AI score descriptive answers and edit marks.</Alert>}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineExam2ReportPage() {
  const [examid, setExamid] = useState("");
  const [report, setReport] = useState({ data: [], summary: {}, charts: {} });
  const load = async () => {
    const res = await ep1.post(`${api}/report`, { colid: global1.colid, ...(examid ? { examid } : {}) });
    setReport(res.data || { data: [], summary: {}, charts: {} });
  };
  return (
    <MenuPageShell title="Online Examination 2 Report">
      <Box sx={{ p: 2, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}><Grid container spacing={2}><Grid item xs={12} md={6}><ExamSelect value={examid} onChange={setExamid} /></Grid><Grid item xs={12} md={2}><Button variant="contained" onClick={load}>Load</Button></Grid></Grid></Paper>
          <Grid container spacing={2}>{["attempts", "submitted", "graded", "average"].map((key) => <Grid item xs={12} md={3} key={key}><Card><CardContent><Typography textTransform="capitalize">{key}</Typography><Typography variant="h4">{Number(report.summary?.[key] || 0).toFixed(key === "average" ? 2 : 0)}</Typography></CardContent></Card></Grid>)}</Grid>
          <Paper sx={{ p: 2, height: 320 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={report.charts?.byExam || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="exam" /><YAxis /><Tooltip /><Legend /><Bar dataKey="attempts" fill="#2563eb" /><Bar dataKey="submitted" fill="#16a34a" /><Bar dataKey="graded" fill="#f97316" /></BarChart></ResponsiveContainer></Paper>
          <Paper sx={{ p: 2 }}><DataGrid autoHeight rows={rowsOf(report.data || [])} columns={[{ field: "examname", headerName: "Exam", width: 200 }, { field: "student", headerName: "Student", width: 180 }, { field: "regno", headerName: "Regno", width: 130 }, { field: "status", headerName: "Status", width: 120 }, { field: "marksobtained", headerName: "Marks", width: 100 }, { field: "totalmarks", headerName: "Total", width: 100 }, { field: "submittime", headerName: "Submitted", width: 180, valueGetter: ({ row }) => fmt(row.submittime) }]} slots={{ toolbar: GridToolbar }} /></Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
