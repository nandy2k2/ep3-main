import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const colors = ["#2563eb", "#16a34a", "#f97316", "#7c3aed", "#0891b2", "#dc2626", "#4f46e5", "#0f766e", "#b45309", "#65a30d"];
const achievementTypes = ["Academic Project", "National award", "International award", "Publication", "Patent", "Fellowship", "1st Prize", "Runner up"];
const categories = ["Academic", "Sports", "Extra curricular"];
const statusOptions = ["Active", "Inactive", "Draft", "Submitted", "Approved", "Rejected", "Pending Level 1", "Pending Level 2", "Pending Level 3"];
const accreditationTypes = ["Program", "Institute"];
const instName = (institution = {}) => institution.institutionname || institution.insname || institution.name || global1.insname || "Institution";
const instAddress = (institution = {}) => institution.address || institution.address1 || global1.address || "";
const instLogo = (institution = {}) => institution.logolink || institution.logo || institution.inslogo || global1.logo || "";
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const withScope = (payload = {}) => ({ ...payload, colid: global1.colid, user: global1.user, namecreated: global1.name });
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.3, py: 1, alignItems: "flex-start" },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};

const configs = {
  achievements: {
    title: "Institution achievements",
    endpointKind: "achievements",
    blank: { academicyear: "", type: "student", name: "", regno: "", achievement: "", achievementtype: "", category: "", achievementdate: "", agency: "", location: "", status: "Active" },
    fields: ["academicyear", "type", "name", "regno", "achievement", "achievementtype", "category", "achievementdate", "agency", "location", "status"],
    filterFields: ["academicyear", "type", "name", "regno", "achievementtype", "category", "agency", "location", "status"]
  },
  accreditation: {
    title: "Acreditation status",
    endpointKind: "accreditation",
    blank: { accreditation: "", type: "Program", program: "", department: "", accreditationdate: "", validitydate: "", status: "Active" },
    fields: ["accreditation", "type", "program", "department", "accreditationdate", "validitydate", "status"],
    filterFields: ["accreditation", "type", "program", "department", "status"]
  },
  statute: {
    title: "Statute",
    endpointKind: "statute",
    blank: { academicyear: "", statute: "", description: "", filelink: "", approvalstatus: "Draft" },
    fields: ["academicyear", "statute", "description", "filelink", "approvalstatus"],
    filterFields: ["academicyear", "statute", "description", "approvalstatus"]
  },
  schoolstatute: {
    title: "School statutes",
    endpointKind: "schoolstatute",
    blank: { academicyear: "", faculty: "", statute: "", description: "", filelink: "", approvalstatus: "Draft" },
    fields: ["academicyear", "faculty", "statute", "description", "filelink", "approvalstatus"],
    filterFields: ["academicyear", "faculty", "statute", "description", "approvalstatus"]
  },
  rules: {
    title: "Rules and regulations",
    endpointKind: "rules",
    blank: { type: "Academic", rule: "", description: "", role: [], filelink: "", active: "Yes", startdate: "", enddate: "" },
    fields: ["type", "rule", "description", "role", "filelink", "active", "startdate", "enddate"],
    filterFields: ["type", "rule", "description", "role", "active"]
  },
  mou: {
    title: "MoU",
    endpointKind: "mou",
    blank: { academicyear: "", mou: "", details: "", type: "", party: "", description: "", level: "", startdate: "", enddate: "", faculty: "", department: "", approvalstatus: "Draft" },
    fields: ["academicyear", "mou", "details", "type", "party", "description", "level", "startdate", "enddate", "faculty", "department", "approvalstatus"],
    filterFields: ["academicyear", "mou", "type", "party", "level", "faculty", "department", "approvalstatus"]
  },
  mouactivity: {
    title: "MoU activity",
    endpointKind: "mouactivity",
    blank: { mouid: "", mou: "", academicyear: "", activity: "", activitydate: "", description: "", filelink: "", brochurelink: "", reportlink: "", guest: "", location: "", attendancelist: "" },
    fields: ["mouid", "mou", "academicyear", "activity", "activitydate", "description", "filelink", "brochurelink", "reportlink", "guest", "location", "attendancelist"],
    filterFields: ["mou", "academicyear", "activity", "guest", "location"]
  }
};

