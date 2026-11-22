import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Paper, Typography, Card, CardContent, Avatar, Chip, LinearProgress, Button, IconButton, Tooltip, Divider, Stack,
    List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Menu, MenuItem, Skeleton
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import {
    People, LocalShipping, Warning, CheckCircle, MoreVert, ArrowForward, AccessTime, ErrorOutline,
    NorthEast, SouthEast, FiberManualRecord, Phone, Email, Event, StickyNote2, PersonAdd, Work, EmojiEvents, ShoppingCart, Inventory2, Receipt,
    AccountBalance, Storefront, Assessment, CompareArrows, CurrencyPound
} from '@mui/icons-material';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, RadialLinearScale, Title, Tooltip as ChartTooltipJS, Legend, Filler,
} from 'chart.js';
import { fmtCurrency, fmtNumber, fmtChange, safeTrend, relativeTime, sparkFromSeries, buildTooltip, buildAxis, } from './dashboardUtils';
import axiosDefault from '../../components/axiosDefault/axiosDefault';
import displaySnackState from '../../components/customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../../components/customisedSnackBar/CustomisedSnackBar';
import { defaultSnackState } from '../../components/formFunctions/FormFunctions';
import KpiCard from './KpiCard';
import SectionCard, { SectionLabel, SectionTitle } from './SectionCard';
import OrdersByStatusCard from './OrdersByStatusCard';
import SalesVsPurchaseChart from './SalesVsPurchaseChart';
import PipelineCard from './PipelineCard';
import ActivityByTypeCard from './ActivityByTypeCard';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, ChartTooltipJS, Legend, Filler,);

const StatusDot = styled(FiberManualRecord)(({ theme, color }) => ({
    fontSize: 8, color: color, marginRight: 6,
    filter: `drop-shadow(0 0 4px ${alpha(color, 0.5)})`,
}));

const activityIcon = (a) => {
    const t = String(a?.type || '').toLowerCase();
    const title = String(a?.title || a?.subject || '').toLowerCase();
    if (t === 'call') return { color: '#3b82f6', icon: <Phone sx={{ fontSize: 15 }} /> };
    if (t === 'email') return { color: '#8b5cf6', icon: <Email sx={{ fontSize: 15 }} /> };
    if (t === 'meeting') return { color: '#10b981', icon: <Event sx={{ fontSize: 15 }} /> };
    if (t === 'note') return { color: '#f59e0b', icon: <StickyNote2 sx={{ fontSize: 15 }} /> };
    if (title.includes('invoice') || title.includes('paid')) return { color: '#10b981', icon: <CheckCircle sx={{ fontSize: 15 }} /> };
    if (title.includes('route') || title.includes('dispatch')) return { color: '#3b82f6', icon: <LocalShipping sx={{ fontSize: 15 }} /> };
    if (title.includes('stock')) return { color: '#f59e0b', icon: <Warning sx={{ fontSize: 15 }} /> };
    if (title.includes('customer')) return { color: '#ec4899', icon: <People sx={{ fontSize: 15 }} /> };
    return { color: '#64748b', icon: <Work sx={{ fontSize: 15 }} /> };
};

const KPI_ICONS = {
    revenue: { icon: <CurrencyPound />, accent: '#10b981', title: 'Total Revenue' },
    purchases: { icon: <ShoppingCart />, accent: '#3b82f6', title: 'Purchase Value' },
    orders: { icon: <Receipt />, accent: '#8b5cf6', title: 'Active Orders' },
    outstanding: { icon: <AccountBalance />, accent: '#f59e0b', title: 'Outstanding' },
};
const SECONDARY_ICONS = {
    new_leads: { icon: <PersonAdd />, accent: '#06b6d4', title: 'New Leads', sub: 'CRM' },
    customers: { icon: <Storefront />, accent: '#ec4899', title: 'Customers', sub: 'active' },
    won_this_month: { icon: <EmojiEvents />, accent: '#22c55e', title: 'Won This Month', sub: 'closed Won' },
    inventory_items: { icon: <Inventory2 />, accent: '#f43f5e', title: 'Inventory Items', sub: 'SKUs tracked' },
};

