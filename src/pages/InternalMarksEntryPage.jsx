import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Refresh, Save } from "@mui/icons-material";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const courseLabel = (row) => row ? `${row.coursecode || ""} - ${row.course || ""} | ${row.program || ""} (${row.programcode || ""}) | ${row.regulation || ""}` : "";
const componentLabel = (row) => row ? `${row.assessmentcomponent || ""} | ${row.scoretype || ""} | ${row.assessmentgroup || ""} | Marks: ${row.marks || 0} | Pass: ${row.passmarks || 0} | Weightage: ${row.weightage || 0}` : "";
const examLabel = (row) => row ? `${row.examname || row.exam || ""} (${row.examcode || ""})` : "";
const facultyLabel = (row) => row ? `${row.facultyname || ""}${row.facultyemail ? ` (${row.facultyemail})` : ""}` : "";
const weightedMarks = (marks, weightage) => {
  const obtained = Number(marks);
  const weight = Number(weightage) || 0;
  if (Number.isNaN(obtained)) return "";
  return Number((obtained * weight).toFixed(2));
};

export default function InternalMarksEntryPage({ admin = false }) {
  const [options, setOptions] = useState({ academicyears: [], semesters: [], courses: [], componenttypes: [], scoretypes: [], exams: [], faculty: [] });
  const [filters, setFilters] = useState({ academicyear: "", examcode: "", exam: "", facultyemail: "", semester: "", coursekey: "", componenttype: "", scoretype: "", assessmentid: "" });
  const [components, setComponents] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCourse = useMemo(() => options.courses.find((row) => `${row.academicyear}||${row.regulation}||${row.programcode}||${row.semester}||${row.coursecode}` === filters.coursekey) || null, [options.courses, filters.coursekey]);
  const selectedExam = useMemo(() => (options.exams || []).find((row) => row.examcode === filters.examcode) || null, [options.exams, filters.examcode]);
  const selectedFaculty = useMemo(() => (options.faculty || []).find((row) => row.facultyemail === filters.facultyemail) || null, [options.faculty, filters.facultyemail]);
  const componentTypeOptions = useMemo(() => uniqueSorted(components.map((row) => row.componenttype)), [components]);
  const scoreTypeOptions = useMemo(() => uniqueSorted(components.filter((row) => !filters.componenttype || row.componenttype === filters.componenttype).map((row) => row.scoretype)), [components, filters.componenttype]);
  const filteredComponents = useMemo(() => components.filter((row) => (
    (!filters.componenttype || row.componenttype === filters.componenttype)
    && (!filters.scoretype || row.scoretype === filters.scoretype)
  )), [components, filters.componenttype, filters.scoretype]);
  const selectedAssessment = useMemo(() => filteredComponents.find((row) => row._id === filters.assessmentid) || null, [filteredComponents, filters.assessmentid]);

  const loadOptions = async (next = filters) => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/internal-marks-entry/options", {
        params: {
          colid: global1.colid,
          academicyear: next.academicyear,
          semester: next.semester,
          facultyemail: admin ? next.facultyemail : global1.user
        }
      });
      setOptions(res.data || { academicyears: [], semesters: [], courses: [], exams: [], faculty: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load options.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOptions(); }, []);

  const updateFilter = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value || "" };
      if (field === "academicyear") Object.assign(next, { examcode: "", exam: "", semester: "", coursekey: "", componenttype: "", scoretype: "", assessmentid: "" });
      if (field === "examcode") {
        const exam = (options.exams || []).find((row) => row.examcode === value);
        next.exam = exam?.examname || exam?.exam || "";
      }
      if (field === "facultyemail") Object.assign(next, { semester: "", coursekey: "", componenttype: "", scoretype: "", assessmentid: "" });
      if (field === "semester") Object.assign(next, { coursekey: "", componenttype: "", scoretype: "", assessmentid: "" });
      if (field === "coursekey") Object.assign(next, { componenttype: "", scoretype: "", assessmentid: "" });
      if (field === "componenttype") Object.assign(next, { scoretype: "", assessmentid: "" });
      if (field === "scoretype") Object.assign(next, { assessmentid: "" });
      if (field === "academicyear" || field === "semester" || field === "facultyemail") loadOptions(next);
      return next;
    });
    setStudents([]);
    setMarksMap({});
    if (field === "coursekey") setComponents([]);
  };

  const loadComponents = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/internal-marks-entry/components", {
        params: {
          colid: global1.colid,
          academicyear: selectedCourse.academicyear,
          regulation: selectedCourse.regulation,
          programcode: selectedCourse.programcode,
          semester: selectedCourse.semester,
          coursecode: selectedCourse.coursecode
        }
      });
      const rows = res.data?.data || [];
      setComponents(rows);
      setFilters((prev) => ({ ...prev, componenttype: rows[0]?.componenttype || "", scoretype: rows[0]?.scoretype || "", assessmentid: rows[0]?._id || "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load assessment components.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) loadComponents();
  }, [filters.coursekey]);

  const loadStudents = async () => {
    if (!selectedAssessment) return setError("Select assessment component.");
    if (!selectedExam) return setError("Select exam.");
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/internal-marks-entry/students", {
        params: { colid: global1.colid, assessmentid: selectedAssessment._id, examcode: selectedExam.examcode }
      });
      const rows = res.data?.data || [];
      setStudents(rows);
      setMarksMap(Object.fromEntries(rows.map((row) => [row._id, row.rawmarks !== "" && row.rawmarks !== undefined ? row.rawmarks : ""])));
      if (!rows.length) setMessage("No matching students found for the selected academic year, regulation, program and semester.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  const updateMarks = (studentId, value) => {
    const marks = Number(value);
    const max = Number(selectedAssessment?.marks) || 0;
    if (value !== "" && (Number.isNaN(marks) || marks < 0)) return;
    if (value !== "" && marks > max) {
      setError(`Marks cannot be more than ${max}`);
      return;
    }
    setError("");
    setMarksMap((prev) => ({ ...prev, [studentId]: value }));
  };

  const saveMarks = async () => {
    if (!selectedAssessment) return setError("Select assessment component.");
    if (!selectedExam) return setError("Select exam.");
    const rows = students.map((student) => ({
      ...student,
      rawmarks: marksMap[student._id]
    })).filter((row) => row.rawmarks !== "" && row.rawmarks !== undefined && row.rawmarks !== null);
    if (!rows.length) return setError("Enter marks for at least one student.");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/internal-marks-entry/save", {
        colid: global1.colid,
        user: global1.user,
        username: global1.name,
        exam: selectedExam.examname || selectedExam.exam || filters.exam,
        examcode: selectedExam.examcode,
        assessmentid: selectedAssessment._id,
        rows
      });
      const errors = res.data?.errors || [];
      setMessage(`Saved ${res.data?.saved || 0} component marks rows${errors.length ? ` with ${errors.length} issue(s)` : ""}.`);
      if (errors.length) setError(errors.slice(0, 5).map((item) => `${item.regno || item.row}: ${item.message}`).join(" | "));
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save marks.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
    { field: "regno", headerName: "Reg No", minWidth: 130 },
    { field: "rollno", headerName: "Roll No", minWidth: 110 },
    { field: "section", headerName: "Section", minWidth: 110 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    {
      field: "marksentry",
      headerName: `Marks / ${selectedAssessment?.marks || 0}`,
      minWidth: 160,
      renderCell: ({ row }) => (
        <TextField
          size="small"
          type="number"
          value={marksMap[row._id] ?? ""}
          onChange={(event) => updateMarks(row._id, event.target.value)}
          inputProps={{ min: 0, max: selectedAssessment?.marks || 0 }}
        />
      )
    },
    {
      field: "weightedmarks",
      headerName: "Weighted marks",
      minWidth: 140,
      renderCell: ({ row }) => weightedMarks(marksMap[row._id], selectedAssessment?.weightage)
    },
    {
      field: "passstatuscalc",
      headerName: "Pass Status",
      minWidth: 130,
      renderCell: ({ row }) => {
        const finalMarks = weightedMarks(marksMap[row._id], selectedAssessment?.weightage);
        if (finalMarks === "") return "";
        const fail = Number(finalMarks) < Number(selectedAssessment?.passmarks || 0);
        return <Chip size="small" color={fail ? "error" : "success"} label={fail ? "FAIL" : "PASS"} />;
      }
    }
  ];

  return (
    <MenuPageShell title={admin ? "Internal marks entry admin" : "Internal marks entry"} subtitle="Enter internal component marks directly into exammodel2-component-marks-crud.">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="info" onClose={() => setMessage("")}>{message}</Alert>}
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              {admin && (
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={options.faculty || []}
                    value={selectedFaculty}
                    getOptionLabel={facultyLabel}
                    onChange={(_, value) => updateFilter("facultyemail", value?.facultyemail || "")}
                    renderInput={(params) => <TextField {...params} label="Faculty" placeholder="Search faculty" />}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={admin ? 2 : 2.4}>
                <Autocomplete
                  options={options.academicyears || []}
                  value={filters.academicyear || ""}
                  onChange={(_, value) => updateFilter("academicyear", value)}
                  renderInput={(params) => <TextField {...params} label="Academic year" />}
                />
              </Grid>
              <Grid item xs={12} md={admin ? 4 : 2.4}>
                <Autocomplete
                  options={options.exams || []}
                  value={selectedExam}
                  getOptionLabel={examLabel}
                  onChange={(_, value) => updateFilter("examcode", value?.examcode || "")}
                  disabled={!filters.academicyear}
                  renderInput={(params) => <TextField {...params} label="Exam / Exam code" placeholder="Search exam" />}
                />
              </Grid>
              <Grid item xs={12} md={admin ? 2 : 2.4}>
                <Autocomplete
                  options={options.semesters || []}
                  value={filters.semester || ""}
                  onChange={(_, value) => updateFilter("semester", value)}
                  renderInput={(params) => <TextField {...params} label="Semester" />}
                />
              </Grid>
              <Grid item xs={12} md={admin ? 12 : 4.8}>
                <Autocomplete
                  options={options.courses || []}
                  value={selectedCourse}
                  getOptionLabel={courseLabel}
                  onChange={(_, value) => updateFilter("coursekey", value ? `${value.academicyear}||${value.regulation}||${value.programcode}||${value.semester}||${value.coursecode}` : "")}
                  renderInput={(params) => <TextField {...params} label="Course" placeholder="Search course" />}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField select fullWidth label="Component type" value={filters.componenttype || ""} disabled={!selectedCourse} onChange={(e) => updateFilter("componenttype", e.target.value)}>
                  <MenuItem value="">Select</MenuItem>
                  {componentTypeOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField select fullWidth label="Score type" value={filters.scoretype || ""} disabled={!filters.componenttype} onChange={(e) => updateFilter("scoretype", e.target.value)}>
                  <MenuItem value="">Select</MenuItem>
                  {scoreTypeOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={5.2}>
                <Autocomplete
                  options={filteredComponents}
                  value={selectedAssessment}
                  getOptionLabel={componentLabel}
                  onChange={(_, value) => updateFilter("assessmentid", value?._id || "")}
                  disabled={!filters.componenttype}
                  renderInput={(params) => <TextField {...params} label="Assessment component" />}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" sx={{ height: "100%" }} disabled={loading || !selectedAssessment || !selectedExam} onClick={loadStudents}>
                  {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null} Load
                </Button>
              </Grid>
            </Grid>
            {selectedAssessment && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                <Chip label={`Exam: ${examLabel(selectedExam) || "-"}`} />
                {admin && <Chip label={`Faculty: ${facultyLabel(selectedFaculty) || "-"}`} />}
                <Chip label={`Program: ${selectedAssessment.program} (${selectedAssessment.programcode})`} />
                <Chip label={`Regulation: ${selectedAssessment.regulation}`} />
                <Chip label={`Course: ${selectedAssessment.coursecode}`} />
                <Chip color="primary" label={`Component marks: ${selectedAssessment.marks || 0}`} />
                <Chip color="success" label={`Weightage: ${selectedAssessment.weightage || 0}`} />
                <Chip color="warning" label={`Pass marks: ${selectedAssessment.passmarks || 0}`} />
              </Stack>
            )}
          </CardContent>
        </Card>

        <Paper sx={{ p: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1} sx={{ p: 1 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Students: ${students.length}`} />
              <Chip label={`Entered: ${Object.values(marksMap).filter((value) => value !== "").length}`} />
              <Chip label="Target: exammodel2-component-marks-crud" color="info" />
            </Stack>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Save />} disabled={saving || !students.length || !selectedAssessment || !selectedExam} onClick={saveMarks}>
              Save marks
            </Button>
          </Stack>
          <Box sx={{ height: 620, width: "100%" }}>
            <DataGrid
              rows={students}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading || saving}
              checkboxSelection
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "internal_marks_entry" } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            />
          </Box>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function InternalMarksEntryAdminPage() {
  return <InternalMarksEntryPage admin />;
}
