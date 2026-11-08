import { expandScholarshipDraft, normalizeScholarshipSelection } from './AdmissionScholarshipEditor';
jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: () => null }));

test('expands selected categories and genders without crossing fee category/item pairs', () => {
  const rows = expandScholarshipDraft({ scholarship:'Award', category:['SC','ST'], gender:['Male','Female'], feeitems:[{_id:'a',feecategory:'Tuition',feeeitem:'Course fee'},{_id:'b',feecategory:'Hostel',feeeitem:'Room fee'}] }, [{programcode:'P1'},{programcode:'P2'}]);
  expect(rows).toHaveLength(16);
  expect(rows.every(row => typeof row.category === 'string' && typeof row.gender === 'string')).toBe(true);
  expect(rows.every(row => row.feecategory === 'Tuition' ? row.feeitem === 'Course fee' : row.feeitem === 'Room fee')).toBe(true);
  expect(rows.filter(row => row.programcode === 'P2').every(row => !row.feeconfigurationid)).toBe(true);
});

test('All is exclusive and Select all toggles specific choices', () => {
  const options=['Male','Female','All'];
  expect(normalizeScholarshipSelection(['All'],['All','Male'],options)).toEqual(['Male']);
  expect(normalizeScholarshipSelection(['Male'],['Male','All'],options)).toEqual(['All']);
  expect(normalizeScholarshipSelection(['All'],['All','+ Select all'],options)).toEqual(['Male','Female']);
  expect(normalizeScholarshipSelection(['Male','Female'],['Male','Female','+ Select all'],options)).toEqual([]);
});
