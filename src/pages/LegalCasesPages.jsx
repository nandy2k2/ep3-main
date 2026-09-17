import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name });
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const instName = (institution = {}) => institution.institutionname || institution.insname || institution.name || global1.insname || "Institution";
const instAddress = (institution = {}) => institution.address || institution.address1 || global1.address || "";
const instLogo = (institution = {}) => institution.logolink || institution.logo || institution.inslogo || global1.logo || "";
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.3, py: 1, alignItems: "flex-start" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

const caseBlank = { academicyear: "", caseno: "", court: "", title: "", description: "", startdate: "", lawyername: "", party: [], partycontact: "", partyemail: "", lawyercontact: "", lawyeremail: "", status: "Active" };
const caseFields = ["academicyear", "caseno", "court", "title", "description", "startdate", "lawyername", "party", "partycontact", "partyemail", "lawyercontact", "lawyeremail", "status"];
const hearingBlank = { caseid: "", caseno: "", court: "", hearing: "", hearingdate: "", title: "", topic: "", outcome: "", issues: "", nexthearingdate: "", status: "Pending" };
const hearingFields = ["caseid", "caseno", "court", "hearing", "hearingdate", "title", "topic", "outcome", "issues", "nexthearingdate", "status"];

function exportCsv(filename, rows = [], fields = []) {
  const csv = [fields.map(csvEscape).join(","), ...rows.map((row) => fields.map((field) => csvEscape(Array.isArray(row[field]) ? row[field].join("; ") : row[field])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function parseCsv(value) {
  const lines = String(value || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function PrintHeader({ title, institution }) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #d1d5db", textAlign: "center", color: "#000" }}>
      {instLogo(institution) && <Box component="img" src={instLogo(institution)} alt="logo" sx={{ height: 58, objectFit: "contain", mb: 1 }} />}
      <Typography variant="h5" fontWeight={950}>{instName(institution)}</Typography>
      <Typography variant="body2">{instAddress(institution)}</Typography>
      <Typography variant="h6" fontWeight={950} sx={{ mt: 1 }}>{title}</Typography>
    </Paper>
  );
}

function DynamicFilters({ fields, filters, setFilters, options, onLoad, loading, includeDates, dateFilters = {}, setDateFilters }) {
  const valuesFor = (field) => {
    if (field === "academicyear") return options.academicyears || [];
    if (field === "caseno") return options.casenos || [];
    if (field === "court") return options.courts || [];
    if (field === "status") return options.statuses || [];
    if (field === "lawyername") return options.lawyers || [];
    return [];
  };
  return (
    <Paper className="no-print" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Typography fontWeight={900}>Dynamic Filters</Typography>
        <Button size="small" variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "", value: "" }])}>Add filter</Button>
        <Button size="small" variant="contained" onClick={onLoad} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
      </Stack>
      <Grid container spacing={1}>
        {filters.map((filter, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => setFilters((prev) => prev.map((item, i) => i === index ? { field: event.target.value, value: "" } : item))}>
                {fields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={7}><Autocomplete freeSolo options={valuesFor(filter.field)} value={filter.value || ""} onInputChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value } : item))} renderInput={(params) => <TextField {...params} size="small" label="Value" />} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button></Grid>
          </React.Fragment>
        ))}
        {includeDates?.map((dateField) => (
          <React.Fragment key={dateField}>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label={`${dateField} from`} InputLabelProps={{ shrink: true }} value={dateFilters[`${dateField}from`] || ""} onChange={(event) => setDateFilters?.((prev) => ({ ...prev, [`${dateField}from`]: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label={`${dateField} to`} InputLabelProps={{ shrink: true }} value={dateFilters[`${dateField}to`] || ""} onChange={(event) => setDateFilters?.((prev) => ({ ...prev, [`${dateField}to`]: event.target.value }))} /></Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Paper>
  );
}

function paramsFromFilters(filters, extra = {}) {
  const params = withScope(extra);
  if (Array.isArray(filters)) {
    filters.forEach((filter) => {
      if (filter.field && filter.value) params[filter.field] = filter.value;
    });
  } else {
    Object.assign(params, filters || {});
  }
  return params;
}

export function LegalCasesPage() {
  const [form, setForm] = useState(caseBlank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [tab, setTab] = useState("active");
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [dateFilters, setDateFilters] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/legal-cases/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/legal-cases/cases", { params: paramsFromFilters(filters, { ...dateFilters, tab }) });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load legal cases");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    try {
      setLoading(true);
      const res = await ep1.post("/api/v2/legal-cases/cases", withScope({ ...form, id: editId }));
      setMessage(res.data?.message || (editId ? "Legal case updated" : "Legal case saved"));
      setForm(caseBlank);
      setEditId("");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save legal case");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selection.length) return setError("Select cases to delete");
    if (!window.confirm("Delete selected legal cases and their hearings?")) return;
    try {
      setLoading(true);
      await ep1.post("/api/v2/legal-cases/cases/delete", withScope({ ids: selection }));
      setSelection([]);
      setMessage("Selected legal cases deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete legal cases");
    } finally {
      setLoading(false);
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const text = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      await ep1.post("/api/v2/legal-cases/cases/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload cases");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const columns = useMemo(() => [
    ...caseFields.map((field) => ({ field, headerName: field, minWidth: ["title", "description", "party"].includes(field) ? 240 : 140, flex: ["title", "description", "party"].includes(field) ? 1 : 0, renderCell: field === "party" ? (params) => Array.isArray(params.value) ? params.value.join(", ") : params.value : undefined })),
    { field: "actions", type: "actions", width: 90, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(params.row._id); setForm({ ...caseBlank, ...params.row, startdate: dateOnly(params.row.startdate), party: Array.isArray(params.row.party) ? params.row.party : String(params.row.party || "").split(",").filter(Boolean) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ], []);

  return (
    <MenuPageShell title="Legal cases">
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {message && <Alert className="no-print" severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit legal case" : "Add legal case"}</Typography>
          <Grid container spacing={2}>
            {caseFields.map((field) => (
              <Grid item xs={12} md={["title", "description", "party"].includes(field) ? 6 : 3} key={field}>
                {field === "academicyear" ? <Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear || ""} onInputChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value }))} renderInput={(params) => <TextField {...params} label="Academic year" />} />
                  : field === "court" ? <Autocomplete freeSolo options={options.courts || []} value={form.court || ""} onInputChange={(_, value) => setForm((prev) => ({ ...prev, court: value }))} renderInput={(params) => <TextField {...params} label="Court" />} />
                  : field === "status" ? <Autocomplete options={["Active", "Closed"]} value={form.status || "Active"} onChange={(_, value) => setForm((prev) => ({ ...prev, status: value || "Active" }))} renderInput={(params) => <TextField {...params} label="Status" />} />
                  : field === "party" ? <Autocomplete multiple freeSolo options={[]} value={Array.isArray(form.party) ? form.party : []} onChange={(_, value) => setForm((prev) => ({ ...prev, party: value }))} renderInput={(params) => <TextField {...params} label="Parties" />} />
                  : field === "startdate" ? <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate || ""} onChange={(event) => setForm((prev) => ({ ...prev, startdate: event.target.value }))} />
                  : <TextField fullWidth multiline={["title", "description"].includes(field)} minRows={field === "description" ? 3 : 1} label={field} value={form[field] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))} />}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" onClick={() => { setEditId(""); setForm(caseBlank); }}>Clear</Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("legal_cases_template.csv", [caseBlank], caseFields)}>Template</Button>
                <Button variant="outlined" component="label">Bulk upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Tabs className="no-print" value={tab} onChange={(_, value) => { setTab(value); setRows([]); }}><Tab value="active" label="Active" /><Tab value="closed" label="Closed" /></Tabs>
        <DynamicFilters fields={["academicyear", "caseno", "court", "title", "lawyername", "status"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} includeDates={["startdate"]} dateFilters={dateFilters} setDateFilters={setDateFilters} />
        <Box className="print-area">
          <PrintHeader title={`Legal cases - ${tab === "active" ? "Active" : "Closed"}`} institution={options.institution || {}} />
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: "calc(100vh - 150px)", minHeight: 680 }}>
              <DataGrid rows={rows.map((row) => ({ id: row._id, ...row }))} columns={columns} checkboxSelection onRowSelectionModelChange={setSelection} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
            </Box>
          </Paper>
        </Box>
      </Stack>
    </MenuPageShell>
  );
}

export function LegalHearingsPage() {
  const [form, setForm] = useState(hearingBlank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [filters, setFilters] = useState([{ field: "caseno", value: "" }]);
  const [dateFilters, setDateFilters] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/legal-cases/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);
  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/legal-cases/hearings", { params: paramsFromFilters(filters, dateFilters) });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load hearings");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    try {
      setLoading(true);
      await ep1.post("/api/v2/legal-cases/hearings", withScope({ ...form, id: editId }));
      setMessage(editId ? "Hearing updated" : "Hearing saved");
      setForm(hearingBlank);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save hearing");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selection.length) return setError("Select hearings to delete");
    try {
      setLoading(true);
      await ep1.post("/api/v2/legal-cases/hearings/delete", withScope({ ids: selection }));
      setSelection([]);
      setMessage("Selected hearings deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete hearings");
    } finally {
      setLoading(false);
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const text = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      await ep1.post("/api/v2/legal-cases/hearings/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload hearings");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const columns = [
    ...hearingFields.filter((field) => field !== "caseid").map((field) => ({ field, headerName: field, minWidth: ["title", "topic", "outcome", "issues"].includes(field) ? 240 : 140, flex: ["title", "topic", "outcome", "issues"].includes(field) ? 1 : 0 })),
    { field: "actions", type: "actions", width: 90, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(params.row._id); setForm({ ...hearingBlank, ...params.row, hearingdate: dateOnly(params.row.hearingdate), nexthearingdate: dateOnly(params.row.nexthearingdate) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ];
  return (
    <MenuPageShell title="Legal hearings">
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {message && <Alert className="no-print" severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit hearing" : "Add hearing"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete options={options.activeCases || []} getOptionLabel={(option) => option?.label || ""} value={(options.activeCases || []).find((item) => String(item.id) === String(form.caseid)) || null} onChange={(_, value) => setForm((prev) => ({ ...prev, caseid: value?.id || "", caseno: value?.caseno || "", court: value?.court || "", title: value?.title || prev.title }))} renderInput={(params) => <TextField {...params} label="Active case" />} />
            </Grid>
            {hearingFields.filter((field) => field !== "caseid").map((field) => (
              <Grid item xs={12} md={["title", "topic", "outcome", "issues"].includes(field) ? 6 : 3} key={field}>
                {field.endsWith("date") ? <TextField fullWidth type="date" label={field} InputLabelProps={{ shrink: true }} value={form[field] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))} />
                  : field === "status" ? <Autocomplete freeSolo options={["Pending", "Completed", "Adjourned", "Closed"]} value={form.status || ""} onInputChange={(_, value) => setForm((prev) => ({ ...prev, status: value || "" }))} renderInput={(params) => <TextField {...params} label="Status" />} />
                  : <TextField fullWidth multiline={["topic", "outcome", "issues"].includes(field)} minRows={["topic", "outcome", "issues"].includes(field) ? 2 : 1} label={field} value={form[field] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))} />}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" onClick={() => { setEditId(""); setForm(hearingBlank); }}>Clear</Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("legal_hearings_template.csv", [hearingBlank], hearingFields)}>Template</Button>
                <Button variant="outlined" component="label">Bulk upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <DynamicFilters fields={["caseno", "court", "hearing", "title", "status"]} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} includeDates={["hearingdate", "nexthearingdate"]} dateFilters={dateFilters} setDateFilters={setDateFilters} />
        <Box className="print-area">
          <PrintHeader title="Legal hearings" institution={options.institution || {}} />
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: "calc(100vh - 150px)", minHeight: 680 }}>
              <DataGrid rows={rows.map((row) => ({ id: row._id, ...row }))} columns={columns} checkboxSelection onRowSelectionModelChange={setSelection} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
            </Box>
          </Paper>
        </Box>
      </Stack>
    </MenuPageShell>
  );
}

export function UpcomingLegalHearingsPage() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      const [upcomingRes, optionsRes] = await Promise.all([
        ep1.get("/api/v2/legal-cases/upcoming", { params: withScope() }),
        ep1.get("/api/v2/legal-cases/options", { params: withScope() })
      ]);
      setRows(upcomingRes.data?.rows || []);
      setOptions(optionsRes.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load upcoming hearings");
    } finally {
      setLoading(false);
    }
  };
  const columns = ["caseno", "casetitle", "court", "hearingdate", "nexthearingdate", "topic", "status", "lawyername"].map((field) => ({ field, headerName: field, minWidth: ["casetitle", "topic"].includes(field) ? 240 : 140, flex: ["casetitle", "topic"].includes(field) ? 1 : 0 }));
  return (
    <MenuPageShell title="Upcoming hearings">
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>{loading ? "Loading..." : "Load next 3 days"}</Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("upcoming_legal_hearings.csv", rows, columns.map((column) => column.field))}>Export</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
          </Stack>
        </Paper>
        <Box className="print-area">
          <PrintHeader title="Upcoming hearings in next 3 days" institution={options.institution || {}} />
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: "calc(100vh - 150px)", minHeight: 680 }}>
              <DataGrid rows={rows.map((row) => ({ id: row._id, ...row }))} columns={columns} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
            </Box>
          </Paper>
        </Box>
      </Stack>
    </MenuPageShell>
  );
}
