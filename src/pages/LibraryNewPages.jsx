import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { CheckCircle, Delete, Edit, Print, QrCode2, Refresh, Save, UploadFile } from "@mui/icons-material";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#ea580c", "#4f46e5"];
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const shortDate = (value) => (value ? String(value).slice(0, 10) : "");

const bookFields = [
  "libraryid", "libraryname", "accessionno", "title", "author", "classification", "publisher", "publisheraddress",
  "isbn", "category", "subject", "edition", "publicationyear", "language", "rackno", "shelfno", "location",
  "supplier", "invoiceno", "invoicedate", "keywords", "purchasedate",
  "price", "pages", "status", "remarks"
];
const bookLabels = {
  libraryid: "Library", libraryname: "Library",
  accessionno: "Accession No", title: "Title", author: "Author", classification: "Classification", publisher: "Publisher",
  publisheraddress: "Publisher Address", isbn: "ISBN",
  category: "Category", subject: "Subject", edition: "Edition", publicationyear: "Publication Year",
  language: "Language", rackno: "Rack No", shelfno: "Shelf No", location: "Location", supplier: "Supplier",
  invoiceno: "Invoice No", invoicedate: "Invoice Date", keywords: "Keywords",
  purchasedate: "Purchase Date", price: "Price", pages: "Pages", status: "Status", remarks: "Remarks"
};
const studentFields = ["academicyear", "programcode", "semester", "section", "name", "email", "phone", "regno"];
const issueTypes = ["Regular", "Reference", "Reading Room", "Faculty Issue", "Special"];

function useLibraryList(all = false) {
  const [libraries, setLibraries] = useState([]);
  const loadLibraries = async () => {
    const res = await ep1.get("/api/v2/librarynew/libraries/accessible", {
      params: { colid: global1.colid, user: global1.user, all: all ? "yes" : "no" }
    });
    setLibraries(res.data?.data || []);
  };
  useEffect(() => { loadLibraries(); }, []);
  return { libraries, loadLibraries };
}

