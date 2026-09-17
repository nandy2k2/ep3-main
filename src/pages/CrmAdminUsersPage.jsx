import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const roleOptions = [
  { label: "CRM Admin", value: "crmadmin" },
  { label: "Counselor", value: "counselor" },
  { label: "Telecaller", value: "telecaller" },
  { label: "Campus Visit", value: "campusvisit" }
];

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "Password@123",
  role: "counselor",
  department: "CRM",
  designation: "",
  joiningdate: "",
  googleemail: "",
  institution: "",
  excluded: "No",
  authenticator: "Yes"
};

const templateRow = {
  name: "Example CRM User",
  email: "crm.user@example.com",
  phone: "9999999999",
  password: "Password@123",
  role: "counselor",
  department: "CRM",
  designation: "Counselor",
  joiningdate: "2026-08-01",
  googleemail: "crm.user@gmail.com",
  institution: "Institution name",
  excluded: "No",
  authenticator: "Yes"
};

const columnsBase = [
  { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
  { field: "email", headerName: "Email", minWidth: 230, flex: 1 },
  { field: "phone", headerName: "Phone", minWidth: 130 },
  { field: "role", headerName: "Role", minWidth: 130 },
  { field: "department", headerName: "Department", minWidth: 170 },
  { field: "designation", headerName: "Designation", minWidth: 170 },
  { field: "joiningdate", headerName: "Joining Date", minWidth: 140 },
  { field: "googleemail", headerName: "Google Email", minWidth: 230 },
  { field: "institution", headerName: "Institution", minWidth: 210 },
  { field: "authenticator", headerName: "Authenticator", minWidth: 135 },
  { field: "excluded", headerName: "Excluded", minWidth: 115 },
  { field: "status", headerName: "Status", minWidth: 100 }
];

const embeddedMode = () => new URLSearchParams(window.location.search).get("embedded") === "1";

export default function CrmAdminUsersPage() {
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isEmbedded = embeddedMode();

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/crm-admin-dashboard/users", { params: { colid: global1.colid, search } });
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load CRM users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(defaultForm);
    setEditId("");
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const res = await ep1.post("/api/v2/crm-admin-dashboard/users", {
        ...form,
        id: editId,
        colid: global1.colid,
        user: global1.user
      });
      setMessage(`User saved. Menu access updated for ${res.data?.accessCount || 0} rule(s).`);
      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save CRM user");
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditId(row._id);
    setForm({
      ...defaultForm,
      ...row,
      joiningdate: row.joiningdate ? String(row.joiningdate).slice(0, 10) : ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async () => {
    if (!selectedRows.length) {
      setError("Select one or more users to delete.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await ep1.post("/api/v2/crm-admin-dashboard/users-delete", { colid: global1.colid, ids: selectedRows });
      setMessage(`${res.data?.deletedCount || 0} user(s) deleted.`);
      setSelectedRows([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete CRM users");
    } finally {
      setSaving(false);
    }
  };

  const workbook = (filename, data) => {
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "CRM Users");
    XLSX.writeFile(book, filename);
  };

  const exportRows = () => workbook("crm_admin_users.xlsx", rows.map((row) => {
    const output = {};
    columnsBase.forEach((column) => { output[column.field] = row[column.field] || ""; });
    return output;
  }));

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const buffer = await file.arrayBuffer();
      const book = XLSX.read(buffer, { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({ ...row, rowNumber: index + 2 }));
      const res = await ep1.post("/api/v2/crm-admin-dashboard/users-bulk", { colid: global1.colid, user: global1.user, items });
      const errors = res.data?.errors || [];
      setMessage(`Bulk upload completed. Saved ${res.data?.saved || 0} row(s).`);
      if (errors.length) setError(errors.slice(0, 6).map((item) => `Row ${item.rowNumber}: ${item.message}`).join(" | "));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to bulk upload CRM users");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    {
      field: "actions",
      headerName: "Action",
      minWidth: 110,
      sortable: false,
      renderCell: ({ row }) => <Button size="small" onClick={() => editRow(row)}>Edit</Button>
    },
    ...columnsBase.map((column) => ({
      ...column,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.35, py: 0.75 }}>
          {params.value ?? ""}
        </Box>
      )
    }))
  ], []);

  const body = (
    <Box p={isEmbedded ? 1 : 3}>
      <Typography variant="h5" fontWeight={950}>Add CRM users</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Create CRM admin, counselor, telecaller and campus visit users. Saving a user also grants the role-based menu access requested for that CRM role.
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Email / Login ID" value={form.email} onChange={(e) => updateForm("email", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Phone" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}>
            <Autocomplete
              options={roleOptions}
              value={roleOptions.find((item) => item.value === form.role) || null}
              getOptionLabel={(option) => option.label || ""}
              onChange={(_, value) => updateForm("role", value?.value || "")}
              renderInput={(params) => <TextField {...params} size="small" label="Role" />}
            />
          </Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Department" value={form.department} onChange={(e) => updateForm("department", e.target.value)} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Designation" value={form.designation} onChange={(e) => updateForm("designation", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Joining Date" InputLabelProps={{ shrink: true }} value={form.joiningdate || ""} onChange={(e) => updateForm("joiningdate", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Google Email" value={form.googleemail} onChange={(e) => updateForm("googleemail", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Institution" value={form.institution} onChange={(e) => updateForm("institution", e.target.value)} /></Grid>
          <Grid item xs={12} md={2}>
            <Autocomplete options={["Yes", "No"]} value={form.authenticator || "Yes"} onChange={(_, value) => updateForm("authenticator", value || "Yes")} renderInput={(params) => <TextField {...params} size="small" label="Authenticator" />} />
          </Grid>
          <Grid item xs={12} md={2}>
            <Autocomplete options={["No", "Yes"]} value={form.excluded || "No"} onChange={(_, value) => updateForm("excluded", value || "No")} renderInput={(params) => <TextField {...params} size="small" label="Excluded" />} />
          </Grid>
          <Grid item xs={12}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save}>{saving ? "Saving..." : editId ? "Update user" : "Save user"}</Button>
              <Button variant="outlined" onClick={reset}>Clear</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => workbook("crm_admin_users_template.xlsx", [templateRow])}>Template</Button>
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={saving}>
                Bulk upload
                <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadFile} />
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportRows}>Export</Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={saving || !selectedRows.length} onClick={deleteRows}>Bulk delete</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
          <TextField size="small" label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: { md: 320 } }} />
          <Button variant="contained" onClick={load} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(ids) => setSelectedRows(ids)}
          rowSelectionModel={selectedRows}
          getRowHeight={() => "auto"}
          slots={{ toolbar: GridToolbar }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          sx={{
            minHeight: 520,
            "& .MuiDataGrid-cell": { alignItems: "flex-start", whiteSpace: "normal", overflowWrap: "anywhere" },
            "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
          }}
        />
      </Paper>
    </Box>
  );

  return isEmbedded ? body : <MenuPageShell title="Add CRM users">{body}</MenuPageShell>;
}
