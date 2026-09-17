import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuPageShell from "./MenuPageShell";
import CounterFee2ReceiptView from "./CounterFee2ReceiptView";
import ep1 from "../api/ep1";
import global1 from "./global1";

const filterFields = [
  { field: "transactionid", label: "Transaction ID" },
  { field: "academicyear", label: "Academic Year" },
  { field: "student", label: "Student" },
  { field: "regno", label: "Reg No" },
  { field: "programcode", label: "Program Code" },
  { field: "regulation", label: "Regulation" },
  { field: "semester", label: "Semester" },
  { field: "feegroup", label: "Fee Group" },
  { field: "feeitem", label: "Fee Item" },
  { field: "paymode", label: "Mode of Payment" },
  { field: "referenceNumber", label: "Reference Number" }
];

const emptyFilter = { field: "", value: "" };
const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const text = (value) => String(value ?? "").trim();
const uniqueSorted = (values = []) => Array.from(new Set(values.map(text).filter(Boolean)))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const uniqueValues = (rows, field, options) => uniqueSorted(options?.[field]?.length ? options[field] : rows.map((row) => row[field]));

function SearchSelect({ label, value, options = [], onChange, getOptionLabel = (option) => option, disabled = false }) {
  return (
    <Autocomplete
      size="small"
      disabled={disabled}
      options={options}
      value={value || null}
      onChange={(_, nextValue) => onChange(nextValue || "")}
      getOptionLabel={(option) => getOptionLabel(option) || ""}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

export default function CounterFee2Receipt3Page() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ ...emptyFilter }]);
  const [fromdate, setFromdate] = useState("");
  const [todate, setTodate] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedFeeGroup, setSelectedFeeGroup] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [receiptNote, setReceiptNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const buildParams = () => {
    const params = { colid: global1.colid };
    if (fromdate) params.fromdate = fromdate;
    if (todate) params.todate = todate;
    filters.forEach((filter) => {
      if (filter.field && filter.value) params[filter.field] = filter.value;
    });
    return params;
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setReceipt(null);
      const res = await ep1.get("/api/v2/counterfee2/transactions", { params: buildParams() });
      const data = (res.data.data || []).map((row) => ({ ...row, id: row._id }));
      setRows(data);
      setOptions(res.data.options || {});
      if (!data.length) setMessage("No transaction found for selected filters");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load counter fee transactions");
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index, key, value) => {
    setFilters((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value, ...(key === "field" ? { value: "" } : {}) } : item));
  };
  const addFilter = () => setFilters((prev) => [...prev, { ...emptyFilter }]);
  const removeFilter = (index) => setFilters((prev) => {
    const next = prev.filter((_, itemIndex) => itemIndex !== index);
    return next.length ? next : [{ ...emptyFilter }];
  });

  const selectTransaction = (row) => {
    setSelectedTransaction(row);
    setSelectedFeeGroup("");
    setReceipt(null);
    setMessage(`Selected transaction ${row.transactionid}. Select fee group and load receipt.`);
  };

  const feeGroupOptions = useMemo(() => uniqueSorted((selectedTransaction?.items || []).map((item) => item.feegroup)), [selectedTransaction]);

  const loadReceipt = async () => {
    if (!selectedTransaction?.transactionid) {
      setError("Select a transaction first");
      return;
    }
    if (!selectedFeeGroup) {
      setError("Select fee group for the selected transaction");
      return;
    }
    try {
      setLoadingReceipt(true);
      setError("");
      setMessage("");
      const res = await ep1.get("/api/v2/counterfee2/receipt", {
        params: { colid: global1.colid, transactionid: selectedTransaction.transactionid, feegroup: selectedFeeGroup }
      });
      setReceipt(res.data.data || null);
      setInstitution(res.data.institution || null);
      setReceiptNote(res.data.note || null);
      setMessage("Receipt loaded for selected transaction and fee group");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load receipt");
    } finally {
      setLoadingReceipt(false);
    }
  };

  const columns = [
    { field: "transactionid", headerName: "Transaction ID", width: 230 },
    { field: "paiddate", headerName: "Paid Date", width: 130, valueGetter: (params) => dateValue(params.row.paiddate) },
    { field: "student", headerName: "Student", width: 220 },
    { field: "regno", headerName: "Reg No", width: 140 },
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "program", headerName: "Program", width: 180 },
    { field: "programcode", headerName: "Program Code", width: 140 },
    { field: "paymode", headerName: "Mode", width: 110 },
    { field: "referenceNumber", headerName: "Reference No", width: 160 },
    { field: "totalpaid", headerName: "Total Paid", width: 130, type: "number" },
    {
      field: "actions",
      headerName: "Select",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button size="small" variant="contained" startIcon={<ReceiptIcon />} onClick={() => selectTransaction(params.row)}>
          Select
        </Button>
      )
    }
  ];

  return (
    <MenuPageShell title="Counter Fee Receipt 3">
      <Box p={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Counter Fee Receipt 3</Typography>
            <Typography variant="body2" color="text.secondary">Select a transaction, then select the fee group to load that receipt.</Typography>
          </Box>
          <Button variant="outlined" onClick={() => window.location.assign("/dashdashfacnew")}>Back</Button>
        </Stack>

        {message && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="From Paid Date" type="date" value={fromdate} onChange={(event) => setFromdate(event.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="To Paid Date" type="date" value={todate} onChange={(event) => setTodate(event.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addFilter}>Add Filter</Button>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadTransactions} disabled={loading}>{loading ? "Loading..." : "Load"}</Button>
              </Stack>
            </Grid>
            {filters.map((filter, index) => (
              <React.Fragment key={`${index}-${filter.field}`}>
                <Grid item xs={12} md={3}>
                  <SearchSelect
                    label="Filter By"
                    value={filter.field}
                    options={filterFields.map((item) => item.field)}
                    getOptionLabel={(option) => filterFields.find((item) => item.field === option)?.label || option}
                    onChange={(value) => updateFilter(index, "field", value)}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <SearchSelect
                    label="Value"
                    value={filter.value}
                    options={uniqueValues(rows, filter.field, options)}
                    onChange={(value) => updateFilter(index, "value", value)}
                    disabled={!filter.field}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Tooltip title="Remove filter">
                    <span><IconButton color="error" onClick={() => removeFilter(index)}><DeleteIcon /></IconButton></span>
                  </Tooltip>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                label="Selected transaction"
                value={selectedTransaction?.transactionid || ""}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <SearchSelect label="Fee group" value={selectedFeeGroup} options={feeGroupOptions} onChange={setSelectedFeeGroup} disabled={!selectedTransaction} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ReceiptIcon />}
                disabled={loadingReceipt || !selectedTransaction || !selectedFeeGroup}
                onClick={loadReceipt}
              >
                {loadingReceipt ? "Loading receipt..." : "Load receipt"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 1, mb: 3, overflowX: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
            <Typography fontWeight={800}>Transactions</Typography>
            <Chip size="small" label={rows.length} />
          </Stack>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "counter_fee_receipt_3_transactions" } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            onRowClick={(params) => selectTransaction(params.row)}
            sx={{
              minWidth: 1450,
              cursor: "pointer",
              "& .MuiDataGrid-cell": { whiteSpace: "normal", overflowWrap: "anywhere", alignItems: "flex-start", py: 1 }
            }}
          />
        </Paper>

        {receipt && <CounterFee2ReceiptView receipt={receipt} institution={institution} note={receiptNote} />}
      </Box>
    </MenuPageShell>
  );
}
