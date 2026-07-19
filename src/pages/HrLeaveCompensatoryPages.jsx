import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { ArrowBack, Delete, Edit, FileDownload, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const blankRule = { role: "All", leavestoadd: 1, description: "", status: "Active" };
const blankWeeklyOff = { employeeemail: "", employeename: "", role: "", department: "", dayofweek: "Sunday", status: "Active" };
const norm = (value) => String(value || "").trim().toLowerCase();
const uniqueSorted = (values = []) => [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

function Shell({ title, subtitle, children, message, error }) {
  return (
    <MenuPageShell title={title}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Button component={RouterLink} to="/dashdashfacnew" startIcon={<ArrowBack />} variant="outlined">Back</Button>
      </Stack>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {children}
      </Container>
    </MenuPageShell>
  );
}

export function HrLeaveCompensatoryRulePage() {
  const [options, setOptions] = useState({ users: [] });
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankRule);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadOptions(); loadRows(); }, []);
  const roles = useMemo(() => uniqueSorted(["All", ...(options.users || []).map((user) => user.role)]), [options.users]);
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/hrleave/options", { params: { colid: global1.colid } });
    setOptions(res.data || { users: [] });
  };
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/hrleave/comprule", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load compensatory leave rules");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    try {
      const endpoint = editingId ? "/api/v2/hrleave/comprule/update" : "/api/v2/hrleave/comprule";
      await ep1.post(endpoint, { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage("Saved");
      setEditingId("");
      setForm(blankRule);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save rule");
    }
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this rule?")) return;
    await ep1.post("/api/v2/hrleave/comprule/delete", { id: row._id, colid: global1.colid });
    setMessage("Deleted");
    loadRows();
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    data.append("colid", global1.colid);
    data.append("user", global1.user);
    await ep1.post("/api/v2/hrleave/comprule/bulkupload", data, { headers: { "Content-Type": "multipart/form-data" } });
    setMessage("Bulk upload completed");
    loadRows();
  };
  const template = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ role: "Faculty", leavestoadd: 1, description: "Work on off day", status: "Active" }]), "Rules");
    XLSX.writeFile(wb, "compensatory_leave_rule_template.xlsx");
  };
  return (
    <Shell title="Role Based Compensatory Leave" subtitle="Define how many compensatory leave days are earned when each role works on weekly off days or holidays." message={message} error={error}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Role" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>{roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Leaves to add" value={form.leavestoadd} onChange={(e) => setForm((p) => ({ ...p, leavestoadd: e.target.value }))} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
          <Grid item xs={12} md={1}><Button fullWidth variant="contained" startIcon={<Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid>
        </Grid>
      </Paper>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<Refresh />} onClick={loadRows} variant="outlined">Refresh</Button>
        <Button startIcon={<FileDownload />} onClick={template} variant="outlined">Template</Button>
        <Button component="label" startIcon={<UploadFile />} variant="outlined">Bulk Upload<input hidden type="file" accept=".xlsx,.xls" onChange={upload} /></Button>
      </Stack>
      <Paper sx={{ p: 2 }}>
        <DataGrid rows={rows} getRowId={(row) => row._id} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "role", headerName: "Role", width: 160 },
          { field: "leavestoadd", headerName: "Leaves to add", width: 150, type: "number" },
          { field: "description", headerName: "Description", width: 280 },
          { field: "status", headerName: "Status", width: 120 },
          { field: "actions", type: "actions", width: 110, getActions: ({ row }) => [
            <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...blankRule, ...row }); }} />,
            <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove(row)} />
          ] }
        ]} />
      </Paper>
    </Shell>
  );
}

