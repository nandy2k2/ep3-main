import React,{memo,useCallback,useEffect,useRef,useState} from 'react';
import {Add,Close,Delete,Refresh,Save} from '@mui/icons-material';
import {Alert,Autocomplete,Box,Button,Checkbox,Chip,Dialog,DialogContent,DialogTitle,Grid,IconButton,LinearProgress,Snackbar,Stack,TextField,Typography} from '@mui/material';
import {DataGrid,GridToolbar} from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';
import ScholarshipLedgerDetails from './ScholarshipLedgerDetails';
import {ScholarshipSelectionPane} from './ApplyAdmissionScholarshipPage';

const root='/api/v2/admission-scholarship-adhoc';
const scope=()=>({colid:global1.colid,user:global1.user || global1.email,token:global1.token});
const labels={academicyear:'Academic year',program:'Program',programcode:'Program code',regulation:'Regulation',semester:'Semester',feegroup:'Fee group',feecategory:'Fee category',feeeitem:'Fee item',gender:'Gender',studtype:'Student type',domicile:'Domicile',feetype:'Fee type',status:'Status'};
const specialAdd={value:'__add',label:'+ Add record'},specialAll={value:'__all',label:'Select all loaded options'};
export const calculateAdhocBalance=(row,concession)=>Math.max(0,Number(row.amount||0)-Number(row.paid||0)-Number(concession||0));
export const buildAdhocFeeFilters=student=>[['academicyear',student.academicyear || student.admissionyear],['program',student.program],['programcode',student.programcode],['semester',student.semester]].map(([field,value],index)=>({id:index+1,field,values:value?[String(value)]:[],selections:value?[{value:String(value),label:field==='program'?`${value} (${student.programcode || ''})`:String(value),programcode:student.programcode}]:[]}));

function MasterDialog({path,onClose}){
  const [loading,setLoading]=useState(true);
  useEffect(()=>setLoading(true),[path]);
  return <Dialog open={!!path} fullWidth maxWidth="xl" onClose={onClose}><DialogTitle>Add master record<IconButton aria-label="Close master" sx={{float:'right'}} onClick={onClose}><Close/></IconButton></DialogTitle><DialogContent>{loading&&<LinearProgress/>}{path&&<Box component="iframe" title="Add master record" src={`${path}?embedded=1`} onLoad={()=>setLoading(false)} sx={{height:'75vh',width:'100%',border:0}}/>}</DialogContent></Dialog>;
}

