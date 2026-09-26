import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Grid, LinearProgress, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Delete, Edit, Email, Payment, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#ea580c", "#4f46e5"];
const money = (v) => Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const label = (field) => ({
  academicyear: "Academic Year", program: "Program", programcode: "Program Code", semester: "Semester", gender: "Gender",
  dresstype: "Dress Type", size: "Size", cost: "Cost", fees: "Fees", status: "Status", student: "Student", regno: "Reg No"
}[field] || field);
const gridSx = { "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "start", py: 1 }, "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal" } };
const csvRows = (text) => {
  const lines = String(text || "").split(/\r?\n/).filter(Boolean);
  const headers = (lines.shift() || "").split(",").map((h) => h.trim());
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value?.trim() || ""])));
};

function Shell({ title, student, children }) {
  return <MenuPageShell title={title} menuType={student ? "student" : undefined}><Box sx={{ p: 3 }}>{children}</Box></MenuPageShell>;
}

function Msg({ error, message, setError, setMessage }) {
  return <>{error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}</>;
}

function SearchBox({ label: title, options, value, onChange, getOptionLabel = (o) => o || "" }) {
  return <Autocomplete options={options || []} value={value || null} onChange={(_, v) => onChange(v)} getOptionLabel={getOptionLabel} renderInput={(p) => <TextField {...p} size="small" label={title} />} />;
}

function useOptions() {
  const [options, setOptions] = useState({});
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/convocation-new/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };
  useEffect(() => { loadOptions().catch(() => setOptions({})); }, []);
  return { options, loadOptions };
}

function CrudPage({ kind, title, blank, fields, columns }) {
  const { options, loadOptions } = useOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await ep1.get(`/api/v2/convocation-new/${kind}`, { params: { colid: global1.colid } });
      setRows(res.data.data || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to load data"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setLoading(true); setError("");
    try {
      await ep1.post(`/api/v2/convocation-new/${kind}`, { ...form, id: editingId, colid: global1.colid, name: global1.name, user: global1.user });
      setMessage(editingId ? "Updated successfully" : "Saved successfully");
      setEditingId(""); setForm(blank); await load(); await loadOptions();
    } catch (err) { setError(err.response?.data?.message || "Unable to save"); }
    finally { setLoading(false); }
  };
  const remove = async (ids = selected) => {
    if (!ids.length) return;
    setLoading(true);
    try { await ep1.post(`/api/v2/convocation-new/${kind}/delete`, { colid: global1.colid, ids }); setMessage("Deleted successfully"); setSelected([]); await load(); }
    catch (err) { setError(err.response?.data?.message || "Unable to delete"); }
    finally { setLoading(false); }
  };
  const bulk = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const text = await file.text();
    for (const row of csvRows(text)) await ep1.post(`/api/v2/convocation-new/${kind}`, { ...row, colid: global1.colid, name: global1.name, user: global1.user });
    setMessage("Bulk upload completed"); await load(); event.target.value = "";
  };
  const fieldInput = (field) => {
    if (["gender", "dresstype", "size", "academicyear", "programcode"].includes(field)) {
      const key = field === "programcode" ? "programcodes" : field === "academicyear" ? "academicyears" : `${field}s`;
      return <Autocomplete freeSolo options={options[key] || []} value={form[field] || ""} onInputChange={(_, v) => setField(field, v || "")} onChange={(_, v) => setField(field, v || "")} renderInput={(p) => <TextField {...p} size="small" label={label(field)} />} />;
    }
    if (field === "status") return <TextField select fullWidth size="small" label="Status" value={form.status || "Active"} onChange={(e) => setField("status", e.target.value)}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField>;
    return <TextField fullWidth size="small" type={["cost", "fees"].includes(field) ? "number" : "text"} label={label(field)} value={form[field] || ""} onChange={(e) => setField(field, e.target.value)} />;
  };
  return <Shell title={title}><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>{title}</Typography><Msg error={error} message={message} setError={setError} setMessage={setMessage} />{loading && <LinearProgress sx={{ mb: 2 }} />}<Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}>{fields.map((field) => <Grid item xs={12} md={field === "program" ? 3 : 2} key={field}>{fieldInput(field)}</Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid></Grid></Paper><Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}><Button variant="outlined" startIcon={<Refresh />} onClick={load}>Load</Button><Button component="label" variant="outlined" startIcon={<UploadFile />}>Bulk upload<input hidden type="file" accept=".csv" onChange={bulk} /></Button><Button color="error" variant="outlined" startIcon={<Delete />} disabled={!selected.length} onClick={() => remove()}>Bulk delete</Button></Stack><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} columns={[...columns, { field: "actions", type: "actions", width: 90, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...blank, ...row }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove([row._id])} />] }]} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} sx={gridSx} /></Paper></Shell>;
}

