const Invoice = require('../invoice/model');
const SupplierInvoices = require('../supplier_invoices/model');
const Inventory = require('../inventory/model');
const Customer = require('../customer/model');
const Lead = require('../lead/model');
const Opportunity = require('../opportunity/model');
const Activity = require('../activity/model');
const CustomerCancelledInvoicesDay = require('../customerCancelledInvoicesDay/model');
const CustomerTemporaryOrdersDay = require('../customerTemporaryOrdersDay/model');
const moment = require('moment-timezone');
const TZ = 'Europe/London';

const nowLondon = () => moment().tz(TZ);
const toUtcDate = (m) => m.toDate();
const londonKeyToDate = (key, edge = 'start') => {
    const base = moment.tz(key, 'YYYY-MM-DD', TZ);
    return toUtcDate(edge === 'end' ? base.endOf('day') : base.startOf('day'));
};
const prevMonthSameDay = (n) => {
    const prev = n.clone().subtract(1, 'month');
    const day = Math.min(n.date(), prev.daysInMonth());
    return prev.date(day);
};
const yoySameDay = (n) => {
    const prev = n.clone().subtract(1, 'year');
    const day = Math.min(n.date(), prev.daysInMonth());
    return prev.date(day);
};
const getTrendStart = (monthsBack = 6) => {
    const n = nowLondon();
    return toUtcDate(n.clone().subtract(monthsBack, 'month').startOf('month'));
};
const padMonthlyTrend = (rows, monthsBack = 6) => {
    const base = nowLondon();
    const out = [];
    for (let i = monthsBack; i >= 0; i--) {
        const m = base.clone().subtract(i, 'month');
        const y = m.year();
        const mo = m.month() + 1;
        const hit = rows.find(r => r._id.y === y && r._id.m === mo);
        out.push({ _id: { y, m: mo }, total: hit ? hit.total : 0 });
    }
    return out;
};

const excludeCancelledInvoices = () => [
    {
        $lookup: {
            from: "customerCancelledInvoicesDay",
            let: { cust: "$customer", ot: "$ot_date" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$customer", "$$cust"] },
                                { $eq: ["$ot_date", "$$ot"] },
                            ],
                        },
                    },
                },
            ],
            as: "cancelled",
        },
    },
    { $match: { $expr: { $eq: [{ $size: "$cancelled" }, 0] } } },
    { $unset: "cancelled" },
];

const getOrderStatusCounts = async ({ start, end }) => {
    const [confirmedAgg, cancelled, temporary] = await Promise.all([
        Invoice.aggregate([
            {
                $match: {
                    invoice_date: { $gte: start, $lte: end },
                    status: { $nin: ['CANCELLED', 'RETURNED'] },
                },
            },
            ...excludeCancelledInvoices(),
            { $count: 'count' },
        ]),
        CustomerCancelledInvoicesDay.countDocuments({ ot_date: { $gte: start, $lte: end } }),
        CustomerTemporaryOrdersDay.countDocuments({ ot_date: { $gte: start, $lte: end } }),
    ]);
    const confirmed = confirmedAgg[0]?.count || 0;
    const total = confirmed + cancelled + temporary || 1;
    return [
        { name: 'Confirmed', value: confirmed, pct: Math.round(confirmed / total * 100), color: '#10b981' },
        { name: 'Cancelled', value: cancelled, pct: Math.round(cancelled / total * 100), color: '#ef4444' },
        { name: 'Temporary', value: temporary, pct: Math.round(temporary / total * 100), color: '#3b82f6' },
    ];
};