const FeeFilters=memo(function FeeFilters({fields,filters,setFilters,notify}){
  const [options,setOptions]=useState({}),[loading,setLoading]=useState(''),[master,setMaster]=useState('');
  const next=useRef(20),timers=useRef(new Map()),requests=useRef(new Map());
  useEffect(()=>()=>{for(const timer of timers.current.values())clearTimeout(timer);for(const controller of requests.current.values())controller.abort();},[]);
  const load=async(filter,search='')=>{
    requests.current.get(filter.id)?.abort();const controller=new AbortController();requests.current.set(filter.id,controller);setLoading(filter.id);
    try{const {data}=await ep1.post(`${root}/fees/options`,{...scope(),field:filter.field,search,filters:filters.map(({field,values})=>({field,values}))},{signal:controller.signal});if(!controller.signal.aborted)setOptions(previous=>({...previous,[filter.id]:data.data || []}));}
    catch(error){if(!controller.signal.aborted)notify(error.response?.data?.message || error.message,'error');}
    finally{if(requests.current.get(filter.id)===controller){requests.current.delete(filter.id);setLoading('');}}
  };
  const choose=(filter,chosen)=>{
    if(chosen.some(row=>row.value==='__add')){setMaster(['program','programcode'].includes(filter.field)?'/programmanagement':'/mfeesconfig');return;}
    const available=options[filter.id] || [];
    const selected=chosen.some(row=>row.value==='__all')?(available.every(row=>filter.values.includes(row.value))?[]:available):chosen;
    setFilters(previous=>{
      let rows=previous.map(row=>row.id===filter.id?{...row,values:[...new Set(selected.map(item=>item.value))],selections:selected}:row);
      if(filter.field==='academicyear')rows=rows.map(row=>['program','programcode','semester'].includes(row.field)?{...row,values:[],selections:[]}:row);
      if(filter.field==='program'){
        const codes=[...new Set(selected.map(row=>row.programcode).filter(Boolean))];
        rows=rows.map(row=>row.field==='programcode'?{...row,values:codes,selections:codes.map(value=>({value,label:value}))}:row);
      }
      return rows;
    });
  };
  return <Stack spacing={1}>{filters.map(filter=><Grid container spacing={1} alignItems="center" key={filter.id}>
    <Grid item xs={12} md={3}><Autocomplete size="small" options={fields} value={filter.field} getOptionLabel={field=>labels[field] || field} onChange={(_,field)=>setFilters(previous=>previous.map(row=>row.id===filter.id?{...row,field:field || '',values:[],selections:[]}:row))} renderInput={params=><TextField {...params} label="Filter field"/>}/></Grid>
    <Grid item xs={10} md={8}><Autocomplete multiple disableCloseOnSelect filterOptions={rows=>rows} options={[specialAdd,specialAll,...(options[filter.id] || [])]} value={filter.values.map(value=>(options[filter.id] || []).find(row=>row.value===value)||(filter.selections || []).find(row=>row.value===value)||{value,label:value})} getOptionLabel={row=>row.label || ''} isOptionEqualToValue={(a,b)=>a.value===b.value} loading={loading===filter.id} disabled={!filter.field} onOpen={()=>load(filter)} onInputChange={(_,value,reason)=>{if(reason==='input'||reason==='clear'){clearTimeout(timers.current.get(filter.id));timers.current.set(filter.id,setTimeout(()=>load(filter,value),250));}}} onChange={(_,chosen)=>choose(filter,chosen)} renderOption={(props,row,{selected})=><li {...props} key={`${row.value}-${row.programcode || ''}`}><Checkbox size="small" checked={selected}/>{row.label}</li>} renderInput={params=><TextField {...params} size="small" label={`${labels[filter.field] || 'Filter'} values`}/>}/></Grid>
    <Grid item xs={2} md={1}><IconButton aria-label="Remove filter" onClick={()=>setFilters(previous=>previous.filter(row=>row.id!==filter.id))}><Delete/></IconButton></Grid>
  </Grid>)}<Button startIcon={<Add/>} sx={{alignSelf:'flex-start'}} onClick={()=>setFilters(previous=>[...previous,{id:next.current++,field:'feegroup',values:[],selections:[]}])}>Add filter</Button><MasterDialog path={master} onClose={()=>{setMaster('');setOptions({});}}/></Stack>;
});

