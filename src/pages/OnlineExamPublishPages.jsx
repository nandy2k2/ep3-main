import React, { useEffect, useMemo, useState } from "react";
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
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Delete, Download, Refresh, Save, UploadFile } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const emptyForm = { academicyear: "", examids: [], startdate: "", enddate: "", active: "Yes", remarks: "" };
const filterFields = ["academicyear", "examname", "examcode", "program", "programcode", "semester", "course", "coursecode", "active"];
const rowsOf = (rows = []) => rows.map((row) => ({ ...row, id: row._id }));
const unique = (items = []) => [...new Set(items.filter(Boolean))].sort();
const fmt = (value) => value ? new Date(value).toLocaleString() : "";
const inputDate = (value) => value ? String(value).slice(0, 16) : "";
const examLabel = (exam) => exam ? `${exam.examname || "-"} (${exam.examcode || "-"}) - ${exam.coursecode || ""} ${exam.course || ""}` : "";

function DynamicFilters({ filters, setFilters, options }) {
  const update = (index, patch) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  return (
    <Stack spacing={1}>
      {filters.map((filter, index) => (
        <Grid container spacing={1} key={`${filter.field}-${index}`}>
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={filterFields}
              value={filter.field || ""}
              onChange={(_, value) => update(index, { field: value || "", value: "" })}
              renderInput={(params) => <TextField {...params} label="Field" size="small" />}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField select fullWidth size="small" label="Operator" value={filter.operator || "contains"} onChange={(e) => update(index, { operator: e.target.value })}>
              <MenuItem value="contains">Contains</MenuItem>
              <MenuItem value="equals">Equals</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={5}>
            <Autocomplete
              freeSolo
              options={options?.[filter.field] || []}
              value={filter.value || ""}
              onInputChange={(_, value) => update(index, { value })}
              onChange={(_, value) => update(index, { value: value || "" })}
              renderInput={(params) => <TextField {...params} label="Value" size="small" />}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
          </Grid>
        </Grid>
      ))}
      <Box>
        <Button variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "examname", operator: "contains", value: "" }])}>Add filter</Button>
      </Box>
    </Stack>
  );
}

