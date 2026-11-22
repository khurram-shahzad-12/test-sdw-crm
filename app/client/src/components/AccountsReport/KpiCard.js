import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export const fmt = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtCount = (n) => Number(n || 0).toLocaleString('en-GB');
export const isCreditMode = (m) => {
  const s = String(m || '').toLowerCase().replace(/[\s_\-/]+/g, '');
  return s.includes('credit') || s === 'cn' || s === 'cr' || s === 'c/n';
};

const KpiCard = ({ icon, label, value, accent }) => (
  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
    <CardContent sx={{ pb: '16px !important' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }} noWrap>{value}</Typography>
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: accent + '.50', color: accent + '.main', display: 'flex', flexShrink: 0 }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default KpiCard;