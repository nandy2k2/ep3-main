import React, { useMemo, useState } from "react";
import { CloudUpload, Delete, Download, UploadFile } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const extensionOptions = ["jpg", "jpeg", "png"];

const parseFile = (file, extension) => {
  const parts = String(file.name || "").split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
  const regno = parts.join(".").trim();
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    filename: file.name,
    regno,
    extension: ext,
    size: file.size,
    status: ext === extension && regno ? "Ready" : "Check",
    message: !regno
      ? "Filename must be regno.extension"
      : ext !== extension
        ? `Expected .${extension}`
        : "Ready"
  };
};

const bytes = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export default function StudentPhotoBulkUploadPage() {
  const [extension, setExtension] = useState("jpg");
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewRows = useMemo(() => files.map((file) => parseFile(file, extension)), [files, extension]);
  const readyCount = previewRows.filter((row) => row.status === "Ready").length;
  const issueCount = previewRows.length - readyCount;

  const chooseFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    setFiles(selected);
    setResults([]);
    setMessage("");
    setError("");
  };

  const upload = async () => {
    if (!files.length) return setError("Select one or more student photo files.");
    if (!readyCount) return setError("No valid files are ready for upload.");
    if (issueCount && !window.confirm(`${issueCount} file(s) do not match the selected format and will fail. Continue?`)) return;

    setUploading(true);
    setProgress(5);
    setError("");
    setMessage("");
    setResults([]);
    try {
      const form = new FormData();
      form.append("colid", global1.colid);
      form.append("extension", extension);
      form.append("user", global1.user || "");
      files.forEach((file) => form.append("files", file));
      setProgress(30);
      const res = await ep1.post("/api/v2/user-photo/bulk-student-upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const uploaded = Math.round((event.loaded * 60) / event.total);
            setProgress(Math.min(90, 30 + uploaded));
          }
        }
      });
      setProgress(100);
      setResults((res.data.results || []).map((row, index) => ({ ...row, id: `${row.filename}-${index}` })));
      setMessage(`Processed ${res.data.total || 0} photo(s). Updated ${res.data.updated || 0}, failed ${res.data.failed || 0}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload student photos.");
    } finally {
      setUploading(false);
    }
  };

  const exportResults = () => {
    const worksheet = XLSX.utils.json_to_sheet(results.length ? results : previewRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Photos");
    XLSX.writeFile(workbook, "student_photo_bulk_upload_results.xlsx");
  };

  const previewColumns = [
    { field: "filename", headerName: "Filename", minWidth: 240, flex: 1 },
    { field: "regno", headerName: "Reg No", minWidth: 170 },
    { field: "extension", headerName: "Extension", width: 110 },
    { field: "size", headerName: "Size", width: 120, valueGetter: (params) => bytes(params.row.size) },
    { field: "status", headerName: "Status", width: 120 },
    { field: "message", headerName: "Message", minWidth: 230, flex: 1 }
  ];

  const resultColumns = [
    { field: "filename", headerName: "Filename", minWidth: 230, flex: 1 },
    { field: "regno", headerName: "Reg No", minWidth: 150 },
    { field: "student", headerName: "Student", minWidth: 180 },
    { field: "programcode", headerName: "Program Code", minWidth: 130 },
    { field: "status", headerName: "Status", width: 130 },
    { field: "message", headerName: "Message", minWidth: 240, flex: 1 },
    {
      field: "url",
      headerName: "Photo",
      minWidth: 120,
      renderCell: (params) => params.value ? <a href={params.value} target="_blank" rel="noreferrer">View</a> : ""
    }
  ];

  return (
    <MenuPageShell title="Student Photo Bulk Upload">
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} alignItems={{ md: "center" }}>
            <Box>
              <Typography variant="h5" fontWeight={900}>Student Photo Bulk Upload</Typography>
              <Typography color="text.secondary">
                Select photos named as regno.extension, for example REG001.jpg. Photos are uploaded to AWS and saved in the user photo field.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button startIcon={<Download />} variant="outlined" disabled={!previewRows.length && !results.length} onClick={exportResults}>Export</Button>
              <Button startIcon={<Delete />} variant="outlined" color="error" disabled={uploading || !files.length} onClick={() => { setFiles([]); setResults([]); }}>Clear</Button>
            </Stack>
          </Stack>
          {message && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>{error}</Alert>}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label="Photo format" value={extension} onChange={(event) => setExtension(event.target.value)}>
                {extensionOptions.map((item) => <MenuItem value={item} key={item}>.{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <Button fullWidth component="label" variant="outlined" startIcon={<UploadFile />} sx={{ height: 56 }}>
                Select photos
                <input hidden multiple type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={chooseFiles} />
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="contained" startIcon={<CloudUpload />} disabled={uploading || !files.length} onClick={upload} sx={{ height: 56 }}>
                {uploading ? "Uploading..." : `Upload ${files.length || ""} photo${files.length === 1 ? "" : "s"}`}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Alert severity="info" sx={{ flex: 1 }}>Selected: {files.length} | Ready: {readyCount} | Needs attention: {issueCount}</Alert>
                <Alert severity="warning" sx={{ flex: 1 }}>Only users with role Student and matching regno in this institution will be updated.</Alert>
              </Stack>
            </Grid>
            {uploading && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Upload progress: {progress}%</Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <Typography variant="h6" fontWeight={850} sx={{ p: 1 }}>Selected files</Typography>
          <DataGrid
            rows={previewRows}
            columns={previewColumns}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_photo_bulk_upload_preview" } } }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{ minWidth: 1100 }}
          />
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <Typography variant="h6" fontWeight={850} sx={{ p: 1 }}>Upload results</Typography>
          <DataGrid
            rows={results}
            columns={resultColumns}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "student_photo_bulk_upload_results" } } }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{ minWidth: 1200 }}
          />
        </Paper>
      </Stack>
    </MenuPageShell>
  );
}
