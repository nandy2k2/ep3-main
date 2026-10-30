import React, { useState } from "react";
import { Alert, Button, Paper, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { ContentCopy, OpenInNew } from "@mui/icons-material";
import global1 from "./global1";
export const applicantExamLoginUrl = (origin, colid) => `${origin}/admission-applicant-exam${colid ? `?colid=${encodeURIComponent(colid)}` : ""}`;
export default function AdmissionExamApplicantLink() {
  const [message, setMessage] = useState("");
  const url = applicantExamLoginUrl(window.location.origin, global1.colid);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setMessage("Applicant exam login link copied."); }
    catch { setMessage("Unable to copy automatically. Select the login link above to copy it."); }
  };
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1.5}>
    <Typography variant="h6">Applicant exam login</Typography>
    <TextField fullWidth size="small" label="Applicant exam login link" value={url} InputProps={{ readOnly: true }} onFocus={event => event.target.select()} />
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" component="a" href={url} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNew />}>Open applicant login</Button><Button variant="outlined" startIcon={<ContentCopy />} onClick={copy}>Copy login link</Button></Stack>
    <Snackbar open={Boolean(message)} autoHideDuration={6000} anchorOrigin={{ vertical: "top", horizontal: "center" }} onClose={() => setMessage("")}><Alert variant="filled" severity={message.startsWith("Unable") ? "warning" : "success"} onClose={() => setMessage("")}>{message}</Alert></Snackbar>
  </Stack></Paper>;
}
