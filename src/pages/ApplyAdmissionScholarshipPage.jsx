import React,{memo,useCallback,useEffect,useRef,useState} from 'react';
import ScholarshipLedgerDetails from './ScholarshipLedgerDetails';
import {Alert,Autocomplete,Box,Button,Checkbox,Chip,Dialog,DialogContent,DialogTitle,Grid,IconButton,LinearProgress,Paper,Snackbar,Stack,Step,StepLabel,Stepper,TextField,Typography} from '@mui/material';
import {Add,Close,Delete,Refresh,Save} from '@mui/icons-material';
import {DataGrid,GridToolbar} from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';
import {ScholarshipItemsGrid} from './AdmissionScholarshipItems';
const root='/api/v2/admission-scholarship-apply';
const scope=()=>({colid:global1.colid,user:global1.user || global1.email,token:global1.token});
const label=field=>({academicyear:'Academic year',admissionyear:'Admission year',programcode:'Program code',regno:'Regno',feeitem:'Fee item',feecategory:'Fee category',scholarshiptype:'Scholarship type',meritpercentage:'Merit percentage',freeshipcardholder:'Freeship card holder',annualincome:'Annual income'}[field] || field.charAt(0).toUpperCase()+field.slice(1));
const rowId=row=>row._id,slots={toolbar:GridToolbar};
const columns={students:['name','regno','email','academicyear','regulation','program','programcode','semester','section','gender','category'],scholarships:['scholarship','academicyear','program','programcode','semester','feeitem','feecategory','scholarshiptype','type','value','gender','category','merit','meritpercentage']};
const grids=Object.fromEntries(Object.entries(columns).map(([kind,fields])=>[kind,fields.map(field=>({field,headerName:label(field),minWidth:170}))]));
const ResultsGrid=memo(DataGrid);
const specialAdd={value:'__add',label:'+ Add record'},specialAll={value:'__all',label:'Select all loaded options'};
const optionLabel=row=>row?.label || '';
export function studentScholarshipFilters(students){
  return ['academicyear','program','programcode','semester'].map((field,index)=>{
    const selections=[...new Map(students.filter(row=>row[field]!=null&&String(row[field]).trim()).map(row=>{
      const value=String(row[field]).trim();return [`${value}|${field==='program'?row.programcode || '':''}`,{value,label:field==='program'?`${value} (${row.programcode || ''})`:value,...(field==='program'?{programcode:row.programcode}:{})}];
    })).values()];
    return {id:index+1,field,values:[...new Set(selections.map(row=>row.value))],selections};
  });
}
function AddMaster({path,onClose}){
  const [loading,setLoading]=useState(true);useEffect(()=>setLoading(true),[path]);
  return <Dialog open={!!path} fullWidth maxWidth="xl" onClose={onClose}><DialogTitle>Add master record<IconButton aria-label="Close master" sx={{float:'right'}} onClick={onClose}><Close/></IconButton></DialogTitle><DialogContent>{loading&&<LinearProgress/>}{path&&<Box component="iframe" title="Add master record" src={`${path}?embedded=1`} onLoad={()=>setLoading(false)} sx={{width:'100%',height:'75vh',border:0}}/>}</DialogContent></Dialog>;
}
const DynamicFilters=memo(function DynamicFilters({kind,fields,filters,setFilters,notify}){
  const [options,setOptions]=useState({}),[pending,setPending]=useState(''),[master,setMaster]=useState('');const nextId=useRef(Math.max(0,...filters.map(row=>Number(row.id)||0))+1),requests=useRef(new Map()),timers=useRef(new Map());
  useEffect(()=>{nextId.current=Math.max(nextId.current,...filters.map(row=>(Number(row.id)||0)+1));},[filters]);
  useEffect(()=>{for(const request of requests.current.values())request.abort();requests.current.clear();for(const timer of timers.current.values())clearTimeout(timer);timers.current.clear();setPending('');return()=>{for(const request of requests.current.values())request.abort();for(const timer of timers.current.values())clearTimeout(timer);};},[filters]);
  const load=async(filter,search='')=>{
    requests.current.get(filter.id)?.abort();const controller=new AbortController();requests.current.set(filter.id,controller);
    setPending(filter.id);
    try{const {data}=await ep1.post(`${root}/${kind}/options`,{...scope(),field:filter.field,search,filters:filters.map(({field,values})=>({field,values}))},{signal:controller.signal});if(!controller.signal.aborted)setOptions(previous=>({...previous,[filter.id]:data.data || []}));}
    catch(error){if(!controller.signal.aborted)notify(error.response?.data?.message || error.message,'error');}
    finally{if(requests.current.get(filter.id)===controller){requests.current.delete(filter.id);if(!controller.signal.aborted)setPending(previous=>previous===filter.id?'':previous);}}
  };
  const choose=(filter,chosen)=>{
    if(chosen.some(row=>row.value==='__add')){setMaster(['program','programcode'].includes(filter.field)?'/programmanagement':kind==='students'?'/studentdataupload':'/admission-scholarship-master');return;}
    const available=options[filter.id] || [];
    const choices=chosen.some(row=>row.value==='__all')?(available.length&&available.every(row=>filter.values.includes(row.value))?[]:available):chosen;
    const values=[...new Set(choices.map(row=>row.value))];
    setFilters(previous=>{
      let updated=previous.map(row=>row.id===filter.id?{...row,values,selections:choices}:row);
      if(filter.field==='academicyear')updated=updated.map(row=>['program','programcode'].includes(row.field)?{...row,values:[],selections:[]}:row);
      if(filter.field==='program'){
        const codes=[...new Set(choices.map(row=>row.programcode).filter(Boolean))],existing=updated.find(row=>row.field==='programcode');
        if(existing)updated=updated.map(row=>row.id===existing.id?{...row,values:codes}:row);
        else if(codes.length)updated.push({id:nextId.current++,field:'programcode',values:codes});
      }return updated;
    });
  };
  return <Stack spacing={1}>{filters.map(filter=><Grid container spacing={1} alignItems="center" key={filter.id}>
    <Grid item xs={12} md={3}><Autocomplete options={fields} value={filter.field} getOptionLabel={label} onChange={(_,field)=>{setFilters(previous=>previous.map(row=>row.id===filter.id?{...row,field:field || '',values:[],selections:[]}:row));setOptions(previous=>({...previous,[filter.id]:[]}));}} renderInput={params=><TextField {...params} size="small" label="Filter field"/>}/></Grid>
    <Grid item xs={10} md={8}><Autocomplete multiple disableCloseOnSelect options={[specialAdd,specialAll,...(options[filter.id] || [])]} filterOptions={rows=>rows} value={filter.values.map(value=>(options[filter.id] || []).find(row=>row.value===value)||(filter.selections || []).find(row=>row.value===value)||{value,label:value})} getOptionLabel={optionLabel} isOptionEqualToValue={(a,b)=>a.value===b.value} loading={pending===filter.id} disabled={!filter.field} onOpen={()=>load(filter)} onInputChange={(_,search,reason)=>{if(reason==='input'||reason==='clear'){clearTimeout(timers.current.get(filter.id));timers.current.set(filter.id,setTimeout(()=>load(filter,search),250));}}} onChange={(_,chosen)=>choose(filter,chosen)} renderOption={(props,row,{selected})=><li {...props} key={`${row.value}-${row.programcode || ''}`}><Checkbox size="small" checked={selected}/>{row.label}</li>} renderInput={params=><TextField {...params} size="small" label={`${label(filter.field || 'field')} values`}/>}/></Grid>
    <Grid item xs={2} md={1}><IconButton aria-label="Remove filter" onClick={()=>setFilters(previous=>previous.filter(row=>row.id!==filter.id))}><Delete/></IconButton></Grid>
  </Grid>)}<Button startIcon={<Add/>} sx={{alignSelf:'flex-start'}} onClick={()=>setFilters(previous=>[...previous,{id:nextId.current++,field:'academicyear',values:[]}])}>Add filter</Button><AddMaster path={master} onClose={()=>{setMaster('');setOptions({});}}/></Stack>;
});
export const ScholarshipSelectionPane=memo(function ScholarshipSelectionPane({kind,fields,active,onContinue,notify,initialFilters=[]}){
  const [filters,setFilters]=useState(initialFilters),[search,setSearch]=useState(''),[rows,setRows]=useState([]),[selected,setSelected]=useState([]),[total,setTotal]=useState(0),[busy,setBusy]=useState(false),[loadedKey,setLoadedKey]=useState('');
  const queryKey=JSON.stringify({filters:filters.map(({field,values})=>({field,values})),search});
  const load=async(nextFilters=filters,nextSearch=search)=>{
    setBusy(true);setSelected([]);
    const requestedKey=JSON.stringify({filters:nextFilters.map(({field,values})=>({field,values})),search:nextSearch});
    try{const {data}=await ep1.post(`${root}/${kind}/search`,{...scope(),filters:nextFilters.map(({field,values})=>({field,values})),search:nextSearch,limit:1000});if(!Array.isArray(data.data))throw Error(`Unable to load ${kind}. Check the backend endpoints.`);setRows(data.data);setTotal(data.total || 0);setLoadedKey(requestedKey);}
    catch(error){notify(error.response?.data?.message || error.message,'error');}finally{setBusy(false);}
  };
  if(!active)return null;
  return <Stack spacing={2}><DynamicFilters kind={kind} fields={fields} filters={filters} setFilters={setFilters} notify={notify}/><Stack component="form" direction={{xs:'column',sm:'row'}} spacing={1} onSubmit={event=>{event.preventDefault();load();}}><TextField size="small" label={kind==='students'?'Search students':'Search scholarships'} value={search} onChange={event=>setSearch(event.target.value)}/><Button type="submit" variant="outlined" startIcon={<Refresh/>} disabled={busy}>Load {kind}</Button><Chip label={`${selected.length} selected · ${total} matching`}/></Stack>
    {kind==='scholarships'&&<Stack direction="row" spacing={1}><Button disabled={busy} onClick={()=>{setFilters([]);setSearch('');load([],'');}}>Show all scholarships</Button><Button disabled={busy} onClick={()=>{setFilters(initialFilters);setSearch('');load(initialFilters,'');}}>Use selected students' filters</Button></Stack>}
    {total>rows.length&&<Alert severity="info">Showing {rows.length} of {total}. Narrow the filters to select additional records.</Alert>}
    <Box sx={{height:440}}><ResultsGrid rows={rows} getRowId={rowId} columns={grids[kind]} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={setSelected} loading={busy} slots={slots}/></Box>
    <Button variant="contained" disabled={busy||loadedKey!==queryKey||!selected.length||selected.length>(kind==='students'?200:100)} onClick={()=>onContinue(selected,rows.filter(row=>selected.includes(row._id)))}>Continue with selected {kind}</Button>
    {selected.length>(kind==='students'?200:100)&&<Alert severity="warning">Select up to {kind==='students'?200:100} {kind} per batch.</Alert>}
  </Stack>;
});
const emptyFields={students:[],scholarships:[]};
export default function ApplyAdmissionScholarshipPage(){
  const [defaultScholarshipFilters,setDefaultScholarshipFilters]=useState([]),[studentSelectionVersion,setStudentSelectionVersion]=useState(0);
  const ledgerDetails=useRef(null),itemsGrid=useRef(null),[uploading,setUploading]=useState(false);
  const [step,setStep]=useState(0),[fields,setFields]=useState(emptyFields),[students,setStudents]=useState([]),[scholarships,setScholarships]=useState([]),[preview,setPreview]=useState({rows:[],unmatched:[]}),[chosen,setChosen]=useState([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null);
  const notify=useCallback((message,severity='success')=>setNotice({message,severity}),[]);
  useEffect(()=>{let active=true;ep1.get(`${root}/metadata`,{params:scope()}).then(res=>{if(!Array.isArray(res.data?.fields?.students)||!Array.isArray(res.data?.fields?.scholarships))throw Error('Scholarship endpoints are unavailable. Restart the updated backend.');if(active)setFields(res.data.fields);}).catch(error=>{if(active)notify(error.response?.data?.message || error.message,'error');});return()=>{active=false;};},[notify]);
  const loadPreview=useCallback(async()=>{
    setBusy(true);setChosen([]);
    try{const {data}=await ep1.post(`${root}/preview`,{...scope(),studentids:students,scholarshipids:scholarships});if(!Array.isArray(data.rows))throw Error('Unable to load matching scholarship items. Check the backend endpoints.');setPreview({rows:data.rows,unmatched:data.unmatched || []});}
    catch(error){setPreview({rows:[],unmatched:[]});notify(error.response?.data?.message || error.message,'error');}finally{setBusy(false);}
  },[students,scholarships,notify]);
  useEffect(()=>{if(step===2)loadPreview();},[step,loadPreview]);
  const chooseStudents=useCallback((ids,rows)=>{setStudents(ids);setDefaultScholarshipFilters(studentScholarshipFilters(rows));setStudentSelectionVersion(value=>value+1);setScholarships([]);setPreview({rows:[],unmatched:[]});setChosen([]);setStep(1);},[]);
  const chooseScholarships=useCallback(ids=>{setScholarships(ids);setPreview({rows:[],unmatched:[]});setChosen([]);setStep(2);},[]);
  const selectedRows=preview.rows.filter(row=>chosen.includes(row._id)),amount=selectedRows.reduce((sum,row)=>sum+row.calculatedamount,0);
  const apply=async()=>{
    if(uploading)return;
    let items;
    try{items=itemsGrid.current.getSelections(chosen);}catch(error){notify(error.message,'error');return;}
    const finalAmount=items.reduce((sum,row)=>sum+Number(row.scholarshipamount ?? row.calculatedamount),0);
    if(!window.confirm(`Apply ${items.length} scholarship fee items totaling ${finalAmount.toFixed(2)}?`))return;
    setBusy(true);
    try{const {data}=await ep1.post(`${root}/apply`,{...scope(),details:ledgerDetails.current?.getDetails(),selections:items.map(({studentid,scholarshipid,sourceledgerid,fingerprint,scholarshipamount})=>({studentid,scholarshipid,sourceledgerid,fingerprint,...(scholarshipamount===undefined?{}:{scholarshipamount})}))});notify(`${data.saved} scholarship entries added; ${data.skipped} already applied.`,data.skipped?'warning':'success');await loadPreview();}
    catch(error){notify(error.response?.data?.message || error.message,'error');}finally{setBusy(false);}
  };
  return <MenuPageShell title="Apply scholarship"><Stack spacing={2} sx={{p:{xs:1,md:3}}}><Typography variant="h5">Apply scholarship</Typography><Stepper activeStep={step} alternativeLabel>{['Select students','Select scholarships','Review and apply fee items'].map(title=><Step key={title}><StepLabel>{title}</StepLabel></Step>)}</Stepper>
    {busy&&<LinearProgress/>}<ScholarshipSelectionPane kind="students" fields={fields.students} active={step===0} onContinue={chooseStudents} notify={notify}/><ScholarshipSelectionPane key={studentSelectionVersion} kind="scholarships" fields={fields.scholarships} active={step===1} onContinue={chooseScholarships} notify={notify} initialFilters={defaultScholarshipFilters}/>
    {step===1&&<Button disabled={busy} onClick={()=>setStep(0)}>Back to students</Button>}
    {step===2&&<Stack spacing={2}><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Chip label={`${students.length} students`}/><Chip label={`${scholarships.length} scholarships`}/><Chip label={`${chosen.length} selected fee items`}/><Chip color="primary" label={`Calculated scholarship: ${amount.toFixed(2)}`}/></Stack>
      <ScholarshipItemsGrid ref={itemsGrid} rows={preview.rows} selected={chosen} onSelect={setChosen} busy={busy} onReload={loadPreview}/>
      <ScholarshipLedgerDetails ref={ledgerDetails} disabled={busy} onUploading={setUploading}/>
      {!busy&&!preview.rows.length&&<Alert severity="info">No matching fee items found.</Alert>}
      {!!preview.unmatched.length&&<Paper variant="outlined" sx={{p:2,maxHeight:200,overflow:'auto'}}>{preview.unmatched.map((row,index)=><Typography key={index} variant="body2">{row.student} {row.regno}: {row.reason}</Typography>)}</Paper>}
      {chosen.length>1000&&<Alert severity="warning">Select up to 1,000 fee items per application batch.</Alert>}
      <Stack direction="row" spacing={1}><Button disabled={busy||uploading} onClick={()=>setStep(1)}>Back to scholarships</Button><Button startIcon={<Refresh/>} disabled={busy||uploading} onClick={loadPreview}>Reload matching items</Button><Button variant="contained" startIcon={<Save/>} disabled={busy||uploading||!chosen.length||chosen.length>1000} onClick={apply}>Apply selected fee items ({chosen.length})</Button></Stack>
    </Stack>}
    <Snackbar open={!!notice} autoHideDuration={8000} onClose={()=>setNotice(null)} anchorOrigin={{vertical:'top',horizontal:'center'}} sx={{zIndex:theme=>theme.zIndex.modal+200}}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={()=>setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
