import React, { useState } from "react";
import { Autocomplete, Button, Grid, IconButton, Stack, TextField, Typography, Alert } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import AiImageFieldExtractor from "./AiImageFieldExtractor";

const extractFields = [
  { name: "institution", label: "Institution" }, { name: "board", label: "Board / University" },
  { name: "passingyear", label: "Passing year" },
  { name: "marks", label: "Overall marks obtained" }, { name: "grade", label: "Overall grade" },
  { name: "subjects", label: "Subjectwise marks (subject, obtained, total, grade)", type: "json" }
];
export default function Crm2Education({ value = [], onChange, allowAi = true }) {
  const [level, setLevel] = useState("10th"), [error, setError] = useState("");
  const update = (index, patch) => onChange(value.map((record, i) => i === index ? { ...record, ...patch } : record));
  const apply = data => {
    try {
      const subjects = typeof data.subjects === "string" ? JSON.parse(data.subjects) : data.subjects;
      if (!level || !Array.isArray(subjects) || subjects.some(row => !row || typeof row !== "object" || !row.subject)) throw new Error("Review the subject rows and select an education level.");
      const record = { level, institution: data.institution || "", board: data.board || "", passingyear: data.passingyear || "", marks: data.marks ?? "", grade: data.grade || "", subjects };
      const index = value.findIndex(item => item.level === level);
      if (index >= 0 && !window.confirm(`Replace the existing ${level} education record with the reviewed extraction?`)) return;
      onChange(index >= 0 ? value.map((item, i) => i === index ? record : item) : [...value, record]);
      setError("");
    } catch (err) { setError(err.message || "Invalid subjectwise marks"); }
  };
  return <Grid item xs={12}><Stack spacing={2}>
    <Typography variant="h6">Subjectwise educational information</Typography>
    <Autocomplete freeSolo options={["10th", "12th", "Diploma", "Undergraduate", "Postgraduate", "Other"]} value={level} onInputChange={(_, next) => setLevel(next)} renderInput={params => <TextField {...params} label="Marksheet level" size="small" />} />
    {allowAi && <AiImageFieldExtractor key={level} title={`Extract ${level || "education"} marksheet`} fields={extractFields} context={`Extract only the ${level} marksheet. Return every subject separately. Do not guess unreadable marks.`} onApply={apply} />}
    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
    <Button startIcon={<Add />} disabled={!level} onClick={() => onChange([...value, { level, subjects: [] }])}>Add education record</Button>
    {value.map((record, index) => <Stack key={index} spacing={1} sx={{ borderTop: "1px solid #ddd", pt: 2 }}>
      <Stack direction="row" alignItems="center"><Typography variant="subtitle1" sx={{ flex: 1 }}>{record.level}</Typography><IconButton aria-label="Delete education record" onClick={() => onChange(value.filter((_, i) => i !== index))}><Delete /></IconButton></Stack>
      <Grid container spacing={1}>{["level", "institution", "board", "passingyear", "marks", "grade"].map(field => <Grid item xs={12} sm={field === "marks" || field === "grade" ? 6 : 3} key={field}><TextField size="small" fullWidth label={field === "passingyear" ? "Passing year" : field === "marks" ? "Overall marks obtained" : field === "grade" ? "Overall grade" : field} type={field === "marks" ? "number" : "text"} inputProps={field === "marks" ? { min: 0, step: "any" } : undefined} value={record[field] ?? ""} onChange={event => update(index, { [field]: event.target.value })} /></Grid>)}</Grid>
      {(record.subjects || []).map((row, subjectIndex) => <Stack key={subjectIndex} direction={{ xs: "column", sm: "row" }} spacing={1}>
        {["subject", "obtained", "total", "grade"].map(field => <TextField key={field} fullWidth size="small" label={field} type={["obtained", "total"].includes(field) ? "number" : "text"} value={row[field] ?? ""} onChange={event => update(index, { subjects: record.subjects.map((item, i) => i === subjectIndex ? { ...item, [field]: event.target.value } : item) })} />)}
        <IconButton aria-label="Delete subject" onClick={() => update(index, { subjects: record.subjects.filter((_, i) => i !== subjectIndex) })}><Delete /></IconButton>
      </Stack>)}
      <Button startIcon={<Add />} onClick={() => update(index, { subjects: [...(record.subjects || []), { subject: "", obtained: "", total: "", grade: "" }] })}>Add subject</Button>
    </Stack>)}
  </Stack></Grid>;
}