export function ConvocationDressMasterPage() {
  return <CrudPage kind="dress" title="Convocation dress master" blank={{ gender: "", dresstype: "", size: "", cost: "", status: "Active" }} fields={["gender", "dresstype", "size", "cost", "status"]} columns={[{ field: "gender", headerName: "Gender", width: 120 }, { field: "dresstype", headerName: "Dress Type", width: 180 }, { field: "size", headerName: "Size", width: 100 }, { field: "cost", headerName: "Cost", width: 110, type: "number" }, { field: "status", headerName: "Status", width: 110 }]} />;
}

export function ConvocationProgramFeesPage() {
  return <CrudPage kind="programfee" title="Programwise convocation fees" blank={{ academicyear: "", program: "", programcode: "", fees: "", status: "Active" }} fields={["academicyear", "program", "programcode", "fees", "status"]} columns={[{ field: "academicyear", headerName: "Academic Year", width: 140 }, { field: "program", headerName: "Program", width: 220 }, { field: "programcode", headerName: "Program Code", width: 140 }, { field: "fees", headerName: "Fees", width: 110, type: "number" }, { field: "status", headerName: "Status", width: 110 }]} />;
}

export function StudentConvocationDressPage() {
  const nav = useNavigate();
  const { options, loadOptions } = useOptions();
  const [profile, setProfile] = useState(null);
  const [dress, setDress] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    const res = await ep1.get("/api/v2/convocation-new-student/profile", { params: { colid: global1.colid, regno: global1.regno || global1.user } });
    setProfile(res.data);
  };
  useEffect(() => { load().catch((e) => setError(e.response?.data?.message || "Unable to load profile")); }, []);
  const filteredDresses = useMemo(() => (options.dresses || []).filter((d) => !profile?.student?.gender || !d.gender || String(d.gender).toLowerCase() === String(profile.student.gender).toLowerCase() || String(d.gender).toLowerCase() === "other"), [options, profile]);
  const apply = async () => {
    if (!dress?._id) return setError("Select a dress first");
    const res = await ep1.post("/api/v2/convocation-new-student/dress", { colid: global1.colid, regno: global1.regno || global1.user, dressid: dress._id });
    setMessage("Dress added to student ledger. You can pay from this screen.");
    await load(); await loadOptions(); setDress(null);
    return res;
  };
  return <Shell title="Convocation dress" student><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Convocation dress</Typography><Msg error={error} message={message} setError={setError} setMessage={setMessage} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={8}><SearchBox label="Select dress" options={filteredDresses} value={dress} onChange={setDress} getOptionLabel={(d) => d ? `${d.gender} - ${d.dresstype} - ${d.size} - Rs. ${money(d.cost)}` : ""} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={apply}>Add to cart</Button></Grid><Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={<Payment />} onClick={() => nav("/studentonlinefeepayment2")}>Pay</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ p: 1 }}>My dress orders</Typography><DataGrid autoHeight rows={profile?.orders || []} getRowId={(r) => r._id} columns={[{ field: "dresstype", headerName: "Dress", width: 180 }, { field: "size", headerName: "Size", width: 100 }, { field: "cost", headerName: "Cost", width: 100 }, { field: "paymentstatus", headerName: "Payment", width: 120 }, { field: "shippingstatus", headerName: "Shipping", width: 160 }, { field: "trackingno", headerName: "Tracking No", width: 180 }, { field: "courier", headerName: "Courier", width: 160 }]} slots={{ toolbar: GridToolbar }} /></Paper></Shell>;
}

