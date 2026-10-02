import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { Add, Delete, FilterAlt, Print, Refresh, Search } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import { amountInWords } from "./feesReceiptUtils";

const blankFilter = { field: "program", value: "" };
const currency = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "");
const rowId = (row) => row._id || `${row.regno}-${row.feegroup}-${row.feeitem}-${row.academicyear}`;

const studentColumns = [
  { field: "name", headerName: "Student", minWidth: 200, flex: 1 },
  { field: "regno", headerName: "Reg No", minWidth: 150 },
  { field: "email", headerName: "Email", minWidth: 220, flex: 1 },
  { field: "phone", headerName: "Phone", minWidth: 130 },
  { field: "program", headerName: "Program", minWidth: 180, flex: 1 },
  { field: "programcode", headerName: "Program Code", minWidth: 130 },
  { field: "regulation", headerName: "Regulation", minWidth: 150 },
  { field: "semester", headerName: "Semester", minWidth: 110 },
  { field: "section", headerName: "Section", minWidth: 100 }
];

const ledgerColumns = [
  { field: "academicyear", headerName: "Year", minWidth: 110 },
  { field: "feegroup", headerName: "Fee Group", minWidth: 160, flex: 1 },
  { field: "feeitem", headerName: "Fee Item", minWidth: 220, flex: 1 },
  { field: "amount", headerName: "Amount", minWidth: 120, type: "number", valueFormatter: (params) => currency(params.value) },
  { field: "paid", headerName: "Paid", minWidth: 120, type: "number", valueFormatter: (params) => currency(params.value) },
  { field: "concession", headerName: "Concession", minWidth: 130, type: "number", valueFormatter: (params) => currency(params.value) },
  { field: "balance", headerName: "Balance", minWidth: 120, type: "number", valueFormatter: (params) => currency(params.value) },
  { field: "feebook", headerName: "Fee Book", minWidth: 130 },
  { field: "cashbook", headerName: "Cash Book", minWidth: 130 },
  { field: "feecategory", headerName: "Category", minWidth: 130 },
  { field: "semester", headerName: "Semester", minWidth: 110 },
  { field: "status", headerName: "Status", minWidth: 120 },
  { field: "classdate", headerName: "Entry Date", minWidth: 130, valueGetter: (params) => shortDate(params.row.classdate) },
  { field: "duedate", headerName: "Due Date", minWidth: 130, valueGetter: (params) => shortDate(params.row.duedate) },
  { field: "paiddate", headerName: "Paid Date", minWidth: 130, valueGetter: (params) => shortDate(params.row.paiddate) }
];

