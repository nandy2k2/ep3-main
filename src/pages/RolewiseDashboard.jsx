import React,{useEffect,useState} from 'react';
import {Alert,Autocomplete,Box,Button,LinearProgress,Snackbar,Stack,TextField} from '@mui/material';
import {DataGrid,GridToolbar} from '@mui/x-data-grid';
import {Delete,Edit,Save} from '@mui/icons-material';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import global1 from './global1';
const root='/api/v2/rolewise-dashboard';
export default function RolewiseDashboard(){
 const [options,setOptions]=useState({roles:[],pages:[],data:[]}),[role,setRole]=useState(null),[page,setPage]=useState(''),[ids,setIds]=useState([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null);
 const scope=()=>({token:global1.token,colid:global1.colid});
 const load=async()=>{const r=await ep1.get(root,{params:scope()});setOptions(r.data);setIds([]);};
 const run=async fn=>{setBusy(true);try{await fn();}catch(e){setNotice({severity:'error',text:e.response?.data?.message||e.message});}finally{setBusy(false);}};
 useEffect(()=>{run(load);},[]); // eslint-disable-line react-hooks/exhaustive-deps
 return <MenuPageShell title="Rolewise dashboard"><Stack spacing={2} sx={{p:2}}>{busy&&<LinearProgress/>}<Autocomplete options={options.roles} value={role} onChange={(_,v)=>setRole(v)} renderInput={p=><TextField {...p} label="Role"/>}/><Autocomplete freeSolo options={Array.from(new Set(options.pages.map(p=>p.path)))} value={page} inputValue={page} onInputChange={(_,v)=>setPage(v)} onChange={(_,v)=>setPage(v||'')} renderOption={(props,path)=><li {...props}>{options.pages.find(p=>p.path===path)?.title} · {path}</li>} renderInput={p=><TextField {...p} label="Dashboard page link" placeholder="/crm2-admin-dashboard"/>}/><Stack direction="row" spacing={1}><Button startIcon={<Save/>} variant="contained" disabled={busy||!role||!page} onClick={()=>run(async()=>{await ep1.post(`${root}/save`,{...scope(),role,pagelink:page});await load();setNotice({severity:'success',text:'Role dashboard saved'});})}>Save</Button><Button onClick={()=>{setRole(null);setPage('');}}>New</Button><Button startIcon={<Delete/>} disabled={busy||!ids.length} onClick={()=>{if(window.confirm('Remove selected dashboard mappings and restore default login routing?'))run(async()=>{await ep1.post(`${root}/delete`,{...scope(),ids});await load();});}}>Delete selected</Button></Stack><Box sx={{height:450}}><DataGrid rows={options.data} getRowId={r=>r._id} checkboxSelection rowSelectionModel={ids} onRowSelectionModelChange={setIds} slots={{toolbar:GridToolbar}} columns={[{field:'actions',headerName:'Edit',width:90,renderCell:({row})=><Button onClick={()=>{setRole(options.roles.find(r=>r.toLowerCase()===row.role)||row.role);setPage(row.pagelink);}}><Edit/></Button>},{field:'role',headerName:'Role',minWidth:180,flex:1},{field:'pagelink',headerName:'Dashboard page',minWidth:300,flex:2}]}/></Box><Snackbar open={!!notice} autoHideDuration={5000} anchorOrigin={{vertical:'bottom',horizontal:'center'}} onClose={()=>setNotice(null)}><Alert severity={notice?.severity||'success'} onClose={()=>setNotice(null)}>{notice?.text}</Alert></Snackbar></Stack></MenuPageShell>;
}
