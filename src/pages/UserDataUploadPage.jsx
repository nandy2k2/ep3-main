import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ep1 from "../api/ep1";
import global1 from "./global1";

const preferredFields = [
  "email", "name", "phone", "password", "role", "regno", "programcode", "admissionyear",
  "semester", "section", "gender", "department", "category", "address", "status",
  "regulation", "Major", "Minor", "AEC", "SEC", "VAC", "IDC"
];

const alwaysRequired = new Set([
  "email", "name", "phone", "password", "role", "regno", "programcode",
  "admissionyear", "semester", "section", "department", "status"
]);

const defaultValues = {
  role: "Student",
  semester: "1",
  status: 1,
  password: "123456",
  gender: "Not specified",
  isdisabled: "No"
};

const dropdownOptions = {
  gender: ["Male", "Female", "Not specified"],
  category: ["General", "SC", "ST", "OBC", "EBC", "EWS", "PH"],
  isdisabled: ["Yes", "No"]
};

const customGridField = (fieldname) => `custom_${fieldname}`;

const flattenUser = (row, customFields = []) => {
  const flat = { ...row };
  const custom = row.customFields || {};
  customFields.forEach((field) => {
    flat[customGridField(field.fieldname)] = custom[field.fieldname] || "";
  });
  return flat;
};

