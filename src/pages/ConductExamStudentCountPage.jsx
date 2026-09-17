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
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { BarChart, Print, Refresh, School } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const emptyOptions = {
  academicyears: [],
  regulations: [],
  exams: [],
  examcodes: []
};

const colors = ["#2563eb", "#0f766e", "#ea580c", "#7c3aed", "#be123c", "#0891b2"];
const safe = (value) => String(value ?? "").trim() || "-";
const number = (value) => Number(value || 0);

const institutionName = (institution = {}) => institution.institutionname || institution.name || "Institution";
const institutionAddress = (institution = {}) => institution.address || "";
const institutionContact = (institution = {}) => institution.contactusdetails || institution.phone || institution.email || "";

export default function ConductExamStudentCountPage() {
  const [filters, setFilters] = useState({ academicyear: "", regulation: "", exam: "", examcode: "" });
  const [options, setOptions] = useState(emptyOptions);
  const [report, setReport] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canLoad = filters.academicyear && filters.regulation && filters.exam && filters.examcode;

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async (nextFilters = filters) => {
    try {
      setOptionsLoading(true);
      const res = await ep1.get("/api/v2/conductexam/student-count-report-options", {
        params: { colid: global1.colid, ...nextFilters }
      });
      setOptions(res.data?.options || emptyOptions);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report filters");
    } finally {
      setOptionsLoading(false);
    }
  };

  const updateFilter = (field, value) => {
    const next = { ...filters, [field]: value || "" };
    if (field === "academicyear") {
      next.regulation = "";
      next.exam = "";
      next.examcode = "";
    }
    if (field === "regulation") {
      next.exam = "";
      next.examcode = "";
    }
    if (field === "exam") next.examcode = "";
    setFilters(next);
    setReport(null);
    loadOptions(next);
  };

  const loadReport = async () => {
    if (!canLoad) {
      setError("Select academic year, regulation, exam and exam code before loading the report.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const res = await ep1.get("/api/v2/conductexam/student-count-report", {
        params: { colid: global1.colid, ...filters }
      });
      setReport(res.data || null);
      setMessage("Student count report loaded.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load student count report");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { field: "program", headerName: "Program", flex: 1.4, minWidth: 180 },
    { field: "programcode", headerName: "Program Code", flex: 0.8, minWidth: 130 },
    { field: "semester", headerName: "Semester", flex: 0.6, minWidth: 100 },
    { field: "studentcount", headerName: "Students", type: "number", flex: 0.7, minWidth: 110 },
    { field: "coursecount", headerName: "Courses", type: "number", flex: 0.7, minWidth: 110 },
    { field: "theorycourses", headerName: "Theory", type: "number", flex: 0.6, minWidth: 100 },
    { field: "practicalcourses", headerName: "Practical", type: "number", flex: 0.7, minWidth: 110 },
    { field: "othercourses", headerName: "Other", type: "number", flex: 0.6, minWidth: 100 },
    { field: "coursecodes", headerName: "Course Codes", flex: 1.5, minWidth: 220 },
    { field: "courses", headerName: "Courses", flex: 2, minWidth: 280 }
  ], []);

  const summaryCards = [
    { label: "Programs", value: report?.summary?.programs || 0, color: "#2563eb" },
    { label: "Program Semesters", value: report?.summary?.programSemesters || 0, color: "#0f766e" },
    { label: "Courses", value: report?.summary?.courses || 0, color: "#ea580c" },
    { label: "Students", value: report?.summary?.students || 0, color: "#7c3aed" }
  ];

  const chartMax = Math.max(1, ...(report?.charts?.programwise || []).map((row) => number(row.studentcount)));

  const printPreview = () => {
    if (!report) return;
    const institution = report.institution || {};
    const rows = report.details || [];
    const htmlRows = rows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${safe(row.program)}</td>
        <td>${safe(row.programcode)}</td>
        <td>${safe(row.semester)}</td>
        <td class="num">${safe(row.studentcount)}</td>
        <td class="num">${safe(row.coursecount)}</td>
        <td class="num">${safe(row.theorycourses)}</td>
        <td class="num">${safe(row.practicalcourses)}</td>
        <td>${safe(row.coursecodes)}</td>
      </tr>
    `).join("");
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Student Count Report</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
            .actions { padding: 12px; text-align: right; border-bottom: 1px solid #ddd; }
            .actions button { margin-left: 8px; padding: 8px 14px; border: 1px solid #222; background: #fff; cursor: pointer; }
            .print-area { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm; box-sizing: border-box; }
            .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
            .logo { max-height: 68px; max-width: 92px; object-fit: contain; margin-bottom: 5px; }
            h1 { font-size: 20px; margin: 0; }
            h2 { font-size: 16px; margin: 8px 0 0; text-transform: uppercase; }
            .muted { color: #333; font-size: 12px; margin-top: 3px; }
            .meta, .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
            .box { border: 1px solid #333; padding: 7px; font-size: 12px; }
            .box b { display: block; font-size: 11px; color: #333; margin-bottom: 3px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
            th, td { border: 1px solid #222; padding: 5px; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; text-align: center; }
            .num { text-align: right; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            thead { display: table-header-group; }
            @page { size: A4 portrait; margin: 10mm; }
            @media print {
              .actions { display: none; }
              .print-area { width: auto; min-height: auto; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
          <div class="print-area">
            <div class="header">
              ${institution.logolink ? `<img class="logo" src="${institution.logolink}" />` : ""}
              <h1>${safe(institutionName(institution))}</h1>
              <div class="muted">${safe(institutionAddress(institution))}</div>
              <div class="muted">${safe(institutionContact(institution))}</div>
              <h2>Student Count Report</h2>
            </div>
            <div class="meta">
              <div class="box"><b>Academic Year</b>${safe(filters.academicyear)}</div>
              <div class="box"><b>Regulation</b>${safe(filters.regulation)}</div>
              <div class="box"><b>Exam</b>${safe(filters.exam)}</div>
              <div class="box"><b>Exam Code</b>${safe(filters.examcode)}</div>
            </div>
            <div class="summary">
              <div class="box"><b>Programs</b>${safe(report.summary?.programs)}</div>
              <div class="box"><b>Program Semesters</b>${safe(report.summary?.programSemesters)}</div>
              <div class="box"><b>Courses</b>${safe(report.summary?.courses)}</div>
              <div class="box"><b>Students</b>${safe(report.summary?.students)}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Sr</th><th>Program</th><th>Program Code</th><th>Semester</th><th>Students</th><th>Courses</th><th>Theory</th><th>Practical</th><th>Course Codes</th>
                </tr>
              </thead>
              <tbody>${htmlRows || `<tr><td colspan="9" style="text-align:center;">No records found</td></tr>`}</tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <MenuPageShell title="Student Count">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ width: 52, height: 52, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#dbeafe", color: "#1d4ed8" }}>
                <School />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={950}>Student Count</Typography>
                <Typography color="text.secondary">
                  Load programwise and semesterwise student counts from populated exam courses for the selected exam.
                </Typography>
              </Box>
              <Button variant="outlined" startIcon={<Refresh />} disabled={optionsLoading || loading} onClick={() => loadOptions()}>
                Refresh filters
              </Button>
            </Stack>
          </Paper>

          {(error || message) && (
            <Alert severity={error ? "error" : "success"} onClose={() => { setError(""); setMessage(""); }}>
              {error || message}
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {[
                ["academicyear", "Academic Year", options.academicyears],
                ["regulation", "Regulation", options.regulations],
                ["exam", "Exam", options.exams],
                ["examcode", "Exam Code", options.examcodes]
              ].map(([field, label, values]) => (
                <Grid item xs={12} md={3} key={field}>
                  <Autocomplete
                    options={values || []}
                    value={filters[field] || null}
                    onChange={(_, value) => updateFilter(field, value)}
                    loading={optionsLoading}
                    renderInput={(params) => <TextField {...params} label={label} size="small" />}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button variant="contained" disabled={!canLoad || loading} onClick={loadReport} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BarChart />}>
                    {loading ? "Loading..." : "Load report"}
                  </Button>
                  <Button variant="outlined" disabled={!report || loading} onClick={printPreview} startIcon={<Print />}>Print preview</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {loading && <LinearProgress sx={{ borderRadius: 3 }} />}

          {report && (
            <>
              <Grid container spacing={2}>
                {summaryCards.map((card) => (
                  <Grid item xs={12} sm={6} md={3} key={card.label}>
                    <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, borderTop: `4px solid ${card.color}` }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                        <Typography variant="h4" fontWeight={950} sx={{ color: card.color }}>{card.value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} lg={7}>
                  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: "100%" }}>
                    <Typography fontWeight={950} sx={{ mb: 2 }}>Programwise Students</Typography>
                    <Stack spacing={1.5}>
                      {(report.charts?.programwise || []).map((row, index) => (
                        <Box key={`${row.programcode}-${row.label}`}>
                          <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <Typography variant="body2" fontWeight={700}>{safe(row.label)} {row.programcode ? `(${row.programcode})` : ""}</Typography>
                            <Typography variant="body2">{number(row.studentcount)} students</Typography>
                          </Stack>
                          <Box sx={{ mt: 0.5, height: 14, bgcolor: "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${Math.max(4, (number(row.studentcount) / chartMax) * 100)}%`, bgcolor: colors[index % colors.length] }} />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} lg={5}>
                  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, height: "100%" }}>
                    <Typography fontWeight={950} sx={{ mb: 2 }}>Course Type Mix</Typography>
                    <Grid container spacing={1.5}>
                      {(report.charts?.coursetype || []).map((row, index) => (
                        <Grid item xs={12} sm={4} key={row.label}>
                          <Box sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1.5, bgcolor: `${colors[index]}12` }}>
                            <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                            <Typography variant="h5" fontWeight={950} sx={{ color: colors[index] }}>{number(row.value)}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    <Typography fontWeight={950} sx={{ mt: 3, mb: 1 }}>Semesterwise Students</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {(report.charts?.semesterwise || []).map((row, index) => (
                        <Box key={row.label} sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: `${colors[(index + 2) % colors.length]}14`, color: colors[(index + 2) % colors.length], fontWeight: 900 }}>
                          Sem {safe(row.label)}: {number(row.studentcount)}
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Typography fontWeight={950} sx={{ mb: 1 }}>Details</Typography>
                <Box sx={{ height: 520, width: "100%" }}>
                  <DataGrid
                    rows={report.details || []}
                    columns={columns}
                    slots={{ toolbar: GridToolbar }}
                    disableRowSelectionOnClick
                    getRowHeight={() => "auto"}
                    sx={{
                      "& .MuiDataGrid-cell": {
                        alignItems: "flex-start",
                        whiteSpace: "normal",
                        lineHeight: 1.35,
                        py: 1
                      },
                      "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 900 }
                    }}
                  />
                </Box>
              </Paper>
            </>
          )}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
