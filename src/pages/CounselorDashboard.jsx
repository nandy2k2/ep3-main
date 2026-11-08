import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, ButtonBase, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Assignment, Close, Event, Groups, PersonAdd, School } from '@mui/icons-material';
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
const followupCards = [
  { key: 'followupsToday', view: 'followup', day: 'today', label: 'Follow-ups today', Icon: Event, color: '#a3472d' },
  { key: 'followupsTomorrow', view: 'followup', day: 'tomorrow', label: 'Follow-ups tomorrow', Icon: Event, color: '#12756f' }
];
const pipelineColors = ['#2468a2', '#23806d', '#a65c0c', '#9c4568', '#5a628f'];
function PipelineChart({ rows, onSelect }) {
  const max = Math.max(1, ...rows.map(row => row.count));
  return <Box component="section" aria-label="Pipeline-wise leads" sx={{ borderBlock: '1px solid', borderColor: 'divider', py: 2 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>Pipeline-wise leads</Typography>
    {!rows.length && <Typography color="text.secondary">No leads in this selection.</Typography>}
    <Stack sx={{ maxHeight: 360, overflowY: 'auto' }}>
      {rows.map(({ _id, count }, index) => {
        const label = _id || 'No pipeline stage';
        return <ButtonBase key={_id} aria-label={`${label}: ${count} leads`} onClick={() => onSelect({ view: 'pipeline', pipeline: _id, label })} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) 48px', sm: 'minmax(130px, 1fr) 3fr 60px' }, gap: 1, px: 1, py: 1, width: '100%', textAlign: 'left', borderRadius: 1, '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' } }}>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{label}</Typography>
          <Box aria-hidden sx={{ height: 12, borderRadius: 1, bgcolor: 'action.hover', gridRow: { xs: 2, sm: 1 }, gridColumn: { xs: '1 / -1', sm: 2 } }}><Box sx={{ height: '100%', width: `${count / max * 100}%`, borderRadius: 1, bgcolor: pipelineColors[index % pipelineColors.length] }} /></Box>
          <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 700 }}>{count}</Typography>
        </ButtonBase>;
      })}
    </Stack>
  </Box>;
}
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
      <Grid container spacing={2}>{(telecaller ? cards : [...cards, ...followupCards]).map(({ key, view, day, label, Icon, color }) => <Grid item xs={12} sm={6} md={4} lg={telecaller ? 4 : 2.4} key={key}><ButtonBase aria-label={`${label}: ${summary[key] ?? 0}`} onClick={() => setDetail({ view, day, label })} sx={{ width: '100%', height: '100%', justifyContent: 'flex-start', textAlign: 'left', bgcolor: '#fff', border: '1px solid #dce3e9', borderLeft: `4px solid ${color}`, borderRadius: 1, p: 2, gap: 1.5, minHeight: 112, '&:hover, &.Mui-focusVisible': { bgcolor: '#f4f8fc' } }}><Icon sx={{ color, fontSize: 28 }} /><Box><Typography variant="h4" sx={{ color: '#192a3a' }}>{summary[key] ?? 0}</Typography><Typography>{label}</Typography>{key === 'newleads' && <Typography variant="caption" color="text.secondary">{summary.since ? `Since ${new Date(summary.since).toLocaleString()}` : 'First tracked sign-in · all assigned leads'}</Typography>}</Box></ButtonBase></Grid>)}</Grid>
      {!telecaller && <PipelineChart rows={summary.pipelines || []} onSelect={setDetail} />}
      <Stack direction="row" spacing={1} alignItems="center"><Groups color="primary" /><Typography variant="h6">My leads</Typography><Typography color="text.secondary">({summary.total})</Typography></Stack>
      <Crm2DashboardContext.Provider value={context}>{telecaller ? <TelecallerLeads key={`${loadedYear}-${revision}`} /> : <Crm2Content key={`${loadedYear}-${revision}`} entity="leads" mode="my" autoLoad />}</Crm2DashboardContext.Provider>
    </>}
    <Dialog open={Boolean(detail)} onClose={close} fullWidth maxWidth="xl"><DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{detail?.label} · {loadedYear}<IconButton title="Close details" onClick={close}><Close /></IconButton></DialogTitle><DialogContent dividers><Crm2DashboardContext.Provider value={detailContext}>{detail && (detail.view === 'tasks' ? <CounselorTaskReport key={`${loadedYear}-tasks-${taskRevision}`} /> : detail.view === 'admitted' ? <CounselorAdmittedReport /> : ['pipeline', 'followup'].includes(detail.view) ? <CounselorAdmittedReport {...detail} revision={revision} /> : telecaller ? <TelecallerLeads /> : <Crm2Content key={`${loadedYear}-${detail.view}`} entity="leads" mode="my" autoLoad />)}</Crm2DashboardContext.Provider></DialogContent></Dialog>
    <Dialog open={Boolean(leadDetail)} onClose={closeLead} fullWidth maxWidth="xl"><DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{leadDetail?.name}<IconButton title="Close lead details" onClick={closeLead}><Close /></IconButton></DialogTitle><DialogContent dividers><Crm2DashboardContext.Provider value={leadContext}>{leadDetail && (telecaller ? <TelecallerLeadDetails key={leadDetail._id} lead={leadDetail} /> : <Crm2Content key={leadDetail._id} entity="leads" mode="my" initialLead={leadDetail} initialTab={detail?.view === 'pipeline' ? 'CRM Details' : 'Lead tasks'} detailOnly />)}</Crm2DashboardContext.Provider></DialogContent></Dialog>
    <Snackbar open={Boolean(error)} autoHideDuration={8000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
