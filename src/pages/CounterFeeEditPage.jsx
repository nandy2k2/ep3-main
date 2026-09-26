import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const emptyFilter = { field: "", value: [] };
const filterFields = [
  "transactionid",
  "academicyear",
  "admissionyear",
  "regulation",
  "program",
  "programcode",
  "semester",
  "section",
  "student",
  "regno",
  "email",
  "phone",
  "paymode",
  "referenceNumber",
  "collectedby",
  "collectedbyname",
  "feegroup",
  "feecategory",
  "feeitem",
  "feebook",
  "cashbook"
];

const formFields = [
  ["transactionid", "Transaction ID"],
  ["paiddate", "Paid Date"],
  ["referenceNumber", "Reference Number"],
  ["chequenumber", "Cheque Number"],
  ["paymode", "Pay Mode"],
  ["paydetails", "Pay Details"],
  ["remarks", "Remarks"],
  ["transactionremarks", "Transaction Remarks"],
  ["collectedby", "Collected By"],
  ["collectedbyname", "Collected By Name"],
  ["totalpaid", "Total Paid"],
  ["academicyear", "Academic Year"],
  ["admissionyear", "Admission Year"],
  ["regulation", "Regulation"],
  ["program", "Program"],
  ["programcode", "Program Code"],
  ["semester", "Semester"],
  ["section", "Section"],
  ["major", "Major"],
  ["minor", "Minor"],
  ["student", "Student"],
  ["regno", "Regno"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["address", "Address"]
];

const dateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};
const text = (value) => String(value ?? "").trim();
const label = (field) => filterFields.find((item) => item === field)?.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (x) => x.toUpperCase()) || field;
const selectedIds = (selection) => Array.from(selection?.ids || selection || []);
const uniqueSorted = (values = []) => Array.from(new Set(values.map(text).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const blankForm = () => ({
  transactionid: "",
  paiddate: dateValue(new Date()),
  referenceNumber: "",
  chequenumber: "",
  paymode: "Cash",
  paydetails: "",
  remarks: "",
  transactionremarks: "",
  collectedby: global1.user || "",
  collectedbyname: global1.name || "",
  totalpaid: 0,
  academicyear: "",
  admissionyear: "",
  regulation: "",
  program: "",
  programcode: "",
  semester: "",
  section: "",
  major: "",
  minor: "",
  student: "",
  regno: "",
  email: "",
  phone: "",
  address: "",
  itemsText: "[]"
});

function SearchMulti({ label: inputLabel, value, options = [], onChange, disabled = false }) {
  return (
    <Autocomplete
      size="small"
      multiple
      disableCloseOnSelect
      disabled={disabled}
      options={options}
      value={value || []}
      onChange={(_, next) => onChange(next)}
      renderOption={(props, option, { selected }) => (
        <li {...props}><Checkbox size="small" checked={selected} />{option}</li>
      )}
      renderInput={(params) => <TextField {...params} label={inputLabel} />}
    />
  );
}

export default function CounterFeeEditPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [fields, setFields] = useState(filterFields);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ ...emptyFilter }]);
  const [fromdate, setFromdate] = useState("");
  const [todate, setTodate] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(blankForm());
  const [editingId, setEditingId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totals = useMemo(() => rows.reduce((sum, row) => ({
    count: sum.count + 1,
    totalpaid: sum.totalpaid + Number(row.totalpaid || 0)
  }), { count: 0, totalpaid: 0 }), [rows]);

  const unlock = async () => {
    try {
      setLoading(true);
      setProgress(30);
      setError("");
      const res = await ep1.get("/api/v2/counterfee-edit/options", { params: { colid: global1.colid, password } });
      setFields(res.data?.fields || filterFields);
      setOptions(res.data?.options || {});
      setUnlocked(true);
      setMessage("Page unlocked. Add filters and click Load.");
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid password or unable to unlock page");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const activeFilters = () => filters.filter((item) => item.field && item.value?.length);

  const loadRows = async () => {
    try {
      setLoading(true);
      setProgress(20);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/counterfee-edit/list", {
        colid: global1.colid,
        password,
        fromdate,
        todate,
        filters: activeFilters()
      });
      setProgress(80);
      setRows((res.data?.data || []).map((row) => ({ ...row, id: row._id })));
      setSelected([]);
      setMessage(`Loaded ${res.data?.count || 0} receipt(s).`);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load counter fee receipts");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const openCreate = () => {
    setEditingId("");
    setForm(blankForm());
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({
      ...blankForm(),
      ...Object.fromEntries(formFields.map(([field]) => [field, field === "paiddate" ? dateValue(row[field]) : (row[field] ?? "")])),
      itemsText: JSON.stringify(row.items || [], null, 2)
    });
    setDialogOpen(true);
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveRow = async () => {
    try {
      setLoading(true);
      setProgress(25);
      setError("");
      let items;
      try {
        items = JSON.parse(form.itemsText || "[]");
      } catch {
        setError("Items must be valid JSON.");
        return;
      }
      if (!Array.isArray(items)) {
        setError("Items JSON must be an array.");
        return;
      }
      const payload = {
        ...Object.fromEntries(formFields.map(([field]) => [field, form[field]])),
        items,
        colid: global1.colid,
        password,
        ...(editingId ? { id: editingId } : {})
      };
      await ep1.post(editingId ? "/api/v2/counterfee-edit/update" : "/api/v2/counterfee-edit/create", payload);
      setProgress(80);
      setDialogOpen(false);
      setMessage(editingId ? "Receipt updated." : "Receipt created.");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save receipt");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const deleteRows = async (ids = selected) => {
    if (!ids.length) {
      setError("Select at least one receipt.");
      return;
    }
    if (!window.confirm(`Delete ${ids.length} receipt(s)? This will only delete the receipt transaction record.`)) return;
    try {
      setLoading(true);
      setProgress(20);
      let deleted = 0;
      for (const id of ids) {
        await ep1.post("/api/v2/counterfee-edit/delete", { colid: global1.colid, password, id });
        deleted += 1;
        setProgress(Math.min(95, Math.round((deleted / ids.length) * 100)));
      }
      setMessage(`Deleted ${deleted} receipt(s).`);
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete receipt");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const updateFilter = (index, patch) => {
    setFilters((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch, ...(patch.field !== undefined ? { value: [] } : {}) } : item));
  };

  const valueOptions = (field) => uniqueSorted(options[field] || rows.map((row) => row[field]));

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(params.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteRows([params.row._id])}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    },
    { field: "transactionid", headerName: "Transaction ID", minWidth: 230 },
    { field: "paiddate", headerName: "Paid Date", minWidth: 120, valueGetter: (params) => dateValue(params.row.paiddate) },
    { field: "student", headerName: "Student", minWidth: 210, flex: 1 },
    { field: "regno", headerName: "Regno", minWidth: 140 },
    { field: "academicyear", headerName: "Academic Year", minWidth: 130 },
    { field: "program", headerName: "Program", minWidth: 170 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "semester", headerName: "Semester", minWidth: 100 },
    { field: "paymode", headerName: "Pay Mode", minWidth: 110 },
    { field: "referenceNumber", headerName: "Reference No", minWidth: 160 },
    { field: "collectedbyname", headerName: "Collected By", minWidth: 170 },
    { field: "totalpaid", headerName: "Total Paid", minWidth: 130, type: "number", valueFormatter: ({ value }) => money(value) },
    { field: "transactionremarks", headerName: "Remarks", minWidth: 220, flex: 1 },
    { field: "items", headerName: "Items", minWidth: 120, valueGetter: (params) => (params.row.items || []).length }
  ];

  return (
    <MenuPageShell title="Counter fee edit">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={950}>Counter fee edit</Typography>
            <Typography color="text.secondary">Protected CRUD for counter fee payment receipt transactions. Password: kumropatash.</Typography>
          </Paper>

          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {loading && <LinearProgress variant={progress ? "determinate" : "indeterminate"} value={progress} />}

          {!unlocked ? (
            <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, maxWidth: 520 }}>
              <Stack spacing={2}>
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="contained" startIcon={<LockIcon />} disabled={loading || !password} onClick={unlock}>
                  {loading ? "Checking..." : "Unlock"}
                </Button>
              </Stack>
            </Paper>
          ) : (
            <>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} md={2.5}>
                    <TextField fullWidth size="small" type="date" label="From paid date" value={fromdate} onChange={(e) => setFromdate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={2.5}>
                    <TextField fullWidth size="small" type="date" label="To paid date" value={todate} onChange={(e) => setTodate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Stack direction="row" spacing={1} justifyContent={{ md: "flex-end" }} flexWrap="wrap" useFlexGap>
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFilters((prev) => [...prev, { ...emptyFilter }])}>Add filter</Button>
                      <Button variant="contained" startIcon={<RefreshIcon />} disabled={loading} onClick={loadRows}>{loading ? "Loading..." : "Load"}</Button>
                      <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={openCreate}>New receipt</Button>
                      <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selected.length || loading} onClick={() => deleteRows()}>Delete selected</Button>
                    </Stack>
                  </Grid>
                  {filters.map((filter, index) => (
                    <React.Fragment key={index}>
                      <Grid item xs={12} md={3}>
                        <Autocomplete
                          size="small"
                          options={fields}
                          value={filter.field || null}
                          onChange={(_, value) => updateFilter(index, { field: value || "" })}
                          getOptionLabel={(option) => label(option)}
                          renderInput={(params) => <TextField {...params} label="Filter field" />}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <SearchMulti label="Value" options={valueOptions(filter.field)} value={filter.value} onChange={(value) => updateFilter(index, { value })} disabled={!filter.field} />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <IconButton color="error" onClick={() => setFilters((prev) => prev.length === 1 ? [{ ...emptyFilter }] : prev.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
              </Paper>

              <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography fontWeight={900}>Receipts: {totals.count}</Typography>
                  <Typography fontWeight={900}>Total paid: {money(totals.totalpaid)}</Typography>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ height: 680, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={loading}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={(model) => setSelected(selectedIds(model))}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "counter-fee-edit" } } }}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", lineHeight: 1.35, alignItems: "flex-start", py: 1 } }}
                />
              </Paper>
            </>
          )}
        </Stack>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="lg">
          <DialogTitle>{editingId ? "Edit counter fee receipt" : "Create counter fee receipt"}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={1.5}>
              {formFields.map(([field, fieldLabel]) => (
                <Grid item xs={12} md={field === "address" || field === "remarks" || field === "transactionremarks" ? 6 : 3} key={field}>
                  <TextField
                    fullWidth
                    size="small"
                    type={field === "paiddate" ? "date" : field === "totalpaid" ? "number" : "text"}
                    label={fieldLabel}
                    value={form[field] ?? ""}
                    onChange={(e) => updateForm(field, e.target.value)}
                    InputLabelProps={field === "paiddate" ? { shrink: true } : undefined}
                    multiline={field === "address" || field === "remarks" || field === "transactionremarks"}
                    minRows={field === "address" || field === "remarks" || field === "transactionremarks" ? 2 : undefined}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={10}
                  label="Items JSON"
                  value={form.itemsText}
                  onChange={(e) => updateForm("itemsText", e.target.value)}
                  helperText="Edit receipt line items as JSON array. paidamount values are used to auto-calculate total paid if total paid is blank."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<SaveIcon />} disabled={loading} onClick={saveRow}>{loading ? "Saving..." : "Save"}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MenuPageShell>
  );
}
