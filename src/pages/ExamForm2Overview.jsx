import React from "react";
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { CalendarMonth, CheckCircle } from "@mui/icons-material";

const displayDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not configured";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
// Deadlines are inclusive calendar dates, rather than midnight cutoffs.
const day = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export default function ExamForm2Overview({ overview, student }) {
  if (!overview) return null;
  const { schedule, barredCourses = [], submission, checkedAt } = overview;
  const today = day(checkedAt || new Date());
  const stages = schedule ? [
    { label: "Last date (without late fee)", date: schedule.lastdate, amount: schedule.examfee, bg: "#effbf2", border: "#a9dfb7", color: "#32683f" },
    { label: "Last date with fine 1", date: schedule.lastdatefine1, amount: schedule.lastdatefine1amount, bg: "#fffdea", border: "#e8d980", color: "#806122" },
    { label: "Last date with fine 2", date: schedule.lastdatefine2, amount: schedule.lastdatefine2amount, bg: "#fff6ed", border: "#eac399", color: "#8a4a29" },
    { label: "Last date with fine 3", date: schedule.lastdatefine3, amount: schedule.lastdatefine3amount, bg: "#fff1f3", border: "#e6a9b3", color: "#9e2b42" }
  ] : [];
  const activeStage = stages.findIndex((stage) => day(stage.date) !== null && today <= day(stage.date));
  const hasDeadlines = stages.some((stage) => day(stage.date) !== null);
  const windowLabel = !hasDeadlines ? "Dates not configured" : activeStage < 0 ? "Fill-up dates have passed" : activeStage === 0 ? "Without late fine" : `Late fine ${activeStage} applicable (+${money(stages[activeStage].amount)})`;
  return <Stack spacing={2} sx={{ mt: 2 }}>
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center"><CalendarMonth color="primary" /><Typography variant="h6" fontWeight={800}>Exam Form Fill-up Dates &amp; Fee Schedule</Typography></Stack>
        <Chip label={windowLabel} color={activeStage > 0 || (hasDeadlines && activeStage < 0) ? "error" : "primary"} />
      </Stack>
      <Typography sx={{ my: 2 }}>Schedule for: <b>{student.program} ({student.programcode})</b> — Academic Year: <b>{schedule?.academicyear || student.academicyear}</b></Typography>
      {!schedule ? <Alert severity="info">No exam form fill-up dates configured for this academic year and program.</Alert> : <>
        <Grid container spacing={1.5}>{stages.map((stage, index) => <Grid item xs={12} sm={6} lg={3} key={stage.label}>
          <Box sx={{ p: 1.5, height: "100%", minHeight: 125, bgcolor: stage.bg, border: "1px solid", borderColor: stage.border, borderRadius: 1, color: stage.color }}>
            <Typography fontSize={12} fontWeight={700} sx={{ textTransform: "uppercase", mb: 1 }}>{stage.label}</Typography>
            <Typography fontSize={22} fontWeight={800}>{displayDate(stage.date)}</Typography>
            <Typography sx={{ mt: 1 }}>{index === 0 ? "Regular exam fee: " : "Fine amount: +"}{money(stage.amount)}</Typography>
          </Box>
        </Grid>)}</Grid>
        <Typography sx={{ mt: 2 }}>Internal Assessment (IA) Marks Submission End Date: <b>{displayDate(schedule.iafillingdate)}</b></Typography>
      </>}
    </Paper>
    <Paper variant="outlined" sx={{ p: 2, bgcolor: barredCourses.length ? "#fff8ed" : "#f0fbf3", borderColor: barredCourses.length ? "#e5c296" : "#a9dfb7" }}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
        <Chip icon={<CheckCircle />} color={barredCourses.length ? "warning" : "success"} label={barredCourses.length ? `Restricted for ${barredCourses.length} course(s)` : "Eligible to fill exam form"} />
        {submission && <Chip color="primary" label={`Form ${submission.status || "Submitted"}`} />}
      </Stack>
      <Typography>{barredCourses.length ? "Pre-exam eligibility has barred entries for the following courses:" : "No active barred entry found in pre-exam eligibility for this student and exam."}</Typography>
      {barredCourses.map((row) => <Box key={row._id || row.coursecode} sx={{ mt: 1 }}><Typography fontWeight={700}>{row.course} ({row.coursecode})</Typography><Typography variant="body2">Attendance: {row.attendance} · Fees: {row.fees}{row.note ? ` · ${row.note}` : ""}</Typography></Box>)}
      {submission?.updatedAt && <Typography variant="body2" sx={{ mt: 1 }}>Last form update: {displayDate(submission.updatedAt)}</Typography>}
    </Paper>
  </Stack>;
}
