import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepButton,
  Stepper,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Delete, Edit, Save } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const academicYear = "2026-27";
const defaultRegulation = "R2026";
const levelOptions = ["UG", "PG", "PhD", "Diploma", "Integrated"];
const typeOptions = ["Science", "Arts", "Humanities", "Commerce", "Management", "Engineering"];
const sourceDefaults = ["Website", "Campus Visit", "Facebook", "Google", "Instagram", "Provider"];
const stageDefaults = ["New Lead", "Interested", "Filled form", "Campus Visit", "Converted", "Cold", "Not Interested"];
const roleOptions = [
  { label: "CRM Admin", value: "crmadmin" },
  { label: "Counselor", value: "counselor" },
  { label: "Telecaller", value: "telecaller" },
  { label: "Campus Visit", value: "campusvisit" }
];

const durationByLevel = { Diploma: 2, PG: 2, Integrated: 5, PhD: 5, UG: 3 };
const durationOptions = (level) => (level === "UG" ? [3, 4] : [durationByLevel[level] || 3]);
const clean = (value) => String(value || "").trim();

const optionButtonSx = (selected) => ({
  borderRadius: 999,
  px: 2.2,
  py: 1,
  textTransform: "none",
  fontWeight: 900,
  transform: selected ? "translateY(-2px)" : "translateY(0)",
  boxShadow: selected ? "0 12px 24px rgba(37,99,235,0.22)" : "none",
  transition: "all 180ms ease",
  whiteSpace: "nowrap"
});

const blankProgram = {
  level: "UG",
  type: "Science",
  program: "",
  programcode: "",
  intakecapacity: "",
  totalcredits: 3,
  lastrevisionyear: academicYear,
  introductionyear: academicYear,
  discontinueyear: "2036-37",
  durationinyear: 3,
  Order: 1,
  status1: "Active"
};

const blankUser = {
  name: "",
  email: "",
  phone: "",
  password: "Password@123",
  role: "counselor",
  department: "CRM",
  designation: "Counselor",
  joiningdate: "",
  googleemail: "",
  institution: "",
  excluded: "No",
  authenticator: "Yes"
};

