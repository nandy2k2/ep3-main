import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const scopeOptions = [
  { key: "programMaster", label: "Program master" },
  { key: "student", label: "User / student by role" },
  { key: "regulationMaster", label: "Regulation master" },
  { key: "assessmentComponent", label: "Assessment component" }
];

const blankForm = {
  oldprogram: "",
  oldprogramcode: "",
  newprogram: "",
  newprogramcode: ""
};

export default function ProgramChangeRepairPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(true);
  const [roles, setRoles] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [scopes, setScopes] = useState(["programMaster"]);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const oldProgramValue = useMemo(() => programs.find((row) => row.program === form.oldprogram && row.programcode === form.oldprogramcode) || null, [programs, form.oldprogram, form.oldprogramcode]);
  const newProgramValue = useMemo(() => programs.find((row) => row.program === form.newprogram && row.programcode === form.newprogramcode) || null, [programs, form.newprogram, form.newprogramcode]);

  const unlock = async () => {
    setLoading(true);
    setProgress(20);
    setError("");
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/repair-maintenance/program-change/options", {
        params: { colid: global1.colid, password }
      });
      setRoles(res.data?.roles || []);
      setPrograms(res.data?.programs || []);
      setUnlocked(true);
      setMessage("Enter old and new program details, select update options, then apply.");
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid password or unable to unlock page");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  useEffect(() => {
    unlock().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleScope = (key, checked) => {
    setScopes((prev) => checked ? Array.from(new Set([...prev, key])) : prev.filter((item) => item !== key));
  };

  const applyChange = async () => {
    setError("");
    setMessage("");
    setSummary(null);
    setResults([]);
    if (!form.oldprogram || !form.oldprogramcode || !form.newprogram || !form.newprogramcode) {
      setError("Old program, old program code, new program and new program code are required.");
      return;
    }
    if (!scopes.length) {
      setError("Select at least one update option.");
      return;
    }
    if (scopes.includes("student") && !selectedRoles.length) {
      setError("Select at least one role for User / student update.");
      return;
    }
    const confirmed = window.confirm(`Change exact matches from ${form.oldprogram} (${form.oldprogramcode}) to ${form.newprogram} (${form.newprogramcode})?`);
    if (!confirmed) return;
    setLoading(true);
    setProgress(10);
    try {
      const timer = setInterval(() => setProgress((prev) => (prev >= 90 ? prev : prev + 12)), 300);
      const res = await ep1.post("/api/v2/repair-maintenance/program-change/apply", {
        colid: global1.colid,
        password,
        ...form,
        scopes,
        roles: selectedRoles
      });
      clearInterval(timer);
      setProgress(100);
      setSummary(res.data || {});
      setResults(res.data?.results || []);
      setMessage(`Program change completed. Matched ${res.data?.totalMatched || 0}, modified ${res.data?.totalModified || 0}.`);
    } catch (err) {
      setProgress(100);
      setError(err.response?.data?.message || "Unable to apply program change");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 900);
    }
  };

  const resultColumns = [
    { field: "scope", headerName: "Scope", flex: 1, minWidth: 180 },
    { field: "matched", headerName: "Matched", width: 120 },
    { field: "modified", headerName: "Modified", width: 120 },
    { field: "roles", headerName: "Roles", flex: 1, minWidth: 180, valueGetter: (params) => Array.isArray(params.row?.roles) ? params.row.roles.join(", ") : "" },
    { field: "details", headerName: "Details", flex: 1.4, minWidth: 260, valueGetter: (params) => Array.isArray(params.row?.details) ? params.row.details.map((item) => `${item.collection}: ${item.modified}/${item.matched}`).join("; ") : "" }
  ];

  if (!unlocked) {
    return (
      <MenuPageShell title="Program change">
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
          <Paper elevation={0} sx={{ p: 3, maxWidth: 520, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={950}>Program change</Typography>
              <Alert severity="info">This repair page updates program and program code in selected master tables. Enter password to continue.</Alert>
              {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
              {progress > 0 && <LinearProgress variant="determinate" value={progress} />}
              <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") unlock(); }} />
              <Button variant="contained" disabled={loading} onClick={unlock}>{loading ? "Unlocking..." : "Unlock"}</Button>
            </Stack>
          </Paper>
        </Box>
      </MenuPageShell>
    );
  }

  return (
    <MenuPageShell title="Program change">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Program change</Typography>
            <Typography color="text.secondary">
              Exact-match repair for program name and program code. Updates are scoped by college id and selected options only.
            </Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {progress > 0 && <LinearProgress variant="determinate" value={progress} />}

          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={programs}
                    value={oldProgramValue}
                    getOptionLabel={(option) => typeof option === "string" ? option : `${option.program || ""} (${option.programcode || ""})`}
                    onChange={(event, value) => {
                      if (value && typeof value === "object") setForm((prev) => ({ ...prev, oldprogram: value.program || "", oldprogramcode: value.programcode || "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="Search old program" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="Old program" value={form.oldprogram} onChange={(e) => update("oldprogram", e.target.value)} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="Old program code" value={form.oldprogramcode} onChange={(e) => update("oldprogramcode", e.target.value)} /></Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={programs}
                    value={newProgramValue}
                    getOptionLabel={(option) => typeof option === "string" ? option : `${option.program || ""} (${option.programcode || ""})`}
                    onChange={(event, value) => {
                      if (value && typeof value === "object") setForm((prev) => ({ ...prev, newprogram: value.program || "", newprogramcode: value.programcode || "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="Search new program" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="New program" value={form.newprogram} onChange={(e) => update("newprogram", e.target.value)} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="New program code" value={form.newprogramcode} onChange={(e) => update("newprogramcode", e.target.value)} /></Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    {scopeOptions.map((item) => (
                      <FormControlLabel
                        key={item.key}
                        control={<Checkbox checked={scopes.includes(item.key)} onChange={(e) => toggleScope(item.key, e.target.checked)} />}
                        label={item.label}
                      />
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={roles}
                    value={selectedRoles}
                    onChange={(event, value) => setSelectedRoles(value)}
                    renderTags={(value, getTagProps) => value.map((option, index) => <Chip label={option} {...getTagProps({ index })} />)}
                    renderInput={(params) => <TextField {...params} label="Roles for User update" helperText="Required only when User / student by role is selected." />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1.2} sx={{ height: "100%", alignItems: "center" }}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={unlock}>Reload options</Button>
                    <Button variant="contained" color="warning" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />} disabled={loading} onClick={applyChange}>
                      Apply program change
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {summary && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip color="primary" label={`Total matched: ${summary.totalMatched || 0}`} />
              <Chip color="success" label={`Total modified: ${summary.totalModified || 0}`} />
              <Chip label={`${summary.oldprogram || ""} (${summary.oldprogramcode || ""}) -> ${summary.newprogram || ""} (${summary.newprogramcode || ""})`} />
            </Stack>
          )}

          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>Result</Typography>
              <Box sx={{ height: 360, width: "100%" }}>
                <DataGrid
                  rows={results.map((row, index) => ({ id: index + 1, ...row }))}
                  columns={resultColumns}
                  components={{ Toolbar: GridToolbar }}
                  disableRowSelectionOnClick
                />
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
