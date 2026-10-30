import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Button, Grid, IconButton, Stack, TextField } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { ProgramChoice } from './Crm2ProgramPages';
import ep1 from '../api/ep1';
import global1 from './global1';
export const emptyLeadFilters = { filters: [], dateField: 'dateadded', dateFrom: '', dateTo: '' };
const dates = ['dateadded','createdAt','updatedAt','followupdate','campusvisitdate'];
const dateLabel = field => ({ dateadded: 'Date added', createdAt: 'Created date', updatedAt: 'Updated date', followupdate: 'Follow-up date', campusvisitdate: 'Campus visit date' }[field]);
export default function Crm2LeadFilterPanel({ value, onChange, academicyear, endpoint }) {
  const [fields, setFields] = useState([]);
  const api = useMemo(() => ({ get: (url, config) => ep1.get(url, { ...config, headers: { Authorization: `Bearer ${global1.token}` } }) }), []);
  useEffect(() => {
    const controller = new AbortController();
    ep1.get('/api/v2/crm2/metadata', { params: { colid: global1.colid }, signal: controller.signal }).then(result => setFields([...(result.data.fields || []).filter(field => !/password|secret|token/i.test(field.field) && ['String','Number','Date','Boolean'].includes(field.type)), ...['source','pipeline','crmcategory','type','case','counselloremail'].map(field => ({ field, type: 'String' }))].filter((field,index,all) => all.findIndex(item => item.field === field.field) === index))).catch(() => {});
    return () => controller.abort();
  }, []);
  const patch = changes => onChange({ ...value, ...changes });
  const patchFilter = (index, changes) => patch({ filters: value.filters.map((filter,i) => i === index ? { ...filter, ...changes } : filter) });
  return <Stack spacing={1}>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Autocomplete sx={{ width: 210 }} options={dates} value={value.dateField} getOptionLabel={dateLabel} onChange={(_, field) => patch({ dateField: field || 'dateadded' })} renderInput={params => <TextField {...params} label="Date range field" size="small" />} /><TextField size="small" type="date" label="From date" InputLabelProps={{ shrink: true }} value={value.dateFrom} onChange={event => patch({ dateFrom: event.target.value })} /><TextField size="small" type="date" label="To date" InputLabelProps={{ shrink: true }} value={value.dateTo} onChange={event => patch({ dateTo: event.target.value })} /><Button startIcon={<Add />} onClick={() => patch({ filters: [...value.filters, { field: 'pipeline', value: '' }] })}>Add filter</Button><Button onClick={() => onChange(emptyLeadFilters)}>Clear filters</Button></Stack>
    {value.filters.map((filter,index) => {
      const field = fields.find(item => item.field === filter.field);
      return <Grid container spacing={1} key={index}><Grid item xs={12} md={4}><Autocomplete options={fields} value={field || null} getOptionLabel={item => item.label || item.field} onChange={(_, item) => patchFilter(index, { field: item?.field || '', value: '' })} renderInput={params => <TextField {...params} label="Filter field" size="small" />} /></Grid><Grid item xs={10} md={7}>
        {field?.options?.length ? <Autocomplete options={field.options} value={filter.value || null} onChange={(_, value) => patchFilter(index, { value: value || '' })} renderInput={params => <TextField {...params} label="Filter value" size="small" />} /> : field?.type === 'String' ? <ProgramChoice api={api} title="Filter value" freeSolo endpoint={`${endpoint}/filter-options`} params={{ academicyear, field: filter.field }} value={filter.value ? { name: filter.value } : null} disabled={!academicyear} onChange={value => patchFilter(index, { value: typeof value === 'string' ? value : value?.name || '' })} /> : <TextField fullWidth size="small" type={field?.type === 'Date' ? 'date' : field?.type === 'Number' ? 'number' : 'text'} InputLabelProps={field?.type === 'Date' ? { shrink: true } : undefined} label="Filter value" value={filter.value} onChange={event => patchFilter(index, { value: event.target.value })} />}
      </Grid><Grid item xs={2} md={1}><IconButton title="Remove filter" onClick={() => patch({ filters: value.filters.filter((_,i) => i !== index) })}><Close /></IconButton></Grid></Grid>;
    })}
  </Stack>;
}
