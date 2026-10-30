import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, ButtonBase, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Assignment, Close, Groups, PersonAdd, School } from '@mui/icons-material';
import MenuPageShell from './MenuPageShell';
import { Crm2Content as Crm2ContentView } from './Crm2Pages';
import CounselorTaskReport from './CounselorTaskReport';
import CounselorAdmittedReport from './CounselorAdmittedReport';
import Crm2LeadFilterPanel, { emptyLeadFilters } from './Crm2LeadFilterPanel';
import { TelecallerLeads as TelecallerLeadsView, TelecallerLeadDetails } from './TelecallerLeads';
import { Crm2DashboardContext } from './Crm2DashboardContext';
import ep1 from '../api/ep1';
import global1 from './global1';
const counselorEndpoint = '/api/v2/crm2-counselor-dashboard';
const Crm2Content = React.memo(Crm2ContentView), TelecallerLeads = React.memo(TelecallerLeadsView);
const cards = [
  { key: 'newleads', view: 'new', label: 'New leads assigned', Icon: PersonAdd, color: '#1f66a5' },
  { key: 'pending', view: 'tasks', label: 'Tasks pending', Icon: Assignment, color: '#a65c0c' },
  { key: 'admitted', view: 'admitted', label: 'Admitted leads', Icon: School, color: '#167749' }
];
export default function CounselorDashboard({ telecaller = false }) {
  const endpoint = telecaller ? '/api/v2/crm2-telecaller-dashboard' : counselorEndpoint;
  const [years, setYears] = useState([]), [year, setYear] = useState(null), [loadedYear, setLoadedYear] = useState('');
  const [summary, setSummary] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [detail, setDetail] = useState(null), [revision, setRevision] = useState(0);
  const [leadDetail, setLeadDetail] = useState(null), [taskRevision, setTaskRevision] = useState(0);
  const [filterDraft, setFilterDraft] = useState(emptyLeadFilters), [loadedFilters, setLoadedFilters] = useState(emptyLeadFilters);
  const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
  const headers = () => ({ Authorization: `Bearer ${global1.token}` });
  useEffect(() => {
    const controller = new AbortController();
    ep1.get(endpoint, { params: scope(), headers: headers(), signal: controller.signal }).then(result => setYears(result.data.years || [])).catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || error.message); });
    return () => controller.abort();
  }, [endpoint]);
  const load = async (selected, criteria = filterDraft) => {
    if (!selected) return;
    setBusy(true);
    try { const result = await ep1.get(endpoint, { params: { ...scope(), ...criteria, filters: JSON.stringify(criteria.filters), academicyear: selected }, headers: headers() }); setSummary(result.data.data); setLoadedYear(selected); setLoadedFilters(criteria); setRevision(value => value + 1); }
    catch (error) { setError(error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  };
  const onOpenLead = useCallback(async id => {
    setBusy(true);
    try { const result = await ep1.get(`${endpoint}/lead/${id}`, { params: { ...loadedFilters, filters: JSON.stringify(loadedFilters.filters), academicyear: loadedYear }, headers: { Authorization: `Bearer ${global1.token}` } }); setLeadDetail(result.data.data); }
    catch (error) { setError(error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  }, [loadedYear, loadedFilters, endpoint]);
  const context = useMemo(() => ({ ...loadedFilters, academicyear: loadedYear, endpoint, telecaller, readOnly: telecaller, onOpenLead }), [loadedFilters, loadedYear, endpoint, telecaller, onOpenLead]);
  const detailContext = useMemo(() => ({ ...context, view: detail?.view, taskStatusOnly: detail?.view === 'tasks' }), [context, detail]);
  const leadContext = useMemo(() => ({ ...context, taskStatusOnly: true }), [context]);
  const close = () => { setDetail(null); load(loadedYear, loadedFilters); };
  const closeLead = () => { setLeadDetail(null); setTaskRevision(value => value + 1); load(loadedYear, loadedFilters); };
  return <MenuPageShell title={telecaller ? 'Telecaller dashboard' : 'Counsellor dashboard'}><Stack spacing={3} sx={{ p: { xs: 1, md: 2 } }}>
    <Stack direction="row" useFlexGap flexWrap="wrap" spacing={2} alignItems="center"><Autocomplete sx={{ width: 280 }} options={years} value={year} onChange={(_, value) => setYear(value)} renderInput={params => <TextField {...params} size="small" label="Academic year" />} /><Button variant="contained" disabled={!year || busy} onClick={() => load(year)}>Load</Button>{loadedYear && <Typography color="text.secondary">Academic year: {loadedYear}</Typography>}</Stack>
    <Crm2LeadFilterPanel value={filterDraft} onChange={setFilterDraft} academicyear={year} endpoint={endpoint} />
    {busy && <LinearProgress />}
    {summary && <>
      <Grid container spacing={2}>{cards.map(({ key, view, label, Icon, color }) => <Grid item xs={12} md={4} key={key}><ButtonBase aria-label={`${label}: ${summary[key]}`} onClick={() => setDetail({ view, label })} sx={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', bgcolor: '#fff', border: '1px solid #dce3e9', borderLeft: `4px solid ${color}`, borderRadius: 1, p: 2.5, gap: 2, minHeight: 112, '&:hover': { bgcolor: '#f4f8fc' } }}><Icon sx={{ color, fontSize: 32 }} /><Box><Typography variant="h4" sx={{ color: '#192a3a' }}>{summary[key]}</Typography><Typography>{label}</Typography>{key === 'newleads' && <Typography variant="caption" color="text.secondary">{summary.since ? `Since ${new Date(summary.since).toLocaleString()}` : 'First tracked sign-in · all assigned leads'}</Typography>}</Box></ButtonBase></Grid>)}</Grid>
      <Stack direction="row" spacing={1} alignItems="center"><Groups color="primary" /><Typography variant="h6">My leads</Typography><Typography color="text.secondary">({summary.total})</Typography></Stack>
      <Crm2DashboardContext.Provider value={context}>{telecaller ? <TelecallerLeads key={`${loadedYear}-${revision}`} /> : <Crm2Content key={`${loadedYear}-${revision}`} entity="leads" mode="my" autoLoad />}</Crm2DashboardContext.Provider>
    </>}
    <Dialog open={Boolean(detail)} onClose={close} fullWidth maxWidth="xl"><DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{detail?.label} · {loadedYear}<IconButton title="Close details" onClick={close}><Close /></IconButton></DialogTitle><DialogContent dividers><Crm2DashboardContext.Provider value={detailContext}>{detail && (detail.view === 'tasks' ? <CounselorTaskReport key={`${loadedYear}-tasks-${taskRevision}`} /> : detail.view === 'admitted' ? <CounselorAdmittedReport /> : telecaller ? <TelecallerLeads /> : <Crm2Content key={`${loadedYear}-${detail.view}`} entity="leads" mode="my" autoLoad />)}</Crm2DashboardContext.Provider></DialogContent></Dialog>
    <Dialog open={Boolean(leadDetail)} onClose={closeLead} fullWidth maxWidth="xl"><DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{leadDetail?.name}<IconButton title="Close lead details" onClick={closeLead}><Close /></IconButton></DialogTitle><DialogContent dividers><Crm2DashboardContext.Provider value={leadContext}>{leadDetail && (telecaller ? <TelecallerLeadDetails key={leadDetail._id} lead={leadDetail} /> : <Crm2Content key={leadDetail._id} entity="leads" mode="my" initialLead={leadDetail} initialTab="Lead tasks" detailOnly />)}</Crm2DashboardContext.Provider></DialogContent></Dialog>
    <Snackbar open={Boolean(error)} autoHideDuration={8000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
