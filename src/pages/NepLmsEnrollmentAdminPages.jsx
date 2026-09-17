import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Delete, FileDownload, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const today = () => new Date().toISOString().slice(0, 10);
const norm = (value) => String(value || "").trim().toLowerCase();
const unique = (rows, field) => [...new Set(rows.map((row) => String(row[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const gridSx = { "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" } };
const facultyLabel = (item) => `${item.name || ""} ${item.email || item.user || ""} (${item.role || ""})`;
const makeFilter = (field = "academicyear") => ({ id: `${Date.now()}-${Math.random()}`, field, value: "" });
const studentFields = ["academicyear", "regulation", "program", "programcode", "semester", "section", "name", "email", "regno"];

function DynamicFilters({ fields, rows, filters, setFilters }) {
  const update = (id, key, value) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  return (
    <Stack spacing={1}>
      {filters.map((filter) => (
        <Stack key={filter.id} direction={{ xs: "column", md: "row" }} spacing={1}>
          <Autocomplete sx={{ minWidth: 220 }} size="small" options={fields} value={filter.field} onChange={(_, value) => update(filter.id, "field", value || fields[0])} renderInput={(params) => <TextField {...params} label="Field" />} />
          <Autocomplete sx={{ minWidth: 260 }} size="small" freeSolo options={unique(rows, filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(filter.id, "value", value)} onChange={(_, value) => update(filter.id, "value", value || "")} renderInput={(params) => <TextField {...params} label="Value" />} />
          <Button color="error" startIcon={<Delete />} onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter(fields[0])] : prev.filter((item) => item.id !== filter.id))}>Remove</Button>
        </Stack>
      ))}
      <Box><Button onClick={() => setFilters((prev) => [...prev, makeFilter(fields[0])])}>Add filter</Button></Box>
    </Stack>
  );
}

function Message({ message, error }) {
  return <>{message && <Alert severity="success" sx={{ mb: 1 }}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}</>;
}

export function NepLmsEnrollmentGroupAdminPage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ academicyear: "", regulation: "", section: "", faculty: "", facultyemail: "", groupname: "", description: "", status: "Active" });
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [rowRes, optRes] = await Promise.all([
        ep1.get("/api/v2/neplms/enrollment-groups", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/neplms/enrollment-groups/options", { params: { colid: global1.colid } })
      ]);
      setRows(rowRes.data?.data || []);
      setUsers(optRes.data?.users || []);
    } catch {
      setError("Unable to load enrollment groups");
    }
  };
  useEffect(() => { load(); }, []);
  const dropdownOptions = useMemo(() => ({ academicyear: unique(rows, "academicyear"), regulation: unique(rows, "regulation"), section: unique(rows, "section"), status: ["Active", "Inactive"] }), [rows]);
  const save = async () => {
    try {
      await ep1.post("/api/v2/neplms/enrollment-groups", { ...form, colid: global1.colid, user: global1.user });
      setMessage("Group saved");
      setForm({ academicyear: "", regulation: "", section: "", faculty: "", facultyemail: "", groupname: "", description: "", status: "Active" });
      load();
    } catch (e) { setError(e.response?.data?.message || "Unable to save group"); }
  };
  const del = async () => { await ep1.post("/api/v2/neplms/enrollment-groups/delete", { colid: global1.colid, ids: selected }); setSelected([]); load(); };
  return <MenuPageShell title="Enrollment group admin"><Box sx={{ p: 2 }}><Message message={message} error={error} /><Paper sx={{ p: 2, mb: 2 }}><Typography variant="h5" fontWeight={900}>Enrollment group admin</Typography><Grid container spacing={1} sx={{ mt: 1 }}>{["academicyear", "regulation", "section", "status"].map((field) => <Grid item xs={12} md={3} key={field}><Autocomplete freeSolo size="small" options={dropdownOptions[field] || []} value={form[field] || ""} onInputChange={(_, value) => setForm((prev) => ({ ...prev, [field]: value }))} renderInput={(params) => <TextField {...params} label={field} />} /></Grid>)}<Grid item xs={12} md={4}><Autocomplete options={users} getOptionLabel={facultyLabel} onChange={(_, v) => setForm((p) => ({ ...p, faculty: v?.name || "", facultyemail: v?.email || v?.user || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Faculty" />} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Group name" value={form.groupname} onChange={(e) => setForm((p) => ({ ...p, groupname: e.target.value }))} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid><Grid item xs={12}><Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button></Grid></Grid></Paper><Paper sx={{ p: 2 }}><Button color="error" startIcon={<Delete />} disabled={!selected.length} onClick={del}>Bulk delete</Button><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} columns={["academicyear", "regulation", "section", "faculty", "facultyemail", "groupname", "description", "status"].map((field) => ({ field, headerName: field, flex: 1, minWidth: 130 }))} sx={gridSx} /></Paper></Box></MenuPageShell>;
}

export function NepLmsEnrollmentGroupStudentsAdminPage() {
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [faculty, setFaculty] = useState(null);
  const [filters, setFilters] = useState([makeFilter()]);
  const [searchRows, setSearchRows] = useState([]);
  const [memberRows, setMemberRows] = useState([]);
  const [selectedSearch, setSelectedSearch] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = async () => { const res = await ep1.get("/api/v2/neplms/enrollment-groups/options", { params: { colid: global1.colid } }); setGroups(res.data?.groups || []); setUsers(res.data?.users || []); };
  const loadMembers = async (g = group) => { if (!g) return; const res = await ep1.get("/api/v2/neplms/enrollment-groups/students", { params: { colid: global1.colid, groupid: g._id } }); setMemberRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { loadMembers(); }, [group?._id]);
  const search = async () => { const res = await ep1.post("/api/v2/neplms/enrollment-groups/search-students", { colid: global1.colid, filters }); setSearchRows(res.data?.data || []); };
  const add = async () => { if (!group) return setError("Select group"); await ep1.post("/api/v2/neplms/enrollment-groups/students", { colid: global1.colid, groupid: group._id, students: searchRows.filter((r) => selectedSearch.includes(r._id)), user: global1.user, faculty: faculty?.name, facultyemail: faculty?.email || faculty?.user }); setMessage("Students added"); setSelectedSearch([]); loadMembers(); };
  const del = async () => { await ep1.post("/api/v2/neplms/enrollment-groups/students/delete", { colid: global1.colid, ids: selectedMembers }); setSelectedMembers([]); loadMembers(); };
  const studentColumns = ["name", "student", "email", "studentemail", "regno", "programcode", "semester", "section"].map((field) => ({ field, headerName: field, flex: 1, minWidth: 120 }));
  return <MenuPageShell title="Enrollment group students admin"><Box sx={{ p: 2 }}><Message message={message} error={error} /><Paper sx={{ p: 2, mb: 2 }}><Typography variant="h5" fontWeight={900}>Enrollment group students admin</Typography><Autocomplete sx={{ my: 1 }} options={groups} value={group} onChange={(_, v) => setGroup(v)} getOptionLabel={(o) => o.groupname || ""} renderInput={(p) => <TextField {...p} label="Enrollment group" />} /><Autocomplete sx={{ my: 1 }} options={users} value={faculty} onChange={(_, v) => setFaculty(v)} getOptionLabel={facultyLabel} renderInput={(p) => <TextField {...p} label="Faculty" />} /><DynamicFilters fields={studentFields} rows={searchRows} filters={filters} setFilters={setFilters} /><Button sx={{ mt: 1 }} variant="contained" startIcon={<Refresh />} onClick={search}>Apply search</Button></Paper><Grid container spacing={2}><Grid item xs={12} md={6}><Paper sx={{ p: 2 }}><Button variant="contained" onClick={add} disabled={!selectedSearch.length}>Add selected</Button><DataGrid autoHeight rows={searchRows} getRowId={(r) => r._id} checkboxSelection rowSelectionModel={selectedSearch} onRowSelectionModelChange={(ids) => setSelectedSearch(Array.from(ids))} slots={{ toolbar: GridToolbar }} columns={studentColumns} sx={gridSx} /></Paper></Grid><Grid item xs={12} md={6}><Paper sx={{ p: 2 }}><Button color="error" onClick={del} disabled={!selectedMembers.length}>Remove selected</Button><DataGrid autoHeight rows={memberRows} getRowId={(r) => r._id} checkboxSelection rowSelectionModel={selectedMembers} onRowSelectionModelChange={(ids) => setSelectedMembers(Array.from(ids))} slots={{ toolbar: GridToolbar }} columns={studentColumns} sx={gridSx} /></Paper></Grid></Grid></Box></MenuPageShell>;
}

export function NepLmsEnrollmentTimetableAdminPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [group, setGroup] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ classdate: today(), starttime: "10:00", endtime: "11:00", periods: 1, status: "Active" });
  const [selected, setSelected] = useState([]);
  const loadOptions = async () => { const res = await ep1.get("/api/v2/neplms/enrollment-groups/options", { params: { colid: global1.colid } }); setGroups(res.data?.groups || []); setUsers(res.data?.users || []); };
  const loadRows = async () => { const res = await ep1.get("/api/v2/neplms/timetable", { params: { colid: global1.colid, enrollmentgroupid: group?._id } }); setRows(res.data?.data || []); };
  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { if (group) loadRows(); }, [group?._id]);
  const save = async () => {
    if (!group || !faculty) return;
    for (let i = 0; i < Number(form.periods || 1); i += 1) {
      await ep1.post("/api/v2/neplms/timetable", { colid: global1.colid, academicyear: group.academicyear, regulation: group.regulation, enrollmentgroup: group.groupname, enrollmentgroupid: group._id, classdate: form.classdate, classtime: `${form.starttime}-${form.endtime}`, period: String(i + 1), faculty: faculty.name, facultyemail: faculty.email || faculty.user, status: form.status, user: global1.user });
    }
    loadRows();
  };
  const bulkTemplate = () => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ classdate: today(), classtime: "10:00-11:00", period: "1", faculty: "", facultyemail: "", status: "Active" }]), "Enrollment Timetable"); XLSX.writeFile(wb, "enrollment_timetable_admin_template.xlsx"); };
  const upload = async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file || !group) return; const wb = XLSX.read(await file.arrayBuffer(), { type: "array" }); const items = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }).map((row) => ({ ...row, enrollmentgroup: group.groupname, enrollmentgroupid: group._id, faculty: row.faculty || faculty?.name, facultyemail: row.facultyemail || faculty?.email || faculty?.user })); await ep1.post("/api/v2/neplms/timetable/bulkupload", { colid: global1.colid, user: global1.user, items }); loadRows(); };
  return <MenuPageShell title="Enrollment timetable admin"><Box sx={{ p: 2 }}><Paper sx={{ p: 2, mb: 2 }}><Typography variant="h5" fontWeight={900}>Enrollment timetable admin</Typography><Autocomplete sx={{ my: 1 }} options={groups} value={group} onChange={(_, v) => setGroup(v)} getOptionLabel={(o) => o.groupname || ""} renderInput={(p) => <TextField {...p} label="Enrollment group" />} /><Autocomplete sx={{ my: 1 }} options={users} value={faculty} onChange={(_, v) => setFaculty(v)} getOptionLabel={facultyLabel} renderInput={(p) => <TextField {...p} label="Faculty" />} /><Grid container spacing={1}>{Object.keys(form).map((k) => <Grid item xs={12} md={2} key={k}><TextField fullWidth size="small" type={k === "classdate" ? "date" : k.includes("time") ? "time" : "text"} label={k} value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>)}<Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" onClick={save} disabled={!group || !faculty}>Schedule class</Button><Button startIcon={<FileDownload />} onClick={bulkTemplate}>Template</Button><Button component="label" startIcon={<UploadFile />}>Bulk upload<input type="file" hidden onChange={upload} /></Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 2, mt: 2 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} columns={["classdate", "classtime", "period", "enrollmentgroup", "faculty", "facultyemail", "status"].map((field) => ({ field, headerName: field, flex: 1, minWidth: 130 }))} sx={gridSx} /></Paper></Box></MenuPageShell>;
}
