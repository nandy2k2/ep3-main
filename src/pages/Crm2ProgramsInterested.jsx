import React, { useState } from 'react';
import { Grid, TextField, Typography } from '@mui/material';
import { ProgramChoice } from './Crm2ProgramPages';
import { useCrm2Dashboard } from './Crm2DashboardContext';
export default function Crm2ProgramsInterested({ value = [], onChange, api, portal = false }) {
  const dashboard = useCrm2Dashboard();
  const [chosenYear, setYear] = useState(null);
  const year = dashboard ? { name: dashboard.academicyear } : chosenYear;
  const selected = value.filter(row => row.academicyear === year?.name);
  return <>
    <Grid item xs={12} md={4}><ProgramChoice api={api} disabled={Boolean(dashboard)} title="Academic year for programs" endpoint={portal ? '/api/v2/lead-portal/academic-years' : '/api/v2/crm2-programs/academic-years'} addPath={portal ? undefined : '/programmanagement'} value={year} onChange={setYear} /></Grid>
    <Grid item xs={12} md={8}><ProgramChoice api={api} title="Programs interested" endpoint={portal ? '/api/v2/lead-portal/programs' : '/api/v2/crm2-programs/programs'} params={{ academicyear: year?.name || '' }} multiple disabled={!year} value={selected} addPath={portal ? undefined : '/programmanagement'} onChange={programs => {
      let next = Math.max(0, ...value.map((row, i) => Number(row.priority) || i + 1)) + 1;
      onChange([...value.filter(row => row.academicyear !== year.name), ...programs.map(row => {
        const index = value.findIndex(item => item.academicyear === year.name && item.programcode === row.programcode);
        return { academicyear: year.name, program: row.program, programcode: row.programcode, priority: index >= 0 ? value[index].priority ?? index + 1 : next++ };
      })]);
    }} /></Grid>
    <Grid item xs={12}><TextField fullWidth size="small" label="Selected program codes" value={selected.map(row => row.programcode).join(', ')} InputProps={{ readOnly: true }} /></Grid>
    {value.map((row, index) => !dashboard || row.academicyear === dashboard.academicyear ? <React.Fragment key={`${row.academicyear}-${row.programcode}`}><Grid item xs={12} md={8}><Typography>{row.academicyear} · {row.program} ({row.programcode})</Typography></Grid><Grid item xs={12} md={4}><TextField size="small" fullWidth type="number" label={`Priority for ${row.program} (${row.programcode})`} inputProps={{ min: 1, max: 1000, step: 1 }} value={row.priority ?? index + 1} onChange={event => onChange(value.map((item, i) => i === index ? { ...item, priority: event.target.value } : item))} /></Grid></React.Fragment> : null)}
  </>;
}
