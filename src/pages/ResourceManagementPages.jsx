import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Delete, Download, Edit, Event, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSearchParams } from "react-router-dom";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankType = { resourcetype: "", description: "" };
const blankResource = { resourcetypeid: "", resourcetype: "", resourcename: "", resourceid: "", campus: "", building: "", floor: "", introductiondate: "", retirementdate: "", owner: "", owneremail: "" };
const blankBooking = { starttime: "", endtime: "", title: "", description: "", participants: [], externalName: "", externalEmail: "", emailconfigurationid: "", notifyparticipants: false };
const unique = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const norm = (value) => String(value || "").trim().toLowerCase();
const campusLabel = (item) => typeof item === "string" ? item : [item?.campus, item?.location].filter(Boolean).join(" - ");
const buildingLabel = (item) => typeof item === "string" ? item : [item?.estatename, item?.estatecode, item?.location].filter(Boolean).join(" - ");
const dtLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const dateKey = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const firstOfWeek = (date) => addDays(date, -date.getDay());
const fmt = (value) => value ? new Date(value).toLocaleString() : "";
const gridSx = { "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", alignItems: "flex-start", py: 1 }, "& .MuiDataGrid-columnHeaderTitle": { whiteSpace: "normal" } };

function Searchable({ label, options, value, onChange, onInputChange, getOptionLabel, multiple = false, freeSolo = false, disabled = false }) {
  return (
    <Autocomplete
      multiple={multiple}
      freeSolo={freeSolo}
      disableCloseOnSelect={multiple}
      options={options || []}
      value={value || (multiple ? [] : null)}
      disabled={disabled}
      onChange={(event, next) => onChange(next)}
      onInputChange={(event, next, reason) => {
        if (freeSolo && onInputChange && reason === "input") onInputChange(next);
      }}
      getOptionLabel={getOptionLabel || ((option) => String(option || ""))}
      isOptionEqualToValue={(option, selected) => (option?._id && selected?._id ? option._id === selected._id : JSON.stringify(option) === JSON.stringify(selected))}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          {multiple && <Checkbox checked={selected} size="small" />}
          {getOptionLabel ? getOptionLabel(option) : String(option || "")}
        </li>
      )}
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
    />
  );
}

function Status({ error, message, clear }) {
  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clear}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={clear}>{message}</Alert>}
    </>
  );
}

const useResourceOptions = () => {
  const [options, setOptions] = useState({ owners: [], resourceTypes: [], resources: [], rooms: [], emailConfigurations: [], estateCampuses: [], estateBuildings: [], campuses: [], buildings: [], floors: [] });
  const [error, setError] = useState("");
  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/resource-management/options", { params: { colid: global1.colid } });
      setOptions(res.data || {});
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load options");
    }
  };
  useEffect(() => { loadOptions(); }, []);
  return { options, loadOptions, optionError: error };
};

