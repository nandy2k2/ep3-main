import { applyLoginSession } from './loginSession';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../pages/global1', () => ({ __esModule: true, default: {}, persistGlobalSession: jest.fn() }));
jest.mock('./countryTerminology', () => ({ configureCountryTerminology: jest.fn() }));
beforeEach(() => { ep1.get.mockResolvedValue({ data: { data: { active: 'Yes', classes: [] } } }); ep1.post.mockResolvedValue({ data: { success: true } }); });
test.each(['counselor','Counselor','counsellor'])('%s lands directly on counselor dashboard before chatbot routing', async role => {
  expect(await applyLoginSession({ status: 'Success', colid: 42, user: 'me@example.com', name: 'Me', role, token: 'signed' })).toBe('/counsellor-dashboard');
  expect(ep1.get.mock.calls.some(([path]) => path.includes('ai-chatbot-definition-role'))).toBe(false);
});
test('telecaller lands on the restricted telecaller dashboard', async () => {
  expect(await applyLoginSession({ status: 'Success', colid: 42, user: 'me@example.com', name: 'Me', role: 'telecaller', token: 'signed' })).toBe('/telecaller-dashboard');
});
