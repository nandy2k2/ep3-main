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
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const courseFilterFields = [
  "academicyear",
  "regulation",
  "program",
  "programcode",
  "type",
  "subject",
  "semester",
  "course",
  "coursecode",
  "coursetype",
  "faculty",
  "institution",
  "department",
  "status"
];

const userFilterFields = ["role", "department", "designation", "institution", "faculty", "name", "email"];
const labelOf = (value) => String(value || "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const text = (value) => String(value ?? "").trim();

const exportRows = (rows, filename) => {
  if (!rows?.length) return;
  const fields = Object.keys(rows[0]).filter((field) => !field.startsWith("_"));
  const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => `"${String(row[field] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const blankFilter = { field: "", value: "" };
const searchableText = (row = {}, fields = []) => fields.map((field) => text(row[field])).join(" ").toLowerCase();

function DynamicFilters({ title, fields, options, filters, setFilters, prefix }) {
  const update = (index, patch) => {
    setFilters((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch, ...(patch.field ? { value: "" } : {}) } : row)));
  };
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography fontWeight={900}>{title}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setFilters((prev) => [...prev, { ...blankFilter }])}>Add filter</Button>
      </Stack>
      <Stack spacing={1.25}>
        {filters.map((row, index) => (
          <Grid container spacing={1} key={`${prefix}-${index}`}>
            <Grid item xs={12} md={5}>
              <Autocomplete
                options={fields}
                value={row.field || null}
                onChange={(_, value) => update(index, { field: value || "" })}
                renderInput={(params) => <TextField {...params} size="small" label="Field" />}
                getOptionLabel={labelOf}
              />
            </Grid>
            <Grid item xs={10} md={6}>
              <Autocomplete
                freeSolo
                options={row.field ? options[row.field] || [] : []}
                value={row.value || ""}
                onChange={(_, value) => update(index, { value: value || "" })}
                onInputChange={(_, value) => update(index, { value })}
                renderInput={(params) => <TextField {...params} size="small" label="Value" />}
              />
            </Grid>
            <Grid item xs={2} md={1}>
              <Tooltip title="Remove filter">
                <IconButton color="error" onClick={() => setFilters((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ))}
      </Stack>
    </Paper>
  );
}

export default function VisualWorkloadAssignmentPage() {
  const [courseOptions, setCourseOptions] = useState({});
  const [userOptions, setUserOptions] = useState({});
  const [courseFilters, setCourseFilters] = useState([{ field: "academicyear", value: "" }, { field: "regulation", value: "" }, { field: "programcode", value: "" }]);
  const [userFilters, setUserFilters] = useState([{ field: "role", value: "" }]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadRules, setWorkloadRules] = useState([]);
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [dropTargetEmail, setDropTargetEmail] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingUserEmail, setSavingUserEmail] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
    loadWorkloadRules();
  }, []);

  const paramsFromFilters = (rows, prefix) => {
    const params = {};
    rows.forEach((row) => {
      if (row.field && text(row.value)) params[`${prefix}_${row.field}`] = text(row.value);
    });
    return params;
  };

  const assignmentByFaculty = useMemo(() => {
    const map = new Map();
    assignments.forEach((row) => {
      const key = text(row.facultyemail).toLowerCase();
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    });
    return map;
  }, [assignments]);

  const filteredCourses = useMemo(() => {
    const needle = text(courseSearch).toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) => searchableText(course, courseFilterFields).includes(needle));
  }, [courses, courseSearch]);

  const filteredUsers = useMemo(() => {
    const needle = text(userSearch).toLowerCase();
    if (!needle) return users;
    return users.filter((user) => searchableText(user, userFilterFields).includes(needle));
  }, [users, userSearch]);

  const loadOptions = async () => {
    setError("");
    try {
      const res = await ep1.get("/api/v2/workloadassignment/visual/options", { params: { colid: global1.colid } });
      setCourseOptions(res.data?.courseOptions || {});
      setUserOptions(res.data?.userOptions || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load filter options.");
    }
  };

  const loadWorkloadRules = async () => {
    try {
      const res = await ep1.get("/api/v2/designation-workload-hours", { params: { colid: global1.colid, status: "Active" } });
      setWorkloadRules(res.data?.data || []);
    } catch (err) {
      setWorkloadRules([]);
    }
  };

  const listFromAny = (value) => {
    if (Array.isArray(value)) return value.map(text).filter(Boolean);
    return text(value).split(",").map(text).filter(Boolean);
  };

  const ruleForUser = (programcode, designation) => {
    const normalizedProgram = text(programcode).toLowerCase();
    const normalizedDesignation = text(designation).toLowerCase();
    if (!normalizedDesignation) return null;
    const matchesDesignation = (row) => listFromAny(row.designations?.length ? row.designations : row.designation)
      .some((item) => text(item).toLowerCase() === normalizedDesignation);
    const exact = workloadRules.find((row) => text(row.programcode).toLowerCase() === normalizedProgram && matchesDesignation(row));
    if (exact) return exact;
    return workloadRules.find((row) => matchesDesignation(row)) || null;
  };

  const confirmWorkloadCapacity = async (user, course, hoursToAssign) => {
    const rule = ruleForUser(course.programcode, user.designation);
    const maxHours = Number(rule?.workloadhours || 0);
    if (!maxHours) return true;
    const res = await ep1.get("/api/v2/workloadassignment", {
      params: { colid: global1.colid, academicyear: course.academicyear, facultyemail: user.email }
    });
    const assignedHours = (res.data?.data || [])
      .filter((row) => row.status !== "Inactive")
      .reduce((sum, row) => sum + Number(row.hoursperweek || 0), 0);
    const nextTotal = assignedHours + Number(hoursToAssign || 0);
    if (nextTotal <= maxHours) return true;
    return window.confirm(`Assigned workload will exceed the permitted weekly workload for ${user.name || user.email}.\n\nPermitted: ${maxHours} hour(s)\nAlready assigned: ${assignedHours} hour(s)\nTo assign now: ${hoursToAssign} hour(s)\nTotal after assignment: ${nextTotal} hour(s)\n\nDo you want to continue?`);
  };

  const loadBoard = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    setProgress(15);
    try {
      const params = {
        colid: global1.colid,
        ...paramsFromFilters(courseFilters, "course"),
        ...paramsFromFilters(userFilters, "user")
      };
      setProgress(45);
      const res = await ep1.get("/api/v2/workloadassignment/visual/search", { params });
      setProgress(80);
      setCourses(res.data?.courses || []);
      setUsers(res.data?.users || []);
      setAssignments(res.data?.assignments || []);
      setCourseSearch("");
      setUserSearch("");
      setProgress(100);
      setMessage(`Loaded ${res.data?.courses?.length || 0} courses, ${res.data?.users?.length || 0} users and ${res.data?.assignments?.length || 0} assignments.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load visual workload data.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 900);
    }
  };

  const assignCourse = async (user) => {
    if (!draggedCourse || !user?.email) return;
    const duplicate = assignments.some((row) => (
      text(row.facultyemail).toLowerCase() === text(user.email).toLowerCase()
      && text(row.academicyear) === text(draggedCourse.academicyear)
      && text(row.regulation) === text(draggedCourse.regulation)
      && text(row.programcode) === text(draggedCourse.programcode)
      && text(row.type) === text(draggedCourse.type)
      && text(row.subject) === text(draggedCourse.subject)
      && text(row.semester) === text(draggedCourse.semester)
      && text(row.coursecode) === text(draggedCourse.coursecode)
    ));
    if (duplicate) {
      setError("This course is already assigned to the selected user.");
      setDraggedCourse(null);
      return;
    }
    setSavingUserEmail(user.email);
    setError("");
    setMessage("");
    try {
      const hoursToAssign = Number(draggedCourse.hoursperweek || draggedCourse.workloadhours || draggedCourse.credit || draggedCourse.credits || 0);
      const canContinue = await confirmWorkloadCapacity(user, draggedCourse, hoursToAssign);
      if (!canContinue) return;
      const payload = {
        academicyear: draggedCourse.academicyear,
        regulation: draggedCourse.regulation,
        program: draggedCourse.program,
        programcode: draggedCourse.programcode,
        type: draggedCourse.type,
        subject: draggedCourse.subject,
        semester: draggedCourse.semester,
        course: draggedCourse.course,
        coursecode: draggedCourse.coursecode,
        coursetype: draggedCourse.coursetype,
        facultyname: user.name,
        facultyemail: user.email,
        facultydepartment: user.department,
        hoursperweek: hoursToAssign,
        status: "Active",
        colid: global1.colid,
        user: global1.user
      };
      await ep1.post("/api/v2/workloadassignment", payload);
      setMessage(`Assigned ${draggedCourse.coursecode} to ${user.name || user.email}.`);
      await loadBoard();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create workload assignment.");
    } finally {
      setSavingUserEmail("");
      setDraggedCourse(null);
      setDropTargetEmail("");
    }
  };

  const deleteAssignments = async (ids) => {
    const nextIds = ids?.length ? ids : selectedIds;
    if (!nextIds.length) return;
    setLoading(true);
    setError("");
    try {
      await ep1.post("/api/v2/workloadassignment/delete", { ids: nextIds, colid: global1.colid });
      setSelectedIds([]);
      setMessage("Selected workload assignments deleted.");
      await loadBoard();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete assignments.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "facultyname", headerName: "Faculty", minWidth: 190, flex: 1 },
    { field: "facultyemail", headerName: "Faculty Email", minWidth: 220 },
    { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
    { field: "regulation", headerName: "Regulation", minWidth: 130 },
    { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "type", headerName: "Type", minWidth: 110 },
    { field: "subject", headerName: "Subject", minWidth: 140 },
    { field: "semester", headerName: "Semester", minWidth: 105 },
    { field: "coursecode", headerName: "Course Code", minWidth: 130 },
    { field: "course", headerName: "Course", minWidth: 240, flex: 1 },
    { field: "coursetype", headerName: "Course Type", minWidth: 130 },
    {
      field: "actions",
      headerName: "Action",
      minWidth: 90,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Delete assignment">
          <IconButton color="error" onClick={() => deleteAssignments([params.row._id])} disabled={loading}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <MenuPageShell title="Visual workload assignment">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={950}>Visual workload assignment</Typography>
              <Typography color="text.secondary">Load filtered courses and users, then drag a course card onto a user to create workload.</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadOptions} disabled={loading}>Refresh options</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportRows(assignments, "visual_workload_assignments.csv")} disabled={!assignments.length || loading}>Export</Button>
              <Button variant="contained" onClick={loadBoard} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
            </Stack>
          </Stack>
          {progress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={800}>Loading visual workload board</Typography>
                <Typography variant="body2" fontWeight={900}>{Math.round(progress)}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999, mt: 0.75 }} />
            </Box>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} lg={6}>
            <DynamicFilters title="Course filters from regulation course map" fields={courseFilterFields} options={courseOptions} filters={courseFilters} setFilters={setCourseFilters} prefix="course" />
          </Grid>
          <Grid item xs={12} lg={6}>
            <DynamicFilters title="Faculty/user filters" fields={userFilterFields} options={userOptions} filters={userFilters} setFilters={setUserFilters} prefix="user" />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", minHeight: 520 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>Courses</Typography>
                <Chip label={`${filteredCourses.length}/${courses.length} shown`} color="primary" variant="outlined" />
              </Stack>
              <TextField
                fullWidth
                size="small"
                label="Search loaded courses"
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                placeholder="Search by course, code, semester, subject, program..."
                sx={{ mb: 1.5 }}
              />
              <Box sx={{ maxHeight: 680, overflow: "auto", pr: 1 }}>
                <Grid container spacing={0.8}>
                  {filteredCourses.map((course) => (
                    <Grid item xs={12} key={course._id}>
                      <Card
                        draggable
                        onDragStart={() => setDraggedCourse(course)}
                        onDragEnd={() => {
                          setDraggedCourse(null);
                          setDropTargetEmail("");
                        }}
                        elevation={0}
                        sx={{
                          border: "1px solid #cbd5e1",
                          borderRadius: 1.5,
                          cursor: "grab",
                          bgcolor: draggedCourse?._id === course._id ? "#dbeafe" : "white",
                          boxShadow: draggedCourse?._id === course._id ? "0 0 0 2px #2563eb inset" : "none"
                        }}
                      >
                        <CardContent sx={{ py: 0.9, px: 1.25, "&:last-child": { pb: 0.9 } }}>
                          <Typography fontWeight={900} sx={{ fontSize: 13.5, lineHeight: 1.25 }}>{course.coursecode} - {course.course}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                            {course.program} ({course.programcode}) | Sem {course.semester} | {course.type}: {course.subject}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.7 }}>
                            <Chip size="small" label={course.academicyear || "Year"} sx={{ height: 22, fontSize: 11 }} />
                            <Chip size="small" label={course.regulation || "Regulation"} sx={{ height: 22, fontSize: 11 }} />
                            <Chip size="small" label={course.coursetype || "Course type"} sx={{ height: 22, fontSize: 11 }} />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", minHeight: 520 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>Drop courses on users</Typography>
                <Chip label={`${filteredUsers.length}/${users.length} users shown`} color="success" variant="outlined" />
              </Stack>
              <TextField
                fullWidth
                size="small"
                label="Search loaded users"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, role, department, designation..."
                sx={{ mb: 1.5 }}
              />
              <Grid container spacing={1.5} sx={{ maxHeight: 680, overflow: "auto", pr: 1 }}>
                {filteredUsers.map((user) => {
                  const assigned = assignmentByFaculty.get(text(user.email).toLowerCase()) || [];
                  return (
                    <Grid item xs={12} md={6} key={user._id || user.email}>
                      <Paper
                        elevation={0}
                        onDragEnter={() => setDropTargetEmail(user.email)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDropTargetEmail(user.email);
                        }}
                        onDragLeave={() => setDropTargetEmail((current) => (current === user.email ? "" : current))}
                        onDrop={() => assignCourse(user)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: dropTargetEmail === user.email ? "2px solid #16a34a" : "2px dashed #94a3b8",
                          bgcolor: dropTargetEmail === user.email ? "#dcfce7" : savingUserEmail === user.email ? "#eff6ff" : "white",
                          boxShadow: dropTargetEmail === user.email ? "0 0 0 4px rgba(22, 163, 74, 0.18)" : "none",
                          transform: dropTargetEmail === user.email ? "scale(1.01)" : "scale(1)",
                          transition: "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                          minHeight: 170
                        }}
                      >
                        <Typography fontWeight={950}>{user.name || user.email}</Typography>
                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ my: 1 }}>
                          <Chip size="small" color="primary" label={user.role || "Role"} />
                          {user.department && <Chip size="small" label={user.department} />}
                          {user.designation && <Chip size="small" label={user.designation} />}
                        </Stack>
                        <Typography variant="body2" fontWeight={800}>{assigned.length} assigned courses</Typography>
                        <Box sx={{ mt: 1, maxHeight: 74, overflow: "auto" }}>
                          {assigned.slice(0, 5).map((row) => (
                            <Typography key={row._id} variant="caption" display="block">{row.coursecode} - {row.course}</Typography>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={900}>Assignments</Typography>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => deleteAssignments()} disabled={!selectedIds.length || loading}>Bulk delete</Button>
          </Stack>
          <Box sx={{ height: 520, width: "100%" }}>
            <DataGrid
              rows={assignments}
              columns={columns}
              getRowId={(row) => row._id}
              checkboxSelection
              disableRowSelectionOnClick
              loading={loading}
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(ids) => setSelectedIds(Array.from(ids))}
              slots={{ toolbar: GridToolbar }}
              sx={{ bgcolor: "white", "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }}
            />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
