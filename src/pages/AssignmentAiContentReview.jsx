import React, { useState } from 'react';
import { Alert, Autocomplete, Box, Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, LinearProgress, Snackbar, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { AutoFixHigh, HelpOutline } from '@mui/icons-material';
import ep1 from '../api/ep1';
import global1 from './global1';

export function AiContentCheckbox({ checked, onChange, disabled }) {
  const [help,setHelp] = useState(false);
  return <><Stack direction="row" alignItems="center"><FormControlLabel control={<Checkbox checked={!!checked} onChange={event=>onChange(event.target.checked)} disabled={disabled}/>} label="Check for AI content"/><Tooltip title="How AI content assessment works"><IconButton aria-label="How AI content assessment works" onClick={()=>setHelp(true)}><HelpOutline/></IconButton></Tooltip></Stack>
    <Dialog open={help} onClose={()=>setHelp(false)} fullWidth maxWidth="sm"><DialogTitle>AI content assessment · How it works</DialogTitle><DialogContent><Stack spacing={2}>
      <Typography>The selected AI provider examines readable student comments and text extracted from institution-owned AWS attachments (PDF, DOCX, TXT, Markdown, CSV or HTML). It looks for possible AI-assistance indicators and returns exact supporting excerpts with explanations.</Typography>
      <Typography>Findings distinguish predominantly AI-like, mixed AI-like, no clear indicators, and inconclusive writing. These are unverified indicators, not proof that work was entirely or partially AI-generated. No tool can be reliably identified. Human writing may be flagged, and AI writing may be missed.</Typography>
      <Typography>The report records coverage: unsupported files, scanned images, inaccessible files and short content are not silently treated as checked. Inspection is limited to 10 MB files, the first 20 PDF pages and 24,000 text characters. Truncated coverage does not represent the whole submission.</Typography>
      <Typography>The report is saved separately from academic marks. It does not automatically deduct marks or flag misconduct. Review drafts, sources and the student's explanation before taking action.</Typography><Button onClick={()=>setHelp(false)}>Close</Button>
    </Stack></DialogContent></Dialog></>;
}
export function AiContentReport({ report }) {
  const [open,setOpen] = useState(false);
  if (!report?.checked) return <Typography variant="caption">Not checked</Typography>;
  return <><Button size="small" onClick={()=>setOpen(true)}>{report.finding} · Review</Button><Dialog fullWidth maxWidth="md" open={open} onClose={()=>setOpen(false)}><DialogTitle>AI content assessment · Unverified</DialogTitle><DialogContent><Stack spacing={2}>
    <Alert severity="warning">{report.limitations}</Alert><Typography variant="h6">{report.finding}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{report.summary}</Typography>
    <Typography variant="body2">{report.attachmentStatus} · {report.inspectedCharacters || 0} text characters inspected{report.truncated ? ' · Partial/truncated content only' : ''}</Typography>
    {(report.evidence || []).map((row,index)=><Box key={index} sx={{borderLeft:'3px solid',borderColor:'divider',pl:2}}><Typography component="blockquote" sx={{m:0,whiteSpace:'pre-wrap'}}>{row.quote}</Typography><Typography variant="body2" sx={{mt:1}}>{row.reason}</Typography></Box>)}
    <Typography variant="caption">{report.provider}{report.requestedModel ? ` · Requested model: ${report.requestedModel}` : ''} · {report.checkedat ? new Date(report.checkedat).toLocaleString() : ''} · {report.checkedby}</Typography><Button onClick={()=>setOpen(false)}>Close</Button>
  </Stack></DialogContent></Dialog></>;
}
const models = { Gemini: ['gemini-2.5-flash','gemini-2.5-pro'], ChatGPT: ['gpt-4o-mini','gpt-4.1','gpt-5'], Claude: ['claude-3-5-haiku-latest','claude-sonnet-4-5'] };
export function AssignmentEvaluationPanel({ submission, fullmarks, ollamaConfigs = [], onEvaluated }) {
  const [provider,setProvider] = useState('Gemini'), [model,setModel] = useState('gemini-2.5-flash'), [ollama,setOllama] = useState(null);
  const [check,setCheck] = useState(false), [busy,setBusy] = useState(false), [notice,setNotice] = useState(null);
  const [configOpen,setConfigOpen] = useState(false), [frameLoading,setFrameLoading] = useState(false), [extraConfigs,setExtraConfigs] = useState([]);
  const configOptions = [...new Map([...ollamaConfigs,...extraConfigs].map(row=>[row._id,row])).values()];
  const closeConfig = async () => {
    setConfigOpen(false);
    try { const {data} = await ep1.get('/api/v2/ollama-configuration',{params:{colid:global1.colid}}); setExtraConfigs((data.data || []).filter(row=>String(row.active).toLowerCase()==='yes')); }
    catch(error) {setNotice({text:'Unable to refresh Ollama configurations',severity:'error'});}
  };
  const evaluate = async () => {
    setBusy(true);
    try {
      const {data} = await ep1.post('/api/v2/neplms/assignment-submissions/ai-evaluate',{ colid:global1.colid,id:submission._id,fullmarks,provider,model,ollamaConfigId:ollama?._id || '',checkAiContent:check,gradedby:global1.name || global1.user,user:global1.user });
      onEvaluated(data.data);setNotice({text:'AI evaluation saved. Review marks and any content assessment before finalizing.',severity:'success'});
    } catch(error) {setNotice({text:error.response?.data?.message || error.message,severity:'error'});}
    finally {setBusy(false);}
  };
  return <Stack spacing={1} sx={{mt:2}}>{busy && <LinearProgress/>}<Grid container spacing={2} alignItems="center">
    <Grid item xs={12} md={3}><Autocomplete disabled={busy} options={['Gemini','ChatGPT','Claude','Ollama']} value={provider} onChange={(_,value)=>{if(value){setProvider(value);setModel(models[value]?.[0] || '');}}} renderInput={params=><TextField {...params} label="AI provider"/>}/></Grid>
    <Grid item xs={12} md={4}>{provider==='Ollama' ? <Autocomplete disabled={busy} options={[{_id:'__add',name:'+ Add Ollama configuration'},...configOptions]} value={ollama} getOptionLabel={row=>row._id==='__add'?row.name:`${row.name} - ${row.modelname}`} onChange={(_,value)=>{if(value?._id==='__add'){setFrameLoading(true);setConfigOpen(true);}else setOllama(value);}} renderInput={params=><TextField {...params} label="Ollama configuration"/>}/> : <Autocomplete disabled={busy} freeSolo options={models[provider] || []} inputValue={model} onInputChange={(_,value)=>setModel(value)} renderInput={params=><TextField {...params} label="AI model"/>}/>}</Grid>
    <Grid item xs={12} md={5}><AiContentCheckbox checked={check} disabled={busy} onChange={setCheck}/></Grid>
    <Grid item xs={12}><Button variant="outlined" startIcon={<AutoFixHigh/>} disabled={busy || !submission || !Number(fullmarks) || (provider==='Ollama' ? !ollama : !model.trim())} onClick={evaluate}>{busy?'Evaluating…':'AI evaluate submission'}</Button></Grid>
  </Grid><AiContentReport report={submission.aicontentreview}/><Dialog fullWidth maxWidth="lg" open={configOpen} onClose={closeConfig}><DialogTitle>Ollama configuration</DialogTitle><DialogContent>{frameLoading && <LinearProgress/>}{configOpen && <Box component="iframe" title="Ollama configuration" src="/ollamaconfiguration?embedded=1" onLoad={()=>setFrameLoading(false)} sx={{width:'100%',height:'70vh',border:0}}/>}<Button onClick={closeConfig}>Close</Button></DialogContent></Dialog><Snackbar open={!!notice} autoHideDuration={8000} onClose={()=>setNotice(null)} anchorOrigin={{vertical:'top',horizontal:'center'}}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={()=>setNotice(null)}>{notice?.text}</Alert></Snackbar></Stack>;
}
