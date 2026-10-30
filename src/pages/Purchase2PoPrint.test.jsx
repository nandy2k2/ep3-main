import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { Purchase2PoPrint, amountInWords, printablePoLine, purchase2PrintCss } from './Purchase2PrintTemplates';
import { resolvePoDelivery } from '../utils/purchase2Delivery';
jest.mock('react-dom/server', () => jest.requireActual('react-dom/server.node'));
test('PO print displays resolved receiving store, financial columns and figures/words consistently', () => {
  const delivery = resolvePoDelivery({ storeid: 'store-id' }, [{ _id: 'store-id', storename: 'Central Receiving Store', address: 'Campus Road, Building A', contactperson: 'Store Manager', phone: '9000000000', email: 'store@example.com' }]);
  const html = renderToStaticMarkup(<Purchase2PoPrint header={{ poid: 'PO-2026-101', vendor: 'Office Supplies Ltd', terms: 'Delivery within 7 days', ...delivery }} items={[{ itemcode: 'PAPER-A4', itemname: 'A4 printing paper', description: 'Premium white paper', unit: 'Ream', quantity: 2, price: 100, gst: 18, discount: 10 }]} institution={{ institutionname: 'Example Institution', address: 'Campus address' }} />);
  for (const value of ['Central Receiving Store','Campus Road, Building A','9000000000','store@example.com','Unit price','GST amount','Line total','Grand Total','224.20','34.20','10.00','Rupees Two Hundred Twenty Four and Twenty Paise only']) expect(html).toContain(value);
  expect(html).toContain('print-sheet landscape'); expect(html).toContain('money-cell');
  require('fs').writeFileSync('/tmp/purchase2-po-print-test.html', `<!doctype html><html><head><meta charset="utf-8"><style>${purchase2PrintCss}</style></head><body>${html}</body></html>`);
});
test('legacy stored amounts without unit price remain printable and paise are not lost', () => {
  const line = printablePoLine({ quantity: 2, total: 236, gstamount: 36, itemname: 'Legacy item' });
  expect(line.price).toBe(100); expect(line.total).toBe(236); expect(line.gst).toBe(18);
  expect(amountInWords(1000.25)).toBe('Rupees One Thousand and Twenty Five Paise only');
});
