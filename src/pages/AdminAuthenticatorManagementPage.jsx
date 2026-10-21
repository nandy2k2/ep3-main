import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";

const asDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function AdminAuthenticatorManagementPage() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ authenticator: "", authenticatordate: "", clearDate: false, resetsecret: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setMessage("");
      if (!password) throw new Error("Password is required");
      if (!email) throw new Error("Email is required");
      setLoading(true);
      const res = await ep1.get("/api/v2/authenticator/admin-global-email", { params: { password, email } });
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setMessage(`Loaded ${res.data?.data?.length || 0} matching user(s).`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load authenticator records");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setError("");
      setMessage("");
      if (!password) throw new Error("Password is required");
      if (!email) throw new Error("Email is required");
      const payload = { password, email, resetsecret: form.resetsecret };
      if (form.authenticator) payload.authenticator = form.authenticator;
      if (form.authenticatordate || form.clearDate) payload.authenticatordate = form.clearDate ? "" : form.authenticatordate;
      if (!payload.authenticator && !payload.authenticatordate && !form.clearDate && !payload.resetsecret) {
        throw new Error("Choose add/remove authenticator, date change, or reset setup");
      }
      setLoading(true);
      const res = await ep1.post("/api/v2/authenticator/admin-global-email", payload);
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setMessage(`Updated ${res.data?.updated || 0} user(s).`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update authenticator");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "colid", headerName: "Colid", width: 100 },
    { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
    { field: "email", headerName: "Email", minWidth: 220, flex: 1 },
    { field: "role", headerName: "Role", width: 140 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "designation", headerName: "Designation", minWidth: 160 },
    { field: "authenticator", headerName: "Authenticator", width: 140 },
    { field: "authenticatordate", headerName: "Mandatory from", width: 160, valueGetter: (params) => asDateInput(params.row?.authenticatordate) },
    { field: "authenticatorsetupdate", headerName: "Setup date", width: 160, valueGetter: (params) => asDateInput(params.row?.authenticatorsetupdate) }
  ];

  return (
    <MenuPageShell title="Admin authentication management">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Admin authentication management</Typography>
            <Typography color="text.secondary">
              Password protected repair page. This page can find and update an email across all college ids.
            </Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField fullWidth size="small" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(); }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" disabled={loading} onClick={load}>Load</Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5 }}>Update authenticator</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Authenticator" value={form.authenticator} onChange={(e) => setForm((p) => ({ ...p, authenticator: e.target.value }))}>
                  <MenuItem value="">No change</MenuItem>
                  <MenuItem value="Yes">Add / Yes</MenuItem>
                  <MenuItem value="No">Remove / No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth size="small" type="date" label="Mandatory from" value={form.authenticatordate} disabled={form.clearDate} onChange={(e) => setForm((p) => ({ ...p, authenticatordate: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControlLabel control={<Checkbox checked={form.clearDate} onChange={(e) => setForm((p) => ({ ...p, clearDate: e.target.checked, authenticatordate: e.target.checked ? "" : p.authenticatordate }))} />} label="Clear date" />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControlLabel control={<Checkbox checked={form.resetsecret} onChange={(e) => setForm((p) => ({ ...p, resetsecret: e.target.checked }))} />} label="Reset setup" />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" color="warning" disabled={loading} onClick={save}>Apply</Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              components={{ Toolbar: GridToolbar }}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
