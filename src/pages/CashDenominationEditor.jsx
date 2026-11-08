import React,{useState} from 'react';
import {Button,Grid,IconButton,MenuItem,Paper,Stack,TextField,Typography} from '@mui/material';
import {Add,Delete} from '@mui/icons-material';
export default React.memo(function CashDenominationEditor({onConfirm,onInvalidate,disabled}){
 const [rows,setRows]=useState([{id:1,denomination:500,notes:''}]);
 const valid=rows.length>0&&rows.every(r=>Number.isInteger(Number(r.notes))&&Number(r.notes)>0);
 const total=rows.reduce((sum,r)=>sum+Number(r.denomination)*Number(r.notes||0),0);
 const change=(id,patch)=>{onInvalidate();setRows(prev=>prev.map(r=>r.id===id?{...r,...patch}:r));};
 return <Paper variant="outlined" sx={{p:2,mt:2}}><Stack spacing={2}><Typography variant="h6">Cash denominations</Typography>{rows.map(row=><Grid container spacing={1} key={row.id}><Grid item xs={4}><TextField fullWidth select size="small" label="Denomination" value={row.denomination} onChange={e=>change(row.id,{denomination:e.target.value})}>{[1,2,5,10,20,50,100,200,500,2000].map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid><Grid item xs={3}><TextField fullWidth size="small" label="Number of notes" type="number" inputProps={{min:1,step:1}} value={row.notes} onChange={e=>change(row.id,{notes:e.target.value})}/></Grid><Grid item xs={4}><TextField fullWidth size="small" label="Amount" value={Number(row.denomination)*Number(row.notes||0)} InputProps={{readOnly:true}}/></Grid><Grid item xs={1}><IconButton title="Delete denomination" onClick={()=>setRows(p=>p.filter(r=>r.id!==row.id))}><Delete/></IconButton></Grid></Grid>)}<Button startIcon={<Add/>} onClick={()=>setRows(p=>[...p,{id:Date.now(),denomination:500,notes:''}])}>Add denomination</Button><TextField label="Paid amount (cash total)" value={total} InputProps={{readOnly:true}}/><Button disabled={disabled||!valid||total<=0} variant="outlined" onClick={()=>onConfirm(total,rows)}>Confirm paid amount</Button></Stack></Paper>;
});
