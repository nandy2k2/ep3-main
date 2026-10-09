import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  MenuItem,
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

const blankForm = {
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  semester: "",
  student: "",
  regno: "",
  email: "",
  course: "",
  coursecode: "",
  credit: "",
  type: "",
  internalmax: "",
  internalobtained: "",
  internalpercentage: "",
  internalgrade: "",
  internalstatus: "",
  externalmax: "",
  externalobtained: "",
  externalpercentage: "",
  externalgrade: "",
  externalstatus: "",
  totalmax: "",
  totalobtained: "",
  totalpercentage: "",
  totalgrade: "",
  totalstatus: "",
  gpa: ""
};

const fields = Object.keys(blankForm);
const numberFields = ["credit", "internalmax", "internalobtained", "internalpercentage", "externalmax", "externalobtained", "externalpercentage", "totalmax", "totalobtained", "totalpercentage", "gpa"];
const filterFields = ["academicyear", "regulation", "programcode", "semester", "coursecode", "regno", "type", "internalstatus", "externalstatus", "totalstatus"];
const labels = {
  academicyear: "Academic Year",
  programcode: "Program Code",
  regno: "Reg No",
  coursecode: "Course Code",
  type: "Type",
  internalmax: "Internal Max",
  internalobtained: "Internal Obtained",
  internalpercentage: "Internal %",
  internalgrade: "Internal Grade",
  internalstatus: "Internal Status",
  externalmax: "External Max",
  externalobtained: "External Obtained",
  externalpercentage: "External %",
  externalgrade: "External Grade",
  externalstatus: "External Status",
  totalmax: "Total Max",
  totalobtained: "Total Obtained",
  totalpercentage: "Total %",
  totalgrade: "Total Grade",
  totalstatus: "Total Status"
};

const text = (value) => String(value ?? "").trim();
const pct = (obtained, total) => Number(total) ? Number(((Number(obtained || 0) / Number(total || 0)) * 100).toFixed(2)) : 0;
const blankFilters = Object.fromEntries(filterFields.map((field) => [field, ""]));

