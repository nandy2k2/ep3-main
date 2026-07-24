import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { AutoFixHigh, Dataset, Refresh } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const years = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];
const moduleCards = [
  "Users and profile basics",
  "Academic management",
  "LMS workload, timetable and attendance",
  "Fees ledger and fee collection",
  "Exam and conduct examination",
  "Budget approval data",
  "Vendor and purchase",
  "HR leave, attendance and salary"
];

const blank = {
  academicyear: "2026-27",
  count: 10,
  students: 10,
  employees: 8,
  programs: 3,
  recordsPerCourse: 5,
  includeExistingUsers: true,
  password: ""
};

export default function DummyDataGeneratorPage() {
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState([]);
  const [roleUsers, setRoleUsers] = useState([]);
  const [meta, setMeta] = useState(null);

  const payload = useMemo(() => ({
    ...form,
    count: Number(form.count || 1),
    students: Number(form.students || form.count || 1),
    employees: Number(form.employees || Math.ceil(Number(form.count || 1) / 2)),
    programs: Number(form.programs || 2),
    recordsPerCourse: Number(form.recordsPerCourse || 5),
    colid: global1.colid,
    user: global1.user,
    username: global1.name
  }), [form]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const generate = async () => {
    if (!window.confirm("Create related dummy data for this institution? Existing matching dummy records may be updated.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    setSummary([]);
    setMeta(null);
    try {
      const res = await ep1.post("/api/v2/dummy-data/generate", payload);
      setSummary((res.data?.summary || []).map((row, index) => ({ ...row, id: index + 1 })));
      setRoleUsers((res.data?.roleUsers || []).map((row, index) => ({ ...row, id: row._id || index + 1 })));
      setMeta(res.data?.meta || null);
      setMessage(res.data?.message || "Dummy data generated");
    } catch (err) {
      setSummary((err.response?.data?.summary || []).map((row, index) => ({ ...row, id: index + 1 })));
      setRoleUsers([]);
      setError(err.response?.data?.message || "Unable to generate dummy data");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { field: "label", headerName: "Module", minWidth: 260, flex: 1 },
    { field: "count", headerName: "Records", width: 140, type: "number" },
    { field: "status", headerName: "Status", minWidth: 180 }
  ];
  const userColumns = [
    { field: "role", headerName: "Role", minWidth: 130 },
    { field: "name", headerName: "User", minWidth: 190, flex: 1 },
    { field: "email", headerName: "Login email", minWidth: 250, flex: 1 },
    { field: "password", headerName: "Password", minWidth: 170 },
    { field: "department", headerName: "Department", minWidth: 180 },
    { field: "designation", headerName: "Designation", minWidth: 180 },
    { field: "status", headerName: "Status", width: 100 }
  ];

  return (
    <MenuPageShell title="Dummy Data Generator">
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={900}>Dummy Data Generator</Typography>
            <Typography color="text.secondary">
              Create connected sample records for users, academics, LMS, fees, examinations, budget, purchase, vendors, HR leave, HR attendance and salary processing.
            </Typography>
          </Box>

          {busy && <LinearProgress />}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Grid container spacing={2}>
            {moduleCards.map((label) => (
              <Grid item xs={12} sm={6} md={3} key={label}>
                <Card sx={{ height: "100%", borderLeft: "5px solid #2563eb" }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Dataset color="primary" />
                      <Typography fontWeight={800}>{label}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Generation Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Academic Year" value={form.academicyear} onChange={(e) => update("academicyear", e.target.value)}>
                  {years.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Base Count" value={form.count} inputProps={{ min: 1, max: 100 }} onChange={(e) => update("count", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Students" value={form.students} inputProps={{ min: 1, max: 200 }} onChange={(e) => update("students", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Employees / Faculty" value={form.employees} inputProps={{ min: 1, max: 100 }} onChange={(e) => update("employees", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Programs" value={form.programs} inputProps={{ min: 1, max: 20 }} onChange={(e) => update("programs", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Records / Course" value={form.recordsPerCourse} inputProps={{ min: 1, max: 50 }} onChange={(e) => update("recordsPerCourse", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="password"
                  label="Override Password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  helperText="Required only if dummy data was already generated once."
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={form.includeExistingUsers} onChange={(e) => update("includeExistingUsers", e.target.checked)} />}
                  label="Use existing users from User model where possible, and use non-student users for salary, leave, purchase and workload"
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" size="large" startIcon={<AutoFixHigh />} disabled={busy} onClick={generate}>
                    {busy ? "Generating..." : "Generate Dummy Data"}
                  </Button>
                  <Button variant="outlined" startIcon={<Refresh />} disabled={busy} onClick={() => { setForm(blank); setSummary([]); setRoleUsers([]); setMeta(null); }}>
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {meta && (
            <Alert severity="info">
              Generated for colid {meta.colid}, academic year {meta.academicyear}, base count {meta.count}. Time taken: {meta.seconds} seconds.
            </Alert>
          )}

          <Paper sx={{ p: 1 }}>
            <Typography fontWeight={900} sx={{ px: 1, py: 1 }}>Generation Summary</Typography>
            <DataGrid
              rows={summary}
              columns={columns}
              loading={busy}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "dummy_data_generation_summary" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Paper>

          <Paper sx={{ p: 1 }}>
            <Typography fontWeight={900} sx={{ px: 1, py: 1 }}>Role wise users created / available</Typography>
            <DataGrid
              rows={roleUsers}
              columns={userColumns}
              loading={busy}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "dummy_role_wise_users" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
