import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Delete, Download, Edit, Refresh, Save, Send, UploadFile } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankWorkflow = {
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  semester: "",
  course: "",
  coursecode: "",
  componenttype: "",
  assessmentcomponent: "",
  level: 1,
  approvername: "",
  approveremail: "",
  active: "Yes",
  remarks: ""
};
const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const userLabel = (row) => row ? `${row.name || row.email || ""}${row.email ? ` (${row.email})` : ""}` : "";
const courseLabel = (row) => row ? `${row.course || ""}${row.coursecode ? ` (${row.coursecode})` : ""}` : "";
const normalIds = (selection) => Array.isArray(selection) ? selection : Array.from(selection?.ids || []);
const gridSx = {
  "& .MuiDataGrid-cell": { alignItems: "flex-start", whiteSpace: "normal", py: 1 },
  "& .MuiDataGrid-cellContent": { whiteSpace: "normal" }
};

export function InternalMarksApprovalWorkflowPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankWorkflow);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [options, setOptions] = useState({ users: [], filters: {} });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedUser = useMemo(() => (options.users || []).find((row) => row.email === form.approveremail) || null, [options.users, form.approveremail]);
  const componentRows = useMemo(() => options.components || [], [options.components]);
  const matchesCurrentScope = (row, fields = ["academicyear", "regulation", "programcode", "semester"]) => fields.every((field) => !form[field] || String(row[field] || "") === String(form[field] || ""));
  const courseOptions = useMemo(() => {
    const map = new Map();
    componentRows.filter((row) => matchesCurrentScope(row)).forEach((row) => {
      const key = `${row.coursecode || ""}||${row.course || ""}`;
      if (!map.has(key)) map.set(key, { course: row.course || "", coursecode: row.coursecode || "", program: row.program || "", programcode: row.programcode || "", regulation: row.regulation || "", semester: row.semester || "", academicyear: row.academicyear || "" });
    });
    return [...map.values()].sort((a, b) => courseLabel(a).localeCompare(courseLabel(b), undefined, { numeric: true }));
  }, [componentRows, form.academicyear, form.regulation, form.programcode, form.semester]);
  const selectedCourse = useMemo(() => courseOptions.find((row) => row.coursecode === form.coursecode && row.course === form.course) || null, [courseOptions, form.coursecode, form.course]);
  const assessmentOptions = useMemo(() => uniqueSorted(componentRows
    .filter((row) => matchesCurrentScope(row, ["academicyear", "regulation", "programcode", "semester", "coursecode", "componenttype"]))
    .map((row) => row.assessmentcomponent)), [componentRows, form.academicyear, form.regulation, form.programcode, form.semester, form.coursecode, form.componenttype]);

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/internal-marks-approval/options", { params: { colid: global1.colid } });
    setOptions(res.data || { users: [], filters: {} });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/internal-marks-approval/workflow", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load workflow.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOptions(); load(); }, []);

  const setField = (field, value) => setForm((prev) => {
    const next = { ...prev, [field]: value ?? "" };
    if (["academicyear", "regulation", "program", "programcode", "semester"].includes(field)) {
      Object.assign(next, { course: "", coursecode: "", assessmentcomponent: "" });
    }
    if (field === "componenttype") next.assessmentcomponent = "";
    return next;
  });

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/internal-marks-approval/workflow", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(`Workflow level saved for ${res.data?.data?.approveremail || form.approveremail}.`);
      setEditingId("");
      setForm(blankWorkflow);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save workflow.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRows = async (ids) => {
    if (!ids.length) return;
    setSaving(true);
    setError("");
    try {
      await ep1.post("/api/v2/internal-marks-approval/workflow-delete", { colid: global1.colid, ids });
      setSelected([]);
      await load();
      setMessage("Selected workflow row(s) deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete workflow rows.");
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ ...blankWorkflow, academicyear: "2026-27", program: "MCA", programcode: "MCA", semester: "1", course: "Course name", coursecode: "C101", level: 1, approvername: "Approver", approveremail: "approver@example.com" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow");
    XLSX.writeFile(wb, "internal_marks_approval_workflow_template.xlsx");
  };

  const uploadBulk = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rowsToUpload = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const res = await ep1.post("/api/v2/internal-marks-approval/workflow-bulk", { colid: global1.colid, user: global1.user, rows: rowsToUpload });
      setMessage(`Uploaded ${res.data?.saved || 0} workflow row(s).`);
      if (res.data?.errors?.length) setError(res.data.errors.slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(" | "));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to bulk upload workflow.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic year", width: 130 },
    { field: "regulation", headerName: "Regulation", width: 130 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course code", width: 130 },
    { field: "componenttype", headerName: "Component type", width: 140 },
    { field: "assessmentcomponent", headerName: "Assessment component", width: 190 },
    { field: "level", headerName: "Level", width: 90 },
    { field: "approvername", headerName: "Approver", width: 190 },
    { field: "approveremail", headerName: "Approver email", width: 230 },
    { field: "active", headerName: "Active", width: 90 },
    {
      field: "actions",
      type: "actions",
      width: 110,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...blankWorkflow, ...row }); }} />,
        <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRows([row._id])} />
      ]
    }
  ];

  return (
    <MenuPageShell title="Internal marks approval workflow" subtitle="Define dynamic user-wise levels for internal marks approval. Blank academic fields work as wildcards.">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        <Card><CardContent>
          <Grid container spacing={2}>
            {["academicyear", "regulation", "program", "programcode", "semester", "componenttype"].map((field) => (
              <Grid item xs={12} md={field === "course" || field === "assessmentcomponent" ? 3 : 2} key={field}>
                <Autocomplete
                  freeSolo
                  options={uniqueSorted([...(options.filters?.[field] || []), ...rows.map((row) => row[field])])}
                  value={form[field] || ""}
                  onInputChange={(_, value) => setField(field, value)}
                  onChange={(_, value) => setField(field, value)}
                  renderInput={(params) => <TextField {...params} size="small" label={field} />}
                />
              </Grid>
            ))}
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={courseOptions}
                value={selectedCourse}
                getOptionLabel={courseLabel}
                onChange={(_, value) => setForm((prev) => ({
                  ...prev,
                  academicyear: value?.academicyear || prev.academicyear,
                  regulation: value?.regulation || prev.regulation,
                  program: value?.program || prev.program,
                  programcode: value?.programcode || prev.programcode,
                  semester: value?.semester || prev.semester,
                  course: value?.course || "",
                  coursecode: value?.coursecode || "",
                  assessmentcomponent: ""
                }))}
                renderInput={(params) => <TextField {...params} size="small" label="Course" placeholder="Select course" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth size="small" label="Course code" value={form.coursecode || ""} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={assessmentOptions}
                value={form.assessmentcomponent || ""}
                onChange={(_, value) => setField("assessmentcomponent", value || "")}
                renderInput={(params) => <TextField {...params} size="small" label="Assessment component" placeholder="Select assessment component" />}
              />
            </Grid>
            <Grid item xs={12} md={1.5}><TextField fullWidth size="small" type="number" label="Level" value={form.level || 1} onChange={(e) => setField("level", e.target.value)} /></Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={options.users || []}
                value={selectedUser}
                getOptionLabel={userLabel}
                onChange={(_, value) => setForm((prev) => ({ ...prev, approvername: value?.name || "", approveremail: value?.email || "" }))}
                renderInput={(params) => <TextField {...params} size="small" label="Approver" />}
              />
            </Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Active" value={form.active || "Yes"} onChange={(e) => setField("active", e.target.value)}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Remarks" value={form.remarks || ""} onChange={(e) => setField("remarks", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Save />} disabled={saving} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid>
          </Grid>
        </CardContent></Card>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Load</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={downloadTemplate}>Template</Button>
          <Button component="label" variant="outlined" startIcon={<UploadFile />}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadBulk} /></Button>
          <Button variant="outlined" color="error" startIcon={<Delete />} disabled={!selected.length || saving} onClick={() => deleteRows(selected)}>Bulk delete</Button>
        </Stack>
        <Paper sx={{ p: 1 }}>
          <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading || saving} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(model) => setSelected(normalIds(model))} autoHeight getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} />
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function InternalMarksApprovalPage() {
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async (nextTab = tab) => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/internal-marks-approval/requests", {
        params: {
          colid: global1.colid,
          user: global1.user,
          mode: nextTab === "pending" ? "pending" : "",
          approvalstatus: nextTab === "pending" ? "" : nextTab
        }
      });
      setRows(res.data?.data || []);
      setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approval requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load("pending"); }, []);

  const decide = async (action) => {
    if (!selected?._id) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/internal-marks-approval/decision", {
        colid: global1.colid,
        id: selected._id,
        action,
        comments,
        user: global1.user,
        username: global1.name,
        role: global1.role
      });
      setMessage(res.data?.message || `Request ${action.toLowerCase()}.`);
      setComments("");
      await load(tab);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action.toLowerCase()} request.`);
    } finally {
      setWorking(false);
    }
  };

  const requestColumns = [
    { field: "requestno", headerName: "Request no", width: 190 },
    { field: "approvalstatus", headerName: "Status", width: 120, renderCell: ({ value }) => <Chip size="small" label={value || "Pending"} color={value === "Approved" ? "success" : value === "Rejected" ? "error" : "warning"} /> },
    { field: "currentlevel", headerName: "Level", width: 90 },
    { field: "currentapproveremail", headerName: "Current approver", width: 230 },
    { field: "submittedbyname", headerName: "Submitted by", width: 180 },
    { field: "submitteddate", headerName: "Submitted date", width: 140 },
    { field: "academicyear", headerName: "Academic year", width: 130 },
    { field: "examcode", headerName: "Exam code", width: 130 },
    { field: "program", headerName: "Program", width: 170 },
    { field: "programcode", headerName: "Program code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course code", width: 130 },
    { field: "assessmentcomponent", headerName: "Assessment component", width: 190 },
    { field: "markscount", headerName: "Rows", width: 90 }
  ];
  const marksColumns = [
    { field: "student", headerName: "Student", width: 210 },
    { field: "regno", headerName: "Reg no", width: 140 },
    { field: "attendance", headerName: "Attendance", width: 120 },
    { field: "rawmarks", headerName: "Entered", width: 110 },
    { field: "marksobtained", headerName: "Weighted", width: 120 },
    { field: "maxmarks", headerName: "Max marks", width: 110 },
    { field: "passstatus", headerName: "Pass status", width: 120 },
    { field: "approvalstatus", headerName: "Approval status", width: 140 }
  ];

  return (
    <MenuPageShell title="Internal marks approval" subtitle="Approve or reject submitted internal marks. Approved marks are stored with final approval status in the marks database.">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        <Paper sx={{ p: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Tabs value={tab} onChange={(_, value) => { setTab(value); load(value); }}>
              <Tab label="Pending for me" value="pending" />
              <Tab label="Approved" value="Approved" />
              <Tab label="Rejected" value="Rejected" />
              <Tab label="All pending" value="Pending" />
            </Tabs>
            <Button startIcon={loading ? <CircularProgress size={16} /> : <Refresh />} onClick={() => load(tab)}>Load</Button>
          </Stack>
          <Box sx={{ height: 420, width: "100%" }}>
            <DataGrid rows={rows} columns={requestColumns} getRowId={(row) => row._id} loading={loading} onRowClick={({ row }) => setSelected(row)} getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} />
          </Box>
        </Paper>
        {selected && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Request: ${selected.requestno}`} color="primary" />
                  <Chip label={`Status: ${selected.approvalstatus}`} />
                  <Chip label={`Course: ${selected.coursecode} - ${selected.course}`} />
                  <Chip label={`Component: ${selected.assessmentcomponent}`} />
                  <Chip label={`Rows: ${selected.markscount || 0}`} />
                </Stack>
                <TextField fullWidth multiline minRows={2} label="Approval comments" value={comments} onChange={(e) => setComments(e.target.value)} />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" color="success" startIcon={working ? <CircularProgress size={16} /> : <Send />} disabled={working || selected.approvalstatus !== "Pending"} onClick={() => decide("Approved")}>Approve / Forward</Button>
                  <Button variant="outlined" color="error" disabled={working || selected.approvalstatus !== "Pending"} onClick={() => decide("Rejected")}>Reject</Button>
                </Stack>
                <Typography variant="h6">Marks details</Typography>
                <Box sx={{ height: 360, width: "100%" }}>
                  <DataGrid rows={selected.marks || []} columns={marksColumns} getRowId={(row) => row._id} getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </MenuPageShell>
  );
}
