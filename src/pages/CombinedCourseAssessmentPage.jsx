import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Delete, Refresh, Save } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const academicYears = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];
const semesters = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const subjectTypes = ["Major", "Minor", "IDC", "MDC", "AEC", "SEC", "VAC"];
const courseTypes = ["Theory", "Practical"];
const deliveryTypes = ["Compulsory", "Elective"];
const payTypes = ["Paid", "Unpaid"];
const electiveTypes = ["", "Open", "Programwise", "Internal", "External", "Mooc"];
const groupTypes = ["Best", "Average"];
const scoreTypes = ["Internal", "External"];
const componentTypes = ["Theory", "Practical", "Viva"];

const blankCourse = {
  academicyear: "2026-27",
  regulation: "",
  subject: "",
  type: "Major",
  semester: "1",
  program: "",
  programcode: "",
  faculty: "",
  institution: "",
  department: "",
  course: "",
  coursecode: "",
  coursetype: "Theory",
  deliverytype: "Compulsory",
  paytype: "Unpaid",
  electivetype: "",
  prerequisitecourse: "",
  prerequisitecoursecode: "",
  coursemastercode: "",
  credit: 0,
  amount: 0,
  status: "Active"
};

const blankComponent = () => ({
  id: `${Date.now()}-${Math.random()}`,
  assessmentgroup: "Internal",
  grouptype: "Average",
  scoretype: "Internal",
  componenttype: "Theory",
  assessmentcomponent: "",
  marks: 0,
  passmarks: 0,
  weightage: 1,
  credits: 0,
  status: "Active"
});

