import React, { useEffect, useState } from 'react';
import { Alert, Button, LinearProgress, Paper, Snackbar, Stack, TextField } from '@mui/material';
import { Save } from '@mui/icons-material';
import MenuPageShell from './MenuPageShell';
import ep1 from '../api/ep1';
import { campaignAuth, campaignRoot } from './Crm2CampaignHistory';

const endpoint = `${campaignRoot}/tracking-settings`;
const messageOf = err => err.response?.data?.message || err.message;

function TrackingSettingsEditor() {
  const [url, setUrl] = useState(''), [ready, setReady] = useState(false), [busy, setBusy] = useState(true), [notice, setNotice] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    ep1.get(endpoint, { ...campaignAuth(), signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setUrl(data.publicUrl || ''); setReady(true); }
    }).catch(err => { if (!controller.signal.aborted) setNotice({ text: messageOf(err), severity: 'error' }); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  const save = async event => {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      const { data } = await ep1.post(endpoint, { publicUrl: url }, campaignAuth());
      setUrl(data.publicUrl);
      setNotice({ text: data.publicUrl ? 'Email tracking configuration saved' : 'Email tracking disabled for future sends', severity: 'success' });
    } catch (err) { setNotice({ text: messageOf(err), severity: 'error' }); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2} sx={{ p: { xs: 1, md: 2 }, maxWidth: 680 }}>
    {busy && <LinearProgress />}
    <Paper variant="outlined" component="form" onSubmit={save} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField fullWidth label="Public HTTPS backend URL" type="url" value={url} disabled={!ready || busy} onChange={event => setUrl(event.target.value)} placeholder="https://backend.example.com" helperText="Leave blank to disable tracking for future sends." />
        <Button type="submit" variant="contained" startIcon={<Save />} disabled={!ready || busy} sx={{ alignSelf: 'flex-start' }}>Save</Button>
      </Stack>
    </Paper>
    <Snackbar open={!!notice} autoHideDuration={7000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert variant="filled" severity={notice?.severity || 'success'} onClose={() => setNotice(null)}>{notice?.text}</Alert></Snackbar>
  </Stack>;
}

export default function EmailTrackingConfigurationPage() {
  return <MenuPageShell title="Email tracking configuration"><TrackingSettingsEditor /></MenuPageShell>;
}
