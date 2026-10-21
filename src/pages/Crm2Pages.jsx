import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, LinearProgress, Paper, Snackbar, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Add, Close, Delete, Download, Edit, Save, UploadFile, Visibility, VisibilityOff, Forum } from "@mui/icons-material";
import Crm2Interactions from "./Crm2Interactions";
import AiImageFieldExtractor from "./AiImageFieldExtractor";
import Crm2Education from "./Crm2Education";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import MenuPageShell from "./MenuPageShell";
import global1 from "./global1";
import ep1 from "../api/ep1";

const root = "/api/v2/crm2";
export const crm2Masters = { source: "Source", pipeline: "Pipeline", type: "Type", category: "CRM category", leadrating: "Lead rating", case: "Case", distributiontype: "Distribution type", mediumofinstruction: "Medium of Instruction", quota: "Quota", document: "Document", admissionoffice: "Admission office", interactionmode: "Interaction mode" };
const crmMasterFields = { category: "crmcategory", mediumofinstruction: "Mediumofinstruction" };
const crmDetailMasters = ["source", "pipeline", "type", "category", "leadrating", "case", "distributiontype"];
const label = value => ({ academicyear: "Academic year", admissionyear: "Admission year", regno: "Registration No", counsellorname: "Counsellor name", counselloremail: "Counsellor email", customFields: "Custom fields (JSON)", dob: "Date of birth", birthdate: "Birth date", fathername: "Father's name", mothername: "Mother's name", leadrating: "Lead rating", distributiontype: "Distribution type" }[value] || value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, v => v.toUpperCase()));
const scope = () => ({ colid: global1.colid, user: global1.user });
const messageOf = err => err.response?.data?.message || err.message;
const dateInput = value => value ? String(value).slice(0, 10) : "";
const gridSlots = { toolbar: GridToolbar };
const rowId = row => row._id;
const fieldLabel = field => ({ followupdate: "Follow-up date", samestate: "Same state", isdisabled: "Disabled", Mediumofinstruction: "Medium of Instruction", crmcategory: "CRM category", agentname: "Agent name", agentemail: "Agent email", admissionstatus: "Admission status", admissionoffice: "Admission office", admissionofficeid: "Admission office ID", campusvisitdate: "Campus visit date", campuscounsellor: "Campus counsellor", campuscounseloremail: "Campus counsellor email" }[field] || (/^(10th|12th)/.test(field) ? field.replace(/^(10th|12th)/, "$1 ").replace("passingyear", "passing year") : label(field)));
const bulkActions = { pipeline: "Change pipeline stage", type: "Change type", source: "Change source", counselloremail: "Assign counsellor", admissionstatus: "Change admission status", active: "Change Active" };
const Crm2ResultsGrid = React.memo(DataGrid);
Crm2ResultsGrid.displayName = "Crm2ResultsGrid";

function useStableEvent(handler) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; }, [handler]);
  return useCallback((...args) => ref.current(...args), []);
}

function RemoteChoice({ title, endpoint, field, value, onChange, onAdd, freeSolo = false, refresh = 0 }) {
  const [open, setOpen] = useState(false), [search, setSearch] = useState("");
  const [options, setOptions] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setBusy(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const res = await ep1.get(`${root}${endpoint}`, { params: { ...scope(), field, search, limit: 30, ...(endpoint.startsWith("/masters/") ? { status: "Active" } : {}) }, signal: controller.signal });
        if (!controller.signal.aborted) setOptions(res.data.data || []);
      } catch (err) { if (!controller.signal.aborted) setError(messageOf(err)); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, endpoint, field, search, refresh]);
  const optionLabel = item => typeof item === "string" ? item : item.__add ? item.name : item.email ? `${item.name || ""} — ${item.email}` : item.name || "";
  return <Autocomplete freeSolo={freeSolo} open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
    value={value || null} options={onAdd ? [{ __add: true, name: `+ Add ${title}` }, ...options] : options} loading={busy}
    filterOptions={items => items} getOptionLabel={optionLabel}
    isOptionEqualToValue={(a, b) => typeof a === "string" || typeof b === "string" ? optionLabel(a) === optionLabel(b) : (a._id && a._id === b._id) || (a.email && a.email === b.email) || a.name === b.name}
    onInputChange={(_, text, reason) => { if (reason === "input") { setSearch(text); if (freeSolo) onChange(text); } if (reason === "clear") setSearch(""); }}
    onChange={(_, selected) => { if (selected?.__add) { setOpen(false); onAdd(); } else onChange(selected); }}
    renderInput={params => <TextField {...params} size="small" label={title} error={Boolean(error)} helperText={error} InputProps={{ ...params.InputProps, endAdornment: <>{busy && <CircularProgress size={16} />}{params.InputProps.endAdornment}</> }} />} />;
}

