import React,{useEffect,useState} from 'react';
import {Alert,Button,LinearProgress,Stack} from '@mui/material';
import {ArrowBack} from '@mui/icons-material';
import {useSearchParams} from 'react-router-dom';
import {Crm2Content} from './Crm2Pages';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
export default function Crm2LeadEditorPage(){
 const [params]=useSearchParams(),id=params.get('id'),mode=params.get('mode')==='my'?'my':'',year=params.get('dashboardyear')||'';
 const [lead,setLead]=useState(null),[busy,setBusy]=useState(!!id),[error,setError]=useState('');
 useEffect(()=>{if(!id)return;const c=new AbortController();setBusy(true);ep1.get(`/api/v2/crm2/lead-editor/${encodeURIComponent(id)}`,{params:{colid:global1.colid,user:global1.user||global1.email,token:global1.token,leadmode:mode,...(year?{dashboardyear:year}:{})},signal:c.signal}).then(r=>setLead(r.data.data)).catch(e=>{if(!c.signal.aborted)setError(e.response?.data?.message||e.message);}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[id,mode,year]);
 return <MenuPageShell title={id?'Edit lead':'New lead'}><Stack spacing={2} sx={{p:2}}><Button startIcon={<ArrowBack/>} sx={{alignSelf:'flex-start'}} onClick={()=>window.location.assign(mode==='my'?'/counsellor-dashboard':'/crm2-leads')}>Back to {mode==='my'?'counselor dashboard':'Lead Master'}</Button>{busy?<LinearProgress/>:error?<Alert severity="error">{error}</Alert>:<Crm2Content key={id||'new'} entity="leads" mode={mode} initialLead={lead} initialTab={id?'CRM Details':'Identity'} editorPage/>}</Stack></MenuPageShell>;
}
