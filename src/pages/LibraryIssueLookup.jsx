import React, { useEffect, useRef, useState } from "react";
import { Alert, Autocomplete, Box, CircularProgress, TextField } from "@mui/material";
import ep1 from "../api/ep1";
import global1 from "./global1";

export default function LibraryIssueLookup({ kind, filters = {}, revision = 0, value, onChange }) {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activated, setActivated] = useState(false);
  const sequence = useRef(0);
  const filterKey = JSON.stringify(filters);
  const isBook = kind === "books";
  useEffect(() => {
    const request = ++sequence.current;
    const controller = new AbortController();
    setRows([]);
    setError("");
    setLoading(false);
    if (!activated && !input.trim() && !revision) return () => controller.abort();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await ep1.get(`/api/v2/librarynew/${kind}`, {
          params: { ...JSON.parse(filterKey), colid: global1.colid, user: global1.user, role: global1.role, search: input.trim(), limit: 30, compact: "yes" },
          signal: controller.signal
        });
        if (request === sequence.current && !controller.signal.aborted) setRows(response.data?.data || []);
      } catch (err) {
        if (!controller.signal.aborted && request === sequence.current) setError(err.response?.data?.message || err.message || "Unable to search");
      } finally {
        if (request === sequence.current && !controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, filterKey, input, revision, activated]);
  return <Box sx={{ mt: 2 }}>
    {error && <Alert severity="error">{error}</Alert>}
    <Autocomplete options={rows} value={value} loading={loading} filterOptions={options => options} onOpen={() => setActivated(true)}
      isOptionEqualToValue={(option, selected) => option._id === selected._id}
      getOptionDisabled={row => isBook && !/^Available$/i.test(String(row.status || "").trim())}
      onChange={(_, selected) => onChange(selected)}
      onInputChange={(_, text, reason) => { if (reason === "input" || reason === "clear") setInput(text); }}
      getOptionLabel={row => isBook ? `${row.accessionno || ""} - ${row.title || ""} - ${row.status || "Status not set"}` : `${row.name || ""} - ${row.regno || ""} - ${row.email || ""}`}
      noOptionsText={activated || input.trim() || revision ? (Object.keys(filters).length ? "No records match the active filters. Clear or change the filters and try again." : "No matching records") : "Type to search"}
      renderInput={params => <TextField {...params} label={isBook ? "Select or scan accession no" : "Select student"}
        InputProps={{ ...params.InputProps, endAdornment: <>{loading && <CircularProgress size={18} />}{params.InputProps.endAdornment}</> }} />} />
  </Box>;
}
