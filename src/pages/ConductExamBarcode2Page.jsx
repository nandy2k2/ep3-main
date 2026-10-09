import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
  { key: "papertype", label: "Paper Type" },
  { key: "blockno", label: "Block No" },
  { key: "shortbarcode", label: "Short Barcode" },
  { key: "student", label: "Student" },
  { key: "regno", label: "Reg No" },
  { key: "examdate", label: "Exam Date" },
  { key: "examslot", label: "Exam Slot" }
];

const sectionOptions = ["Section 1", "Section 2"];

const uniq = (items = []) =>
  [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

const barcodeValue = (row) => String(row?.shortbarcode || "");

const buildBarcodeSvg = (value) => {
  if (!value) return "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: "CODE128",
    width: 3,
    height: 110,
    displayValue: false,
    lineColor: "#000000",
    background: "#ffffff",
    margin: 6
  });
  const rawWidth = String(svg.getAttribute("width") || "").replace(/[^\d.]/g, "");
  const rawHeight = String(svg.getAttribute("height") || "").replace(/[^\d.]/g, "");
  if (rawWidth && rawHeight) {
    svg.setAttribute("viewBox", `0 0 ${rawWidth} ${rawHeight}`);
    svg.setAttribute("preserveAspectRatio", "none");
  }
  return new XMLSerializer().serializeToString(svg);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN");
};

export default function ConductExamBarcode2Page() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ academicyear: "", exam: "", examcode: "" });
  const [filters, setFilters] = useState([{ field: "program", value: "" }]);
  const [sections, setSections] = useState(["Section 1"]);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [barcodeMap, setBarcodeMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shortBarcodeBusy, setShortBarcodeBusy] = useState(false);
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
  const academicYearOptions = useMemo(() => [addOption("+ Add Exam", "/conduct-exam-master"), ...academicYears], [academicYears]);
  const examOptions = useMemo(
    () => [addOption("+ Add Exam", "/conduct-exam-master"), ...exams.filter((row) => !form.academicyear || row.academicyear === form.academicyear)],
    [exams, form.academicyear]
  );

  const filteredRows = useMemo(() => rows.filter((row) =>
    filters.every((filter) => !filter.field || !filter.value || String(row[filter.field] || "") === String(filter.value))
  ), [filters, rows]);

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
      setMessage(`Loaded ${res.data?.data?.length || 0} exam roll row(s).`);
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

