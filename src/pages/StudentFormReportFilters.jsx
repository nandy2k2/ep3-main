import React,{useEffect,useState,useImperativeHandle,forwardRef} from 'react';
import {Alert,Autocomplete,Button,Grid,IconButton,MenuItem,Stack,TextField} from '@mui/material';
import {Add,Delete} from '@mui/icons-material';
import ep1 from '../api/ep1';
import global1 from './global1';
const endpoint='/api/v2/conductexam/student-form-dynamic-options';
const FieldValue=({row,scope,onChange})=>{
 const [options,setOptions]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setOptions([]);if(!row.field)return;const c=new AbortController();setBusy(true);setError('');ep1.get(endpoint,{params:{colid:global1.colid,...scope,field:row.field},signal:c.signal}).then(r=>setOptions(r.data.values||[])).catch(e=>{if(!c.signal.aborted)setError(e.response?.data?.message||e.message);}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[row.field,scope.academicyear,scope.examcode,scope.programcode]);
 return <Autocomplete freeSolo options={options} loading={busy} value={row.value} inputValue={row.value} onInputChange={(_,v)=>onChange(v)} onChange={(_,v)=>onChange(v||'')} renderInput={p=><TextField {...p} size="small" label="Value" error={!!error} helperText={error}/>}/>;
};
export default React.memo(forwardRef(function StudentFormReportFilters({scope},ref){
 const [fields,setFields]=useState([]),[rows,setRows]=useState([]),[error,setError]=useState('');
 useImperativeHandle(ref,()=>({getFilters:()=>rows.filter(r=>r.field&&r.value.trim())}),[rows]);
 useEffect(()=>{ep1.get(endpoint,{params:{colid:global1.colid}}).then(r=>setFields(r.data.fields||[])).catch(e=>setError(e.message));},[]);
 const patch=(index,values)=>setRows(prev=>prev.map((r,i)=>i===index?{...r,...values}:r));
 return <Stack spacing={2} sx={{mt:2}}>{error&&<Alert severity="error">{error}</Alert>}{rows.map((row,index)=><Grid container spacing={1} key={index}><Grid item xs={12} md={4}><Autocomplete options={fields} value={row.field||null} onChange={(_,field)=>patch(index,{field:field||'',value:''})} renderInput={p=><TextField {...p} size="small" label="Filter field"/>}/></Grid><Grid item xs={12} md={2}><TextField fullWidth select size="small" label="Match" value={row.operator} onChange={e=>patch(index,{operator:e.target.value})}><MenuItem value="equals">Equals</MenuItem><MenuItem value="contains">Contains</MenuItem></TextField></Grid><Grid item xs={10} md={5}><FieldValue row={row} scope={scope} onChange={value=>patch(index,{value})}/></Grid><Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={()=>setRows(prev=>prev.filter((_,i)=>i!==index))}><Delete/></IconButton></Grid></Grid>)}<Button sx={{alignSelf:'flex-start'}} startIcon={<Add/>} onClick={()=>setRows(prev=>[...prev,{field:'',operator:'equals',value:''}])}>Add filter</Button></Stack>;
}));
