import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ep1 from "../api/ep1";
import global1 from "./global1";

const subjectFields = ["Major", "Minor", "AEC", "SEC", "VAC", "IDC"];
const fields = ["name", "regno", "email", "phone", "program", "programcode", "regulation", ...subjectFields, "academicyear", "admissionyear", "rollno", "gender", "category", "state", "city", "district", "pincode", "guardianname", "guardianmobile", "guardianemail", "photo", "semester", "section"];
const academicYears = ["2023-24", "2024-25", "2025-26", "2026-27", "2027-28"];
const semesters = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const staticDropdownOptions = {
  academicyear: academicYears,
  admissionyear: academicYears,
  gender: ["Male", "Female", "Not specified"],
  semester: semesters,
  category: ["General", "SC", "ST", "OBC"]
};
const labels = {
  name: "Name",
  regno: "Reg No",
  email: "Email",
  phone: "Phone",
  program: "Program",
  programcode: "Program Code",
  regulation: "Regulation",
  Major: "Major",
  Minor: "Minor",
  AEC: "AEC",
  SEC: "SEC",
  VAC: "VAC",
  IDC: "IDC",
  academicyear: "Academic Year",
  admissionyear: "Admission Year",
  rollno: "Roll No",
  gender: "Gender",
  category: "Category",
  state: "State",
  city: "City",
  district: "District",
  pincode: "Pincode",
  guardianname: "Guardian Name",
  guardianmobile: "Guardian Mobile",
  guardianemail: "Guardian Email",
  photo: "Photo",
  semester: "Semester",
  section: "Section"
};
const blankForm = fields.reduce((acc, field) => ({ ...acc, [field]: staticDropdownOptions[field]?.[0] || "" }), {});
const normalizeKey = (key) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const valueFromRow = (row, field) => {
  const aliases = {
    regno: ["regno", "reg no", "registration no", "registration number"],
    programcode: ["programcode", "program code"],
    Major: ["major", "Major"],
    Minor: ["minor", "Minor"],
    AEC: ["aec", "AEC"],
    SEC: ["sec", "SEC"],
    VAC: ["vac", "VAC"],
    IDC: ["idc", "IDC"],
    academicyear: ["academicyear", "academic year"],
    admissionyear: ["admissionyear", "admission year"],
    rollno: ["rollno", "roll no", "roll number"],
    gender: ["gender"],
    category: ["category"],
    state: ["state"],
    city: ["city"],
    district: ["district"],
    pincode: ["pincode", "pin code", "pin"],
    guardianname: ["guardianname", "guardian name"],
    guardianmobile: ["guardianmobile", "guardian mobile", "guardian phone"],
    guardianemail: ["guardianemail", "guardian email"],
    photo: ["photo", "photo link", "photolink"]
  };
  const normalized = Object.entries(row).reduce((acc, [key, value]) => {
    acc[normalizeKey(key)] = value;
    return acc;
  }, {});
  const keys = aliases[field] || [field];
  for (const key of keys) {
    const value = normalized[normalizeKey(key)];
    if (value !== undefined) return value;
  }
  return "";
};

