const InvoiceModel = require("../invoice/model");
const CustomerModel = require("../customer/model");
const DriverTotalModel = require("../driver/totals.model");
const DriverNameModel  = require("../driver/name.model");
const DriverVehicleModel = require("../driver/vehicle.model");
const ZoneModel = require("../zone/model");
const moment = require('moment');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const isCreditMode = (m) => {
    const s = String(m || '').toLowerCase().replace(/[\s_\-/]+/g, '');
    return s.includes('credit') || s === 'cn' || s === 'cr' || s === 'c/n';
};

const toDayMoment = (input) => {
    if (!input) return moment().startOf('day');
    if (typeof input === 'string') { return moment(input, 'YYYY-MM-DD', true).startOf('day'); }
    return moment(input).startOf('day');
};

const getRangeForBusinessDate = (input) => {
    const day = toDayMoment(input);
    const start = day.clone().hour(13).minute(30).second(0).millisecond(0);
    const end = start.clone().add(1, 'day');
    return {
        businessDate: day.toDate(),
        start: start.toDate(),
        end: end.toDate(),
        rangeLabel: `${start.format('DD MMM YYYY, hh:mm A')} → ${end.format('DD MMM YYYY, hh:mm A')}`,
    };
};

const getCustomerNameMap = async (invoiceDocs) => {
    const ids = [...new Set(invoiceDocs.map((i) => String(i.customer || '')).filter(Boolean))];
    if (!ids.length) return {};
    const customers = await CustomerModel.find({ _id: { $in: ids } }).select({ _id: 1, customer_name: 1 }).lean();
    const map = {};
    for (const c of customers) map[String(c._id)] = c.customer_name || '';
    return map;
};