export default function ExamModel2ScoreTypeMarksPage() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState(blankFilters);
  const [selection, setSelection] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingTarget, setProcessingTarget] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadRows(); loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const res = await ep1.get("/api/v2/examination-model2/grading-templates", { params: { colid: global1.colid } });
      setTemplates(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load grading templates.");
    }
  };

  const loadRows = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      Object.entries(nextFilters).forEach(([key, value]) => { if (value) params[key] = value; });
      const res = await ep1.get("/api/v2/examination-model2/scoretype-marks", { params });
      setRows(res.data?.data || []);
      setOptions(res.data?.options || {});
      setSelection([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load score type marks.");
    } finally {
      setLoading(false);
    }
  };

  const dynamicOptions = useMemo(() => {
    const merged = { ...options };
    fields.forEach((field) => {
      merged[field] = [...new Set([...(merged[field] || []), ...rows.map((row) => row[field])].map(text).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });
    return merged;
  }, [rows, options]);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      const internalmax = Number(next.internalmax || 0);
      const internalobtained = Number(next.internalobtained || 0);
      const externalmax = Number(next.externalmax || 0);
      const externalobtained = Number(next.externalobtained || 0);
      if (["internalmax", "internalobtained"].includes(field)) next.internalpercentage = pct(internalobtained, internalmax);
      if (["externalmax", "externalobtained"].includes(field)) next.externalpercentage = pct(externalobtained, externalmax);
      if (["internalmax", "internalobtained", "externalmax", "externalobtained"].includes(field)) {
        next.totalmax = internalmax + externalmax;
        next.totalobtained = internalobtained + externalobtained;
        next.totalpercentage = pct(next.totalobtained, next.totalmax);
      }
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await ep1.post("/api/v2/examination-model2/scoretype-marks", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Score type marks updated." : "Score type marks saved.");
      setEditingId("");
      setForm(blankForm);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save score type marks.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({ ...blankForm, ...row });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (payload) => {
    const ids = Array.isArray(payload) ? payload : [payload?._id].filter(Boolean);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} score type marks entr${ids.length === 1 ? "y" : "ies"}?`)) return;
    await ep1.post("/api/v2/examination-model2/scoretype-marks-delete", { ids, colid: global1.colid });
    setMessage(`Deleted ${ids.length} row${ids.length === 1 ? "" : "s"}.`);
    await loadRows();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      ...blankForm,
      academicyear: "2026-27",
      regulation: "R2026",
      program: "MCA",
      programcode: "MCA",
      semester: "1",
      student: "Student Name",
      regno: "REG001",
      email: "student@example.com",
      course: "Programming",
      coursecode: "MCA101",
      credit: 4,
      type: "Theory",
      internalmax: 30,
      internalobtained: 24,
      internalpercentage: 80,
      internalstatus: "Pass",
      externalmax: 70,
      externalobtained: 55,
      externalpercentage: 78.57,
      externalstatus: "Pass",
      totalmax: 100,
      totalobtained: 79,
      totalpercentage: 79,
      totalstatus: "Pass"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Score Type Marks");
    XLSX.writeFile(wb, "score_type_marks_template.xlsx");
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      setError("");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const fileRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const res = await ep1.post("/api/v2/examination-model2/scoretype-marks-bulk", { colid: global1.colid, user: global1.user, rows: fileRows });
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}`);
      setError((res.data?.errors || []).slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload score type marks.");
    } finally {
      setSaving(false);
    }
  };

  const processGrade = async (target) => {
    if (!selectedTemplate?._id) {
      setError("Select a grading template first.");
      return;
    }
    try {
      setProcessingTarget(target);
      setError("");
      setMessage("");
      const payload = {
        ...filters,
        colid: global1.colid,
        user: global1.user,
        templateid: selectedTemplate._id,
        target,
        ids: selection
      };
      const res = await ep1.post("/api/v2/examination-model2/scoretype-marks-process-grade", payload);
      const errors = res.data?.errors || [];
      setMessage(`${target[0].toUpperCase()}${target.slice(1)} grade/status updated. Rows: ${res.data?.updated || 0}`);
      if (errors.length) setError(errors.slice(0, 5).map((item) => `${item.key || "Row"}: ${item.message}`).join(" | "));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to update ${target} grade/status.`);
    } finally {
      setProcessingTarget("");
    }
  };

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 100, getActions: (params) => [
      <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />,
      <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row)} />
    ] },
    ...fields.map((field) => ({
      field,
      headerName: labels[field] || field,
      width: ["student", "email", "course", "program"].includes(field) ? 180 : 135,
      type: numberFields.includes(field) ? "number" : "string"
    }))
  ];

  return (
    <MenuPageShell title="Score type Marks">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={950}>Score type Marks</Typography>
                <Typography color="text.secondary">CRUD and bulk upload for internal, external and total score type marks.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />} disabled={saving}>
                  Bulk Upload
                  <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} />
                </Button>
                <Button color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={!selection.length || saving} onClick={() => remove(selection)}>Bulk Delete</Button>
              </Stack>
            </Stack>
            {(loading || saving || processingTarget) && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}

          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Process Grade and Status</Typography>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={templates}
                  value={selectedTemplate}
                  onChange={(_, value) => setSelectedTemplate(value)}
                  getOptionLabel={(option) => `${option.templatedescription || "Template"}${option.academicyear ? ` (${option.academicyear})` : ""}`}
                  isOptionEqualToValue={(option, value) => option._id === value?._id}
                  renderInput={(params) => <TextField {...params} size="small" label="Viva grading template" />}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" disabled={!selectedTemplate || !!processingTarget} onClick={() => processGrade("internal")}>{processingTarget === "internal" ? "Updating..." : "Update Internal"}</Button>
                  <Button variant="contained" disabled={!selectedTemplate || !!processingTarget} onClick={() => processGrade("external")}>{processingTarget === "external" ? "Updating..." : "Update External"}</Button>
                  <Button variant="contained" disabled={!selectedTemplate || !!processingTarget} onClick={() => processGrade("total")}>{processingTarget === "total" ? "Updating..." : "Update Total"}</Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">If rows are selected, only selected rows are updated. Otherwise the current filters are used.</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              {fields.map((field) => (
                <Grid item xs={12} md={["student", "email", "course", "program"].includes(field) ? 3 : 1.5} key={field}>
                  <TextField
                    fullWidth
                    size="small"
                    select={["type", "internalstatus", "externalstatus", "totalstatus"].includes(field)}
                    type={numberFields.includes(field) ? "number" : "text"}
                    label={labels[field] || field}
                    value={form[field] ?? ""}
                    onChange={(e) => setField(field, e.target.value)}
                  >
                    {field === "type" && ["Theory", "Practical", "Viva"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    {["internalstatus", "externalstatus", "totalstatus"].includes(field) && ["", "Pass", "Fail"].map((item) => <MenuItem key={item || "blank"} value={item}>{item || "Blank"}</MenuItem>)}
                  </TextField>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</Button>
                  <Button variant="outlined" onClick={() => { setEditingId(""); setForm(blankForm); }}>Clear</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              {filterFields.map((field) => (
                <Grid item xs={12} md={1.5} key={field}>
                  <TextField select fullWidth size="small" label={labels[field] || field} value={filters[field]} onChange={(e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }))}>
                    <MenuItem value="">All</MenuItem>
                    {(dynamicOptions[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                </Grid>
              ))}
              <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={() => loadRows()}>Apply</Button></Grid>
            </Grid>
            <Box sx={{ height: 650, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row._id}
                loading={loading}
                checkboxSelection
                rowSelectionModel={selection}
                onRowSelectionModelChange={(model) => {
                  if (Array.isArray(model)) setSelection(model);
                  else if (model?.ids instanceof Set) setSelection(model.type === "exclude" ? rows.map((row) => row._id).filter((id) => !model.ids.has(id)) : [...model.ids]);
                }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "score_type_marks" } } }}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                disableRowSelectionOnClick
              />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