export function StudentConvocationRegistrationPage() {
  const nav = useNavigate();
  const { options } = useOptions();
  const [profile, setProfile] = useState(null);
  const [academicyear, setAcademicyear] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    const res = await ep1.get("/api/v2/convocation-new-student/profile", { params: { colid: global1.colid, regno: global1.regno || global1.user } });
    setProfile(res.data);
  };
  useEffect(() => { load().catch((e) => setError(e.response?.data?.message || "Unable to load profile")); }, []);
  const register = async () => {
    if (!academicyear) return setError("Select academic year");
    await ep1.post("/api/v2/convocation-new-student/register", { colid: global1.colid, regno: global1.regno || global1.user, academicyear });
    setMessage("Convocation registration added to student ledger. You can pay from this screen.");
    await load();
  };
  return <Shell title="Convocation registration" student><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Convocation registration</Typography><Msg error={error} message={message} setError={setError} setMessage={setMessage} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={6}><Autocomplete options={options.academicyears || []} value={academicyear || null} onChange={(_, v) => setAcademicyear(v || "")} renderInput={(p) => <TextField {...p} label="Academic Year" size="small" />} /></Grid><Grid item xs={12} md={3}><Button fullWidth variant="contained" onClick={register}>Register</Button></Grid><Grid item xs={12} md={3}><Button fullWidth variant="outlined" startIcon={<Payment />} onClick={() => nav("/studentonlinefeepayment2")}>Pay</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><Typography fontWeight={900} sx={{ p: 1 }}>My registrations</Typography><DataGrid autoHeight rows={profile?.registrations || []} getRowId={(r) => r._id} columns={[{ field: "academicyear", headerName: "Year", width: 130 }, { field: "programcode", headerName: "Program Code", width: 140 }, { field: "fees", headerName: "Fees", width: 100 }, { field: "paymentstatus", headerName: "Payment", width: 130 }, { field: "status", headerName: "Status", width: 130 }]} slots={{ toolbar: GridToolbar }} /></Paper></Shell>;
}