export default function UserDataUploadPage() {
  const navigate = useNavigate();
  const [baseFields, setBaseFields] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [filterFields, setFilterFields] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [customForm, setCustomForm] = useState({});
  const [filters, setFilters] = useState([{ field: "", value: "" }]);
  const [filterOptions, setFilterOptions] = useState({});
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadMeta();
  }, []);

  const orderedBaseFields = useMemo(() => {
    const map = new Map(baseFields.map((field) => [field.field, field]));
    const ordered = preferredFields.map((field) => map.get(field)).filter(Boolean);
    const rest = baseFields.filter((field) => !preferredFields.includes(field.field));
    return [...ordered, ...rest];
  }, [baseFields]);

  const flattenedRows = useMemo(() => rows.map((row) => flattenUser(row, customFields)), [rows, customFields]);

  const loadMeta = async () => {
    try {
      const res = await ep1.get("/api/v2/user-data/meta", { params: { colid: global1.colid } });
      const metaBase = res.data?.fields || [];
      const metaCustom = res.data?.customFields || [];
      setBaseFields(metaBase);
      setCustomFields(metaCustom);
      setFilterFields(res.data?.filterFields || []);
      resetForm(metaBase, metaCustom);
      await searchRows([]);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load user metadata");
    }
  };

  const resetForm = (metaBase = baseFields, metaCustom = customFields) => {
    const next = {};
    metaBase.forEach((field) => {
      next[field.field] = defaultValues[field.field] || "";
    });
    const nextCustom = {};
    metaCustom.forEach((field) => {
      nextCustom[field.fieldname] = "";
    });
    setForm(next);
    setCustomForm(nextCustom);
    setEditingId("");
  };

  const searchRows = async (overrideFilters) => {
    try {
      setLoading(true);
      const activeFilters = Array.isArray(overrideFilters) ? overrideFilters : filters;
      const res = await ep1.post("/api/v2/user-data/search", {
        colid: global1.colid,
        filters: activeFilters.filter((filter) => filter.field && filter.value !== ""),
        limit: 2000
      });
      setRows(res.data || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCustomForm = (field, value) => {
    setCustomForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveUser = async () => {
    try {
      const missing = [...alwaysRequired].filter((field) => orderedBaseFields.some((item) => item.field === field) && !form[field]);
      if (missing.length) {
        setError(`Required fields missing: ${missing.join(", ")}`);
        return;
      }

      setError("");
      setMessage("");
      const payload = {
        ...form,
        customFields: customForm,
        colid: global1.colid,
        user: global1.user
      };
      if (editingId) {
        await ep1.post("/api/v2/user-data-update", { ...payload, id: editingId });
        setMessage("User updated");
      } else {
        await ep1.post("/api/v2/user-data", payload);
        setMessage("User added");
      }
      resetForm();
      searchRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to save user");
    }
  };

  const editRow = (row) => {
    const next = {};
    orderedBaseFields.forEach((field) => {
      next[field.field] = row[field.field] ?? defaultValues[field.field] ?? "";
    });
    const nextCustom = {};
    customFields.forEach((field) => {
      nextCustom[field.fieldname] = row.customFields?.[field.fieldname] || "";
    });
    setForm(next);
    setCustomForm(nextCustom);
    setEditingId(row._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRow = async (row) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await ep1.post("/api/v2/user-data-delete", { id: row._id, colid: global1.colid });
      setMessage("User deleted");
      searchRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to delete user");
    }
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, { field: "", value: "" }]);
  };

  const updateFilter = async (index, key, value) => {
    const next = [...filters];
    next[index] = { ...next[index], [key]: value };
    if (key === "field") {
      next[index].value = "";
      if (value && !filterOptions[value]) {
        try {
          const res = await ep1.get("/api/v2/user-data/options", { params: { colid: global1.colid, field: value } });
          setFilterOptions((prev) => ({ ...prev, [value]: res.data || [] }));
        } catch (err) {
          setFilterOptions((prev) => ({ ...prev, [value]: [] }));
        }
      }
    }
    setFilters(next);
  };

  const removeFilter = (index) => {
    setFilters((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const clearFilters = () => {
    const next = [{ field: "", value: "" }];
    setFilters(next);
    searchRows(next);
  };

  const downloadTemplate = () => {
    const template = {};
    orderedBaseFields.forEach((field) => {
      template[field.field] = defaultValues[field.field] || "";
    });
    customFields.forEach((field) => {
      template[field.fieldname] = "";
    });
    const worksheet = XLSX.utils.json_to_sheet([template]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_data_upload_template.xlsx");
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!excelRows.length) {
        setError("No rows found in the Excel file");
        return;
      }

      const customNames = new Set(customFields.map((field) => field.fieldname));
      const baseNames = new Set(orderedBaseFields.map((field) => field.field));
      const items = excelRows.map((row, index) => {
        const item = { rowNumber: index + 2 };
        baseNames.forEach((field) => {
          if (row[field] !== undefined) item[field] = row[field];
        });
        item.customFields = {};
        customNames.forEach((field) => {
          if (row[field] !== undefined) item.customFields[field] = row[field];
        });
        return item;
      });

      const res = await ep1.post("/api/v2/user-data-bulk", {
        colid: global1.colid,
        user: global1.user,
        items
      });

      const errors = res.data?.errors || [];
      setMessage(`${res.data?.saved || 0} users uploaded${errors.length ? `, ${errors.length} rows skipped` : ""}`);
      setError(errors.length ? errors.map((item) => `Row ${item.rowNumber}: ${item.msg}`).join("; ") : "");
      searchRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to upload users");
    }
  };

  const renderFieldInput = (field) => (
    <Grid item xs={12} md={3} key={field.field}>
      <TextField
        select={Boolean(dropdownOptions[field.field])}
        fullWidth
        size="small"
        type={field.type === "number" ? "number" : "text"}
        label={field.label}
        value={form[field.field] ?? ""}
        required={alwaysRequired.has(field.field)}
        onChange={(event) => updateForm(field.field, event.target.value)}
      >
        {(dropdownOptions[field.field] || []).map((option) => (
          <MenuItem key={option} value={option}>{option}</MenuItem>
        ))}
      </TextField>
    </Grid>
  );

  const renderCustomInput = (field) => (
    <Grid item xs={12} md={field.type === "textarea" ? 6 : 3} key={field._id || field.fieldname}>
      <TextField
        select={field.type === "dropdown"}
        fullWidth
        size="small"
        type={field.type === "number" || field.type === "date" ? field.type : "text"}
        multiline={field.type === "textarea"}
        minRows={field.type === "textarea" ? 2 : undefined}
        label={field.label}
        value={customForm[field.fieldname] || ""}
        onChange={(event) => updateCustomForm(field.fieldname, event.target.value)}
      >
        {(field.options || []).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
      </TextField>
    </Grid>
  );

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 110,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => editRow(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => deleteRow(params.row)} />
      ]
    },
    ...orderedBaseFields.map((field) => ({
      field: field.field,
      headerName: field.label,
      width: 150
    })),
    ...customFields.map((field) => ({
      field: customGridField(field.fieldname),
      headerName: field.label,
      width: 160
    }))
  ];

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>User Data Upload</Typography>
          <Typography variant="body2" color="text.secondary">Upload, filter, edit and manage user model data with custom fields.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/dashdashfacnew")}>Back</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6">{editingId ? "Edit User" : "Add User"}</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={downloadTemplate}>Download Template</Button>
            <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
              Bulk Upload
              <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={1.5}>
          {orderedBaseFields.map(renderFieldInput)}
          {customFields.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography fontWeight={700}>Custom Fields</Typography>
            </Grid>
          )}
          {customFields.map(renderCustomInput)}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveUser}>
                {editingId ? "Update" : "Save"}
              </Button>
              {editingId && <Button variant="outlined" onClick={() => resetForm()}>Cancel</Button>}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6">Dynamic Filters</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addFilter}>Add Filter</Button>
        </Stack>
        <Grid container spacing={1.5}>
          {filters.map((filter, index) => {
            const selectedField = filterFields.find((item) => item.field === filter.field);
            const options = dropdownOptions[filter.field] || filterOptions[filter.field] || selectedField?.options || [];
            return (
              <React.Fragment key={index}>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth size="small" label="Field" value={filter.field} onChange={(event) => updateFilter(index, "field", event.target.value)}>
                    {filterFields.map((field) => (
                      <MenuItem key={field.field} value={field.field}>{field.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Autocomplete
                    freeSolo
                    options={options.map((item) => String(item))}
                    value={filter.value || ""}
                    onInputChange={(_, value) => updateFilter(index, "value", value)}
                    renderInput={(params) => <TextField {...params} size="small" label="Value" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button color="error" variant="outlined" onClick={() => removeFilter(index)} disabled={filters.length === 1}>
                    Remove
                  </Button>
                </Grid>
              </React.Fragment>
            );
          })}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => searchRows()}>Apply Filters</Button>
              <Button variant="outlined" onClick={clearFilters}>Clear</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 1, overflowX: "auto" }}>
        <DataGrid
          rows={flattenedRows}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          autoHeight
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "user_data" } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          sx={{ minWidth: Math.max(1600, columns.length * 150) }}
        />
      </Paper>
    </Box>
  );
}