function FileUpload({ title, kind = "document", onUploaded, onActivity, disabled = false }) {
  const [progress, setProgress] = useState(null), [error, setError] = useState("");
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setError("Maximum file size is 25 MB"); return; }
    setProgress(0); setError(""); onActivity(1);
    try {
      const body = new FormData(); body.append("file", file); body.append("colid", global1.colid); body.append("kind", kind);
      const result = await ep1.post(`${root}/upload`, body, { onUploadProgress: event => { if (event.total) setProgress(Math.min(99, Math.round(event.loaded * 100 / event.total))); } });
      setProgress(100); onUploaded(result.data);
    } catch (err) { setError(messageOf(err)); }
    finally { onActivity(-1); setProgress(null); }
  };
  return <Stack spacing={1}>
    <Button component="label" disabled={disabled || progress !== null} startIcon={progress !== null ? <CircularProgress size={16} /> : <UploadFile />}>{title}<input hidden type="file" accept={kind === "photo" ? "image/jpeg,image/png,image/webp,image/gif" : undefined} onChange={upload} /></Button>
    {progress !== null && <><LinearProgress variant="determinate" value={progress} /><Typography variant="caption">{progress}% uploaded{progress === 99 ? " - saving to AWS" : ""}</Typography></>}
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>;
}

