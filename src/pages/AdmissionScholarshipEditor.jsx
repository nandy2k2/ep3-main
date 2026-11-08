import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogContent, DialogTitle, LinearProgress, Stack, TextField } from '@mui/material';
import { Add, Save } from '@mui/icons-material';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
export const scholarshipBlank = { scholarship: '', description: '', academicyear: '', semester: '', feecategory: '', feeitem: '', feeconfigurationid: '', value: '', type: 'Amount', scholarshiptype: 'Total', category: 'All', merit: 'No', meritpercentage: 0, gender: 'All', active: 'Yes' };
const enums = { type: ['Amount', 'Percentage'], scholarshiptype: ['Total', 'Balance', 'Paid'], category: ['General', 'SC', 'ST', 'OBC', 'All'], merit: ['Yes', 'No'], gender: ['Male', 'Female', 'All'], active: ['Yes', 'No'] };
export const scholarshipLabels = { scholarship: 'Scholarship', description: 'Description', academicyear: 'Academic year', program: 'Program', programcode: 'Program code', semester: 'Semester', feecategory: 'Fee category', feeitem: 'Fee item', value: 'Value', type: 'Type', scholarshiptype: 'Scholarship type', category: 'Category', merit: 'Merit', meritpercentage: 'Merit percentage', gender: 'Gender', active: 'Active' };
const feeReset = { semester: '', feecategory: [], feeitem: '', feeconfigurationid: '', feeitems: [] };
const feeAdd = { _id: '__add' };
const feeAll = { _id: '__all' };
const SELECT_ALL = '+ Select all';
const asArray = value => Array.isArray(value) ? value : value ? [value] : [];
const feeKey = row => ['__add','__all'].includes(row._id) ? row._id : JSON.stringify([row.feecategory,row.feeeitem]);
const draft = () => ({ ...scholarshipBlank, ...feeReset, category: ['All'], gender: ['All'] });
export function normalizeScholarshipSelection(previous, selected, options) {
  const specific = options.filter(value => value !== 'All');
  if (selected.includes(SELECT_ALL)) return specific.every(value => previous.includes(value)) ? [] : specific;
  if (selected.includes('All') && !previous.includes('All')) return ['All'];
  return selected.length > 1 ? selected.filter(value => value !== 'All') : selected;
}
export function expandScholarshipDraft(form, programs) {
  const { feeitems, ...rest } = form;
  return programs.flatMap((program,index) => feeitems.flatMap(fee => asArray(form.category).flatMap(category => asArray(form.gender).map(gender => ({ ...rest, programcode: program.programcode, feecategory: fee.feecategory, feeitem: fee.feeeitem, feeconfigurationid: index === 0 ? fee._id || undefined : undefined, category, gender })))));
}
const layout = { display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3,minmax(0,1fr))' }, gap: 2 };
const TextInput = memo(function TextInput({ field, value, max, onChange, disabled }) {
  const numeric = ['value', 'meritpercentage'].includes(field);
  return <TextField label={scholarshipLabels[field]} value={value} type={numeric ? 'number' : 'text'} disabled={disabled} multiline={field === 'description'} inputProps={numeric ? { min: 0, step: 'any', max } : undefined} onChange={event => onChange(field, event.target.value)} />;
});
const EnumInput = memo(function EnumInput({ field, value, onChange, disabled }) {
  if (['category','gender'].includes(field)) return <Autocomplete multiple disableCloseOnSelect options={[SELECT_ALL,...enums[field]]} value={value} disabled={disabled} onChange={(_,selected) => onChange(field,normalizeScholarshipSelection(value,selected,enums[field]))} renderOption={(props,option,{selected}) => <li {...props}><Checkbox size="small" checked={option===SELECT_ALL?enums[field].filter(item=>item!=='All').every(item=>value.includes(item)):selected}/>{option}</li>} renderInput={params => <TextField {...params} label={scholarshipLabels[field]}/>} />;
  return <Autocomplete options={enums[field]} value={value} disabled={disabled} onChange={(_, selected) => onChange(field, selected || scholarshipBlank[field])} renderInput={params => <TextField {...params} label={scholarshipLabels[field]} />} />;
});
const FeeChoices = memo(function FeeChoices({ year, programs, editing, semester, categories: chosenCategories, selectedItems, disabled, onChange, notify }) {
  const [rows, setRows] = useState([]), [dialog, setDialog] = useState(false), [refresh, setRefresh] = useState(0), [frameLoading, setFrameLoading] = useState(false), [loading, setLoading] = useState(false);
  const programcode = programs[0]?.programcode || '';
  useEffect(() => {
    const controller = new AbortController(); setRows([]);
    if (!year || !programcode) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    ep1.get('/api/v2/admission-scholarships/fee-options', { params: { colid: global1.colid, user: global1.user || global1.email, academicyear: year, programcode }, signal: controller.signal })
      .then(res => { if (!controller.signal.aborted) setRows(res.data.data || []); })
      .catch(error => { if (!controller.signal.aborted) notify(error.response?.data?.message || error.message, 'error'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [year, programcode, refresh, notify]);
  const semesters = useMemo(() => ['+ Add fee configuration', ...new Set(rows.map(row => row.semester).filter(Boolean))], [rows]);
  const categories = useMemo(() => [...new Set(rows.filter(row => row.semester === semester).map(row => row.feecategory))], [rows, semester]);
  const items = useMemo(() => [...new Map(rows.filter(row => row.semester === semester && chosenCategories.includes(row.feecategory)).map(row=>[feeKey(row),row])).values()].sort((a,b)=>a.feecategory.localeCompare(b.feecategory)||a.feeeitem.localeCompare(b.feeeitem)), [rows, semester, chosenCategories]);
  const yearValue = useMemo(() => year ? { name: year } : null, [year]);
  const programParams = useMemo(() => ({ academicyear: year }), [year]);
  const openFees = () => { setFrameLoading(true); setDialog(true); };
  const closeFees = () => { setDialog(false); setRefresh(value => value + 1); };
  return <>
    <ProgramChoice title="Academic year" endpoint="/api/v2/crm2-programs/academic-years" value={yearValue} onChange={value => onChange('year', value?.name || '')} addPath="/programmanagement" disabled={disabled} />
    <ProgramChoice title="Programs" endpoint="/api/v2/crm2-programs/programs" params={programParams} multiple value={programs} onChange={values => onChange('programs', editing ? values.slice(-1) : values)} addPath="/programmanagement" disabled={disabled} />
    <TextField label="Program codes" value={programs.map(program => program.programcode).join(', ')} InputProps={{ readOnly: true }} />
    <Autocomplete options={semesters} value={semester || null} loading={loading} disabled={disabled || !year || !programcode} onChange={(_, value) => value === '+ Add fee configuration' ? openFees() : onChange('semester', value || '')} renderInput={params => <TextField {...params} label="Semester" />} />
    <Autocomplete multiple disableCloseOnSelect options={['+ Add fee configuration',SELECT_ALL,...categories]} value={chosenCategories} disabled={disabled || !semester} onChange={(_,value)=>{if(value.includes('+ Add fee configuration'))return openFees();onChange('feecategory',value.includes(SELECT_ALL)?(categories.every(item=>chosenCategories.includes(item))?[]:categories):value);}} renderOption={(props,option,{selected})=><li {...props}>{option!=='+ Add fee configuration'&&<Checkbox size="small" checked={option===SELECT_ALL?categories.length>0&&categories.every(item=>chosenCategories.includes(item)):selected}/>} {option}</li>} renderInput={params=><TextField {...params} label="Fee category"/>}/>
    <Autocomplete multiple disableCloseOnSelect options={[feeAdd,feeAll,...items]} value={selectedItems} disabled={disabled || !chosenCategories.length} groupBy={row=>['__add','__all'].includes(row._id)?'Actions':row.feecategory} getOptionLabel={row=>row._id==='__add'?'+ Add fee configuration':row._id==='__all'?SELECT_ALL:`${row.feeeitem} (${row.feecategory})`} isOptionEqualToValue={(a,b)=>feeKey(a)===feeKey(b)} onChange={(_,value)=>{if(value.some(row=>row._id==='__add'))return openFees();onChange('feeitems',value.some(row=>row._id==='__all')?(items.every(item=>selectedItems.some(selected=>feeKey(selected)===feeKey(item)))?[]:items):value);}} renderOption={(props,row,{selected})=><li {...props} key={feeKey(row)}>{row._id!=='__add'&&<Checkbox size="small" checked={row._id==='__all'?items.length>0&&items.every(item=>selectedItems.some(value=>feeKey(value)===feeKey(item))):selected}/>} {row._id==='__add'?'+ Add fee configuration':row._id==='__all'?SELECT_ALL:`${row.feeeitem} (${row.feecategory})`}</li>} renderInput={params=><TextField {...params} label="Fee item"/>}/>
    <Dialog open={dialog} fullWidth maxWidth="xl" onClose={closeFees}><DialogTitle>Fees configuration</DialogTitle><DialogContent>{frameLoading && <LinearProgress />}{dialog && <Box component="iframe" title="Fees configuration" src="/mfeesconfig?embedded=1" onLoad={() => setFrameLoading(false)} sx={{ height: '75vh', width: '100%', border: 0 }} />}<Button onClick={closeFees}>Close</Button></DialogContent></Dialog>
  </>;
});
// Keep draft edits below the page shell and grid, and re-render only the changed input.
const AdmissionScholarshipEditor = memo(forwardRef(function AdmissionScholarshipEditor({ onSave, notify, busy }, ref) {
  const [form, setForm] = useState(draft), [programs, setPrograms] = useState([]), [editing, setEditing] = useState('');
  const reset = useCallback(() => { setEditing(''); setForm(draft()); setPrograms([]); }, []);
  useImperativeHandle(ref, () => ({ reset, edit(row) {
    setEditing(row._id); setForm({ ...Object.fromEntries(Object.keys(scholarshipBlank).map(key => [key, row[key] ?? scholarshipBlank[key]])), category:asArray(row.category || 'All'),gender:asArray(row.gender || 'All'),feecategory:asArray(row.feecategory),feeitems:row.feeitem?[{_id:row.feeconfigurationid,feecategory:row.feecategory,feeeitem:row.feeitem}]:[] });
    setPrograms([{ program: row.program, programcode: row.programcode }]);
  } }), [reset]);
  const change = useCallback((field, value) => {
    if (field === 'year') { setPrograms([]); setForm(previous => ({ ...previous, academicyear: value, ...feeReset })); }
    else if (field === 'programs') { setPrograms(value); setForm(previous => ({ ...previous, ...feeReset })); }
    else if (field === 'semester') setForm(previous => ({ ...previous, ...feeReset, semester: value }));
    else if (field === 'feecategory') setForm(previous => ({ ...previous, feecategory: value, feeitems: previous.feeitems.filter(row=>value.includes(row.feecategory)),feeitem:'',feeconfigurationid:'' }));
    else setForm(previous => ({ ...previous, [field]: value }));
  }, []);
  const save = async () => {
    if (!form.scholarship.trim() || !programs.length) return notify('Enter scholarship and select at least one program', 'error');
    if (!form.semester || !form.feecategory.length || !form.feeitems.length) return notify('Select semester, fee category and fee item from Fees configuration', 'error');
    if (!form.category.length || !form.gender.length) return notify('Select at least one category and gender','error');
    const count=programs.length*form.feeitems.length*form.category.length*form.gender.length;
    if(count>500)return notify('Select up to 500 scholarship combinations per save','error');
    const saved = await onSave({ id: editing || undefined, rows: expandScholarshipDraft(form,programs) });
    if (saved) reset();
  };
  return <Stack spacing={2}><Box sx={layout}>
    {['scholarship','description'].map(field => <TextInput key={field} field={field} value={form[field]} onChange={change} disabled={busy} />)}
    <FeeChoices year={form.academicyear} programs={programs} editing={!!editing} semester={form.semester} categories={form.feecategory} selectedItems={form.feeitems} disabled={busy} onChange={change} notify={notify} />
    {['value','meritpercentage'].map(field => <TextInput key={field} field={field} value={form[field]} max={field === 'meritpercentage' || form.type === 'Percentage' ? 100 : undefined} onChange={change} disabled={busy} />)}
    {Object.keys(enums).map(field => <EnumInput key={field} field={field} value={form[field]} onChange={change} disabled={busy} />)}
  </Box><Stack direction="row" gap={1} flexWrap="wrap"><Button startIcon={<Save />} variant="contained" disabled={busy} onClick={save}>{editing ? 'Update' : 'Save'}</Button><Button startIcon={<Add />} disabled={busy} onClick={reset}>New</Button><Chip label={`${programs.length*form.feeitems.length*form.category.length*form.gender.length} combinations`}/></Stack></Stack>;
}));
export default AdmissionScholarshipEditor;
