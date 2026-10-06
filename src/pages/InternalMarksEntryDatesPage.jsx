import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankForm = { academicyear: "", regulation: "", exam: "", examcode: "", program: "", programcode: "", semester: "", startdate: "", enddate: "" };
const filterFields = ["academicyear", "regulation", "examcode", "programcode", "semester"];
const labels = { academicyear: "Academic Year", examcode: "Exam Code", programcode: "Program Code", startdate: "Start Date", enddate: "End Date" };
const text = (value) => String(value ?? "").trim();
const uniq = (items = []) => [...new Set(items.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const normalizeSelection = (selection) => Array.isArray(selection) ? selection : Array.from(selection?.ids || []);

export default function InternalMarksEntryDatesPage() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [exams, setExams] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState({ academicyear: "", regulation: "", examcode: "", programcode: "", semester: "" });
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPrograms = async (source = {}) => {
    try {
      const params = { colid: global1.colid };
      const year = source.academicyear || source.year;
      if (year) params.year = year;
      const res = await ep1.get("/api/v2/mprograms-management", { params });
      setPrograms(res.data?.data || []);
    } catch {
      setPrograms([]);
    }
  };

  const loadBase = async () => {
    try {
      const examRes = await ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } });
      setExams(examRes.data?.data || []);
      await loadPrograms();
    } catch {
      setExams([]);
      setPrograms([]);
    }
  };

  const loadRows = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      Object.entries(nextFilters).forEach(([field, value]) => { if (value) params[field] = value; });
      const res = await ep1.get("/api/v2/internal-marks-entry/dates", { params });
      setRows(res.data?.data || []);
      setSelectedIds([]);
      setOptions(res.data?.options || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load internal marks entry dates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBase(); }, []);

  const dynamicOptions = useMemo(() => {
    const merged = { ...options };
    filterFields.forEach((field) => {
      merged[field] = uniq([...(merged[field] || []), ...rows.map((row) => row[field])]);
    });
    return merged;
  }, [options, rows]);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await ep1.post("/api/v2/internal-marks-entry/dates", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Date range updated." : "Date range saved.");
      setForm(blankForm);
      setEditingId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save date range.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({ ...blankForm, ...row, startdate: row.startdate ? String(row.startdate).slice(0, 10) : "", enddate: row.enddate ? String(row.enddate).slice(0, 10) : "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this internal marks entry date range?")) return;
    await ep1.post("/api/v2/internal-marks-entry/dates-delete", { id: row._id, colid: global1.colid });
    setMessage("Deleted.");
    await loadRows();
  };

  const bulkDeleteSelected = async () => {
    if (!selectedIds.length) {
      setError("Please select at least one date range.");
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected date range${selectedIds.length === 1 ? "" : "s"}?`)) return;
    try {
      setSaving(true);
      for (const id of selectedIds) {
        await ep1.post("/api/v2/internal-marks-entry/dates-delete", { id, colid: global1.colid });
      }
      setMessage(`${selectedIds.length} selected date range${selectedIds.length === 1 ? "" : "s"} deleted.`);
      setSelectedIds([]);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete selected date ranges.");
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ academicyear: "2026-27", regulation: "R2026", exam: "Semester End Examination", examcode: "SEE-2026", program: "B.Com", programcode: "BCOM", semester: "1", startdate: "2026-10-01", enddate: "2026-10-10" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Internal Marks Dates");
    XLSX.writeFile(wb, "internal_marks_entry_dates_template.xlsx");
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const fileRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const res = await ep1.post("/api/v2/internal-marks-entry/dates-bulk", { colid: global1.colid, user: global1.user, rows: fileRows });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      setError((res.data?.errors || []).slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload date ranges.");
    } finally {
      setSaving(false);
    }
  };

  const selectExam = (exam) => {
    const next = {
      academicyear: exam?.academicyear || "",
      regulation: exam?.regulation || "",
      exam: exam?.examname || exam?.exam || "",
      examcode: exam?.examcode || "",
      program: "",
      programcode: ""
    };
    setForm((prev) => ({ ...prev, ...next }));
    loadPrograms(next);
  };
  const selectProgram = (program) => setForm((prev) => ({ ...prev, program: program?.program || "", programcode: program?.programcode || "" }));
  const updateAcademicContext = (field, value) => {
    const next = { ...form, [field]: value, program: "", programcode: "" };
    setForm(next);
    loadPrograms(next);
  };

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 100, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />, <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row)} />] },
    ...Object.keys(blankForm).map((field) => ({ field, headerName: labels[field] || field, width: ["program", "exam"].includes(field) ? 190 : 140 }))
  ];

  return (
    <MenuPageShell title="Internal marks entry dates">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={950}>Internal marks entry dates</Typography>
                <Typography color="text.secondary">Activate internal marks entry by academic year, exam, program and semester.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />} disabled={saving}>
                  Bulk Upload
                  <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} />
                </Button>
              </Stack>
            </Stack>
            {(loading || saving) && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><Autocomplete options={exams} getOptionLabel={(option) => `${option.examname || option.exam || ""} (${option.examcode || ""})`} value={exams.find((item) => item.examcode === form.examcode) || null} onChange={(_, value) => selectExam(value)} renderInput={(params) => <TextField {...params} label="Exam" />} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth label="Academic Year" value={form.academicyear} onChange={(e) => updateAcademicContext("academicyear", e.target.value)} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth label="Regulation" value={form.regulation} onChange={(e) => updateAcademicContext("regulation", e.target.value)} /></Grid>
              <Grid item xs={12} md={3}><Autocomplete options={programs} getOptionLabel={(option) => `${option.program || ""} (${option.programcode || ""})`} value={programs.find((item) => item.programcode === form.programcode) || null} onChange={(_, value) => selectProgram(value)} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth label="Program Code" value={form.programcode} onChange={(e) => setForm({ ...form, programcode: e.target.value })} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><TextField type="date" InputLabelProps={{ shrink: true }} fullWidth label="Start Date" value={form.startdate} onChange={(e) => setForm({ ...form, startdate: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><TextField type="date" InputLabelProps={{ shrink: true }} fullWidth label="End Date" value={form.enddate} onChange={(e) => setForm({ ...form, enddate: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<SaveIcon />} sx={{ height: 56 }} onClick={save} disabled={saving}>{editingId ? "Update" : "Save"}</Button></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => { setEditingId(""); setForm(blankForm); }}>Clear</Button></Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              {filterFields.map((field) => (
                <Grid item xs={12} md={2} key={field}>
                  <Autocomplete freeSolo options={dynamicOptions[field] || []} value={filters[field] || ""} onInputChange={(_, value) => setFilters((prev) => ({ ...prev, [field]: value }))} onChange={(_, value) => setFilters((prev) => ({ ...prev, [field]: value || "" }))} renderInput={(params) => <TextField {...params} size="small" label={labels[field] || field} />} />
                </Grid>
              ))}
              <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={() => loadRows()}>Load</Button></Grid>
              <Grid item xs={12} md={1.8}><Button fullWidth variant="outlined" color="error" sx={{ height: "100%" }} onClick={bulkDeleteSelected} disabled={!selectedIds.length || saving}>Delete Selected {selectedIds.length ? `(${selectedIds.length})` : ""}</Button></Grid>
            </Grid>
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row._id}
                loading={loading}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={(selection) => setSelectedIds(normalizeSelection(selection))}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "internal_marks_entry_dates" } } }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
