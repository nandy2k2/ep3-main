import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Add, Delete, Edit, FileDownload, Refresh, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const blankForm = { title: "", module: [], topic: [], description: "", url: "", filename: "", originalname: "", status: "Active" };
const resourceTypes = ["Course Material", "Lesson Plan"];
const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const listFromValue = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
};
const valueFromList = (value) => listFromValue(value).join(", ");
const normalizeHeader = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const headerMap = {
  title: "title",
  module: "module",
  topic: "topic",
  description: "description",
  filelink: "url",
  link: "url",
  url: "url",
  filename: "filename",
  originalname: "originalname",
  status: "status"
};

export default function NepLmsAdminResourceAssignmentPage() {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [resourceType, setResourceType] = useState("Course Material");
  const [syllabusRows, setSyllabusRows] = useState([]);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [bulkRows, setBulkRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadFaculty();
  }, []);

  useEffect(() => {
    if (selectedFaculty?.email) loadFacultyCourses(selectedFaculty.email);
    else {
      setCourses([]);
      setSelectedCourseId("");
      setResources([]);
      setSyllabusRows([]);
    }
  }, [selectedFaculty]);

  useEffect(() => {
    if (selectedCourse) {
      loadSyllabus(selectedCourse);
      loadResources(selectedCourse);
      setForm(blankForm);
      setEditingId("");
      setBulkRows([]);
    }
  }, [selectedCourseId, resourceType]);

  const selectedCourse = useMemo(() => courses.find((row) => row._id === selectedCourseId) || null, [courses, selectedCourseId]);
  const moduleOptions = useMemo(() => uniqueSorted(syllabusRows.map((row) => row.module)), [syllabusRows]);
  const topicOptions = useMemo(() => {
    const modules = listFromValue(form.module);
    const rows = modules.length ? syllabusRows.filter((row) => modules.includes(String(row.module || "").trim())) : syllabusRows;
    return uniqueSorted(rows.map((row) => row.syllabus));
  }, [form.module, syllabusRows]);

  const loadFaculty = async () => {
    try {
      setError("");
      const res = await ep1.get("/api/v2/workloadassignment/options", { params: { colid: global1.colid } });
      setFaculty((res.data?.faculty || []).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load faculty");
    }
  };

  const loadFacultyCourses = async (facultyemail) => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/workloadassignment", { params: { colid: global1.colid, facultyemail } });
      const data = res.data?.data || [];
      setCourses(data);
      setSelectedCourseId(data[0]?._id || "");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load faculty workload");
    } finally {
      setLoading(false);
    }
  };

  const coursePayload = (course = selectedCourse) => ({
    colid: global1.colid,
    user: global1.user,
    academicyear: course?.academicyear || "",
    regulation: course?.regulation || "",
    program: course?.program || "",
    programcode: course?.programcode || "",
    type: course?.type || "",
    major: course?.subject || "",
    semester: course?.semester || "",
    course: course?.course || "",
    coursecode: course?.coursecode || "",
    faculty: course?.facultyname || selectedFaculty?.name || "",
    facultyemail: course?.facultyemail || selectedFaculty?.email || ""
  });

  const loadSyllabus = async (course) => {
    try {
      const res = await ep1.get("/api/v2/syllabus", {
        params: {
          colid: global1.colid,
          academicyear: course.academicyear,
          regulation: course.regulation,
          program: course.program,
          programcode: course.programcode,
          type: course.type,
          subject: course.subject,
          semester: course.semester,
          course: course.course,
          coursecode: course.coursecode
        }
      });
      setSyllabusRows(res.data?.data || []);
    } catch (err) {
      setSyllabusRows([]);
    }
  };

  const loadResources = async (course = selectedCourse) => {
    if (!course) return;
    try {
      const res = await ep1.get("/api/v2/neplms/resources", {
        params: {
          colid: global1.colid,
          academicyear: course.academicyear,
          semester: course.semester,
          coursecode: course.coursecode,
          facultyemail: course.facultyemail,
          resourcetype: resourceType
        }
      });
      setResources(res.data?.data || []);
    } catch (err) {
      setResources([]);
      setError(err.response?.data?.message || "Unable to load resources");
    }
  };

  const resetForm = () => {
    setForm(blankForm);
    setEditingId("");
  };

  const saveResource = async () => {
    if (!selectedCourse) {
      setError("Select faculty and course first");
      return;
    }
    if (!form.title && !form.url) {
      setError("Enter title or file link");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload = {
        ...coursePayload(),
        resourcetype: resourceType,
        title: form.title,
        module: valueFromList(form.module),
        topic: valueFromList(form.topic),
        description: form.description,
        url: form.url,
        filename: form.filename,
        originalname: form.originalname || form.filename || form.title,
        status: form.status || "Active"
      };
      if (editingId) await ep1.post("/api/v2/neplms/resources/update", { ...payload, id: editingId });
      else {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => data.append(key, value || ""));
        await ep1.post("/api/v2/neplms/resources", data, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setMessage(editingId ? "Resource updated" : "Resource added");
      resetForm();
      loadResources();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save resource");
    } finally {
      setLoading(false);
    }
  };

  const editResource = (row) => {
    setEditingId(row._id);
    setForm({
      title: row.title || "",
      module: listFromValue(row.module),
      topic: listFromValue(row.topic),
      description: row.description || "",
      url: row.url || "",
      filename: row.filename || "",
      originalname: row.originalname || "",
      status: row.status || "Active"
    });
  };

  const deleteResource = async (row) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await ep1.post("/api/v2/neplms/resources/delete", { id: row._id, colid: global1.colid });
      setMessage("Resource deleted");
      loadResources();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete resource");
    }
  };

  const buildTemplate = () => {
    const firstSyllabus = syllabusRows[0] || {};
    const ws = XLSX.utils.json_to_sheet([{
      Title: `${resourceType} - ${selectedCourse?.course || ""}`,
      Module: firstSyllabus.module || "",
      Topic: firstSyllabus.syllabus || "",
      Description: "",
      "File Link": "",
      Filename: "",
      "Original Name": "",
      Status: "Active"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, resourceType);
    XLSX.writeFile(wb, `Admin_${resourceType.replace(/\s+/g, "_")}_Template.xlsx`);
  };

  const readExcel = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const parsed = jsonRows.map((row, index) => {
          const item = { rowNumber: index + 2, status: "Active" };
          Object.entries(row).forEach(([header, value]) => {
            const mapped = headerMap[normalizeHeader(header)];
            if (mapped) item[mapped] = value;
          });
          return item;
        }).filter((row) => row.title || row.module || row.topic || row.description || row.url);
        setBulkRows(parsed);
        setMessage(`${parsed.length} rows ready for upload`);
      } catch (err) {
        setError("Unable to read Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const uploadBulk = async () => {
    if (!selectedCourse) {
      setError("Select faculty and course first");
      return;
    }
    if (!bulkRows.length) {
      setError("Choose an Excel file first");
      return;
    }
    try {
      setLoading(true);
      let inserted = 0;
      for (const row of bulkRows) {
        const data = new FormData();
        Object.entries({
          ...coursePayload(),
          resourcetype: resourceType,
          title: row.title || `${resourceType} - ${selectedCourse.course}`,
          module: row.module || "",
          topic: row.topic || "",
          description: row.description || "",
          url: row.url || "",
          filename: row.filename || "",
          originalname: row.originalname || row.filename || row.title || "",
          status: row.status || "Active"
        }).forEach(([key, value]) => data.append(key, value || ""));
        await ep1.post("/api/v2/neplms/resources", data, { headers: { "Content-Type": "multipart/form-data" } });
        inserted += 1;
      }
      setBulkRows([]);
      setMessage(`${inserted} rows uploaded`);
      loadResources();
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => editResource(params.row)} />,
        <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => deleteResource(params.row)} />
      ]
    },
    { field: "title", headerName: "Title", width: 220 },
    { field: "module", headerName: "Module", width: 160 },
    { field: "topic", headerName: "Topic", width: 240 },
    { field: "description", headerName: "Description", width: 260 },
    {
      field: "url",
      headerName: "Link",
      width: 240,
      renderCell: (params) => params.value ? <Button size="small" href={params.value} target="_blank">Open</Button> : "-"
    },
    { field: "status", headerName: "Status", width: 120 },
    { field: "createdAt", headerName: "Created", width: 180, valueGetter: (params) => params.row.createdAt ? new Date(params.row.createdAt).toLocaleString() : "" }
  ];

  return (
    <MenuPageShell title="Admin Resource Assignment">
      <Box p={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Admin Assignment of Lesson Plans and Course Material</Typography>
            <Typography variant="body2" color="text.secondary">Select faculty, select assigned course, then add entries manually or through Excel.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => selectedFaculty?.email ? loadFacultyCourses(selectedFaculty.email) : loadFaculty()}>Reload</Button>
        </Stack>

        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={faculty}
                value={selectedFaculty}
                onChange={(event, value) => setSelectedFaculty(value)}
                getOptionLabel={(option) => `${option.name || ""}${option.email ? ` (${option.email})` : ""}`}
                renderInput={(params) => <TextField {...params} label="Faculty" />}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Assigned Course</InputLabel>
                <Select label="Assigned Course" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
                  {courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.coursecode} - {course.course} | {course.programcode} | Sem {course.semester}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select label="Resource Type" value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
                  {resourceTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {selectedCourse && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
              <Chip label={`Year: ${selectedCourse.academicyear}`} />
              <Chip label={`Program: ${selectedCourse.programcode}`} />
              <Chip label={`Subject: ${selectedCourse.subject}`} />
              <Chip label={`Faculty: ${selectedCourse.facultyname}`} />
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Module</InputLabel>
                <Select
                  multiple
                  label="Module"
                  value={listFromValue(form.module)}
                  renderValue={(selected) => selected.join(", ")}
                  onChange={(event) => {
                    const nextModules = Array.isArray(event.target.value) ? event.target.value : listFromValue(event.target.value);
                    const availableTopics = uniqueSorted(syllabusRows.filter((row) => nextModules.includes(String(row.module || "").trim())).map((row) => row.syllabus));
                    setForm((prev) => ({ ...prev, module: nextModules, topic: listFromValue(prev.topic).filter((topic) => availableTopics.includes(topic)) }));
                  }}
                >
                  {moduleOptions.map((module) => (
                    <MenuItem key={module} value={module}>
                      <Checkbox checked={listFromValue(form.module).includes(module)} />
                      <ListItemText primary={module} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Topic</InputLabel>
                <Select multiple label="Topic" value={listFromValue(form.topic)} renderValue={(selected) => selected.join(", ")} onChange={(event) => setForm((prev) => ({ ...prev, topic: Array.isArray(event.target.value) ? event.target.value : listFromValue(event.target.value) }))}>
                  {topicOptions.map((topic) => (
                    <MenuItem key={topic} value={topic}>
                      <Checkbox checked={listFromValue(form.topic).includes(topic)} />
                      <ListItemText primary={topic} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="File Link" value={form.url} onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Filename" value={form.filename} onChange={(event) => setForm((prev) => ({ ...prev, filename: event.target.value }))} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Original Name" value={form.originalname} onChange={(event) => setForm((prev) => ({ ...prev, originalname: event.target.value }))} /></Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="contained" startIcon={<Save />} sx={{ height: 56 }} onClick={saveResource} disabled={loading}>{editingId ? "Update" : "Add"}</Button>
                {editingId && <Button variant="outlined" sx={{ height: 56 }} onClick={resetForm}>Cancel</Button>}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <Typography variant="subtitle2" fontWeight={800}>Bulk Upload</Typography>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={buildTemplate}>Template</Button>
            <Button variant="outlined" component="label" startIcon={<UploadFile />}>Choose Excel<input hidden type="file" accept=".xlsx,.xls" onChange={readExcel} /></Button>
            <Chip label={`${bulkRows.length} rows ready`} />
            <Button variant="contained" startIcon={<Add />} onClick={uploadBulk} disabled={loading || !bulkRows.length}>Upload Rows</Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Excel columns: Title, Module, Topic, Description, File Link, Filename, Original Name, Status.
          </Typography>
        </Paper>

        <Paper sx={{ p: 1, overflowX: "auto" }}>
          <DataGrid
            rows={resources.map((row) => ({ ...row, id: row._id }))}
            columns={columns}
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "admin_nep_lms_resources" } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            sx={{ minWidth: 1500 }}
          />
        </Paper>
      </Box>
    </MenuPageShell>
  );
}
