import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Snackbar, Stack, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { Add, Edit, PersonAdd, Refresh, Save } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import MenuPageShell from './MenuPageShell';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';

const root = '/api/v2/crm2-campus-queue';
const auth = () => ({ headers: { Authorization: `Bearer ${global1.token}` } });
const lookup = { get: (url, config) => ep1.get(url, { ...config, ...auth() }) };
const messageOf = error => error.response?.data?.message || error.message;
const columns = [
  { field: 'program', headerName: 'Program', minWidth: 190, flex: 1 },
  { field: 'programcode', headerName: 'Program code', width: 135 },
  { field: 'level', headerName: 'Level', type: 'number', width: 90 },
  { field: 'title', headerName: 'Title', minWidth: 175, flex: 1 },
  { field: 'description', headerName: 'Description', width: 240 },
  { field: 'active', headerName: 'Active', width: 90 }
];
const assignments = [
  { field: 'campuscounselor', headerName: 'Campus counsellor', minWidth: 175, flex: 1 },
  { field: 'campuscounseloremail', headerName: 'Counsellor email', minWidth: 210, flex: 1 }
];
const slots = { toolbar: GridToolbar };
const pageSizes = [25, 50, 100];
const rowId = row => row._id;

const LevelsGrid = React.memo(function LevelsGrid({ rows, busy, view, onEdit }) {
  const assigning = view === 'assignments';
  const gridColumns = useMemo(() => [
    { field: 'actions', headerName: 'Actions', width: 90, sortable: false, filterable: false, renderCell: ({ row }) => <Tooltip title={assigning ? 'Assign counsellor' : 'Edit level'}><IconButton size="small" aria-label={assigning ? 'Assign counsellor' : 'Edit level'} onClick={() => onEdit(row)}>{assigning ? <PersonAdd /> : <Edit />}</IconButton></Tooltip> },
    ...columns, ...(assigning ? assignments : [])
  ], [assigning, onEdit]);
  return <Box sx={{ height: 530, minWidth: 0 }}><DataGrid rows={rows} columns={gridColumns} getRowId={rowId} loading={busy} slots={slots} pageSizeOptions={pageSizes} disableRowSelectionOnClick /></Box>;
});

function LevelEditor({ record, initialProgram, assigning, onClose, onSaved }) {
  const [program, setProgram] = useState(record?.programcode ? { program: record.program, programcode: record.programcode } : initialProgram);
  const [person, setPerson] = useState(record?.campuscounselorid ? { _id: record.campuscounselorid, name: record.campuscounselor, email: record.campuscounseloremail } : null);
  const [draft, setDraft] = useState({ level: record?.level ?? '', title: record?.title || '', description: record?.description || '', active: record?.active || 'Yes' });
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const update = (field, value) => setDraft(previous => ({ ...previous, [field]: value }));
  const valid = assigning ? !!(person?._id || record?.campuscounselorid) : program?.programcode && Number.isSafeInteger(Number(draft.level)) && Number(draft.level) > 0 && draft.title.trim();
  const save = async event => {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true); setError('');
    try {
      const endpoint = assigning ? `${root}/levels/${record._id}/counsellor` : `${root}/levels`;
      const body = assigning ? { userid: person?._id || null } : { ...draft, id: record?._id, programcode: program.programcode };
      const result = await ep1.post(endpoint, body, auth());
      onSaved(result.data.data, assigning ? person ? 'Counsellor assigned' : 'Counsellor removed' : 'Hierarchy level saved');
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(false); }
  };
  return <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose}>
    <Box component="form" onSubmit={save}>
      <DialogTitle>{assigning ? 'Assign campus counsellor' : record?._id ? 'Edit hierarchy level' : 'Add hierarchy level'}</DialogTitle>
      <DialogContent dividers><Stack spacing={2} sx={{ pt: 0.5 }}>
        {saving && <LinearProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {assigning ? <>
          <Typography>{record.program} ({record.programcode}) · Level {record.level}: {record.title}</Typography>
          <ProgramChoice title="Campus counsellor" endpoint={`${root}/counsellors`} api={lookup} value={person} onChange={setPerson} disabled={saving} />
          <TextField label="Counsellor email" size="small" value={person?.email || ''} InputProps={{ readOnly: true }} />
          {record.campuscounselorid && <Button size="small" color="error" disabled={saving || !person} sx={{ alignSelf: 'flex-start' }} onClick={() => setPerson(null)}>Clear assignment</Button>}
        </> : <>
          <ProgramChoice title="Program" endpoint={`${root}/programs`} api={lookup} value={program} onChange={setProgram} disabled={saving} />
          <TextField label="Program code" size="small" value={program?.programcode || ''} InputProps={{ readOnly: true }} />
          <TextField required label="Level" type="number" inputProps={{ min: 1, step: 1 }} value={draft.level} onChange={event => update('level', event.target.value)} disabled={saving} />
          <TextField required label="Title" inputProps={{ maxLength: 150 }} value={draft.title} onChange={event => update('title', event.target.value)} disabled={saving} />
          <TextField label="Description" multiline minRows={3} inputProps={{ maxLength: 2000 }} value={draft.description} onChange={event => update('description', event.target.value)} disabled={saving} />
          <TextField select label="Active" value={draft.active} onChange={event => update('active', event.target.value)} disabled={saving}><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></TextField>
        </>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" startIcon={<Save />} variant="contained" disabled={!valid || saving}>Save</Button></DialogActions>
    </Box>
  </Dialog>;
}

function CampusQueueSetup() {
  const [view, setView] = useState('hierarchy'), [program, setProgram] = useState(null), [rows, setRows] = useState([]), [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(true), [revision, setRevision] = useState(0), [notice, setNotice] = useState(null);
  const code = program?.programcode;
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    ep1.get(`${root}/levels`, { ...auth(), params: { programcode: code }, signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setRows(result.data.data);
    }).catch(err => { if (!controller.signal.aborted) setNotice({ text: messageOf(err), severity: 'error' }); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [code, revision]);
  const onEdit = useCallback(row => setEditor(row), []);
  const onSaved = (_, text) => { setEditor(null); setRevision(value => value + 1); setNotice({ text, severity: 'success' }); };
  return <Stack spacing={2} sx={{ p: { xs: 1, md: 2 } }}>
    <Tabs value={view} onChange={(_, value) => setView(value)} aria-label="Campus queue setup" variant="scrollable" scrollButtons="auto"><Tab label="Program hierarchy" value="hierarchy" /><Tab label="Counsellor assignments" value="assignments" /></Tabs>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
      <Box sx={{ width: { xs: '100%', sm: 320 } }}><ProgramChoice title="Filter by program" endpoint={`${root}/programs`} api={lookup} value={program} onChange={setProgram} /></Box>
      {view === 'hierarchy' && <Button variant="contained" startIcon={<Add />} onClick={() => setEditor({})}>Add level</Button>}
      <Button startIcon={<Refresh />} disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh</Button>
    </Stack>
    <LevelsGrid rows={rows} busy={busy} view={view} onEdit={onEdit} />
    {editor && <LevelEditor record={editor} initialProgram={program} assigning={view === 'assignments'} onClose={() => setEditor(null)} onSaved={onSaved} />}
    <Snackbar open={!!notice} autoHideDuration={7500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}

export default function Crm2CampusQueueManagement() {
  return <MenuPageShell title="Campus Queue Management"><CampusQueueSetup /></MenuPageShell>;
}
