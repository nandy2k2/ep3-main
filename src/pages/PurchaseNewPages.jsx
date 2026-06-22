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
import { useNavigate } from "react-router-dom";
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
const stopGridInputKeys = (event) => {
  event.stopPropagation();
};

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

const EmployeeIndentPrintPreview = ({ institution, employee, indents = [], block }) => {
  if (!employee) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
        Select an employee to print employee-wise approved indents.
      </Paper>
    );
  }
  const total = indents.reduce((sum, item) => sum + Number(item.approximatetotalcost || 0), 0);
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #d1d5db", borderRadius: 2, bgcolor: "#fff", mt: 2 }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Employee-wise Approved Indents</Typography>
        <Typography variant="subtitle2">{employee.name || employee.email} {employee.email ? `(${employee.email})` : ""}</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip label={`Approved indents: ${indents.length}`} color="primary" />
        <Chip label={`Total: ${money(total)}`} color="success" />
      </Stack>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { border: "1px solid #d1d5db", p: 1, fontSize: 13 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead>
          <tr>
            <th>Approved on</th>
            <th>Department</th>
            <th>Category</th>
            <th>Item</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {indents.length ? indents.map((item) => (
            <tr key={item._id}>
              <td>{dateTime(item.approvedat)}</td>
              <td>{item.department}</td>
              <td>{item.category}</td>
              <td>{item.item}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{money(item.approximatetotalcost)}</td>
            </tr>
          )) : <tr><td colSpan={7}>No approved indents found.</td></tr>}
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
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeBlock, setEmployeeBlock] = useState(null);
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
  const employees = useMemo(() => [...new Map(rows.filter((row) => row.submittedby).map((row) => [row.submittedby, { email: row.submittedby, name: row.submittedbyname || row.submittedby }])).values()].sort((a, b) => a.name.localeCompare(b.name)), [rows]);
  const selectedEmployee = employees.find((item) => item.email === employeeEmail) || null;
  const employeeIndents = employeeEmail ? rows.filter((row) => row.submittedby === employeeEmail) : [];
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
  const storeEmployeeBlockchain = async () => {
    if (!employeeEmail) return setError("Select one employee first.");
    setSaving(true);
    clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/employee-approved-indents-blockchain-store", {
        colid: global1.colid,
        employeeemail: employeeEmail,
        user: global1.user,
        useremail: global1.user,
        username: global1.name
      });
      setEmployeeBlock(res.data.data || null);
      setMessage(res.data.message || "Employee-wise approved indents stored in blockchain.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to store employee-wise indents in blockchain.");
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
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => `${option.name} - ${option.email}`}
                onChange={(_, value) => {
                  setEmployeeEmail(value?.email || "");
                  setEmployeeBlock(null);
                }}
                renderInput={(params) => <TextField {...params} size="small" label="Employee for print/blockchain" />}
              />
            </Grid>
            <Grid item xs={12} md={2}><Chip label={`${rows.length} approved`} color="primary" /></Grid>
            <Grid item xs={12} md={3}><Chip label={money(total)} color="success" /></Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" onClick={loadRows} startIcon={<Refresh />} disabled={loading}>Apply</Button>
                <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!previewIndent}>Print</Button>
                <Button variant="contained" color="success" startIcon={<Verified />} onClick={storeBlockchain} disabled={saving || !selectedIndent}>{saving ? "Storing..." : "Store blockchain"}</Button>
                <Button variant="contained" color="secondary" startIcon={<Verified />} onClick={storeEmployeeBlockchain} disabled={saving || !employeeEmail}>{saving ? "Storing..." : "Store employee indents"}</Button>
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
          <EmployeeIndentPrintPreview institution={institution} employee={selectedEmployee} indents={employeeIndents} block={employeeBlock} />
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

function GenericPurchaseWorkflowPage({ workflowtype, title }) {
  const { users, roles } = usePurchaseUsers();
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ id: "", level: 1, approverrole: "", approvername: "", approveremail: "", active: "Yes", remarks: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/generic-workflow", { params: { colid: global1.colid, workflowtype } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approval workflow");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRows(); }, [workflowtype]);
  const save = async () => {
    setSaving(true); clear();
    try {
      await ep1.post("/api/v2/purchasenew/generic-workflow", { ...form, colid: global1.colid, workflowtype, user: global1.user, username: global1.name, role: global1.role });
      setMessage("Approval workflow saved.");
      setForm({ id: "", level: 1, approverrole: "", approvername: "", approveremail: "", active: "Yes", remarks: "" });
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save approval workflow");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this approval level?")) return;
    await ep1.post("/api/v2/purchasenew/generic-workflow-delete", { id: row._id, user: global1.user, username: global1.name, role: global1.role });
    await loadRows();
  };
  const selectApprover = (user) => setForm({ ...form, approvername: user?.name || "", approveremail: user?.email || "", approverrole: user?.role || form.approverrole });
  const columns = [
    { field: "level", headerName: "Level", width: 90 },
    { field: "approverrole", headerName: "Role", minWidth: 160 },
    { field: "approvername", headerName: "Approver", minWidth: 190 },
    { field: "approveremail", headerName: "Email", minWidth: 230 },
    { field: "active", headerName: "Active", width: 110 },
    { field: "remarks", headerName: "Remarks", minWidth: 240, flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <IconButton size="small" onClick={() => setForm({ ...row, id: row._id })}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => remove(row)}><Delete fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];
  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title={title} subtitle="Create institution level dynamic approval levels." crumbs={[{ label: title }]} />
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></Grid>
            <Grid item xs={12} md={2.5}><Autocomplete freeSolo options={roles} value={form.approverrole} onInputChange={(_, value) => setForm({ ...form, approverrole: value || "" })} renderInput={(params) => <TextField {...params} label="Approver role" />} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete options={users} getOptionLabel={(option) => `${option.name || ""} - ${option.email || ""}`} onChange={(_, value) => selectApprover(value)} renderInput={(params) => <TextField {...params} label="Approver" />} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Active" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} disabled={saving} onClick={save}>{saving ? "Saving..." : form.id ? "Update" : "Save"}</Button><Button variant="outlined" onClick={() => setForm({ id: "", level: 1, approverrole: "", approvername: "", approveremail: "", active: "Yes", remarks: "" })}>Clear</Button></Stack></Grid>
          </Grid>
        </Paper>
        {loading && <LinearProgress />}
        <Paper sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[25, 50, 100]} /></Paper>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewCategoryOfficerPage() {
  const { users } = usePurchaseUsers();
  const { error, message, setError, setMessage, clear } = useMessage();
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ id: "", category: "", categorytype: "", officername: "", officeremail: "", active: "Yes", remarks: "" });
  const [loading, setLoading] = useState(false);
  const categoryOptions = useMemo(() => categories.map((item) => ({ label: `${item.category}${item.type ? ` (${item.type})` : ""}`, category: item.category, categorytype: item.type || "" })), [categories]);
  const load = async () => {
    setLoading(true);
    try {
      const [cat, officers] = await Promise.all([
        ep1.get("/api/v2/purchasenew/categories", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/purchasenew/category-officers", { params: { colid: global1.colid } })
      ]);
      setCategories(cat.data.data || []);
      setRows((officers.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load category purchase officers");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    clear();
    await ep1.post("/api/v2/purchasenew/category-officers", { ...form, colid: global1.colid, user: global1.user, username: global1.name, role: global1.role });
    setMessage("Category purchase officer saved.");
    setForm({ id: "", category: "", categorytype: "", officername: "", officeremail: "", active: "Yes", remarks: "" });
    await load();
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this mapping?")) return;
    await ep1.post("/api/v2/purchasenew/category-officers-delete", { id: row._id, user: global1.user, username: global1.name, role: global1.role });
    await load();
  };
  const columns = [
    { field: "category", headerName: "Category", minWidth: 170 },
    { field: "categorytype", headerName: "Type", minWidth: 130 },
    { field: "officername", headerName: "Purchase officer", minWidth: 200 },
    { field: "officeremail", headerName: "Email", minWidth: 240 },
    { field: "active", headerName: "Active", width: 110 },
    { field: "remarks", headerName: "Remarks", minWidth: 250, flex: 1 },
    { field: "actions", headerName: "Actions", width: 120, renderCell: ({ row }) => <Stack direction="row"><IconButton size="small" onClick={() => setForm({ ...row, id: row._id })}><Edit fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => remove(row)}><Delete fontSize="small" /></IconButton></Stack> }
  ];
  return (
    <MenuPageShell title="Category purchase officer">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Category purchase officer" subtitle="Assign approved indent categories to purchase officers." crumbs={[{ label: "Category purchase officer" }]} />
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Autocomplete options={categoryOptions} value={categoryOptions.find((item) => item.category === form.category && item.categorytype === form.categorytype) || null} onChange={(_, value) => setForm({ ...form, category: value?.category || "", categorytype: value?.categorytype || "" })} renderInput={(params) => <TextField {...params} label="Category" />} /></Grid>
            <Grid item xs={12} md={4}><Autocomplete options={users} getOptionLabel={(option) => `${option.name || ""} - ${option.email || ""}`} onChange={(_, value) => setForm({ ...form, officername: value?.name || "", officeremail: value?.email || "" })} renderInput={(params) => <TextField {...params} label="Purchase officer" />} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Active" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button><Button variant="outlined" onClick={() => setForm({ id: "", category: "", categorytype: "", officername: "", officeremail: "", active: "Yes", remarks: "" })}>Clear</Button></Stack></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[25, 50, 100]} /></Paper>
      </Box>
    </MenuPageShell>
  );
}

const geminiModelOptions = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
const blankRfp = { title: "", qualificationcriteria: "", experience: "", startdatetime: "", enddatetime: "", minimumbid: 0, cautiondeposit: 0, paymentterms: "", refundterms: "", deliveryterms: "", terms: "" };
const blankPurchaseNewVendor = {
  id: "",
  companyname: "",
  type: "Pvt Ltd",
  address: "",
  gstno: "",
  panno: "",
  tanno: "",
  contactperson: "",
  contactemail: "",
  contactphone: "",
  username: "",
  password: "",
  status: "Active",
  remarks: ""
};
const rfpBlockchainVerifyUrl = (block, rfp, colidOverride = "") => {
  if (!block && !rfp) return "";
  const params = new URLSearchParams();
  const colid = colidOverride || global1.colid || block?.colid || rfp?.colid || "";
  if (colid) params.set("colid", colid);
  if (block?.hash) params.set("hash", block.hash);
  if (block?.recordid || rfp?._id) params.set("recordid", block?.recordid || rfp?._id);
  return `${window.location.origin}/verify-purchase-rfp-blockchain?${params.toString()}`;
};
const approvedRfpsBlockchainVerifyUrl = (block, colidOverride = "") => {
  if (!block) return "";
  const params = new URLSearchParams();
  const colid = colidOverride || global1.colid || block?.colid || "";
  if (colid) params.set("colid", colid);
  if (block.hash) params.set("hash", block.hash);
  if (block.recordid) params.set("recordid", block.recordid);
  return `${window.location.origin}/verify-approved-rfps-blockchain?${params.toString()}`;
};
const rfpTermFields = [
  { field: "qualificationcriteria", label: "Qualification criteria" },
  { field: "experience", label: "Experience" },
  { field: "paymentterms", label: "Payment terms" },
  { field: "refundterms", label: "Refund terms" },
  { field: "deliveryterms", label: "Delivery terms" },
  { field: "terms", label: "Other terms" }
];

const RfpPrintPreview = ({ institution, rfp, block }) => {
  if (!rfp) return <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>Create or select an RFP to preview.</Paper>;
  const verificationLink = rfpBlockchainVerifyUrl(block, rfp);
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #d1d5db", bgcolor: "#fff" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} alt="Logo" />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Request for Proposal</Typography>
        <Typography variant="subtitle2">{rfp.rfpid} - {rfp.title}</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
        {block?.hash && verificationLink && (
          <Link href={verificationLink} target="_blank" rel="noreferrer" sx={{ wordBreak: "break-all", fontSize: 12 }}>
            Blockchain retrieval link: {verificationLink}
          </Link>
        )}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1, mb: 2 }}>
        {[["Category", rfp.category], ["Status", rfp.status], ["Start", dateTime(rfp.startdatetime)], ["End", dateTime(rfp.enddatetime)], ["Minimum bid", money(rfp.minimumbid)], ["Caution deposit", money(rfp.cautiondeposit)]].map(([label, value]) => (
          <Box key={label} sx={{ border: "1px solid #e5e7eb", p: 1, borderRadius: 1 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={700}>{value || "NA"}</Typography></Box>
        ))}
      </Box>
      <Typography variant="subtitle1" fontWeight={900}>Items</Typography>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2, "& th, & td": { border: "1px solid #d1d5db", p: 1, fontSize: 13 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Approx value</th><th>Department</th></tr></thead>
        <tbody>{(rfp.items || []).map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.description}</td><td>{item.quantity}</td><td>{money(item.approximatetotalcost)}</td><td>{item.department}</td></tr>)}</tbody>
      </Box>
      {[["Qualification criteria", rfp.qualificationcriteria], ["Experience", rfp.experience], ["Payment terms", rfp.paymentterms], ["Refund terms", rfp.refundterms], ["Delivery terms", rfp.deliveryterms], ["Other terms", rfp.terms]].map(([label, value]) => (
        <Box key={label} sx={{ mb: 1 }}><Typography fontWeight={900}>{label}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{value || "NA"}</Typography></Box>
      ))}
      <Typography variant="subtitle1" fontWeight={900} sx={{ mt: 2 }}>Documents</Typography>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2, "& th, & td": { border: "1px solid #d1d5db", p: 1, fontSize: 13 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead><tr><th>Type</th><th>Description</th><th>File</th><th>Link</th></tr></thead>
        <tbody>{(rfp.documents || []).length ? (rfp.documents || []).map((doc, index) => <tr key={`${doc.url}-${index}`}><td>{doc.documenttype}</td><td>{doc.description}</td><td>{doc.filename}</td><td>{doc.url ? <a href={doc.url} target="_blank" rel="noreferrer">{doc.url}</a> : ""}</td></tr>) : <tr><td colSpan={4}>No documents attached.</td></tr>}</tbody>
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}><Typography>Prepared by</Typography><Typography>Checked by</Typography><Typography>Approved by</Typography></Stack>
    </Paper>
  );
};

export function PurchaseNewOfficerWorkbenchPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("all");
  const [employee, setEmployee] = useState("");
  const [edited, setEdited] = useState({});
  const [rfpForm, setRfpForm] = useState(blankRfp);
  const [rfpDocuments, setRfpDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({ documenttype: "RFP Document", description: "" });
  const [createdRfp, setCreatedRfp] = useState(null);
  const [createdRfpBlock, setCreatedRfpBlock] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [provider, setProvider] = useState("Gemini");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [ollamaConfigs, setOllamaConfigs] = useState([]);
  const [ollamaConfigId, setOllamaConfigId] = useState("");
  const [aiInstruction, setAiInstruction] = useState("Make it precise, vendor-neutral and suitable for RFP.");
  const [rfpTermsAiRules, setRfpTermsAiRules] = useState("Use clear institutional purchase rules, measurable eligibility, transparent payment terms, practical delivery expectations and balanced refund terms.");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/officer-approved-indents", { params: { colid: global1.colid, officeremail: global1.user, view, submittedby: employee } });
      const data = (res.data.data || []).map((row) => ({ ...row, id: row._id }));
      setRows(data);
      setEmployees(res.data.employees || []);
      setSelected([]);
      setEdited(Object.fromEntries(data.map((row) => [row._id, { indentid: row._id, item: row.item, description: row.description }])));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approved indents for officer");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    loadInstitutionDetails().then(setInstitution);
    ep1.get("/api/v2/ollama-configuration", { params: { colid: global1.colid } }).then((res) => {
      const active = (res.data || []).filter((item) => String(item.active || "").toLowerCase() === "yes");
      setOllamaConfigs(active);
      setOllamaConfigId(active.find((item) => String(item.default || "").toLowerCase() === "yes")?._id || active[0]?._id || "");
    }).catch(() => setOllamaConfigs([]));
  }, []);
  const selectedRows = rows.filter((row) => selected.includes(row._id));
  const updateEdited = (id, patch) => setEdited((prev) => ({ ...prev, [id]: { ...(prev[id] || { indentid: id }), ...patch } }));
  const refine = async (row) => {
    setSaving(true); clear();
    try {
      const current = edited[row._id] || row;
      const res = await ep1.post("/api/v2/purchasenew/ai-refine-indent", { colid: global1.colid, item: current.item, description: current.description, instruction: aiInstruction, provider, geminiModel, ollamaConfigId });
      updateEdited(row._id, res.data.data || {});
      setMessage("AI refinement applied.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refine item with AI");
    } finally {
      setSaving(false);
    }
  };
  const refineRfpTerms = async () => {
    setSaving(true); clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/ai-refine-rfp-terms", {
        colid: global1.colid,
        title: rfpForm.title,
        terms: Object.fromEntries(rfpTermFields.map(({ field }) => [field, rfpForm[field]])),
        items: selected.map((id) => edited[id]).filter(Boolean),
        rules: rfpTermsAiRules,
        provider,
        geminiModel,
        ollamaConfigId
      });
      setRfpForm((prev) => ({ ...prev, ...(res.data.data || {}) }));
      setMessage("RFP terms refined with AI. You can edit them before creating the RFP.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refine RFP terms with AI");
    } finally {
      setSaving(false);
    }
  };
  const createRfp = async () => {
    if (!selected.length) return setError("Select at least one indent.");
    setSaving(true); clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/rfps", {
        ...rfpForm,
        colid: global1.colid,
        indentids: selected,
        items: selected.map((id) => edited[id]).filter(Boolean),
        documents: rfpDocuments,
        user: global1.user,
        useremail: global1.user,
        username: global1.name,
        officeremail: global1.user,
        officername: global1.name,
        role: global1.role
      });
      setCreatedRfp(res.data.data);
      setCreatedRfpBlock(null);
      setMessage("RFP created and sent for approval.");
      setRfpForm(blankRfp);
      setRfpDocuments([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create RFP");
    } finally {
      setSaving(false);
    }
  };
  const uploadRfpDocument = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingDocument(true);
    clear();
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("colid", global1.colid);
      formData.append("user", global1.user);
      formData.append("useremail", global1.user);
      formData.append("documenttype", documentForm.documenttype);
      formData.append("description", documentForm.description);
      const res = await ep1.post("/api/v2/purchasenew/rfp-document-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setRfpDocuments((prev) => [...prev, res.data.data]);
      setDocumentForm({ documenttype: "RFP Document", description: "" });
      setMessage("Document uploaded.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload RFP document");
    } finally {
      setUploadingDocument(false);
    }
  };
  const storeCreatedRfpBlockchain = async () => {
    if (!createdRfp?._id) return setError("Create or select one RFP first.");
    setSaving(true); clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/rfp-blockchain-store", {
        colid: global1.colid,
        id: createdRfp._id,
        user: global1.user,
        useremail: global1.user,
        username: global1.name
      });
      setCreatedRfpBlock(res.data.data || null);
      setMessage(res.data.message || "RFP stored in blockchain.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to store RFP in blockchain.");
    } finally {
      setSaving(false);
    }
  };
  const columns = [
    { field: "category", headerName: "Category", minWidth: 150 },
    { field: "submittedbyname", headerName: "Requested by", minWidth: 170 },
    { field: "createdAt", headerName: "Date/time", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "item", headerName: "Original item", minWidth: 170 },
    { field: "edititem", headerName: "RFP item", minWidth: 220, renderCell: ({ row }) => <TextField size="small" fullWidth value={edited[row._id]?.item || ""} onClick={(e) => e.stopPropagation()} onKeyDown={stopGridInputKeys} onChange={(e) => updateEdited(row._id, { item: e.target.value })} /> },
    { field: "editdescription", headerName: "RFP description", minWidth: 320, flex: 1, renderCell: ({ row }) => <TextField size="small" fullWidth value={edited[row._id]?.description || ""} onClick={(e) => e.stopPropagation()} onKeyDown={stopGridInputKeys} onChange={(e) => updateEdited(row._id, { description: e.target.value })} /> },
    { field: "ai", headerName: "AI", width: 100, renderCell: ({ row }) => <Button size="small" disabled={saving} onClick={(e) => { e.stopPropagation(); refine(row); }}>AI edit</Button> },
    { field: "quantity", headerName: "Qty", width: 90 },
    { field: "approximatetotalcost", headerName: "Cost", minWidth: 130, valueFormatter: (params) => money(params.value) }
  ];
  const createdRfpBlockchainLink = rfpBlockchainVerifyUrl(createdRfpBlock, createdRfp);
  return (
    <MenuPageShell title="Purchase officer workbench">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print { body * { visibility: hidden; } #rfp-print, #rfp-print * { visibility: visible; } #rfp-print { position: absolute; left: 0; top: 0; width: 100%; background: #fff; padding: 14px; } .screen-only { display:none !important; } }`}</style>
        <Box className="screen-only"><PageTop title="Purchase officer workbench" subtitle="Create RFPs from approved indents assigned by category." crumbs={[{ label: "Purchase officer workbench" }]} /></Box>
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><TextField select fullWidth label="View" value={view} onChange={(e) => setView(e.target.value)}><MenuItem value="all">All approved indents</MenuItem><MenuItem value="employee">Employee wise</MenuItem></TextField></Grid>
            <Grid item xs={12} md={3}><Autocomplete disabled={view !== "employee"} options={employees} getOptionLabel={(option) => `${option.name} - ${option.email}`} onChange={(_, value) => setEmployee(value?.email || "")} renderInput={(params) => <TextField {...params} label="Employee" />} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="AI provider" value={provider} onChange={(e) => setProvider(e.target.value)}><MenuItem value="Gemini">Gemini</MenuItem><MenuItem value="Ollama">Ollama</MenuItem></TextField></Grid>
            {provider === "Gemini" ? <Grid item xs={12} md={2}><TextField select fullWidth label="Gemini model" value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)}>{geminiModelOptions.map((model) => <MenuItem key={model} value={model}>{model}</MenuItem>)}</TextField></Grid> : <Grid item xs={12} md={3}><TextField select fullWidth label="Ollama" value={ollamaConfigId} onChange={(e) => setOllamaConfigId(e.target.value)}>{ollamaConfigs.map((item) => <MenuItem key={item._id} value={item._id}>{item.name} - {item.modelname}</MenuItem>)}</TextField></Grid>}
            <Grid item xs={12} md={3}><Button fullWidth sx={{ height: 56 }} variant="contained" startIcon={<Refresh />} onClick={load} disabled={loading}>Apply</Button></Grid>
            <Grid item xs={12}><TextField fullWidth label="AI edit instruction" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} /></Grid>
          </Grid>
        </Paper>
        {saving && <LinearProgress className="screen-only" sx={{ mb: 1 }} />}
        <Paper className="screen-only" sx={{ height: 480, mb: 2 }}>
          <DataGrid rows={rows} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(ids)} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[25, 50, 100]} />
        </Paper>
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Create RFP</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="RFP title" value={rfpForm.title} onChange={(e) => setRfpForm({ ...rfpForm, title: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="datetime-local" label="Start date time" InputLabelProps={{ shrink: true }} value={rfpForm.startdatetime} onChange={(e) => setRfpForm({ ...rfpForm, startdatetime: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="datetime-local" label="End date time" InputLabelProps={{ shrink: true }} value={rfpForm.enddatetime} onChange={(e) => setRfpForm({ ...rfpForm, enddatetime: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Minimum bid" value={rfpForm.minimumbid} onChange={(e) => setRfpForm({ ...rfpForm, minimumbid: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Caution deposit" value={rfpForm.cautiondeposit} onChange={(e) => setRfpForm({ ...rfpForm, cautiondeposit: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f8fafc" }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>AI refine RFP terms</Typography>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid item xs={12} md={9}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Rules for qualification, experience, payment, refund, delivery and other terms"
                      value={rfpTermsAiRules}
                      onChange={(e) => setRfpTermsAiRules(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button fullWidth sx={{ height: "100%", minHeight: 76 }} variant="contained" startIcon={<Send />} disabled={saving} onClick={refineRfpTerms}>
                      {saving ? "Refining..." : "Refine RFP terms"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            {rfpTermFields.map(({ field, label }) => <Grid item xs={12} md={6} key={field}><TextField fullWidth multiline minRows={2} label={label} value={rfpForm[field]} onChange={(e) => setRfpForm({ ...rfpForm, [field]: e.target.value })} /></Grid>)}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>RFP Documents</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}><TextField fullWidth label="Document type" value={documentForm.documenttype} onChange={(e) => setDocumentForm({ ...documentForm, documenttype: e.target.value })} /></Grid>
                  <Grid item xs={12} md={5}><TextField fullWidth label="Description" value={documentForm.description} onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} /></Grid>
                  <Grid item xs={12} md={4}>
                    <Button fullWidth variant="outlined" component="label" disabled={uploadingDocument} sx={{ height: 56 }}>
                      {uploadingDocument ? "Uploading..." : "Upload document to AWS"}
                      <input type="file" hidden onChange={uploadRfpDocument} />
                    </Button>
                  </Grid>
                  {uploadingDocument && <Grid item xs={12}><LinearProgress /></Grid>}
                  <Grid item xs={12}>
                    <Stack spacing={0.75}>
                      {rfpDocuments.length ? rfpDocuments.map((doc, index) => (
                        <Paper key={`${doc.url}-${index}`} variant="outlined" sx={{ p: 1 }}>
                          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                            <Box>
                              <Typography fontWeight={800}>{doc.documenttype || "RFP Document"} - {doc.filename}</Typography>
                              <Typography variant="body2" color="text.secondary">{doc.description}</Typography>
                              <Link href={doc.url} target="_blank" rel="noreferrer">{doc.url}</Link>
                            </Box>
                            <Button color="error" size="small" onClick={() => setRfpDocuments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                          </Stack>
                        </Paper>
                      )) : <Typography variant="body2" color="text.secondary">No documents uploaded yet.</Typography>}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Chip label={`${selectedRows.length} indents selected`} color="primary" /><Button variant="contained" disabled={saving || !selected.length} onClick={createRfp}>Create RFP</Button><Button variant="outlined" startIcon={<Print />} disabled={!createdRfp} onClick={() => window.print()}>Print RFP</Button><Button variant="contained" color="success" startIcon={<Verified />} disabled={saving || !createdRfp} onClick={storeCreatedRfpBlockchain}>{saving ? "Storing..." : "Store RFP blockchain"}</Button>{createdRfpBlockchainLink && <Button variant="outlined" href={createdRfpBlockchainLink} target="_blank" rel="noreferrer">Open blockchain retrieval</Button>}</Stack></Grid>
          </Grid>
        </Paper>
        <Box id="rfp-print"><RfpPrintPreview institution={institution} rfp={createdRfp} block={createdRfpBlock} /></Box>
      </Box>
    </MenuPageShell>
  );
}

function RfpApprovalPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/rfp-approval-queue", { params: { colid: global1.colid, role: global1.role, useremail: global1.user } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load RFP approval queue");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); loadInstitutionDetails().then(setInstitution); }, []);
  const action = async (row, mode) => {
    const comments = mode === "reject" ? window.prompt("Reason for rejection") : "Approved";
    if (comments === null) return;
    setSaving(true); clear();
    try {
      await ep1.post(`/api/v2/purchasenew/rfps-${mode === "approve" ? "approve" : "reject"}`, { id: row._id, useremail: global1.user, username: global1.name, role: global1.role, comments });
      setMessage(mode === "approve" ? "RFP approved." : "RFP rejected.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update RFP");
    } finally {
      setSaving(false);
    }
  };
  const storeSelectedRfpBlockchain = async () => {
    if (!selected?._id) return setError("Select one RFP first.");
    setSaving(true); clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/rfp-blockchain-store", {
        colid: global1.colid,
        id: selected._id,
        user: global1.user,
        useremail: global1.user,
        username: global1.name
      });
      setSelectedBlock(res.data.data || null);
      setMessage(res.data.message || "RFP stored in blockchain.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to store RFP in blockchain.");
    } finally {
      setSaving(false);
    }
  };
  const columns = [
    { field: "rfpid", headerName: "RFP ID", minWidth: 150 },
    { field: "title", headerName: "Title", minWidth: 240, flex: 1 },
    { field: "category", headerName: "Category", minWidth: 150 },
    { field: "status", headerName: "Status", minWidth: 190 },
    { field: "currentlevel", headerName: "Level", width: 90 },
    { field: "startdatetime", headerName: "Start", minWidth: 170, valueFormatter: (params) => dateTime(params.value) },
    { field: "enddatetime", headerName: "End", minWidth: 170, valueFormatter: (params) => dateTime(params.value) },
    { field: "actions", headerName: "Actions", width: 180, renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button size="small" onClick={() => action(row, "approve")}>Approve</Button><Button size="small" color="error" onClick={() => action(row, "reject")}>Reject</Button></Stack> }
  ];
  return (
    <MenuPageShell title="RFP approval">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print { body * { visibility:hidden; } #rfp-approval-print, #rfp-approval-print * { visibility:visible; } #rfp-approval-print { position:absolute; left:0; top:0; width:100%; background:#fff; padding:14px; } .screen-only { display:none !important; } }`}</style>
        <Box className="screen-only"><PageTop title="RFP approval" subtitle="Approve RFPs pending for your configured level." crumbs={[{ label: "RFP approval" }]} /></Box>
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>Refresh</Button>
            <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!selected}>Print selected RFP</Button>
            <Button variant="contained" color="success" startIcon={<Verified />} onClick={storeSelectedRfpBlockchain} disabled={saving || !selected}>{saving ? "Storing..." : "Store RFP blockchain"}</Button>
          </Stack>
        </Paper>
        {saving && <LinearProgress className="screen-only" sx={{ mb: 1 }} />}
        <Paper className="screen-only" sx={{ height: 520, mb: 2 }}><DataGrid rows={rows} columns={columns} loading={loading} onRowClick={(params) => { setSelected(params.row); setSelectedBlock(null); }} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[25, 50, 100]} /></Paper>
        <Box id="rfp-approval-print"><RfpPrintPreview institution={institution} rfp={selected} block={selectedBlock} /></Box>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewPoWorkflowPage() { return <GenericPurchaseWorkflowPage workflowtype="PurchaseOrder" title="Purchase order approval workflow" />; }
export function PurchaseNewFinanceWorkflowPage() { return <GenericPurchaseWorkflowPage workflowtype="FinancePayment" title="Finance payment approval workflow" />; }
export function PurchaseNewRfpWorkflowPage() { return <GenericPurchaseWorkflowPage workflowtype="RFP" title="RFP approval workflow" />; }
export function PurchaseNewRfpApprovalPage() { return <RfpApprovalPage />; }

export function PurchaseNewVendorPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankPurchaseNewVendor);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/vendors", { params: { colid: global1.colid } });
      setRows((res.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  const save = async () => {
    setSaving(true);
    clear();
    try {
      await ep1.post("/api/v2/purchasenew/vendors", { ...form, colid: global1.colid, user: global1.user, username1: global1.name });
      setMessage(form.id ? "Vendor updated." : "Vendor created.");
      setForm(blankPurchaseNewVendor);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this vendor?")) return;
    setSaving(true);
    clear();
    try {
      await ep1.post("/api/v2/purchasenew/vendors-delete", { id: row._id });
      setMessage("Vendor deleted.");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete vendor");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "companyname", headerName: "Company", minWidth: 220, flex: 1 },
    { field: "type", headerName: "Type", minWidth: 150 },
    { field: "username", headerName: "Username", minWidth: 170 },
    { field: "password", headerName: "Password", minWidth: 150 },
    { field: "gstno", headerName: "GST No", minWidth: 160 },
    { field: "panno", headerName: "PAN No", minWidth: 150 },
    { field: "tanno", headerName: "TAN No", minWidth: 150 },
    { field: "contactperson", headerName: "Contact", minWidth: 170 },
    { field: "contactemail", headerName: "Email", minWidth: 220 },
    { field: "contactphone", headerName: "Phone", minWidth: 150 },
    { field: "status", headerName: "Status", minWidth: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <IconButton size="small" onClick={() => setForm({ ...row, id: row._id })}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => remove(row)}><Delete fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title="Purchase new vendor">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Purchase new vendor" subtitle="Create and maintain vendors for the new purchase module." crumbs={[{ label: "Purchase new" }, { label: "Vendor master" }]} />
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{form.id ? "Edit vendor" : "Add vendor"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Company name" value={form.companyname} onChange={(e) => setForm({ ...form, companyname: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><MenuItem value="Pvt Ltd">Pvt Ltd</MenuItem><MenuItem value="Proprietorship">Proprietorship</MenuItem></TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="GST No" value={form.gstno} onChange={(e) => setForm({ ...form, gstno: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="PAN No" value={form.panno} onChange={(e) => setForm({ ...form, panno: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="TAN No" value={form.tanno} onChange={(e) => setForm({ ...form, tanno: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Contact person" value={form.contactperson} onChange={(e) => setForm({ ...form, contactperson: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Contact email" value={form.contactemail} onChange={(e) => setForm({ ...form, contactemail: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Contact phone" value={form.contactphone} onChange={(e) => setForm({ ...form, contactphone: e.target.value })} /></Grid>
            <Grid item xs={12} md={5}><TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" startIcon={<Save />} disabled={saving} onClick={save}>{saving ? "Saving..." : form.id ? "Update vendor" : "Create vendor"}</Button>
                <Button variant="outlined" onClick={() => setForm(blankPurchaseNewVendor)}>Clear</Button>
                <Button variant="outlined" startIcon={<Refresh />} onClick={loadRows} disabled={loading}>Refresh</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        {saving && <LinearProgress sx={{ mb: 1 }} />}
        <Paper sx={{ height: 600 }}>
          <DataGrid rows={rows} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[25, 50, 100]} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewRfpVendorAssignmentPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rfps, setRfps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedRfp, setSelectedRfp] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rfpRes, vendorRes, assignmentRes] = await Promise.all([
        ep1.get("/api/v2/purchasenew/rfps", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/purchasenew/vendors", { params: { colid: global1.colid, status: "Active" } }),
        ep1.get("/api/v2/purchasenew/rfp-vendor-assignments", { params: { colid: global1.colid } })
      ]);
      setRfps((rfpRes.data.data || []).filter((row) => String(row.status || "").toLowerCase() === "approved"));
      setVendors(vendorRes.data.data || []);
      setAssignments((assignmentRes.data.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load RFP vendor assignment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const assign = async () => {
    if (!selectedRfp?._id) return setError("Select one approved RFP.");
    if (!selectedVendors.length) return setError("Select at least one vendor.");
    setSaving(true);
    clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/rfp-vendor-assignments", {
        colid: global1.colid,
        rfpId: selectedRfp._id,
        vendorIds: selectedVendors.map((vendor) => vendor._id),
        remarks,
        user: global1.user,
        username: global1.name
      });
      setMessage(res.data.message || "Vendors assigned to RFP.");
      setSelectedVendors([]);
      setRemarks("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign vendors");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Remove this vendor assignment?")) return;
    setSaving(true);
    clear();
    try {
      await ep1.post("/api/v2/purchasenew/rfp-vendor-assignments-delete", { id: row._id });
      setMessage("Vendor assignment removed.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove assignment");
    } finally {
      setSaving(false);
    }
  };

  const assignmentColumns = [
    { field: "rfpid", headerName: "RFP ID", minWidth: 150 },
    { field: "rfptitle", headerName: "RFP title", minWidth: 260, flex: 1 },
    { field: "vendorname", headerName: "Vendor", minWidth: 220 },
    { field: "vendorusername", headerName: "Username", minWidth: 160 },
    { field: "vendoremail", headerName: "Email", minWidth: 220 },
    { field: "vendorphone", headerName: "Phone", minWidth: 150 },
    { field: "status", headerName: "Status", minWidth: 130 },
    { field: "assignedbyname", headerName: "Assigned by", minWidth: 170 },
    { field: "assignedat", headerName: "Assigned at", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "remarks", headerName: "Remarks", minWidth: 220 },
    { field: "actions", headerName: "Actions", width: 100, sortable: false, filterable: false, renderCell: ({ row }) => <IconButton size="small" color="error" onClick={() => remove(row)}><Delete fontSize="small" /></IconButton> }
  ];

  return (
    <MenuPageShell title="Vendor RFP assignment">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Vendor RFP assignment" subtitle="Assign approved RFPs to selected Purchase New vendors." crumbs={[{ label: "Purchase new" }, { label: "Vendor RFP assignment" }]} />
        <Status error={error} message={message} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Autocomplete options={rfps} value={selectedRfp} getOptionLabel={(option) => `${option.rfpid || ""} - ${option.title || ""}`} onChange={(_, value) => setSelectedRfp(value)} renderInput={(params) => <TextField {...params} label="Approved RFP" />} />
            </Grid>
            <Grid item xs={12} md={5}>
              <Autocomplete multiple options={vendors} value={selectedVendors} getOptionLabel={(option) => `${option.companyname || ""} (${option.username || ""})`} onChange={(_, value) => setSelectedVendors(value)} renderInput={(params) => <TextField {...params} label="Vendors" />} />
            </Grid>
            <Grid item xs={12} md={2}><Button fullWidth sx={{ height: 56 }} variant="contained" startIcon={<Send />} disabled={saving || loading} onClick={assign}>{saving ? "Assigning..." : "Assign"}</Button></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Grid>
          </Grid>
        </Paper>
        {(loading || saving) && <LinearProgress sx={{ mb: 1 }} />}
        <Paper sx={{ height: 620 }}>
          <DataGrid rows={assignments} columns={assignmentColumns} loading={loading} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} pageSizeOptions={[25, 50, 100]} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

const ApprovedRfpsPrintPreview = ({ institution, rows = [], block, filters = {}, fromDate = "", toDate = "" }) => {
  const totalMinBid = rows.reduce((sum, row) => sum + Number(row.minimumbid || 0), 0);
  const totalDeposit = rows.reduce((sum, row) => sum + Number(row.cautiondeposit || 0), 0);
  const link = block ? approvedRfpsBlockchainVerifyUrl(block, block.colid) : "";
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #d1d5db", bgcolor: "#fff" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 76, maxWidth: 170, objectFit: "contain" }} />}
        <Typography variant="h5" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Approved RFP Report</Typography>
        <Typography variant="body2">From: {fromDate || "All"} | To: {toDate || "All"} | Count: {rows.length}</Typography>
        {block?.hash && <Chip color="success" label="Stored in blockchain" />}
        {block?.hash && <Typography variant="caption" sx={{ wordBreak: "break-all" }}>Hash: {block.hash}</Typography>}
        {link && <Typography variant="caption" sx={{ wordBreak: "break-all" }}>Retrieval link: {link}</Typography>}
      </Stack>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">Approved RFPs</Typography><Typography variant="h6" fontWeight={900}>{rows.length}</Typography></Paper></Grid>
        <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">Total minimum bid</Typography><Typography variant="h6" fontWeight={900}>{money(totalMinBid)}</Typography></Paper></Grid>
        <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">Total caution deposit</Typography><Typography variant="h6" fontWeight={900}>{money(totalDeposit)}</Typography></Paper></Grid>
      </Grid>
      {Object.values(filters).some(Boolean) && (
        <Box sx={{ mb: 2 }}>
          <Typography fontWeight={900}>Selected filters</Typography>
          <Typography variant="body2">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(" | ")}</Typography>
        </Box>
      )}
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { border: "1px solid #d1d5db", p: 0.8, fontSize: 12 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead>
          <tr>
            <th>RFP ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Officer</th>
            <th>Approved on</th>
            <th>Start</th>
            <th>End</th>
            <th>Minimum bid</th>
            <th>Caution deposit</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row._id || row.rfpid}>
              <td>{row.rfpid}</td>
              <td>{row.title}</td>
              <td>{row.category}</td>
              <td>{row.officername || row.officeremail}</td>
              <td>{dateTime(row.approvedat)}</td>
              <td>{dateTime(row.startdatetime)}</td>
              <td>{dateTime(row.enddatetime)}</td>
              <td>{money(row.minimumbid)}</td>
              <td>{money(row.cautiondeposit)}</td>
            </tr>
          )) : <tr><td colSpan={9}>No approved RFP found.</td></tr>}
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

export function PurchaseNewApprovedRfpsPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [filters, setFilters] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rfpSaving, setRfpSaving] = useState(false);
  const [block, setBlock] = useState(null);
  const [selectedRfp, setSelectedRfp] = useState(null);
  const [selectedRfpBlock, setSelectedRfpBlock] = useState(null);
  const filterFields = ["rfpid", "title", "category", "categorytype", "officername", "officeremail"];

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/rfps", { params: { colid: global1.colid, status: "Approved" } });
      const nextRows = (res.data.data || []).map((row) => ({ ...row, id: row._id }));
      setRows(nextRows);
      if (selectedRfp?._id) {
        const freshSelection = nextRows.find((row) => row._id === selectedRfp._id);
        setSelectedRfp(freshSelection || null);
        if (!freshSelection) setSelectedRfpBlock(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approved RFPs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    loadInstitutionDetails().then(setInstitution);
  }, []);

  const optionsFor = (field) => {
    const source = rows.filter((row) => Object.entries(filters).every(([key, value]) => {
      if (!value || key === field) return true;
      return String(row[key] ?? "") === String(value);
    }));
    return [...new Set(source.map((row) => row[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  };

  const filteredRows = useMemo(() => rows.filter((row) => {
    const approvedTime = row.approvedat ? new Date(row.approvedat).getTime() : 0;
    if (fromDate && approvedTime < new Date(fromDate).setHours(0, 0, 0, 0)) return false;
    if (toDate && approvedTime > new Date(toDate).setHours(23, 59, 59, 999)) return false;
    return Object.entries(filters).every(([key, value]) => !value || String(row[key] ?? "") === String(value));
  }), [rows, filters, fromDate, toDate]);

  const storeBlockchain = async () => {
    if (!filteredRows.length) return setError("No approved RFPs available to store.");
    setSaving(true);
    clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/approved-rfps-blockchain-store", {
        colid: global1.colid,
        fromdate: fromDate,
        todate: toDate,
        filters,
        user: global1.user,
        useremail: global1.user,
        username: global1.name
      });
      setBlock(res.data.data || null);
      setMessage(res.data.message || "Approved RFP report stored in blockchain.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to store approved RFP report in blockchain");
    } finally {
      setSaving(false);
    }
  };

  const storeSelectedRfpBlockchain = async () => {
    if (!selectedRfp?._id) return setError("Select one approved RFP first.");
    setRfpSaving(true);
    clear();
    try {
      const res = await ep1.post("/api/v2/purchasenew/rfp-blockchain-store", {
        colid: global1.colid,
        id: selectedRfp._id,
        user: global1.user,
        useremail: global1.user,
        username: global1.name
      });
      setSelectedRfpBlock(res.data.data || null);
      setMessage(res.data.message || "Selected RFP stored in blockchain.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to store selected RFP in blockchain.");
    } finally {
      setRfpSaving(false);
    }
  };

  const printSection = (section) => {
    const reportClass = "print-approved-rfps-report";
    const detailClass = "print-approved-rfp-detail";
    document.body.classList.remove(reportClass, detailClass);
    document.body.classList.add(section === "rfp" ? detailClass : reportClass);
    window.print();
    setTimeout(() => document.body.classList.remove(reportClass, detailClass), 500);
  };

  const columns = [
    { field: "rfpid", headerName: "RFP ID", minWidth: 150 },
    { field: "title", headerName: "Title", minWidth: 260, flex: 1 },
    { field: "category", headerName: "Category", minWidth: 150 },
    { field: "categorytype", headerName: "Type", minWidth: 140 },
    { field: "officername", headerName: "Officer", minWidth: 170 },
    { field: "officeremail", headerName: "Officer email", minWidth: 220 },
    { field: "approvedat", headerName: "Approved on", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "startdatetime", headerName: "Start", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "enddatetime", headerName: "End", minWidth: 180, valueFormatter: (params) => dateTime(params.value) },
    { field: "minimumbid", headerName: "Minimum bid", minWidth: 140, valueFormatter: (params) => money(params.value) },
    { field: "cautiondeposit", headerName: "Caution deposit", minWidth: 150, valueFormatter: (params) => money(params.value) }
  ];
  const retrievalLink = approvedRfpsBlockchainVerifyUrl(block, global1.colid);
  const selectedRfpRetrievalLink = selectedRfpBlock ? rfpBlockchainVerifyUrl(selectedRfpBlock, selectedRfp, global1.colid) : "";

  return (
    <MenuPageShell title="Approved RFPs">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print { body * { visibility:hidden; } body.print-approved-rfps-report #approved-rfps-print, body.print-approved-rfps-report #approved-rfps-print *, body.print-approved-rfp-detail #approved-rfp-detail-print, body.print-approved-rfp-detail #approved-rfp-detail-print * { visibility:visible; } body.print-approved-rfps-report #approved-rfps-print, body.print-approved-rfp-detail #approved-rfp-detail-print { position:absolute; left:0; top:0; width:100%; background:#fff; padding:14px; } .screen-only { display:none !important; } }`}</style>
        <Box className="screen-only"><PageTop title="Approved RFPs" subtitle="Search, print and store approved RFP reports in blockchain." crumbs={[{ label: "Purchase new" }, { label: "Approved RFPs" }]} /></Box>
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><TextField fullWidth type="date" label="From date" InputLabelProps={{ shrink: true }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="date" label="To date" InputLabelProps={{ shrink: true }} value={toDate} onChange={(e) => setToDate(e.target.value)} /></Grid>
            {filterFields.map((field) => (
              <Grid item xs={12} md={2} key={field}>
                <TextField select fullWidth label={field} value={filters[field] || ""} onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}>
                  <MenuItem value="">All</MenuItem>
                  {optionsFor(field).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                </TextField>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip color="primary" label={`${filteredRows.length} approved RFPs`} />
                {selectedRfp && <Chip color="secondary" variant="outlined" label={`Selected: ${selectedRfp.rfpid || selectedRfp.title}`} />}
                <Button variant="outlined" startIcon={<Refresh />} onClick={loadRows} disabled={loading}>Refresh</Button>
                <Button variant="outlined" startIcon={<Print />} onClick={() => printSection("report")} disabled={!filteredRows.length}>Print report</Button>
                <Button variant="contained" color="success" startIcon={<Verified />} onClick={storeBlockchain} disabled={saving || !filteredRows.length}>{saving ? "Storing..." : "Store in blockchain"}</Button>
                {retrievalLink && <Button variant="outlined" href={retrievalLink} target="_blank" rel="noreferrer">Open blockchain retrieval</Button>}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        {(loading || saving || rfpSaving) && <LinearProgress className="screen-only" sx={{ mb: 1 }} />}
        <Paper className="screen-only" sx={{ height: 620, mb: 2 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            pageSizeOptions={[25, 50, 100]}
            onRowClick={(params) => {
              setSelectedRfp(params.row);
              setSelectedRfpBlock(null);
            }}
          />
        </Paper>
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900}>Individual RFP</Typography>
              <Typography variant="body2" color="text.secondary">
                Select one row above to view the full printable RFP, store it in blockchain, and retrieve the verified copy.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="outlined" startIcon={<Print />} onClick={() => printSection("rfp")} disabled={!selectedRfp}>Print selected RFP</Button>
              <Button variant="contained" color="success" startIcon={<Verified />} onClick={storeSelectedRfpBlockchain} disabled={rfpSaving || !selectedRfp}>
                {rfpSaving ? "Storing..." : "Store selected RFP"}
              </Button>
              {selectedRfpRetrievalLink && <Button variant="outlined" href={selectedRfpRetrievalLink} target="_blank" rel="noreferrer">Retrieve selected RFP</Button>}
            </Stack>
          </Stack>
        </Paper>
        <Box id="approved-rfp-detail-print" sx={{ mb: 2 }}>
          <RfpPrintPreview institution={institution} rfp={selectedRfp} block={selectedRfpBlock} />
        </Box>
        <Box id="approved-rfps-print"><ApprovedRfpsPrintPreview institution={institution} rows={filteredRows} block={block} filters={filters} fromDate={fromDate} toDate={toDate} /></Box>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewApprovedRfpsBlockchainVerifyPage() {
  const { error, message, setError } = useMessage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [institution, setInstitution] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const colid = params.get("colid") || "";
  const hash = params.get("hash") || "";
  const recordid = params.get("recordid") || params.get("id") || "";

  const loadRecord = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/approved-rfps-blockchain-verify", { params: { colid, hash, recordid } });
      const record = Array.isArray(res.data?.data) ? res.data.data[0] : res.data?.data;
      setResult(record || null);
      const institutionColid = record?.colid || colid;
      if (institutionColid) {
        const ins = await ep1.get("/api/institution", { params: { colid: institutionColid } });
        setInstitution(Array.isArray(ins.data) ? ins.data[0] : ins.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to retrieve approved RFP report from blockchain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecord(); }, []);

  const payload = result?.payload || {};
  const rows = payload.rfps || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
      <style>{`@media print { body * { visibility:hidden; } #approved-rfps-blockchain-print, #approved-rfps-blockchain-print * { visibility:visible; } #approved-rfps-blockchain-print { position:absolute; left:0; top:0; width:100%; background:#fff; padding:14px; } .screen-only { display:none !important; } }`}</style>
      <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={900}>Approved RFP Blockchain Retrieval</Typography>
            <Typography color="text.secondary">Retrieve the approved RFP report snapshot stored in blockchain.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadRecord} disabled={loading}>Refresh</Button>
            <Button variant="contained" onClick={() => window.print()} disabled={!result}>Print</Button>
          </Stack>
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>
      <Status error={error} message={message} />
      {result && (
        <Box id="approved-rfps-blockchain-print">
          <Paper sx={{ p: 2.5, mb: 2, border: "1px solid #d1d5db" }}>
            <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
              {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 76, maxWidth: 170, objectFit: "contain" }} />}
              <Typography variant="h5" fontWeight={900}>{institution?.institutionname || institution?.insname || "Institution"}</Typography>
              <Typography variant="body2">{institution?.address || ""}</Typography>
              <Chip color="success" label="Blockchain record retrieved" />
              <Typography variant="caption" sx={{ wordBreak: "break-all" }}>Hash: {result.hash}</Typography>
              <Typography variant="caption">Block index: {result.blockindex} | Stored: {result.timestamp ? new Date(result.timestamp).toLocaleString() : ""}</Typography>
            </Stack>
          </Paper>
          <ApprovedRfpsPrintPreview institution={institution} rows={rows} block={result} filters={payload.filters || {}} fromDate={payload.fromdate || ""} toDate={payload.todate || ""} />
        </Box>
      )}
      {!loading && !result && !error && <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No approved RFP blockchain report found for this link.</Paper>}
    </Box>
  );
}

export function PurchaseNewRfpBlockchainVerifyPage() {
  const { error, message, setError } = useMessage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [institution, setInstitution] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const colid = params.get("colid") || "";
  const hash = params.get("hash") || "";
  const recordid = params.get("recordid") || params.get("id") || "";

  const loadRecord = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/rfp-blockchain-verify", { params: { colid, hash, recordid } });
      const record = Array.isArray(res.data?.data) ? res.data.data[0] : res.data?.data;
      setResult(record || null);
      const institutionColid = record?.colid || colid;
      if (institutionColid) {
        const ins = await ep1.get("/api/institution", { params: { colid: institutionColid } });
        setInstitution(Array.isArray(ins.data) ? ins.data[0] : ins.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to retrieve RFP from blockchain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecord(); }, []);

  const rfp = result?.payload?.rfp || null;
  const verificationLink = rfpBlockchainVerifyUrl(result, rfp, result?.colid || colid);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #purchase-rfp-blockchain-print, #purchase-rfp-blockchain-print * { visibility: visible; }
          #purchase-rfp-blockchain-print { position: absolute; left: 0; top: 0; width: 100%; background: #fff; padding: 14px; }
          .screen-only { display: none !important; }
        }
      `}</style>
      <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={900}>RFP Blockchain Retrieval</Typography>
            <Typography color="text.secondary">Retrieve and print the Request for Proposal record stored in blockchain.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadRecord} disabled={loading}>Refresh</Button>
            <Button variant="contained" onClick={() => window.print()} disabled={!result}>Print</Button>
          </Stack>
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>
      <Status error={error} message={message} />
      {result && (
        <Box id="purchase-rfp-blockchain-print">
          <Paper sx={{ p: 2.5, mb: 2, border: "1px solid #d1d5db" }}>
            <Stack alignItems="center" spacing={0.75} sx={{ textAlign: "center", mb: 2 }}>
              {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 76, maxWidth: 170, objectFit: "contain" }} />}
              <Typography variant="h5" fontWeight={900}>{institution?.institutionname || institution?.insname || rfp?.institution || "Institution"}</Typography>
              <Typography variant="body2">{institution?.address || ""}</Typography>
              <Chip color="success" label="Blockchain record retrieved" />
              <Typography variant="caption" sx={{ wordBreak: "break-all" }}>Hash: {result.hash}</Typography>
              <Typography variant="caption">Block index: {result.blockindex} | Stored: {result.timestamp ? new Date(result.timestamp).toLocaleString() : ""}</Typography>
              {verificationLink && <Typography variant="caption" sx={{ wordBreak: "break-all" }}>Verification URL: {verificationLink}</Typography>}
            </Stack>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">RFP ID</Typography><Typography fontWeight={900}>{rfp?.rfpid || "NA"}</Typography></Paper></Grid>
              <Grid item xs={12} md={3}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">Status</Typography><Typography fontWeight={900}>{rfp?.status || "NA"}</Typography></Paper></Grid>
              <Grid item xs={12} md={3}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">Category</Typography><Typography fontWeight={900}>{rfp?.category || "NA"}</Typography></Paper></Grid>
              <Grid item xs={12} md={3}><Paper variant="outlined" sx={{ p: 1.5 }}><Typography color="text.secondary">Stored by</Typography><Typography fontWeight={900}>{result.user || "System"}</Typography></Paper></Grid>
            </Grid>
          </Paper>
          <RfpPrintPreview institution={institution} rfp={rfp} block={result} />
        </Box>
      )}
      {!loading && !result && !error && (
        <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
          No blockchain RFP record found for this link.
        </Paper>
      )}
    </Box>
  );
}

const vendorSession = () => {
  try { return JSON.parse(localStorage.getItem("purchaseNewVendor") || "null"); } catch { return null; }
};
const setVendorSession = (vendor) => localStorage.setItem("purchaseNewVendor", JSON.stringify(vendor || {}));
const vendorSubmissionVerifyUrl = (block, submission, colidOverride = "") => {
  if (!block && !submission) return "";
  const params = new URLSearchParams();
  const colid = colidOverride || global1.colid || block?.colid || submission?.colid || "";
  if (colid) params.set("colid", colid);
  if (block?.hash) params.set("hash", block.hash);
  if (block?.recordid || submission?._id) params.set("recordid", block?.recordid || submission?._id);
  return `${window.location.origin}/verify-purchase-new-rfp-submission?${params.toString()}`;
};
const poBlockchainVerifyUrl = (block, po, colidOverride = "") => {
  if (!block && !po) return "";
  const params = new URLSearchParams();
  const colid = colidOverride || global1.colid || block?.colid || po?.colid || "";
  if (colid) params.set("colid", colid);
  if (block?.hash) params.set("hash", block.hash);
  if (block?.recordid || po?._id) params.set("recordid", block?.recordid || po?._id);
  return `${window.location.origin}/verify-purchase-new-po?${params.toString()}`;
};
const deliveryNoteVerifyUrl = (block, row, modelname, colidOverride = "") => {
  if (!block && !row) return "";
  const params = new URLSearchParams();
  const colid = colidOverride || global1.colid || block?.colid || row?.colid || "";
  if (colid) params.set("colid", colid);
  if (modelname) params.set("modelname", modelname);
  if (block?.hash) params.set("hash", block.hash);
  if (block?.recordid || row?._id) params.set("recordid", block?.recordid || row?._id);
  return `${window.location.origin}/verify-purchase-new-delivery-note?${params.toString()}`;
};
const invoiceBlockchainVerifyUrl = (block, invoice, colidOverride = "") => {
  if (!block && !invoice) return "";
  const params = new URLSearchParams();
  const colid = colidOverride || global1.colid || block?.colid || invoice?.colid || "";
  if (colid) params.set("colid", colid);
  if (block?.hash) params.set("hash", block.hash);
  if (block?.recordid || invoice?._id) params.set("recordid", block?.recordid || invoice?._id);
  return `${window.location.origin}/verify-purchase-new-invoice?${params.toString()}`;
};

function VendorPortalShell({ title, children }) {
  const navigate = useNavigate();
  const vendor = vendorSession();
  const logout = () => {
    localStorage.removeItem("purchaseNewVendor");
    navigate("/purchase-new-vendor-login");
  };
  const menu = [
    { label: "Dashboard", path: "/purchase-new-vendor-dashboard" },
    { label: "Profile", path: "/purchase-new-vendor-profile" },
    { label: "Assigned RFPs", path: "/purchase-new-vendor-rfps" },
    { label: "Purchase orders", path: "/purchase-new-vendor-pos" },
    { label: "Delivery schedules", path: "/purchase-new-vendor-deliveries" },
    { label: "Delivery status", path: "/purchase-new-vendor-delivery-status" },
    { label: "Invoices", path: "/purchase-new-vendor-invoices" }
  ];
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f7fb" }}>
      <Paper sx={{ width: 250, borderRadius: 0, p: 2, bgcolor: "#111827", color: "#fff" }}>
        <Typography variant="h6" fontWeight={900}>Vendor Portal</Typography>
        <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>{vendor?.companyname || "Purchase new"}</Typography>
        <Stack spacing={1}>
          {menu.map((item) => <Button key={item.path} fullWidth sx={{ justifyContent: "flex-start", color: "#fff" }} onClick={() => navigate(item.path)}>{item.label}</Button>)}
        </Stack>
      </Paper>
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Breadcrumbs>
            <Link component="button" onClick={() => navigate("/purchase-new-vendor-dashboard")}>Vendor</Link>
            <Typography>{title}</Typography>
          </Breadcrumbs>
          <Button startIcon={<Logout />} variant="outlined" onClick={logout}>Logout</Button>
        </Stack>
        {children}
      </Box>
    </Box>
  );
}

const SubmissionPrintPreview = ({ institution, submission, block }) => {
  if (!submission) return <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>Select or submit a bid to preview.</Paper>;
  const link = vendorSubmissionVerifyUrl(block, submission);
  return (
    <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fff", border: "1px solid #d1d5db" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} alt="Logo" />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Vendor Bid Submission</Typography>
        <Typography>{submission.rfpid} - {submission.rfptitle}</Typography>
        <Typography fontWeight={800}>{submission.vendorname}</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
        {block?.hash && link && <Link href={link} target="_blank" rel="noreferrer" sx={{ wordBreak: "break-all", fontSize: 12 }}>Blockchain retrieval link: {link}</Link>}
      </Stack>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={4}><Chip color="primary" label={`Subtotal ${money(submission.subtotal)}`} /></Grid>
        <Grid item xs={4}><Chip color="warning" label={`GST ${money(submission.gsttotal)}`} /></Grid>
        <Grid item xs={4}><Chip color="success" label={`Grand total ${money(submission.grandtotal)}`} /></Grid>
      </Grid>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th,& td": { border: "1px solid #d1d5db", p: 0.8, fontSize: 12 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>GST %</th><th>GST</th><th>Freight</th><th>Loading</th><th>Customs</th><th>Installation</th><th>Total</th></tr></thead>
        <tbody>{(submission.items || []).map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.quantity}</td><td>{money(item.unitprice)}</td><td>{item.gstpercent}</td><td>{money(item.gstamount)}</td><td>{money(item.freightcost)}</td><td>{money(item.loadingcost)}</td><td>{money(item.customscost)}</td><td>{money(item.installationcost)}</td><td>{money(item.total)}</td></tr>)}</tbody>
      </Box>
      <Typography fontWeight={900} sx={{ mt: 2 }}>Qualification criteria response</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap" }}>{submission.qualificationresponse || "NA"}</Typography>
      <Typography fontWeight={900} sx={{ mt: 1 }}>Experience response</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap" }}>{submission.experienceresponse || "NA"}</Typography>
      <Typography fontWeight={900} sx={{ mt: 1 }}>Documents</Typography>
      {(submission.documents || []).map((doc, index) => <Typography key={index} variant="body2"><a href={doc.url} target="_blank" rel="noreferrer">{doc.documenttype || doc.filename}</a> - {doc.description}</Typography>)}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}><Typography>Prepared by</Typography><Typography>Checked by</Typography><Typography>Approved by</Typography></Stack>
    </Paper>
  );
};

const PoPrintPreview = ({ institution, po, block }) => {
  if (!po) return <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>Select or create a purchase order to preview.</Paper>;
  const link = poBlockchainVerifyUrl(block, po);
  return (
    <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fff", border: "1px solid #d1d5db" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} alt="Logo" />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Purchase Order</Typography>
        <Typography>{po.poid} - {po.title}</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
        {block?.hash && link && <Link href={link} target="_blank" rel="noreferrer" sx={{ wordBreak: "break-all", fontSize: 12 }}>Blockchain retrieval link: {link}</Link>}
      </Stack>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[["RFP", po.rfpid], ["Vendor", po.vendorname], ["Status", po.status], ["Grand total", money(po.grandtotal)]].map(([label, value]) => (
          <Grid item xs={12} md={3} key={label}><Paper variant="outlined" sx={{ p: 1 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={900}>{value || "NA"}</Typography></Paper></Grid>
        ))}
      </Grid>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th,& td": { border: "1px solid #d1d5db", p: 0.8, fontSize: 12 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Unit price</th><th>GST</th><th>Other costs</th><th>Total</th></tr></thead>
        <tbody>{(po.items || []).map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.description}</td><td>{item.quantity}</td><td>{money(item.unitprice)}</td><td>{money(item.gstamount)}</td><td>{money(Number(item.freightcost || 0) + Number(item.loadingcost || 0) + Number(item.customscost || 0) + Number(item.installationcost || 0) + Number(item.othercost || 0))}</td><td>{money(item.total)}</td></tr>)}</tbody>
      </Box>
      {[["Payment terms", po.paymentterms], ["Delivery terms", po.deliveryterms], ["Penalty clause", po.penaltyclause], ["General terms", po.generalterms]].map(([label, value]) => <Box key={label} sx={{ mt: 1 }}><Typography fontWeight={900}>{label}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{value || "NA"}</Typography></Box>)}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}><Typography>Prepared by</Typography><Typography>Checked by</Typography><Typography>Approved by</Typography></Stack>
    </Paper>
  );
};

export function PurchaseNewVendorLoginPage() {
  const navigate = useNavigate();
  const { error, message, setError } = useMessage();
  const [form, setForm] = useState({ colid: global1.colid || "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const login = async () => {
    setLoading(true);
    try {
      const res = await ep1.post("/api/v2/purchasenew/vendor-login", form);
      setVendorSession(res.data.data);
      navigate("/purchase-new-vendor-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#eef2ff", p: 2 }}>
      <Paper sx={{ maxWidth: 440, width: "100%", p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={900}>Vendor Login</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Access assigned RFPs, submit bids and view purchase orders.</Typography>
        <Status error={error} message={message} />
        <Stack spacing={2}>
          <TextField label="Institution colid" value={form.colid} onChange={(e) => setForm({ ...form, colid: e.target.value })} />
          <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") login(); }} />
          {loading && <LinearProgress />}
          <Button size="large" variant="contained" onClick={login} disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export function PurchaseNewVendorDashboardPage() {
  const vendor = vendorSession();
  const [rfps, setRfps] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (!vendor) return;
    setLoading(true);
    try {
      const [rfpRes, poRes] = await Promise.all([
        ep1.get("/api/v2/purchasenew/vendor-assigned-rfps", { params: { colid: vendor.colid, vendorusername: vendor.username } }),
        ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: vendor.colid, vendorusernameExact: vendor.username } })
      ]);
      setRfps(rfpRes.data.data || []);
      setPos(poRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  return (
    <VendorPortalShell title="Dashboard">
      <PageTop title={`Welcome, ${vendor?.companyname || "Vendor"}`} subtitle="Your RFP and purchase order workspace." crumbs={[{ label: "Vendor" }, { label: "Dashboard" }]} />
      {loading && <LinearProgress />}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}><Paper sx={{ p: 3 }}><Typography color="text.secondary">Assigned RFPs</Typography><Typography variant="h3" fontWeight={900}>{rfps.length}</Typography></Paper></Grid>
        <Grid item xs={12} md={4}><Paper sx={{ p: 3 }}><Typography color="text.secondary">Submitted bids</Typography><Typography variant="h3" fontWeight={900}>{rfps.filter((r) => r.submission).length}</Typography></Paper></Grid>
        <Grid item xs={12} md={4}><Paper sx={{ p: 3 }}><Typography color="text.secondary">Approved POs</Typography><Typography variant="h3" fontWeight={900}>{pos.filter((p) => p.status === "Approved").length}</Typography></Paper></Grid>
      </Grid>
    </VendorPortalShell>
  );
}

export function PurchaseNewVendorProfilePage() {
  const vendor = vendorSession();
  const { error, message, setError, setMessage, clear } = useMessage();
  const [profile, setProfile] = useState(vendor || {});
  const [signatories, setSignatories] = useState([]);
  const [signatory, setSignatory] = useState({ name: "", designation: "", email: "", phone: "", pannumber: "", aadhaar: "", authorizationdetails: "", status: "Active" });
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("Vendor Document");
  const [signatoryDoc, setSignatoryDoc] = useState({ signatoryid: "", documenttype: "Authorization Document", file: null });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (!vendor) return;
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/vendor-portal-profile", { params: { colid: vendor.colid, vendorusername: vendor.username } });
      setProfile(res.data.data.vendor);
      setSignatories(res.data.data.signatories || []);
      setVendorSession(res.data.data.vendor);
    } catch (err) { setError(err.response?.data?.message || "Unable to load profile"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const saveProfile = async () => {
    clear(); setLoading(true);
    try {
      const res = await ep1.post("/api/v2/purchasenew/vendor-portal-profile", { ...profile, colid: vendor.colid, vendorusername: vendor.username });
      setVendorSession(res.data.data);
      setMessage("Profile updated.");
    } catch (err) { setError(err.response?.data?.message || "Unable to update profile"); } finally { setLoading(false); }
  };
  const uploadDoc = async () => {
    if (!file) return setError("Select a document first.");
    const data = new FormData();
    data.append("colid", vendor.colid);
    data.append("vendorusername", vendor.username);
    data.append("documenttype", docType);
    data.append("document", file);
    await ep1.post("/api/v2/purchasenew/vendor-document-upload", data, { headers: { "Content-Type": "multipart/form-data" } });
    setFile(null); setMessage("Document uploaded."); await load();
  };
  const saveSignatory = async () => {
    await ep1.post("/api/v2/purchasenew/vendor-signatories", { ...signatory, colid: vendor.colid, vendorusername: vendor.username });
    setSignatory({ name: "", designation: "", email: "", phone: "", pannumber: "", aadhaar: "", authorizationdetails: "", status: "Active" });
    await load();
  };
  const uploadSignatoryDoc = async () => {
    if (!signatoryDoc.signatoryid || !signatoryDoc.file) return setError("Select signatory and document first.");
    const data = new FormData();
    data.append("signatoryid", signatoryDoc.signatoryid);
    data.append("documenttype", signatoryDoc.documenttype);
    data.append("document", signatoryDoc.file);
    await ep1.post("/api/v2/purchasenew/vendor-signatory-document-upload", data, { headers: { "Content-Type": "multipart/form-data" } });
    setSignatoryDoc({ signatoryid: "", documenttype: "Authorization Document", file: null });
    setMessage("Signatory document uploaded.");
    await load();
  };
  const fields = ["companyname", "type", "address", "gstno", "panno", "tanno", "contactperson", "contactemail", "contactphone", "specialization", "pastrecords", "bankdetails", "password"];
  return (
    <VendorPortalShell title="Profile">
      <Status error={error} message={message} />
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={900}>Company profile</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {fields.map((field) => <Grid item xs={12} md={field === "address" || field === "pastrecords" || field === "bankdetails" ? 12 : 4} key={field}><TextField fullWidth multiline={field === "address" || field === "pastrecords" || field === "bankdetails"} label={field} value={profile[field] || ""} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} /></Grid>)}
          <Grid item xs={12}><Button variant="contained" startIcon={<Save />} onClick={saveProfile}>Save profile</Button></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={900}>Vendor documents</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ my: 1 }}>
          <TextField label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)} />
          <Button variant="outlined" component="label">Select file<input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>
          <Button variant="contained" onClick={uploadDoc}>Upload</Button>
        </Stack>
        {(profile.documents || []).map((doc, index) => <Typography key={index} variant="body2"><a href={doc.url} target="_blank" rel="noreferrer">{doc.documenttype || doc.filename}</a></Typography>)}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900}>Authorized signatories</Typography>
        <Grid container spacing={2} sx={{ my: 0.5 }}>
          {["name", "designation", "email", "phone", "pannumber", "aadhaar", "authorizationdetails"].map((field) => <Grid item xs={12} md={field === "authorizationdetails" ? 12 : 3} key={field}><TextField fullWidth label={field} value={signatory[field] || ""} onChange={(e) => setSignatory({ ...signatory, [field]: e.target.value })} /></Grid>)}
          <Grid item xs={12}><Button variant="contained" onClick={saveSignatory}>Add signatory</Button></Grid>
        </Grid>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ my: 2 }}>
          <TextField select label="Signatory" sx={{ minWidth: 240 }} value={signatoryDoc.signatoryid} onChange={(e) => setSignatoryDoc({ ...signatoryDoc, signatoryid: e.target.value })}>
            <MenuItem value="">Select</MenuItem>
            {signatories.map((item) => <MenuItem key={item._id} value={item._id}>{item.name} - {item.email}</MenuItem>)}
          </TextField>
          <TextField label="Document type" value={signatoryDoc.documenttype} onChange={(e) => setSignatoryDoc({ ...signatoryDoc, documenttype: e.target.value })} />
          <Button variant="outlined" component="label">Select signatory file<input hidden type="file" onChange={(e) => setSignatoryDoc({ ...signatoryDoc, file: e.target.files?.[0] || null })} /></Button>
          <Button variant="contained" onClick={uploadSignatoryDoc}>Upload signatory document</Button>
        </Stack>
        <DataGrid autoHeight rows={signatories.map((row) => ({ ...row, id: row._id }))} columns={[{ field: "name", headerName: "Name", minWidth: 180 }, { field: "designation", headerName: "Designation", minWidth: 160 }, { field: "email", headerName: "Email", minWidth: 220 }, { field: "phone", headerName: "Phone", minWidth: 150 }, { field: "authorizationdetails", headerName: "Authorization", minWidth: 260, flex: 1 }]} pageSizeOptions={[25, 50, 100]} slots={{ toolbar: GridToolbar }} />
      </Paper>
    </VendorPortalShell>
  );
}

export function PurchaseNewVendorRfpsPage() {
  const vendor = vendorSession();
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bid, setBid] = useState(null);
  const [block, setBlock] = useState(null);
  const [submissionDoc, setSubmissionDoc] = useState({ documenttype: "Bid Document", file: null });
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/vendor-assigned-rfps", { params: { colid: vendor.colid, vendorusername: vendor.username } });
      setRows(res.data.data || []);
      loadInstitutionDetails().then(setInstitution);
    } catch (err) { setError(err.response?.data?.message || "Unable to load RFPs"); } finally { setLoading(false); }
  };
  useEffect(() => { if (vendor) load(); }, []);
  const choose = (row) => {
    setSelected(row);
    setBlock(null);
    const source = row.submission?.items?.length ? row.submission.items : (row.items || []).map((item, index) => ({ rfpitemindex: index, item: item.item, description: item.description, quantity: item.quantity, unitprice: 0, gstpercent: 0, freightcost: 0, loadingcost: 0, customscost: 0, installationcost: 0, othercost: 0 }));
    setBid({ ...(row.submission || {}), items: source, qualificationresponse: row.submission?.qualificationresponse || "", experienceresponse: row.submission?.experienceresponse || "", technicalbid: row.submission?.technicalbid || "", financialremarks: row.submission?.financialremarks || "" });
  };
  const updateItem = (index, patch) => setBid({ ...bid, items: bid.items.map((item, idx) => idx === index ? { ...item, ...patch } : item) });
  const saveBid = async () => {
    clear(); setLoading(true);
    try {
      const res = await ep1.post("/api/v2/purchasenew/rfp-submissions", { ...bid, colid: vendor.colid, vendorusername: vendor.username, rfp: selected._id, rfpid: selected.rfpid });
      setBid(res.data.data); setSelected({ ...selected, submission: res.data.data }); setMessage("Bid submitted and locked."); await load();
    } catch (err) { setError(err.response?.data?.message || "Unable to submit bid"); } finally { setLoading(false); }
  };
  const storeBid = async () => {
    const submission = selected?.submission || bid;
    if (!submission?._id) return setError("Submit bid first.");
    const res = await ep1.post("/api/v2/purchasenew/rfp-submission-blockchain-store", { id: submission._id, user: vendor.username });
    setBlock(res.data.data); setMessage("Submission stored in blockchain.");
  };
  const uploadBidDoc = async () => {
    const submission = selected?.submission || bid;
    if (!submission?._id) return setError("Submit bid first, then upload supporting documents.");
    if (!submissionDoc.file) return setError("Select a bid document first.");
    const data = new FormData();
    data.append("submissionid", submission._id);
    data.append("documenttype", submissionDoc.documenttype);
    data.append("document", submissionDoc.file);
    await ep1.post("/api/v2/purchasenew/rfp-submission-document-upload", data, { headers: { "Content-Type": "multipart/form-data" } });
    setSubmissionDoc({ documenttype: "Bid Document", file: null });
    setMessage("Bid document uploaded.");
    await load();
  };
  const canSubmit = selected?.withinTimeline && (!selected?.submission || selected.submission.editable === "Yes");
  return (
    <VendorPortalShell title="Assigned RFPs">
      <style>{`@media print{body *{visibility:hidden}#vendor-bid-print,#vendor-bid-print *{visibility:visible}#vendor-bid-print{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
      <Status error={error} message={message} />
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      <Paper className="screen-only" sx={{ height: 360, mb: 2 }}>
        <DataGrid rows={rows.map((row) => ({ ...row, id: row._id }))} columns={[{ field: "rfpid", headerName: "RFP ID", minWidth: 150 }, { field: "title", headerName: "Title", minWidth: 260, flex: 1 }, { field: "startdatetime", headerName: "Start", minWidth: 180, valueFormatter: (p) => dateTime(p.value) }, { field: "enddatetime", headerName: "End", minWidth: 180, valueFormatter: (p) => dateTime(p.value) }, { field: "status", headerName: "RFP Status", minWidth: 130 }, { field: "bidstatus", headerName: "Bid", minWidth: 130, valueGetter: (p) => p.row.submission?.status || "Not submitted" }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => choose(p.row)} />
      </Paper>
      {selected && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}><RfpPrintPreview institution={institution} rfp={selected} block={null} /><Button sx={{ mt: 1 }} variant="outlined" href={rfpBlockchainVerifyUrl(null, selected, vendor.colid)} target="_blank">Public blockchain RFP view</Button></Grid>
          <Grid item xs={12} md={7}>
            <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={900}>Bid submission</Typography>
              {!selected.withinTimeline && <Alert severity="warning" sx={{ my: 1 }}>Submission is outside the RFP timeline.</Alert>}
              {selected.submission && selected.submission.editable !== "Yes" && <Alert severity="info" sx={{ my: 1 }}>This bid is submitted and locked.</Alert>}
              <Grid container spacing={1.5}>
                <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Qualification criteria response" value={bid?.qualificationresponse || ""} onChange={(e) => setBid({ ...bid, qualificationresponse: e.target.value })} disabled={!canSubmit} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Experience response" value={bid?.experienceresponse || ""} onChange={(e) => setBid({ ...bid, experienceresponse: e.target.value })} disabled={!canSubmit} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Technical bid" value={bid?.technicalbid || ""} onChange={(e) => setBid({ ...bid, technicalbid: e.target.value })} disabled={!canSubmit} /></Grid>
              </Grid>
              <Box sx={{ overflowX: "auto", mt: 2 }}>
                <Box component="table" sx={{ minWidth: 1100, width: "100%", borderCollapse: "collapse", "& th,& td": { border: "1px solid #e5e7eb", p: 0.8 }, "& th": { bgcolor: "#f3f4f6" } }}>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>GST %</th><th>Freight</th><th>Loading</th><th>Customs</th><th>Installation</th><th>Other</th></tr></thead>
                  <tbody>{(bid?.items || []).map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.quantity}</td>{["unitprice", "gstpercent", "freightcost", "loadingcost", "customscost", "installationcost", "othercost"].map((field) => <td key={field}><TextField size="small" type="number" value={item[field] || 0} onChange={(e) => updateItem(index, { [field]: e.target.value })} disabled={!canSubmit} /></td>)}</tr>)}</tbody>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                <Button variant="contained" onClick={saveBid} disabled={!canSubmit || loading}>Submit bid</Button>
                <TextField size="small" label="Document type" value={submissionDoc.documenttype} onChange={(e) => setSubmissionDoc({ ...submissionDoc, documenttype: e.target.value })} />
                <Button variant="outlined" component="label">Select bid document<input hidden type="file" onChange={(e) => setSubmissionDoc({ ...submissionDoc, file: e.target.files?.[0] || null })} /></Button>
                <Button variant="outlined" onClick={uploadBidDoc} disabled={!bid?._id}>Upload document</Button>
                <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!bid?._id}>Print bid</Button>
                <Button variant="contained" color="success" startIcon={<Verified />} onClick={storeBid} disabled={!bid?._id}>Store bid in blockchain</Button>
                {block && <Button variant="outlined" href={vendorSubmissionVerifyUrl(block, bid, vendor.colid)} target="_blank">Open blockchain view</Button>}
              </Stack>
            </Paper>
            <Box id="vendor-bid-print"><SubmissionPrintPreview institution={institution} submission={bid} block={block} /></Box>
          </Grid>
        </Grid>
      )}
    </VendorPortalShell>
  );
}

export function PurchaseNewVendorPoPage() {
  const vendor = vendorSession();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [block, setBlock] = useState(null);
  useEffect(() => {
    if (!vendor) return;
    ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: vendor.colid, vendorusernameExact: vendor.username } }).then((res) => setRows(res.data.data || []));
    loadInstitutionDetails().then(setInstitution);
  }, []);
  const retrieveLink = selected ? poBlockchainVerifyUrl(selected.blockchainhash ? { hash: selected.blockchainhash, recordid: selected.blockchainrecordid, colid: selected.colid } : null, selected, vendor?.colid) : "";
  return (
    <VendorPortalShell title="Purchase orders">
      <style>{`@media print{body *{visibility:hidden}#vendor-po-print,#vendor-po-print *{visibility:visible}#vendor-po-print{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
      <Paper className="screen-only" sx={{ height: 420, mb: 2 }}><DataGrid rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "poid", headerName: "PO ID", minWidth: 150 }, { field: "title", headerName: "Title", minWidth: 260, flex: 1 }, { field: "rfpid", headerName: "RFP", minWidth: 150 }, { field: "status", headerName: "Status", minWidth: 130 }, { field: "grandtotal", headerName: "Amount", minWidth: 150, valueFormatter: (p) => money(p.value) }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => setSelected(p.row)} /></Paper>
      <Stack className="screen-only" direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
        <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!selected}>Print</Button>
        {retrieveLink && <Button variant="outlined" href={retrieveLink} target="_blank" rel="noreferrer" disabled={!selected?.blockchainhash}>Blockchain link</Button>}
      </Stack>
      <Box id="vendor-po-print"><PoPrintPreview institution={institution} po={selected} block={block} /></Box>
    </VendorPortalShell>
  );
}

const DeliveryNotePrintPreview = ({ institution, row, type = "GRN", block }) => {
  if (!row) return <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>Select a delivery schedule to preview.</Paper>;
  const isGrn = type === "GRN";
  const title = isGrn ? "Goods Receipt Note" : type === "Gatepass" ? "Outward Gatepass" : "Goods Return Note";
  const link = deliveryNoteVerifyUrl(block, row, isGrn ? "purchasenewgrn" : "purchasenewgoodsreturn");
  return (
    <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fff", border: "1px solid #d1d5db" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} alt="Logo" />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>{title}</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
        {block?.hash && link && <Link href={link} target="_blank" rel="noreferrer" sx={{ wordBreak: "break-all", fontSize: 12 }}>Blockchain retrieval link: {link}</Link>}
      </Stack>
      <Grid container spacing={1.5}>
        {[["PO", row.poid], ["Vendor", row.vendorname], ["Item", row.item], ["Delivered", row.quantity], ["Accepted", row.acceptedquantity], ["Returned", row.returnedquantity], ["Vehicle", row.vehicledetails], ["Delivery", dateTime(row.deliverydatetime)]].map(([label, value]) => (
          <Grid item xs={12} md={3} key={label}><Paper variant="outlined" sx={{ p: 1 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={900}>{value || "NA"}</Typography></Paper></Grid>
        ))}
      </Grid>
      <Typography fontWeight={900} sx={{ mt: 2 }}>Shipment details</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap" }}>{row.shipmentdetails || "NA"}</Typography>
      <Typography fontWeight={900} sx={{ mt: 1 }}>Remarks</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap" }}>{row.qualityremarks || row.remarks || "NA"}</Typography>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}><Typography>Prepared by</Typography><Typography>Checked by</Typography><Typography>Approved by</Typography></Stack>
    </Paper>
  );
};

const InvoicePrintPreview = ({ institution, invoice, block }) => {
  if (!invoice) return <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>Select an invoice to preview.</Paper>;
  const link = invoiceBlockchainVerifyUrl(block, invoice);
  return (
    <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fff", border: "1px solid #d1d5db" }}>
      <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
        {institution?.logolink && <Box component="img" src={institution.logolink} sx={{ height: 70, maxWidth: 160, objectFit: "contain" }} alt="Logo" />}
        <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
        <Typography variant="body2">{institution?.address || ""}</Typography>
        <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Vendor Invoice</Typography>
        <Typography>{invoice.invoiceid} {invoice.invoiceno ? ` / ${invoice.invoiceno}` : ""}</Typography>
        {block?.hash && <Typography variant="caption">Blockchain hash: {block.hash}</Typography>}
        {block?.hash && link && <Link href={link} target="_blank" rel="noreferrer" sx={{ wordBreak: "break-all", fontSize: 12 }}>Blockchain retrieval link: {link}</Link>}
      </Stack>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[["PO", invoice.poid], ["Vendor", invoice.vendorname], ["Date", invoice.invoicedate ? new Date(invoice.invoicedate).toLocaleDateString() : ""], ["Status", invoice.status], ["Grand total", money(invoice.grandtotal)]].map(([label, value]) => (
          <Grid item xs={12} md={2.4} key={label}><Paper variant="outlined" sx={{ p: 1 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={900}>{value || "NA"}</Typography></Paper></Grid>
        ))}
      </Grid>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th,& td": { border: "1px solid #d1d5db", p: 0.8, fontSize: 12 }, "& th": { bgcolor: "#f3f4f6" } }}>
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>GST %</th><th>GST</th><th>Total</th></tr></thead>
        <tbody>{(invoice.items || []).map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.quantity}</td><td>{money(item.unitprice)}</td><td>{item.gstpercent}</td><td>{money(item.gstamount)}</td><td>{money(item.total)}</td></tr>)}</tbody>
      </Box>
      <Typography sx={{ mt: 1 }}><b>Bank / payment details:</b> {invoice.bankdetails || "NA"}</Typography>
      {(invoice.documents || []).map((doc, index) => <Typography key={index} variant="body2"><a href={doc.url} target="_blank" rel="noreferrer">{doc.documenttype || doc.filename}</a> - {doc.description}</Typography>)}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}><Typography>Prepared by</Typography><Typography>Checked by</Typography><Typography>Approved by</Typography></Stack>
    </Paper>
  );
};

export function PurchaseNewVendorDeliverySchedulePage() {
  const vendor = vendorSession();
  const { error, message, setError, setMessage } = useMessage();
  const [pos, setPos] = useState([]);
  const [poId, setPoId] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ itemindex: "", quantity: 1, deliverydatetime: "", vehicledetails: "", shipmentdetails: "", remarks: "" });
  const po = pos.find((p) => p._id === poId);
  const load = async () => {
    const [poRes, schRes] = await Promise.all([
      ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: vendor.colid, vendorusernameExact: vendor.username, status: "Approved" } }),
      poId ? ep1.get("/api/v2/purchasenew/delivery-schedules", { params: { colid: vendor.colid, po: poId, vendorusername: vendor.username } }) : Promise.resolve({ data: { data: [] } })
    ]);
    setPos(poRes.data.data || []);
    setRows((schRes.data.data || []).map((r) => ({ ...r, id: r._id })));
  };
  useEffect(() => { if (vendor) load(); }, [poId]);
  const save = async () => {
    if (!poId) return setError("Select PO first.");
    await ep1.post("/api/v2/purchasenew/delivery-schedules", { ...form, colid: vendor.colid, po: poId, vendorusername: vendor.username });
    setMessage("Delivery schedule saved.");
    setForm({ itemindex: "", quantity: 1, deliverydatetime: "", vehicledetails: "", shipmentdetails: "", remarks: "" });
    await load();
  };
  return (
    <VendorPortalShell title="Delivery schedules">
      <Status error={error} message={message} />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><TextField select fullWidth label="Purchase order" value={poId} onChange={(e) => setPoId(e.target.value)}><MenuItem value="">Select</MenuItem>{pos.map((p) => <MenuItem key={p._id} value={p._id}>{p.poid} - {p.title}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={4}><TextField select fullWidth label="Item" value={form.itemindex} onChange={(e) => setForm({ ...form, itemindex: e.target.value })}><MenuItem value="">Select</MenuItem>{(po?.items || []).map((item, index) => <MenuItem key={index} value={index}>{item.item} ({item.quantity})</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="number" label="No. of items" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="datetime-local" label="Date time" InputLabelProps={{ shrink: true }} value={form.deliverydatetime} onChange={(e) => setForm({ ...form, deliverydatetime: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Vehicle details" value={form.vehicledetails} onChange={(e) => setForm({ ...form, vehicledetails: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Shipment details" value={form.shipmentdetails} onChange={(e) => setForm({ ...form, shipmentdetails: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
          <Grid item xs={12}><Button variant="contained" onClick={save}>Save schedule</Button></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ height: 480 }}><DataGrid rows={rows} columns={[{ field: "poid", headerName: "PO", minWidth: 140 }, { field: "item", headerName: "Item", minWidth: 220, flex: 1 }, { field: "quantity", headerName: "Qty", width: 100 }, { field: "deliverydatetime", headerName: "Delivery", minWidth: 180, valueFormatter: (p) => dateTime(p.value) }, { field: "vehicledetails", headerName: "Vehicle", minWidth: 180 }, { field: "status", headerName: "Status", minWidth: 140 }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Paper>
    </VendorPortalShell>
  );
}

export function PurchaseNewVendorDeliveryStatusPage() {
  const vendor = vendorSession();
  const [rows, setRows] = useState([]);
  useEffect(() => { if (vendor) ep1.get("/api/v2/purchasenew/delivery-schedules", { params: { colid: vendor.colid, vendorusername: vendor.username } }).then((res) => setRows((res.data.data || []).map((r) => ({ ...r, id: r._id })))); }, []);
  return (
    <VendorPortalShell title="Delivery status">
      <Paper sx={{ height: 560 }}><DataGrid rows={rows} columns={[{ field: "poid", headerName: "PO", minWidth: 140 }, { field: "item", headerName: "Item", minWidth: 220, flex: 1 }, { field: "quantity", headerName: "Delivered", width: 120 }, { field: "acceptedquantity", headerName: "Accepted", width: 120 }, { field: "returnedquantity", headerName: "Returned", width: 120 }, { field: "qualityremarks", headerName: "Quality remarks", minWidth: 240 }, { field: "status", headerName: "Status", minWidth: 150 }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Paper>
    </VendorPortalShell>
  );
}

export function PurchaseNewVendorInvoicePage() {
  const vendor = vendorSession();
  const { error, message, setError, setMessage } = useMessage();
  const [pos, setPos] = useState([]);
  const [poId, setPoId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [items, setItems] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [invoiceDoc, setInvoiceDoc] = useState({ documenttype: "Invoice Document", file: null });
  const [institution, setInstitution] = useState(null);
  const po = pos.find((p) => p._id === poId);
  const load = async () => {
    const [poRes, invRes] = await Promise.all([
      ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: vendor.colid, vendorusernameExact: vendor.username, status: "Approved" } }),
      ep1.get("/api/v2/purchasenew/invoices", { params: { colid: vendor.colid, vendorusernameExact: vendor.username } })
    ]);
    setPos(poRes.data.data || []);
    setInvoices((invRes.data.data || []).map((r) => ({ ...r, id: r._id })));
    loadInstitutionDetails().then(setInstitution);
    if (poId) {
      const sch = await ep1.get("/api/v2/purchasenew/delivery-schedules", { params: { colid: vendor.colid, po: poId, vendorusername: vendor.username } });
      setSchedules(sch.data.data || []);
    }
  };
  useEffect(() => { if (vendor) load(); }, [poId]);
  const prepareItems = () => {
    const accepted = {};
    schedules.forEach((s) => { accepted[s.itemindex] = Number(accepted[s.itemindex] || 0) + Number(s.acceptedquantity || 0); });
    const next = (po?.items || []).map((item, index) => ({ itemindex: index, item: item.item, accepted: accepted[index] || 0, quantity: accepted[index] || 0, unitprice: item.unitprice || 0, gstpercent: item.gstpercent || 0 })).filter((i) => i.accepted > 0);
    setItems(next);
  };
  const updateItem = (index, patch) => setItems(items.map((item, idx) => idx === index ? { ...item, ...patch } : item));
  const saveInvoice = async () => {
    if (!poId) return setError("Select PO first.");
    const res = await ep1.post("/api/v2/purchasenew/invoices", { colid: vendor.colid, po: poId, items, vendorusername: vendor.username, user: vendor.username });
    setInvoice(res.data.data); setMessage("Invoice created and submitted for approval."); await load();
  };
  const uploadInvoiceDoc = async () => {
    if (!invoice?._id) return setError("Create or select invoice first.");
    if (!invoiceDoc.file) return setError("Select invoice document first.");
    const data = new FormData();
    data.append("id", invoice._id);
    data.append("documenttype", invoiceDoc.documenttype);
    data.append("document", invoiceDoc.file);
    await ep1.post("/api/v2/purchasenew/invoice-document-upload", data, { headers: { "Content-Type": "multipart/form-data" } });
    setInvoiceDoc({ documenttype: "Invoice Document", file: null });
    setMessage("Invoice document uploaded.");
    await load();
  };
  return (
    <VendorPortalShell title="Invoices">
      <style>{`@media print{body *{visibility:hidden}#vendor-invoice-print,#vendor-invoice-print *{visibility:visible}#vendor-invoice-print{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
      <Status error={error} message={message} />
      <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <TextField select sx={{ minWidth: 340 }} label="PO" value={poId} onChange={(e) => setPoId(e.target.value)}><MenuItem value="">Select</MenuItem>{pos.map((p) => <MenuItem key={p._id} value={p._id}>{p.poid} - {p.title}</MenuItem>)}</TextField>
          <Button variant="outlined" onClick={prepareItems} disabled={!poId}>Load accepted items</Button>
          <Button variant="contained" onClick={saveInvoice} disabled={!items.length}>Create invoice</Button>
          <TextField size="small" label="Document type" value={invoiceDoc.documenttype} onChange={(e) => setInvoiceDoc({ ...invoiceDoc, documenttype: e.target.value })} />
          <Button variant="outlined" component="label">Select document<input hidden type="file" onChange={(e) => setInvoiceDoc({ ...invoiceDoc, file: e.target.files?.[0] || null })} /></Button>
          <Button variant="outlined" onClick={uploadInvoiceDoc} disabled={!invoice?._id}>Upload</Button>
          <Button variant="outlined" onClick={() => window.print()} disabled={!invoice}>Print</Button>
        </Stack>
        <Box sx={{ overflowX: "auto", mt: 2 }}><Box component="table" sx={{ minWidth: 760, width: "100%", borderCollapse: "collapse", "& th,& td": { border: "1px solid #e5e7eb", p: 1 } }}><thead><tr><th>Item</th><th>Accepted pending</th><th>Invoice qty</th><th>Unit price</th><th>GST %</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.accepted}</td><td><TextField size="small" type="number" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} /></td><td><TextField size="small" type="number" value={item.unitprice} onChange={(e) => updateItem(index, { unitprice: e.target.value })} /></td><td><TextField size="small" type="number" value={item.gstpercent} onChange={(e) => updateItem(index, { gstpercent: e.target.value })} /></td></tr>)}</tbody></Box></Box>
      </Paper>
      <Paper className="screen-only" sx={{ height: 360, mb: 2 }}><DataGrid rows={invoices} columns={[{ field: "invoiceid", headerName: "Invoice", minWidth: 160 }, { field: "poid", headerName: "PO", minWidth: 140 }, { field: "grandtotal", headerName: "Amount", minWidth: 150, valueFormatter: (p) => money(p.value) }, { field: "status", headerName: "Status", minWidth: 180 }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => setInvoice(p.row)} /></Paper>
      <Box id="vendor-invoice-print"><InvoicePrintPreview institution={institution} invoice={invoice} block={null} /></Box>
    </VendorPortalShell>
  );
}

export function PurchaseNewDeliveryNoteVerifyPage() {
  const [result, setResult] = useState(null);
  const [institution, setInstitution] = useState(null);
  const params = new URLSearchParams(window.location.search);
  useEffect(() => { ep1.get("/api/v2/purchasenew/delivery-note-blockchain-verify", { params: Object.fromEntries(params.entries()) }).then((res) => { const r = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data; setResult(r); if (r?.colid) ep1.get("/api/institution", { params: { colid: r.colid } }).then((ins) => setInstitution(Array.isArray(ins.data) ? ins.data[0] : ins.data)); }); }, []);
  return <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}><Button className="screen-only" variant="contained" onClick={() => window.print()} sx={{ mb: 2 }}>Print</Button><DeliveryNotePrintPreview institution={institution} row={result?.payload?.schedule} type={result?.modelname === "purchasenewgrn" ? "GRN" : "Return"} block={result} /></Box>;
}

export function PurchaseNewInvoiceVerifyPage() {
  const [result, setResult] = useState(null);
  const [institution, setInstitution] = useState(null);
  const params = new URLSearchParams(window.location.search);
  useEffect(() => { ep1.get("/api/v2/purchasenew/invoice-blockchain-verify", { params: Object.fromEntries(params.entries()) }).then((res) => { const r = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data; setResult(r); if (r?.colid) ep1.get("/api/institution", { params: { colid: r.colid } }).then((ins) => setInstitution(Array.isArray(ins.data) ? ins.data[0] : ins.data)); }); }, []);
  return <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}><Button className="screen-only" variant="contained" onClick={() => window.print()} sx={{ mb: 2 }}>Print</Button><InvoicePrintPreview institution={institution} invoice={result?.payload?.invoice} block={result} /></Box>;
}

