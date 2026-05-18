import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import * as XLSX from "xlsx";
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
  TextField,
  Typography
} from "@mui/material";
import { Add, ArrowBack, Delete, Edit, FileDownload, Print, Refresh, Save, SwapHoriz, UploadFile } from "@mui/icons-material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankClass = {
  academicyear: "",
  regulation: "",
  program: "",
  programcode: "",
  faculty: "",
  facultyemail: "",
  major: "",
  semester: "",
  course: "",
  coursecode: "",
  classdate: "",
  classtime: "",
  period: "",
  durationminutes: "",
  module: "",
  topic: "",
  workcompleted: "",
  status: "Active"
};

const filterFields = [
  { field: "academicyear", label: "Academic Year" },
  { field: "program", label: "Program" },
  { field: "programcode", label: "Program Code" },
  { field: "major", label: "Major" },
  { field: "semester", label: "Semester" },
  { field: "course", label: "Course" },
  { field: "coursecode", label: "Course Code" },
  { field: "faculty", label: "Faculty" },
  { field: "facultyemail", label: "Faculty Email" },
  { field: "classdate", label: "Class Date" },
  { field: "status", label: "Status" }
];

const makeFilter = () => ({ id: `${Date.now()}-${Math.random()}`, field: "academicyear", value: "" });
const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b));
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const dateToInput = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const startOfWeek = (date) => addDays(date, -date.getDay());
const monthTitle = (year, month) => new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
const longDate = (date) => date.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const shortDate = (date) => date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });

export default function NepLmsTimetableManagerPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankClass);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState([makeFilter()]);
  const [swapFirst, setSwapFirst] = useState("");
  const [swapSecond, setSwapSecond] = useState("");
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState("Weekly");
  const [calendarDate, setCalendarDate] = useState("");

  useEffect(() => {
    loadRows();
    loadInstitution();
  }, []);

  const loadInstitution = async () => {
    try {
      const res = await ep1.get("/vins", { params: { colid: global1.colid } });
      setInstitution(res.data || null);
    } catch (err) {
      setInstitution(null);
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/neplms/timetable", { params: { colid: global1.colid } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load timetable");
    } finally {
      setLoading(false);
    }
  };

  const valueOptions = (field) => uniqueSorted(rows.map((row) => row[field]));

  const filteredRows = useMemo(() => rows.filter((row) => filters.every((filter) => {
    if (!filter.field || !filter.value) return true;
    return String(row[filter.field] || "").toLowerCase() === String(filter.value).toLowerCase();
  })), [rows, filters]);

  const calendarGroups = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((row) => {
      const key = row.classdate || "No Date";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return [...map.entries()]
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([date, items]) => ({ date, items: items.sort((a, b) => String(a.classtime).localeCompare(String(b.classtime))) }));
  }, [filteredRows]);

  const firstDatedRowDate = useMemo(() => {
    const dates = filteredRows.map((row) => parseDate(row.classdate)).filter(Boolean).sort((a, b) => a - b);
    return dates[0] || null;
  }, [filteredRows]);

  const activeCalendarDate = useMemo(() => parseDate(calendarDate) || firstDatedRowDate || new Date(), [calendarDate, firstDatedRowDate]);

  const dailyClasses = useMemo(() => {
    const activeDateValue = dateToInput(activeCalendarDate);
    return filteredRows
      .filter((row) => row.classdate === activeDateValue)
      .sort((a, b) => String(a.classtime).localeCompare(String(b.classtime)));
  }, [activeCalendarDate, filteredRows]);

  const weeklyDays = useMemo(() => {
    const weekStart = startOfWeek(activeCalendarDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const dateValue = dateToInput(date);
      const items = filteredRows
        .filter((row) => row.classdate === dateValue)
        .sort((a, b) => String(a.classtime).localeCompare(String(b.classtime)));
      return { key: dateValue, date, dateValue, label: weekdayLabels[date.getDay()], items };
    });
  }, [activeCalendarDate, filteredRows]);

  const weeklyTitle = useMemo(() => {
    const start = weeklyDays[0]?.date;
    const end = weeklyDays[6]?.date;
    if (!start || !end) return "";
    return `${shortDate(start)} - ${shortDate(end)}, ${end.getFullYear()}`;
  }, [weeklyDays]);

  const printableMonths = useMemo(() => {
    const monthMap = new Map();
    filteredRows.forEach((row) => {
      const parsed = parseDate(row.classdate);
      if (!parsed) return;
      const monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          key: monthKey,
          year: parsed.getFullYear(),
          month: parsed.getMonth(),
          days: new Map()
        });
      }
      const day = parsed.getDate();
      const month = monthMap.get(monthKey);
      if (!month.days.has(day)) month.days.set(day, []);
      month.days.get(day).push(row);
    });

    return [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key)).map((month) => {
      const firstDay = new Date(month.year, month.month, 1).getDay();
      const totalDays = new Date(month.year, month.month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDay; i += 1) cells.push({ key: `blank-${i}`, blank: true });
      for (let day = 1; day <= totalDays; day += 1) {
        const items = (month.days.get(day) || []).sort((a, b) => String(a.classtime).localeCompare(String(b.classtime)));
        cells.push({ key: `${month.key}-${day}`, day, items });
      }
      while (cells.length % 7 !== 0) cells.push({ key: `blank-end-${cells.length}`, blank: true });
      return { ...month, title: monthTitle(month.year, month.month), cells };
    });
  }, [filteredRows]);

  const updateFilter = (id, key, value) => {
    setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  };

  const removeFilter = (id) => {
    setFilters((prev) => prev.length === 1 ? [makeFilter()] : prev.filter((item) => item.id !== id));
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(blankClass);
    setEditingId("");
  };

  const saveRow = async () => {
    try {
      setError("");
      setMessage("");
      const payload = { ...form, colid: global1.colid, user: global1.user };
      if (editingId) {
        await ep1.post("/api/v2/neplms/timetable/update", { ...payload, id: editingId });
        setMessage("Class updated");
      } else {
        await ep1.post("/api/v2/neplms/timetable", payload);
        setMessage("Class added");
      }
      resetForm();
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save class");
    }
  };

  const editRow = (row) => {
    setEditingId(row._id);
    setForm({
      academicyear: row.academicyear || "",
      regulation: row.regulation || "",
      program: row.program || "",
      programcode: row.programcode || "",
      faculty: row.faculty || "",
      facultyemail: row.facultyemail || "",
      major: row.major || "",
      semester: row.semester || "",
      course: row.course || "",
      coursecode: row.coursecode || "",
      classdate: row.classdate || "",
      classtime: row.classtime || "",
      period: row.period || "",
      durationminutes: row.durationminutes || "",
      module: row.module || "",
      topic: row.topic || "",
      workcompleted: row.workcompleted || "",
      status: row.status || "Active"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRow = async (row) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await ep1.post("/api/v2/neplms/timetable/delete", { id: row._id, colid: global1.colid });
      setMessage("Class deleted");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete class");
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{
      academicyear: "2026-27",
      regulation: "NEP",
      program: "B.Com",
      programcode: "BCOM",
      faculty: "Faculty Name",
      facultyemail: "faculty@example.com",
      major: "Accountancy",
      semester: "1",
      course: "Financial Accounting",
      coursecode: "FAC101",
      classdate: "2026-07-01",
      classtime: "10:00",
      period: "1",
      durationminutes: 60,
      module: "Module 1",
      topic: "Introduction",
      workcompleted: "",
      status: "Active"
    }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "NEP LMS Timetable");
    XLSX.writeFile(workbook, "nep_lms_timetable_template.xlsx");
  };

  const uploadExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const items = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row, index) => ({ ...row, rowNumber: index + 2 }));
      const res = await ep1.post("/api/v2/neplms/timetable/bulkupload", { colid: global1.colid, user: global1.user, items });
      const errors = res.data?.errors || [];
      setMessage(`${res.data?.saved || 0} classes uploaded${errors.length ? `, ${errors.length} rows skipped` : ""}`);
      setError(errors.length ? errors.map((item) => `Row ${item.rowNumber}: ${item.message}`).join("; ") : "");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload timetable");
    }
  };

  const swapClasses = async () => {
    if (!swapFirst || !swapSecond || swapFirst === swapSecond) {
      setError("Select two different classes to swap");
      return;
    }
    try {
      setError("");
      await ep1.post("/api/v2/neplms/timetable/swap", { colid: global1.colid, firstId: swapFirst, secondId: swapSecond });
      setMessage("Classes swapped");
      setSwapFirst("");
      setSwapSecond("");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to swap classes");
    }
  };

  const classLabel = (row) => `${row.classdate || "-"} ${row.classtime || ""} | ${row.coursecode || ""} ${row.course || ""} | ${row.faculty || ""}`;

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "faculty", headerName: "Faculty", width: 180 },
    { field: "facultyemail", headerName: "Faculty Email", width: 220 },
    { field: "major", headerName: "Major", width: 180 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "course", headerName: "Course", width: 220 },
    { field: "coursecode", headerName: "Course Code", width: 140 },
    { field: "classdate", headerName: "Class Date", width: 130 },
    { field: "classtime", headerName: "Class Time", width: 130 },
    { field: "period", headerName: "Period", width: 100 },
    { field: "durationminutes", headerName: "Duration Minutes", width: 150 },
    { field: "module", headerName: "Module", width: 140 },
    { field: "topic", headerName: "Topic", width: 220 },
    { field: "workcompleted", headerName: "Work Completed", width: 260 },
    { field: "status", headerName: "Status", width: 110 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => editRow(params.row)} />,
        <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRow(params.row)} />
      ]
    }
  ];

  const formFields = [
    ["academicyear", "Academic Year"], ["regulation", "Regulation"], ["program", "Program"], ["programcode", "Program Code"],
    ["faculty", "Faculty"], ["facultyemail", "Faculty Email"], ["major", "Major"], ["semester", "Semester"],
    ["course", "Course"], ["coursecode", "Course Code"], ["classdate", "Class Date", "date"], ["classtime", "Class Time", "time"],
    ["period", "Period"], ["durationminutes", "Duration in minutes", "number"], ["module", "Module"], ["topic", "Topic"],
    ["workcompleted", "Work Completed"], ["status", "Status"]
  ];

  return (
    <Box p={3}>
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 8mm; }
            body * { visibility: hidden; }
            #nep-timetable-print, #nep-timetable-print * { visibility: visible; }
            #nep-timetable-print { position: absolute; left: 0; top: 0; width: 281mm; box-shadow: none !important; border: 0 !important; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <Stack className="no-print" direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>NEP LMS Timetable</Typography>
          <Typography variant="body2" color="text.secondary">Bulk upload, CRUD, swap classes, filter and print calendar view.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/dashdashfacnew" variant="outlined" startIcon={<ArrowBack />}>Back</Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadRows}>Reload</Button>
          <Button variant="contained" startIcon={<Print />} onClick={() => window.print()}>Print {calendarView}</Button>
        </Stack>
      </Stack>

      {error && <Alert className="no-print" severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert className="no-print" severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

      <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6">{editingId ? "Edit Class" : "Add Class"}</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={downloadTemplate}>Template</Button>
            <Button component="label" variant="contained" startIcon={<UploadFile />}>
              Bulk Upload
              <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} />
            </Button>
          </Stack>
        </Stack>
        <Grid container spacing={2}>
          {formFields.map(([field, label, type]) => (
            <Grid item xs={12} md={field === "workcompleted" ? 6 : 2} key={field}>
              <TextField
                fullWidth
                multiline={field === "workcompleted"}
                minRows={field === "workcompleted" ? 2 : undefined}
                type={type || "text"}
                label={label}
                value={form[field]}
                onChange={(e) => updateForm(field, e.target.value)}
                InputLabelProps={type === "date" || type === "time" ? { shrink: true } : undefined}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<Save />} onClick={saveRow}>{editingId ? "Update" : "Save"}</Button>
              {editingId && <Button variant="outlined" onClick={resetForm}>Cancel</Button>}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Swap Classes</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>First Class</InputLabel>
              <Select label="First Class" value={swapFirst} onChange={(e) => setSwapFirst(e.target.value)}>
                {filteredRows.map((row) => <MenuItem key={row._id} value={row._id}>{classLabel(row)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Second Class</InputLabel>
              <Select label="Second Class" value={swapSecond} onChange={(e) => setSwapSecond(e.target.value)}>
                {filteredRows.map((row) => <MenuItem key={row._id} value={row._id}>{classLabel(row)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" startIcon={<SwapHoriz />} sx={{ height: 56 }} onClick={swapClasses}>Swap</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Dynamic Filters</Typography>
          <Button startIcon={<Add />} variant="contained" onClick={() => setFilters((prev) => [...prev, makeFilter()])}>Add Filter</Button>
        </Stack>
        <Grid container spacing={2}>
          {filters.map((filter) => (
            <React.Fragment key={filter.id}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Field</InputLabel>
                  <Select label="Field" value={filter.field} onChange={(e) => updateFilter(filter.id, "field", e.target.value)}>
                    {filterFields.map((item) => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                {filter.field === "classdate" ? (
                  <TextField
                    fullWidth
                    type="date"
                    label="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Value</InputLabel>
                    <Select label="Value" value={filter.value} onChange={(e) => updateFilter(filter.id, "value", e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {valueOptions(filter.field).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth color="error" variant="outlined" startIcon={<Delete />} onClick={() => removeFilter(filter.id)} sx={{ height: 56 }}>Remove</Button>
              </Grid>
            </React.Fragment>
          ))}
        </Grid>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Chip label={`Classes: ${filteredRows.length}`} />
          <Chip label={`Dates: ${calendarGroups.length}`} />
          <Chip label={`Courses: ${uniqueSorted(filteredRows.map((row) => row.coursecode)).length}`} />
        </Stack>
      </Paper>

      <Paper className="no-print" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Box>
            <Typography variant="h6">Calendar View</Typography>
            <Typography variant="body2" color="text.secondary">Choose how the class schedule should appear in the preview and print.</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>View</InputLabel>
              <Select label="View" value={calendarView} onChange={(e) => setCalendarView(e.target.value)}>
                <MenuItem value="Daily">Daily</MenuItem>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            {calendarView !== "Monthly" && (
              <TextField
                type="date"
                label={calendarView === "Daily" ? "Date" : "Week Date"}
                value={dateToInput(activeCalendarDate)}
                onChange={(e) => setCalendarDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper className="no-print" sx={{ p: 1, mb: 2, overflowX: "auto" }}>
        <DataGrid
          rows={filteredRows.map((row) => ({ ...row, id: row._id }))}
          columns={columns}
          loading={loading}
          autoHeight
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "nep_lms_timetable" } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          sx={{ minWidth: 2700 }}
        />
      </Paper>

      <Paper id="nep-timetable-print" sx={{ maxWidth: "297mm", mx: "auto", p: 3, bgcolor: "#fff", color: "#111827", border: "1px solid #d1d5db" }}>
        <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", pb: 1.5, borderBottom: "2px solid #111827", mb: 2 }}>
          {institution?.logolink && <Box component="img" src={institution.logolink} alt="Logo" sx={{ width: 64, height: 64, objectFit: "contain" }} />}
          <Typography variant="h6" fontWeight={900}>{institution?.institutionname || global1.insname || "Institution"}</Typography>
          <Typography variant="body2">{institution?.address || ""}</Typography>
          <Typography variant="subtitle1" fontWeight={900}>NEP LMS {calendarView} Calendar View</Typography>
        </Stack>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={3}><Chip label={`Classes: ${filteredRows.length}`} sx={{ width: "100%" }} /></Grid>
          <Grid item xs={3}><Chip label={`Dates: ${calendarGroups.length}`} sx={{ width: "100%" }} /></Grid>
          <Grid item xs={3}><Chip label={`Courses: ${uniqueSorted(filteredRows.map((row) => row.coursecode)).length}`} sx={{ width: "100%" }} /></Grid>
          <Grid item xs={3}><Chip label={`Printed: ${new Date().toLocaleDateString()}`} sx={{ width: "100%" }} /></Grid>
        </Grid>

        {calendarView === "Daily" && (
          <Box sx={{ border: "1px solid #94a3b8", breakInside: "avoid" }}>
            <Box sx={{ bgcolor: "#0f172a", color: "#fff", textAlign: "center", py: 0.8 }}>
              <Typography variant="subtitle1" fontWeight={900}>{longDate(activeCalendarDate)}</Typography>
            </Box>
            {dailyClasses.length === 0 ? (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2">No classes found for this date.</Typography>
              </Box>
            ) : (
              <Grid container>
                {dailyClasses.map((row) => (
                  <Grid item xs={12} md={6} key={row._id} sx={{ borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", p: 1.2 }}>
                    <Typography variant="subtitle2" fontWeight={900}>{row.classtime || "-"} | Period {row.period || "-"}</Typography>
                    <Typography variant="body2" fontWeight={700}>{row.coursecode} - {row.course}</Typography>
                    <Typography variant="body2">{row.topic || row.module || "-"}</Typography>
                    <Typography variant="caption" display="block">{row.programcode || row.program} | Sem {row.semester} | {row.faculty}</Typography>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {calendarView === "Weekly" && (
          <Box sx={{ breakInside: "avoid", border: "1px solid #94a3b8" }}>
            <Box sx={{ bgcolor: "#0f172a", color: "#fff", textAlign: "center", py: 0.75 }}>
              <Typography variant="subtitle1" fontWeight={900}>{weeklyTitle}</Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {weeklyDays.map((day) => (
                <Box key={day.key} sx={{ minHeight: 170, p: 0.75, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" fontWeight={900} display="block" sx={{ mb: 0.7 }}>
                    {day.label}, {shortDate(day.date)}
                  </Typography>
                  <Stack spacing={0.5}>
                    {day.items.length === 0 && <Typography variant="caption" color="text.secondary">No class</Typography>}
                    {day.items.map((row) => (
                      <Box key={row._id} sx={{ bgcolor: "#eef2ff", borderLeft: "3px solid #4f46e5", px: 0.65, py: 0.45, borderRadius: 0.5 }}>
                        <Typography variant="caption" fontWeight={900} display="block" sx={{ lineHeight: 1.15 }}>
                          {row.classtime || "-"} P{row.period || "-"} | {row.coursecode}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ lineHeight: 1.15 }}>
                          {row.topic || row.course || "-"}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ lineHeight: 1.15, color: "#334155" }}>
                          {row.programcode || row.program} Sem {row.semester}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {calendarView === "Monthly" && printableMonths.length === 0 && (
          <Box sx={{ border: "1px solid #cbd5e1", p: 2, textAlign: "center" }}>
            <Typography variant="body2">No dated classes found for the selected filters.</Typography>
          </Box>
        )}

        {calendarView === "Monthly" && <Stack spacing={2}>
          {printableMonths.map((month) => (
            <Box key={month.key} sx={{ breakInside: "avoid", border: "1px solid #94a3b8" }}>
              <Box sx={{ bgcolor: "#0f172a", color: "#fff", textAlign: "center", py: 0.75 }}>
                <Typography variant="subtitle1" fontWeight={900}>{month.title}</Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {weekdayLabels.map((label) => (
                  <Box key={label} sx={{ bgcolor: "#e2e8f0", borderRight: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1", p: 0.6, textAlign: "center" }}>
                    <Typography variant="caption" fontWeight={900}>{label}</Typography>
                  </Box>
                ))}
                {month.cells.map((cell) => (
                  <Box
                    key={cell.key}
                    sx={{
                      minHeight: 96,
                      p: 0.55,
                      bgcolor: cell.blank ? "#f8fafc" : "#fff",
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0"
                    }}
                  >
                    {!cell.blank && (
                      <>
                        <Typography variant="caption" fontWeight={900} sx={{ display: "block", mb: 0.4 }}>{cell.day}</Typography>
                        <Stack spacing={0.35}>
                          {cell.items.map((row) => (
                            <Box key={row._id} sx={{ bgcolor: "#eef2ff", borderLeft: "3px solid #4f46e5", px: 0.55, py: 0.35, borderRadius: 0.5 }}>
                              <Typography variant="caption" fontWeight={900} display="block" sx={{ lineHeight: 1.15 }}>
                                {row.classtime || "-"} P{row.period || "-"} | {row.coursecode}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ lineHeight: 1.15 }}>
                                {row.topic || row.course || "-"}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ lineHeight: 1.15, color: "#334155" }}>
                                {row.programcode || row.program} Sem {row.semester}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>}

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={6}><Box sx={{ borderTop: "1px solid #111827", pt: 1 }}><Typography variant="body2">Checked By</Typography></Box></Grid>
          <Grid item xs={6}><Box sx={{ borderTop: "1px solid #111827", pt: 1 }}><Typography variant="body2">Approved By</Typography></Box></Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