function exportCsv(filename, rows = [], fields = []) {
  const csv = [
    fields.map(csvEscape).join(","),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
  ].join("\n");
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

const countBy = (rows = [], keyFn) => Object.values(rows.reduce((acc, row) => {
  const key = String(typeof keyFn === "function" ? keyFn(row) : row[keyFn] || "Not specified").trim() || "Not specified";
  acc[key] = acc[key] || { label: key, count: 0 };
  acc[key].count += 1;
  return acc;
}, {})).sort((a, b) => b.count - a.count);

function PrintHeader({ title, institution }) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #d1d5db", borderRadius: 1, textAlign: "center", color: "#000" }}>
      {instLogo(institution) && <Box component="img" src={instLogo(institution)} alt="logo" sx={{ height: 58, objectFit: "contain", mb: 1 }} />}
      <Typography variant="h5" fontWeight={950}>{instName(institution)}</Typography>
      <Typography variant="body2">{instAddress(institution)}</Typography>
      <Typography variant="h6" fontWeight={950} sx={{ mt: 1 }}>{title}</Typography>
    </Paper>
  );
}

function DynamicFilters({ config, filters, setFilters, options, onLoad, loading }) {
  const addFilter = () => setFilters((prev) => [...prev, { field: "", value: "" }]);
  const update = (index, patch) => setFilters((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const remove = (index) => setFilters((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  const valuesFor = (field) => {
    if (field === "academicyear") return options.academicyears || [];
    if (field === "achievementtype") return options.achievementtypes || achievementTypes;
    if (field === "category") return options.categories || categories;
    if (field === "faculty") return options.faculties || [];
    if (field === "program") return options.programs || [];
    if (field === "department") return options.departments || [];
    if (field === "accreditation") return options.accreditations || [];
    if (field === "role") return [...new Set((options.users || []).map((user) => user.role).filter(Boolean))];
    if (field === "type") {
      if (config.endpointKind === "achievements") return ["faculty", "student"];
      if (config.endpointKind === "rules") return ["Academic", "Administrative"];
      if (config.endpointKind === "mou") return ["Academic", "Administrative", "Sports", "Cutural", "Exchange", "facilities", "Infrastructure", "Course", "Revenue"];
      return accreditationTypes;
    }
    if (field === "level") return ["National", "International"];
    if (field === "status" || field === "approvalstatus") return statusOptions;
    return [];
  };
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Typography fontWeight={900}>Dynamic Filters</Typography>
        <Button size="small" variant="outlined" onClick={addFilter}>Add filter</Button>
        <Button size="small" variant="contained" onClick={onLoad} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
      </Stack>
      <Grid container spacing={1}>
        {filters.map((filter, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => update(index, { field: event.target.value, value: "" })}>
                {config.filterFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={7}>
              <Autocomplete freeSolo options={valuesFor(filter.field)} value={filter.value || ""} onInputChange={(_, value) => update(index, { value })} renderInput={(params) => <TextField {...params} size="small" label="Value" />} />
            </Grid>
            <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => remove(index)}>Remove</Button></Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Paper>
  );
}

export function InstitutionCrudPage({ kind }) {
  const config = configs[kind];
  const [form, setForm] = useState(config.blank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: config.filterFields[0], value: "" }]);
  const [institution, setInstitution] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());

  const loadOptions = useCallback(async () => {
    const [optionsRes, institutionRes] = await Promise.all([
      ep1.get("/api/v2/institution-management/options", { params: withScope() }),
      ep1.get("/vins", { params: { colid: global1.colid } }).catch(() => ({ data: {} }))
    ]);
    setOptions(optionsRes.data || {});
    setInstitution(institutionRes.data || {});
  }, []);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get(`/api/v2/institution-management/${config.endpointKind}`, { params: paramsFromFilters() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records");
    } finally {
      setLoading(false);
    }
  }, [filters, config.endpointKind]);

  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);

  const columns = useMemo(() => [
    ...config.fields.map((field) => ({
      field,
      headerName: field === "regno" ? "Regno / EmpID" : field,
      minWidth: ["achievement", "description", "details", "filelink", "brochurelink", "reportlink", "attendancelist"].includes(field) ? 260 : 145,
      flex: ["achievement", "description", "details", "filelink", "brochurelink", "reportlink", "attendancelist", "agency", "location", "department", "program"].includes(field) ? 1 : 0,
      renderCell: ["filelink", "brochurelink", "reportlink", "attendancelist"].includes(field)
        ? (params) => params.value ? <Button size="small" href={params.value} target="_blank" rel="noreferrer">Open</Button> : ""
        : undefined
    })),
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: ["statute", "schoolstatute", "mou"].includes(config.endpointKind) ? 170 : 90,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />,
        ...(["statute", "schoolstatute", "mou"].includes(config.endpointKind) && !/^pending|approved$/i.test(String(params.row.approvalstatus || ""))
          ? [<GridActionsCellItem icon={<SaveIcon />} label="Submit" onClick={() => submitStatute(params.row)} />]
          : [])
      ]
    }
  ], [config.fields]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const save = async () => {
    try {
      setLoading(true);
      setError("");
      await ep1.post(`/api/v2/institution-management/${config.endpointKind}`, withScope({ ...form, id: editId }));
      setMessage(editId ? "Record updated" : "Record saved");
      setEditId("");
      setForm(config.blank);
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save record");
    } finally {
      setLoading(false);
    }
  };
  const edit = (row) => {
    setEditId(row._id);
    setForm({ ...config.blank, ...row, achievementdate: dateOnly(row.achievementdate), accreditationdate: dateOnly(row.accreditationdate), validitydate: dateOnly(row.validitydate) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async () => {
    if (!selection.length) return setError("Select records to delete");
    if (!window.confirm("Delete selected records?")) return;
    try {
      setLoading(true);
      await ep1.post(`/api/v2/institution-management/${config.endpointKind}/delete`, withScope({ ids: selection }));
      setSelection([]);
      setMessage("Selected records deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete records");
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
      await ep1.post(`/api/v2/institution-management/${config.endpointKind}/bulk`, withScope({ rows: Array.isArray(parsed) ? parsed : [parsed] }));
      setMessage("Bulk upload completed");
      await Promise.all([loadOptions(), loadRows()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload records");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      setUploadProgress(0);
      const data = new FormData();
      data.append("file", file);
      data.append("colid", global1.colid);
      data.append("user", global1.user || "");
      data.append("folder", `institution/${config.endpointKind}/${form.academicyear || "year"}`);
      data.append("description", `${config.title} document ${form.statute || form.mou || file.name}`);
      const uploadRes = await ep1.post("/api/v2/aws-file-library/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      const url = uploadRes.data?.url || "";
      if (!url) throw new Error("AWS upload did not return a file link");
      const linkField = event.target.dataset.field || "filelink";
      setForm((prev) => ({ ...prev, [linkField]: url }));
      setMessage("Document uploaded");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload document");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const submitStatute = async (row) => {
    if (!row?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await ep1.post("/api/v2/institution-management/statute/submit", withScope({ id: row._id, role: global1.role, kind: config.endpointKind }));
      setMessage(res.data?.message || "Submitted for approval");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit statute");
    } finally {
      setLoading(false);
    }
  };
  const downloadTemplate = () => exportCsv(`${config.endpointKind}_template.csv`, [config.blank], config.fields);

  return (
    <MenuPageShell title={config.title}>
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {message && <Alert className="no-print" severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? `Edit ${config.title}` : `Add ${config.title}`}</Typography>
          <Grid container spacing={2}>
            {config.fields.map((field) => (
              <Grid item xs={12} md={["achievement", "description", "details"].includes(field) ? 6 : 3} key={field}>
                {field === "academicyear" ? (
                  <Autocomplete freeSolo options={options.academicyears || []} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label="Academic year" />} />
                ) : field === "type" ? (
                  <Autocomplete freeSolo options={config.endpointKind === "achievements" ? ["faculty", "student"] : config.endpointKind === "rules" ? ["Academic", "Administrative"] : config.endpointKind === "mou" ? ["Academic", "Administrative", "Sports", "Cutural", "Exchange", "facilities", "Infrastructure", "Course", "Revenue"] : accreditationTypes} value={form[field] || ""} onInputChange={(_, value) => setField(field, value || "")} renderInput={(params) => <TextField {...params} label={field} />} />
                ) : field === "level" ? (
                  <Autocomplete freeSolo options={["National", "International"]} value={form[field] || ""} onInputChange={(_, value) => setField(field, value || "")} renderInput={(params) => <TextField {...params} label={field} />} />
                ) : field === "role" ? (
                  <Autocomplete multiple freeSolo options={[...new Set((options.users || []).map((user) => user.role).filter(Boolean))]} value={Array.isArray(form[field]) ? form[field] : String(form[field] || "").split(",").filter(Boolean)} onChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label="Role" />} />
                ) : field === "faculty" ? (
                  <Autocomplete freeSolo options={options.faculties || []} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label="Faculty" />} />
                ) : field === "achievementtype" ? (
                  <Autocomplete freeSolo options={options.achievementtypes || achievementTypes} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label="Achievement type" />} />
                ) : field === "category" ? (
                  <Autocomplete freeSolo options={options.categories || categories} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label={field} />} />
                ) : field === "program" ? (
                  <Autocomplete freeSolo options={options.programs || []} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label={field} />} />
                ) : field === "department" ? (
                  <Autocomplete freeSolo options={options.departments || []} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label={field} />} />
                ) : field === "mouid" ? (
                  <Autocomplete options={options.mous || []} getOptionLabel={(option) => option?.label || ""} value={(options.mous || []).find((item) => String(item.id) === String(form.mouid)) || null} onChange={(_, value) => setForm((prev) => ({ ...prev, mouid: value?.id || "", mou: value?.mou || "", academicyear: value?.academicyear || prev.academicyear }))} renderInput={(params) => <TextField {...params} label="MoU" />} />
                ) : field === "approvalstatus" ? (
                  <TextField fullWidth label="Approval status" value={form[field] || "Draft"} InputProps={{ readOnly: true }} />
                ) : field === "status" ? (
                  <Autocomplete freeSolo options={statusOptions} value={form[field] || ""} onInputChange={(_, value) => setField(field, value)} renderInput={(params) => <TextField {...params} label={field} />} />
                ) : ["filelink", "brochurelink", "reportlink", "attendancelist"].includes(field) ? (
                  <Stack spacing={1}>
                    <TextField fullWidth label={field} value={form[field] || ""} onChange={(event) => setField(field, event.target.value)} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button size="small" variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading}>
                        Upload AWS
                        <input hidden type="file" data-field={field} onChange={uploadDocument} />
                      </Button>
                      {uploadProgress > 0 && <Typography variant="caption">{uploadProgress}%</Typography>}
                    </Stack>
                  </Stack>
                ) : field.endsWith("date") ? (
                  <TextField fullWidth type="date" label={field} InputLabelProps={{ shrink: true }} value={form[field] || ""} onChange={(event) => setField(field, event.target.value)} />
                ) : (
                  <TextField fullWidth multiline={["achievement", "description", "details"].includes(field)} minRows={["achievement", "description", "details"].includes(field) ? 2 : 1} label={field === "regno" ? "regno / empid" : field} value={form[field] || ""} onChange={(event) => setField(field, event.target.value)} />
                )}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" onClick={() => { setEditId(""); setForm(config.blank); }}>Clear</Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
                {["statute", "schoolstatute", "mou"].includes(config.endpointKind) && editId && <Button variant="contained" color="secondary" onClick={() => submitStatute({ _id: editId })} disabled={loading}>Submit for approval</Button>}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <DynamicFilters config={config} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Box className="print-area">
          <PrintHeader title={config.title} institution={institution} />
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: "calc(100vh - 150px)", minHeight: 680 }}>
              <DataGrid
                rows={rows.map((row) => ({ id: row._id, ...row }))}
                columns={columns}
                checkboxSelection
                onRowSelectionModelChange={(selectionModel) => setSelection(selectionModel)}
                loading={loading}
                slots={{ toolbar: GridToolbar }}
                pageSizeOptions={[25, 50, 100]}
                sx={gridSx}
              />
            </Box>
          </Paper>
        </Box>
      </Stack>
    </MenuPageShell>
  );
}

