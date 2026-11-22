import React, { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import SectionCard, { SectionLabel, SectionTitle } from './SectionCard';
import { buildTooltip, buildAxis, fmtCurrency } from './dashboardUtils';

const SalesVsPurchaseChart = ({ view }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const salesPurchaseData = useMemo(() => ({
        labels: view?.svpLabels || [],
        datasets: [
            {
                label: 'Sales',
                data: view?.salesValues || [],
                borderColor: '#10b981',
                backgroundColor: (ctx) => {
                    const { chart } = ctx;
                    const { ctx: c, chartArea } = chart;
                    if (!chartArea) return alpha('#10b981', 0.2);
                    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g.addColorStop(0, alpha('#10b981', 0.35));
                    g.addColorStop(1, alpha('#10b981', 0));
                    return g;
                },
                fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: theme.palette.background.paper,
                pointHoverBorderWidth: 2.5, borderWidth: 2.5,
            },
            {
                label: 'Purchases',
                data: view?.purchaseValues || [],
                borderColor: '#3b82f6', backgroundColor: 'transparent', fill: false,
                tension: 0.4, pointRadius: 0, pointHoverRadius: 6,
                pointHoverBackgroundColor: '#3b82f6',
                pointHoverBorderColor: theme.palette.background.paper,
                pointHoverBorderWidth: 2.5, borderWidth: 2.5,
            },
        ],
    }), [view, theme]);

    const salesPurchaseOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: buildTooltip(theme, isDark, {
                label: (ctx) => `  ${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}`,
            }),
        },
        scales: {
            x: {
                grid: { display: false }, border: { display: false },
                ticks: { color: theme.palette.text.secondary, font: { size: 11, weight: '500' }, padding: 8 },
            },
            y: {
                ...buildAxis(theme),
                ticks: {
                    color: theme.palette.text.secondary, font: { size: 11, weight: '500' },
                    callback: (v) => `$${v / 1000}k`, padding: 8,
                },
            },
        },
    }), [theme, isDark]);

    return (
        <SectionCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                <Box>
                    <SectionLabel>Financial</SectionLabel>
                    <SectionTitle>Sales vs Purchase</SectionTitle>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}>
                        Monthly comparison — 7 months
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} alignItems={{ xs: 'flex-end', sm: 'center' }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: `0 0 0 3px ${alpha('#10b981', 0.15)}` }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>Sales</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: `0 0 0 3px ${alpha('#3b82f6', 0.15)}` }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>Purchases</Typography>
                    </Stack>
                </Stack>
            </Box>
            <Box sx={{ height: 290 }}>
                <Line data={salesPurchaseData} options={salesPurchaseOptions} />
            </Box>
        </SectionCard>
    );
};

export default SalesVsPurchaseChart;