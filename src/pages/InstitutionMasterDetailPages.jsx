import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Delete, Download, Edit, Refresh, Save, UploadFile } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const text = (value) => String(value || "").trim();
const basePayload = () => ({ colid: global1.colid, user: global1.user });

const indianBanks = [
  "State Bank of India",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Indian Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "IDFC FIRST Bank",
  "Yes Bank",
  "Federal Bank",
  "RBL Bank",
  "South Indian Bank",
  "Karnataka Bank",
  "Karur Vysya Bank",
  "City Union Bank",
  "Tamilnad Mercantile Bank",
  "DCB Bank",
  "Bandhan Bank",
  "CSB Bank",
  "Jammu & Kashmir Bank"
];

const regulatoryBodies = [
  "AICTE",
  "UGC",
  "NMC",
  "DCI",
  "PCI",
  "INC",
  "NCH",
  "NCISM",
  "COA",
  "BCI",
  "NCTE",
  "RCI",
  "ICAR",
  "VCI",
  "CCIM",
  "CCH",
  "State Nursing Council",
  "State Medical Faculty",
  "State Paramedical Council",
  "University",
  "State Government",
  "Other"
];

const yesNoOptions = ["Yes", "No"];
const statusOptions = ["Active", "Inactive"];

const pageConfig = {
  leadership: {
    title: "Institution leadership",
    blank: {
      institution: "",
      institutioncode: "",
      userid: "",
      user: "",
      useremail: "",
      name: "",
      leadershiprole: "",
      governingbodymember: "No",
      appointmentdate: "",
      retirementdate: "",
      status: "Active"
    },
    fields: ["institution", "useremail", "leadershiprole", "governingbodymember", "appointmentdate", "retirementdate", "status"],
    template: {
      institution: "Example Institution",
      useremail: "leader@example.edu",
      name: "Leader Name",
      leadershiprole: "Dean",
      governingbodymember: "Yes",
      appointmentdate: "2026-07-01",
      retirementdate: "",
      status: "Active"
    },
    columns: [
      { field: "institution", headerName: "Institution", width: 220 },
      { field: "name", headerName: "User", width: 180 },
      { field: "useremail", headerName: "User email", width: 220 },
      { field: "leadershiprole", headerName: "Leadership role", width: 180 },
      { field: "governingbodymember", headerName: "Governing body member", width: 180 },
      { field: "appointmentdate", headerName: "Appointment date", width: 150, valueGetter: ({ row }) => text(row.appointmentdate).slice(0, 10) },
      { field: "retirementdate", headerName: "Retirement date", width: 150, valueGetter: ({ row }) => text(row.retirementdate).slice(0, 10) },
      { field: "status", headerName: "Status", width: 120 }
    ]
  },
  regulatory: {
    title: "Regulatory",
    blank: {
      institution: "",
      institutioncode: "",
      regulatorybody: "",
      permanentid: "",
      lettertype: "EOA",
      letternumber: "",
      validityyear: "",
      validitystartdate: "",
      validityexpirydate: "",
      status: "Active"
    },
    fields: ["institution", "regulatorybody", "permanentid", "lettertype", "letternumber", "validityyear", "validitystartdate", "validityexpirydate", "status"],
    template: {
      institution: "Example Institution",
      regulatorybody: "AICTE",
      permanentid: "PID123",
      lettertype: "EOA",
      letternumber: "EOA/2026/001",
      validityyear: "2026-27",
      validitystartdate: "2026-07-01",
      validityexpirydate: "2027-06-30",
      status: "Active"
    },
    columns: [
      { field: "institution", headerName: "Institution", width: 220 },
      { field: "regulatorybody", headerName: "Regulatory body", width: 180 },
      { field: "permanentid", headerName: "Permanent ID", width: 150 },
      { field: "lettertype", headerName: "Letter type", width: 130 },
      { field: "letternumber", headerName: "Letter number", width: 190 },
      { field: "validityyear", headerName: "Validity year", width: 140 },
      { field: "validitystartdate", headerName: "Start date", width: 130, valueGetter: ({ row }) => text(row.validitystartdate).slice(0, 10) },
      { field: "validityexpirydate", headerName: "Expiry date", width: 130, valueGetter: ({ row }) => text(row.validityexpirydate).slice(0, 10) },
      { field: "status", headerName: "Status", width: 120 }
    ]
  },
  bankaccount: {
    title: "All bank accounts",
    blank: {
      institution: "",
      institutioncode: "",
      accountnumber: "",
      ifsccode: "",
      accountholdername: "",
      accounttype: "Current",
      bank: "",
      branch: "",
      location: "",
      status: "Active"
    },
    fields: ["institution", "accountnumber", "ifsccode", "accountholdername", "accounttype", "bank", "branch", "location", "status"],
    template: {
      institution: "Example Institution",
      accountnumber: "1234567890",
      ifsccode: "SBIN0000001",
      accountholdername: "Example Institution",
      accounttype: "Current",
      bank: "State Bank of India",
      branch: "Main Branch",
      location: "Bhopal",
      status: "Active"
    },
    columns: [
      { field: "institution", headerName: "Institution", width: 220 },
      { field: "accountnumber", headerName: "Account number", width: 170 },
      { field: "ifsccode", headerName: "IFSC code", width: 140 },
      { field: "accountholdername", headerName: "Account holder name", width: 220 },
      { field: "accounttype", headerName: "Account type", width: 140 },
      { field: "bank", headerName: "Bank", width: 200 },
      { field: "branch", headerName: "Branch", width: 160 },
      { field: "location", headerName: "Location", width: 150 },
      { field: "status", headerName: "Status", width: 120 }
    ]
  }
};

function readExcelRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wb = XLSX.read(new Uint8Array(event.target.result), { type: "array" });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function exportTemplate(row, title) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([row]), "Template");
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_template.xlsx`);
}

export default function InstitutionMasterDetailPage({ kind = "leadership" }) {
  const config = pageConfig[kind] || pageConfig.leadership;
  const [options, setOptions] = useState({ institutions: [], users: [] });
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(config.blank);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/institution-master-details/options", { params: basePayload() });
    setOptions({ institutions: res.data?.institutions || [], users: res.data?.users || [] });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get(`/api/v2/institution-master-details/${kind}`, { params: { ...basePayload(), ...filters } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(config.blank);
    setFilters({});
    setEditingId("");
    setSelected([]);
    loadOptions();
    load();
  }, [kind]);

  const setField = (field, value) => setForm((old) => ({ ...old, [field]: value }));

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await ep1.post(`/api/v2/institution-master-details/${kind}`, { ...form, id: editingId, ...basePayload() });
      setMessage("Saved");
      setForm(config.blank);
      setEditingId("");
      await Promise.all([load(), loadOptions()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteRows = async (ids) => {
    if (!ids.length) return setError("Select at least one row");
    if (!window.confirm(`Delete ${ids.length} selected record(s)?`)) return;
    setSaving(true);
    try {
      await ep1.post(`/api/v2/institution-master-details/${kind}/delete`, { ids, colid: global1.colid });
      setMessage("Deleted");
      setSelected([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete");
    } finally {
      setSaving(false);
    }
  };

  const bulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const excelRows = await readExcelRows(file);
      const res = await ep1.post(`/api/v2/institution-master-details/${kind}/bulk`, { rows: excelRows, ...basePayload() });
      const errors = res.data?.errors || [];
      setMessage(`Bulk upload completed. Saved ${res.data?.saved || res.data?.inserted || 0} row(s).${errors.length ? ` Skipped: ${errors.join("; ")}` : ""}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setSaving(false);
    }
  };

  const institutionValue = useMemo(
    () => options.institutions.find((row) => row.institution === form.institution) || (form.institution ? { institution: form.institution } : null),
    [options.institutions, form.institution]
  );

  const userValue = useMemo(
    () => options.users.find((row) => row.email === form.useremail) || (form.useremail ? { name: form.name, email: form.useremail } : null),
    [options.users, form.useremail, form.name]
  );

  const renderField = (field) => {
    if (field === "institution") {
      return (
        <Autocomplete
          freeSolo
          options={options.institutions}
          value={institutionValue}
          getOptionLabel={(option) => (typeof option === "string" ? option : option?.institution || "")}
          onInputChange={(_, value) => setForm((old) => ({ ...old, institution: value || "", institutioncode: "" }))}
          onChange={(_, value) => {
            const institution = typeof value === "string" ? value : value?.institution || "";
            setForm((old) => ({ ...old, institution, institutioncode: typeof value === "string" ? "" : value?.institutioncode || "" }));
          }}
          renderInput={(params) => <TextField {...params} size="small" label="Institution" />}
        />
      );
    }
    if (field === "useremail") {
      return (
        <Autocomplete
          options={options.users}
          value={userValue}
          getOptionLabel={(option) => `${option?.name || "No name"} - ${option?.email || ""}${option?.role ? ` (${option.role})` : ""}`}
          onChange={(_, value) => setForm((old) => ({
            ...old,
            userid: value?._id || "",
            user: value?.user || value?.email || "",
            useremail: value?.email || "",
            name: value?.name || ""
          }))}
          renderInput={(params) => <TextField {...params} size="small" label="User / user email" />}
        />
      );
    }
    if (field === "regulatorybody") {
      return <Autocomplete freeSolo options={regulatoryBodies} value={form.regulatorybody || ""} onInputChange={(_, value) => setField("regulatorybody", value || "")} onChange={(_, value) => setField("regulatorybody", value || "")} renderInput={(params) => <TextField {...params} size="small" label="Regulatory body" />} />;
    }
    if (field === "bank") {
      return <Autocomplete freeSolo options={indianBanks} value={form.bank || ""} onInputChange={(_, value) => setField("bank", value || "")} onChange={(_, value) => setField("bank", value || "")} renderInput={(params) => <TextField {...params} size="small" label="Bank" />} />;
    }
    if (field === "governingbodymember") {
      return <TextField select fullWidth size="small" label="Governing body member" value={form.governingbodymember || "No"} onChange={(e) => setField(field, e.target.value)}>{yesNoOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>;
    }
    if (field === "accounttype") {
      return <TextField select fullWidth size="small" label="Account type" value={form.accounttype || "Current"} onChange={(e) => setField(field, e.target.value)}><MenuItem value="Savings">Savings</MenuItem><MenuItem value="Current">Current</MenuItem></TextField>;
    }
    if (field === "status") {
      return <TextField select fullWidth size="small" label="Status" value={form.status || "Active"} onChange={(e) => setField(field, e.target.value)}>{statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>;
    }
    if (field.toLowerCase().includes("date")) {
      return <TextField fullWidth size="small" type="date" label={field} InputLabelProps={{ shrink: true }} value={text(form[field]).slice(0, 10)} onChange={(e) => setField(field, e.target.value)} />;
    }
    return <TextField fullWidth size="small" label={field} value={form[field] || ""} onChange={(e) => setField(field, e.target.value)} />;
  };

  return (
    <MenuPageShell title={config.title}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>{config.title}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              {config.fields.map((field) => (
                <Grid item xs={12} md={field === "institution" || field === "useremail" ? 3 : 2} key={field}>
                  {renderField(field)}
                </Grid>
              ))}
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" startIcon={<Save />} disabled={saving} onClick={save}>
                  {saving ? "Saving..." : editingId ? "Update" : "Save"}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo
                options={options.institutions}
                getOptionLabel={(option) => (typeof option === "string" ? option : option?.institution || "")}
                value={filters.institution || ""}
                onInputChange={(_, value) => setFilters((old) => ({ ...old, institution: value || "" }))}
                onChange={(_, value) => setFilters((old) => ({ ...old, institution: typeof value === "string" ? value : value?.institution || "" }))}
                renderInput={(params) => <TextField {...params} size="small" label="Filter institution" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth size="small" label="Filter status" value={filters.status || ""} onChange={(e) => setFilters((old) => ({ ...old, status: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                <Button startIcon={<Refresh />} variant="outlined" onClick={load}>Load</Button>
                <Button startIcon={<Download />} variant="outlined" onClick={() => exportTemplate(config.template, config.title)}>Template</Button>
                <Button component="label" startIcon={<UploadFile />} variant="outlined">Bulk upload<input hidden type="file" accept=".xlsx,.xls" onChange={bulkUpload} /></Button>
                <Button startIcon={<Delete />} color="error" variant="outlined" disabled={!selected.length || saving} onClick={() => deleteRows(selected)}>Bulk delete</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        {saving && <LinearProgress sx={{ mb: 2 }} />}
        <Paper sx={{ p: 1 }}>
          <DataGrid
            rows={rows}
            getRowId={(row) => row._id}
            columns={[
              ...config.columns,
              {
                field: "actions",
                type: "actions",
                width: 100,
                getActions: ({ row }) => [
                  <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...config.blank, ...row }); }} />,
                  <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRows([row._id])} />
                ]
              }
            ]}
            loading={loading}
            checkboxSelection
            rowSelectionModel={selected}
            onRowSelectionModelChange={setSelected}
            autoHeight
            getRowHeight={() => "auto"}
            sx={{
              "& .MuiDataGrid-cell": { alignItems: "flex-start", lineHeight: 1.35, py: 1, whiteSpace: "normal", wordBreak: "break-word" },
              "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
          />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
