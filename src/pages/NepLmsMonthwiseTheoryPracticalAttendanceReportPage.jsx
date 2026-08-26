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
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Print, Refresh } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const fields = [
  { field: "academicyear", label: "Academic Year", required: true },
  { field: "program", label: "Program", required: true },
  { field: "programcode", label: "Program Code", required: true },
  { field: "semester", label: "Semester", required: true },
  { field: "section", label: "Section" },
  { field: "coursecode", label: "Course Code" }
];

function PrintHeader({ institution }) {
  return (
    <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", pb: 1.5, borderBottom: "2px solid #111827", mb: 2 }}>
      {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ width: 66, height: 66, objectFit: "contain" }} />}
      <Typography variant="h6" fontWeight={900}>{institution?.institutionname || institution?.insname || global1.insname || "Institution"}</Typography>
      <Typography variant="body2">{institution?.address || ""}</Typography>
      <Typography variant="subtitle1" fontWeight={900}>Monthwise Theory / Practical Attendance Report</Typography>
    </Stack>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderLeft: `5px solid ${color}` }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={950}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function NepLmsMonthwiseTheoryPracticalAttendanceReportPage() {
  const [filters, setFilters] = useState({ academicyear: "", program: "", programcode: "", semester: "", section: "", coursecode: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ students: 0, months: 0, theory: 0, practical: 0, total: 0 });
  const [charts, setCharts] = useState({ byMonth: [] });
  const [options, setOptions] = useState({});
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInstitution = async () => {
    try {
      const res = await ep1.get("/vins", { params: { colid: global1.colid } });
      setInstitution(res.data || null);
    } catch (err) {
      setInstitution(null);
    }
  };

  const loadReport = async (withFilters = false) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      if (withFilters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params[key] = value;
        });
      }
      const res = await ep1.get("/api/v2/neplms/attendance/monthwise-theory-practical-report", { params });
      setRows(res.data?.rows || []);
      setSummary(res.data?.summary || { students: 0, months: 0, theory: 0, practical: 0, total: 0 });
      setCharts(res.data?.charts || { byMonth: [] });
      setOptions(res.data?.options || {});
      if (withFilters && res.data?.message) setError(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load attendance report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitution();
    loadReport(false);
  }, []);

  const canLoad = fields.filter((field) => field.required).every((field) => filters[field.field]);
  const filterText = fields.filter((field) => filters[field.field]).map((field) => `${field.label}: ${filters[field.field]}`).join(" | ") || "No filters selected";

  const columns = [
    { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "rollno", headerName: "Roll No", width: 120 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 110 },
    { field: "month", headerName: "Month", width: 130 },
    { field: "theoryclassesattended", headerName: "Theory Classes Attended", width: 190, type: "number" },
    { field: "practicalclassesattended", headerName: "Practical Classes Attended", width: 200, type: "number" },
    { field: "totalclassesattended", headerName: "Total", width: 110, type: "number" }
  ];

  const printRows = useMemo(() => rows.slice().sort((a, b) => (
    String(a.student).localeCompare(String(b.student), undefined, { numeric: true })
    || String(a.monthorder).localeCompare(String(b.monthorder))
  )), [rows]);

  return (
    <MenuPageShell title="Monthwise Theory Practical Attendance">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`
          .monthwise-attendance-grid .MuiDataGrid-cell { white-space: normal !important; line-height: 1.35 !important; align-items: flex-start !important; padding-top: 8px !important; padding-bottom: 8px !important; }
          @media print {
            @page { size: A4 landscape; margin: 8mm; }
            body * { visibility: hidden; }
            #monthwise-attendance-print, #monthwise-attendance-print * { visibility: visible; }
            #monthwise-attendance-print { position: absolute; left: 0; top: 0; width: 281mm; box-shadow: none !important; border: 0 !important; }
            .no-print { display: none !important; }
          }
        `}</style>

        <Stack spacing={2}>
          <Paper className="no-print" elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h4" fontWeight={950}>Monthwise Theory / Practical Attendance</Typography>
                <Typography color="text.secondary">Select academic year, program, program code and semester, then load the report.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<Refresh />} disabled={loading || !canLoad} onClick={() => loadReport(true)}>Load</Button>
                <Button variant="contained" startIcon={<Print />} disabled={!rows.length} onClick={() => window.print()}>Print</Button>
              </Stack>
            </Stack>
          </Paper>

          {error && <Alert className="no-print" severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper className="no-print" elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Grid container spacing={1.5}>
              {fields.map((field) => (
                <Grid item xs={12} sm={6} md={2} key={field.field}>
                  <Autocomplete
                    options={options[field.field] || []}
                    value={filters[field.field] || null}
                    onChange={(_, value) => setFilters((prev) => ({ ...prev, [field.field]: value || "" }))}
                    renderInput={(params) => <TextField {...params} required={field.required} label={field.label} size="small" />}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Grid className="no-print" container spacing={2}>
            <Grid item xs={12} md={3}><SummaryCard title="Students" value={summary.students || 0} color="#2563eb" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Months" value={summary.months || 0} color="#7c3aed" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Theory Attended" value={summary.theory || 0} color="#16a34a" /></Grid>
            <Grid item xs={12} md={3}><SummaryCard title="Practical Attended" value={summary.practical || 0} color="#f97316" /></Grid>
          </Grid>

          <Paper className="no-print" elevation={0} sx={{ p: 2, height: 360, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Monthwise Attendance Split</Typography>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={charts.byMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Theory" fill="#16a34a" />
                <Bar dataKey="Practical" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper className="no-print monthwise-attendance-grid" elevation={0} sx={{ p: 1, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <DataGrid
              rows={rows.map((row, index) => ({ ...row, id: `${row.regno || row.email || row.student}-${row.monthkey}-${index}` }))}
              columns={columns}
              loading={loading}
              autoHeight
              getRowHeight={() => "auto"}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "monthwise_theory_practical_attendance" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              sx={{ minWidth: 1800 }}
            />
          </Paper>

          <Paper id="monthwise-attendance-print" sx={{ maxWidth: "297mm", mx: "auto", p: 3, bgcolor: "#fff", color: "#111827", border: "1px solid #d1d5db" }}>
            <PrintHeader institution={institution} />
            <Typography variant="body2" sx={{ mb: 1 }}><b>Filters:</b> {filterText}</Typography>
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={3}><Chip label={`Students: ${summary.students || 0}`} sx={{ width: "100%" }} /></Grid>
              <Grid item xs={3}><Chip label={`Months: ${summary.months || 0}`} sx={{ width: "100%" }} /></Grid>
              <Grid item xs={3}><Chip label={`Theory: ${summary.theory || 0}`} sx={{ width: "100%" }} /></Grid>
              <Grid item xs={3}><Chip label={`Practical: ${summary.practical || 0}`} sx={{ width: "100%" }} /></Grid>
            </Grid>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr>{columns.map((column) => <th key={column.field} style={{ border: "1px solid #111", padding: 5, background: "#f3f4f6", textAlign: "left" }}>{column.headerName}</th>)}</tr>
              </thead>
              <tbody>
                {printRows.map((row, index) => (
                  <tr key={`${row.regno}-${row.monthkey}-${index}`}>
                    {columns.map((column) => <td key={column.field} style={{ border: "1px solid #111", padding: 5, verticalAlign: "top" }}>{row[column.field] || "-"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
