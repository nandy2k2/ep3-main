import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Print, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import ep1 from "../api/ep1";
import global1 from "./global1";
import PlacementCoordinatorShell from "./PlacementCoordinatorShell";
import { openPurchase2PrintWindow } from "./Purchase2PrintTemplates";

const today = () => new Date().toISOString().slice(0, 10);
const key = (prefix) => `${prefix}-${Date.now()}`;
const text = (value) => String(value || "").trim();
const num = (value) => Number(value || 0);
const currentName = () => global1.name || global1.user || "NA";
const currentUser = () => global1.user || "NA";
const base = () => ({ colid: global1.colid, name: currentName(), user: currentUser() });
const statusOptions = ["Draft", "Submitted", "Approved", "Issued", "Rejected"];
const asArray = (model) => Array.from(model?.ids || model || []);
const sameEmail = (a, b) => text(a).toLowerCase() === text(b).toLowerCase();
const esc = (value) => text(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const getUserSignature = async (email = currentUser()) => {
  const rows = await getRows("usersignatureds", [{ field: "useremail", value: email }]);
  return rows.find((row) => text(row.status || "Active").toLowerCase() === "active") || rows[0] || {};
};
const loadUsers = async () => {
  const res = await ep1.get("/api/v2/hrattendance/options", { params: { colid: global1.colid } });
  return res.data?.users || [];
};
const calcLineTotal = (item) => {
  const amount = num(item.price || item.estimatedprice) * num(item.quantity);
  const gstAmount = amount * (num(item.gst) / 100);
  const discount = num(item.discount);
  return Number((amount + gstAmount - discount).toFixed(2));
};
const multiSelectProps = (selected = []) => ({
  multiple: true,
  renderValue: (values) => values.join(", ")
});
const loadPrintInstitution = async () => {
  try {
    const res = await ep1.get("/api/institution", { params: { colid: global1.colid } });
    const institution = Array.isArray(res.data) ? res.data[0] : res.data;
    if (institution) return institution;
  } catch (error) {
    // Fall back to the legacy PR config if the institution details page has no record yet.
  }
  try {
    const res = await ep1.get("/api/v2/getprconfigds2", { params: { colid: global1.colid } });
    return res.data?.data || {};
  } catch (error) {
    return {};
  }
};
const printPurchase2 = async (type, data) => {
  const institution = await loadPrintInstitution();
  openPurchase2PrintWindow(type, { ...(data || {}), institution });
};
const printStoreItems = async (rows = []) => {
  const institution = await loadPrintInstitution();
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;
  const logo = institution.logo || institution.logourl || institution.logoUrl || "";
  const name = institution.institution || institution.institutionname || institution.name || "Institution";
  const address = institution.address || institution.institutionaddress || "";
  win.document.write(`<!doctype html><html><head><title>Store Items</title><style>
    @page{size:A4 portrait;margin:14mm}body{font-family:Arial,sans-serif;color:#000;background:#fff;margin:0}.toolbar{padding:10px;text-align:right}.print{padding:20px}.header{text-align:center;border-bottom:1px solid #000;padding-bottom:10px;margin-bottom:12px}.logo{max-height:64px;float:left}.title{font-size:18px;font-weight:700;margin-top:10px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #000;padding:6px;text-align:left;vertical-align:top}th{background:#f1f1f1}.sign{display:flex;justify-content:space-between;margin-top:36px;font-size:12px}@media print{.toolbar{display:none}tr{break-inside:avoid}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div><div class="print"><div class="header">${logo ? `<img class="logo" src="${esc(logo)}" />` : ""}<div style="font-size:20px;font-weight:800">${esc(name)}</div><div>${esc(address)}</div><div class="title">STORE ITEM USER REPORT</div></div><table><thead><tr><th>Sr</th><th>Store</th><th>Item Code</th><th>Item</th><th>Category</th><th>Type</th><th>Unit</th><th>Quantity</th><th>Status</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${esc(row.storename || row.store)}</td><td>${esc(row.itemcode)}</td><td>${esc(row.itemname)}</td><td>${esc(row.category)}</td><td>${esc(row.type)}</td><td>${esc(row.unit)}</td><td>${esc(row.quantity)}</td><td>${esc(row.status)}</td></tr>`).join("")}</tbody></table><div class="sign"><span>Prepared by</span><span>Checked by</span><span>Approved by</span></div></div></body></html>`);
  win.document.close();
};

const getRows = async (model, filters = []) => {
  const res = await ep1.get(`/api/v2/purchase2/${model}`, { params: { colid: global1.colid, filters: JSON.stringify(filters) } });
  return res.data?.data || [];
};
const saveRow = async (model, payload) => {
  const res = await ep1.post(`/api/v2/purchase2/${model}`, { ...base(), ...payload });
  return res.data?.data;
};
const updateRow = async (model, row, patch) => saveRow(model, { ...row, id: row._id, ...patch });
const itemSearchText = (option = {}) => [
  option.itemname,
  option.item,
  option.itemcode,
  option.category,
  option.itemtype,
  option.type,
  option.unit
].map((part) => text(part).toLowerCase()).filter(Boolean).join(" ");
const itemLabel = (option = {}) => `${option.itemcode || ""} ${option.itemname || option.item || ""} ${option.category ? `(${option.category})` : ""}`.trim();
const itemRank = (option, query) => {
  const q = text(query).toLowerCase();
  const name = text(option.itemname || option.item).toLowerCase();
  const code = text(option.itemcode).toLowerCase();
  const category = text(option.category).toLowerCase();
  const haystack = itemSearchText(option);
  if (!q) return 0;
  if (name === q || code === q) return 0;
  if (name.startsWith(q)) return 1;
  if (code.startsWith(q)) return 2;
  if (name.includes(q)) return 3;
  if (code.includes(q)) return 4;
  if (category.includes(q)) return 5;
  if (haystack.includes(q)) return 6;
  return 99;
};
const filterItemOptions = (options = [], state = {}) => {
  const q = text(state.inputValue).toLowerCase();
  return options
    .filter((option) => !q || itemSearchText(option).includes(q))
    .sort((a, b) => itemRank(a, q) - itemRank(b, q) || itemLabel(a).localeCompare(itemLabel(b)))
    .slice(0, 100);
};

function Page({ title, subtitle, children, message, error }) {
  return (
    <PlacementCoordinatorShell title={title}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </Box>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {children}
    </PlacementCoordinatorShell>
  );
}

function ItemsEditor({ items, setItems, showMake = false, showPrice = false, showUnit = false, disabled = false }) {
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [make, setMake] = useState("");
  const [unit, setUnit] = useState(null);
  const [estimatedprice, setEstimatedprice] = useState("");
  const [masters, setMasters] = useState([]);
  const [units, setUnits] = useState([]);
  useEffect(() => { getRows("itemmasterds2").then(setMasters); }, []);
  useEffect(() => { if (showUnit) getRows("itemunitds2").then(setUnits); }, [showUnit]);
  const add = () => {
    if (!item) return;
    if (showUnit && !unit) return;
    const quantity = num(qty);
    const rate = num(estimatedprice);
    setItems([...items, {
      itemid: item._id,
      itemcode: item.itemcode,
      itemname: item.itemname,
      category: item.category,
      itemtype: item.itemtype,
      unit: showUnit ? unit.unitname || unit.unitcode : item.unit,
      unitcode: showUnit ? unit.unitcode || "" : item.unitcode || "",
      make,
      quantity,
      estimatedprice: rate,
      estimatedtotal: quantity * rate,
      approvedquantity: 0,
      issuedquantity: 0,
      remarks: ""
    }]);
    setItem(null);
    setQty(1);
    setUnit(null);
    setMake("");
    setEstimatedprice("");
  };
  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={showMake || showPrice || showUnit ? 3 : 7}>
          <Autocomplete options={masters} filterOptions={filterItemOptions} value={item} onChange={(_, value) => setItem(value)} getOptionLabel={itemLabel} renderInput={(params) => <TextField {...params} label="Search item" size="small" />} />
        </Grid>
        <Grid item xs={12} md={2}><TextField size="small" type="number" label="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} fullWidth /></Grid>
        {showUnit && <Grid item xs={12} md={2}><Autocomplete options={units} value={unit} onChange={(_, value) => setUnit(value)} getOptionLabel={(option) => `${option.unitname || ""} ${option.unitcode ? `(${option.unitcode})` : ""}`} renderInput={(params) => <TextField {...params} label="Unit" size="small" />} /></Grid>}
        {showMake && <Grid item xs={12} md={2}><TextField size="small" label="Make" value={make} onChange={(e) => setMake(e.target.value)} fullWidth /></Grid>}
        {showPrice && <Grid item xs={12} md={2}><TextField size="small" type="number" label="Estimated price" value={estimatedprice} onChange={(e) => setEstimatedprice(e.target.value)} fullWidth /></Grid>}
        <Grid item xs={12} md={2}><Button startIcon={<Add />} variant="contained" onClick={add} disabled={disabled}>Add item</Button></Grid>
      </Grid>
      <DataGrid sx={{ mt: 2 }} autoHeight density="compact" rows={items.map((row, index) => ({ ...row, id: index }))} columns={[
        { field: "itemcode", headerName: "Code", width: 130 },
        { field: "itemname", headerName: "Item", flex: 1, minWidth: 180 },
        { field: "category", headerName: "Category", width: 140 },
        { field: "make", headerName: "Make", width: 130 },
        { field: "unit", headerName: "Unit", width: 100 },
        { field: "quantity", headerName: "Qty", width: 110, type: "number" },
        { field: "estimatedprice", headerName: "Est. price", width: 120, type: "number" },
        { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 180, editable: !disabled },
        { field: "actions", headerName: "Action", width: 110, renderCell: (params) => <Button color="error" size="small" disabled={disabled} onClick={() => setItems(items.filter((_, idx) => idx !== params.row.id))}>Remove</Button> }
      ]} processRowUpdate={(row) => { setItems(items.map((it, idx) => idx === row.id ? { ...it, remarks: row.remarks || "" } : it)); return row; }} />
    </Paper>
  );
}

function usePurchase2Basics() {
  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeAccess, setStoreAccess] = useState([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [deptRows, storeRows, accessRows] = await Promise.all([getRows("departmentindentds"), getRows("storemasterds2"), getRows("storeusersds2")]);
      setDepartments(deptRows);
      setStoreAccess(accessRows);
      const email = text(global1.user).toLowerCase();
      const allowedIds = new Set(accessRows.filter((row) => [row.userid, row.user, row.storeuser].map((v) => text(v).toLowerCase()).includes(email)).map((row) => text(row.storeid)));
      const allowedNames = new Set(accessRows.filter((row) => [row.userid, row.user, row.storeuser].map((v) => text(v).toLowerCase()).includes(email)).map((row) => text(row.store)));
      setStores(storeRows.filter((store) => allowedIds.has(text(store._id)) || allowedIds.has(text(store.storeid)) || allowedNames.has(text(store.storename)) || !accessRows.length));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };
  useEffect(() => { load(); }, []);
  return { departments, stores, storeAccess, reloadBasics: load, basicsError: error };
}

export function Purchase2IndentRequestPage() {
  const { departments, stores, basicsError } = usePurchase2Basics();
  const [form, setForm] = useState({ year: "2026-27", departmentname: "", storeid: "", store: "", reqstatus: "Draft", reqdate: today(), remarks: "" });
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [currentIndent, setCurrentIndent] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSubmitted = text(currentIndent?.reqstatus).toLowerCase() === "submitted";
  const loadDrafts = async () => {
    const email = text(currentUser()).toLowerCase();
    const rows = await getRows("storerequisitionds2");
    setDrafts(rows.filter((row) => sameEmail(row.creatoruserid || row.requestedbyemail || row.user, email)).sort((a, b) => new Date(b.createdAt || b.reqdate || 0) - new Date(a.createdAt || a.reqdate || 0)));
  };
  useEffect(() => { loadDrafts(); }, []);
  const openIndent = async (row) => {
    if (!row) {
      setCurrentIndent(null);
      setForm({ year: "2026-27", departmentname: "", storeid: "", store: "", reqstatus: "Draft", reqdate: today(), remarks: "" });
      setItems([]);
      setPrintData(null);
      return;
    }
    const child = await getRows("storerequisitionitemsds2", [{ field: "requisitionid", value: row._id }]);
    const mappedItems = child.length ? child : [];
    setCurrentIndent(row);
    setForm({
      year: row.year || "2026-27",
      departmentname: row.departmentname || "",
      storeid: row.storeid || "",
      store: row.store || row.storename || "",
      reqstatus: row.reqstatus || "Draft",
      reqdate: row.reqdate ? String(row.reqdate).slice(0, 10) : today(),
      remarks: row.remarks || ""
    });
    setItems(mappedItems);
    setPrintData({ header: row, items: mappedItems });
  };
  const save = async (status = form.reqstatus) => {
    try {
      if (!form.departmentname || !form.storeid || !items.length) throw new Error("Select department, store and at least one item");
      if (isSubmitted) throw new Error("Submitted indent cannot be edited");
      const reqid = currentIndent?.reqid || currentIndent?.requestno || key("IND");
      const headerPayload = { ...form, reqstatus: status, reqid, requestno: reqid, requestedby: currentIndent?.requestedby || currentName(), requestedbyemail: currentIndent?.requestedbyemail || currentUser(), creatoruserid: currentIndent?.creatoruserid || currentUser() };
      const header = currentIndent ? await updateRow("storerequisitionds2", currentIndent, headerPayload) : await saveRow("storerequisitionds2", headerPayload);
      await Promise.all(items.map((item) => item._id
        ? updateRow("storerequisitionitemsds2", item, { ...item, requisitionid: header._id, reqid, status })
        : saveRow("storerequisitionitemsds2", { ...item, requisitionid: header._id, reqid, status })));
      const savedItems = await getRows("storerequisitionitemsds2", [{ field: "requisitionid", value: header._id }]);
      setCurrentIndent(header);
      setItems(savedItems);
      setForm((prev) => ({ ...prev, reqstatus: status }));
      setMessage(status === "Submitted" ? "Indent submitted. No more items can be added." : "Indent draft saved. You can add more items before submission.");
      setPrintData({ header, items: savedItems });
      await loadDrafts();
    } catch (err) {
      setError(err.message);
    }
  };
  const creatorDepartments = useMemo(() => {
    const email = text(currentUser()).toLowerCase();
    return departments.filter((dept) => {
      const creators = [dept.creatoruserid, dept.creatoremail, dept.user].map((v) => text(v).toLowerCase()).filter(Boolean);
      return creators.includes(email);
    });
  }, [departments]);
  return (
    <Page title="Indent Request" subtitle="Request items from stores assigned to the logged-in user." message={message} error={error || basicsError}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Autocomplete options={drafts} value={currentIndent} getOptionLabel={(o) => `${o.requestno || o.reqid || o._id || ""} - ${o.reqstatus || ""}`} onChange={(_, v) => openIndent(v)} renderInput={(params) => <TextField {...params} label="Open existing indent" size="small" />} /></Grid>
          <Grid item xs={12} md={3}><Autocomplete options={creatorDepartments} getOptionLabel={(o) => o.departmentname || ""} onChange={(_, v) => setForm((p) => ({ ...p, departmentname: v?.departmentname || "" }))} renderInput={(params) => <TextField {...params} label="Department" size="small" helperText={!creatorDepartments.length ? "No department mapped to your creator user ID" : ""} />} /></Grid>
          <Grid item xs={12} md={3}><Autocomplete options={stores} getOptionLabel={(o) => o.storename || o.name || ""} onChange={(_, v) => setForm((p) => ({ ...p, storeid: v?._id || v?.storeid || "", store: v?.storename || "" }))} renderInput={(params) => <TextField {...params} label="Assigned store" size="small" />} /></Grid>
          <Grid item xs={12} md={2}><TextField size="small" type="date" label="Request date" value={form.reqdate} InputLabelProps={{ shrink: true }} onChange={(e) => setForm((p) => ({ ...p, reqdate: e.target.value }))} fullWidth /></Grid>
          <Grid item xs={12} md={2}><TextField select size="small" label="Status" value={form.reqstatus} onChange={(e) => setForm((p) => ({ ...p, reqstatus: e.target.value }))} fullWidth>{statusOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={2}><TextField size="small" label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} fullWidth /></Grid>
        </Grid>
      </Paper>
      {isSubmitted && <Alert severity="info" sx={{ mb: 2 }}>This indent has been submitted. Items are locked.</Alert>}
      <ItemsEditor items={items} setItems={setItems} disabled={isSubmitted} />
      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}><Button startIcon={<Save />} variant="contained" disabled={isSubmitted} onClick={() => save("Draft")}>Save draft</Button><Button variant="contained" color="success" disabled={isSubmitted} onClick={() => save("Submitted")}>Submit</Button><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("indent", printData)}>Print indent</Button><Button variant="outlined" onClick={() => openIndent(null)}>New indent</Button></Stack>
    </Page>
  );
}

export function Purchase2IndentPrintPage() {
  const [indents, setIndents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [message] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const rows = await getRows("storerequisitionds2");
      setIndents(rows.sort((a, b) => new Date(b.createdAt || b.reqdate || 0) - new Date(a.createdAt || a.reqdate || 0)));
    } catch (err) {
      setError(err.message || "Unable to load indents");
    }
  };
  useEffect(() => { load(); }, []);
  const open = async (row) => {
    setSelected(row);
    if (!row) {
      setItems([]);
      return;
    }
    const child = await getRows("storerequisitionitemsds2", [{ field: "requisitionid", value: row._id }]);
    setItems(child.length ? child : []);
  };
  return (
    <Page title="Indent Print" subtitle="Select an indent number, view all mapped items, and print the complete indent." message={message} error={error}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <Autocomplete sx={{ minWidth: 420 }} options={indents} value={selected} getOptionLabel={(o) => `${o.requestno || o.reqid || o._id || ""} - ${o.departmentname || ""} - ${o.reqstatus || ""}`} onChange={(_, v) => open(v)} renderInput={(params) => <TextField {...params} label="Indent number" size="small" />} />
          <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
          <Button startIcon={<Print />} variant="contained" disabled={!selected} onClick={() => printPurchase2("indent", { header: selected, items })}>Print indent</Button>
        </Stack>
      </Paper>
      {selected && <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>{selected.requestno || selected.reqid || selected._id}</Typography>
        <Typography variant="body2" color="text.secondary">Department: {selected.departmentname || "-"} | Store: {selected.store || selected.storename || "-"} | Status: {selected.reqstatus || selected.status || "-"}</Typography>
      </Paper>}
      <Paper sx={{ p: 2 }}>
        <DataGrid autoHeight rows={items.map((row) => ({ ...row, id: row._id || row.itemid || row.itemcode }))} columns={[
          { field: "itemcode", headerName: "Item Code", width: 140 },
          { field: "itemname", headerName: "Item", flex: 1, minWidth: 220 },
          { field: "category", headerName: "Category", width: 150 },
          { field: "unit", headerName: "Unit", width: 100 },
          { field: "quantity", headerName: "Requested Qty", width: 140 },
          { field: "approvedquantity", headerName: "Approved Qty", width: 140 },
          { field: "issuedquantity", headerName: "Issued Qty", width: 120 },
          { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 180 }
        ]} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} />
      </Paper>
    </Page>
  );
}

export function Purchase2StoreRequestReviewPage() {
  const { stores, basicsError } = usePurchase2Basics();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const storeIds = new Set(stores.map((s) => text(s._id || s.storeid)));
    const storeNames = new Set(stores.map((s) => text(s.storename)));
    const [reqRows, stockRows] = await Promise.all([getRows("storerequisitionds2"), getRows("storeitemsds2")]);
    setRequests(reqRows.filter((r) => storeIds.has(text(r.storeid)) || storeNames.has(text(r.store))));
    setStock(stockRows);
  };
  useEffect(() => { if (stores.length) load(); }, [stores.length]);
  const open = async (row) => {
    setSelected(row);
    const child = await getRows("storerequisitionitemsds2", [{ field: "requisitionid", value: row._id }]);
    setItems(child.length ? child : [{ ...row, requisitionid: row._id, quantity: row.quantity }]);
  };
  const stockFor = (item, request = selected) => stock.find((s) => {
    const sameStore = text(s.storeid) === text(request?.storeid)
      || text(s.storeId) === text(request?.storeid)
      || text(s.storename).toLowerCase() === text(request?.store || request?.storename).toLowerCase();
    const sameItem = text(s.itemcode).toLowerCase() === text(item.itemcode).toLowerCase()
      || text(s.itemid) === text(item.itemid)
      || text(s.itemname).toLowerCase() === text(item.itemname).toLowerCase();
    return sameStore && sameItem;
  });
  const issue = async () => {
    try {
      if (!selected) throw new Error("Open an indent request first");
      let issuedAny = false;
      let issuedLess = false;
      const updatedItems = [];
      for (const item of items) {
        const available = stockFor(item);
        if (!available) throw new Error(`Store stock not found for ${item.itemname || item.itemcode}`);
        const requested = num(item.quantity);
        const availableQty = num(available.quantity);
        const requestedIssue = item.assignedquantity === "" || item.assignedquantity === undefined ? Math.min(requested, availableQty) : num(item.assignedquantity);
        const issueQty = Math.min(requestedIssue, requested, availableQty);
        if (requestedIssue > requested) throw new Error(`Issue quantity cannot exceed requested quantity for ${item.itemname}`);
        if (requestedIssue > availableQty) throw new Error(`Issue quantity cannot exceed available stock for ${item.itemname}`);
        if (issueQty <= 0) continue;
        issuedAny = true;
        if (issueQty < requested) issuedLess = true;
        await updateRow("storeitemsds2", available, { quantity: num(available.quantity) - issueQty });
        const itemPatch = { approvedquantity: issueQty, issuedquantity: issueQty, assignedquantity: issueQty, allotdate: today(), allottedby: currentName(), allottedbyemail: currentUser(), status: issueQty < requested ? "Partially Issued" : "Issued" };
        if (item._id) await updateRow("storerequisitionitemsds2", item, itemPatch);
        updatedItems.push({ ...item, ...itemPatch });
      }
      if (!issuedAny) throw new Error("No quantity available to issue");
      const finalStatus = issuedLess ? "Partially Issued" : "Issued";
      const header = await updateRow("storerequisitionds2", selected, { reqstatus: finalStatus, approvalStatus: finalStatus, allotdate: today(), allottedby: currentName(), allottedbyemail: currentUser() });
      setMessage("Items allotted and store stock updated");
      const displayItems = items.map((item) => updatedItems.find((updated) => updated._id === item._id || updated.itemcode === item.itemcode) || item);
      setItems(displayItems);
      setSelected({ ...selected, ...header });
      setPrintData({ header: { ...selected, ...header }, items: displayItems });
      await load();
    } catch (err) { setError(err.message); }
  };
  return (
    <Page title="Indent Approval and Item Allotment" subtitle="Approve indent requests for assigned stores, allot available quantities, and print the allotment document." message={message} error={error || basicsError}>
      <Paper sx={{ p: 2 }}><Button startIcon={<Refresh />} onClick={load}>Refresh</Button><DataGrid sx={{ mt: 1 }} autoHeight rows={requests.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "reqdate", headerName: "Date", width: 130 }, { field: "requestno", headerName: "Indent No", width: 170 }, { field: "departmentname", headerName: "Department", width: 180 }, { field: "requestedby", headerName: "Requested By", width: 180 }, { field: "store", headerName: "Store", width: 180 }, { field: "reqstatus", headerName: "Status", width: 150 }, { field: "actions", headerName: "Allot Items", width: 150, renderCell: (p) => <Button size="small" variant="contained" onClick={() => open(p.row)}>Allot items</Button> }]} slots={{ toolbar: GridToolbar }} /></Paper>
      {selected && <Paper sx={{ p: 2, mt: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}><Box><Typography variant="h6">Allot items for {selected.requestno || selected.reqid || selected._id}</Typography><Typography variant="body2" color="text.secondary">Enter an allotted quantity equal to or less than requested quantity and available stock.</Typography></Box><Chip label={selected.reqstatus || selected.status || "Open"} /></Stack><DataGrid autoHeight rows={items.map((item, i) => { const available = stockFor(item); const availableQty = num(available?.quantity); const previousQty = item.assignedquantity || item.issuedquantity || item.approvedquantity; return { ...item, id: i, available: availableQty, assignedquantity: previousQty === undefined || previousQty === "" ? Math.min(num(item.quantity), availableQty) : previousQty }; })} columns={[{ field: "itemcode", headerName: "Code", width: 130 }, { field: "itemname", headerName: "Item", flex: 1, minWidth: 220 }, { field: "unit", headerName: "Unit", width: 90 }, { field: "quantity", headerName: "Requested", width: 120 }, { field: "available", headerName: "Available", width: 120 }, { field: "assignedquantity", headerName: "Allotted Qty", width: 150, editable: true, type: "number" }, { field: "remarks", headerName: "Remarks", flex: 1, editable: true }]} processRowUpdate={(row) => { setItems(items.map((it, idx) => idx === row.id ? { ...it, assignedquantity: num(row.assignedquantity), approvedquantity: num(row.assignedquantity), remarks: row.remarks || "" } : it)); return row; }} /><Stack direction="row" spacing={1} sx={{ mt: 2 }}><Button variant="contained" onClick={issue}>Approve and allot items</Button><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("indent", printData)}>Print allotment</Button></Stack></Paper>}
    </Page>
  );
}

export function Purchase2StorePrRequestPage() {
  const { stores, basicsError } = usePurchase2Basics();
  const [form, setForm] = useState({ storeid: "", storename: "", requestdate: today(), priority: "Normal", status: "Draft", remarks: "" });
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadHistory = async () => {
    const email = text(currentUser()).toLowerCase();
    const rows = await getRows("storeprrequestds2");
    setHistory(rows.filter((row) => text(row.requestedbyemail).toLowerCase() === email));
  };
  useEffect(() => { loadHistory(); }, []);
  const save = async () => {
    try {
      if (!form.storeid || !items.length) throw new Error("Select store and add items");
      const prnumber = key("PR");
      const header = await saveRow("storeprrequestds2", { ...form, prnumber, requestedby: currentName(), requestedbyemail: currentUser(), status: "Submitted", totalamount: items.reduce((s, i) => s + num(i.estimatedtotal), 0) });
      await Promise.all(items.map((item) => saveRow("storeprrequestitemsds2", { ...item, prnumber, prrequestid: header._id, estimatedtotal: num(item.quantity) * num(item.estimatedprice) })));
      setMessage("PR request submitted");
      setPrintData({ header, items });
      setItems([]);
      await loadHistory();
    } catch (err) { setError(err.message); }
  };
  const openHistory = async (row) => {
    const child = await getRows("storeprrequestitemsds2", [{ field: "prnumber", value: row.prnumber }]);
    setHistoryItems(child);
    setPrintData({ header: row, items: child });
  };
  return (
    <Page title="Store PR Request" subtitle="Create purchase requisition requests from assigned stores." message={message} error={error || basicsError}>
      <Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={4}><Autocomplete options={stores} getOptionLabel={(o) => o.storename || ""} onChange={(_, v) => setForm((p) => ({ ...p, storeid: v?._id || v?.storeid || "", storename: v?.storename || "" }))} renderInput={(params) => <TextField {...params} label="Assigned store" size="small" />} /></Grid><Grid item xs={12} md={2}><TextField size="small" type="date" label="Date" value={form.requestdate} InputLabelProps={{ shrink: true }} onChange={(e) => setForm((p) => ({ ...p, requestdate: e.target.value }))} fullWidth /></Grid><Grid item xs={12} md={2}><TextField size="small" label="Priority" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} fullWidth /></Grid><Grid item xs={12} md={4}><TextField size="small" label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} fullWidth /></Grid></Grid></Paper>
      <ItemsEditor items={items} setItems={setItems} showMake showPrice />
      <Button sx={{ mt: 2 }} startIcon={<Save />} variant="contained" onClick={save}>Submit PR</Button>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("pr", printData)}>Print PR</Button></Stack>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" fontWeight={800}>My PR history</Typography>
        <DataGrid autoHeight rows={history.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "prnumber", headerName: "PR Number", width: 180 }, { field: "storename", headerName: "Store", width: 180 }, { field: "status", headerName: "Status", width: 130 }, { field: "requestdate", headerName: "Date", width: 150 }, { field: "totalamount", headerName: "Total", width: 120 }, { field: "actions", headerName: "Print", width: 120, renderCell: (params) => <Button size="small" onClick={() => openHistory(params.row)}>Open</Button> }]} slots={{ toolbar: GridToolbar }} />
        {!!historyItems.length && <DataGrid sx={{ mt: 2 }} autoHeight rows={historyItems.map((r, i) => ({ ...r, id: i }))} columns={[{ field: "itemname", headerName: "Item", flex: 1 }, { field: "make", headerName: "Make", width: 140 }, { field: "quantity", headerName: "Qty", width: 100 }, { field: "estimatedprice", headerName: "Rate", width: 100 }]} />}
      </Paper>
    </Page>
  );
}

export function Purchase2PoAssignmentPage() {
  const [prs, setPrs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [assignee, setAssignee] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [prRows, userRes] = await Promise.all([getRows("storeprrequestds2"), ep1.get("/api/v2/hrattendance/options", { params: { colid: global1.colid } })]);
    setPrs(prRows);
    setUsers(userRes.data?.users || []);
  };
  useEffect(() => { load(); }, []);
  const assign = async () => {
    try {
      if (!selected.length || !assignee) throw new Error("Select PR requests and assignee");
      await Promise.all(selected.map((id) => {
        const row = prs.find((pr) => pr._id === id);
        return saveRow("storepoassignmentds2", { requestid: id, prnumber: row?.prnumber, assignedto: assignee.name, assignedtoemail: assignee.email || assignee.user, assignedby: currentName(), assignedbyemail: currentUser(), assigneddate: today(), status: "Assigned", remarks });
      }));
      setMessage("PR requests assigned for PO creation");
      setSelected([]);
    } catch (err) { setError(err.message); }
  };
  return <Page title="Assign Store Requests for PO Creation" subtitle="Assign approved store PR requests to PO creators." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2}><Autocomplete sx={{ minWidth: 320 }} options={users} getOptionLabel={(o) => `${o.name || ""} ${o.email || o.user || ""}`} value={assignee} onChange={(_, v) => setAssignee(v)} renderInput={(params) => <TextField {...params} label="PO creator" size="small" />} /><TextField size="small" label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} /><Button variant="contained" onClick={assign}>Assign</Button></Stack></Paper><Paper sx={{ p: 2 }}><DataGrid autoHeight checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} rows={prs.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "prnumber", headerName: "PR", width: 180 }, { field: "storename", headerName: "Store", width: 180 }, { field: "status", headerName: "Status", width: 130 }, { field: "requestdate", headerName: "Date", width: 130 }, { field: "remarks", headerName: "Remarks", flex: 1 }]} slots={{ toolbar: GridToolbar }} /></Paper></Page>;
}

export function Purchase2LocalPoPage() {
  const [vendors, setVendors] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [make, setMake] = useState("");
  const [terms, setTerms] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const ven = await getRows("vendorsds2");
    setVendors(ven);
  };
  useEffect(() => { load(); }, []);
  const createPo = async () => {
    try {
      if (!vendor || !items.length) throw new Error("Select vendor and add items");
      const poid = key("PO");
      const priced = await Promise.all(items.map(async (item) => {
        const rates = await getRows("vendoritemsds2", [{ field: "vendorid", value: vendor._id }, { field: "itemid", value: item.itemid }]);
        const rate = rates[0]?.price || item.estimatedprice || 0;
        const detail = rates[0] || {};
        return { ...item, make: item.make || make, price: rate, gst: detail.gst || item.gst || 0, discount: detail.discount || 0, terms: detail.terms || "", warranty: detail.warranty || "", total: calcLineTotal({ ...item, price: rate, gst: detail.gst, discount: detail.discount }) };
      }));
      const total = priced.reduce((sum, item) => sum + num(item.total), 0);
      const signature = await getUserSignature();
      const header = await saveRow("storepoorderds2", { poid, year: "2026-27", vendor: vendor.vendorname, vendorid: vendor._id, price: total, netprice: total, actualAmount: total, poType: "Local", postatus: "Draft", approvalStatus: "Draft", deliveryType: "Physical Delivery", terms, remarks, creatorName: currentName(), creatorEmail: currentUser(), creatorSignature: signature.signaturelink || "", description: "Local PO" });
      await Promise.all(priced.map((item) => saveRow("storepoitemsds2", { ...item, poid, vendor: vendor.vendorname, vendorid: vendor._id, postatus: "Draft" })));
      setMessage("Local PO created as draft");
      setPrintData({ header: { ...vendor, ...header, terms, remarks }, items: priced });
    } catch (err) { setError(err.message); }
  };
  return <Page title="Local PO Creation" subtitle="Create local purchase orders directly from item master and one selected vendor." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap"><Autocomplete sx={{ minWidth: 320 }} options={vendors} getOptionLabel={(o) => o.vendorname || o.name || ""} value={vendor} onChange={(_, v) => setVendor(v)} renderInput={(params) => <TextField {...params} label="Vendor" size="small" />} /><TextField size="small" label="Make" value={make} onChange={(e) => setMake(e.target.value)} /><TextField size="small" label="Terms and conditions" value={terms} onChange={(e) => setTerms(e.target.value)} /><TextField size="small" label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} /><Button variant="contained" onClick={createPo}>Create PO Draft</Button><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("localPo", printData)}>Print local PO</Button></Stack></Paper><ItemsEditor items={items} setItems={setItems} showMake showPrice showUnit /></Page>;
}

export function Purchase2StoreItemUserPage() {
  const { stores, basicsError } = usePurchase2Basics();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState([]);
  const [draft, setDraft] = useState({ field: "storename", value: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fields = ["storename", "itemcode", "itemname", "category", "type", "unit", "status"];
  const load = async () => {
    try {
      const storeIds = new Set(stores.map((s) => text(s._id || s.storeid)));
      const storeNames = new Set(stores.map((s) => text(s.storename || s.store)));
      const stockRows = await getRows("storeitemsds2");
      setRows(stockRows.filter((row) => storeIds.has(text(row.storeid)) || storeNames.has(text(row.storename || row.store))));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load store items");
    }
  };
  useEffect(() => { if (stores.length) load(); }, [stores.length]);
  const filteredRows = rows.filter((row) => filters.every((filter) => text(row[filter.field]).toLowerCase().includes(text(filter.value).toLowerCase())));
  const valueOptions = Array.from(new Set(rows.map((row) => text(row[draft.field])).filter(Boolean))).sort();
  return (
    <Page title="Store Item User" subtitle="View only the stock items available in stores assigned to the logged-in user." message={message} error={error || basicsError}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <Autocomplete sx={{ minWidth: 220 }} options={fields} value={draft.field} onChange={(_, value) => setDraft({ field: value || "storename", value: "" })} renderInput={(params) => <TextField {...params} label="Filter field" size="small" />} />
          <Autocomplete freeSolo sx={{ minWidth: 260 }} options={valueOptions} value={draft.value} onInputChange={(_, value) => setDraft((p) => ({ ...p, value }))} renderInput={(params) => <TextField {...params} label="Filter value" size="small" />} />
          <Button variant="outlined" onClick={() => draft.field && draft.value && setFilters((prev) => [...prev, draft])}>Add filter</Button>
          <Button variant="text" onClick={() => setFilters([])}>Clear</Button>
          <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
          <Button startIcon={<Print />} variant="contained" onClick={() => printStoreItems(filteredRows)}>Print</Button>
        </Stack>
        {!!filters.length && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Active: {filters.map((f) => `${f.field}: ${f.value}`).join(", ")}</Typography>}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <DataGrid autoHeight rows={filteredRows.map((row) => ({ ...row, id: row._id }))} columns={[
          { field: "storename", headerName: "Store", flex: 1, minWidth: 180 },
          { field: "itemcode", headerName: "Item Code", width: 140 },
          { field: "itemname", headerName: "Item", flex: 1, minWidth: 220 },
          { field: "category", headerName: "Category", width: 150 },
          { field: "type", headerName: "Type", width: 130 },
          { field: "unit", headerName: "Unit", width: 100 },
          { field: "quantity", headerName: "Quantity", width: 120 },
          { field: "status", headerName: "Status", width: 130 }
        ]} slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "purchase2_store_item_user" } } }} />
      </Paper>
    </Page>
  );
}

export function Purchase2PoApprovalWorkflowPage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ level: 1, approvername: "", approveremail: "", role: "", status: "Active", remarks: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [workflow, userRows] = await Promise.all([getRows("storepoapprovalworkflowds2"), loadUsers()]);
    setRows(workflow);
    setUsers(userRows.filter((user) => text(user.role).toLowerCase() !== "student"));
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    try {
      if (!form.approveremail) throw new Error("Select approver");
      await saveRow("storepoapprovalworkflowds2", form);
      setMessage("PO approval level saved");
      setForm({ level: Number(form.level || 1) + 1, approvername: "", approveremail: "", role: "", status: "Active", remarks: "" });
      await load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this level?")) return;
    await ep1.post(`/api/v2/purchase2/storepoapprovalworkflowds2/delete`, { colid: global1.colid, id: row._id });
    await load();
  };
  return <Page title="PO Approval Workflow" subtitle="Define dynamic approval levels for Purchase 2 purchase orders." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={2}><TextField size="small" type="number" label="Level" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} fullWidth /></Grid><Grid item xs={12} md={4}><Autocomplete options={users} getOptionLabel={(o) => `${o.name || ""} ${o.email || o.user || ""}`} onChange={(_, v) => setForm((p) => ({ ...p, approvername: v?.name || "", approveremail: v?.email || v?.user || "", role: v?.role || "" }))} renderInput={(params) => <TextField {...params} label="Approver" size="small" />} /></Grid><Grid item xs={12} md={2}><TextField size="small" label="Role" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} fullWidth /></Grid><Grid item xs={12} md={2}><TextField select size="small" label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} fullWidth>{["Active", "Inactive"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={save}>Save level</Button></Grid></Grid></Paper><DataGrid autoHeight rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "level", headerName: "Level", width: 90 }, { field: "approvername", headerName: "Approver", flex: 1 }, { field: "approveremail", headerName: "Email", flex: 1 }, { field: "role", headerName: "Role", width: 160 }, { field: "status", headerName: "Status", width: 120 }, { field: "actions", headerName: "Action", width: 110, renderCell: (p) => <Button size="small" color="error" onClick={() => remove(p.row)}>Delete</Button> }]} slots={{ toolbar: GridToolbar }} /></Page>;
}

function Purchase2ManagePoPage({ admin = false }) {
  const [prs, setPrs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [pos, setPos] = useState([]);
  const [poItems, setPoItems] = useState([]);
  const [selectedPo, setSelectedPo] = useState(null);
  const [terms, setTerms] = useState("");
  const [warranty, setWarranty] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [prRows, assRows, poRows] = await Promise.all([getRows("storeprrequestds2"), getRows("storepoassignmentds2"), getRows("storepoorderds2")]);
    const email = text(currentUser()).toLowerCase();
    setPrs(prRows);
    setAssignments(admin ? assRows : assRows.filter((row) => sameEmail(row.assignedtoemail, email)));
    setPos(admin ? poRows : poRows.filter((row) => sameEmail(row.creatorEmail || row.user, email)));
  };
  useEffect(() => { load(); }, [admin]);
  const createPoFromAssignment = async (assignment) => {
    try {
      const items = await getRows("storeprrequestitemsds2", [{ field: "prnumber", value: assignment.prnumber }]);
      if (!items.length) throw new Error("No PR items found");
      const [vendors, vendorItems] = await Promise.all([getRows("vendorsds2"), getRows("vendoritemsds2")]);
      const matchingVendor = vendors.find((vendor) => items.every((item) => vendorItems.some((vi) => text(vi.vendorid) === text(vendor._id) && (text(vi.itemid) === text(item.itemid) || text(vi.item).toLowerCase() === text(item.itemname).toLowerCase()))));
      if (!matchingVendor) throw new Error("No single vendor found for all PR items in vendor item master");
      const poid = key("PO");
      const priced = items.map((item) => {
        const vi = vendorItems.find((row) => text(row.vendorid) === text(matchingVendor._id) && (text(row.itemid) === text(item.itemid) || text(row.item).toLowerCase() === text(item.itemname).toLowerCase())) || {};
        return { ...item, price: vi.price || item.estimatedprice || 0, gst: vi.gst || 0, discount: vi.discount || 0, vendor: matchingVendor.vendorname, vendorid: matchingVendor._id, total: calcLineTotal({ ...item, price: vi.price || item.estimatedprice, gst: vi.gst, discount: vi.discount }) };
      });
      const total = priced.reduce((sum, item) => sum + num(item.total), 0);
      const signature = await getUserSignature();
      const header = await saveRow("storepoorderds2", { poid, prnumber: assignment.prnumber, year: "2026-27", vendor: matchingVendor.vendorname, vendorid: matchingVendor._id, price: total, netprice: total, actualAmount: total, poType: "Standard", postatus: "Draft", approvalStatus: "Draft", creatorName: currentName(), creatorEmail: currentUser(), creatorSignature: signature.signaturelink || "", terms: terms || matchingVendor.payterm || "", warranty, description: `PO from PR ${assignment.prnumber}` });
      await Promise.all(priced.map((item) => saveRow("storepoitemsds2", { ...item, poid, postatus: "Draft", storereqid: assignment.requestid })));
      await updateRow("storepoassignmentds2", assignment, { status: "PO Created", poid });
      setMessage(`PO ${poid} created as draft for ${matchingVendor.vendorname}`);
      setSelectedPo(header);
      setPoItems(priced);
      await load();
    } catch (err) { setError(err.message); }
  };
  const openPo = async (po) => {
    setSelectedPo(po);
    setTerms(po.terms || "");
    setWarranty(po.warranty || "");
    setPoItems(await getRows("storepoitemsds2", [{ field: "poid", value: po.poid }]));
  };
  const savePoDraft = async () => {
    try {
      if (!selectedPo) throw new Error("Open a PO first");
      if (text(selectedPo.postatus).toLowerCase() !== "draft") throw new Error("Only draft PO can be edited");
      const updatedItems = poItems.map((item) => ({ ...item, total: calcLineTotal(item) }));
      const total = updatedItems.reduce((sum, item) => sum + num(item.total), 0);
      const updated = await updateRow("storepoorderds2", selectedPo, { terms, warranty, price: total, netprice: total, actualAmount: total, updatedate: today() });
      await Promise.all(updatedItems.map((item) => {
        const payload = { ...item };
        delete payload.id;
        return item._id ? updateRow("storepoitemsds2", item, payload) : saveRow("storepoitemsds2", { ...payload, poid: selectedPo.poid, postatus: "Draft" });
      }));
      setSelectedPo(updated);
      setPoItems(updatedItems);
      setMessage("Draft PO updated");
      await load();
    } catch (err) { setError(err.message); }
  };
  const submitPo = async (po = selectedPo) => {
    try {
      const signature = await getUserSignature(po.creatorEmail || currentUser());
      const updated = await updateRow("storepoorderds2", po, { postatus: "Submitted", approvalStatus: "Pending", currentStep: po.currentStep || 1, creatorSignature: po.creatorSignature || signature.signaturelink || "" });
      setSelectedPo(updated);
      setMessage("PO submitted for approval");
      await load();
    } catch (err) { setError(err.message); }
  };
  const approvePo = async (po = selectedPo) => {
    try {
      const workflow = (await getRows("storepoapprovalworkflowds2")).filter((row) => text(row.status || "Active").toLowerCase() === "active").sort((a, b) => num(a.level) - num(b.level));
      const currentStep = num(po.currentStep || 1);
      const currentLevel = workflow.find((row) => num(row.level) === currentStep) || workflow[0];
      if (!currentLevel) throw new Error("No PO approval workflow configured");
      if (!admin && !sameEmail(currentLevel.approveremail, currentUser())) throw new Error("This PO is not pending at your approval level");
      const sig = await getUserSignature(currentUser());
      const history = Array.isArray(po.approvalhistory) ? po.approvalhistory : [];
      const entry = { level: currentLevel.level, approvername: currentName(), approveremail: currentUser(), signaturelink: sig.signaturelink || "", date: new Date().toISOString(), status: "Approved" };
      const nextLevel = workflow.find((row) => num(row.level) > currentStep);
      const patch = nextLevel ? { currentStep: nextLevel.level, approvalStatus: "Pending", postatus: "Submitted", approvalhistory: [...history, entry] } : { currentStep, approvalStatus: "Approved", postatus: "Approved", approvalhistory: [...history, entry] };
      const updated = await updateRow("storepoorderds2", po, patch);
      await saveRow("storepoapprovalds2", { poid: po.poid, level: currentLevel.level, approvername: currentName(), approveremail: currentUser(), status: "Approved", approvaldate: today(), remarks: "" });
      setSelectedPo(updated);
      setMessage(nextLevel ? `Approved. Moved to level ${nextLevel.level}` : "PO fully approved");
      await load();
    } catch (err) { setError(err.message); }
  };
  return <Page title={admin ? "Manage PO Admin" : "Manage PO Creator"} subtitle={admin ? "View all PR and PO records and approve submitted POs." : "Create POs from PRs assigned to you and submit them for approval."} message={message} error={error}>
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">PR list</Typography>
      <DataGrid autoHeight rows={(admin ? prs : assignments).map((r) => ({ ...r, id: r._id }))} columns={admin ? [{ field: "prnumber", headerName: "PR", width: 160 }, { field: "storename", headerName: "Store", width: 170 }, { field: "requestedbyemail", headerName: "Requested By", width: 220 }, { field: "status", headerName: "Status", width: 120 }] : [{ field: "prnumber", headerName: "PR", width: 160 }, { field: "assignedto", headerName: "Assigned To", width: 180 }, { field: "status", headerName: "Status", width: 140 }, { field: "actions", headerName: "Create PO", width: 140, renderCell: (p) => <Button size="small" disabled={text(p.row.status).toLowerCase() === "po created"} onClick={() => createPoFromAssignment(p.row)}>Create PO</Button> }]} slots={{ toolbar: GridToolbar }} />
    </Paper>
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}><TextField size="small" label="Terms and conditions" value={terms} onChange={(e) => setTerms(e.target.value)} multiline minRows={4} fullWidth /></Grid>
        <Grid item xs={12} md={6}><TextField size="small" label="Warranty" value={warranty} onChange={(e) => setWarranty(e.target.value)} multiline minRows={4} fullWidth /></Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
            <Button variant="outlined" disabled={!selectedPo || text(selectedPo.postatus).toLowerCase() !== "draft"} onClick={savePoDraft}>Save draft changes</Button>
            <Button variant="contained" disabled={!selectedPo || text(selectedPo.postatus).toLowerCase() !== "draft"} onClick={() => submitPo()}>Submit PO</Button>
            <Button variant="contained" color="success" disabled={!selectedPo || text(selectedPo.postatus).toLowerCase() !== "submitted"} onClick={() => approvePo()}>Approve PO</Button>
            <Button startIcon={<Print />} variant="outlined" disabled={!selectedPo} onClick={() => printPurchase2(selectedPo.poType === "Local" ? "localPo" : "po", { header: { ...selectedPo, terms, warranty }, items: poItems })}>Print PO</Button>
          </Stack>
        </Grid>
      </Grid>
      <DataGrid autoHeight rows={pos.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "poid", headerName: "PO", width: 160 }, { field: "prnumber", headerName: "PR", width: 160 }, { field: "vendor", headerName: "Vendor", flex: 1 }, { field: "postatus", headerName: "PO Status", width: 130 }, { field: "approvalStatus", headerName: "Approval", width: 130 }, { field: "currentStep", headerName: "Level", width: 90 }, { field: "actualAmount", headerName: "Amount", width: 120 }, { field: "actions", headerName: "Open", width: 100, renderCell: (p) => <Button size="small" onClick={() => openPo(p.row)}>Open</Button> }]} slots={{ toolbar: GridToolbar }} />
    </Paper>
    {selectedPo && <Paper sx={{ p: 2 }}>
      <Typography variant="h6">PO items: {selectedPo.poid}</Typography>
      <DataGrid autoHeight rows={poItems.map((r, i) => ({ ...r, id: i }))} processRowUpdate={(row) => { setPoItems(poItems.map((item, index) => index === row.id ? { ...item, make: row.make || "", total: calcLineTotal(row) } : item)); return row; }} columns={[{ field: "itemname", headerName: "Item", flex: 1 }, { field: "make", headerName: "Make", width: 180, editable: text(selectedPo.postatus).toLowerCase() === "draft" }, { field: "quantity", headerName: "Qty", width: 100 }, { field: "price", headerName: "Rate", width: 110 }, { field: "gst", headerName: "GST", width: 90 }, { field: "total", headerName: "Total", width: 120 }]} />
    </Paper>}
  </Page>;
}

export function Purchase2ManagePoAdminPage() {
  return <Purchase2ManagePoPage admin />;
}

export function Purchase2ManagePoCreatorPage() {
  return <Purchase2ManagePoPage />;
}

export function UserSignatureUploadPage() {
  const [rows, setRows] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [awsconfigid, setAwsconfigid] = useState("");
  const [file, setFile] = useState(null);
  const [signaturelink, setSignaturelink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const [signatureRows, configRes, userRows] = await Promise.all([getRows("usersignatureds"), ep1.get("/api/v2/aws-file-library/configs", { params: { colid: global1.colid } }), loadUsers()]);
    setRows(signatureRows);
    setConfigs(configRes.data || []);
    setUsers(userRows.filter((user) => text(user.role).toLowerCase() !== "student"));
  };
  useEffect(() => { load(); }, []);
  const upload = async () => {
    try {
      let link = signaturelink;
      if (file) {
        if (!awsconfigid) throw new Error("Select AWS configuration");
        const data = new FormData();
        data.append("file", file);
        data.append("colid", global1.colid);
        data.append("user", global1.user || "");
        data.append("awsconfigid", awsconfigid);
        data.append("folder", "signatures");
        data.append("description", "User signature");
        const res = await ep1.post("/api/v2/aws-file-library/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
        link = res.data?.url || link;
      }
      if (!selectedUser?.email && !selectedUser?.user) throw new Error("Select user");
      if (!link) throw new Error("Upload signature or paste signature link");
      await saveRow("usersignatureds", { username: selectedUser.name || "", useremail: selectedUser.email || selectedUser.user || "", signaturelink: link, status: "Active" });
      setMessage("Signature saved");
      setFile(null);
      setSignaturelink("");
      setSelectedUser(null);
      await load();
    } catch (err) { setError(err.message || "Unable to save signature"); }
  };
  return <Page title="User Signature Upload" subtitle="Upload user signatures through AWS and use them in Purchase 2 print documents." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid item xs={12} md={4}><Autocomplete options={users} value={selectedUser} onChange={(_, v) => setSelectedUser(v)} getOptionLabel={(o) => `${o.name || ""} ${o.email || o.user || ""}`} renderInput={(params) => <TextField {...params} label="User" size="small" />} /></Grid><Grid item xs={12} md={3}><TextField select size="small" label="AWS config" value={awsconfigid} onChange={(e) => setAwsconfigid(e.target.value)} fullWidth><MenuItem value="">Select</MenuItem>{configs.map((cfg) => <MenuItem key={cfg._id} value={cfg._id}>{cfg.name || cfg.configname || cfg.bucket}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><Button component="label" startIcon={<UploadFile />} variant="outlined" fullWidth>{file?.name || "Upload signature"}<input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={upload}>Save</Button></Grid><Grid item xs={12}><TextField size="small" label="Or paste signature link" value={signaturelink} onChange={(e) => setSignaturelink(e.target.value)} fullWidth /></Grid></Grid></Paper><DataGrid autoHeight rows={rows.map((r) => ({ ...r, id: r._id }))} columns={[{ field: "username", headerName: "Name", flex: 1 }, { field: "useremail", headerName: "Email", flex: 1 }, { field: "signaturelink", headerName: "Signature Link", flex: 1, renderCell: (p) => p.value ? <a href={p.value} target="_blank" rel="noreferrer">View</a> : "-" }, { field: "status", headerName: "Status", width: 120 }]} slots={{ toolbar: GridToolbar }} /></Page>;
}

export function Purchase2GatePassPage() {
  const [pos, setPos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ receiveddate: today(), vehicle: "", challanno: "", invoiceno: "", remarks: "" });
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { getRows("storepoorderds2").then((rows) => setPos(rows.filter((po) => ["Approved", "Delivery Scheduled"].includes(po.approvalStatus) || ["Approved", "Delivery Scheduled"].includes(po.postatus)))); }, []);
  const open = async (po) => { setSelected(po); setItems(await getRows("storepoitemsds2", [{ field: "poid", value: po.poid }])); };
  const save = async () => {
    try {
      const gatepassno = key("GP");
      const header = await saveRow("storegatepassds2", { ...form, gatepassno, poid: selected.poid, vendorid: selected.vendorid, vendorname: selected.vendor, storeid: selected.storeid, storename: selected.storename, receivedby: currentName(), status: "Received" });
      await Promise.all(items.map((item) => saveRow("storegatepassitemsds2", { gatepassno, poid: selected.poid, itemid: item.itemid, itemcode: item.itemcode, itemname: item.itemname, orderedquantity: item.quantity, receivedquantity: item.quantity, unit: item.unit, remarks: item.remarks })));
      setMessage("Gate pass created");
      setPrintData({ header: { ...selected, ...form, ...header }, items });
    } catch (err) { setError(err.message); }
  };
  return <Page title="PO Gate Pass" subtitle="Create gate pass records for approved POs." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap"><Autocomplete sx={{ minWidth: 320 }} options={pos} getOptionLabel={(o) => `${o.poid || ""} - ${o.vendor || ""}`} onChange={(_, v) => open(v)} renderInput={(params) => <TextField {...params} label="Approved PO" size="small" />} />{["vehicle", "challanno", "invoiceno", "remarks"].map((f) => <TextField key={f} size="small" label={f} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} />)}<Button variant="contained" onClick={save} disabled={!selected}>Create gate pass</Button><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("gatePass", printData)}>Print gate pass</Button></Stack></Paper><DataGrid autoHeight rows={items.map((r, i) => ({ ...r, id: i }))} columns={[{ field: "itemname", headerName: "Item", flex: 1 }, { field: "quantity", headerName: "Qty", width: 120 }, { field: "remarks", headerName: "Remarks", flex: 1, editable: true }]} processRowUpdate={(row) => { setItems(items.map((it, idx) => idx === row.id ? { ...it, remarks: row.remarks || "" } : it)); return row; }} /></Page>;
}

export function Purchase2QualityCheckPage() {
  const [passes, setPasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { getRows("storegatepassds2").then(setPasses); }, []);
  const open = async (gp) => {
    setSelected(gp);
    const gpItems = await getRows("storegatepassitemsds2", [{ field: "gatepassno", value: gp.gatepassno }]);
    setItems(gpItems.map((item) => ({ ...item, receivedquantity: item.receivedquantity || item.orderedquantity || 0, approvedquantity: item.receivedquantity || 0, rejectedquantity: 0, returnedquantity: 0, status: "Approved" })));
  };
  const save = async () => {
    try {
      const qcno = key("QC");
      const header = await saveRow("storequalitycheckds2", { qcno, gatepassno: selected.gatepassno, poid: selected.poid, vendorname: selected.vendorname, storename: selected.storename, storeid: selected.storeid, checkedby: currentName(), checkedbyemail: currentUser(), checkdate: today(), status: "QC Done", remarks });
      for (const item of items) {
        await saveRow("storequalitycheckitemsds2", { ...item, qcno });
        const stocks = await getRows("storeitemsds2", [{ field: "storeid", value: selected.storeid || selected.storeId || "" }, { field: "itemcode", value: item.itemcode }]);
        if (stocks[0]) await updateRow("storeitemsds2", stocks[0], { quantity: num(stocks[0].quantity) + num(item.approvedquantity) });
        else await saveRow("storeitemsds2", { storeid: selected.storeid, storename: selected.storename, itemcode: item.itemcode, itemname: item.itemname, quantity: item.approvedquantity, unit: item.unit, status: "Active" });
      }
      setMessage("Quality check saved and approved stock updated");
      setPrintData({ header: { ...selected, ...header, remarks }, items });
    } catch (err) { setError(err.message); }
  };
  return <Page title="Quality Check" subtitle="Record received, approved, rejected and returned quantities after gate pass." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap"><Autocomplete sx={{ minWidth: 320 }} options={passes} getOptionLabel={(o) => `${o.gatepassno || ""} - ${o.poid || ""}`} onChange={(_, v) => open(v)} renderInput={(params) => <TextField {...params} label="Gate pass" size="small" />} /><TextField size="small" label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} /><Button variant="contained" onClick={save} disabled={!selected}>Save QC</Button><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("qualityCheck", printData)}>Print QC</Button></Stack></Paper><DataGrid autoHeight rows={items.map((r, i) => ({ ...r, id: i }))} processRowUpdate={(row) => { setItems(items.map((it, idx) => idx === row.id ? row : it)); return row; }} columns={[{ field: "itemname", headerName: "Item", flex: 1 }, { field: "receivedquantity", headerName: "Received", width: 120, editable: true }, { field: "approvedquantity", headerName: "Approved", width: 120, editable: true }, { field: "rejectedquantity", headerName: "Rejected", width: 120, editable: true }, { field: "returnedquantity", headerName: "Returned", width: 120, editable: true }, { field: "remarks", headerName: "Remarks", flex: 1, editable: true }]} /></Page>;
}

export function Purchase2GrnCreationPage() {
  const [qcs, setQcs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { getRows("storequalitycheckds2").then((rows) => setQcs(rows.filter((r) => !r.grnno))); }, []);
  const open = async (qc) => { setSelected(qc); setItems(await getRows("storequalitycheckitemsds2", [{ field: "qcno", value: qc.qcno }])); };
  const save = async () => {
    try {
      const grnNo = key("GRN");
      const gp = (await getRows("storegatepassds2", [{ field: "gatepassno", value: selected.gatepassno }]))[0] || {};
      const header = await saveRow("storegrnds2", { grnNo, gatePassNumber: selected.gatepassno || "NA", poid: selected.poid || "NA", vendorName: gp.vendorname || "NA", storeId: gp.storeid || "NA", storeName: gp.storename || "NA", receivedBy: currentName(), grnDate: today(), status: "Pending QC", remarks: `QC ${selected.qcno}` });
      await Promise.all(items.map((item) => saveRow("storegrnitemsds2", { grnno: grnNo, grnid: header._id, poid: selected.poid, itemid: item.itemid, itemcode: item.itemcode, itemname: item.itemname, acceptedquantity: item.approvedquantity, rejectedquantity: item.rejectedquantity, unit: item.unit, remarks: item.remarks })));
      await updateRow("storequalitycheckds2", selected, { grnno: grnNo, status: "GRN Created" });
      setMessage("GRN created");
      setPrintData({ header: { ...selected, ...gp, ...header, qcno: selected.qcno }, items });
    } catch (err) { setError(err.message); }
  };
  return <Page title="GRN Creation" subtitle="Create GRN from approved quality check records." message={message} error={error}><Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2}><Autocomplete sx={{ minWidth: 320 }} options={qcs} getOptionLabel={(o) => `${o.qcno || ""} - ${o.poid || ""}`} onChange={(_, v) => open(v)} renderInput={(params) => <TextField {...params} label="Approved QC" size="small" />} /><Button variant="contained" onClick={save} disabled={!selected}>Create GRN</Button><Button startIcon={<Print />} variant="outlined" disabled={!printData} onClick={() => printPurchase2("grn", printData)}>Print GRN</Button></Stack></Paper><DataGrid autoHeight rows={items.map((r, i) => ({ ...r, id: i }))} columns={[{ field: "itemname", headerName: "Item", flex: 1 }, { field: "approvedquantity", headerName: "Accepted", width: 120 }, { field: "rejectedquantity", headerName: "Rejected", width: 120 }]} /></Page>;
}
