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

function exportCsv(filename, rows = [], fields = []) {
  const csv = [fields.map(csvEscape).join(","), ...rows.map((row) => fields.map((field) => csvEscape(Array.isArray(row[field]) ? row[field].join("; ") : row[field])).join(","))].join("\n");
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
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #000;padding:6px;font-size:12px;vertical-align:top;text-align:left}
    th{background:#f3f4f6}
    .card{border:1px solid #111;padding:10px;margin:10px 0;break-inside:avoid}
    @media print{.tools{display:none}.print-area{padding:8mm}@page{size:A4 portrait;margin:10mm}tr{break-inside:avoid}}
  </style></head><body><div class="tools"><button onclick="window.print()">Print</button> <button onclick="window.close()">Close</button></div><div class="print-area">
    <div class="head">${instLogo(institution) ? `<img class="logo" src="${instLogo(institution)}" />` : ""}<h1>${instName(institution)}</h1><div>${instAddress(institution)}</div><h2>${title}</h2></div>${body}</div></body></html>`);
  win.document.close();
}

function Message({ message, error, setMessage, setError }) {
  return (
    <>
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
    </>
  );
}

function AwsUploader({ value, onChange, folder = "circulars", disabled }) {
  const [configs, setConfigs] = useState([]);
  const [awsconfigid, setAwsconfigid] = useState("");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    ep1.get("/api/v2/aws-file-library/configs", { params: withScope() }).then((res) => {
      setConfigs(res.data || []);
      if (res.data?.[0]?._id) setAwsconfigid(res.data[0]._id);
    }).catch(() => {});
  }, []);
  const upload = async (file) => {
    if (!file) return;
    if (!awsconfigid) return alert("Select AWS configuration");
    setProgress(5);
    const data = new FormData();
    data.append("file", file);
    data.append("colid", global1.colid);
    data.append("user", global1.user);
    data.append("awsconfigid", awsconfigid);
    data.append("folder", folder);
    const res = await ep1.post("/api/v2/aws-file-library/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => setProgress(Math.round((event.loaded * 100) / (event.total || event.loaded || 1)))
    });
    onChange(res.data?.url || "");
    setProgress(100);
    setTimeout(() => setProgress(0), 800);
  };
  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <Autocomplete
          sx={{ minWidth: 220 }}
          options={configs}
          value={configs.find((item) => item._id === awsconfigid) || null}
          getOptionLabel={(item) => item.name || item.bucket || ""}
          onChange={(_, item) => setAwsconfigid(item?._id || "")}
          renderInput={(params) => <TextField {...params} size="small" label="AWS config" />}
        />
        <Button component="label" startIcon={<UploadFileIcon />} variant="outlined" disabled={disabled}>
          Upload AWS
          <input hidden type="file" onChange={(event) => upload(event.target.files?.[0])} />
        </Button>
      </Stack>
      {progress > 0 && <LinearProgress variant="determinate" value={progress} />}
      <TextField size="small" label="File link" value={value || ""} onChange={(event) => onChange(event.target.value)} fullWidth />
    </Stack>
  );
}

function SearchFilters({ fields, filters, setFilters, options, onLoad, loading }) {
  const add = () => setFilters((prev) => [...prev, { field: fields[0], value: "" }]);
  const update = (index, patch) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  const valuesFor = (field) => {
    if (field === "academicyear") return options.academicyears || [];
    if (field === "regulation") return options.regulations || [];
    if (field === "program") return options.programs || [];
    if (field === "programcode") return options.programcodes || [];
    if (field === "semester") return options.semesters || [];
    if (field === "role") return options.roles || [];
    if (field === "targettype") return ["All", "Role", "Student", "Program"];
    if (field === "type") return ["Academic", "Administrative", "Statutory"];
    if (field === "level") return ["Departmental", "School", "Institute", "University"];
    if (field === "active") return ["Yes", "No"];
    return [];
  };
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Typography fontWeight={900}>Dynamic filters</Typography>
        <Button size="small" variant="outlined" onClick={add}>Add filter</Button>
        <Button size="small" variant="contained" onClick={onLoad} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
      </Stack>
      <Grid container spacing={1}>
        {filters.map((filter, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} md={3}><Autocomplete options={fields} value={filter.field || ""} onChange={(_, value) => update(index, { field: value || fields[0], value: "" })} renderInput={(params) => <TextField {...params} size="small" label="Field" />} /></Grid>
            <Grid item xs={12} md={7}><Autocomplete freeSolo options={valuesFor(filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(index, { value })} renderInput={(params) => <TextField {...params} size="small" label="Value" />} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button></Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Paper>
  );
}

const circularBlank = { academicyear: "", circular: "", description: "", startdate: "", enddate: "", filelink: "", roles: [], targettype: "All", regulation: "", program: "", programcode: "", semester: "", active: "Yes" };
const circularFields = ["academicyear", "circular", "description", "startdate", "enddate", "filelink", "roles", "targettype", "regulation", "program", "programcode", "semester", "active"];

export function CircularEntryPage({ targettype = "All", title = "Circular" }) {
  const [form, setForm] = useState({ ...circularBlank, targettype });
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState("");
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [options, setOptions] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/circular-committee/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const params = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope({ targettype }));

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/circulars", { params: params() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load circulars");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/circulars", withScope({ ...form, targettype, id: editId }));
      setMessage(editId ? "Circular updated" : "Circular saved");
      setForm({ ...circularBlank, targettype });
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save circular");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditId(row._id);
    setForm({ ...circularBlank, ...row, startdate: dateOnly(row.startdate), enddate: dateOnly(row.enddate), roles: row.roles || [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    if (!window.confirm("Delete selected circulars?")) return;
    await ep1.post("/api/v2/circulars/delete", withScope({ ids: selected }));
    setSelected([]);
    setMessage("Selected circulars deleted");
    await loadRows();
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const rows = file.name.toLowerCase().endsWith(".json") ? JSON.parse(content) : parseCsv(content);
      await ep1.post("/api/v2/circulars/bulk", withScope({ targettype, rows: Array.isArray(rows) ? rows : [rows] }));
      setMessage("Bulk upload completed");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Bulk upload failed");
    } finally {
      event.target.value = "";
    }
  };
  const print = () => {
    const body = rows.map((row) => `<div class="card"><b>${row.circular || ""}</b><br/>${row.description || ""}<br/><b>Active:</b> ${dateOnly(row.startdate)} to ${dateOnly(row.enddate)}<br/>${row.filelink ? `<b>Document:</b> ${row.filelink}` : ""}</div>`).join("");
    printHtml(title, options.institution, body || "<p>No records loaded.</p>");
  };

  const columns = useMemo(() => [
    ...circularFields.filter((field) => targettype === "Role" || field !== "roles").filter((field) => targettype === "Program" || !["regulation", "program", "programcode", "semester"].includes(field)).map((field) => ({
      field,
      headerName: field,
      minWidth: ["description", "filelink", "circular"].includes(field) ? 230 : 135,
      flex: ["description", "filelink", "circular"].includes(field) ? 1 : 0,
      renderCell: field === "filelink" ? (params) => params.value ? <Button href={params.value} target="_blank" rel="noreferrer" size="small">Open</Button> : "" : undefined
    })),
    { field: "actions", type: "actions", width: 80, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />] }
  ], [targettype]);

  return (
    <MenuPageShell title={title}>
      <Stack spacing={2}>
        <Message message={message} error={error} setMessage={setMessage} setError={setError} />
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit" : "Add"} {title}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear} onInputChange={(_, value) => setForm((p) => ({ ...p, academicyear: value }))} renderInput={(params) => <TextField {...params} label="Academic Year" />} /></Grid>
            {targettype === "Role" && <Grid item xs={12} md={5}><Autocomplete multiple options={options.roles || []} value={form.roles || []} onChange={(_, value) => setForm((p) => ({ ...p, roles: value }))} renderInput={(params) => <TextField {...params} label="Roles" />} /></Grid>}
            {targettype === "Program" && <>
              <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.regulations || []} value={form.regulation} onInputChange={(_, value) => setForm((p) => ({ ...p, regulation: value }))} renderInput={(params) => <TextField {...params} label="Regulation" />} /></Grid>
              <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.programs || []} value={form.program} onInputChange={(_, value) => setForm((p) => ({ ...p, program: value }))} renderInput={(params) => <TextField {...params} label="Program" />} /></Grid>
              <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.programcodes || []} value={form.programcode} onInputChange={(_, value) => setForm((p) => ({ ...p, programcode: value }))} renderInput={(params) => <TextField {...params} label="Program Code" />} /></Grid>
              <Grid item xs={12} md={3}><Autocomplete multiple freeSolo options={options.semesters || []} value={Array.isArray(form.semester) ? form.semester : form.semester ? [form.semester] : []} onChange={(_, value) => setForm((p) => ({ ...p, semester: value.join(",") }))} renderInput={(params) => <TextField {...params} label="Semester" />} /></Grid>
            </>}
            <Grid item xs={12} md={targettype === "Role" ? 4 : 6}><TextField fullWidth label="Circular" value={form.circular} onChange={(event) => setForm((p) => ({ ...p, circular: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth label="Start Date" value={form.startdate} onChange={(event) => setForm((p) => ({ ...p, startdate: event.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth label="End Date" value={form.enddate} onChange={(event) => setForm((p) => ({ ...p, enddate: event.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField multiline minRows={3} fullWidth label="Description" value={form.description} onChange={(event) => setForm((p) => ({ ...p, description: event.target.value }))} /></Grid>
            <Grid item xs={12}><AwsUploader folder="circulars" value={form.filelink} onChange={(value) => setForm((p) => ({ ...p, filelink: value }))} disabled={loading} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            <Button variant="contained" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            <Button variant="outlined" onClick={() => { setEditId(""); setForm({ ...circularBlank, targettype }); }}>Clear</Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv(`${title}-template.csv`, [{ ...circularBlank, targettype }], circularFields)}>Template</Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>Bulk Upload<input hidden type="file" accept=".csv,.json" onChange={bulk} /></Button>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={remove}>Bulk Delete</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={print}>Print Preview</Button>
          </Stack>
        </Paper>
        <SearchFilters fields={["academicyear", "circular", "targettype", "role", "regulation", "program", "programcode", "semester", "active"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Paper sx={{ p: 2 }}><Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} checkboxSelection onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} disableRowSelectionOnClick /></Box></Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function ViewCircularPage({ student = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/circulars/view", { params: withScope({ academicyear: global1.academicyear, regulation: global1.regulation, programcode: global1.programcode, semester: global1.semester }) });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load circulars");
    } finally {
      setLoading(false);
    }
  };
  return (
    <MenuPageShell title={student ? "Student Circulars" : "View Circulars"}>
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}><Button variant="contained" onClick={load} disabled={loading}>{loading ? "Loading..." : "Load active circulars"}</Button></Paper>
        <Grid container spacing={2}>{rows.map((row) => <Grid item xs={12} md={6} key={row._id}><Card variant="outlined" sx={{ height: "100%" }}><CardContent><Typography fontWeight={900}>{row.circular}</Typography><Typography sx={{ whiteSpace: "pre-wrap", my: 1 }}>{row.description}</Typography><Typography variant="caption">Active: {dateOnly(row.startdate)} to {dateOnly(row.enddate)}</Typography><br />{row.filelink && <Button size="small" href={row.filelink} target="_blank" rel="noreferrer">Open document</Button>}</CardContent></Card></Grid>)}</Grid>
      </Stack>
    </MenuPageShell>
  );
}

export function CommitteePage() {
  const [form, setForm] = useState({ committeename: "", members: [], type: "Academic", level: "Departmental", startdate: "", active: "Yes" });
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState([{ field: "committeename", value: "" }]);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loadOptions = async () => setOptions((await ep1.get("/api/v2/circular-committee/options", { params: withScope() })).data || {});
  useEffect(() => { loadOptions().catch(() => {}); }, []);
  const params = () => filters.reduce((acc, item) => item.field && item.value ? { ...acc, [item.field]: item.value } : acc, withScope());
  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/committees", { params: params() });
      setRows(res.data?.rows || []);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/committees", withScope({ ...form, id: editId }));
      setMessage("Committee saved");
      setForm({ committeename: "", members: [], type: "Academic", level: "Departmental", startdate: "", active: "Yes" });
      setEditId("");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save committee");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    await ep1.post("/api/v2/committees/delete", withScope({ ids: selected }));
    setMessage("Selected committees deleted");
    setSelected([]);
    await loadRows();
  };
  const columns = [
    { field: "committeename", headerName: "Committee", minWidth: 240, flex: 1 },
    { field: "type", headerName: "Type", minWidth: 140 },
    { field: "level", headerName: "Level", minWidth: 140 },
    { field: "startdate", headerName: "Start Date", minWidth: 130 },
    { field: "members", headerName: "Members", minWidth: 320, flex: 1, renderCell: (params) => (params.value || []).map((m) => m.name || m.email).join(", ") },
    { field: "actions", type: "actions", width: 80, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(params.row._id); setForm({ ...params.row, startdate: dateOnly(params.row.startdate) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ];
  return (
    <MenuPageShell title="Committees">
      <Stack spacing={2}>
        <Message message={message} error={error} setMessage={setMessage} setError={setError} />
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Committee name" value={form.committeename} onChange={(e) => setForm((p) => ({ ...p, committeename: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={["Academic", "Administrative", "Statutory"]} value={form.type} onChange={(_, value) => setForm((p) => ({ ...p, type: value || "" }))} renderInput={(params) => <TextField {...params} label="Type" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={["Departmental", "School", "Institute", "University"]} value={form.level} onChange={(_, value) => setForm((p) => ({ ...p, level: value || "" }))} renderInput={(params) => <TextField {...params} label="Level" />} /></Grid>
            <Grid item xs={12} md={2}><TextField type="date" fullWidth label="Start Date" value={form.startdate} InputLabelProps={{ shrink: true }} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid>
            <Grid item xs={12}><Autocomplete multiple options={options.users || []} value={form.members || []} getOptionLabel={(item) => item.label || item.name || item.email || ""} onChange={(_, value) => setForm((p) => ({ ...p, members: value }))} renderInput={(params) => <TextField {...params} label="Members" />} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            <Button color="error" variant="outlined" onClick={remove} startIcon={<DeleteIcon />}>Bulk Delete</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => printHtml("Committees", options.institution, `<table><thead><tr><th>Committee</th><th>Type</th><th>Level</th><th>Members</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.committeename}</td><td>${r.type}</td><td>${r.level}</td><td>${(r.members || []).map((m) => m.name || m.email).join(", ")}</td></tr>`).join("")}</tbody></table>`)}>Print Preview</Button>
          </Stack>
        </Paper>
        <SearchFilters fields={["committeename", "type", "level", "active"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Paper sx={{ p: 2 }}><Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} checkboxSelection onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Box></Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function CommitteeMinutesPage() {
  const [form, setForm] = useState({ committeeid: "", committeename: "", minutes: "", agenda: "", description: "", memberspresent: [], discussion: "", actionitems: "", meetingdate: "", issues: "", filelink: "" });
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: "committeename", value: "" }]);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loadOptions = async () => setOptions((await ep1.get("/api/v2/circular-committee/options", { params: withScope() })).data || {});
  useEffect(() => { loadOptions().catch(() => {}); }, []);
  const committee = (options.committees || []).find((item) => item._id === form.committeeid);
  const loadRows = async () => {
    setLoading(true);
    try {
      const params = filters.reduce((acc, item) => item.field && item.value ? { ...acc, [item.field]: item.value } : acc, withScope());
      const res = await ep1.get("/api/v2/committee-minutes", { params });
      setRows(res.data?.rows || []);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/committee-minutes", withScope({ ...form, id: editId }));
      setMessage("Minutes saved");
      setForm({ committeeid: "", committeename: "", minutes: "", agenda: "", description: "", memberspresent: [], discussion: "", actionitems: "", meetingdate: "", issues: "", filelink: "" });
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save minutes");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    await ep1.post("/api/v2/committee-minutes/delete", withScope({ ids: selected }));
    setMessage("Selected minutes deleted");
    setSelected([]);
    await loadRows();
  };
  const columns = [
    { field: "committeename", headerName: "Committee", minWidth: 220, flex: 1 },
    { field: "meetingdate", headerName: "Meeting Date", minWidth: 130 },
    { field: "agenda", headerName: "Agenda", minWidth: 220, flex: 1 },
    { field: "discussion", headerName: "Discussion", minWidth: 260, flex: 1 },
    { field: "actionitems", headerName: "Action Items", minWidth: 240, flex: 1 },
    { field: "filelink", headerName: "File", minWidth: 120, renderCell: (p) => p.value ? <Button href={p.value} target="_blank" rel="noreferrer" size="small">Open</Button> : "" },
    { field: "actions", type: "actions", width: 80, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(params.row._id); setForm({ ...params.row, meetingdate: dateOnly(params.row.meetingdate), memberspresent: params.row.memberspresent || [] }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ];
  return (
    <MenuPageShell title="Minutes of Meeting">
      <Stack spacing={2}>
        <Message message={message} error={error} setMessage={setMessage} setError={setError} />
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><Autocomplete options={options.committees || []} value={committee || null} getOptionLabel={(item) => item.label || item.committeename || ""} onChange={(_, item) => setForm((p) => ({ ...p, committeeid: item?._id || "", committeename: item?.committeename || "" }))} renderInput={(params) => <TextField {...params} label="Committee" />} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth label="Meeting Date" value={form.meetingdate} InputLabelProps={{ shrink: true }} onChange={(e) => setForm((p) => ({ ...p, meetingdate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Minutes title" value={form.minutes} onChange={(e) => setForm((p) => ({ ...p, minutes: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Agenda" value={form.agenda} onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))} /></Grid>
            <Grid item xs={12}><Autocomplete multiple options={committee?.members || []} value={form.memberspresent || []} getOptionLabel={(item) => item.name || item.email || ""} onChange={(_, value) => setForm((p) => ({ ...p, memberspresent: value }))} renderInput={(params) => <TextField {...params} label="Members present" />} /></Grid>
            <Grid item xs={12} md={6}><TextField multiline minRows={4} fullWidth label="Discussion" value={form.discussion} onChange={(e) => setForm((p) => ({ ...p, discussion: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField multiline minRows={4} fullWidth label="Action items" value={form.actionitems} onChange={(e) => setForm((p) => ({ ...p, actionitems: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField multiline minRows={3} fullWidth label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField multiline minRows={3} fullWidth label="Issues" value={form.issues} onChange={(e) => setForm((p) => ({ ...p, issues: e.target.value }))} /></Grid>
            <Grid item xs={12}><AwsUploader folder="committee-minutes" value={form.filelink} onChange={(value) => setForm((p) => ({ ...p, filelink: value }))} disabled={loading} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            <Button color="error" variant="outlined" onClick={remove} startIcon={<DeleteIcon />}>Bulk Delete</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => printHtml("Minutes of Meeting", options.institution, rows.map((r) => `<div class="card"><b>${r.committeename}</b><br/><b>Date:</b> ${r.meetingdate || ""}<br/><b>Agenda:</b> ${r.agenda || ""}<br/><b>Discussion:</b><br/>${r.discussion || ""}<br/><b>Action Items:</b><br/>${r.actionitems || ""}</div>`).join(""))}>Print Preview</Button>
          </Stack>
        </Paper>
        <SearchFilters fields={["committeeid", "committeename", "agenda", "minutes"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Paper sx={{ p: 2 }}><Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} checkboxSelection onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Box></Paper>
      </Stack>
    </MenuPageShell>
  );
}
