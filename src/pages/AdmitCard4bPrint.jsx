import React, { useRef, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { Print } from '@mui/icons-material';
import { admitCard4aMarkup, admitCard4Styles, admitCard4aStyles } from './AdmitCard4Print';

export function admitCard4bDocument(tickets, renderCard = admitCard4aMarkup, extraStyles = '', variant = '4b') {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Admit card ${variant}</title><style>
    ${admitCard4Styles}${admitCard4aStyles}
    @page{size:A4 portrait;margin:10mm}
    html,body{margin:0;padding:0;background:white}
    .admit4b-page{width:190mm;height:276mm;position:relative;overflow:hidden;margin:0 auto;break-after:page;page-break-after:always}
    .admit4b-page:last-child{break-after:auto;page-break-after:auto}
    .admit4b-page .admit4-card{width:186mm;max-width:none;margin:0;position:absolute;left:50%;top:0;transform-origin:top center;break-after:auto;page-break-after:auto}
    .admit4b-page .admit4-header{min-height:28mm}
    .admit4b-page .admit4-institution h2{font-size:12pt}
    .admit4b-page .admit4-profile{margin-bottom:3mm}
    .admit4b-page .admit4-program{margin:2mm 0 3mm}
    .admit4b-page .admit4-table{margin-bottom:3mm}
    .admit4b-page .paper-row{height:7mm}
    .admit4b-page .admit4-controller{height:28mm;padding:1mm 2mm 2mm!important}
    .admit4b-page .admit4-coe-signature{height:20mm;width:65mm;max-width:65mm;display:inline-block;object-fit:contain}
    @media screen{.admit4b-page{border-bottom:1px solid #ccc;margin-bottom:8mm}}
    ${extraStyles}
  </style></head><body>${tickets.map(ticket => `<section class="admit4b-page">${renderCard(ticket.ticket || ticket)}</section>`).join('')}
  <script>
    function fitCards(){document.querySelectorAll('.admit4b-page').forEach(page=>{
      const card=page.firstElementChild;
      const scale=Math.min(1,(page.clientHeight-2)/card.scrollHeight,(page.clientWidth-2)/card.scrollWidth);
      card.style.transform='translateX(-50%) scale('+scale+')';
    });}
    window.fitCards=fitCards;
    window.addEventListener('load',fitCards);
    window.addEventListener('beforeprint',fitCards);
    document.fonts.ready.then(fitCards);
  </script></body></html>`;
}
export default function AdmitCard4bPrint({ tickets, variant = '4b', renderCard = admitCard4aMarkup, extraStyles = '' }) {
  const frame = useRef(null);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  if (!tickets.length) return null;
  const print = async () => {
    setPrinting(true); setError('');
    try {
      const win = frame.current.contentWindow;
      await win.document.fonts?.ready;
      await Promise.all(Array.from(win.document.images).map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 10000);
      })));
      win.fitCards?.(); win.focus(); win.print();
    } catch (err) { setError('Unable to print. Please reload the preview and try again.'); }
    finally { setPrinting(false); }
  };
  return <Stack spacing={2}>
    <Button startIcon={<Print />} disabled={printing} onClick={print}>Print Admit card {variant}</Button>
    {error && <Alert severity="error">{error}</Alert>}
    <iframe ref={frame} title={`Admit card ${variant} print preview`} srcDoc={admitCard4bDocument(tickets, renderCard, extraStyles, variant)} style={{ width: '100%', height: '80vh', border: '1px solid #ccc', background: 'white' }} />
  </Stack>;
}