const getRanges = (range = 'this_month') => {
    const n = nowLondon();
    let startL, endL;
    switch (range) {
        case 'last_month': {
            const lm = n.clone().subtract(1, 'month');
            startL = lm.clone().startOf('month');
            endL = lm.clone().endOf('month');
            break;
        }
        case 'last_30_days':
            startL = n.clone().subtract(29, 'days').startOf('day');
            endL = n.clone().endOf('day');
            break;
        case 'this_year':
            startL = n.clone().startOf('year');
            endL = n.clone().endOf('day');
            break;
        case 'this_month':
        default:
            startL = n.clone().startOf('month');
            endL = n.clone().endOf('day');
            break;
    }
    const prevStartMoment = n.clone().subtract(1, 'month').startOf('month');
    const prevEndMoment = prevMonthSameDay(n).endOf('day');
    const yoyStartMoment = n.clone().subtract(1, 'year').startOf('month');
    const yoyEndMoment = yoySameDay(n).endOf('day');
    return {
        start: toUtcDate(startL),
        end: toUtcDate(endL),
        prevStart: toUtcDate(prevStartMoment),
        prevEnd: toUtcDate(prevEndMoment),
        yoyStart: toUtcDate(yoyStartMoment),
        yoyEnd: toUtcDate(yoyEndMoment),
    };
};
const pctChange = (current, previous) => {
    if (previous === 0 || previous == null) { return current === 0 ? 0 : null; }
    return Number((((current - previous) / previous) * 100).toFixed(1));
};
const trendOf = (current, previous) => {
    if (previous === 0 || previous == null) {
        if (current === 0) return 'flat';
        return current > 0 ? 'up' : 'down';
    }
    if (current === previous) return 'flat';
    return current > previous ? 'up' : 'down';
};

const getInvoiceMetrics = async ({ start, end, prevStart, prevEnd, yoyStart, yoyEnd }) => {
    const [facet] = await Invoice.aggregate([
        {
            $facet: {
                current: [
                    { $match: { invoice_date: { $gte: start, $lte: end } } },
                    ...excludeCancelledInvoices(),
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: '$total_incl_vat' },
                            orders: { $sum: 1 },
                            invoicesSent: { $sum: 1 },
                            avgOrder: { $avg: '$total_incl_vat' },
                        }
                    },
                ],
                previous: [
                    { $match: { invoice_date: { $gte: prevStart, $lte: prevEnd } } },
                    ...excludeCancelledInvoices(),
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: '$total_incl_vat' },
                            orders: { $sum: 1 },
                            invoicesSent: { $sum: 1 },
                            avgOrder: { $avg: '$total_incl_vat' },
                        }
                    },
                ],
                lastYear: [
                    { $match: { invoice_date: { $gte: yoyStart, $lte: yoyEnd } } },
                    ...excludeCancelledInvoices(),
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: '$total_incl_vat' },
                            orders: { $sum: 1 },
                            invoicesSent: { $sum: 1 },
                            avgOrder: { $avg: '$total_incl_vat' },
                        }
                    },
                ],
                byStatus: [
                    { $match: { invoice_date: { $gte: start, $lte: end } } },
                    ...excludeCancelledInvoices(),
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ],
                outstanding: [
                    { $match: { status: { $in: ['PENDING', 'PARTIALLY_PAID'] } } },
                    ...excludeCancelledInvoices(),
                    { $group: { _id: null, total: { $sum: '$balance_due' } } },
                ],
                monthlyTrend: [
                    { $match: { invoice_date: { $gte: getTrendStart(6) } } },
                    ...excludeCancelledInvoices(),
                    {
                        $group: {
                            _id: {
                                y: { $year: { date: '$invoice_date', timezone: TZ } },
                                m: { $month: { date: '$invoice_date', timezone: TZ } },
                            },
                            total: { $sum: '$total_incl_vat' },
                        }
                    },
                    { $sort: { '_id.y': 1, '_id.m': 1 } },
                ],
            },
        },
    ]);
    const empty = { revenue: 0, orders: 0, invoicesSent: 0, avgOrder: 0 };
    const current = facet.current[0] || empty;
    const previous = facet.previous[0] || empty;
    const lastYear = facet.lastYear[0] || empty;
    const statusMap = { Completed: 0, 'In Transit': 0, Pending: 0, Cancelled: 0 };
    facet.byStatus.forEach(({ _id, count }) => {
        if (_id === 'PAID') statusMap.Completed += count;
        else if (_id === 'CANCELLED') statusMap.Cancelled += count;
        else if (_id === 'RETURNED') statusMap.Cancelled += count;
        else statusMap.Pending += count;
    });
    const totalByStatus = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
    const build = (cur, prev, yoy) => ({
        value: cur,
        change: pctChange(cur, yoy),
        trend: trendOf(cur, yoy),
        change_yoy: pctChange(cur, yoy),
        trend_yoy: trendOf(cur, yoy),
        change_mom: pctChange(cur, prev),
        trend_mom: trendOf(cur, prev),
    });
    return {
        revenue: build(current.revenue, previous.revenue, lastYear.revenue),
        orders: build(current.orders, previous.orders, lastYear.orders),
        invoicesSent: build(current.invoicesSent, previous.invoicesSent, lastYear.invoicesSent),
        avgOrder: build(Math.round(current.avgOrder),
            Math.round(previous.avgOrder),
            Math.round(lastYear.avgOrder)),
        outstanding: facet.outstanding[0]?.total || 0,
        byStatus: [
            { name: 'Completed', value: Math.round((statusMap.Completed / totalByStatus) * 100), color: '#10b981' },
            { name: 'In Transit', value: Math.round((statusMap['In Transit'] / totalByStatus) * 100), color: '#3b82f6' },
            { name: 'Pending', value: Math.round((statusMap.Pending / totalByStatus) * 100), color: '#f59e0b' },
            { name: 'Cancelled', value: Math.round((statusMap.Cancelled / totalByStatus) * 100), color: '#ef4444' },
        ],
        monthlyTrend: padMonthlyTrend(facet.monthlyTrend, 6),
    };
};