export default function StudentDataUploadPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [programOptions, setProgramOptions] = useState([]);
  const [regulationOptions, setRegulationOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState({});
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAcademicOptions();
    loadRows();
  }, []);

  useEffect(() => {
    loadSubjectOptions();
  }, [form.programcode, form.program, form.regulation, form.academicyear]);

  const loadAcademicOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/regulationsubject/options", { params: { colid: global1.colid } });
      const programs = (res.data?.programs || [])
        .filter((item) => item.program || item.programcode)
        .sort((a, b) => `${a.program || ""} ${a.programcode || ""}`.localeCompare(`${b.program || ""} ${b.programcode || ""}`));
      setProgramOptions(programs);
      setRegulationOptions(res.data?.regulations || []);
    } catch (err) {
      setProgramOptions([]);
      setRegulationOptions([]);
    }
  };

  const loadSubjectOptions = async () => {
    if (!form.program && !form.programcode) {
      setSubjectOptions({});
      return;
    }
    if (!form.regulation) {
      setSubjectOptions({});
      return;
    }
    try {
      const res = await ep1.get("/api/v2/regulationsubject", {
        params: {
          colid: global1.colid,
          regulation: form.regulation,
          program: form.program,
          programcode: form.programcode,
          academicyear: form.academicyear,
          status: "Active"
        }
      });
      const grouped = {};
      subjectFields.forEach((type) => {
        grouped[type] = [];
      });
      (res.data?.data || []).forEach((item) => {
        if (!grouped[item.type]) grouped[item.type] = [];
        if (item.subject && !grouped[item.type].includes(item.subject)) grouped[item.type].push(item.subject);
      });
      Object.keys(grouped).forEach((key) => grouped[key].sort((a, b) => a.localeCompare(b)));
      setSubjectOptions(grouped);
    } catch (err) {
      setSubjectOptions({});
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await ep1.get("/api/v2/student-data-upload", { params: { colid: global1.colid } });
      setRows(res.data || []);
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load student data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(blankForm);
    setEditingId("");
    setError("");
  };

  const fieldOptions = (field) => {
    if (field === "program") return programOptions.map((item) => `${item.program || item.name || ""} (${item.programcode || ""})`);
    if (field === "regulation") return regulationOptions.map((item) => item.regulation).filter(Boolean);
    if (subjectFields.includes(field)) return subjectOptions[field] || [];
    return staticDropdownOptions[field] || [];
  };

  const fieldValue = (field) => {
    if (field === "program" && form.program) return `${form.program || ""} (${form.programcode || ""})`;
    return form[field] || "";
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "program") {
        const selected = programOptions.find((item) => `${item.program || item.name || ""} (${item.programcode || ""})` === value);
        next.program = selected?.program || selected?.name || "";
        next.programcode = selected?.programcode || "";
        subjectFields.forEach((subjectField) => {
          next[subjectField] = "";
        });
      }
      if (field === "regulation" || field === "academicyear") {
        subjectFields.forEach((subjectField) => {
          next[subjectField] = "";
        });
      }
      return next;
    });
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPhotoUploading(true);
      setError("");
      const data = new FormData();
      data.append("photo", file);
      data.append("colid", global1.colid);
      data.append("user", global1.user);
      const res = await ep1.post("/api/v2/student-data-upload-photo", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      updateField("photo", res.data?.url || "");
      setMessage("Photo uploaded");
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveStudent = async () => {
    try {
      if (!form.email) {
        setError("Email is required");
        return;
      }
      setError("");
      setMessage("");
      const payload = { ...form, colid: global1.colid, user: global1.user, institution: global1.insname };
      if (editingId) {
        await ep1.post("/api/v2/student-data-upload-update", { ...payload, id: editingId });
        setMessage("Student updated");
      } else {
        await ep1.post("/api/v2/student-data-upload", payload);
        setMessage("Student added");
      }
      resetForm();
      loadRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to save student");
    }
  };

  const editRow = (row) => {
    const next = {};
    fields.forEach((field) => {
      next[field] = row[field] ?? "";
    });
    next.major = row.major || row.Major || "";
    next.minor = row.minor || row.Minor || "";
    next.Major = row.Major || row.major || "";
    next.Minor = row.Minor || row.minor || "";
    next.AEC = row.AEC || row.aec || "";
    next.SEC = row.SEC || row.sec || "";
    next.VAC = row.VAC || row.vac || "";
    next.IDC = row.IDC || row.idc || "";
    setForm(next);
    setEditingId(row._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRow = async (row) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      setError("");
      setMessage("");
      await ep1.post("/api/v2/student-data-upload-delete", { id: row._id, colid: global1.colid });
      setMessage("Student deleted");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to delete student");
    }
  };

  const bulkDeleteRows = async () => {
    if (!selectedIds.length) {
      setError("Select at least one student to delete");
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected student(s)?`)) return;
    try {
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/student-data-upload-bulk-delete", {
        ids: selectedIds,
        colid: global1.colid
      });
      setMessage(`Bulk delete completed. Deleted: ${res.data?.deleted || 0}`);
      setSelectedIds([]);
      loadRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to bulk delete students");
    }
  };

  const downloadTemplate = () => {
    const template = fields.reduce((acc, field) => ({ ...acc, [labels[field]]: "" }), {});
    const worksheet = XLSX.utils.json_to_sheet([template]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "student_data_upload_template.xlsx");
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
      const items = excelRows.map((row, index) => {
        const item = { rowNumber: index + 2 };
        fields.forEach((field) => {
          item[field] = valueFromRow(row, field);
        });
        return item;
      });
      const res = await ep1.post("/api/v2/student-data-upload-bulk", {
        colid: global1.colid,
        user: global1.user,
        institution: global1.insname,
        items
      });
      const errors = res.data?.errors || [];
      setMessage(`Bulk upload completed. Saved: ${res.data?.saved || 0}${errors.length ? `, Errors: ${errors.length}` : ""}`);
      setError(errors.length ? errors.slice(0, 5).map((item) => `Row ${item.rowNumber}: ${item.msg}`).join(" | ") : "");
      loadRows();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to upload Excel file");
    }
  };

  const columns = useMemo(() => [
    ...fields.map((field) => ({
      field,
      headerName: labels[field],
      width: field === "email" || field === "photo" ? 220 : field === "program" ? 190 : field === "academicyear" || field === "admissionyear" ? 150 : 140
    })),
    { field: "user", headerName: "User", width: 160 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 140,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => editRow(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => deleteRow(params.row)} />
      ]
    }
  ], []);

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Student Data Upload</Typography>
          <Typography variant="body2" color="text.secondary">Maintain student records with limited fields. Required hidden user fields are auto-filled.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/dashdashfacnew")}>Back</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadRows}>Refresh</Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadTemplate}>Template</Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={bulkDeleteRows} disabled={!selectedIds.length}>
            Delete Selected ({selectedIds.length})
          </Button>
          <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
            Bulk Upload
            <input type="file" accept=".xlsx,.xls" hidden onChange={handleBulkUpload} />
          </Button>
        </Stack>
      </Stack>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6">{editingId ? "Edit Student" : "Add Student"}</Typography>
          <Typography variant="body2" color="text.secondary">Records loaded: {rows.length}</Typography>
        </Stack>
        <Grid container spacing={2}>
          {fields.map((field) => (
            <Grid item xs={12} sm={6} md={3} key={field}>
              <TextField
                fullWidth
                select={fieldOptions(field).length > 0 && field !== "programcode"}
                disabled={field === "programcode"}
                required={field === "email"}
                label={labels[field]}
                value={fieldValue(field)}
                onChange={(event) => updateField(field, event.target.value)}
              >
                {fieldOptions(field).map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ height: 56 }} disabled={photoUploading}>
              {photoUploading ? "Uploading..." : "Upload Photo"}
              <input type="file" accept=".jpg,.jpeg,.png" hidden onChange={uploadPhoto} />
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveStudent}>{editingId ? "Update" : "Save"}</Button>
              <Button variant="outlined" onClick={resetForm}>{editingId ? "Cancel Edit" : "Clear"}</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 1, overflowX: "auto" }}>
        <DataGrid
          rows={rows.map((row) => ({ ...row, id: row._id, major: row.major || row.Major || "", minor: row.minor || row.Minor || "" }))}
          columns={columns}
          loading={loading}
          checkboxSelection
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={(selection) => setSelectedIds(Array.from(selection))}
          disableRowSelectionOnClick
          autoHeight
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_data_upload" } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          sx={{ minWidth: 1750 }}
        />
      </Paper>
    </Box>
  );
}
