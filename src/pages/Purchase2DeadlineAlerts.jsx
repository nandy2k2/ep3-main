import React,{useEffect,useState} from 'react';
import {Alert,Box,Button,Paper,Stack,Typography} from '@mui/material';
import {DataGrid,GridToolbar} from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
export default function Purchase2DeadlineAlerts(){
 const [rows,setRows]=useState([]),[error,setError]=useState('');
 const load=async()=>{try{const r=await ep1.get('/api/v2/purchase2/operations/deadlines',{headers:{Authorization:`Bearer ${global1.token}`}});setRows(r.data.data||[]);setError('');}catch(e){setError(e.response?.data?.message||e.message);}};
 useEffect(()=>{load();const timer=setInterval(load,60000);return()=>clearInterval(timer);},[]);
 return <Paper sx={{p:2,mb:2,border:'1px solid',borderColor:rows.some(r=>r.urgency==='Overdue')?'error.light':'warning.light',borderRadius:2}}><Stack direction="row" justifyContent="space-between"><Typography variant="h6">PR assignment deadlines</Typography><Button onClick={load}>Refresh</Button></Stack>{error?<Alert severity="error">{error}</Alert>:<Alert severity={rows.some(r=>r.urgency==='Overdue')?'error':rows.length?'warning':'success'}>{rows.length?`${rows.length} PR assignments are overdue or due within the next 2 days. Expedite procurement.`:'No PR assignment deadlines due within the next 2 days.'}</Alert>}{rows.length>0&&<Box sx={{height:320,mt:2}}><DataGrid rows={rows} getRowId={r=>r._id} slots={{toolbar:GridToolbar}} columns={['prnumber','departmentname','priority','assignedto','assignedtoemail','deadline','urgency'].map(field=>({field,headerName:field==='deadline'?'Deadline date':field,minWidth:150,flex:1,valueGetter:p=>field==='deadline'?new Date(p.row.deadline).toLocaleDateString():p.row[field]}))}/></Box>}</Paper>;
}
