import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import Page from './Crm2Pages';
import ep1 from '../api/ep1';
jest.mock('../api/ep1',()=>({get:jest.fn(),post:jest.fn()}));
jest.mock('./global1',()=>({colid:42,email:'admin@test.com'}));
jest.mock('./MenuPageShell',()=>({children})=><div>{children}</div>);
jest.mock('@mui/x-data-grid',()=>({GridToolbar:()=>null,DataGrid:()=>null}));
test('Publisher master selects Publisher User, auto-fills read-only email and links existing login',async()=>{
  ep1.get.mockImplementation(url=>Promise.resolve({data:url.endsWith('/publisher-users')?{data:[{_id:'u1',name:'Publisher One',email:'pub@test.com'}]}:{fields:[]}}));
  ep1.post.mockResolvedValue({data:{success:true,data:{_id:'pub1'}}});
  render(<Page entity="publisher"/>);
  fireEvent.mouseDown(screen.getByRole('combobox',{name:'Publisher user'}));fireEvent.click(await screen.findByRole('option',{name:/Publisher One/}));
  expect(screen.getByLabelText('Name')).toHaveValue('Publisher One');expect(screen.getByLabelText('Email')).toHaveValue('pub@test.com');expect(screen.getByLabelText('Email')).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Password')).toHaveValue('Linked User account');fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(ep1.post).toHaveBeenCalledWith('/api/v2/crm2/masters/publisher/save',expect.objectContaining({email:'pub@test.com',name:'Publisher One',colid:42}),expect.any(Object)));
  await screen.findByText('Saved');
});
