import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Checkbox, Grid, LinearProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const filterFields = [
  { key: "academicyear", label: "Academic Year" },
  { key: "regulation", label: "Regulation" },
  { key: "exam", label: "Exam" },
  { key: "examcode", label: "Exam Code" },
  { key: "program", label: "Program" },
  { key: "programcode", label: "Program Code" },
  { key: "type", label: "Type" },
  { key: "subject", label: "Subject" },
  { key: "semester", label: "Semester" },
  { key: "course", label: "Course" },
  { key: "coursecode", label: "Course Code" },
  { key: "section", label: "Section" },
  { key: "examsection", label: "Exam Section" },
  { key: "applied", label: "Applied" },
  { key: "admitcardeligible", label: "Admit Eligible" },
  { key: "attended", label: "Attended" },
  { key: "attendance", label: "Attendance" },
  { key: "fees", label: "Fees" },
  { key: "disciplinary", label: "Disciplinary" },
  { key: "examdate", label: "Exam Date" },
  { key: "examslot", label: "Exam Slot" },
  { key: "campus", label: "Campus" },
  { key: "building", label: "Building" },
  { key: "examroom", label: "Exam Room" },
  { key: "batch", label: "Batch / Admission Year" }
];

const blankFilter = { field: "academicyear", values: [] };
const fieldLabel = (key) => filterFields.find((item) => item.key === key)?.label || key;
const valueText = (value) => String(value || "").trim();

const courseComponents = (course) => (Array.isArray(course.components) && course.components.length ? course.components : ["Section-A", "Section-B", "Pr"]);

function BatchRows({ students, courses }) {
  const grouped = useMemo(() => {
    const map = new Map();
    students.forEach((student) => {
      const batch = valueText(student.batch) || "Not specified";
      if (!map.has(batch)) map.set(batch, []);
      map.get(batch).push(student);
    });
    return [...map.entries()];
  }, [students]);

  return grouped.map(([batch, batchStudents]) => (
    <React.Fragment key={batch}>
      <tr className="batch-row">
        <td colSpan={4 + courses.reduce((sum, course) => sum + courseComponents(course).length, 0)}>Batch-{batch}</td>
      </tr>
      {batchStudents.map((student) => (
        <tr key={student.id}>
          <td className="center">{student.serial}</td>
          <td>{student.enrollmentno}</td>
          <td>{student.student}</td>
          <td>{student.fathername}</td>
          {courses.map((course) => {
            const courseKey = valueText(course.coursecode) || valueText(course.course);
            const marks = student.courses?.[courseKey] || {};
            return (
              <React.Fragment key={`${student.id}-${courseKey}`}>
                {courseComponents(course).map((component) => (
                  <td className="center" key={`${student.id}-${courseKey}-${component}`}>{marks[component] || ""}</td>
                ))}
              </React.Fragment>
            );
          })}
        </tr>
      ))}
    </React.Fragment>
  ));
}

