import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, Grid, LinearProgress, MenuItem,
  Paper, Stack, TextField, Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Add, Delete, Edit, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const text = (value) => String(value || "").trim();
const today = () => new Date().toISOString().slice(0, 10);
const gridSx = {
  "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word", alignItems: "flex-start", py: 1 },
  "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal", lineHeight: 1.2 }
};
const label = (value) => text(value).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (m) => m.toUpperCase());

function Shell({ title, children }) {
  return <MenuPageShell title={title}><Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>{children}</Box></MenuPageShell>;
}

function Status({ loading, error, message, clear }) {
  return <>{loading && <LinearProgress sx={{ mb: 2 }} />}{error && <Alert severity="error" sx={{ mb: 2 }} onClose={clear}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }} onClose={clear}>{message}</Alert>}</>;
}

function useTransportOptions() {
  const [options, setOptions] = useState({ vehicleTypes: [], vehicles: [], waypoints: [], routes: [], schedules: [], templates: [], studentOptions: {} });
  const loadOptions = async () => {
    const res = await ep1.get("/api/v2/transport-new/options", { params: { colid: global1.colid } });
    setOptions(res.data || {});
  };
  useEffect(() => { loadOptions().catch(() => {}); }, []);
  return { options, loadOptions };
}

function Searchable({ label: fieldLabel, options = [], value, onChange, getOptionLabel = (o) => text(o), freeSolo = true, multiple = false }) {
  return (
    <Autocomplete
      multiple={multiple}
      disableCloseOnSelect={multiple}
      freeSolo={freeSolo && !multiple}
      options={options}
      value={multiple ? (Array.isArray(value) ? value : []) : value || ""}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v) => !multiple && onChange(v)}
      getOptionLabel={(option) => (typeof option === "string" ? option : getOptionLabel(option))}
      renderOption={(props, option, state) => <li {...props}>{multiple && <Checkbox checked={state.selected} sx={{ mr: 1 }} />}{typeof option === "string" ? option : getOptionLabel(option)}</li>}
      renderInput={(params) => <TextField {...params} fullWidth size="small" label={fieldLabel} />}
    />
  );
}

const crudConfig = {
  vehicleTypes: { title: "Vehicle type", blank: { type: "", description: "", status: "Active" }, fields: ["type", "description", "status"], columns: ["type", "description", "status"] },
  waypoints: { title: "Waypoints", blank: { waypoint: "", description: "", location: "", latitude: "", longitude: "", status: "Active" }, fields: ["waypoint", "description", "location", "latitude", "longitude", "status"], columns: ["waypoint", "description", "location", "latitude", "longitude", "status"] }
};

