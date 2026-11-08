import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdmissionTransferActions } from './AdmissionApplicationManagement2Page';
import ep1 from '../api/ep1';
jest.mock('../api/ep1',()=>({post:jest.fn()}));
jest.mock('./global1',()=>({colid:42}));
jest.mock('./AdmissionApplicationManagementPage',()=>()=>null);
jest.mock('./SendWhatsappPingPage',()=>()=>null);
jest.mock('@mui/x-data-grid',()=>({DataGrid:()=>null,GridToolbar:()=>null}));
test('transfer sends only selected application IDs and displays the result toast',async()=>{
  jest.spyOn(window,'confirm').mockReturnValue(true);
  ep1.post.mockResolvedValue({data:{results:[{id:'app1',regno:'R1',status:'Transferred',details:'1 mapped fields processed'}]}});
  render(<MemoryRouter><AdmissionTransferActions selectedRows={[{_id:'app1',regno:'R1'}]}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Transfer to User (1)'}));
  await waitFor(()=>expect(ep1.post).toHaveBeenCalledWith('/api/v2/admission-application-management-2/transfer',{colid:42,ids:['app1']}));
  await screen.findByText('1 transferred; 0 skipped.');window.confirm.mockRestore();
});
test('help explains matching, field mapping and protected fields',async()=>{
  render(<MemoryRouter><AdmissionTransferActions selectedRows={[]}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Mapping and transfer help'}));
  await screen.findByText(/regno and colid only/);
  expect(screen.getByText(/Name, email, program, programcode/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Open field mapping'})).toHaveAttribute('href','/admission-user-mapping');
});