export default function AdhocScholarshipPage(){
  const detailsRef=useRef(null);
  const [step,setStep]=useState(0),[studentFields,setStudentFields]=useState([]),[feeFields,setFeeFields]=useState([]),[student,setStudent]=useState(null),[filters,setFilters]=useState([]),[rows,setRows]=useState([]),[selected,setSelected]=useState([]),[concessions,setConcessions]=useState({}),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[notice,setNotice]=useState(null);
  const notify=useCallback((message,severity='success')=>setNotice({message,severity}),[]);
  useEffect(()=>{let active=true;Promise.all([ep1.get('/api/v2/admission-scholarship-apply/metadata',{params:scope()}),ep1.get(`${root}/metadata`,{params:scope()})]).then(([students,fees])=>{if(active){setStudentFields(students.data.fields?.students || []);setFeeFields(fees.data.fields || []);}}).catch(error=>active&&notify(error.response?.data?.message || error.message,'error'));return()=>{active=false;};},[notify]);
  const selectStudent=(ids,loaded)=>{
    if(ids.length!==1){notify('Select exactly one student for an ad-hoc scholarship.','warning');return;}
    const chosen=loaded.find(row=>row._id===ids[0]);
    if(!chosen)return;
    const defaults=buildAdhocFeeFilters(chosen);
    setStudent(chosen);setFilters(defaults);setRows([]);setSelected([]);setConcessions({});setStep(1);
  };
  const loadFees=async()=>{
    setBusy(true);setSelected([]);
    try{const {data}=await ep1.post(`${root}/fees/search`,{...scope(),studentid:student._id,filters:filters.map(({field,values})=>({field,values}))});setRows(data.data || []);setConcessions(Object.fromEntries((data.data || []).map(row=>[row._id,Number(row.concession)||0])));if(!(data.data || []).length)notify('No matching fee configuration was found.','info');}
    catch(error){notify(error.response?.data?.message || error.message,'error');setRows([]);}finally{setBusy(false);}
  };
  const apply=async()=>{
    if(uploading||!selected.length)return;
    const selections=rows.filter(row=>selected.includes(row._id)).map(row=>({ledgerid:row.ledgerid,feeconfigurationid:row.feeconfigurationid,concession:Number(concessions[row._id])}));
    if(!window.confirm(`Update concession and balance for ${selections.length} selected fee item(s)?`))return;
    setBusy(true);
    try{const {data}=await ep1.post(`${root}/apply`,{...scope(),studentid:student._id,selections,details:detailsRef.current?.getDetails() || {}});notify(`${data.updated} fee item(s) updated${data.created?`; ${data.created} new ledger row(s) created`:''}. Total concession: ${Number(data.totalconcession || 0).toFixed(2)}.`);await loadFees();}
    catch(error){notify(error.response?.data?.message || error.message,'error');}finally{setBusy(false);}
  };
  const columns=[
    {field:'academicyear',headerName:'Academic year',minWidth:130},{field:'program',headerName:'Program',minWidth:170},{field:'programcode',headerName:'Program code',minWidth:130},{field:'semester',headerName:'Semester',minWidth:100},{field:'feegroup',headerName:'Fee group',minWidth:140},{field:'feecategory',headerName:'Fee category',minWidth:140},{field:'feeitem',headerName:'Fee item',minWidth:190},{field:'amount',headerName:'Amount',type:'number',minWidth:120},{field:'paid',headerName:'Paid',type:'number',minWidth:110},{field:'concession',headerName:'Concession',minWidth:150,renderCell:params=><TextField size="small" type="number" defaultValue={concessions[params.row._id] ?? params.value ?? 0} disabled={!params.row.editable||busy} inputProps={{min:0,max:Math.max(0,Number(params.row.amount||0)-Number(params.row.paid||0)),step:'0.01'}} onBlur={event=>setConcessions(previous=>({...previous,[params.row._id]:event.target.value}))}/>},{field:'balance',headerName:'Current balance',type:'number',minWidth:140},{field:'newbalance',headerName:'New balance',minWidth:130,valueGetter:params=>calculateAdhocBalance(params.row,(concessions[params.row._id] ?? params.row.concession) || 0).toFixed(2)},{field:'duedate',headerName:'Due date',minWidth:130,valueFormatter:params=>params.value?new Date(params.value).toLocaleDateString('en-GB'):''},{field:'statusdetail',headerName:'Ledger status',minWidth:280}
  ];
  const total=rows.filter(row=>selected.includes(row._id)).reduce((sum,row)=>sum+Number((concessions[row._id] ?? row.concession) || 0),0);
  return <MenuPageShell title="Ad-hoc scholarship"><Stack spacing={2} sx={{p:{xs:1,md:3}}}><Typography variant="h5">Ad-hoc scholarship</Typography><Alert severity="info">Select one student and load matching Fee Configuration rows. If a selected fee item is not yet in the Student Ledger, its ledger entry will be created automatically before the concession and balance are applied.</Alert>
    {busy&&<LinearProgress/>}{step===0&&<><Typography variant="h6">Step 1 · Select student</Typography><ScholarshipSelectionPane kind="students" fields={studentFields} active onContinue={selectStudent} notify={notify}/></>}
    {step===1&&<Stack spacing={2}><Stack direction={{xs:'column',md:'row'}} spacing={1} alignItems={{md:'center'}}><Typography variant="h6">Step 2 · Fee structure</Typography><Chip color="primary" label={`${student?.name || ''} · ${student?.regno || ''}`}/><Button onClick={()=>setStep(0)}>Change student</Button></Stack><FeeFilters fields={feeFields} filters={filters} setFilters={setFilters} notify={notify}/><Button variant="outlined" startIcon={<Refresh/>} sx={{alignSelf:'flex-start'}} disabled={busy} onClick={loadFees}>Load fee structure</Button>
      <Box sx={{height:480}}><DataGrid rows={rows} getRowId={row=>row._id} columns={columns} checkboxSelection disableRowSelectionOnClick isRowSelectable={params=>params.row.editable} rowSelectionModel={selected} onRowSelectionModelChange={setSelected} loading={busy} slots={{toolbar:GridToolbar}}/></Box><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Chip label={`${rows.length} fee rows`}/><Chip label={`${selected.length} selected`}/><Chip color="primary" label={`Selected concession: ${total.toFixed(2)}`}/></Stack><Typography variant="h6">Supporting details</Typography><ScholarshipLedgerDetails ref={detailsRef} disabled={busy} onUploading={setUploading}/><Button variant="contained" startIcon={<Save/>} sx={{alignSelf:'flex-start'}} disabled={busy||uploading||!selected.length} onClick={apply}>Submit selected concessions</Button></Stack>}
    <Snackbar open={!!notice} autoHideDuration={8000} onClose={()=>setNotice(null)} anchorOrigin={{vertical:'top',horizontal:'center'}}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={()=>setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
