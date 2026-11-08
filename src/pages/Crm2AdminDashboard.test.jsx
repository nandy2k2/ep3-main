import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Crm2AdminDashboard from './Crm2AdminDashboard';
import ep1 from '../api/ep1';

jest.mock('../api/ep1', () => ({ get: jest.fn() }));
jest.mock('./MenuPageShell', () => ({ children }) => <div>{children}</div>);
jest.mock('./Crm2PartnerPaymentPages', () => ({ PartnerReportContent: () => null }));
jest.mock('./Crm2ProgramPages', () => ({ ProgramChoice: () => null }));
jest.mock('@mui/x-data-grid', () => ({ DataGrid: ({ rows, columns }) => <div>{rows.map((row, i) => <div key={i}>{columns.find(col => col.field === 'name')?.renderCell?.({ row })}</div>)}</div> }));
jest.mock('recharts', () => {
  const React = require('react'), ChartData = React.createContext([]);
  const Empty = () => null;
  return {
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    BarChart: ({ data, children }) => <ChartData.Provider value={data}>{children}</ChartData.Provider>,
    Bar: ({ onClick }) => React.useContext(ChartData).map(row => onClick && <button key={row.label} onClick={() => onClick({ payload: row })}>Chart {row.label}</button>),
    Cell: Empty, PieChart: Empty, Pie: Empty, XAxis: Empty, YAxis: Empty, CartesianGrid: Empty, Tooltip: Empty, Legend: Empty
  };
});

test.each([/Interested 1/, /Chart Interested/])('opens the stage and original editor from %s', async target => {
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('/options') ? { years: ['2026-27'] } : url.endsWith('/metadata') ? { fields: [] } : {
    programs: [], capacities: [], counselors: [], agents: [], leads: [
      { _id: 'lead-a', name: 'Ann', pipeline: 'Interested', programcodes: [] },
      { _id: 'lead-b', name: 'Ben', pipeline: 'New', programcodes: [] }
    ]
  } }));
  render(<Crm2AdminDashboard />);
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Academic year' }));
  fireEvent.click(await screen.findByRole('option', { name: '2026-27' }));
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  fireEvent.click(await screen.findByRole('button', { name: target }));
  const stage = within(screen.getByRole('dialog', { name: /Interested leads/ }));
  expect(stage.queryByRole('button', { name: 'Ben' })).not.toBeInTheDocument();
  fireEvent.click(stage.getByRole('button', { name: 'Ann' }));
  expect(screen.getByTitle('Edit lead')).toHaveAttribute('src', '/crm2-lead-editor?id=lead-a&embedded=1');
});

test('program card lists leads linked to the selected program and opens the original editor', async () => {
  ep1.get.mockImplementation(async url => ({ data: url.endsWith('/options') ? { years: ['2026-27'] } : url.endsWith('/metadata') ? { fields: [] } : {
    programs: [{ _id: 'program-a', program: 'Computing', programcode: '001' }], capacities: [], counselors: [], agents: [], leads: [
      { _id: 'lead-a', name: 'Ann', pipeline: 'Interested', programcodes: ['001'], admittedcodes: [] },
      { _id: 'lead-b', name: 'Ben', pipeline: 'Interested', programcodes: ['002'], admittedcodes: [] }
    ]
  } }));
  render(<Crm2AdminDashboard />);
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Academic year' }));
  fireEvent.click(await screen.findByRole('option', { name: '2026-27' }));
  fireEvent.click(screen.getByRole('button', { name: 'Load' }));
  fireEvent.click(await screen.findByRole('button', { name: 'View leads for Computing (001)' }));
  const dialog = within(screen.getByRole('dialog', { name: /Computing \(001\) leads/ }));
  expect(dialog.queryByRole('button', { name: 'Ben' })).not.toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: 'Ann' }));
  expect(screen.getByTitle('Edit lead')).toHaveAttribute('src', '/crm2-lead-editor?id=lead-a&embedded=1');
});
