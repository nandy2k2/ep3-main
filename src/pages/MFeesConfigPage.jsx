import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { Add, ArrowBack, Cancel, Delete, Edit, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";

const defaultAcademicYears = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];
const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const categoryOptions = ["General", "SC", "ST", "OBC", "EWS", "EBC", "PH", "Sports", "Supernumerary"];

const blankForm = {
  academicyear: "2026-27",
  feebook: "",
  cashbook: "",
  program: "",
  programcode: "",
  regulation: "",
  major: "",
  minor: "",
  feegroup: "",
  semester: "1",
  feeeitem: "",
  feecategory: "General",
  studtype: "",
  domicile: "",
  feetype: "",
  classdate: "",
  amount: "",
  status: "Added"
};

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
}

export default function MFeesConfigPage() {
  const colid = useMemo(() => global1.colid, []);
  const [rows, setRows] = useState([]);
  const [academicYears, setAcademicYears] = useState(defaultAcademicYears);
  const [feebooks, setFeebooks] = useState([]);
  const [cashbooks, setCashbooks] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState({ academicyear: "", programcode: "", regulation: "", semester: "", status: "" });
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
    loadRows();
  }, []);

  useEffect(() => {
    loadOptions({
      academicyear: form.academicyear,
      regulation: form.regulation,
      programcode: form.programcode
    });
  }, [form.academicyear, form.regulation, form.programcode]);

  const loadOptions = async (params = {}) => {
    try {
      const res = await ep1.get("/api/v2/mfeesconfig/options", { params: { colid, ...params } });
      setAcademicYears(res.data.academicYears || defaultAcademicYears);
      setFeebooks(unique(res.data.feebooks || []));
      setCashbooks(unique(res.data.cashbooks || []));
      setPrograms(res.data.programs || []);
      setRegulations(unique(res.data.regulations || []));
      setMajors(unique(res.data.majors || []));
      setMinors(unique(res.data.minors || []));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dropdown data");
    }
  };

  const loadRows = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = { colid };
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await ep1.get("/api/v2/mfeesconfig", { params });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load fee records");
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const selectProgram = (programcode) => {
    const selected = programs.find((item) => item.programcode === programcode);
    setForm((prev) => ({
      ...prev,
      programcode,
      program: selected?.program || "",
      major: "",
      minor: ""
    }));
  };

  const resetForm = () => {
    setForm(blankForm);
    setEditingId("");
  };

  const payload = () => ({
    ...form,
    colid,
    user: global1.user,
    name: global1.name || global1.user,
    status: form.status || "Added"
  });

  const saveRow = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await ep1.post("/api/v2/mfeesconfig/update", { ...payload(), id: editingId });
        setMessage("Fee record updated");
      } else {
        await ep1.post("/api/v2/mfeesconfig", payload());
        setMessage("Fee record added");
      }
      resetForm();
      await loadRows();
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save fee record");
    }
  };

  const editRow = (row) => {
    setEditingId(row._id);
    setForm({
      academicyear: row.academicyear || "2026-27",
      feebook: row.feebook || "",
      cashbook: row.cashbook || "",
      program: row.program || "",
      programcode: row.programcode || "",
      regulation: row.regulation || "",
      major: row.major || "",
      minor: row.minor || "",
      feegroup: row.feegroup || "",
      semester: row.semester || "1",
      feeeitem: row.feeeitem || "",
      feecategory: row.feecategory || "General",
      studtype: row.studtype || "",
      domicile: row.domicile || "",
      feetype: row.feetype || "",
      classdate: row.classdate ? String(row.classdate).slice(0, 10) : "",
      amount: row.amount || "",
      status: row.status || "Added"
    });
  };

  const deleteRow = async (row) => {
    if (!window.confirm(`Delete fee item ${row.feeeitem || ""}?`)) return;
    try {
      await ep1.post("/api/v2/mfeesconfig/delete", { id: row._id });
      setMessage("Fee record deleted");
      await loadRows();
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete fee record");
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const items = json.map((row, index) => ({
        rowNumber: index + 2,
        academicyear: row.academicyear || row["Academic Year"],
        feebook: row.feebook || row["Fee Book"],
        cashbook: row.cashbook || row["Cash Book"],
        program: row.program || row.Program,
        programcode: row.programcode || row["Program Code"],
        regulation: row.regulation || row.Regulation,
        major: row.major || row.Major,
        minor: row.minor || row.Minor,
        feegroup: row.feegroup || row["Fee Group"],
        semester: row.semester || row.Semester,
        feeeitem: row.feeeitem || row.feeitem || row["Fee Item"],
        feecategory: row.feecategory || row["Fee Category"],
        studtype: row.studtype || row["Student Type"],
        domicile: row.domicile || row.Domicile,
        feetype: row.feetype || row["Fee Type"],
        classdate: row.classdate || row["Due Date"],
        amount: row.amount || row.Amount,
        status: row.status || "Added"
      }));

      const res = await ep1.post("/api/v2/mfeesconfig/bulkupload", {
        colid,
        user: global1.user,
        name: global1.name || global1.user,
        items
      });
      const inserted = res.data.inserted || 0;
      const errors = res.data.errors || [];
      setMessage(`Bulk upload completed. Inserted ${inserted}${errors.length ? `, errors ${errors.length}` : ""}.`);
      if (errors.length) setError(errors.map((item) => `Row ${item.rowNumber}: ${item.message}`).join(" | "));
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload Excel file");
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "feebook", headerName: "Fee Book", width: 160 },
    { field: "cashbook", headerName: "Cash Book", width: 160 },
    { field: "program", headerName: "Program", width: 220 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "regulation", headerName: "Regulation", width: 180 },
    { field: "major", headerName: "Major", width: 180 },
    { field: "minor", headerName: "Minor", width: 180 },
    { field: "feegroup", headerName: "Fee Group", width: 160 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "feeeitem", headerName: "Fee Item", width: 190 },
    { field: "feecategory", headerName: "Fee Category", width: 140 },
    { field: "studtype", headerName: "Student Type", width: 140 },
    { field: "domicile", headerName: "Domicile", width: 130 },
    { field: "feetype", headerName: "Fee Type", width: 140 },
    { field: "classdate", headerName: "Due Date", width: 130, valueGetter: (params) => (params.value ? String(params.value).slice(0, 10) : "") },
    { field: "amount", headerName: "Amount", width: 120, type: "number" },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton color="primary" size="small" onClick={() => editRow(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="error" size="small" onClick={() => deleteRow(params.row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Fee Configuration</Typography>
          <Typography variant="body2" color="text.secondary">Configure fees by academic year, program, regulation, major and minor</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button component={RouterLink} to="/dashdashfacnew" variant="outlined" startIcon={<ArrowBack />}>Dashboard</Button>
          <Button variant="outlined" component="label" startIcon={<UploadFile />}>
            Bulk Upload
            <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
          </Button>
          <Chip label={`${rows.length} records`} variant="outlined" />
        </Stack>
      </Stack>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">{editingId ? "Edit Fee" : "Add Fee"}</Typography>
              {editingId && <IconButton onClick={resetForm}><Cancel /></IconButton>}
            </Stack>
            <Box component="form" onSubmit={saveRow}>
              <Stack spacing={1.5}>
                <TextField select size="small" label="Academic Year" value={form.academicyear} onChange={(e) => setField("academicyear", e.target.value)} required>
                  {academicYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Fee Book" value={form.feebook} onChange={(e) => setField("feebook", e.target.value)}>
                  {feebooks.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Cash Book" value={form.cashbook} onChange={(e) => setField("cashbook", e.target.value)}>
                  {cashbooks.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Program" value={form.programcode} onChange={(e) => selectProgram(e.target.value)} required>
                  {programs.map((item) => <MenuItem key={item._id || item.programcode} value={item.programcode}>{item.program} ({item.programcode})</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Regulation" value={form.regulation} onChange={(e) => setField("regulation", e.target.value)}>
                  {regulations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Major" value={form.major} onChange={(e) => setField("major", e.target.value)} disabled={!form.regulation || !form.programcode}>
                  {majors.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Minor" value={form.minor} onChange={(e) => setField("minor", e.target.value)} disabled={!form.regulation || !form.programcode}>
                  {minors.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Fee Group" value={form.feegroup} onChange={(e) => setField("feegroup", e.target.value)} required />
                <TextField select size="small" label="Semester" value={form.semester} onChange={(e) => setField("semester", e.target.value)} required>
                  {semesterOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Fee Item" value={form.feeeitem} onChange={(e) => setField("feeeitem", e.target.value)} required />
                <TextField select size="small" label="Fee Category" value={form.feecategory} onChange={(e) => setField("feecategory", e.target.value)} required>
                  {categoryOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Student Type" value={form.studtype} onChange={(e) => setField("studtype", e.target.value)} />
                <TextField size="small" label="Domicile" value={form.domicile} onChange={(e) => setField("domicile", e.target.value)} />
                <TextField size="small" label="Fee Type" value={form.feetype} onChange={(e) => setField("feetype", e.target.value)} />
                <TextField size="small" type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={form.classdate} onChange={(e) => setField("classdate", e.target.value)} />
                <TextField size="small" type="number" label="Amount" value={form.amount} onChange={(e) => setField("amount", e.target.value)} required />
                <TextField size="small" label="Status" value={form.status} onChange={(e) => setField("status", e.target.value)} />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" startIcon={editingId ? <Save /> : <Add />}>{editingId ? "Update" : "Create"}</Button>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={resetForm}>Clear</Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Academic Year</InputLabel>
                <Select label="Academic Year" value={filters.academicyear} onChange={(e) => setFilters((prev) => ({ ...prev, academicyear: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  {academicYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Program</InputLabel>
                <Select label="Program" value={filters.programcode} onChange={(e) => setFilters((prev) => ({ ...prev, programcode: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  {programs.map((item) => <MenuItem key={item._id || item.programcode} value={item.programcode}>{item.program} ({item.programcode})</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Regulation</InputLabel>
                <Select label="Regulation" value={filters.regulation} onChange={(e) => setFilters((prev) => ({ ...prev, regulation: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  {regulations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={() => loadRows()}>Filter</Button>
              <Tooltip title="Reload">
                <IconButton color="primary" onClick={() => loadRows()}><Refresh /></IconButton>
              </Tooltip>
            </Stack>

            <Box sx={{ height: 680, width: "100%", overflowX: "auto" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row._id}
                loading={loading}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "fee_configuration" } } }}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  sorting: { sortModel: [{ field: "academicyear", sort: "desc" }, { field: "program", sort: "asc" }] }
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
                sx={{ minWidth: 2900 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
