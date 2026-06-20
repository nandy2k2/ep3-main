import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Delete, Edit, Logout, Print, Refresh, Save, Send, Verified } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const blankWorkflow = { id: "", department: "", level: 1, approverrole: "", approvername: "", approveremail: "", active: "Yes", remarks: "" };
const blankIndent = { id: "", department: global1.department || "", category: "", categorytype: "", item: "", description: "", quantity: 1, approximatevalue: 0, approximatetotalcost: 0 };

const useMessage = () => {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const clear = () => { setError(""); setMessage(""); };
  return { error, message, setError, setMessage, clear };
};

const Status = ({ error, message }) => (
  <>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
  </>
);

const loadInstitutionDetails = async () => {
  try {
    const res = await ep1.get("/api/institution", { params: { colid: global1.colid } });
    return Array.isArray(res.data) ? res.data[0] : res.data;
  } catch {
    return null;
  }
};

const dateTime = (value) => value ? new Date(value).toLocaleString() : "";

const IndentPrintPreview = ({ institution, indent, block }) => {
  if (!indent) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
        Select an approved indent to view the printable approval note.
      </Paper>
    );
  }
  const rows = [
    ["Department", indent.department],
    ["Category", indent.category],
    ["Budget type", indent.categorytype],
    ["Item", indent.item],
    ["Description", indent.description],
    ["Quantity", indent.quantity],
    ["Approx value/item", money(indent.approximatevalue)],
    ["Approx total cost", money(indent.approximatetotalcost)],
    ["Status", indent.status],
    ["Approved on", dateTime(indent.approvedat)],
    ["Submitted by", `${indent.submittedbyname || ""} ${indent.submittedby ? `(${indent.submittedby})` : ""}`]
  ];
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #d1d5db", borderRadius: 2, bgcolor: "#fff" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Approved Indent</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25, mb: 2 }}>
        {rows.map(([label, value]) => (
          <Box key={label} sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 1 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography fontWeight={700}>{value || "NA"}</Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>Approval History</Typography>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { border: "1px solid #d1d5db", p: 1, fontSize: 13 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead>
          <tr>
            <th>Action</th>
            <th>Stage</th>
            <th>Level</th>
            <th>User</th>
            <th>Comments</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {(indent.history || []).length ? (indent.history || []).map((item, index) => (
            <tr key={`${item.action}-${index}`}>
              <td>{item.action}</td>
              <td>{item.stage}</td>
              <td>{item.level}</td>
              <td>{item.username || item.useremail}</td>
              <td>{item.comments}</td>
              <td>{dateTime(item.time)}</td>
            </tr>
          )) : (
            <tr><td colSpan={6}>No approval history available.</td></tr>
          )}
        </tbody>
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}>
        <Typography>Prepared by</Typography>
        <Typography>Checked by</Typography>
        <Typography>Approved by</Typography>
      </Stack>
    </Paper>
  );
};

function PageTop({ title, subtitle, crumbs = [] }) {
  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Breadcrumbs sx={{ mb: 0.5 }}>
            <Link underline="hover" color="inherit" href="/dashdashfacnew">Dashboard</Link>
            <Link underline="hover" color="inherit" href="/purchasenewindent">Purchase new</Link>
            {crumbs.map((crumb) => crumb.href
              ? <Link key={crumb.label} underline="hover" color="inherit" href={crumb.href}>{crumb.label}</Link>
              : <Typography key={crumb.label} color="text.primary">{crumb.label}</Typography>)}
          </Breadcrumbs>
          <Typography variant="h5" fontWeight={900}>{title}</Typography>
          {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Button color="error" variant="outlined" startIcon={<Logout />} onClick={logout}>Logout</Button>
      </Stack>
    </Paper>
  );
}

function usePurchaseUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const loadUsers = async () => {
    const res = await ep1.get("/api/v2/purchasenew/users", { params: { colid: global1.colid } });
    setUsers(res.data.users || []);
    setDepartments(res.data.departments || []);
    setRoles(res.data.roles || []);
  };
  useEffect(() => { loadUsers().catch(() => {}); }, []);
  return { users, departments, roles };
}

