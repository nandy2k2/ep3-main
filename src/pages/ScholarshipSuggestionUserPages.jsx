import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Download, Print, Refresh, School } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#7c3aed", "#dc2626", "#0891b2", "#ca8a04", "#be185d"];
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const initialFilters = { academicyear: "", program: "", programcode: "", marksSource: "original" };

function PrintHeader({ institution, title, subtitle }) {
  return (
    <Box sx={{ textAlign: "center", mb: 2 }}>
      {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ height: 62, objectFit: "contain", mb: 1 }} />}
      <Typography variant="h5" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
      <Typography variant="body2">{institution?.address || institution?.institutionaddress || ""}</Typography>
      <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>{title}</Typography>
      {subtitle && <Typography variant="body2">{subtitle}</Typography>}
    </Box>
  );
}

function SummaryCards({ totals }) {
  const cards = [
    { label: "Students Checked", value: totals.students || 0, color: "#2563eb" },
    { label: "Eligible Students", value: totals.eligibleStudents || 0, color: "#16a34a" },
    { label: "Eligible Suggestions", value: totals.eligibleSuggestions || 0, color: "#f97316" },
    { label: "Categorywise Suggestions", value: totals.categorywiseSuggestions || 0, color: "#0891b2" },
    { label: "Govt Scholarships", value: totals.govtSuggestions || 0, color: "#7c3aed" },
    { label: "Non Govt Scholarships", value: totals.nonGovtSuggestions || 0, color: "#be185d" },
    { label: "Possible Amount", value: money(totals.possibleAmount || 0), color: "#ca8a04" }
  ];
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {cards.map((card) => (
        <Grid item xs={12} md={cards.length > 4 ? 12 / Math.min(cards.length, 6) : 3} key={card.label}>
          <Card sx={{ height: "100%", borderLeft: `5px solid ${card.color}` }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">{card.label}</Typography>
              <Typography variant="h5" fontWeight={900}>{card.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function Charts({ summary }) {
  const scholarshipData = summary.byScholarship || [];
  const categoryData = summary.byCategory || [];
  const typeData = summary.byScholarshipType || [];
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 2, height: 360 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>Scholarship-wise Eligible Students</Typography>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={scholarshipData.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Students" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 2, height: 360 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>Govt / Non Govt</Typography>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={typeData.length ? typeData : categoryData} dataKey="count" nameKey="name" outerRadius={105} label>
                {(typeData.length ? typeData : categoryData).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}

function useScholarshipSuggestionData() {
  const [options, setOptions] = useState({ academicyears: [], programs: [] });
  const [institution, setInstitution] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({ totals: {}, summary: {}, details: [], studentSummaries: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/scholarshipds/suggestion-options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };

  const loadInstitution = async () => {
    try {
      const res = await ep1.get("/vins", { params: { colid: global1.colid } });
      setInstitution(res.data || null);
    } catch {
      setInstitution(null);
    }
  };

  const loadData = async () => {
    if (!filters.academicyear || !filters.programcode) {
      setError("Select academic year and program");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/scholarshipds/program-suggestions", { params: { colid: global1.colid, ...filters } });
      setData(res.data || { totals: {}, summary: {}, details: [], studentSummaries: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scholarship suggestions");
      setData({ totals: {}, summary: {}, details: [], studentSummaries: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadInstitution();
  }, []);

  return { options, institution, filters, setFilters, data, loading, error, setError, loadData };
}

function Filters({ options, filters, setFilters, loadData, loading }) {
  const programs = useMemo(() => options.programs || [], [options.programs]);
  const selectedProgram = filters.program || filters.programcode ? `${filters.program}|||${filters.programcode}` : "";
  return (
    <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={2.5}>
          <Autocomplete
            options={options.academicyears || []}
            value={filters.academicyear || null}
            onChange={(_, value) => setFilters((prev) => ({ ...prev, academicyear: value || "" }))}
            renderInput={(params) => <TextField {...params} label="Academic Year" />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={programs}
            value={selectedProgram || null}
            onChange={(_, value) => {
              const [program, programcode] = String(value || "").split("|||");
              setFilters((prev) => ({ ...prev, program: program || "", programcode: programcode || "" }));
            }}
            getOptionLabel={(option) => {
              const [program, programcode] = String(option || "").split("|||");
              return programcode ? `${program} (${programcode})` : String(option || "");
            }}
            renderInput={(params) => <TextField {...params} label="Program" />}
          />
        </Grid>
        <Grid item xs={12} md={2.5}>
          <TextField select fullWidth label="Marks Source" value={filters.marksSource} onChange={(e) => setFilters((prev) => ({ ...prev, marksSource: e.target.value }))}>
            <MenuItem value="original">Original marks</MenuItem>
            <MenuItem value="marks2">Marks2</MenuItem>
            <MenuItem value="both">Original marks + Marks2</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={1.5}>
          <Button fullWidth variant="contained" startIcon={<Refresh />} onClick={loadData} disabled={loading} sx={{ height: 56 }}>
            {loading ? "Loading..." : "Load"}
          </Button>
        </Grid>
        <Grid item xs={12} md={1.5}>
          <Button fullWidth variant="outlined" startIcon={<Print />} onClick={() => window.print()} sx={{ height: 56 }}>Print</Button>
        </Grid>
      </Grid>
    </Paper>
  );
}

const detailColumns = [
  { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
  { field: "regno", headerName: "Reg No", minWidth: 130 },
  { field: "programcode", headerName: "Program Code", minWidth: 130 },
  { field: "semester", headerName: "Sem", minWidth: 90 },
  { field: "category", headerName: "Student Category", minWidth: 140 },
  { field: "scholarshipname", headerName: "Scholarship", minWidth: 230, flex: 1 },
  { field: "eligibilitystatus", headerName: "Status", minWidth: 130 },
  { field: "scholarshiptype", headerName: "Govt / Non Govt", minWidth: 150 },
  { field: "scholarshipcategory", headerName: "Scholarship Category", minWidth: 160 },
  { field: "amount", headerName: "Amount", minWidth: 120, valueFormatter: ({ value }) => money(value) },
  { field: "matchscore", headerName: "Match %", minWidth: 100 },
  { field: "details", headerName: "Details", minWidth: 260, flex: 1 },
  { field: "criteria", headerName: "Criteria", minWidth: 360, flex: 1.5 },
  { field: "missingcriteria", headerName: "Missing / Review", minWidth: 180 },
  {
    field: "applicationwebsite",
    headerName: "Link",
    minWidth: 160,
    renderCell: (params) => params.value ? <Link href={params.value} target="_blank" rel="noreferrer">Open link</Link> : <Typography variant="body2">Internal</Typography>
  }
];

const studentColumns = [
  { field: "student", headerName: "Student", minWidth: 200, flex: 1 },
  { field: "regno", headerName: "Reg No", minWidth: 130 },
  { field: "programcode", headerName: "Program Code", minWidth: 130 },
  { field: "category", headerName: "Category", minWidth: 120 },
  { field: "eligiblecount", headerName: "Eligible Count", minWidth: 130 },
  { field: "possibleamount", headerName: "Possible Amount", minWidth: 150, valueFormatter: ({ value }) => money(value) },
  { field: "bestpercentage", headerName: "Best %", minWidth: 110, valueFormatter: ({ value }) => value ? Number(value).toFixed(1) : "" },
  { field: "bestcgpa", headerName: "Best CGPA", minWidth: 120, valueFormatter: ({ value }) => value ? Number(value).toFixed(2) : "" }
];

export function UserScholarshipSuggestionPage() {
  const state = useScholarshipSuggestionData();
  const { options, institution, filters, setFilters, data, loading, error, setError, loadData } = state;
  const details = (data.details || []).map((row, index) => ({ ...row, id: `${row.regno}-${row.scholarshipname}-${index}` }));
  const studentRows = (data.studentSummaries || []).map((row, index) => ({ ...row, id: `${row.regno}-${index}` }));

  return (
    <MenuPageShell title="Scholarship Suggestions">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <style>{`@media print { .no-print { display:none !important; } body { background:#fff !important; color:#000 !important; } .print-area { box-shadow:none !important; } .MuiDataGrid-columnHeaders { color:#000 !important; } }`}</style>
        <Stack className="no-print" direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>Scholarship Suggestions</Typography>
            <Typography variant="body2" color="text.secondary">Load eligible and category-wise Govt / non-Govt scholarships for every student in the selected academic year and program.</Typography>
          </Box>
          <Chip icon={<School />} label="User view" color="primary" />
        </Stack>
        <Filters options={options} filters={filters} setFilters={setFilters} loadData={loadData} loading={loading} />
        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Box className="print-area">
          <PrintHeader institution={institution} title="Scholarship Suggestion" subtitle={`${filters.academicyear || ""} ${filters.program || ""} ${filters.programcode || ""}`} />
          <SummaryCards totals={data.totals || {}} />
          <Paper sx={{ p: 1, mb: 2 }}>
            <Typography fontWeight={800} sx={{ p: 1 }}>Student-wise Applicable Scholarships</Typography>
            <DataGrid rows={details} columns={detailColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "scholarship_suggestions" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} sx={{ minWidth: 1400 }} />
          </Paper>
          <Paper sx={{ p: 1 }}>
            <Typography fontWeight={800} sx={{ p: 1 }}>Student Summary</Typography>
            <DataGrid rows={studentRows} columns={studentColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_scholarship_summary" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} sx={{ minWidth: 1050 }} />
          </Paper>
        </Box>
      </Container>
    </MenuPageShell>
  );
}

export function ScholarshipSuggestionReportPage() {
  const state = useScholarshipSuggestionData();
  const { options, institution, filters, setFilters, data, loading, error, setError, loadData } = state;
  const details = (data.details || []).map((row, index) => ({ ...row, id: `${row.regno}-${row.scholarshipname}-${index}` }));
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scholarship-suggestion-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MenuPageShell title="Scholarship Suggestion Report">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <style>{`@media print { .no-print { display:none !important; } body { background:#fff !important; color:#000 !important; } .print-area { box-shadow:none !important; } .MuiDataGrid-columnHeaders { color:#000 !important; } }`}</style>
        <Stack className="no-print" direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900}>Scholarship Suggestion Report</Typography>
            <Typography variant="body2" color="text.secondary">Eligible, category-wise, Govt and non-Govt scholarship report with criteria, links, summary and charts.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<Download />} onClick={downloadJson}>Export JSON</Button>
        </Stack>
        <Filters options={options} filters={filters} setFilters={setFilters} loadData={loadData} loading={loading} />
        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Box className="print-area">
          <PrintHeader institution={institution} title="Scholarship Suggestion Report" subtitle={`${filters.academicyear || ""} ${filters.program || ""} ${filters.programcode || ""}`} />
          <SummaryCards totals={data.totals || {}} />
          <Charts summary={data.summary || {}} />
          <Paper sx={{ p: 1 }}>
            <Typography fontWeight={800} sx={{ p: 1 }}>Detailed Applicable Scholarship List</Typography>
            <DataGrid rows={details} columns={detailColumns} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "scholarship_suggestion_report" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} sx={{ minWidth: 1400 }} />
          </Paper>
        </Box>
      </Container>
    </MenuPageShell>
  );
}
