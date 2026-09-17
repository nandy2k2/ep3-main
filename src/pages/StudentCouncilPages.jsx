import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
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
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name, role: global1.role });
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};
const instName = (institution = {}) => institution.institutionname || institution.insname || institution.name || global1.insname || "Institution";
const instAddress = (institution = {}) => institution.address || institution.address1 || global1.address || "";
const instLogo = (institution = {}) => institution.logolink || institution.logo || institution.inslogo || global1.logo || "";

function parseCsv(value) {
  const lines = String(value || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function exportTemplate(filename, fields = []) {
  const csv = [fields.map(csvEscape).join(","), fields.map(() => "").join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function printHtml(title, institution, body) {
  const win = window.open("", "_blank", "width=950,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;color:#000;background:#fff;margin:0}
    .tools{padding:12px;border-bottom:1px solid #ddd}
    .print-area{padding:18mm}
    .head{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:16px}
    .logo{height:58px;object-fit:contain}
    h1{font-size:20px;margin:4px 0;font-weight:800}
    h2{font-size:16px;margin:8px 0 0;text-transform:uppercase}
    h3{font-size:14px;margin:14px 0 6px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #000;padding:6px;font-size:12px;vertical-align:top;text-align:left}
    th{background:#f3f4f6}
    .meta{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px}
    .card{border:1px solid #111;padding:10px;margin:10px 0;break-inside:avoid}
    @media print{.tools{display:none}.print-area{padding:8mm}@page{size:A4 portrait;margin:10mm}tr,.card{break-inside:avoid}thead{display:table-header-group}}
  </style></head><body><div class="tools"><button onclick="window.print()">Print</button> <button onclick="window.close()">Close</button></div><div class="print-area">
    <div class="head">${instLogo(institution) ? `<img class="logo" src="${instLogo(institution)}" alt="logo" />` : ""}<h1>${instName(institution)}</h1><div>${instAddress(institution)}</div><h2>${title}</h2></div>${body}</div></body></html>`);
  win.document.close();
}

function Message({ message, error, setMessage, setError }) {
  return (
    <>
      {message && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>{error}</Alert>}
    </>
  );
}

function SearchFilters({ fields, filters, setFilters, options, onLoad, loading }) {
  const add = () => setFilters((prev) => [...prev, { field: fields[0], value: "" }]);
  const update = (index, patch) => setFilters((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const valuesFor = (field) => {
    if (field === "academicyear") return options.academicyears || [];
    if (field === "regulation") return options.regulations || [];
    if (field === "program") return options.programs || [];
    if (field === "programcode") return options.programcodes || [];
    if (field === "semester") return options.semesters || [];
    if (field === "section") return options.sections || [];
    if (field === "position") return options.positions || [];
    if (field === "status") return ["Active", "Inactive"];
    return [];
  };
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Typography fontWeight={900}>Dynamic filters</Typography>
        <Button size="small" variant="outlined" onClick={add} disabled={loading}>Add filter</Button>
        <Button size="small" variant="contained" onClick={onLoad} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
      </Stack>
      <Grid container spacing={1}>
        {filters.map((filter, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} md={3}><Autocomplete options={fields} value={filter.field || ""} onChange={(_, value) => update(index, { field: value || fields[0], value: "" })} renderInput={(params) => <TextField {...params} size="small" label="Field" />} /></Grid>
            <Grid item xs={12} md={7}><Autocomplete freeSolo options={valuesFor(filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(index, { value })} renderInput={(params) => <TextField {...params} size="small" label="Value" />} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))} disabled={loading}>Remove</Button></Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Paper>
  );
}

function CouncilAutocomplete({ options, academicyear, value, onChange, label = "Council" }) {
  const rows = (options.councils || []).filter((row) => !academicyear || row.academicyear === academicyear);
  return (
    <Autocomplete
      options={rows}
      value={rows.find((item) => item._id === value) || null}
      getOptionLabel={(item) => item.label || item.councilname || ""}
      onChange={(_, item) => onChange(item || null)}
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
    />
  );
}

function AwsUploader({ value, onChange, folder = "student-council", disabled, setMessage, setError }) {
  const [progress, setProgress] = useState(0);
  const upload = async (file) => {
    if (!file) return;
    try {
      setProgress(5);
      const data = new FormData();
      data.append("file", file);
      data.append("colid", global1.colid);
      data.append("user", global1.user || "");
      data.append("folder", folder);
      data.append("description", `Student Council file ${file.name}`);
      const uploadRes = await ep1.post("/api/v2/aws-file-library/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
        }
      });
      const url = uploadRes.data?.url || "";
      if (!url) throw new Error("AWS upload did not return a file link");
      onChange(url, file.name);
      setMessage?.("File uploaded");
      setProgress(100);
      setTimeout(() => setProgress(0), 900);
    } catch (err) {
      setError?.(err.response?.data?.message || err.message || "Unable to upload file");
      setProgress(0);
    }
  };
  return (
    <Stack spacing={1}>
      <Button component="label" startIcon={<UploadFileIcon />} variant="outlined" disabled={disabled}>
        Upload through AWS
        <input hidden type="file" onChange={(event) => upload(event.target.files?.[0])} />
      </Button>
      {progress > 0 && <LinearProgress variant="determinate" value={progress} />}
      <TextField size="small" label="File link" value={value || ""} onChange={(event) => onChange(event.target.value, "")} fullWidth />
    </Stack>
  );
}

const councilBlank = { academicyear: "", councilname: "", startdate: "", enddate: "", status: "Active" };
const councilFields = ["academicyear", "councilname", "startdate", "enddate", "status"];

export function StudentCouncilPage() {
  const [form, setForm] = useState(councilBlank);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [options, setOptions] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/student-council/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const params = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/student-council/councils", { params: params() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load councils");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/student-council/councils", withScope({ ...form, id: editId }));
      setMessage(editId ? "Student council updated" : "Student council saved");
      setForm(councilBlank);
      setEditId("");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save council");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    if (!window.confirm("Delete selected councils and their members/meetings?")) return;
    setLoading(true);
    try {
      await ep1.post("/api/v2/student-council/councils/delete", withScope({ ids: selected }));
      setSelected([]);
      setMessage("Selected councils deleted");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete councils");
    } finally {
      setLoading(false);
    }
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const content = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(content) : parseCsv(content);
      await ep1.post("/api/v2/student-council/councils/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Bulk upload failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const columns = [
    ...councilFields.map((field) => ({ field, headerName: field, minWidth: 145, flex: field === "councilname" ? 1 : 0 })),
    { field: "actions", type: "actions", width: 80, getActions: ({ row }) => [<GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...councilBlank, ...row, startdate: dateOnly(row.startdate), enddate: dateOnly(row.enddate) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ];

  return (
    <MenuPageShell title="Student Council">
      <Message message={message} error={error} setMessage={setMessage} setError={setError} />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear} onInputChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value }))} renderInput={(params) => <TextField {...params} size="small" label="Academic year" />} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Council name" value={form.councilname} onChange={(e) => setForm((prev) => ({ ...prev, councilname: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((prev) => ({ ...prev, startdate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="End date" InputLabelProps={{ shrink: true }} value={form.enddate} onChange={(e) => setForm((prev) => ({ ...prev, enddate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={1}><Autocomplete options={["Active", "Inactive"]} value={form.status} onChange={(_, value) => setForm((prev) => ({ ...prev, status: value || "Active" }))} renderInput={(params) => <TextField {...params} size="small" label="Status" />} /></Grid>
          <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={save} disabled={loading}>{loading ? "Saving..." : editId ? "Update" : "Save"}</Button><Button variant="outlined" onClick={() => { setForm(councilBlank); setEditId(""); }} disabled={loading}>Clear</Button><Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportTemplate("student-council-template.csv", councilFields)}>Template</Button><Button component="label" startIcon={<UploadFileIcon />} variant="outlined" disabled={loading}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={bulk} /></Button><Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button></Stack></Grid>
        </Grid>
      </Paper>
      <SearchFilters fields={["academicyear", "councilname", "status"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} loading={loading} autoHeight disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_council" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={gridSx} />
      </Paper>
    </MenuPageShell>
  );
}

const memberFields = ["academicyear", "councilname", "student", "studentemail", "regno", "regulation", "program", "programcode", "semester", "section", "position", "startdate", "enddate", "status"];

export function StudentCouncilMembersPage() {
  const [options, setOptions] = useState({});
  const [academicyear, setAcademicyear] = useState("");
  const [council, setCouncil] = useState(null);
  const [memberForm, setMemberForm] = useState({ position: "Member", startdate: "", enddate: "", status: "Active" });
  const [studentFilters, setStudentFilters] = useState([{ field: "academicyear", value: "" }]);
  const [memberFilters, setMemberFilters] = useState([{ field: "academicyear", value: "" }]);
  const [students, setStudents] = useState([]);
  const [studentSelection, setStudentSelection] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSelection, setMemberSelection] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/student-council/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const payload = studentFilters.reduce((acc, item) => {
        if (item.field && item.value) acc[item.field] = item.value;
        return acc;
      }, withScope({ academicyear: academicyear || undefined }));
      const res = await ep1.post("/api/v2/student-council/students", payload);
      setStudents(res.data?.rows || []);
      setStudentSelection([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };
  const loadMembers = async () => {
    setLoading(true);
    try {
      const params = memberFilters.reduce((acc, item) => {
        if (item.field && item.value) acc[item.field] = item.value;
        return acc;
      }, withScope({ councilid: council?._id || undefined, academicyear: academicyear || undefined }));
      const res = await ep1.get("/api/v2/student-council/members", { params });
      setMembers(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load members");
    } finally {
      setLoading(false);
    }
  };
  const assign = async () => {
    if (!council?._id) return setError("Select a council");
    const selectedStudents = students.filter((row) => studentSelection.includes(row._id));
    if (!selectedStudents.length) return setError("Select at least one student");
    setLoading(true);
    try {
      await ep1.post("/api/v2/student-council/members", withScope({ ...memberForm, councilid: council._id, students: selectedStudents }));
      setMessage("Selected students added to council");
      setStudentSelection([]);
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add members");
    } finally {
      setLoading(false);
    }
  };
  const deleteMembers = async () => {
    if (!memberSelection.length) return setError("Select members to delete");
    if (!window.confirm("Delete selected council members?")) return;
    setLoading(true);
    try {
      await ep1.post("/api/v2/student-council/members/delete", withScope({ ids: memberSelection }));
      setMemberSelection([]);
      setMessage("Selected members deleted");
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete members");
    } finally {
      setLoading(false);
    }
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const content = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(content) : parseCsv(content);
      await ep1.post("/api/v2/student-council/members/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Bulk upload failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const studentColumns = ["name", "email", "regno", "academicyear", "regulation", "program", "programcode", "semester", "section"].map((field) => ({ field, headerName: field, minWidth: 135, flex: ["name", "email", "program"].includes(field) ? 1 : 0 }));
  const memberColumns = memberFields.map((field) => ({ field, headerName: field, minWidth: 135, flex: ["student", "studentemail", "program"].includes(field) ? 1 : 0 }));

  return (
    <MenuPageShell title="Council Members">
      <Message message={message} error={error} setMessage={setMessage} setError={setError} />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={academicyear} onInputChange={(_, value) => { setAcademicyear(value); setCouncil(null); }} renderInput={(params) => <TextField {...params} size="small" label="Academic year" />} /></Grid>
          <Grid item xs={12} md={4}><CouncilAutocomplete options={options} academicyear={academicyear} value={council?._id || ""} onChange={setCouncil} /></Grid>
          <Grid item xs={12} md={2}><Autocomplete freeSolo options={options.positions || []} value={memberForm.position} onInputChange={(_, value) => setMemberForm((prev) => ({ ...prev, position: value }))} renderInput={(params) => <TextField {...params} size="small" label="Position" />} /></Grid>
          <Grid item xs={12} md={1.5}><TextField fullWidth type="date" size="small" label="Start date" InputLabelProps={{ shrink: true }} value={memberForm.startdate} onChange={(e) => setMemberForm((prev) => ({ ...prev, startdate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={1.5}><TextField fullWidth type="date" size="small" label="End date" InputLabelProps={{ shrink: true }} value={memberForm.enddate} onChange={(e) => setMemberForm((prev) => ({ ...prev, enddate: e.target.value }))} /></Grid>
          <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" disabled={loading} onClick={assign}>{loading ? "Working..." : "Add selected students"}</Button><Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportTemplate("student-council-members-template.csv", memberFields)}>Template</Button><Button component="label" startIcon={<UploadFileIcon />} variant="outlined" disabled={loading}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={bulk} /></Button><Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={deleteMembers} disabled={loading}>Bulk delete members</Button></Stack></Grid>
        </Grid>
      </Paper>
      <SearchFilters fields={["academicyear", "regulation", "program", "programcode", "semester", "section", "regno", "name", "search"]} filters={studentFilters} setFilters={setStudentFilters} options={options} onLoad={loadStudents} loading={loading} />
      <Paper sx={{ p: 1, mb: 2 }}>
        <Typography fontWeight={900} sx={{ mb: 1 }}>Student selection</Typography>
        <DataGrid rows={students} getRowId={(row) => row._id} columns={studentColumns} checkboxSelection rowSelectionModel={studentSelection} onRowSelectionModelChange={(ids) => setStudentSelection(Array.from(ids))} loading={loading} autoHeight disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_council_student_search" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={gridSx} />
      </Paper>
      <SearchFilters fields={["academicyear", "councilname", "position", "program", "programcode", "semester", "section", "regno", "status"]} filters={memberFilters} setFilters={setMemberFilters} options={options} onLoad={loadMembers} loading={loading} />
      <Paper sx={{ p: 1 }}>
        <Typography fontWeight={900} sx={{ mb: 1 }}>Council members</Typography>
        <DataGrid rows={members} getRowId={(row) => row._id} columns={memberColumns} checkboxSelection rowSelectionModel={memberSelection} onRowSelectionModelChange={(ids) => setMemberSelection(Array.from(ids))} loading={loading} autoHeight disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_council_members" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={gridSx} />
      </Paper>
    </MenuPageShell>
  );
}

const meetingBlank = { academicyear: "", councilid: "", meeting: "", meetingdate: "", agenda: "", discussion: "", actionitems: "", issues: "", filelink: "", filename: "", status: "Active" };
const meetingFields = ["academicyear", "councilname", "meeting", "meetingdate", "agenda", "discussion", "actionitems", "issues", "filelink", "filename", "status"];

export function StudentCouncilMeetingsPage() {
  const [options, setOptions] = useState({});
  const [form, setForm] = useState(meetingBlank);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedCouncil = (options.councils || []).find((row) => row._id === form.councilid);

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/student-council/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = filters.reduce((acc, item) => {
        if (item.field && item.value) acc[item.field] = item.value;
        return acc;
      }, withScope({ councilid: form.councilid || undefined }));
      const res = await ep1.get("/api/v2/student-council/meetings", { params });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load meetings");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/student-council/meetings", withScope({ ...form, id: editId }));
      setMessage(editId ? "Meeting updated" : "Meeting saved");
      setForm({ ...meetingBlank, academicyear: form.academicyear, councilid: form.councilid });
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save meeting");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    if (!window.confirm("Delete selected meetings?")) return;
    setLoading(true);
    try {
      await ep1.post("/api/v2/student-council/meetings/delete", withScope({ ids: selected }));
      setSelected([]);
      setMessage("Selected meetings deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete meetings");
    } finally {
      setLoading(false);
    }
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const content = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(content) : parseCsv(content);
      await ep1.post("/api/v2/student-council/meetings/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Bulk upload failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const columns = [
    ...meetingFields.map((field) => ({ field, headerName: field, minWidth: ["agenda", "discussion", "actionitems", "issues", "filelink"].includes(field) ? 230 : 140, flex: ["meeting", "agenda", "discussion", "actionitems", "issues"].includes(field) ? 1 : 0, renderCell: field === "filelink" ? (params) => params.value ? <Button size="small" href={params.value} target="_blank" rel="noreferrer">Open</Button> : "" : undefined })),
    { field: "actions", type: "actions", width: 80, getActions: ({ row }) => [<GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => { setEditId(row._id); setForm({ ...meetingBlank, ...row, councilid: row.councilid, meetingdate: dateOnly(row.meetingdate) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ];

  return (
    <MenuPageShell title="Student Council Meetings">
      <Message message={message} error={error} setMessage={setMessage} setError={setError} />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear} onInputChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value, councilid: "" }))} renderInput={(params) => <TextField {...params} size="small" label="Academic year" />} /></Grid>
          <Grid item xs={12} md={4}><CouncilAutocomplete options={options} academicyear={form.academicyear} value={form.councilid} onChange={(item) => setForm((prev) => ({ ...prev, councilid: item?._id || "", councilname: item?.councilname || "", academicyear: item?.academicyear || prev.academicyear }))} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Meeting" value={form.meeting} onChange={(e) => setForm((prev) => ({ ...prev, meeting: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="date" size="small" label="Meeting date" InputLabelProps={{ shrink: true }} value={form.meetingdate} onChange={(e) => setForm((prev) => ({ ...prev, meetingdate: e.target.value }))} /></Grid>
          {["agenda", "discussion", "actionitems", "issues"].map((field) => <Grid item xs={12} md={6} key={field}><TextField fullWidth multiline minRows={3} label={field} value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} /></Grid>)}
          <Grid item xs={12}><AwsUploader value={form.filelink} onChange={(url, filename) => setForm((prev) => ({ ...prev, filelink: url, filename: filename || prev.filename }))} disabled={loading} setMessage={setMessage} setError={setError} /></Grid>
          <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={save} disabled={loading || !selectedCouncil}>{loading ? "Saving..." : editId ? "Update meeting" : "Save meeting"}</Button><Button variant="outlined" onClick={() => { setForm(meetingBlank); setEditId(""); }} disabled={loading}>Clear</Button><Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportTemplate("student-council-meetings-template.csv", meetingFields)}>Template</Button><Button component="label" startIcon={<UploadFileIcon />} variant="outlined" disabled={loading}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={bulk} /></Button><Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button></Stack></Grid>
        </Grid>
      </Paper>
      <SearchFilters fields={["academicyear", "councilname", "meeting", "agenda", "status"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
      <Paper sx={{ p: 1 }}>
        <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} loading={loading} autoHeight disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_council_meetings" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={gridSx} />
      </Paper>
    </MenuPageShell>
  );
}

export function StudentCouncilReportPage() {
  const [options, setOptions] = useState({});
  const [academicyear, setAcademicyear] = useState("");
  const [council, setCouncil] = useState(null);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/student-council/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const loadReport = async () => {
    if (!council?._id) return setError("Select a council");
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/student-council/report", { params: withScope({ councilid: council._id }) });
      setReport(res.data || null);
      setMessage("Report generated");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate report");
    } finally {
      setLoading(false);
    }
  };
  const print = () => {
    if (!report?.council) return setError("Generate report first");
    const memberRows = (report.members || []).map((row, index) => `<tr><td>${index + 1}</td><td>${row.student || ""}</td><td>${row.regno || ""}</td><td>${row.program || ""}</td><td>${row.semester || ""}</td><td>${row.section || ""}</td><td>${row.position || ""}</td><td>${dateOnly(row.startdate)}</td><td>${dateOnly(row.enddate)}</td></tr>`).join("");
    const meetingRows = (report.meetings || []).map((row, index) => `<div class="card"><h3>${index + 1}. ${row.meeting || ""}</h3><div><b>Date:</b> ${dateOnly(row.meetingdate)}</div><div><b>Agenda:</b><br/>${row.agenda || ""}</div><div><b>Discussion:</b><br/>${row.discussion || ""}</div><div><b>Action items:</b><br/>${row.actionitems || ""}</div><div><b>Issues:</b><br/>${row.issues || ""}</div>${row.filelink ? `<div><b>File:</b> ${row.filelink}</div>` : ""}</div>`).join("");
    printHtml("Student Council Report", report.institution, `<div class="meta"><div><b>Academic year:</b> ${report.council.academicyear || ""}</div><div><b>Council:</b> ${report.council.councilname || ""}</div><div><b>Start date:</b> ${dateOnly(report.council.startdate)}</div><div><b>End date:</b> ${dateOnly(report.council.enddate)}</div></div><h3>Members</h3><table><thead><tr><th>Sr</th><th>Student</th><th>Reg No</th><th>Program</th><th>Semester</th><th>Section</th><th>Position</th><th>Start</th><th>End</th></tr></thead><tbody>${memberRows || "<tr><td colspan='9'>No members</td></tr>"}</tbody></table><h3>Meetings</h3>${meetingRows || "<p>No meetings</p>"}`);
  };
  const memberColumns = ["student", "regno", "program", "programcode", "semester", "section", "position", "startdate", "enddate"].map((field) => ({ field, headerName: field, minWidth: 130, flex: ["student", "program"].includes(field) ? 1 : 0 }));
  const meetingColumns = ["meeting", "meetingdate", "agenda", "discussion", "actionitems", "issues", "filelink"].map((field) => ({ field, headerName: field, minWidth: ["agenda", "discussion", "actionitems", "issues", "filelink"].includes(field) ? 220 : 140, flex: ["meeting", "agenda", "discussion", "actionitems", "issues"].includes(field) ? 1 : 0, renderCell: field === "filelink" ? (params) => params.value ? <Button size="small" href={params.value} target="_blank" rel="noreferrer">Open</Button> : "" : undefined }));

  return (
    <MenuPageShell title="Student Council Report">
      <Message message={message} error={error} setMessage={setMessage} setError={setError} />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={academicyear} onInputChange={(_, value) => { setAcademicyear(value); setCouncil(null); setReport(null); }} renderInput={(params) => <TextField {...params} size="small" label="Academic year" />} /></Grid>
          <Grid item xs={12} md={5}><CouncilAutocomplete options={options} academicyear={academicyear} value={council?._id || ""} onChange={(item) => { setCouncil(item); setReport(null); }} /></Grid>
          <Grid item xs={12} md={4}><Stack direction="row" spacing={1}><Button variant="contained" onClick={loadReport} disabled={loading}>{loading ? "Generating..." : "Generate report"}</Button><Button variant="outlined" startIcon={<PrintIcon />} onClick={print} disabled={!report}>Print preview</Button></Stack></Grid>
        </Grid>
      </Paper>
      {report && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Members</Typography><Typography variant="h4" fontWeight={900}>{report.summary?.membercount || 0}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} md={3}><Card><CardContent><Typography color="text.secondary">Meetings</Typography><Typography variant="h4" fontWeight={900}>{report.summary?.meetingcount || 0}</Typography></CardContent></Card></Grid>
            {Object.entries(report.summary?.byPosition || {}).slice(0, 4).map(([position, count]) => <Grid item xs={12} md={3} key={position}><Card><CardContent><Typography color="text.secondary">{position}</Typography><Typography variant="h4" fontWeight={900}>{count}</Typography></CardContent></Card></Grid>)}
          </Grid>
          <Paper sx={{ p: 1, mb: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Members</Typography>
            <DataGrid rows={report.members || []} getRowId={(row) => row._id} columns={memberColumns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_council_report_members" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={gridSx} />
          </Paper>
          <Paper sx={{ p: 1 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Meetings</Typography>
            <DataGrid rows={report.meetings || []} getRowId={(row) => row._id} columns={meetingColumns} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_council_report_meetings" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={gridSx} />
          </Paper>
        </>
      )}
    </MenuPageShell>
  );
}
