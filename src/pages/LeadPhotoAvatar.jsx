import React from 'react';
import { Avatar } from '@mui/material';
import { Person } from '@mui/icons-material';

export default function LeadPhotoAvatar({ photo, name, size = 52 }) {
  const src = /^https?:\/\//i.test(photo || '') ? photo : undefined;
  return <Avatar src={src} alt={name ? `${name} profile photo` : 'Lead profile photo'} imgProps={{ referrerPolicy: 'no-referrer' }} sx={{ width: size, height: size, flexShrink: 0, bgcolor: 'action.selected', color: 'text.secondary' }}><Person /></Avatar>;
}
