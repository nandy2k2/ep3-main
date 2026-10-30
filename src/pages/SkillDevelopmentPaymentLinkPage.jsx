import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import ep1 from '../api/ep1';

let sdkPromise;
function loadSdk() {
  if (window.Cashfree) return Promise.resolve();
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = resolve;
    script.onerror = () => { sdkPromise = null; reject(new Error('Unable to load Cashfree checkout')); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}
export default function SkillDevelopmentPaymentLinkPage() {
  const started = useRef(false);
  const [state, setState] = useState({ busy: true, message: 'Preparing secure payment...', severity: 'info' });
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function run() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          setState({ busy: true, message: 'Verifying payment with Cashfree...', severity: 'info' });
          const { data } = await ep1.post('/api/v2/skill-payment-link/verify', { token });
          setState({ busy: false, message: data.message, severity: data.paid ? 'success' : 'warning', paid: data.paid, accesstill: data.accesstill });
          return;
        }
        const colid = params.get('colid'), regno = params.get('regno'), amount = params.get('amount');
        if (!colid || !regno || !amount) throw new Error('The payment link requires colid, regno and amount.');
        await loadSdk();
        const email = params.get('email') || 'nandy2k2@gmail.com';
        const phone = params.get('phone') || params.get('phonenumber') || '9008168822';
        const { data } = await ep1.post('/api/v2/skill-payment-link/start', { colid, regno, amount, email, phone, origin: window.location.origin });
        window.history.replaceState(null, '', `${window.location.pathname}?token=${encodeURIComponent(data.token)}`);
        setState({ busy: true, message: 'Opening Cashfree checkout...', severity: 'info' });
        await window.Cashfree({ mode: data.mode === 'production' ? 'production' : 'sandbox' }).checkout({ paymentSessionId: data.sessionid, redirectTarget: '_self' });
        setState({ busy: false, message: 'Checkout closed. Check payment status below.', severity: 'info' });
      } catch (error) {
        setState({ busy: false, message: error.response?.data?.message || error.message, severity: 'error' });
      }
    }
    run();
  }, []);
  return <Box sx={{ minHeight: '100vh', bgcolor: '#edf5fa', display: 'grid', placeItems: 'center', p: 2 }}>
    <Paper sx={{ p: 4, width: '100%', maxWidth: 540, boxSizing: 'border-box' }}>
      <Typography variant="h5" gutterBottom>Skill Development payment</Typography>
      {state.busy && <CircularProgress sx={{ my: 2 }} />}
      <Alert severity={state.severity}>{state.message}</Alert>
      {state.accesstill && <Typography sx={{ mt: 2 }}>Access valid until {new Date(state.accesstill).toLocaleString()}</Typography>}
      {!state.busy && !state.paid && new URLSearchParams(window.location.search).has('token') && <Button sx={{ mt: 2 }} onClick={() => window.location.reload()}>Check payment status</Button>}
    </Paper>
  </Box>;
}
