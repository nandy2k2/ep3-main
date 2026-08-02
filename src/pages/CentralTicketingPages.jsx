import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MentoringLayout from "./MentoringLayout";

const colors = ["#2563eb", "#16a34a", "#f97316", "#9333ea", "#0891b2", "#dc2626"];
const supportPassword = "kumropatash";
const emptyTicketForm = { title: "", details: "", startdate: "", starttime: "", priority: "Normal" };
const safeDate = (value) => value ? String(value).slice(0, 10) : "";
const safeDateTime = (value) => value ? String(value).replace("T", " ").slice(0, 16) : "";

function Shell({ title, children }) {
  return (
    <MentoringLayout title={title}>
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={900}>{title}</Typography>
      </Paper>
      {children}
    </MentoringLayout>
  );
}

function PasswordGate({ children }) {
  const [password, setPassword] = useState(sessionStorage.getItem("centralTicketSupportPassword") || "");
  const [unlocked, setUnlocked] = useState(password === supportPassword);
  const [error, setError] = useState("");
  const unlock = () => {
    if (password !== supportPassword) return setError("Invalid password");
    sessionStorage.setItem("centralTicketSupportPassword", password);
    setUnlocked(true);
    setError("");
  };
  if (unlocked) return children;
  return (
    <Shell title="Central support access">
      <Paper sx={{ p: 3, maxWidth: 520 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <Typography color="text.secondary">Enter support password to view centralized tickets.</Typography>
          <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button variant="contained" onClick={unlock}>Unlock support desk</Button>
        </Stack>
      </Paper>
    </Shell>
  );
}

function AttachmentLinks({ attachments = [] }) {
  if (!attachments?.length) return <Typography variant="body2" color="text.secondary">No attachments</Typography>;
  return (
    <Stack spacing={0.5}>
      {attachments.map((file, index) => (
        <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer">{file.originalname || file.filename || `Attachment ${index + 1}`}</a>
      ))}
    </Stack>
  );
}

const ticketColumns = [
  { field: "ticketno", headerName: "Ticket no", width: 150 },
  { field: "title", headerName: "Title", width: 260 },
  { field: "priority", headerName: "Priority", width: 110 },
  { field: "status", headerName: "Status", width: 120 },
  { field: "raisedby", headerName: "Raised by", width: 170 },
  { field: "raisedbyemail", headerName: "Raised by email", width: 220 },
  { field: "assignedtoemail", headerName: "Assigned to", width: 220 },
  { field: "startdatetime", headerName: "Start date/time", width: 170, valueGetter: ({ row }) => safeDateTime(row.startdatetime) },
  { field: "createdAt", headerName: "Created", width: 140, valueGetter: ({ row }) => safeDate(row.createdAt) },
  { field: "closedat", headerName: "Closed", width: 140, valueGetter: ({ row }) => safeDate(row.closedat) }
];

function useTicketUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    ep1.get("/api/v2/central-tickets/users", { params: { colid: global1.colid } }).then((res) => setUsers(res.data?.data || [])).catch(() => setUsers([]));
  }, []);
  return users;
}

