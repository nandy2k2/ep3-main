import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ep1 from "../api/ep1";

const fieldDefault = (field) => field.fieldtype === "Checkbox" ? [] : "";

export default function PublicRecruitmentApplyPage() {
  const query = new URLSearchParams(window.location.search);
  const colid = Number(query.get("colid") || 0);
  const jobid = query.get("jobid") || "";
  const token = query.get("token") || "";
  const [bundle, setBundle] = useState(null);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ applicantname: "", email: "", phone: "", username: "", password: "", photourl: "", customfields: {}, documents: [] });
  const [retrieve, setRetrieve] = useState({ applicationno: "", email: "", phone: "" });
  const [showRetrieve, setShowRetrieve] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fields = useMemo(() => bundle?.fields || [], [bundle]);
  const docs = useMemo(() => bundle?.documents || [], [bundle]);
  const photoDocument = useMemo(() => form.documents?.find((doc) => /photo/i.test(doc.documenttype || doc.originalname || "")), [form.documents]);
  const photoUrl = form.photourl || photoDocument?.url || "";

  const pages = useMemo(() => {
    const ordered = [];
    fields.forEach((field) => {
      const page = field.page || "Page 1";
      if (!ordered.includes(page)) ordered.push(page);
    });
    return ["Basic details", ...ordered, "Documents", "Preview"];
  }, [fields]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ep1.get("/api/v2/recruitment/public-job", { params: { colid, jobid, token } });
        setBundle(res.data);
        const customfields = {};
        (res.data.fields || []).forEach((field) => { customfields[field.fieldname] = fieldDefault(field); });
        setForm((old) => ({ ...old, customfields }));
      } catch (err) {
        setError(err.response?.data?.msg || err.message);
      }
    };
    if (colid && jobid) load();
  }, [colid, jobid, token]);

  const updateCustom = (field, value) => setForm((old) => ({ ...old, customfields: { ...old.customfields, [field]: value } }));

  const uploadDocument = async (docType, file, description = "") => {
    if (!file) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append("document", file);
      data.append("colid", colid);
      data.append("jobid", jobid);
      data.append("documenttype", docType);
      data.append("description", description);
      const res = await ep1.post("/api/v2/recruitment/upload-document", data, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((old) => ({
        ...old,
        ...(docType === "Candidate Photo" ? { photourl: res.data.url } : {}),
        documents: [...(old.documents || []).filter((d) => d.documenttype !== docType), res.data]
      }));
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateAndSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        username: form.email,
        photourl: photoUrl,
        colid,
        jobid,
        formid: bundle.job.formid,
        status: "Submitted"
      };
      const validationRes = await ep1.post("/api/v2/recruitment/validate-application", payload);
      setValidation(validationRes.data);
      if (validationRes.data?.mandatoryFailed) {
        setTab(0);
        return;
      }
      const submitRes = await ep1.post("/api/v2/recruitment/submit-application", {
        ...payload,
        validationstatus: validationRes.data.validationstatus,
        validationcomments: validationRes.data.validationcomments,
        mandatoryvalidationstatus: validationRes.data.mandatoryFailed ? "Fail" : "Pass",
        mandatoryvalidationcomments: validationRes.data.validationcomments,
        mode: submitted ? "update" : ""
      });
      setSubmitted(submitRes.data);
      setTab(pages.length - 1);
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  const retrieveApplication = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/recruitment/retrieve-application", { ...retrieve, colid });
      setSubmitted(res.data);
      setForm({
        applicantname: res.data.applicantname || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        username: res.data.username || res.data.email || "",
        password: res.data.password || "",
        photourl: res.data.photourl || "",
        customfields: res.data.customfields || {},
        documents: res.data.documents || []
      });
      setTab(pages.length - 1);
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = form.customfields?.[field.fieldname] ?? "";
    const label = `${field.label}${field.isrequired === "Yes" ? " *" : ""}`;
    if (["Select", "Radio"].includes(field.fieldtype)) {
      return (
        <TextField select fullWidth label={label} value={value} onChange={(e) => updateCustom(field.fieldname, e.target.value)}>
          {(field.options || []).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
      );
    }
    if (field.fieldtype === "Textarea") return <TextField fullWidth multiline minRows={3} label={label} value={value} onChange={(e) => updateCustom(field.fieldname, e.target.value)} />;
    if (["File", "Photo"].includes(field.fieldtype)) {
      const uploaded = form.documents.find((doc) => doc.documenttype === field.label || doc.documenttype === field.fieldname);
      return (
        <Stack spacing={1}>
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading}>
            Upload {label}
            <input hidden type="file" accept={field.fieldtype === "Photo" ? ".jpg,.jpeg,.png" : undefined} onChange={(e) => uploadDocument(field.label || field.fieldname, e.target.files?.[0])} />
          </Button>
          {uploaded?.url && <Typography variant="caption" component="a" href={uploaded.url} target="_blank" rel="noreferrer">{uploaded.url}</Typography>}
        </Stack>
      );
    }
    const type = field.fieldtype === "Number" ? "number" : field.fieldtype === "Date" ? "date" : field.fieldtype === "Email" ? "email" : "text";
    return <TextField fullWidth type={type} InputLabelProps={type === "date" ? { shrink: true } : undefined} label={label} value={value} onChange={(e) => updateCustom(field.fieldname, e.target.value)} />;
  };

  if (!colid || !jobid) return <Box sx={{ p: 3 }}><Alert severity="error">Recruitment link is invalid.</Alert></Box>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", p: { xs: 1.5, md: 3 } }}>
      <Paper sx={{ maxWidth: 1120, mx: "auto", p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {validation?.mandatoryFailed && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            Mandatory validation failed. Please correct the following before submission.
            {"\n"}{validation.validationcomments}
          </Alert>
        )}
        {validation && !validation.mandatoryFailed && (
          <Alert severity="success" sx={{ mb: 2, whiteSpace: "pre-line" }}>{validation.validationcomments}</Alert>
        )}

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={900}>{bundle?.job?.title || "Recruitment Application"}</Typography>
            <Typography color="text.secondary">{bundle?.job?.department} {bundle?.job?.location ? `| ${bundle.job.location}` : ""}</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={bundle?.job?.employmenttype || "Job"} color="primary" />
            <Chip label={`Openings: ${bundle?.job?.openings || 1}`} variant="outlined" />
          </Stack>
        </Stack>

        <Button sx={{ mt: 1 }} size="small" onClick={() => setShowRetrieve((v) => !v)}>Already applied? Retrieve application</Button>
        {showRetrieve && (
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography fontWeight={800} sx={{ mb: 1 }}>Retrieve application</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Application number" value={retrieve.applicationno} onChange={(e) => setRetrieve({ ...retrieve, applicationno: e.target.value })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Email" value={retrieve.email} onChange={(e) => setRetrieve({ ...retrieve, email: e.target.value })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Phone" value={retrieve.phone} onChange={(e) => setRetrieve({ ...retrieve, phone: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={retrieveApplication} disabled={loading}>Retrieve</Button></Grid>
            </Grid>
          </Paper>
        )}

        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ mt: 2 }}>
          {pages.map((page) => <Tab key={page} label={page} />)}
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {pages[tab] === "Basic details" && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="Applicant name *" value={form.applicantname} onChange={(e) => setForm({ ...form, applicantname: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value, username: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                  <Typography fontWeight={800}>Candidate Photo *</Typography>
                  <Typography variant="body2" color="text.secondary">Upload JPG, JPEG or PNG.</Typography>
                  <Button sx={{ mt: 1 }} variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading}>
                    Upload Photo
                    <input hidden type="file" accept=".jpg,.jpeg,.png" onChange={(e) => uploadDocument("Candidate Photo", e.target.files?.[0], "Candidate Photo")} />
                  </Button>
                  {photoUrl && (
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                      <Box component="img" src={photoUrl} alt="Candidate" sx={{ width: 70, height: 82, objectFit: "cover", border: "1px solid #d1d5db" }} />
                      <Typography sx={{ wordBreak: "break-all" }} variant="caption" component="a" href={photoUrl} target="_blank" rel="noreferrer">{photoUrl}</Typography>
                    </Stack>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}><Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{bundle?.job?.description}</Typography></Grid>
            </Grid>
          )}

          {fields.some((field) => field.page === pages[tab]) && (
            <Grid container spacing={2}>
              {fields.filter((field) => field.page === pages[tab]).map((field) => (
                <Grid item xs={12} md={field.fieldtype === "Textarea" ? 12 : 6} key={field._id}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          )}

          {pages[tab] === "Documents" && (
            <Grid container spacing={2}>
              {docs.map((doc) => {
                const uploaded = form.documents.find((item) => item.documenttype === doc.documenttype);
                return (
                  <Grid item xs={12} md={6} key={doc._id}>
                    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                      <Typography fontWeight={800}>{doc.documenttype}{doc.isrequired === "Yes" ? " *" : ""}</Typography>
                      <Typography variant="body2" color="text.secondary">{doc.description}</Typography>
                      <Button sx={{ mt: 1 }} variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading}>
                        Upload
                        <input hidden type="file" onChange={(e) => uploadDocument(doc.documenttype, e.target.files?.[0], doc.description)} />
                      </Button>
                      {uploaded?.url && <Typography sx={{ mt: 1, wordBreak: "break-all" }} variant="caption" component="a" href={uploaded.url} target="_blank" rel="noreferrer">{uploaded.url}</Typography>}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {pages[tab] === "Preview" && (
            <Box id="recruitment-print">
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h5" fontWeight={900}>Application Summary</Typography>
                  <Typography>{bundle?.job?.title}</Typography>
                  <Typography variant="body2">Application ID: {submitted?.applicationno || "Will be generated after submission"}</Typography>
                </Box>
                <Box sx={{ width: 120, height: 140, border: "1px solid #9ca3af", display: "grid", placeItems: "center", color: "text.secondary", overflow: "hidden" }}>
                  {photoUrl ? <Box component="img" src={photoUrl} alt="Applicant" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "Photo"}
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                {[
                  ["Name", form.applicantname],
                  ["Email", form.email],
                  ["Phone", form.phone],
                  ["Status", submitted?.status || "Draft"]
                ].map(([label, value]) => (
                  <Grid item xs={12} md={6} key={label}><Typography><b>{label}:</b> {value}</Typography></Grid>
                ))}
                {Object.entries(form.customfields || {}).map(([key, value]) => (
                  <Grid item xs={12} md={6} key={key}><Typography><b>{key}:</b> {Array.isArray(value) ? value.join(", ") : String(value || "")}</Typography></Grid>
                ))}
              </Grid>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 2 }}>Documents</Typography>
              {form.documents?.map((doc) => <Typography key={doc.url} sx={{ wordBreak: "break-all" }}><b>{doc.documenttype}:</b> {doc.url}</Typography>)}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">Declaration: I certify that the information submitted is true to the best of my knowledge.</Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>Applicant signature/date</Grid>
                <Grid item xs={6}>Office use: Checked by / Approved by</Grid>
              </Grid>
            </Box>
          )}
        </Box>

        <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 3 }}>
          <Button disabled={tab === 0} onClick={() => setTab((v) => v - 1)}>Back</Button>
          <Stack direction="row" spacing={1}>
            {pages[tab] === "Preview" && <Button startIcon={<PrintIcon />} variant="outlined" onClick={() => window.print()}>Print</Button>}
            {tab < pages.length - 1 ? <Button variant="contained" onClick={() => setTab((v) => v + 1)}>Next</Button> : <Button variant="contained" color="success" disabled={loading} onClick={validateAndSubmit}>Submit application</Button>}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
