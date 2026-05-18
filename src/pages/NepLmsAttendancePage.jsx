import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { Add, ArrowBack, Delete, Refresh, Save } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";

const assignmentFilterFields = [
  { field: "academicyear", label: "Academic Year" },
  { field: "program", label: "Program" },
  { field: "programcode", label: "Program Code" },
  { field: "course", label: "Course" },
  { field: "coursecode", label: "Course Code" },
  { field: "subject", label: "Major" },
  { field: "semester", label: "Semester" },
  { field: "facultydepartment", label: "Department" },
  { field: "status", label: "Status" }
];

const studentFilterFields = [
  { field: "name", label: "Name" },
  { field: "email", label: "Email" },
  { field: "phone", label: "Phone" },
  { field: "regno", label: "Reg No" },
  { field: "programcode", label: "Program Code" },
  { field: "admissionyear", label: "Academic Year" },
  { field: "Major", label: "Major" },
  { field: "semester", label: "Semester" },
  { field: "section", label: "Section" },
  { field: "category", label: "Category" },
  { field: "gender", label: "Gender" }
];

const makeFilter = (field = "academicyear") => ({ id: `${Date.now()}-${Math.random()}`, field, value: "" });
const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b));
const cleanText = (value) => String(value || "").trim().toLowerCase();
const fieldsMatch = (left, right) => cleanText(left) === cleanText(right);
const optionalFieldsMatch = (left, right) => !cleanText(left) || !cleanText(right) || fieldsMatch(left, right);
const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const monthTitle = (year, month) => new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function NepLmsAttendancePage() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classFilters, setClassFilters] = useState([makeFilter()]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentFilters, setStudentFilters] = useState([makeFilter("name")]);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceType, setAttendanceType] = useState("Regular");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    if (selectedClass) loadStudents(selectedClass);
  }, [selectedClass, attendanceType]);

  const loadContext = async () => {
    try {
      setLoading(true);
      setError("");
      const [workloadRes, timetableRes] = await Promise.all([
        ep1.get("/api/v2/workloadassignment", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/neplms/timetable", { params: { colid: global1.colid } })
      ]);
      const currentUser = cleanText(global1.user);
      const assignedRows = (workloadRes.data?.data || []).filter((row) => (
        currentUser && cleanText(row.facultyemail) === currentUser
      ));
      setAssignments(assignedRows);
      setClasses(timetableRes.data?.data || []);
      if (!assignedRows.length) {
        setError(`No assigned courses found for faculty email ${global1.user || "-"}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load attendance context");
    } finally {
      setLoading(false);
    }
  };

  const valueOptions = (rows, field) => uniqueSorted(rows.map((row) => row[field]));

  const applyFilters = (rows, filters) => rows.filter((row) => filters.every((filter) => {
    if (!filter.field || !filter.value) return true;
    return String(row[filter.field] || "").toLowerCase() === String(filter.value).toLowerCase();
  }));

  const filteredAssignments = useMemo(() => applyFilters(assignments, classFilters), [assignments, classFilters]);

  const filteredClasses = useMemo(() => {
    if (!filteredAssignments.length) return [];
    const currentUser = cleanText(global1.user);
    return classes.filter((classRow) => {
      const classFacultyEmail = cleanText(classRow.facultyemail);
      if (classFacultyEmail && classFacultyEmail !== currentUser) return false;

      return filteredAssignments.some((assignment) => (
        fieldsMatch(assignment.academicyear, classRow.academicyear)
        && fieldsMatch(assignment.programcode, classRow.programcode)
        && optionalFieldsMatch(assignment.regulation, classRow.regulation)
        && optionalFieldsMatch(assignment.program, classRow.program)
        && fieldsMatch(assignment.subject, classRow.major)
        && fieldsMatch(assignment.semester, classRow.semester)
        && fieldsMatch(assignment.coursecode, classRow.coursecode)
        && (!classFacultyEmail || fieldsMatch(assignment.facultyemail, classRow.facultyemail))
      ));
    });
  }, [classes, filteredAssignments]);
  const filteredStudents = useMemo(() => applyFilters(students, studentFilters), [students, studentFilters]);

  const assignmentSummary = useMemo(() => ({
    courses: uniqueSorted(filteredAssignments.map((row) => row.coursecode)).length,
    years: uniqueSorted(filteredAssignments.map((row) => row.academicyear)).join(", "),
    majors: uniqueSorted(filteredAssignments.map((row) => row.subject)).length
  }), [filteredAssignments]);

  const calendarMonths = useMemo(() => {
    const monthMap = new Map();
    filteredClasses.forEach((row) => {
      const parsed = parseDate(row.classdate);
      if (!parsed) return;
      const monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { key: monthKey, year: parsed.getFullYear(), month: parsed.getMonth(), days: new Map() });
      }
      const month = monthMap.get(monthKey);
      const day = parsed.getDate();
      if (!month.days.has(day)) month.days.set(day, []);
      month.days.get(day).push(row);
    });

    return [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key)).map((month) => {
      const firstDay = new Date(month.year, month.month, 1).getDay();
      const totalDays = new Date(month.year, month.month + 1, 0).getDate();
      const cells = [];
      for (let index = 0; index < firstDay; index += 1) cells.push({ key: `blank-${index}`, blank: true });
      for (let day = 1; day <= totalDays; day += 1) {
        cells.push({
          key: `${month.key}-${day}`,
          day,
          items: (month.days.get(day) || []).sort((a, b) => String(a.classtime).localeCompare(String(b.classtime)))
        });
      }
      while (cells.length % 7 !== 0) cells.push({ key: `blank-end-${cells.length}`, blank: true });
      return { ...month, title: monthTitle(month.year, month.month), cells };
    });
  }, [filteredClasses]);

  const updateFilter = (setter) => (id, key, value) => {
    setter((prev) => prev.map((filter) => filter.id === id ? { ...filter, [key]: value, ...(key === "field" ? { value: "" } : {}) } : filter));
  };

  const removeFilter = (setter, defaultField) => (id) => {
    setter((prev) => prev.length === 1 ? [makeFilter(defaultField)] : prev.filter((filter) => filter.id !== id));
  };

  const loadStudents = async (row) => {
    try {
      setStudentLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/neplms/attendance/students", {
        params: {
          colid: global1.colid,
          classid: row._id,
          type: attendanceType,
          academicyear: row.academicyear,
          semester: row.semester,
          major: row.major,
          programcode: row.programcode
        }
      });
      const list = res.data?.data || [];
      setStudents(list);
      const nextSelected = {};
      const nextAttendance = {};
      list.forEach((student) => {
        nextSelected[student._id] = true;
        nextAttendance[student._id] = student.existingAttendance === 0 ? 0 : 1;
      });
      setSelectedStudents(nextSelected);
      setAttendanceMap(nextAttendance);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setStudentLoading(false);
    }
  };

  const setAllSelected = (value) => {
    const next = {};
    filteredStudents.forEach((student) => { next[student._id] = value; });
    setSelectedStudents((prev) => ({ ...prev, ...next }));
  };

  const setAllAttendance = (value) => {
    const next = {};
    filteredStudents.forEach((student) => { next[student._id] = value; });
    setAttendanceMap((prev) => ({ ...prev, ...next }));
  };

  const saveAttendance = async () => {
    if (!selectedClass) {
      setError("Select a class first");
      return;
    }
    const selected = students
      .filter((student) => selectedStudents[student._id])
      .map((student) => ({ ...student, studentid: student._id, attendance: attendanceMap[student._id] === 0 ? 0 : 1 }));
    if (!selected.length) {
      setError("Select at least one student");
      return;
    }
    try {
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/neplms/attendance", {
        colid: global1.colid,
        user: global1.user,
        classInfo: selectedClass,
        type: attendanceType,
        comments,
        students: selected
      });
      setMessage(`${res.data?.saved || 0} attendance records saved`);
      loadStudents(selectedClass);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save attendance");
    }
  };

  const selectedCount = filteredStudents.filter((student) => selectedStudents[student._id]).length;
  const presentCount = filteredStudents.filter((student) => selectedStudents[student._id] && attendanceMap[student._id] !== 0).length;
  const absentCount = selectedCount - presentCount;

  const renderFilterPanel = ({ title, filters, fields, rows, onAdd, onUpdate, onRemove }) => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={onAdd}>Add Filter</Button>
      </Stack>
      <Grid container spacing={2}>
        {filters.map((filter) => {
          const fieldMeta = fields.find((item) => item.field === filter.field);
          return (
            <React.Fragment key={filter.id}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Field</InputLabel>
                  <Select label="Field" value={filter.field} onChange={(event) => onUpdate(filter.id, "field", event.target.value)}>
                    {fields.map((item) => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                {fieldMeta?.type === "date" ? (
                  <TextField
                    fullWidth
                    type="date"
                    label="Value"
                    value={filter.value}
                    onChange={(event) => onUpdate(filter.id, "value", event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Value</InputLabel>
                    <Select label="Value" value={filter.value} onChange={(event) => onUpdate(filter.id, "value", event.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {valueOptions(rows, filter.field).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth color="error" variant="outlined" startIcon={<Delete />} onClick={() => onRemove(filter.id)} sx={{ height: 56 }}>Remove</Button>
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>
    </Paper>
  );

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Attendance</Typography>
          <Typography variant="body2" color="text.secondary">Select assigned classes, load students and mark present or absent.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/dashdashfacnew" variant="outlined" startIcon={<ArrowBack />}>Back</Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadContext}>Reload</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Assigned Courses: ${assignmentSummary.courses}`} />
          <Chip label={`Majors: ${assignmentSummary.majors}`} />
          <Chip label={`Years: ${assignmentSummary.years || "-"}`} />
          <Chip label={`Classes: ${filteredClasses.length}`} />
          {loading && <Chip color="warning" label="Loading..." />}
        </Stack>
      </Paper>

      {renderFilterPanel({
        title: "Assigned Course Filters",
        filters: classFilters,
        fields: assignmentFilterFields,
        rows: assignments,
        onAdd: () => setClassFilters((prev) => [...prev, makeFilter()]),
        onUpdate: updateFilter(setClassFilters),
        onRemove: removeFilter(setClassFilters, "academicyear")
      })}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Assigned Courses</Typography>
          <Chip label={`${filteredAssignments.length} courses`} />
        </Stack>
        {filteredAssignments.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center", border: "1px dashed #cbd5e1" }}>
            <Typography variant="body2">No assigned courses found for the selected filters.</Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {filteredAssignments.map((assignment) => (
              <Grid item xs={12} md={6} lg={4} key={assignment._id}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fafc" }}>
                  <Typography fontWeight={800}>{assignment.coursecode} - {assignment.course}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assignment.academicyear} | {assignment.programcode || assignment.program} | Sem {assignment.semester}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Major: {assignment.subject || "-"} | Faculty: {assignment.facultyname || "-"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Class Calendar</Typography>
        {calendarMonths.length === 0 && (
          <Box sx={{ p: 2, textAlign: "center", border: "1px dashed #cbd5e1" }}>
            <Typography variant="body2">No timetable classes found for the selected filters.</Typography>
          </Box>
        )}
        <Stack spacing={2}>
          {calendarMonths.map((month) => (
            <Box key={month.key} sx={{ border: "1px solid #cbd5e1", overflowX: "auto" }}>
              <Box sx={{ bgcolor: "#102a43", color: "#fff", textAlign: "center", py: 1 }}>
                <Typography fontWeight={800}>{month.title}</Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(145px, 1fr))", minWidth: 1015 }}>
                {weekdayLabels.map((label) => (
                  <Box key={label} sx={{ bgcolor: "#e5edf5", p: 0.75, textAlign: "center", borderRight: "1px solid #cbd5e1" }}>
                    <Typography variant="caption" fontWeight={800}>{label}</Typography>
                  </Box>
                ))}
                {month.cells.map((cell) => (
                  <Box key={cell.key} sx={{ minHeight: 135, p: 0.75, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", bgcolor: cell.blank ? "#f8fafc" : "#fff" }}>
                    {!cell.blank && (
                      <>
                        <Typography variant="caption" fontWeight={900} display="block" sx={{ mb: 0.5 }}>{cell.day}</Typography>
                        <Stack spacing={0.5}>
                          {cell.items.map((item) => {
                            const active = selectedClass?._id === item._id;
                            return (
                              <Box
                                key={item._id}
                                onClick={() => setSelectedClass(item)}
                                sx={{
                                  cursor: "pointer",
                                  bgcolor: active ? "#dcfce7" : "#eef2ff",
                                  border: active ? "1px solid #16a34a" : "1px solid #c7d2fe",
                                  borderLeft: active ? "4px solid #16a34a" : "4px solid #4f46e5",
                                  borderRadius: 1,
                                  px: 0.8,
                                  py: 0.6
                                }}
                              >
                                <Typography variant="caption" fontWeight={900} display="block">{item.classtime || "-"} | {item.coursecode}</Typography>
                                <Typography variant="caption" display="block">{item.course || item.topic || "-"}</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">Sem {item.semester} | {item.major}</Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>

      {selectedClass && (
        <>
          <Paper sx={{ p: 2, mb: 2, borderLeft: "5px solid #2563eb" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6">{selectedClass.coursecode} - {selectedClass.course}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedClass.classdate} {selectedClass.classtime} | {selectedClass.programcode || selectedClass.program} | Sem {selectedClass.semester} | {selectedClass.major}
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={attendanceType} onChange={(event) => setAttendanceType(event.target.value)}>
                    <MenuItem value="Regular">Regular</MenuItem>
                    <MenuItem value="Supplementary">Supplementary</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Comments" value={comments} onChange={(event) => setComments(event.target.value)} sx={{ minWidth: 260 }} />
              </Stack>
            </Stack>
          </Paper>

          {renderFilterPanel({
            title: "Student Filters",
            filters: studentFilters,
            fields: studentFilterFields,
            rows: students,
            onAdd: () => setStudentFilters((prev) => [...prev, makeFilter("name")]),
            onUpdate: updateFilter(setStudentFilters),
            onRemove: removeFilter(setStudentFilters, "name")
          })}

          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Students: ${filteredStudents.length}`} />
                <Chip color="primary" label={`Selected: ${selectedCount}`} />
                <Chip color="success" label={`Present: ${presentCount}`} />
                <Chip color="error" label={`Absent: ${absentCount}`} />
                {studentLoading && <Chip color="warning" label="Loading students..." />}
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => setAllSelected(true)}>Select All</Button>
                <Button variant="outlined" onClick={() => setAllSelected(false)}>Deselect All</Button>
                <Button variant="outlined" color="success" onClick={() => setAllAttendance(1)}>All Present</Button>
                <Button variant="outlined" color="error" onClick={() => setAllAttendance(0)}>All Absent</Button>
                <Button variant="contained" startIcon={<Save />} onClick={saveAttendance}>Save Attendance</Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              {filteredStudents.map((student) => {
                const checked = Boolean(selectedStudents[student._id]);
                const present = attendanceMap[student._id] !== 0;
                return (
                  <Grid item xs={12} md={6} lg={4} key={student._id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: !checked ? "#f8fafc" : present ? "#f0fdf4" : "#fef2f2",
                        borderColor: !checked ? "#cbd5e1" : present ? "#86efac" : "#fecaca"
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box>
                          <Typography fontWeight={800}>{student.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{student.regno || "-"} | {student.email}</Typography>
                          <Typography variant="caption" display="block">
                            {student.programcode} | Sem {student.semester} | {student.Major} | {student.section}
                          </Typography>
                        </Box>
                        <Checkbox
                          checked={checked}
                          onChange={(event) => setSelectedStudents((prev) => ({ ...prev, [student._id]: event.target.checked }))}
                        />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{present ? "Present" : "Absent"}</Typography>
                        <FormControlLabel
                          control={(
                            <Switch
                              checked={present}
                              onChange={(event) => setAttendanceMap((prev) => ({ ...prev, [student._id]: event.target.checked ? 1 : 0 }))}
                              color="success"
                            />
                          )}
                          label=""
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
}
