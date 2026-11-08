import React,{createRef} from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import Details from './ScholarshipLedgerDetails';
import ep1 from '../api/ep1';
jest.mock('../api/ep1',()=>({get:jest.fn(),post:jest.fn()}));
jest.mock('./global1',()=>({colid:42,email:'admin@test.com',token:'token'}));
beforeEach(()=>{
  ep1.get.mockImplementation(url=>Promise.resolve({data:url.endsWith('/configs')?[{_id:'aws1',name:'AWS'}]:{data:[{_id:'user1',name:'Care User',email:'care@test.com'}]}}));
  ep1.post.mockResolvedValue({data:{url:'https://bucket.example/proof.pdf'}});
});
test('care-of email auto-populates and latest draft typing stays isolated from parent',async()=>{
  const ref=createRef(),parent=jest.fn();
  function Parent(){parent();return <Details ref={ref}/>;}
  render(<Parent/>);
  fireEvent.mouseDown(screen.getByRole('combobox',{name:'Care-of name'}));
  fireEvent.click(await screen.findByRole('option',{name:'Care User (care@test.com)'}));
  expect(screen.getByLabelText('Care-of email')).toHaveValue('care@test.com');
  const requests=ep1.get.mock.calls.length;
  fireEvent.change(screen.getByLabelText('Reference'),{target:{value:'Approval ref 123'}});
  fireEvent.change(screen.getByLabelText('Document link'),{target:{value:'https://example.com/doc.pdf'}});
  expect(ref.current.getDetails()).toEqual({careofname:'Care User',careofemail:'care@test.com',reference:'Approval ref 123',documentlink:'https://example.com/doc.pdf'});
  expect(parent).toHaveBeenCalledTimes(1);expect(ep1.get).toHaveBeenCalledTimes(requests);
});
test('AWS upload uses selected institution config and updates document link before enabling apply',async()=>{
  const ref=createRef(),uploading=jest.fn();render(<Details ref={ref} onUploading={uploading}/>);
  await waitFor(()=>expect(screen.getByRole('combobox',{name:'AWS configuration'})).toHaveValue('AWS'));
  fireEvent.change(screen.getByText('Upload document to AWS').querySelector('input'),{target:{files:[new File(['proof'],'proof.pdf',{type:'application/pdf'})]}});
  await waitFor(()=>expect(screen.getByLabelText('Document link')).toHaveValue('https://bucket.example/proof.pdf'));
  const body=ep1.post.mock.calls[0][1];expect(body.get('colid')).toBe('42');expect(body.get('awsconfigid')).toBe('aws1');
  expect(ref.current.getDetails().documentlink).toBe('https://bucket.example/proof.pdf');
  expect(uploading.mock.calls).toEqual([[true],[false]]);
});