const generatePreview = () => {
    const selectedRows = filteredRows.filter((row) => selectedIds.includes(row._id));
    if (!selectedRows.length) {
      setError("Select at least one student for barcode generation.");
      return;
    }
    const missingShortBarcode = selectedRows.filter((row) => !/^\d{5}$/.test(String(row.shortbarcode || "")));
    if (missingShortBarcode.length) {
      setError("Generate 5 digit numeric short barcode for all selected rows before creating the print preview.");
      return;
    }
    if (!sections.length) {
      setError("Select at least one section.");
      return;
    }
    setGenerating(true);
    setError("");
    const nextMap = {};
    const stickers = [];
    selectedRows.forEach((row) => {
      sections.forEach((section) => {
        const id = `${row._id}-${section}`;
        nextMap[id] = buildBarcodeSvg(barcodeValue(row));
        stickers.push({ ...row, stickerid: id, barcodeSection: section });
      });
    });
    setBarcodeMap(nextMap);
    setPreviewRows(stickers);
    setMessage(`Generated ${stickers.length} barcode sticker(s).`);
    setGenerating(false);
  };

  const generateShortBarcodes = async () => {
    const selectedRows = filteredRows.filter((row) => selectedIds.includes(row._id));
    if (!selectedRows.length) {
      setError("Select at least one student to generate short barcode.");
      return;
    }
    try {
      setShortBarcodeBusy(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/conductexam/examrolls-shortbarcodes", {
        colid: global1.colid,
        ids: selectedRows.map((row) => row._id),
        overwrite: true,
        user: global1.user
      });
      const updatedMap = new Map((res.data?.data || []).map((row) => [row._id, { ...row, id: row._id }]));
      setRows((prev) => prev.map((row) => updatedMap.get(row._id) || row));
      setPreviewRows([]);
      setBarcodeMap({});
      setMessage(`Generated short barcode for ${res.data?.updated || 0} selected row(s). Click Generate barcode to preview.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate short barcodes.");
    } finally {
      setShortBarcodeBusy(false);
    }
  };

  const gridColumns = [
    { field: "_id", headerName: "MongoDB Code", minWidth: 230 },
    { field: "shortbarcode", headerName: "Short Barcode", width: 140 },
    { field: "batch", headerName: "Batch", minWidth: 180 },
    { field: "blockno", headerName: "Block No", width: 110 },
    { field: "papertype", headerName: "Paper Type", width: 120 },
    { field: "student", headerName: "Student", minWidth: 190, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 150 },
    { field: "programcode", headerName: "Program Code", width: 130 },
    { field: "semester", headerName: "Semester", width: 100 },
    { field: "course", headerName: "Course", minWidth: 220, flex: 1 },
    { field: "coursecode", headerName: "Course Code", width: 130 },
    { field: "examdate", headerName: "Exam Date", width: 130, valueFormatter: ({ value }) => formatDate(value) },
    { field: "examslot", headerName: "Exam Slot", width: 160 }
  ];

  return (
    <MenuPageShell title="Exam barcode 2">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <style>{`
          @page { size: A4; margin: 0; }
          .barcode2-sheet {
            display: grid;
            grid-template-columns: repeat(2, 100mm);
            grid-auto-rows: 26mm;
            align-items: start;
            justify-content: start;
            gap: 0;
            background: #fff;
          }
          .barcode2-sticker {
            width: 100mm;
            height: 26mm;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 65mm 35mm;
            align-items: center;
            color: #000;
            background: #fff;
            padding: 0;
            overflow: hidden;
            font-family: Arial, Helvetica, sans-serif;
          }
          .barcode2-left {
            display: grid;
            gap: 0.4mm;
            min-width: 0;
            width: 65mm;
            box-sizing: border-box;
            padding: 0.7mm 0.5mm 0.4mm 1mm;
          }
          .barcode2-right {
            text-align: center;
            display: grid;
            justify-items: center;
            grid-template-rows: 2.7mm 21.2mm 1.6mm;
            align-content: stretch;
            gap: 0.05mm;
            min-width: 0;
            width: 35mm;
            height: 26mm;
            box-sizing: border-box;
            padding: 0.2mm 0.35mm 0.15mm 0;
          }
          .barcode2-batch {
            font-size: 1.8mm;
            line-height: 1;
            font-weight: 900;
            white-space: nowrap;
            max-width: 34.6mm;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .barcode2-line {
            font-size: 2.7mm;
            line-height: 1;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .barcode2-exam {
            font-size: 1.85mm;
            line-height: 1;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .barcode2-code {
            width: 34.6mm;
            height: 21.2mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .barcode2-code svg {
            width: 34.6mm;
            height: 21.2mm;
            display: block;
            shape-rendering: crispEdges;
          }
          .barcode2-section {
            font-size: 1.55mm;
            line-height: 1;
            font-weight: 900;
            white-space: nowrap;
          }
          @media print {
            html, body { width: 210mm; min-height: 297mm; background: #fff !important; }
            body * { visibility: hidden; }
            .barcode2-print, .barcode2-print * { visibility: visible; }
            .barcode2-print { position: absolute; left: 0; top: 0; width: 200mm; background: #fff; padding: 0 !important; box-shadow: none !important; border: 0 !important; }
            .no-print { display: none !important; }
            .barcode2-sheet { display: grid !important; grid-template-columns: repeat(2, 100mm) !important; grid-auto-rows: 26mm !important; padding: 0 !important; gap: 0 !important; }
            .barcode2-sticker { width: 100mm !important; height: 26mm !important; padding: 0 !important; page-break-inside: avoid; break-inside: avoid; border: 0 !important; }
          }
        `}</style>
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }} className="no-print">
          <Typography variant="h5" fontWeight={900}>Exam barcode 2</Typography>
          <Typography color="text.secondary">
            Generate 100mm x 26mm barcode stickers in the exam attendance format. Select one or both sections to generate section-wise stickers.
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={3}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={sectionOptions}
                value={sections}
                onChange={(_, value) => setSections(value || [])}
                renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} />{option}</li>}
                renderInput={(params) => <TextField {...params} label="Section" />}
              />
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
              <Chip label={`Sections: ${sections.length}`} color="secondary" variant="outlined" />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" disabled={shortBarcodeBusy || !selectedIds.length} onClick={generateShortBarcodes} startIcon={shortBarcodeBusy ? <CircularProgress size={16} /> : null}>
                Generate short barcode
              </Button>
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
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }} className="barcode2-print">
            <Box
              className="barcode2-sheet"
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 100mm)",
                gridAutoRows: "26mm",
                gap: 0,
                alignItems: "start",
                justifyContent: "start",
                bgcolor: "#fff"
              }}
            >
              {previewRows.map((row) => (
                <Box
                  key={row.stickerid}
                  className="barcode2-sticker"
                  sx={{
                    width: "100mm",
                    height: "26mm",
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateColumns: "65mm 35mm",
                    alignItems: "center",
                    color: "#000",
                    bgcolor: "#fff",
                    p: 0,
                    overflow: "hidden",
                    fontFamily: "Arial, Helvetica, sans-serif"
                  }}
                >
                  <Box className="barcode2-left">
                    <Typography className="barcode2-line">
                      {row.blockno || "1"}.. : Block No
                    </Typography>
                    <Typography className="barcode2-line">
                      {row.regno || "-"} : Enroll No
                    </Typography>
                    <Typography className="barcode2-line">
                      {row.coursecode || "-"} : Course Code
                    </Typography>
                  </Box>
                  <Box className="barcode2-right">
                    <Typography className="barcode2-exam">
                      {row.exam || form.exam || ""}
                    </Typography>
                    <Box
                      className="barcode2-code"
                      dangerouslySetInnerHTML={{ __html: barcodeMap[row.stickerid] || "" }}
                    />
                    <Typography className="barcode2-section">
                      {row.barcodeSection}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}
