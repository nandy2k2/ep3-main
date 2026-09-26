import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const emptyFilters = { academicyear: "", programcode: "", semester: "" };

const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function optionProps(options, value, onChange, label, required = false) {
  return {
    size: "small",
    freeSolo: true,
    options: options || [],
    value: value || null,
    onChange: (_, next) => onChange(next || ""),
    onInputChange: (_, next) => onChange(next || ""),
    renderInput: (params) => <TextField {...params} label={label} required={required} />
  };
}

export default function DuplicateFeesRepairPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState(emptyFilters);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const localSummary = useMemo(() => rows.reduce((sum, row) => ({
    studentsSet: sum.studentsSet.add(String(row.regno || "").toLowerCase()),
    duplicategroups: sum.duplicategroups + 1,
    duplicateledgerrows: sum.duplicateledgerrows + Number(row.duplicatecount || 0),
    totalamount: sum.totalamount + Number(row.totalamount || 0),
    totalpaid: sum.totalpaid + Number(row.totalpaid || 0),
    totalbalance: sum.totalbalance + Number(row.totalbalance || 0)
  }), { studentsSet: new Set(), duplicategroups: 0, duplicateledgerrows: 0, totalamount: 0, totalpaid: 0, totalbalance: 0 }), [rows]);

  const displaySummary = {
    students: summary.students ?? localSummary.studentsSet.size,
    duplicategroups: summary.duplicategroups ?? localSummary.duplicategroups,
    duplicateledgerrows: summary.duplicateledgerrows ?? localSummary.duplicateledgerrows,
    totalamount: summary.totalamount ?? localSummary.totalamount,
    totalpaid: summary.totalpaid ?? localSummary.totalpaid,
    totalbalance: summary.totalbalance ?? localSummary.totalbalance
  };

  const setFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value || "" }));
    setRows([]);
    setSummary({});
  };

  const unlock = async () => {
    try {
      setLoading(true);
      setProgress(30);
      setError("");
      const res = await ep1.get("/api/v2/repair-maintenance/duplicate-fees/options", {
        params: { colid: global1.colid, password }
      });
      setOptions(res.data?.options || {});
      setUnlocked(true);
      setMessage("Page unlocked. Select academic year and click Load duplicate fees.");
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid password or unable to unlock page");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const loadRows = async () => {
    if (!filters.academicyear) {
      setError("Academic year is required.");
      return;
    }
    try {
      setLoading(true);
      setProgress(20);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/repair-maintenance/duplicate-fees/list", {
        ...filters,
        colid: global1.colid,
        password
      });
      setProgress(80);
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || {});
      setMessage(`Loaded ${res.data?.count || 0} duplicate fee group(s).`);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load duplicate fees");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
    { field: "regulation", headerName: "Regulation", minWidth: 130 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 105 },
    { field: "section", headerName: "Section", minWidth: 90 },
    { field: "student", headerName: "Student", minWidth: 210, flex: 1 },
    { field: "regno", headerName: "Regno", minWidth: 150 },
    { field: "rollno", headerName: "Roll No", minWidth: 110 },
    { field: "email", headerName: "Email/User", minWidth: 220, flex: 1 },
    { field: "feegroup", headerName: "Fee Group", minWidth: 160 },
    { field: "feecategory", headerName: "Fee Category", minWidth: 160 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 210, flex: 1 },
    { field: "duplicatecount", headerName: "Applied Count", type: "number", minWidth: 130 },
    { field: "totalamount", headerName: "Total Amount Assigned", type: "number", minWidth: 170, valueFormatter: ({ value }) => money(value) },
    { field: "totalpaid", headerName: "Total Paid", type: "number", minWidth: 130, valueFormatter: ({ value }) => money(value) },
    { field: "totalconcession", headerName: "Total Concession", type: "number", minWidth: 160, valueFormatter: ({ value }) => money(value) },
    { field: "totalbalance", headerName: "Total Balance", type: "number", minWidth: 150, valueFormatter: ({ value }) => money(value) },
    { field: "ledgerids", headerName: "Ledger IDs", minWidth: 280, flex: 1 }
  ];

  const cards = [
    ["Students", displaySummary.students || 0],
    ["Duplicate Fee Groups", displaySummary.duplicategroups || 0],
    ["Duplicate Ledger Rows", displaySummary.duplicateledgerrows || 0],
    ["Total Amount Assigned", money(displaySummary.totalamount)],
    ["Total Paid", money(displaySummary.totalpaid)],
    ["Total Balance", money(displaySummary.totalbalance)]
  ];

  return (
    <MenuPageShell title="Duplicate fees">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Duplicate fees</Typography>
            <Typography color="text.secondary">
              Find students where the same fee item was applied more than once for the selected academic year. Program code and semester are optional filters.
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
                  <Grid item xs={12} md={3}>
                    <Autocomplete {...optionProps(options.academicyear, filters.academicyear, (value) => setFilter("academicyear", value), "Academic Year", true)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete {...optionProps(options.programcode, filters.programcode, (value) => setFilter("programcode", value), "Program Code")} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete {...optionProps(options.semester, filters.semester, (value) => setFilter("semester", value), "Semester")} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button fullWidth variant="contained" startIcon={<RefreshIcon />} disabled={loading || !filters.academicyear} onClick={loadRows}>
                      {loading ? "Loading..." : "Load duplicate fees"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={1.5}>
                {cards.map(([title, value]) => (
                  <Grid item xs={12} sm={6} md={2} key={title}>
                    <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, height: "100%" }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>{title}</Typography>
                        <Typography variant="h6" fontWeight={950}>{value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Paper elevation={0} sx={{ height: 680, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={loading}
                  disableRowSelectionOnClick
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "duplicate-fees" } } }}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                  sx={{
                    "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 }
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
