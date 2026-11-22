const DASHBOARD_SERVICE = require('./service');

const getDashboard = async (req, res, next) => {
    try {
        const { range = 'this_month' } = req.query;
        const summary = await DASHBOARD_SERVICE.getDashboardSummary({ range });
        res.status(200).json(summary);
    } catch (e) { next(e); }
};
module.exports = {
    getDashboard,
};