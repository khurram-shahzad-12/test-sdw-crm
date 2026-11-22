const express = require('express');
const controller = require('./controller');
const {readAccountsReport} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/',authenticate,readAccountsReport ,controller.getAccountsReport);
router.get('/driverAccountsTotal', authenticate, readAccountsReport, controller.getDriverAccountsTotal);
module.exports = router;