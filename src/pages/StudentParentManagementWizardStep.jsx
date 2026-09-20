import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const emptyFilter = { field: "", value: [] };
const parentBlank = { parentname: "", email: "", phone: "", address: "", city: "", pin: "", state: "", country: "", occupation: "", income: "", caste: "", password: "Password@123", status: "Active" };
const studentFilterFields = ["academicyear", "admissionyear", "regulation", "program", "programcode", "semester", "section", "name", "regno", "email", "gender"];
const title = (value) => String(value || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (item) => item.toUpperCase());
const ids = (selection) => Array.from(selection?.ids || selection || []);

export default function StudentParentManagementWizardStep() {
  const [form, setForm] = useState(parentBlank);
  const [students, setStudents] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ ...emptyFilter }]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fieldOptions = useMemo(() => studentFilterFields.map((field) => ({ field, label: title(field) })), []);
  const selectedStudents = useMemo(() => students.filter((student) => selected.includes(student._id)), [students, selected]);

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/parent-portal/options", { params: { colid: global1.colid } });
      setOptions(res.data?.options || {});
      setStudents((res.data?.students || []).map((row) => ({ ...row, id: row._id })));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load student options");
    }
  };

  useEffect(() => { loadOptions(); }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const active = filters.filter((row) => row.field && row.value?.length);
      const res = await ep1.get("/api/v2/parent-portal/options", { params: { colid: global1.colid } });
      const allStudents = res.data?.students || [];
      const filtered = active.length
        ? allStudents.filter((student) => active.every((filter) => (filter.value || []).includes(String(student[filter.field] || ""))))
        : allStudents;
      setOptions(res.data?.options || {});
      setStudents(filtered.map((row) => ({ ...row, id: row._id })));
      setSelected([]);
      setMessage(`Loaded ${filtered.length} student(s).`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  const saveParentAndLinks = async () => {
    if (!form.parentname || !form.email) {
      setError("Parent name and email are required.");
      return;
    }
    if (!selectedStudents.length) {
      setError("Select at least one student to link.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await ep1.post("/api/v2/parent-portal/parents", { ...form, colid: global1.colid, name: global1.name, user: global1.user });
      for (const student of selectedStudents) {
        await ep1.post("/api/v2/parent-portal/links", {
          colid: global1.colid,
          name: global1.name,
          user: global1.user,
          parentemail: form.email,
          parent: form.parentname,
          student: student.name,
          regno: student.regno,
          studentemail: student.email,
          academicyear: student.academicyear,
          regulation: student.regulation,
          program: student.program,
          programcode: student.programcode,
          semester: student.semester,
          section: student.section,
          photo: student.photo,
          status: "Active"
        });
      }
      setMessage(`Parent saved and ${selectedStudents.length} student link(s) created.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save parent/student links");
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, ...patch, ...(patch.field !== undefined ? { value: [] } : {}) } : row
    )));
  };

  const columns = [
    { field: "name", headerName: "Student", minWidth: 180, flex: 1 },
    { field: "regno", headerName: "Reg No", minWidth: 140 },
    { field: "email", headerName: "Email", minWidth: 210, flex: 1 },
    { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
    { field: "regulation", headerName: "Regulation", minWidth: 120 },
    { field: "program", headerName: "Program", minWidth: 170, flex: 1 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 110 },
    { field: "section", headerName: "Section", minWidth: 100 }
  ];

  return (
    <MenuPageShell title="Parent management">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Parent management</Typography>
            <Typography color="text.secondary">Add parent details and link one or more selected students in the same flow.</Typography>
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress />}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Parent details</Typography>
            <Grid container spacing={2}>
              {Object.keys(parentBlank).map((field) => (
                <Grid item xs={12} md={field === "address" ? 12 : 4} key={field}>
                  <TextField
                    fullWidth
                    label={title(field)}
                    type={field === "password" ? "password" : "text"}
                    multiline={field === "address"}
                    rows={field === "address" ? 2 : 1}
                    value={form[field] || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Select students</Typography>
            <Stack spacing={1}>
              {filters.map((filter, index) => (
                <Grid container spacing={1} key={index}>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      size="small"
                      options={fieldOptions}
                      value={fieldOptions.find((item) => item.field === filter.field) || null}
                      getOptionLabel={(option) => option?.label || ""}
                      onChange={(_, value) => updateFilter(index, { field: value?.field || "" })}
                      renderInput={(params) => <TextField {...params} label="Student filter" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      size="small"
                      multiple
                      disableCloseOnSelect
                      options={options[filter.field] || []}
                      value={filter.value || []}
                      onChange={(_, value) => updateFilter(index, { value })}
                      renderOption={(props, option, { selected }) => <li {...props}><Checkbox size="small" checked={selected} />{option}</li>}
                      renderInput={(params) => <TextField {...params} label="Value" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth color="error" variant="outlined" onClick={() => setFilters((prev) => prev.length === 1 ? [{ ...emptyFilter }] : prev.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button>
                  </Grid>
                </Grid>
              ))}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => setFilters((prev) => [...prev, { ...emptyFilter }])}>Add filter</Button>
                <Button variant="contained" startIcon={<RefreshIcon />} disabled={loading} onClick={loadStudents}>Load students</Button>
                <Button variant="contained" color="success" startIcon={<SaveIcon />} disabled={loading || !selected.length} onClick={saveParentAndLinks}>Save parent and link selected students</Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ height: 560, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <DataGrid
              rows={students}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(model) => setSelected(ids(model))}
              slots={{ toolbar: GridToolbar }}
              sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 } }}
            />
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
