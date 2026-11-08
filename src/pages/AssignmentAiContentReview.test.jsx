import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {AssignmentEvaluationPanel,AiContentReport} from './AssignmentAiContentReview';
import ep1 from '../api/ep1';
jest.mock('../api/ep1',()=>({post:jest.fn()}));
jest.mock('./global1',()=>({colid:42,user:'faculty@example.com'}));
test('the optional checkbox passes the flag to assignment evaluation',async()=>{
  const onEvaluated=jest.fn();ep1.post.mockResolvedValue({data:{data:{_id:'s1',marks:8}}});
  render(<AssignmentEvaluationPanel submission={{_id:'s1'}} fullmarks={10} onEvaluated={onEvaluated}/>);
  const checkbox=screen.getByRole('checkbox',{name:'Check for AI content'});expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);fireEvent.click(screen.getByRole('button',{name:'AI evaluate submission'}));
  await waitFor(()=>expect(ep1.post).toHaveBeenCalledWith('/api/v2/neplms/assignment-submissions/ai-evaluate',expect.objectContaining({colid:42,id:'s1',checkAiContent:true,provider:'Gemini'})));
  await waitFor(()=>expect(onEvaluated).toHaveBeenCalledWith({_id:'s1',marks:8}));
  await screen.findByText('AI evaluation saved. Review marks and any content assessment before finalizing.');
});
test('help and stored report communicate uncertainty and inspected coverage',async()=>{
  render(<><AssignmentEvaluationPanel submission={{_id:'s1'}} fullmarks={10} onEvaluated={()=>{}}/><AiContentReport report={{checked:true,finding:'Inconclusive',summary:'Weak evidence',limitations:'Not proof of AI use',attachmentStatus:'Attachment not inspected',inspectedCharacters:500,truncated:true,evidence:[]}}/></>);
  fireEvent.click(screen.getByRole('button',{name:'How AI content assessment works'}));
  await screen.findByText(/unverified indicators, not proof/);fireEvent.click(screen.getByRole('button',{name:'Close'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button',{name:/Inconclusive · Review/}));
  await screen.findByText('Not proof of AI use');expect(screen.getByText(/Partial\/truncated content only/)).toBeInTheDocument();
});