function PasswordInput({ value, onChange }) {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const generate = () => {
    if (!window.crypto?.getRandomValues) { setError("Secure password generation is unavailable in this browser. Enter a password manually."); return; }
    setError("");
    const values = new Uint8Array(16); window.crypto.getRandomValues(values);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    onChange("Aa7!" + Array.from(values, value => alphabet[value % alphabet.length]).join(""));
    setVisible(true);
  };
  return <Stack spacing={1}><TextField size="small" fullWidth type={visible ? "text" : "password"} autoComplete="new-password" label="Password (write-only, optional)" value={value || ""} onChange={e => onChange(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton title={visible ? "Hide password" : "Show password"} onClick={() => setVisible(v => !v)}>{visible ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /><Button onClick={generate}>Generate password</Button>{error && <Alert severity="error">{error}</Alert>}</Stack>;
}

function LeadDocuments({ documents, append, remove, onActivity, onAdd, refresh, busy }) {
  const [document, setDocument] = useState(null), [title, setTitle] = useState(""), [url, setUrl] = useState("");
  const add = data => { append({ documentname: document.name, title: title || data.title || document.name, url: data.url, uploadedat: new Date().toISOString() }); setTitle(""); setUrl(""); };
  return <Stack spacing={2} sx={{ width: "100%", p: 2 }}>
    <RemoteChoice title="Document type" endpoint="/masters/document" value={document} refresh={refresh} onAdd={onAdd} onChange={setDocument} />
    <TextField size="small" label="Document title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
    <TextField size="small" label="Document link" value={url} onChange={e => setUrl(e.target.value)} />
    <Button disabled={busy || !document || !/^https?:\/\//i.test(url)} onClick={() => add({ url })}>Add link</Button>
    <FileUpload title="Upload document to AWS" disabled={busy || !document} onActivity={onActivity} onUploaded={add} />
    {documents.map((item, index) => <Stack key={item._id || index} direction="row" spacing={1} alignItems="center"><Typography sx={{ flex: 1 }}>{item.documentname} - <a href={item.url} target="_blank" rel="noreferrer">{item.title || "Download"}</a></Typography><IconButton title="Remove document" disabled={busy} onClick={() => remove(index)}><Delete /></IconButton></Stack>)}
  </Stack>;
}

function Crm2Content({ entity }) {
  const leads = entity === "leads";
  const [metadata, setMetadata] = useState([]), [form, setForm] = useState({}), [tab, setTab] = useState("CRM Details");
  const [rows, setRows] = useState([]), [total, setTotal] = useState(0), [selected, setSelected] = useState([]);
  const [requestBusy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [progress, setProgress] = useState(null);
  const [notice, setNotice] = useState(null), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const [filters, setFilters] = useState([]), [page, setPage] = useState({ page: 0, pageSize: 25 });
  const [embedded, setEmbedded] = useState(""), [refresh, setRefresh] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);
  const [bulkField, setBulkField] = useState(""), [bulkValue, setBulkValue] = useState(null);
  const busy = requestBusy || uploadCount > 0;
  const uploadActivity = useCallback(delta => setUploadCount(value => Math.max(0, value + delta)), []);
  const toast = (text, severity = "success") => setNotice({ text, severity });
  useEffect(() => {
    let cancelled = false;
    ep1.get(`${root}/metadata`, { params: scope() }).then(res => { if (!cancelled) setMetadata(res.data.fields || []); }).catch(err => toast(messageOf(err), "error"));
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { setForm({}); setRows([]); setTotal(0); setSelected([]); setLoaded(false); setFilters([]); setSearch(""); setStatus(""); setPage({ page: 0, pageSize: 25 }); }, [entity]);
  const listEndpoint = leads ? "/leads" : `/masters/${entity}`;
  const load = async (pagination = page) => {
    setBusy(true);
    try {
      const res = await ep1.get(`${root}${listEndpoint}`, { params: { ...scope(), search, status: status || undefined, filters: JSON.stringify(filters), limit: pagination.pageSize, skip: pagination.page * pagination.pageSize } });
      setRows(res.data.data || []); setTotal(res.data.total || 0); setLoaded(true); setSelected([]);
    } catch (err) { toast(messageOf(err), "error"); }
    finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try {
      const payload = { ...form, ...scope(), id: form._id };
      if (typeof payload.customFields === "string") payload.customFields = payload.customFields.trim() ? JSON.parse(payload.customFields) : {};
      const res = await ep1.post(`${root}${listEndpoint}/save`, payload);
      setForm(leads ? res.data.data : {}); setRefresh(v => v + 1);
      toast(leads && !form._id ? "Lead created. Add the remaining information in the tabs below." : "Saved");
      if (loaded || !leads) await load();
    } catch (err) { toast(messageOf(err), "error"); }
    finally { setBusy(false); }
  };
  const remove = async (ids = selected) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} selected record(s)?`)) return;
    setBusy(true);
    try { await ep1.post(`${root}${listEndpoint}/delete`, { ...scope(), ids }); if (ids.includes(form._id)) setForm({}); await load(); toast("Deleted"); }
    catch (err) { toast(messageOf(err), "error"); } finally { setBusy(false); }
  };
  const template = () => {
    const keys = leads ? [...new Set(["name", "email", "phone", ...Object.keys(crm2Masters).filter(kind => !["document", "interactionmode"].includes(kind)).map(kind => crmMasterFields[kind] || kind), "counselloremail", "documents", ...metadata.map(item => item.field)])] : ["name", "description", "status", "order"];
    const sheet = XLSX.utils.aoa_to_sheet([keys]); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Upload"); XLSX.writeFile(book, `crm2_${entity}_template.xlsx`);
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setBusy(true); setProgress(0);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const response = await ep1.post(`${root}/bulk/${entity}`, { ...scope(), rows: data }, { onUploadProgress: e => { if (e.total) setProgress(Math.min(99, Math.round(e.loaded * 100 / e.total))); } });
      setProgress(100);
      const errors = response.data.errors || [];
      if (errors.length) { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(errors), "Errors"); XLSX.writeFile(book, "crm2_upload_errors.xlsx"); }
      toast(`${response.data.saved} saved; ${errors.length} failed${errors.length ? ". Error file downloaded." : "."}`, errors.length ? "warning" : "success");
      if (loaded) await load();
    } catch (err) { toast(messageOf(err), "error"); } finally { setBusy(false); }
  };
  const change = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const openAdd = kind => setEmbedded(kind === "counsellor" ? "/mbuser" : `/crm2-${kind}-master`);
  const masterChoice = kind => {
    const field = crmMasterFields[kind] || kind;
    return <RemoteChoice title={crm2Masters[kind]} endpoint={`/masters/${kind}`} value={form[field] ? { name: form[field] } : null} refresh={refresh} onAdd={() => openAdd(kind)} onChange={value => change(field, value?.name || "")} />;
  };
  const filterFields = [...metadata.filter(item => item.field !== "password" && !["Map", "Mixed"].includes(item.type)), ...crmDetailMasters.map(kind => crmMasterFields[kind] || kind).filter(field => !metadata.some(item => item.field === field)).map(field => ({ field, type: "String" })), { field: "counsellorname", type: "String" }, { field: "counselloremail", type: "String" }];
  const renderFilter = (filter, index) => {
    const update = value => setFilters(previous => previous.map((item, i) => i === index ? { ...item, value } : item));
    const kind = Object.keys(crm2Masters).find(kind => (crmMasterFields[kind] || kind) === filter.field);
    if (kind) return <RemoteChoice title="Filter value" endpoint={`/masters/${kind}`} freeSolo value={filter.value} onAdd={() => openAdd(kind)} onChange={value => update(typeof value === "string" ? value : value?.name || "")} />;
    const field = metadata.find(item => item.field === filter.field);
    if (field?.options?.length) return <Autocomplete options={field.options} value={filter.value || null} onChange={(_, value) => update(value || "")} renderInput={params => <TextField {...params} size="small" label="Filter value" />} />;
    if (field?.type === "String") return <RemoteChoice title="Filter value" endpoint="/field-options" field={filter.field} freeSolo value={filter.value} onChange={value => update(value || "")} />;
    return <TextField fullWidth size="small" label="Filter value" type={field?.type === "Number" ? "number" : field?.type === "Date" ? "date" : "text"} InputLabelProps={field?.type === "Date" ? { shrink: true } : undefined} value={filter.value} onChange={e => update(e.target.value)} />;
  };
  const groups = [...new Set(["CRM Details", ...metadata.map(item => item.group), "Subjectwise Education", "Documents"])];
  const renderField = item => {
    const field = item.field, value = form[field];
    if (field === "admissionoffice") return <RemoteChoice title="Admission office" endpoint="/masters/admissionoffice" refresh={refresh} value={value ? { _id: form.admissionofficeid, name: value } : null} onAdd={() => openAdd("admissionoffice")} onChange={office => setForm(previous => ({ ...previous, admissionoffice: office?.name || "", admissionofficeid: office?._id || "" }))} />;
    if (field === "admissionofficeid" || field === "campuscounseloremail") return <TextField size="small" fullWidth label={fieldLabel(field)} value={value || ""} InputProps={{ readOnly: true }} />;
    if (field === "campuscounsellor") return <RemoteChoice title="Campus counsellor" endpoint="/counsellors" value={form.campuscounseloremail ? { name: value, email: form.campuscounseloremail } : null} onAdd={() => openAdd("counsellor")} onChange={person => setForm(previous => ({ ...previous, campuscounsellor: person?.name || "", campuscounseloremail: person?.email || "" }))} />;
    if (field === "password") return <PasswordInput value={value} onChange={value => change(field, value)} />;
    if (field === "quota") return masterChoice("quota");
    if (field === "Mediumofinstruction") return masterChoice("mediumofinstruction");
    if (field === "photo") return <Stack spacing={1}><TextField size="small" fullWidth label="Photo link" value={value || ""} onChange={e => change(field, e.target.value)} /><FileUpload title="Upload photo to AWS" kind="photo" disabled={busy} onActivity={uploadActivity} onUploaded={data => change(field, data.url)} />{/^https?:\/\//i.test(value || "") && <Box component="img" src={value} alt="Lead" sx={{ width: 90, height: 110, objectFit: "contain" }} />}</Stack>;
    if (["Map", "Mixed"].includes(item.type)) return <TextField size="small" fullWidth multiline minRows={4} label={fieldLabel(field)} value={typeof value === "string" ? value : JSON.stringify(value || {}, null, 2)} onChange={e => change(field, e.target.value)} />;
    if (item.options?.length) return <Autocomplete options={item.options} value={value || null} onChange={(_, selected) => change(field, selected || "")} renderInput={params => <TextField {...params} size="small" label={fieldLabel(field)} />} />;
    if (item.type === "Date") return <TextField fullWidth size="small" type="date" label={fieldLabel(field)} InputLabelProps={{ shrink: true }} value={dateInput(value)} onChange={e => change(field, e.target.value)} />;
    if (item.type === "Number" || /name|email|phone|mobile|address|comments|photo|token|regno|abcid|pan|pincode|dob|status|skills/i.test(field)) return <TextField fullWidth size="small" type={item.type === "Number" ? "number" : "text"} label={fieldLabel(field)} value={value ?? ""} onChange={e => change(field, e.target.value)} multiline={/comments|address|skills/i.test(field)} minRows={/comments|address|skills/i.test(field) ? 3 : undefined} />;
    return <RemoteChoice title={fieldLabel(field)} endpoint="/field-options" field={field} freeSolo value={value || ""} onChange={selected => change(field, selected || "")} />;
  };
  const removeEvent = useStableEvent(remove);
  const openLead = useStableEvent((lead, interaction = false) => { if (!busy) { setForm(lead); setTab(interaction ? "Interactions" : "CRM Details"); window.scrollTo({ top: 0, behavior: "smooth" }); } });
  const rowClick = useStableEvent((params, event) => { if (leads && !event.target.closest('button,a,input,[role="checkbox"]')) openLead(params.row); });
  const interactionSaved = lead => {
    setForm(previous => previous._id === lead._id ? { ...previous, pipeline: lead.pipeline, followupdate: lead.followupdate } : previous);
    setRows(previous => previous.map(row => row._id === lead._id ? { ...row, pipeline: lead.pipeline, followupdate: lead.followupdate } : row));
  };
  const applyBulk = async () => {
    setBusy(true);
    try {
      const value = bulkField === "counselloremail" ? bulkValue.email : bulkValue.name || bulkValue;
      const response = await ep1.post(`${root}/leads/bulk-update`, { ...scope(), ids: selected, field: bulkField, value });
      if (selected.includes(form._id)) setForm(previous => ({ ...previous, ...(bulkField === "counselloremail" ? { counsellorname: bulkValue.name, counselloremail: bulkValue.email } : { [bulkField]: value }) }));
      setBulkField(""); setBulkValue(null); await load(); toast(`${response.data.modified} leads updated`);
    } catch (err) { toast(messageOf(err), "error"); } finally { setBusy(false); }
  };
  const pageEvent = useStableEvent(value => { setPage(value); if (loaded) load(value); });
  const columns = useMemo(() => {
    const result = leads ? ["name", "email", "phone", "source", "pipeline", "type", "crmcategory", "category", "active", "followupdate", "leadrating", "case", "distributiontype", "counsellorname", "counselloremail", "academicyear", "agentname", "agentemail", "admissionstatus", "admissionoffice", "admissionofficeid", "campusvisitdate", "campuscounsellor", "campuscounseloremail"].map(field => ({ field, headerName: fieldLabel(field), minWidth: 160, flex: field === "name" ? 1 : undefined })) : ["name", "description", "status", "order"].map(field => ({ field, headerName: fieldLabel(field), minWidth: 150, flex: field === "description" ? 1 : undefined }));
    result.push({ field: "actions", headerName: "Actions", width: leads ? 150 : 110, sortable: false, renderCell: params => <><IconButton title="Edit" disabled={busy} onClick={() => openLead(params.row)}><Edit /></IconButton>{leads && <IconButton title="Interactions" disabled={busy} onClick={() => openLead(params.row, true)}><Forum /></IconButton>}<IconButton title="Delete" disabled={busy} onClick={() => removeEvent([params.row._id])}><Delete /></IconButton></> });
    return result;
  }, [leads, busy, removeEvent, openLead]);
  return <>
    <Stack spacing={2}>
      {busy && <LinearProgress />}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}><Typography variant="h6">{form._id ? "Edit" : "Add"} {leads ? "lead" : crm2Masters[entity].toLowerCase()}</Typography><Button startIcon={<Add />} disabled={busy || uploadCount > 0} onClick={() => { setForm({}); setTab("CRM Details"); }}>New</Button></Stack>
        {leads && <AiImageFieldExtractor key={form._id || "new"} title="Extract lead details from document photos" fields={metadata.filter(item => ["Identity", "Family & Address", "Education & Work"].includes(item.group) && !["password", "photo", "customFields"].includes(item.field)).map(item => ({ name: item.field, label: fieldLabel(item.field) }))} context="Extract lead profile details from identity documents such as Aadhaar or education documents. Do not invent an email or phone if not visible. Do not extract document identification numbers into unrelated fields." onApply={values => setForm(previous => ({ ...previous, ...Object.fromEntries(metadata.filter(item => values[item.field] !== undefined && values[item.field] !== "" && !["password", "photo", "customFields"].includes(item.field)).map(item => [item.field, values[item.field]])) }))} />}
        {(!leads || !form._id) ? <Grid container spacing={2}>
          {(leads ? ["name", "email", "phone"] : ["name", "description", "status", "order"]).map(field => <Grid item xs={12} md={leads ? 4 : 3} key={field}>{field === "status" ? <Autocomplete options={["Active", "Inactive"]} value={form.status || "Active"} onChange={(_, value) => change(field, value || "Active")} renderInput={params => <TextField {...params} size="small" label="Status" />} /> : <TextField size="small" fullWidth label={label(field)} type={field === "order" ? "number" : field === "email" ? "email" : "text"} value={form[field] ?? ""} onChange={e => change(field, e.target.value)} />}</Grid>)}
        </Grid> : <>
          <Typography sx={{ mb: 1 }}>{form.name} · {form.email} · {form.phone}</Typography>
          <Tabs value={tab} onChange={(_, selected) => setTab(selected)} variant="scrollable" scrollButtons="auto">{[...groups, "Interactions"].map(group => <Tab key={group} value={group} label={group} />)}</Tabs>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tab === "Subjectwise Education" && <Crm2Education value={form.education || []} onChange={value => change("education", value)} />}
            {tab === "Interactions" ? <Crm2Interactions key={form._id} lead={form} Choice={RemoteChoice} onAdd={openAdd} notify={toast} onSaved={interactionSaved} refresh={refresh} /> : tab === "Documents" ? <LeadDocuments documents={form.documents || []} onActivity={uploadActivity} onAdd={() => openAdd("document")} refresh={refresh} busy={busy || uploadCount > 0} append={document => setForm(previous => ({ ...previous, documents: [...(previous.documents || []), document] }))} remove={index => setForm(previous => ({ ...previous, documents: previous.documents.filter((_, i) => i !== index) }))} /> : tab === "CRM Details" ? <>{crmDetailMasters.map(kind => <Grid item xs={12} md={4} key={kind}>{masterChoice(kind)}</Grid>)}
              <Grid item xs={12} md={4}><RemoteChoice title="Counsellor name" endpoint="/counsellors" value={form.counselloremail ? { name: form.counsellorname, email: form.counselloremail } : null} onAdd={() => openAdd("counsellor")} onChange={value => setForm(previous => ({ ...previous, counsellorname: value?.name || "", counselloremail: value?.email || "" }))} /></Grid>
              <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Counsellor email" value={form.counselloremail || ""} InputProps={{ readOnly: true }} /></Grid>
              {metadata.filter(item => item.group === "CRM Details").map(item => <Grid item xs={12} md={4} key={item.field}>{renderField(item)}</Grid>)}
            </> : metadata.filter(item => item.group === tab).map(item => <Grid item xs={12} md={item.type === "Map" ? 12 : 4} key={item.field}>{renderField(item)}</Grid>)}
          </Grid>
        </>}
        {tab !== "Interactions" && <Button sx={{ mt: 2 }} variant="contained" startIcon={busy || uploadCount ? <CircularProgress size={16} color="inherit" /> : <Save />} disabled={busy || uploadCount > 0 || !form.name || (leads && (!form.email || !form.phone))} onClick={save}>{uploadCount ? "Uploading..." : leads && !form._id ? "Check duplicates & continue" : "Save"}</Button>}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField size="small" label={leads ? "Search name, email or phone" : "Search name or description"} value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 280 }} />
          {!leads && <Autocomplete sx={{ width: 180 }} options={["Active", "Inactive"]} value={status || null} onChange={(_, value) => setStatus(value || "")} renderInput={params => <TextField {...params} size="small" label="Status" />} />}
          <Button variant="contained" disabled={busy} onClick={() => { const first = { ...page, page: 0 }; setPage(first); load(first); }}>Load</Button>
          <Button startIcon={<Delete />} color="error" disabled={busy || !selected.length} onClick={() => remove()}>Delete selected ({selected.length})</Button>
          <Button startIcon={<Download />} onClick={template} disabled={busy}>Upload template</Button>
          <Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></Button>
        </Stack>
        {leads && <Stack spacing={1} sx={{ mt: 2 }}>{filters.map((filter, index) => <Grid container spacing={1} key={index}>
          <Grid item xs={12} md={4}><Autocomplete options={filterFields} value={filterFields.find(item => item.field === filter.field) || null} getOptionLabel={item => fieldLabel(item.field)} onChange={(_, value) => setFilters(previous => previous.map((item, i) => i === index ? { field: value?.field || "", value: "" } : item))} renderInput={params => <TextField {...params} size="small" label="Filter field" />} /></Grid>
          <Grid item xs={10} md={7}>{renderFilter(filter, index)}</Grid>
          <Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => setFilters(previous => previous.filter((_, i) => i !== index))}><Close /></IconButton></Grid>
        </Grid>)}<Button startIcon={<Add />} sx={{ alignSelf: "flex-start" }} onClick={() => setFilters(previous => [...previous, { field: "academicyear", value: "" }])}>Add filter</Button></Stack>}
        {progress !== null && <Box sx={{ mt: 2 }}><LinearProgress variant="determinate" value={progress} /><Typography variant="caption">Upload {progress}%{busy && progress === 99 ? " · Processing rows…" : ""}</Typography></Box>}
      </Paper>
      {leads && <Paper sx={{ p: 2 }}><Typography sx={{ mb: 1 }}>Bulk update - {selected.length} leads selected</Typography><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{Object.entries(bulkActions).map(([field, title]) => <Button key={field} variant="outlined" disabled={busy || !selected.length} onClick={() => { setBulkField(field); setBulkValue(null); }}>{title}</Button>)}</Stack></Paper>}
      <Box sx={{ height: 560 }}><Crm2ResultsGrid rows={rows} columns={columns} getRowId={rowId} loading={busy} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={setSelected}
        paginationMode="server" rowCount={total} paginationModel={page} pageSizeOptions={gridPageSizes} onPaginationModelChange={pageEvent} onRowClick={rowClick} slots={gridSlots} /></Box>
    </Stack>
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}><Alert onClose={() => setNotice(null)} severity={notice?.severity || "success"} variant="filled">{notice?.text}</Alert></Snackbar>
    <Dialog open={Boolean(bulkField)} fullWidth maxWidth="sm" onClose={() => { if (!busy) setBulkField(""); }}><DialogTitle>{bulkActions[bulkField]} - {selected.length} leads</DialogTitle><DialogContent sx={{ pt: 2 }}>
      {["pipeline", "type", "source"].includes(bulkField) ? <RemoteChoice title={crm2Masters[bulkField]} endpoint={`/masters/${bulkField}`} refresh={refresh} value={bulkValue} onAdd={() => openAdd(bulkField)} onChange={setBulkValue} /> : bulkField === "counselloremail" ? <RemoteChoice title="Counsellor" endpoint="/counsellors" value={bulkValue} onAdd={() => openAdd("counsellor")} onChange={setBulkValue} /> : <Autocomplete options={bulkField === "admissionstatus" ? ["Admitted", "Not admitted"] : ["Yes", "No"]} value={bulkValue} onChange={(_, value) => setBulkValue(value)} renderInput={params => <TextField {...params} label="New value" />} />}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}><Button variant="contained" disabled={busy || !bulkValue} onClick={applyBulk}>{busy ? "Updating..." : "Apply to selected leads"}</Button><Button disabled={busy} onClick={() => setBulkField("")}>Cancel</Button></Stack>
    </DialogContent></Dialog>
    <Dialog open={Boolean(embedded)} fullWidth maxWidth="xl" onClose={() => { setEmbedded(""); setRefresh(v => v + 1); }}><DialogTitle>Add details<IconButton title="Close" sx={{ float: "right" }} onClick={() => { setEmbedded(""); setRefresh(v => v + 1); }}><Close /></IconButton></DialogTitle><DialogContent sx={{ p: 0, height: "80vh" }}>{embedded && <iframe title="Add master data" src={`${embedded}?embedded=1`} style={{ border: 0, width: "100%", height: "100%" }} />}</DialogContent></Dialog>
  </>;
}

const gridPageSizes = [25, 50, 100];

export default function Crm2Page({ entity = "leads" }) {
  const title = entity === "leads" ? "Lead master" : `${crm2Masters[entity]} master`;
  return <MenuPageShell title={`CRM 2 · ${title}`}><Crm2Content key={entity} entity={entity} /></MenuPageShell>;
}

function Crm2InteractionPicker() {
  const [lead, setLead] = useState(null), [notice, setNotice] = useState(null), [embedded, setEmbedded] = useState(""), [refresh, setRefresh] = useState(0);
  const notify = (text, severity = "success") => setNotice({ text, severity });
  const close = () => { setEmbedded(""); setRefresh(value => value + 1); };
  return <Stack spacing={2}>
    <RemoteChoice title="Select lead" endpoint="/lead-options" value={lead} onAdd={() => setEmbedded("/crm2-leads")} onChange={setLead} />
    {lead && <Paper><Crm2Interactions key={lead._id} lead={lead} Choice={RemoteChoice} onAdd={kind => setEmbedded(`/crm2-${kind}-master`)} notify={notify} refresh={refresh} onSaved={value => setLead(previous => previous?._id === value._id ? { ...previous, ...value } : previous)} /></Paper>}
    <Snackbar open={Boolean(notice)} autoHideDuration={7000} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity || "success"} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
    <Dialog open={Boolean(embedded)} fullWidth maxWidth="xl" onClose={close}><DialogTitle>Add details<IconButton title="Close" sx={{ float: "right" }} onClick={close}><Close /></IconButton></DialogTitle><DialogContent sx={{ p: 0, height: "80vh" }}>{embedded && <iframe title="Add CRM 2 data" src={`${embedded}?embedded=1`} style={{ border: 0, width: "100%", height: "100%" }} />}</DialogContent></Dialog>
  </Stack>;
}

export function Crm2InteractionsPage() {
  return <MenuPageShell title="CRM 2 - Interactions"><Crm2InteractionPicker /></MenuPageShell>;
}
