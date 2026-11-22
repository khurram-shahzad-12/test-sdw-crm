import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { NorthEast, SouthEast } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

const KpiCardRoot = styled(Card)(({ theme, accent }) => ({
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.07) : theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.palette.mode === 'dark' ? `0 1px 3px ${alpha('#000', 0.3)}` : `0 1px 3px ${alpha('#000', 0.04)}`,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.palette.mode === 'dark'
            ? `0 12px 28px ${alpha('#000', 0.5)}, 0 0 0 1px ${alpha(accent || theme.palette.primary.main, 0.3)}`
            : `0 12px 28px ${alpha(theme.palette.primary.main, 0.10)}, 0 0 0 1px ${alpha(accent || theme.palette.primary.main, 0.25)}`,
        borderColor: alpha(accent || theme.palette.primary.main, 0.35),
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${accent || theme.palette.primary.main} 0%, ${alpha(accent || theme.palette.primary.main, 0.4)} 100%)`,
    },
}));

const IconBubble = styled(Box)(({ theme, color }) => ({
    width: 42, height: 42, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: alpha(color, theme.palette.mode === 'dark' ? 0.16 : 0.10),
    color: color,
    border: `1px solid ${alpha(color, theme.palette.mode === 'dark' ? 0.25 : 0.18)}`,
    '& svg': { fontSize: 22 },
}));

const TrendChip = styled(Chip)(({ theme, trend }) => ({
    height: 24, fontSize: '0.72rem', fontWeight: 700, borderRadius: 6,
    letterSpacing: '0.01em',
    backgroundColor: alpha(
        trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
        theme.palette.mode === 'dark' ? 0.16 : 0.10
    ),
    color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
    border: `1px solid ${alpha(trend === 'up' ? theme.palette.success.main : theme.palette.error.main, 0.25)}`,
    '& .MuiChip-icon': { color: 'inherit', fontSize: 13, marginLeft: 6 },
    '& .MuiChip-label': { paddingLeft: 4, paddingRight: 8 },
}));

const Sparkline = ({ data, color }) => {
    const chartData = useMemo(() => ({
        labels: data.map((_, i) => i),
        datasets: [{
            data,
            borderColor: color,
            backgroundColor: (ctx) => {
                const { chart } = ctx;
                const { ctx: c, chartArea } = chart;
                if (!chartArea) return alpha(color, 0.2);
                const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                g.addColorStop(0, alpha(color, 0.35));
                g.addColorStop(1, alpha(color, 0));
                return g;
            },
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.75,
        }],
    }), [data, color]);

    const chartOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        animation: { duration: 500 },
    }), []);

    return (
        <Box sx={{ height: 40, mt: 1.5, mx: -1 }}> <Line data={chartData} options={chartOptions} /> </Box>
    );
};

const KpiCard = ({ kpi }) => (
    <KpiCardRoot accent={kpi.accent}>
        <CardContent sx={{ p: 2.25, pb: '16px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <IconBubble color={kpi.accent}>{kpi.icon}</IconBubble>
                {kpi.change != null && (
                    <TrendChip
                        trend={kpi.trend}
                        icon={kpi.trend === 'up'
                            ? <NorthEast sx={{ fontSize: '12px !important' }} />
                            : <SouthEast sx={{ fontSize: '12px !important' }} />}
                        label={kpi.change}
                        size="small"
                    />
                )}
            </Box>
            <Typography
                sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'text.primary', mt: 1.75, }}
            >
                {kpi.value}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary' }}> {kpi.title} </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 500 }}>
                    {kpi.sub}
                </Typography>
            </Box>
            {kpi.spark ? <Sparkline data={kpi.spark} color={kpi.accent} /> : <Box sx={{ height: 40, mt: 1.5, mx: -1 }} />}
        </CardContent>
    </KpiCardRoot>
);

export default KpiCard;