export default function CrmSetupWizardPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [programForm, setProgramForm] = useState(blankProgram);
  const [userForm, setUserForm] = useState(blankUser);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [telecallerForm, setTelecallerForm] = useState({ ...blankUser, role: "telecaller", designation: "Telecaller" });
  const [telecallerPrograms, setTelecallerPrograms] = useState([]);
  const [telecallerCounselor, setTelecallerCounselor] = useState(null);
  const [campusForm, setCampusForm] = useState({ ...blankUser, role: "campusvisit", designation: "Campus Visit Counselor" });
  const [campusPrograms, setCampusPrograms] = useState([]);
  const [sourceForm, setSourceForm] = useState({ source_name: "", source_type: "Other", description: "", is_active: "Yes" });
  const [stageForm, setStageForm] = useState({ stagename: "", description: "", isactive: true, is_final_stage: false });
  const [sourceSelected, setSourceSelected] = useState(sourceDefaults);
  const [stageSelected, setStageSelected] = useState(stageDefaults);
  const [programRows, setProgramRows] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [telecallerMappings, setTelecallerMappings] = useState([]);
  const [sources, setSources] = useState([]);
  const [stages, setStages] = useState([]);
  const [editingSourceId, setEditingSourceId] = useState("");
  const [editingStageId, setEditingStageId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const programOptions = useMemo(() => programRows.map((row) => ({
    ...row,
    label: `${row.program || row.name || ""} (${row.programcode || ""})`
  })), [programRows]);
  const counselorOptions = useMemo(() => crmUsers.filter((row) => String(row.role || "").toLowerCase() === "counselor"), [crmUsers]);

  const setBusy = async (work, successMessage) => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await work();
      if (successMessage) setMessage(successMessage);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [programRes, userRes, mappingRes, telecallerMappingRes, sourceRes, stageRes] = await Promise.all([
        ep1.get("/api/v2/mprograms-management", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/crm-admin-dashboard/users", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/crm-counselor-mapping", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/crm-management/telecaller-mappings", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/crm-management/sources", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/crm-management/stages", { params: { colid: global1.colid } })
      ]);
      const nextPrograms = programRes.data?.data || [];
      setProgramRows(nextPrograms);
      setCrmUsers(userRes.data?.data || []);
      setMappings(mappingRes.data?.data || []);
      setTelecallerMappings(telecallerMappingRes.data?.data || []);
      setSources(sourceRes.data?.data || []);
      setStages(stageRes.data?.data || []);
      setProgramForm((prev) => ({ ...prev, Order: prev.Order || nextPrograms.length + 1 }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load CRM setup data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateProgram = (field, value) => {
    setProgramForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "level") {
        next.durationinyear = durationByLevel[value] || 3;
        if (value === "UG") next.durationinyear = 3;
      }
      return next;
    });
  };

  const ensureDefaultRegulation = async () => {
    const res = await ep1.get("/api/v2/regulationmaster", { params: { colid: global1.colid, search: defaultRegulation } });
    const exists = (res.data?.data || []).some((row) => row.regulation === defaultRegulation);
    if (!exists) {
      await ep1.post("/api/v2/regulationmaster", {
        colid: global1.colid,
        regulation: defaultRegulation,
        description: "Default CRM setup regulation",
        isactive: "Yes"
      });
    }
  };

  const saveProgram = () => setBusy(async () => {
    if (!clean(programForm.program) || !clean(programForm.programcode)) throw new Error("Program name and program code are required.");
    await ensureDefaultRegulation();
    await ep1.post("/api/v2/mprograms-management", {
      ...programForm,
      name: programForm.program,
      year: academicYear,
      colid: global1.colid,
      user: global1.user
    });
    setProgramForm((prev) => ({ ...blankProgram, level: prev.level, type: prev.type, Order: Number(prev.Order || 0) + 1 }));
    await loadAll();
    setActiveStep(1);
  }, "Program saved and default regulation R2026 is ready.");

  const saveCrmUserAndMappings = () => setBusy(async () => {
    if (!clean(userForm.name) || !clean(userForm.email) || !clean(userForm.phone)) throw new Error("Name, email and phone are required.");
    const res = await ep1.post("/api/v2/crm-admin-dashboard/users", {
      ...userForm,
      colid: global1.colid,
      user: global1.user
    });
    if (userForm.role === "counselor" && selectedPrograms.length) {
      await Promise.all(selectedPrograms.map((program) => ep1.post("/api/v2/crm-counselor-mapping", {
        academicyear: academicYear,
        regulation: defaultRegulation,
        program: program.program || program.name || "",
        programcode: program.programcode || "",
        counselorname: userForm.name,
        counseloremail: userForm.email,
        counselors: [{ name: userForm.name, email: userForm.email }],
        status: "Active",
        colid: global1.colid,
        user: global1.user
      })));
    }
    setUserForm(blankUser);
    setSelectedPrograms([]);
    await loadAll();
    setActiveStep(2);
    return res;
  }, "CRM user saved and counselor mappings created where applicable.");

  const saveTelecallerSetup = () => setBusy(async () => {
    if (!clean(telecallerForm.name) || !clean(telecallerForm.email) || !clean(telecallerForm.phone)) throw new Error("Telecaller name, email and phone are required.");
    if (!telecallerPrograms.length) throw new Error("Select one or more programs for telecaller assignment.");
    if (!telecallerCounselor?.email) throw new Error("Select the counselor for this telecaller.");
    await ep1.post("/api/v2/crm-admin-dashboard/users", {
      ...telecallerForm,
      role: "telecaller",
      colid: global1.colid,
      user: global1.user
    });
    await Promise.all(telecallerPrograms.map((program) => ep1.post("/api/v2/crm-management/telecaller-mappings", {
      academicyear: academicYear,
      regulation: defaultRegulation,
      program: program.program || program.name || "",
      programcode: program.programcode || "",
      type: "Telecaller",
      telecallers: [{ name: telecallerForm.name, email: telecallerForm.email }],
      counselorname: telecallerCounselor.name,
      counseloremail: telecallerCounselor.email,
      counselor: telecallerCounselor,
      status: "Active",
      colid: global1.colid,
      user: global1.user
    })));
    setTelecallerForm({ ...blankUser, role: "telecaller", designation: "Telecaller" });
    setTelecallerPrograms([]);
    setTelecallerCounselor(null);
    await loadAll();
    setActiveStep(3);
  }, "Telecaller saved and linked to selected counselor/programs.");

  const saveCampusVisitSetup = () => setBusy(async () => {
    if (!clean(campusForm.name) || !clean(campusForm.email) || !clean(campusForm.phone)) throw new Error("Campus visit counselor name, email and phone are required.");
    if (!campusPrograms.length) throw new Error("Select one or more programs for campus visit counselor assignment.");
    await ep1.post("/api/v2/crm-admin-dashboard/users", {
      ...campusForm,
      role: "campusvisit",
      colid: global1.colid,
      user: global1.user
    });
    await Promise.all(campusPrograms.map((program) => ep1.post("/api/v2/crm-management/telecaller-mappings", {
      academicyear: academicYear,
      regulation: defaultRegulation,
      program: program.program || program.name || "",
      programcode: program.programcode || "",
      type: "Campus Visit Counselor",
      telecallers: [{ name: campusForm.name, email: campusForm.email }],
      status: "Active",
      colid: global1.colid,
      user: global1.user
    })));
    setCampusForm({ ...blankUser, role: "campusvisit", designation: "Campus Visit Counselor" });
    setCampusPrograms([]);
    await loadAll();
    setActiveStep(4);
  }, "Campus visit counselor saved and mapped to selected programs.");

  const selectedOrNamed = (selected, manual) => [...new Set([...selected, clean(manual)].filter(Boolean))];

  const saveSelectedSources = () => setBusy(async () => {
    const names = selectedOrNamed(sourceSelected, sourceForm.source_name);
    if (!names.length) throw new Error("Select or enter at least one source.");
    const existing = new Set(sources.map((row) => clean(row.source_name).toLowerCase()));
    await Promise.all(names.filter((name) => !existing.has(name.toLowerCase())).map((name) => ep1.post("/api/v2/crm-management/sources", {
      source_name: name,
      source_type: sourceForm.source_type || "Other",
      description: sourceForm.description || `${name} lead source`,
      is_active: sourceForm.is_active || "Yes",
      colid: global1.colid,
      created_by: global1.user
    })));
    setSourceForm({ source_name: "", source_type: "Other", description: "", is_active: "Yes" });
    setEditingSourceId("");
    await loadAll();
    setActiveStep(5);
  }, "Sources saved.");

  const saveSingleSource = () => setBusy(async () => {
    if (!clean(sourceForm.source_name)) throw new Error("Source name is required.");
    await ep1.post("/api/v2/crm-management/sources", {
      ...sourceForm,
      id: editingSourceId,
      colid: global1.colid,
      created_by: global1.user
    });
    setSourceForm({ source_name: "", source_type: "Other", description: "", is_active: "Yes" });
    setEditingSourceId("");
    await loadAll();
  }, editingSourceId ? "Source updated." : "Source added.");

  const saveSelectedStages = () => setBusy(async () => {
    const names = selectedOrNamed(stageSelected, stageForm.stagename);
    if (!names.length) throw new Error("Select or enter at least one pipeline stage.");
    const existing = new Set(stages.map((row) => clean(row.stagename || row.name).toLowerCase()));
    await Promise.all(names.filter((name) => !existing.has(name.toLowerCase())).map((name) => ep1.post("/api/v2/crm-management/stages", {
      name,
      stagename: name,
      description: stageForm.description || `${name} pipeline stage`,
      isactive: true,
      is_final_stage: /converted/i.test(name),
      colid: global1.colid,
      user: global1.user
    })));
    setStageForm({ stagename: "", description: "", isactive: true, is_final_stage: false });
    setEditingStageId("");
    await loadAll();
  }, "Pipeline stages saved.");

  const saveSingleStage = () => setBusy(async () => {
    if (!clean(stageForm.stagename)) throw new Error("Pipeline stage is required.");
    await ep1.post("/api/v2/crm-management/stages", {
      ...stageForm,
      id: editingStageId,
      name: stageForm.stagename,
      colid: global1.colid,
      user: global1.user
    });
    setStageForm({ stagename: "", description: "", isactive: true, is_final_stage: false });
    setEditingStageId("");
    await loadAll();
  }, editingStageId ? "Pipeline stage updated." : "Pipeline stage added.");

  const removeSource = (row) => setBusy(async () => {
    await ep1.post("/api/v2/crm-management/sources-delete", { id: row._id, colid: global1.colid });
    await loadAll();
  }, "Source deleted.");

  const removeStage = (row) => setBusy(async () => {
    await ep1.post("/api/v2/crm-management/stages-delete", { id: row._id, colid: global1.colid });
    await loadAll();
  }, "Pipeline stage deleted.");

  const sourceColumns = [
    {
      field: "actions",
      headerName: "Action",
      width: 110,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingSourceId(row._id); setSourceForm({ source_name: row.source_name || "", source_type: row.source_type || "Other", description: row.description || "", is_active: row.is_active || "Yes" }); }} />
          <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => removeSource(row)} />
        </Stack>
      )
    },
    { field: "source_name", headerName: "Source", minWidth: 190, flex: 1 },
    { field: "source_type", headerName: "Type", minWidth: 140 },
    { field: "description", headerName: "Description", minWidth: 250, flex: 1 },
    { field: "is_active", headerName: "Active", minWidth: 110 }
  ];

  const stageColumns = [
    {
      field: "actions",
      headerName: "Action",
      width: 110,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingStageId(row._id); setStageForm({ stagename: row.stagename || row.name || "", description: row.description || "", isactive: row.isactive !== false, is_final_stage: !!row.is_final_stage }); }} />
          <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => removeStage(row)} />
        </Stack>
      )
    },
    { field: "stagename", headerName: "Pipeline Stage", minWidth: 210, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 260, flex: 1 },
    { field: "isactive", headerName: "Active", minWidth: 110, valueGetter: ({ row }) => row.isactive === false ? "No" : "Yes" },
    { field: "is_final_stage", headerName: "Final", minWidth: 110, valueGetter: ({ row }) => row.is_final_stage ? "Yes" : "No" }
  ];

  const renderChoiceButtons = (items, selected, onChange, multi = false) => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((item) => {
        const isSelected = multi ? selected.includes(item) : selected === item;
        return (
          <Button
            key={item}
            variant={isSelected ? "contained" : "outlined"}
            onClick={() => {
              if (multi) onChange(isSelected ? selected.filter((value) => value !== item) : [...selected, item]);
              else onChange(item);
            }}
            sx={optionButtonSx(isSelected)}
          >
            {item}
          </Button>
        );
      })}
    </Stack>
  );

  const renderGrid = (rows, columns, height = 360) => (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={(rows || []).map((row) => ({ ...row, id: row._id }))}
        columns={columns}
        loading={loading}
        slots={{ toolbar: GridToolbar }}
        disableRowSelectionOnClick
        getRowHeight={() => "auto"}
        sx={{ "& .MuiDataGrid-cell": { py: 1, whiteSpace: "normal", overflowWrap: "anywhere" } }}
      />
    </Box>
  );

  return (
    <MenuPageShell title="CRM setup wizard">
      <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #dbeafe", borderRadius: 3, background: "linear-gradient(135deg,#eef6ff,#ffffff)" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={950}>CRM Setup Wizard</Typography>
                <Typography color="text.secondary">Create programs, CRM users with counselor mapping, lead sources and pipeline stages for admission CRM.</Typography>
              </Box>
              {loading && <CircularProgress size={28} />}
            </Stack>
          </Paper>

          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stepper nonLinear activeStep={activeStep} alternativeLabel>
              {["Program", "Counselor assignment", "Telecallers", "Campus visit counselors", "Source creation", "Pipeline stages"].map((label, index) => (
                <Step key={label}>
                  <StepButton onClick={() => setActiveStep(index)}>{label}</StepButton>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {activeStep === 0 && (
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={2.2}>
                <Typography variant="h6" fontWeight={950}>1. Create Program</Typography>
                <Box>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>Level</Typography>
                  {renderChoiceButtons(levelOptions, programForm.level, (value) => updateProgram("level", value))}
                </Box>
                <Box>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>Type</Typography>
                  {renderChoiceButtons(typeOptions, programForm.type, (value) => updateProgram("type", value))}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Program name" value={programForm.program} onChange={(e) => updateProgram("program", e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Program code" value={programForm.programcode} onChange={(e) => updateProgram("programcode", e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Intake capacity" value={programForm.intakecapacity} onChange={(e) => updateProgram("intakecapacity", e.target.value)} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Total credits" value={programForm.totalcredits} onChange={(e) => updateProgram("totalcredits", e.target.value)} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField select fullWidth label="Duration" value={programForm.durationinyear} onChange={(e) => updateProgram("durationinyear", e.target.value)}>{durationOptions(programForm.level).map((value) => <MenuItem key={value} value={value}>{value} years</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Order" value={programForm.Order} onChange={(e) => updateProgram("Order", e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Starting year" value={programForm.introductionyear} onChange={(e) => updateProgram("introductionyear", e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Last revision year" value={programForm.lastrevisionyear} onChange={(e) => updateProgram("lastrevisionyear", e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Discontinue year" value={programForm.discontinueyear} onChange={(e) => updateProgram("discontinueyear", e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Default regulation" value={defaultRegulation} InputProps={{ readOnly: true }} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Academic year" value={academicYear} InputProps={{ readOnly: true }} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} disabled={saving} sx={{ height: 56 }} onClick={saveProgram}>{saving ? "Saving..." : "Save program"}</Button></Grid>
                </Grid>
                {renderGrid(programRows, [
                  { field: "year", headerName: "Academic Year", width: 140 },
                  { field: "level", headerName: "Level", width: 110 },
                  { field: "type", headerName: "Type", width: 150 },
                  { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
                  { field: "programcode", headerName: "Program Code", width: 150 },
                  { field: "intakecapacity", headerName: "Intake", width: 110 },
                  { field: "durationinyear", headerName: "Duration", width: 120 },
                  { field: "totalcredits", headerName: "Credits", width: 110 },
                  { field: "Order", headerName: "Order", width: 100 }
                ])}
              </Stack>
            </Paper>
          )}

          {activeStep === 1 && (
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={950}>2. Add CRM User and Assign Programs</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2.5}><TextField fullWidth label="Email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value, googleemail: p.googleemail || e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Phone" value={userForm.phone} onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><Autocomplete options={roleOptions} value={roleOptions.find((r) => r.value === userForm.role) || null} onChange={(_, v) => setUserForm((p) => ({ ...p, role: v?.value || "counselor", designation: v?.label || p.designation }))} renderInput={(params) => <TextField {...params} label="Role" />} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Department" value={userForm.department} onChange={(e) => setUserForm((p) => ({ ...p, department: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Designation" value={userForm.designation} onChange={(e) => setUserForm((p) => ({ ...p, designation: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={programOptions}
                      value={selectedPrograms}
                      onChange={(_, v) => setSelectedPrograms(v)}
                      getOptionLabel={(option) => option.label || ""}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                          {option.label}
                        </li>
                      )}
                      renderInput={(params) => <TextField {...params} label="Programs for counselor mapping" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Regulation" value={defaultRegulation} InputProps={{ readOnly: true }} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={saving} sx={{ height: 56 }} onClick={saveCrmUserAndMappings}>{saving ? "Saving..." : "Save user & mapping"}</Button></Grid>
                </Grid>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedPrograms.map((program) => <Chip key={program._id} label={program.label} color="primary" variant="outlined" />)}
                </Stack>
                {renderGrid(crmUsers, [
                  { field: "name", headerName: "Name", minWidth: 170, flex: 1 },
                  { field: "email", headerName: "Email", minWidth: 220, flex: 1 },
                  { field: "phone", headerName: "Phone", width: 130 },
                  { field: "role", headerName: "Role", width: 130 },
                  { field: "department", headerName: "Department", width: 160 },
                  { field: "designation", headerName: "Designation", width: 170 }
                ], 300)}
                {renderGrid(mappings, [
                  { field: "academicyear", headerName: "Academic Year", width: 140 },
                  { field: "regulation", headerName: "Regulation", width: 130 },
                  { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
                  { field: "programcode", headerName: "Program Code", width: 150 },
                  { field: "counselorname", headerName: "Counselor", minWidth: 180, flex: 1 },
                  { field: "counseloremail", headerName: "Email", minWidth: 220, flex: 1 }
                ], 300)}
              </Stack>
            </Paper>
          )}

          {activeStep === 2 && (
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={950}>3. Add Telecallers and Link Counselor</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Name" value={telecallerForm.name} onChange={(e) => setTelecallerForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2.5}><TextField fullWidth label="Email" value={telecallerForm.email} onChange={(e) => setTelecallerForm((p) => ({ ...p, email: e.target.value, googleemail: p.googleemail || e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Phone" value={telecallerForm.phone} onChange={(e) => setTelecallerForm((p) => ({ ...p, phone: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Role" value="telecaller" InputProps={{ readOnly: true }} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Password" value={telecallerForm.password} onChange={(e) => setTelecallerForm((p) => ({ ...p, password: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Department" value={telecallerForm.department} onChange={(e) => setTelecallerForm((p) => ({ ...p, department: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Designation" value={telecallerForm.designation} onChange={(e) => setTelecallerForm((p) => ({ ...p, designation: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={counselorOptions}
                      value={telecallerCounselor}
                      onChange={(_, v) => setTelecallerCounselor(v)}
                      getOptionLabel={(option) => `${option.name || ""} - ${option.email || ""}`}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      renderInput={(params) => <TextField {...params} label="Counselor" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={programOptions}
                      value={telecallerPrograms}
                      onChange={(_, v) => setTelecallerPrograms(v)}
                      getOptionLabel={(option) => option.label || ""}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                          {option.label}
                        </li>
                      )}
                      renderInput={(params) => <TextField {...params} label="Programs for telecaller" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={saving} sx={{ height: 56 }} onClick={saveTelecallerSetup}>{saving ? "Saving..." : "Save telecaller"}</Button></Grid>
                </Grid>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {telecallerPrograms.map((program) => <Chip key={program._id} label={program.label} color="primary" variant="outlined" />)}
                  {telecallerCounselor?.email && <Chip label={`Counselor: ${telecallerCounselor.name || telecallerCounselor.email}`} color="success" variant="outlined" />}
                </Stack>
                {renderGrid(telecallerMappings.filter((row) => row.type === "Telecaller"), [
                  { field: "academicyear", headerName: "Academic Year", width: 140 },
                  { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
                  { field: "programcode", headerName: "Program Code", width: 150 },
                  { field: "telecallername", headerName: "Telecaller", minWidth: 180, flex: 1 },
                  { field: "telecalleremail", headerName: "Telecaller Email", minWidth: 220, flex: 1 },
                  { field: "counselorname", headerName: "Counselor", minWidth: 180, flex: 1 },
                  { field: "counseloremail", headerName: "Counselor Email", minWidth: 220, flex: 1 }
                ], 360)}
              </Stack>
            </Paper>
          )}

          {activeStep === 3 && (
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={950}>4. Add Campus Visit Counselors</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Name" value={campusForm.name} onChange={(e) => setCampusForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2.5}><TextField fullWidth label="Email" value={campusForm.email} onChange={(e) => setCampusForm((p) => ({ ...p, email: e.target.value, googleemail: p.googleemail || e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Phone" value={campusForm.phone} onChange={(e) => setCampusForm((p) => ({ ...p, phone: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Role" value="campusvisit" InputProps={{ readOnly: true }} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Password" value={campusForm.password} onChange={(e) => setCampusForm((p) => ({ ...p, password: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Department" value={campusForm.department} onChange={(e) => setCampusForm((p) => ({ ...p, department: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField fullWidth label="Designation" value={campusForm.designation} onChange={(e) => setCampusForm((p) => ({ ...p, designation: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={programOptions}
                      value={campusPrograms}
                      onChange={(_, v) => setCampusPrograms(v)}
                      getOptionLabel={(option) => option.label || ""}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                          {option.label}
                        </li>
                      )}
                      renderInput={(params) => <TextField {...params} label="Programs for campus visit counselor" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={saving} sx={{ height: 56 }} onClick={saveCampusVisitSetup}>{saving ? "Saving..." : "Save campus counselor"}</Button></Grid>
                </Grid>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {campusPrograms.map((program) => <Chip key={program._id} label={program.label} color="primary" variant="outlined" />)}
                </Stack>
                {renderGrid(telecallerMappings.filter((row) => row.type === "Campus Visit Counselor"), [
                  { field: "academicyear", headerName: "Academic Year", width: 140 },
                  { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
                  { field: "programcode", headerName: "Program Code", width: 150 },
                  { field: "telecallername", headerName: "Campus Counselor", minWidth: 200, flex: 1 },
                  { field: "telecalleremail", headerName: "Email", minWidth: 240, flex: 1 },
                  { field: "status", headerName: "Status", width: 120 }
                ], 360)}
              </Stack>
            </Paper>
          )}

          {activeStep === 4 && (
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={950}>5. Source Creation</Typography>
                {renderChoiceButtons(sourceDefaults, sourceSelected, setSourceSelected, true)}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2.4}><TextField fullWidth label="Manual source" value={sourceForm.source_name} onChange={(e) => setSourceForm((p) => ({ ...p, source_name: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField select fullWidth label="Source type" value={sourceForm.source_type} onChange={(e) => setSourceForm((p) => ({ ...p, source_type: e.target.value }))}>{["Organic", "Paid", "Referral", "Direct", "Social Media", "Other"].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Description" value={sourceForm.description} onChange={(e) => setSourceForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField select fullWidth label="Active" value={sourceForm.is_active} onChange={(e) => setSourceForm((p) => ({ ...p, is_active: e.target.value }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" disabled={saving} sx={{ height: 56 }} onClick={saveSelectedSources}>Save selected</Button></Grid>
                  <Grid item xs={12} md={1.5}><Button fullWidth variant="outlined" disabled={saving} sx={{ height: 56 }} onClick={saveSingleSource}>{editingSourceId ? "Update" : "Add/Edit"}</Button></Grid>
                </Grid>
                {renderGrid(sources, sourceColumns)}
              </Stack>
            </Paper>
          )}

          {activeStep === 5 && (
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={950}>6. Pipeline Stages</Typography>
                {renderChoiceButtons(stageDefaults, stageSelected, setStageSelected, true)}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2.5}><TextField fullWidth label="Manual stage" value={stageForm.stagename} onChange={(e) => setStageForm((p) => ({ ...p, stagename: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Description" value={stageForm.description} onChange={(e) => setStageForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={1.5}><TextField select fullWidth label="Active" value={stageForm.isactive ? "Yes" : "No"} onChange={(e) => setStageForm((p) => ({ ...p, isactive: e.target.value === "Yes" }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={1.5}><TextField select fullWidth label="Final stage" value={stageForm.is_final_stage ? "Yes" : "No"} onChange={(e) => setStageForm((p) => ({ ...p, is_final_stage: e.target.value === "Yes" }))}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" disabled={saving} sx={{ height: 56 }} onClick={saveSelectedStages}>Save selected</Button></Grid>
                  <Grid item xs={12} md={1.5}><Button fullWidth variant="outlined" disabled={saving} sx={{ height: 56 }} onClick={saveSingleStage}>{editingStageId ? "Update" : "Add/Edit"}</Button></Grid>
                </Grid>
                {renderGrid(stages, stageColumns)}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
