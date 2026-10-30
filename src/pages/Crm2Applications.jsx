import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress, Snackbar, Stack, Typography } from '@mui/material';
import { Add, Close, OpenInNew, Refresh } from '@mui/icons-material';
import ep1 from '../api/ep1';
import global1 from './global1';
import { ProgramChoice } from './Crm2ProgramPages';
import { useCrm2Dashboard } from './Crm2DashboardContext';
import PublicAdmissionApplyTabbedProgramDraftPage from './PublicAdmissionApplyTabbedProgramDraftPage';
const root = '/api/v2/crm2/applications';
const formLabel = row => row.__addOption ? row.label : row.name || row.programapplied || '';
export default function Crm2Applications({ lead, mode = '', api = ep1, portal = false }) {
  const dashboard = useCrm2Dashboard();
  const endpoint = portal ? '/api/v2/lead-portal/applications' : root;
  const scope = useMemo(() => ({ colid: global1.colid, user: global1.user || global1.email, leadid: lead._id, ...(mode ? { leadmode: mode } : {}), ...(dashboard ? { dashboardyear: dashboard.academicyear, token: global1.token } : {}) }), [lead._id, mode, dashboard]);
  const [rows, setRows] = useState([]), [choice, setChoice] = useState(null);
  const [adding, setAdding] = useState(false), [application, setApplication] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const saveRef = useRef(null);
  const load = useCallback(async signal => {
    setBusy(true); setError('');
    try {
      const list = await api.get(endpoint, { params: scope, signal });
      if (!signal?.aborted) setRows(list.data.data || []);
    } catch (e) { if (!signal?.aborted) setError(e.response?.data?.msg || e.message); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [scope, api, endpoint]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  const start = async () => {
    setBusy(true); setError('');
    try { setChoice(null); setAdding(true); }
    catch (e) { setError(e.response?.data?.msg || e.message); }
    finally { setBusy(false); }
  };
  const create = async () => {
    setBusy(true); setError('');
    try { const result = await api.post(`${endpoint}/new`, { ...scope, mappingid: choice._id }); setApplication(result.data.data); setAdding(false); await load(); }
    catch (e) { setError(e.response?.data?.msg || e.message); }
    finally { setBusy(false); }
  };
  const context = useMemo(() => application ? { colid: portal ? lead.colid : scope.colid, scope, application, saveRef, api, endpoint, allowSubmitted: portal } : null, [scope, application, api, endpoint, portal, lead.colid]);
  const close = async () => {
    if (saveRef.current && !await saveRef.current()) return;
    setApplication(null); load();
  };
  const payment = (row, provisional) => {
    const value = row[provisional ? 'provisionalpaymentstatus' : 'paymentstatus'] || 'Pending';
    return <Chip size="small" label={value} color={/^(paid|success)$/i.test(value) ? 'success' : 'default'} />;
  };
  return <Stack spacing={2} sx={{ width: '100%', p: 2 }}>
    <Stack direction="row" spacing={1}><Button startIcon={<Add />} variant="contained" disabled={busy} onClick={start}>New application</Button><IconButton title="Refresh applications" disabled={busy} onClick={() => load()}><Refresh /></IconButton></Stack>
    {busy && <LinearProgress />}
    <Snackbar open={Boolean(error)} autoHideDuration={8000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setError('')}><Alert variant="filled" severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
    {adding && <Stack spacing={2}>
      <ProgramChoice api={api} optionLabel={formLabel} title="Program and application form" endpoint={`${endpoint}/choices`} params={scope} value={choice} onChange={setChoice} addPath={portal ? undefined : '/crm2-program-form-mapping'} />
      <Typography variant="body2">Programs are loaded from this lead's assigned or interested programs and Program form mapping.</Typography>
      <Button disabled={!choice || busy} onClick={create}>Open form</Button>
    </Stack>}
    <Box sx={{ overflowX: 'auto', '& th, & td': { p: 1.5, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider' } }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Application','Academic year','Program','Program code','Status','Application fee payment','Provisional fee payment'].map(title => <th key={title}>{title}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row._id}><td><Button startIcon={<OpenInNew />} onClick={() => setApplication(row)}>{row.applicationnumber || row._id}</Button></td><td>{row.academicyear}</td><td>{row.programapplied}</td><td>{row.programcode}</td><td>{row.applicationstatus}</td><td>{payment(row, false)}</td><td>{payment(row, true)}</td></tr>)}</tbody></table>
      {!busy && !rows.length && <Typography sx={{ p: 2 }}>No applications yet.</Typography>}
    </Box>
    <Dialog open={Boolean(application)} fullWidth maxWidth="xl" onClose={close}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>Application · {application?.programapplied}<IconButton title="Close application" onClick={close}><Close /></IconButton></DialogTitle>
      <DialogContent dividers>{context && <PublicAdmissionApplyTabbedProgramDraftPage key={application._id} crmContext={context} />}</DialogContent>
    </Dialog>
  </Stack>;
}
