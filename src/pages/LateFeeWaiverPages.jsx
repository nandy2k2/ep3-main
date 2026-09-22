import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Delete, Edit, Print, Refresh, Save, Send } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const money = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateText = (value) => value ? new Date(value).toLocaleString() : "";
const selectionToArray = (selection) => Array.from(selection?.ids || selection || []);
const filterFields = ["academicyear", "regulation", "program", "programcode", "semester", "student", "regno", "feegroup", "feeitem", "approvalstatus", "currentapproveremail"];
const filterLabels = {
  academicyear: "Academic Year",
  regulation: "Regulation",
  program: "Program",
  programcode: "Program Code",
  semester: "Semester",
  student: "Student",
  regno: "Reg No",
  feegroup: "Fee Group",
  feeitem: "Fee Item",
  approvalstatus: "Approval Status",
  currentapproveremail: "Current Approver"
};

function optionLabel(option) {
  if (!option) return "";
  if (typeof option === "string") return option;
  return option.label || option.name || option.email || option.user || "";
}

function UserSelect({ label, value, options, onChange }) {
  return (
    <Autocomplete
      options={options || []}
      value={value || null}
      getOptionLabel={(option) => option ? `${option.name || option.email || option.user || ""}${option.email ? ` (${option.email})` : ""}` : ""}
      isOptionEqualToValue={(option, selected) => (option.email || option.user) === (selected.email || selected.user)}
      onChange={(_, next) => onChange(next)}
      renderInput={(params) => <TextField {...params} size="small" label={label} />}
    />
  );
}

