import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Switch,
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

const initialFilters = {
  academicyear: "",
  program: "",
  programcode: "",
  semester: ""
};

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
  if (status === 404) {
    return "Backend route is not available on the selected server. Please use localhost backend or deploy the latest backend changes to epmain.";
  }
  if (responseMessage) return responseMessage;
  if (responseText.includes("Cannot GET") || responseText.includes("Cannot POST")) {
    return "Backend route is not available on the selected server. Please use localhost backend or deploy the latest backend changes to epmain.";
  }
  return fallback;
}

function RegnoRepairPage({ direction, matchBy = "name" }) {
  const isUserToLedger = direction === "user-to-ledger";
  const emailMode = matchBy === "email";
  const title = isUserToLedger
    ? emailMode ? "User to ledger regno email" : "User to ledger regno"
    : emailMode ? "Ledger to User regno email" : "Ledger to User regno";
  const description = emailMode
    ? isUserToLedger
      ? "Load Student users for the selected academic year, program, program code and semester. Compare ledger regno by matching email only, then update the ledger from User."
      : "Load ledger students for the selected academic year, program, program code and semester. Compare User regno by matching email only, then update User from ledger."
    : isUserToLedger
    ? "Load Student users for the selected academic year, program, program code and semester. Compare ledger regno by matching academic year, program code, semester and student name, then update the ledger from User."
    : "Load ledger students for the selected academic year, program, program code and semester. Compare User regno by matching academic year, program code, semester and student name, then update User from ledger.";

  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState(initialFilters);
  const [mismatchOnly, setMismatchOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const routeBase = isUserToLedger
    ? emailMode ? "user-to-ledger-regno-email" : "user-to-ledger-regno"
    : emailMode ? "ledger-to-user-regno-email" : "ledger-to-user-regno";
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
      let res;
      try {
        res = await ep1.get("/api/v2/repair-maintenance/regno-compare-options", {
          params: { colid: global1.colid, password }
        });
      } catch (primaryErr) {
        if (primaryErr?.response?.status !== 404) throw primaryErr;
        res = await ep1.get("/api/v2/repair-maintenance/match-regno-options", {
          params: { colid: global1.colid, password }
        });
      }
      setOptions(res.data?.options || {});
      setUnlocked(true);
      setMessage("Page unlocked. Select the mandatory filters and click Load.");
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
      const res = await ep1.post(`/api/v2/repair-maintenance/${routeBase}/list`, {
        ...filters,
        colid: global1.colid,
        password,
        mismatchOnly
      });
      setProgress(80);
      setRows(res.data?.data || []);
      setSelected([]);
      setMessage(`Loaded ${res.data?.count || 0} row(s).`);
      setProgress(100);
    } catch (err) {
      setError(apiError(err, "Unable to load regno comparison"));
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const updateSelected = async () => {
    if (!selected.length) {
      setError("Select at least one row to update.");
      return;
    }
    const source = isUserToLedger ? "User" : "student ledger";
    const target = isUserToLedger ? "student ledger" : "User";
    if (!window.confirm(`Populate regno from ${source} to ${target} for ${selected.length} selected row(s)?`)) return;
    try {
      setLoading(true);
      setError("");
      setProgress(25);
      const payload = {
        ...filters,
        colid: global1.colid,
        password,
        ...(isUserToLedger ? { ids: selected } : { keys: selected })
      };
      const res = await ep1.post(`/api/v2/repair-maintenance/${routeBase}/update`, payload);
      setProgress(85);
      setMessage(`Updated ${res.data?.updated || 0}; skipped ${res.data?.skipped || 0}.`);
      await loadRows();
    } catch (err) {
      setError(apiError(err, "Unable to update regno"));
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
    setFilters((prev) => ({
      ...prev,
      program,
      programcode: matchingCodes[0] || ""
    }));
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
    { field: "userRegno", headerName: "User Regno", minWidth: 150 },
    { field: "ledgerRegno", headerName: "Ledger Regno", minWidth: 170 },
    { field: "ledgerRows", headerName: "Ledger Rows", minWidth: 110, type: "number" },
    { field: "matching", headerName: "Matching", minWidth: 110 },
    { field: "canUpdate", headerName: "Can Update", minWidth: 120 }
  ];

  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>{title}</Typography>
            <Typography color="text.secondary">{description}</Typography>
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
                  <Grid item xs={12} md={3}>
                    <Autocomplete {...oneValueAutocompleteProps(options.academicyear, filters.academicyear, (value) => setFilter("academicyear", value), "Academic Year")} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete {...oneValueAutocompleteProps(options.program, filters.program, setProgram, "Program")} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      {...oneValueAutocompleteProps(
                        filteredProgramCodes,
                        filters.programcode,
                        (value) => setFilter("programcode", value),
                        "Program Code",
                        true,
                        { disabled: !filters.program }
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete {...oneValueAutocompleteProps(options.semester, filters.semester, (value) => setFilter("semester", value), "Semester")} />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={mismatchOnly} onChange={(e) => setMismatchOnly(e.target.checked)} />}
                    label="Show not matching only"
                  />
                  <Button variant="contained" startIcon={<RefreshIcon />} disabled={loading || !requiredOk} onClick={loadRows}>Load</Button>
                  <Button variant="contained" color="success" startIcon={<SyncIcon />} disabled={loading || !selected.length} onClick={updateSelected}>
                    {isUserToLedger ? "Populate User regno to ledger" : "Populate ledger regno to User"}
                  </Button>
                </Stack>
              </Paper>

              <Grid container spacing={1.5}>
                {[
                  ["Total", totals.total],
                  ["Matching", totals.matching],
                  ["Not matching", totals.mismatch],
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

export function UserToLedgerRegnoPage() {
  return <RegnoRepairPage direction="user-to-ledger" />;
}

export function LedgerToUserRegnoPage() {
  return <RegnoRepairPage direction="ledger-to-user" />;
}

export function UserToLedgerRegnoEmailPage() {
  return <RegnoRepairPage direction="user-to-ledger" matchBy="email" />;
}

export function LedgerToUserRegnoEmailPage() {
  return <RegnoRepairPage direction="ledger-to-user" matchBy="email" />;
}