export function TransportNewCrudPage({ entity }) {
  const config = crudConfig[entity];
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(config.blank);
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get(`/api/v2/transport-new/${entity}`, { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to load data"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [entity]);
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post(`/api/v2/transport-new/${entity}`, { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name });
      setForm(config.blank); setEditingId(""); setMessage("Saved"); await load();
    } catch (err) { setError(err.response?.data?.message || "Unable to save"); }
    finally { setLoading(false); }
  };
  const remove = async (ids = selected) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} selected row(s)?`)) return;
    await ep1.post(`/api/v2/transport-new/${entity}/delete`, { colid: global1.colid, ids });
    setSelected([]); setMessage("Deleted"); await load();
  };
  const columns = [...config.columns.map((field) => ({ field, headerName: label(field), minWidth: field === "description" ? 260 : 150, flex: field === "description" ? 1 : undefined })), {
    field: "actions", type: "actions", width: 100, getActions: ({ row }) => [
      <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...config.blank, ...row }); }} />,
      <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove([row._id])} />
    ]
  }];
  return <Shell title={config.title}><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>{config.title}</Typography><Status loading={loading} error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={1.5}>{config.fields.map((field) => <Grid item xs={12} md={field === "description" ? 4 : 2} key={field}>{field === "status" ? <TextField select fullWidth size="small" label="Status" value={form.status} onChange={(e) => setField("status", e.target.value)}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField> : <TextField fullWidth size="small" multiline={field === "description"} label={label(field)} value={form[field] || ""} onChange={(e) => setField(field, e.target.value)} />}</Grid>)}<Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} onClick={save}>Save</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><Stack direction="row" spacing={1} sx={{ mb: 1 }}><Button startIcon={<Refresh />} onClick={load}>Load</Button><Button color="error" disabled={!selected.length} startIcon={<Delete />} onClick={() => remove()}>Bulk delete</Button></Stack><DataGrid rows={rows} getRowId={(r) => r._id} columns={columns} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight getRowHeight={() => "auto"} sx={gridSx} slots={{ toolbar: GridToolbar }} /></Paper></Shell>;
}

export function TransportVehiclePage() {
  const { options, loadOptions } = useTransportOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ vehiclename: "", registrationnumber: "", taxpaidtilldate: "", insurancevalidtilldate: "", typeid: "", type: "", vehicletype: "Non AC", seatingcapacity: "", status: "Active" });
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { setLoading(true); try { const res = await ep1.get("/api/v2/transport-new/vehicles", { params: { colid: global1.colid } }); setRows(res.data?.data || []); } catch (e) { setError(e.response?.data?.message || "Unable to load vehicles"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { setLoading(true); try { await ep1.post("/api/v2/transport-new/vehicles", { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name }); setForm({ vehiclename: "", registrationnumber: "", taxpaidtilldate: "", insurancevalidtilldate: "", typeid: "", type: "", vehicletype: "Non AC", seatingcapacity: "", status: "Active" }); setEditingId(""); setMessage("Vehicle saved"); await Promise.all([load(), loadOptions()]); } catch (e) { setError(e.response?.data?.message || "Unable to save vehicle"); } finally { setLoading(false); } };
  const remove = async (ids = selected) => { if (!ids.length || !window.confirm("Delete selected vehicle(s)?")) return; await ep1.post("/api/v2/transport-new/vehicles/delete", { colid: global1.colid, ids }); setSelected([]); await load(); };
  const cols = ["vehiclename", "registrationnumber", "type", "vehicletype", "seatingcapacity", "taxpaidtilldate", "insurancevalidtilldate", "status"].map((field) => ({ field, headerName: label(field), minWidth: 150, flex: ["vehiclename", "registrationnumber"].includes(field) ? 1 : undefined }));
  cols.push({ field: "actions", type: "actions", width: 100, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ ...form, ...row, taxpaidtilldate: text(row.taxpaidtilldate).slice(0, 10), insurancevalidtilldate: text(row.insurancevalidtilldate).slice(0, 10) }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove([row._id])} />] });
  return <Shell title="Vehicles"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Vehicles</Typography><Status loading={loading} error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={1.5}><Grid item xs={12} md={2}><TextField fullWidth size="small" label="Vehicle name" value={form.vehiclename} onChange={(e) => setForm({ ...form, vehiclename: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth size="small" label="Registration number" value={form.registrationnumber} onChange={(e) => setForm({ ...form, registrationnumber: e.target.value })} /></Grid><Grid item xs={12} md={2}><Searchable label="Type of vehicle" freeSolo={false} options={options.vehicleTypes || []} value={(options.vehicleTypes || []).find((v) => v._id === form.typeid) || null} getOptionLabel={(v) => v.type || ""} onChange={(v) => setForm({ ...form, typeid: v?._id || "", type: v?.type || "" })} /></Grid><Grid item xs={12} md={1.5}><TextField select fullWidth size="small" label="Vehicle type" value={form.vehicletype} onChange={(e) => setForm({ ...form, vehicletype: e.target.value })}><MenuItem value="AC">AC</MenuItem><MenuItem value="Non AC">Non AC</MenuItem></TextField></Grid><Grid item xs={12} md={1.5}><TextField fullWidth type="number" size="small" label="Seating capacity" value={form.seatingcapacity} onChange={(e) => setForm({ ...form, seatingcapacity: e.target.value })} /></Grid><Grid item xs={12} md={1.5}><TextField fullWidth type="date" size="small" label="Tax paid till" InputLabelProps={{ shrink: true }} value={form.taxpaidtilldate} onChange={(e) => setForm({ ...form, taxpaidtilldate: e.target.value })} /></Grid><Grid item xs={12} md={1.5}><TextField fullWidth type="date" size="small" label="Insurance valid till" InputLabelProps={{ shrink: true }} value={form.insurancevalidtilldate} onChange={(e) => setForm({ ...form, insurancevalidtilldate: e.target.value })} /></Grid><Grid item xs={12} md={1}><Button fullWidth variant="contained" onClick={save}>Save</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><Button sx={{ mb: 1 }} color="error" disabled={!selected.length} onClick={() => remove()}>Bulk delete</Button><DataGrid rows={rows} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Shell>;
}

export function TransportRoutePage() {
  const { options, loadOptions } = useTransportOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ routename: "", description: "", waypoints: [], status: "Active" });
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { setLoading(true); try { const res = await ep1.get("/api/v2/transport-new/routes", { params: { colid: global1.colid } }); setRows(res.data?.data || []); } catch (e) { setError(e.response?.data?.message || "Unable to load routes"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { setLoading(true); try { await ep1.post("/api/v2/transport-new/routes", { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name }); setForm({ routename: "", description: "", waypoints: [], status: "Active" }); setEditingId(""); setMessage("Route saved"); await Promise.all([load(), loadOptions()]); } catch (e) { setError(e.response?.data?.message || "Unable to save route"); } finally { setLoading(false); } };
  const remove = async (ids = selected) => { if (!ids.length || !window.confirm("Delete selected route(s)?")) return; await ep1.post("/api/v2/transport-new/routes/delete", { colid: global1.colid, ids }); setSelected([]); await load(); };
  const cols = [{ field: "routename", headerName: "Route", minWidth: 180, flex: 1 }, { field: "description", headerName: "Description", minWidth: 260, flex: 1 }, { field: "waypointnames", headerName: "Waypoints", minWidth: 320, flex: 1, valueGetter: ({ row }) => (row.waypoints || []).map((w) => w.waypoint).join(" -> ") }, { field: "status", headerName: "Status", width: 110 }, { field: "actions", type: "actions", width: 100, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ routename: row.routename || "", description: row.description || "", waypoints: row.waypoints || [], status: row.status || "Active" }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove([row._id])} />] }];
  return <Shell title="Routes"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Routes</Typography><Status loading={loading} error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={1.5}><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Route name" value={form.routename} onChange={(e) => setForm({ ...form, routename: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid><Grid item xs={12} md={4}><Searchable label="Waypoints" multiple freeSolo={false} options={options.waypoints || []} value={form.waypoints} getOptionLabel={(w) => w.waypoint || ""} onChange={(v) => setForm({ ...form, waypoints: v || [] })} /></Grid><Grid item xs={12} md={1}><Button fullWidth variant="contained" onClick={save}>Save</Button></Grid></Grid></Paper><Paper sx={{ p: 1 }}><Button sx={{ mb: 1 }} color="error" disabled={!selected.length} onClick={() => remove()}>Bulk delete</Button><DataGrid rows={rows} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Shell>;
}

export function TransportSchedulePage() {
  const { options, loadOptions } = useTransportOptions();
  const [rows, setRows] = useState([]);
  const [route, setRoute] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [amountperseat, setAmountperseat] = useState("");
  const [timings, setTimings] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { const res = await ep1.get("/api/v2/transport-new/schedules", { params: { colid: global1.colid } }); setRows(res.data?.data || []); };
  useEffect(() => { load().catch(() => {}); }, []);
  useEffect(() => { setTimings((route?.waypoints || []).map((w, i) => ({ waypointid: w._id, waypoint: w.waypoint, order: i + 1, time: "" }))); }, [route?._id]);
  const save = async () => { setLoading(true); try { await ep1.post("/api/v2/transport-new/schedules", { id: editingId, colid: global1.colid, user: global1.user, name: global1.name, routeid: route?._id, routename: route?.routename, vehicleid: vehicle?._id, vehicle: vehicle?.vehiclename || vehicle?.registrationnumber, registrationnumber: vehicle?.registrationnumber, amountperseat, timings, status: "Active" }); setRoute(null); setVehicle(null); setAmountperseat(""); setTimings([]); setEditingId(""); setMessage("Route vehicle timing saved"); await Promise.all([load(), loadOptions()]); } catch (e) { setError(e.response?.data?.message || "Unable to save timing"); } finally { setLoading(false); } };
  const cols = ["routename", "registrationnumber", "vehicle", "amountperseat", "status"].map((f) => ({ field: f, headerName: label(f), minWidth: 150, flex: ["routename", "vehicle"].includes(f) ? 1 : undefined }));
  cols.push({ field: "timingtext", headerName: "Waypoint timings", minWidth: 380, flex: 1, valueGetter: ({ row }) => (row.timings || []).map((t) => `${t.waypoint}: ${t.time || "-"}`).join(" | ") }, { field: "actions", type: "actions", width: 90, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setRoute((options.routes || []).find((r) => r._id === row.routeid) || { _id: row.routeid, routename: row.routename, waypoints: row.timings || [] }); setVehicle((options.vehicles || []).find((v) => v._id === row.vehicleid) || null); setAmountperseat(row.amountperseat || ""); setTimings(row.timings || []); }} />] });
  return <Shell title="Route timing"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Route timing and amount</Typography><Status loading={loading} error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={1.5}><Grid item xs={12} md={3}><Searchable label="Route" freeSolo={false} options={options.routes || []} value={route} getOptionLabel={(r) => r.routename || ""} onChange={setRoute} /></Grid><Grid item xs={12} md={3}><Searchable label="Vehicle" freeSolo={false} options={options.vehicles || []} value={vehicle} getOptionLabel={(v) => `${v.registrationnumber || ""} ${v.vehiclename ? `- ${v.vehiclename}` : ""}`} onChange={setVehicle} /></Grid><Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Amount per seat" value={amountperseat} onChange={(e) => setAmountperseat(e.target.value)} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={save}>Save</Button></Grid>{timings.map((t, i) => <Grid item xs={12} md={2} key={`${t.waypointid}-${i}`}><TextField fullWidth size="small" type="time" label={t.waypoint} InputLabelProps={{ shrink: true }} value={t.time || ""} onChange={(e) => setTimings((p) => p.map((x, n) => n === i ? { ...x, time: e.target.value } : x))} /></Grid>)}</Grid></Paper><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} columns={cols} autoHeight getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Shell>;
}

function DynamicStudentSearch({ onPick, allowMulti = false }) {
  const { options } = useTransportOptions();
  const fields = ["academicyear", "regulation", "program", "programcode", "semester", "section", "name", "regno"];
  const [filters, setFilters] = useState([{ field: "academicyear", value: "" }]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const search = async () => {
    const res = await ep1.post("/api/v2/transport-new/students/search", { colid: global1.colid, filters: filters.filter((f) => f.field && f.value) });
    setRows(res.data?.data || []);
  };
  return <Stack spacing={1}><Grid container spacing={1}>{filters.map((f, i) => <React.Fragment key={i}><Grid item xs={12} md={3}><Searchable label="Field" freeSolo={false} options={fields} value={f.field} onChange={(v) => setFilters((p) => p.map((x, n) => n === i ? { field: v || "", value: "" } : x))} /></Grid><Grid item xs={12} md={5}><Searchable label="Value" options={options.studentOptions?.[f.field] || []} value={f.value} onChange={(v) => setFilters((p) => p.map((x, n) => n === i ? { ...x, value: v || "" } : x))} /></Grid><Grid item xs={12} md={2}><Button color="error" onClick={() => setFilters((p) => p.filter((_, n) => n !== i))}>Remove</Button></Grid></React.Fragment>)}<Grid item xs={12}><Stack direction="row" spacing={1}><Button startIcon={<Add />} onClick={() => setFilters((p) => [...p, { field: "name", value: "" }])}>Add filter</Button><Button variant="contained" onClick={search}>Load students</Button>{allowMulti && <Button disabled={!selected.length} onClick={() => onPick(rows.filter((r) => selected.includes(r._id)))}>Select students</Button>}</Stack></Grid></Grid><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} columns={["name", "regno", "academicyear", "program", "programcode", "semester", "section"].map((f) => ({ field: f, headerName: label(f), minWidth: 130, flex: f === "name" ? 1 : undefined }))} checkboxSelection={allowMulti} rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} onRowClick={(p) => !allowMulti && onPick(p.row)} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Stack>;
}

export function TransportStudentApplyPage() {
  const { options } = useTransportOptions();
  const [waypoint, setWaypoint] = useState(null);
  const [route, setRoute] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const routes = useMemo(() => !waypoint ? options.routes || [] : (options.routes || []).filter((r) => (r.waypoints || []).some((w) => w._id === waypoint._id || w.waypoint === waypoint.waypoint)), [options.routes, waypoint]);
  const schedules = useMemo(() => (options.schedules || []).filter((s) => !route || s.routeid === route._id), [options.schedules, route]);
  const apply = async () => { try { await ep1.post("/api/v2/transport-new/apply-seat", { colid: global1.colid, user: global1.user, name: global1.name, studentemail: global1.user, scheduleid: schedule?._id }); setMessage("Seat request submitted for approval."); } catch (e) { setError(e.response?.data?.message || "Unable to submit request"); } };
  return <Shell title="Apply transport seat"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Apply for transport seat</Typography><Status error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><Searchable label="Search waypoint" freeSolo={false} options={options.waypoints || []} value={waypoint} getOptionLabel={(w) => w.waypoint || ""} onChange={(v) => { setWaypoint(v); setRoute(null); setSchedule(null); }} /></Grid><Grid item xs={12} md={3}><Searchable label="Route" freeSolo={false} options={routes} value={route} getOptionLabel={(r) => r.routename || ""} onChange={(v) => { setRoute(v); setSchedule(null); }} /></Grid><Grid item xs={12} md={4}><Searchable label="Vehicle and timing" freeSolo={false} options={schedules} value={schedule} getOptionLabel={(s) => `${s.registrationnumber || ""} | ${s.routename || ""} | Rs.${s.amountperseat || 0}`} onChange={setSchedule} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={!schedule} onClick={apply}>Apply</Button></Grid>{schedule && <Grid item xs={12}><Alert severity="info">Amount per seat: Rs. {schedule.amountperseat || 0}. Timings: {(schedule.timings || []).map((t) => `${t.waypoint} ${t.time || ""}`).join(" | ")}</Alert></Grid>}</Grid></Paper></Shell>;
}

export function TransportSeatApprovalPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { setLoading(true); try { const res = await ep1.get("/api/v2/transport-new/applications", { params: { colid: global1.colid, approvalstatus: "Pending" } }); setRows((res.data?.data || []).filter((r) => r.approvalstatus === "Pending")); } catch (e) { setError(e.response?.data?.message || "Unable to load requests"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const act = async (row, approvalstatus) => { setLoading(true); try { await ep1.post("/api/v2/transport-new/approve-seat", { colid: global1.colid, id: row._id, approvalstatus, user: global1.user, comments: "" }); setMessage(`Request ${approvalstatus.toLowerCase()}`); await load(); } catch (e) { setError(e.response?.data?.message || "Unable to update request"); } finally { setLoading(false); } };
  const cols = ["studentname", "regno", "program", "programcode", "semester", "routename", "registrationnumber", "amountperseat", "approvalstatus"].map((f) => ({ field: f, headerName: label(f), minWidth: 140, flex: ["studentname", "routename"].includes(f) ? 1 : undefined }));
  cols.push({ field: "actions", type: "actions", width: 150, getActions: ({ row }) => [<GridActionsCellItem icon={<Save />} label="Approve" onClick={() => act(row, "Approved")} />, <GridActionsCellItem icon={<Delete />} label="Reject" onClick={() => act(row, "Rejected")} />] });
  return <Shell title="Seat approval"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Transport seat approval</Typography><Status loading={loading} error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} columns={cols} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Shell>;
}

export function TransportSeatAssignmentPage() {
  const { options } = useTransportOptions();
  const [student, setStudent] = useState(null);
  const [route, setRoute] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const schedules = useMemo(() => (options.schedules || []).filter((s) => !route || s.routeid === route._id), [options.schedules, route]);
  const assign = async () => { try { await ep1.post("/api/v2/transport-new/manual-assign", { colid: global1.colid, user: global1.user, name: global1.name, studentid: student?._id, scheduleid: schedule?._id }); setMessage("Seat assigned and student ledger updated."); } catch (e) { setError(e.response?.data?.message || "Unable to assign seat"); } };
  return <Shell title="Manual seat assignment"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Assign transport seat</Typography><Status error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Typography fontWeight={800} sx={{ mb: 1 }}>Search and select student</Typography><DynamicStudentSearch onPick={setStudent} /></Paper><Paper sx={{ p: 2 }}><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Selected student" value={student ? `${student.name} (${student.regno})` : ""} InputProps={{ readOnly: true }} /></Grid><Grid item xs={12} md={3}><Searchable label="Route" freeSolo={false} options={options.routes || []} value={route} getOptionLabel={(r) => r.routename || ""} onChange={(v) => { setRoute(v); setSchedule(null); }} /></Grid><Grid item xs={12} md={4}><Searchable label="Vehicle" freeSolo={false} options={schedules} value={schedule} getOptionLabel={(s) => `${s.registrationnumber} | Rs.${s.amountperseat || 0}`} onChange={setSchedule} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" disabled={!student || !schedule} onClick={assign}>Assign</Button></Grid></Grid></Paper></Shell>;
}

export function TransportTemplatePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ templatename: "", description: "", html: "", isdefault: "No", status: "Active" });
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => { const res = await ep1.get("/api/v2/transport-new/templates", { params: { colid: global1.colid } }); setRows(res.data?.data || []); };
  useEffect(() => { load().catch(() => {}); }, []);
  const save = async () => { try { await ep1.post("/api/v2/transport-new/templates", { ...form, id: editingId, colid: global1.colid, user: global1.user, name: global1.name }); setForm({ templatename: "", description: "", html: "", isdefault: "No", status: "Active" }); setEditingId(""); setMessage("Template saved"); await load(); } catch (e) { setError(e.response?.data?.message || "Unable to save template"); } };
  const remove = async () => { if (!selected.length || !window.confirm("Delete selected template(s)?")) return; await ep1.post("/api/v2/transport-new/templates/delete", { colid: global1.colid, ids: selected }); setSelected([]); await load(); };
  const upload = (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; const reader = new FileReader(); reader.onload = () => setForm((p) => ({ ...p, html: String(reader.result || "") })); reader.readAsText(file); };
  const cols = ["templatename", "description", "isdefault", "status"].map((f) => ({ field: f, headerName: label(f), minWidth: 140, flex: ["templatename", "description"].includes(f) ? 1 : undefined }));
  cols.push({ field: "actions", type: "actions", width: 90, getActions: ({ row }) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(row._id); setForm({ templatename: row.templatename || "", description: row.description || "", html: row.html || "", isdefault: row.isdefault || "No", status: row.status || "Active" }); }} />] });
  return <Shell title="Bus pass templates"><Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Bus pass templates</Typography><Alert severity="info" sx={{ mb: 2 }}>Variables: {"{{institutionname}}, {{institutionaddress}}, {{studentphoto}}, {{studentname}}, {{regno}}, {{program}}, {{programcode}}, {{semester}}, {{routename}}, {{registrationnumber}}, {{amountperseat}}, {{qrcode}}, {{verifyurl}}, {{generateddate}}"}</Alert><Status error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={1.5}><Grid item xs={12} md={2}><TextField fullWidth size="small" label="Template name" value={form.templatename} onChange={(e) => setForm({ ...form, templatename: e.target.value })} /></Grid><Grid item xs={12} md={3}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid><Grid item xs={12} md={7}><TextField fullWidth multiline minRows={5} size="small" label="HTML" value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} /></Grid><Grid item xs={12}><Stack direction="row" spacing={1}><Button component="label" startIcon={<UploadFile />}>Upload HTML<input hidden type="file" accept=".html,.txt" onChange={upload} /></Button><Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button><Button color="error" disabled={!selected.length} onClick={remove}>Bulk delete</Button></Stack></Grid></Grid></Paper><Paper sx={{ p: 1 }}><DataGrid rows={rows} getRowId={(r) => r._id} columns={cols} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper></Shell>;
}

export function TransportBusPassNewPage() {
  const { options, loadOptions } = useTransportOptions();
  const [assignment, setAssignment] = useState(null);
  const [template, setTemplate] = useState(null);
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const loadAssignments = async () => { const res = await ep1.get("/api/v2/transport-new/assignments", { params: { colid: global1.colid, status: "Active" } }); setAssignments((res.data?.data || []).filter((r) => r.status === "Active")); };
  useEffect(() => { loadAssignments().catch(() => {}); }, []);
  const generate = async () => {
    try {
      const qrid = `${Date.now()}${Math.random().toString(36).slice(2)}`;
      const verifyurl = `${window.location.origin}/transport-new-verify/${qrid}`;
      const qrcode = await QRCode.toDataURL(verifyurl, { width: 140, margin: 1 });
      const res = await ep1.post("/api/v2/transport-new/generate-pass", { colid: global1.colid, user: global1.user, name: global1.name, assignmentid: assignment?._id, templateid: template?._id, qrid, verifyurl, qrcode, frontendbase: window.location.origin });
      setHtml(res.data?.html || "");
      setMessage("Bus pass generated.");
      await loadOptions();
    } catch (e) { setError(e.response?.data?.message || "Unable to generate bus pass"); }
  };
  const print = () => { const win = window.open("", "_blank"); win.document.write(`<html><head><title>Bus Pass</title><style>@page{size:A4;margin:12mm}body{font-family:Arial;color:#111}.toolbar{text-align:right;margin-bottom:8px}@media print{.toolbar{display:none}}</style></head><body><div class="toolbar"><button onclick="print()">Print</button><button onclick="close()">Close</button></div>${html}</body></html>`); win.document.close(); };
  return <Shell title="Generate bus pass"><Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Generate bus pass</Typography><Status error={error} message={message} clear={() => { setError(""); setMessage(""); }} /><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={5}><Searchable label="Student assignment" freeSolo={false} options={assignments} value={assignment} getOptionLabel={(a) => `${a.studentname || ""} (${a.regno || ""}) - ${a.routename || ""} - ${a.registrationnumber || ""}`} onChange={setAssignment} /></Grid><Grid item xs={12} md={4}><Searchable label="Template" freeSolo={false} options={options.templates || []} value={template} getOptionLabel={(t) => t.templatename || ""} onChange={setTemplate} /></Grid><Grid item xs={12} md={3}><Stack direction="row" spacing={1}><Button variant="contained" disabled={!assignment || !template} onClick={generate}>Generate</Button><Button startIcon={<Print />} disabled={!html} onClick={print}>Print</Button></Stack></Grid></Grid></Paper>{html && <Paper sx={{ p: 2, overflow: "auto" }}><div dangerouslySetInnerHTML={{ __html: html }} /></Paper>}</Shell>;
}

export function TransportVerifyPage() {
  const { qrid } = useParams();
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { ep1.get(`/api/v2/transport-new/verify/${qrid}`).then((res) => setRow(res.data?.data)).catch((e) => setError(e.response?.data?.message || "Invalid bus pass")); }, [qrid]);
  return <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}><Paper sx={{ p: 3, maxWidth: 760, mx: "auto" }}>{error && <Alert severity="error">{error}</Alert>}{row && <Stack spacing={1}><Typography variant="h4" fontWeight={900}>Bus pass verified</Typography><Typography><b>Student:</b> {row.studentname}</Typography><Typography><b>Reg No:</b> {row.regno}</Typography><Typography><b>Program:</b> {row.program} {row.programcode}</Typography><Typography><b>Route:</b> {row.routename}</Typography><Typography><b>Vehicle:</b> {row.registrationnumber}</Typography><Typography><b>Status:</b> {row.status}</Typography></Stack>}</Paper></Box>;
}
