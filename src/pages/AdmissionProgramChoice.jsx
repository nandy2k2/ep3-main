import React,{forwardRef,memo,useImperativeHandle,useMemo,useState} from 'react';
import {Box,Stack,TextField} from '@mui/material';
import {ProgramChoice} from './Crm2ProgramPages';

const AdmissionProgramChoice=memo(forwardRef(function AdmissionProgramChoice({assignment,disabled},ref){
  const [program,setProgram]=useState({program:assignment.program,programcode:assignment.programcode});
  const params=useMemo(()=>({academicyear:assignment.academicyear}),[assignment.academicyear]);
  useImperativeHandle(ref,()=>({getProgram:()=>program}),[program]);
  return <Stack direction={{xs:'column',md:'row'}} spacing={2}>
    <Box sx={{flex:1,minWidth:0}}><ProgramChoice title="Admission program" endpoint="/api/v2/crm2-programs/programs" params={params} value={program} onChange={setProgram} addPath="/programmanagement" disabled={disabled}/></Box>
    <TextField label="Admission program code" value={program?.programcode || ''} InputProps={{readOnly:true}}/>
  </Stack>;
}));
export default AdmissionProgramChoice;
