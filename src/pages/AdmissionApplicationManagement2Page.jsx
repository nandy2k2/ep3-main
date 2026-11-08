import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress, Snackbar, Stack, Tooltip, Typography } from '@mui/material';
import { Close, HelpOutline, SyncAlt, WhatsApp } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import AdmissionApplicationManagementPage from './AdmissionApplicationManagementPage';
import SendWhatsappPingPage from './SendWhatsappPingPage';
import global1 from './global1';
import ep1 from '../api/ep1';

export function AdmissionTransferActions({ selectedRows }) {
  const [help,setHelp] = useState(false), [ping,setPing] = useState(false), [busy,setBusy] = useState(false);
  const [progress,setProgress] = useState(0), [results,setResults] = useState([]), [notice,setNotice] = useState(null);
  const transfer = async () => {
    const regnos = selectedRows.map(row=>row.regno).filter(Boolean);
    if(new Set(regnos).size !== regnos.length) return setNotice({text:'Select only one application per regno before transferring.',severity:'warning'});
    if(!window.confirm(`Update mapped fields for ${selectedRows.length} selected applicants in User? Protected fields will remain unchanged.`)) return;
    setBusy(true); setProgress(0); setResults([]); const collected=[];
    try {
      for(let i=0;i<selectedRows.length;i+=100) {
        const {data} = await ep1.post('/api/v2/admission-application-management-2/transfer',{colid:global1.colid,ids:selectedRows.slice(i,i+100).map(row=>row._id)});
        collected.push(...data.results); setResults([...collected]); setProgress(Math.round(Math.min(i+100,selectedRows.length)/selectedRows.length*100));
      }
      setNotice({text:`${collected.filter(row=>row.status==='Transferred').length} transferred; ${collected.filter(row=>row.status!=='Transferred').length} skipped.`,severity:collected.some(row=>row.status!=='Transferred')?'warning':'success'});
    } catch(error) {setNotice({text:error.response?.data?.error || error.message,severity:'error'});}
    finally {setBusy(false);}
  };
  return <Stack spacing={2} sx={{mb:2}}><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
    <Button variant="contained" startIcon={<SyncAlt />} disabled={busy || !selectedRows.length} onClick={transfer}>Transfer to User ({selectedRows.length})</Button>
    <Tooltip title="Mapping and transfer help"><IconButton aria-label="Mapping and transfer help" onClick={()=>setHelp(true)}><HelpOutline /></IconButton></Tooltip>
    <Button variant="outlined" color="success" startIcon={<WhatsApp />} disabled={busy || !selectedRows.length} onClick={()=>setPing(true)}>Send WhatsApp through Ping</Button>
  </Stack>{busy && <Stack spacing={1}><LinearProgress variant="determinate" value={progress}/><Typography variant="body2">Transfer {progress}%</Typography></Stack>}
    {!!results.length && <Box sx={{height:300}}><DataGrid rows={results} columns={[{field:'name',headerName:'Applicant',flex:1,minWidth:150},{field:'regno',headerName:'Regno',width:180},{field:'status',headerName:'Result',width:130},{field:'details',headerName:'Details',flex:2,minWidth:300}]} slots={{toolbar:GridToolbar}} /></Box>}
    <Dialog open={help} onClose={()=>setHelp(false)} fullWidth maxWidth="sm"><DialogTitle>Admission to User transfer</DialogTitle><DialogContent><Stack spacing={2}>
      <Typography>1. Open Admission to User mapping. The left list combines standard and custom admission fields across all forms for your institution. Drag a field onto its destination User field; the link is saved automatically. Selecting a left field and clicking a right field also works.</Typography>
      <Typography>2. Load and select applications here, then click Transfer to User. Each application is matched to an existing Student using regno and colid only. Missing regnos, missing students and duplicate matches are skipped with details. Users are not created.</Typography>
      <Typography>3. Only mapped, nonempty fields are transferred. Name, email, program, programcode, regno, rollno, semester, regulation, academicyear and admissionyear never change, even when mapped. Authentication and system fields are excluded. Empty source fields do not erase existing data.</Typography>
      <Button component={Link} to="/admission-user-mapping">Open field mapping</Button><Button onClick={()=>setHelp(false)}>Close</Button>
    </Stack></DialogContent></Dialog>
    <Dialog open={ping} onClose={()=>setPing(false)} fullWidth maxWidth="lg"><DialogTitle>WhatsApp · Selected applicants<IconButton aria-label="Close WhatsApp" sx={{float:'right'}} onClick={()=>setPing(false)}><Close /></IconButton></DialogTitle><DialogContent>{ping && <SendWhatsappPingPage direct embedded applicationIds={selectedRows.map(row=>row._id)} initialPhoneNumbers={selectedRows.map(row=>row.phone || '(missing phone)').join(', ')} />}</DialogContent></Dialog>
    <Snackbar open={!!notice} autoHideDuration={9000} onClose={()=>setNotice(null)} anchorOrigin={{vertical:'top',horizontal:'center'}}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={()=>setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}
export default function AdmissionApplicationManagement2Page() {
  return <AdmissionApplicationManagementPage title="Application Management 2" renderExtraActions={selectedRows=><AdmissionTransferActions selectedRows={selectedRows}/>} />;
}
