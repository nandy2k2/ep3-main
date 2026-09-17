import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
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
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blank = { numberofotps: 6, active: "Yes" };
const fields = ["numberofotps", "active"];
const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name });
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25, py: 1, alignItems: "flex-start" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

function parseCsv(value) {
  const lines = String(value || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function exportCsv(filename, rows = [], columns = fields) {
  const csv = [columns.map(csvEscape).join(","), ...rows.map((row) => columns.map((field) => csvEscape(row[field])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function NepLmsOtpAttendanceConfigurationPage() {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState([]);
  const [options, setOptions] = useState({ numberOptions: [1, 2, 3, 4, 5, 6], activeOptions: ["Yes", "No"], filterOptions: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/neplms/otp-attendance-configuration/options", { params: withScope() });
    setOptions(res.data || {});
  };

  useEffect(() => { loadOptions().catch(() => {}); }, []);

  const params = useMemo(() => {
    const query = withScope();
    filters.forEach((filter) => {
      if (filter.field && filter.value) query[filter.field] = filter.value;
    });
    return query;
  }, [filters]);

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/neplms/otp-attendance-configuration", { params });
      setRows(res.data?.rows || []);
      setMessage("OTP attendance configurations loaded");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load OTP attendance configuration");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setLoading(true);
      setError("");
      await ep1.post("/api/v2/neplms/otp-attendance-configuration", withScope({ ...form, id: editId || undefined }));
      setForm(blank);
      setEditId("");
      setMessage("OTP attendance configuration saved");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save OTP attendance configuration");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!selected.length) return setError("Select rows to delete");
    if (!window.confirm("Delete selected OTP attendance configurations?")) return;
    try {
      setLoading(true);
      await ep1.post("/api/v2/neplms/otp-attendance-configuration/delete", withScope({ ids: selected }));
      setSelected([]);
      setMessage("Selected configurations deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete OTP attendance configurations");
    } finally {
      setLoading(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setLoading(true);
      const textValue = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(textValue) : parseCsv(textValue);
      await ep1.post("/api/v2/neplms/otp-attendance-configuration/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload configurations");
    } finally {
      setLoading(false);
    }
  };

  const valueOptions = (field) => options.filterOptions?.[field] || (field === "numberofotps" ? options.numberOptions : options.activeOptions);
  const columns = [
    { field: "numberofotps", headerName: "Number of OTPs", minWidth: 170 },
    { field: "active", headerName: "Active", minWidth: 130 },
    { field: "namecreated", headerName: "Created by", minWidth: 180, flex: 1 },
    { field: "user", headerName: "User", minWidth: 180, flex: 1 },
    { field: "updatedAt", headerName: "Updated at", minWidth: 180 },
    {
      field: "actions",
      type: "actions",
      width: 90,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => {
          setEditId(row._id);
          setForm({ ...blank, ...row });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }} />
      ]
    }
  ];

  return (
    <MenuPageShell title="OTP attendance configuration">
      <Stack spacing={2} sx={{ p: 3 }}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {message && <Alert className="no-print" severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit configuration" : "Add configuration"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.numberOptions || [1, 2, 3, 4, 5, 6]}
                value={Number(form.numberofotps || 6)}
                onChange={(_, value) => setForm((prev) => ({ ...prev, numberofotps: value || 6 }))}
                renderInput={(params) => <TextField {...params} label="Number of OTPs" helperText="Allowed range: 1 to 6" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.activeOptions || ["Yes", "No"]}
                value={form.active || "Yes"}
                onChange={(_, value) => setForm((prev) => ({ ...prev, active: value || "Yes" }))}
                renderInput={(params) => <TextField {...params} label="Active" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" onClick={() => { setEditId(""); setForm(blank); }}>Clear</Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("otp_attendance_configuration_template.csv", [blank], fields)}>Template</Button>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Paper className="no-print" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            <Typography fontWeight={900}>Dynamic Filters</Typography>
            <Button size="small" variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "", value: "" }])}>Add filter</Button>
            <Button size="small" variant="contained" onClick={loadRows} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
          </Stack>
          <Grid container spacing={1}>
            {filters.map((filter, index) => (
              <React.Fragment key={index}>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => setFilters((prev) => prev.map((item, i) => i === index ? { field: event.target.value, value: "" } : item))}>
                    {["numberofotps", "active", "user", "namecreated"].map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Autocomplete freeSolo options={valueOptions(filter.field)} value={filter.value || ""} onInputChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value } : item))} renderInput={(params) => <TextField {...params} size="small" label="Value" />} />
                </Grid>
                <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button></Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Paper>
        <Box className="print-area">
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: "calc(100vh - 150px)", minHeight: 680 }}>
              <DataGrid rows={rows.map((row) => ({ id: row._id, ...row }))} columns={columns} checkboxSelection onRowSelectionModelChange={setSelected} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
            </Box>
          </Paper>
        </Box>
      </Stack>
    </MenuPageShell>
  );
}
