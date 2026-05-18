import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { ArrowBack, Payment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ep1 from "../api/ep1";
import global1 from "./global1";

const emptyForm = {
  student: "",
  regno: "",
  feeitem: "",
  amount: "",
  type: "Student",
  email: "",
  phone: "",
  description: ""
};

const EasebuzzPaymentProcessPage = () => {
  const navigate = useNavigate();
  const colid = useMemo(() => global1.colid, []);
  const currentUser = useMemo(() => global1.user, []);
  const currentName = useMemo(() => global1.name || global1.user || "NA", []);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const payNow = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await ep1.post("/api/v2/easebuzzpayment/initiate", {
        ...form,
        colid,
        user: currentUser,
        name: currentName
      });
      const paymentUrl = res.data?.data?.paymenturl || res.data?.paymenturl;
      setMessage(`Payment initiated. Reference no: ${res.data.data?.refno || ""}`);
      if (paymentUrl) {
        window.location.assign(paymentUrl);
        return;
      }
      setError("Payment was initiated but payment URL was not returned.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Easebuzz payment processing</Typography>
          <Typography variant="body2" color="text.secondary">Enter payment details and proceed to Easebuzz.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/dashdashfacnew")}>Back to dashboard</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
          <TextField size="small" label="Student" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required />
          <TextField size="small" label="Reg no" value={form.regno} onChange={(e) => setForm({ ...form, regno: e.target.value })} required />
          <TextField size="small" label="Fee item" value={form.feeitem} onChange={(e) => setForm({ ...form, feeitem: e.target.value })} required />
          <TextField size="small" label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="Student">Student</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField size="small" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField size="small" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Payment />}
            disabled={loading || !form.student || !form.regno || !form.feeitem || !form.amount}
            onClick={payNow}
          >
            Pay
          </Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Clear</Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default EasebuzzPaymentProcessPage;
