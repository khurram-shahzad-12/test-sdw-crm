const SERVICE_VAT = require('./service');

const buildQuery = (req) => {
  const QUERY = {};
  if (req.query.period) QUERY.period = req.query.period;
  if (req.query.taxYearStart) {
    const n = parseInt(req.query.taxYearStart, 10);
    if (!Number.isNaN(n)) QUERY.taxYearStart = n;
  }
  return QUERY;
};

const getVATReturnQuarters = async (req, res, next) => {
  try {
    const QUERY = buildQuery(req);
    const data = await SERVICE_VAT.getVATReturnForTaxYear(QUERY.taxYearStart);
    res.status(200).json(data);
  } catch (e) { next(e); }
};

const getHMRCPayload = async (req, res, next) => {
  try {
    const QUERY = buildQuery(req);
    const data = await SERVICE_VAT.getHMRCPayload(QUERY.period);
    res.status(200).json(data);
  } catch (e) { next(e); }
};

const getAvailableYears = async (req, res, next) => {
  try {
    const data = await SERVICE_VAT.getAvailableYears();
    res.status(200).json(data);
  } catch (e) { next(e); }
};

module.exports = {
  getVATReturnQuarters,
  getHMRCPayload,
  getAvailableYears,
};