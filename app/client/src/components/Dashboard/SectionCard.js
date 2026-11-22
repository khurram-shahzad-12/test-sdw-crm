import React from 'react';
import { Paper, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

const SectionCardRoot = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.75),
    borderRadius: 14,
    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.07) : theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.palette.mode === 'dark'
        ? `0 1px 3px ${alpha('#000', 0.3)}, 0 1px 2px ${alpha('#000', 0.2)}`
        : `0 1px 3px ${alpha('#000', 0.04)}, 0 1px 2px ${alpha('#000', 0.03)}`,
    transition: 'all 0.2s ease',
}));

export const SectionLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: theme.palette.text.disabled,
    lineHeight: 1, marginBottom: 6,
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em',
    color: theme.palette.text.primary, lineHeight: 1.25,
}));

const SectionCard = ({ children, ...props }) => (
    <SectionCardRoot {...props}>{children}</SectionCardRoot>
);

export default SectionCard;