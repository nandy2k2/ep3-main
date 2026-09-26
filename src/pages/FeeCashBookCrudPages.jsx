import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { Add, Cancel, Delete, Download, Edit, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const statusOptions = ["Active", "Inactive"];
const levelOptions = ["Institution", "Faculty", "Department", "Program"];

const pageConfig = {
  fee: {
    title: "Fee Book",
    api: "/api/v2/fee-books-crud",
    key: "feebook",
    label: "Fee Book",
    templateName: "fee_book_template.xlsx",
    sample: "General Fee Book"
  },
  cash: {
    title: "Cash Book",
    api: "/api/v2/cash-books-crud",
    key: "cashbook",
    label: "Cash Book",
    templateName: "cash_book_template.xlsx",
    sample: "Main Cash Book"
  }
};

const blankBase = {
  description: "",
  type: "",
  level: "",
  status1: "Active",
  comments: ""
};

function text(value) {
  return String(value ?? "").trim();
}

function normalizeRow(row, key) {
  return {
    ...row,
    id: row._id,
    [key]: row[key] || (key === "cashbook" ? row.cashnook : "") || ""
  };
}

function exportWorkbook(rows, filename) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, filename);
}

function BookCrudPage({ kind }) {
  const config = pageConfig[kind];
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ ...blankBase, [config.key]: "" });
  const [editingId, setEditingId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ type: "", level: "", status1: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const colid = useMemo(() => global1.colid, []);

  const loadRows = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = { colid };
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await ep1.get(config.api, { params });
      setRows((res.data.data || []).map((row) => normalizeRow(row, config.key)));
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title} records`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId("");
    setForm({ ...blankBase, [config.key]: "" });
  };

  const saveRow = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ep1.post(config.api, {
        ...form,
        id: editingId,
        colid,
        user: global1.user,
        name: global1.name || global1.user
      });
      setMessage(editingId ? `${config.title} updated` : `${config.title} created`);
      resetForm();
      await loadRows();
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteRows = async (ids) => {
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected ${config.title} record(s)?`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post(`${config.api}/delete`, { colid, ids });
      setSelectedIds([]);
      setMessage(`Deleted ${res.data.deleted || ids.length} record(s)`);
      await loadRows();
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to delete ${config.title}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    exportWorkbook([
      {
        [config.label]: config.sample,
        Description: "Default collection book",
        Type: "Default",
        Level: "Institution",
        Status: "Active",
        Comments: ""
      }
    ], config.templateName);
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const rowsToUpload = json.map((row, index) => ({
        rowNumber: index + 2,
        [config.key]: row[config.key] || row[config.label],
        description: row.description || row.Description,
        type: row.type || row.Type,
        level: row.level || row.Level,
        status1: row.status1 || row.status || row.Status,
        comments: row.comments || row.Comments
      }));
      const res = await ep1.post(`${config.api}/bulk`, {
        colid,
        user: global1.user,
        name: global1.name || global1.user,
        rows: rowsToUpload
      });
      const errors = res.data.errors || [];
      setMessage(`Bulk upload completed. Inserted ${res.data.inserted || 0}${errors.length ? `, errors ${errors.length}` : ""}.`);
      if (errors.length) setError(errors.map((item) => `Row ${item.rowNumber}: ${item.message}`).join(" | "));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload file");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: config.key, headerName: config.label, minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 220, flex: 1 },
    { field: "type", headerName: "Type", width: 150 },
    { field: "level", headerName: "Level", width: 150 },
    { field: "status1", headerName: "Status", width: 130 },
    { field: "comments", headerName: "Comments", minWidth: 220, flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setEditingId(params.row._id);
                setForm({
                  [config.key]: params.row[config.key] || "",
                  description: params.row.description || "",
                  type: params.row.type || "",
                  level: params.row.level || "",
                  status1: params.row.status1 || "Active",
                  comments: params.row.comments || ""
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => deleteRows([params.row._id])}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const uniqueTypes = Array.from(new Set(rows.map((row) => row.type).filter(Boolean))).sort();
  const uniqueLevels = Array.from(new Set([...levelOptions, ...rows.map((row) => row.level).filter(Boolean)])).sort();

  return (
    <MenuPageShell title={config.title}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={950}>{config.title}</Typography>
            <Typography color="text.secondary">Full CRUD, bulk upload and bulk delete for {config.label.toLowerCase()} master records.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button startIcon={<Refresh />} variant="outlined" onClick={() => loadRows()}>Load</Button>
            <Button startIcon={<Download />} variant="outlined" onClick={downloadTemplate}>Template</Button>
            <Button component="label" startIcon={<UploadFile />} variant="outlined">
              Bulk upload
              <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
            </Button>
            <Button startIcon={<Delete />} color="error" variant="outlined" disabled={!selectedIds.length} onClick={() => deleteRows(selectedIds)}>
              Bulk delete
            </Button>
            <Chip label={`${rows.length} records`} variant="outlined" />
          </Stack>
        </Stack>

        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {(loading || saving) && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={900}>{editingId ? `Edit ${config.title}` : `Add ${config.title}`}</Typography>
                {editingId && <IconButton onClick={resetForm}><Cancel /></IconButton>}
              </Stack>
              <Box component="form" onSubmit={saveRow}>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    required
                    label={config.label}
                    value={form[config.key] || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, [config.key]: event.target.value }))}
                  />
                  <TextField size="small" label="Description" multiline minRows={2} value={form.description || ""} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                  <TextField size="small" label="Type" value={form.type || ""} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} />
                  <TextField select size="small" label="Level" value={form.level || ""} onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}>
                    <MenuItem value="">Select</MenuItem>
                    {levelOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="Status" value={form.status1 || "Active"} onChange={(event) => setForm((prev) => ({ ...prev, status1: event.target.value }))}>
                    {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Comments" multiline minRows={2} value={form.comments || ""} onChange={(event) => setForm((prev) => ({ ...prev, comments: event.target.value }))} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button type="submit" disabled={saving} variant="contained" startIcon={editingId ? <Save /> : <Add />}>{editingId ? "Update" : "Create"}</Button>
                    <Button disabled={saving} variant="outlined" startIcon={<Cancel />} onClick={resetForm}>Clear</Button>
                  </Stack>
                </Stack>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                <TextField select size="small" label="Type" value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))} sx={{ minWidth: 160 }}>
                  <MenuItem value="">All</MenuItem>
                  {uniqueTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Level" value={filters.level} onChange={(event) => setFilters((prev) => ({ ...prev, level: event.target.value }))} sx={{ minWidth: 170 }}>
                  <MenuItem value="">All</MenuItem>
                  {uniqueLevels.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Status" value={filters.status1} onChange={(event) => setFilters((prev) => ({ ...prev, status1: event.target.value }))} sx={{ minWidth: 150 }}>
                  <MenuItem value="">All</MenuItem>
                  {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <Button variant="contained" onClick={() => loadRows(filters)}>Apply filters</Button>
                <Button variant="outlined" onClick={() => { const clean = { type: "", level: "", status1: "" }; setFilters(clean); loadRows(clean); }}>Clear</Button>
              </Stack>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row._id}
                loading={loading}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={setSelectedIds}
                autoHeight
                getRowHeight={() => "auto"}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true } }}
                pageSizeOptions={[10, 25, 50, 100]}
                sx={{
                  "& .MuiDataGrid-cell": { alignItems: "flex-start", py: 1, whiteSpace: "normal", wordBreak: "break-word" }
                }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button variant="outlined" onClick={() => exportWorkbook(rows.map((row) => ({
                  [config.label]: text(row[config.key]),
                  Description: row.description || "",
                  Type: row.type || "",
                  Level: row.level || "",
                  Status: row.status1 || "",
                  Comments: row.comments || ""
                })), `${config.title.toLowerCase().replaceAll(" ", "_")}.xlsx`)}>
                  Export
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </MenuPageShell>
  );
}

export function FeeBookCrudPage() {
  return <BookCrudPage kind="fee" />;
}

export function CashBookCrudPage() {
  return <BookCrudPage kind="cash" />;
}