export function RoomTimewiseOwnersPage() {
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get("roomid") || "";
  const { options, loadOptions, optionError } = useResourceOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ roomid: initialRoomId, roomno: "", campus: "", building: "", floor: "", owner: "", owneremail: "", fromtime: "", totime: "" });
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedRoom = useMemo(() => (options.rooms || []).find((room) => room._id === form.roomid) || null, [form.roomid, options.rooms]);
  const selectedOwner = useMemo(() => (options.owners || []).find((owner) => owner.email === form.owneremail) || null, [form.owneremail, options.owners]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/resource-management/room-time-owners", { params: { colid: global1.colid, roomid: form.roomid || "" } });
      setRows(res.data?.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load timewise owners");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (selectedRoom) setForm((prev) => ({ ...prev, roomno: selectedRoom.roomno || "", campus: selectedRoom.campus || "", building: selectedRoom.building || "", floor: selectedRoom.floor || "" }));
  }, [selectedRoom]);

  const save = async () => {
    try {
      setLoading(true);
      await ep1.post("/api/v2/resource-management/room-time-owners", { ...form, id: editingId, colid: global1.colid, user: global1.user });
      setMessage(editingId ? "Timewise owner updated" : "Timewise owner saved");
      setEditingId("");
      setForm({ roomid: form.roomid, roomno: selectedRoom?.roomno || "", campus: selectedRoom?.campus || "", building: selectedRoom?.building || "", floor: selectedRoom?.floor || "", owner: "", owneremail: "", fromtime: "", totime: "" });
      await load();
      await loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save timewise owner");
    } finally {
      setLoading(false);
    }
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this timewise owner?")) return;
    await ep1.post("/api/v2/resource-management/room-time-owners/delete", { id: row._id, colid: global1.colid });
    load();
  };
  const edit = (row) => {
    setEditingId(row._id);
    setForm({ roomid: row.roomid || "", roomno: row.roomno || "", campus: row.campus || "", building: row.building || "", floor: row.floor || "", owner: row.owner || "", owneremail: row.owneremail || "", fromtime: row.fromtime || "", totime: row.totime || "" });
  };

  return (
    <MenuPageShell title="Room Timewise Owners">
      <Box sx={{ p: 3 }}>
        <Status error={error || optionError} message={message} clear={() => { setError(""); setMessage(""); }} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Searchable label="Room" options={options.rooms || []} value={selectedRoom} onChange={(room) => setForm((p) => ({ ...p, roomid: room?._id || "" }))} getOptionLabel={(room) => `${room.roomno || ""} | ${room.campus || ""} ${room.building || ""} ${room.floor || ""}`} /></Grid>
            <Grid item xs={12} md={4}><Searchable label="Owner" options={options.owners || []} value={selectedOwner} onChange={(owner) => setForm((p) => ({ ...p, owner: owner?.name || "", owneremail: owner?.email || "" }))} getOptionLabel={(owner) => `${owner.name || ""} (${owner.email || ""})`} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="time" label="From time" value={form.fromtime} onChange={(e) => setForm((p) => ({ ...p, fromtime: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="time" label="To time" value={form.totime} onChange={(e) => setForm((p) => ({ ...p, totime: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            {["roomno", "campus", "building", "floor", "owner", "owneremail"].map((field) => <Grid item xs={12} md={2} key={field}><TextField fullWidth size="small" label={field} value={form[field] || ""} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} /></Grid>)}
            <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Save />} onClick={save} disabled={loading}>Save</Button><Button variant="outlined" startIcon={<Refresh />} onClick={load}>Load</Button></Stack></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1 }}>
          <DataGrid rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[
            { field: "roomno", headerName: "Room no", width: 130 }, { field: "campus", headerName: "Campus", width: 160 }, { field: "building", headerName: "Building", width: 180 }, { field: "floor", headerName: "Floor", width: 100 },
            { field: "owner", headerName: "Owner", width: 220 }, { field: "owneremail", headerName: "Owner email", width: 240 }, { field: "fromtime", headerName: "From", width: 110 }, { field: "totime", headerName: "To", width: 110 },
            { field: "actions", type: "actions", width: 110, getActions: (params) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => edit(params.row)} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove(params.row)} />] }
          ]} autoHeight loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}

