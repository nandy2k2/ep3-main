import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ep1 from "../api/ep1";
import global1 from "./global1";

const blankJob = {
  jobid: "",
  title: "",
  department: "",
  location: "",
  employmenttype: "",
  openings: 1,
  salaryrange: "",
  description: "",
  eligibility: "",
  skills: "",
  formid: "",
  status: "Draft",
  lastdate: ""
};

const blankField = {
  fieldname: "",
  label: "",
  fieldtype: "Text",
  options: "",
  isrequired: "No",
  page: "Page 1",
  section: "Additional details",
  order: 0
};

const fieldTypes = ["Text", "Textarea", "Number", "Date", "Email", "Phone", "Select", "Radio", "Checkbox", "File", "Photo"];
const yesNo = ["Yes", "No"];
const employmentTypes = [
  "Full time",
  "Part time",
  "Full time Hybrid",
  "Part time Hybrid",
  "Full time work from home",
  "Part Time Work From home",
  "Contractual"
];

export default function RecruitmentManagementPage() {
  const [tab, setTab] = useState(0);
  const [forms, setForms] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [fields, setFields] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedForm, setSelectedForm] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [formData, setFormData] = useState({ formid: "", title: "", description: "", isactive: "Yes" });
  const [jobData, setJobData] = useState(blankJob);
  const [fieldData, setFieldData] = useState(blankField);
  const [docData, setDocData] = useState({ documenttype: "", description: "", isrequired: "No" });
  const [criteria, setCriteria] = useState({ mandatorycriteria: "", validationcriteria: "" });
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [textSearch, setTextSearch] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [confirmationMail, setConfirmationMail] = useState({ subject: "Recruitment confirmation", body: "" });
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const colid = global1.colid;

  const loadForms = async () => {
    const res = await ep1.get("/api/v2/recruitment/forms", { params: { colid } });
    setForms(res.data || []);
    if (!selectedForm && res.data?.[0]?.formid) setSelectedForm(res.data[0].formid);
  };

  const loadJobs = async () => {
    const res = await ep1.get("/api/v2/recruitment/jobs", { params: { colid } });
    setJobs(res.data || []);
    if (!selectedJob && res.data?.[0]?.jobid) setSelectedJob(res.data[0].jobid);
  };

  const loadFields = async (formid = selectedForm) => {
    if (!formid) return setFields([]);
    const res = await ep1.get("/api/v2/recruitment/fields", { params: { colid, formid } });
    setFields(res.data || []);
  };

  const loadDocuments = async (formid = selectedForm) => {
    if (!formid) return setDocuments([]);
    const res = await ep1.get("/api/v2/recruitment/documents", { params: { colid, formid } });
    setDocuments(res.data || []);
  };

  const loadCriteria = async (formid = selectedForm) => {
    if (!formid) return setCriteria({ mandatorycriteria: "", validationcriteria: "" });
    const res = await ep1.get("/api/v2/recruitment/validation", { params: { colid, formid } });
    setCriteria({
      formname: res.data?.formname || forms.find((item) => item.formid === formid)?.title || "",
      mandatorycriteria: res.data?.mandatorycriteria || "",
      validationcriteria: res.data?.validationcriteria || ""
    });
  };

  const loadApplications = async (jobid = selectedJob) => {
    if (!jobid) return setApplications([]);
    const res = await ep1.get("/api/v2/recruitment/applications", { params: { colid, jobid } });
    setApplications(res.data || []);
  };

  useEffect(() => {
    Promise.all([loadForms(), loadJobs()]).catch((err) => setError(err.response?.data?.msg || err.message));
  }, []);

  useEffect(() => {
    loadFields();
    loadDocuments();
    loadCriteria();
  }, [selectedForm]);

  useEffect(() => {
    loadApplications();
  }, [selectedJob]);

  const saveForm = async () => {
    setError("");
    const res = await ep1.post("/api/v2/recruitment/forms", { ...formData, colid, user: global1.user });
    setMessage("Recruitment form saved");
    setSelectedForm(res.data.formid);
    setFormData({ formid: "", title: "", description: "", isactive: "Yes" });
    await loadForms();
  };

  const saveJob = async () => {
    setError("");
    const payload = { ...jobData, colid, user: global1.user, createdByName: global1.name };
    const res = await ep1.post("/api/v2/recruitment/jobs", payload);
    setMessage("Job post saved");
    setSelectedJob(res.data.jobid);
    setJobData(blankJob);
    await loadJobs();
  };

  const saveField = async () => {
    if (!selectedForm) return setError("Select a form first");
    await ep1.post("/api/v2/recruitment/fields", { ...fieldData, colid, formid: selectedForm });
    setMessage("Field saved");
    setFieldData(blankField);
    await loadFields();
  };

  const saveDocument = async () => {
    if (!selectedForm) return setError("Select a form first");
    await ep1.post("/api/v2/recruitment/documents", { ...docData, colid, formid: selectedForm });
    setMessage("Document type saved");
    setDocData({ documenttype: "", description: "", isrequired: "No" });
    await loadDocuments();
  };

  const saveCriteria = async () => {
    if (!selectedForm) return setError("Select a form first");
    await ep1.post("/api/v2/recruitment/validation", { ...criteria, colid, formid: selectedForm, formname: forms.find((f) => f.formid === selectedForm)?.title || selectedForm });
    setMessage("Validation criteria saved");
    await loadCriteria();
  };

  const deleteBy = async (url, payload, reload) => {
    await ep1.post(url, { ...payload, colid });
    setMessage("Deleted");
    await reload();
  };

  const shareLink = (job) => `${window.location.origin}/recruitment-apply?colid=${job.colid}&jobid=${encodeURIComponent(job.jobid)}${job.sharetoken ? `&token=${encodeURIComponent(job.sharetoken)}` : ""}`;

  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setMessage("Share link copied");
    } catch (err) {
      setError("Unable to copy link. Please open the link and copy from the address bar.");
    }
  };

  const copyShareLink = async (job) => {
    const link = shareLink(job);
    await copyText(link);
  };

  const publishAndCopyShareLink = async (job) => {
    try {
      setError("");
      const res = await ep1.post("/api/v2/recruitment/jobs", {
        ...job,
        id: job._id,
        colid,
        status: "Posted",
        user: global1.user,
        createdByName: global1.name
      });
      const updatedJob = res.data || { ...job, status: "Posted" };
      await loadJobs();
      await copyShareLink(updatedJob);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to generate share link");
    }
  };

  const candidateFields = useMemo(() => {
    const fixed = ["applicantname", "email", "phone", "status", "validationstatus"];
    const custom = new Set();
    applications.forEach((app) => Object.keys(app.customfields || {}).forEach((key) => custom.add(key)));
    return [...fixed, ...Array.from(custom).sort()];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const value = filterValue.toLowerCase();
    const search = textSearch.toLowerCase();
    return applications.filter((app) => {
      const allText = JSON.stringify(app).toLowerCase();
      const fieldValue = String(app[filterField] ?? app.customfields?.[filterField] ?? "").toLowerCase();
      return (!filterField || !value || fieldValue.includes(value)) && (!search || allText.includes(search));
    });
  }, [applications, filterField, filterValue, textSearch]);

  const selectedJobInfo = useMemo(() => jobs.find((job) => job.jobid === selectedJob) || {}, [jobs, selectedJob]);

  const candidateSampleMail = (candidate) => {
    const candidateName = candidate?.applicantname || "Candidate";
    const jobTitle = selectedJobInfo.title || selectedJob || "the applied position";
    return `Dear ${candidateName},

Greetings from ${global1.insname || "the institution"}.

We are pleased to inform you that your candidature for ${jobTitle} has been confirmed.

Please keep this email for your records. Further joining formalities and required documents will be communicated separately.

Regards,
${global1.name || "Recruitment Team"}`;
  };

  const selectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setConfirmationMail({
      subject: `Recruitment confirmation - ${selectedJobInfo.title || selectedJob || "Application"}`,
      body: candidateSampleMail(candidate)
    });
  };

  const runAiShortlist = async () => {
    if (!selectedJob || !aiInstruction.trim()) return setError("Select job and enter shortlisting instruction");
    const res = await ep1.post("/api/v2/recruitment/shortlist-ai", { colid, jobid: selectedJob, instruction: aiInstruction });
    setMessage(`AI shortlisting completed. Selected: ${res.data.selectedCount || 0}`);
    await loadApplications();
  };

  const updateCandidateStatus = async (row, status) => {
    await ep1.post("/api/v2/recruitment/application-status", { colid, id: row._id, status, shortlistcomments: status });
    await loadApplications();
  };

  const confirmCandidate = async () => {
    if (!selectedCandidate?._id) return setError("Select a candidate first");
    if (!selectedCandidate.email) return setError("Selected candidate does not have an email address");
    if (!confirmationMail.body.trim()) return setError("Email content is required");
    try {
      setConfirming(true);
      setError("");
      const res = await ep1.post("/api/v2/recruitment/application-status", {
        colid,
        id: selectedCandidate._id,
        status: "Confirmed",
        shortlistcomments: "Confirmed",
        emailsubject: confirmationMail.subject,
        emailbody: confirmationMail.body,
        senderName: global1.name || global1.insname || "Recruitment"
      });
      setMessage(res.data?.mailSent ? "Candidate confirmed and email sent" : "Candidate confirmed");
      await loadApplications();
      setSelectedCandidate({ ...selectedCandidate, status: "Confirmed" });
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to confirm candidate");
    } finally {
      setConfirming(false);
    }
  };

  const jobColumns = [
    { field: "jobid", headerName: "Job ID", width: 130 },
    { field: "title", headerName: "Title", width: 220 },
    { field: "department", headerName: "Department", width: 160 },
    { field: "formid", headerName: "Form", width: 150 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "share",
      headerName: "Share",
      width: 260,
      renderCell: ({ row }) => /^posted$/i.test(row.status || "") ? (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyShareLink(row)}>Copy link</Button>
          <Button size="small" onClick={() => window.open(shareLink(row), "_blank", "noopener,noreferrer")}>Open</Button>
        </Stack>
      ) : (
        <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => publishAndCopyShareLink(row)}>Generate link</Button>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setJobData({ ...blankJob, ...row, id: row._id, lastdate: row.lastdate ? String(row.lastdate).slice(0, 10) : "" })}><EditIcon fontSize="small" /></Button>
          <Button color="error" size="small" onClick={() => deleteBy("/api/v2/recruitment/jobs-delete", { id: row._id }, loadJobs)}><DeleteIcon fontSize="small" /></Button>
        </Stack>
      )
    }
  ];

  const fieldColumns = [
    { field: "page", headerName: "Page", width: 130 },
    { field: "section", headerName: "Section", width: 170 },
    { field: "label", headerName: "Label", width: 190 },
    { field: "fieldname", headerName: "Field", width: 170 },
    { field: "fieldtype", headerName: "Type", width: 120 },
    { field: "isrequired", headerName: "Required", width: 110 },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setFieldData({ ...row, options: (row.options || []).join(",") })}><EditIcon fontSize="small" /></Button>
          <Button color="error" size="small" onClick={() => deleteBy("/api/v2/recruitment/fields-delete", { id: row._id }, loadFields)}><DeleteIcon fontSize="small" /></Button>
        </Stack>
      )
    }
  ];

  const applicationColumns = [
    { field: "applicationno", headerName: "Application", width: 210 },
    { field: "applicantname", headerName: "Candidate", width: 180 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "phone", headerName: "Phone", width: 140 },
    { field: "status", headerName: "Status", width: 130 },
    { field: "validationstatus", headerName: "Validation", width: 130 },
    {
      field: "shortlist",
      headerName: "Shortlist",
      width: 210,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" color="success" onClick={() => updateCandidateStatus(row, "Shortlisted")}>Shortlist</Button>
          <Button size="small" color="error" onClick={() => updateCandidateStatus(row, "Rejected")}>Reject</Button>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Recruitment Management</Typography>
            <Typography variant="body2" color="text.secondary">Job posts, dynamic forms, documents, validation and candidate shortlisting.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Forms ${forms.length}`} color="primary" variant="outlined" />
            <Chip label={`Jobs ${jobs.length}`} color="secondary" variant="outlined" />
            <Chip label={`Candidates ${applications.length}`} color="success" variant="outlined" />
          </Stack>
        </Stack>
        {message && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>{error}</Alert>}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mt: 2 }}>
          <Tab label="Job posts" />
          <Tab label="Forms" />
          <Tab label="Fields" />
          <Tab label="Documents" />
          <Tab label="Validation" />
          <Tab label="Candidates" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" fontWeight={800}>Create job post</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {["jobid", "title", "department", "location", "openings", "salaryrange"].map((name) => (
              <Grid item xs={12} md={name === "title" ? 4 : 2} key={name}>
                <TextField fullWidth size="small" label={name} value={jobData[name] || ""} onChange={(e) => setJobData({ ...jobData, [name]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Employment type" value={jobData.employmenttype || ""} onChange={(e) => setJobData({ ...jobData, employmenttype: e.target.value })}>
                {employmentTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Assign form" value={jobData.formid} onChange={(e) => setJobData({ ...jobData, formid: e.target.value })}>
                {forms.map((form) => <MenuItem key={form.formid} value={form.formid}>{form.title} ({form.formid})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth size="small" label="Status" value={jobData.status} onChange={(e) => setJobData({ ...jobData, status: e.target.value })}>
                {["Draft", "Posted", "Closed"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth size="small" type="date" label="Last date" InputLabelProps={{ shrink: true }} value={jobData.lastdate || ""} onChange={(e) => setJobData({ ...jobData, lastdate: e.target.value })} />
            </Grid>
            {["description", "eligibility", "skills"].map((name) => (
              <Grid item xs={12} md={4} key={name}>
                <TextField fullWidth multiline minRows={3} label={name} value={jobData[name] || ""} onChange={(e) => setJobData({ ...jobData, [name]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={saveJob}>Save job</Button>
            </Grid>
          </Grid>
          <Box sx={{ height: 430, mt: 2 }}>
            <DataGrid rows={jobs} columns={jobColumns} getRowId={(row) => row._id} slots={{ toolbar: GridToolbar }} />
          </Box>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" fontWeight={800}>Recruitment forms</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Form ID" value={formData.formid} onChange={(e) => setFormData({ ...formData, formid: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Form name" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Active" value={formData.isactive} onChange={(e) => setFormData({ ...formData, isactive: e.target.value })}>{yesNo.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12}><Button variant="contained" onClick={saveForm}>Save form</Button></Grid>
          </Grid>
          <Box sx={{ height: 360, mt: 2 }}>
            <DataGrid rows={forms} getRowId={(row) => row._id} slots={{ toolbar: GridToolbar }} columns={[
              { field: "formid", headerName: "Form ID", width: 160 },
              { field: "title", headerName: "Title", width: 240 },
              { field: "description", headerName: "Description", width: 360 },
              { field: "isactive", headerName: "Active", width: 120 },
              { field: "actions", headerName: "Actions", width: 220, renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => { setSelectedForm(row.formid); setFormData(row); }}>Select/Edit</Button>
                  <Button color="error" size="small" onClick={() => deleteBy("/api/v2/recruitment/forms-delete", { id: row._id, formid: row.formid }, loadForms)}>Delete</Button>
                </Stack>
              ) }
            ]} />
          </Box>
        </Paper>
      )}

      {[2, 3, 4].includes(tab) && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 300, mb: 2 }}>
            <InputLabel>Selected form</InputLabel>
            <Select label="Selected form" value={selectedForm} onChange={(e) => setSelectedForm(e.target.value)}>
              {forms.map((form) => <MenuItem key={form.formid} value={form.formid}>{form.title} ({form.formid})</MenuItem>)}
            </Select>
          </FormControl>

          {tab === 2 && (
            <>
              <Typography variant="h6" fontWeight={800}>Custom fields</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {["page", "section", "label", "fieldname"].map((name) => (
                  <Grid item xs={12} md={3} key={name}><TextField fullWidth size="small" label={name} value={fieldData[name] || ""} onChange={(e) => setFieldData({ ...fieldData, [name]: e.target.value })} /></Grid>
                ))}
                <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Type" value={fieldData.fieldtype} onChange={(e) => setFieldData({ ...fieldData, fieldtype: e.target.value })}>{fieldTypes.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={5}><TextField fullWidth size="small" label="Options comma separated" value={fieldData.options || ""} onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })} /></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Required" value={fieldData.isrequired} onChange={(e) => setFieldData({ ...fieldData, isrequired: e.target.value })}>{yesNo.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={1}><TextField fullWidth size="small" type="number" label="Order" value={fieldData.order || 0} onChange={(e) => setFieldData({ ...fieldData, order: e.target.value })} /></Grid>
                <Grid item xs={12}><Button variant="contained" onClick={saveField}>Save field</Button></Grid>
              </Grid>
              <Box sx={{ height: 420, mt: 2 }}><DataGrid rows={fields} columns={fieldColumns} getRowId={(row) => row._id} slots={{ toolbar: GridToolbar }} /></Box>
            </>
          )}

          {tab === 3 && (
            <>
              <Typography variant="h6" fontWeight={800}>Document list for form</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Document type" value={docData.documenttype} onChange={(e) => setDocData({ ...docData, documenttype: e.target.value })} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Description" value={docData.description} onChange={(e) => setDocData({ ...docData, description: e.target.value })} /></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Required" value={docData.isrequired} onChange={(e) => setDocData({ ...docData, isrequired: e.target.value })}>{yesNo.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={1}><Button variant="contained" onClick={saveDocument}>Save</Button></Grid>
              </Grid>
              <Box sx={{ height: 360, mt: 2 }}>
                <DataGrid rows={documents} getRowId={(row) => row._id} slots={{ toolbar: GridToolbar }} columns={[
                  { field: "documenttype", headerName: "Document", width: 220 },
                  { field: "description", headerName: "Description", width: 420 },
                  { field: "isrequired", headerName: "Required", width: 130 },
                  { field: "actions", headerName: "Actions", width: 160, renderCell: ({ row }) => <Button color="error" size="small" onClick={() => deleteBy("/api/v2/recruitment/documents-delete", { id: row._id }, loadDocuments)}>Delete</Button> }
                ]} />
              </Box>
            </>
          )}

          {tab === 4 && (
            <>
              <Typography variant="h6" fontWeight={800}>Mandatory and optional validation criteria</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={8} label="Mandatory criteria" value={criteria.mandatorycriteria} onChange={(e) => setCriteria({ ...criteria, mandatorycriteria: e.target.value })} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={8} label="Optional validation criteria" value={criteria.validationcriteria} onChange={(e) => setCriteria({ ...criteria, validationcriteria: e.target.value })} /></Grid>
                <Grid item xs={12}><Button variant="contained" onClick={saveCriteria}>Save criteria</Button></Grid>
              </Grid>
            </>
          )}
        </Paper>
      )}

      {tab === 5 && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField select size="small" label="Job" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} sx={{ minWidth: 280 }}>
              {jobs.map((job) => <MenuItem key={job.jobid} value={job.jobid}>{job.jobid} - {job.title}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Filter field" value={filterField} onChange={(e) => setFilterField(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="">No field filter</MenuItem>
              {candidateFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Filter value" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
            <TextField size="small" label="Search any text/custom field" value={textSearch} onChange={(e) => setTextSearch(e.target.value)} sx={{ minWidth: 260 }} />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth multiline minRows={2} label="AI shortlisting instruction in English" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} />
            <Button variant="contained" startIcon={<AutoFixHighIcon />} onClick={runAiShortlist} sx={{ minWidth: 180 }}>AI Shortlist</Button>
          </Stack>
          <Box sx={{ height: 470, mt: 2 }}>
            <DataGrid
              rows={filteredApplications}
              columns={applicationColumns}
              getRowId={(row) => row._id}
              slots={{ toolbar: GridToolbar }}
              onRowClick={(params) => selectCandidate(params.row)}
              rowSelectionModel={selectedCandidate?._id ? [selectedCandidate._id] : []}
            />
          </Box>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: "#fbfdff" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>Confirm candidate and send mail</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCandidate
                    ? `Selected: ${selectedCandidate.applicantname || "Candidate"} (${selectedCandidate.email || "no email"})`
                    : "Select a candidate from the grid to load the sample confirmation email."}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled={confirming || !selectedCandidate}
                onClick={confirmCandidate}
              >
                Confirm and Send Email
              </Button>
            </Stack>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email subject"
                  value={confirmationMail.subject}
                  onChange={(e) => setConfirmationMail({ ...confirmationMail, subject: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  label="Sample confirmation mail content"
                  value={confirmationMail.body}
                  onChange={(e) => setConfirmationMail({ ...confirmationMail, body: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>
        </Paper>
      )}
    </Box>
  );
}