function ExamPublishBase({ admin = false }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [options, setOptions] = useState({ academicyears: [], filterValues: {} });
  const [exams, setExams] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState([{ field: "academicyear", operator: "equals", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedExams = useMemo(() => exams.filter((exam) => form.examids.includes(exam._id)), [exams, form.examids]);
  const academicYears = useMemo(() => unique([...(options.academicyears || []), ...exams.map((exam) => exam.academicyear), ...rows.map((row) => row.academicyear)]), [options, exams, rows]);

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/online-exam-publish/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };

  const loadExams = async (academicyear = form.academicyear) => {
    const res = await ep1.get("/api/v2/online-exam-publish/exam-options", { params: { colid: global1.colid, academicyear } });
    setExams(res.data?.data || []);
  };

  const loadRows = async () => {
    setLoading(true);
    setMessage("");
    try {
      const activeFilters = admin ? filters.filter((filter) => filter.value) : [];
      const res = admin
        ? await ep1.post("/api/v2/online-exam-publish/search", { colid: global1.colid, dynamicFilters: activeFilters })
        : await ep1.get("/api/v2/online-exam-publish", { params: { colid: global1.colid, academicyear: form.academicyear } });
      setRows(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadExams("");
  }, []);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "academicyear") {
      setForm((prev) => ({ ...prev, academicyear: value, examids: [] }));
      loadExams(value);
    }
  };

  const save = async () => {
    setLoading(true);
    setMessage("");
    try {
      await ep1.post("/api/v2/online-exam-publish", { ...form, id: editingId, colid: global1.colid, user: global1.user, username: global1.name });
      setMessage("Exam publish details saved.");
      setForm(emptyForm);
      setEditingId("");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({
      academicyear: row.academicyear || "",
      examids: [row.examid || ""].filter(Boolean).map(String),
      startdate: inputDate(row.startdate),
      enddate: inputDate(row.enddate),
      active: row.active || "Yes",
      remarks: row.remarks || ""
    });
    loadExams(row.academicyear || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async () => {
    if (!selectedRows.length) return setMessage("Select rows to delete.");
    setLoading(true);
    try {
      await ep1.post("/api/v2/online-exam-publish/delete", { colid: global1.colid, ids: selectedRows });
      setSelectedRows([]);
      await loadRows();
      setMessage("Selected publish records deleted.");
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ academicyear: "2026-27", examcode: "EXAM-001", examname: "Mid Term", startdate: "2026-10-01T09:00", enddate: "2026-10-10T23:59", active: "Yes", remarks: "" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ExamPublish");
    XLSX.writeFile(wb, "online_exam_publish_template.xlsx");
  };

  const bulkUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        const res = await ep1.post("/api/v2/online-exam-publish/bulk-upload", { colid: global1.colid, rows: sheetRows, user: global1.user, username: global1.name });
        setMessage(`Bulk upload completed. Saved ${res.data?.saved || 0}. ${(res.data?.errors || []).join(" ")}`);
        await Promise.all([loadOptions(), loadRows()]);
      } catch (error) {
        setMessage(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
        event.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <MenuPageShell title={admin ? "Exam publish admin" : "Exam publish"} subtitle="Publish online examination marks for a controlled date window.">
      <Stack spacing={2}>
        {message && <Alert severity={/error|failed|not/i.test(message) ? "error" : "info"}>{message}</Alert>}
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  freeSolo
                  options={academicYears}
                  value={form.academicyear || ""}
                  onInputChange={(_, value) => update("academicyear", value)}
                  onChange={(_, value) => update("academicyear", value || "")}
                  renderInput={(params) => <TextField {...params} label="Academic year" />}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={exams}
                  value={selectedExams}
                  getOptionLabel={examLabel}
                  onChange={(_, value) => update("examids", value.map((exam) => exam._id))}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox checked={selected} sx={{ mr: 1 }} />
                      {examLabel(option)}
                    </li>
                  )}
                  renderTags={(value, getTagProps) => value.map((option, index) => <Chip {...getTagProps({ index })} label={option.examname || option.examcode} size="small" />)}
                  renderInput={(params) => <TextField {...params} label="Online examination" />}
                />
              </Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="datetime-local" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate || ""} onChange={(e) => update("startdate", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="datetime-local" label="End date" InputLabelProps={{ shrink: true }} value={form.enddate || ""} onChange={(e) => update("enddate", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Active" value={form.active || "Yes"} onChange={(e) => update("active", e.target.value)}>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Remarks" value={form.remarks || ""} onChange={(e) => update("remarks", e.target.value)} /></Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button disabled={loading} variant="contained" startIcon={loading ? <CircularProgress size={16} /> : <Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button>
                  <Button disabled={loading} variant="outlined" startIcon={<Refresh />} onClick={loadRows}>Load</Button>
                  <Button disabled={loading} variant="outlined" onClick={() => { setEditingId(""); setForm(emptyForm); }}>New</Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {admin && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Dynamic filters</Typography>
              <DynamicFilters filters={filters} setFilters={setFilters} options={{ academicyear: academicYears, ...(options.filterValues || {}) }} />
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                <Button disabled={loading} variant="contained" onClick={loadRows}>Load filtered records</Button>
                <Button variant="outlined" startIcon={<Download />} onClick={downloadTemplate}>Template</Button>
                <Button variant="outlined" component="label" startIcon={<UploadFile />} disabled={loading}>Bulk upload<input hidden type="file" accept=".xlsx,.xls" onChange={bulkUpload} /></Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Paper sx={{ p: 1 }}>
          <Stack direction="row" spacing={1} mb={1}>
            <Button color="error" variant="outlined" disabled={loading || !selectedRows.length} startIcon={<Delete />} onClick={deleteRows}>Bulk delete</Button>
          </Stack>
          <DataGrid
            rows={rowsOf(rows)}
            columns={[
              { field: "academicyear", headerName: "Academic year", minWidth: 130 },
              { field: "examname", headerName: "Exam", minWidth: 180, flex: 1 },
              { field: "examcode", headerName: "Exam code", minWidth: 130 },
              { field: "programcode", headerName: "Program code", minWidth: 130 },
              { field: "coursecode", headerName: "Course code", minWidth: 130 },
              { field: "startdate", headerName: "Start date", minWidth: 180, renderCell: ({ row }) => fmt(row.startdate) },
              { field: "enddate", headerName: "End date", minWidth: 180, renderCell: ({ row }) => fmt(row.enddate) },
              { field: "active", headerName: "Active", minWidth: 100 },
              { field: "edit", headerName: "Edit", width: 100, sortable: false, renderCell: ({ row }) => <Button size="small" onClick={() => edit(row)}>Edit</Button> }
            ]}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "online_exam_publish" } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
          />
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function OnlineExamPublishPage() {
  return <ExamPublishBase />;
}

export function OnlineExamPublishAdminPage() {
  return <ExamPublishBase admin />;
}

function StudentOnlineExamMarksViewBase({
  title = "Marks view",
  subtitle = "View published online examination marks.",
  endpoint = "/api/v2/student-online-exam-marks"
}) {
  const [options, setOptions] = useState({ academicyears: [], exams: [], student: null });
  const [academicyear, setAcademicyear] = useState("");
  const [examid, setExamid] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const appearedExams = useMemo(() => (options.exams || []).filter((attempt) => !academicyear || attempt.academicyear === academicyear), [options.exams, academicyear]);
  const selectedExam = appearedExams.find((attempt) => String(attempt.examid) === String(examid));

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/student-online-exam-marks/options", {
      params: { colid: global1.colid, regno: global1.regno, email: global1.email, user: global1.user }
    });
    setOptions(res.data || {});
    const firstYear = res.data?.academicyears?.[0] || "";
    setAcademicyear((prev) => prev || firstYear);
  };

  useEffect(() => { loadOptions(); }, []);

  const loadMarks = async () => {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await ep1.get(endpoint, {
        params: { colid: global1.colid, regno: global1.regno, email: global1.email, user: global1.user, academicyear, examid }
      });
      if (!res.data?.published) {
        setMessage(res.data?.message || "Exam result is not published");
      } else {
        setResult(res.data);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title={title} subtitle={subtitle}>
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={options.academicyears || []}
                  value={academicyear || ""}
                  onChange={(_, value) => { setAcademicyear(value || ""); setExamid(""); setResult(null); }}
                  onInputChange={(_, value) => setAcademicyear(value || "")}
                  renderInput={(params) => <TextField {...params} label="Academic year" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={appearedExams}
                  value={selectedExam || null}
                  getOptionLabel={(attempt) => `${attempt.examname || attempt.exam?.examname || "-"} (${attempt.examcode || attempt.exam?.examcode || "-"}) - ${attempt.coursecode || attempt.exam?.coursecode || ""}`}
                  onChange={(_, value) => { setExamid(value?.examid || ""); setResult(null); }}
                  renderInput={(params) => <TextField {...params} label="Online examination appeared" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth disabled={loading || !academicyear || !examid} variant="contained" onClick={loadMarks}>
                  {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null} Load
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {message && <Alert severity="warning">{message}</Alert>}

        {result?.published && (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Total score</Typography><Typography variant="h4">{result.summary?.totalScore} / {result.summary?.totalMarks}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Percentage</Typography><Typography variant="h4">{result.summary?.percentage}%</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Status</Typography><Typography variant="h4">{result.summary?.status || "-"}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Submitted</Typography><Typography variant="h6">{fmt(result.summary?.submittedAt) || "-"}</Typography></CardContent></Card></Grid>
            </Grid>
            {result.summary?.comments && <Alert severity="info">Overall comments: {result.summary.comments}</Alert>}
            <Paper sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom>Sectionwise score</Typography>
              <DataGrid
                rows={(result.sectionwise || []).map((row, index) => ({ ...row, id: index + 1 }))}
                columns={[
                  { field: "sectionname", headerName: "Section", flex: 1, minWidth: 200 },
                  { field: "questions", headerName: "Questions", minWidth: 110 },
                  { field: "score", headerName: "Score", minWidth: 110 },
                  { field: "total", headerName: "Total", minWidth: 110 },
                  { field: "percentage", headerName: "Percentage", minWidth: 130 }
                ]}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
              />
            </Paper>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom>Questionwise score</Typography>
              <DataGrid
                rows={result.questionwise || []}
                columns={[
                  { field: "sectionname", headerName: "Section", minWidth: 160 },
                  { field: "questiontext", headerName: "Question", minWidth: 260, flex: 1 },
                  { field: "questiontype", headerName: "Type", minWidth: 120 },
                  { field: "conumber", headerName: "CO No", minWidth: 110 },
                  { field: "co", headerName: "CO", minWidth: 180 },
                  { field: "bloomlevels", headerName: "Bloom Taxonomy", minWidth: 190, valueGetter: (params) => (params.row?.bloomlevels || []).join(", ") },
                  { field: "selectedoptiontext", headerName: "Selected option", minWidth: 180 },
                  { field: "answertext", headerName: "Answer", minWidth: 220 },
                  { field: "marksobtained", headerName: "Marks", minWidth: 100 },
                  { field: "maxmarks", headerName: "Max", minWidth: 90 },
                  { field: "comments", headerName: "Comments", minWidth: 220 },
                  { field: "aicomments", headerName: "AI comments", minWidth: 220 }
                ]}
                autoHeight
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "online_exam_marks_view" } } }}
                pageSizeOptions={[10, 25, 50, 100]}
                sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, py: 1 } }}
              />
            </Paper>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom>Bloom taxonomy summary</Typography>
              <DataGrid
                rows={(result.bloomwise || []).map((row, index) => ({ ...row, id: index + 1 }))}
                columns={[
                  { field: "bloomlevel", headerName: "Bloom taxonomy", flex: 1, minWidth: 220 },
                  { field: "questions", headerName: "Questions", minWidth: 120 },
                  { field: "score", headerName: "Score", minWidth: 120 },
                  { field: "total", headerName: "Total", minWidth: 120 },
                  { field: "percentage", headerName: "Percentage score", minWidth: 160, valueFormatter: (params) => `${params.value || 0}%` }
                ]}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
              />
            </Paper>
          </>
        )}
      </Stack>
    </MenuPageShell>
  );
}

export function StudentOnlineExamMarksViewPage() {
  return <StudentOnlineExamMarksViewBase />;
}

export function StudentOnlineExamMarksMappedViewPage() {
  return (
    <StudentOnlineExamMarksViewBase
      title="Marks view CO Bloom"
      subtitle="View published online examination marks with CO and Bloom taxonomy recovered from the original question paper."
      endpoint="/api/v2/student-online-exam-marks-from-questions"
    />
  );
}