const DashboardView = () => {
    const theme = useTheme();
    const axios = axiosDefault();
    const [range, setRange] = useState('this_month');
    const [rangeAnchor, setRangeAnchor] = useState(null);
    const [data, setData] = useState(null);
    const [sendingData, setSendingData] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);

    const fetchDashboard = useCallback(async (selectedRange = range) => {
        setSendingData(true);
        try {
            const resp = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/dashboard?range=${selectedRange}`);
            setData(resp.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            displaySnackState(
                `Failed to load dashboard - ${error.response ? error.response.data : error.message}`, 'error', setSnackState);
        } finally { setSendingData(false); }
    }, [axios, range]);
    useEffect(() => { fetchDashboard(range); }, [range]);

    const view = useMemo(() => {
        if (!data) return null;
        const { kpis, secondary_kpis, sales_vs_purchase, orders_by_status, pipeline, activity_by_type, year_comparison, top_products, inventory_alerts, top_customers, recent_activity } = data;
        const kpiList = [
            { key: 'revenue', ...KPI_ICONS.revenue, m: kpis.revenue },
            { key: 'purchases', ...KPI_ICONS.purchases, m: kpis.purchases },
            { key: 'orders', ...KPI_ICONS.orders, m: kpis.active_orders },
            { key: 'outstanding', ...KPI_ICONS.outstanding, m: kpis.outstanding },
        ].map((k) => {
            const isOutstanding = k.key === 'outstanding';
            return {
                title: k.title,
                value: k.key === 'orders' ? fmtNumber(k.m.value) : fmtCurrency(k.m.value),
                change: isOutstanding ? null : fmtChange(k.m.change),
                trend: isOutstanding ? null : safeTrend(k.m.trend),
                icon: k.icon,
                accent: k.accent,
                sub: isOutstanding ? 'total balance due' : 'vs same period last year',
                spark: isOutstanding ? null : sparkFromSeries(k.key === 'revenue' ? sales_vs_purchase?.sales : k.key === 'purchases' ? sales_vs_purchase?.purchases : null),
            };
        });

        const sk = secondary_kpis || {};
        const secondaryList = [
            { key: 'new_leads', ...SECONDARY_ICONS.new_leads, m: sk.new_leads },
            { key: 'customers', ...SECONDARY_ICONS.customers, m: sk.customers },
            { key: 'won_this_month', ...SECONDARY_ICONS.won_this_month, m: sk.won_this_month },
            { key: 'inventory_items', ...SECONDARY_ICONS.inventory_items, m: sk.inventory_items },
        ].map((k) => ({
            title: k.title,
            value: fmtNumber(k.m?.value),
            change: fmtChange(k.m?.change),
            trend: safeTrend((k.m?.change ?? 0) >= 0 ? 'up' : 'down'),
            icon: k.icon,
            accent: k.accent,
            sub: k.sub,
        }));

        const svp = sales_vs_purchase || { labels: [], sales: [], purchases: [] };
        const svpLabels = (svp.labels || []).map((l) => {
            const m = /^(\d{4})-(\d{2})$/.exec(l);
            if (!m) return l;
            const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
            return d.toLocaleString('en-US', { month: 'short' });
        });

        const obStatus = (orders_by_status || []).map((s) => ({ name: s.name, value: Number(s.value) || 0, color: s.color, }));
        const ordersTotal = obStatus.reduce((a, b) => a + b.value, 0);
        const obStatusPct = obStatus.map((s) => ({
            ...s,
            pct: ordersTotal > 0 ? + ((s.value / ordersTotal) * 100).toFixed(1) : 0,
        }));
        const pipe = pipeline || { labels: [], current: [], last: [] };
        const actType = (activity_by_type || []).map((a) => ({ name: a.name, value: a.value, color: a.color, }));
        const actTotal = actType.reduce((a, b) => a + (Number(b.value) || 0), 0);
        const products = (top_products || []).map((p, i) => {
            const palette = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899'];
            return {
                name: p.name,
                sold: p.sold,
                stock: Math.max(15, 100 - i * 15),
                color: palette[i % palette.length],
            };
        });
        const alerts = (inventory_alerts || []).map((a, i) => ({
            id: a.id || i,
            name: a.name,
            sku: a.sku,
            qty: a.qty,
            threshold: a.threshold,
            severity: a.severity,
            unit: a.unit,
        }));

        const feed = (recent_activity || []).map((a, i) => {
            const { color, icon } = activityIcon(a);
            return {
                id: a._id || a.id || i,
                title: a.title || a.subject || a.description || a.type || 'Activity',
                meta: a.meta || [a.entity, a.detail].filter(Boolean).join(' • ') || '',
                time: relativeTime(a.createdAt || a.updatedAt),
                color, icon,
            };
        });
        const customers = (top_customers || []).map((c) => ({
            name: c.name,
            orders: c.orders,
            revenue: fmtCurrency(c.revenue),
            color: c.color || '#ec4899',
        }));
        const rows = (year_comparison || []).map((r) => {
            const fmt = r.format === 'currency' ? fmtCurrency : fmtNumber;
            return {
                metric: r.metric,
                thisMonth: fmt(r.thisPeriod),
                lastMonth: fmt(r.lastMonth),
                lastYear: fmt(r.lastYear),
                change: fmtChange(r.change),
                trend: safeTrend(r.trend),
            };
        });
        return {
            kpis: kpiList, secondaryKpis: secondaryList,
            svpLabels, salesValues: svp.sales || [], purchaseValues: svp.purchases || [],
            ordersByStatus: obStatusPct, ordersTotal,
            pipelineLabels: pipe.labels || [],
            pipelineCurrent: pipe.current || [],
            pipelineLast: pipe.last || [],
            activityByType: actType, activityTotal: actTotal,
            topProducts: products, inventoryAlerts: alerts,
            recentActivities: feed, topCustomers: customers,
            comparisonRows: rows,
        };
    }, [data]);

    if (sendingData && !view) {
        return (
            <Box>
                <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3.5 }}>
                    <Box>
                        <Skeleton width={140} height={20} />
                        <Skeleton width={200} height={36} sx={{ mt: 1 }} />
                        <Skeleton width={320} height={18} sx={{ mt: 1 }} />
                    </Box>
                    <Skeleton variant="rounded" width={140} height={36} />
                </Box>
                <Grid container spacing={2.25}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} lg={3} key={i}> <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} /> </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }
    return (
        <Box>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                        <Box sx={{
                            width: 6, height: 6, borderRadius: '50%',
                            backgroundColor: 'success.main',
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.15)}`,
                        }} />
                        <Typography sx={{
                            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary',
                        }}>
                            Business Overview
                        </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.025em', fontSize: '1.5rem', lineHeight: 1.2 }}> Dashboard </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, fontSize: '0.85rem' }}>
                        Sales, purchases, CRM, inventory and accounts — all in one place.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AccessTime sx={{ fontSize: 16 }} />}
                        onClick={(e) => setRangeAnchor(e.currentTarget)}
                        disabled={sendingData}
                        sx={{
                            borderRadius: 2, textTransform: 'none', fontWeight: 600,
                            fontSize: '0.82rem', borderColor: 'divider',
                            color: 'text.primary', px: 1.75, py: 0.85,
                            '&:hover': { borderColor: 'text.primary', backgroundColor: 'action.hover' },
                        }}
                    >
                        {{
                            this_month: 'This Month',
                            last_month: 'Last Month',
                            last_30_days: 'Last 30 Days',
                            this_year: 'This Year',
                        }[range] || 'This Month'}
                    </Button>
                    <Menu
                        anchorEl={rangeAnchor}
                        open={Boolean(rangeAnchor)}
                        onClose={() => setRangeAnchor(null)}
                    >
                        {[
                            ['this_month', 'This Month'],
                            ['last_month', 'Last Month'],
                            ['last_30_days', 'Last 30 Days'],
                            ['this_year', 'This Year'],
                        ].map(([val, label]) => (
                            <MenuItem
                                key={val}
                                selected={val === range}
                                onClick={() => { setRange(val); setRangeAnchor(null); }}
                            >
                                {label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Stack>
            </Box>
            <Grid container spacing={2.25} sx={{ mb: 2.25 }}>
                {(view?.kpis || []).map((k) => (
                    <Grid item xs={12} sm={6} lg={3} key={k.title}> <KpiCard kpi={k} /> </Grid>
                ))}
            </Grid>
            <Grid container spacing={2.25} sx={{ mb: 3 }}>
                {(view?.secondaryKpis || []).map((k) => (
                    <Grid item xs={6} sm={3} lg={3} key={k.title}>
                        <Paper sx={{
                            p: 1.75, borderRadius: 12,
                            border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.07) : theme.palette.divider}`,
                            backgroundColor: theme.palette.background.paper,
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: alpha(k.accent, 0.35),
                                transform: 'translateY(-1px)',
                            },
                        }}>
                            <Box sx={{
                                width: 34, height: 34, borderRadius: 9,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: alpha(k.accent, 0.12), color: k.accent,
                                flexShrink: 0, '& svg': { fontSize: 18 },
                            }}>
                                {k.icon}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography noWrap sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}> {k.value} </Typography>
                                <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}> {k.title} </Typography>
                            </Box>
                            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                                <Typography sx={{
                                    fontSize: '0.68rem', fontWeight: 700,
                                    color: k.trend === 'up' ? 'success.main' : 'error.main',
                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25,
                                }}>
                                    {k.trend === 'up' ? <NorthEast sx={{ fontSize: 11 }} /> : <SouthEast sx={{ fontSize: 11 }} />}
                                    {k.change}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={2.25} sx={{ mb: 3 }}>
                <Grid item xs={12} lg={8}><SalesVsPurchaseChart view={view} /></Grid>
                <Grid item xs={12} lg={4}><OrdersByStatusCard view={view} /></Grid>
            </Grid>
            <Grid container spacing={2.25} sx={{ mb: 3 }}>
                <Grid item xs={12} lg={8}><PipelineCard view={view} /></Grid>
                <Grid item xs={12} lg={4}><ActivityByTypeCard view={view} /></Grid>
            </Grid>
            <Grid container spacing={2.25} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <SectionCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <SectionLabel>Period Compare</SectionLabel>
                                <SectionTitle>This Period vs Same Period Last Year</SectionTitle>
                                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}> Key business metrics year-over-year </Typography>
                            </Box>
                            <Chip
                                icon={<CompareArrows sx={{ fontSize: 14 }} />}
                                label="YoY"
                                size="small"
                                sx={{
                                    height: 24, fontSize: '0.7rem', fontWeight: 700,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.10),
                                    color: theme.palette.primary.main,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        </Box>
                        <Grid container spacing={0}>
                            {(view?.comparisonRows || []).map((r, i) => (
                                <Grid item xs={12} sm={6} md={4} key={r.metric}>
                                    <Box sx={{
                                        p: 1.75,
                                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : theme.palette.divider}`,
                                        borderRight: { xs: 'none', md: i % 3 !== 2 ? `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : theme.palette.divider}` : 'none' },
                                        transition: 'all 0.15s ease',
                                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.03) },
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                                                {r.metric}
                                            </Typography>
                                            <Typography sx={{
                                                fontSize: '0.7rem', fontWeight: 700,
                                                color: r.trend === 'up' ? 'success.main' : 'error.main',
                                                display: 'flex', alignItems: 'center', gap: 0.25,
                                            }}>
                                                {r.trend === 'up' ? <NorthEast sx={{ fontSize: 11 }} /> : <SouthEast sx={{ fontSize: 11 }} />}
                                                {r.change}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="baseline" spacing={1}>
                                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                                                {r.thisMonth}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 500 }}>
                                                vs {r.lastYear}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>
                </Grid>
            </Grid>
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={6} lg={4}>
                    <SectionCard sx={{ height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <SectionLabel>Inventory</SectionLabel>
                                <SectionTitle>Top Selling Products</SectionTitle>
                            </Box>
                            <Tooltip title="Manage inventory" arrow>
                                <IconButton size="small" href="/Inventory/StockLevels" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', backgroundColor: alpha(theme.palette.primary.main, 0.08) } }}>
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Stack spacing={1.75}>
                            {(view?.topProducts || []).map((p) => (
                                <Box key={p.name}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                                        <Stack direction="row" spacing={1.25} alignItems="center">
                                            <Box sx={{
                                                width: 28, height: 28, borderRadius: 1.5,
                                                backgroundColor: alpha(p.color, 0.12),
                                                border: `1px solid ${alpha(p.color, 0.2)}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Inventory2 sx={{ fontSize: 14, color: p.color }} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.2, display: 'block' }}>
                                                    {p.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
                                                    {fmtNumber(p.sold)} sold
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Typography sx={{
                                            fontSize: '0.75rem', fontWeight: 700,
                                            color: p.stock < 30 ? 'error.main' : 'text.primary',
                                        }}>
                                            {p.stock}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={p.stock}
                                        sx={{
                                            height: 5, borderRadius: 3,
                                            backgroundColor: alpha(p.color, 0.10),
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: p.stock < 30 ? theme.palette.error.main : p.color,
                                                borderRadius: 3,
                                            },
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    <SectionCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                    <SectionLabel>Attention</SectionLabel>
                                    <Chip
                                        label={(view?.inventoryAlerts || []).length}
                                        size="small"
                                        sx={{
                                            height: 18, minWidth: 18, fontSize: '0.65rem', fontWeight: 700,
                                            backgroundColor: alpha(theme.palette.error.main, 0.12),
                                            color: theme.palette.error.main,
                                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                            '& .MuiChip-label': { padding: '0 6px' },
                                        }}
                                    />
                                </Stack>
                                <SectionTitle>Inventory Alerts</SectionTitle>
                            </Box>
                            <Tooltip title="Open stock levels" arrow>
                                <IconButton size="small" href="/Inventory/StockLevels" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', backgroundColor: alpha(theme.palette.primary.main, 0.08) } }}>
                                    <Inventory2 fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Stack spacing={1.25} sx={{ flex: 1 }}>
                            {(view?.inventoryAlerts || []).map((item) => {
                                const pct = Math.min(100, Math.round((item.qty / item.threshold) * 100));
                                const isCritical = item.severity === 'critical';
                                const severityColor = isCritical ? theme.palette.error.main : theme.palette.warning.main;
                                return (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            p: 1.5, borderRadius: 2,
                                            border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.07) : theme.palette.divider}`,
                                            backgroundColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.015) : alpha('#000', 0.01),
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: alpha(severityColor, 0.4),
                                                backgroundColor: alpha(severityColor, 0.03),
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Avatar sx={{
                                                    width: 28, height: 28,
                                                    backgroundColor: alpha(severityColor, 0.12),
                                                    color: severityColor,
                                                    border: `1px solid ${alpha(severityColor, 0.25)}`,
                                                }}>
                                                    {isCritical ? <ErrorOutline sx={{ fontSize: 15 }} /> : <Warning sx={{ fontSize: 15 }} />}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.2, display: 'block' }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mt: 0.25 }}>
                                                        {item.sku} • Threshold {item.threshold} {item.unit}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Chip
                                                label={isCritical ? 'Critical' : 'Low'}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                                                    backgroundColor: alpha(severityColor, 0.10),
                                                    color: severityColor,
                                                    border: `1px solid ${alpha(severityColor, 0.25)}`,
                                                    '& .MuiChip-label': { padding: '0 8px' },
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={{
                                                    flex: 1, height: 5, borderRadius: 3,
                                                    backgroundColor: alpha(severityColor, 0.10),
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: severityColor, borderRadius: 3,
                                                    },
                                                }}
                                            />
                                            <Typography sx={{ color: severityColor, fontSize: '0.7rem', fontWeight: 700, minWidth: 65, textAlign: 'right' }}>
                                                {item.qty} {item.unit} left
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SectionCard sx={{ height: '100%' }}>
                        <Box sx={{ mb: 1.5 }}>
                            <SectionLabel>Timeline</SectionLabel>
                            <SectionTitle>Recent Activity</SectionTitle>
                        </Box>
                        <List disablePadding>
                            {(view?.recentActivities || []).map((a, i, arr) => (
                                <React.Fragment key={a.id}>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            sx={{
                                                borderRadius: 1.5, px: 1, py: 1.25,
                                                transition: 'all 0.15s ease',
                                                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                                            }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 42 }}>
                                                <Avatar sx={{
                                                    width: 30, height: 30,
                                                    backgroundColor: alpha(a.color, 0.12),
                                                    color: a.color,
                                                    border: `1px solid ${alpha(a.color, 0.2)}`,
                                                }}>
                                                    {a.icon}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>{a.title}</Typography>}
                                                secondary={<Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25, lineHeight: 1.3 }}>{a.meta}</Typography>}
                                            />
                                            <Typography sx={{ color: 'text.disabled', fontSize: '0.68rem', alignSelf: 'flex-start', mt: 0.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                {a.time}
                                            </Typography>
                                        </ListItemButton>
                                    </ListItem>
                                    {i < arr.length - 1 && <Divider sx={{ my: 0.25, borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : undefined }} />}
                                </React.Fragment>
                            ))}
                        </List>
                    </SectionCard>
                </Grid>
            </Grid>
            <Grid container spacing={2.25} sx={{ mt: 0.25 }}>
                <Grid item xs={12}>
                    <SectionCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.25 }}>
                            <Box>
                                <SectionLabel>Relationships</SectionLabel>
                                <SectionTitle>Top Customers</SectionTitle>
                                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }}> By revenue this period </Typography>
                            </Box>
                        </Box>
                        <Grid container spacing={1.75}>
                            {(view?.topCustomers || []).map((c) => (
                                <Grid item xs={12} sm={6} md={3} key={c.name}>
                                    <Box
                                        sx={{
                                            p: 2, borderRadius: 2.5,
                                            border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.07) : theme.palette.divider}`,
                                            backgroundColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.015) : alpha('#000', 0.01),
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                borderColor: alpha(c.color, 0.4),
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 16px ${alpha(c.color, 0.10)}`,
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                                            <Avatar sx={{
                                                width: 36, height: 36,
                                                backgroundColor: alpha(c.color, 0.12),
                                                color: c.color,
                                                fontWeight: 700, fontSize: '0.8rem',
                                                border: `1px solid ${alpha(c.color, 0.25)}`,
                                            }}>
                                                {String(c.name).split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', display: 'block', lineHeight: 1.2 }}>
                                                    {c.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
                                                    {c.orders} orders
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
                                                {c.revenue}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <StatusDot color={c.color} />
                                                <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Active
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardView;