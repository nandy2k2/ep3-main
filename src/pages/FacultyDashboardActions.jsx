import React, { useState } from 'react';
import { Box, Card, CardActionArea, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Assignment, CheckCircle, Close, Description, EditNote, EventAvailable, Mic, ReceiptLong, School, SupervisorAccount, WorkspacePremium } from '@mui/icons-material';
import { persistGlobalSession } from './global1';

export const facultyActions = [
  { title: 'Mark Attendance', subtitle: 'Sectionwise class attendance', path: '/neplmssectionwiseattendance', icon: CheckCircle, guided: false },
  { title: 'Internal Marks Entry', subtitle: 'Assessment components and student marks', path: '/internal-marks-entry', icon: EditNote, guided: true },
  { title: 'Evaluate Answer Books', subtitle: 'Assigned scripts and on-screen marking', path: '/conduct-exam-on-screen-marking', icon: Assignment, guided: true },
  { title: 'Submit Question Paper', subtitle: 'Questions, attachments and submission', path: '/conduct-exam-submit-question-paper', icon: Description, guided: true },
  { title: 'Log Seminar / Workshop', subtitle: 'Seminars and workshops participated', path: '/dashmseminar', icon: Mic, guided: false },
  { title: 'Log FDP / Certification', subtitle: 'Professional development and certifications', path: '/dashmnn244', icon: WorkspacePremium, guided: false },
  { title: 'Log Research Paper', subtitle: 'Journal and conference publications', path: '/dashmpublications', icon: Description, guided: false },
  { title: 'Mentoring Entry', subtitle: 'Mentee interactions and action taken', path: '/mentoring-new-interaction', icon: SupervisorAccount, guided: false },
  { title: 'Exam Duty Claim', subtitle: 'Examiner duties and payment details', path: '/conduct-exam-examiner-payment', icon: ReceiptLong, guided: true },
  { title: 'Apply for Leave', subtitle: 'Leave applications and status', path: '/hrleaveapply', icon: EventAvailable, guided: false }
];

export default function FacultyDashboardActions() {
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const open = action => {
    persistGlobalSession();
    setLoading(true);
    setActive(action);
  };
  return <Box component="section" aria-label="Faculty quick actions" sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <School color="primary" /><Typography variant="h6" fontWeight={700}>Quick actions</Typography>
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 1.5 }}>
      {facultyActions.map(action => {
        const Icon = action.icon;
        const color = action.guided ? '#b85a00' : '#207b4b';
        return <Card key={action.path} variant="outlined" sx={{ borderRadius: 2, borderLeft: `5px solid ${color}`, boxShadow: 'none', minWidth: 0 }}>
          <CardActionArea onClick={() => open(action)} aria-label={action.title} sx={{ p: 2, minHeight: 166, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', transition: 'background-color 150ms', '&:hover': { bgcolor: '#f5f9fc' } }}>
            <Icon sx={{ color, fontSize: 28, mb: 1 }} />
            <Typography fontWeight={700} sx={{ fontSize: 16, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{action.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 1.5 }}>{action.subtitle}</Typography>
            <Chip size="small" label={action.guided ? 'Exam & assessment' : 'Faculty workspace'} sx={{ mt: 'auto', borderRadius: 1, fontWeight: 600, color, bgcolor: action.guided ? '#fff3e8' : '#e8f5ef', maxWidth: '100%' }} />
          </CardActionArea>
        </Card>;
      })}
    </Box>
    <Dialog open={Boolean(active)} onClose={() => setActive(null)} fullScreen={mobile} fullWidth maxWidth="xl" aria-labelledby="faculty-action-title" PaperProps={{ sx: { height: mobile ? '100%' : '92vh', borderRadius: mobile ? 0 : 2 } }}>
      <DialogTitle id="faculty-action-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1 }}>{active?.title}<IconButton aria-label="Close workspace" onClick={() => setActive(null)}><Close /></IconButton></DialogTitle>
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        {active && <Box component="iframe" key={active.path} title={`${active.title} workspace`} src={`${active.path}?embedded=1`} onLoad={() => setLoading(false)} sx={{ width: '100%', height: '100%', border: 0, bgcolor: 'white' }} />}
        {active && loading && <Stack role="status" alignItems="center" justifyContent="center" spacing={2} sx={{ position: 'absolute', inset: 0, bgcolor: 'white', zIndex: 1 }}><CircularProgress /><Typography>Loading {active.title}...</Typography></Stack>}
      </DialogContent>
    </Dialog>
  </Box>;
}
