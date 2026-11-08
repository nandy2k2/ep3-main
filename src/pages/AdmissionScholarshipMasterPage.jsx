import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, LinearProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Delete, Download, Edit, Upload } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import MenuPageShell from './MenuPageShell';
import AdmissionScholarshipEditor, { scholarshipBlank, scholarshipLabels } from './AdmissionScholarshipEditor';
import ep1 from '../api/ep1';
import global1 from './global1';
const root = '/api/v2/admission-scholarships';
const fields = ['scholarship','description','academicyear','program','programcode','semester','feecategory','feeitem','value','type','scholarshiptype','category','merit','meritpercentage','gender','active'];
const scope = () => ({ colid: global1.colid, user: global1.user || global1.email });
const rowId = row => row._id;
const slots = { toolbar: GridToolbar };
const ScholarshipGrid = memo(DataGrid);
const ScholarshipSearch = memo(function ScholarshipSearch({ onLoad, busy }) {
  const [search,setSearch] = useState('');
  return <Stack component="form" direction="row" gap={1} onSubmit={event => { event.preventDefault(); onLoad(search); }}><TextField size="small" label="Search scholarships" value={search} onChange={event => setSearch(event.target.value)} /><Button type="submit" disabled={busy}>Load</Button></Stack>;
});
export default function AdmissionScholarshipMasterPage() {
  const editor = useRef(null), lastSearch = useRef('');
  const [rows,setRows] = useState([]), [selected,setSelected] = useState([]), [busy,setBusy] = useState(false), [notice,setNotice] = useState(null);
  const notify = useCallback((message,severity='success') => setNotice({message,severity}),[]);
  const load = useCallback(async () => { const res = await ep1.get(root,{params:{...scope(),search:lastSearch.current}}); setRows(res.data.data || []); setSelected([]); },[]);
  const run = useCallback(async action => { setBusy(true); try { await action(); return true; } catch(error) { notify(error.response?.data?.message || error.message,'error'); return false; } finally { setBusy(false); } },[notify]);
  const save = useCallback(payload => run(async () => { await ep1.post(`${root}/save`,{...scope(),...payload}); await load(); notify('Scholarship saved'); }),[run,load,notify]);
  const search = useCallback(value => { lastSearch.current=value; run(load); },[run,load]);
  const columns = useMemo(() => [{field:'edit',headerName:'',width:75,renderCell:({row})=><Button aria-label={`Edit ${row.scholarship}`} disabled={busy} onClick={()=>editor.current?.edit(row)}><Edit /></Button>},...fields.map(field=>({field,headerName:scholarshipLabels[field],minWidth:field==='description'?260:155,...(field==='scholarshiptype'?{valueGetter:params=>params.row.scholarshiptype || 'Total'}:{})}))],[busy]);
  const template = () => { const book=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([{...scholarshipBlank,scholarship:'Merit award',programcode:'P1',value:10,type:'Percentage',merit:'Yes',meritpercentage:80}]),'Scholarships'); XLSX.writeFile(book,'admission_scholarship_template.xlsx'); };
  const upload = event => { const file=event.target.files?.[0];event.target.value='';if(!file)return;run(async()=>{const book=XLSX.read(await file.arrayBuffer());const data=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:'',raw:false});await ep1.post(`${root}/save`,{...scope(),rows:data});await load();notify('Scholarships uploaded');}); };
  return <MenuPageShell title="Scholarship master"><Stack spacing={2} sx={{p:3}}><Typography variant="h5">Scholarship master</Typography>
    <AdmissionScholarshipEditor ref={editor} busy={busy} onSave={save} notify={notify} />
    <Stack direction="row" gap={1} flexWrap="wrap"><ScholarshipSearch onLoad={search} busy={busy} /><Button startIcon={<Download />} onClick={template}>Template</Button><Button component="label" startIcon={<Upload />} disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload}/></Button><Button startIcon={<Delete />} color="error" disabled={busy || !selected.length} onClick={()=>{if(window.confirm(`Delete ${selected.length} scholarships?`))run(async()=>{await ep1.post(`${root}/delete`,{...scope(),ids:selected});editor.current?.reset();await load();notify('Scholarships deleted');});}}>Delete selected</Button></Stack>
    {busy && <LinearProgress />}<Box sx={{height:520}}><ScholarshipGrid rows={rows} getRowId={rowId} columns={columns} loading={busy} checkboxSelection disableRowSelectionOnClick rowSelectionModel={selected} onRowSelectionModelChange={setSelected} slots={slots}/></Box>
    <Snackbar open={!!notice} autoHideDuration={7000} anchorOrigin={{vertical:'top',horizontal:'center'}} onClose={()=>setNotice(null)}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={()=>setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