function TicketDetails({ selected, details, loadDetails, canRespond, onChanged }) {
  const users = useTicketUsers();
  const [assignee, setAssignee] = useState(null);
  const [form, setForm] = useState({ response: "", status: "Pending" });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setAssignee(null);
    setForm({ response: "", status: selected?.status || "Pending" });
    setFile(null);
    setMessage("");
    setError("");
  }, [selected?._id]);
  if (!selected) return <Paper sx={{ p: 2 }}><Typography color="text.secondary">Select a ticket to view details.</Typography></Paper>;
  const assign = async () => {
    try {
      setError("");
      if (!assignee?.email) return setError("Select user to assign");
      await ep1.post("/api/v2/central-tickets/update", { id: selected._id, colid: global1.colid, assignedto: assignee.name, assignedtoemail: assignee.email });
      setMessage("Ticket assigned");
      onChanged();
      loadDetails(selected._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign ticket");
    }
  };
  const respond = async () => {
    try {
      setError("");
      const payload = new FormData();
      payload.append("ticketid", selected._id);
      payload.append("colid", global1.colid);
      payload.append("response", form.response);
      payload.append("status", form.status);
      payload.append("respondedby", global1.name || global1.user);
      payload.append("respondedbyemail", global1.user);
      payload.append("user", global1.user);
      if (assignee?.email) {
        payload.append("assignedto", assignee.name || assignee.email);
        payload.append("assignedtoemail", assignee.email);
      }
      if (file) payload.append("file", file);
      await ep1.post("/api/v2/central-tickets/respond", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage("Response saved");
      setForm({ response: "", status: form.status });
      setFile(null);
      onChanged();
      loadDetails(selected._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save response");
    }
  };
  return (
    <Paper sx={{ p: 2 }}>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Typography variant="h6" fontWeight={900}>{selected.ticketno} - {selected.title}</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}><Typography><strong>Status:</strong> {details?.status || selected.status}</Typography></Grid>
        <Grid item xs={12} md={6}><Typography><strong>Raised by:</strong> {selected.raisedby || selected.raisedbyemail}</Typography></Grid>
        <Grid item xs={12}><Typography sx={{ whiteSpace: "pre-wrap" }}>{details?.details || selected.details}</Typography></Grid>
        <Grid item xs={12}><Typography fontWeight={800}>Ticket attachments</Typography><AttachmentLinks attachments={details?.attachments || selected.attachments || []} /></Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography fontWeight={900} sx={{ mb: 1 }}>Responses</Typography>
        <Stack spacing={1}>
          {(details?.responses || []).map((row) => (
            <Paper key={row._id} variant="outlined" sx={{ p: 1.5 }}>
              <Typography fontWeight={800}>{row.respondedby || row.respondedbyemail} <Typography component="span" color="text.secondary" variant="body2">{safeDateTime(row.createdAt)}</Typography></Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{row.response}</Typography>
              <AttachmentLinks attachments={row.attachments || []} />
            </Paper>
          ))}
        </Stack>
      </Box>
      {canRespond && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><Autocomplete options={users} value={assignee} getOptionLabel={(o) => `${o.name || ""} - ${o.email || ""}`} onChange={(_, v) => setAssignee(v)} renderInput={(params) => <TextField {...params} size="small" label="Assign / reassign to user" />} /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={assign}>Assign</Button></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="Open">Open</MenuItem><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Closed">Closed</MenuItem></TextField></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Response" value={form.response} onChange={(e) => setForm((p) => ({ ...p, response: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><Button variant="outlined" component="label">Upload attachment<input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>{file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}</Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" onClick={respond}>Save response</Button></Grid>
          </Grid>
        </Paper>
      )}
    </Paper>
  );
}

export function CentralTicketRaisePage() {
  const [form, setForm] = useState(emptyTicketForm);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const res = await ep1.get("/api/v2/central-tickets", { params: { colid: global1.colid, scope: "mine", user: global1.user } });
    setRows(res.data?.data || []);
  };
  const loadDetails = async (id) => {
    const res = await ep1.get("/api/v2/central-tickets/details", { params: { colid: global1.colid, id } });
    setDetails({ ...(res.data?.data || {}), responses: res.data?.responses || [] });
  };
  useEffect(() => { load(); }, []);
  const submit = async () => {
    try {
      setError("");
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value || ""));
      payload.append("startdatetime", form.startdate && form.starttime ? `${form.startdate}T${form.starttime}` : "");
      payload.append("colid", global1.colid);
      payload.append("raisedby", global1.name || global1.user);
      payload.append("raisedbyemail", global1.user);
      payload.append("raisedbyrole", global1.role || "");
      payload.append("user", global1.user);
      if (file) payload.append("file", file);
      const res = await ep1.post("/api/v2/central-tickets", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage(`Ticket created: ${res.data?.data?.ticketno || ""}`);
      setForm(emptyTicketForm);
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create ticket");
    }
  };
  return (
    <Shell title="Raise ticket">
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Priority" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}><MenuItem value="Low">Low</MenuItem><MenuItem value="Normal">Normal</MenuItem><MenuItem value="High">High</MenuItem><MenuItem value="Urgent">Urgent</MenuItem></TextField></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Start date" InputLabelProps={{ shrink: true }} value={form.startdate} onChange={(e) => setForm((p) => ({ ...p, startdate: e.target.value }))} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth size="small" type="time" label="Start time" InputLabelProps={{ shrink: true }} value={form.starttime} onChange={(e) => setForm((p) => ({ ...p, starttime: e.target.value }))} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Details" value={form.details} onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))} /></Grid>
          <Grid item xs={12} md={4}><Button variant="outlined" component="label">Upload attachment<input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>{file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}</Grid>
          <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={submit}>Submit ticket</Button></Grid>
        </Grid>
      </Paper>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} autoHeight slots={{ toolbar: GridToolbar }} columns={ticketColumns} onRowClick={({ row }) => { setSelected(row); loadDetails(row._id); }} /></Paper></Grid>
        <Grid item xs={12} md={5}><TicketDetails selected={selected} details={details} loadDetails={loadDetails} canRespond={false} onChanged={load} /></Grid>
      </Grid>
    </Shell>
  );
}

export function CentralSupportDeskPage() {
  const [tab, setTab] = useState("Open");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [search, setSearch] = useState("");
  const load = async () => {
    const res = await ep1.get("/api/v2/central-tickets", { params: { colid: global1.colid, status: tab, search } });
    setRows(res.data?.data || []);
  };
  const loadDetails = async (id) => {
    const res = await ep1.get("/api/v2/central-tickets/details", { params: { colid: global1.colid, id } });
    setDetails({ ...(res.data?.data || {}), responses: res.data?.responses || [] });
  };
  useEffect(() => { load(); }, [tab]);
  return (
    <PasswordGate>
      <Shell title="Central support desk">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}><Tabs value={tab} onChange={(_, v) => setTab(v)}><Tab value="Open" label="New" /><Tab value="Pending" label="Pending" /><Tab value="Closed" label="Closed" /></Tabs></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={load}>Apply</Button></Grid>
          </Grid>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} autoHeight slots={{ toolbar: GridToolbar }} columns={ticketColumns} onRowClick={({ row }) => { setSelected(row); loadDetails(row._id); }} /></Paper></Grid>
          <Grid item xs={12} md={5}><TicketDetails selected={selected} details={details} loadDetails={loadDetails} canRespond onChanged={load} /></Grid>
        </Grid>
      </Shell>
    </PasswordGate>
  );
}

