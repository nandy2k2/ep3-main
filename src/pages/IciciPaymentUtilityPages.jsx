import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankFilters = { type: "", status: "", student: "", regno: "", feeitem: "", refno: "", email: "", merchantTxnNo: "", txnid: "", fromdate: "", todate: "" };
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const dateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

function FilterPanel({ filters, setFilters, onLoad, loading, successOnly = false }) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Student">Student</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
              <MenuItem value="Admission">Admission</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {!successOnly && (
          <Grid item xs={12} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="INITIATED">INITIATED</MenuItem>
                <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                <MenuItem value="FAILED">FAILED</MenuItem>
                <MenuItem value="PENDING">PENDING</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} md={2}><TextField size="small" label="Student" value={filters.student} onChange={(e) => setFilters({ ...filters, student: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" label="Reg no" value={filters.regno} onChange={(e) => setFilters({ ...filters, regno: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" label="Email" value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" label="Fee item" value={filters.feeitem} onChange={(e) => setFilters({ ...filters, feeitem: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" label="Ref no" value={filters.refno} onChange={(e) => setFilters({ ...filters, refno: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" label="Merchant txn no" value={filters.merchantTxnNo} onChange={(e) => setFilters({ ...filters, merchantTxnNo: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" label="Txn ID" value={filters.txnid} onChange={(e) => setFilters({ ...filters, txnid: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" type="date" label="From date" InputLabelProps={{ shrink: true }} value={filters.fromdate} onChange={(e) => setFilters({ ...filters, fromdate: e.target.value })} fullWidth /></Grid>
        <Grid item xs={12} md={2}><TextField size="small" type="date" label="To date" InputLabelProps={{ shrink: true }} value={filters.todate} onChange={(e) => setFilters({ ...filters, todate: e.target.value })} fullWidth /></Grid>
      </Grid>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" startIcon={<SearchIcon />} disabled={loading} onClick={onLoad}>Search</Button>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => setFilters(successOnly ? { ...blankFilters, status: "SUCCESS" } : blankFilters)}>Clear</Button>
      </Stack>
    </Paper>
  );
}

const baseColumns = [
  { field: "student", headerName: "Student", minWidth: 180, flex: 1 },
  { field: "regno", headerName: "Reg no", minWidth: 140 },
  { field: "feeitem", headerName: "Fee item", minWidth: 220, flex: 1 },
  { field: "type", headerName: "Type", minWidth: 110 },
  { field: "amount", headerName: "Amount", minWidth: 130, valueFormatter: (params) => money(params.value) },
  { field: "paidamount", headerName: "Paid amount", minWidth: 140, valueFormatter: (params) => money(params.value) },
  { field: "status", headerName: "Status", minWidth: 120 },
  { field: "refno", headerName: "Ref no", minWidth: 220 },
  { field: "merchantTxnNo", headerName: "Merchant txn no", minWidth: 190 },
  { field: "txnid", headerName: "Txn ID", minWidth: 170 },
  { field: "initiationdate", headerName: "Initiation date", minWidth: 190, valueGetter: (params) => dateValue(params.row.initiationdate) },
  { field: "paiddate", headerName: "Paid date", minWidth: 190, valueGetter: (params) => dateValue(params.row.paiddate) },
  { field: "email", headerName: "Email", minWidth: 200 },
  { field: "phone", headerName: "Phone", minWidth: 130 }
];

export function OnlinePaymentRegnoEditPage() {
  const [filters, setFilters] = useState(blankFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [regno, setRegno] = useState("");

  const loadRows = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.get("/api/v2/icicipayment", { params: { colid: global1.colid, ...filters } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load online payments");
    } finally {
      setLoading(false);
    }
  };

  const saveRegno = async () => {
    if (!editing?._id || !regno.trim()) {
      setError("Regno is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/icicipayment/update-regno", { colid: global1.colid, id: editing._id, regno });
      setRows((prev) => prev.map((row) => row._id === editing._id ? res.data.data : row));
      setMessage("Regno updated.");
      setEditing(null);
      setRegno("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update regno");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Edit",
      width: 90,
      getActions: (params) => [
        <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit regno" onClick={() => { setEditing(params.row); setRegno(params.row.regno || ""); }} />
      ]
    },
    ...baseColumns
  ];

  return (
    <MenuPageShell title="Online payment regno edit">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Online payment regno edit</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        <FilterPanel filters={filters} setFilters={setFilters} onLoad={loadRows} loading={loading} />
        <Paper sx={{ p: 2, overflowX: "auto" }}>
          <DataGrid rows={rows.map((row) => ({ ...row, id: row._id }))} columns={columns} autoHeight loading={loading} density="compact" slots={{ toolbar: GridToolbar }} sx={{ minWidth: 2200 }} />
        </Paper>
        <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit regno only</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField label="Student" value={editing?.student || ""} InputProps={{ readOnly: true }} />
              <TextField label="Ref no" value={editing?.refno || ""} InputProps={{ readOnly: true }} />
              <TextField label="Regno" value={regno} onChange={(e) => setRegno(e.target.value)} autoFocus />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="contained" onClick={saveRegno} disabled={loading}>Save regno</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MenuPageShell>
  );
}

export function OnlineFeePaymentReceiptPage() {
  const [filters, setFilters] = useState(blankFilters);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiptScope, setReceiptScope] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRows = async () => {
    setLoading(true);
    setError("");
    setReceipt(null);
    try {
      const res = await ep1.get("/api/v2/icicipayment", { params: { colid: global1.colid, ...filters } });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load online payments");
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async () => {
    if (!selected) {
      setError("Select any student transaction first.");
      return;
    }
    if (receiptScope === "transaction" && String(selected.status || "").toUpperCase() !== "SUCCESS") {
      setError("Receipt can be generated only for SUCCESS transactions. Select a SUCCESS transaction or choose all SUCCESS transactions for the student.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/icicipayment/receipt", {
        params: receiptScope === "transaction"
          ? { colid: global1.colid, id: selected._id }
          : { colid: global1.colid, regno: selected.regno, student: selected.student, email: selected.email }
      });
      setReceipt(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to generate receipt");
    } finally {
      setLoading(false);
    }
  };

  const receiptRows = receipt?.data || [];
  const printReceipt = () => window.print();

  return (
    <MenuPageShell title="Online fee payment receipt">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #online-fee-receipt-print, #online-fee-receipt-print * { visibility: visible; }
            #online-fee-receipt-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; background: white; }
          }
        `}</style>
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Online fee payment receipt</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <FilterPanel filters={filters} setFilters={setFilters} onLoad={loadRows} loading={loading} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ xs: "stretch", sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Receipt for</InputLabel>
            <Select label="Receipt for" value={receiptScope} onChange={(e) => setReceiptScope(e.target.value)}>
              <MenuItem value="transaction">Selected SUCCESS transaction only</MenuItem>
              <MenuItem value="student">All SUCCESS transactions for selected student</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<PrintIcon />} disabled={!selected || loading} onClick={generateReceipt}>Generate receipt</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} disabled={!receiptRows.length} onClick={printReceipt}>Print preview</Button>
        </Stack>
        <Paper sx={{ p: 2, overflowX: "auto", mb: 2 }}>
          <DataGrid
            rows={rows.map((row) => ({ ...row, id: row._id }))}
            columns={baseColumns}
            autoHeight
            loading={loading}
            density="compact"
            slots={{ toolbar: GridToolbar }}
            onRowClick={(params) => setSelected(params.row)}
            sx={{ minWidth: 2100 }}
          />
        </Paper>
        {receiptRows.length > 0 && (
          <Paper id="online-fee-receipt-print" sx={{ p: 3, bgcolor: "white" }}>
            <Stack alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
              {global1.logo && <Box component="img" src={global1.logo} alt="logo" sx={{ height: 70, objectFit: "contain" }} />}
              <Typography variant="h5" fontWeight={900}>{global1.insname || "Institution"}</Typography>
              <Typography variant="body2">{global1.address || ""}</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>Online Fee Payment Receipt</Typography>
            </Stack>
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography><b>Student:</b> {selected?.student}</Typography></Grid>
              <Grid item xs={6}><Typography><b>Regno:</b> {selected?.regno}</Typography></Grid>
              <Grid item xs={6}><Typography><b>Email:</b> {selected?.email}</Typography></Grid>
              <Grid item xs={6}><Typography><b>Generated:</b> {new Date().toLocaleString()}</Typography></Grid>
            </Grid>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { border: "1px solid #111", p: 1, fontSize: 13 }, "& th": { bgcolor: "#f3f4f6" } }}>
              <thead>
                <tr>
                  <th>Sl</th><th>Fee item</th><th>Ref no</th><th>Txn ID</th><th>Paid date</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {receiptRows.map((row, index) => (
                  <tr key={row._id || index}>
                    <td>{index + 1}</td>
                    <td>{row.feeitem}</td>
                    <td>{row.refno}</td>
                    <td>{row.txnid || row.merchantTxnNo}</td>
                    <td>{dateValue(row.paiddate || row.initiationdate)}</td>
                    <td style={{ textAlign: "right" }}>{money(row.paidamount || row.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} style={{ textAlign: "right", fontWeight: 900 }}>Total</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>{money(receipt?.summary?.paidamount || 0)}</td>
                </tr>
              </tbody>
            </Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}>
              <Typography>Student Signature</Typography>
              <Typography>Authorized Signature</Typography>
            </Stack>
          </Paper>
        )}
      </Box>
    </MenuPageShell>
  );
}
