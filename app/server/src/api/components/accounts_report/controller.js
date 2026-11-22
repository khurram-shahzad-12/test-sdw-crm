const ACCOUNTS_REPORT_SERVICE = require('./service');

const getAccountsReport = async (req, res, next) => {
    try {
        const dateStr = req.query.date; 
        if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { return res.status(400).json({ message: 'Invalid date' }); }
        res.status(200).json( await ACCOUNTS_REPORT_SERVICE.getAccountsReport(dateStr) );
    } catch (e) { next(e); }
};

const getDriverAccountsTotal = async (req, res, next) => {
    try {
        const dateStr = req.query.date;
        if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { return res.status(400).json({ message: 'Invalid date. Expected YYYY-MM-DD.' }); }
        res.status(200).json( await ACCOUNTS_REPORT_SERVICE.getDriverTotalsForDate(dateStr) );
    } catch (e) { next(e); }
};

module.exports = {
    getAccountsReport,
    getDriverAccountsTotal,
};