/* eslint-disable testing-library/no-node-access -- Compare generated barcode SVGs and print documents. */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page, { barcode5aPreviewTextStyles, barcode5aTextStyles, barcode5bTextStyles, barcode5bPreviewTextStyles } from './ConductExamBarcode5Page';
import ep1 from '../api/ep1';
jest.mock('../api/ep1', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./ExamBarcodeDynamicFormatter', () => () => null);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./global1', () => ({ colid: 42 }));
jest.mock('@mui/x-data-grid', () => ({ GridToolbar: () => null, DataGrid: ({ rows, onRowSelectionModelChange }) => <button onClick={() => onRowSelectionModelChange(rows.map(row => row._id))}>Select {rows.length} loaded rows</button> }));
const row = { _id: 'roll1', shortbarcode: '12345678', regno: '300507-2026-27-P1-123', blockno: '12', coursecode: 'PHARM101', examcode: 'EX2026' };
beforeEach(() => {
  ep1.get.mockImplementation(url => Promise.resolve({ data: { data: url.endsWith('/exams') ? [{ _id: 'exam1', academicyear: '2026-27', examname: 'Term end', examcode: 'EX2026' }] : [row] } }));
});
async function choose(label, name) { fireEvent.mouseDown(screen.getByRole('combobox', { name: label })); fireEvent.click(await screen.findByRole('option', { name })); }
async function preview(largeText, largeMetaText = false, dualBarcode = false) {
  render(<Page largeText={largeText} largeMetaText={largeMetaText} dualBarcode={dualBarcode} />);
  await choose('Academic Year', '2026-27'); await choose('Exam', 'Term end (EX2026)');
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Select 1 loaded rows' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate barcode' }));
  await screen.findByText('Generated 1 barcode sticker(s).');
  return document.querySelector(dualBarcode ? '.b5c-code svg' : '.barcode5-code svg').outerHTML;
}
test('5c repeats the exact 5b SVG twice without changing encoded barcode or proportions', async () => {
  const original = await preview(true, true); cleanup();
  const copied = await preview(true, true, true);
  expect(copied).toBe(original);
  const barcodes = document.querySelectorAll('.b5c-code svg');
  expect(barcodes).toHaveLength(2);
  expect(barcodes[1].outerHTML).toBe(original);
  expect(screen.getByText('Exam barcode 5c')).toBeTruthy();
});
test('5a preserves the exact original barcode SVG and changes only text styles', async () => {
  const original = await preview(false); cleanup();
  const enlarged = await preview(true);
  expect(enlarged).toBe(original);
  expect(document.querySelector('.barcode5a-sheet')).toBeTruthy();
  expect(screen.getByText('Exam barcode 5a')).toBeTruthy();
  expect(barcode5aTextStyles).toContain('font-size: 3.2mm');
  expect(barcode5aPreviewTextStyles).toContain('font-size: 1.9mm');
  expect(barcode5aTextStyles).not.toMatch(/width|height|transform|scale/);
  expect(barcode5aPreviewTextStyles).not.toMatch(/width|height|transform|scale/);
});
test('5a print keeps the same label and barcode sizes while enlarging printed text', async () => {
  const write = jest.fn(), print = jest.fn();
  const open = jest.spyOn(window, 'open').mockReturnValue({ document: { open: jest.fn(), write, close: jest.fn() }, focus: jest.fn(), print });
  await preview(true);
  fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
  const html = write.mock.calls[0][0];
  expect(html).toContain('<title>Exam barcode 5a</title>');
  expect(html).toContain('@page { size: 100mm 26mm; margin: 0; }');
  expect(html).toContain('width: 33mm !important;');
  expect(html).toContain('max-height: 18.2mm !important;');
  expect(html).toContain(barcode5aTextStyles);
  await waitFor(() => expect(print).toHaveBeenCalled()); open.mockRestore();
});
test('5b changes only exam code and section text while preserving the 5a barcode SVG', async () => {
  const original = await preview(true); cleanup();
  expect(await preview(true, true)).toBe(original);
  expect(screen.getByText('Exam barcode 5b')).toBeTruthy();
  expect(document.querySelector('.barcode5b-sheet')).toBeTruthy();
  expect(barcode5bTextStyles).toBe('.meta { font-size: 2.35mm; }');
  expect(barcode5bPreviewTextStyles).not.toMatch(/width|height|transform|scale|barcode5-line/);
  const write = jest.fn(), print = jest.fn();
  const open = jest.spyOn(window, 'open').mockReturnValue({ document: { open: jest.fn(), write, close: jest.fn() }, focus: jest.fn(), print });
  fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
  const html = write.mock.calls[0][0];
  expect(html).toContain('<title>Exam barcode 5b</title>');
  expect(html).toContain(barcode5aTextStyles);
  expect(html).toContain(barcode5bTextStyles);
  expect(html).toContain('width: 33mm !important;');
  expect(html).toContain('max-height: 18.2mm !important;');
  await waitFor(() => expect(print).toHaveBeenCalled()); open.mockRestore();
});