export function ResourceTypePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankType);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/resource-management/types", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load resource types");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    await ep1.post("/api/v2/resource-management/types", { ...form, id: editingId, colid: global1.colid, user: global1.user });
    setMessage(editingId ? "Resource type updated" : "Resource type saved");
    setForm(blankType); setEditingId(""); load();
  };
  const remove = async (ids) => {
    for (const id of ids) await ep1.post("/api/v2/resource-management/types/delete", { id, colid: global1.colid });
    setSelected([]); load();
  };
  const template = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ resourcetype: "Projector", description: "Audio visual equipment" }]), "Resource Types");
    XLSX.writeFile(wb, "resource_type_template.xlsx");
  };
  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rowsToUpload = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    for (const row of rowsToUpload) await ep1.post("/api/v2/resource-management/types", { resourcetype: row.resourcetype || row["Resource Type"], description: row.description || "", colid: global1.colid, user: global1.user });
    setMessage(`${rowsToUpload.length} resource types uploaded`); load();
  };
  return (
    <MenuPageShell title="Resource Type">
      <Box sx={{ p: 3 }}>
        <Status error={error} message={message} clear={() => { setError(""); setMessage(""); }} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Resource type" value={form.resourcetype} onChange={(e) => setForm((p) => ({ ...p, resourcetype: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={save}>{editingId ? "Update" : "Save"}</Button></Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1}><Button startIcon={<Download />} onClick={template}>Template</Button><Button component="label" startIcon={<UploadFile />}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button><Button color="error" disabled={!selected.length} startIcon={<Delete />} onClick={() => remove(selected)}>Bulk delete</Button></Stack></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1 }}><DataGrid rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "resourcetype", headerName: "Resource type", flex: 1, minWidth: 220 }, { field: "description", headerName: "Description", flex: 1, minWidth: 300 }, { field: "actions", type: "actions", width: 110, getActions: (p) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(p.row._id); setForm({ resourcetype: p.row.resourcetype || "", description: p.row.description || "" }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove([p.row._id])} />] }]} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight loading={loading} slots={{ toolbar: GridToolbar }} /></Paper>
      </Box>
    </MenuPageShell>
  );
}

