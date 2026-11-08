import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Grid, LinearProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Delete, Download, Refresh, UploadFile, Link as LinkIcon } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';
const root = '/api/v2/admission-user-mapping';
export default function AdmissionUserMappingPage() {
  const [data,setData] = useState({ sources: [], targets: [], mappings: [], protectedFields: [] });
  const [sourceSearch,setSourceSearch] = useState(''), [targetSearch,setTargetSearch] = useState('');
  const [source,setSource] = useState(null), [hover,setHover] = useState(''), [dragging,setDragging] = useState(false);
  const [selected,setSelected] = useState([]), [busy,setBusy] = useState(false), [notice,setNotice] = useState(null);
  const scope = { colid: global1.colid, user: global1.user || global1.email };
  const notify = (text,severity='success') => setNotice({text,severity});
  const load = async () => { const response = await ep1.get(`${root}/options`,{params:scope}); setData(response.data); setSelected([]); };
  const run = async callback => { setBusy(true); try { await callback(); } catch(error) { notify(error.response?.data?.error || error.message,'error'); } finally { setBusy(false); } };
  useEffect(() => { run(load); },[]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (sourceField,target) => {
    if (!sourceField || busy) return;
    const previous = data.mappings.find(row => row.target === target);
    if (previous && previous.source !== sourceField && !window.confirm(`Replace ${previous.source} with ${sourceField} for ${target}?`)) return;
    await run(async () => { await ep1.post(root,{...scope,source:sourceField,target}); await load(); notify(`Linked ${sourceField} to ${target}`); setSource(null); });
  };
  const matches = (rows,query) => rows.filter(row => `${row.label || ''} ${row.field} ${(row.forms || []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const mapped = useMemo(() => new Map(data.mappings.map(row => [row.target,row.source])),[data.mappings]);
  const download = () => { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([{source:'phone',target:'guardianmobile'}]),'Mappings'); XLSX.writeFile(book,'admission_user_mappings.xlsx'); };
  const upload = event => { const file = event.target.files?.[0]; event.target.value=''; if(!file) return; run(async () => {
    const book = XLSX.read(await file.arrayBuffer()); const rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]); let saved=0; const errors=[];
    for (const [index,row] of rows.entries()) { try { await ep1.post(root,{...scope,source:String(row.source || '').trim(),target:String(row.target || '').trim()}); saved++; } catch(error) { errors.push(`Row ${index+2}: ${error.response?.data?.error || error.message}`); } }
    await load(); notify(`${saved} mappings saved${errors.length ? `. ${errors.join('; ')}` : ''}`,errors.length?'warning':'success');
  }); };
  return <MenuPageShell title="Admission to User mapping"><Stack spacing={2} sx={{p:{xs:1,md:3}}}>
    <Typography variant="h5">Admission to User mapping</Typography>
    {busy && <LinearProgress />}
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><Paper variant="outlined" sx={{p:2,borderRadius:2}}><Typography variant="h6">Admission fields · All forms</Typography><TextField fullWidth size="small" label="Search admission fields" value={sourceSearch} onChange={event=>setSourceSearch(event.target.value)} sx={{my:2}} />
        <Stack spacing={1} sx={{height:440,overflowY:'auto'}}>{matches(data.sources,sourceSearch).map(row=><Box key={row.field} component="button" type="button" draggable={!busy} aria-pressed={source===row.field} onClick={()=>setSource(row.field)} onDragStart={event=>{event.dataTransfer.setData('application/admission-field',row.field); event.dataTransfer.effectAllowed='link'; setSource(row.field); setDragging(true);}} onDragEnd={()=>{setDragging(false);setHover('');}} sx={{textAlign:'left',font:'inherit',cursor:'grab',p:1,border:'1px solid',borderColor:source===row.field?'primary.main':'divider',bgcolor:source===row.field?'action.selected':'background.paper',borderRadius:1}}><Typography fontWeight={600}>{row.label}</Typography><Typography variant="caption" color="text.secondary">{row.field}{row.forms.length ? ` · ${row.forms.join(', ')}` : ''}</Typography></Box>)}</Stack>
      </Paper></Grid>
      <Grid item xs={12} md={6}><Paper variant="outlined" sx={{p:2,borderRadius:2}}><Typography variant="h6">User fields</Typography><TextField fullWidth size="small" label="Search User fields" value={targetSearch} onChange={event=>setTargetSearch(event.target.value)} sx={{my:2}} />
        <Stack spacing={1} sx={{height:440,overflowY:'auto'}}>{matches(data.targets,targetSearch).map(row=><Box key={row.field} component="button" type="button" disabled={busy} onClick={()=>save(source,row.field)} onDragOver={event=>{if(dragging){event.preventDefault();event.dataTransfer.dropEffect='link';setHover(row.field);}}} onDragLeave={()=>setHover('')} onDrop={event=>{event.preventDefault();const field=event.dataTransfer.getData('application/admission-field');setHover('');setDragging(false);if(data.sources.some(item=>item.field===field))save(field,row.field);}} sx={{textAlign:'left',font:'inherit',cursor:source?'pointer':'default',p:1,border:'2px solid',borderColor:hover===row.field?'primary.main':'divider',bgcolor:hover===row.field?'action.selected':'background.paper',borderRadius:1,transition:'background-color .12s, border-color .12s'}}><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={600}>{row.field}</Typography>{row.protected && <Chip size="small" label="Protected" color="warning" />}</Stack><Typography variant="caption" color="text.secondary">{mapped.has(row.field)?`← ${mapped.get(row.field)}`:'Not linked'}</Typography></Box>)}</Stack>
      </Paper></Grid>
    </Grid>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button startIcon={<Refresh />} disabled={busy} onClick={()=>run(load)}>Refresh</Button><Button color="error" startIcon={<Delete />} disabled={busy || !selected.length} onClick={()=>{if(window.confirm(`Delete ${selected.length} mappings?`))run(async()=>{await ep1.post(`${root}/delete`,{...scope,ids:selected});await load();notify('Mappings deleted');});}}>Delete selected</Button><Button startIcon={<Download />} onClick={download}>Upload template</Button><Button startIcon={<UploadFile />} component="label" disabled={busy}>Bulk upload<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={upload}/></Button><Chip icon={<LinkIcon />} label={`${data.mappings.length} links`} /></Stack>
    <Box sx={{height:350}}><DataGrid rows={data.mappings} getRowId={row=>row._id} checkboxSelection rowSelectionModel={selected} onRowSelectionModelChange={setSelected} disableRowSelectionOnClick slots={{toolbar:GridToolbar}} columns={[{field:'source',headerName:'Admission field',flex:1,minWidth:220},{field:'target',headerName:'User field',flex:1,minWidth:180},{field:'protected',headerName:'Transfer',width:160,renderCell:params=>data.protectedFields.includes(params.row.target)?'Protected / skipped':'Enabled'}]} /></Box>
    <Snackbar open={!!notice} autoHideDuration={8000} onClose={()=>setNotice(null)} anchorOrigin={{vertical:'top',horizontal:'center'}}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={()=>setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