const getPurchaseMetrics = async ({ start, end, prevStart, prevEnd, yoyStart, yoyEnd }) => {
    const [facet] = await SupplierInvoices.aggregate([
        {
            $facet: {
                current: [
                    { $match: { invoice_date: { $gte: start, $lte: end } } },
                    { $group: { _id: null, total: { $sum: '$total' } } },
                ],
                previous: [
                    { $match: { invoice_date: { $gte: prevStart, $lte: prevEnd } } },
                    { $group: { _id: null, total: { $sum: '$total' } } },
                ],
                lastYear: [
                    { $match: { invoice_date: { $gte: yoyStart, $lte: yoyEnd } } },
                    { $group: { _id: null, total: { $sum: '$total' } } },
                ],
                monthlyTrend: [
                    { $match: { invoice_date: { $gte: getTrendStart(6) } } },
                    {
                        $group: {
                            _id: {
                                y: { $year: { date: '$invoice_date', timezone: TZ } },
                                m: { $month: { date: '$invoice_date', timezone: TZ } },
                            },
                            total: { $sum: '$total' },
                        }
                    },
                    { $sort: { '_id.y': 1, '_id.m': 1 } },
                ],
            },
        },
    ]);
    const current = facet.current[0]?.total || 0;
    const previous = facet.previous[0]?.total || 0;
    const lastYear = facet.lastYear[0]?.total || 0;
    return {
        value: current,
        change: pctChange(current, lastYear),
        trend: trendOf(current, lastYear),
        change_yoy: pctChange(current, lastYear),
        trend_yoy: trendOf(current, lastYear),
        change_mom: pctChange(current, previous),
        trend_mom: trendOf(current, previous),
        monthlyTrend: padMonthlyTrend(facet.monthlyTrend, 6),
    };
};
const getInventoryAlerts = async () => {
    const docs = await Inventory.aggregate([
        { $match: { active: true } },
        { $addFields: { lowStock: { $lte: ['$quantity', '$alert_quantity'] } } },
        { $match: { lowStock: true } },
        { $project: { name: 1, quantity: 1, alert_quantity: 1, barcode: 1, cost_price: 1 } },
        { $sort: { quantity: 1 } },
        { $limit: 5 },
    ]);
    return docs.map((d) => ({
        name: d.name,
        sku: d.barcode ? String(d.barcode) : '-',
        qty: d.quantity,
        threshold: d.alert_quantity,
        unit: 'units',
        severity: d.quantity <= d.alert_quantity * 0.3 ? 'critical' : 'warning',
    }));
};