export function ConvocationShippingPage() {
  const { options } = useOptions();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [tab, setTab] = useState("Shipping pending");
  const [filters, setFilters] = useState({ gender: "", dresstype: "", size: "" });
  const [ship, setShip] = useState({ shippingaddress: "", courier: "", trackingno: "", shippeddate: today(), shippingremarks: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await ep1.get("/api/v2/convocation-new/shipping", { params: { colid: global1.colid, shippingstatus: tab, ...filters } });
      setRows(res.data.data || []);
    } catch (e) { setError(e.response?.data?.message || "Unable to load shipping"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);
  const update = async () => {
    if (!selected.length) return setError("Select students first");
    await ep1.post("/api/v2/convocation-new/shipping", { colid: global1.colid, ids: selected, ...ship });
    setMessage("Shipping updated"); setSelected([]); await load();
  };
  const columns = [{ field: "student", headerName: "Student", width: 190 }, { field: "regno", headerName: "Reg No", width: 140 }, { field: "programcode", headerName: "Program Code", width: 130 }, { field: "gender", headerName: "Gender", width: 100 }, { field: "dresstype", headerName: "Dress", width: 160 }, { field: "size", headerName: "Size", width: 90 }, { field: "cost", headerName: "Cost", width: 100 }, { field: "shippingstatus", headerName: "Shipping", width: 150 }, { field: "courier", headerName: "Courier", width: 150 }, { field: "trackingno", headerName: "Tracking No", width: 180 }];
  return <Shell title="Convocation Shipping"><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Shipping</Typography><Msg error={error} message={message} setError={setError} setMessage={setMessage} />{loading && <LinearProgress sx={{ mb: 2 }} />}<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}><Tab value="Shipping pending" label="Shipping pending" /><Tab value="Shipped" label="Shipped" /></Tabs><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}>{["gender", "dresstype", "size"].map((f) => <Grid item xs={12} md={3} key={f}><Autocomplete options={options[`${f}s`] || []} value={filters[f] || null} onChange={(_, v) => setFilters((p) => ({ ...p, [f]: v || "" }))} renderInput={(p) => <TextField {...p} size="small" label={label(f)} />} /></Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Refresh />} onClick={load}>Load</Button></Grid></Grid></Paper>{tab === "Shipping pending" && <Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}>{["shippingaddress", "courier", "trackingno", "shippeddate", "shippingremarks"].map((f) => <Grid item xs={12} md={f === "shippingaddress" ? 4 : 2} key={f}><TextField fullWidth size="small" type={f === "shippeddate" ? "date" : "text"} InputLabelProps={f === "shippeddate" ? { shrink: true } : undefined} label={label(f)} value={ship[f] || ""} onChange={(e) => setShip((p) => ({ ...p, [f]: e.target.value }))} /></Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={update}>Update shipping</Button></Grid></Grid></Paper>}<Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} sx={gridSx} /></Paper></Shell>;
}

function ReportPage({ title, endpoint, chartField = "byProgram" }) {
  const { options } = useOptions();
  const [filters, setFilters] = useState({});
  const [data, setData] = useState({ data: [], totals: {}, summaries: {} });
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const res = await ep1.get(endpoint, { params: { colid: global1.colid, ...filters } }); setData(res.data || {}); setLoading(false); };
  const rows = data.data || [];
  const summary = data.summaries?.[chartField] || [];
  return <Shell title={title}><style>{`@media print{body *{visibility:hidden}.print-area,.print-area *{visibility:visible}.print-area{position:absolute;left:0;top:0;width:100%;padding:8mm}.no-print{display:none!important}}`}</style><Typography className="no-print" variant="h5" fontWeight={900} sx={{ mb: 1 }}>{title}</Typography><Paper className="no-print" sx={{ p: 2, mb: 2 }}><Grid container spacing={2}>{["academicyear", "programcode", "semester", "gender", "dresstype", "size", "paymentstatus", "shippingstatus"].map((f) => <Grid item xs={12} md={2} key={f}><Autocomplete options={options[f === "academicyear" ? "academicyears" : f === "programcode" ? "programcodes" : `${f}s`] || []} value={filters[f] || null} onChange={(_, v) => setFilters((p) => ({ ...p, [f]: v || "" }))} renderInput={(p) => <TextField {...p} size="small" label={label(f)} />} /></Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={load}>Load</Button></Grid><Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={<Print />} onClick={() => window.print()}>Print</Button></Grid></Grid></Paper><Box className="print-area"><Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>{title}</Typography>{loading && <LinearProgress sx={{ mb: 2 }} />}<Grid container spacing={2} sx={{ mb: 2 }}>{[["Total", data.totals?.count || 0], ["Paid", data.totals?.paid || 0], ["Pending", data.totals?.pending || 0], ["Amount", `Rs. ${money(data.totals?.amount)}`]].map(([k, v]) => <Grid item xs={12} md={3} key={k}><Card><CardContent><Typography color="text.secondary">{k}</Typography><Typography variant="h5" fontWeight={900}>{v}</Typography></CardContent></Card></Grid>)}</Grid><Grid container spacing={2} sx={{ mb: 2 }}><Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 300 }}><ResponsiveContainer><BarChart data={summary}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><ChartTooltip /><Legend /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></Paper></Grid><Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 300 }}><ResponsiveContainer><PieChart><Pie data={summary.slice(0, 8)} dataKey="count" nameKey="label" outerRadius={95} label>{summary.slice(0, 8).map((e, i) => <Cell key={e.label} fill={colors[i % colors.length]} />)}</Pie><ChartTooltip /></PieChart></ResponsiveContainer></Paper></Grid></Grid><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r._id || r.id || r.regno} columns={Object.keys(rows[0] || { student: "", regno: "" }).filter((f) => !["__v"].includes(f)).slice(0, 14).map((f) => ({ field: f, headerName: label(f), width: 150 }))} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Box></Shell>;
}

export function ConvocationDressReportPage() { return <ReportPage title="Convocation dress summary" endpoint="/api/v2/convocation-new/reports/dress" chartField="byDress" />; }
export function ConvocationFeeReportPage() { return <ReportPage title="Convocation fee report" endpoint="/api/v2/convocation-new/reports/fees" chartField="byProgram" />; }

function MandatoryExamFilters({ filters, setFilters, includeEmail }) {
  const { options } = useOptions();
  return <Grid container spacing={2}>{["academicyear", "programcode", "semester"].map((f) => <Grid item xs={12} md={includeEmail ? 2 : 3} key={f}><Autocomplete options={options[f === "academicyear" ? "academicyears" : f === "programcode" ? "programcodes" : "semesters"] || []} value={filters[f] || null} onChange={(_, v) => setFilters((p) => ({ ...p, [f]: v || "" }))} renderInput={(p) => <TextField {...p} size="small" label={`${label(f)} *`} />} /></Grid>)}</Grid>;
}

