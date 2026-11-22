import React, { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Doughnut } from 'react-chartjs-2';
import SectionCard, { SectionLabel, SectionTitle } from './SectionCard';
import { buildTooltip, fmtNumber } from './dashboardUtils';

const OrdersByStatusCard = ({ view }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const ordersDoughnutData = useMemo(() => ({
        labels: (view?.ordersByStatus || []).map(s => s.name),
        datasets: [{
            data: (view?.ordersByStatus || []).map(s => s.value),
            backgroundColor: (view?.ordersByStatus || []).map(s => s.color),
            borderWidth: isDark ? 3 : 2,
            borderColor: theme.palette.background.paper,
            hoverOffset: 8, hoverBorderWidth: isDark ? 3 : 2,
        }],
    }), [view, theme, isDark]);

    const ordersDoughnutOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, cutout: '74%',
        plugins: {
            legend: { display: false },
            tooltip: buildTooltip(theme, isDark, {
                label: (ctx) => {
                    const row = (view?.ordersByStatus || [])[ctx.dataIndex];
                    return `  ${ctx.label}: ${row?.pct ?? 0}% (${ctx.parsed})`;
                },
            }),
        },
    }), [theme, isDark, view]);

    return (
        <SectionCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1 }}>
                <SectionLabel>Orders</SectionLabel>
                <SectionTitle>By Status</SectionTitle>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}>
                    This period's distribution
                </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 200, mt: 1 }}>
                <Doughnut data={ordersDoughnutData} options={ordersDoughnutOptions} />
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none',
                }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {fmtNumber(view?.ordersTotal || 0)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                        orders
                    </Typography>
                </Box>
            </Box>
            <Stack spacing={1.15} sx={{ mt: 2 }}>
                {(view?.ordersByStatus || []).map((s) => (
                    <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: 'text.secondary' }}>
                                {s.name}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="baseline">
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 700 }}>
                                {s.pct}%
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 500 }}>
                                {fmtNumber(s.value)}
                            </Typography>
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </SectionCard>
    );
};

export default OrdersByStatusCard;