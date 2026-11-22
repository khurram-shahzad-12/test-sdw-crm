const database = require('../../../db/database');
const Invoice = require('../invoice/model');


const getCustomerRecommendation = async (customerId) => {
    try {
        const invoices = await Invoice.find({ customer: customerId }).sort({ invoice_date: -1 }).limit(15).lean();
        const productMap = {};
        for (const invoice of invoices) {
            const invoiceProducts = new Set();
            for (const item of invoice.items) {
                const productId = item._id.toString();
                if (invoiceProducts.has(productId))
                    continue;
                invoiceProducts.add(productId);
                if (!productMap[productId]) {
                    productMap[productId] = {
                        _id: item._id,
                        timesOrdered: 0,
                        lastOrdered: invoice.invoice_date,
                    };
                }
                productMap[productId].timesOrdered++;
                if (new Date(invoice.invoice_date) > new Date(productMap[productId].lastOrdered)) { productMap[productId].lastOrdered = invoice.invoice_date }
            }
        }
        const recommendations = Object.values(productMap).map(item => {
            let priority = "low";
            if(item.timesOrdered >= 9) {priority = "high"}
            else if (item.timesOrdered >= 3) {priority = "medium";}
            return {...item, priority, }
        })
        return recommendations.sort((a, b) => b.timesOrdered - a.timesOrdered);
    } catch (error) {
        console.log(error)
    }
}

const getCustomerLatestPrices = async(customerId, limit = 15) => {
    const invoices = await Invoice.find({customer: customerId}).sort({invoice_date: -1}).limit(limit).lean();
    const latestByProduct = new Map();
    for(const invoice of invoices) {
        for(const item of invoice.items || []) {
            if(!item._id) continue;
            const pid = item._id.toString();
            const rate = Number(item.rate) || 0;
            const orderedAt = invoice.invoice_date;
            const existing = latestByProduct.get(pid);
            if(!existing || new Date(orderedAt) > new Date(existing.lastOrdered)){
                latestByProduct.set(pid, {
                    _id:pid, name: item.name, rate, lastOrdered: orderedAt, invoiceNumber: invoice.sale_number,
                })
            }
        }
    }
    return Array.from(latestByProduct.values());
}

module.exports = {
    getCustomerRecommendation,
    getCustomerLatestPrices,
};

