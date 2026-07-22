import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
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
  TextField,
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
import dayjs from "dayjs";

const colors = ["#1e88e5", "#43a047", "#fb8c00", "#8e24aa", "#00acc1", "#e53935", "#3949ab"];

const fmtDate = (value) => value ? new Date(value).toLocaleDateString() : "-";
const fmtDateTime = (value) => value ? new Date(value).toLocaleString() : "-";
const contentCount = (course = {}) => Number(course.assignmentCount || 0)
  + Number(course.materialCount || 0)
  + Number(course.quizCount || 0)
  + Number(course.sequenceCount || 0);

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

const CourseCard = ({ course }) => {
  const hasContent = contentCount(course) > 0;
  const workspaceLink = `/studentneplmsworkspace?courseid=${encodeURIComponent(course.id || "")}&coursecode=${encodeURIComponent(course.coursecode || "")}`;
  const sequenceLink = `/studentsequentialcontent?courseid=${encodeURIComponent(course.id || "")}&coursecode=${encodeURIComponent(course.coursecode || "")}`;
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: hasContent ? "1px solid #bbf7d0" : "1px solid #fed7aa",
        bgcolor: hasContent ? "#f0fdf4" : "#fff7ed",
        boxShadow: hasContent ? "0 14px 32px rgba(22, 163, 74, 0.12)" : "0 10px 24px rgba(154, 52, 18, 0.08)",
        overflow: "hidden"
      }}
    >
      <CardActionArea component={RouterLink} to={hasContent && course.sequenceCount > 0 ? sequenceLink : workspaceLink} sx={{ height: "100%", alignItems: "stretch" }}>
        <CardContent sx={{ height: "100%" }}>
          <Stack spacing={1.25} sx={{ height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  {course.academicyear || "-"} | Sem {course.semester || "-"} | {course.regulation || "-"}
                </Typography>
                <Typography variant="h6" fontWeight={900} sx={{ color: hasContent ? "#14532d" : "#7c2d12", lineHeight: 1.18 }}>
                  {course.course || "Course"}
                </Typography>
                <Typography variant="body2" color="text.secondary">{course.coursecode || "-"} | {course.programcode || course.program || "-"}</Typography>
              </Box>
              <Chip
                size="small"
                color={hasContent ? "success" : "warning"}
                label={hasContent ? "Content ready" : "No upload yet"}
              />
            </Stack>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip size="small" icon={<Assignment fontSize="small" />} label={`Assignments ${course.assignmentCount || 0}`} variant="outlined" />
              <Chip size="small" icon={<MenuBook fontSize="small" />} label={`Material ${course.materialCount || 0}`} variant="outlined" />
              <Chip size="small" icon={<Quiz fontSize="small" />} label={`Quiz ${course.quizCount || 0}`} variant="outlined" />
              <Chip size="small" icon={<AutoStories fontSize="small" />} label={`Sequence ${course.sequenceCount || 0}`} variant="outlined" />
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Latest: {course.latestActivityAt ? fmtDateTime(course.latestActivityAt) : "No content uploaded"}
              </Typography>
              <Typography variant="caption" fontWeight={800} color={hasContent ? "success.dark" : "warning.dark"}>
                {hasContent && course.sequenceCount > 0 ? "Open sequence" : "Open workspace"}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default function NepLmsStudentDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classCalendarView, setClassCalendarView] = useState("month");
  const [classCalendarDate, setClassCalendarDate] = useState(dayjs().format("YYYY-MM-DD"));

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
  const courses = useMemo(() => [...(data?.courses || [])].sort((a, b) => {
    const aContent = contentCount(a) > 0;
    const bContent = contentCount(b) > 0;
    if (aContent !== bContent) return aContent ? -1 : 1;
    const bDate = b.latestActivityAt ? new Date(b.latestActivityAt).getTime() : 0;
    const aDate = a.latestActivityAt ? new Date(a.latestActivityAt).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;
    return `${a.semester || ""}${a.course || ""}`.localeCompare(`${b.semester || ""}${b.course || ""}`);
  }), [data?.courses]);
  const attendance = data?.attendance || [];
  const upcomingClasses = data?.upcomingClasses || [];
  const attendancePie = useMemo(() => {
    const percentage = Number(summary.attendancePercentage || 0);
    return [
      { name: "Present", value: percentage },
      { name: "Absent", value: Math.max(0, Number((100 - percentage).toFixed(2))) }
    ];
  }, [summary.attendancePercentage]);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const timetableRangeLabel = useMemo(() => {
    const anchor = dayjs(classCalendarDate || today);
    if (classCalendarView === "day") return anchor.format("DD MMM YYYY");
    if (classCalendarView === "week") {
      const start = anchor.startOf("week");
      const end = anchor.endOf("week");
      return `${start.format("DD MMM")} - ${end.format("DD MMM YYYY")}`;
    }
    return anchor.format("MMMM YYYY");
  }, [classCalendarDate, classCalendarView, today]);

  const classesForDate = (date) => upcomingClasses
    .filter((row) => row.classdate === date)
    .sort((a, b) => `${a.classtime || ""}`.localeCompare(`${b.classtime || ""}`));

  const changeClassCalendarDate = (direction) => {
    const anchor = dayjs(classCalendarDate || today);
    const unit = classCalendarView === "month" ? "month" : classCalendarView === "week" ? "week" : "day";
    setClassCalendarDate(anchor.add(direction, unit).format("YYYY-MM-DD"));
  };

  const renderCalendarClassCard = (row) => (
    <Box
      key={row._id || `${row.classdate}-${row.classtime}-${row.coursecode}-${row.period}`}
      sx={{
        p: 1,
        mb: 0.75,
        borderRadius: 1,
        bgcolor: "#ecfeff",
        border: "1px solid #a5f3fc"
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "#0e7490" }}>{row.classtime || "Time not set"}</Typography>
        {row.period && <Chip size="small" label={row.period} sx={{ height: 20, fontSize: 11 }} />}
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.25 }}>
        {row.coursecode || ""} {row.course || "Class"}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {row.topic || row.module || "Class"} | {row.faculty || "-"}
      </Typography>
    </Box>
  );

  const renderDayCalendar = () => {
    const date = dayjs(classCalendarDate || today).format("YYYY-MM-DD");
    const rows = classesForDate(date);
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>{dayjs(date).format("dddd, DD MMM YYYY")}</Typography>
        {rows.length ? rows.map(renderCalendarClassCard) : (
          <Box sx={{ p: 3, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
            <Typography color="text.secondary">No upcoming classes scheduled for this date.</Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderWeekCalendar = () => {
    const start = dayjs(classCalendarDate || today).startOf("week");
    const days = Array.from({ length: 7 }, (_, index) => start.add(index, "day"));
    return (
      <Paper sx={{ p: 2, mb: 2, overflowX: "auto" }}>
        <Box sx={{ minWidth: 980, display: "grid", gridTemplateColumns: "repeat(7, minmax(130px, 1fr))", gap: 1 }}>
          {days.map((day) => {
            const date = day.format("YYYY-MM-DD");
            const rows = classesForDate(date);
            return (
              <Box key={date} sx={{ minHeight: 260, p: 1, border: "1px solid", borderColor: date === today ? "primary.main" : "divider", borderRadius: 1, bgcolor: date === today ? "primary.50" : "background.paper" }}>
                <Typography variant="caption" color="text.secondary">{day.format("ddd")}</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>{day.format("DD MMM")}</Typography>
                {rows.length ? rows.map(renderCalendarClassCard) : <Typography variant="caption" color="text.disabled">No class</Typography>}
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  };

  const renderMonthCalendar = () => {
    const anchor = dayjs(classCalendarDate || today);
    const start = anchor.startOf("month").startOf("week");
    const days = Array.from({ length: 42 }, (_, index) => start.add(index, "day"));
    return (
      <Paper sx={{ p: 2, mb: 2, overflowX: "auto" }}>
        <Box sx={{ minWidth: 1050 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mb: 1 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Typography key={day} variant="caption" sx={{ fontWeight: 900, color: "text.secondary", px: 1 }}>{day}</Typography>
            ))}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(135px, 1fr))", gap: 1 }}>
            {days.map((day) => {
              const date = day.format("YYYY-MM-DD");
              const rows = classesForDate(date);
              const isCurrentMonth = day.month() === anchor.month();
              return (
                <Box key={date} sx={{ minHeight: 150, p: 1, border: "1px solid", borderColor: date === today ? "primary.main" : "divider", borderRadius: 1, bgcolor: date === today ? "primary.50" : isCurrentMonth ? "background.paper" : "grey.50", opacity: isCurrentMonth ? 1 : 0.62 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>{day.format("D")}</Typography>
                  <Box sx={{ mt: 0.75 }}>
                    {rows.slice(0, 3).map(renderCalendarClassCard)}
                    {rows.length > 3 && <Chip size="small" label={`+${rows.length - 3} more`} />}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderUpcomingClassCalendar = () => (
    <Box sx={{ mb: 2 }}>
      <Paper sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>Upcoming Classes Calendar</Typography>
            <Typography variant="body2" color="text.secondary">Switch between daily, weekly and monthly views.</Typography>
          </Box>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>View</InputLabel>
              <Select label="View" value={classCalendarView} onChange={(event) => setClassCalendarView(event.target.value)}>
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="Calendar Date" value={classCalendarDate} onChange={(event) => setClassCalendarDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="outlined" onClick={() => changeClassCalendarDate(-1)}>Previous</Button>
            <Button variant="outlined" onClick={() => setClassCalendarDate(today)}>Today</Button>
            <Button variant="outlined" onClick={() => changeClassCalendarDate(1)}>Next</Button>
          </Stack>
        </Stack>
        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 900 }}>{timetableRangeLabel}</Typography>
      </Paper>
      {classCalendarView === "day" && renderDayCalendar()}
      {classCalendarView === "week" && renderWeekCalendar()}
      {classCalendarView === "month" && renderMonthCalendar()}
    </Box>
  );

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

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2, border: "1px solid #e5e7eb", borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>My Course Workspace</Typography>
            <Typography variant="body2" color="text.secondary">
              Courses are sorted by latest LMS activity. Courses without uploaded material, quiz or sequence are highlighted separately.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip color="success" label={`${courses.filter((course) => contentCount(course) > 0).length} with content`} />
            <Chip color="warning" label={`${courses.filter((course) => contentCount(course) === 0).length} empty`} />
          </Stack>
        </Stack>
        {courses.length ? (
          <Grid container spacing={2}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} lg={4} key={course.id || course.coursecode}>
                <CourseCard course={course} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">No courses assigned for the current academic year and semester.</Alert>
        )}
      </Paper>

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

      {renderUpcomingClassCalendar()}

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
