import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const defaultModel = "gemini-2.5-flash";
const compactDefaultModel = "gemini-2.5-flash-lite";
const supportPassword = "kumropatash";
const modelOptions = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash"
];

const samplePrompts = [
  {
    label: "Fee receipt download check",
    prompt: "Why fees receipt cannot be downloaded? Academic year: 2026-27; Program code: BCOM; Student name: Student Name. Check User regno and Student Ledger regno and tell whether sync is required."
  },
  {
    label: "Student not shown in attendance",
    prompt: "Why is a student not showing in attendance? Regno: REG001; Academic year: 2026-27; Regulation: R2026; Program code: BCOM; Semester: 1; Section: A; Course code: ACC101. Check student data, timetable class match and regulation course map."
  },
  {
    label: "Class not shown in attendance",
    prompt: "Why is my class not showing for attendance? Academic year: 2026-27; Regulation: R2026; Program code: BCOM; Semester: 1; Section: A; Course code: ACC101. Check workload, timetable and matching students."
  },
  {
    label: "Fee item not showing",
    prompt: "Why is a fee item not showing for a student? Regno: REG001; Academic year: 2026-27; Program code: BCOM; Semester: 1; Fee group: Tuition; Fee item: Semester Fee. Diagnose fee structure and student ledger."
  },
  {
    label: "Fees application check",
    prompt: "Run fees application diagnostic for regno REG001 and show eligible fees, already applied fees and missing fee items."
  },
  {
    label: "Outstanding fees",
    prompt: "Show outstanding fees for academic year 2026-27, program code BCOM, past due only. Summarize balance and show important rows."
  },
  {
    label: "Payment received ledger not updated",
    prompt: "Payment is received but student ledger is not updated. Regno: REG001; Ref no: ICI_REFERENCE. Check ICICI Payment View status, Student Online Payment status and linked ledger rows. If status is INITIATED, tell whether ICICI Manual Success should be used."
  },
  {
    label: "ICICI datewise report",
    prompt: "Show ICICI Payment View report from 2026-09-01 to 2026-09-21 with statuswise summary and transaction details."
  },
  {
    label: "Payment gateway configuration",
    prompt: "Check payment gateway configuration for program B.Com and program code BCOM. Tell which ICICI gateway will be selected and whether common/default fallback exists."
  },
  {
    label: "Late fine setup",
    prompt: "Explain how to configure and apply late fine. Also check late fine rules for academic year 2026-27, program code BCOM and fee item Tuition Fee with current applicable fine and affected ledger rows."
  },
  {
    label: "Workload by faculty",
    prompt: "Show workload summary for faculty email faculty@example.com for academic year 2026-27 and program code BCOM. Group by course code."
  },
  {
    label: "Student workload not showing",
    prompt: "Student is not showing workload or assigned courses. Regno: REG001. Check the student's academicyear, regulation, programcode and semester from User, then compare with Workload Assignment count and course details for the same context."
  },
  {
    label: "Course material missing",
    prompt: "Check whether course material is uploaded for academic year 2026-27, regulation R2026, program code BCOM, semester 1, course code ACC101."
  },
  {
    label: "Lesson plan check",
    prompt: "Show lesson plan records for faculty email faculty@example.com, academic year 2026-27, program code BCOM and course code ACC101."
  },
  {
    label: "Assignment submissions",
    prompt: "Check assignment submissions for academic year 2026-27, program code BCOM, semester 1, course code ACC101 and summarize pending submissions."
  },
  {
    label: "Quiz records",
    prompt: "Show quiz records for academic year 2026-27, program code BCOM, semester 1 and course code ACC101."
  },
  {
    label: "Timetable issue",
    prompt: "Diagnose timetable visibility for academic year 2026-27, regulation R2026, program code BCOM, semester 1, section A and course code ACC101."
  },
  {
    label: "Menu not visible",
    prompt: "Why is a menu page not visible? Role: Faculty; Page/link: /neplmsattendance. Check menu access rows and Deny records."
  },
  {
    label: "Academic dropdown blank",
    prompt: "Academic configuration dropdown is blank. Check academic year 2026-27, regulation R2026, program code BCOM, semester 1 and course code ACC101 across program management, regulation, course map and assessment components."
  },
  {
    label: "Assessment component missing",
    prompt: "Why is assessment component not loading for academic year 2026-27, regulation R2026, program code BCOM, semester 1, course code ACC101? Check course assessment and assessment component configuration."
  },
  {
    label: "User access issue",
    prompt: "Check user details and menu access for user email user@example.com. Explain possible role, colid or access problems."
  },
  {
    label: "Admin academic setup",
    prompt: "As Admin, explain how to configure Academic Configuration from the beginning: Program, Regulation, Student Data Upload, Regulation Group, Regulation Course Map, Workload and Sectionwise Timetable. Include the order, required fields and common checks."
  },
  {
    label: "Fees setup guide",
    prompt: "As Admin, explain how to configure fees: fee groups, fee items, fee structure, late fine, student ledger/application, online payment gateway and receipts. Include how to check why fees or receipts are not showing."
  },
  {
    label: "HR leave setup",
    prompt: "As Admin, explain how to configure HR leaves including leave types, weekly off, holidays, employee leave eligibility, leave application approval and leave reports."
  },
  {
    label: "HR payroll setup",
    prompt: "As Admin, explain how to configure HR payroll including salary structure, due salary, attendance linkage, payroll reports and common payroll checks."
  },
  {
    label: "HR attendance setup",
    prompt: "As Admin, explain how to configure HR attendance, dummy attendance, daily attendance report, team attendance report and attendance dashboards."
  },
  {
    label: "Faculty LMS workflow",
    prompt: "As Faculty, explain how to use LMS from workload to syllabus mapping, My Syllabus, My CO, course workspace, lesson plan, course material, assignments, quiz and attendance."
  },
  {
    label: "Conduct examination setup",
    prompt: "As Admin, explain the Conduct Examination setup flow: assessment components, create exam, populate exam courses, exam scheduler, exam roll, hall ticket, attendance, marks and reports."
  },
  {
    label: "Question paper management",
    prompt: "As Admin, explain Question Paper Management from paper setter panel and registration to submit question paper, moderator panel, moderation, review and payment/status tracking."
  },
  {
    label: "Exam readiness checklist",
    prompt: "Check exam readiness for academic year 2026-27, regulation R2026, exam EXAM001, program code BCOM. Explain what needs to be configured before hall ticket and marks processing."
  }
];