const getAccountsReport = async (businessDateInput) => {
    const { businessDate, start, end, rangeLabel } = getRangeForBusinessDate(businessDateInput);
    const dayStart = moment(businessDate).startOf('day').toDate();
    const dayEnd   = moment(businessDate).endOf('day').toDate();
    const invoices = await InvoiceModel.find({
        invoice_date: { $gte: dayStart, $lte: dayEnd },
    })
        .select({
            sale_number: 1, customer: 1, customer_sales_rep: 1, zone: 1,
            invoice_date: 1, total_incl_vat: 1, total_no_vat: 1, vat_total: 1,
            total_credit_applied: 1, total_paid: 1, balance_due: 1,
            status: 1, cash_invoice: 1, in_person: 1,
            payments: 1, credit_notes: 1,
        })
        .lean();
    const totalInvoices     = invoices.length;
    const paidInvoices      = invoices.filter((i) => i.status === 'PAID').length;
    const pendingInvoices   = invoices.filter((i) => i.status === 'PENDING').length;
    const partiallyPaid     = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
    const cancelledInvoices = invoices.filter((i) => i.status === 'CANCELLED').length;
    const returnedInvoices  = invoices.filter((i) => i.status === 'RETURNED').length;
    const overPaidInvoices  = invoices.filter((i) => i.status === 'OVER_PAID').length;
    const totalInvoiced = round2(invoices.reduce((s, i) => s + (i.total_incl_vat || 0), 0));
    const totalCreditApplied = round2(invoices.reduce((s, i) => s + (i.total_credit_applied || 0), 0));
    const totalBalanceDue = round2(invoices.reduce((s, i) => s + (i.balance_due || 0), 0));
    const totalPaidOnTheseInvoices = round2(invoices.reduce((s, i) => s + (i.total_paid || 0), 0));
    const totalCashPaidOnTheseInvoices = round2(
        invoices.reduce((sum, inv) => {
            const cash = (inv.payments || []).filter((p) => !isCreditMode(p.type)).reduce((s, p) => s + (p.amount || 0), 0);
            return sum + cash;
        }, 0)
    );
    const totalCreditOnTheseInvoices = round2(
        invoices.reduce((sum, inv) => {
            const fromField = inv.total_credit_applied || 0;
            const fromPayments = (inv.payments || []).filter((p) => isCreditMode(p.type)).reduce((s, p) => s + (p.amount || 0), 0);
            return sum + Math.max(fromField, fromPayments);
        }, 0)
    );
    const outstandingOnTheseInvoices = round2( invoices.reduce((s, i) => s + (i.balance_due || 0), 0) );
    const expectedCollectionForDay = round2(totalInvoiced - totalCreditOnTheseInvoices);
    const invoiceStatusBreakdown = {
        PAID: paidInvoices,
        PENDING: pendingInvoices,
        PARTIALLY_PAID: partiallyPaid,
        OVER_PAID: overPaidInvoices,
        CANCELLED: cancelledInvoices,
        RETURNED: returnedInvoices,
    };

    const allPaymentDocs = await InvoiceModel.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.date': { $gte: start, $lt: end } } },
        {
            $project: {
                _id: 0,
                invoiceId: '$_id',
                saleNumber: '$sale_number',
                customer: '$customer',
                zone: '$zone',
                amount: '$payments.amount',
                date: '$payments.date',
                mode: '$payments.type',
                recordedBy: '$payments.recorded_by',
                comments: '$payments.comments',
            },
        },
        { $sort: { date: 1 } },
    ]);
    const paymentDocs       = allPaymentDocs.filter((p) => !isCreditMode(p.mode));
    const creditDocPayments = allPaymentDocs.filter((p) =>  isCreditMode(p.mode));
    const totalCollected = round2(paymentDocs.reduce((s, p) => s + (p.amount || 0), 0));
    const creditNotesAgg = await InvoiceModel.aggregate([
        { $unwind: '$credit_notes' },
        { $match: { 'credit_notes.credited_at': { $gte: start, $lt: end } } },
        {
            $project: {
                _id: 0,
                invoiceId: '$_id',
                saleNumber: '$sale_number',
                customer: '$customer',
                zone: '$zone',
                creditNoteNumber: '$credit_notes.credit_note_number',
                amount: '$credit_notes.amount_credited',
                date: '$credit_notes.credited_at',
            },
        },
        { $sort: { date: 1 } },
    ]);
    const creditFromCreditNotes = round2(creditNotesAgg.reduce((s, c) => s + (c.amount || 0), 0));
    const creditFromPayments    = round2(creditDocPayments.reduce((s, p) => s + (p.amount || 0), 0));
    const creditAppliedInWindow = creditFromCreditNotes > 0 ? creditFromCreditNotes : creditFromPayments;
    const distinctInvoiceIdsInWindow = [...new Set(allPaymentDocs.map((p) => String(p.invoiceId)))];
    const invoicesWithPaymentsInWindow = distinctInvoiceIdsInWindow.length ? await InvoiceModel.find({ _id: { $in: distinctInvoiceIdsInWindow } }).select({ _id: 1, status: 1 }).lean() : [];
    const windowTotalInvoices    = invoicesWithPaymentsInWindow.length;
    const windowPaidInvoices     = invoicesWithPaymentsInWindow.filter((i) => i.status === 'PAID').length;
    const windowPendingInvoices  = invoicesWithPaymentsInWindow.filter((i) => i.status === 'PENDING').length;
    const windowPartiallyPaid    = invoicesWithPaymentsInWindow.filter((i) => i.status === 'PARTIALLY_PAID').length;
    const windowOverPaidInvoices = invoicesWithPaymentsInWindow.filter((i) => i.status === 'OVER_PAID').length;
    const windowCancelled        = invoicesWithPaymentsInWindow.filter((i) => i.status === 'CANCELLED').length;
    const windowReturned         = invoicesWithPaymentsInWindow.filter((i) => i.status === 'RETURNED').length;

    const modeMap = {};
    for (const p of paymentDocs) {
        const key = p.mode || 'Unknown';
        if (!modeMap[key]) modeMap[key] = { mode: key, amount: 0, count: 0 };
        modeMap[key].amount += p.amount || 0;
        modeMap[key].count += 1;
    }
    const byMode = Object.values(modeMap).map((m) => ({ ...m, amount: round2(m.amount) })).sort((a, b) => b.amount - a.amount);

    const staffMap = {};
    for (const p of paymentDocs) {
        const key = p.recordedBy || 'Unknown';
        if (!staffMap[key]) staffMap[key] = { recordedBy: key, amount: 0, count: 0, modes: {} };
        staffMap[key].amount += p.amount || 0;
        staffMap[key].count += 1;
        const m = p.mode || 'Unknown';
        staffMap[key].modes[m] = (staffMap[key].modes[m] || 0) + (p.amount || 0);
    }
    const byStaff = Object.values(staffMap).map((s) => ({ ...s, amount: round2(s.amount) })).sort((a, b) => b.amount - a.amount);

    const hourly = [];
    for (let i = 0; i < 24; i++) {
        const bStart = moment(start).add(i, 'hour');
        hourly.push({ hourStart: bStart.toDate(), hourLabel: bStart.format('hh A'), amount: 0 });
    }
    for (const p of paymentDocs) {
        const idx = Math.floor(moment(p.date).diff(moment(start), 'minutes') / 60);
        if (idx >= 0 && idx < 24) hourly[idx].amount = round2(hourly[idx].amount + (p.amount || 0));
    }

    const expectedCollection  = expectedCollectionForDay;
    const expectedOutstanding = outstandingOnTheseInvoices;

    const payments = paymentDocs.map((p, idx) => ({
        _id: `${p.invoiceId}-${idx}`,
        invoiceId: p.invoiceId,
        saleNumber: p.saleNumber,
        customerId: p.customer,
        zone: p.zone,
        amount: round2(p.amount || 0),
        mode: p.mode,
        date: p.date,
        recordedBy: p.recordedBy,
        comments: p.comments,
    }));

    const creditPayments = (creditNotesAgg.length > 0 ? creditNotesAgg : creditDocPayments).map((p, idx) => ({
        _id: `cn-${p.invoiceId}-${idx}`,
        invoiceId: p.invoiceId,
        saleNumber: p.saleNumber,
        customerId: p.customer,
        zone: p.zone,
        amount: round2(p.amount || 0),
        mode: 'Credit Note',
        date: p.date,
        recordedBy: p.recordedBy || '',
        comments: p.creditNoteNumber || p.comments || '',
    }));

    const customerNameMapDay = await getCustomerNameMap(invoices);
    const invoicesIssuedDayRows = invoices
        .filter((inv) => (inv.payments && inv.payments.length > 0) || (inv.credit_notes && inv.credit_notes.length > 0))
        .map((inv) => ({
            invoiceId: String(inv._id),
            saleNumber: inv.sale_number,
            customerId: String(inv.customer || ''),
            customerName: customerNameMapDay[String(inv.customer)] || '',
            zone: inv.zone || '',
            invoiceDate: inv.invoice_date,
            status: inv.status,
            totalInclVat: round2(inv.total_incl_vat || 0),
            totalPaid: round2(inv.total_paid || 0),
            balanceDue: round2(inv.balance_due || 0),
            totalCreditApplied: round2(inv.total_credit_applied || 0),
            payments: (inv.payments || []).map((p, i) => ({
                _id: `${inv._id}-p-${i}`,
                amount: round2(p.amount || 0),
                mode: p.type || 'Unknown',
                date: p.date,
                recordedBy: p.recorded_by || '',
                comments: p.comments || '',
                isCredit: isCreditMode(p.type),
            })),
            creditNotes: (inv.credit_notes || []).map((c, i) => ({
                _id: `${inv._id}-cn-${i}`,
                creditNoteNumber: c.credit_note_number || '',
                amount: round2(c.amount_credited || 0),
                date: c.credited_at,
            })),
        }))
        .sort((a, b) => (b.saleNumber || 0) - (a.saleNumber || 0));

    const windowPaymentsByInvoice = {};
    for (const p of allPaymentDocs) {
        const key = String(p.invoiceId);
        if (!windowPaymentsByInvoice[key]) windowPaymentsByInvoice[key] = [];
        windowPaymentsByInvoice[key].push({
            _id: `${p.invoiceId}-wp-${windowPaymentsByInvoice[key].length}`,
            amount: round2(p.amount || 0),
            mode: p.mode || 'Unknown',
            date: p.date,
            recordedBy: p.recordedBy || '',
            comments: p.comments || '',
            isCredit: isCreditMode(p.mode),
        });
    }
    const windowCreditNotesByInvoice = {};
    for (const c of creditNotesAgg) {
        const key = String(c.invoiceId);
        if (!windowCreditNotesByInvoice[key]) windowCreditNotesByInvoice[key] = [];
        windowCreditNotesByInvoice[key].push({
            _id: `${c.invoiceId}-wcn-${windowCreditNotesByInvoice[key].length}`,
            creditNoteNumber: c.creditNoteNumber || '',
            amount: round2(c.amount || 0),
            date: c.date,
        });
    }

    const distinctWindowInvoiceIds = [
        ...new Set([
            ...Object.keys(windowPaymentsByInvoice),
            ...Object.keys(windowCreditNotesByInvoice),
        ]),
    ];

    const windowInvoiceHeaders = distinctWindowInvoiceIds.length
        ? await InvoiceModel.find({ _id: { $in: distinctWindowInvoiceIds } })
            .select({
                sale_number: 1, customer: 1, zone: 1, invoice_date: 1,
                status: 1, total_incl_vat: 1, total_paid: 1,
                balance_due: 1, total_credit_applied: 1,
            }).lean()
        : [];

    const customerNameMapWindow = await getCustomerNameMap(windowInvoiceHeaders);
    const invoicesPaidInWindowRows = windowInvoiceHeaders
        .map((inv) => {
            const key = String(inv._id);
            const pays = windowPaymentsByInvoice[key] || [];
            const credits = windowCreditNotesByInvoice[key] || [];
            return {
                invoiceId: key,
                saleNumber: inv.sale_number,
                customerId: String(inv.customer || ''),
                customerName: customerNameMapWindow[String(inv.customer)] || '',
                zone: inv.zone || '',
                invoiceDate: inv.invoice_date,
                status: inv.status,
                totalInclVat: round2(inv.total_incl_vat || 0),
                totalPaid: round2(inv.total_paid || 0),
                balanceDue: round2(inv.balance_due || 0),
                totalCreditApplied: round2(inv.total_credit_applied || 0),
                payments: pays,
                creditNotes: credits,
            };
        })
        .sort((a, b) => (b.saleNumber || 0) - (a.saleNumber || 0));
    return {
        businessDate,
        rangeStart: start,
        rangeEnd: end,
        rangeLabel,
        invoiceDayStart: dayStart,
        invoiceDayEnd: dayEnd,
        computedAt: new Date(),
        invoiceDay: {
            totalInvoices, paidInvoices, pendingInvoices, partiallyPaid,
            overPaidInvoices, cancelledInvoices, returnedInvoices,
            statusBreakdown: invoiceStatusBreakdown,
            totalInvoiced, totalPaidOnTheseInvoices, totalCashPaidOnTheseInvoices,
            totalCreditOnTheseInvoices, totalCreditApplied,
            totalBalanceDue, outstandingOnTheseInvoices,
            expectedCollection: expectedCollectionForDay,
            expectedOutstanding: outstandingOnTheseInvoices,
        },
        collectionPeriod: {
            totalCollected, creditAppliedInWindow,
            totalCollectedIncludingCredit: round2(totalCollected + creditAppliedInWindow),
            totalInvoices: windowTotalInvoices,
            paidInvoices: windowPaidInvoices,
            pendingInvoices: windowPendingInvoices,
            partiallyPaid: windowPartiallyPaid,
            overPaidInvoices: windowOverPaidInvoices,
            cancelledInvoices: windowCancelled,
            returnedInvoices: windowReturned,
            byMode, byStaff, hourly,
            payments, creditPayments,
        },
        paymentsTab: {
            invoicesIssuedDay: invoicesIssuedDayRows,
            invoicesPaidInWindow: invoicesPaidInWindowRows,
        },
        totalInvoices, paidInvoices, pendingInvoices, partiallyPaid,
        cancelledInvoices, returnedInvoices,
        totalInvoiced, totalCollected, totalCreditApplied, totalBalanceDue,
        totalPaidOnTheseInvoices,
        expectedCollection, expectedOutstanding,
        creditAppliedInWindow,
        totalCollectedIncludingCredit: round2(totalCollected + creditAppliedInWindow),
        byMode, byStaff, hourly, payments, creditPayments,
    };
};

