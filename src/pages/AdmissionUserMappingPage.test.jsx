import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './AdmissionUserMappingPage';
import ep1 from '../api/ep1';
jest.mock('../api/ep1',()=>({get:jest.fn(),post:jest.fn()}));
jest.mock('./global1',()=>({colid:42,email:'admin@example.com'}));
jest.mock('./MenuPageShell',()=>({children})=><div>{children}</div>);
jest.mock('@mui/x-data-grid',()=>({DataGrid:()=>null,GridToolbar:()=>null}));
test('dragging a combined admission field onto a User field automatically saves its mapping',async()=>{
  ep1.get.mockResolvedValue({data:{sources:[{field:'extraFields.parent_phone',label:'Parent phone',forms:['form1','form2']}],targets:[{field:'guardianmobile',protected:false}],mappings:[],protectedFields:[]}});
  ep1.post.mockResolvedValue({data:{data:{}}});
  render(<Page/>);
  const source=await screen.findByRole('button',{name:/Parent phone/});
  const target=screen.getByRole('button',{name:/guardianmobile/});
  const stored={};const dataTransfer={setData:(key,value)=>{stored[key]=value;},getData:key=>stored[key]};
  fireEvent.dragStart(source,{dataTransfer});fireEvent.dragOver(target,{dataTransfer});fireEvent.drop(target,{dataTransfer});
  await waitFor(()=>expect(ep1.post).toHaveBeenCalledWith('/api/v2/admission-user-mapping',expect.objectContaining({colid:42,source:'extraFields.parent_phone',target:'guardianmobile'})));
  await screen.findByText(/Linked extraFields.parent_phone/);
});
