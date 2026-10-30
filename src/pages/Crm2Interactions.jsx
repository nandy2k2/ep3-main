import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCrm2Dashboard } from './Crm2DashboardContext';
import { Box, Button, Grid, IconButton, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete, Download, Edit, Save, UploadFile } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import ep1 from "../api/ep1";
import global1 from "./global1";

const root = "/api/v2/crm2/interactions";
const sessionScope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const initial = lead => ({ details: "", mode: "", pipeline: lead.pipeline || "", nextfollowupdate: lead.followupdate ? String(lead.followupdate).slice(0, 10) : "" });
const localDate = value => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

function useStableEvent(handler) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; }, [handler]);
  return useCallback((...args) => ref.current(...args), []);
}

export default function Crm2Interactions({ lead, Choice, onAdd, notify, onSaved, refresh = 0, leadmode = '' }) {
  const dashboard = useCrm2Dashboard();
  const scope = () => ({ ...sessionScope(), ...(leadmode ? { leadmode } : {}), ...(dashboard ? { dashboardyear: dashboard.academicyear, token: global1.token } : {}) });
  const [form, setForm] = useState(() => initial(lead)), [rows, setRows] = useState([]), [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false), [selected, setSelected] = useState([]), [progress, setProgress] = useState(null);
  const [page, setPage] = useState({ page: 0, pageSize: 25 });
  const load = async (pagination = page, signal) => {
    const res = await ep1.get(root, { params: { ...scope(), leadid: lead._id, limit: pagination.pageSize, skip: pagination.page * pagination.pageSize }, signal });
    if (!signal?.aborted) { setRows(res.data.data || []); setTotal(res.data.total || 0); setSelected([]); }
  };
  const execute = async action => {
    setBusy(true);
    try { await action(); } catch (err) { notify(err.response?.data?.message || err.message, "error"); } finally { setBusy(false); }
  };
  useEffect(() => {
    const controller = new AbortController(); setBusy(true);
    load({ page: 0, pageSize: 25 }, controller.signal).catch(err => { if (!controller.signal.aborted) notify(err.response?.data?.message || err.message, "error"); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
    // The parent remounts this workspace whenever the selected lead changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead._id]);
  const save = () => execute(async () => {
    const response = await ep1.post(`${root}/save`, { ...scope(), ...form, leadid: lead._id, id: form._id, interactiondate: form.interactiondate ? new Date(form.interactiondate).toISOString() : undefined });
    setForm(initial(response.data.data)); onSaved?.(response.data.data);
    const first = { ...page, page: 0 }; setPage(first); await load(first); notify("Interaction saved; lead pipeline and follow-up updated");
  });
  const remove = ids => execute(async () => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} interaction(s)?`)) return;
    await ep1.post(`${root}/delete`, { ...scope(), leadid: lead._id, ids });
    if (ids.includes(form._id)) setForm(initial(lead));
    const first = { ...page, page: 0 }; setPage(first); await load(first); notify("Interactions deleted");
  });
  const template = () => {
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["details", "mode", "pipeline", "nextfollowupdate", "interactiondate"]]), "Interactions"); XLSX.writeFile(book, "crm2_interactions_template.xlsx");
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    await execute(async () => {
      setProgress(0);
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const response = await ep1.post(`${root}/bulk`, { ...scope(), leadid: lead._id, rows }, { onUploadProgress: e => { if (e.total) setProgress(Math.min(99, Math.round(e.loaded * 100 / e.total))); } });
      setProgress(100); await load({ ...page, page: 0 }); setPage(previous => ({ ...previous, page: 0 }));
      const errors = response.data.errors || [];
      if (errors.length) { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(errors), "Errors"); XLSX.writeFile(book, "crm2_interaction_errors.xlsx"); }
      notify(`${response.data.saved} interactions saved; ${errors.length} errors`, errors.length ? "warning" : "success");
    });
  };
  const pageEvent = useStableEvent(value => { setPage(value); execute(() => load(value)); });
  const removeEvent = useStableEvent(remove);
  const editEvent = useCallback(row => setForm({ ...row, interactiondate: localDate(row.interactiondate), nextfollowupdate: row.nextfollowupdate ? String(row.nextfollowupdate).slice(0, 10) : "" }), []);
  return <Stack spacing={2} sx={{ width: "100%", p: 2 }}>
    <Typography variant="h6">Interactions - {lead.name} ({lead.email})</Typography>
    {busy && <LinearProgress />}
    <Grid container spacing={2}>
      <Grid item xs={12}><TextField label="Interaction details" fullWidth multiline minRows={4} value={form.details} onChange={e => setForm(previous => ({ ...previous, details: e.target.value }))} /></Grid>
      <Grid item xs={12} md={4}><Choice title="Mode of interaction" endpoint="/masters/interactionmode" refresh={refresh} value={form.mode ? { name: form.mode } : null} onAdd={() => onAdd("interactionmode")} onChange={value => setForm(previous => ({ ...previous, mode: value?.name || "" }))} /></Grid>
      <Grid item xs={12} md={4}><Choice title="Pipeline stage" endpoint="/masters/pipeline" refresh={refresh} value={form.pipeline ? { name: form.pipeline } : null} onAdd={() => onAdd("pipeline")} onChange={value => setForm(previous => ({ ...previous, pipeline: value?.name || "" }))} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Next follow-up date" type="date" InputLabelProps={{ shrink: true }} value={form.nextfollowupdate || ""} onChange={e => setForm(previous => ({ ...previous, nextfollowupdate: e.target.value }))} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Interaction date and time" type="datetime-local" InputLabelProps={{ shrink: true }} value={form.interactiondate || ""} onChange={e => setForm(previous => ({ ...previous, interactiondate: e.target.value }))} /></Grid>
    </Grid>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button variant="contained" startIcon={<Save />} disabled={busy || !form.details || !form.mode || !form.pipeline} onClick={save}>{form._id ? "Update interaction" : "Save interaction"}</Button>
      <Button startIcon={<Add />} disabled={busy} onClick={() => setForm(initial(lead))}>New interaction</Button>
      <Button color="error" startIcon={<Delete />} disabled={busy || !selected.length} onClick={() => remove(selected)}>Delete selected ({selected.length})</Button>
      <Button startIcon={<Download />} disabled={busy} onClick={template}>Upload template</Button>
      <Button component="label" startIcon={<UploadFile />} disabled={busy}>Bulk upload<input type="file" hidden accept=".xlsx,.xls,.csv" onChange={upload} /></Button>
      <Button disabled={busy} onClick={() => execute(() => load())}>Refresh history</Button>
    </Stack>
    {progress !== null && <Box><LinearProgress variant="determinate" value={progress} /><Typography variant="caption">{progress}% uploaded</Typography></Box>}
    <InteractionHistory rows={rows} total={total} busy={busy} selected={selected} setSelected={setSelected} page={page} onPage={pageEvent} onEdit={editEvent} onDelete={removeEvent} />
  </Stack>;
}

const InteractionHistory = React.memo(function InteractionHistory({ rows, total, busy, selected, setSelected, page, onPage, onEdit, onDelete }) {
  return (<Paper variant="outlined" sx={{ height: 420 }}><DataGrid rows={rows} getRowId={row => row._id} loading={busy} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} disableRowSelectionOnClick paginationMode="server" rowCount={total} paginationModel={page} pageSizeOptions={[25, 50, 100]} onPaginationModelChange={onPage} slots={{ toolbar: GridToolbar }} columns={[
      { field: "interactiondate", headerName: "Date / time", minWidth: 180, valueGetter: p => p.row.interactiondate ? new Date(p.row.interactiondate).toLocaleString() : "" },
      { field: "details", headerName: "Details", minWidth: 300, flex: 1, renderCell: p => <Typography variant="body2" sx={{ whiteSpace: "normal", overflowWrap: "anywhere", py: 1 }}>{p.value}</Typography> },
      { field: "mode", headerName: "Mode", width: 150 }, { field: "pipeline", headerName: "Pipeline", width: 150 },
      { field: "nextfollowupdate", headerName: "Next follow-up", width: 150, valueGetter: p => p.row.nextfollowupdate ? String(p.row.nextfollowupdate).slice(0, 10) : "" },
      { field: "createdby", headerName: "Recorded by", width: 200 },
      { field: "actions", headerName: "Actions", width: 100, renderCell: p => <><IconButton title="Edit interaction" disabled={busy} onClick={() => onEdit(p.row)}><Edit /></IconButton><IconButton title="Delete interaction" disabled={busy} onClick={() => onDelete([p.row._id])}><Delete /></IconButton></> }
    ]} getRowHeight={() => "auto"} /></Paper>);
});