function LibrarySelect({ libraries, value, onChange, label = "Library", allowAll = false }) {
  const options = allowAll ? [{ _id: "", libraryname: "All libraries" }, ...libraries] : libraries;
  return (
    <Autocomplete
      size="small"
      options={options}
      value={options.find((row) => String(row._id || "") === String(value || "")) || null}
      onChange={(_, item) => onChange(item?._id || "")}
      getOptionLabel={(option) => option?.libraryname ? `${option.libraryname}${option.type ? ` (${option.type})` : ""}` : ""}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

function FieldFilters({ fields, options = {}, filters, setFilters }) {
  const update = (index, patch) => setFilters((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  return (
    <Stack spacing={1}>
      {filters.map((filter, index) => (
        <Grid container spacing={1} key={index}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth size="small" label="Filter field" value={filter.field} onChange={(e) => update(index, { field: e.target.value, value: "" })}>
              {fields.map((field) => <MenuItem key={field} value={field}>{bookLabels[field] || field}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={7}>
            <Autocomplete
              freeSolo
              size="small"
              options={options[filter.field] || []}
              value={filter.value || ""}
              onInputChange={(_, value) => update(index, { value })}
              onChange={(_, value) => update(index, { value: value || "" })}
              renderInput={(params) => <TextField {...params} label="Value" />}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button color="error" onClick={() => setFilters((prev) => prev.filter((_, idx) => idx !== index))} disabled={filters.length === 1}>Remove</Button>
          </Grid>
        </Grid>
      ))}
      <Box><Button onClick={() => setFilters((prev) => [...prev, { field: fields[0] || "", value: "" }])}>Add filter</Button></Box>
    </Stack>
  );
}

async function readExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
}

function downloadTemplate(filename, fields) {
  const ws = XLSX.utils.json_to_sheet([Object.fromEntries(fields.map((field) => [field, ""]))]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, filename);
}

function CodeDialog({ book, open, onClose }) {
  const [qr, setQr] = useState("");
  const barcodeRef = useRef(null);
  useEffect(() => {
    if (!book || !open) return;
    const url = `${window.location.origin}/library-book-scan?colid=${global1.colid}&libraryid=${encodeURIComponent(book.libraryid || "")}&accessionno=${encodeURIComponent(book.accessionno || "")}`;
    QRCode.toDataURL(url, { width: 180 }).then(setQr);
    setTimeout(() => {
      if (barcodeRef.current) JsBarcode(barcodeRef.current, book.accessionno || "NA", { height: 56, displayValue: true });
    }, 50);
  }, [book, open]);
  const print = () => {
    const html = document.getElementById("library-code-print")?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<html><body>${html}</body></html>`);
    win.document.close();
    win.print();
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Barcode and QR Code</DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center" id="library-code-print" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900}>{book?.title}</Typography>
          <Typography>Accession No: {book?.accessionno}</Typography>
          <svg ref={barcodeRef} />
          {qr && <Box component="img" alt="QR" src={qr} sx={{ width: 180, height: 180 }} />}
        </Stack>
        <Button fullWidth variant="contained" startIcon={<Print />} onClick={print}>Print Codes</Button>
      </DialogContent>
    </Dialog>
  );
}

export function LibraryMasterPage() {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: "libraryname", value: "" }]);
  const [form, setForm] = useState({ type: "University", status: "Active" });
  const [loading, setLoading] = useState(false);
  const fields = ["libraryname", "description", "type", "status"];
  const load = async () => {
    setLoading(true);
    const params = { colid: global1.colid };
    filters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/libraries", { params });
    setRows(res.data?.data || []);
    setOptions(res.data?.options || {});
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setLoading(true);
    await ep1.post("/api/v2/librarynew/libraries", { ...form, colid: global1.colid, user: global1.user });
    setForm({ type: "University", status: "Active" });
    await load();
    setLoading(false);
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const rowsToSave = await readExcel(file);
    for (const row of rowsToSave) await ep1.post("/api/v2/librarynew/libraries", { ...row, colid: global1.colid, user: global1.user });
    await load();
    setLoading(false);
    event.target.value = "";
  };
  const columns = [
    { field: "libraryname", headerName: "Library", minWidth: 220, flex: 1 },
    { field: "description", headerName: "Description", minWidth: 260, flex: 1 },
    { field: "type", headerName: "Type", minWidth: 150 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "actions", type: "actions", width: 100, getActions: (p) => [
      <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => setForm({ ...p.row, id: p.row._id })} />,
      <GridActionsCellItem icon={<Delete />} label="Delete" onClick={async () => { await ep1.post("/api/v2/librarynew/libraries/delete", { id: p.row._id, colid: global1.colid }); load(); }} />
    ] }
  ];
  return (
    <MenuPageShell title="Library Master">
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Library Name" value={form.libraryname || ""} onChange={(e) => setForm({ ...form, libraryname: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Type" value={form.type || "University"} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["University", "Departmental", "Special"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Status" value={form.status || "Active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Active", "Inactive"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={1}><Button fullWidth variant="contained" disabled={loading} onClick={save}>{loading ? "..." : "Save"}</Button></Grid>
            <Grid item xs={12}><Stack direction="row" spacing={1}><Button variant="outlined" onClick={() => downloadTemplate("library_master_template.xlsx", fields)}>Download Template</Button><Button component="label" variant="outlined" startIcon={<UploadFile />}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button></Stack></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}><FieldFilters fields={fields} options={options} filters={filters} setFilters={setFilters} /><Button sx={{ mt: 1 }} variant="contained" onClick={load}>Apply</Button></Paper>
        <Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Box>
      </Stack>
    </MenuPageShell>
  );
}

export function LibraryUserAccessPage() {
  const { libraries } = useLibraryList(true);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [userFilters, setUserFilters] = useState([{ field: "name", value: "" }]);
  const [filters, setFilters] = useState([{ field: "libraryname", value: "" }]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLibraries, setSelectedLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadUsers = async () => {
    const params = { colid: global1.colid };
    userFilters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/users", { params });
    setUsers(res.data?.data || []);
  };
  const load = async () => {
    const params = { colid: global1.colid };
    filters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/access", { params });
    setRows(res.data?.data || []);
    setOptions(res.data?.options || {});
  };
  useEffect(() => { loadUsers(); load(); }, []);
  const save = async () => {
    if (!selectedUser || !selectedLibraries.length) return;
    setLoading(true);
    await ep1.post("/api/v2/librarynew/access", { colid: global1.colid, userid: selectedUser._id, libraryids: selectedLibraries.map((row) => row._id), user: global1.user });
    setSelectedUser(null); setSelectedLibraries([]);
    await load();
    setLoading(false);
  };
  const columns = [
    { field: "libraryname", headerName: "Library", minWidth: 220 },
    { field: "name", headerName: "User", minWidth: 180, flex: 1 },
    { field: "email", headerName: "Email", minWidth: 220 },
    { field: "role", headerName: "Role", minWidth: 120 },
    { field: "department", headerName: "Department", minWidth: 150 },
    { field: "actions", type: "actions", width: 90, getActions: (p) => [<GridActionsCellItem icon={<Delete />} label="Delete" onClick={async () => { await ep1.post("/api/v2/librarynew/access/delete", { id: p.row._id, colid: global1.colid }); load(); }} />] }
  ];
  return (
    <MenuPageShell title="Library User Access">
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={900}>Find User</Typography>
          <FieldFilters fields={["name", "email", "user", "role", "department", "phone"]} options={{}} filters={userFilters} setFilters={setUserFilters} />
          <Button sx={{ mt: 1 }} variant="contained" onClick={loadUsers}>Apply User Filter</Button>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}><Autocomplete options={users} value={selectedUser} onChange={(_, v) => setSelectedUser(v)} getOptionLabel={(o) => `${o.name || ""} - ${o.email || o.user || ""} - ${o.role || ""}`} renderInput={(params) => <TextField {...params} label="Select user" />} /></Grid>
            <Grid item xs={12} md={6}><Autocomplete multiple disableCloseOnSelect options={libraries} value={selectedLibraries} onChange={(_, v) => setSelectedLibraries(v)} getOptionLabel={(o) => `${o.libraryname || ""} (${o.type || ""})`} renderOption={(props, option, { selected }) => <li {...props}><Checkbox checked={selected} />{option.libraryname}</li>} renderInput={(params) => <TextField {...params} label="Libraries" />} /></Grid>
            <Grid item xs={12}><Button variant="contained" disabled={loading || !selectedUser || !selectedLibraries.length} onClick={save}>{loading ? "Saving..." : "Assign Library Access"}</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}><FieldFilters fields={["libraryname", "name", "email", "role", "department", "status"]} options={options} filters={filters} setFilters={setFilters} /><Button sx={{ mt: 1 }} variant="contained" onClick={load}>Apply</Button></Paper>
        <Box sx={{ height: 560 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Box>
      </Stack>
    </MenuPageShell>
  );
}

export function LibraryBookMasterPage() {
  const { libraries } = useLibraryList(false);
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: "title", value: "" }]);
  const [form, setForm] = useState({ status: "Available" });
  const [selectedCodeBook, setSelectedCodeBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const params = () => {
    const p = { colid: global1.colid, user: global1.user };
    if (form.libraryid) p.libraryid = form.libraryid;
    filters.forEach((filter) => { if (filter.field && filter.value) p[filter.field] = filter.value; });
    return p;
  };
  const load = async () => {
    setLoading(true);
    try {
      const res = await ep1.get("/api/v2/librarynew/books", { params: params() });
      setRows(res.data?.data || []);
      setOptions(res.data?.options || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load books");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setLoading(true);
    try {
      await ep1.post("/api/v2/librarynew/books", { ...form, colid: global1.colid, user: global1.user });
      setMessage("Book saved.");
      setForm({ status: "Available" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save book");
    } finally {
      setLoading(false);
    }
  };
  const deleteRow = async (row) => {
    if (!window.confirm("Delete this book?")) return;
    await ep1.post("/api/v2/librarynew/books/delete", { id: row._id, colid: global1.colid });
    load();
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const rows = await readExcel(file);
      const res = await ep1.post("/api/v2/librarynew/books/bulk", { colid: global1.colid, user: global1.user, rows });
      setMessage(`${res.data?.saved || 0} books uploaded.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload books");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const columns = [
    { field: "libraryname", headerName: "Library", minWidth: 180 },
    { field: "accessionno", headerName: "Accession No", minWidth: 140 },
    { field: "title", headerName: "Title", minWidth: 240, flex: 1 },
    { field: "author", headerName: "Author", minWidth: 180 },
    { field: "classification", headerName: "Classification", minWidth: 170 },
    { field: "publisher", headerName: "Publisher", minWidth: 170 },
    { field: "publisheraddress", headerName: "Publisher Address", minWidth: 230 },
    { field: "invoiceno", headerName: "Invoice No", minWidth: 140 },
    { field: "invoicedate", headerName: "Invoice Date", minWidth: 130, valueGetter: (p) => shortDate(p.row.invoicedate) },
    { field: "keywords", headerName: "Keywords", minWidth: 220 },
    { field: "category", headerName: "Category", minWidth: 140 },
    { field: "subject", headerName: "Subject", minWidth: 140 },
    { field: "rackno", headerName: "Rack", minWidth: 90 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "price", headerName: "Price", minWidth: 100, type: "number" },
    {
      field: "actions", type: "actions", width: 140, getActions: (params) => [
        <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => setForm({ ...params.row, id: params.row._id, purchasedate: shortDate(params.row.purchasedate) })} />,
        <GridActionsCellItem icon={<QrCode2 />} label="Codes" onClick={() => setSelectedCodeBook(params.row)} />,
        <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteRow(params.row)} />
      ]
    }
  ];
  return (
    <MenuPageShell title="Library Book Master">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <LibrarySelect libraries={libraries} value={form.libraryid} onChange={(libraryid) => setForm((prev) => ({ ...prev, libraryid }))} />
            </Grid>
            {bookFields.map((field) => (
              ["libraryid", "libraryname"].includes(field) ? null :
              <Grid item xs={12} sm={6} md={["remarks", "publisheraddress", "keywords"].includes(field) ? 6 : 3} key={field}>
                <TextField
                  fullWidth
                  size="small"
                  label={bookLabels[field] || field}
                  type={["price", "pages"].includes(field) ? "number" : ["purchasedate", "invoicedate"].includes(field) ? "date" : "text"}
                  InputLabelProps={["purchasedate", "invoicedate"].includes(field) ? { shrink: true } : undefined}
                  multiline={["remarks", "publisheraddress", "keywords"].includes(field)}
                  minRows={["remarks", "publisheraddress", "keywords"].includes(field) ? 2 : undefined}
                  value={form[field] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" startIcon={<Save />} disabled={loading} onClick={save}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" onClick={() => setForm({ status: "Available" })}>Clear</Button>
                <Button variant="outlined" onClick={() => downloadTemplate("library_books_template.xlsx", ["libraryid", ...bookFields.filter((field) => field !== "libraryname")])}>Download Template</Button>
                <Button component="label" variant="outlined" startIcon={<UploadFile />}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <FieldFilters fields={bookFields} options={options} filters={filters} setFilters={setFilters} />
          <Button sx={{ mt: 1 }} variant="contained" startIcon={<Refresh />} onClick={load} disabled={loading}>Apply</Button>
        </Paper>
        <Box sx={{ height: 560 }}>
          <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} />
        </Box>
        <CodeDialog book={selectedCodeBook} open={!!selectedCodeBook} onClose={() => setSelectedCodeBook(null)} />
      </Stack>
    </MenuPageShell>
  );
}

export function LibraryBookScanPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    ep1.get("/api/v2/librarynew/scan", { params: { colid: qs.get("colid"), libraryid: qs.get("libraryid"), accessionno: qs.get("accessionno") } })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load book"));
  }, []);
  return (
    <Box sx={{ p: 3, bgcolor: "#eef2ff", minHeight: "100vh" }}>
      <Paper sx={{ maxWidth: 760, mx: "auto", p: 3, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={900} gutterBottom>Library Book Details</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {data?.book && (
          <Grid container spacing={2}>
            {bookFields.map((field) => <Grid item xs={12} sm={6} key={field}><Typography variant="caption">{bookLabels[field] || field}</Typography><Typography fontWeight={800}>{field.includes("date") ? shortDate(data.book[field]) : data.book[field] || "-"}</Typography></Grid>)}
            {data.issue && <Grid item xs={12}><Alert severity="warning">Currently issued to {data.issue.student} ({data.issue.regno}), due on {shortDate(data.issue.duedate)}</Alert></Grid>}
          </Grid>
        )}
      </Paper>
    </Box>
  );
}

export function LibraryFinePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ status: "Active" });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const res = await ep1.get("/api/v2/librarynew/fines", { params: { colid: global1.colid } });
    setRows(res.data?.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setLoading(true);
    await ep1.post("/api/v2/librarynew/fines", { ...form, colid: global1.colid, user: global1.user });
    setForm({ status: "Active" });
    await load();
  };
  const columns = [
    { field: "category", headerName: "Category", flex: 1, minWidth: 180 },
    { field: "fineperday", headerName: "Fine/Day", minWidth: 120 },
    { field: "graceperioddays", headerName: "Grace Days", minWidth: 120 },
    { field: "maxfine", headerName: "Max Fine", minWidth: 120 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "actions", type: "actions", width: 100, getActions: (p) => [
      <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => setForm({ ...p.row, id: p.row._id })} />,
      <GridActionsCellItem icon={<Delete />} label="Delete" onClick={async () => { await ep1.post("/api/v2/librarynew/fines/delete", { id: p.row._id, colid: global1.colid }); load(); }} />
    ] }
  ];
  return (
    <MenuPageShell title="Library Fine Details">
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {["category", "fineperday", "graceperioddays", "maxfine", "status", "remarks"].map((field) => (
              <Grid item xs={12} md={2} key={field}><TextField fullWidth size="small" label={field} type={["fineperday", "graceperioddays", "maxfine"].includes(field) ? "number" : "text"} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /></Grid>
            ))}
            <Grid item xs={12}><Button variant="contained" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button></Grid>
          </Grid>
        </Paper>
        <Box sx={{ height: 520 }}><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} slots={{ toolbar: GridToolbar }} /></Box>
      </Stack>
    </MenuPageShell>
  );
}

