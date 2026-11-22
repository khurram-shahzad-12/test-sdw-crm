import React, { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Doughnut } from 'react-chartjs-2';
import SectionCard, { SectionLabel, SectionTitle } from './SectionCard';
import { buildTooltip, fmtNumber } from './dashboardUtils';

const ActivityByTypeCard = ({ view }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const activityDoughnutData = useMemo(() => ({
        labels: (view?.activityByType || []).map(s => s.name),
        datasets: [{
            data: (view?.activityByType || []).map(s => s.value),
            backgroundColor: (view?.activityByType || []).map(s => s.color),
            borderWidth: isDark ? 3 : 2,
            borderColor: theme.palette.background.paper,
            hoverOffset: 8, hoverBorderWidth: isDark ? 3 : 2,
        }],
    }), [view, theme, isDark]);

    const activityDoughnutOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, cutout: '74%',
        plugins: {
            legend: { display: false },
            tooltip: buildTooltip(theme, isDark, {
                label: (ctx) => `  ${ctx.label}: ${ctx.parsed} activities`,
            }),
        },
    }), [theme, isDark]);

    return (
        <SectionCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1 }}>
                <SectionLabel>CRM Activity</SectionLabel>
                <SectionTitle>By Type</SectionTitle>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}>
                    Calls, emails, meetings, notes
                </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 200, mt: 1 }}>
                <Doughnut data={activityDoughnutData} options={activityDoughnutOptions} />
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none',
                }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {fmtNumber(view?.activityTotal || 0)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                        activities
                    </Typography>
                </Box>
            </Box>
            <Stack spacing={1.15} sx={{ mt: 2 }}>
                {(view?.activityByType || []).map((s) => (
                    <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: 'text.secondary' }}> {s.name} </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 700 }}> {s.value} </Typography>
                    </Box>
                ))}
            </Stack>
        </SectionCard>
    );
};

export default ActivityByTypeCard;