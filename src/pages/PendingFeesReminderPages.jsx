import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Email, PlayArrow, Refresh, Save, ToggleOff, ToggleOn } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const money = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateText = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
};

const defaultBody = `Dear {{student}},

This is a reminder that the following fee item is overdue.

Student: {{student}}
Reg No: {{regno}}
Academic Year: {{academicyear}}
Program: {{program}} ({{programcode}})
Due Date: {{duedate}}
Balance: {{balance}}

Please clear the pending fee at the earliest.`;

const optionLabel = (row = {}) => row.label || `${row.program || "Program"}${row.programcode ? ` (${row.programcode})` : ""}`;
const emailLabel = (row = {}) => row.label || `${row.provider || "Email"} / ${row.type || "General"} / ${row.username || ""}`;

function SummaryCards({ summary }) {
  const cards = [
    ["Fee Items", summary?.feeitems || 0, "#2563eb"],
    ["Students", summary?.students || 0, "#0f766e"],
    ["Pending Balance", `Rs. ${money(summary?.balance || 0)}`, "#be123c"]
  ];
  return (
    <Grid container spacing={2}>
      {cards.map(([label, value, color]) => (
        <Grid item xs={12} md={4} key={label}>
          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, borderTop: `4px solid ${color}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="h5" fontWeight={950} sx={{ color }}>{value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function PendingFeesAgentPage() {
  const [options, setOptions] = useState({ academicyears: [], programs: [], emailconfigs: [] });
  const [filters, setFilters] = useState({ academicyear: "", program: "", programcode: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [emailForm, setEmailForm] = useState({
    subject: "Pending fee reminder for {{student}}",
    body: defaultBody,
    emailconfigid: "",
    dayofweek: "",
    timeofrunning: "",
    active: "Yes"
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
  }, []);

  const selectedProgram = useMemo(() => (
    options.programs.find((row) => row.programcode === filters.programcode && row.program === filters.program) || null
  ), [options.programs, filters]);

  const selectedEmailConfig = useMemo(() => (
    options.emailconfigs.find((row) => row._id === emailForm.emailconfigid) || null
  ), [options.emailconfigs, emailForm.emailconfigid]);

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/pending-fees-reminder/options", { params: { colid: global1.colid } });
      setOptions({
        academicyears: res.data?.academicyears || [],
        programs: res.data?.programs || [],
        emailconfigs: res.data?.emailconfigs || []
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load options");
    }
  };

  const loadRows = async () => {
    if (!filters.academicyear || !filters.programcode) {
      setError("Select academic year and program before loading pending fees.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const res = await ep1.get("/api/v2/pending-fees-reminder/search", {
        params: { colid: global1.colid, ...filters }
      });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || null);
      setSelectedIds([]);
      setMessage("Pending fee rows loaded.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load pending fee rows");
    } finally {
      setLoading(false);
    }
  };

  const payload = () => ({
    colid: global1.colid,
    user: global1.user,
    name: global1.name,
    ...filters,
    ...emailForm,
    selectedIds,
    rows
  });

  const sendEmails = async () => {
    if (!selectedIds.length) {
      setError("Select one or more fee rows before sending email.");
      return;
    }
    if (!emailForm.emailconfigid || !emailForm.subject || !emailForm.body) {
      setError("Select email configuration and enter subject and email text.");
      return;
    }
    try {
      setSending(true);
      setError("");
      const res = await ep1.post("/api/v2/pending-fees-reminder/send", payload());
      setMessage(`Email completed. Sent: ${res.data?.summary?.sent || 0}, Failed: ${res.data?.summary?.failed || 0}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send pending fee emails");
    } finally {
      setSending(false);
    }
  };

  const saveAgent = async () => {
    if (!filters.academicyear || !filters.programcode || !emailForm.emailconfigid || !emailForm.subject || !emailForm.body || !emailForm.dayofweek || !emailForm.timeofrunning) {
      setError("Select academic year, program, email configuration, subject, email text, day and time before saving agent.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await ep1.post("/api/v2/pending-fees-reminder/agents", payload());
      setMessage(`Reminder agent saved for ${res.data?.data?.dayofweek || emailForm.dayofweek} at ${res.data?.data?.timeofrunning || emailForm.timeofrunning}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save reminder agent");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "student", headerName: "Student", minWidth: 190, flex: 1, editable: true },
    { field: "regno", headerName: "Reg No", minWidth: 130, flex: 0.8 },
    { field: "studentemail", headerName: "Student Email", minWidth: 230, flex: 1, editable: true },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130, flex: 0.7 },
    { field: "semester", headerName: "Semester", minWidth: 100, flex: 0.5 },
    { field: "feegroup", headerName: "Fee Group", minWidth: 150, flex: 0.8 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 190, flex: 1 },
    { field: "duedate", headerName: "Due Date", minWidth: 120, valueFormatter: ({ value }) => dateText(value) },
    { field: "balance", headerName: "Balance", minWidth: 120, type: "number", valueFormatter: ({ value }) => money(value) },
    { field: "status", headerName: "Status", minWidth: 120 }
  ];

  return (
    <MenuPageShell title="Pending fees agent">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={950}>Pending fees agent</Typography>
            <Typography color="text.secondary">Find overdue student fee balances, send reminders, and save the same criteria as a weekly reminder agent.</Typography>
          </Paper>
          {(error || message) && <Alert severity={error ? "error" : "success"} onClose={() => { setError(""); setMessage(""); }}>{error || message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={options.academicyears}
                  value={filters.academicyear || null}
                  onChange={(_, value) => setFilters((prev) => ({ ...prev, academicyear: value || "" }))}
                  renderInput={(params) => <TextField {...params} label="Academic year" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={options.programs}
                  value={selectedProgram}
                  getOptionLabel={optionLabel}
                  onChange={(_, value) => setFilters((prev) => ({ ...prev, program: value?.program || "", programcode: value?.programcode || "" }))}
                  renderInput={(params) => <TextField {...params} label="Program" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth size="small" label="Program code" value={filters.programcode} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" disabled={loading} onClick={loadRows} startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <Refresh />}>
                  {loading ? "Loading..." : "Load pending fees"}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {summary && <SummaryCards summary={summary} />}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={950} sx={{ mb: 1 }}>Pending fee items</Typography>
            <Box sx={{ height: 520, width: "100%" }}>
              <DataGrid
                rows={rows}
                getRowId={(row) => row._id}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={(model) => setSelectedIds(model)}
                processRowUpdate={(updated) => {
                  setRows((prev) => prev.map((row) => row._id === updated._id ? updated : row));
                  return updated;
                }}
                onProcessRowUpdateError={(err) => setError(err.message || "Unable to update row")}
                slots={{ toolbar: GridToolbar }}
                getRowHeight={() => "auto"}
                sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 } }}
              />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={options.emailconfigs}
                  value={selectedEmailConfig}
                  getOptionLabel={emailLabel}
                  onChange={(_, value) => setEmailForm((prev) => ({ ...prev, emailconfigid: value?._id || "" }))}
                  renderInput={(params) => <TextField {...params} label="Email configuration" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth size="small" label="Subject" value={emailForm.subject} onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline minRows={6} label="Email text" value={emailForm.body} onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={weekdays}
                  value={emailForm.dayofweek || null}
                  onChange={(_, value) => setEmailForm((prev) => ({ ...prev, dayofweek: value || "" }))}
                  renderInput={(params) => <TextField {...params} label="Repeat day of week" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" type="time" label="Repeat time" InputLabelProps={{ shrink: true }} value={emailForm.timeofrunning} onChange={(e) => setEmailForm((prev) => ({ ...prev, timeofrunning: e.target.value }))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={["Yes", "No"]}
                  value={emailForm.active}
                  onChange={(_, value) => setEmailForm((prev) => ({ ...prev, active: value || "Yes" }))}
                  renderInput={(params) => <TextField {...params} label="Agent active" size="small" />}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button variant="contained" color="success" disabled={sending} startIcon={sending ? <CircularProgress color="inherit" size={18} /> : <Email />} onClick={sendEmails}>
                    {sending ? "Sending..." : "Send email to selected"}
                  </Button>
                  <Button variant="outlined" disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : <Save />} onClick={saveAgent}>
                    {saving ? "Saving..." : "Save as reminder agent"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function AllReminderAgentsPage() {
  const [options, setOptions] = useState({ academicyears: [], programs: [] });
  const [filters, setFilters] = useState({ academicyear: "", programcode: "", active: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
  }, []);

  const selectedProgram = useMemo(() => options.programs.find((row) => row.programcode === filters.programcode) || null, [options.programs, filters.programcode]);

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/pending-fees-reminder/options", { params: { colid: global1.colid } });
      setOptions({ academicyears: res.data?.academicyears || [], programs: res.data?.programs || [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load options");
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/pending-fees-reminder/agents", { params: { colid: global1.colid, ...filters } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load reminder agents");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (row, active) => {
    try {
      setBusyId(row._id);
      const res = await ep1.post("/api/v2/pending-fees-reminder/agents/status", { colid: global1.colid, id: row._id, active });
      setRows((prev) => prev.map((item) => item._id === row._id ? res.data.data : item));
      setMessage(`Agent ${active === "Yes" ? "activated" : "deactivated"}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update agent");
    } finally {
      setBusyId("");
    }
  };

  const runAgent = async (row) => {
    try {
      setBusyId(row._id);
      const res = await ep1.post("/api/v2/pending-fees-reminder/agents/run", { colid: global1.colid, id: row._id, user: global1.user, name: global1.name });
      setMessage(`Agent run completed. Sent: ${res.data?.summary?.sent || 0}, Failed: ${res.data?.summary?.failed || 0}.`);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to run agent");
    } finally {
      setBusyId("");
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", minWidth: 140 },
    { field: "program", headerName: "Program", minWidth: 190, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "dayofweek", headerName: "Day", minWidth: 120 },
    { field: "timeofrunning", headerName: "Time", minWidth: 100 },
    { field: "active", headerName: "Active", minWidth: 100 },
    { field: "emailconfigname", headerName: "Email Config", minWidth: 220, flex: 1 },
    { field: "subject", headerName: "Subject", minWidth: 240, flex: 1 },
    { field: "lastRunStatus", headerName: "Last Status", minWidth: 130 },
    { field: "lastRunAt", headerName: "Last Run", minWidth: 170, valueFormatter: ({ value }) => value ? new Date(value).toLocaleString("en-IN") : "" },
    {
      field: "actions",
      headerName: "Actions",
      type: "actions",
      width: 150,
      getActions: ({ row }) => [
        <GridActionsCellItem key="run" icon={busyId === row._id ? <CircularProgress size={18} /> : <PlayArrow />} label="Run" onClick={() => runAgent(row)} disabled={busyId === row._id} />,
        <GridActionsCellItem key="toggle" icon={row.active === "Yes" ? <ToggleOff /> : <ToggleOn />} label={row.active === "Yes" ? "Deactivate" : "Activate"} onClick={() => updateStatus(row, row.active === "Yes" ? "No" : "Yes")} disabled={busyId === row._id} />
      ]
    }
  ];

  return (
    <MenuPageShell title="All reminder agents">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={950}>All reminder agents</Typography>
            <Typography color="text.secondary">View, run, activate, and deactivate academic-year and programwise pending fee reminder agents.</Typography>
          </Paper>
          {(error || message) && <Alert severity={error ? "error" : "success"} onClose={() => { setError(""); setMessage(""); }}>{error || message}</Alert>}
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Autocomplete options={options.academicyears} value={filters.academicyear || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, academicyear: value || "" }))} renderInput={(params) => <TextField {...params} label="Academic year" size="small" />} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete options={options.programs} value={selectedProgram} getOptionLabel={optionLabel} onChange={(_, value) => setFilters((prev) => ({ ...prev, programcode: value?.programcode || "" }))} renderInput={(params) => <TextField {...params} label="Program" size="small" />} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Autocomplete options={["Yes", "No"]} value={filters.active || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, active: value || "" }))} renderInput={(params) => <TextField {...params} label="Active" size="small" />} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="contained" disabled={loading} onClick={loadRows} startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <Refresh />}>
                  {loading ? "Loading..." : "Load agents"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={rows}
                getRowId={(row) => row._id}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                disableRowSelectionOnClick
                getRowHeight={() => "auto"}
                sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 } }}
              />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
