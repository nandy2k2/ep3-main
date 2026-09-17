import React, { useEffect, useRef, useState } from "react";
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
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankForm = {
  name: "",
  server: "",
  xapikey: "",
  default: "No",
  active: "Yes"
};

const filterFields = [
  { field: "name", label: "Name" },
  { field: "server", label: "Server" },
  { field: "default", label: "Default" },
  { field: "active", label: "Active" },
  { field: "user", label: "User" }
];

const yesNoOptions = ["Yes", "No"];

export default function EpaathsalaAiPage() {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState([{ field: "name", value: "" }]);
  const [options, setOptions] = useState({ name: [], server: [], default: yesNoOptions, active: yesNoOptions, user: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/epaathsala-ai/options", { params: { colid: global1.colid } });
      setOptions((prev) => ({ ...prev, ...(res.data?.options || {}) }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load filter options");
    }
  };

  useEffect(() => { loadOptions(); }, []);

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      filters.forEach((filter) => {
        if (filter.field && filter.value) params[filter.field] = filter.value;
      });
      const res = await ep1.get("/api/v2/epaathsala-ai", { params });
      setRows(res.data?.data || []);
      loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load Epaathsala AI settings");
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const clearForm = () => {
    setForm(blankForm);
    setEditing(null);
  };

  const saveRow = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        ...form,
        id: editing?._id,
        colid: global1.colid,
        user: global1.user,
        createdname: global1.name
      };
      const res = await ep1.post("/api/v2/epaathsala-ai", payload);
      setMessage(`Epaathsala AI ${editing ? "updated" : "saved"}: ${res.data?.data?.name || form.name}`);
      clearForm();
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save Epaathsala AI setting");
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      server: row.server || "",
      xapikey: "",
      default: row.default || "No",
      active: row.active || "Yes"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRows = async (ids) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await ep1.post("/api/v2/epaathsala-ai/delete", { colid: global1.colid, ids });
      setMessage("Selected Epaathsala AI settings deleted.");
      setSelectedRows([]);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete Epaathsala AI settings");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: "Default Epaathsala AI", server: "https://server.example.com", xapikey: "", default: "Yes", active: "Yes" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "epaathsala_ai");
    XLSX.writeFile(wb, "epaathsala_ai_template.xlsx");
  };

  const uploadBulk = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      setMessage("");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const uploadRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const res = await ep1.post("/api/v2/epaathsala-ai/bulk", {
        colid: global1.colid,
        user: global1.user,
        createdname: global1.name,
        rows: uploadRows
      });
      setMessage(`Bulk upload completed. Rows saved: ${res.data?.count || 0}`);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload Epaathsala AI settings");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const columns = [
    { field: "name", headerName: "Name", minWidth: 220, flex: 1 },
    { field: "server", headerName: "Server", minWidth: 260, flex: 1.2 },
    { field: "xapikeyconfigured", headerName: "X API Key", minWidth: 130, valueGetter: (params) => params.row?.xapikeyconfigured ? "Configured" : "Not set" },
    { field: "default", headerName: "Default", minWidth: 110 },
    { field: "active", headerName: "Active", minWidth: 110 },
    { field: "createdname", headerName: "Name", minWidth: 170 },
    { field: "user", headerName: "User", minWidth: 190 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => editRow(row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => deleteRows([row._id])} showInMenu />
      ]
    }
  ];

  return (
    <MenuPageShell title="Epaathsala AI">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <Typography variant="h4" fontWeight={900}>Epaathsala AI</Typography>
            <Typography color="text.secondary">Configure Epaathsala AI server credentials for this institution.</Typography>
          </Paper>

          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editing ? "Edit Epaathsala AI" : "Add Epaathsala AI"}</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Name" value={form.name} onChange={(e) => setField("name", e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Server" value={form.server} onChange={(e) => setField("server", e.target.value)} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="X API Key"
                  value={form.xapikey}
                  onChange={(e) => setField("xapikey", e.target.value)}
                  helperText={editing ? "Optional. Leave blank to keep existing key." : "Optional. Leave blank if the RAG server does not require a key."}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Autocomplete options={yesNoOptions} value={form.default} onChange={(_, value) => setField("default", value || "No")} renderInput={(params) => <TextField {...params} size="small" label="Default" />} />
              </Grid>
              <Grid item xs={12} md={1}>
                <Autocomplete options={yesNoOptions} value={form.active} onChange={(_, value) => setField("active", value || "Yes")} renderInput={(params) => <TextField {...params} size="small" label="Active" />} />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" startIcon={saving ? null : <SaveIcon />} disabled={saving} onClick={saveRow}>{saving ? "Saving..." : editing ? "Update" : "Save"}</Button>
                  <Button variant="outlined" disabled={saving} onClick={clearForm}>Clear</Button>
                  <Button variant="outlined" onClick={downloadTemplate}>Template</Button>
                  <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? "Uploading..." : "Bulk upload"}</Button>
                  <Button color="error" variant="outlined" disabled={!selectedRows.length || loading} onClick={() => deleteRows(selectedRows)}>Bulk delete</Button>
                  <input ref={fileRef} type="file" hidden accept=".xlsx,.xls,.csv" onChange={uploadBulk} />
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Dynamic filters</Typography>
            <Stack spacing={1}>
              {filters.map((filter, index) => (
                <Grid container spacing={1} key={`${filter.field}-${index}`}>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={filterFields}
                      value={filterFields.find((item) => item.field === filter.field) || null}
                      onChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, field: value?.field || "name", value: "" } : item))}
                      getOptionLabel={(option) => option.label || ""}
                      renderInput={(params) => <TextField {...params} size="small" label="Field" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Autocomplete
                      freeSolo
                      options={options[filter.field] || []}
                      value={filter.value || ""}
                      onInputChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value } : item))}
                      renderInput={(params) => <TextField {...params} size="small" label="Value" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "name", value: "" }])}>Add filter</Button>
                      <Button color="error" variant="outlined" onClick={() => setFilters((prev) => prev.length === 1 ? [{ field: "name", value: "" }] : prev.filter((_, i) => i !== index))}>Remove</Button>
                    </Stack>
                  </Grid>
                </Grid>
              ))}
              <Box>
                <Button variant="contained" disabled={loading} onClick={loadRows}>{loading ? "Loading..." : "Load"}</Button>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row._id}
              checkboxSelection
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={(model) => setSelectedRows(model)}
              loading={loading}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "epaathsala_ai" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              sx={{
                "& .MuiDataGrid-cell": {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.35,
                  alignItems: "flex-start",
                  py: 1
                }
              }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
