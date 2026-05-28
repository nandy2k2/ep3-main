import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Alert, Box, Button, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankForm = { campus: "", building: "", room: "", noofseats: "" };

export default function ConductExamRoomPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState("");
  const [filters, setFilters] = useState({ campus: "", building: "", room: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadRows();
  }, []);

  const loadRows = async (nextFilters = filters) => {
    try {
      const params = { colid: global1.colid };
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await ep1.get("/api/v2/conductexam/rooms", { params });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load rooms.");
    }
  };

  const saveRow = async () => {
    if (!form.campus || !form.building || !form.room || form.noofseats === "") {
      setError("Campus, building, room and no of seats are required.");
      return;
    }
    try {
      setError("");
      await ep1.post("/api/v2/conductexam/rooms", {
        ...form,
        noofseats: Number(form.noofseats),
        id: editId,
        colid: global1.colid,
        user: global1.user
      });
      setMessage(editId ? "Room updated." : "Room added.");
      setForm(blankForm);
      setEditId("");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save room.");
    }
  };

  const editRow = (row) => {
    setEditId(row._id);
    setForm({
      campus: row.campus || "",
      building: row.building || "",
      room: row.room || "",
      noofseats: row.noofseats ?? ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRow = async (id) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await ep1.post("/api/v2/conductexam/rooms-delete", { id, colid: global1.colid });
      setMessage("Room deleted.");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete room.");
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { campus: "Main Campus", building: "Academic Block", room: "101", noofseats: 60 }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rooms");
    XLSX.writeFile(workbook, "conduct_exam_room_template.xlsx");
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({
        rowNumber: index + 2,
        campus: row.campus || row.Campus || "",
        building: row.building || row.Building || "",
        room: row.room || row.Room || "",
        noofseats: row.noofseats || row["No of seats"] || row.noOfSeats || ""
      }));
      const res = await ep1.post("/api/v2/conductexam/rooms-bulk", { colid: global1.colid, user: global1.user, items });
      setMessage(`${res.data?.saved || 0} rooms uploaded.`);
      if (res.data?.errors?.length) setError(`${res.data.errors.length} rows could not be uploaded. Please check required fields.`);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload rooms.");
    }
  };

  const columns = useMemo(() => [
    { field: "campus", headerName: "Campus", minWidth: 180, flex: 1 },
    { field: "building", headerName: "Building", minWidth: 180, flex: 1 },
    { field: "room", headerName: "Room", minWidth: 140, flex: 1 },
    { field: "noofseats", headerName: "No of Seats", width: 140, type: "number" },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => editRow(params.row)}>Edit</Button>
          <Button size="small" color="error" onClick={() => deleteRow(params.row._id)}>Delete</Button>
        </Stack>
      )
    }
  ], []);

  return (
    <MenuPageShell title="Seat Master">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Room Configuration</Typography>
              <Typography color="text.secondary">Maintain campus, building, room and seat capacity for examinations.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={downloadTemplate}>Template</Button>
              <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
                Bulk Upload
                <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label="Campus" value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} /></Grid>
            <Grid item xs={12} md={2.5}><TextField fullWidth label="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth type="number" label="No of Seats" value={form.noofseats} onChange={(e) => setForm({ ...form, noofseats: e.target.value })} /></Grid>
            <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" onClick={saveRow} sx={{ height: 56 }}>{editId ? "Update" : "Save"}</Button></Grid>
            {editId && <Grid item xs={12} md={1.5}><Button fullWidth variant="outlined" onClick={() => { setEditId(""); setForm(blankForm); }} sx={{ height: 56 }}>Cancel</Button></Grid>}
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Grid container spacing={2}>
            {Object.keys(filters).map((key) => (
              <Grid item xs={12} md={3} key={key}>
                <TextField fullWidth label={key} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={() => loadRows()} sx={{ height: 56 }}>Filter</Button></Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
          <Box sx={{ height: 560 }}>
            <DataGrid rows={rows} getRowId={(row) => row._id} columns={columns} slots={{ toolbar: GridToolbar }} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
          </Box>
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
