import React,{useState} from 'react';
import {Alert,Button,Snackbar} from '@mui/material';
import {Print} from '@mui/icons-material';
import ep1 from '../api/ep1';
import global1 from './global1';
import {openPurchase2PrintWindow} from './Purchase2PrintTemplates';
export default function Purchase2BulkPrPrintButton({rows=[]}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const print=async()=>{const win=window.open('','_blank','width=1100,height=800');if(!win){setError('Allow popups to print PRs');return;}win.document.body.textContent='Preparing requisitions…';setBusy(true);try{const inst=await ep1.get('/api/v1/getinstitutionname',{params:{colid:global1.colid,user:global1.user,token:global1.token}});const requisitions=await Promise.all(rows.map(async header=>({header,items:(await ep1.get('/api/v2/purchase2/storeprrequestitemsds2',{params:{colid:global1.colid,filters:JSON.stringify([{field:'prnumber',value:header.prnumber}])}})).data.data||[]})));openPurchase2PrintWindow('bulkPr',{requisitions,institution:inst.data?.data?.classes?.[0]||{}},win);}catch(e){win.close();setError(e.response?.data?.message||e.message);}finally{setBusy(false);}};
 return <><Button startIcon={<Print/>} disabled={busy||!rows.length} onClick={print}>{busy?'Preparing…':`Bulk PR Print (${rows.length})`}</Button><Snackbar open={!!error} autoHideDuration={6000} onClose={()=>setError('')}><Alert severity="error">{error}</Alert></Snackbar></>;
}
