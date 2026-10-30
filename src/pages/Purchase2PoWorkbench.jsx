import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Chip, Grid, LinearProgress, Snackbar, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Add, Print, Refresh, Save, Send } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';
import MenuPageShell from './MenuPageShell';
import Purchase2PoAmountsEditor from './Purchase2PoAmountsEditor';
import { resolvePoDelivery } from '../utils/purchase2Delivery';
const scope = () => ({ colid: global1.colid, name: global1.name, user: global1.user || global1.email });
const auth = () => ({ Authorization: `Bearer ${global1.token}` });
const list = async (model, filters = []) => (await ep1.get(`/api/v2/purchase2/${model}`, { params: { colid: global1.colid, filters: JSON.stringify(filters) } })).data.data || [];
const draft = po => (!po.postatus || String(po.postatus).toLowerCase() === 'draft') && !['submitted','approved'].includes(String(po.approvalStatus || '').toLowerCase()) && !po.submittedtime && !po.approvedtime;
export default function Purchase2PoWorkbench({ admin = false, helpers }) {
  const [rows, setRows] = useState([]), [vendors, setVendors] = useState([]), [stores, setStores] = useState([]), [catalog, setCatalog] = useState([]), [itemSearch, setItemSearch] = useState(''), [item, setItem] = useState(null);
  const [header, setHeader] = useState({ postatus: 'Draft', approvalStatus: 'Draft' }), [items, setItems] = useState([]), [tab, setTab] = useState('Draft');
  const [pending, setPending] = useState([]), [pr, setPr] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  const [mailConfigs, setMailConfigs] = useState([]), [mail, setMail] = useState(null), [recipients, setRecipients] = useState([]), [recipient, setRecipient] = useState(null);
  const editable = draft(header), toast = (text, severity = 'success') => setNotice({ text, severity });
  const load = async () => {
    const [pos, vs, ss, assignments, states, prs] = await Promise.all([list('storepoorderds2'), list('vendorsds2'), list('storemasterds2'), list('storepoassignmentds2'), ep1.get('/api/v2/purchase2/pr-availability', { params: { colid: global1.colid } }).then(result => result.data.data || []), list('storeprrequestds2')]);
    const resolved = pos.map(po => { const source = prs.find(pr => pr.prnumber === po.prnumber); return { ...po, ...resolvePoDelivery({ ...po, storeid: po.storeid || source?.storeid, storename: po.storename || source?.storename }, ss) }; });
    setRows(admin ? resolved : resolved.filter(po => String(po.creatorEmail || po.user).toLowerCase() === String(scope().user).toLowerCase())); setVendors(vs); setStores(ss);
    setPending(assignments.filter(row => String(row.assignedtoemail).toLowerCase() === String(scope().user).toLowerCase() && !['hold','reject','rejected'].includes(String(row.status).toLowerCase())).map(row => ({ ...row, availability: states.find(state => state.prnumber === row.prnumber) })).filter(row => row.availability && row.availability.allowed && !row.availability.complete && row.availability.remaining.length));
  };
  useEffect(() => { load().catch(error => toast(error.message, 'error')); helpers.loadMailConfigurations().then(setMailConfigs).catch(() => {}); helpers.activePurchaseEmails('PO').then(setRecipients).catch(() => {}); }, [admin]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { if (itemSearch.length < 2) { setCatalog([]); return; } list('itemmasterds2', [{ field: 'itemname', value: itemSearch }]).then(rows => { if (!controller.signal.aborted) setCatalog(rows); }).catch(() => {}); }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [itemSearch]);
  const execute = async callback => { setBusy(true); try { return await callback(); } catch (error) { toast(error.response?.data?.message || error.message, 'error'); return null; } finally { setBusy(false); } };
  const open = async po => execute(async () => { setHeader(po); setPr(null); setItems(await list('storepoitemsds2', [{ field: 'poid', value: po.poid }])); });
  const reset = () => { setHeader({ postatus: 'Draft', approvalStatus: 'Draft' }); setItems([]); setPr(null); };
  const selectPr = assignment => { setPr(assignment); setItems(assignment ? assignment.availability.remaining.map(row => ({ ...row, _id: undefined, pritemid: row.pritemid, quantity: row.remainingquantity, price: row.estimatedprice || 0, prallocation: true })) : []); };
  const save = async () => {
    if (!editable) throw new Error('This PO is locked');
    if (!header.vendorid || !header.storeid) throw new Error('Select vendor and receiving store');
    const result = pr && !header._id ? await ep1.post('/api/v2/purchase2/po-from-pr', { ...scope(), assignmentid: pr._id, prnumber: pr.prnumber, header, items }, { headers: auth() }) : await ep1.post('/api/v2/purchase2/po-draft/save', { id: header._id, header, items }, { headers: auth() });
    setHeader(result.data.data.header); setItems(result.data.data.items); setPr(null); await load(); return result.data.data.header;
  };
  const action = kind => execute(async () => {
    const po = kind === 'submit' ? await save() : header;
    const result = await ep1.post('/api/v2/purchase2/po-draft/action', { id: po._id, action: kind }, { headers: auth() });
    setHeader(result.data.data); await load(); toast(`PO ${kind === 'submit' ? 'submitted' : kind === 'approve' ? 'approved' : 'rejected'}`);
    if (kind === 'submit') {
      try { await helpers.sendConfiguredPurchaseEmail(mail, recipient, 'Purchase order submitted', { 'PO Number': po.poid, 'PR Number': po.prnumber, Vendor: po.vendor, Amount: po.actualAmount, Status: 'Submitted' }, items); } catch (error) { toast(`PO submitted. Email failed: ${error.message}`, 'warning'); }
    }
    if (kind === 'approve' && result.data.data.postatus === 'Approved') helpers.sendPurchase2Notification('PO Finally Approved', { poid: po.poid, amount: po.actualAmount, status: 'Approved' });
  });
  const vendor = vendors.find(row => String(row._id) === String(header.vendorid)) || null, store = stores.find(row => String(row._id) === String(header.storeid)) || null;
  const delivery = resolvePoDelivery(header, stores), patch = (field,value) => setHeader(previous => ({ ...previous, [field]: value }));
  return <MenuPageShell title={admin ? 'Purchase order workbench - Admin' : 'Purchase order workbench'}><Stack spacing={2} sx={{ p: 2 }}>
    {busy && <LinearProgress />}<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button startIcon={<Add />} disabled={busy} onClick={reset}>New PO draft</Button><Button startIcon={<Refresh />} disabled={busy} onClick={() => execute(load)}>Refresh</Button><Chip label={header.poid || 'New draft'} /><Chip label={`${header.postatus || 'Draft'} · ${header.approvalStatus || 'Draft'}`} /></Stack>
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable">{['Draft','Submitted','Approved','Rejected','All'].map(value => <Tab value={value} label={value} key={value} />)}</Tabs>
    <Box sx={{ height: 310 }}><DataGrid rows={rows.filter(row => tab === 'All' || row.postatus === tab)} columns={[{ field: 'actions', headerName: 'Open', width: 95, renderCell: params => <Button onClick={() => open(params.row)}>Open</Button> }, ...['poid','prnumber','vendor','storename','postatus','approvalStatus','actualAmount'].map(field => ({ field, headerName: field, minWidth: 150, flex: field === 'vendor' ? 1 : undefined }))]} getRowId={row => row._id} slots={{ toolbar: GridToolbar }} disableRowSelectionOnClick /></Box>
    {!editable && <Alert severity="info">This PO is submitted or approved. Draft details and items are locked.</Alert>}
    <Grid container spacing={2}>
      {!header._id && <Grid item xs={12} md={4}><Autocomplete options={pending} value={pr} onChange={(_, value) => selectPr(value)} getOptionLabel={row => row.prnumber || ''} renderInput={params => <TextField {...params} label="Assigned PR (optional)" size="small" />} /></Grid>}
      <Grid item xs={12} md={4}><Autocomplete disabled={!editable || busy} options={vendors} value={vendor} getOptionLabel={row => row.vendorname || row.name || ''} onChange={(_, value) => patch('vendorid', value?._id || '')} renderInput={params => <TextField {...params} label="Vendor" size="small" />} /></Grid>
      <Grid item xs={12} md={4}><Autocomplete disabled={!editable || busy} options={stores} value={store} getOptionLabel={row => row.storename || row.name || ''} onChange={(_, value) => patch('storeid', value?._id || '')} renderInput={params => <TextField {...params} label="Receiving store" size="small" />} /></Grid>
      <Grid item xs={12}><Typography fontWeight={700}>{delivery.deliverylocation}</Typography><Typography>{delivery.deliveryaddress}</Typography><Typography>{[delivery.deliverycontactperson, delivery.deliveryphone, delivery.deliveryemail].filter(Boolean).join(' · ')}</Typography></Grid>
      {['terms','warranty','deliveryinstructions','deliverydate','remarks'].map(field => <Grid item xs={12} md={field === 'deliverydate' ? 4 : 6} key={field}><TextField fullWidth size="small" label={({ terms: 'Terms and conditions', warranty: 'Warranty', deliveryinstructions: 'Delivery instructions', deliverydate: 'Delivery date', remarks: 'Remarks' }[field])} disabled={!editable || busy} value={header[field] || ''} type={field === 'deliverydate' ? 'date' : 'text'} InputLabelProps={field === 'deliverydate' ? { shrink: true } : undefined} multiline={field !== 'deliverydate'} minRows={field !== 'deliverydate' ? 2 : undefined} onChange={event => patch(field, event.target.value)} /></Grid>)}
    </Grid>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Autocomplete sx={{ width: 330 }} options={catalog} value={item} disabled={!editable || busy} filterOptions={options => options} onInputChange={(_, value, reason) => { if (reason === 'input') setItemSearch(value); }} getOptionLabel={row => `${row.itemname || row.item || ''} (${row.itemcode || ''})`} onChange={(_, value) => setItem(value)} renderInput={params => <TextField {...params} label="Search item master" size="small" />} /><Button disabled={!editable || busy || !item} startIcon={<Add />} onClick={() => { setItems(previous => [...previous, { itemid: String(item._id), itemname: item.itemname || item.item, itemcode: item.itemcode, unit: item.unit, quantity: 1, price: item.price || 0, gst: item.gst || 0, prallocation: false }]); setItem(null); }}>Add item</Button></Stack>
    <Purchase2PoAmountsEditor items={items} setItems={setItems} disabled={!editable || busy} allowRemove />
    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap"><Autocomplete sx={{ width: 260 }} options={mailConfigs} value={mail} onChange={(_, value) => setMail(value)} getOptionLabel={row => row.email || row.username || row.name || ''} renderInput={params => <TextField {...params} label="Email configuration" size="small" />} /><Autocomplete sx={{ width: 260 }} options={recipients} value={recipient} onChange={(_, value) => setRecipient(value)} getOptionLabel={row => `${row.recipient || row.name || ''} ${row.email || ''}`} renderInput={params => <TextField {...params} label="Mail recipient" size="small" />} /></Stack>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button startIcon={<Save />} variant="contained" disabled={!editable || busy || !items.length} onClick={() => execute(async () => { await save(); toast('Draft saved'); })}>Save draft</Button><Button startIcon={<Send />} disabled={!editable || busy || !items.length} onClick={() => action('submit')}>Submit PO</Button><Button disabled={busy || header.postatus !== 'Submitted'} onClick={() => action('approve')}>Approve</Button><Button color="error" disabled={busy || header.postatus !== 'Submitted'} onClick={() => action('reject')}>Reject</Button><Button startIcon={<Print />} disabled={!header._id || busy} onClick={() => execute(() => helpers.printPurchase2(header.poType === 'Local' ? 'localPo' : 'po', { header: { ...header, ...delivery }, items }))}>Print PO</Button></Stack>
    <Snackbar open={Boolean(notice)} autoHideDuration={8000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'}>{notice?.text}</Alert></Snackbar>
  </Stack></MenuPageShell>;
}
