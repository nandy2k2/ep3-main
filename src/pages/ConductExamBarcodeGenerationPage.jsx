import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Delete, LocalPrintshop, Refresh } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import JsBarcode from "jsbarcode";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import { addOption, handleAddOption, renderAddOption } from "./addableAutocompleteHelpers";

const filterFields = [
  { key: "program", label: "Program" },
  { key: "programcode", label: "Program Code" },
  { key: "semester", label: "Semester" },
  { key: "regulation", label: "Regulation" },
  { key: "course", label: "Course" },
  { key: "coursecode", label: "Course Code" },
  { key: "student", label: "Student" },
  { key: "regno", label: "Reg No" },
  { key: "examdate", label: "Exam Date" },
  { key: "examslot", label: "Exam Slot" }
];

const uniq = (items = []) =>
  [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

const barcodeValue = (row) => String(row?._id || "");

const buildBarcodeSvg = (value, columns) => {
  if (!value) return "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: "CODE128",
    width: columns >= 4 ? 0.9 : columns >= 3 ? 1.05 : 1.35,
    height: columns >= 4 ? 34 : columns >= 3 ? 38 : 46,
    displayValue: false,
    margin: 0
  });
  return new XMLSerializer().serializeToString(svg);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN");
};

export default function ConductExamBarcodeGenerationPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ academicyear: "", exam: "", examcode: "" });
  const [filters, setFilters] = useState([{ field: "program", value: "" }]);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [columnsPerRow, setColumnsPerRow] = useState(3);
  const [previewRows, setPreviewRows] = useState([]);
  const [barcodeMap, setBarcodeMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await ep1.get("/api/v2/conductexam/exams", { params: { colid: global1.colid } });
      setExams(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exams.");
    }
  };

  const academicYears = useMemo(() => uniq(exams.map((row) => row.academicyear)), [exams]);
  const academicYearOptions = useMemo(
    () => [addOption("+ Add Exam", "/conduct-exam-master"), ...academicYears],
    [academicYears]
  );
  const examOptions = useMemo(
    () => [addOption("+ Add Exam", "/conduct-exam-master"), ...exams.filter((row) => !form.academicyear || row.academicyear === form.academicyear)],
    [exams, form.academicyear]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      filters.every((filter) => !filter.field || !filter.value || String(row[filter.field] || "") === String(filter.value))
    );
  }, [filters, rows]);

  const optionsFor = (field) => uniq(rows.map((row) => row[field]));

  const selectExam = (examRow) => {
    setForm((prev) => ({
      ...prev,
      exam: examRow?.examname || examRow?.exam || "",
      examcode: examRow?.examcode || ""
    }));
    setRows([]);
    setSelectedIds([]);
    setPreviewRows([]);
  };

  const loadStudents = async () => {
    if (!form.academicyear || !form.examcode) {
      setError("Select academic year and exam before loading students.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setPreviewRows([]);
      const res = await ep1.get("/api/v2/conductexam/examrolls", {
        params: { colid: global1.colid, academicyear: form.academicyear, examcode: form.examcode }
      });
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setSelectedIds([]);
      setMessage(`Loaded ${res.data?.data?.length || 0} exam roll row(s). Add filters if required, then select students.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exam roll students.");
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch, ...(patch.field ? { value: "" } : {}) } : item)));
    setSelectedIds([]);
    setPreviewRows([]);
  };

  const handleSelection = (model) => {
    if (Array.isArray(model)) return setSelectedIds(model);
    if (model?.ids instanceof Set) {
      return setSelectedIds(
        model.type === "exclude"
          ? filteredRows.map((row) => row._id).filter((id) => !model.ids.has(id))
          : [...model.ids]
      );
    }
    setSelectedIds([]);
  };

  const generatePreview = async () => {
    const selectedRows = filteredRows.filter((row) => selectedIds.includes(row._id));
    if (!selectedRows.length) {
      setError("Select at least one student for barcode generation.");
      return;
    }
    try {
      setGenerating(true);
      setError("");
      const nextMap = {};
      selectedRows.forEach((row) => {
        nextMap[row._id] = buildBarcodeSvg(barcodeValue(row), columnsPerRow);
      });
      setBarcodeMap(nextMap);
      setPreviewRows(selectedRows);
      setMessage(`Generated barcode preview for ${selectedRows.length} selected student(s).`);
    } finally {
      setGenerating(false);
    }
  };

  const gridColumns = [
    { field: "_id", headerName: "MongoDB Code", minWidth: 230 },
    { field: "examseatno", headerName: "Seat No", width: 130 },
    { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 150 },
    { field: "program", headerName: "Program", minWidth: 180 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 130 },
    { field: "examdate", headerName: "Exam Date", width: 130, valueFormatter: ({ value }) => formatDate(value) },
    { field: "examslot", headerName: "Exam Slot", width: 160 }
  ];

  return (
    <MenuPageShell title="Exam barcode generation">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .barcode-print, .barcode-print * { visibility: visible; }
            .barcode-print { position: absolute; left: 0; top: 0; width: 100%; background: #fff; padding: 0 !important; }
            .no-print { display: none !important; }
          }
        `}</style>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }} className="no-print">
          <Typography variant="h5" fontWeight={900}>Exam barcode generation</Typography>
          <Typography color="text.secondary">
            Select an exam, filter exam roll students, then generate barcode stickers using the MongoDB code.
          </Typography>
        </Paper>

        {message && <Alert severity="success" sx={{ mb: 2 }} className="no-print" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} className="no-print" onClose={() => setError("")}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }} className="no-print">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={academicYearOptions}
                value={form.academicyear || null}
                onChange={(_, value) => {
                  if (handleAddOption(value, navigate)) return;
                  setForm({ academicyear: value || "", exam: "", examcode: "" });
                  setRows([]);
                  setSelectedIds([]);
                  setPreviewRows([]);
                }}
                getOptionLabel={(option) => option?.__addOption ? option.label : String(option || "")}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{option}</li>}
                renderInput={(params) => <TextField {...params} label="Academic Year" />}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Autocomplete
                options={examOptions}
                value={examOptions.find((row) => row.examcode === form.examcode) || null}
                getOptionLabel={(option) => option?.__addOption ? option.label : option ? `${option.examname || option.exam || ""} (${option.examcode || ""})` : ""}
                onChange={(_, value) => {
                  if (handleAddOption(value, navigate)) return;
                  selectExam(value);
                }}
                renderOption={(props, option) => option?.__addOption ? renderAddOption(props, option) : <li {...props}>{`${option.examname || option.exam || ""} (${option.examcode || ""})`}</li>}
                renderInput={(params) => <TextField {...params} label="Exam" />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Exam Code" value={form.examcode} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="contained" startIcon={loading ? <CircularProgress size={16} /> : <Refresh />} disabled={loading} onClick={loadStudents}>
                Load
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }} className="no-print">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            <Box>
              <Typography fontWeight={900}>Dynamic filters</Typography>
              <Typography variant="body2" color="text.secondary">Filter values are generated from the loaded exam roll rows.</Typography>
            </Box>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setFilters((prev) => [...prev, { field: "program", value: "" }])}>
              Add filter
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {filters.map((filter, index) => (
              <React.Fragment key={`${filter.field}-${index}`}>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Field"
                    value={filter.field}
                    onChange={(event) => updateFilter(index, { field: event.target.value })}
                  >
                    {filterFields.map((item) => (
                      <MenuItem key={item.key} value={item.key}>{item.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    options={optionsFor(filter.field)}
                    value={filter.value || null}
                    onChange={(_, value) => updateFilter(index, { value: value || "" })}
                    renderInput={(params) => <TextField {...params} label="Value" />}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton
                    color="error"
                    disabled={filters.length === 1}
                    onClick={() => setFilters((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }} className="no-print">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Loaded: ${rows.length}`} color="primary" variant="outlined" />
              <Chip label={`Filtered: ${filteredRows.length}`} color="info" variant="outlined" />
              <Chip label={`Selected: ${selectedIds.length}`} color="success" variant="outlined" />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                select
                label="Stickers in one row"
                value={columnsPerRow}
                onChange={(event) => {
                  setColumnsPerRow(Number(event.target.value));
                  setPreviewRows([]);
                }}
                sx={{ minWidth: 190 }}
              >
                {[1, 2, 3, 4].map((count) => <MenuItem key={count} value={count}>{count}</MenuItem>)}
              </TextField>
              <Button variant="contained" disabled={generating} onClick={generatePreview} startIcon={generating ? <CircularProgress size={16} /> : null}>
                Generate barcode
              </Button>
              <Button variant="outlined" startIcon={<LocalPrintshop />} disabled={!previewRows.length} onClick={() => window.print()}>
                Print preview
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ height: 560, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }} className="no-print">
          <DataGrid
            rows={filteredRows}
            columns={gridColumns}
            getRowId={(row) => row._id}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={handleSelection}
            rowSelectionModel={selectedIds}
            slots={{ toolbar: GridToolbar }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            sx={{ border: 0 }}
          />
        </Paper>

        {previewRows.length > 0 && (
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }} className="barcode-print">
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={900}>Exam Barcode Stickers</Typography>
              <Typography variant="body2">{form.academicyear} | {form.exam} | {form.examcode}</Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                gap: columnsPerRow >= 4 ? 1 : 1.5,
                "@media print": { gap: "8px", p: "8mm" }
              }}
            >
              {previewRows.map((row) => (
                <Box
                  key={row._id}
                  sx={{
                    border: "1px solid #111827",
                    borderRadius: 1,
                    p: columnsPerRow >= 4 ? 0.75 : 1.25,
                    minHeight: columnsPerRow >= 4 ? 118 : 140,
                    breakInside: "avoid",
                    color: "#000",
                    bgcolor: "#fff"
                  }}
                >
                  <Box
                    sx={{ mb: 1, "& svg": { width: "100%", height: columnsPerRow >= 4 ? 42 : 56 } }}
                    dangerouslySetInnerHTML={{ __html: barcodeMap[row._id] || "" }}
                  />
                  <Typography sx={{ fontSize: columnsPerRow >= 4 ? 8 : 10, wordBreak: "break-all" }}>
                    MongoDB: {row._id}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}