function RollListPrint({ report }) {
  const header = report?.header || {};
  const courses = report?.courses || [];
  const students = report?.students || [];
  const totals = report?.totals || [];
  const totalMap = new Map(totals.map((item) => [valueText(item.coursecode), item]));

  return (
    <Box id="roll-list-report-print" sx={{ bgcolor: "#fff", color: "#000", p: 1.5, border: "1px solid #cbd5e1", mx: "auto", overflowX: "auto" }}>
      <style>{`
        #roll-list-report-print, #roll-list-report-print * { color: #000 !important; }
        #roll-list-report-print .roll-page { width: 277mm; min-height: 190mm; margin: 0 auto; font-family: Arial, sans-serif; font-size: 9px; line-height: 1.15; }
        #roll-list-report-print .title { text-align: center; font-weight: 700; font-size: 13px; margin: 0; }
        #roll-list-report-print .subtitle { text-align: center; font-weight: 700; font-size: 11px; margin: 2px 0 8px; }
        #roll-list-report-print .meta { display: grid; grid-template-columns: 1fr; gap: 2px; font-size: 9px; margin-bottom: 5px; }
        #roll-list-report-print .meta-line { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
        #roll-list-report-print .meta strong { font-weight: 700; }
        #roll-list-report-print table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        #roll-list-report-print th, #roll-list-report-print td { border: 1px solid #000; padding: 2px 3px; vertical-align: middle; word-break: break-word; }
        #roll-list-report-print th { font-weight: 700; text-align: center; }
        #roll-list-report-print .sno { width: 8mm; }
        #roll-list-report-print .enroll { width: 29mm; }
        #roll-list-report-print .student { width: 43mm; }
        #roll-list-report-print .guardian { width: 39mm; }
        #roll-list-report-print .component { width: 10mm; }
        #roll-list-report-print .course-head { height: 24mm; font-size: 8px; line-height: 1.1; }
        #roll-list-report-print .course-code { display: block; font-weight: 700; margin-bottom: 2px; }
        #roll-list-report-print .center { text-align: center; }
        #roll-list-report-print .batch-row td { font-weight: 700; background: #fff; text-align: left; }
        #roll-list-report-print .total-label { font-weight: 700; text-align: right; }
        #roll-list-report-print .footer { display: flex; justify-content: space-between; margin-top: 20mm; font-size: 9px; }
        @media print {
          @page { size: A4 landscape; margin: 7mm; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          #roll-list-report-print, #roll-list-report-print * { visibility: visible; }
          #roll-list-report-print { position: absolute; left: 0; top: 0; width: 283mm !important; max-width: 283mm !important; border: none !important; padding: 0 !important; overflow: visible !important; }
          #roll-list-report-print .roll-page { width: 283mm !important; max-width: 283mm !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <Box className="roll-page">
        <Typography className="title">{header.institutionname || "Institution"}</Typography>
        <Typography className="subtitle">Roll List</Typography>
        <Box className="meta">
          <Box className="meta-line"><span><strong>Exam Name :</strong> {header.examName || "-"}</span></Box>
          <Box className="meta-line">
            <span><strong>Institute:</strong> {header.institute || "-"}</span>
            <span><strong>Exam Centre :</strong> {header.examCentre || "-"}</span>
          </Box>
          <Box className="meta-line">
            <span><strong>Course :</strong> {header.course || "-"}</span>
            <span><strong>Year:</strong> {header.year || "-"}</span>
            <span><strong>Status :</strong> {header.status || "-"}</span>
          </Box>
        </Box>
        <table>
          <thead>
            <tr>
              <th rowSpan={2} className="sno">S. No.</th>
              <th rowSpan={2} className="enroll">Enrollment No</th>
              <th rowSpan={2} className="student">Name of Student's</th>
              <th rowSpan={2} className="guardian">S/D/W/O</th>
              {courses.map((course) => (
                <th key={course.coursecode || course.course} colSpan={courseComponents(course).length} className="course-head">
                  <span className="course-code">{course.coursecode || "-"}</span>
                  {course.course || "-"}
                </th>
              ))}
            </tr>
            <tr>
              {courses.map((course) => (
                <React.Fragment key={`${course.coursecode || course.course}-sub`}>
                  {courseComponents(course).map((component) => <th className="component" key={`${course.coursecode || course.course}-${component}`}>{component}</th>)}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            <BatchRows students={students} courses={courses} />
            <tr>
              <td colSpan={4} className="total-label">Theory</td>
              {courses.map((course) => {
                const total = totalMap.get(valueText(course.coursecode)) || {};
                return (
                  <React.Fragment key={`${course.coursecode || course.course}-theory`}>
                    {courseComponents(course).map((component) => (
                      <td className="center" key={`${course.coursecode || course.course}-theory-${component}`}>{component === "Pr" ? "-" : (total.components?.[component] || "-")}</td>
                    ))}
                  </React.Fragment>
                );
              })}
            </tr>
            <tr>
              <td colSpan={4} className="total-label">Practical</td>
              {courses.map((course) => {
                const total = totalMap.get(valueText(course.coursecode)) || {};
                return (
                  <React.Fragment key={`${course.coursecode || course.course}-practical`}>
                    {courseComponents(course).map((component) => (
                      <td className="center" key={`${course.coursecode || course.course}-practical-${component}`}>{component === "Pr" ? (total.components?.[component] || "-") : "-"}</td>
                    ))}
                  </React.Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
        <Box className="footer">
          <span>In-charge (Conduct)</span>
          <span>Page No. 1 of 1</span>
        </Box>
      </Box>
    </Box>
  );
}

export default function ConductExamRollListReportPage() {
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ ...blankFilter }]);
  const [report, setReport] = useState(null);
  const [headerInputs, setHeaderInputs] = useState({ institute: "", examCentre: "", statusLabel: "Main" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/conductexam/examroll-list-report-options", { params: { colid: global1.colid } });
    setOptions(res.data?.options || {});
  };

  useEffect(() => {
    loadOptions().catch((err) => setError(err.response?.data?.message || "Unable to load report filters."));
  }, []);

  const selectedFields = useMemo(() => filters.map((item) => item.field), [filters]);
  const canAddFilter = selectedFields.length < filterFields.length;
  const summary = report?.summary || {};

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const addFilter = () => {
    const nextField = filterFields.find((item) => !selectedFields.includes(item.key))?.key || "academicyear";
    setFilters((prev) => [...prev, { field: nextField, values: [] }]);
  };

  const removeFilter = (index) => {
    setFilters((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const activeFilters = filters
        .map((item) => ({ field: item.field, values: (item.values || []).map(valueText).filter(Boolean) }))
        .filter((item) => item.field && item.values.length);
      const res = await ep1.get("/api/v2/conductexam/examroll-list-report", {
        params: {
          colid: global1.colid,
          filters: JSON.stringify(activeFilters),
          institute: headerInputs.institute,
          examCentre: headerInputs.examCentre,
          statusLabel: headerInputs.statusLabel
        }
      });
      setReport(res.data || null);
      setOptions(res.data?.options || options);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate roll list report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuPageShell title="Roll List Report">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper className="no-print" elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Roll List Report</Typography>
              <Typography color="text.secondary">Generate the exam roll list with batch grouping, course-wise paper columns, totals, and A4 landscape print.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addFilter} disabled={!canAddFilter || loading}>Add Filter</Button>
              <Button variant="contained" onClick={loadReport} disabled={loading}>{loading ? "Generating..." : "Generate"}</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!report}>Print</Button>
            </Stack>
          </Stack>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>

        {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper className="no-print" elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Institute override" value={headerInputs.institute} onChange={(e) => setHeaderInputs({ ...headerInputs, institute: e.target.value })} /></Grid>
            <Grid item xs={12} md={5}><TextField fullWidth label="Exam Centre" value={headerInputs.examCentre} onChange={(e) => setHeaderInputs({ ...headerInputs, examCentre: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Status label" value={headerInputs.statusLabel} onChange={(e) => setHeaderInputs({ ...headerInputs, statusLabel: e.target.value })} /></Grid>
          </Grid>
        </Paper>

        <Paper className="no-print" elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            {filters.map((item, index) => {
              const availableFields = filterFields.filter((field) => field.key === item.field || !selectedFields.includes(field.key));
              return (
                <React.Fragment key={`${item.field}-${index}`}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Filter Field"
                      value={item.field}
                      onChange={(event) => updateFilter(index, { field: event.target.value, values: [] })}
                    >
                      {availableFields.map((field) => <MenuItem key={field.key} value={field.key}>{field.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={options[item.field] || []}
                      value={item.values || []}
                      onChange={(_, value) => updateFilter(index, { values: value })}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}><Checkbox checked={selected} />{option}</li>
                      )}
                      renderInput={(params) => <TextField {...params} label={`${fieldLabel(item.field)} values`} />}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Button fullWidth color="error" variant="outlined" onClick={() => removeFilter(index)} disabled={filters.length === 1} sx={{ height: 56 }}>
                      <DeleteIcon />
                    </Button>
                  </Grid>
                </React.Fragment>
              );
            })}
          </Grid>
        </Paper>

        {report && (
          <Grid className="no-print" container spacing={2} sx={{ mb: 2 }}>
            {[
              ["Students", summary.studentCount || 0],
              ["Courses", summary.courseCount || 0],
              ["Theory Entries", summary.theoryTotal || 0],
              ["Practical Entries", summary.practicalTotal || 0]
            ].map(([label, value]) => (
              <Grid item xs={12} sm={6} md={3} key={label}>
                <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                  <Typography color="text.secondary" variant="body2">{label}</Typography>
                  <Typography variant="h5" fontWeight={900}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {report ? (
          <RollListPrint report={report} />
        ) : (
          <Paper className="no-print" elevation={0} sx={{ p: 4, textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: 2 }}>
            <Typography fontWeight={800}>Add filters and click Generate to create the roll list.</Typography>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}
