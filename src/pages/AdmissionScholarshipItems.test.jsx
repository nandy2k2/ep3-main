import React,{createRef} from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {ScholarshipItemsGrid} from './AdmissionScholarshipItems';
import {DataGrid} from '@mui/x-data-grid';
jest.mock('@mui/x-data-grid',()=>({GridToolbar:()=>null,DataGrid:jest.fn()}));
const rows=[{_id:'one',student:'First',studentid:'u1',scholarshipid:'s1',sourceledgerid:'l1',semester:'1',total:1000,base:600,remaining:900,calculatedamount:60,selectable:true},{_id:'two',student:'Second',semester:'2',total:500,base:500,remaining:500,calculatedamount:50,selectable:true}];
beforeEach(()=>{DataGrid.mockImplementation(({rows,columns})=><div>{rows.map(row=><div key={row._id}>{row.student}{columns.find(column=>column.field==='scholarshipamount').renderCell({row})}</div>)}</div>);});
test('edited amount is immediate, survives selection rerender, and does not rerender parent or grid while typing',async()=>{
  const ref=createRef(),parent=jest.fn(),select=jest.fn();
  function Parent({selected}){parent();return <ScholarshipItemsGrid ref={ref} rows={rows} selected={selected} onSelect={select}/>;}
  const view=render(<Parent selected={['one']}/>);
  await waitFor(()=>expect(screen.getByText('Amount to apply: 60.00')).toBeInTheDocument());
  const parents=parent.mock.calls.length,grids=DataGrid.mock.calls.length;
  fireEvent.change(screen.getByRole('spinbutton',{name:'Scholarship amount one'}),{target:{value:'125.5'}});
  expect(parent).toHaveBeenCalledTimes(parents);expect(DataGrid).toHaveBeenCalledTimes(grids);
  expect(ref.current.getSelections(['one'])[0].scholarshipamount).toBe(125.5);expect(screen.getByText('Amount to apply: 125.50')).toBeInTheDocument();
  view.rerender(<Parent selected={['one','two']}/>);
  expect(ref.current.getSelections(['one'])[0].scholarshipamount).toBe(125.5);
  fireEvent.change(screen.getByRole('spinbutton',{name:'Scholarship amount one'}),{target:{value:'601'}});
  expect(()=>ref.current.getSelections(['one'])).toThrow(/eligible fee base/);
});
test('extra multiselect fee filters only take effect on Load and reset selection/overrides',async()=>{
  const ref=createRef(),reload=jest.fn(),select=jest.fn();render(<ScholarshipItemsGrid ref={ref} rows={rows} selected={['one']} onSelect={select} onReload={reload}/>);
  fireEvent.click(screen.getByRole('button',{name:'Add fee item filter'}));
  fireEvent.mouseDown(screen.getByRole('combobox',{name:'Semester filter values'}));fireEvent.click(await screen.findByRole('option',{name:'2'}));
  expect(screen.getByText('First')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Load matching fee items'}));
  await waitFor(()=>expect(screen.queryByText('First')).not.toBeInTheDocument());
  expect(screen.getByText('Second')).toBeInTheDocument();expect(reload).toHaveBeenCalledTimes(1);expect(select).toHaveBeenCalledWith([]);
  expect(()=>ref.current.getSelections(['one'])).toThrow(/visible matching/);
});
