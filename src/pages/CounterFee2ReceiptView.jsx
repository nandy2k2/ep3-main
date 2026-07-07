import React from "react";
import { Box, Button, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { DataGrid } from "@mui/x-data-grid";

const fmt = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "";

export default function CounterFee2ReceiptView({ receipt, institution }) {
  if (!receipt) return null;
  const items = (receipt.items || []).map((item, index) => ({ ...item, id: `${item.ledgerid || index}-${index}`, sl: index + 1 }));
  const columns = [
    { field: "sl", headerName: "#", width: 60 },
    { field: "feegroup", headerName: "Fee Group", flex: 1, minWidth: 140 },
    { field: "feeitem", headerName: "Fee Item", flex: 1.4, minWidth: 180 },
    { field: "amount", headerName: "Amount", width: 120, valueFormatter: ({ value }) => fmt(value) },
    { field: "previousbalance", headerName: "Previous Balance", width: 150, valueFormatter: ({ value }) => fmt(value) },
    { field: "paidamount", headerName: "Paid", width: 120, valueFormatter: ({ value }) => fmt(value) },
    { field: "newbalance", headerName: "Balance", width: 120, valueFormatter: ({ value }) => fmt(value) }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" className="no-print" sx={{ mb: 1 }}>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print Receipt</Button>
      </Stack>
      <Paper
        id="counter-fee-2-receipt"
        sx={{
          p: 2.5,
          maxWidth: 900,
          mx: "auto",
          color: "#111",
          "@media print": {
            boxShadow: "none",
            width: "190mm",
            maxWidth: "190mm",
            p: 1,
            ".MuiDataGrid-footerContainer, .MuiDataGrid-columnSeparator": { display: "none" }
          }
        }}
      >
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #counter-fee-2-receipt, #counter-fee-2-receipt * { visibility: visible; }
            #counter-fee-2-receipt { position: absolute; left: 0; top: 0; }
            .no-print { display: none !important; }
          }
        `}</style>
        <Stack alignItems="center" spacing={0.5} sx={{ textAlign: "center", mb: 1 }}>
          {institution?.logolink && (
            <Box component="img" src={institution.logolink} alt="logo" sx={{ height: 72, objectFit: "contain" }} />
          )}
          <Typography variant="h5" fontWeight={900}>{institution?.institutionname || receipt.institution || "Institution"}</Typography>
          <Typography variant="body2">{institution?.address || ""}</Typography>
          <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>Counter Fee Receipt</Typography>
        </Stack>

        <Divider sx={{ my: 1.5 }} />
        <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
          <Grid item xs={12} sm={6}><Typography><b>Transaction ID:</b> {receipt.transactionid}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Payment Date:</b> {dateText(receipt.paiddate)}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Reference No:</b> {receipt.referenceNumber || receipt.paydetails || "NA"}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Mode:</b> {receipt.paymode || "NA"}</Typography></Grid>
        </Grid>

        <Box sx={{ border: "1px solid #d7dee8", borderRadius: 1, p: 1.5, mb: 1.5 }}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}><Typography><b>Student:</b> {receipt.student}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Reg No:</b> {receipt.regno}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Email:</b> {receipt.email || "NA"}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Phone:</b> {receipt.phone || "NA"}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Program:</b> {receipt.program || "NA"} {receipt.programcode ? `(${receipt.programcode})` : ""}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Academic Year:</b> {receipt.academicyear || "NA"}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Regulation:</b> {receipt.regulation || "NA"}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Semester:</b> {receipt.semester || "NA"} {receipt.section ? ` | Section ${receipt.section}` : ""}</Typography></Grid>
            <Grid item xs={12}><Typography><b>Address:</b> {receipt.address || "NA"}</Typography></Grid>
          </Grid>
        </Box>

        <DataGrid
          rows={items}
          columns={columns}
          autoHeight
          hideFooter
          disableColumnMenu
          disableRowSelectionOnClick
          sx={{
            border: "1px solid #d7dee8",
            "& .MuiDataGrid-columnHeaders": { background: "#f2f5f9", color: "#111", fontWeight: 800 },
            "& .MuiDataGrid-cell": { color: "#111" }
          }}
        />

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
          <Typography variant="h6" fontWeight={900}>Total Paid: Rs. {fmt(receipt.totalpaid)}</Typography>
        </Stack>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={4}><Typography sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "center" }}>Prepared By</Typography></Grid>
          <Grid item xs={4}><Typography sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "center" }}>Checked By</Typography></Grid>
          <Grid item xs={4}><Typography sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "center" }}>Authorized Signatory</Typography></Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
