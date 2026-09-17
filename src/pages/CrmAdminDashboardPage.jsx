import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  AssignmentInd,
  Download,
  History,
  Print,
  Refresh,
  Settings
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#be123c", "#65a30d", "#475569"];
const assignmentTypes = ["Counselor", "Telecaller", "Campus Visit Counselor"];
const crmReportTabs = [
  { label: "CRM reports", path: "/crm-reports" },
  { label: "Daily interaction", path: "/crm-daily-interaction-report" },
  { label: "Telecaller report", path: "/crm-telecaller-report" },
  { label: "Campaign report", path: "/crm-campaign-report" }
];
const crmDataTabs = [
  { label: "Form", path: "/crm-form-link" },
  { label: "Inbound API", path: "/crm-inbound-api" },
  { label: "Bulk upload leads", path: "/crm-management" }
];

const clean = (value) => (value === undefined || value === null ? "" : String(value));
const dateText = (value) => (value ? new Date(value).toLocaleString() : "");

const exportCsv = (filename, rows, columns) => {
  const headers = columns.map((col) => col.headerName || col.field);
  const fields = columns.map((col) => col.field);
  const csv = [
    headers.join(","),
    ...rows.map((row) => fields.map((field) => `"${clean(row[field]).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const ChartCard = ({ title, children }) => (
  <Paper elevation={0} sx={{ p: 2, height: 340, border: "1px solid #e5e7eb", borderRadius: 2 }}>
    <Typography fontWeight={900} sx={{ mb: 1 }}>{title}</Typography>
    {children}
  </Paper>
);

const embeddedUrl = (path) => `${path}${path.includes("?") ? "&" : "?"}embedded=1`;

const LinkButton = ({ onClick, children }) => (
  <Button variant="outlined" onClick={onClick} sx={{ justifyContent: "flex-start" }}>
    {children}
  </Button>
);

export default function CrmAdminDashboardPage() {
  const [academicyear, setAcademicyear] = useState("");
  const [tab, setTab] = useState(0);
  const [options, setOptions] = useState({ years: [], stages: [], users: [], leadOptions: {}, rawOptions: {} });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [leadFilters, setLeadFilters] = useState({ pipeline_stage: "", source: "", programSearch: "", search: "" });
  const [leads, setLeads] = useState([]);
  const [leadTotal, setLeadTotal] = useState(0);
  const [selection, setSelection] = useState([]);
  const [assignee, setAssignee] = useState(null);
  const [assignmentType, setAssignmentType] = useState("Counselor");
  const [selectedLead, setSelectedLead] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [embeddedPage, setEmbeddedPage] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [configPage, setConfigPage] = useState(null);
  const [dataOpen, setDataOpen] = useState(false);
  const [dataTab, setDataTab] = useState(0);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentPage, setAgentPage] = useState(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/crm-admin-dashboard/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
    if (!academicyear && res.data?.years?.length) setAcademicyear(res.data.years[res.data.years.length - 1]);
  };

  const loadDashboard = async () => {
    if (!academicyear) {
      setError("Select academic year first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await ep1.post("/api/v2/crm-admin-dashboard/summary", { colid: global1.colid, academicyear });
      setDashboard(res.data);
      await loadLeads();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load CRM admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    const res = await ep1.post("/api/v2/crm-admin-dashboard/leads", {
      colid: global1.colid,
      year: academicyear,
      ...leadFilters,
      page: 0,
      limit: 300
    });
    setLeads((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
    setLeadTotal(res.data?.total || 0);
    setSelection([]);
  };

  const bulkAssign = async () => {
    if (!selection.length || !assignee?.email) {
      setError("Select one or more leads and an assignee.");
      return;
    }
    try {
      setLoading(true);
      const res = await ep1.post("/api/v2/crm-admin-dashboard/bulk-assign", {
        colid: global1.colid,
        ids: selection,
        assignmentType,
        person: assignee,
        user: global1.user
      });
      setMessage(`${res.data?.modified || 0} lead(s) assigned.`);
      await Promise.all([loadLeads(), loadDashboard()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign leads.");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (lead) => {
    try {
      setSelectedLead(lead);
      const res = await ep1.get("/api/v2/crm-admin-dashboard/lead-history", { params: { colid: global1.colid, leadid: lead._id } });
      setHistoryRows((res.data?.activities || []).map((row, index) => ({ ...row, id: row._id || index + 1 })));
      setTab(2);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load interaction history.");
    }
  };

  const programColumns = useMemo(() => [
    { field: "program", headerName: "Program", minWidth: 220, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 140 },
    { field: "intakecapacity", headerName: "Intake", width: 110, type: "number" },
    { field: "finalStage", headerName: "Final Stage", width: 130, type: "number" },
    { field: "otherStages", headerName: "Other Stages", width: 135, type: "number" },
    { field: "totalLeads", headerName: "Total Leads", width: 120, type: "number" },
    { field: "enrollmentPercentage", headerName: "Enrollment %", width: 145, type: "number" }
  ], []);

  const leadColumns = useMemo(() => [
    { field: "name", headerName: "Lead", minWidth: 180, flex: 1 },
    { field: "phone", headerName: "Phone", minWidth: 130 },
    { field: "email", headerName: "Email", minWidth: 190 },
    { field: "year", headerName: "Academic Year", width: 135 },
    { field: "program", headerName: "Program", minWidth: 180 },
    { field: "programcode", headerName: "Program Code", width: 135 },
    { field: "source", headerName: "Source", minWidth: 150 },
    { field: "pipeline_stage", headerName: "Stage", minWidth: 170 },
    { field: "assignedto", headerName: "Counselor", minWidth: 190 },
    { field: "telecalleremail", headerName: "Telecaller", minWidth: 190 },
    { field: "campusvisitcounseloremail", headerName: "Campus Counselor", minWidth: 190 },
    {
      field: "history",
      headerName: "History",
      width: 120,
      sortable: false,
      renderCell: ({ row }) => <Button size="small" startIcon={<History />} onClick={() => openHistory(row)}>View</Button>
    }
  ], []);

  const historyColumns = [
    { field: "activity_type", headerName: "Activity", minWidth: 160 },
    { field: "activity_date", headerName: "Date", minWidth: 180, valueGetter: ({ row }) => dateText(row.activity_date || row.createdAt) },
    { field: "performed_by", headerName: "By", minWidth: 190 },
    { field: "notes", headerName: "Notes", minWidth: 280, flex: 1 },
    { field: "outcome", headerName: "Outcome", minWidth: 190 },
    { field: "next_action", headerName: "Next Action", minWidth: 180 }
  ];

  const rawRows = useMemo(() => (dashboard?.charts?.rawSourcewise || []).map((row, index) => ({ ...row, id: index + 1 })), [dashboard]);
  const rawSourceChart = useMemo(() => {
    const grouped = {};
    rawRows.forEach((row) => {
      grouped[row.source || "Unknown"] = (grouped[row.source || "Unknown"] || 0) + Number(row.count || 0);
    });
    return Object.entries(grouped).map(([source, count]) => ({ source, count }));
  }, [rawRows]);

  const printDashboard = () => window.print();

  const openEmbedded = (page) => {
    setEmbeddedPage(page);
  };

  const openConfigPage = (page) => {
    setConfigOpen(true);
    setConfigPage(page);
  };

  return (
    <MenuPageShell title="CRM Admin Dashboard">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #crm-admin-print, #crm-admin-print * { visibility: visible; }
          #crm-admin-print { position: absolute; left: 0; top: 0; width: 100%; padding: 14px; background: white; color: black; }
          .crm-admin-no-print { display: none !important; }
        }
        .crm-admin-grid .MuiDataGrid-cell { white-space: normal !important; line-height: 1.35 !important; align-items: flex-start !important; padding-top: 8px !important; padding-bottom: 8px !important; }
      `}</style>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

      <Paper className="crm-admin-no-print" elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={950}>CRM Admin Dashboard</Typography>
            <Typography color="text.secondary">Program intake, pipeline conversion, lead assignment and CRM operating summary.</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper className="crm-admin-no-print" elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #dbeafe", borderRadius: 2, bgcolor: "#f8fbff" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2.6}>
            <Autocomplete freeSolo options={options.years || []} value={academicyear || null} onInputChange={(_, value) => setAcademicyear(value || "")} renderInput={(params) => <TextField {...params} size="small" label="Academic Year" />} />
          </Grid>
          <Grid item xs={12} md={1.3}>
            <Button fullWidth variant="contained" startIcon={<Refresh />} disabled={loading} onClick={loadDashboard}>{loading ? "Loading..." : "Load"}</Button>
          </Grid>
          <Grid item xs={12} md={1.3}>
            <Button fullWidth variant="outlined" startIcon={<Print />} onClick={printDashboard}>Print</Button>
          </Grid>
          <Grid item xs={12} md={1.8}>
            <Button fullWidth variant={dataOpen ? "contained" : "outlined"} color="success" startIcon={<Settings />} onClick={() => setDataOpen((value) => !value)}>
              Add data
            </Button>
          </Grid>
          <Grid item xs={12} md={1.7}>
            <Button fullWidth variant={configOpen ? "contained" : "outlined"} color="secondary" startIcon={<Settings />} onClick={() => setConfigOpen((value) => !value)}>
              Configuration
            </Button>
          </Grid>
          <Grid item xs={12} md={1.7}>
            <Button fullWidth variant={agentOpen ? "contained" : "outlined"} color="info" startIcon={<Settings />} onClick={() => setAgentOpen((value) => !value)}>
              AI agents
            </Button>
          </Grid>
          <Grid item xs={12} md={1.3}>
            <Typography fontWeight={800}>Configure CRM setup without leaving dashboard</Typography>
            <Typography variant="body2" color="text.secondary">Add data or expand configuration. Both open embedded original pages below.</Typography>
          </Grid>
        </Grid>
      </Paper>

      {dataOpen && (
        <Paper className="crm-admin-no-print" elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #bbf7d0", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1} sx={{ mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={900}>Add data</Typography>
              <Typography variant="body2" color="text.secondary">Use the form link, inbound API, or bulk upload leads page directly inside this dashboard.</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setDataOpen(false)}>Close add data</Button>
          </Stack>
          <Tabs value={dataTab} onChange={(_, value) => setDataTab(value)} variant="scrollable" sx={{ borderBottom: "1px solid #e5e7eb", mb: 1 }}>
            {crmDataTabs.map((item) => <Tab key={item.path} label={item.label} />)}
          </Tabs>
          <Box component="iframe" title={crmDataTabs[dataTab].label} src={embeddedUrl(crmDataTabs[dataTab].path)} sx={{ width: "100%", height: "76vh", border: "1px solid #cbd5e1", borderRadius: 1, bgcolor: "white" }} />
        </Paper>
      )}

      {configOpen && (
        <Paper className="crm-admin-no-print" elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>CRM configuration wizard</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Add programs and intake capacity", path: "/programmanagement" })}>1. Add programs and intake capacity</LinkButton></Grid>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Add CRM users", path: "/crm-admin-users" })}>2. Add CRM users</LinkButton></Grid>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Add counselor mapping", path: "/crm-counselor-mapping" })}>3. Add counselor mapping</LinkButton></Grid>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Add telecallers", path: "/crm-telecaller-mapping" })}>4. Add telecallers</LinkButton></Grid>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Add campus counselors", path: "/crm-telecaller-mapping" })}>5. Add campus counselors</LinkButton></Grid>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Manage pipeline stages and sources", path: "/crm-management" })}>6. Manage pipeline stages and sources</LinkButton></Grid>
            <Grid item xs={12} md={3}><LinkButton onClick={() => openConfigPage({ title: "Raw data and CRM copy", path: "/raw-data-management" })}>7. Raw data and CRM copy</LinkButton></Grid>
          </Grid>
          {configPage && (
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: "1px solid #cbd5e1", borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>{configPage.title}</Typography>
                <Button variant="outlined" onClick={() => setConfigPage(null)}>Close embedded page</Button>
              </Stack>
              <Box component="iframe" title={configPage.title} src={embeddedUrl(configPage.path)} sx={{ width: "100%", height: "76vh", border: "1px solid #cbd5e1", borderRadius: 1, bgcolor: "white" }} />
            </Paper>
          )}
        </Paper>
      )}

      {agentOpen && (
        <Paper className="crm-admin-no-print" elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #bae6fd", borderRadius: 2, bgcolor: "#f0f9ff" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1} sx={{ mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={900}>AI agents</Typography>
              <Typography variant="body2" color="text.secondary">Configure an existing CRM AI agent or open AI Coding Agents to add a new one.</Typography>
            </Box>
            <Button variant="outlined" onClick={() => { setAgentOpen(false); setAgentPage(null); }}>Close AI agents</Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => setAgentPage({ title: "Configure existing CRM AI agent", path: "/crm-ai-agent" })}>Configure existing agent</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => setAgentPage({ title: "Add new AI agent", path: "/ai-coding-agents" })}>Add new agent</Button></Grid>
          </Grid>
          {agentPage && (
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: "1px solid #7dd3fc", borderRadius: 2, bgcolor: "white" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>{agentPage.title}</Typography>
                <Button variant="outlined" onClick={() => setAgentPage(null)}>Close embedded page</Button>
              </Stack>
              <Box component="iframe" title={agentPage.title} src={embeddedUrl(agentPage.path)} sx={{ width: "100%", height: "76vh", border: "1px solid #cbd5e1", borderRadius: 1, bgcolor: "white" }} />
            </Paper>
          )}
        </Paper>
      )}

      <Paper className="crm-admin-no-print" elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => { setTab(value); setEmbeddedPage(null); }} variant="scrollable">
          <Tab label="Overview" />
          <Tab label="All leads and assignment" />
          <Tab label="Interaction history" />
          <Tab label="Raw source summary" />
          <Tab label="CRM report tabs" />
        </Tabs>
      </Paper>

      <Box id="crm-admin-print">
        {dashboard?.institution && (
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2, textAlign: "center" }}>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              {(dashboard.institution.logolink || dashboard.institution.logo) && (
                <Box component="img" src={dashboard.institution.logolink || dashboard.institution.logo} alt="logo" sx={{ width: 70, height: 70, objectFit: "contain" }} />
              )}
              <Box>
                <Typography variant="h5" fontWeight={950}>{dashboard.institution.institutionname || global1.insname || "Institution"}</Typography>
                <Typography>{dashboard.institution.address || ""}</Typography>
                <Typography variant="h6" fontWeight={900}>CRM Admin Dashboard</Typography>
                <Typography color="text.secondary">Academic Year: {academicyear || "-"}</Typography>
              </Box>
            </Stack>
          </Paper>
        )}
        {tab === 0 && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              {(dashboard?.cards || []).map((card, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={card.label}>
                  <Card sx={{ borderTop: `5px solid ${colors[index % colors.length]}`, height: "100%" }}>
                    <CardContent>
                      <Typography color="text.secondary">{card.label}</Typography>
                      <Typography variant="h4" fontWeight={950}>{card.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} lg={7}>
                <ChartCard title="Programwise intake vs final stage vs other stages">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard?.programRows || []} margin={{ top: 10, right: 15, left: 0, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="programcode" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="intakecapacity" name="Intake" fill="#2563eb" />
                      <Bar dataKey="finalStage" name="Final stage" fill="#16a34a" />
                      <Bar dataKey="otherStages" name="Other stages" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} lg={5}>
                <ChartCard title="Pipeline stage distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboard?.charts?.stagewise || []} dataKey="count" nameKey="stage" outerRadius={115} label>
                        {(dashboard?.charts?.stagewise || []).map((entry, index) => <Cell key={entry.stage} fill={colors[index % colors.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>Programwise enrollment percentage</Typography>
                <Button className="crm-admin-no-print" startIcon={<Download />} onClick={() => exportCsv("crm_admin_program_summary.csv", dashboard?.programRows || [], programColumns)}>Export</Button>
              </Stack>
              <DataGrid className="crm-admin-grid" autoHeight rows={dashboard?.programRows || []} columns={programColumns} getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} />
            </Paper>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <Paper className="crm-admin-no-print" elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2.2}><Autocomplete options={(options.leadOptions?.stages || []).filter(Boolean)} value={leadFilters.pipeline_stage || null} onChange={(_, v) => setLeadFilters((p) => ({ ...p, pipeline_stage: v || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Pipeline stage" />} /></Grid>
                <Grid item xs={12} md={2.2}><Autocomplete options={(options.leadOptions?.sources || []).filter(Boolean)} value={leadFilters.source || null} onChange={(_, v) => setLeadFilters((p) => ({ ...p, source: v || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Source" />} /></Grid>
                <Grid item xs={12} md={2.2}><Autocomplete options={[...(options.leadOptions?.programs || []), ...(options.leadOptions?.programcodes || []), ...(options.leadOptions?.courses || [])].filter(Boolean)} value={leadFilters.programSearch || null} onChange={(_, v) => setLeadFilters((p) => ({ ...p, programSearch: v || "" }))} renderInput={(params) => <TextField {...params} size="small" label="Program / Course" />} /></Grid>
                <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Search" value={leadFilters.search} onChange={(e) => setLeadFilters((p) => ({ ...p, search: e.target.value }))} /></Grid>
                <Grid item xs={12} md={1.2}><Button fullWidth variant="contained" onClick={loadLeads}>Load leads</Button></Grid>
                <Grid item xs={12} md={2.2}><Chip color="primary" label={`${leadTotal} matching leads`} /></Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={2.4}><TextField select fullWidth size="small" label="Assign as" value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>{assignmentTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={5}><Autocomplete options={options.users || []} value={assignee} getOptionLabel={(o) => o ? `${o.name || ""} - ${o.email || ""} (${o.role || ""})` : ""} onChange={(_, v) => setAssignee(v)} renderInput={(params) => <TextField {...params} size="small" label="Assign to user" />} /></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="contained" color="secondary" startIcon={<AssignmentInd />} disabled={loading || !selection.length} onClick={bulkAssign}>Bulk assign</Button></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={<Download />} onClick={() => exportCsv("crm_admin_leads.csv", leads, leadColumns.filter((col) => col.field !== "history"))}>Export</Button></Grid>
              </Grid>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <DataGrid className="crm-admin-grid" rows={leads} columns={leadColumns} checkboxSelection disableRowSelectionOnClick onRowSelectionModelChange={(ids) => setSelection(ids)} rowSelectionModel={selection} getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} sx={{ minHeight: 560 }} />
            </Paper>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={900}>Selected lead</Typography>
              {selectedLead ? (
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {["name", "phone", "email", "program", "programcode", "source", "pipeline_stage", "assignedto", "telecalleremail", "campusvisitcounseloremail"].map((field) => (
                    <Grid item xs={12} md={3} key={field}><Typography variant="caption" color="text.secondary">{field}</Typography><Typography fontWeight={700}>{clean(selectedLead[field]) || "-"}</Typography></Grid>
                  ))}
                </Grid>
              ) : <Typography color="text.secondary">Select a lead from the All leads tab to view complete interaction history.</Typography>}
            </Paper>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <DataGrid className="crm-admin-grid" rows={historyRows} columns={historyColumns} getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} sx={{ minHeight: 450 }} />
            </Paper>
          </Stack>
        )}

        {tab === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12} lg={5}>
              <ChartCard title="Sourcewise raw data">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rawSourceChart} margin={{ top: 10, right: 15, left: 0, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Raw records" fill="#0891b2" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
            <Grid item xs={12} lg={7}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="h6" fontWeight={900}>Raw data by source, status and program</Typography>
                  <Button className="crm-admin-no-print" startIcon={<Download />} onClick={() => exportCsv("crm_admin_raw_source_summary.csv", rawRows, [
                    { field: "source", headerName: "Source" },
                    { field: "status", headerName: "Status" },
                    { field: "program", headerName: "Program" },
                    { field: "programcode", headerName: "Program Code" },
                    { field: "count", headerName: "Count" }
                  ])}>Export</Button>
                </Stack>
                <DataGrid className="crm-admin-grid" autoHeight rows={rawRows} columns={[
                  { field: "source", headerName: "Source", minWidth: 180, flex: 1 },
                  { field: "status", headerName: "Status", minWidth: 140 },
                  { field: "program", headerName: "Program", minWidth: 180 },
                  { field: "programcode", headerName: "Program Code", width: 140 },
                  { field: "count", headerName: "Count", width: 120, type: "number" }
                ]} getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 4 && (
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>CRM report tabs</Typography>
              <Grid container spacing={2}>
                {crmReportTabs.map((item) => (
                  <Grid item xs={12} md={3} key={item.path}>
                    <Button fullWidth variant="outlined" startIcon={<Settings />} onClick={() => openEmbedded(item)}>{item.label}</Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>
            {embeddedPage && (
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6" fontWeight={900}>{embeddedPage.label || embeddedPage.title}</Typography>
                  <Button variant="outlined" onClick={() => setEmbeddedPage(null)}>Close embedded page</Button>
                </Stack>
                <Box component="iframe" title={embeddedPage.label || embeddedPage.title} src={embeddedUrl(embeddedPage.path)} sx={{ width: "100%", height: "76vh", border: "1px solid #cbd5e1", borderRadius: 1, bgcolor: "white" }} />
              </Paper>
            )}
          </Stack>
        )}
      </Box>
    </MenuPageShell>
  );
}
