import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Crm2Education from "./Crm2Education";
jest.mock("./AiImageFieldExtractor", () => function Extractor({ onApply }) { return <button onClick={() => onApply({ subjects: [{ subject: "Maths", obtained: 90, total: 100 }] })}>Apply marksheet</button>; });
test("marksheet extraction creates subjectwise education under selected level", () => {
  const onChange = jest.fn();
  render(<Crm2Education onChange={onChange} />);
  fireEvent.click(screen.getByText("Apply marksheet"));
  expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ level: "10th", subjects: [{ subject: "Maths", obtained: 90, total: 100 }] })]);
});
test("manual subject marks remain editable", () => {
  const onChange = jest.fn();
  render(<Crm2Education value={[{ level: "12th", subjects: [{ subject: "English", obtained: 70, total: 100 }] }]} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("obtained"), { target: { value: "80" } });
  expect(onChange.mock.calls[0][0][0].subjects[0].obtained).toBe("80");
});
test("each education record supports overall marks and grade", () => {
  const onChange = jest.fn();
  render(<Crm2Education value={[{ level: "12th", marks: 450, grade: "A", subjects: [] }]} onChange={onChange} />);
  expect(screen.getByLabelText("Overall marks obtained").value).toBe("450");
  fireEvent.change(screen.getByLabelText("Overall grade"), { target: { value: "A+" } });
  expect(onChange.mock.calls[0][0][0]).toEqual(expect.objectContaining({ level: "12th", marks: 450, grade: "A+" }));
});
