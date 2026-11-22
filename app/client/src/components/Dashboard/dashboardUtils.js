import { alpha } from '@mui/material/styles';

const CURRENCY_FMT = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2, });
const NUMBER_FMT = new Intl.NumberFormat('en-GB');
export const fmtCurrency = (v) => CURRENCY_FMT.format(Number(v) || 0);
export const fmtNumber = (v) => NUMBER_FMT.format(Number(v) || 0);

export const fmtChange = (change) => {
    if (change === null || change === undefined) return 'N/A';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
};

export const safeTrend = (trend) => (trend === 'down' ? 'down' : 'up');

export const relativeTime = (iso) => {
    if (!iso) return '';
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

export const sparkFromSeries = (series, fallback = 12) => {
    if (Array.isArray(series) && series.length > 0) return series.map(Number);
    return Array.from({ length: fallback }, (_, i) => i);
};

export const buildTooltip = (theme, isDark, formatter) => ({
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    titleColor: theme.palette.text.primary,
    bodyColor: theme.palette.text.secondary,
    borderColor: theme.palette.divider,
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 6,
    titleFont: { size: 12, weight: '700' },
    bodyFont: { size: 12, weight: '500' },
    callbacks: formatter,
});

export const buildAxis = (theme) => ({
    grid: { color: alpha(theme.palette.divider, 0.5), drawBorder: false },
    border: { display: false },
    ticks: {
        color: theme.palette.text.secondary,
        font: { size: 11, weight: '500' },
        padding: 8,
    },
});