const uniqueSorted = (values) => [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

function FieldAutocomplete({ label, value, options, onChange, getOptionLabel }) {
  return (
    <Autocomplete
      options={options}
      value={value || null}
      onChange={(_, item) => onChange(item || "")}
      getOptionLabel={getOptionLabel || ((item) => String(item || ""))}
      isOptionEqualToValue={(option, selected) => JSON.stringify(option) === JSON.stringify(selected)}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

export default function CombinedCourseAssessmentPage() {
  const colid = useMemo(() => global1.colid, []);
  const [course, setCourse] = useState(blankCourse);
  const [components, setComponents] = useState([blankComponent()]);
  const [options, setOptions] = useState({ regulations: [], programs: [], subjects: [], assessmentgroups: [], assessmentcomponents: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProgram = useMemo(
    () => options.programs.find((item) => item.programcode === course.programcode) || null,
    [options.programs, course.programcode]
  );

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [course.academicyear, course.regulation, course.programcode, course.type]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [courseRes, componentRes] = await Promise.all([
        ep1.get("/api/v2/regulationcoursemap/options", { params: { colid } }),
        ep1.get("/api/v2/assessmentcomponent/options", { params: { colid } })
      ]);
      setOptions((prev) => ({
        ...prev,
        regulations: courseRes.data.regulations || [],
        programs: courseRes.data.programs || [],
        subjects: courseRes.data.subjects || [],
        assessmentgroups: componentRes.data.assessmentgroups || [],
        assessmentcomponents: componentRes.data.assessmentcomponents || []
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dropdown data");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    if (!course.programcode || !course.type) return;
    try {
      const params = { colid, type: course.type, programcode: course.programcode };
      if (course.academicyear) params.academicyear = course.academicyear;
      if (course.regulation) params.regulation = course.regulation;
      const res = await ep1.get("/api/v2/regulationcoursemap/options", { params });
      setOptions((prev) => ({ ...prev, subjects: res.data.subjects || [] }));
    } catch (err) {
      setOptions((prev) => ({ ...prev, subjects: [] }));
    }
  };

  const updateCourse = (field, value) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  const selectProgram = (program) => {
    setCourse((prev) => ({
      ...prev,
      program: program?.program || "",
      programcode: program?.programcode || "",
      faculty: program?.faculty || prev.faculty || "",
      institution: program?.institution || prev.institution || "",
      department: program?.department || prev.department || "",
      subject: ""
    }));
  };

  const updateComponent = (id, field, value) => {
    setComponents((prev) => prev.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addComponent = () => {
    setComponents((prev) => [...prev, { ...blankComponent(), componenttype: course.coursetype || "Theory", credits: Number(course.credit) || 0 }]);
  };

  const validate = () => {
    if (!course.academicyear) return "Academic year is required";
    if (!course.regulation) return "Regulation is required";
    if (!course.program) return "Program is required";
    if (!course.programcode) return "Program code is required";
    if (!course.subject) return "Subject is required";
    if (!course.course) return "Course is required";
    if (!course.coursecode) return "Course code is required";
    const filled = components.filter((row) => row.assessmentcomponent || row.componenttype || row.assessmentgroup);
    for (const row of filled) {
      const weightage = Number(row.weightage);
      if (Number.isNaN(weightage) || weightage < 0 || weightage > 1) return "Weightage must be between 0 and 1";
      if (!row.assessmentcomponent) return "Assessment component is required for all component rows";
      if (!row.componenttype) return "Component type is required for all component rows";
    }
    return "";
  };

  const save = async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      setMessage("");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        colid,
        user: global1.user,
        course,
        components: components.map(({ id, ...row }) => ({ ...row, credits: row.credits || course.credit }))
      };
      const res = await ep1.post("/api/v2/combined-course-assessment", payload);
      setMessage(res.data?.message || "Course map and assessment components saved");
      setComponents([blankComponent()]);
    } catch (err) {
      const details = err.response?.data?.errors?.map((item) => `Row ${item.rowNumber}: ${item.message}`).join("; ");
      setError(details || err.response?.data?.message || "Unable to save combined entry");
    } finally {
      setSaving(false);
    }
  };

  const componentColumns = [
    {
      field: "assessmentgroup",
      headerName: "Group",
      width: 160,
      renderCell: (params) => (
        <Autocomplete
          freeSolo
          fullWidth
          size="small"
          options={uniqueSorted([...options.assessmentgroups, "Internal", "External"])}
          value={params.row.assessmentgroup || ""}
          onChange={(_, value) => updateComponent(params.row.id, "assessmentgroup", value || "")}
          onInputChange={(_, value) => updateComponent(params.row.id, "assessmentgroup", value || "")}
          renderInput={(p) => <TextField {...p} />}
        />
      )
    },
    {
      field: "grouptype",
      headerName: "Group type",
      width: 140,
      renderCell: (params) => <TextField select fullWidth size="small" value={params.row.grouptype || ""} onChange={(e) => updateComponent(params.row.id, "grouptype", e.target.value)}>{groupTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
    },
    {
      field: "scoretype",
      headerName: "Score type",
      width: 140,
      renderCell: (params) => <TextField select fullWidth size="small" value={params.row.scoretype || ""} onChange={(e) => updateComponent(params.row.id, "scoretype", e.target.value)}>{scoreTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
    },
    {
      field: "componenttype",
      headerName: "Component type",
      width: 150,
      renderCell: (params) => <TextField select fullWidth size="small" value={params.row.componenttype || ""} onChange={(e) => updateComponent(params.row.id, "componenttype", e.target.value)}>{componentTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
    },
    {
      field: "assessmentcomponent",
      headerName: "Assessment component",
      width: 230,
      renderCell: (params) => (
        <Autocomplete
          freeSolo
          fullWidth
          size="small"
          options={options.assessmentcomponents || []}
          value={params.row.assessmentcomponent || ""}
          onChange={(_, value) => updateComponent(params.row.id, "assessmentcomponent", value || "")}
          onInputChange={(_, value) => updateComponent(params.row.id, "assessmentcomponent", value || "")}
          renderInput={(p) => <TextField {...p} />}
        />
      )
    },
    { field: "marks", headerName: "Marks", width: 110, renderCell: (params) => <TextField fullWidth size="small" type="number" value={params.row.marks ?? 0} onChange={(e) => updateComponent(params.row.id, "marks", e.target.value)} /> },
    { field: "passmarks", headerName: "Pass marks", width: 120, renderCell: (params) => <TextField fullWidth size="small" type="number" value={params.row.passmarks ?? 0} onChange={(e) => updateComponent(params.row.id, "passmarks", e.target.value)} /> },
    { field: "weightage", headerName: "Weightage", width: 120, renderCell: (params) => <TextField fullWidth size="small" type="number" inputProps={{ step: "0.01", min: 0, max: 1 }} value={params.row.weightage ?? 1} onChange={(e) => updateComponent(params.row.id, "weightage", e.target.value)} /> },
    { field: "credits", headerName: "Credits", width: 110, renderCell: (params) => <TextField fullWidth size="small" type="number" value={params.row.credits ?? course.credit ?? 0} onChange={(e) => updateComponent(params.row.id, "credits", e.target.value)} /> },
    {
      field: "delete",
      headerName: "",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <IconButton color="error" onClick={() => setComponents((prev) => prev.filter((row) => row.id !== params.row.id))}>
          <Delete />
        </IconButton>
      )
    }
  ];

  return (
    <MenuPageShell title="Combined Course and Assessment">
      <Stack spacing={2}>
        {loading && <LinearProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}

        <Card sx={{ borderRadius: 2, boxShadow: "0 8px 22px rgba(30,64,175,.08)" }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Regulation Course Map Details</Typography>
                <Typography variant="body2" color="text.secondary">Program code, faculty, institution and department are auto selected from Program Management.</Typography>
              </Box>
              <Button variant="outlined" startIcon={<Refresh />} onClick={loadOptions}>Refresh dropdowns</Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <Autocomplete freeSolo options={academicYears} value={course.academicyear} onChange={(_, value) => updateCourse("academicyear", value || "")} onInputChange={(_, value) => updateCourse("academicyear", value || "")} renderInput={(params) => <TextField {...params} label="Academic year" required />} />
              </Grid>
              <Grid item xs={12} md={2.5}>
                <FieldAutocomplete label="Regulation" value={course.regulation} options={(options.regulations || []).map((item) => item.regulation || item)} onChange={(value) => updateCourse("regulation", value)} />
              </Grid>
              <Grid item xs={12} md={3.5}>
                <FieldAutocomplete label="Program" value={selectedProgram} options={options.programs || []} getOptionLabel={(item) => item?.program ? `${item.program} (${item.programcode || ""})` : ""} onChange={selectProgram} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth label="Program code" value={course.programcode} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Semester" value={course.semester} onChange={(e) => updateCourse("semester", e.target.value)}>{semesters.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select fullWidth label="Type" value={course.type} onChange={(e) => updateCourse("type", e.target.value)}>{subjectTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete freeSolo options={options.subjects || []} value={course.subject} onChange={(_, value) => updateCourse("subject", value || "")} onInputChange={(_, value) => updateCourse("subject", value || "")} renderInput={(params) => <TextField {...params} label="Subject / Group" required />} />
              </Grid>
              <Grid item xs={12} md={3.5}><TextField fullWidth required label="Course" value={course.course} onChange={(e) => updateCourse("course", e.target.value)} /></Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth required label="Course code" value={course.coursecode} onChange={(e) => updateCourse("coursecode", e.target.value)} /></Grid>
              <Grid item xs={12} md={1.5}><TextField select fullWidth label="Course type" value={course.coursetype} onChange={(e) => updateCourse("coursetype", e.target.value)}>{courseTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Credit" value={course.credit} onChange={(e) => updateCourse("credit", e.target.value)} /></Grid>
              <Grid item xs={12} md={1.5}><TextField fullWidth type="number" label="Amount" value={course.amount} onChange={(e) => updateCourse("amount", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Delivery" value={course.deliverytype} onChange={(e) => updateCourse("deliverytype", e.target.value)}>{deliveryTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Pay type" value={course.paytype} onChange={(e) => updateCourse("paytype", e.target.value)}>{payTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Elective type" value={course.electivetype} onChange={(e) => updateCourse("electivetype", e.target.value)}>{electiveTypes.map((item) => <MenuItem key={item || "blank"} value={item}>{item || "None"}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Prerequisite course" value={course.prerequisitecourse} onChange={(e) => updateCourse("prerequisitecourse", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Prerequisite code" value={course.prerequisitecoursecode} onChange={(e) => updateCourse("prerequisitecoursecode", e.target.value)} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Course master code" value={course.coursemastercode} onChange={(e) => updateCourse("coursemastercode", e.target.value)} /></Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth label="Institution" value={course.institution} onChange={(e) => updateCourse("institution", e.target.value)} /></Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth label="Faculty" value={course.faculty} onChange={(e) => updateCourse("faculty", e.target.value)} /></Grid>
              <Grid item xs={12} md={2.5}><TextField fullWidth label="Department" value={course.department} onChange={(e) => updateCourse("department", e.target.value)} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: "0 8px 22px rgba(30,64,175,.08)" }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Assessment Components</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                  <Chip label={`${course.course || "Course"} ${course.coursecode ? `(${course.coursecode})` : ""}`} />
                  <Chip label={`Credits: ${course.credit || 0}`} />
                </Stack>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<Add />} onClick={addComponent}>Add component</Button>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving} onClick={save}>Save all</Button>
              </Stack>
            </Stack>
            {saving && <LinearProgress sx={{ mb: 2 }} />}
            <Paper variant="outlined" sx={{ height: 430, width: "100%", borderRadius: 2 }}>
              <DataGrid
                rows={components}
                columns={componentColumns}
                getRowId={(row) => row.id}
                components={{ Toolbar: GridToolbar }}
                disableRowSelectionOnClick
                sx={{ "& .MuiDataGrid-cell": { py: 1 }, "& .MuiInputBase-root": { fontSize: 13 } }}
              />
            </Paper>
          </CardContent>
        </Card>
      </Stack>
    </MenuPageShell>
  );
}