export function HrLeaveWeeklyOffPage() {
  const [options, setOptions] = useState({ users: [] });
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankWeeklyOff);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkRole, setBulkRole] = useState("");
  const [bulkDay, setBulkDay] = useState("Sunday");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadOptions(); loadRows(); }, []);
  const users = useMemo(() => (options.users || []).filter((user) => norm(user.role) !== "student"), [options.users]);
  const roles = useMemo(() => uniqueSorted(users.map((user) => user.role)), [users]);
  const employee = users.find((user) => (user.email || user.user) === form.employeeemail) || null;
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/hrleave/options", { params: { colid: global1.colid } });
    setOptions(res.data || { users: [] });
  };
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/hrleave/weeklyoff", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load weekly off");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    try {
      const endpoint = editingId ? "/api/v2/hrleave/weeklyoff/update" : "/api/v2/hrleave/weeklyoff";
      await ep1.post(endpoint, { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage("Saved");
      setEditingId("");
      setForm(blankWeeklyOff);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save weekly off");
    }
  };
  const saveMany = async () => {
    try {
      const employeeemails = selected.length
        ? selected
        : users.filter((user) => !bulkRole || user.role === bulkRole).map((user) => user.email || user.user).filter(Boolean);
      await ep1.post("/api/v2/hrleave/weeklyoff/many", { colid: global1.colid, user: global1.user, dayofweek: bulkDay, employeeemails });
      setMessage("Weekly off assigned");
      setSelected([]);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign weekly off");
    }
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this weekly off?")) return;
    await ep1.post("/api/v2/hrleave/weeklyoff/delete", { id: row._id, colid: global1.colid });
    loadRows();
  };
  const template = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ employeename: "Employee", employeeemail: "employee@example.com", role: "Faculty", department: "Department", dayofweek: "Sunday", status: "Active" }]), "Weekly Off");
    XLSX.writeFile(wb, "weekly_off_template.xlsx");
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    data.append("colid", global1.colid);
    data.append("user", global1.user);
    await ep1.post("/api/v2/hrleave/weeklyoff/bulkupload", data, { headers: { "Content-Type": "multipart/form-data" } });
    setMessage("Bulk upload completed");
    loadRows();
  };
  return (
    <Shell title="Employee Weekly Off" subtitle="Define weekly off days by employee, by selected users, or by role." message={message} error={error}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={users}
              value={employee}
              getOptionLabel={(option) => `${option.name || option.email || option.user} - ${option.email || option.user || ""}`}
              onChange={(_, value) => setForm((p) => ({ ...p, employeeemail: value?.email || value?.user || "", employeename: value?.name || "", role: value?.role || "", department: value?.department || "" }))}
              renderInput={(params) => <TextField {...params} size="small" label="Employee" />}
            />
          </Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Day" value={form.dayofweek} onChange={(e) => setForm((p) => ({ ...p, dayofweek: e.target.value }))}>{days.map((day) => <MenuItem key={day} value={day}>{day}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Role" value={form.role} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Department" value={form.department} InputProps={{ readOnly: true }} /></Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField select label="Bulk day" value={bulkDay} onChange={(e) => setBulkDay(e.target.value)} sx={{ minWidth: 160 }}>{days.map((day) => <MenuItem key={day} value={day}>{day}</MenuItem>)}</TextField>
          <TextField select label="Role for select all" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} sx={{ minWidth: 220 }}><MenuItem value="">All non-student users</MenuItem>{roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField>
          <Button variant="contained" onClick={saveMany}>Assign to selected / role</Button>
          <Button startIcon={<FileDownload />} onClick={template} variant="outlined">Template</Button>
          <Button component="label" startIcon={<UploadFile />} variant="outlined">Bulk Upload<input hidden type="file" accept=".xlsx,.xls" onChange={upload} /></Button>
        </Stack>
      </Paper>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={800} sx={{ mb: 1 }}>Select employees</Typography>
            <DataGrid rows={users.map((user) => ({ ...user, id: user.email || user.user }))} columns={[
              { field: "name", headerName: "Name", width: 190 },
              { field: "email", headerName: "Email", width: 220 },
              { field: "role", headerName: "Role", width: 130 },
              { field: "department", headerName: "Department", width: 150 }
            ]} autoHeight checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(model) => setSelected(model)} slots={{ toolbar: GridToolbar }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={800} sx={{ mb: 1 }}>Weekly off list</Typography>
            <DataGrid rows={rows} getRowId={(row) => row._id} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} columns={[
              { field: "employeename", headerName: "Employee", width: 190 },
              { field: "employeeemail", headerName: "Email", width: 220 },
              { field: "role", headerName: "Role", width: 130 },
              { field: "department", headerName: "Department", width: 150 },
              { field: "dayofweek", headerName: "Day", width: 120 },
              { field: "status", headerName: "Status", width: 110 },
              { field: "actions", type: "actions", width: 110, getActions: ({ row }) => [
                <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...blankWeeklyOff, ...row }); }} />,
                <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove(row)} />
              ] }
            ]} />
          </Paper>
        </Grid>
      </Grid>
    </Shell>
  );
}

export function HrLeaveCompensatoryBalancePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message] = useState("");
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/hrleave/balance", { params: { colid: global1.colid, leavetype: "Compensatory Leave" } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load compensatory leave balance");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, []);
  return (
    <Shell title="Compensatory Leave Balance" subtitle="View compensatory leave earned by employees for working on weekly off days or holidays." message={message} error={error}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<Refresh />} onClick={loadRows} variant="outlined">Refresh</Button>
      </Stack>
      <Paper sx={{ p: 2 }}>
        <DataGrid rows={rows} getRowId={(row) => row._id} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} columns={[
          { field: "cyclename", headerName: "Cycle", width: 130 },
          { field: "employeename", headerName: "Employee", width: 190 },
          { field: "employeeemail", headerName: "Email", width: 230 },
          { field: "department", headerName: "Department", width: 160 },
          { field: "openingbalance", headerName: "Opening", width: 110, type: "number" },
          { field: "carryforward", headerName: "Carry forward", width: 130, type: "number" },
          { field: "earned", headerName: "Earned", width: 110, type: "number" },
          { field: "used", headerName: "Used", width: 110, type: "number" },
          { field: "balance", headerName: "Balance", width: 110, type: "number" },
          { field: "status", headerName: "Status", width: 110 }
        ]} />
      </Paper>
    </Shell>
  );
}
