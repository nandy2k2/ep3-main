import React from "react";
import { Alert, Box, Button, Grid, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { calculatePoLine, summarizePo } from "../utils/purchase2Amounts";

export function Purchase2PoSummary({ items = [] }) {
  const summary = summarizePo(items);
  return <Grid container spacing={1.5} sx={{ my: 1 }}>{[["subtotal", "Subtotal"], ["discountamount", "Discount deductions"], ["taxableamount", "Taxable amount"], ["gstamount", "GST / Tax amount"], ["grandtotal", "Grand total"]].map(([field, label]) => <Grid item xs={6} md={2.4} key={field}><TextField fullWidth size="small" label={label} value={summary[field].toFixed(2)} InputProps={{ readOnly: true }} /></Grid>)}</Grid>;
}

export default function Purchase2PoAmountsEditor({ items = [], setItems, disabled = false, allowRemove = false }) {
  const update = (index, field, value) => setItems((previous) => previous.map((row, i) => index === i ? { ...row, [field]: value } : row));
  const input = (row, index, field, label) => <TextField size="small" type="number" label={label} value={row[field] ?? ""} disabled={disabled} inputProps={{ min: 0, step: "any", ...(field === "gst" || (field === "discount" && row.discounttype === "Percentage") ? { max: 100 } : {}) }} onChange={(e) => update(index, field, e.target.value)} sx={{ minWidth: 110, width: 125 }} />;
  return <Box sx={{ mt: 2, minWidth: 0 }}>
    <TableContainer component={Paper} variant="outlined"><Table size="small" aria-label="PO item calculations"><TableHead><TableRow>{["Item", "Make", "Quantity", "Unit rate", "Discount type", "Discount", "GST / Tax %", "Subtotal", "Discount deduction", "Taxable amount", "GST / Tax amount", "Line total"].map((name) => <TableCell key={name}>{name}</TableCell>)}</TableRow></TableHead><TableBody>{items.map((item, index) => {
      const line = calculatePoLine(item);
      return <TableRow key={item._id || index}><TableCell sx={{ minWidth: 150 }}>{item.itemname || item.item || item.itemcode}{line.calculationerror && <Alert severity="error" sx={{ mt: 1 }}>{line.calculationerror}</Alert>}</TableCell>
        <TableCell><TextField size="small" label="Make" value={item.make || ""} disabled={disabled} onChange={e => update(index, "make", e.target.value)} /></TableCell><TableCell>{input(item, index, "quantity", "Quantity")}</TableCell><TableCell>{input({ ...item, price: item.price ?? item.rate ?? item.estimatedprice ?? 0 }, index, "price", "Unit rate")}</TableCell>
        <TableCell><TextField select size="small" label="Discount type" value={item.discounttype || "Amount"} disabled={disabled} onChange={(e) => update(index, "discounttype", e.target.value)} sx={{ minWidth: 140 }}><MenuItem value="Amount">Fixed amount</MenuItem><MenuItem value="Percentage">Percentage</MenuItem></TextField></TableCell>
        <TableCell>{input(item, index, "discount", item.discounttype === "Percentage" ? "Discount %" : "Discount amount")}</TableCell><TableCell>{input({ ...item, gst: item.gst ?? 0 }, index, "gst", "GST / Tax %")}</TableCell>
        {["subtotal", "discountamount", "taxableamount", "gstamount", "total"].map((field) => <TableCell align="right" key={field}>{line[field].toFixed(2)}</TableCell>)}{allowRemove && <TableCell><Button color="error" disabled={disabled} onClick={() => setItems(previous => previous.filter((_, i) => i !== index))}>Remove</Button></TableCell>}</TableRow>;
    })}</TableBody></Table></TableContainer><Purchase2PoSummary items={items} />
  </Box>;
}