export function ConvocationGoldMedalListPage() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [topper, setTopper] = useState(null);
  const [error, setError] = useState("");
  const load = async () => { try { const res = await ep1.get("/api/v2/convocation-new/gold-medal-list", { params: { colid: global1.colid, ...filters } }); setRows(res.data.data || []); setTopper(res.data.topper || null); } catch (e) { setError(e.response?.data?.message || "Unable to load gold medal list"); } };
  return <Shell title="Gold medal list"><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Gold medal list</Typography><Msg error={error} message="" setError={setError} setMessage={() => {}} /><Paper sx={{ p: 2, mb: 2 }}><MandatoryExamFilters filters={filters} setFilters={setFilters} /><Button sx={{ mt: 2 }} variant="contained" onClick={load}>Load</Button></Paper>{topper && <Alert severity="success" sx={{ mb: 2 }}>Topper: {topper.student} ({topper.regno}) - {topper.totalmarks}</Alert>}<Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r.regno} columns={[{ field: "student", headerName: "Student", width: 220 }, { field: "regno", headerName: "Reg No", width: 150 }, { field: "programcode", headerName: "Program Code", width: 140 }, { field: "semester", headerName: "Semester", width: 110 }, { field: "courses", headerName: "Courses", width: 100 }, { field: "totalmarks", headerName: "Total Marks", width: 140 }]} slots={{ toolbar: GridToolbar }} /></Paper></Shell>;
}

export function ConvocationStudentsPage() {
  const { options } = useOptions();
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mail, setMail] = useState({ emailconfigurationid: "", subject: "Convocation notification", body: "Dear Student,\n\nYou are eligible for convocation. Please complete the required formalities.\n\nRegards" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { try { const res = await ep1.get("/api/v2/convocation-new/eligible-students", { params: { colid: global1.colid, ...filters } }); setRows(res.data.data || []); } catch (e) { setError(e.response?.data?.message || "Unable to load students"); } };
  const send = async () => {
    const recipients = rows.filter((r) => selected.includes(r.regno));
    await ep1.post("/api/v2/convocation-new/send-mail", { colid: global1.colid, ...filters, ...mail, recipients });
    setMessage(`Mail sent to ${recipients.length} student(s)`);
  };
  return <Shell title="Convocation students"><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Convocation students</Typography><Msg error={error} message={message} setError={setError} setMessage={setMessage} /><Paper sx={{ p: 2, mb: 2 }}><MandatoryExamFilters filters={filters} setFilters={setFilters} includeEmail /><Button sx={{ mt: 2 }} variant="contained" onClick={load}>Load eligible students</Button></Paper><Paper sx={{ p: 2, mb: 2 }}><Typography fontWeight={900} sx={{ mb: 1 }}>Send mail</Typography><Grid container spacing={2}><Grid item xs={12} md={3}><Autocomplete options={options.emailconfigs || []} getOptionLabel={(o) => o.label || ""} onChange={(_, v) => setMail((p) => ({ ...p, emailconfigurationid: v?._id || "" }))} renderInput={(p) => <TextField {...p} size="small" label="Email configuration" />} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Subject" value={mail.subject} onChange={(e) => setMail((p) => ({ ...p, subject: e.target.value }))} /></Grid><Grid item xs={12} md={4}><TextField fullWidth multiline minRows={3} label="Body" value={mail.body} onChange={(e) => setMail((p) => ({ ...p, body: e.target.value }))} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Email />} disabled={!selected.length} onClick={send}>Send</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid autoHeight rows={rows} getRowId={(r) => r.regno} columns={[{ field: "student", headerName: "Student", width: 220 }, { field: "regno", headerName: "Reg No", width: 150 }, { field: "email", headerName: "Email", width: 220 }, { field: "programcode", headerName: "Program Code", width: 140 }, { field: "semester", headerName: "Semester", width: 110 }, { field: "courses", headerName: "Courses", width: 100 }, { field: "totalmarks", headerName: "Total Marks", width: 130 }]} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} /></Paper></Shell>;
}
