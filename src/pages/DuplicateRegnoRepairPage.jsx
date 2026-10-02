import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import LockIcon from "@mui/icons-material/Lock";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const selectedIds = (selection) => Array.from(selection?.ids || selection || []);
const blankFilters = { academicyear: "", program: "", programcode: "", semester: "" };

function autoProps(options, value, onChange, label) {
  return {
    size: "small",
    freeSolo: true,
    options: options || [],
    value: value || null,
    onChange: (_, newValue) => onChange(newValue || ""),
    onInputChange: (_, newValue) => onChange(newValue || ""),
    renderInput: (params) => <TextField {...params} label={label} />
  };
}

export default function DuplicateRegnoRepairPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState(blankFilters);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const regnos = new Set(rows.map((row) => String(row.regno || "").toLowerCase()).filter(Boolean));
    return { students: rows.length, regnos: regnos.size, selected: selected.length };
  }, [rows, selected]);

  const unlock = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/repair-maintenance/duplicate-regno/options", {
        params: { colid: global1.colid, password }
      });
      setOptions(res.data?.options || {});
      setUnlocked(true);
      setMessage("Page unlocked. Add optional filters and click Load duplicate regno.");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid password or unable to unlock page");
    } finally {
      setLoading(false);
    }
  };

  const setFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value || "" }));
    setRows([]);
    setSelected([]);
  };

  const loadRows = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/repair-maintenance/duplicate-regno/list", {
        ...filters,
        colid: global1.colid,
        password
      });
      setRows(res.data?.data || []);
      setSelected([]);
      setMessage(`Loaded ${res.data?.count || 0} duplicate regno student row(s).`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load duplicate regno");
    } finally {
      setLoading(false);
    }
  };

  const fixSelected = async () => {
    if (!selected.length) {
      setError("Select at least one student.");
      return;
    }
    if (!window.confirm(`Change regno for ${selected.length} selected student(s) to unique generated regno?`)) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/repair-maintenance/duplicate-regno/fix", {
        colid: global1.colid,
        password,
        ids: selected
      });
      setMessage(`Updated ${res.data?.updated || 0}; skipped ${res.data?.skipped || 0}.`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fix duplicate regno");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", minWidth: 140 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    { field: "student", headerName: "Student", minWidth: 220, flex: 1 },
    { field: "regno", headerName: "Duplicate Regno", minWidth: 170 },
    { field: "email", headerName: "Email", minWidth: 220, flex: 1 },
    { field: "password", headerName: "Password", minWidth: 160 },
    { field: "duplicatecount", headerName: "Duplicate Count", minWidth: 140, type: "number" }
  ];

  return (
    <MenuPageShell title="Duplicate regno">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Duplicate regno</Typography>
            <Typography color="text.secondary">Find Student users with duplicate regno in the same college, then generate unique regno for selected students.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}

          {!unlocked ? (
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, maxWidth: 520 }}>
              <Stack spacing={2}>
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="contained" startIcon={<LockIcon />} disabled={loading || !password} onClick={unlock}>Unlock</Button>
              </Stack>
            </Paper>
          ) : (
            <>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={3}><Autocomplete {...autoProps(options.academicyear, filters.academicyear, (value) => setFilter("academicyear", value), "Academic Year")} /></Grid>
                  <Grid item xs={12} md={3}><Autocomplete {...autoProps(options.program, filters.program, (value) => setFilter("program", value), "Program")} /></Grid>
                  <Grid item xs={12} md={3}><Autocomplete {...autoProps(options.programcode, filters.programcode, (value) => setFilter("programcode", value), "Program Code")} /></Grid>
                  <Grid item xs={12} md={3}><Autocomplete {...autoProps(options.semester, filters.semester, (value) => setFilter("semester", value), "Semester")} /></Grid>
                </Grid>
                <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <Button variant="contained" startIcon={<RefreshIcon />} disabled={loading} onClick={loadRows}>Load duplicate regno</Button>
                  <Button variant="contained" color="success" startIcon={<SyncIcon />} disabled={loading || !selected.length} onClick={fixSelected}>Generate unique regno</Button>
                </Stack>
              </Paper>

              <Grid container spacing={1.5}>
                {[["Duplicate student rows", summary.students], ["Duplicate regno values", summary.regnos], ["Selected", summary.selected]].map(([label, value]) => (
                  <Grid item xs={12} md={4} key={label}>
                    <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #dbeafe", borderRadius: 2 }}>
                      <Typography color="text.secondary">{label}</Typography>
                      <Typography variant="h5" fontWeight={950}>{value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper elevation={0} sx={{ height: 650, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={(model) => setSelected(selectedIds(model))}
                  slots={{ toolbar: GridToolbar }}
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 } }}
                />
              </Paper>
            </>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