const statusColor = (status) => {
  if (status === "done") return "success";
  if (status === "running") return "primary";
  if (status === "warning") return "warning";
  if (status === "error") return "error";
  return "default";
};

const safeDateTime = (value) => value ? String(value).replace("T", " ").slice(0, 16) : "";
const wrapGridSx = {
  "& .MuiDataGrid-cell": {
    alignItems: "flex-start",
    lineHeight: 1.35,
    py: 1,
    whiteSpace: "normal",
    overflowWrap: "anywhere"
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    whiteSpace: "normal",
    lineHeight: 1.2
  }
};
const globalSupportPasswordParam = (password) => ({ supportpassword: password || "" });
const isAiTicketResponse = (response) => /^AI Response$/i.test(response?.respondedby || "")
  || /^AI$/i.test(response?.respondedby || "")
  || /^AI Response$/i.test(response?.type || "");

function AiProcessingPasswordGate({ children }) {
  const [password, setPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const unlock = () => {
    if (password !== supportPassword) return setError("Invalid password");
    setVerifiedPassword(password);
    setUnlocked(true);
    setError("");
  };
  if (unlocked) return typeof children === "function" ? children(verifiedPassword) : children;
  return (
    <MenuPageShell title="AI Processing">
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 520 }}>
          <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>AI Processing</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Enter password to process tickets across institutions.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button variant="contained" onClick={unlock}>Unlock</Button>
          </Stack>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

function CentralAiHelpPageBase({
  compact = false,
  pageTitle = "AI Help",
  initialModel = defaultModel,
  initialPassword = ""
}) {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState(initialModel);
  const [password, setPassword] = useState(initialPassword);
  const [conversation, setConversation] = useState([]);
  const [steps, setSteps] = useState([]);
  const [tools, setTools] = useState([]);
  const [rules, setRules] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [samplesOpen, setSamplesOpen] = useState(false);
  const bottomRef = useRef(null);
  const queryRef = useRef(null);

  const modelChanged = model !== initialModel;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, loading]);

  useEffect(() => {
    if (compact) {
      setTimeout(() => queryRef.current?.focus(), 250);
    }
  }, [compact]);

  const loadTools = async () => {
    try {
      const res = await ep1.get("/api/v2/central-tickets/ai-help/tools");
      setTools(res.data?.tools || []);
      setRules(res.data?.rules || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load AI Help tools");
    }
  };

  useEffect(() => { loadTools(); }, []);

  const send = async () => {
    if (!query.trim()) return;
    if (modelChanged && password !== "kumropatash") {
      setError("Password is required to change Gemini model. Default password is kumropatash.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setResult(null);
      const userMessage = { role: "user", content: query, at: new Date().toLocaleString() };
      setConversation((prev) => [...prev, userMessage]);
      setSteps([
        { status: "running", label: "Loading tools", detail: "Preparing LangChain-style tools for permitted view/add/update actions." },
        { status: "running", label: "Gemini thinking", detail: "Gemini will answer or choose tools." }
      ]);
      const res = await ep1.post("/api/v2/central-tickets/ai-help", {
        colid: global1.colid,
        query,
        model,
        password,
        history: conversation,
        user: global1.user,
        name: global1.name,
        role: global1.role,
        regno: global1.regno
      });
      setResult(res.data || null);
      setSteps(res.data?.steps || []);
      setTools(res.data?.tools || tools);
      setRules(res.data?.rules || rules);
      setConversation((prev) => [...prev, {
        role: "assistant",
        content: res.data?.assistantMessage || "No response returned.",
        at: new Date().toLocaleString(),
        needsUserInput: !!res.data?.needsUserInput
      }]);
      setQuery("");
    } catch (err) {
      const message = err.response?.data?.message || "AI Help failed";
      setError(message);
      setSteps(err.response?.data?.steps || [{ status: "error", label: "AI Help failed", detail: message }]);
      setConversation((prev) => [...prev, { role: "assistant", content: message, at: new Date().toLocaleString() }]);
    } finally {
      setLoading(false);
    }
  };

  const toolRows = useMemo(() => tools.map((tool, index) => ({
    id: tool.name || index,
    name: tool.name,
    description: tool.description,
    schema: JSON.stringify(tool.schema || {})
  })), [tools]);

  const ruleRows = useMemo(() => Object.entries(rules).flatMap(([module, items]) => (
    (items || []).map((rule, index) => ({ id: `${module}-${index}`, module, rule }))
  )), [rules]);

  return (
    <MenuPageShell title={pageTitle}>
      <Box sx={{ p: { xs: 1.25, md: 1.75 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={1.5}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: "1px solid #dbeafe", bgcolor: "#ffffff" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
              <Box>
                <Typography fontWeight={900}>Sample Prompts</Typography>
                <Typography variant="body2" color="text.secondary">Open common diagnostics and how-to guides for academic setup, fees, HR, LMS, examination and question papers.</Typography>
              </Box>
              <Button variant="contained" size="small" onClick={() => setSamplesOpen((value) => !value)}>
                {samplesOpen ? "Hide sample prompts" : "Show sample prompts"}
              </Button>
            </Stack>
            {samplesOpen && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.25 }}>
                {samplePrompts.map((item) => (
                  <Button
                    key={item.label}
                    size="small"
                    variant="outlined"
                    disabled={loading}
                    onClick={() => {
                      setQuery(item.prompt);
                      setTimeout(() => queryRef.current?.focus(), 50);
                    }}
                    sx={{ mb: 1 }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #dbeafe",
              overflow: "hidden",
              bgcolor: "#ffffff"
            }}
          >
            <Box sx={{ px: 1.5, py: compact ? 0.75 : 1.5, bgcolor: "#0f172a", color: "#ffffff" }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ xs: "flex-start", md: "center" }}>
                <Box>
                  <Typography variant={compact ? "subtitle1" : "h6"} fontWeight={950}>Conversation</Typography>
                  {!compact && <Typography variant="body2" sx={{ color: "#cbd5e1" }}>Ask, answer follow-ups, and continue like a regular chat.</Typography>}
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" color="success" label={`${tools.length} tools`} />
                  <Chip size="small" label={model} sx={{ bgcolor: "#e0f2fe" }} />
                  <Chip size="small" label={`Role: ${global1.role || "User"}`} sx={{ bgcolor: "#fef3c7" }} />
                  <Chip size="small" label={global1.user || "Current user"} sx={{ bgcolor: "#ede9fe" }} />
                </Stack>
              </Stack>
            </Box>
            <Box sx={{ height: { xs: compact ? "78vh" : "58vh", md: compact ? "80vh" : "62vh" }, display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
              <Stack spacing={1.5} sx={{ flex: 1, overflow: "auto", p: 2 }}>
                {conversation.length === 0 && (
                  <Box sx={{ m: "auto", textAlign: "center", maxWidth: 620 }}>
                    <Typography variant="h5" fontWeight={900}>How can I help?</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      Try asking how to configure academics, fees, HR, LMS, examinations, question papers, workload, timetable, course material, assignments, quizzes or attendance. The bot can ask for missing details before adding or updating records.
                    </Typography>
                  </Box>
                )}
                  {conversation.map((message, index) => (
                    <Box key={index} sx={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          maxWidth: { xs: "94%", md: "76%" },
                          bgcolor: message.role === "user" ? "#dcfce7" : "#ffffff",
                          border: message.needsUserInput ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                          borderRadius: 3,
                          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Chip size="small" label={message.role === "user" ? "You" : "AI Help"} color={message.role === "user" ? "primary" : (message.needsUserInput ? "warning" : "default")} />
                          <Typography variant="caption" color="text.secondary">{message.at}</Typography>
                        </Stack>
                        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{message.content}</Typography>
                      </Paper>
                    </Box>
                  ))}
                  {loading && (
                    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "#ffffff" }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} />
                          <Typography color="text.secondary">AI Help is typing...</Typography>
                        </Stack>
                      </Paper>
                    </Box>
                  )}
                  <Box ref={bottomRef} />
              </Stack>
              <Box sx={{ borderTop: "1px solid #e5e7eb", bgcolor: "#ffffff", p: 1.5 }}>
                <Grid container spacing={1.2} alignItems="flex-end">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      inputRef={queryRef}
                      minRows={2}
                      maxRows={compact ? 3 : 5}
                      label="Type a message"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
                      }}
                      placeholder="Example: Check if course material is uploaded for 2026-27 CS101."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.2}>
                    <TextField select fullWidth size="small" label="Gemini model" value={model} onChange={(e) => setModel(e.target.value)}>
                      {modelOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </TextField>
                  </Grid>
                  {modelChanged && (
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        helperText="Required for model change"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6} md={modelChanged ? 0.9 : 1.9}>
                    <Button fullWidth variant="contained" sx={{ minHeight: 42 }} startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <PlayArrowIcon />} disabled={loading || !query.trim()} onClick={send}>
                      {loading ? "..." : "Send"}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={0.9}>
                    <Button fullWidth variant="outlined" sx={{ minHeight: 42 }} startIcon={<RestartAltIcon />} disabled={loading || !conversation.length} onClick={() => { setConversation([]); setResult(null); setSteps([]); setQuery(""); }}>
                      New
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>

          {!compact && <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb", minHeight: 260 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Live update</Typography>
            <Stepper orientation="vertical" activeStep={steps.findIndex((step) => step.status === "running") >= 0 ? steps.findIndex((step) => step.status === "running") : steps.length}>
              {steps.map((step, index) => (
                <Step key={`${step.label}-${index}`} expanded active completed={step.status === "done"}>
                  <StepLabel icon={<AutoModeIcon color={statusColor(step.status)} />}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={900}>{step.label}</Typography>
                      <Chip size="small" color={statusColor(step.status)} label={step.status || "info"} />
                    </Stack>
                  </StepLabel>
                  <StepContent><Typography color="text.secondary">{step.detail}</Typography></StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>}

          {!compact && <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Tools Created</Typography>
                <DataGrid
                  rows={toolRows}
                  columns={[
                    { field: "name", headerName: "Tool", width: 190 },
                    { field: "description", headerName: "Description", flex: 1, minWidth: 260 },
                    { field: "schema", headerName: "Schema", width: 260 }
                  ]}
                  autoHeight
                  slots={{ toolbar: GridToolbar }}
                  pageSizeOptions={[5, 10, 25]}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Default Rules</Typography>
                <DataGrid
                  rows={ruleRows}
                  columns={[
                    { field: "module", headerName: "Module", width: 150 },
                    { field: "rule", headerName: "Rule", flex: 1, minWidth: 360 }
                  ]}
                  autoHeight
                  slots={{ toolbar: GridToolbar }}
                  pageSizeOptions={[5, 10, 25]}
                />
              </Paper>
            </Grid>
          </Grid>}

          {!compact && <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" fontWeight={900}>Complete result</Typography>
            <Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", bgcolor: "#0f172a", color: "#e5e7eb", p: 2, borderRadius: 2, maxHeight: 560, overflow: "auto" }}>
              {result ? JSON.stringify({
                assistantMessage: result.assistantMessage,
                needsUserInput: result.needsUserInput,
                plan: result.plan,
                toolResults: result.toolResults,
                rawGemini: result.rawGemini
              }, null, 2) : "No result yet."}
            </Box>
          </Paper>}
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function CentralAiHelpBotPage() {
  return (
    <CentralAiHelpPageBase
      compact
      pageTitle="AI Help Bot"
      initialModel={compactDefaultModel}
      initialPassword="kumropatash"
    />
  );
}

const AiResponseEditDialog = React.memo(function AiResponseEditDialog({
  open,
  response,
  saving,
  onClose,
  onSave
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setDraft(response?.response || "");
  }, [open, response]);

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>Edit AI response</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          minRows={10}
          label="AI response"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => onSave(draft)}
          startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

function CentralAiTicketProcessingContent({ supportpassword }) {
  const [tab, setTab] = useState("Pending");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [filters, setFilters] = useState({ colid: "", institution: "", category: "", search: "" });
  const [model, setModel] = useState(compactDefaultModel);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([]);
  const [results, setResults] = useState([]);
  const [editResponse, setEditResponse] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const status = tab === "Closed" ? "Closed" : "All";
      const res = await ep1.get("/api/v2/central-tickets/all-institutions", {
        params: { ...filters, status, ...globalSupportPasswordParam(supportpassword) }
      });
      const data = res.data?.data || [];
      const filtered = tab === "Pending" ? data.filter((row) => !/^closed$/i.test(row.status || "")) : data.filter((row) => /^closed$/i.test(row.status || ""));
      setRows(filtered);
      setSelected([]);
      setActiveTicket(null);
      setTicketDetails(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (row) => {
    try {
      setActiveTicket(row);
      setDetailsLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/central-tickets/all-institutions/details", {
        params: { id: row._id, ...globalSupportPasswordParam(supportpassword) }
      });
      setTicketDetails({ ...(res.data?.data || row), responses: res.data?.responses || [] });
    } catch (err) {
      setTicketDetails({ ...row, responses: [] });
      setError(err.response?.data?.message || "Unable to load ticket details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEditResponse = (response) => {
    setEditResponse(response);
  };

  const openEditResponseFromTicket = async (row) => {
    if (!row) return;
    const responseId = row.airesponseid || row.responseid;
    if (responseId) {
      openEditResponse({
        _id: responseId,
        response: row.airesponse || "",
        colid: row.colid,
        ticketid: row._id
      });
      return;
    }
    try {
      setDetailsLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/central-tickets/all-institutions/details", {
        params: { id: row._id, ...globalSupportPasswordParam(supportpassword) }
      });
      const responses = res.data?.responses || [];
      const aiResponse = responses.find(isAiTicketResponse)
        || responses.find((item) => (item.response || "") === (row.airesponse || ""));
      setActiveTicket(row);
      setTicketDetails({ ...(res.data?.data || row), responses });
      if (!aiResponse?._id) {
        setError("No editable AI response was found for this ticket.");
        return;
      }
      openEditResponse({ ...aiResponse, colid: aiResponse.colid || row.colid, ticketid: row._id });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load AI response for editing");
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveEditedResponse = async (nextResponseText) => {
    if (!editResponse?._id) return;
    try {
      setSavingEdit(true);
      setError("");
      const res = await ep1.post("/api/v2/central-tickets/response-update", {
        responseid: editResponse._id,
        colid: editResponse.colid || ticketDetails?.colid || activeTicket?.colid,
        response: nextResponseText,
        supportpassword,
        user: global1.user
      });
      const updated = res.data?.data;
      setTicketDetails((prev) => ({
        ...(prev || {}),
        responses: (prev?.responses || []).map((row) => row._id === updated?._id ? updated : row)
      }));
      setResults((prev) => (prev || []).map((row) => row.responseid === updated?._id ? { ...row, airesponse: updated.response } : row));
      setRows((prev) => prev.map((row) => row.airesponseid === updated?._id || row._id === editResponse.ticketid ? { ...row, airesponse: updated.response, airesponseid: updated?._id || row.airesponseid } : row));
      setMessage("AI response updated");
      setEditResponse(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update AI response");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTabChange = (_, value) => {
    setTab(value);
    setRows([]);
    setSelected([]);
    setActiveTicket(null);
    setTicketDetails(null);
    setLoading(true);
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const processTickets = async () => {
    if (!selected.length) return setError("Select tickets to process");
    try {
      setProcessing(true);
      setError("");
      setMessage("");
      setSteps([{ status: "running", label: "Sending tickets to AI", detail: `${selected.length} selected ticket(s).` }]);
      const res = await ep1.post("/api/v2/central-tickets/ai-help/process-tickets", {
        ids: selected,
        model,
        colid: global1.colid,
        aicolid: global1.colid,
        supportpassword,
        user: global1.user,
        name: global1.name
      });
      setSteps(res.data?.steps || []);
      setResults(res.data?.results || []);
      setMessage(`AI processing completed for ${res.data?.processed || 0} ticket(s). Responses were saved and tickets were moved to Closed.`);
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "AI processing failed");
      setSteps(err.response?.data?.steps || [{ status: "error", label: "AI processing failed", detail: err.response?.data?.message || err.message }]);
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { field: "colid", headerName: "Colid", width: 90 },
    { field: "institutionname", headerName: "Institution", width: 220 },
    { field: "ticketno", headerName: "Ticket no", width: 150 },
    { field: "category", headerName: "Category", width: 140 },
    { field: "title", headerName: "Title", minWidth: 260, flex: 1 },
    { field: "details", headerName: "Problem", minWidth: 300, flex: 1.2 },
    { field: "airesponse", headerName: "AI Response", minWidth: 360, flex: 1.3 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "raisedby", headerName: "Raised by", width: 170 },
    { field: "raisedbyemail", headerName: "Raised by email", width: 220 },
    { field: "createdAt", headerName: "Created", width: 160, valueGetter: ({ row }) => safeDateTime(row.createdAt) },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          disabled={!row.airesponse && !row.airesponseid && !row.responseid}
          onClick={(event) => {
            event.stopPropagation();
            openEditResponseFromTicket(row);
          }}
        >
          Edit AI
        </Button>
      )
    }
  ];

  const resultRows = (results || []).map((row) => ({ ...row, id: row.ticketid || row.ticketno }));

  return (
    <MenuPageShell title="AI Processing">
        <Box sx={{ p: 2, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight={900}>AI Ticket Processing</Typography>
                  <Typography color="text.secondary">Select pending or closed tickets. AI will inspect the problem, use AI Help tools where needed, and save an AI response to each ticket.</Typography>
                </Box>
                <Chip color="primary" label={`${selected.length} selected`} />
              </Stack>
            </Paper>
            {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}><Tabs value={tab} onChange={handleTabChange}><Tab value="Pending" label="Pending" /><Tab value="Closed" label="Closed" /></Tabs></Grid>
                <Grid item xs={12} md={1.5}><TextField fullWidth size="small" label="Colid" value={filters.colid} onChange={(e) => setFilters((p) => ({ ...p, colid: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Institution" value={filters.institution} onChange={(e) => setFilters((p) => ({ ...p, institution: e.target.value }))} /></Grid>
                <Grid item xs={12} md={1.5}><TextField fullWidth size="small" label="Category" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Search" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Gemini model" value={model} onChange={(e) => setModel(e.target.value)}>{modelOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="outlined" disabled={loading || processing} onClick={loadTickets}>Load</Button></Grid>
                <Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={processing || !selected.length} startIcon={processing ? <CircularProgress color="inherit" size={18} /> : <PlayArrowIcon />} onClick={processTickets}>{processing ? "Processing..." : "Process Selected"}</Button></Grid>
              </Grid>
            </Paper>
            <Paper sx={{ p: 1, borderRadius: 3 }}>
              {loading && (
                <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography fontWeight={800}>Loading {tab.toLowerCase()} tickets...</Typography>
                </Stack>
              )}
              <DataGrid
                rows={rows}
                getRowId={(row) => row._id}
                columns={columns}
                loading={loading}
                checkboxSelection
                autoHeight
                getRowHeight={() => "auto"}
                sx={wrapGridSx}
                rowSelectionModel={selected}
                onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))}
                onRowClick={({ row }) => loadTicketDetails(row)}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true } }}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              />
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 3, minHeight: activeTicket ? 260 : 120 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Selected Ticket Details</Typography>
              {detailsLoading && <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /><Typography sx={{ mt: 1 }}>Loading ticket details...</Typography></Stack>}
              {!detailsLoading && !activeTicket && <Typography color="text.secondary">Select a ticket from the grid to load the full problem and response history.</Typography>}
              {!detailsLoading && activeTicket && (
                <Stack spacing={2}>
                  <Grid container spacing={1.5}>
                    {[
                      ["Ticket no", ticketDetails?.ticketno || activeTicket.ticketno],
                      ["Colid", ticketDetails?.colid || activeTicket.colid],
                      ["Institution", ticketDetails?.institutionname || activeTicket.institutionname],
                      ["Category", ticketDetails?.category || activeTicket.category],
                      ["Status", ticketDetails?.status || activeTicket.status],
                      ["Raised by", ticketDetails?.raisedby || activeTicket.raisedby],
                      ["Raised email", ticketDetails?.raisedbyemail || activeTicket.raisedbyemail],
                      ["Created", safeDateTime(ticketDetails?.createdAt || activeTicket.createdAt)]
                    ].map(([label, value]) => (
                      <Grid item xs={12} sm={6} md={3} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography sx={{ overflowWrap: "anywhere" }}>{value || "-"}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Box>
                    <Typography fontWeight={900}>Problem</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{ticketDetails?.details || activeTicket.details || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography fontWeight={900} sx={{ mb: 1 }}>Responses</Typography>
                    <Stack spacing={1}>
                      {(ticketDetails?.responses || []).length ? (ticketDetails.responses || []).map((response) => {
                        const isAi = isAiTicketResponse(response);
                        return (
                          <Paper key={response._id} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                              <Typography fontWeight={800}>
                                {response.respondedby || response.respondedbyemail || "-"} <Typography component="span" variant="body2" color="text.secondary">{safeDateTime(response.createdAt)}</Typography>
                              </Typography>
                              {isAi && <Button size="small" variant="outlined" onClick={() => openEditResponse(response)}>Edit AI response</Button>}
                            </Stack>
                            <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", mt: 1 }}>{response.response || "-"}</Typography>
                          </Paper>
                        );
                      }) : <Typography color="text.secondary">No responses yet.</Typography>}
                    </Stack>
                  </Box>
                </Stack>
              )}
            </Paper>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, borderRadius: 3, height: 420, overflow: "auto" }}>
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Live Progress</Typography>
                  <Stepper orientation="vertical" activeStep={steps.findIndex((step) => step.status === "running") >= 0 ? steps.findIndex((step) => step.status === "running") : steps.length}>
                    {steps.map((step, index) => (
                      <Step key={`${step.label}-${index}`} expanded active completed={step.status === "done"}>
                        <StepLabel icon={<AutoModeIcon color={statusColor(step.status)} />}>
                          <Typography fontWeight={800}>{step.label}</Typography>
                        </StepLabel>
                        <StepContent><Typography color="text.secondary">{step.detail}</Typography></StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Paper>
              </Grid>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>AI Responses Saved</Typography>
                  <DataGrid
                    rows={resultRows}
                    columns={[
                      { field: "ticketno", headerName: "Ticket", width: 150 },
                      { field: "colid", headerName: "Colid", width: 90 },
                      { field: "status", headerName: "Status", width: 120 },
                      { field: "airesponse", headerName: "AI Response", flex: 1, minWidth: 420 },
                      {
                        field: "actions",
                        headerName: "Actions",
                        width: 130,
                        sortable: false,
                        renderCell: ({ row }) => (
                          <Button size="small" variant="outlined" onClick={() => openEditResponse({ _id: row.responseid, response: row.airesponse, colid: row.colid })}>Edit</Button>
                        )
                      }
                    ]}
                    autoHeight
                    getRowHeight={() => "auto"}
                    sx={wrapGridSx}
                    slots={{ toolbar: GridToolbar }}
                    pageSizeOptions={[5, 10, 25]}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Stack>
          <AiResponseEditDialog
            open={Boolean(editResponse)}
            response={editResponse}
            saving={savingEdit}
            onClose={() => setEditResponse(null)}
            onSave={saveEditedResponse}
          />
        </Box>
    </MenuPageShell>
  );
}

export function CentralAiTicketProcessingPage() {
  return (
    <AiProcessingPasswordGate>
      {(supportpassword) => <CentralAiTicketProcessingContent supportpassword={supportpassword} />}
    </AiProcessingPasswordGate>
  );
}

export default function CentralAiHelpPage() {
  return <CentralAiHelpPageBase />;
}
