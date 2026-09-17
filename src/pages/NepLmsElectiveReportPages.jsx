import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { BarChart, PieChart } from "@mui/x-charts";
import { Print, Refresh } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const emptyFilters = { academicyear: "", regulation: "", program: "", programcode: "", semester: "" };
const safe = (value) => String(value ?? "").trim();

const gridSx = {
  "& .MuiDataGrid-cell": {
    whiteSpace: "normal",
    alignItems: "flex-start",
    py: 1,
    lineHeight: 1.35
  }
};

function StatCard({ label, value, color = "#2563eb" }) {
  return (
    <Card sx={{ height: "100%", borderLeft: `5px solid ${color}` }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" fontWeight={900}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

function ReportPage({ approvedOnly = false }) {
  const title = approvedOnly ? "Elective Report" : "Elective Application Report";
  const endpoint = approvedOnly ? "/api/v2/nepclassenrollment/approved-report" : "/api/v2/nepclassenrollment/application-report";
  const [options, setOptions] = useState({ academicyears: [], regulations: [], programs: [], semesters: [] });
  const [filters, setFilters] = useState(emptyFilters);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState([]);
  const [totals, setTotals] = useState({});
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOptions = async (nextFilters = filters) => {
    const params = { colid: global1.colid };
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params[key] = value; });
    const res = await ep1.get("/api/v2/nepclassenrollment/report-options", { params });
    setOptions(res.data || {});
  };

  useEffect(() => {
    loadOptions(emptyFilters).catch(() => setOptions({ academicyears: [], regulations: [], programs: [], semesters: [] }));
    ep1.get("/vins", { params: { colid: global1.colid } }).then((res) => setInstitution(res.data || null)).catch(() => setInstitution(null));
  }, []);

  const update = (field, value) => {
    const next = { ...filters, [field]: value };
    if (field === "academicyear") Object.assign(next, { regulation: "", program: "", programcode: "", semester: "" });
    if (field === "regulation") Object.assign(next, { program: "", programcode: "", semester: "" });
    if (field === "program") Object.assign(next, { semester: "" });
    setFilters(next);
    loadOptions(next).catch(() => {});
  };

  const setProgram = (_, value) => {
    const [program, programcode] = safe(value).split("|||");
    const next = { ...filters, program: program || "", programcode: programcode || "", semester: "" };
    setFilters(next);
    loadOptions(next).catch(() => {});
  };

  const loadReport = async () => {
    if (!filters.academicyear || !filters.regulation || !filters.programcode || !filters.semester) {
      setError("Select academic year, regulation, program and semester first");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const params = { colid: global1.colid, ...filters };
      const res = await ep1.get(endpoint, { params });
      setRows((res.data?.data || []).map((row, index) => ({ ...row, id: row._id || index + 1 })));
      setSummary((res.data?.summary || []).map((row, index) => ({ ...row, id: `${row.coursecode || "course"}-${index}` })));
      setTotals(res.data?.totals || {});
      setMessage(`${title} loaded`);
    } catch (err) {
      setRows([]);
      setSummary([]);
      setTotals({});
      setError(err.response?.data?.message || `Unable to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedProgramValue = filters.program && filters.programcode ? `${filters.program}|||${filters.programcode}` : "";
  const barData = useMemo(() => summary.map((row) => ({
    course: row.coursecode || row.course || "-",
    applications: approvedOnly ? Number(row.approvedapplications || row.approved || row.applications || 0) : Number(row.applications || 0),
    approved: Number(row.approved || 0),
    pending: Number(row.applied || 0) + Number(row.submitted || 0),
    rejected: Number(row.rejected || 0)
  })), [summary, approvedOnly]);
  const pieData = useMemo(() => {
    if (approvedOnly) return summary.map((row, index) => ({ id: index, label: row.coursecode || row.course || "-", value: Number(row.approvedapplications || row.applications || 0) }));
    return [
      { id: 1, label: "Approved", value: Number(totals.approved || 0) },
      { id: 2, label: "Pending", value: Number(totals.applied || 0) + Number(totals.submitted || 0) },
      { id: 3, label: "Rejected", value: Number(totals.rejected || 0) }
    ].filter((item) => item.value > 0);
  }, [summary, totals, approvedOnly]);

  const summaryColumns = [
    { field: "coursecode", headerName: "Course Code", width: 150 },
    { field: "course", headerName: "Course", minWidth: 260, flex: 1 },
    { field: approvedOnly ? "approvedapplications" : "applications", headerName: approvedOnly ? "Approved Applications" : "Applications", width: 170, type: "number" },
    ...(!approvedOnly ? [
      { field: "approved", headerName: "Approved", width: 130, type: "number" },
      { field: "applied", headerName: "Applied", width: 120, type: "number" },
      { field: "submitted", headerName: "Submitted", width: 130, type: "number" },
      { field: "rejected", headerName: "Rejected", width: 130, type: "number" }
    ] : [])
  ];
  const detailColumns = [
    { field: "student", headerName: "Student", minWidth: 220, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 150 },
    { field: "studentemail", headerName: "Student Email", minWidth: 220, flex: 1 },
    { field: "section", headerName: "Section", width: 110 },
    { field: "course", headerName: "Course", minWidth: 260, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 150 },
    { field: "status", headerName: "Status", width: 130 },
    { field: "approvedby", headerName: "Approved By", minWidth: 200, flex: 1 },
    { field: "remarks", headerName: "Remarks", minWidth: 220, flex: 1 }
  ];

  return (
    <MenuPageShell title={title}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #elective-report-print, #elective-report-print * { visibility: visible; }
            #elective-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 14mm; background: #fff; color: #000; }
            .no-print { display: none !important; }
          }
        `}</style>
        <Stack className="no-print" direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>{title}</Typography>
            <Typography color="text.secondary">Select filters, load elective applications, and review coursewise summary with charts and details.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>Print Preview</Button>
        </Stack>
        {loading && <LinearProgress className="no-print" sx={{ mb: 2 }} />}
        {message && <Alert className="no-print" severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.2}>
              <Autocomplete options={options.academicyears || []} value={filters.academicyear || null} onChange={(_, value) => update("academicyear", value || "")} renderInput={(params) => <TextField {...params} label="Academic Year" />} />
            </Grid>
            <Grid item xs={12} md={2.2}>
              <Autocomplete options={options.regulations || []} value={filters.regulation || null} onChange={(_, value) => update("regulation", value || "")} renderInput={(params) => <TextField {...params} label="Regulation" />} />
            </Grid>
            <Grid item xs={12} md={3.2}>
              <Autocomplete
                options={options.programs || []}
                value={selectedProgramValue || null}
                onChange={setProgram}
                getOptionLabel={(option) => {
                  const [program, programcode] = safe(option).split("|||");
                  return programcode ? `${program} (${programcode})` : safe(option);
                }}
                renderInput={(params) => <TextField {...params} label="Program" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete options={options.semesters || []} value={filters.semester || null} onChange={(_, value) => update("semester", value || "")} renderInput={(params) => <TextField {...params} label="Semester" />} />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Button fullWidth variant="contained" startIcon={<Refresh />} disabled={loading} onClick={loadReport} sx={{ minHeight: 56 }}>{loading ? "Loading..." : "Load Report"}</Button>
            </Grid>
          </Grid>
        </Paper>

        <Box id="elective-report-print">
          <Box sx={{ textAlign: "center", mb: 2 }}>
            {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 62, objectFit: "contain" }} />}
            <Typography variant="h5" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
            <Typography>{institution?.address || institution?.institutionaddress || ""}</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>{title}</Typography>
            <Typography variant="body2">{[filters.academicyear, filters.regulation, filters.program, filters.programcode, `Semester ${filters.semester}`].filter(Boolean).join(" | ")}</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><StatCard label={approvedOnly ? "Approved Applications" : "Total Applications"} value={approvedOnly ? totals.approved || 0 : totals.applications || 0} color="#2563eb" /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Courses" value={summary.length} color="#0f766e" /></Grid>
            {!approvedOnly && <Grid item xs={12} md={3}><StatCard label="Approved" value={totals.approved || 0} color="#16a34a" /></Grid>}
            {!approvedOnly && <Grid item xs={12} md={3}><StatCard label="Pending / Rejected" value={`${Number(totals.applied || 0) + Number(totals.submitted || 0)} / ${totals.rejected || 0}`} color="#dc2626" /></Grid>}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 2, height: 340 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Coursewise Applications</Typography>
                <BarChart
                  dataset={barData}
                  xAxis={[{ scaleType: "band", dataKey: "course", tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 10 } }]}
                  series={approvedOnly ? [{ dataKey: "applications", label: "Approved" }] : [{ dataKey: "applications", label: "Applications" }, { dataKey: "approved", label: "Approved" }, { dataKey: "pending", label: "Pending" }]}
                  height={270}
                  margin={{ bottom: 90, left: 45, right: 20, top: 20 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 2, height: 340 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>{approvedOnly ? "Approved Share" : "Status Share"}</Typography>
                <PieChart series={[{ data: pieData, innerRadius: 35, paddingAngle: 2 }]} height={270} />
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 1, mb: 2, overflowX: "auto" }}>
            <Typography fontWeight={900} sx={{ px: 1, py: 1 }}>Coursewise Summary</Typography>
            <DataGrid rows={summary} columns={summaryColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: approvedOnly ? "elective_report" : "elective_application_report" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={{ minWidth: 980, ...gridSx }} />
          </Paper>

          <Paper sx={{ p: 1, overflowX: "auto" }}>
            <Typography fontWeight={900} sx={{ px: 1, py: 1 }}>Application Details</Typography>
            <DataGrid rows={rows} columns={detailColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: approvedOnly ? "elective_approved_details" : "elective_application_details" } } }} pageSizeOptions={[10, 25, 50, 100]} sx={{ minWidth: 1480, ...gridSx }} />
          </Paper>
        </Box>
      </Container>
    </MenuPageShell>
  );
}

export function NepLmsElectiveApplicationReportPage() {
  return <ReportPage approvedOnly={false} />;
}

export function NepLmsElectiveApprovedReportPage() {
  return <ReportPage approvedOnly />;
}
