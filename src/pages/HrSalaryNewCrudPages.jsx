import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Link as RouterLink } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import ep1 from "../api/ep1";
import global1 from "./global1";

const text = (value) => String(value ?? "").trim();
const numberFields = ["amount"];
const dateFields = ["effectivedate", "applieddate", "duedate"];
const SELECT_ALL_COMPONENTS = "__SELECT_ALL_COMPONENTS__";

const salaryStructureFields = ["structure", "structureid", "employee", "empid", "component", "amount", "type", "level", "effectivedate", "applieddate", "status1", "comments"];
const dueSalaryFields = ["year", "month", "duedate", "structure", "structureid", "employee", "empid", "component", "amount", "type", "level", "paystatus", "status1", "comments"];
const academicYearOptions = Array.from({ length: 12 }, (_, index) => `${2022 + index}-${String(23 + index).padStart(2, "0")}`);
const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const labels = {
  structureid: "Structure ID",
  empid: "Employee ID / Email",
  effectivedate: "Effective Date",
  applieddate: "Applied Date",
  duedate: "Due Date",
  status1: "Status",
  paystatus: "Payment Status"
};

function blank(fields) {
  return Object.fromEntries(fields.map((field) => [field, ""]));
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

async function loadInstitution() {
  try {
    const res = await ep1.get("/api/v2/hr-advanced/institution", { params: { colid: global1.colid } });
    return res.data?.data || {};
  } catch {
    return {};
  }
}

function printRows(title, rows, fields, institution = {}) {
  const logo = institution.logolink || institution.logo || "";
  const name = institution.institutionname || institution.name || global1.institution || "Institution";
  const address = institution.address || "";
  const htmlRows = rows.map((row, index) => `<tr><td>${index + 1}</td>${fields.map((field) => `<td>${text(row[field]) || "-"}</td>`).join("")}</tr>`).join("");
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    @page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#000;background:#fff;margin:0}.toolbar{padding:10px;text-align:right}.print{padding:18px}.head{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px}.logo{max-height:60px;float:left}h1{font-size:18px;margin:8px 0 0;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:10.5px}th,td{border:1px solid #000;padding:5px;text-align:left;vertical-align:top;white-space:normal;overflow-wrap:anywhere}th{font-weight:800}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:36px;text-align:center}.sign div{border-top:1px solid #000;padding-top:6px}@media print{.toolbar{display:none}tr{break-inside:avoid}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div><div class="print"><div class="head">${logo ? `<img class="logo" src="${logo}" />` : ""}<div style="font-size:22px;font-weight:900">${name}</div><div>${address}</div><h1>${title}</h1></div><table><thead><tr><th>Sr</th>${fields.map((field) => `<th>${labels[field] || field}</th>`).join("")}</tr></thead><tbody>${htmlRows || `<tr><td colspan="${fields.length + 1}" style="text-align:center">No data</td></tr>`}</tbody></table><div class="sign"><div>Prepared By</div><div>Checked By</div><div>Approved By</div></div></div></body></html>`);
  win.document.close();
}

function SalaryCrudPage({ title, subtitle, endpoint, fields }) {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [users, setUsers] = useState([]);
  const [assignedSalaryRows, setAssignedSalaryRows] = useState([]);
  const [assignmentChecked, setAssignmentChecked] = useState(false);
  const [form, setForm] = useState(blank(fields));
  const [filters, setFilters] = useState(blank(fields));
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSalaryStructure = endpoint === "salary-structure-crud";
  const isDueSalary = endpoint === "due-salary-crud";

  const load = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = { colid: global1.colid };
      Object.entries(nextFilters).forEach(([field, value]) => { if (value) params[field] = value; });
      const res = await ep1.get(`/api/v2/hr-advanced/${endpoint}`, { params });
      setRows(res.data?.data || []);
      setOptions(res.data?.options || {});
      if (isSalaryStructure || isDueSalary) {
        const userRes = await ep1.get("/api/v2/hr-advanced/users", { params: { colid: global1.colid } });
        setUsers(userRes.data?.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dynamicOptions = useMemo(() => {
    const merged = { ...options };
    fields.forEach((field) => {
      merged[field] = [...new Set([...(merged[field] || []), ...rows.map((row) => row[field])].map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });
    return merged;
  }, [fields, options, rows]);

  const structureCatalog = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const structure = text(row.structure);
      if (!structure) return;
      const existing = map.get(structure) || {
        structure,
        structureid: text(row.structureid),
        type: text(row.type),
        level: text(row.level),
        components: []
      };
      if (!existing.structureid && row.structureid) existing.structureid = row.structureid;
      if (!existing.type && row.type) existing.type = row.type;
      if (!existing.level && row.level) existing.level = row.level;
      if (text(row.component) && !existing.components.some((item) => item.component === text(row.component))) {
        existing.components.push({
          component: text(row.component),
          amount: row.amount ?? "",
          type: text(row.type),
          level: text(row.level),
          sourceId: row._id
        });
      }
      map.set(structure, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.structure.localeCompare(b.structure, undefined, { numeric: true }));
  }, [rows]);

  const selectedStructure = useMemo(() => (
    structureCatalog.find((item) => item.structure === text(form.structure)) || null
  ), [structureCatalog, form.structure]);

  const componentOptions = selectedStructure?.components || [];
  const selectedComponentValues = Array.isArray(form.component)
    ? form.component
    : text(form.component)
      ? [text(form.component)]
      : [];

  const assignedActiveRows = useMemo(() => assignedSalaryRows.filter((row) => String(row.level || "").toLowerCase() === "active"), [assignedSalaryRows]);
  const assignedStructure = assignedActiveRows[0] || null;
  const assignedComponentOptions = useMemo(() => {
    const map = new Map();
    assignedActiveRows.forEach((row) => {
      const component = text(row.component);
      if (!component || map.has(component)) return;
      map.set(component, {
        component,
        amount: row.amount ?? "",
        type: text(row.type) || "Credit",
        level: text(row.level) || "Active"
      });
    });
    return Array.from(map.values()).sort((a, b) => a.component.localeCompare(b.component, undefined, { numeric: true }));
  }, [assignedActiveRows]);

  const selectedDueComponents = Array.isArray(form.component)
    ? form.component
    : text(form.component)
      ? [text(form.component)]
      : [];
  const isAssignmentMissing = isDueSalary && assignmentChecked && text(form.employee) && !assignedActiveRows.length;

  const setSmartForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const componentAmountTotal = (components = selectedComponentValues) => components.reduce((sum, component) => {
    const row = componentOptions.find((item) => item.component === component);
    return sum + (Number(row?.amount) || 0);
  }, 0);

  const updateComponents = (values) => {
    const cleaned = values.includes(SELECT_ALL_COMPONENTS)
      ? (selectedComponentValues.length === componentOptions.length ? [] : componentOptions.map((item) => item.component))
      : values.filter(Boolean);
    setSmartForm({ component: cleaned, amount: componentAmountTotal(cleaned) });
  };

  const dueComponentAmountTotal = (components = selectedDueComponents) => components.reduce((sum, component) => {
    const row = assignedComponentOptions.find((item) => item.component === component);
    return sum + (Number(row?.amount) || 0);
  }, 0);

  const updateDueComponents = (values) => {
    const cleaned = values.includes(SELECT_ALL_COMPONENTS)
      ? (selectedDueComponents.length === assignedComponentOptions.length ? [] : assignedComponentOptions.map((item) => item.component))
      : values.filter(Boolean);
    const allExisting = cleaned.every((component) => assignedComponentOptions.some((item) => item.component === component));
    setSmartForm({ component: cleaned, amount: allExisting ? dueComponentAmountTotal(cleaned) : "" });
  };

  const loadAssignedSalaryForEmployee = async (employee) => {
    const email = text(employee?.email || employee?.user || employee?.employeeemail || employee?.empid);
    if (!email) {
      setAssignedSalaryRows([]);
      setAssignmentChecked(false);
      return;
    }
    try {
      setAssignmentChecked(false);
      const res = await ep1.get("/api/v2/hr-advanced/salary-structure-crud", {
        params: { colid: global1.colid, empid: email }
      });
      const assigned = res.data?.data || [];
      const active = assigned.filter((row) => String(row.level || "").toLowerCase() === "active");
      setAssignedSalaryRows(assigned);
      setAssignmentChecked(true);
      setSmartForm({
        employee: employee?.name || "",
        empid: email,
        structure: active[0]?.structure || assigned[0]?.structure || "",
        structureid: active[0]?.structureid || assigned[0]?.structureid || "",
        level: active[0]?.level || assigned[0]?.level || "",
        component: [],
        amount: "",
        type: "Credit",
        paystatus: "Due",
        status1: "Submitted"
      });
      if (!active.length) {
        setError("No active salary structure is assigned to this employee. Assign salary first.");
      } else {
        setError("");
      }
    } catch (err) {
      setAssignedSalaryRows([]);
      setAssignmentChecked(true);
      setError(err.response?.data?.message || "Unable to load assigned salary for employee");
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      if (isDueSalary && isAssignmentMissing) {
        setError("Assign salary structure first before creating due salary.");
        return;
      }
      if (isDueSalary && !editingId && selectedDueComponents.length > 1) {
        for (const component of selectedDueComponents) {
          const componentRow = assignedComponentOptions.find((item) => item.component === component) || {};
          await ep1.post(`/api/v2/hr-advanced/${endpoint}`, {
            ...form,
            component,
            amount: componentRow.amount ?? form.amount,
            type: componentRow.type || form.type || "Credit",
            level: componentRow.level || form.level || "Active",
            paystatus: form.paystatus || "Due",
            status1: "Submitted",
            id: "",
            colid: global1.colid,
            name: global1.name || form.employee || "",
            user: global1.user || form.empid || ""
          });
        }
      } else if (isSalaryStructure && !editingId && selectedComponentValues.length > 1) {
        for (const component of selectedComponentValues) {
          const componentRow = componentOptions.find((item) => item.component === component) || {};
          await ep1.post(`/api/v2/hr-advanced/${endpoint}`, {
            ...form,
            component,
            amount: componentRow.amount ?? form.amount,
            type: componentRow.type || form.type,
            level: componentRow.level || form.level,
            id: "",
            colid: global1.colid,
            name: global1.name || form.employee || "",
            user: global1.user || form.empid || ""
          });
        }
      } else {
        const component = Array.isArray(form.component) ? (form.component[0] || "") : form.component;
        const componentRow = isDueSalary
          ? (assignedComponentOptions.find((item) => item.component === component) || {})
          : (componentOptions.find((item) => item.component === component) || {});
        await ep1.post(`/api/v2/hr-advanced/${endpoint}`, {
          ...form,
          component,
          amount: (isSalaryStructure || isDueSalary) && componentRow.amount !== undefined ? componentRow.amount : form.amount,
          type: (isSalaryStructure || isDueSalary) && componentRow.type ? componentRow.type : form.type,
          level: (isSalaryStructure || isDueSalary) && componentRow.level ? componentRow.level : form.level,
          ...(isDueSalary ? { paystatus: form.paystatus || "Due", status1: "Submitted" } : {}),
          id: editingId,
          colid: global1.colid,
          name: global1.name || form.employee || "",
          user: global1.user || form.empid || ""
        });
      }
      const multiCount = isDueSalary ? selectedDueComponents.length : selectedComponentValues.length;
      setMessage(editingId ? "Record updated." : `Record saved${(isSalaryStructure || isDueSalary) && multiCount > 1 ? ` for ${multiCount} components` : ""}.`);
      setEditingId("");
      setForm(blank(fields));
      setAssignedSalaryRows([]);
      setAssignmentChecked(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save record");
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    const next = blank(fields);
    fields.forEach((field) => { next[field] = dateFields.includes(field) ? formatDate(row[field]) : row[field] ?? ""; });
    if (isSalaryStructure && next.component) next.component = [next.component];
    if (isDueSalary && next.component) next.component = [next.component];
    setForm(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (ids) => {
    const deleteIds = Array.isArray(ids) ? ids : [ids].filter(Boolean);
    if (!deleteIds.length) return setError("Select at least one row");
    if (!window.confirm(`Delete ${deleteIds.length} selected record(s)?`)) return;
    await ep1.post(`/api/v2/hr-advanced/${endpoint}-delete`, { colid: global1.colid, ids: deleteIds });
    setSelected([]);
    setMessage("Deleted selected records.");
    await load();
  };

  const downloadTemplate = () => {
    const sample = Object.fromEntries(fields.map((field) => [field, numberFields.includes(field) ? 1000 : dateFields.includes(field) ? "2026-08-10" : labels[field] || field]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([sample]), title);
    XLSX.writeFile(wb, `${endpoint}_template.xlsx`);
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSaving(true);
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rowsFromFile = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const res = await ep1.post(`/api/v2/hr-advanced/${endpoint}-bulk`, { colid: global1.colid, user: global1.user, rows: rowsFromFile });
      setMessage(`Bulk upload complete. Saved: ${res.data?.saved || 0}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload file");
    } finally {
      setSaving(false);
    }
  };

  const doPrint = async () => printRows(title, rows, fields, await loadInstitution());

  const renderFormField = (field) => {
    if (isDueSalary && field === "year") {
      return (
        <Autocomplete
          freeSolo
          options={academicYearOptions}
          value={form.year || ""}
          onInputChange={(_, value) => setSmartForm({ year: value })}
          onChange={(_, value) => setSmartForm({ year: value || "" })}
          disabled={isAssignmentMissing}
          renderInput={(params) => <TextField {...params} fullWidth size="small" label="Academic Year" />}
        />
      );
    }
    if (isDueSalary && field === "month") {
      return (
        <TextField select fullWidth size="small" label="Month" value={form.month || ""} disabled={isAssignmentMissing} onChange={(e) => setSmartForm({ month: e.target.value })}>
          {monthOptions.map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
        </TextField>
      );
    }
    if (isDueSalary && field === "employee") {
      const selectedUser = users.find((item) => text(item.email || item.user) === text(form.empid) || text(item.name) === text(form.employee)) || null;
      return (
        <Autocomplete
          options={users}
          filterOptions={(items, state) => {
            const query = state.inputValue.toLowerCase();
            return items.filter((item) => `${item.name || ""} ${item.email || ""} ${item.user || ""} ${item.department || ""} ${item.role || ""}`.toLowerCase().includes(query));
          }}
          getOptionLabel={(option) => typeof option === "string" ? option : `${option.name || ""}${option.email ? ` - ${option.email}` : ""}`}
          value={selectedUser}
          onChange={(_, value) => loadAssignedSalaryForEmployee(value)}
          renderInput={(params) => <TextField {...params} fullWidth size="small" label="Employee" helperText="Select employee to load assigned salary structure" />}
        />
      );
    }
    if (isDueSalary && field === "empid") {
      return <TextField fullWidth size="small" label="Employee ID / Email" value={form.empid || ""} InputProps={{ readOnly: true }} />;
    }
    if (isDueSalary && field === "structure") {
      return <TextField fullWidth size="small" label="Salary Structure" value={form.structure || ""} InputProps={{ readOnly: true }} disabled={isAssignmentMissing} />;
    }
    if (isDueSalary && field === "structureid") {
      return <TextField fullWidth size="small" label="Structure ID" value={form.structureid || ""} InputProps={{ readOnly: true }} disabled={isAssignmentMissing} />;
    }
    if (isDueSalary && field === "component") {
      const allSelected = assignedComponentOptions.length > 0 && selectedDueComponents.filter((item) => assignedComponentOptions.some((option) => option.component === item)).length === assignedComponentOptions.length;
      const optionList = assignedComponentOptions.length ? [{ component: SELECT_ALL_COMPONENTS, amount: "" }, ...assignedComponentOptions] : [];
      const value = selectedDueComponents.map((component) => assignedComponentOptions.find((item) => item.component === component) || { component, amount: "" });
      return (
        <Autocomplete
          multiple
          freeSolo
          disableCloseOnSelect
          disabled={isAssignmentMissing || !text(form.empid)}
          options={optionList}
          value={value}
          getOptionLabel={(option) => typeof option === "string" ? option : option.component === SELECT_ALL_COMPONENTS ? "Select all" : `${option.component}${option.amount !== "" ? ` - ${option.amount}` : ""}`}
          onChange={(_, values) => updateDueComponents(values.map((item) => typeof item === "string" ? item : item.component))}
          renderTags={(values, getTagProps) => values.map((option, index) => <Chip size="small" label={typeof option === "string" ? option : option.component} {...getTagProps({ index })} />)}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Checkbox checked={option.component === SELECT_ALL_COMPONENTS ? allSelected : selectedDueComponents.includes(option.component)} sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2">{option.component === SELECT_ALL_COMPONENTS ? "Select all" : option.component}</Typography>
                {option.component !== SELECT_ALL_COMPONENTS && <Typography variant="caption" color="text.secondary">Amount: {option.amount || 0}</Typography>}
              </Box>
            </Box>
          )}
          renderInput={(params) => <TextField {...params} fullWidth size="small" label="Component" helperText="Select assigned components or type a custom component" />}
        />
      );
    }
    if (isDueSalary && field === "amount") {
      const allExisting = selectedDueComponents.length > 0 && selectedDueComponents.every((component) => assignedComponentOptions.some((item) => item.component === component));
      return (
        <TextField
          fullWidth
          size="small"
          label="Amount"
          type="number"
          value={form.amount || ""}
          disabled={isAssignmentMissing || !text(form.empid)}
          InputProps={{ readOnly: allExisting }}
          helperText={allExisting ? "Auto total of selected assigned component amount(s)" : "Enter amount for custom component"}
          onChange={(e) => setSmartForm({ amount: e.target.value })}
        />
      );
    }
    if (isDueSalary && field === "type") {
      return (
        <TextField select fullWidth size="small" label="Type" value={form.type || "Credit"} disabled={isAssignmentMissing || !text(form.empid)} onChange={(e) => setSmartForm({ type: e.target.value })}>
          {["Credit", "Deduction"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
      );
    }
    if (isDueSalary && field === "paystatus") {
      return (
        <TextField select fullWidth size="small" label="Payment Status" value={form.paystatus || "Due"} disabled={isAssignmentMissing || !text(form.empid)} onChange={(e) => setSmartForm({ paystatus: e.target.value })}>
          {["Due", "Paid"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
      );
    }
    if (isDueSalary && field === "status1") {
      return <TextField fullWidth size="small" label="Status" value={form.status1 || "Submitted"} InputProps={{ readOnly: true }} disabled={isAssignmentMissing || !text(form.empid)} />;
    }
    if (isDueSalary && !["year", "month", "employee", "empid"].includes(field)) {
      const disabled = isAssignmentMissing || !text(form.empid);
      if (field === "level") return <TextField fullWidth size="small" label="Level" value={form.level || ""} InputProps={{ readOnly: true }} disabled={disabled} />;
      if (dateFields.includes(field)) {
        return <TextField fullWidth size="small" label={labels[field] || field} type="date" value={form[field] || ""} InputLabelProps={{ shrink: true }} disabled={disabled} onChange={(e) => setSmartForm({ [field]: e.target.value })} />;
      }
      if (field === "comments") {
        return <TextField fullWidth size="small" label="Comments" value={form.comments || ""} disabled={disabled} onChange={(e) => setSmartForm({ comments: e.target.value })} />;
      }
    }
    if (isSalaryStructure && field === "structure") {
      return (
        <Autocomplete
          options={structureCatalog}
          getOptionLabel={(option) => typeof option === "string" ? option : option.structure || ""}
          value={selectedStructure}
          onChange={(_, value) => {
            setSmartForm({
              structure: value?.structure || "",
              structureid: value?.structureid || "",
              type: value?.type || "",
              level: value?.level || "",
              component: [],
              amount: ""
            });
          }}
          renderInput={(params) => <TextField {...params} fullWidth size="small" label="Structure" />}
        />
      );
    }
    if (isSalaryStructure && field === "structureid") {
      return <TextField fullWidth size="small" label={labels[field] || field} value={form.structureid || ""} InputProps={{ readOnly: true }} />;
    }
    if (isSalaryStructure && field === "employee") {
      const selectedUser = users.find((item) => text(item.email || item.user) === text(form.empid) || text(item.name) === text(form.employee)) || null;
      return (
        <Autocomplete
          options={users}
          filterOptions={(items, state) => {
            const query = state.inputValue.toLowerCase();
            return items.filter((item) => `${item.name || ""} ${item.email || ""} ${item.user || ""} ${item.department || ""} ${item.role || ""}`.toLowerCase().includes(query));
          }}
          getOptionLabel={(option) => typeof option === "string" ? option : `${option.name || ""}${option.email ? ` - ${option.email}` : ""}`}
          value={selectedUser}
          onChange={(_, value) => setSmartForm({ employee: value?.name || "", empid: value?.email || value?.user || "" })}
          renderInput={(params) => <TextField {...params} fullWidth size="small" label="Employee" />}
        />
      );
    }
    if (isSalaryStructure && field === "empid") {
      return <TextField fullWidth size="small" label="Employee Email" value={form.empid || ""} InputProps={{ readOnly: true }} />;
    }
    if (isSalaryStructure && field === "component") {
      const allSelected = componentOptions.length > 0 && selectedComponentValues.length === componentOptions.length;
      const optionsList = componentOptions.length ? [{ component: SELECT_ALL_COMPONENTS, amount: "" }, ...componentOptions] : [];
      return (
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={optionsList}
          value={componentOptions.filter((item) => selectedComponentValues.includes(item.component))}
          getOptionLabel={(option) => option.component === SELECT_ALL_COMPONENTS ? "Select all" : `${option.component}${option.amount !== "" ? ` - ${option.amount}` : ""}`}
          onChange={(_, value) => updateComponents(value.map((item) => item.component))}
          renderTags={(value, getTagProps) => value.map((option, index) => <Chip size="small" label={option.component} {...getTagProps({ index })} />)}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Checkbox checked={option.component === SELECT_ALL_COMPONENTS ? allSelected : selectedComponentValues.includes(option.component)} sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2">{option.component === SELECT_ALL_COMPONENTS ? "Select all" : option.component}</Typography>
                {option.component !== SELECT_ALL_COMPONENTS && <Typography variant="caption" color="text.secondary">Amount: {option.amount || 0}</Typography>}
              </Box>
            </Box>
          )}
          renderInput={(params) => <TextField {...params} fullWidth size="small" label="Component" helperText={selectedStructure ? "Select one or more components" : "Select structure first"} />}
        />
      );
    }
    if (isSalaryStructure && field === "amount") {
      return <TextField fullWidth size="small" label="Amount" type="number" value={form.amount || ""} InputProps={{ readOnly: true }} helperText="Auto total of selected component amount(s)" />;
    }
    return (
      <TextField
        fullWidth
        size="small"
        label={labels[field] || field}
        type={dateFields.includes(field) ? "date" : numberFields.includes(field) ? "number" : "text"}
        value={form[field] || ""}
        InputLabelProps={dateFields.includes(field) ? { shrink: true } : undefined}
        onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
      />
    );
  };

  const columns = [
    { field: "actions", type: "actions", headerName: "Actions", width: 90, getActions: (params) => [<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => edit(params.row)} />, <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => remove(params.row._id)} />] },
    ...fields.map((field) => ({ field, headerName: labels[field] || field, width: ["employee", "comments", "structure"].includes(field) ? 210 : 140, type: numberFields.includes(field) ? "number" : "string", valueGetter: (params) => dateFields.includes(field) ? formatDate(params.row[field]) : params.row[field] }))
  ];

  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box><Typography variant="h5" fontWeight={900}>{title}</Typography><Typography color="text.secondary">{subtitle}</Typography></Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={downloadTemplate}>Template</Button>
                <Button startIcon={<UploadFileIcon />} variant="contained" component="label" disabled={saving}>Bulk Upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button>
                <Button startIcon={<DeleteIcon />} color="error" variant="outlined" disabled={!selected.length} onClick={() => remove(selected)}>Bulk Delete</Button>
                <Button startIcon={<PrintIcon />} variant="outlined" onClick={doPrint}>Print</Button>
              </Stack>
            </Stack>
            {(loading || saving) && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {isAssignmentMissing && (
            <Alert
              severity="warning"
              action={<Button color="inherit" size="small" component={RouterLink} to="/salassign1">Assign salary</Button>}
            >
              No active salary structure is assigned to this employee. Assign salary structure first, then return to this page.
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              {fields.map((field) => (
                <Grid item xs={12} md={["employee", "structure", "comments"].includes(field) ? 3 : 1.5} key={field}>
                  {renderFormField(field)}
                </Grid>
              ))}
              <Grid item xs={12}><Stack direction="row" spacing={1}><Button startIcon={<SaveIcon />} variant="contained" onClick={save} disabled={saving || isAssignmentMissing}>{editingId ? "Update" : "Save"}</Button><Button variant="outlined" onClick={() => { setEditingId(""); setForm(blank(fields)); setAssignedSalaryRows([]); setAssignmentChecked(false); }}>Clear</Button></Stack></Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              {fields.map((field) => (
                <Grid item xs={12} md={1.5} key={field}>
                  <TextField select fullWidth size="small" label={labels[field] || field} value={filters[field] || ""} onChange={(e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }))}>
                    <MenuItem value="">All</MenuItem>
                    {(dynamicOptions[field] || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                </Grid>
              ))}
              <Grid item xs={12} md={1.5}><Button fullWidth variant="contained" sx={{ height: "100%" }} onClick={() => load()}>Apply</Button></Grid>
            </Grid>
            <Box sx={{ height: 650, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row._id}
                checkboxSelection
                rowSelectionModel={selected}
                onRowSelectionModelChange={(ids) => setSelected(Array.from(ids))}
                loading={loading}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: endpoint } } }}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", alignItems: "flex-start", py: 1 } }}
              />
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}

export function EmployeeSalaryStructureNewPage() {
  return <SalaryCrudPage title="Employee Salary Structure New" subtitle="Full CRUD, bulk upload, dynamic filters and print view for dashmhrsalstructure." endpoint="salary-structure-crud" fields={salaryStructureFields} />;
}

export function EmployeeDueSalaryNewPage() {
  return <SalaryCrudPage title="Employee Due Salary New" subtitle="Full CRUD, bulk upload, dynamic filters and print view for dashmhrsalary." endpoint="due-salary-crud" fields={dueSalaryFields} />;
}
