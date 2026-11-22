const express = require('express');
const controller = require('./controller');
const { readVatReturnCheck } = require('../../../middleware/auth0');
const { authenticate } = require('../../../middleware/auth');
const router = express.Router();

router.get('/available-years', authenticate, readVatReturnCheck, controller.getAvailableYears );
router.get('/quarters', authenticate, readVatReturnCheck, controller.getVATReturnQuarters );
router.get('/hmrc-payload', authenticate, readVatReturnCheck, controller.getHMRCPayload );

module.exports = router;