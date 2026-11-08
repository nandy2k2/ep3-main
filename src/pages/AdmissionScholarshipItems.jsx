import React,{forwardRef,memo,useCallback,useEffect,useImperativeHandle,useMemo,useRef,useState} from 'react';
import {Autocomplete,Box,Button,Checkbox,Dialog,DialogContent,DialogTitle,IconButton,LinearProgress,Stack,TextField,Typography} from '@mui/material';
import {Add,Delete,Refresh} from '@mui/icons-material';
import {DataGrid,GridToolbar} from '@mui/x-data-grid';
const rowId=row=>row._id,slots={toolbar:GridToolbar};
const labels={student:'Student',regno:'Regno',academicyear:'Academic year',program:'Program',programcode:'Program code',semester:'Semester',sourcefeeitem:'Matching fee item',sourcefeecategory:'Original fee category',scholarship:'Scholarship',scholarshiptype:'Scholarship type',total:'Original fee amount',paid:'Amount paid',balance:'Outstanding balance',base:'Calculation base',type:'Value type',value:'Value',calculatedamount:'Calculated scholarship',reason:'Status / details'};
export const scholarshipItemColumns=[{field:'sourcekind',headerName:'Fee source',minWidth:180},...Object.entries(labels).map(([field,headerName])=>({field,headerName,minWidth:['scholarship','sourcefeeitem','reason'].includes(field)?220:150,...(['total','paid','balance','base','value','calculatedamount'].includes(field)?{type:'number',valueFormatter:params=>Number(params.value || 0).toLocaleString('en-IN',{maximumFractionDigits:2})}:{})}))];
const Results=memo(DataGrid);
const filterFields=['academicyear','program','programcode','semester','sourcefeecategory','sourcefeeitem','student','regno','scholarship'];
const ItemFilters=memo(function ItemFilters({rows,busy,onLoad}){
  const [draft,setDraft]=useState([]),[master,setMaster]=useState(false),[frameLoading,setFrameLoading]=useState(false);
  return <Stack spacing={1}>{draft.map((filter,index)=>{
    const options=[...new Set(rows.map(row=>String(row[filter.field] ?? '')).filter(Boolean))].sort();
    return <Stack direction={{xs:'column',md:'row'}} spacing={1} key={index}>
      <Autocomplete sx={{width:{xs:'100%',md:220}}} options={filterFields} value={filter.field} getOptionLabel={field=>labels[field]} disabled={busy} onChange={(_,field)=>setDraft(old=>old.map((row,i)=>i===index?{field:field || 'semester',values:[]}:row))} renderInput={params=><TextField {...params} label="Fee item filter" size="small"/>}/>
      <Autocomplete sx={{flex:1}} multiple disableCloseOnSelect options={['+ Add ledger entry','+ Select all',...options]} value={filter.values} disabled={busy} onChange={(_,values)=>{if(values.includes('+ Add ledger entry')){setFrameLoading(true);setMaster(true);return;}setDraft(old=>old.map((row,i)=>i===index?{...row,values:values.includes('+ Select all')?options:values}:row));}} renderOption={(props,value,{selected})=><li {...props}><Checkbox size="small" checked={selected}/>{value}</li>} renderInput={params=><TextField {...params} label={`${labels[filter.field]} filter values`} size="small"/>}/>
      <IconButton aria-label="Remove fee item filter" disabled={busy} onClick={()=>setDraft(old=>old.filter((_,i)=>i!==index))}><Delete/></IconButton>
    </Stack>;
  })}<Stack direction="row" spacing={1}><Button startIcon={<Add/>} disabled={busy} onClick={()=>setDraft(old=>[...old,{field:'semester',values:[]}])}>Add fee item filter</Button><Button startIcon={<Refresh/>} disabled={busy} onClick={()=>onLoad(draft)}>Load matching fee items</Button></Stack>
    <Dialog open={master} maxWidth="xl" fullWidth onClose={()=>setMaster(false)}><DialogTitle>Student ledger<Button onClick={()=>setMaster(false)}>Close</Button></DialogTitle><DialogContent>{frameLoading&&<LinearProgress/>}{master&&<Box component="iframe" title="Add student ledger entry" src="/ledgerstudpageds?embedded=1" onLoad={()=>setFrameLoading(false)} sx={{height:'75vh',width:'100%',border:0}}/>}</DialogContent></Dialog>
  </Stack>;
});
const SelectedAmount=memo(forwardRef(function SelectedAmount(_,ref){
  const [total,setTotal]=useState(0);useImperativeHandle(ref,()=>({setTotal}),[]);
  return <Typography fontWeight={600}>Amount to apply: {Number.isFinite(total)?total.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}):'Enter valid amounts'}</Typography>;
}));
const AmountInput=memo(function AmountInput({row,onEdit,disabled,initialValue}){
  const [value,setValue]=useState(String(initialValue ?? row.calculatedamount));
  const max=Math.min(row.base ?? row.total ?? Infinity,row.remaining ?? row.total ?? Infinity);
  const invalid=!value.trim()||!Number.isFinite(Number(value))||Number(value)<=0||Number(value)>max;
  return <TextField size="small" type="number" value={value} disabled={disabled||!row.selectable} error={invalid} inputProps={{'aria-label':`Scholarship amount ${row._id}`,min:0.01,max,step:0.01}} onChange={event=>{setValue(event.target.value);onEdit(row._id,event.target.value);}} onKeyDown={event=>event.stopPropagation()}/>;
});
export const ScholarshipItemsGrid=memo(forwardRef(function ScholarshipItemsGrid({rows,selected,onSelect,busy=false,onReload},ref){
  const [filters,setFilters]=useState([]),[revision,setRevision]=useState(0),edits=useRef(new Map()),summary=useRef(null),currentSelection=useRef({rows,selected});
  useEffect(()=>{edits.current.clear();setRevision(value=>value+1);},[rows]);
  const visible=useMemo(()=>rows.filter(row=>filters.every(filter=>!filter.values.length||filter.values.includes(String(row[filter.field] ?? '')))),[rows,filters]);
  currentSelection.current={rows:visible,selected};
  const updateTotal=useCallback(()=>{const current=currentSelection.current;summary.current?.setTotal(current.rows.filter(row=>current.selected.includes(row._id)).reduce((sum,row)=>sum+Number(edits.current.has(row._id)?edits.current.get(row._id):row.calculatedamount),0));},[]);
  useEffect(updateTotal,[selected,visible,revision,updateTotal]);
  const edit=useCallback((id,value)=>{edits.current.set(id,value);updateTotal();},[updateTotal]);
  const getSelections=useCallback(ids=>ids.map(id=>{
    const row=visible.find(item=>item._id===id);if(!row)throw Error('Reload and select visible matching fee items');
    const changed=edits.current.has(id),raw=changed?edits.current.get(id):row.calculatedamount,amount=Number(raw),max=Math.min(row.base ?? row.total ?? Infinity,row.remaining ?? row.total ?? Infinity);
    if(String(raw).trim()===''||!Number.isFinite(amount)||amount<=0||amount>max)throw Error('Enter a valid scholarship amount within the eligible fee base and remaining amount');
    return {...row,...(changed?{scholarshipamount:Math.round((amount+Number.EPSILON)*100)/100}:{})};
  }),[visible]);
  useImperativeHandle(ref,()=>({getSelections}),[getSelections]);
  const columns=useMemo(()=>[...scholarshipItemColumns,{field:'scholarshipamount',headerName:'Scholarship amount to apply',width:230,sortable:false,renderCell:params=><AmountInput key={`${revision}:${params.row._id}`} row={params.row} initialValue={edits.current.get(params.row._id)} onEdit={edit} disabled={busy}/>}],[edit,busy,revision]);
  const selectable=useCallback(params=>!busy&&params.row.selectable,[busy]);
  const load=useCallback(async chosen=>{setFilters(chosen);onSelect([]);edits.current.clear();setRevision(value=>value+1);await onReload?.();},[onReload,onSelect]);
  return <Stack spacing={1}><ItemFilters rows={rows} busy={busy} onLoad={load}/><Box sx={{height:470}}><Results rows={visible} getRowId={rowId} columns={columns} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={onSelect} isRowSelectable={selectable} loading={busy} slots={slots}/></Box><SelectedAmount ref={summary}/></Stack>;
}));
