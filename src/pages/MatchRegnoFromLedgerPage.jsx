import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
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

const emptyFilter = { field: "", value: [] };
const label = (field) => String(field || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (item) => item.toUpperCase());
const selectedIds = (selection) => Array.from(selection?.ids || selection || []);

export default function MatchRegnoFromLedgerPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [fields, setFields] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ ...emptyFilter }]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fieldOptions = useMemo(() => fields.map((field) => ({ field, label: label(field) })), [fields]);

  const unlock = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/repair-maintenance/match-regno-options", {
        params: { colid: global1.colid, password }
      });
      setFields(res.data?.fields || []);
      setOptions(res.data?.options || {});
      setUnlocked(true);
      setMessage("Page unlocked. Select filters and click Load ledger rows.");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid password or unable to unlock page");
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      setProgress(20);
      setError("");
      setMessage("");
      const activeFilters = filters.filter((row) => row.field && row.value?.length);
      const res = await ep1.post("/api/v2/repair-maintenance/match-regno-list", {
        colid: global1.colid,
        password,
        filters: activeFilters
      });
      setProgress(80);
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setSelected([]);
      setMessage(`Loaded ${res.data?.count || 0} ledger row(s).`);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load ledger matches");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const updateSelected = async () => {
    if (!selected.length) {
      setError("Select at least one ledger row to update.");
      return;
    }
    if (!window.confirm(`Update regno for ${selected.length} selected ledger row(s) from matching Student user records?`)) return;
    try {
      setLoading(true);
      setProgress(25);
      setError("");
      const res = await ep1.post("/api/v2/repair-maintenance/match-regno-update", {
        colid: global1.colid,
        password,
        ids: selected
      });
      setProgress(85);
      setMessage(`Updated ${res.data?.updated || 0} row(s), skipped ${res.data?.skipped || 0}.`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update ledger regno");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, ...patch, ...(patch.field !== undefined ? { value: [] } : {}) } : row
    )));
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
    { field: "regulation", headerName: "Regulation", minWidth: 120 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "student", headerName: "Ledger Student", minWidth: 180, flex: 1 },
    { field: "name", headerName: "Ledger Name", minWidth: 180, flex: 1 },
    { field: "currentLedgerRegno", headerName: "Current Ledger Regno", minWidth: 170 },
    { field: "matched", headerName: "Matched", width: 110 },
    { field: "matchedUserName", headerName: "User Name", minWidth: 180, flex: 1 },
    { field: "matchedUserEmail", headerName: "User Email", minWidth: 210, flex: 1 },
    { field: "matchedUserRegno", headerName: "User Regno", minWidth: 150 },
    { field: "willUpdate", headerName: "Will Update", width: 130 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 170 },
    { field: "balance", headerName: "Balance", minWidth: 110, type: "number" }
  ];

  return (
    <MenuPageShell title="Match regno from ledger">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Match regno from ledger</Typography>
            <Typography color="text.secondary">
              Select ledger rows, match Student users by academic year, regulation, program code and student name, then update ledger regno from the User model.
            </Typography>
          </Paper>

          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress variant={progress ? "determinate" : "indeterminate"} value={progress} />}

          {!unlocked ? (
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, maxWidth: 520 }}>
              <Stack spacing={2}>
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="contained" startIcon={<LockIcon />} disabled={loading || !password} onClick={unlock}>
                  {loading ? "Checking..." : "Unlock"}
                </Button>
              </Stack>
            </Paper>
          ) : (
            <>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Dynamic filters</Typography>
                <Stack spacing={1.2}>
                  {filters.map((filter, index) => (
                    <Grid container spacing={1} key={index}>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          size="small"
                          options={fieldOptions}
                          getOptionLabel={(option) => option?.label || ""}
                          value={fieldOptions.find((item) => item.field === filter.field) || null}
                          onChange={(_, value) => updateFilter(index, { field: value?.field || "" })}
                          renderInput={(params) => <TextField {...params} label="Filter field" />}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          size="small"
                          multiple
                          disableCloseOnSelect
                          options={options[filter.field] || []}
                          value={filter.value || []}
                          onChange={(_, value) => updateFilter(index, { value })}
                          renderOption={(props, option, { selected }) => (
                            <li {...props}><Checkbox size="small" checked={selected} />{option}</li>
                          )}
                          renderInput={(params) => <TextField {...params} label="Value" />}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.length === 1 ? [{ ...emptyFilter }] : prev.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={() => setFilters((prev) => [...prev, { ...emptyFilter }])}>Add filter</Button>
                  <Button variant="contained" startIcon={<RefreshIcon />} disabled={loading} onClick={loadRows}>Load ledger rows</Button>
                  <Button variant="contained" color="success" startIcon={<SyncIcon />} disabled={loading || !selected.length} onClick={updateSelected}>Update selected regno</Button>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ height: 650, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={(model) => setSelected(selectedIds(model))}
                  slots={{ toolbar: GridToolbar }}
                  getRowClassName={(params) => params.row.willUpdate === "Yes" ? "match-update-row" : ""}
                  sx={{
                    "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 },
                    "& .match-update-row": { bgcolor: "#ecfdf5" }
                  }}
                />
              </Paper>
            </>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