function DynamicFilters({ filters, setFilters, options = {} }) {
  const setFilter = (index, patch) => setFilters(filters.map((item, i) => i === index ? { ...item, ...patch, ...(patch.field ? { value: "" } : {}) } : item));
  const valuesFor = (field) => {
    const map = {
      academicyear: options.academicyears,
      regulation: options.regulations,
      program: options.programs,
      programcode: options.programcodes,
      semester: options.semesters,
      feegroup: options.feegroups,
      feeitem: options.feeitems,
      approvalstatus: ["Pending", "Approved", "Rejected"]
    };
    return map[field] || [];
  };
  return (
    <Stack spacing={1}>
      {filters.map((filter, index) => (
        <Grid container spacing={1} key={index}>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(e) => setFilter(index, { field: e.target.value })}>
              {filterFields.map((field) => <MenuItem key={field} value={field}>{filterLabels[field]}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={7}>
            <Autocomplete
              freeSolo
              options={valuesFor(filter.field)}
              value={filter.value || ""}
              onChange={(_, next) => setFilter(index, { value: optionLabel(next) })}
              onInputChange={(_, next) => setFilter(index, { value: next })}
              renderInput={(params) => <TextField {...params} size="small" label="Value" />}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth color="error" variant="outlined" onClick={() => setFilters(filters.length === 1 ? [{ field: "academicyear", value: "" }] : filters.filter((_, i) => i !== index))}>Remove</Button>
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={() => setFilters([...filters, { field: "feeitem", value: "" }])}>Add dynamic filter</Button>
    </Stack>
  );
}

const ledgerColumns = [
  { field: "academicyear", headerName: "Year", width: 120 },
  { field: "student", headerName: "Student", minWidth: 180, flex: 1 },
  { field: "regno", headerName: "Reg No", width: 130 },
  { field: "programcode", headerName: "Program Code", width: 130 },
  { field: "semester", headerName: "Semester", width: 105 },
  { field: "feegroup", headerName: "Fee Group", minWidth: 160 },
  { field: "feeitem", headerName: "Fee Item", minWidth: 220, flex: 1 },
  { field: "amount", headerName: "Amount", width: 120, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "balance", headerName: "Balance", width: 120, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "Latefinedue", headerName: "Late Fine Due", width: 140, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "waiverstatus", headerName: "Waiver Status", width: 150, valueGetter: ({ row }) => row.waiver?.approvalstatus || "" }
];

const waiverColumns = [
  { field: "createdAt", headerName: "Applied On", width: 160, valueFormatter: ({ value }) => dateText(value) },
  { field: "student", headerName: "Student", minWidth: 180, flex: 1 },
  { field: "regno", headerName: "Reg No", width: 130 },
  { field: "programcode", headerName: "Program Code", width: 130 },
  { field: "feeitem", headerName: "Fee Item", minWidth: 210, flex: 1 },
  { field: "latefineamount", headerName: "Requested Fine", width: 150, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "waivedamount", headerName: "Waived", width: 125, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "approvalstatus", headerName: "Status", width: 125 },
  { field: "currentapproveremail", headerName: "Current Approver", minWidth: 190 },
  { field: "reason", headerName: "Reason", minWidth: 220, flex: 1 },
  { field: "approveddate", headerName: "Approved On", width: 160, valueFormatter: ({ value }) => dateText(value) }
];

export function LateFeeWaiverWorkflowPage() {
  const [options, setOptions] = useState({ users: [], workflows: [] });
  const [form, setForm] = useState({ id: "", level: 1, approvername: "", approveremail: "", active: "Yes", comments: "" });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/latefeewaiver/options", { params: { colid: global1.colid } });
      setOptions(res.data || { users: [], workflows: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load workflow");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setLoading(true);
    setError("");
    try {
      await ep1.post("/api/v2/latefeewaiver/workflow", { ...form, colid: global1.colid, user: global1.user, name: global1.name });
      setMessage("Late fee waiver workflow saved");
      setForm({ id: "", level: 1, approvername: "", approveremail: "", active: "Yes", comments: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save workflow");
    } finally {
      setLoading(false);
    }
  };
  const deleteRows = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} workflow row(s)?`)) return;
    await ep1.post("/api/v2/latefeewaiver/workflow-delete", { colid: global1.colid, ids: selected });
    setSelected([]);
    await load();
  };
  const rows = (options.workflows || []).map((row) => ({ ...row, id: row._id }));
  return (
    <MenuPageShell title="Late Fee Waiver Workflow">
      <Box sx={{ p: 3 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Workflow setup</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}>
              <UserSelect label="Approver" value={(options.users || []).find((user) => (user.email || user.user) === form.approveremail) || null} options={options.users} onChange={(user) => setForm({ ...form, approvername: user?.name || "", approveremail: user?.email || user?.user || "" })} />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Approver email" value={form.approveremail} onChange={(e) => setForm({ ...form, approveremail: e.target.value })} /></Grid>
            <Grid item xs={12} md={1.5}><TextField select fullWidth size="small" label="Active" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
            <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" startIcon={<Save />} onClick={save} disabled={loading}>Save</Button></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Comments" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} /></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ height: 520 }}>
          <Stack direction="row" spacing={1} sx={{ p: 1 }}>
            <Button color="error" variant="outlined" startIcon={<Delete />} disabled={!selected.length} onClick={deleteRows}>Delete selected</Button>
          </Stack>
          <DataGrid
            rows={rows}
            columns={[
              { field: "level", headerName: "Level", width: 100 },
              { field: "approvername", headerName: "Approver", minWidth: 200, flex: 1 },
              { field: "approveremail", headerName: "Approver Email", minWidth: 240 },
              { field: "active", headerName: "Active", width: 100 },
              { field: "comments", headerName: "Comments", minWidth: 220, flex: 1 },
              { field: "actions", headerName: "Actions", width: 100, renderCell: ({ row }) => <Tooltip title="Edit"><IconButton onClick={() => setForm({ id: row._id, level: row.level, approvername: row.approvername || "", approveremail: row.approveremail || "", active: row.active || "Yes", comments: row.comments || "" })}><Edit /></IconButton></Tooltip> }
            ]}
            checkboxSelection
            onRowSelectionModelChange={(model) => setSelected(selectionToArray(model))}
            slots={{ toolbar: GridToolbar }}
          />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function StudentLateFeeWaiverPage() {
  const [ledgerRows, setLedgerRows] = useState([]);
  const [statusRows, setStatusRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ledgerRes, statusRes] = await Promise.all([
        ep1.get("/api/v2/latefeewaiver/student-ledger", { params: { colid: global1.colid, regno: global1.regno, user: global1.user } }),
        ep1.get("/api/v2/latefeewaiver/status", { params: { colid: global1.colid, regno: global1.regno, user: global1.user } })
      ]);
      setLedgerRows((ledgerRes.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setStatusRows((statusRes.data?.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load late fee waiver data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const submit = async () => {
    if (!selected.length) return setError("Select at least one ledger item");
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/latefeewaiver/submit", { colid: global1.colid, ledgerids: selected, reason, user: global1.user, name: global1.name });
      setMessage(`Submitted ${res.data?.count || 0} late fee waiver request(s)`);
      setReason("");
      setSelected([]);
      await load();
      setTab(1);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit late fee waiver");
    } finally {
      setLoading(false);
    }
  };
  return (
    <MenuPageShell title="Late Fee Waiver" menuType="student">
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Late Fee Waiver</Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
          <Tab label="Apply" />
          <Tab label="Application status" />
        </Tabs>
        {tab === 0 && (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <TextField fullWidth multiline minRows={2} label="Reason for late fee waiver" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button sx={{ mt: 2 }} variant="contained" startIcon={<Send />} onClick={submit} disabled={loading || !selected.length}>Submit waiver request</Button>
            </Paper>
            <Paper sx={{ height: 540 }}>
              <DataGrid rows={ledgerRows} columns={ledgerColumns} checkboxSelection onRowSelectionModelChange={(model) => setSelected(selectionToArray(model))} slots={{ toolbar: GridToolbar }} />
            </Paper>
          </>
        )}
        {tab === 1 && (
          <Paper sx={{ height: 620 }}>
            <DataGrid rows={statusRows} columns={waiverColumns} slots={{ toolbar: GridToolbar }} />
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}

export function LateFeeWaiverApprovalPage() {
  const [tab, setTab] = useState(0);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/latefeewaiver/approvals", { params: { colid: global1.colid, user: global1.user, useremail: global1.email || global1.user } });
      setPending((res.data?.pending || []).map((row) => ({ ...row, id: row._id })));
      setApproved((res.data?.approved || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approvals");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const action = async (kind) => {
    if (!selectedRow) return setError("Select a request first");
    setLoading(true);
    setError("");
    try {
      await ep1.post(`/api/v2/latefeewaiver/${kind}`, { id: selectedRow._id, comments, user: global1.user, useremail: global1.email || global1.user, name: global1.name });
      setMessage(kind === "approve" ? "Waiver approved" : "Waiver rejected");
      setSelectedRow(null);
      setComments("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${kind} waiver`);
    } finally {
      setLoading(false);
    }
  };
  const rows = tab === 0 ? pending : approved;
  return (
    <MenuPageShell title="Late Fee Waiver Approval">
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={900}>Late Fee Waiver Approval</Typography>
          <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
        </Stack>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
          <Tab label={`Pending (${pending.length})`} />
          <Tab label={`Approved/Handled (${approved.length})`} />
        </Tabs>
        <Paper sx={{ height: 500, mb: 2 }}>
          <DataGrid rows={rows} columns={waiverColumns} onRowClick={({ row }) => setSelectedRow(row)} slots={{ toolbar: GridToolbar }} />
        </Paper>
        {selectedRow && (
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={900}>{selectedRow.student} - {selectedRow.feeitem}</Typography>
                <Typography variant="body2">Reg No: {selectedRow.regno} | Late fine: Rs. {money(selectedRow.latefineamount)} | Balance: Rs. {money(selectedRow.balance)}</Typography>
                <Typography variant="body2">Reason: {selectedRow.reason || "-"}</Typography>
              </Box>
              <TextField sx={{ flex: 1 }} multiline minRows={2} label="Approval comments" value={comments} onChange={(e) => setComments(e.target.value)} />
              {tab === 0 && <Stack spacing={1}><Button variant="contained" onClick={() => action("approve")} disabled={loading}>Approve</Button><Button variant="outlined" color="error" onClick={() => action("reject")} disabled={loading}>Reject</Button></Stack>}
            </Stack>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}

export function LateFeeWaiverRecordsPage() {
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/latefeewaiver/options", { params: { colid: global1.colid } });
    setOptions(res.data?.options || {});
  };
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/latefeewaiver/records", { colid: global1.colid, filters: filters.filter((item) => item.field && item.value) });
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load waiver records");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadOptions(); load(); }, []);
  const totals = rows.reduce((acc, row) => ({ count: acc.count + 1, waived: acc.waived + Number(row.waivedamount || 0), students: acc.students.add(row.regno) }), { count: 0, waived: 0, students: new Set() });
  return (
    <MenuPageShell title="Late Fee Waiver Records">
      <Box sx={{ p: 3 }}>
        <style>{`@media print{.no-print{display:none!important}.MuiDataGrid-toolbarContainer,.MuiDataGrid-footerContainer{display:none!important}}`}</style>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={900}>Late Fee Waiver Records</Typography>
          <Button className="no-print" startIcon={<Print />} variant="outlined" onClick={() => window.print()}>Print preview</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
          <DynamicFilters filters={filters} setFilters={setFilters} options={options} />
          <Button sx={{ mt: 2 }} variant="contained" onClick={load}>Load</Button>
        </Paper>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}><Card><CardContent><Typography variant="overline">Approved Records</Typography><Typography variant="h5" fontWeight={900}>{totals.count}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={4}><Card><CardContent><Typography variant="overline">Students</Typography><Typography variant="h5" fontWeight={900}>{totals.students.size}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={4}><Card><CardContent><Typography variant="overline">Waived Amount</Typography><Typography variant="h5" fontWeight={900}>Rs. {money(totals.waived)}</Typography></CardContent></Card></Grid>
        </Grid>
        <Paper sx={{ height: 650 }}>
          <DataGrid rows={rows} columns={waiverColumns} slots={{ toolbar: GridToolbar }} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