export function CentralTicketReportPage() {
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });
  const [data, setData] = useState({ summary: {}, daywise: [], weekwise: [], monthwise: [], avgCloseTime: [], byStatus: [], details: [] });
  const printRef = useRef(null);
  const load = async () => {
    const res = await ep1.get("/api/v2/central-tickets/report", { params: { ...filters, colid: global1.colid } });
    setData(res.data || {});
  };
  useEffect(() => { load(); }, []);
  const print = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Ticket Report</title><style>@page{size:A4;margin:12mm}body{font-family:Arial;color:#111}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #ddd;padding:5px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.card{border:1px solid #ddd;padding:8px}button{display:none}</style></head><body>${printRef.current?.innerHTML || ""}</body></html>`);
    w.document.close();
    w.print();
  };
  const cards = [["Total", data.summary?.total || 0], ["Open", data.summary?.open || 0], ["Pending", data.summary?.pending || 0], ["Closed", data.summary?.closed || 0]];
  return (
    <PasswordGate>
      <Shell title="Ticket reports">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label="From date" InputLabelProps={{ shrink: true }} value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label="To date" InputLabelProps={{ shrink: true }} value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={load}>Apply</Button></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={print}>Print</Button></Grid>
          </Grid>
        </Paper>
        <Box ref={printRef}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {cards.map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Daywise raised vs solved</Typography><ResponsiveContainer><BarChart data={data.daywise || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Bar dataKey="raised" fill="#2563eb" /><Bar dataKey="solved" fill="#16a34a" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Weekly average close time</Typography><ResponsiveContainer><LineChart data={data.avgCloseTime || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Line dataKey="averageHoursToClose" stroke="#f97316" strokeWidth={3} /></LineChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Monthwise raised vs solved</Typography><ResponsiveContainer><BarChart data={data.monthwise || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Bar dataKey="raised" fill="#9333ea" /><Bar dataKey="solved" fill="#0891b2" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Status mix</Typography><ResponsiveContainer><PieChart><Pie data={data.byStatus || []} dataKey="count" nameKey="status" outerRadius={110}>{(data.byStatus || []).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Paper></Grid>
          </Grid>
          <Paper sx={{ p: 1 }}><Typography fontWeight={900}>Ticket details</Typography><DataGrid rows={data.details || []} getRowId={(r) => r._id} autoHeight slots={{ toolbar: GridToolbar }} columns={ticketColumns} /></Paper>
        </Box>
      </Shell>
    </PasswordGate>
  );
}