const getInventoryCount = async () => Inventory.countDocuments({ active: true });
const getCustomerCount = async () => Customer.countDocuments({ active: true });
const getLeadMetrics = async ({ start, end, prevStart, prevEnd, yoyStart, yoyEnd }) => {
    const [current, previous, lastYear] = await Promise.all([
        Lead.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Lead.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } }),
        Lead.countDocuments({ createdAt: { $gte: yoyStart, $lte: yoyEnd } }),
    ]);
    return {
        value: current,
        change: pctChange(current, lastYear),
        trend: trendOf(current, lastYear),
        change_yoy: pctChange(current, lastYear),
        trend_yoy: trendOf(current, lastYear),
        change_mom: pctChange(current, previous),
        trend_mom: trendOf(current, previous),
    };
};

const getPipelineMetrics = async ({ start, end, prevStart, prevEnd, yoyStart, yoyEnd }) => {
    const [current, previous, lastYear] = await Promise.all([
        Opportunity.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: '$stage', count: { $sum: 1 } } },
        ]),
        Opportunity.aggregate([
            { $match: { createdAt: { $gte: prevStart, $lte: prevEnd } } },
            { $group: { _id: '$stage', count: { $sum: 1 } } },
        ]),
        Opportunity.aggregate([
            { $match: { createdAt: { $gte: yoyStart, $lte: yoyEnd } } },
            { $group: { _id: '$stage', count: { $sum: 1 } } },
        ]),
    ]);
    const toMap = (arr) => arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
    const curMap = toMap(current);
    const prevMap = toMap(previous);
    const yoyMap = toMap(lastYear);
    const displayStages = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed Win'];
    return {
        labels: displayStages.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        current: displayStages.map(s => curMap[s] || 0),
        last: displayStages.map(s => yoyMap[s] || 0),
        prev: displayStages.map(s => prevMap[s] || 0),
        wonThisMonth: curMap['closed Win'] || 0,
        wonLastMonth: prevMap['closed Win'] || 0,
        wonLastYear: yoyMap['closed Win'] || 0,
    };
};

const getActivityBreakdown = async ({ start, end }) => {
    const rows = await Activity.aggregate([{ $match: { createdAt: { $gte: start, $lte: end } } }, { $group: { _id: '$type', count: { $sum: 1 } } },]);
    const map = { call: 0, email: 0, meeting: 0, note: 0 };
    rows.forEach(({ _id, count }) => { if (map[_id] !== undefined) map[_id] = count; });
    return [
        { name: 'Calls', value: map.call, color: '#3b82f6' },
        { name: 'Emails', value: map.email, color: '#8b5cf6' },
        { name: 'Meetings', value: map.meeting, color: '#10b981' },
        { name: 'Notes', value: map.note, color: '#f59e0b' },
    ];
};

const getActivityTrend = async () => {
    const n = nowLondon();
    const since = toUtcDate(n.clone().subtract(6, 'days').startOf('day'));

    const rows = await Activity.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
            $group: {
                _id: {
                    day: { $dayOfWeek: { date: '$createdAt', timezone: TZ } },
                    type: '$type',
                },
                count: { $sum: 1 },
            }
        },
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = { call: {}, email: {}, meeting: {} };
    rows.forEach(({ _id, count }) => {
        if (buckets[_id.type]) buckets[_id.type][_id.day] = count;
    });
    const order = [2, 3, 4, 5, 6, 7, 1];
    return {
        labels: order.map(d => days[d - 1]),
        calls: order.map(d => buckets.call[d] || 0),
        emails: order.map(d => buckets.email[d] || 0),
        meetings: order.map(d => buckets.meeting[d] || 0),
    };
};