export function PurchaseNewRfpSubmissionVerifyPage() {
  const [result, setResult] = useState(null);
  const [institution, setInstitution] = useState(null);
  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    ep1.get("/api/v2/purchasenew/rfp-submission-blockchain-verify", { params: Object.fromEntries(params.entries()) }).then((res) => {
      const record = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      setResult(record); if (record?.colid) ep1.get("/api/institution", { params: { colid: record.colid } }).then((ins) => setInstitution(Array.isArray(ins.data) ? ins.data[0] : ins.data));
    });
  }, []);
  const submission = result?.payload?.submission;
  return <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}><Button className="screen-only" variant="contained" onClick={() => window.print()} sx={{ mb: 2 }}>Print</Button><SubmissionPrintPreview institution={institution} submission={submission} block={result} /></Box>;
}

export function PurchaseNewPoVerifyPage() {
  const [result, setResult] = useState(null);
  const [institution, setInstitution] = useState(null);
  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    ep1.get("/api/v2/purchasenew/purchase-order-blockchain-verify", { params: Object.fromEntries(params.entries()) }).then((res) => {
      const record = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      setResult(record); if (record?.colid) ep1.get("/api/institution", { params: { colid: record.colid } }).then((ins) => setInstitution(Array.isArray(ins.data) ? ins.data[0] : ins.data));
    });
  }, []);
  const po = result?.payload?.purchaseorder;
  return <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}><Button className="screen-only" variant="contained" onClick={() => window.print()} sx={{ mb: 2 }}>Print</Button><PoPrintPreview institution={institution} po={po} block={result} /></Box>;
}

