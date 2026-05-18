import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography
} from "@mui/material";
import { ArrowBack, Delete, Refresh } from "@mui/icons-material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";

const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

export default function NepLmsFinalMarksViewPage() {
  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    academicyear: "",
    semester: "",
    programcode: "",
    coursecode: "",
    passstatus: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadMarks();
  }, []);

  const options = useMemo(() => ({
    academicyear: uniqueSorted(allRows.map((row) => row.academicyear)),
    semester: uniqueSorted(allRows.filter((row) => !filters.academicyear || row.academicyear === filters.academicyear).map((row) => row.semester)),
    programcode: uniqueSorted(allRows.map((row) => row.programcode)),
    coursecode: uniqueSorted(allRows
      .filter((row) => (!filters.academicyear || row.academicyear === filters.academicyear) && (!filters.semester || row.semester === filters.semester))
      .map((row) => row.coursecode)),
    passstatus: uniqueSorted(allRows.map((row) => row.passstatus))
  }), [allRows, filters.academicyear, filters.semester]);

  const loadMarks = async (overrideFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      Object.entries(overrideFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await ep1.get("/api/v2/neplms/final-marks", { params });
      const data = res.data?.data || [];
      setRows(data);
      if (!Object.values(overrideFilters).some(Boolean)) setAllRows(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load final marks");
    } finally {
      setLoading(false);
    }
  };

  const changeFilter = (field, value) => {
    const next = { ...filters, [field]: value };
    if (field === "academicyear") {
      next.semester = "";
      next.coursecode = "";
    }
    if (field === "semester") next.coursecode = "";
    setFilters(next);
    loadMarks(next);
  };

  const clearFilters = () => {
    const empty = {
      academicyear: "",
      semester: "",
      programcode: "",
      coursecode: "",
      passstatus: ""
    };
    setFilters(empty);
    loadMarks(empty);
  };

  const deleteRow = async (row) => {
    const ok = window.confirm(`Delete final marks for ${row.student || row.regno}?`);
    if (!ok) return;
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await ep1.post("/api/v2/neplms/final-marks/delete", {
        id: row._id,
        colid: global1.colid
      });
      setRows((prev) => prev.filter((item) => item._id !== row._id));
      setAllRows((prev) => prev.filter((item) => item._id !== row._id));
      setMessage("Final marks entry deleted");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete final marks");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "major", headerName: "Major", width: 170 },
    { field: "subject", headerName: "Subject", width: 170 },
    { field: "student", headerName: "Student", width: 190 },
    { field: "regno", headerName: "Reg No", width: 130 },
    { field: "internalmarks", headerName: "Internal Marks", width: 140, type: "number" },
    { field: "externalmarks", headerName: "External Marks", width: 140, type: "number" },
    { field: "total", headerName: "Total", width: 110, type: "number" },
    { field: "grade", headerName: "Grade", width: 100 },
    { field: "gradepoint", headerName: "Grade Point", width: 130, type: "number" },
    { field: "credits", headerName: "Credits", width: 110, type: "number" },
    { field: "gpa", headerName: "GPA", width: 110, type: "number" },
    {
      field: "passstatus",
      headerName: "Pass Status",
      width: 130,
      renderCell: (params) => <Chip size="small" color={params.value === "Pass" ? "success" : "error"} label={params.value || "Fail"} />
    },
    { field: "attempt", headerName: "Attempt", width: 110, type: "number" },
    { field: "failmode", headerName: "Fail Rule", width: 170 },
    { field: "grademode", headerName: "Grade Rule", width: 160 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 90,
      getActions: (params) => [
        <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRow(params.row)} />
      ]
    }
  ];

  const passCount = rows.filter((row) => row.passstatus === "Pass").length;
  const failCount = rows.filter((row) => row.passstatus === "Fail").length;

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>View Final Marks</Typography>
          <Typography variant="body2" color="text.secondary">Final marks generated from componentwise internal and external totals.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/dashdashfacnew" variant="outlined" startIcon={<ArrowBack />}>Back</Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => loadMarks(filters)}>Reload</Button>
        </Stack>
      </Stack>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year" value={filters.academicyear} onChange={(event) => changeFilter("academicyear", event.target.value)}>
                <MenuItem value="">All</MenuItem>
                {options.academicyear.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select label="Semester" value={filters.semester} onChange={(event) => changeFilter("semester", event.target.value)}>
                <MenuItem value="">All</MenuItem>
                {options.semester.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Program Code</InputLabel>
              <Select label="Program Code" value={filters.programcode} onChange={(event) => changeFilter("programcode", event.target.value)}>
                <MenuItem value="">All</MenuItem>
                {options.programcode.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Course Code</InputLabel>
              <Select label="Course Code" value={filters.coursecode} onChange={(event) => changeFilter("coursecode", event.target.value)}>
                <MenuItem value="">All</MenuItem>
                {options.coursecode.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Pass Status</InputLabel>
              <Select label="Pass Status" value={filters.passstatus} onChange={(event) => changeFilter("passstatus", event.target.value)}>
                <MenuItem value="">All</MenuItem>
                {options.passstatus.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Chip color="primary" label={`Rows: ${rows.length}`} />
          <Chip color="success" label={`Pass: ${passCount}`} />
          <Chip color="error" label={`Fail: ${failCount}`} />
          <Button size="small" variant="outlined" onClick={clearFilters}>Clear Filters</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1, overflowX: "auto" }}>
        <DataGrid
          rows={rows}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          autoHeight
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "final_marks" } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          sx={{ minWidth: 2450 }}
        />
      </Paper>
    </Box>
  );
}
