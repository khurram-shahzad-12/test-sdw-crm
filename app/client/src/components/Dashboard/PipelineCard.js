import React, { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Bar } from 'react-chartjs-2';
import SectionCard, { SectionLabel, SectionTitle } from './SectionCard';
import { buildTooltip, buildAxis } from './dashboardUtils';


const PipelineCard = ({ view }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const pipelineBarData = useMemo(() => ({
        labels: view?.pipelineLabels || [],
        datasets: [
            {
                label: 'This Period',
                data: view?.pipelineCurrent || [],
                backgroundColor: (view?.pipelineCurrent || []).map((_, i) => {
                    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#10b981'];
                    return alpha(colors[i % colors.length], 0.85);
                }),
                hoverBackgroundColor: (view?.pipelineCurrent || []).map((_, i) => {
                    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#10b981'];
                    return colors[i % colors.length];
                }),
                borderRadius: 6, borderSkipped: false,
                barPercentage: 0.65, categoryPercentage: 0.7,
            },
            {
                label: 'Same Period Last Year',
                data: view?.pipelineLast || [],
                backgroundColor: isDark ? alpha('#fff', 0.10) : alpha('#000', 0.08),
                hoverBackgroundColor: isDark ? alpha('#fff', 0.18) : alpha('#000', 0.14),
                borderRadius: 6, borderSkipped: false,
                barPercentage: 0.65, categoryPercentage: 0.7,
            },
        ],
    }), [view, isDark]);

    const pipelineBarOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: buildTooltip(theme, isDark, {
                label: (ctx) => `  ${ctx.dataset.label}: ${ctx.parsed.y} opportunities`,
            }),
        },
        scales: {
            x: {
                grid: { display: false }, border: { display: false },
                ticks: { color: theme.palette.text.secondary, font: { size: 11, weight: '600' }, padding: 6 },
            },
            y: { ...buildAxis(theme), beginAtZero: true },
        },
    }), [theme, isDark]);
    return (
        <SectionCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                <Box>
                    <SectionLabel>CRM Pipeline</SectionLabel>
                    <SectionTitle>Opportunity Pipeline by Stage</SectionTitle>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}>
                        Current vs same period last year
                    </Typography>
                </Box>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 0.5, sm: 2 }}
                    alignItems={{ xs: 'flex-end', sm: 'center' }}
                >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: 1, backgroundColor: alpha(theme.palette.primary.main, 0.85) }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>This Period</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: 1, backgroundColor: isDark ? alpha('#fff', 0.10) : alpha('#000', 0.08) }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>Same Period Last Year</Typography>
                    </Stack>
                </Stack>
            </Box>
            <Box sx={{ height: 280 }}>
                <Bar data={pipelineBarData} options={pipelineBarOptions} />
            </Box>
        </SectionCard>
    );
}

export default PipelineCard