function DashboardCard({ card }) {
  return (
    <Card elevation={0} sx={{ height: "100%", border: `1px solid ${card.tone || "#2563eb"}33`, borderLeft: `5px solid ${card.tone || "#2563eb"}`, borderRadius: 2 }}>
      <CardContent>
        <Typography color="text.secondary" fontWeight={800}>{card.label}</Typography>
        <Typography variant="h5" fontWeight={950} sx={{ color: card.tone || "#2563eb" }}>
          {card.money ? money(card.value) : `${Number(card.value || 0).toLocaleString("en-IN")}${card.suffix || ""}`}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: "100%" }}>
      <Typography fontWeight={900} sx={{ mb: 1 }}>{title}</Typography>
      <Box sx={{ height: 320 }}>{children}</Box>
    </Paper>
  );
}

const workflowBlank = { academicyear: "", level: 1, approverrole: "", approvername: "", approveremail: "", active: "Yes", comments: "" };
const workflowFields = ["academicyear", "level", "approverrole", "approvername", "approveremail", "active", "comments"];

export function StatuteWorkflowPage({ workflowkind = "statute", title = "Statute approval workflow" }) {
  const [form, setForm] = useState(workflowBlank);
  const [editId, setEditId] = useState("");
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [options, setOptions] = useState({ academicyears: [], users: [] });
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = useCallback(async () => {
    const res = await ep1.get("/api/v2/institution-management/options", { params: withScope() });
    setOptions(res.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);
  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());
  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/institution-management/statute-workflow", { params: { ...paramsFromFilters(), workflowkind } });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load workflow");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    try {
      setLoading(true);
      setError("");
      await ep1.post("/api/v2/institution-management/statute-workflow", withScope({ ...form, id: editId, workflowkind }));
      setMessage(editId ? "Workflow updated" : "Workflow saved");
      setForm(workflowBlank);
      setEditId("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save workflow");
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!selection.length) return setError("Select records to delete");
    if (!window.confirm("Delete selected workflow rows?")) return;
    try {
      setLoading(true);
      await ep1.post("/api/v2/institution-management/statute-workflow/delete", withScope({ ids: selection, workflowkind }));
      setSelection([]);
      setMessage("Selected workflow rows deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete workflow rows");
    } finally {
      setLoading(false);
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const textValue = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(textValue) : parseCsv(textValue);
      await ep1.post("/api/v2/institution-management/statute-workflow/bulk", withScope({ rows: Array.isArray(parsed) ? parsed : [parsed], workflowkind }));
      setMessage("Bulk upload completed");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to upload workflow");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const filterConfig = { endpointKind: "workflow", filterFields: ["academicyear", "level", "approverrole", "approvername", "approveremail", "active"] };
  const valueOptions = (field) => {
    if (field === "academicyear") return options.academicyears || [];
    if (field === "active") return ["Yes", "No"];
    if (field === "approverrole") return [...new Set((options.users || []).map((user) => user.role).filter(Boolean))];
    if (field === "approvername") return (options.users || []).map((user) => user.name).filter(Boolean);
    if (field === "approveremail") return (options.users || []).map((user) => user.email).filter(Boolean);
    return [];
  };
  const columns = [
    ...workflowFields.map((field) => ({ field, headerName: field, minWidth: field === "comments" ? 260 : 140, flex: field === "comments" ? 1 : 0 })),
    { field: "actions", type: "actions", width: 90, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => { setEditId(params.row._id); setForm({ ...workflowBlank, ...params.row }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />] }
  ];
  return (
    <MenuPageShell title={title}>
      <Stack spacing={2}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{editId ? "Edit workflow level" : "Add workflow level"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={options.academicyears || []} value={form.academicyear || ""} onInputChange={(_, value) => setForm((prev) => ({ ...prev, academicyear: value }))} renderInput={(params) => <TextField {...params} label="Academic year" />} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Level" value={form.level || 1} onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><Autocomplete freeSolo options={[...new Set((options.users || []).map((user) => user.role).filter(Boolean))]} value={form.approverrole || ""} onInputChange={(_, value) => setForm((prev) => ({ ...prev, approverrole: value }))} renderInput={(params) => <TextField {...params} label="Approver role" />} /></Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={options.users || []}
                getOptionLabel={(option) => option?.label || option?.name || ""}
                value={(options.users || []).find((user) => user.email === form.approveremail) || null}
                onChange={(_, value) => setForm((prev) => ({ ...prev, approvername: value?.name || "", approveremail: value?.email || "", approverrole: value?.role || prev.approverrole || "" }))}
                renderInput={(params) => <TextField {...params} label="Approver" />}
              />
            </Grid>
            <Grid item xs={12} md={3}><Autocomplete options={["Yes", "No"]} value={form.active || "Yes"} onChange={(_, value) => setForm((prev) => ({ ...prev, active: value || "Yes" }))} renderInput={(params) => <TextField {...params} label="Active" />} /></Grid>
            <Grid item xs={12} md={9}><TextField fullWidth multiline minRows={2} label="Comments" value={form.comments || ""} onChange={(event) => setForm((prev) => ({ ...prev, comments: event.target.value }))} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" onClick={() => { setEditId(""); setForm(workflowBlank); }}>Clear</Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv("statute_workflow_template.csv", [workflowBlank], workflowFields)}>Template</Button>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>Bulk upload<input hidden type="file" accept=".csv,.json" onChange={upload} /></Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={remove} disabled={loading}>Bulk delete</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            <Typography fontWeight={900}>Dynamic Filters</Typography>
            <Button size="small" variant="outlined" onClick={() => setFilters((prev) => [...prev, { field: "", value: "" }])}>Add filter</Button>
            <Button size="small" variant="contained" onClick={loadRows} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
          </Stack>
          <Grid container spacing={1}>
            {filters.map((filter, index) => (
              <React.Fragment key={index}>
                <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => setFilters((prev) => prev.map((item, i) => i === index ? { field: event.target.value, value: "" } : item))}>{filterConfig.filterFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={7}><Autocomplete freeSolo options={valueOptions(filter.field)} value={filter.value || ""} onInputChange={(_, value) => setFilters((prev) => prev.map((item, i) => i === index ? { ...item, value } : item))} renderInput={(params) => <TextField {...params} size="small" label="Value" />} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}>Remove</Button></Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: "calc(100vh - 150px)", minHeight: 680 }}>
            <DataGrid rows={rows.map((row) => ({ id: row._id, ...row }))} columns={columns} checkboxSelection onRowSelectionModelChange={setSelection} loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function StatuteApprovalPage({ kind = "statute", title = "Statute approval" }) {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState("");
  const [institution, setInstitution] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const [res, institutionRes] = await Promise.all([
        ep1.get("/api/v2/institution-management/statute-approvals", { params: withScope({ useremail: global1.user, role: global1.role, kind }) }),
        ep1.get("/vins", { params: { colid: global1.colid } }).catch(() => ({ data: {} }))
      ]);
      setRows(res.data?.rows || []);
      setInstitution(institutionRes.data || {});
      setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load pending statutes");
    } finally {
      setLoading(false);
    }
  };
  const act = async (action) => {
    if (!selected?._id) return setError("Select a statute first");
    try {
      setLoading(true);
      setError("");
      const res = await ep1.post("/api/v2/institution-management/statute-approve", withScope({ id: selected._id, action, comments, approvername: global1.name, approveremail: global1.user, approverrole: global1.role, kind }));
      setMessage(res.data?.message || `Statute ${action.toLowerCase()}`);
      setComments("");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action.toLowerCase()} statute`);
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { field: "academicyear", headerName: "Academic year", minWidth: 150 },
    { field: kind === "mou" ? "mou" : "statute", headerName: kind === "mou" ? "MoU" : "Statute", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 280, flex: 1 },
    { field: "approvalstatus", headerName: "Approval status", minWidth: 160 },
    { field: "pendingapprovername", headerName: "Pending approver", minWidth: 180 },
    { field: "filelink", headerName: "Document", minWidth: 130, renderCell: (params) => params.value ? <Button size="small" href={params.value} target="_blank" rel="noreferrer">Open</Button> : "" }
  ];
  return (
    <MenuPageShell title={title}>
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {message && <Alert className="no-print" severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper className="no-print" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadRows} disabled={loading}>{loading ? "Loading..." : "Load pending approvals"}</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
          </Stack>
        </Paper>
        <Box className="print-area">
          <PrintHeader title={title} institution={institution} />
          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: "52vh", minHeight: 420 }}>
              <DataGrid
                rows={rows.map((row) => ({ id: row._id, ...row }))}
                columns={columns}
                loading={loading}
                onRowClick={(params) => setSelected(params.row)}
                slots={{ toolbar: GridToolbar }}
                sx={gridSx}
              />
            </Box>
          </Paper>
          {selected && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" fontWeight={900}>{selected.statute || selected.mou}</Typography>
              <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{selected.description}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField fullWidth label="Academic year" value={selected.academicyear || ""} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Current status" value={selected.approvalstatus || ""} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Submitted at" value={dateOnly(selected.submittedat) || ""} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Approval comments" value={comments} onChange={(event) => setComments(event.target.value)} /></Grid>
                <Grid item xs={12} className="no-print">
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="success" onClick={() => act("Approved")} disabled={loading}>{loading ? "Processing..." : "Approve"}</Button>
                    <Button variant="contained" color="error" onClick={() => act("Rejected")} disabled={loading}>{loading ? "Processing..." : "Reject"}</Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>
      </Stack>
    </MenuPageShell>
  );
}

export function InstitutionReportPage({ kind = "mou", title = "MoU report" }) {
  const config = configs[kind];
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [institution, setInstitution] = useState({});
  const [filters, setFilters] = useState([{ field: config.filterFields[0], value: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadOptions = useCallback(async () => {
    const [optionsRes, institutionRes] = await Promise.all([
      ep1.get("/api/v2/institution-management/options", { params: withScope() }),
      ep1.get("/vins", { params: { colid: global1.colid } }).catch(() => ({ data: {} }))
    ]);
    setOptions(optionsRes.data || {});
    setInstitution(institutionRes.data || {});
  }, []);
  useEffect(() => { loadOptions().catch(() => {}); }, [loadOptions]);
  const paramsFromFilters = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, withScope());
  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get(`/api/v2/institution-management/${config.endpointKind}`, { params: paramsFromFilters() });
      setRows(res.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    } finally {
      setLoading(false);
    }
  };
  const cards = [
    { key: "total", label: "Total", value: rows.length, tone: "#2563eb" },
    { key: "academic", label: "Academic", value: rows.filter((row) => /academic/i.test(row.type || row.category || "")).length, tone: "#16a34a" },
    { key: "active", label: "Approved/Active", value: rows.filter((row) => /approved|active|yes/i.test(row.approvalstatus || row.active || "")).length, tone: "#7c3aed" },
    { key: "international", label: "International", value: rows.filter((row) => /international/i.test(row.level || "")).length, tone: "#f97316" }
  ];
  const byType = countBy(rows, (row) => row.type || row.activity || "Not specified");
  const byFaculty = countBy(rows, (row) => row.faculty || row.department || "Not specified");
  const columns = config.fields.map((field) => ({
    field,
    headerName: field,
    minWidth: ["description", "details", "filelink", "brochurelink", "reportlink", "attendancelist"].includes(field) ? 240 : 140,
    flex: ["description", "details"].includes(field) ? 1 : 0,
    renderCell: ["filelink", "brochurelink", "reportlink", "attendancelist"].includes(field) ? (params) => params.value ? <Button href={params.value} target="_blank" rel="noreferrer" size="small">Open</Button> : "" : undefined
  }));
  return (
    <MenuPageShell title={title}>
      <Stack spacing={2}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        {error && <Alert className="no-print" severity="error">{error}</Alert>}
        <DynamicFilters config={config} filters={filters} setFilters={setFilters} options={options} onLoad={loadRows} loading={loading} />
        <Stack className="no-print" direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv(`${config.endpointKind}_report.csv`, rows, config.fields)}>Export</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print preview</Button>
        </Stack>
        <Box className="print-area">
          <PrintHeader title={title} institution={institution} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {cards.map((card) => <Grid item xs={12} sm={6} md={3} key={card.key}><DashboardCard card={card} /></Grid>)}
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}><ChartCard title="Typewise"><ResponsiveContainer width="100%" height="100%"><BarChart data={byType}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></ChartCard></Grid>
            <Grid item xs={12} md={6}><ChartCard title="Faculty / Department"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip /><Legend /><Pie data={byFaculty} dataKey="count" nameKey="label" outerRadius={105} label>{byFaculty.map((row, index) => <Cell key={row.label || index} fill={colors[index % colors.length]} />)}</Pie></PieChart></ResponsiveContainer></ChartCard></Grid>
          </Grid>
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

function TaskCard({ task }) {
  const link = String(task.pagelink || "").trim();
  const route = link ? (link.startsWith("/") ? link : `/${link}`) : "";
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2, mb: 1.2 }}>
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography fontWeight={900}>{task.task || "Task"}</Typography>
          <Typography variant="body2" color="text.secondary">{task.faculty || task.facultyemail} | {task.category || "No category"}</Typography>
          <Typography variant="caption">Start: {dateOnly(task.startdate) || "-"} | Due: {dateOnly(task.duedate) || "-"}</Typography>
        </Box>
        {route && <Button size="small" component={RouterLink} to={route}>Open</Button>}
      </Stack>
    </Paper>
  );
}

export function ViceChancellorDashboardPage() {
  const [filters, setFilters] = useState({ academicyear: "" });
  const [options, setOptions] = useState({ academicyears: [] });
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState("active");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/vice-chancellor-dashboard/summary", { params: withScope({ academicyear: filters.academicyear }) });
      setDashboard(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load Vice Chancellor dashboard");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    ep1.get("/api/v2/institution-management/options", { params: withScope() })
      .then((res) => setOptions({ academicyears: res.data?.academicyears || [] }))
      .catch(() => setOptions({ academicyears: [] }));
    load();
  }, []);

  const programColumns = useMemo(() => [
    { field: "institution", headerName: "Institution", minWidth: 180, flex: 1 },
    { field: "faculty", headerName: "Faculty", minWidth: 160 },
    { field: "department", headerName: "Department", minWidth: 170 },
    { field: "program", headerName: "Program", minWidth: 200, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 140 }
  ], []);

  const exportPrograms = () => exportCsv("vice_chancellor_dashboard_programs.csv", dashboard?.tables?.programs || [], programColumns.map((column) => column.field));

  return (
    <MenuPageShell title="Vice Chancellor Dashboard">
      <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`@media print {.no-print{display:none!important}.print-area{box-shadow:none!important;border:0!important} body{background:white!important;color:#000!important}}`}</style>
        <Paper className="no-print" elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2, background: "linear-gradient(135deg,#111827,#2563eb)" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4" color="white" fontWeight={950}>Vice Chancellor Dashboard</Typography>
              <Typography sx={{ color: "#dbeafe" }}>Institution level cards, tasks, student distribution and program details.</Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Autocomplete
                freeSolo
                options={options.academicyears || []}
                value={filters.academicyear || ""}
                onInputChange={(_, value) => setFilters((prev) => ({ ...prev, academicyear: value || "" }))}
                renderInput={(params) => <TextField {...params} size="small" label="Academic year" sx={{ bgcolor: "white", borderRadius: 1, minWidth: 180 }} />}
              />
              <Button variant="contained" color="secondary" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportPrograms} sx={{ color: "white", borderColor: "#bfdbfe" }}>Export</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ color: "white", borderColor: "#bfdbfe" }}>Print</Button>
            </Stack>
          </Stack>
        </Paper>
        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box className="print-area">
          <PrintHeader title="Vice Chancellor Dashboard" institution={dashboard?.institution || {}} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {(dashboard?.cards || []).map((card) => <Grid item xs={12} sm={6} md={2.4} key={card.key}><DashboardCard card={card} /></Grid>)}
          </Grid>
          <Paper sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} className="no-print">
              <Tab value="active" label={`Active tasks (${dashboard?.tasks?.active?.length || 0})`} />
              <Tab value="overdue" label={`Overdue tasks (${dashboard?.tasks?.overdue?.length || 0})`} />
            </Tabs>
            <Box sx={{ maxHeight: 310, overflow: "auto", mt: 2 }}>
              {(tab === "active" ? dashboard?.tasks?.active || [] : dashboard?.tasks?.overdue || []).map((task) => <TaskCard task={task} key={task._id} />)}
              {!(tab === "active" ? dashboard?.tasks?.active || [] : dashboard?.tasks?.overdue || []).length && <Alert severity="info">No tasks in this tab.</Alert>}
            </Box>
          </Paper>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <ChartCard title="Programwise Students">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard?.charts?.programwiseStudents || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={84} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard title="Categorywise Students">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={dashboard?.charts?.categorywiseStudents || []} dataKey="count" nameKey="label" outerRadius={105} label>
                      {(dashboard?.charts?.categorywiseStudents || []).map((row, index) => <Cell key={row.label || index} fill={colors[index % colors.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
          <Paper sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Program Details</Typography>
            <Box sx={{ height: "calc(100vh - 170px)", minHeight: 640 }}>
              <DataGrid rows={dashboard?.tables?.programs || []} columns={programColumns} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} sx={gridSx} />
            </Box>
          </Paper>
        </Box>
      </Box>
    </MenuPageShell>
  );
}