const getDriverTotalsForDate = async (businessDateInput) => {
    const day = toDayMoment(businessDateInput);
    const dayStart = day.clone().startOf('day').toDate();
    const dayEnd   = day.clone().endOf('day').toDate();
    const rawRows = await DriverTotalModel.find({ date: { $gte: dayStart, $lte: dayEnd }, }).lean();
    const driverIds  = [...new Set(rawRows.map((r) => String(r.driver  || '')).filter(Boolean))];
    const vehicleIds = [...new Set(rawRows.map((r) => String(r.vehicle || '')).filter(Boolean))];
    const zoneIds    = [...new Set(rawRows.map((r) => String(r.zone    || '')).filter(Boolean))];
    const [drivers, vehicles, zones] = await Promise.all([
        driverIds.length  ? DriverNameModel.find({ _id: { $in: driverIds } }).select({ _id: 1, name: 1 }).lean() : [],
        vehicleIds.length ? DriverVehicleModel.find({ _id: { $in: vehicleIds } }).select({ _id: 1, name: 1 }).lean() : [],
        zoneIds.length    ? ZoneModel.find({ _id: { $in: zoneIds } }).select({ _id: 1, name: 1 }).lean() : [],
    ]);
    const driverNameById  = Object.fromEntries(drivers.map((d) => [String(d._id), d.name || '']));
    const vehicleNameById = Object.fromEntries(vehicles.map((v) => [String(v._id), v.name || '']));
    const zoneNameById    = Object.fromEntries(zones.map((z) => [String(z._id), z.name || '']));
    const rows = rawRows.map((r) => {
        const driverId  = String(r.driver  || '');
        const vehicleId = String(r.vehicle || '');
        const zoneId    = String(r.zone    || '');
        return {
            id: String(r._id),
            driverId,
            driverName:  driverNameById[driverId]  || '',
            vehicleId,
            vehicleName: vehicleNameById[vehicleId] || '',
            zoneId,
            zoneName:    zoneNameById[zoneId]       || '',
            date:        r.date || null,
            helper:      r.helper  || '',
            reason:      r.reason  || '',
            notes:       r.notes   || '',
            cardTotal:       round2(r.card_total       || 0),
            cashTotal:       round2(r.cash_total       || 0),
            cashReceived:    round2(r.cash_received    || 0),
            cashDifference:  round2(r.cash_difference  || 0),
            deductionAmount: round2(r.deduction_amount || 0),
            recordedBy: r.recorded_by || '',
            checkedBy:  r.checked_by  || '',
        };
    });
    const totals = rows.reduce(
        (acc, r) => {
            acc.cashTotal       += r.cashTotal;
            acc.cashReceived    += r.cashReceived;
            acc.cashDifference  += r.cashDifference;
            acc.cardTotal       += r.cardTotal;
            acc.deductionAmount += r.deductionAmount;
            return acc;
        },
        { cashTotal: 0, cashReceived: 0, cashDifference: 0, cardTotal: 0, deductionAmount: 0 }
    );
    Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]); });
    return {
        date:        dayStart,
        dateLabel:   day.format('DD MMM YYYY'),
        driverCount: rows.length,
        totals,
        rows,
    };
};

module.exports = {
    getAccountsReport,
    getDriverTotalsForDate,
};