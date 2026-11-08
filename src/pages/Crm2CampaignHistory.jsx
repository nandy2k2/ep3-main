import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ep1 from '../api/ep1';
import global1 from './global1';

export const campaignRoot = '/api/v2/crm2-campaigns';
export const campaignAuth = () => ({ headers: { Authorization: `Bearer ${global1.token}` } });
export const campaignRowId = row => row._id;
export const campaignSlots = { toolbar: GridToolbar };
export const campaignDate = (field, headerName) => ({ field, headerName, type: 'dateTime', width: 195, valueGetter: ({ value }) => value ? new Date(value) : null });
const column = (field, headerName, width = 150) => ({ field, headerName, width });
export const deliveryColumns = [column('name', 'Lead', 175), column('address', 'Recipient', 220), column('mode', 'Channel'), column('status', 'Send status'), campaignDate('sentat', 'Sent at'), { ...column('engagement', 'Opened'), valueGetter: ({ row }) => !row.tracked || row.status !== 'Sent' ? 'Unavailable' : row.openedat ? 'Opened' : 'Not recorded' }, campaignDate('openedat', 'Opened at'), campaignDate('clickedat', 'Clicked at'), column('error', 'Send details', 260)];
const historyColumns = [column('campaignName', 'Campaign', 210), ...deliveryColumns.filter(col => col.field !== 'name')];

export default function Crm2CampaignHistory({ leadId }) {
  const [rows, setRows] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    ep1.get(`${campaignRoot}/lead/${encodeURIComponent(leadId)}/history`, { ...campaignAuth(), signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setRows(data.data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.message || err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [leadId]);
  return <>{error && <Alert severity="error">{error}</Alert>}<Box sx={{ height: 420 }}><DataGrid rows={rows} columns={historyColumns} getRowId={campaignRowId} slots={campaignSlots} loading={loading} /></Box></>;
}