export function ResourcePage() {
  const { options, loadOptions, optionError } = useResourceOptions();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankResource);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedType = useMemo(() => (options.resourceTypes || []).find((t) => t._id === form.resourcetypeid || t.resourcetype === form.resourcetype) || null, [form, options.resourceTypes]);
  const selectedOwner = useMemo(() => (options.owners || []).find((o) => o.email === form.owneremail) || null, [form.owneremail, options.owners]);
  const campusOptions = useMemo(() => {
    const estateCampuses = options.estateCampuses || [];
    const existing = (options.campuses || []).filter((campus) => !estateCampuses.some((item) => norm(item.campus) === norm(campus)));
    return [...estateCampuses, ...existing];
  }, [options.campuses, options.estateCampuses]);
  const selectedCampus = useMemo(() => (options.estateCampuses || []).find((campus) => norm(campus.campus) === norm(form.campus)) || (form.campus ? form.campus : null), [form.campus, options.estateCampuses]);
  const buildingOptions = useMemo(() => {
    const estateBuildings = options.estateBuildings || [];
    const selectedEstateCampus = (options.estateCampuses || []).find((campus) => norm(campus.campus) === norm(form.campus));
    const campusKeys = [form.campus, selectedEstateCampus?.campus, selectedEstateCampus?.location].map(norm).filter(Boolean);
    const filteredBuildings = form.campus
      ? estateBuildings.filter((building) => {
        const keys = [building.location, building.campus, building.campusname, building.parentcampus].map(norm).filter(Boolean);
        return !keys.length || keys.some((key) => campusKeys.includes(key));
      })
      : estateBuildings;
    const existing = (options.buildings || []).filter((building) => !filteredBuildings.some((item) => norm(item.estatename) === norm(building)));
    return [...filteredBuildings, ...existing];
  }, [form.campus, options.buildings, options.estateBuildings, options.estateCampuses]);
  const selectedBuilding = useMemo(() => buildingOptions.find((building) => (typeof building === "string" ? norm(building) : norm(building.estatename)) === norm(form.building)) || (form.building ? form.building : null), [buildingOptions, form.building]);
  const floorOptions = useMemo(() => {
    const buildingFloors = selectedBuilding && typeof selectedBuilding === "object"
      ? [selectedBuilding.floor, selectedBuilding.floorno, selectedBuilding.floorname, selectedBuilding.floors]
      : [];
    return unique([...buildingFloors, ...(options.floors || [])]);
  }, [options.floors, selectedBuilding]);
  const load = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/resource-management/resources", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load resources");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    await ep1.post("/api/v2/resource-management/resources", { ...form, id: editingId, colid: global1.colid, user: global1.user });
    setMessage(editingId ? "Resource updated" : "Resource saved");
    setForm(blankResource); setEditingId(""); load(); loadOptions();
  };
  const remove = async (ids) => {
    for (const id of ids) await ep1.post("/api/v2/resource-management/resources/delete", { id, colid: global1.colid });
    setSelected([]); load(); loadOptions();
  };
  const template = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ resourcetype: "Projector", resourcename: "Projector 1", resourceid: "PROJ-001", campus: "Main", building: "Block A", floor: "1", introductiondate: "", retirementdate: "", owner: "Owner", owneremail: "owner@example.com" }]), "Resources");
    XLSX.writeFile(wb, "resource_template.xlsx");
  };
  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rowsToUpload = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    for (const row of rowsToUpload) await ep1.post("/api/v2/resource-management/resources", { ...row, colid: global1.colid, user: global1.user });
    setMessage(`${rowsToUpload.length} resources uploaded`); load(); loadOptions();
  };
  return (
    <MenuPageShell title="Resource">
      <Box sx={{ p: 3 }}>
        <Status error={error || optionError} message={message} clear={() => { setError(""); setMessage(""); }} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Searchable label="Resource type" options={options.resourceTypes || []} value={selectedType} getOptionLabel={(t) => t.resourcetype || ""} onChange={(t) => setForm((p) => ({ ...p, resourcetypeid: t?._id || "", resourcetype: t?.resourcetype || "" }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Resource name" value={form.resourcename || ""} onChange={(e) => setForm((p) => ({ ...p, resourcename: e.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Resource ID" value={form.resourceid || ""} onChange={(e) => setForm((p) => ({ ...p, resourceid: e.target.value }))} /></Grid>
            <Grid item xs={12} md={2}>
              <Searchable
                label="Campus"
                options={campusOptions}
                value={selectedCampus}
                freeSolo
                getOptionLabel={campusLabel}
                onInputChange={(value) => setForm((p) => ({ ...p, campus: value, building: "", floor: "" }))}
                onChange={(campus) => setForm((p) => ({ ...p, campus: typeof campus === "string" ? campus : campus?.campus || "", building: "", floor: "" }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Searchable
                label="Building (optional)"
                options={buildingOptions}
                value={selectedBuilding}
                freeSolo
                getOptionLabel={buildingLabel}
                onInputChange={(value) => setForm((p) => ({ ...p, building: value, floor: "" }))}
                onChange={(building) => setForm((p) => ({ ...p, building: typeof building === "string" ? building : building?.estatename || "", floor: "" }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Searchable
                label="Floor (optional)"
                options={floorOptions}
                value={form.floor || null}
                freeSolo
                onInputChange={(value) => setForm((p) => ({ ...p, floor: value }))}
                onChange={(floor) => setForm((p) => ({ ...p, floor: typeof floor === "string" ? floor : String(floor || "") }))}
              />
            </Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Introduction date" value={form.introductiondate} onChange={(e) => setForm((p) => ({ ...p, introductiondate: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Retirement date" value={form.retirementdate} onChange={(e) => setForm((p) => ({ ...p, retirementdate: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={4}><Searchable label="Owner" options={options.owners || []} value={selectedOwner} getOptionLabel={(o) => `${o.name || ""} (${o.email || ""})`} onChange={(o) => setForm((p) => ({ ...p, owner: o?.name || "", owneremail: o?.email || "" }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Owner" value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Owner email" value={form.owneremail} onChange={(e) => setForm((p) => ({ ...p, owneremail: e.target.value }))} /></Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap"><Button variant="contained" onClick={save}>{editingId ? "Update" : "Save"}</Button><Button startIcon={<Download />} onClick={template}>Template</Button><Button component="label" startIcon={<UploadFile />}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button><Button color="error" disabled={!selected.length} startIcon={<Delete />} onClick={() => remove(selected)}>Bulk delete</Button></Stack></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 1 }}><DataGrid rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "resourcetype", headerName: "Type", width: 160 }, { field: "resourcename", headerName: "Resource", width: 220 }, { field: "resourceid", headerName: "Resource ID", width: 150 }, { field: "campus", headerName: "Campus", width: 140 }, { field: "building", headerName: "Building", width: 160 }, { field: "floor", headerName: "Floor", width: 100 }, { field: "owner", headerName: "Owner", width: 200 }, { field: "owneremail", headerName: "Owner email", width: 220 }, { field: "actions", type: "actions", width: 110, getActions: (p) => [<GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => { setEditingId(p.row._id); setForm({ ...blankResource, ...p.row }); }} />, <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => remove([p.row._id])} />] }]} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))} autoHeight loading={loading} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper>
      </Box>
    </MenuPageShell>
  );
}

function CalendarBoard({ bookings, view, activeDate, onSlot }) {
  const selected = new Date(activeDate || new Date());
  const days = view === "Daily" ? [selected] : view === "Weekly" ? Array.from({ length: 7 }, (_, i) => addDays(firstOfWeek(selected), i)) : (() => {
    const y = selected.getFullYear(); const m = selected.getMonth(); const first = new Date(y, m, 1); const count = new Date(y, m + 1, 0).getDate(); const out = [];
    for (let i = 0; i < first.getDay(); i += 1) out.push(null);
    for (let d = 1; d <= count; d += 1) out.push(new Date(y, m, d));
    return out;
  })();
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${view === "Daily" ? 1 : 7}, minmax(${view === "Daily" ? 320 : 135}px, 1fr))`, gap: 1, minWidth: view === "Daily" ? 360 : 980 }}>
      {days.map((day, index) => day ? (
        <Paper key={dateKey(day)} onDoubleClick={() => onSlot(day)} sx={{ p: 1, minHeight: view === "Monthly" ? 145 : 360, border: "1px solid #dbeafe", cursor: "pointer" }}>
          <Typography fontWeight={900} variant="caption">{day.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}</Typography>
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            {bookings.filter((b) => dateKey(b.starttime) === dateKey(day)).map((b) => <Box key={b._id} sx={{ p: 0.75, borderRadius: 1, bgcolor: "#e0f2fe", borderLeft: "4px solid #0284c7" }}><Typography variant="caption" fontWeight={900}>{new Date(b.starttime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(b.endtime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Typography><Typography variant="caption" display="block">{b.title}</Typography></Box>)}
          </Stack>
        </Paper>
      ) : <Box key={`blank-${index}`} />)}
    </Box>
  );
}

export function ResourceCalendarPage() {
  const { options, loadOptions, optionError } = useResourceOptions();
  const [type, setType] = useState(null);
  const [resource, setResource] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("Weekly");
  const [activeDate, setActiveDate] = useState(dateKey(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState(blankBooking);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const resources = useMemo(() => (options.resources || []).filter((r) => !type || r.resourcetype === type.resourcetype), [options.resources, type]);
  const selectedConfig = useMemo(() => (options.emailConfigurations || []).find((c) => c._id === bookingForm.emailconfigurationid) || null, [bookingForm.emailconfigurationid, options.emailConfigurations]);
  const loadBookings = async () => {
    if (!resource?._id) return;
    try {
      const res = await ep1.get("/api/v2/resource-management/bookings", { params: { colid: global1.colid, resourceobjectid: resource._id } });
      setBookings(res.data?.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load bookings");
    }
  };
  useEffect(() => { loadBookings(); }, [resource?._id]);
  const openSlot = (day) => {
    const date = dateKey(day);
    setBookingForm({ ...blankBooking, starttime: `${date}T10:00`, endtime: `${date}T11:00` });
    setDialogOpen(true);
  };
  const addExternal = () => {
    if (!bookingForm.externalEmail && !bookingForm.externalName) return;
    setBookingForm((p) => ({ ...p, participants: [...p.participants, { name: p.externalName, email: p.externalEmail, type: "External" }], externalName: "", externalEmail: "" }));
  };
  const saveBooking = async () => {
    try {
      await ep1.post("/api/v2/resource-management/bookings", { ...bookingForm, resourceobjectid: resource?._id, colid: global1.colid, user: global1.user, namecreated: global1.name });
      setMessage("Resource booked successfully");
      setDialogOpen(false);
      loadBookings();
      loadOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save booking");
    }
  };
  return (
    <MenuPageShell title="Resource Calendar">
      <Box sx={{ p: 3 }}>
        <Status error={error || optionError} message={message} clear={() => { setError(""); setMessage(""); }} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Searchable label="Resource type" options={options.resourceTypes || []} value={type} getOptionLabel={(t) => t.resourcetype || ""} onChange={(t) => { setType(t); setResource(null); }} /></Grid>
            <Grid item xs={12} md={3}><Searchable label="Resource" options={resources} value={resource} getOptionLabel={(r) => `${r.resourcename || ""} (${r.resourceid || ""})`} onChange={setResource} disabled={!type} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="View" value={view} onChange={(e) => setView(e.target.value)}>{["Daily", "Weekly", "Monthly"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Refresh />} onClick={loadBookings} disabled={!resource}>Load</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2, overflowX: "auto" }}>{resource ? <CalendarBoard bookings={bookings} view={view} activeDate={activeDate} onSlot={openSlot} /> : <Alert severity="info">Select resource type and resource to load calendar.</Alert>}</Paper>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>Book resource</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}><TextField fullWidth type="datetime-local" label="Start time" value={bookingForm.starttime} onChange={(e) => setBookingForm((p) => ({ ...p, starttime: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth type="datetime-local" label="End time" value={bookingForm.endtime} onChange={(e) => setBookingForm((p) => ({ ...p, endtime: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Title" value={bookingForm.title} onChange={(e) => setBookingForm((p) => ({ ...p, title: e.target.value }))} /></Grid>
              <Grid item xs={12} md={6}><Searchable multiple label="Internal participants" options={options.owners || []} value={bookingForm.participants.filter((p) => p.type !== "External")} getOptionLabel={(o) => `${o.name || ""} (${o.email || ""})`} onChange={(items) => setBookingForm((p) => ({ ...p, participants: [...items.map((o) => ({ name: o.name, email: o.email, type: "Internal" })), ...p.participants.filter((x) => x.type === "External")] }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description" value={bookingForm.description} onChange={(e) => setBookingForm((p) => ({ ...p, description: e.target.value }))} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="External participant name" value={bookingForm.externalName} onChange={(e) => setBookingForm((p) => ({ ...p, externalName: e.target.value }))} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="External participant email" value={bookingForm.externalEmail} onChange={(e) => setBookingForm((p) => ({ ...p, externalEmail: e.target.value }))} /></Grid>
              <Grid item xs={12} md={4}><Button fullWidth variant="outlined" startIcon={<Add />} onClick={addExternal}>Add external</Button></Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1} flexWrap="wrap">{bookingForm.participants.map((p, i) => <Chip key={`${p.email}-${i}`} label={`${p.name || p.email} ${p.type === "External" ? "(External)" : ""}`} onDelete={() => setBookingForm((prev) => ({ ...prev, participants: prev.participants.filter((_, idx) => idx !== i) }))} />)}</Stack></Grid>
              <Grid item xs={12} md={6}><Searchable label="Email configuration" options={options.emailConfigurations || []} value={selectedConfig} getOptionLabel={(c) => c.label || c.username || ""} onChange={(c) => setBookingForm((p) => ({ ...p, emailconfigurationid: c?._id || "" }))} /></Grid>
              <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={bookingForm.notifyparticipants} onChange={(e) => setBookingForm((p) => ({ ...p, notifyparticipants: e.target.checked }))} />} label="Notify participants on save" /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" startIcon={<Event />} onClick={saveBooking}>Save booking</Button></DialogActions>
        </Dialog>
      </Box>
    </MenuPageShell>
  );
}

export function ResourceManagementReportPage() {
  const { options, optionError } = useResourceOptions();
  const [type, setType] = useState(null);
  const [resource, setResource] = useState(null);
  const [from, setFrom] = useState(dateKey(addDays(new Date(), -30)));
  const [to, setTo] = useState(dateKey(new Date()));
  const [data, setData] = useState({ bookings: [], summary: {}, charts: {} });
  const [error, setError] = useState("");
  const resources = useMemo(() => (options.resources || []).filter((r) => !type || r.resourcetype === type.resourcetype), [options.resources, type]);
  const load = async () => {
    try {
      const res = await ep1.get("/api/v2/resource-management/report", { params: { colid: global1.colid, resourcetype: type?.resourcetype || "", resourceobjectid: resource?._id || "", from, to } });
      setData(res.data || { bookings: [], summary: {}, charts: {} });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report");
    }
  };
  const cards = [["Bookings", data.summary?.totalBookings || 0], ["Resources used", data.summary?.resourcesUsed || 0], ["Types used", data.summary?.typesUsed || 0], ["Participants", data.summary?.participants || 0]];
  return (
    <MenuPageShell title="Resource Management Report">
      <Box sx={{ p: 3 }}>
        <Status error={error || optionError} message="" clear={() => setError("")} />
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Searchable label="Resource type" options={options.resourceTypes || []} value={type} getOptionLabel={(t) => t.resourcetype || ""} onChange={(t) => { setType(t); setResource(null); }} /></Grid>
            <Grid item xs={12} md={3}><Searchable label="Resource" options={resources} value={resource} getOptionLabel={(r) => `${r.resourcename || ""} (${r.resourceid || ""})`} onChange={setResource} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={load}>Load</Button></Grid>
          </Grid>
        </Paper>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}><Button startIcon={<Print />} onClick={() => window.print()}>Print preview</Button></Stack>
        <Grid container spacing={2} sx={{ mb: 2 }}>{cards.map(([label, value]) => <Grid item xs={12} md={3} key={label}><Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[["Monthwise bookings", data.charts?.byMonth || []], ["Typewise bookings", data.charts?.byType || []], ["Resourcewise bookings", data.charts?.byResource || []]].map(([title, chart]) => <Grid item xs={12} md={4} key={title}><Paper sx={{ p: 2, height: 300 }}><Typography fontWeight={900}>{title}</Typography><ResponsiveContainer><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></Paper></Grid>)}
        </Grid>
        <Paper sx={{ p: 1 }}><DataGrid rows={(data.bookings || []).map((r) => ({ ...r, id: r._id }))} columns={[{ field: "resourcetype", headerName: "Type", width: 150 }, { field: "resourcename", headerName: "Resource", width: 200 }, { field: "resourceid", headerName: "Resource ID", width: 140 }, { field: "title", headerName: "Title", width: 240 }, { field: "description", headerName: "Description", width: 280 }, { field: "starttime", headerName: "Start", width: 190, valueGetter: ({ row }) => fmt(row.starttime) }, { field: "endtime", headerName: "End", width: 190, valueGetter: ({ row }) => fmt(row.endtime) }, { field: "participants", headerName: "Participants", width: 260, valueGetter: ({ row }) => (row.participants || []).map((p) => p.name || p.email).join(", ") }]} autoHeight getRowHeight={() => "auto"} slots={{ toolbar: GridToolbar }} sx={gridSx} /></Paper>
      </Box>
    </MenuPageShell>
  );
}
