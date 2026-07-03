import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import {
  Assignment,
  AutoStories,
  Event,
  MenuBook,
  Quiz,
  Refresh,
  School,
  TrendingUp
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

export default function NepLmsStudentDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/neplms/student-dashboard", {
        params: { colid: global1.colid, regno: global1.regno }
      });
      setData(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load student dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary || {};
  const student = data?.student || {};
  const courses = data?.courses || [];
  const attendance = data?.attendance || [];
  const attendancePie = useMemo(() => {
    const percentage = Number(summary.attendancePercentage || 0);
    return [
      { name: "Present", value: percentage },
      { name: "Absent", value: Math.max(0, Number((100 - percentage).toFixed(2))) }
    ];
  }, [summary.attendancePercentage]);

  return (
    <MenuPageShell title="Student Dashboard" menuType="student">
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          color: "white",
          borderRadius: 3,
          background: "linear-gradient(120deg, #12377a 0%, #167a8b 58%, #2e7d32 100%)"
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.86 }}>Student Dashboard</Typography>
            <Typography variant="h4" fontWeight={900}>{student.name || global1.name || "Student"}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip size="small" label={`Reg No: ${student.regno || global1.regno || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
              <Chip size="small" label={`Program: ${student.programcode || student.program || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
              <Chip size="small" label={`Semester: ${student.semester || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
              <Chip size="small" label={`Section: ${student.section || "-"}`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }} />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Button color="inherit" variant="outlined" startIcon={<Refresh />} onClick={loadDashboard} sx={{ borderColor: "rgba(255,255,255,0.55)" }}>Refresh</Button>
            <Button component={RouterLink} to="/studentneplmsworkspace" color="inherit" variant="contained" sx={{ bgcolor: "rgba(255,255,255,0.18)" }}>Open LMS</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<School />} label="Assigned Courses" value={summary.courses || 0} color="#1e88e5" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<TrendingUp />} label="Attendance" value={`${summary.attendancePercentage || 0}%`} color="#43a047" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<Event />} label="Upcoming Classes" value={summary.upcomingClasses || 0} color="#fb8c00" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<Quiz />} label="Upcoming Quiz" value={summary.upcomingQuizzes || 0} color="#8e24aa" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 360, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Coursewise Attendance</Typography>
            {attendance.length ? (
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={attendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="coursecode" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="percentage" name="Attendance %" fill="#1e88e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Alert severity="info">Attendance is not available yet.</Alert>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 360, border: "1px solid #e5e7eb", borderRadius: 2 }}>
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
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Current Semester Courses"
            rows={courses}
            empty="No courses assigned for the current semester."
            renderRow={(row) => (
              <ListItemText
                primary={`${row.coursecode} - ${row.course}`}
                secondary={`Faculty: ${row.faculty || "-"} | ${row.major || "-"} | Sem ${row.semester || "-"}`}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Upcoming Classes"
            rows={data?.upcomingClasses || []}
            empty="No upcoming classes found."
            renderRow={(row) => (
              <ListItemText
                primary={`${fmtDate(row.classdate)} ${row.classtime || ""} | ${row.coursecode} - ${row.course}`}
                secondary={`${row.topic || row.module || "Class"} | Faculty: ${row.faculty || "-"}`}
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
            action={<Button component={RouterLink} to="/studentneplmsworkspace" size="small" startIcon={<Assignment />}>Submit</Button>}
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
            action={<Button component={RouterLink} to="/studentneplmsworkspace" size="small" startIcon={<Quiz />}>Take Quiz</Button>}
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
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
          <SimpleList
            title="Past Classes"
            rows={data?.pastClasses || []}
            empty="No past classes found."
            renderRow={(row) => (
              <ListItemText
                primary={`${fmtDate(row.classdate)} ${row.classtime || ""} | ${row.coursecode} - ${row.course}`}
                secondary={`${row.workcompleted || row.topic || "Class completed"} | Faculty: ${row.faculty || "-"}`}
              />
            )}
          />
        </Grid>
      </Grid>
    </Container>
    </MenuPageShell>
  );
}
