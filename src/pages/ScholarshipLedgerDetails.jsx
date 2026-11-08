import React,{forwardRef,memo,useEffect,useImperativeHandle,useState} from 'react';
import {Alert,Autocomplete,Box,Button,Dialog,DialogContent,DialogTitle,LinearProgress,Stack,TextField,Typography} from '@mui/material';
import {UploadFile} from '@mui/icons-material';
import ep1 from '../api/ep1';
import global1 from './global1';

const ScholarshipLedgerDetails=memo(forwardRef(function ScholarshipLedgerDetails({disabled=false,onUploading},ref){
  const [person,setPerson]=useState(null),[search,setSearch]=useState(''),[users,setUsers]=useState([]),[reference,setReference]=useState(''),[documentlink,setDocumentlink]=useState(''),[configs,setConfigs]=useState([]),[config,setConfig]=useState(null),[progress,setProgress]=useState(null),[error,setError]=useState(''),[master,setMaster]=useState(''),[loadingFrame,setLoadingFrame]=useState(false);
  useImperativeHandle(ref,()=>({getDetails:()=>({careofname:person?.name || '',careofemail:person?.email || '',reference,documentlink})}),[person,reference,documentlink]);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>ep1.get('/api/v2/admission-scholarship-apply/careof-users',{params:{colid:global1.colid,token:global1.token,search},signal:controller.signal}).then(res=>setUsers(res.data.data || [])).catch(err=>{if(!controller.signal.aborted)setError(err.response?.data?.message || err.message);}),250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[search]);
  useEffect(()=>{let active=true;ep1.get('/api/v2/aws-file-library/configs',{params:{colid:global1.colid}}).then(res=>{if(active){const rows=Array.isArray(res.data)?res.data:res.data?.data || [];setConfigs(rows);setConfig(rows.find(row=>row.default==='Yes') || rows[0] || null);}}).catch(err=>{if(active)setError(err.response?.data?.message || err.message);});return()=>{active=false;};},[]);
  const upload=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(!config){setError('Select an AWS configuration first');return;}
    setProgress(0);setError('');onUploading?.(true);
    try{
      const body=new FormData();body.append('file',file);body.append('colid',global1.colid);body.append('user',global1.user || global1.email || '');body.append('awsconfigid',config._id);body.append('folder','scholarship-documents');
      const res=await ep1.post('/api/v2/aws-file-library/upload',body,{onUploadProgress:event=>{if(event.total)setProgress(Math.min(99,Math.round(event.loaded*100/event.total)));}});
      if(!res.data?.url)throw Error('AWS upload did not return a document URL');setDocumentlink(res.data.url);
    }catch(err){setError(err.response?.data?.message || err.message);}finally{setProgress(null);onUploading?.(false);}
  };
  const open=path=>{setLoadingFrame(true);setMaster(path);};
  const locked=disabled || progress!==null;
  return <Stack spacing={2}>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',md:'repeat(2,minmax(0,1fr))'},gap:2}}>
      <Autocomplete options={[{_id:'__add',name:'+ Add user'},...users]} value={person} disabled={locked} filterOptions={options=>options} getOptionLabel={row=>row._id==='__add'?row.name:`${row.name || ''} (${row.email || ''})`} isOptionEqualToValue={(a,b)=>a._id===b._id} onInputChange={(_,value,reason)=>{if(reason==='input'||reason==='clear')setSearch(value);}} onChange={(_,value)=>value?._id==='__add'?open('/mbuser'):setPerson(value)} renderInput={params=><TextField {...params} label="Care-of name"/>}/>
      <TextField label="Care-of email" value={person?.email || ''} InputProps={{readOnly:true}}/>
      <TextField label="Reference" value={reference} disabled={locked} onChange={event=>setReference(event.target.value)} inputProps={{maxLength:2000}}/>
      <TextField label="Document link" value={documentlink} disabled={locked} onChange={event=>setDocumentlink(event.target.value)}/>
      <Autocomplete options={[{_id:'__add',name:'+ Add AWS configuration'},...configs]} value={config} disabled={locked} getOptionLabel={row=>row.name || row.configname || row.bucket || ''} isOptionEqualToValue={(a,b)=>a._id===b._id} onChange={(_,value)=>value?._id==='__add'?open('/awsconfigcrudpage'):setConfig(value)} renderInput={params=><TextField {...params} label="AWS configuration"/>}/>
      <Button component="label" disabled={locked} startIcon={<UploadFile/>}>Upload document to AWS<input hidden type="file" onChange={upload}/></Button>
    </Box>
    {progress!==null&&<><LinearProgress variant="determinate" value={progress}/><Typography variant="caption">{progress}% uploaded</Typography></>}
    {error&&<Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}
    <Dialog open={!!master} fullWidth maxWidth="xl" onClose={()=>setMaster('')}><DialogTitle>Add master record<Button onClick={()=>setMaster('')}>Close</Button></DialogTitle><DialogContent>{loadingFrame&&<LinearProgress/>}{master&&<Box component="iframe" title="Scholarship master record" src={`${master}?embedded=1`} onLoad={()=>setLoadingFrame(false)} sx={{height:'75vh',width:'100%',border:0}}/>}</DialogContent></Dialog>
  </Stack>;
}));
export default ScholarshipLedgerDetails;
