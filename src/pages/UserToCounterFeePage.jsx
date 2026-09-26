import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const selectedIds = (selection) => Array.from(selection?.ids || selection || []);
const initialFilters = { academicyear: "", program: "", programcode: "", semester: "" };

function oneValueAutocompleteProps(options, value, onChange, label, required = true, extra = {}) {
  return {
    size: "small",
    freeSolo: true,
    options: options || [],
    value: value || null,
    onChange: (_, newValue) => onChange(newValue || ""),
    onInputChange: (_, newValue) => onChange(newValue || ""),
    renderInput: (params) => <TextField {...params} label={label} required={required} />,
    ...extra
  };
}

function apiError(err, fallback) {
  const status = err?.response?.status;
  const responseMessage = err?.response?.data?.message;
  const responseText = typeof err?.response?.data === "string" ? err.response.data : "";
  if (status === 404 || responseText.includes("Cannot GET") || responseText.includes("Cannot POST")) {
    return "Backend route is not available on the selected server. Please use localhost backend or deploy the latest backend changes to epmain.";
  }
  return responseMessage || fallback;
}

export default function UserToCounterFeePage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState(initialFilters);
  const [matchMode, setMatchMode] = useState("all");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const requiredOk = filters.academicyear && filters.program && filters.programcode && filters.semester;

  const totals = useMemo(() => rows.reduce((sum, row) => ({
    total: sum.total + 1,
    matching: sum.matching + (row.matching === "Yes" ? 1 : 0),
    mismatch: sum.mismatch + (row.matching !== "Yes" ? 1 : 0),
    canUpdate: sum.canUpdate + (row.canUpdate === "Yes" ? 1 : 0)
  }), { total: 0, matching: 0, mismatch: 0, canUpdate: 0 }), [rows]);

  const unlock = async () => {
    try {
      setLoading(true);
      setError("");
      setProgress(25);
      const res = await ep1.get("/api/v2/repair-maintenance/user-to-counter-fee/options", {
        params: { colid: global1.colid, password }
      });
      setOptions(res.data?.options || {});
      setUnlocked(true);
      setMessage("Page unlocked. Select filters and click Load.");
      setProgress(100);
    } catch (err) {
      setError(apiError(err, "Invalid password or unable to unlock page"));
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const loadRows = async () => {
    if (!requiredOk) {
      setError("Academic year, program, program code and semester are required.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setProgress(20);
      const res = await ep1.post("/api/v2/repair-maintenance/user-to-counter-fee/list", {
        ...filters,
        colid: global1.colid,
        password,
        matchMode
      });
      setProgress(80);
      setRows(res.data?.data || []);
      setSelected([]);
      setMessage(`Loaded ${res.data?.count || 0} row(s).`);
      setProgress(100);
    } catch (err) {
      setError(apiError(err, "Unable to load counter fee regno comparison"));
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const updateSelected = async () => {
    if (!selected.length) {
      setError("Select at least one student.");
      return;
    }
    if (!window.confirm(`Update counter fee regno from User model for ${selected.length} selected student(s)?`)) return;
    try {
      setLoading(true);
      setError("");
      setProgress(25);
      const res = await ep1.post("/api/v2/repair-maintenance/user-to-counter-fee/update", {
        ...filters,
        colid: global1.colid,
        password,
        ids: selected
      });
      setProgress(85);
      setMessage(`Updated ${res.data?.updated || 0}; skipped ${res.data?.skipped || 0}.`);
      await loadRows();
    } catch (err) {
      setError(apiError(err, "Unable to update counter fee regno"));
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const setFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value || "" }));
    setRows([]);
    setSelected([]);
  };

  const setProgram = (value) => {
    const program = value || "";
    const pairs = Array.isArray(options.programPairs) ? options.programPairs : [];
    const matchingCodes = [...new Set(pairs
      .filter((row) => String(row.program || "").trim().toLowerCase() === String(program).trim().toLowerCase())
      .map((row) => row.programcode)
      .filter(Boolean))];
    setFilters((prev) => ({ ...prev, program, programcode: matchingCodes[0] || "" }));
    setRows([]);
    setSelected([]);
  };

  const filteredProgramCodes = useMemo(() => {
    const pairs = Array.isArray(options.programPairs) ? options.programPairs : [];
    const codes = pairs
      .filter((row) => String(row.program || "").trim().toLowerCase() === String(filters.program || "").trim().toLowerCase())
      .map((row) => row.programcode)
      .filter(Boolean);
    return codes.length ? [...new Set(codes)] : (options.programcode || []);
  }, [filters.program, options.programPairs, options.programcode]);

  const columns = [
    { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
    { field: "program", headerName: "Program", minWidth: 170, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    { field: "section", headerName: "Section", minWidth: 100 },
    { field: "studentname", headerName: "Student Name", minWidth: 210, flex: 1 },
    { field: "useremail", headerName: "User Email", minWidth: 220, flex: 1 },
    { field: "rollno", headerName: "Roll No", minWidth: 110 },
    { field: "userRegno", headerName: "User Regno", minWidth: 150 },
    { field: "counterFeeRegno", headerName: "Counter Fee Regno", minWidth: 190 },
    { field: "transactionCount", headerName: "Transactions", minWidth: 120, type: "number" },
    { field: "itemCount", headerName: "Fee Items", minWidth: 100, type: "number" },
    { field: "matching", headerName: "Matching", minWidth: 110 },
    { field: "canUpdate", headerName: "Can Update", minWidth: 120 },
    { field: "transactionIds", headerName: "Transaction IDs", minWidth: 260, flex: 1 }
  ];

  return (
    <MenuPageShell title="User to counter fee">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>User to counter fee</Typography>
            <Typography color="text.secondary">
              Compare User regno with counter fee payment receipt regno, then populate counter fee transaction and fee item regno from User.
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
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} md={2.4}>
                    <Autocomplete {...oneValueAutocompleteProps(options.academicyear, filters.academicyear, (value) => setFilter("academicyear", value), "Academic Year")} />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Autocomplete {...oneValueAutocompleteProps(options.program, filters.program, setProgram, "Program")} />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Autocomplete
                      {...oneValueAutocompleteProps(filteredProgramCodes, filters.programcode, (value) => setFilter("programcode", value), "Program Code", true, { disabled: !filters.program })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Autocomplete {...oneValueAutocompleteProps(options.semester, filters.semester, (value) => setFilter("semester", value), "Semester")} />
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <TextField fullWidth select size="small" label="Filter" value={matchMode} onChange={(e) => { setMatchMode(e.target.value); setRows([]); setSelected([]); }}>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="mismatch">Mismatch</MenuItem>
                      <MenuItem value="match">Match</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <Button variant="contained" startIcon={<RefreshIcon />} disabled={loading || !requiredOk} onClick={loadRows}>Load</Button>
                  <Button variant="contained" color="success" startIcon={<SyncIcon />} disabled={loading || !selected.length} onClick={updateSelected}>
                    Populate User regno to counter fee
                  </Button>
                </Stack>
              </Paper>

              <Grid container spacing={1.5}>
                {[
                  ["Total", totals.total],
                  ["Matching", totals.matching],
                  ["Mismatch", totals.mismatch],
                  ["Can update", totals.canUpdate]
                ].map(([name, value]) => (
                  <Grid item xs={6} md={3} key={name}>
                    <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #dbeafe", borderRadius: 2 }}>
                      <Typography color="text.secondary">{name}</Typography>
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
                  getRowClassName={(params) => params.row.matching === "Yes" ? "regno-match-row" : "regno-mismatch-row"}
                  sx={{
                    "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 },
                    "& .regno-match-row": { bgcolor: "#ecfdf5" },
                    "& .regno-mismatch-row": { bgcolor: "#fff7ed" }
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