const getTopCustomers = async ({ start, end, limit = 4 }) => {
    return Invoice.aggregate([
        { $match: { invoice_date: { $gte: start, $lte: end } } },
        ...excludeCancelledInvoices(),
        {
            $group: {
                _id: '$customer',
                revenue: { $sum: '$total_incl_vat' },
                orders: { $sum: 1 },
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: limit },
        { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'cust' } },
        { $unwind: { path: '$cust', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                name: { $ifNull: ['$cust.customer_name', 'Unknown'] },
                orders: 1,
                revenue: 1,
            }
        },
    ]);
};

const getTopProducts = async ({ start, end, limit = 5 }) => {
    return Invoice.aggregate([
        { $match: { invoice_date: { $gte: start, $lte: end } } },
        ...excludeCancelledInvoices(),
        { $unwind: '$items' },
        { $group: { _id: '$items.name', sold: { $sum: '$items.quantity' } } },
        { $sort: { sold: -1 } },
        { $limit: limit },
        { $project: { _id: 0, name: '$_id', sold: 1 } },
    ]);
};

const getRecentActivity = async (limit = 5) => Activity.find().sort({ createdAt: -1 }).limit(limit).lean();
const buildYearComparison = async ({ start, end, prevStart, prevEnd, yoyStart, yoyEnd }) => {
    const [
        currInv, prevInv, yoyInv,
        currSup, prevSup, yoySup,
        currLead, prevLead, yoyLead,
    ] = await Promise.all([
        Invoice.aggregate([
            { $match: { invoice_date: { $gte: start, $lte: end } } },
            ...excludeCancelledInvoices(),
            { $group: { _id: null, revenue: { $sum: '$total_incl_vat' }, orders: { $sum: 1 }, avg: { $avg: '$total_incl_vat' } } },
        ]),
        Invoice.aggregate([
            { $match: { invoice_date: { $gte: prevStart, $lte: prevEnd } } },
            ...excludeCancelledInvoices(),
            { $group: { _id: null, revenue: { $sum: '$total_incl_vat' }, orders: { $sum: 1 }, avg: { $avg: '$total_incl_vat' } } },
        ]),
        Invoice.aggregate([
            { $match: { invoice_date: { $gte: yoyStart, $lte: yoyEnd } } },
            ...excludeCancelledInvoices(),
            { $group: { _id: null, revenue: { $sum: '$total_incl_vat' }, orders: { $sum: 1 }, avg: { $avg: '$total_incl_vat' } } },
        ]),
        SupplierInvoices.aggregate([
            { $match: { invoice_date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        SupplierInvoices.aggregate([
            { $match: { invoice_date: { $gte: prevStart, $lte: prevEnd } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        SupplierInvoices.aggregate([
            { $match: { invoice_date: { $gte: yoyStart, $lte: yoyEnd } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Lead.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Lead.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } }),
        Lead.countDocuments({ createdAt: { $gte: yoyStart, $lte: yoyEnd } }),
    ]);

    const cInv = currInv[0] || { revenue: 0, orders: 0, avg: 0 };
    const pInv = prevInv[0] || { revenue: 0, orders: 0, avg: 0 };
    const yInv = yoyInv[0] || { revenue: 0, orders: 0, avg: 0 };
    const cSup = currSup[0]?.total || 0;
    const pSup = prevSup[0]?.total || 0;
    const ySup = yoySup[0]?.total || 0;
    const rows = [
        { metric: 'Revenue', thisPeriod: cInv.revenue, lastMonth: pInv.revenue, lastYear: yInv.revenue, format: 'currency' },
        { metric: 'Purchases', thisPeriod: cSup, lastMonth: pSup, lastYear: ySup, format: 'currency' },
        { metric: 'Orders', thisPeriod: cInv.orders, lastMonth: pInv.orders, lastYear: yInv.orders, format: 'number' },
        { metric: 'New Leads', thisPeriod: currLead, lastMonth: prevLead, lastYear: yoyLead, format: 'number' },
        { metric: 'Avg. Order Value', thisPeriod: Math.round(cInv.avg), lastMonth: Math.round(pInv.avg), lastYear: Math.round(yInv.avg), format: 'currency' },
    ];

    return rows.map((r) => ({
        ...r,
        change: pctChange(r.thisPeriod, r.lastYear),
        trend: trendOf(r.thisPeriod, r.lastYear),
        change_yoy: pctChange(r.thisPeriod, r.lastYear),
        trend_yoy: trendOf(r.thisPeriod, r.lastYear),
        change_mom: pctChange(r.thisPeriod, r.lastMonth),
        trend_mom: trendOf(r.thisPeriod, r.lastMonth),
    }));
};

const getDashboardSummary = async ({ range = 'this_month' } = {}) => {
    const ranges = getRanges(range);

    const [
        invoiceMetrics,
        purchaseMetrics,
        inventoryAlerts,
        inventoryCount,
        customerCount,
        leadMetrics,
        pipeline,
        activityByType,
        activityTrend,
        topCustomers,
        topProducts,
        yearComparison,
        recentActivity,
        orderStatusCounts
    ] = await Promise.all([
        getInvoiceMetrics(ranges),
        getPurchaseMetrics(ranges),
        getInventoryAlerts(),
        getInventoryCount(),
        getCustomerCount(),
        getLeadMetrics(ranges),
        getPipelineMetrics(ranges),
        getActivityBreakdown(ranges),
        getActivityTrend(),
        getTopCustomers(ranges),
        getTopProducts(ranges),
        buildYearComparison(ranges),
        getRecentActivity(),
        getOrderStatusCounts(ranges),
    ]);

    const kpi = (m) => ({
        value: m.value,
        change: m.change,
        trend: m.trend,
        change_yoy: m.change_yoy,
        trend_yoy: m.trend_yoy,
        change_mom: m.change_mom,
        trend_mom: m.trend_mom,
    });

    return {
        meta: {
            current_window: { from: ranges.start, to: ranges.end },
            mom_window: { from: ranges.prevStart, to: ranges.prevEnd },
            yoy_window: { from: ranges.yoyStart, to: ranges.yoyEnd },
            comparison_mode: 'yoy_same_period',
            range,
        },
        kpis: {
            revenue: kpi(invoiceMetrics.revenue),
            purchases: kpi({ ...purchaseMetrics, value: purchaseMetrics.value, change: purchaseMetrics.change, trend: purchaseMetrics.trend, change_yoy: purchaseMetrics.change_yoy, trend_yoy: purchaseMetrics.trend_yoy, change_mom: purchaseMetrics.change_mom, trend_mom: purchaseMetrics.trend_mom }),
            active_orders: kpi(invoiceMetrics.orders),
            outstanding: {
                value: invoiceMetrics.outstanding,
                change: null,
                trend: 'flat',
            },
        },
        secondary_kpis: {
            new_leads: { value: leadMetrics.value, change: leadMetrics.change, change_yoy: leadMetrics.change_yoy, change_mom: leadMetrics.change_mom },
            customers: { value: customerCount, change: null },
            won_this_month: { value: pipeline.wonThisMonth, change: pctChange(pipeline.wonThisMonth, pipeline.wonLastYear) },
            inventory_items: { value: inventoryCount, change: null },
        },
        sales_vs_purchase: {
            labels: invoiceMetrics.monthlyTrend.map(r => `${r._id.y}-${String(r._id.m).padStart(2, '0')}`),
            sales: invoiceMetrics.monthlyTrend.map(r => r.total),
            purchases: purchaseMetrics.monthlyTrend.map(r => r.total),
        },
        orders_by_status: orderStatusCounts,
        pipeline: {
            labels: pipeline.labels,
            current: pipeline.current,
            last: pipeline.last,
            prev: pipeline.prev,
        },
        activity_by_type: activityByType,
        activity_trend: activityTrend,
        year_comparison: yearComparison,
        month_comparison: yearComparison,
        top_products: topProducts,
        inventory_alerts: inventoryAlerts,
        top_customers: topCustomers.map(c => ({
            name: c.name,
            orders: c.orders,
            revenue: c.revenue,
            color: '#ec4899',
        })),
        recent_activity: recentActivity,
    };
};

module.exports = {
    getRanges,
    getDashboardSummary,
};