export function PurchaseNewVendorComparisonPage() {
  const { error, message, setError, setMessage, clear } = useMessage();
  const [rfps, setRfps] = useState([]);
  const [rfpId, setRfpId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [poForm, setPoForm] = useState({ paymentterms: "", deliveryterms: "", penaltyclause: "", generalterms: "" });
  const [aiInstruction, setAiInstruction] = useState("Refine the purchase order terms so they are clear, legally balanced, vendor-neutral, and suitable for institutional procurement. Keep payment milestones, delivery obligations, penalties, warranty/support and documentation requirements explicit.");
  const [provider, setProvider] = useState("Gemini");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [ollamaConfigs, setOllamaConfigs] = useState([]);
  const [ollamaConfigId, setOllamaConfigId] = useState("");
  const [po, setPo] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    ep1.get("/api/v2/purchasenew/rfps", { params: { colid: global1.colid, status: "Approved" } }).then((res) => setRfps(res.data.data || []));
    loadInstitutionDetails().then(setInstitution);
    ep1.get("/api/v2/ollama-configuration", { params: { colid: global1.colid } }).then((res) => {
      const active = (res.data || []).filter((item) => String(item.active || "").toLowerCase() === "yes");
      setOllamaConfigs(active);
      setOllamaConfigId(active.find((item) => String(item.default || "").toLowerCase() === "yes")?._id || active[0]?._id || "");
    }).catch(() => setOllamaConfigs([]));
  }, []);
  const selectedRfp = rfps.find((r) => r._id === rfpId || r.rfpid === rfpId);
  const loadSubs = async (id = rfpId) => {
    setLoading(true);
    try {
      const rfp = rfps.find((r) => r._id === id || r.rfpid === id);
      const res = await ep1.get("/api/v2/purchasenew/rfp-submissions", { params: { colid: global1.colid, rfp: rfp?._id } });
      setSubmissions(res.data.data || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to load submissions"); } finally { setLoading(false); }
  };
  const comparisonRows = useMemo(() => {
    const items = selectedRfp?.items || [];
    return items.map((item, index) => {
      const row = { id: index, item: item.item, quantity: item.quantity };
      submissions.forEach((sub) => {
        const subItem = (sub.items || []).find((i) => Number(i.rfpitemindex) === index) || {};
        row[sub.vendorname] = subItem.total || 0;
      });
      return row;
    });
  }, [selectedRfp, submissions]);
  const vendorColumns = submissions.map((sub) => ({ field: sub.vendorname, headerName: sub.vendorname, minWidth: 160, valueFormatter: (p) => money(p.value), cellClassName: (p) => {
    const values = submissions.map((s) => Number(p.row[s.vendorname] || 0)).filter((v) => v > 0);
    return values.length && Number(p.value || 0) === Math.min(...values) ? "lowest-bid" : "";
  } }));
  const makeEditable = async () => {
    if (!selectedSubmission) return setError("Select one vendor submission.");
    await ep1.post("/api/v2/purchasenew/rfp-submissions-editable", { id: selectedSubmission._id });
    setMessage("Submission made editable for vendor."); await loadSubs();
  };
  const createPo = async () => {
    if (!selectedSubmission) return setError("Select one vendor submission.");
    clear(); setLoading(true);
    try {
      const res = await ep1.post("/api/v2/purchasenew/purchase-orders-from-submission", { ...poForm, submissionid: selectedSubmission._id, user: global1.user, useremail: global1.user, username: global1.name, role: global1.role });
      setPo(res.data.data); setMessage("Purchase order created and sent for approval.");
    } catch (err) { setError(err.response?.data?.message || "Unable to create PO"); } finally { setLoading(false); }
  };
  const refinePoTerms = async () => {
    clear(); setLoading(true);
    try {
      const res = await ep1.post("/api/v2/purchasenew/ai-refine-po-terms", { ...poForm, instruction: aiInstruction, colid: global1.colid, provider, geminiModel, ollamaConfigId });
      setPoForm({ ...poForm, ...res.data.data });
      setMessage("PO terms refined with AI.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refine PO terms");
    } finally {
      setLoading(false);
    }
  };
  return (
    <MenuPageShell title="Vendor Bid Comparison">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`.lowest-bid{background:#dcfce7;font-weight:800}@media print{body *{visibility:hidden}#po-preview,#po-preview *{visibility:visible}#po-preview{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
        <PageTop title="Vendor Bid Comparison" subtitle="Compare RFP submissions side by side, reopen bids, and create purchase orders." crumbs={[{ label: "Purchase new" }, { label: "Vendor Bid Comparison" }]} />
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField select fullWidth label="RFP" value={rfpId} onChange={(e) => { setRfpId(e.target.value); setSubmissions([]); }}><MenuItem value="">Select</MenuItem>{rfps.map((r) => <MenuItem key={r._id} value={r._id}>{r.rfpid} - {r.title}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><Button fullWidth sx={{ height: "100%" }} variant="contained" onClick={() => loadSubs()} disabled={!rfpId || loading}>Load</Button></Grid>
          </Grid>
        </Paper>
        {loading && <LinearProgress sx={{ mb: 1 }} />}
        <Paper className="screen-only" sx={{ height: 360, mb: 2 }}><DataGrid rows={comparisonRows} columns={[{ field: "item", headerName: "Item", minWidth: 260, flex: 1 }, { field: "quantity", headerName: "Qty", minWidth: 100 }, ...vendorColumns]} pageSizeOptions={[25, 50, 100]} /></Paper>
        <Grid container spacing={2} className="screen-only">
          <Grid item xs={12} md={5}><Paper sx={{ p: 2 }}><Typography variant="h6" fontWeight={900}>Submissions</Typography><DataGrid autoHeight rows={submissions.map((s) => ({ ...s, id: s._id }))} columns={[{ field: "vendorname", headerName: "Vendor", minWidth: 200, flex: 1 }, { field: "grandtotal", headerName: "Grand total", minWidth: 150, valueFormatter: (p) => money(p.value) }, { field: "editable", headerName: "Editable", width: 110 }]} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => { setSelectedSubmission(p.row); setPoForm({ paymentterms: selectedRfp?.paymentterms || "", deliveryterms: selectedRfp?.deliveryterms || "", penaltyclause: "", generalterms: selectedRfp?.terms || "" }); }} /></Paper></Grid>
          <Grid item xs={12} md={7}><Paper sx={{ p: 2 }}><Typography variant="h6" fontWeight={900}>Create purchase order</Typography><Grid container spacing={1.5}>{["paymentterms", "deliveryterms", "penaltyclause", "generalterms"].map((field) => <Grid item xs={12} md={6} key={field}><TextField fullWidth multiline minRows={2} label={field} value={poForm[field] || ""} onChange={(e) => setPoForm({ ...poForm, [field]: e.target.value })} /></Grid>)}<Grid item xs={12} md={3}><TextField select fullWidth label="AI provider" value={provider} onChange={(e) => setProvider(e.target.value)}><MenuItem value="Gemini">Gemini</MenuItem><MenuItem value="Ollama">Ollama</MenuItem></TextField></Grid>{provider === "Gemini" ? <Grid item xs={12} md={4}><TextField select fullWidth label="Gemini model" value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)}>{geminiModelOptions.map((model) => <MenuItem key={model} value={model}>{model}</MenuItem>)}</TextField></Grid> : <Grid item xs={12} md={5}><TextField select fullWidth label="Ollama configuration" value={ollamaConfigId} onChange={(e) => setOllamaConfigId(e.target.value)}>{ollamaConfigs.map((item) => <MenuItem key={item._id} value={item._id}>{item.name} - {item.modelname}</MenuItem>)}</TextField></Grid>}<Grid item xs={12}><TextField fullWidth multiline minRows={3} label="AI refinement rule" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} helperText="Sample text is prefilled. You can edit it before clicking Refine terms with AI." /></Grid><Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Button variant="outlined" onClick={makeEditable} disabled={!selectedSubmission}>Make editable</Button><Button variant="outlined" onClick={refinePoTerms} disabled={loading || (provider === "Ollama" && !ollamaConfigId)}>Refine terms with AI</Button><Button variant="contained" onClick={createPo} disabled={!selectedSubmission}>Create PO</Button><Button variant="outlined" onClick={() => window.print()} disabled={!po}>Print PO</Button></Stack></Grid></Grid></Paper></Grid>
        </Grid>
        <Box id="po-preview" sx={{ mt: 2 }}><PoPrintPreview institution={institution} po={po} block={null} /></Box>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewPoApprovalPage() {
  const { error, message, setError, setMessage } = useMessage();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/purchasenew/po-approval-queue", { params: { colid: global1.colid, role: global1.role, useremail: global1.user } });
      setRows(res.data.data || []); loadInstitutionDetails().then(setInstitution);
    } catch (err) { setError(err.response?.data?.message || "Unable to load PO approval queue"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const action = async (type) => {
    if (!selected) return setError("Select one PO.");
    await ep1.post(`/api/v2/purchasenew/purchase-orders-${type}`, { id: selected._id, user: global1.user, useremail: global1.user, username: global1.name, role: global1.role });
    setMessage(`PO ${type}d.`); setSelected(null); await load();
  };
  return (
    <MenuPageShell title="Purchase Order Approval">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Purchase Order Approval" subtitle="Approve purchase orders through dynamic workflow." crumbs={[{ label: "Purchase new" }, { label: "PO Approval" }]} />
        <Status error={error} message={message} />{loading && <LinearProgress />}
        <Paper sx={{ height: 420, mb: 2 }}><DataGrid rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "poid", headerName: "PO ID", minWidth: 150 }, { field: "vendorname", headerName: "Vendor", minWidth: 200 }, { field: "rfpid", headerName: "RFP", minWidth: 140 }, { field: "grandtotal", headerName: "Amount", minWidth: 150, valueFormatter: (p) => money(p.value) }, { field: "status", headerName: "Status", minWidth: 180 }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => setSelected(p.row)} /></Paper>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}><Button variant="contained" color="success" onClick={() => action("approve")} disabled={!selected}>Approve</Button><Button variant="outlined" color="error" onClick={() => action("reject")} disabled={!selected}>Reject</Button></Stack>
        <PoPrintPreview institution={institution} po={selected} block={null} />
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewApprovedPoPage() {
  const { error, message, setError, setMessage } = useMessage();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [block, setBlock] = useState(null);
  const [institution, setInstitution] = useState(null);
  useEffect(() => { ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: global1.colid, status: "Approved" } }).then((res) => setRows(res.data.data || [])).catch((err) => setError(err.response?.data?.message || "Unable to load POs")); loadInstitutionDetails().then(setInstitution); }, []);
  const store = async () => {
    const res = await ep1.post("/api/v2/purchasenew/purchase-order-blockchain-store", { id: selected._id, user: global1.user, useremail: global1.user });
    setBlock(res.data.data); setMessage("PO stored in blockchain.");
  };
  return (
    <MenuPageShell title="Approved Purchase Orders">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print{body *{visibility:hidden}#approved-po-print,#approved-po-print *{visibility:visible}#approved-po-print{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
        <PageTop title="Approved Purchase Orders" subtitle="Print, store and retrieve approved purchase orders." crumbs={[{ label: "Purchase new" }, { label: "Approved PO" }]} />
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ height: 420, mb: 2 }}><DataGrid rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "poid", headerName: "PO ID", minWidth: 150 }, { field: "title", headerName: "Title", minWidth: 260, flex: 1 }, { field: "vendorname", headerName: "Vendor", minWidth: 200 }, { field: "grandtotal", headerName: "Amount", minWidth: 150, valueFormatter: (p) => money(p.value) }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => { setSelected(p.row); setBlock(null); }} /></Paper>
        <Stack className="screen-only" direction="row" spacing={1} sx={{ mb: 2 }}><Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!selected}>Print</Button><Button variant="contained" color="success" startIcon={<Verified />} onClick={store} disabled={!selected}>Store in blockchain</Button>{block && <Button variant="outlined" href={poBlockchainVerifyUrl(block, selected, global1.colid)} target="_blank">Retrieve blockchain</Button>}</Stack>
        <Box id="approved-po-print"><PoPrintPreview institution={institution} po={selected} block={block} /></Box>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewQualityPage() {
  const { error, message, setError, setMessage } = useMessage();
  const [pos, setPos] = useState([]);
  const [poId, setPoId] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [block, setBlock] = useState(null);
  const [noteType, setNoteType] = useState("GRN");
  const [institution, setInstitution] = useState(null);
  const load = async () => {
    try {
      const poRes = await ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: global1.colid, status: "Approved" } });
      setPos(poRes.data.data || []);
      if (poId) {
        const res = await ep1.get("/api/v2/purchasenew/delivery-schedules", { params: { colid: global1.colid, po: poId } });
        setRows((res.data.data || []).map((r) => ({ ...r, id: r._id })));
      }
      loadInstitutionDetails().then(setInstitution);
    } catch (err) { setError(err.response?.data?.message || "Unable to load quality data"); }
  };
  useEffect(() => { load(); }, [poId]);
  const update = async (row, patch) => {
    const res = await ep1.post("/api/v2/purchasenew/delivery-quality", { id: row._id, acceptedquantity: row.acceptedquantity, returnedquantity: row.returnedquantity, qualityremarks: row.qualityremarks, ...patch });
    setSelected(res.data.data); setMessage("Quality updated."); await load();
  };
  const storeNote = async (type = noteType) => {
    if (!selected) return setError("Select one schedule first.");
    const res = await ep1.post("/api/v2/purchasenew/delivery-note-blockchain-store", { id: selected._id, notetype: type, user: global1.user, useremail: global1.user });
    setBlock(res.data.data); setNoteType(type); setMessage(`${type} stored in blockchain.`);
  };
  const columns = [
    { field: "poid", headerName: "PO", minWidth: 130 },
    { field: "vendorname", headerName: "Vendor", minWidth: 190 },
    { field: "item", headerName: "Item", minWidth: 220, flex: 1 },
    { field: "quantity", headerName: "Delivered", width: 110 },
    { field: "acceptedquantity", headerName: "Accepted", width: 140, renderCell: ({ row }) => <TextField size="small" type="number" defaultValue={row.acceptedquantity || 0} onKeyDown={stopGridInputKeys} onBlur={(e) => update(row, { acceptedquantity: e.target.value })} /> },
    { field: "returnedquantity", headerName: "Returned", width: 140, renderCell: ({ row }) => <TextField size="small" type="number" defaultValue={row.returnedquantity || 0} onKeyDown={stopGridInputKeys} onBlur={(e) => update(row, { returnedquantity: e.target.value })} /> },
    { field: "qualityremarks", headerName: "Remarks", minWidth: 220, renderCell: ({ row }) => <TextField size="small" defaultValue={row.qualityremarks || ""} onKeyDown={stopGridInputKeys} onBlur={(e) => update(row, { qualityremarks: e.target.value })} /> }
  ];
  return (
    <MenuPageShell title="Purchase Quality">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print{body *{visibility:hidden}#quality-note-print,#quality-note-print *{visibility:visible}#quality-note-print{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
        <PageTop title="Purchase Quality" subtitle="Accept or return delivered items and generate GRN, goods return note and outward gatepass." crumbs={[{ label: "Purchase new" }, { label: "Quality" }]} />
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}><Stack direction="row" spacing={1} flexWrap="wrap"><TextField select sx={{ minWidth: 360 }} label="PO" value={poId} onChange={(e) => setPoId(e.target.value)}><MenuItem value="">Select</MenuItem>{pos.map((p) => <MenuItem key={p._id} value={p._id}>{p.poid} - {p.vendorname}</MenuItem>)}</TextField><Button variant="outlined" onClick={load}>Refresh</Button><Button variant="contained" onClick={() => storeNote("GRN")} disabled={!selected}>Store GRN</Button><Button variant="contained" color="warning" onClick={() => storeNote("Return")} disabled={!selected}>Store Return Note</Button><Button variant="outlined" onClick={() => { setNoteType("Gatepass"); window.print(); }} disabled={!selected}>Print Outward Gatepass</Button>{block && <Button variant="outlined" target="_blank" href={deliveryNoteVerifyUrl(block, selected, noteType === "GRN" ? "purchasenewgrn" : "purchasenewgoodsreturn", global1.colid)}>Retrieve blockchain</Button>}</Stack></Paper>
        <Paper className="screen-only" sx={{ height: 480, mb: 2 }}><DataGrid rows={rows} columns={columns} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => { setSelected(p.row); setBlock(null); }} /></Paper>
        <Box id="quality-note-print"><DeliveryNotePrintPreview institution={institution} row={selected} type={noteType} block={block} /></Box>
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewInvoiceApprovalPage() {
  const { error, message, setError, setMessage } = useMessage();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [institution, setInstitution] = useState(null);
  const load = async () => {
    try {
      const res = await ep1.get("/api/v2/purchasenew/invoice-approval-queue", { params: { colid: global1.colid, role: global1.role, useremail: global1.user } });
      setRows((res.data.data || []).map((r) => ({ ...r, id: r._id })));
      loadInstitutionDetails().then(setInstitution);
    } catch (err) { setError(err.response?.data?.message || "Unable to load invoice approval queue"); }
  };
  useEffect(() => { load(); }, []);
  const action = async (type) => {
    if (!selected) return setError("Select one invoice.");
    await ep1.post(`/api/v2/purchasenew/invoices-${type}`, { id: selected._id, user: global1.user, useremail: global1.user, username: global1.name, role: global1.role });
    setMessage(`Invoice ${type}d.`); setSelected(null); await load();
  };
  return (
    <MenuPageShell title="Invoice Approval">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <PageTop title="Invoice Approval" subtitle="Approve vendor invoices through finance approval workflow." crumbs={[{ label: "Purchase new" }, { label: "Invoice Approval" }]} />
        <Status error={error} message={message} />
        <Paper sx={{ height: 420, mb: 2 }}><DataGrid rows={rows} columns={[{ field: "invoiceid", headerName: "Invoice", minWidth: 160 }, { field: "poid", headerName: "PO", minWidth: 140 }, { field: "vendorname", headerName: "Vendor", minWidth: 200 }, { field: "grandtotal", headerName: "Amount", minWidth: 150, valueFormatter: (p) => money(p.value) }, { field: "status", headerName: "Status", minWidth: 180 }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => setSelected(p.row)} /></Paper>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}><Button variant="contained" color="success" onClick={() => action("approve")} disabled={!selected}>Approve</Button><Button variant="outlined" color="error" onClick={() => action("reject")} disabled={!selected}>Reject</Button></Stack>
        <InvoicePrintPreview institution={institution} invoice={selected} block={null} />
      </Box>
    </MenuPageShell>
  );
}

export function PurchaseNewInvoiceStatusPage() {
  const { error, message, setError, setMessage } = useMessage();
  const [pos, setPos] = useState([]);
  const [poId, setPoId] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [block, setBlock] = useState(null);
  const [institution, setInstitution] = useState(null);
  const load = async () => {
    try {
      const [poRes, invRes] = await Promise.all([
        ep1.get("/api/v2/purchasenew/purchase-orders", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/purchasenew/invoices", { params: { colid: global1.colid, ...(poId ? { po: poId } : {}) } })
      ]);
      setPos(poRes.data.data || []);
      setRows((invRes.data.data || []).map((r) => ({ ...r, id: r._id })));
      loadInstitutionDetails().then(setInstitution);
    } catch (err) { setError(err.response?.data?.message || "Unable to load invoices"); }
  };
  useEffect(() => { load(); }, [poId]);
  const store = async () => {
    if (!selected) return setError("Select one invoice.");
    const res = await ep1.post("/api/v2/purchasenew/invoice-blockchain-store", { id: selected._id, user: global1.user, useremail: global1.user });
    setBlock(res.data.data); setMessage("Invoice stored in blockchain.");
  };
  return (
    <MenuPageShell title="Invoice Status">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print{body *{visibility:hidden}#invoice-status-print,#invoice-status-print *{visibility:visible}#invoice-status-print{position:absolute;left:0;top:0;width:100%;background:#fff;padding:14px}.screen-only{display:none!important}}`}</style>
        <PageTop title="Invoice Status" subtitle="Check PO invoices, print, store approved invoice in blockchain and retrieve." crumbs={[{ label: "Purchase new" }, { label: "Invoice Status" }]} />
        <Status error={error} message={message} />
        <Paper className="screen-only" sx={{ p: 2, mb: 2 }}><Stack direction="row" spacing={1} flexWrap="wrap"><TextField select sx={{ minWidth: 360 }} label="PO" value={poId} onChange={(e) => setPoId(e.target.value)}><MenuItem value="">All</MenuItem>{pos.map((p) => <MenuItem key={p._id} value={p._id}>{p.poid} - {p.vendorname}</MenuItem>)}</TextField><Button variant="outlined" onClick={load}>Refresh</Button><Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} disabled={!selected}>Print</Button><Button variant="contained" color="success" startIcon={<Verified />} onClick={store} disabled={!selected || selected.status !== "Approved"}>Store in blockchain</Button>{block && <Button variant="outlined" target="_blank" href={invoiceBlockchainVerifyUrl(block, selected, global1.colid)}>Retrieve blockchain</Button>}</Stack></Paper>
        <Paper className="screen-only" sx={{ height: 440, mb: 2 }}><DataGrid rows={rows} columns={[{ field: "invoiceid", headerName: "Invoice", minWidth: 160 }, { field: "poid", headerName: "PO", minWidth: 140 }, { field: "vendorname", headerName: "Vendor", minWidth: 200 }, { field: "grandtotal", headerName: "Amount", minWidth: 150, valueFormatter: (p) => money(p.value) }, { field: "status", headerName: "Status", minWidth: 180 }]} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} onRowClick={(p) => { setSelected(p.row); setBlock(null); }} /></Paper>
        <Box id="invoice-status-print"><InvoicePrintPreview institution={institution} invoice={selected} block={block} /></Box>
      </Box>
    </MenuPageShell>
  );
}
export function PurchaseNewDepartmentWorkflowPage() { return <WorkflowPage />; }
export function PurchaseNewInstitutionWorkflowPage() { return <WorkflowPage institution />; }
export function PurchaseNewDepartmentApprovalPage() { return <ApprovalPage stage="Department" />; }
export function PurchaseNewInstitutionApprovalPage() { return <ApprovalPage stage="Institution" />; }