function WorkflowPage({ institution = false }) {
  const { users, departments, roles } = usePurchaseUsers();
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankWorkflow);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const base = institution ? "/api/v2/purchasenew/institution-workflow" : "/api/v2/purchasenew/department-workflow";

  const reset = () => setForm(blankWorkflow);
  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get(base, { params: { colid: global1.colid } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load workflow");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, [base]);

  const save = async () => {
    if (!institution && !form.department) return setError("Department is required.");
    if (!form.approverrole) return setError("Approver role is required.");
    setSaving(true);
    clear();
    try {
      await ep1.post(base, { ...form, colid: global1.colid, user: global1.user });
      setMessage("Workflow saved.");
      reset();
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row) => {
    if (!window.confirm("Delete this workflow level?")) return;
    setSaving(true);
    try {
      await ep1.post(`${base}-delete`, { id: row._id });
      setMessage("Workflow deleted.");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete workflow");
    } finally {
      setSaving(false);
    }
  };

  const selectApprover = (user) => {
    setForm({ ...form, approvername: user?.name || "", approveremail: user?.email || "", approverrole: user?.role || form.approverrole });
  };

  const columns = [
    ...(!institution ? [{ field: "department", headerName: "Department", minWidth: 170 }] : []),
    { field: "level", headerName: "Level", width: 90 },
    { field: "approverrole", headerName: "Role", minWidth: 150 },
    { field: "approvername", headerName: "Approver", minWidth: 190 },
    { field: "approveremail", headerName: "Email", minWidth: 230 },
    { field: "active", headerName: "Active", width: 100 },
    { field: "remarks", headerName: "Remarks", minWidth: 220, flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <IconButton size="small" onClick={() => setForm({ ...row, id: row._id })}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => deleteRow(row)}><Delete fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title={institution ? "Institution indent workflow" : "Department indent workflow"}>
      <Box p={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>{institution ? "Institution indent workflow" : "Department indent workflow"}</Typography>
            <Typography color="text.secondary">Define dynamic indent approval levels.</Typography>
          </Box>
          <Button startIcon={<Refresh />} onClick={loadRows}>Refresh</Button>
        </Stack>
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {!institution && (
              <Grid item xs={12} md={3}>
                <Autocomplete freeSolo options={["All", ...departments]} value={form.department} onInputChange={(_, value) => setForm({ ...form, department: value || "" })} renderInput={(params) => <TextField {...params} label="Department" />} />
              </Grid>
            )}
            <Grid item xs={12} md={1.5}><TextField fullWidth label="Level" type="number" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></Grid>
            <Grid item xs={12} md={2.5}><Autocomplete freeSolo options={roles} value={form.approverrole} onInputChange={(_, value) => setForm({ ...form, approverrole: value || "" })} renderInput={(params) => <TextField {...params} label="Approver role" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={users} getOptionLabel={(option) => `${option.name || ""} - ${option.email || ""}`} onChange={(_, value) => selectApprover(value)} renderInput={(params) => <TextField {...params} label="Approver" />} /></Grid>
            <Grid item xs={12} md={2}><FormControl fullWidth><InputLabel>Active</InputLabel><Select label="Active" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={saving} onClick={save}>{saving ? "Saving..." : form.id ? "Update" : "Save"}</Button><Button variant="outlined" onClick={reset}>Cancel</Button></Stack></Grid>
          </Grid>
        </Paper>
        {loading && <LinearProgress />}
        <Paper sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Paper>
      </Box>
    </MenuPageShell>
  );
}

function indentColumns({ onEdit, onDelete, actionColumn = false, onApprove, onReject }) {
  return [
    ...(actionColumn ? [{
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => onApprove(row)}>Approve</Button>
          <Button size="small" color="error" onClick={() => onReject(row)}>Reject</Button>
        </Stack>
      )
    }] : [{
      field: "myactions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => row.status === "Draft" ? (
        <Stack direction="row">
          <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(row)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Stack>
      ) : null
    }]),
    { field: "department", headerName: "Department", minWidth: 150 },
    { field: "category", headerName: "Category", minWidth: 160 },
    { field: "categorytype", headerName: "Budget type", minWidth: 130 },
    { field: "item", headerName: "Item", minWidth: 180 },
    { field: "description", headerName: "Description", minWidth: 240, flex: 1 },
    { field: "quantity", headerName: "Qty", width: 90, type: "number" },
    { field: "approximatevalue", headerName: "Value/item", minWidth: 130, valueFormatter: (params) => money(params.value) },
    { field: "approximatetotalcost", headerName: "Total cost", minWidth: 140, valueFormatter: (params) => money(params.value) },
    { field: "status", headerName: "Status", minWidth: 190 },
    { field: "stage", headerName: "Stage", width: 120 },
    { field: "currentlevel", headerName: "Level", width: 90 },
    { field: "submittedbyname", headerName: "Created by", minWidth: 160 }
  ];
}

export function PurchaseNewIndentPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankIndent);
  const [budgetSummary, setBudgetSummary] = useState({ approved: 0, utilized: 0, remaining: 0, rows: [] });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    const res = await ep1.get("/api/v2/purchasenew/categories", { params: { colid: global1.colid, department: global1.department } });
    setCategories(res.data.data || []);
  };
  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/indents", { params: { colid: global1.colid, submittedby: global1.user } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load indents");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadCategories().catch(() => {}); loadRows(); }, []);
  useEffect(() => {
    loadBudgetSummary();
  }, [form.category, form.categorytype]);

  const categoryOptions = useMemo(() => categories.map((item) => ({ label: `${item.category} (${item.type})`, category: item.category, categorytype: item.type })), [categories]);
  const updateNumber = (field, value) => {
    const next = { ...form, [field]: value };
    const qty = Number(field === "quantity" ? value : next.quantity || 0);
    const rate = Number(field === "approximatevalue" ? value : next.approximatevalue || 0);
    next.approximatetotalcost = qty * rate;
    setForm(next);
  };
  const loadBudgetSummary = async () => {
    if (!form.category) {
      setBudgetSummary({ approved: 0, utilized: 0, remaining: 0, rows: [] });
      return;
    }
    try {
      const res = await ep1.get("/api/v2/purchasenew/budget-summary", {
        params: {
          colid: global1.colid,
          department: global1.department,
          category: form.category,
          categorytype: form.categorytype
        }
      });
      setBudgetSummary(res.data.data || { approved: 0, utilized: 0, remaining: 0, rows: [] });
    } catch {
      setBudgetSummary({ approved: 0, utilized: 0, remaining: 0, rows: [] });
    }
  };
  const reset = () => setForm(blankIndent);
  const save = async () => {
    setSaving(true);
    clear();
    try {
      await ep1.post("/api/v2/purchasenew/indents", { ...form, colid: global1.colid, department: global1.department, user: global1.user, useremail: global1.user, username: global1.name, role: global1.role });
      setMessage("Indent saved.");
      reset();
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save indent");
    } finally {
      setSaving(false);
    }
  };
  const submit = async () => {
    const draftIds = selected.filter((id) => rows.find((row) => row.id === id)?.status === "Draft");
    if (!draftIds.length) return setError("Select at least one draft indent.");
    setSaving(true);
    clear();
    try {
      await ep1.post("/api/v2/purchasenew/indents-submit", { colid: global1.colid, ids: draftIds, user: global1.user, useremail: global1.user, username: global1.name, role: global1.role });
      setMessage("Selected indent(s) submitted.");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit indents");
    } finally {
      setSaving(false);
    }
  };
  const deleteRow = async (row) => {
    if (!window.confirm("Delete this draft indent?")) return;
    await ep1.post("/api/v2/purchasenew/indents-delete", { id: row._id });
    await loadRows();
  };
  return (
    <MenuPageShell title="Create indent">
      <Box p={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box><Typography variant="h5" fontWeight={900}>Create indent</Typography><Typography color="text.secondary">Department is taken from your login: {global1.department || "NA"}</Typography></Box>
          <Button startIcon={<Refresh />} onClick={loadRows}>Refresh</Button>
        </Stack>
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label="Department" value={global1.department || ""} InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={categoryOptions} value={categoryOptions.find((item) => item.category === form.category && item.categorytype === form.categorytype) || null} onChange={(_, value) => setForm({ ...form, category: value?.category || "", categorytype: value?.categorytype || "" })} renderInput={(params) => <TextField {...params} label="Budget category" />} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Item" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 1.5, borderLeft: "5px solid #2563eb" }}><Typography variant="body2" color="text.secondary">Approved budget</Typography><Typography variant="h6" fontWeight={900}>{money(budgetSummary.approved)}</Typography></Paper></Grid>
                <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 1.5, borderLeft: "5px solid #f97316" }}><Typography variant="body2" color="text.secondary">Utilized</Typography><Typography variant="h6" fontWeight={900}>{money(budgetSummary.utilized)}</Typography></Paper></Grid>
                <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 1.5, borderLeft: "5px solid #16a34a" }}><Typography variant="body2" color="text.secondary">Remaining</Typography><Typography variant="h6" fontWeight={900}>{money(budgetSummary.remaining)}</Typography></Paper></Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Quantity" value={form.quantity} onChange={(e) => updateNumber("quantity", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Approx value/item" value={form.approximatevalue} onChange={(e) => updateNumber("approximatevalue", e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Approx total cost" value={form.approximatetotalcost} InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={12} md={6}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={saving} onClick={save}>{saving ? "Saving..." : form.id ? "Update" : "Save draft"}</Button><Button variant="contained" color="success" startIcon={<Send />} disabled={saving || !selected.length} onClick={submit}>Submit selected</Button><Button variant="outlined" onClick={reset}>Cancel</Button></Stack></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ height: 620 }}>
          <DataGrid rows={rows} columns={indentColumns({ onEdit: (row) => setForm({ ...row, id: row._id }), onDelete: deleteRow })} checkboxSelection isRowSelectable={(params) => params.row.status === "Draft"} rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(ids)} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

function ApprovalPage({ stage }) {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/approval-queue", { params: { colid: global1.colid, role: global1.role, department: global1.department, useremail: global1.user, stage } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approval queue");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, [stage]);
  const approve = async (row) => {
    setSaving(true); clear();
    try {
      await ep1.post("/api/v2/purchasenew/indents-approve", { id: row._id, useremail: global1.user, username: global1.name, role: global1.role, comments: "Approved" });
      setMessage("Indent approved.");
      await loadRows();
    } catch (err) { setError(err.response?.data?.message || "Unable to approve indent"); } finally { setSaving(false); }
  };
  const reject = async (row) => {
    const comments = window.prompt("Reason for rejection");
    if (comments === null) return;
    setSaving(true); clear();
    try {
      await ep1.post("/api/v2/purchasenew/indents-reject", { id: row._id, useremail: global1.user, username: global1.name, role: global1.role, comments });
      setMessage("Indent rejected.");
      await loadRows();
    } catch (err) { setError(err.response?.data?.message || "Unable to reject indent"); } finally { setSaving(false); }
  };
  const total = rows.reduce((sum, row) => sum + Number(row.approximatetotalcost || 0), 0);
  return (
    <MenuPageShell title={`${stage} indent approval`}>
      <Box p={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box><Typography variant="h5" fontWeight={900}>{stage} indent approval</Typography><Typography color="text.secondary">Approve indents pending for your role and user.</Typography></Box>
          <Stack direction="row" spacing={1}><Chip label={`Queue ${rows.length}`} color="primary" /><Chip label={money(total)} color="success" /><Button startIcon={<Refresh />} onClick={loadRows}>Refresh</Button></Stack>
        </Stack>
        <Status error={error} message={message} />
        {saving && <LinearProgress sx={{ mb: 1 }} />}
        <Paper sx={{ height: 640 }}><DataGrid rows={rows} columns={indentColumns({ actionColumn: true, onApprove: approve, onReject: reject })} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Paper>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewApprovedIndentsPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [department, setDepartment] = useState("");
  const loadInstitution = async () => setInstitution(await loadInstitutionDetails());
  const loadRows = async () => {
    setLoading(true);
    try {
      const params = { colid: global1.colid, status: "Approved" };
      if (department) params.department = department;
      const res = await ep1.get("/api/v2/purchasenew/indents", { params });
      const data = (res.data.data || []).map((row) => ({ ...row, id: row._id }));
      setRows(data);
      if (selectedIndent) setSelectedIndent(data.find((row) => row._id === selectedIndent._id) || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approved indents");
    } finally {
      setLoading(false);
    }
  };
  const loadBlocks = async (recordid = "") => {
    try {
      const res = await ep1.get("/api/v2/purchasenew/indent-blockchain-verify", { params: { colid: global1.colid, recordid } });
      setBlocks((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch {
      setBlocks([]);
    }
  };
  useEffect(() => {
    loadRows();
    loadBlocks();
    loadInstitution();
  }, []);
  const departments = useMemo(() => [...new Set(rows.map((row) => row.department).filter(Boolean))].sort(), [rows]);
  const total = rows.reduce((sum, row) => sum + Number(row.approximatetotalcost || 0), 0);
  const storeBlockchain = async () => {
    if (!selectedIndent) return setError("Select one approved indent first.");
    setSaving(true);
    clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/indent-blockchain-store", {
        colid: global1.colid,
        id: selectedIndent._id,
        user: global1.user,
        useremail: global1.user,
        username: global1.name
      });
      setMessage(res.data.message || "Approved indent stored in blockchain.");
      await loadBlocks(selectedIndent._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to store indent in blockchain.");
    } finally {
      setSaving(false);
    }
  };
  const previewIndent = selectedBlock?.payload?.indent || selectedIndent;
  const approvedColumns = [
    ...indentColumns({ actionColumn: false, onEdit: () => {}, onDelete: () => {} }).filter((col) => col.field !== "myactions"),
    { field: "approvedat", headerName: "Approved on", minWidth: 180, valueFormatter: (params) => dateTime(params.value) }
  ];
  const blockColumns = [
    { field: "blockindex", headerName: "Block", width: 90 },
    { field: "recordid", headerName: "Indent id", minWidth: 220 },
    { field: "hash", headerName: "Hash", minWidth: 280, flex: 1 },
    { field: "timestamp", headerName: "Stored on", minWidth: 190, valueFormatter: (params) => dateTime(params.value) },
    { field: "user", headerName: "Stored by", minWidth: 180 }
  ];
  return (
    <MenuPageShell title="Approved indents">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #purchase-new-approved-print, #purchase-new-approved-print * { visibility: visible; }
            #purchase-new-approved-print { position: absolute; left: 0; top: 0; width: 100%; background: #fff; padding: 14px; }
            .screen-only { display: none !important; }
          }
        `}</style>
        <Box className="screen-only">
          <PageTop title="Approved indents" subtitle="View approved indents, print approval notes and store/retrieve blockchain records." crumbs={[{ label: "Approved indents" }]} />
        </Box>
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}><FormControl fullWidth size="small"><InputLabel>Department</InputLabel><Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}><MenuItem value="">All</MenuItem>{departments.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} md={2}><Chip label={`${rows.length} approved`} color="primary" /></Grid>
            <Grid item xs={12} md={3}><Chip label={money(total)} color="success" /></Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" onClick={loadRows} startIcon={<Refresh />} disabled={loading}>Apply</Button>
                <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!previewIndent}>Print</Button>
                <Button variant="contained" color="success" startIcon={<Verified />} onClick={storeBlockchain} disabled={saving || !selectedIndent}>{saving ? "Storing..." : "Store blockchain"}</Button>
              </Stack>
            </Grid>
            {saving && <Grid item xs={12}><LinearProgress /></Grid>}
          </Grid>
        </Paper>

        <Paper className="screen-only" sx={{ height: 430, mb: 2, border: "1px solid #e5e7eb" }}>
          <DataGrid
            rows={rows}
            columns={approvedColumns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "approved_indents" } } }}
            pageSizeOptions={[25, 50, 100]}
            onRowClick={(params) => {
              setSelectedIndent(params.row);
              setSelectedBlock(null);
              loadBlocks(params.row._id);
            }}
          />
        </Paper>

        <Paper className="screen-only" sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Blockchain records</Typography>
          <Box sx={{ height: 280 }}>
            <DataGrid
              rows={blocks}
              columns={blockColumns}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "approved_indent_blockchain" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              onRowClick={(params) => setSelectedBlock(params.row)}
            />
          </Box>
        </Paper>

        <Box id="purchase-new-approved-print">
          <IndentPrintPreview institution={institution} indent={previewIndent} block={selectedBlock} />
        </Box>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewIndentHistoryPage() {
  const { error, message, setError } = useMessage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/indents", { params: { colid: global1.colid, submittedby: global1.user } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load indent history");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, []);
  const countBy = (status) => rows.filter((row) => row.status === status || row.stage === status).length;
  const columns = [
    ...indentColumns({ actionColumn: false, onEdit: () => {}, onDelete: () => {} }).filter((col) => col.field !== "myactions"),
    { field: "createdAt", headerName: "Created on", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "approvedat", headerName: "Approved on", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "rejectedreason", headerName: "Rejected reason", minWidth: 220 }
  ];
  return (
    <MenuPageShell title="Indent history">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Indent history" subtitle="Track every indent raised by you and see the latest approval status." crumbs={[{ label: "Indent history" }]} />
        <Status error={error} message={message} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[["Total", rows.length, "#2563eb"], ["Draft", countBy("Draft"), "#64748b"], ["Pending", rows.filter((row) => String(row.status || "").includes("Pending")).length, "#f97316"], ["Approved", countBy("Approved"), "#16a34a"], ["Rejected", countBy("Rejected"), "#dc2626"]].map(([label, value, color]) => (
            <Grid item xs={12} sm={6} md={2.4} key={label}>
              <Paper sx={{ p: 2, borderLeft: `5px solid ${color}` }}>
                <Typography color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={900}>{value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Paper sx={{ height: 650, border: "1px solid #e5e7eb" }}>
          <DataGrid rows={rows} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "indent_history" } } }} pageSizeOptions={[25, 50, 100]} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewIndentAuditLogPage() {
  const { error, message, setError } = useMessage();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const fields = ["department", "category", "categorytype", "item", "action", "status", "stage", "useremail"];

  const loadRows = async () => {
    setLoading(true);
    try {
      const params = { colid: global1.colid, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) };
      const res = await ep1.get("/api/v2/purchasenew/indent-audit-logs", { params });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load indent audit log");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, []);
  const optionsFor = (field) => [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  const columns = [
    { field: "timeofactivity", headerName: "Activity time", minWidth: 190, valueFormatter: (params) => dateTime(params.value) },
    { field: "action", headerName: "Action", minWidth: 220 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "category", headerName: "Category", minWidth: 160 },
    { field: "categorytype", headerName: "Budget type", minWidth: 130 },
    { field: "item", headerName: "Item", minWidth: 180 },
    { field: "status", headerName: "Status", minWidth: 190 },
    { field: "stage", headerName: "Stage", width: 130 },
    { field: "level", headerName: "Level", width: 90 },
    { field: "username", headerName: "User", minWidth: 170 },
    { field: "useremail", headerName: "Email", minWidth: 220 },
    { field: "role", headerName: "Role", minWidth: 130 },
    { field: "comments", headerName: "Comments", minWidth: 220, flex: 1 }
  ];
  return (
    <MenuPageShell title="Indent audit log">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Indent audit log" subtitle="Trace indent and workflow activity with user, status and timestamp details." crumbs={[{ label: "Indent audit log" }]} />
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb" }}>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid item xs={12} sm={6} md={3} key={field}>
                <FormControl fullWidth size="small">
                  <InputLabel>{field}</InputLabel>
                  <Select label={field} value={filters[field] || ""} onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}>
                    <MenuItem value="">All</MenuItem>
                    {optionsFor(field).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" startIcon={<Refresh />} onClick={loadRows} disabled={loading}>Apply</Button>
                <Button variant="outlined" onClick={() => setFilters({})}>Clear</Button>
                <Chip label={`${rows.length} activities`} color="primary" />
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ height: 650, border: "1px solid #e5e7eb" }}>
          <DataGrid rows={rows} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "indent_audit_log" } } }} pageSizeOptions={[25, 50, 100]} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewDepartmentWorkflowPage() { return <WorkflowPage />; }
export function PurchaseNewInstitutionWorkflowPage() { return <WorkflowPage institution />; }
export function PurchaseNewDepartmentApprovalPage() { return <ApprovalPage stage="Department" />; }
export function PurchaseNewInstitutionApprovalPage() { return <ApprovalPage stage="Institution" />; }
