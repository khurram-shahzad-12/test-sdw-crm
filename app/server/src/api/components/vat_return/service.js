const InvoiceModel = require("../invoice/model");
const supplierInvoices = require("../supplier_invoices/model");

const getBusinessConfig = () => ({
  region: process.env.BUSINESS_REGION || "GB",
  country: process.env.BUSINESS_REGION || "United Kingdom",
  name: process.env.BUSINESS_NAME || "Spice Direct Wholesale Ltd",
  vatNumber: process.env.VAT_NUMBER || "GB123456789",
});

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

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const formatDate = (d) => {
  const date = new Date(d);
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getDueDate = (periodEnd) => {
  const d = new Date(periodEnd);
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(d.getUTCDate() + 6);
  return d;
};

const getVATQuarterRange = (quarterKey) => {
  const [yearStr, qStr] = quarterKey.split("-");
  const year = parseInt(yearStr, 10);
  const q = parseInt(qStr.replace("Q", ""), 10);
  let startMonth, endMonth, endYear;
  switch (q) {
    case 1: startMonth = 3; endMonth = 5; endYear = year; break;
    case 2: startMonth = 6; endMonth = 8; endYear = year; break;
    case 3: startMonth = 9; endMonth = 11; endYear = year; break;
    case 4: startMonth = 0; endMonth = 2; endYear = year; break;
    default: throw new Error("Invalid quarter");
  }
  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(endYear, endMonth + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

const getTaxYearLabel = (quarterKey) => {
  const [yearStr, qStr] = quarterKey.split("-");
  const year = parseInt(yearStr, 10);
  const q = parseInt(qStr.replace("Q", ""), 10);
  const taxYearStart = q === 4 ? year - 1 : year;
  const taxYearEnd = (taxYearStart + 1).toString().slice(-2);
  return `Q${q} ${taxYearStart}/${taxYearEnd}`;
};

const buildQuarterKeysForTaxYear = (taxYearStart) => [
  `${taxYearStart}-Q1`,
  `${taxYearStart}-Q2`,
  `${taxYearStart}-Q3`,
  `${taxYearStart + 1}-Q4`,
];

const salesPipeline = (startDate, endDate) => [
  { $match: { ot_date: { $gte: startDate, $lte: endDate } } },
  ...excludeCancelledInvoices(),
  {
    $facet: {
      totals: [
        {
          $group: {
            _id: null,
            box1: { $sum: "$vat_total" },
            box6: {
              $sum: {
                $subtract: ["$total_incl_vat", "$vat_total"],
              },
            },
          },
        },
        { $project: { _id: 0, box1: 1, box6: 1 } },
      ],
    },
  },
];

const purchasePipeline = (startDate, endDate) => [
  {
    $match: {
      invoice_date: { $gte: startDate, $lte: endDate },
      expense_type: { $in: ["Expense", "Inventory"] },
    },
  },
  {
    $facet: {
      expense: [
        { $match: { expense_type: "Expense" } },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: { $ifNull: ["$total", 0] } } },
            vat: { $sum: { $abs: { $ifNull: ["$vat", 0] } } },
            standard_rate: { $sum: { $abs: { $ifNull: ["$standard_rate", 0] } } },
            zero_rate: { $sum: { $abs: { $ifNull: ["$zero_rate", 0] } } },
            box4: {
              $sum: { $abs: { $ifNull: ["$vat", 0] } },
            },
            box7: {
              $sum: {
                $abs: {
                  $subtract: [
                    { $ifNull: ["$total", 0] },
                    { $ifNull: ["$vat", 0] },
                  ],
                },
              },
            },
          },
        },
        { $project: { _id: 0 } },
      ],
      inventory: [
        { $match: { expense_type: "Inventory" } },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: { $ifNull: ["$total", 0] } } },
            vat: { $sum: { $abs: { $ifNull: ["$vat", 0] } } },
            standard_rate: { $sum: { $abs: { $ifNull: ["$standard_rate", 0] } } },
            zero_rate: { $sum: { $abs: { $ifNull: ["$zero_rate", 0] } } },
            box4: {
              $sum: { $abs: { $ifNull: ["$vat", 0] } },
            },
            box7: {
              $sum: {
                $abs: {
                  $subtract: [
                    { $ifNull: ["$total", 0] },
                    { $ifNull: ["$vat", 0] },
                  ],
                },
              },
            },
          },
        },
        { $project: { _id: 0 } },
      ],
    },
  },
];

