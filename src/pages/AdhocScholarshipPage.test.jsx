import {buildAdhocFeeFilters,calculateAdhocBalance} from './AdhocScholarshipPage';
jest.mock('../api/ep1',()=>({get:jest.fn(),post:jest.fn()}));
jest.mock('./global1',()=>({colid:42,email:'faculty@test.com',token:'session'}));
jest.mock('./MenuPageShell',()=>({children})=><div>{children}</div>);
jest.mock('@mui/x-data-grid',()=>({GridToolbar:()=>null,DataGrid:()=>null}));

test('student context creates editable default fee filters including semester',()=>{
  const filters=buildAdhocFeeFilters({academicyear:'2026-27',program:'Science',programcode:'P1',semester:'2'});
  expect(filters.map(row=>[row.field,row.values])).toEqual([
    ['academicyear',['2026-27']],['program',['Science']],['programcode',['P1']],['semester',['2']]
  ]);
  expect(filters[1].selections[0]).toMatchObject({label:'Science (P1)',programcode:'P1'});
});

test('new balance uses amount minus paid minus edited concession and never becomes negative',()=>{
  expect(calculateAdhocBalance({amount:30000,paid:5000},2500)).toBe(22500);
  expect(calculateAdhocBalance({amount:30000,paid:29000},5000)).toBe(0);
});
