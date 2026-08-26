import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import {
  Assignment,
  AutoStories,
  Event,
  Groups,
  MenuBook,
  Quiz,
  Refresh,
  School,
  WarningAmber
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

const colors = ["#1e88e5", "#43a047", "#fb8c00", "#8e24aa", "#00acc1", "#e53935", "#3949ab"];

const fmtDate = (value) => value ? new Date(value).toLocaleDateString() : "-";
const fmtDateTime = (value) => value ? new Date(value).toLocaleString() : "-";
const routeTo = (link) => {
  const value = String(link || "").trim();
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
};

const StatCard = ({ icon, label, value, color }) => (
  <Card sx={{ height: "100%", borderRadius: 2, border: "1px solid #e5e7eb" }}>
    <CardContent>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: color, color: "white", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" fontWeight={800}>{value}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const SimpleList = ({ title, rows, empty, renderRow, action }) => (
  <Paper sx={{ p: 2, height: "100%", border: "1px solid #e5e7eb", borderRadius: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      {action}
    </Stack>
    {rows.length ? (
      <List dense disablePadding>
        {rows.map((row, index) => (
          <ListItem key={row._id || row.id || `${title}-${index}`} divider={index !== rows.length - 1} sx={{ px: 0 }}>
            {renderRow(row)}
          </ListItem>
        ))}
      </List>
    ) : (
      <Alert severity="info">{empty}</Alert>
    )}
  </Paper>
);

export default function NepLmsFacultyDashboardPage() {
  const [data, setData] = useState(null);
  const [academicYear, setAcademicYear] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskTab, setTaskTab] = useState(0);
  const [pendingTasks, setPendingTasks] = useState({ rows: [], categories: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPendingTasks = async (year = academicYear, category = taskCategory) => {
    const res = await ep1.get("/api/v2/academic-new-tasks/faculty-pending", {
      params: { colid: global1.colid, facultyemail: global1.user, academicyear: year, category }
    });
    setPendingTasks(res.data || { rows: [], categories: [], summary: {} });
  };

  const loadDashboard = async (year = academicYear) => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/neplms/faculty-dashboard", {
        params: {
          colid: global1.colid,
          facultyemail: global1.user,
          name: global1.name,
          academicyear: year
        }
      });
      setData(res.data || null);
      if (!year && res.data?.summary?.academicYear) setAcademicYear(res.data.summary.academicYear);
      await loadPendingTasks(year || res.data?.summary?.academicYear || "");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load faculty dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard("");
  }, []);

  const summary = data?.summary || {};
  const courses = data?.courses || [];
  const years = data?.options?.academicyears || [];
  const attendancePie = useMemo(() => {
    const percentage = Number(summary.attendancePercentage || 0);
    return [
      { name: "Present", value: percentage },
      { name: "Absent", value: Math.max(0, Number((100 - percentage).toFixed(2))) }
    ];
  }, [summary.attendancePercentage]);
  const taskRows = taskTab === 0 ? (pendingTasks.open || []) : (pendingTasks.overdue || []);
  const taskCategories = pendingTasks.categories || [];
  const taskSummary = pendingTasks.summary || {};

  const taskPanel = (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Tasks</Typography>
              <Typography variant="body2" color="text.secondary">Open and overdue tasks assigned to you</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={taskCategory}
                  onChange={(event) => {
                    setTaskCategory(event.target.value);
                    loadPendingTasks(academicYear, event.target.value).catch(() => {});
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {taskCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
                </Select>
              </FormControl>
              <Button component={RouterLink} to="/my-academic-tasks" size="small" startIcon={<Assignment />}>My Tasks</Button>
            </Stack>
          </Stack>
          <Tabs value={taskTab} onChange={(_, value) => setTaskTab(value)} sx={{ mb: 1 }}>
            <Tab label={`Open (${taskSummary.open || 0})`} />
            <Tab label={`Overdue (${taskSummary.overdue || 0})`} />
          </Tabs>
          {taskRows.length ? (
            <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1 }}>
              {taskRows.map((task) => {
                const isOverdue = task.duedate && new Date(task.duedate) < new Date() && !/^completed$/i.test(task.status || "");
                const target = routeTo(task.pagelink);
                return (
                  <Card key={task._id} variant="outlined" sx={{ minWidth: 300, maxWidth: 340, borderLeft: `5px solid ${isOverdue ? "#dc2626" : "#2563eb"}`, flex: "0 0 auto" }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography fontWeight={900} noWrap title={task.task}>{task.task || "Task"}</Typography>
                        <Chip size="small" color={isOverdue ? "error" : "primary"} label={isOverdue ? "Overdue" : (task.status || "Open")} />
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                        <Chip size="small" variant="outlined" label={task.category || "General"} />
                        <Chip size="small" color={/critical|high/i.test(task.criticality || "") ? "error" : "default"} variant="outlined" label={task.criticality || "Normal"} />
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1 }}>Start: <b>{fmtDate(task.startdate)}</b></Typography>
                      <Typography variant="body2">Due: <b>{fmtDate(task.duedate)}</b></Typography>
                      {task.comments && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{task.comments}</Typography>}
                      {target && <Button component={RouterLink} to={target} size="small" variant="contained" sx={{ mt: 1.25 }}>Open</Button>}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : <Alert severity="success">No {taskTab === 0 ? "open" : "overdue"} tasks for the selected category.</Alert>}
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <MenuPageShell title="Faculty Dashboard">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          color: "white",
          borderRadius: 3,
          background: "linear-gradient(120deg, #17324d 0%, #00695c 56%, #7b3f00 100%)"
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.86 }}>Faculty Dashboard</Typography>
            <Typography variant="h4" fontWeight={900}>{global1.name || "Faculty"}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip size="small" label={`Email: ${global1.user || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
              <Chip size="small" label={`Department: ${global1.department || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
              <Chip size="small" label={`Academic Year: ${summary.academicYear || academicYear || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
            </Stack>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
            <FormControl size="small" sx={{ minWidth: 180, bgcolor: "rgba(255,255,255,0.96)", borderRadius: 1 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={academicYear}
                onChange={(event) => {
                  setAcademicYear(event.target.value);
                  loadDashboard(event.target.value);
                }}
              >
                {years.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
              </Select>
            </FormControl>
            <Button color="inherit" variant="outlined" startIcon={<Refresh />} onClick={() => loadDashboard()} sx={{ borderColor: "rgba(255,255,255,0.55)" }}>Refresh</Button>
            <Button component={RouterLink} to="/neplmscourseworkspace" color="inherit" variant="contained" sx={{ bgcolor: "rgba(255,255,255,0.18)" }}>Open Workspace</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<School />} label="Assigned Courses" value={summary.courses || 0} color="#1e88e5" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<Groups />} label="Students Coursewise" value={summary.students || 0} color="#43a047" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<Event />} label="Upcoming Classes" value={summary.upcomingClasses || 0} color="#fb8c00" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<WarningAmber />} label="Below 70%" value={`${summary.lowAttendanceStudents || 0} att / ${summary.lowScoreStudents || 0} score`} color="#e53935" /></Grid>
      </Grid>

      {taskPanel}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 380, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Coursewise Attendance and Students</Typography>
            {courses.length ? (
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={courses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="coursecode" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="attendancePercentage" name="Attendance %" fill="#1e88e5" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="students" name="Students" fill="#43a047" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Alert severity="info">No courses assigned for this academic year.</Alert>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 380, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Overall Attendance</Typography>
            <ResponsiveContainer width="100%" height="86%">
              <PieChart>
                <Pie data={attendancePie} dataKey="value" nameKey="name" innerRadius={62} outerRadius={105} label>
                  {attendancePie.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? "#43a047" : "#e53935"} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Course Risk Summary</Typography>
            <Grid container spacing={1}>
              {courses.map((course, index) => (
                <Grid item xs={12} md={4} key={course.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography fontWeight={800}>{course.coursecode}</Typography>
                          <Typography variant="body2" color="text.secondary">{course.course}</Typography>
                        </Box>
                        <Box sx={{ width: 12, height: 42, borderRadius: 2, bgcolor: colors[index % colors.length] }} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        <Chip size="small" label={`${course.students} students`} />
                        <Chip size="small" color="primary" label={`${course.attendancePercentage}% attendance`} />
                        <Chip size="small" color="warning" label={`${course.lowAttendanceStudents} attendance <70`} />
                        <Chip size="small" color="error" label={`${course.lowScoreStudents} score <70`} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Upcoming Classes"
            rows={data?.upcomingClasses || []}
            empty="No upcoming classes found."
            renderRow={(row) => (
              <ListItemText
                primary={`${fmtDate(row.classdate)} ${row.classtime || ""} | ${row.coursecode} - ${row.course}`}
                secondary={`${row.topic || row.module || "Class"} | ${row.programcode || ""} Sem ${row.semester || ""}`}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Past Classes"
            rows={data?.pastClasses || []}
            empty="No past classes found."
            renderRow={(row) => (
              <ListItemText
                primary={`${fmtDate(row.classdate)} ${row.classtime || ""} | ${row.coursecode} - ${row.course}`}
                secondary={`${row.workcompleted || row.topic || "Class completed"} | ${row.programcode || ""} Sem ${row.semester || ""}`}
              />
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Upcoming Assignments"
            rows={data?.upcomingAssignments || []}
            empty="No upcoming assignments."
            action={<Button component={RouterLink} to="/neplmscourseworkspace" size="small" startIcon={<Assignment />}>Manage</Button>}
            renderRow={(row) => (
              <ListItemText
                primary={row.title || row.topic || "Assignment"}
                secondary={`${row.coursecode || ""} | Due ${fmtDate(row.duedate)} | ${row.fullmarks || 0} marks`}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Upcoming Quiz"
            rows={data?.upcomingQuizzes || []}
            empty="No active or upcoming quizzes."
            action={<Button component={RouterLink} to="/neplmscourseworkspace" size="small" startIcon={<Quiz />}>Manage</Button>}
            renderRow={(row) => (
              <ListItemText
                primary={row.title || "Quiz"}
                secondary={`${row.coursecode || ""} | Starts ${fmtDateTime(row.startdatetime)} | Ends ${fmtDateTime(row.enddatetime)}`}
              />
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SimpleList
            title="Course Material"
            rows={data?.courseMaterial || []}
            empty="No course material uploaded yet."
            action={<AutoStories color="primary" />}
            renderRow={(row) => (
              <ListItemText
                primary={row.title || row.originalname || "Course Material"}
                secondary={<Button size="small" href={row.url} target="_blank" rel="noreferrer" startIcon={<MenuBook />}>{row.coursecode || "Open"}</Button>}
              />
            )}
          />
        </Grid>
      </Grid>
      </Box>
    </MenuPageShell>
  );
}
