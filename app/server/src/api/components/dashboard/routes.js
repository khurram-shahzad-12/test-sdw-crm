const express = require('express');
const controller = require('./controller');
const { authenticate } = require('../../../middleware/auth');
const {readSalesTrackerCheck} = require('../../../middleware/auth0');
const router = express.Router();

router.get('/', authenticate, readSalesTrackerCheck, controller.getDashboard);

module.exports = router;