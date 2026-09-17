import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Add, Delete, Edit, Payment, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { Alert, Autocomplete, Box, Button, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import MenuPageShell from "./MenuPageShell";
import CounterFee2ReceiptView from "./CounterFee2ReceiptView";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankMisc = {
  academicyear: "2026-27",
  feegroup: "Miscellaneous",
  feeitem: "",
  description: "",
  amount: 0,
  feebook: "",
  cashbook: "",
  feecategory: "Miscellaneous",
  feetype: "Miscellaneous",
  status: "Active"
};
const miscFields = ["academicyear", "feegroup", "feeitem", "feecategory", "feetype", "feebook", "cashbook", "status"];
const payModes = ["Cash", "UPI", "Cheque", "Card", "NEFT", "PG", "Other"];
const makeFilter = (field = "academicyear") => ({ id: `${Date.now()}-${Math.random()}`, field, value: "" });
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const shortDate = (value) => value ? String(value).slice(0, 10) : "";
const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#ea580c"];

export function MiscellaneousAmountPage() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([makeFilter()]);
  const [form, setForm] = useState(blankMisc);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const params = () => filters.reduce((acc, item) => {
    if (item.field && item.value) acc[item.field] = item.value;
    return acc;
  }, { colid: global1.colid });

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/miscellaneous-amounts", { params: params() });
      setRows(res.data?.data || []);
      setOptions(res.data?.options || {});
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || "Unable to load miscellaneous amounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  const save = async () => {
    if (!form.feeitem) return setError("Fee item is required");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await ep1.post("/api/v2/miscellaneous-amounts", { ...form, id: form._id, colid: global1.colid, user: global1.user, name: global1.name });
      setMessage("Saved successfully");
      setForm(blankMisc);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save miscellaneous amount");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this miscellaneous amount?")) return;
    try {
      await ep1.post("/api/v2/miscellaneous-amounts-delete", { colid: global1.colid, id: row._id });
      setMessage("Deleted");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([blankMisc]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Miscellaneous Amounts");
    XLSX.writeFile(wb, "Miscellaneous_Amounts_Template.xlsx");
  };

  const uploadBulk = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const wb = XLSX.read(new Uint8Array(event.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const res = await ep1.post("/api/v2/miscellaneous-amounts-bulk", { colid: global1.colid, user: global1.user, name: global1.name, rows: jsonRows });
        setMessage(`Bulk upload completed. Inserted ${res.data?.inserted || 0} row(s).`);
        await loadRows();
      } catch (err) {
        setError(err.response?.data?.message || "Unable to upload bulk data");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateFilter = (id, key, value) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));

  const columns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "feegroup", headerName: "Fee Group", width: 170 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 220, flex: 1 },
    { field: "amount", headerName: "Amount", width: 120, type: "number" },
    { field: "feecategory", headerName: "Category", width: 150 },
    { field: "feetype", headerName: "Fee Type", width: 130 },
    { field: "feebook", headerName: "Fee Book", width: 140 },
    { field: "cashbook", headerName: "Cash Book", width: 140 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row">
          <Tooltip title="Edit"><IconButton onClick={() => setForm({ ...blankMisc, ...params.row })}><Edit /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton color="error" onClick={() => remove(params.row)}><Delete /></IconButton></Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <MenuPageShell title="Miscellaneous Amounts">
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Miscellaneous Amounts</Typography>
          <Grid container spacing={2}>
            {Object.keys(blankMisc).map((field) => (
              <Grid item xs={12} md={field === "description" ? 6 : 3} key={field}>
                <TextField
                  fullWidth
                  select={field === "status"}
                  type={field === "amount" ? "number" : "text"}
                  label={field}
                  value={form[field] ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                >
                  {field === "status" && ["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<Save />} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            <Button variant="outlined" onClick={() => setForm(blankMisc)}>Clear</Button>
            <Button variant="outlined" onClick={downloadTemplate}>Download Template</Button>
            <Button component="label" variant="outlined" startIcon={<UploadFile />}>
              Bulk Upload
              <input hidden type="file" accept=".xlsx,.xls" onChange={(event) => uploadBulk(event.target.files?.[0])} />
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={850}>View and Filter</Typography>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Add />} variant="outlined" onClick={() => setFilters((prev) => [...prev, makeFilter("feeitem")])}>Add Filter</Button>
              <Button startIcon={<Refresh />} variant="contained" onClick={loadRows}>Apply</Button>
            </Stack>
          </Stack>
          <Grid container spacing={2}>
            {filters.map((filter) => (
              <React.Fragment key={filter.id}>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Field" value={filter.field} onChange={(event) => updateFilter(filter.id, "field", event.target.value)}>
                    {miscFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={options[filter.field] || []}
                    value={filter.value || ""}
                    inputValue={filter.value || ""}
                    onInputChange={(_, value) => updateFilter(filter.id, "value", value)}
                    onChange={(_, value) => updateFilter(filter.id, "value", value || "")}
                    renderInput={(params) => <TextField {...params} label="Value" />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth color="error" variant="outlined" startIcon={<Delete />} onClick={() => setFilters((prev) => prev.length === 1 ? [makeFilter()] : prev.filter((item) => item.id !== filter.id))} sx={{ height: 56 }}>Remove</Button>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "miscellaneous_amounts" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }} sx={{ minWidth: 1500 }} />
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function MiscellaneousFeeCollectionPage() {
  const [studentFields, setStudentFields] = useState([]);
  const [studentOptions, setStudentOptions] = useState({});
  const [studentFilters, setStudentFilters] = useState([makeFilter("academicyear")]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amounts, setAmounts] = useState([]);
  const [amountSelection, setAmountSelection] = useState([]);
  const [paidAmounts, setPaidAmounts] = useState({});
  const [paiddate, setPaiddate] = useState(today());
  const [paymode, setPaymode] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paydetails, setPaydetails] = useState("");
  const [remarks, setRemarks] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedAmounts = useMemo(() => amounts.filter((row) => amountSelection.includes(row._id)), [amounts, amountSelection]);
  const total = selectedAmounts.reduce((sum, row) => sum + num(paidAmounts[row._id] ?? row.amount), 0);

  const loadStudentOptions = async () => {
    const res = await ep1.get("/api/v2/miscellaneous-collection/student-options", { params: { colid: global1.colid } });
    setStudentFields(res.data?.fields || []);
    setStudentOptions(res.data?.options || {});
  };
  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = studentFilters.map(({ field, value }) => ({ field, value })).filter((item) => item.field && item.value);
      const res = await ep1.post("/api/v2/miscellaneous-collection/students", { colid: global1.colid, filters });
      setStudents(res.data?.data || []);
      setSelectedStudent(null);
    } catch (err) {
      setStudents([]);
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };
  const loadAmounts = async () => {
    const res = await ep1.get("/api/v2/miscellaneous-amounts", { params: { colid: global1.colid, status: "Active" } });
    const data = res.data?.data || [];
    setAmounts(data);
    setPaidAmounts(Object.fromEntries(data.map((row) => [row._id, num(row.amount)])));
  };

  useEffect(() => {
    loadStudentOptions();
    loadAmounts();
  }, []);

  const updateFilter = (id, key, value) => setStudentFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  const updatePaidAmount = (id, value) => setPaidAmounts((prev) => ({ ...prev, [id]: value }));
  const onAmountSelection = (ids) => {
    const next = Array.from(ids?.ids || ids || []);
    setAmountSelection(next);
    setPaidAmounts((prev) => {
      const copy = { ...prev };
      next.forEach((id) => {
        if (copy[id] === "" || copy[id] === undefined) copy[id] = num(amounts.find((row) => row._id === id)?.amount);
      });
      return copy;
    });
  };

  const collect = async () => {
    if (!selectedStudent) return setError("Select a student");
    const items = selectedAmounts.map((row) => ({ ...row, paidamount: num(paidAmounts[row._id]) })).filter((row) => row.paidamount > 0);
    if (!items.length) return setError("Select miscellaneous amounts and enter paid amount");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/miscellaneous-collection/collect", {
        colid: global1.colid,
        student: selectedStudent,
        items,
        paiddate,
        paymode,
        referenceNumber,
        paydetails,
        remarks,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Payment recorded. Transaction ID: ${res.data?.transactionid}`);
      setReceipt(res.data?.data || null);
      setInstitution(res.data?.institution || null);
      setAmountSelection([]);
      setReferenceNumber("");
      setPaydetails("");
      setRemarks("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to collect miscellaneous fee");
    } finally {
      setBusy(false);
    }
  };

  const studentColumns = [
    { field: "name", headerName: "Student", minWidth: 200, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "email", headerName: "Email", minWidth: 220 },
    { field: "phone", headerName: "Phone", width: 130 },
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "semester", headerName: "Semester", width: 110 },
    { field: "section", headerName: "Section", width: 100 }
  ];
  const amountColumns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "feegroup", headerName: "Fee Group", width: 160 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 220, flex: 1 },
    { field: "amount", headerName: "Default Amount", width: 140, type: "number" },
    {
      field: "paidamount",
      headerName: "Amount Paid",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <TextField size="small" type="number" value={paidAmounts[params.row._id] ?? ""} onKeyDown={(event) => event.stopPropagation()} onChange={(event) => updatePaidAmount(params.row._id, event.target.value)} />
      )
    }
  ];

  return (
    <MenuPageShell title="Miscellaneous Fee Collection">
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Miscellaneous Fee Collection</Typography>
              <Typography color="text.secondary">Select a student, select miscellaneous amounts, record payment, and print the receipt.</Typography>
            </Box>
            <Button variant="contained" startIcon={<Refresh />} onClick={loadStudents} disabled={loading}>Load Students</Button>
          </Stack>
          <Grid container spacing={2}>
            {studentFilters.map((filter) => (
              <React.Fragment key={filter.id}>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Student field" value={filter.field} onChange={(event) => updateFilter(filter.id, "field", event.target.value)}>
                    {studentFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete freeSolo options={studentOptions[filter.field] || []} value={filter.value || ""} inputValue={filter.value || ""} onInputChange={(_, value) => updateFilter(filter.id, "value", value)} onChange={(_, value) => updateFilter(filter.id, "value", value || "")} renderInput={(params) => <TextField {...params} label="Value" />} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth color="error" variant="outlined" startIcon={<Delete />} onClick={() => setStudentFilters((prev) => prev.length === 1 ? [makeFilter()] : prev.filter((item) => item.id !== filter.id))} sx={{ height: 56 }}>Remove</Button>
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              <Button startIcon={<Add />} variant="outlined" onClick={() => setStudentFilters((prev) => [...prev, makeFilter("name")])}>Add Student Filter</Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <DataGrid rows={students} columns={studentColumns} getRowId={(row) => row._id} loading={loading} autoHeight onRowClick={(params) => setSelectedStudent(params.row)} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "misc_collection_students" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ minWidth: 1200 }} />
        </Paper>

        {selectedStudent && (
          <>
            <Paper sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="h6" fontWeight={850}>Selected Student</Typography>
                  <Typography>{selectedStudent.name} | {selectedStudent.regno} | {selectedStudent.email}</Typography>
                </Box>
                <Chip color="primary" label={`Selected total: ${total}`} />
              </Stack>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Paid Date" InputLabelProps={{ shrink: true }} value={paiddate} onChange={(event) => setPaiddate(event.target.value)} /></Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Mode of Payment</InputLabel>
                    <Select label="Mode of Payment" value={paymode} onChange={(event) => setPaymode(event.target.value)}>
                      {payModes.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="Reference Number" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="Payment Details" value={paydetails} onChange={(event) => setPaydetails(event.target.value)} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></Grid>
              </Grid>
            </Paper>
            <Paper sx={{ p: 1, overflowX: "auto" }}>
              <DataGrid rows={amounts} columns={amountColumns} getRowId={(row) => row._id} checkboxSelection rowSelectionModel={amountSelection} onRowSelectionModelChange={onAmountSelection} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "miscellaneous_amount_selection" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} disableRowSelectionOnClick sx={{ minWidth: 1100 }} />
            </Paper>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<Payment />} disabled={!amountSelection.length || total <= 0 || busy} onClick={collect}>{busy ? "Posting..." : "Record Payment and Generate Receipt"}</Button>
            </Stack>
          </>
        )}

        {receipt && <CounterFee2ReceiptView receipt={receipt} institution={institution} />}
      </Stack>
    </MenuPageShell>
  );
}

export function MiscellaneousFeeCollection2Page() {
  const blankStudent = {
    name: "",
    email: "",
    academicyear: "2026-27",
    admissionyear: "2026-27",
    program: "",
    programcode: "",
    regno: ""
  };
  const [student, setStudent] = useState(blankStudent);
  const [studentOptions, setStudentOptions] = useState({});
  const [amounts, setAmounts] = useState([]);
  const [amountSelection, setAmountSelection] = useState([]);
  const [paidAmounts, setPaidAmounts] = useState({});
  const [paiddate, setPaiddate] = useState(today());
  const [paymode, setPaymode] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paydetails, setPaydetails] = useState("");
  const [remarks, setRemarks] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedAmounts = useMemo(() => amounts.filter((row) => amountSelection.includes(row._id)), [amounts, amountSelection]);
  const total = selectedAmounts.reduce((sum, row) => sum + num(paidAmounts[row._id] ?? row.amount), 0);
  const setStudentField = (field, value) => setStudent((prev) => ({ ...prev, [field]: value || "" }));

  const loadOptions = async () => {
    try {
      const [studentRes, amountRes] = await Promise.all([
        ep1.get("/api/v2/miscellaneous-collection/student-options", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/miscellaneous-amounts", { params: { colid: global1.colid, status: "Active" } })
      ]);
      setStudentOptions(studentRes.data?.options || {});
      const data = amountRes.data?.data || [];
      setAmounts(data);
      setPaidAmounts(Object.fromEntries(data.map((row) => [row._id, num(row.amount)])));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load miscellaneous collection data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOptions();
  }, []);

  const updatePaidAmount = (id, value) => setPaidAmounts((prev) => ({ ...prev, [id]: value }));
  const onAmountSelection = (ids) => {
    const next = Array.from(ids?.ids || ids || []);
    setAmountSelection(next);
    setPaidAmounts((prev) => {
      const copy = { ...prev };
      next.forEach((id) => {
        if (copy[id] === "" || copy[id] === undefined) copy[id] = num(amounts.find((row) => row._id === id)?.amount);
      });
      return copy;
    });
  };

  const validate = () => {
    if (!student.name.trim()) return "Name is required";
    if (!student.email.trim()) return "Email is required";
    if (!student.academicyear.trim()) return "Academic year is required";
    if (!student.admissionyear.trim()) return "Admission year is required";
    if (!student.programcode.trim()) return "Program code is required";
    if (!student.regno.trim()) return "Regno is required";
    const items = selectedAmounts.map((row) => ({ ...row, paidamount: num(paidAmounts[row._id]) })).filter((row) => row.paidamount > 0);
    if (!items.length) return "Select miscellaneous amounts and enter paid amount";
    return "";
  };

  const collect = async () => {
    const validation = validate();
    if (validation) return setError(validation);
    const items = selectedAmounts.map((row) => ({ ...row, paidamount: num(paidAmounts[row._id]) })).filter((row) => row.paidamount > 0);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/miscellaneous-collection/collect-new-student", {
        colid: global1.colid,
        student,
        items,
        paiddate,
        paymode,
        referenceNumber,
        paydetails,
        remarks,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Student saved and payment recorded. Transaction ID: ${res.data?.transactionid}`);
      setReceipt(res.data?.data || null);
      setInstitution(res.data?.institution || null);
      setAmountSelection([]);
      setReferenceNumber("");
      setPaydetails("");
      setRemarks("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to collect miscellaneous fee");
    } finally {
      setBusy(false);
    }
  };

  const amountColumns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "feegroup", headerName: "Fee Group", width: 160 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 220, flex: 1 },
    { field: "amount", headerName: "Default Amount", width: 140, type: "number" },
    {
      field: "paidamount",
      headerName: "Amount Paid",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <TextField size="small" type="number" value={paidAmounts[params.row._id] ?? ""} onKeyDown={(event) => event.stopPropagation()} onChange={(event) => updatePaidAmount(params.row._id, event.target.value)} />
      )
    }
  ];

  const autoField = (field, label, options = []) => (
    <Autocomplete
      freeSolo
      options={options || []}
      value={student[field] || ""}
      inputValue={student[field] || ""}
      onInputChange={(_, value) => setStudentField(field, value)}
      onChange={(_, value) => setStudentField(field, value || "")}
      renderInput={(params) => <TextField {...params} label={label} required={["academicyear", "admissionyear", "programcode", "regno"].includes(field)} />}
    />
  );

  return (
    <MenuPageShell title="Miscellaneous Collection 2">
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Miscellaneous Collection 2</Typography>
              <Typography color="text.secondary">Enter student details, create the student record, collect miscellaneous fees, and generate the receipt.</Typography>
            </Box>
            <Chip color="primary" label={`Selected total: ${total}`} />
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth required label="Name" value={student.name} onChange={(event) => setStudentField("name", event.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth required type="email" label="Email" value={student.email} onChange={(event) => setStudentField("email", event.target.value)} /></Grid>
            <Grid item xs={12} md={4}>{autoField("regno", "Regno", studentOptions.regno)}</Grid>
            <Grid item xs={12} md={3}>{autoField("academicyear", "Academic Year", studentOptions.academicyear)}</Grid>
            <Grid item xs={12} md={3}>{autoField("admissionyear", "Admission Year", studentOptions.admissionyear)}</Grid>
            <Grid item xs={12} md={3}>{autoField("program", "Program", studentOptions.program)}</Grid>
            <Grid item xs={12} md={3}>{autoField("programcode", "Program Code", studentOptions.programcode)}</Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Paid Date" InputLabelProps={{ shrink: true }} value={paiddate} onChange={(event) => setPaiddate(event.target.value)} /></Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mode of Payment</InputLabel>
                <Select label="Mode of Payment" value={paymode} onChange={(event) => setPaymode(event.target.value)}>
                  {payModes.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Reference Number" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Payment Details" value={paydetails} onChange={(event) => setPaydetails(event.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <DataGrid rows={amounts} columns={amountColumns} getRowId={(row) => row._id} checkboxSelection rowSelectionModel={amountSelection} onRowSelectionModelChange={onAmountSelection} loading={loading} autoHeight slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "miscellaneous_collection_2_amounts" } } }} pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} disableRowSelectionOnClick sx={{ minWidth: 1100 }} />
        </Paper>

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<Payment />} disabled={!amountSelection.length || total <= 0 || busy} onClick={collect}>{busy ? "Posting..." : "Create Student, Record Payment and Generate Receipt"}</Button>
        </Stack>

        {receipt && <CounterFee2ReceiptView receipt={receipt} institution={institution} />}
      </Stack>
    </MenuPageShell>
  );
}

export function MiscellaneousFeeCollection3Page() {
  const blankStudent = {
    name: "",
    email: "",
    academicyear: "2026-27",
    admissionyear: "2026-27",
    program: "",
    programcode: "",
    regno: ""
  };
  const [student, setStudent] = useState(blankStudent);
  const [studentOptions, setStudentOptions] = useState({});
  const [amounts, setAmounts] = useState([]);
  const [amountSelection, setAmountSelection] = useState([]);
  const [itemCounts, setItemCounts] = useState({});
  const [paiddate, setPaiddate] = useState(today());
  const [paymode, setPaymode] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paydetails, setPaydetails] = useState("");
  const [remarks, setRemarks] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedAmounts = useMemo(() => amounts.filter((row) => amountSelection.includes(row._id)), [amounts, amountSelection]);
  const rowTotal = (row) => num(row.amount) * Math.max(1, num(itemCounts[row._id] || 1));
  const total = selectedAmounts.reduce((sum, row) => sum + rowTotal(row), 0);
  const setStudentField = (field, value) => setStudent((prev) => ({ ...prev, [field]: value || "" }));
  const programPairs = studentOptions.programPairs || [];
  const selectedProgram = useMemo(() => (
    programPairs.find((row) => row.program === student.program && row.programcode === student.programcode) || null
  ), [programPairs, student.program, student.programcode]);
  const programLabel = (row = {}) => row.label || `${row.program || "Program"}${row.programcode ? ` (${row.programcode})` : ""}`;
  const setProgram = (value) => {
    if (typeof value === "string") {
      const match = programPairs.find((row) => row.program.toLowerCase() === value.toLowerCase());
      setStudent((prev) => ({ ...prev, program: value || "", programcode: match?.programcode || prev.programcode || "" }));
      return;
    }
    setStudent((prev) => ({ ...prev, program: value?.program || "", programcode: value?.programcode || "" }));
  };

  const loadOptions = async () => {
    setLoading(true);
    setError("");
    try {
      const [studentRes, amountRes] = await Promise.all([
        ep1.get("/api/v2/miscellaneous-collection/student-options", { params: { colid: global1.colid } }),
        ep1.get("/api/v2/miscellaneous-amounts", { params: { colid: global1.colid, status: "Active" } })
      ]);
      setStudentOptions(studentRes.data?.options || {});
      const data = amountRes.data?.data || [];
      setAmounts(data);
      setItemCounts(Object.fromEntries(data.map((row) => [row._id, 1])));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load miscellaneous collection data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOptions(); }, []);

  const onAmountSelection = (ids) => {
    const next = Array.from(ids?.ids || ids || []);
    setAmountSelection(next);
    setItemCounts((prev) => {
      const copy = { ...prev };
      next.forEach((id) => {
        if (!copy[id]) copy[id] = 1;
      });
      return copy;
    });
  };

  const validate = () => {
    if (!student.name.trim()) return "Name is required";
    if (!student.email.trim()) return "Email is required";
    if (!student.academicyear.trim()) return "Academic year is required";
    if (!student.admissionyear.trim()) return "Admission year is required";
    if (!student.programcode.trim()) return "Program code is required";
    if (!student.regno.trim()) return "Regno is required";
    if (!selectedAmounts.length || total <= 0) return "Select miscellaneous amounts and enter no of items";
    return "";
  };

  const collect = async () => {
    const validation = validate();
    if (validation) return setError(validation);
    const items = selectedAmounts.map((row) => ({
      ...row,
      noofitems: Math.max(1, num(itemCounts[row._id] || 1)),
      unitamount: num(row.amount),
      paidamount: rowTotal(row)
    })).filter((row) => row.paidamount > 0);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/miscellaneous-collection/collect-new-student", {
        colid: global1.colid,
        student,
        items,
        paiddate,
        paymode,
        referenceNumber,
        paydetails,
        remarks,
        user: global1.user,
        name: global1.name
      });
      setMessage(`Student saved and payment recorded. Transaction ID: ${res.data?.transactionid}`);
      setReceipt(res.data?.data || null);
      setInstitution(res.data?.institution || null);
      setAmountSelection([]);
      setReferenceNumber("");
      setPaydetails("");
      setRemarks("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to collect miscellaneous fee");
    } finally {
      setBusy(false);
    }
  };

  const autoField = (field, label, options = []) => (
    <Autocomplete
      freeSolo
      options={options || []}
      value={student[field] || ""}
      inputValue={student[field] || ""}
      onInputChange={(_, value) => setStudentField(field, value)}
      onChange={(_, value) => setStudentField(field, value || "")}
      renderInput={(params) => <TextField {...params} label={label} required={["academicyear", "admissionyear", "programcode", "regno"].includes(field)} />}
    />
  );

  const amountColumns = [
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "feegroup", headerName: "Fee Group", width: 160 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 220, flex: 1 },
    { field: "amount", headerName: "Amount Per Item", width: 150, type: "number" },
    {
      field: "noofitems",
      headerName: "No of Items",
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <TextField
          size="small"
          type="number"
          inputProps={{ min: 1 }}
          value={itemCounts[params.row._id] ?? 1}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => setItemCounts((prev) => ({ ...prev, [params.row._id]: Math.max(1, num(event.target.value || 1)) }))}
        />
      )
    },
    {
      field: "finalamount",
      headerName: "Final Amount",
      width: 150,
      type: "number",
      valueGetter: (params) => rowTotal(params.row)
    }
  ];

  return (
    <MenuPageShell title="Miscellaneous Collection 3">
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Miscellaneous Collection 3</Typography>
              <Typography color="text.secondary">Enter student details, select fee components, set no of items, and collect recalculated fees.</Typography>
            </Box>
            <Chip color="primary" label={`Selected total: ${money(total)}`} />
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth required label="Name" value={student.name} onChange={(event) => setStudentField("name", event.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth required type="email" label="Email" value={student.email} onChange={(event) => setStudentField("email", event.target.value)} /></Grid>
            <Grid item xs={12} md={4}>{autoField("regno", "Regno", studentOptions.regno)}</Grid>
            <Grid item xs={12} md={3}>{autoField("academicyear", "Academic Year", studentOptions.academicyear)}</Grid>
            <Grid item xs={12} md={3}>{autoField("admissionyear", "Admission Year", studentOptions.admissionyear)}</Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo
                options={programPairs}
                value={selectedProgram}
                inputValue={student.program || ""}
                getOptionLabel={(option) => (typeof option === "string" ? option : programLabel(option))}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") setProgram(value);
                }}
                onChange={(_, value) => setProgram(value)}
                renderInput={(params) => <TextField {...params} label="Program" />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth required label="Program Code" value={student.programcode || ""} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Paid Date" InputLabelProps={{ shrink: true }} value={paiddate} onChange={(event) => setPaiddate(event.target.value)} /></Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete options={payModes} value={paymode} onChange={(_, value) => setPaymode(value || "Cash")} renderInput={(params) => <TextField {...params} label="Mode of Payment" />} />
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Reference Number" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Payment Details" value={paydetails} onChange={(event) => setPaydetails(event.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <DataGrid
            rows={amounts}
            columns={amountColumns}
            getRowId={(row) => row._id}
            checkboxSelection
            rowSelectionModel={amountSelection}
            onRowSelectionModelChange={onAmountSelection}
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "miscellaneous_collection_3_amounts" } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            disableRowSelectionOnClick
            sx={{ minWidth: 1200, "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }}
          />
        </Paper>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="contained" startIcon={<Payment />} disabled={!amountSelection.length || total <= 0 || busy} onClick={collect}>{busy ? "Posting..." : "Create Student, Record Payment and Generate Receipt"}</Button>
          <Button variant="outlined" startIcon={<Refresh />} disabled={loading || busy} onClick={loadOptions}>Reload Components</Button>
        </Stack>

        {receipt && <CounterFee2ReceiptView receipt={receipt} institution={institution} />}
      </Stack>
    </MenuPageShell>
  );
}

export function MiscellaneousFeesReportPage() {
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ id: "initial", field: "academicyear", values: [] }]);
  const [dateRange, setDateRange] = useState({ fromdate: "", todate: "" });
  const [totals, setTotals] = useState({ count: 0, totalpaid: 0, totalitems: 0 });
  const [summaries, setSummaries] = useState({});
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async (onlyOptions = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/miscellaneous-collection/report", {
        colid: global1.colid,
        fromdate: onlyOptions ? "" : dateRange.fromdate,
        todate: onlyOptions ? "" : dateRange.todate,
        filters: onlyOptions ? [] : filters.map(({ field, values }) => ({ field, values })).filter((item) => item.field && item.values?.length)
      });
      setFields(res.data?.fields || []);
      setOptions(res.data?.options || {});
      setInstitution(res.data?.institution || null);
      if (!onlyOptions) {
        setRows(res.data?.rows || []);
        setTotals(res.data?.totals || { count: 0, totalpaid: 0, totalitems: 0 });
        setSummaries(res.data?.summaries || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load miscellaneous fees report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(true); }, []);

  const addFilter = () => setFilters((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, field: "", values: [] }]);
  const updateFilter = (id, key, value) => setFilters((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value, ...(key === "field" ? { values: [] } : {}) } : item));
  const removeFilter = (id) => setFilters((prev) => prev.length === 1 ? [{ id: "initial", field: "academicyear", values: [] }] : prev.filter((item) => item.id !== id));

  const openPrint = () => {
    const name = institution?.institutionname || institution?.insname || global1.insname || "Institution";
    const address = institution?.address || institution?.insaddress || "";
    const logo = institution?.logo || institution?.inslogo || institution?.logolink || "";
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(`
      <html><head><title>Miscellaneous Fees Report</title>
      <style>
        body{font-family:Arial,sans-serif;color:#111;background:#fff;margin:24px}
        .actions{margin-bottom:12px}.print-header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px}
        .logo{max-height:70px;max-width:100px;object-fit:contain}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
        .card{border:1px solid #111;padding:8px}.meta{font-size:12px;color:#333}
        table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #111;padding:5px;text-align:left;vertical-align:top}th{background:#f3f4f6}
        @media print{.actions{display:none}body{margin:12mm}thead{display:table-header-group}tr{break-inside:avoid}}
      </style></head><body>
      <div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
      <div class="print-header">${logo ? `<img class="logo" src="${logo}" />` : ""}<h2>${name}</h2><div>${address}</div><h3>Miscellaneous Fees Report</h3><div class="meta">Date Range: ${dateRange.fromdate || "All"} to ${dateRange.todate || "All"}</div></div>
      <div class="cards"><div class="card"><b>Rows</b><br/>${totals.count || 0}</div><div class="card"><b>No of Items</b><br/>${totals.totalitems || 0}</div><div class="card"><b>Total Paid</b><br/>${money(totals.totalpaid)}</div></div>
      <table><thead><tr>${reportColumns.filter((col) => col.field !== "actions").map((col) => `<th>${col.headerName}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${reportColumns.filter((col) => col.field !== "actions").map((col) => `<td>${col.field === "paiddate" ? shortDate(row[col.field]) : row[col.field] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
      </body></html>
    `);
    win.document.close();
  };

  const reportColumns = [
    { field: "transactionid", headerName: "Transaction ID", minWidth: 190 },
    { field: "paiddate", headerName: "Paid Date", width: 120, valueGetter: (params) => shortDate(params.row.paiddate) },
    { field: "student", headerName: "Student", minWidth: 180, flex: 1 },
    { field: "regno", headerName: "Reg No", width: 130 },
    { field: "program", headerName: "Program", minWidth: 160 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "feeitem", headerName: "Fee Item", minWidth: 190, flex: 1 },
    { field: "noofitems", headerName: "No of Items", width: 120, type: "number" },
    { field: "unitamount", headerName: "Unit Amount", width: 130, type: "number" },
    { field: "paidamount", headerName: "Paid Amount", width: 130, type: "number" },
    { field: "paymode", headerName: "Pay Mode", width: 110 },
    { field: "referenceNumber", headerName: "Reference", minWidth: 150 },
    { field: "collectedbyname", headerName: "Collected By", minWidth: 160 },
    { field: "remarks", headerName: "Remarks", minWidth: 200 }
  ];

  const chartData = (summaries.byFeeItem || []).slice(0, 10);
  const pieData = (summaries.byPayMode || []).slice(0, 8);

  return (
    <MenuPageShell title="Miscellaneous Fees Report">
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Miscellaneous Fees Report</Typography>
              <Typography color="text.secondary">Add filters, date range, then load the report.</Typography>
            </Box>
            <Button variant="outlined" startIcon={<Print />} onClick={openPrint} disabled={!rows.length}>Print Preview</Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="From Date" InputLabelProps={{ shrink: true }} value={dateRange.fromdate} onChange={(event) => setDateRange((prev) => ({ ...prev, fromdate: event.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="To Date" InputLabelProps={{ shrink: true }} value={dateRange.todate} onChange={(event) => setDateRange((prev) => ({ ...prev, todate: event.target.value }))} /></Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {filters.map((filter) => (
              <React.Fragment key={filter.id}>
                <Grid item xs={12} md={4}>
                  <Autocomplete options={fields} value={filter.field || ""} onChange={(_, value) => updateFilter(filter.id, "field", value || "")} renderInput={(params) => <TextField {...params} label="Filter Field" />} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete multiple options={options[filter.field] || []} value={filter.values || []} onChange={(_, value) => updateFilter(filter.id, "values", value)} renderInput={(params) => <TextField {...params} label="Values" />} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth color="error" variant="outlined" startIcon={<Delete />} onClick={() => removeFilter(filter.id)} sx={{ height: 56 }}>Remove</Button>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
            <Button variant="outlined" startIcon={<Add />} onClick={addFilter}>Add Filter</Button>
            <Button variant="contained" startIcon={<Refresh />} disabled={loading} onClick={() => loadReport(false)}>{loading ? "Loading..." : "Load Report"}</Button>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {[["Transactions", totals.count], ["No of Items", totals.totalitems], ["Total Paid", money(totals.totalpaid)], ["Fee Items", (summaries.byFeeItem || []).length]].map(([label, value]) => (
            <Grid item xs={12} sm={6} md={3} key={label}>
              <Paper sx={{ p: 2, borderRadius: 1, bgcolor: label === "Total Paid" ? "#eef7ee" : "#f8fafc" }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={900}>{value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography fontWeight={850} sx={{ mb: 1 }}>Fee Item Wise Collection</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" hide />
                  <YAxis />
                  <ChartTooltip formatter={(value) => money(value)} />
                  <Bar dataKey="paidamount" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography fontWeight={850} sx={{ mb: 1 }}>Payment Mode</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={pieData} dataKey="paidamount" nameKey="label" outerRadius={100} label>
                    {pieData.map((entry, index) => <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <ChartTooltip formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <DataGrid
            rows={rows}
            columns={reportColumns}
            getRowId={(row) => row.id}
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "miscellaneous_fees_report" } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{ minWidth: 1800, "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }}
          />
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