function useLibrarySearch() {
  const { libraries } = useLibraryList(false);
  const [libraryid, setLibraryid] = useState("");
  const [bookRows, setBookRows] = useState([]);
  const [bookOptions, setBookOptions] = useState({});
  const [studentRows, setStudentRows] = useState([]);
  const [studentOptions, setStudentOptions] = useState({});
  const [bookFilters, setBookFilters] = useState([{ field: "title", value: "" }]);
  const [studentFilters, setStudentFilters] = useState([{ field: "name", value: "" }]);
  const loadBooks = async () => {
    const params = { colid: global1.colid, user: global1.user };
    if (libraryid) params.libraryid = libraryid;
    bookFilters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/books", { params });
    setBookRows(res.data?.data || []);
    setBookOptions(res.data?.options || {});
  };
  const loadStudents = async () => {
    const params = { colid: global1.colid };
    studentFilters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/students", { params });
    setStudentRows(res.data?.data || []);
    setStudentOptions(res.data?.options || {});
  };
  useEffect(() => { loadBooks(); loadStudents(); }, []);
  return { libraries, libraryid, setLibraryid, bookRows, bookOptions, studentRows, studentOptions, bookFilters, setBookFilters, studentFilters, setStudentFilters, loadBooks, loadStudents };
}

export function LibraryIssuePage() {
  const s = useLibrarySearch();
  const [book, setBook] = useState(null);
  const [student, setStudent] = useState(null);
  const [issue, setIssue] = useState({ issuetype: "Regular", issuedate: shortDate(new Date()), duedate: "" });
  const [message, setMessage] = useState("");
  const issueBook = async () => {
    const res = await ep1.post("/api/v2/librarynew/issue", {
      colid: global1.colid,
      libraryid: book?.libraryid,
      accessionno: book?.accessionno,
      regno: student?.regno,
      student: student?.name,
      email: student?.email || student?.user,
      phone: student?.phone,
      ...issue,
      user: global1.user
    });
    setMessage(`Book issued: ${res.data?.data?.accessionno}`);
    setBook(null); setStudent(null);
    s.loadBooks();
  };
  return (
    <MenuPageShell title="Library Issue Book">
      <Stack spacing={2}>
        {message && <Alert severity="success">{message}</Alert>}
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={900}>Search Book</Typography>
          <Box sx={{ mb: 2, maxWidth: 420 }}><LibrarySelect libraries={s.libraries} value={s.libraryid} onChange={s.setLibraryid} allowAll /></Box>
          <FieldFilters fields={bookFields} options={s.bookOptions} filters={s.bookFilters} setFilters={s.setBookFilters} />
          <Button onClick={s.loadBooks} variant="contained" sx={{ mt: 1 }}>Apply Book Filter</Button>
          <Autocomplete sx={{ mt: 2 }} options={s.bookRows.filter((row) => /^Available$/i.test(row.status || ""))} value={book} onChange={(_, v) => setBook(v)} getOptionLabel={(o) => `${o.accessionno || ""} - ${o.title || ""} - ${o.status || ""}`} renderInput={(params) => <TextField {...params} label="Select or scan accession no" />} />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={900}>Search Student</Typography>
          <FieldFilters fields={studentFields} options={s.studentOptions} filters={s.studentFilters} setFilters={s.setStudentFilters} />
          <Button onClick={s.loadStudents} variant="contained" sx={{ mt: 1 }}>Apply Student Filter</Button>
          <Autocomplete sx={{ mt: 2 }} options={s.studentRows} value={student} onChange={(_, v) => setStudent(v)} getOptionLabel={(o) => `${o.name || ""} - ${o.regno || ""} - ${o.email || o.user || ""}`} renderInput={(params) => <TextField {...params} label="Select student" />} />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Issue Type" value={issue.issuetype} onChange={(e) => setIssue({ ...issue, issuetype: e.target.value })}>{issueTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Issue Date" InputLabelProps={{ shrink: true }} value={issue.issuedate} onChange={(e) => setIssue({ ...issue, issuedate: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Return Due Date" InputLabelProps={{ shrink: true }} value={issue.duedate} onChange={(e) => setIssue({ ...issue, duedate: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" sx={{ height: 56 }} disabled={!book || !student} onClick={issueBook}>Issue Book</Button></Grid>
          </Grid>
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}

export function LibraryReturnPage() {
  const { libraries } = useLibraryList(false);
  const [libraryid, setLibraryid] = useState("");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const load = async () => {
    const params = { colid: global1.colid, user: global1.user, status: "Issued" };
    if (libraryid) params.libraryid = libraryid;
    const res = await ep1.get("/api/v2/librarynew/issues", { params });
    setRows(res.data?.data || []);
  };
  useEffect(() => { load(); }, []);
  const returnBook = async (row) => {
    const res = await ep1.post("/api/v2/librarynew/return", { id: row._id, colid: global1.colid, returndate: shortDate(new Date()), user: global1.user });
    setMessage(`Book returned. Fine added: Rs. ${money(res.data?.fineamount)}`);
    load();
  };
  const columns = [
    { field: "libraryname", headerName: "Library", minWidth: 170 },
    { field: "accessionno", headerName: "Accession No", minWidth: 130 },
    { field: "title", headerName: "Title", minWidth: 230, flex: 1 },
    { field: "classification", headerName: "Classification", minWidth: 150 },
    { field: "publisher", headerName: "Publisher", minWidth: 150 },
    { field: "keywords", headerName: "Keywords", minWidth: 200 },
    { field: "student", headerName: "Student", minWidth: 180 },
    { field: "regno", headerName: "Reg No", minWidth: 130 },
    { field: "issuedate", headerName: "Issue Date", minWidth: 120, valueGetter: (p) => shortDate(p.row.issuedate) },
    { field: "duedate", headerName: "Due Date", minWidth: 120, valueGetter: (p) => shortDate(p.row.duedate) },
    { field: "actions", type: "actions", width: 100, getActions: (p) => [<GridActionsCellItem icon={<Save />} label="Return" onClick={() => returnBook(p.row)} />] }
  ];
  return <MenuPageShell title="Library Return Book"><Stack spacing={2}>{message && <Alert severity="success">{message}</Alert>}<Paper sx={{ p: 2 }}><Box sx={{ maxWidth: 420 }}><LibrarySelect libraries={libraries} value={libraryid} onChange={setLibraryid} allowAll /></Box><Button sx={{ mt: 1 }} variant="contained" onClick={load}>Apply</Button></Paper><Box sx={{ height: 620 }}><DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} slots={{ toolbar: GridToolbar }} /></Box></Stack></MenuPageShell>;
}

export function LibraryReportsPage() {
  const { libraries } = useLibraryList(false);
  const [rows, setRows] = useState([]);
  const [cards, setCards] = useState({});
  const [summaries, setSummaries] = useState({});
  const [filters, setFilters] = useState({ fromdate: "", todate: "", libraryid: "" });
  const load = async () => {
    const res = await ep1.get("/api/v2/librarynew/reports", { params: { colid: global1.colid, user: global1.user, ...filters } });
    setRows(res.data?.data || []);
    setCards(res.data?.cards || {});
    setSummaries(res.data?.summaries || {});
  };
  useEffect(() => { load(); }, []);
  const print = () => {
    const html = document.getElementById("library-report-print")?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<html><body>${html}</body></html>`);
    win.document.close(); win.print();
  };
  const columns = [
    { field: "libraryname", headerName: "Library", width: 160 },
    { field: "issuedate", headerName: "Issue Date", width: 120, valueGetter: (p) => shortDate(p.row.issuedate) },
    { field: "accessionno", headerName: "Accession", width: 120 },
    { field: "title", headerName: "Title", minWidth: 220, flex: 1 },
    { field: "classification", headerName: "Classification", width: 150 },
    { field: "publisher", headerName: "Publisher", width: 150 },
    { field: "keywords", headerName: "Keywords", width: 200 },
    { field: "student", headerName: "Student", minWidth: 180 },
    { field: "programcode", headerName: "Program", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "fineamount", headerName: "Fine", width: 100 }
  ];
  return (
    <MenuPageShell title="Library Reports">
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}><Stack direction="row" spacing={2} flexWrap="wrap"><Box sx={{ minWidth: 280 }}><LibrarySelect libraries={libraries} value={filters.libraryid} onChange={(libraryid) => setFilters({ ...filters, libraryid })} allowAll /></Box><TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.fromdate} onChange={(e) => setFilters({ ...filters, fromdate: e.target.value })} /><TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.todate} onChange={(e) => setFilters({ ...filters, todate: e.target.value })} /><Button variant="contained" onClick={load}>Apply</Button><Button variant="outlined" startIcon={<Print />} onClick={print}>Print</Button></Stack></Paper>
        <Box id="library-report-print">
          <Grid container spacing={2}>{Object.entries(cards).map(([k, v]) => <Grid item xs={6} md={2} key={k}><Card><CardContent><Typography variant="caption">{k}</Typography><Typography variant="h6" fontWeight={900}>{money(v)}</Typography></CardContent></Card></Grid>)}</Grid>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Categorywise Issues</Typography><ResponsiveContainer width="100%" height="90%"><BarChart data={summaries.category || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><ChartTooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} md={6}><Paper sx={{ p: 2, height: 320 }}><Typography fontWeight={900}>Status</Typography><ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={summaries.status || []} dataKey="count" nameKey="label" label>{(summaries.status || []).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><ChartTooltip /><Legend /></PieChart></ResponsiveContainer></Paper></Grid>
          </Grid>
          <Box sx={{ height: 520, mt: 2 }}><DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} slots={{ toolbar: GridToolbar }} /></Box>
        </Box>
      </Stack>
    </MenuPageShell>
  );
}

export function StudentLibraryIssuedPage() {
  const { libraries } = useLibraryList(true);
  const [libraryid, setLibraryid] = useState("");
  const [rows, setRows] = useState([]);
  const load = async () => {
    const params = { colid: global1.colid, regno: global1.regno, email: global1.user };
    if (libraryid) params.libraryid = libraryid;
    const res = await ep1.get("/api/v2/librarynew/student-issues", { params });
    setRows(res.data?.data || []);
  };
  useEffect(() => { load(); }, []);
  const columns = [
    { field: "libraryname", headerName: "Library", width: 160 },
    { field: "accessionno", headerName: "Accession", width: 130 },
    { field: "title", headerName: "Title", minWidth: 240, flex: 1 },
    { field: "classification", headerName: "Classification", width: 150 },
    { field: "publisher", headerName: "Publisher", width: 150 },
    { field: "keywords", headerName: "Keywords", width: 200 },
    { field: "issuedate", headerName: "Issue Date", width: 120, valueGetter: (p) => shortDate(p.row.issuedate) },
    { field: "duedate", headerName: "Due Date", width: 120, valueGetter: (p) => shortDate(p.row.duedate) },
    { field: "returndate", headerName: "Return Date", width: 120, valueGetter: (p) => shortDate(p.row.returndate) },
    { field: "status", headerName: "Status", width: 120 },
    { field: "fineamount", headerName: "Fine", width: 100 }
  ];
  return <MenuPageShell title="My Library Books" menuType="student"><Stack spacing={2}><Paper sx={{ p: 2 }}><Box sx={{ maxWidth: 420 }}><LibrarySelect libraries={libraries} value={libraryid} onChange={setLibraryid} allowAll /></Box><Button sx={{ mt: 1 }} variant="contained" onClick={load}>Apply</Button></Paper><Box sx={{ height: 620 }}><DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} slots={{ toolbar: GridToolbar }} /></Box></Stack></MenuPageShell>;
}

export function StudentLibraryOpacPage() {
  const { libraries } = useLibraryList(true);
  const [libraryid, setLibraryid] = useState("");
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: "title", value: "" }]);
  const [message, setMessage] = useState("");
  const load = async () => {
    const params = { colid: global1.colid };
    if (libraryid) params.libraryid = libraryid;
    filters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/opac", { params });
    setRows(res.data?.data || []);
    setOptions(res.data?.options || {});
  };
  useEffect(() => { load(); }, []);
  const request = async (row) => {
    const res = await ep1.post("/api/v2/librarynew/request", { colid: global1.colid, bookid: row._id, regno: global1.regno, user: global1.user });
    setMessage(`Request created for ${res.data?.data?.title}`);
  };
  const columns = [
    { field: "libraryname", headerName: "Library", width: 160 },
    { field: "accessionno", headerName: "Accession", width: 130 },
    { field: "title", headerName: "Title", minWidth: 250, flex: 1 },
    { field: "author", headerName: "Author", minWidth: 180 },
    { field: "classification", headerName: "Classification", minWidth: 160 },
    { field: "publisher", headerName: "Publisher", minWidth: 160 },
    { field: "publisheraddress", headerName: "Publisher Address", minWidth: 220 },
    { field: "invoiceno", headerName: "Invoice No", width: 130 },
    { field: "invoicedate", headerName: "Invoice Date", width: 125, valueGetter: (p) => shortDate(p.row.invoicedate) },
    { field: "keywords", headerName: "Keywords", minWidth: 220 },
    { field: "category", headerName: "Category", width: 130 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "actions", type: "actions", width: 110, getActions: (p) => [<GridActionsCellItem icon={<Save />} label="Request" disabled={!/^Available$/i.test(p.row.status || "")} onClick={() => request(p.row)} />] }
  ];
  return <MenuPageShell title="Library OPAC" menuType="student"><Stack spacing={2}>{message && <Alert severity="success">{message}</Alert>}<Paper sx={{ p: 2 }}><Box sx={{ mb: 2, maxWidth: 420 }}><LibrarySelect libraries={libraries} value={libraryid} onChange={setLibraryid} allowAll /></Box><FieldFilters fields={bookFields} options={options} filters={filters} setFilters={setFilters} /><Button sx={{ mt: 1 }} variant="contained" onClick={load}>Search</Button></Paper><Box sx={{ height: 580 }}><DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} slots={{ toolbar: GridToolbar }} /></Box></Stack></MenuPageShell>;
}

export function LibraryRequestsPage() {
  const { libraries } = useLibraryList(false);
  const [libraryid, setLibraryid] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState([{ field: "student", value: "" }]);
  const [options, setOptions] = useState({});
  const load = async () => {
    const params = { colid: global1.colid, user: global1.user };
    if (libraryid) params.libraryid = libraryid;
    filters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get("/api/v2/librarynew/requests", { params });
    setRows(res.data?.data || []);
    setOptions(res.data?.options || {});
  };
  useEffect(() => { load(); }, []);
  const issue = async (row) => {
    await ep1.post("/api/v2/librarynew/issue", { colid: global1.colid, libraryid: row.libraryid, accessionno: row.accessionno, regno: row.regno, requestid: row._id, issuedate: shortDate(new Date()), user: global1.user });
    load();
  };
  const reject = async (row) => {
    await ep1.post("/api/v2/librarynew/request/reject", { colid: global1.colid, id: row._id, user: global1.user, remarks: "Rejected by librarian" });
    load();
  };
  const columns = [
    { field: "libraryname", headerName: "Library", width: 160 },
    { field: "requestdate", headerName: "Request Date", width: 130, valueGetter: (p) => shortDate(p.row.requestdate) },
    { field: "student", headerName: "Student", minWidth: 180 },
    { field: "regno", headerName: "Reg No", width: 130 },
    { field: "title", headerName: "Book", minWidth: 240, flex: 1 },
    { field: "accessionno", headerName: "Accession", width: 130 },
    { field: "classification", headerName: "Classification", minWidth: 160 },
    { field: "publisher", headerName: "Publisher", minWidth: 160 },
    { field: "publisheraddress", headerName: "Publisher Address", minWidth: 220 },
    { field: "invoiceno", headerName: "Invoice No", width: 130 },
    { field: "invoicedate", headerName: "Invoice Date", width: 125, valueGetter: (p) => shortDate(p.row.invoicedate) },
    { field: "keywords", headerName: "Keywords", minWidth: 220 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "actions", type: "actions", width: 120, getActions: (p) => [<GridActionsCellItem icon={<Save />} label="Issue" disabled={!/^Requested$/i.test(p.row.status || "")} onClick={() => issue(p.row)} />, <GridActionsCellItem icon={<Delete />} label="Reject" disabled={!/^Requested$/i.test(p.row.status || "")} onClick={() => reject(p.row)} />] }
  ];
  return <MenuPageShell title="Library Requests"><Stack spacing={2}><Paper sx={{ p: 2 }}><Box sx={{ mb: 2, maxWidth: 420 }}><LibrarySelect libraries={libraries} value={libraryid} onChange={setLibraryid} allowAll /></Box><FieldFilters fields={["student", "regno", "email", "programcode", "semester", "title", "accessionno", "classification", "publisher", "publisheraddress", "keywords", "invoiceno", "status"]} options={options} filters={filters} setFilters={setFilters} /><Button sx={{ mt: 1 }} variant="contained" onClick={load}>Apply</Button></Paper><Box sx={{ height: 620 }}><DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} slots={{ toolbar: GridToolbar }} /></Box></Stack></MenuPageShell>;
}

function LibraryMovementPage({ mode }) {
  const isLoan = mode === "loan";
  const title = isLoan ? "Inter Library Loan" : "Inter Library Transfer";
  const endpoint = isLoan ? "loans" : "transfers";
  const s = useLibrarySearch();
  const { libraries: allLibraries } = useLibraryList(true);
  const [book, setBook] = useState(null);
  const [toLibrary, setToLibrary] = useState("");
  const [form, setForm] = useState({ remarks: "", duedate: "" });
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [filters, setFilters] = useState([{ field: "status", value: "" }]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    const params = { colid: global1.colid };
    filters.forEach((f) => { if (f.field && f.value) params[f.field] = f.value; });
    const res = await ep1.get(`/api/v2/librarynew/${endpoint}`, { params });
    setRows(res.data?.data || []);
    setOptions(res.data?.options || {});
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!book || !toLibrary) return;
    setLoading(true);
    await ep1.post(`/api/v2/librarynew/${endpoint}`, { colid: global1.colid, bookid: book._id, tolibraryid: toLibrary, ...form, user: global1.user });
    setBook(null); setToLibrary(""); setForm({ remarks: "", duedate: "" });
    await load();
    setLoading(false);
  };
  const approve = async (row, status) => {
    setLoading(true);
    await ep1.post(`/api/v2/librarynew/${endpoint}/approve`, { colid: global1.colid, id: row._id, status, user: global1.user, remarks: row.remarks || "" });
    await load();
    setLoading(false);
  };
  const print = () => {
    const html = document.getElementById(`library-${endpoint}-print`)?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<html><body>${html}</body></html>`);
    win.document.close(); win.print();
  };
  const movementFields = ["accessionno", "title", "classification", "publisher", "publisheraddress", "keywords", "invoiceno", "fromlibraryname", "tolibraryname", "status"];
  const columns = [
    { field: "accessionno", headerName: "Accession", minWidth: 130 },
    { field: "title", headerName: "Title", minWidth: 230, flex: 1 },
    { field: "classification", headerName: "Classification", minWidth: 160 },
    { field: "publisher", headerName: "Publisher", minWidth: 160 },
    { field: "publisheraddress", headerName: "Publisher Address", minWidth: 220 },
    { field: "invoiceno", headerName: "Invoice No", minWidth: 130 },
    { field: "invoicedate", headerName: "Invoice Date", minWidth: 125, valueGetter: (p) => shortDate(p.row.invoicedate) },
    { field: "keywords", headerName: "Keywords", minWidth: 220 },
    { field: "fromlibraryname", headerName: "From Library", minWidth: 180 },
    { field: "tolibraryname", headerName: "To Library", minWidth: 180 },
    { field: isLoan ? "loandate" : "transferdate", headerName: "Date", minWidth: 120, valueGetter: (p) => shortDate(p.row[isLoan ? "loandate" : "transferdate"]) },
    ...(isLoan ? [{ field: "duedate", headerName: "Due Date", minWidth: 120, valueGetter: (p) => shortDate(p.row.duedate) }] : []),
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "actions", type: "actions", width: 150, getActions: (p) => [
      <GridActionsCellItem icon={<CheckCircle />} label="Approve" disabled={!/^Applied$/i.test(p.row.status || "")} onClick={() => approve(p.row, "Approved")} />,
      <GridActionsCellItem icon={<Delete />} label="Reject" disabled={!/^Applied$/i.test(p.row.status || "")} onClick={() => approve(p.row, "Rejected")} />
    ] }
  ];
  return (
    <MenuPageShell title={title}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={900}>Create {isLoan ? "Loan" : "Transfer"} Request</Typography>
          <Box sx={{ my: 2, maxWidth: 420 }}><LibrarySelect libraries={s.libraries} value={s.libraryid} onChange={s.setLibraryid} allowAll /></Box>
          <FieldFilters fields={bookFields} options={s.bookOptions} filters={s.bookFilters} setFilters={s.setBookFilters} />
          <Button onClick={s.loadBooks} variant="contained" sx={{ mt: 1 }}>Apply Book Filter</Button>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={5}><Autocomplete options={s.bookRows.filter((row) => /^Available$/i.test(row.status || ""))} value={book} onChange={(_, v) => setBook(v)} getOptionLabel={(o) => `${o.accessionno || ""} - ${o.title || ""} - ${o.libraryname || ""}`} renderInput={(params) => <TextField {...params} label="Select book" />} /></Grid>
            <Grid item xs={12} md={4}><LibrarySelect libraries={allLibraries.filter((row) => String(row._id) !== String(book?.libraryid || ""))} value={toLibrary} onChange={setToLibrary} label="To Library" /></Grid>
            {isLoan && <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={form.duedate || ""} onChange={(e) => setForm({ ...form, duedate: e.target.value })} /></Grid>}
            <Grid item xs={12} md={9}><TextField fullWidth label="Remarks" value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" sx={{ height: 56 }} disabled={loading || !book || !toLibrary} onClick={save}>{loading ? "Saving..." : "Create Request"}</Button></Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 2 }}><FieldFilters fields={movementFields} options={options} filters={filters} setFilters={setFilters} /><Stack direction="row" spacing={1} sx={{ mt: 1 }}><Button variant="contained" onClick={load}>Apply</Button><Button variant="outlined" startIcon={<Print />} onClick={print}>Print</Button></Stack></Paper>
        <Box id={`library-${endpoint}-print`} sx={{ height: 620 }}><Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>{title}</Typography><DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} loading={loading} slots={{ toolbar: GridToolbar }} pageSizeOptions={[25, 50, 100]} /></Box>
      </Stack>
    </MenuPageShell>
  );
}

export function LibraryTransferPage() {
  return <LibraryMovementPage mode="transfer" />;
}

export function LibraryLoanPage() {
  return <LibraryMovementPage mode="loan" />;
}