const calculateVATReturn = async (quarterKey, business) => {
  const { startDate, endDate } = getVATQuarterRange(quarterKey);
  const [salesRes, purchaseRes] = await Promise.all([
    InvoiceModel.aggregate(salesPipeline(startDate, endDate)),
    supplierInvoices.aggregate(purchasePipeline(startDate, endDate)),
  ]);

  const sales = salesRes[0]?.totals?.[0] || { box1: 0, box6: 0 };

  const expenseAgg = purchaseRes[0]?.expense?.[0] || {};
  const inventoryAgg = purchaseRes[0]?.inventory?.[0] || {};

  const purchases = {
    box4: (expenseAgg.box4 || 0) + (inventoryAgg.box4 || 0),
    box7: (expenseAgg.box7 || 0) + (inventoryAgg.box7 || 0),

    total: (expenseAgg.total || 0) + (inventoryAgg.total || 0),
    vat: (expenseAgg.vat || 0) + (inventoryAgg.vat || 0),
    standard_rate: (expenseAgg.standard_rate || 0) + (inventoryAgg.standard_rate || 0),
    zero_rate: (expenseAgg.zero_rate || 0) + (inventoryAgg.zero_rate || 0),

    expense: {
      total: expenseAgg.total || 0,
      vat: expenseAgg.vat || 0,
      standard_rate: expenseAgg.standard_rate || 0,
      zero_rate: expenseAgg.zero_rate || 0,
      box4: expenseAgg.box4 || 0,
      box7: expenseAgg.box7 || 0,
    },
    inventory: {
      total: inventoryAgg.total || 0,
      vat: inventoryAgg.vat || 0,
      standard_rate: inventoryAgg.standard_rate || 0,
      zero_rate: inventoryAgg.zero_rate || 0,
      box4: inventoryAgg.box4 || 0,
      box7: inventoryAgg.box7 || 0,
    },
  };

  // GB-only business: no EU acquisitions (Box 2 / Box 9), no EU dispatches (Box 8)
  const box1 = round2(sales.box1);
  const box2 = 0;
  const box3 = round2(box1 + box2);
  const box4 = round2(purchases.box4);
  const box5 = round2(box3 - box4);
  const box6 = round2(sales.box6);
  const box7 = round2(purchases.box7);
  const box8 = 0;
  const box9 = 0;

  return {
    period: `${formatDate(startDate)} – ${formatDate(endDate)}`,
    box1, box2, box3, box4, box5,
    box6, box7, box8, box9,

    purchases: {
      combined: {
        total: round2(purchases.total),
        vat: round2(purchases.vat),
        standard_rate: round2(purchases.standard_rate),
        zero_rate: round2(purchases.zero_rate),
        box4: box4,
        box7: box7,
      },
      expense: {
        total: round2(purchases.expense.total),
        vat: round2(purchases.expense.vat),
        standard_rate: round2(purchases.expense.standard_rate),
        zero_rate: round2(purchases.expense.zero_rate),
        box4: round2(purchases.expense.box4),
        box7: round2(purchases.expense.box7),
      },
      inventory: {
        total: round2(purchases.inventory.total),
        vat: round2(purchases.inventory.vat),
        standard_rate: round2(purchases.inventory.standard_rate),
        zero_rate: round2(purchases.inventory.zero_rate),
        box4: round2(purchases.inventory.box4),
        box7: round2(purchases.inventory.box7),
      },
    },

    status: "Pending",
    dueDate: formatDate(getDueDate(endDate)),
    quarterKey,
    taxYear: getTaxYearLabel(quarterKey),
    region: "GB",
  };
};

const getVATReturnForTaxYear = async (taxYearStart) => {
  if (!taxYearStart || taxYearStart < 2000 || taxYearStart > 2100) {
    throw new Error("valid taxYearStart is required");
  }
  const keys = buildQuarterKeysForTaxYear(taxYearStart);
  const business = getBusinessConfig();
  const results = await Promise.all(keys.map((k) => calculateVATReturn(k, business)));
  return results;
};

const getHMRCPayload = async (period) => {
  if (!period) throw new Error("period is required (e.g. 2026-Q1)");
  const business = getBusinessConfig();
  const data = await calculateVATReturn(period, business);
  return {
    periodKey: period,
    vatDueSales: data.box1,
    vatDueAcquisitions: data.box2,
    totalVatDue: data.box3,
    vatReclaimedCurrPeriod: data.box4,
    netVatDue: data.box5,
    totalValueSalesExVAT: Math.round(data.box6),
    totalValuePurchasesExVAT: Math.round(data.box7),
    totalValueGoodsSuppliedExVAT: Math.round(data.box8),
    totalAcquisitionsExVAT: Math.round(data.box9),
    finalised: data.status === "Submitted",
  };
};

const getAvailableYears = async () => {
  const result = await InvoiceModel.aggregate([
    {
      $group: {
        _id: {
          $year: {
            $cond: [
              { $eq: [{ $type: "$ot_date" }, "date"] },
              "$ot_date",
              { $toDate: "$ot_date" },
            ],
          },
        },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { _id: 1 } },
  ]);
  return result.map((r) => r._id).filter(Boolean);
};

module.exports = {
  getVATReturnForTaxYear,
  getHMRCPayload,
  getAvailableYears,
};