export default function StudentLedger2Page() {
  const [fields, setFields] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ ...blankFilter }]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [selection, setSelection] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOptions();
  }, []);

  const fieldLabel = (field) => fields.find((item) => item.field === field)?.label || field;
  const cleanFilters = (sourceFilters = filters) => sourceFilters
    .map((filter) => ({ field: filter.field, value: String(filter.value || "").trim() }))
    .filter((filter) => filter.field && filter.value);

  const selectedRows = useMemo(() => {
    const ids = new Set(selection.map(String));
    return ledger.filter((row) => ids.has(String(rowId(row))));
  }, [ledger, selection]);

  const receiptTotals = useMemo(() => selectedRows.reduce((sum, row) => ({
    amount: sum.amount + Number(row.amount || 0),
    paid: sum.paid + Number(row.paid || 0),
    concession: sum.concession + Number(row.concession || 0),
    balance: sum.balance + Number(row.balance || 0)
  }), { amount: 0, paid: 0, concession: 0, balance: 0 }), [selectedRows]);

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/studentledgerdetail/options", { params: { colid: global1.colid } });
      setFields(res.data?.fields || []);
      setOptions(res.data?.options || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load student ledger filter options");
    }
  };

  const searchStudents = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    setSelectedStudent(null);
    setLedger([]);
    setSelection([]);
    try {
      const res = await ep1.post("/api/v2/studentledgerdetail/students", { colid: global1.colid, filters: cleanFilters() });
      setStudents(res.data?.data || []);
      setMessage(`${res.data?.count || 0} student(s) loaded`);
    } catch (err) {
      setStudents([]);
      setError(err.response?.data?.message || "Unable to search students");
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (student) => {
    if (!student?.regno) {
      setError("Selected student does not have reg no");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setLedger([]);
    setSelection([]);
    try {
      const res = await ep1.post("/api/v2/studentledgerdetail/ledger", { colid: global1.colid, regno: student.regno });
      const rows = res.data?.data || [];
      setSelectedStudent(res.data?.student || student);
      setLedger(rows);
      setSelection(rows.map(rowId));
      setInstitution(res.data?.institution || null);
      setMessage(`Loaded ${res.data?.count || 0} ledger item(s). All items are selected by default.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load student ledger");
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch, ...(patch.field ? { value: "" } : {}) } : item)));
  };

  const resetFilters = () => {
    setFilters([{ ...blankFilter }]);
    setStudents([]);
    setSelectedStudent(null);
    setLedger([]);
    setSelection([]);
    setMessage("");
    setError("");
  };

  const printReceipt = () => {
    if (!selectedRows.length) {
      setError("Select at least one ledger item to include in receipt.");
      return;
    }
    window.print();
  };

  const institutionName = institution?.institutionname || global1.insname || "Institution";
  const logo = institution?.logolink || global1.logo || "";
  const address = institution?.address || "";
  const receiptNo = `SLR-${String(selectedStudent?.regno || "NA").replace(/\W+/g, "")}-${new Date().getTime().toString().slice(-6)}`;

  return (
    <MenuPageShell title="Student Ledger 2">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #student-ledger-2-receipt, #student-ledger-2-receipt * { visibility: visible !important; }
          #student-ledger-2-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 190mm !important;
            min-height: 277mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
          .MuiDrawer-root, .MuiAppBar-root, .screen-only { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
        #student-ledger-2-receipt table { width: 100%; border-collapse: collapse; }
        #student-ledger-2-receipt th, #student-ledger-2-receipt td { border: 1px solid #111827; padding: 6px; font-size: 12px; }
        #student-ledger-2-receipt th { background: #f3f4f6; font-weight: 900; }
      `}</style>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Box className="screen-only">
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={900}>Student Ledger 2</Typography>
                <Typography color="text.secondary">Search a student, select fee items, and generate a printable fee receipt.</Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="outlined" startIcon={<Refresh />} onClick={resetFilters} disabled={loading}>Reset</Button>
                <Button variant="outlined" startIcon={<Print />} onClick={printReceipt} disabled={!selectedRows.length}>Print Receipt</Button>
                <Button variant="contained" startIcon={<Search />} onClick={searchStudents} disabled={loading}>{loading ? "Loading..." : "Apply"}</Button>
              </Stack>
            </Stack>
          </Paper>

          {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

          <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterAlt color="primary" />
                <Typography variant="h6" fontWeight={800}>Dynamic Student Filters</Typography>
              </Stack>
              <Button startIcon={<Add />} onClick={() => setFilters((prev) => [...prev, { ...blankFilter }])}>Add Filter</Button>
            </Stack>
            <Grid container spacing={2}>
              {filters.map((filter, index) => (
                <React.Fragment key={`${filter.field}-${index}`}>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Field" value={filter.field} onChange={(event) => updateFilter(index, { field: event.target.value })}>
                      {(fields.length ? fields : [{ field: "program", label: "Program" }]).map((item) => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Autocomplete
                      freeSolo
                      options={options[filter.field]?.values || []}
                      value={filter.value || ""}
                      onInputChange={(_, value) => updateFilter(index, { value })}
                      onChange={(_, value) => updateFilter(index, { value: value || "" })}
                      renderInput={(params) => <TextField {...params} label={fieldLabel(filter.field)} />}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Tooltip title="Remove filter">
                      <span>
                        <IconButton color="error" onClick={() => setFilters((prev) => (prev.length === 1 ? [{ ...blankFilter }] : prev.filter((_, itemIndex) => itemIndex !== index)))} disabled={filters.length === 1} sx={{ height: 56, width: 56 }}>
                          <Delete />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Students</Typography>
            <Box sx={{ height: 330, width: "100%" }}>
              <DataGrid
                rows={students}
                columns={studentColumns}
                getRowId={(row) => row._id}
                loading={loading}
                onRowClick={(params) => loadLedger(params.row)}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_ledger_2_students" } } }}
                pageSizeOptions={[10, 25, 50]}
              />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1} sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>Select ledger items to include</Typography>
                <Typography color="text.secondary">Selected: {selectedRows.length} / {ledger.length}. Total paid in receipt: Rs. {currency(receiptTotals.paid)}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => setSelection(ledger.map(rowId))} disabled={!ledger.length}>Select All</Button>
                <Button variant="outlined" color="warning" onClick={() => setSelection([])} disabled={!ledger.length}>Clear</Button>
                <Button variant="contained" startIcon={<Print />} onClick={printReceipt} disabled={!selectedRows.length}>Print Receipt</Button>
              </Stack>
            </Stack>
            <Box sx={{ height: 440, width: "100%" }}>
              <DataGrid
                rows={ledger}
                columns={ledgerColumns}
                getRowId={rowId}
                loading={loading}
                checkboxSelection
                rowSelectionModel={selection}
                onRowSelectionModelChange={(ids) => setSelection(Array.from(ids))}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_ledger_2_items" } } }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </Box>
          </Paper>
        </Box>

        <Box id="student-ledger-2-receipt" sx={{ bgcolor: "white", color: "#111827", p: 3, maxWidth: "190mm", mx: "auto", border: "1px solid #d1d5db" }}>
          <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 2 }}>
            {logo && <Box component="img" src={logo} alt="Logo" sx={{ width: 78, height: 78, objectFit: "contain" }} />}
            <Typography variant="h5" fontWeight={900}>{institutionName}</Typography>
            {address && <Typography variant="body2" sx={{ maxWidth: 820 }}>{address}</Typography>}
            <Typography variant="h6" fontWeight={900} sx={{ mt: 1, textTransform: "uppercase" }}>Fees Receipt</Typography>
          </Stack>

          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography><b>Receipt No:</b> {receiptNo}</Typography></Grid>
            <Grid item xs={6}><Typography textAlign="right"><b>Receipt Date:</b> {shortDate(new Date())}</Typography></Grid>
            <Grid item xs={6}><Typography><b>Student:</b> {selectedStudent?.name || "-"}</Typography></Grid>
            <Grid item xs={6}><Typography textAlign="right"><b>Reg No:</b> {selectedStudent?.regno || "-"}</Typography></Grid>
            <Grid item xs={6}><Typography><b>Program:</b> {selectedStudent?.program || "-"} {selectedStudent?.programcode ? `(${selectedStudent.programcode})` : ""}</Typography></Grid>
            <Grid item xs={6}><Typography textAlign="right"><b>Semester:</b> {selectedStudent?.semester || "-"} {selectedStudent?.section ? ` | Section ${selectedStudent.section}` : ""}</Typography></Grid>
            <Grid item xs={6}><Typography><b>Academic Year:</b> {selectedStudent?.academicyear || selectedRows[0]?.academicyear || "-"}</Typography></Grid>
            <Grid item xs={6}><Typography textAlign="right"><b>Phone:</b> {selectedStudent?.phone || "-"}</Typography></Grid>
          </Grid>

          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>Sl</th>
                <th>Fee Group</th>
                <th>Fee Item</th>
                <th>Year</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>Concession</th>
                <th style={{ textAlign: "right" }}>Paid</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {selectedRows.length ? selectedRows.map((row, index) => (
                <tr key={rowId(row)}>
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td>{row.feegroup || "-"}</td>
                  <td>{row.feeitem || "-"}</td>
                  <td>{row.academicyear || "-"}</td>
                  <td style={{ textAlign: "right" }}>{currency(row.amount)}</td>
                  <td style={{ textAlign: "right" }}>{currency(row.concession)}</td>
                  <td style={{ textAlign: "right" }}>{currency(row.paid)}</td>
                  <td style={{ textAlign: "right" }}>{currency(row.balance)}</td>
                </tr>
              )) : (
                <tr><td colSpan={8} style={{ textAlign: "center" }}>No fee items selected</td></tr>
              )}
              <tr>
                <td colSpan={4} style={{ textAlign: "right", fontWeight: 900 }}>Total</td>
                <td style={{ textAlign: "right", fontWeight: 900 }}>{currency(receiptTotals.amount)}</td>
                <td style={{ textAlign: "right", fontWeight: 900 }}>{currency(receiptTotals.concession)}</td>
                <td style={{ textAlign: "right", fontWeight: 900 }}>{currency(receiptTotals.paid)}</td>
                <td style={{ textAlign: "right", fontWeight: 900 }}>{currency(receiptTotals.balance)}</td>
              </tr>
            </tbody>
          </table>

          <Typography sx={{ mt: 1.5, fontWeight: 800 }}>Amount in Words: {amountInWords(receiptTotals.paid)}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>This receipt is generated from selected student ledger items.</Typography>

          <Grid container spacing={4} sx={{ mt: 7 }}>
            <Grid item xs={6}>
              <Typography fontWeight={800}>Student Signature</Typography>
              <Box sx={{ borderTop: "1px solid #111827", mt: 5, width: "75%" }} />
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={800}>Authorized Signature</Typography>
              <Box sx={{ borderTop: "1px solid #111827", mt: 5, ml: "auto", width: "75%" }} />
              <Typography textAlign="right" variant="body2" sx={{ mt: 0.5 }}>Seal</Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </MenuPageShell>
  );
}
