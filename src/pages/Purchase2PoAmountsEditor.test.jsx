import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Purchase2PoAmountsEditor from "./Purchase2PoAmountsEditor";

function Example() {
  const [items, setItems] = useState([{ itemname: "Printer", quantity: 2, price: 100, discounttype: "Percentage", discount: 10, gst: 18 }]);
  return <Purchase2PoAmountsEditor items={items} setItems={setItems} />;
}
test("item changes immediately update read-only summary without saving", () => {
  render(<Example />);
  expect(screen.getByLabelText("Grand total").value).toBe("212.40");
  fireEvent.change(screen.getByLabelText("Unit rate"), { target: { value: "200.5" } });
  expect(screen.getByLabelText("Subtotal").value).toBe("401.00");
  expect(screen.getByLabelText("Discount deductions").value).toBe("40.10");
  expect(screen.getByLabelText("GST / Tax amount").value).toBe("64.96");
  expect(screen.getByLabelText("Grand total").value).toBe("425.86");
  fireEvent.change(screen.getByLabelText("GST / Tax %"), { target: { value: "0" } });
  expect(screen.getByLabelText("Grand total").value).toBe("360.90");
  expect(screen.getByLabelText("Grand total").readOnly).toBe(true);
});
test("fixed discount is deducted before tax in the displayed summary", () => {
  render(<Purchase2PoAmountsEditor items={[{ quantity: 2, price: 100, discounttype: "Amount", discount: 25, gst: 18 }]} setItems={() => {}} />);
  expect(screen.getByLabelText("Discount deductions").value).toBe("25.00");
  expect(screen.getByLabelText("Grand total").value).toBe("206.50");
});
