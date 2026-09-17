import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Email, Refresh, SelectAll } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";

const emailLabel = (row = {}) => row.label || `${row.provider || "Email"} / ${row.type || "General"} / ${row.username || ""}`;

const buildSubject = (selectedTemplates = []) => {
  if (!selectedTemplates.length) return "ERP sample upload templates";
  if (selectedTemplates.length === 1) return `${selectedTemplates[0].page} sample upload template`;
  return `${selectedTemplates.length} ERP sample upload templates`;
};

const buildBody = (selectedTemplates = []) => {
  const list = selectedTemplates.map((item, index) => `${index + 1}. ${item.group} - ${item.page}`).join("\n");
  return `Dear User,

Please find attached the selected ERP sample upload template files.

${list || "No templates selected yet."}

Please keep the header row unchanged while preparing the bulk upload files.

Regards,
${global1.name || "ERP Team"}`;
};

export default function AcademicTemplateEmailPage() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [emailconfigs, setEmailconfigs] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [emailconfigid, setEmailconfigid] = useState("");
  const [toemail, setToemail] = useState("");
  const [subject, setSubject] = useState("ERP sample upload templates");
  const [body, setBody] = useState(buildBody([]));
  const [dirtyText, setDirtyText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
  }, []);

  const selectedTemplates = useMemo(() => templates.filter((item) => selectedPages.includes(item.key)), [templates, selectedPages]);
  const visibleTemplates = useMemo(() => (
    selectedCategories.length ? templates.filter((item) => selectedCategories.includes(item.group)) : templates
  ), [templates, selectedCategories]);
  const selectedEmailConfig = useMemo(() => emailconfigs.find((row) => row._id === emailconfigid) || null, [emailconfigs, emailconfigid]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get("/api/v2/academic-template-email/options", { params: { colid: global1.colid } });
      setTemplates(res.data?.templates || []);
      setCategories(res.data?.categories || []);
      setEmailconfigs(res.data?.emailconfigs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load template options");
    } finally {
      setLoading(false);
    }
  };

  const setPages = (nextPages) => {
    setSelectedPages(nextPages);
    const nextTemplates = templates.filter((item) => nextPages.includes(item.key));
    if (!dirtyText) {
      setSubject(buildSubject(nextTemplates));
      setBody(buildBody(nextTemplates));
    }
  };

  const togglePage = (key) => {
    setPages(selectedPages.includes(key) ? selectedPages.filter((item) => item !== key) : [...selectedPages, key]);
  };

  const selectVisible = () => {
    setPages([...new Set([...selectedPages, ...visibleTemplates.map((item) => item.key)])]);
  };

  const clearVisible = () => {
    const visibleKeys = new Set(visibleTemplates.map((item) => item.key));
    setPages(selectedPages.filter((item) => !visibleKeys.has(item)));
  };

  const sendTemplates = async () => {
    if (!emailconfigid || !toemail || !selectedPages.length) {
      setError("Select email configuration, to email, and at least one page template.");
      return;
    }
    try {
      setSending(true);
      setError("");
      setMessage("");
      const res = await ep1.post("/api/v2/academic-template-email/send", {
        colid: global1.colid,
        user: global1.user,
        name: global1.name,
        emailconfigid,
        toemail,
        subject,
        body,
        pages: selectedPages
      });
      setMessage(`Email sent with ${res.data?.attachments || selectedPages.length} attachment(s).`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send templates");
    } finally {
      setSending(false);
    }
  };

  return (
    <MenuPageShell title="Templates">
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={950}>Templates</Typography>
                <Typography color="text.secondary">
                  Select pages and email their sample bulk-upload formats as Excel attachments.
                </Typography>
              </Box>
              <Button variant="outlined" disabled={loading || sending} onClick={loadOptions} startIcon={loading ? <CircularProgress size={18} /> : <Refresh />}>
                Refresh
              </Button>
            </Stack>
          </Paper>

          {(error || message) && (
            <Alert severity={error ? "error" : "success"} onClose={() => { setError(""); setMessage(""); }}>
              {error || message}
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={emailconfigs}
                  value={selectedEmailConfig}
                  getOptionLabel={emailLabel}
                  onChange={(_, value) => setEmailconfigid(value?._id || "")}
                  renderInput={(params) => <TextField {...params} label="Email configuration" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth size="small" label="To email" value={toemail} onChange={(e) => setToemail(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={categories}
                  value={selectedCategories}
                  onChange={(_, value) => setSelectedCategories(value)}
                  renderInput={(params) => <TextField {...params} label="Filter categories" size="small" />}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="outlined" startIcon={<SelectAll />} onClick={selectVisible}>Select visible pages</Button>
                  <Button variant="outlined" onClick={clearVisible}>Clear visible pages</Button>
                  <Chip label={`${selectedPages.length} page(s) selected`} color={selectedPages.length ? "primary" : "default"} />
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              {visibleTemplates.map((template) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={template.key}>
                  <Box sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1.5, bgcolor: selectedPages.includes(template.key) ? "#eff6ff" : "#fff", height: "100%" }}>
                    <FormControlLabel
                      control={<Checkbox checked={selectedPages.includes(template.key)} onChange={() => togglePage(template.key)} />}
                      label={<Box><Typography fontWeight={850}>{template.page}</Typography><Typography variant="caption" color="text.secondary">{template.group}</Typography></Box>}
                      sx={{ alignItems: "flex-start", m: 0 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {template.fields.slice(0, 6).join(", ")}{template.fields.length > 6 ? "..." : ""}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setDirtyText(true); }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline minRows={7} label="Email text" value={body} onChange={(e) => { setBody(e.target.value); setDirtyText(true); }} />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 1.5 }} />
                <Button variant="contained" disabled={sending} startIcon={sending ? <CircularProgress color="inherit" size={18} /> : <Email />} onClick={sendTemplates}>
                  {sending ? "Sending..." : "Send selected templates"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
